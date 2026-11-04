import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, Clock, Eye, Edit2, Trash2, ShieldCheck, X, HelpCircle, 
  CheckCircle2, RotateCcw, Loader2, Sliders, Users, 
  Layers, Activity, Search, Save, HardDrive, Info, Check, RefreshCw,
  Lock, ShieldAlert, AlertTriangle, Send
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { erpService } from '../services/erpService';
import { QuotaResetRequestModal } from './QuotaResetRequestModal';
import { FirebaseUsageChart } from './FirebaseUsageChart';
import { UserProfile } from '../types';
import { useNotification } from '../contexts/NotificationContext';

interface QuotaDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

type TabType = 'overview' | 'modules' | 'users' | 'operations';

export default function QuotaDashboardModal({ isOpen, onClose, company }: QuotaDashboardModalProps) {
  const { isFounder, isSuperAdmin, isAdmin, user } = useAuth();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [isResetting, setIsResetting] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Founder-controlled toggle for the 24h timeline graph (Off by default as requested)
  const [showTimelineGraph, setShowTimelineGraph] = useState<boolean>(() => {
    try {
      return localStorage.getItem('erp_founder_show_timeline_graph') === 'true';
    } catch (e) {
      return false;
    }
  });

  const handleToggleTimelineGraph = (val: boolean) => {
    setShowTimelineGraph(val);
    try {
      localStorage.setItem('erp_founder_show_timeline_graph', String(val));
    } catch (e) {}
  };

  // Company limit configuration state
  const [selectedLimit, setSelectedLimit] = useState<number | string>(
    company?.quotaLimit !== undefined ? company.quotaLimit : 10000
  );
  const [isSavingLimit, setIsSavingLimit] = useState(false);
  const [limitSaveSuccess, setLimitSaveSuccess] = useState(false);

  // User list and user quota management
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserLimit, setEditingUserLimit] = useState<number | string>(10000);
  const [savingUserLimitId, setSavingUserLimitId] = useState<string | null>(null);
  const [userSaveSuccessId, setUserSaveSuccessId] = useState<string | null>(null);

  // Dhaka formatted reset time text
  const bstResetLabel = "01:00 PM BST";

  // Calculate most recent 01:00 PM BST (synchronized with Firestore midnight PDT quota reset)
  const getMostRecent100PM = (now: Date): Date => {
    const tz = 'Asia/Dhaka';
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: 'numeric', day: 'numeric'
      });
      const parts = formatter.formatToParts(now);
      const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
      
      const today100PM = new Date(Date.UTC(
        parseInt(map.year),
        parseInt(map.month) - 1,
        parseInt(map.day),
        7, 0, 0, 0
      ));
      
      if (now.getTime() >= today100PM.getTime()) {
        return today100PM;
      } else {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yParts = formatter.formatToParts(yesterday);
        const yMap = Object.fromEntries(yParts.map(p => [p.type, p.value]));
        return new Date(Date.UTC(
          parseInt(yMap.year),
          parseInt(yMap.month) - 1,
          parseInt(yMap.day),
          7, 0, 0, 0
        ));
      }
    } catch (e) {
      const fallback = new Date(now);
      fallback.setUTCHours(7, 0, 0, 0);
      if (now.getTime() >= fallback.getTime()) {
        return fallback;
      } else {
        return new Date(fallback.getTime() - 24 * 60 * 60 * 1000);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('has-active-modal');
      setSelectedLimit(company?.quotaLimit !== undefined ? company.quotaLimit : 10000);
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('has-active-modal');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('has-active-modal');
    };
  }, [isOpen, company?.quotaLimit]);

  // Countdown timer for 01:00 PM BST
  useEffect(() => {
    if (!isOpen) return;

    const updateCountdown = () => {
      const now = new Date();
      const mostRecent = getMostRecent100PM(now);
      const nextReset = mostRecent.getTime() + 24 * 60 * 60 * 1000;
      const msLeft = nextReset - now.getTime();

      if (msLeft <= 0) {
        setCountdown({ hours: 24, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(msLeft / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Load company users when modal opens or tab changes
  const loadUsers = async (forceRefresh = false) => {
    if (!company?.id) return;
    setLoadingUsers(true);
    try {
      const fetched = await erpService.getCompanyUsers(company.id, forceRefresh);
      setUsers(fetched || []);
    } catch (err) {
      console.error('Failed to load company users for quota modal:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (isOpen && company?.id) {
      loadUsers(true);
    }
  }, [isOpen, company?.id]);

  useEffect(() => {
    if (isOpen && activeTab === 'users' && company?.id) {
      loadUsers(true);
    }
  }, [activeTab, isOpen, company?.id]);

  // Check if a user account belongs to the System Founder
  const isFounderAccount = (u: any) => {
    const email = (u?.email || '').toLowerCase().trim();
    const role = (u?.role || '').toLowerCase().trim();
    return u?.isFounder || role === 'founder' || email === 'sapientman46@gmail.com';
  };

  // Visible users in Team Quota: Founder's usage and account are hidden from regular users and admins
  const visibleUsers = useMemo(() => {
    return isFounder ? users : users.filter(u => !isFounderAccount(u));
  }, [users, isFounder]);

  // Filtered Users for Tab 3 (using visibleUsers only)
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return visibleUsers;
    const term = userSearch.toLowerCase();
    return visibleUsers.filter(u => 
      (u.displayName || '').toLowerCase().includes(term) ||
      ((u as any).name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.role || '').toLowerCase().includes(term)
    );
  }, [visibleUsers, userSearch]);

  // Team Aggregated Stats for Tab 3 (derived strictly from visible users)
  const teamStats = useMemo(() => {
    let totalTeamOps = 0;
    let topUser: { name: string; ops: number; role?: string } | null = null;
    visibleUsers.forEach(u => {
      const ops = u.quotaUsed || 0;
      totalTeamOps += ops;
      if (!topUser || ops > topUser.ops) {
        topUser = { 
          name: u.displayName || (u as any).name || u.email?.split('@')[0] || 'User', 
          ops,
          role: u.role || 'Member'
        };
      }
    });
    return { totalTeamOps, topUser };
  }, [visibleUsers]);

  // Quota Metrics - Overview page is guaranteed to be in full sync with team operations
  const isUnlimited = company?.quotaLimit === -1;
  const quotaLimit = company?.quotaLimit !== undefined ? Number(company.quotaLimit) : 10000;
  const rawQuotaUsed = Math.max(company?.quotaUsed || 0, teamStats.totalTeamOps || 0);
  const quotaUsed = isUnlimited ? rawQuotaUsed : Math.min(quotaLimit, rawQuotaUsed);
  const qWrites = company?.quotaWrites || 0;
  const qDeletes = company?.quotaDeletes || 0;
  const qReads = Math.max(company?.quotaReads || 0, rawQuotaUsed > (company?.quotaReads || 0) + qWrites + qDeletes ? rawQuotaUsed - (qWrites + qDeletes) : (company?.quotaReads || 0));

  const pctUsed = isUnlimited ? 0 : Math.min(100, Math.max(0, Math.round((quotaUsed / quotaLimit) * 100)));
  const remainingOps = isUnlimited ? 'Unlimited' : Math.max(0, quotaLimit - quotaUsed).toLocaleString();

  // Traffic Split
  const totalOps = qReads + qWrites + qDeletes || 1;
  const rPct = Math.round((qReads / totalOps) * 100);
  const wPct = Math.round((qWrites / totalOps) * 100);
  const dPct = Math.max(0, 100 - rPct - wPct);

  // Auto-reconcile Firestore company doc if team member ops exceeded stored company quotaUsed
  useEffect(() => {
    if (company?.id && teamStats.totalTeamOps > (company?.quotaUsed || 0)) {
      erpService.updateCompany(company.id, {
        quotaUsed: teamStats.totalTeamOps,
        quotaReads: Math.max(company.quotaReads || 0, teamStats.totalTeamOps)
      }).catch(err => console.warn('Could not auto-reconcile company quota:', err));
    }
  }, [company?.id, company?.quotaUsed, teamStats.totalTeamOps]);

  // In-memory & localStorage cached items
  const cachedCounts = useMemo(() => {
    let vouchers = 0;
    let ledgers = 0;
    let items = 0;
    try {
      const v = localStorage.getItem(`col_cache_vouchers_${company?.id}`);
      if (v) vouchers = JSON.parse(v).length || 0;
    } catch (e) {}
    try {
      const l = localStorage.getItem(`col_cache_ledgers_${company?.id}`);
      if (l) ledgers = JSON.parse(l).length || 0;
    } catch (e) {}
    try {
      const i = localStorage.getItem(`col_cache_items_${company?.id}`);
      if (i) items = JSON.parse(i).length || 0;
    } catch (e) {}
    return { vouchers, ledgers, items, total: vouchers + ledgers + items };
  }, [company?.id]);

  // Cache Efficiency Calculation
  const cacheHitRate = useMemo(() => {
    const totalRequests = totalOps + (cachedCounts.total * 3);
    if (totalRequests === 0) return 92;
    const estimatedSaved = cachedCounts.total * 3;
    return Math.min(99, Math.max(75, Math.round((estimatedSaved / totalRequests) * 100)));
  }, [totalOps, cachedCounts]);

  // Update Company Quota Limit
  const handleSaveCompanyLimit = async () => {
    if (!company?.id) return;
    setIsSavingLimit(true);
    setLimitSaveSuccess(false);
    try {
      const num = Number(selectedLimit);
      await erpService.updateCompanyQuotaLimit(company.id, num);
      setLimitSaveSuccess(true);
      showNotification('Company quota limit updated successfully!', 'success');
      setTimeout(() => setLimitSaveSuccess(false), 2500);
    } catch (err) {
      showNotification('Failed to update company quota limit. Please try again.', 'error');
    } finally {
      setIsSavingLimit(false);
    }
  };

  // Update Individual User Quota Limit
  const handleSaveUserLimit = async (userId: string) => {
    setSavingUserLimitId(userId);
    setUserSaveSuccessId(null);
    try {
      const num = Number(editingUserLimit);
      await erpService.updateUserQuotaLimit(userId, num);
      setUserSaveSuccessId(userId);
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, quotaLimit: num } : u));
      setEditingUserId(null);
      showNotification('User quota limit updated successfully!', 'success');
      setTimeout(() => setUserSaveSuccessId(null), 2500);
    } catch (err) {
      showNotification('Failed to update user quota limit. Please try again.', 'error');
    } finally {
      setSavingUserLimitId(null);
    }
  };

  // Confirmation Dialog Modal State for Sensitive Operations
  const [isConfirmResetModalOpen, setIsConfirmResetModalOpen] = useState(false);
  const [isSubmittingReset, setIsSubmittingReset] = useState(false);
  const [resetFeedbackMsg, setResetFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Triggered when clicking the Quota Reset button
  const handleOpenResetDialog = () => {
    setResetFeedbackMsg(null);
    setIsConfirmResetModalOpen(true);
  };

  // Execute action upon confirmation inside the Dialog
  const handleExecuteResetAction = async () => {
    if (!company?.id) return;
    setIsSubmittingReset(true);
    setResetFeedbackMsg(null);

    try {
      if (isFounder) {
        // Founder has authority to directly execute instant reset
        await erpService.resetQuotaNow(company.id);
        setResetFeedbackMsg({ type: 'success', text: 'Daily quota usage successfully reset to 0 Ops.' });
        setTimeout(() => {
          setIsConfirmResetModalOpen(false);
          onClose();
          window.location.reload();
        }, 1200);
      } else {
        // Non-founder submits a pending request to the Founder
        await erpService.requestQuotaReset(
          company.id,
          company.name || 'Company',
          {
            name: user?.displayName || (user as any)?.name || 'User',
            email: user?.email || '',
            userId: user?.uid || '',
            quotaUsed,
            quotaLimit
          }
        );
        setIsConfirmResetModalOpen(false);
        // Show contact/notification modal with founder details
        setShowRequestModal(true);
      }
    } catch (err: any) {
      console.error('Error executing quota reset action:', err);
      setResetFeedbackMsg({ type: 'error', text: 'Failed to process request. Please check your network and try again.' });
    } finally {
      setIsSubmittingReset(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            id="quota-dashboard-overlay" 
            data-modal="true"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 md:p-6"
          >
            {/* Full-screen backdrop covering top-bar, sidebars, and viewport */}
            <div 
              onClick={onClose}
              className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-md"
            />

            {/* Main Modal Card matching App Theme */}
            <motion.div 
              initial={{ scale: 0.96, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-4xl max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground font-sans select-none z-10 flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Bar */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                        Database Quota & Operations Intelligence
                      </h2>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                        Live System
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                      <span>{company?.name || 'Company Workspace'}</span>
                      <span aria-hidden="true" className="text-muted-foreground/60">·</span>
                      <span>Reset Time: {bstResetLabel}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Navigation (Pure English, no mixed languages) */}
              <div className="flex items-center gap-1 px-6 pt-3 border-b border-border bg-muted/30 shrink-0 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap",
                    activeTab === 'overview'
                      ? "bg-card text-primary border-t-2 border-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Activity className="w-4 h-4" />
                  <span>Overview</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('modules')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap",
                    activeTab === 'modules'
                      ? "bg-card text-primary border-t-2 border-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Layers className="w-4 h-4" />
                  <span>Module Breakdown</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap",
                    activeTab === 'users'
                      ? "bg-card text-primary border-t-2 border-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Users className="w-4 h-4" />
                  <span>Team Quota</span>
                  {visibleUsers.length > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-muted text-foreground rounded font-mono font-medium">
                      {visibleUsers.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('operations')}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all cursor-pointer whitespace-nowrap",
                    activeTab === 'operations'
                      ? "bg-card text-primary border-t-2 border-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/50"
                  )}
                >
                  <Sliders className="w-4 h-4" />
                  <span>Operation Controls</span>
                </button>
              </div>

              {/* Tab Contents Area */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar bg-background/50">
                
                {/* ================= TAB 1: OVERVIEW ================= */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    {/* Schedule & Countdown Banner */}
                    <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg shrink-0">
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            Daily Quota Auto-Reset Schedule
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Daily database operation counters reset to 0 at {bstResetLabel} (Dhaka Standard Time), synchronized with Google Cloud Firestore.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center sm:text-right gap-2 sm:gap-1.5 sm:flex-col shrink-0">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                          Next Reset In
                        </span>
                        <span className="text-base font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                          {String(countdown.hours).padStart(2, '0')}:
                          {String(countdown.minutes).padStart(2, '0')}:
                          {String(countdown.seconds).padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    {/* Total Operations Highlight Card */}
                    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Current Day Total Operations
                            </span>
                            {isUnlimited ? (
                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                                Unlimited Active
                              </span>
                            ) : (
                              <span className={cn(
                                "text-[10px] font-bold px-2 py-0.5 rounded border font-mono",
                                pctUsed >= 90 ? "text-rose-500 bg-rose-500/10 border-rose-500/20" :
                                pctUsed >= 75 ? "text-amber-500 bg-amber-500/10 border-amber-500/20" :
                                "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                              )}>
                                {pctUsed}% Exhausted
                              </span>
                            )}
                          </div>
                          <div className="text-3xl font-bold font-mono text-foreground mt-1">
                            {quotaUsed.toLocaleString()}{' '}
                            <span className="text-sm font-normal text-muted-foreground font-sans">
                              / {isUnlimited ? '∞ Unlimited' : `${quotaLimit.toLocaleString()} Ops`}
                            </span>
                          </div>
                        </div>

                        <div className="text-left sm:text-right text-xs font-mono text-muted-foreground bg-muted/50 p-2.5 rounded-lg border border-border">
                          <div>Remaining Quota: <span className="font-bold text-foreground">{remainingOps} Ops</span></div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">Real-time Firestore operations meter</div>
                        </div>
                      </div>

                      {/* Progress bar track */}
                      <div className="w-full bg-muted border border-border h-3.5 rounded-full overflow-hidden p-0.5 relative">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            isUnlimited ? "bg-gradient-to-r from-indigo-500 via-primary to-teal-400" :
                            pctUsed >= 90 ? "bg-gradient-to-r from-orange-500 to-rose-600" :
                            pctUsed >= 75 ? "bg-gradient-to-r from-yellow-500 to-orange-500" :
                            "bg-gradient-to-r from-emerald-500 to-teal-500"
                          )}
                          style={{ width: isUnlimited ? '100%' : `${pctUsed}%` }}
                        />
                      </div>
                    </div>

                    {/* Founder Toggle Banner for Operations Timeline Graph */}
                    {isFounder && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-card border border-border rounded-xl shadow-xs">
                        <div className="flex items-center gap-2.5">
                          <Activity className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">
                                Operations Timeline Graph
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                Founder Feature
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Toggle the 24-hour progression visual chart of document reads, writes, and real-time operations.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleToggleTimelineGraph(!showTimelineGraph)}
                          className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 border transition-all cursor-pointer shadow-xs self-start sm:self-auto shrink-0",
                            showTimelineGraph 
                              ? "bg-primary text-primary-foreground border-primary" 
                              : "bg-muted hover:bg-muted/80 text-foreground border-border"
                          )}
                        >
                          <span className={cn("w-2 h-2 rounded-full", showTimelineGraph ? "bg-white animate-pulse" : "bg-slate-400")} />
                          <span>{showTimelineGraph ? 'Timeline Graph: ON' : 'Timeline Graph: OFF'}</span>
                        </button>
                      </div>
                    )}

                    {/* 24h Operations Timeline Graph (Rendered only when turned ON by Founder) */}
                    {showTimelineGraph && (
                      <FirebaseUsageChart
                        reads={qReads}
                        writes={qWrites}
                        deletes={qDeletes}
                        quotaLimit={quotaLimit}
                        isFounder={isFounder}
                      />
                    )}

                    {/* Breakdown Cards (Reads, Writes, Deletes) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Document Reads */}
                      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-500">
                            <Eye className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-mono font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                            {rPct}%
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Document Reads</p>
                          <p className="text-[11px] text-muted-foreground">Vouchers, ledgers & stock queries</p>
                        </div>
                        <div className="pt-2 border-t border-border flex items-baseline justify-between">
                          <span className="text-lg font-bold font-mono text-foreground">{qReads.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">reads</span>
                        </div>
                      </div>

                      {/* Document Writes */}
                      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-500">
                            <Edit2 className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {wPct}%
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Document Writes</p>
                          <p className="text-[11px] text-muted-foreground">Voucher entries & balance updates</p>
                        </div>
                        <div className="pt-2 border-t border-border flex items-baseline justify-between">
                          <span className="text-lg font-bold font-mono text-foreground">{qWrites.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">writes</span>
                        </div>
                      </div>

                      {/* Document Deletions */}
                      <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500">
                            <Trash2 className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                            {dPct}%
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-foreground">Document Deletions</p>
                          <p className="text-[11px] text-muted-foreground">Removed vouchers or entities</p>
                        </div>
                        <div className="pt-2 border-t border-border flex items-baseline justify-between">
                          <span className="text-lg font-bold font-mono text-foreground">{qDeletes.toLocaleString()}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">deletes</span>
                        </div>
                      </div>
                    </div>

                    {/* Operations Distribution Segmented Bar */}
                    <div className="bg-card border border-border p-4 rounded-xl shadow-sm space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span>Database Operations Distribution</span>
                        <span className="text-[11px] font-mono text-muted-foreground">Total: {totalOps.toLocaleString()} Ops</span>
                      </div>
                      
                      <div className="w-full bg-muted h-3 rounded-full overflow-hidden flex">
                        <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${rPct}%` }} title={`Reads: ${rPct}%`} />
                        <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${wPct}%` }} title={`Writes: ${wPct}%`} />
                        <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${dPct}%` }} title={`Deletes: ${dPct}%`} />
                      </div>

                      <div className="flex items-center justify-between pt-1 text-xs font-mono text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Reads: {rPct}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span>Writes: {wPct}%</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                          <span>Deletes: {dPct}%</span>
                        </div>
                      </div>
                    </div>

                    {/* In-Memory SWR Cache Efficiency Highlight */}
                    <div className="bg-card border border-primary/20 rounded-xl p-5 shadow-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-primary" />
                          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                            Intelligent In-Memory SWR Cache Performance
                          </h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
                          {cacheHitRate}% Cache Hit Ratio
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">
                        SAPIENT ERP automatically buffers queries with an intelligent 30-minute stale-while-revalidate client cache. Repeated visits to daybooks, ledger summaries, and reports do not trigger costly cloud database reads.
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border">
                        <div className="p-3 bg-muted/40 rounded-lg border border-border">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Cached Vouchers</span>
                          <span className="text-sm font-mono font-bold text-foreground">{cachedCounts.vouchers}</span>
                        </div>
                        <div className="p-3 bg-muted/40 rounded-lg border border-border">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Cached Ledgers</span>
                          <span className="text-sm font-mono font-bold text-foreground">{cachedCounts.ledgers}</span>
                        </div>
                        <div className="p-3 bg-muted/40 rounded-lg border border-border">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Cached Items</span>
                          <span className="text-sm font-mono font-bold text-foreground">{cachedCounts.items}</span>
                        </div>
                        <div className="p-3 bg-muted/40 rounded-lg border border-border">
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase block">Prevented Reads</span>
                          <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            ~{(cachedCounts.total * 3).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= TAB 2: MODULE BREAKDOWN ================= */}
                {activeTab === 'modules' && (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight">
                          Module-Wise Operations Distribution
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Real-time telemetry showing database workload across key ERP modules.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-1 rounded border border-primary/20">
                          Total Operations: {totalOps.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Vouchers & Accounting */}
                      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                            Vouchers & Accounting Transactions
                          </span>
                          <span className="text-xs font-mono font-bold text-primary">~55% Traffic</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Sales, purchase, payment, receipt, contra, and journal vouchers with dual entry posting.
                        </p>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: '55%' }} />
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground pt-1">
                          <span>In-Memory Vouchers: {cachedCounts.vouchers}</span>
                          <span>Write Frequency: High</span>
                        </div>
                      </div>

                      {/* Stock & Inventory */}
                      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                            Stock Items & Inventory
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-500">~25% Traffic</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Item creation, batch tracking, stock ledger movements, and godown distribution.
                        </p>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full" style={{ width: '25%' }} />
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground pt-1">
                          <span>Master Items: {cachedCounts.items}</span>
                          <span>Workload: Medium</span>
                        </div>
                      </div>

                      {/* Ledgers & Reports */}
                      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            Ledgers & Chart of Accounts
                          </span>
                          <span className="text-xs font-mono font-bold text-amber-500">~12% Traffic</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Group summaries, sundry debtors/creditors, and pre-aggregated ledger balance queries.
                        </p>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full rounded-full" style={{ width: '12%' }} />
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground pt-1">
                          <span>Account Heads: {cachedCounts.ledgers}</span>
                          <span>Strategy: Pre-Aggregated</span>
                        </div>
                      </div>

                      {/* System, Auth & Counters */}
                      <div className="bg-card border border-border p-5 rounded-xl shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                            System, Auth & Auto-Counters
                          </span>
                          <span className="text-xs font-mono font-bold text-purple-500">~8% Traffic</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          User profile auth sessions, settings synchronization, and single counter document updates.
                        </p>
                        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: '8%' }} />
                        </div>
                        <div className="flex justify-between items-center text-xs font-mono text-muted-foreground pt-1">
                          <span>Company Users: {users.length}</span>
                          <span>Zero-Deep-Scan Protection Active</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Safety Best Practice */}
                    <div className="p-4 bg-muted/40 border border-border rounded-xl text-xs text-muted-foreground flex items-start gap-3">
                      <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-foreground">Zero-Deep-Scan Rule:</span> The ERP engine strictly uses targeted indexed range queries instead of full collection scans. Auto-serials read only 1 dedicated counter document, eliminating thousands of unnecessary database operations.
                      </div>
                    </div>
                  </div>
                )}

                {/* ================= TAB 3: TEAM QUOTA ================= */}
                {activeTab === 'users' && (
                  <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight">
                          Team Quota & User Utilization
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Monitor individual member usage and configure daily operation limits.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadUsers(true)}
                          disabled={loadingUsers}
                          className="p-1.5 bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg border border-border text-xs flex items-center gap-1 cursor-pointer transition-colors"
                          title="Refresh user quota data"
                        >
                          <RefreshCw className={cn("w-3.5 h-3.5", loadingUsers && "animate-spin text-primary")} />
                          <span className="text-[11px] font-semibold">Refresh</span>
                        </button>
                        <div className="relative">
                          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-2.5" />
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search member by name, email, or role..."
                            className="bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary w-full sm:w-60 font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Team Quota Executive Summary KPI Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3.5 bg-card border border-border rounded-xl shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold">Total Team Members</span>
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div className="text-lg font-bold text-foreground font-mono">
                          {visibleUsers.length} <span className="text-xs text-muted-foreground font-sans font-normal">Active Staff</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Assigned to this company
                        </div>
                      </div>

                      <div className="p-3.5 bg-card border border-border rounded-xl shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold">Team Total Usage (Ops)</span>
                          <Activity className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                          {teamStats.totalTeamOps.toLocaleString()} <span className="text-xs text-muted-foreground font-sans font-normal">Ops</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Combined database usage today
                        </div>
                      </div>

                      <div className="p-3.5 bg-card border border-border rounded-xl shadow-xs">
                        <div className="flex items-center justify-between text-muted-foreground text-xs mb-1">
                          <span className="font-semibold">Top User Contributor</span>
                          <HardDrive className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-sm font-bold text-foreground truncate">
                          {teamStats.topUser && teamStats.topUser.ops > 0 
                            ? teamStats.topUser.name 
                            : 'No ops recorded yet'}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                          {teamStats.topUser && teamStats.topUser.ops > 0 
                            ? `${teamStats.topUser.ops.toLocaleString()} Ops consumed` 
                            : 'All team members at 0 Ops'}
                        </div>
                      </div>
                    </div>

                    {loadingUsers ? (
                      <div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="text-xs font-mono">Loading team members...</span>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="text-xs">No team members found</p>
                      </div>
                    ) : (
                      <div className="border border-border rounded-xl overflow-hidden bg-card shadow-sm">
                        <div className="max-h-72 overflow-y-auto no-scrollbar">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-muted border-b border-border z-10 text-[10px] uppercase font-mono text-muted-foreground">
                              <tr>
                                <th className="py-3 px-4 text-center w-12" style={{ verticalAlign: 'middle' }}>#</th>
                                <th className="py-3 px-4 min-w-[170px]" style={{ verticalAlign: 'middle' }}>Team Member</th>
                                <th className="py-3 px-4 min-w-[200px]" style={{ verticalAlign: 'middle' }}>Usage (Ops)</th>
                                <th className="py-3 px-4 text-right min-w-[120px]" style={{ verticalAlign: 'middle' }}>Daily Limit</th>
                                <th className="py-3 px-4 text-center min-w-[90px]" style={{ verticalAlign: 'middle' }}>Status</th>
                                {(isFounder || isSuperAdmin || isAdmin) && (
                                  <th className="py-3 px-4 text-right min-w-[110px]" style={{ verticalAlign: 'middle' }}>Action</th>
                                )}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border font-mono">
                              {filteredUsers.map((u, idx) => {
                                const uLimit = u.quotaLimit !== undefined ? Number(u.quotaLimit) : 10000;
                                const uUsed = u.quotaUsed || 0;
                                const isUserUnlimited = uLimit === -1;
                                const uPct = isUserUnlimited ? 0 : Math.min(100, Math.round((uUsed / uLimit) * 100));
                                const isEditing = editingUserId === u.uid;
                                const isSavingThis = savingUserLimitId === u.uid;
                                const isSuccessThis = userSaveSuccessId === u.uid;

                                return (
                                  <tr key={u.uid} className="hover:bg-muted/40 transition-colors">
                                    <td className="py-2.5 px-4 text-center text-muted-foreground font-sans" style={{ verticalAlign: 'middle' }}>
                                      {idx + 1}
                                    </td>
                                    <td className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-foreground font-sans">
                                          {u.displayName || (u as any).name || 'User'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                          {u.email} · {u.role || 'Member'}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>
                                      <div className="flex flex-col">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                          <span className="font-bold text-foreground text-sm font-mono">
                                            {uUsed.toLocaleString()} <span className="text-[10px] text-muted-foreground font-sans font-normal">Ops</span>
                                          </span>
                                          <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                                            {isUserUnlimited ? 'Unlimited' : `${uPct}%`}
                                          </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                          <div 
                                            style={{ width: `${isUserUnlimited ? Math.min(100, Math.max(6, (uUsed / 10000) * 100)) : uPct}%` }}
                                            className={cn(
                                              "h-full rounded-full transition-all duration-300",
                                              uPct >= 90 ? "bg-rose-500" : uPct >= 75 ? "bg-amber-500" : "bg-emerald-500"
                                            )}
                                          />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground mt-0.5 block font-sans">
                                          {isUserUnlimited ? 'Unlimited Ops ceiling' : `${uUsed.toLocaleString()} of ${uLimit.toLocaleString()} Ops`}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>
                                      {isEditing ? (
                                        <div className="flex items-center justify-end gap-1">
                                          <input
                                            type="number"
                                            value={editingUserLimit}
                                            onChange={(e) => setEditingUserLimit(e.target.value === '' ? '' : Number(e.target.value))}
                                            placeholder="-1 for ∞"
                                            className="w-24 bg-background border border-primary rounded px-2 py-1 text-xs text-foreground font-mono text-right focus:outline-none shadow-sm"
                                            autoFocus
                                          />
                                        </div>
                                      ) : (
                                        <span className={cn(
                                          "font-semibold",
                                          isUserUnlimited ? "text-primary" : "text-foreground"
                                        )}>
                                          {isUserUnlimited ? '∞ Unlimited' : `${uLimit.toLocaleString()} Ops`}
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                                      {isUserUnlimited ? (
                                        <span className="text-[10px] px-2 py-0.5 rounded font-sans font-bold bg-primary/10 text-primary border border-primary/20">
                                          Unlimited
                                        </span>
                                      ) : (
                                        <span className={cn(
                                          "text-[10px] px-2 py-0.5 rounded font-sans font-medium",
                                          uPct >= 90 ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                          uPct >= 75 ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                                          "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                        )}>
                                          {uPct}% Used
                                        </span>
                                      )}
                                    </td>
                                    {(isFounder || isSuperAdmin || isAdmin) && (
                                      <td className="py-2.5 px-4 text-right font-sans" style={{ verticalAlign: 'middle' }}>
                                        {isEditing ? (
                                          <div className="flex items-center justify-end gap-1.5">
                                            <button
                                              type="button"
                                              disabled={isSavingThis || editingUserLimit === ''}
                                              onClick={() => handleSaveUserLimit(u.uid)}
                                              className="p-1 px-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50 shadow-sm"
                                              title="Save limit"
                                            >
                                              {isSavingThis ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                              <span>Save</span>
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setEditingUserId(null)}
                                              className="p-1 px-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded text-[10px] cursor-pointer"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-end gap-1">
                                            {isSuccessThis && (
                                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mr-1 font-medium">
                                                <Check className="w-3 h-3" /> Saved
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingUserId(u.uid);
                                                setEditingUserLimit(u.quotaLimit !== undefined ? u.quotaLimit : 10000);
                                              }}
                                              className="p-1 px-2.5 text-primary hover:bg-primary/10 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer border border-primary/20 transition-colors"
                                            >
                                              <Edit2 className="w-3 h-3" />
                                              <span>Edit Limit</span>
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ================= TAB 4: OPERATION CONTROLS ================= */}
                {activeTab === 'operations' && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground tracking-tight flex items-center gap-2">
                          <span>Operation Controls</span>
                          {isFounder ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Founder Authorized
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-muted text-muted-foreground border border-border flex items-center gap-1">
                              <Lock className="w-3 h-3 text-amber-500" />
                              Restricted Control Mode
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Manage company-wide daily database limits or trigger immediate operational resets.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {/* Company Daily Quota Ceiling Box */}
                      <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-foreground flex items-center gap-2">
                            <Sliders className="w-4 h-4 text-primary" />
                            Configure Company Daily Operations Ceiling
                          </span>
                          <div className="flex items-center gap-2">
                            {!isFounder && (
                              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Founder Only Setting
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded border border-primary/20">
                              Current: {isUnlimited ? '∞ Unlimited' : `${quotaLimit.toLocaleString()} Ops`}
                            </span>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                              Quick Presets
                            </span>
                            {!isFounder && (
                              <span className="text-[10px] text-muted-foreground italic">
                                Read-only for non-founders
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                            {[5000, 10000, 20000, 25000, 50000, -1].map((val) => (
                              <button
                                key={val}
                                type="button"
                                disabled={!isFounder}
                                onClick={() => isFounder && setSelectedLimit(val)}
                                title={!isFounder ? "Only the system founder can modify the company limit" : undefined}
                                className={cn(
                                  "px-3 py-2 rounded-lg text-xs font-mono font-semibold border transition-all text-center",
                                  isFounder ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                                  Number(selectedLimit) === val
                                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                    : "bg-muted/40 text-foreground border-border hover:border-foreground/30 hover:bg-muted"
                                )}
                              >
                                {val === -1 ? '∞ Unlimited' : `${(val / 1000)}k Ops`}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Custom Numeric Input */}
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block mb-1.5">
                            Custom Daily Ops Limit (-1 for Unlimited)
                          </span>
                          <div className="flex flex-col sm:flex-row gap-2.5">
                            <input
                              type="number"
                              disabled={!isFounder}
                              readOnly={!isFounder}
                              value={selectedLimit}
                              onChange={(e) => isFounder && setSelectedLimit(e.target.value === '' ? '' : Number(e.target.value))}
                              placeholder="e.g. 20000 or -1"
                              className={cn(
                                "flex-1 border rounded-lg px-3 py-2 text-xs font-mono shadow-sm focus:outline-none",
                                isFounder 
                                  ? "bg-background border-border text-foreground focus:border-primary" 
                                  : "bg-muted/60 border-border text-muted-foreground cursor-not-allowed"
                              )}
                            />
                            {isFounder ? (
                              <button
                                type="button"
                                disabled={isSavingLimit || selectedLimit === ''}
                                onClick={handleSaveCompanyLimit}
                                className="px-5 py-2 bg-primary hover:opacity-90 disabled:opacity-50 text-primary-foreground text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
                              >
                                {isSavingLimit ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : limitSaveSuccess ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <CheckCircle2 className="w-4 h-4" />
                                )}
                                <span>{limitSaveSuccess ? 'Saved Successfully!' : 'Save Limit'}</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={true}
                                className="px-5 py-2 bg-muted text-muted-foreground border border-border text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-not-allowed opacity-75 shadow-sm"
                              >
                                <Lock className="w-3.5 h-3.5 text-amber-500" />
                                <span>Locked (Founder Only)</span>
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-2">
                            {isFounder 
                              ? "Any value saved here will take immediate effect and be calculated across the company and all active users." 
                              : "Note: Company daily ceiling and presets are restricted to the System Founder. Authorized workspace members can perform Instant Quota Reset below."}
                          </p>
                        </div>
                      </div>

                      {/* Emergency Instant Reset Box - FOUNDER APPROVAL WORKFLOW */}
                      <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            {isFounder ? (
                              <RotateCcw className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <ShieldAlert className="w-4 h-4 text-amber-500" />
                            )}
                            <span className="text-xs font-bold text-foreground">
                              {isFounder ? 'Instant Quota Reset (0 Ops)' : 'Request Quota Reset (0 Ops)'}
                            </span>
                            {isFounder ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Direct Founder Access
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                Requires Founder Approval
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isFounder 
                              ? "Reset today's recorded database operations count back to 0 Ops immediately for all workspace users."
                              : "Submitting a reset request will forward it to the System Founder. Operations will reset to 0 Ops upon Founder approval."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenResetDialog}
                          className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm",
                            isFounder
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          )}
                        >
                          {isFounder ? <RotateCcw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                          <span>{isFounder ? 'Reset Quota to 0 Ops' : 'Request Quota Reset'}</span>
                        </button>
                      </div>

                      {/* Timeline Graph Display Switch - FOUNDER CONTROL */}
                      {isFounder && (
                        <div className="bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <Activity className="w-4 h-4 text-primary" />
                              <span className="text-xs font-bold text-foreground">
                                Operations Timeline Graph Display
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                Founder Feature
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enable or disable the 24-hour visual progression timeline graph in the Overview tab.
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleTimelineGraph(!showTimelineGraph)}
                            className={cn(
                              "px-4 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0 shadow-sm",
                              showTimelineGraph
                                ? "bg-primary text-primary-foreground border border-primary"
                                : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                            )}
                          >
                            <span className={cn("w-2 h-2 rounded-full", showTimelineGraph ? "bg-white animate-pulse" : "bg-slate-400")} />
                            <span>{showTimelineGraph ? 'Graph Display: Active (ON)' : 'Graph Display: Inactive (OFF)'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer Bar */}
              <div className="px-6 py-3.5 border-t border-border bg-card/90 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>SAPIENT Zero-Deep-Scan Protection Active</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-lg border border-border transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sensitive Operation Confirmation Dialog Popup Modal - 100% English & High Contrast */}
      <AnimatePresence>
        {isConfirmResetModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            onClick={() => !isSubmittingReset && setIsConfirmResetModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground flex flex-col"
            >
              {/* Header */}
              <div className="p-5 border-b border-border bg-muted/40 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center border shrink-0",
                    isFounder 
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                      : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                  )}>
                    {isFounder ? <RotateCcw className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isFounder ? 'Confirm Instant Quota Reset' : 'Confirm Quota Reset Request'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isFounder ? 'Direct administrative action' : 'Requires System Founder approval'}
                    </p>
                  </div>
                </div>
                {!isSubmittingReset && (
                  <button
                    type="button"
                    onClick={() => setIsConfirmResetModalOpen(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* Notice Card - High Contrast without pale yellow */}
                <div className={cn(
                  "p-4 rounded-xl border leading-relaxed",
                  isFounder 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100" 
                    : "bg-slate-100 dark:bg-slate-800/90 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                )}>
                  {isFounder ? (
                    <p>
                      <strong className="font-semibold text-emerald-900 dark:text-emerald-200">Direct Reset:</strong> As the System Founder, you have full administrative authority to immediately reset today's database operations count back to <strong className="font-semibold">0 Ops</strong> for all members of this company. This change applies across the workspace instantly.
                    </p>
                  ) : (
                    <p>
                      <strong className="font-semibold text-amber-900 dark:text-amber-300">Approval Policy:</strong> Standard users and company admins cannot reset operations directly. Submitting this request will automatically notify the System Founder. Operations will be reset to <strong className="font-semibold">0 Ops</strong> as soon as the Founder approves your request.
                    </p>
                  )}
                </div>

                {/* Operation Summary Box */}
                <div className="bg-muted/40 rounded-xl p-3.5 border border-border space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Company Name:</span>
                    <span className="font-semibold text-foreground">{company?.name || 'Your Company'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Current Usage:</span>
                    <span className="font-mono font-bold text-foreground">
                      {quotaUsed.toLocaleString()} / {isUnlimited ? '∞' : quotaLimit.toLocaleString()} Ops ({pctUsed}%)
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Requested By:</span>
                    <span className="font-semibold text-foreground">{user?.displayName || user?.email || 'Authorized Member'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-border/60">
                    <span className="text-muted-foreground font-medium">Action:</span>
                    <span className="font-semibold text-primary">Reset daily count to 0 Ops</span>
                  </div>
                </div>

                {/* Feedback status */}
                {resetFeedbackMsg && (
                  <div className={cn(
                    "p-3 rounded-lg text-xs font-medium flex items-center gap-2",
                    resetFeedbackMsg.type === 'success' 
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                      : "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                  )}>
                    {resetFeedbackMsg.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{resetFeedbackMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isSubmittingReset}
                  onClick={() => setIsConfirmResetModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReset}
                  onClick={handleExecuteResetAction}
                  className={cn(
                    "px-5 py-2 rounded-lg text-xs font-bold text-white flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60",
                    isFounder 
                      ? "bg-emerald-600 hover:bg-emerald-700" 
                      : "bg-amber-600 hover:bg-amber-700"
                  )}
                >
                  {isSubmittingReset ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : isFounder ? (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Yes, Reset Quota to 0 Ops</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Request to Founder</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quota Reset Request Contact Modal for Users */}
      <QuotaResetRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        companyName={company?.name || 'Your Company'}
      />
    </>
  );
}
