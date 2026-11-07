import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw, X, Database, Clock, Mail, Phone, AlertCircle, RotateCcw, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { erpService } from '../services/erpService';
import { QuotaResetRequestModal } from './QuotaResetRequestModal';
import { useNotification } from '../contexts/NotificationContext';

interface QuotaExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

export default function QuotaExceededModal({ isOpen, onClose, company }: QuotaExceededModalProps) {
  const { logout, user, isFounder, isSuperAdmin, isAdmin } = useAuth();
  const { showNotification } = useNotification();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);

  const isUnlimited = company?.quotaLimit === -1;
  const quotaLimit = company?.quotaLimit !== undefined ? Number(company.quotaLimit) : 10000;
  const rawQuotaUsed = company?.quotaUsed || 0;
  // Strict 100% cap
  const quotaUsed = isUnlimited ? rawQuotaUsed : Math.min(quotaLimit, rawQuotaUsed);
  const percentUsed = isUnlimited ? 0 : Math.min(100, Math.max(0, Math.round((quotaUsed / quotaLimit) * 100)));

  // Helper to calculate exact next 01:00 PM Bangladesh Time (Asia/Dhaka)
  const getNextResetTime = (): Date => {
    const now = new Date();
    const tz = "Asia/Dhaka";
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const parts = formatter.formatToParts(now);
      const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

      // 01:00 PM BST is 07:00 AM UTC (synchronized with Firestore midnight PDT reset)
      const today130PM = new Date(
        Date.UTC(
          parseInt(map.year),
          parseInt(map.month) - 1,
          parseInt(map.day),
          7,
          0,
          0,
          0
        )
      );

      if (now.getTime() < today130PM.getTime()) {
        return today130PM;
      } else {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tParts = formatter.formatToParts(tomorrow);
        const tMap = Object.fromEntries(tParts.map((p) => [p.type, p.value]));
        return new Date(
          Date.UTC(
            parseInt(tMap.year),
            parseInt(tMap.month) - 1,
            parseInt(tMap.day),
            7,
            30,
            0,
            0
          )
        );
      }
    } catch (e) {
      const fallback = new Date();
      fallback.setUTCHours(7, 0, 0, 0);
      if (now.getTime() < fallback.getTime()) {
        return fallback;
      } else {
        return new Date(fallback.getTime() + 24 * 60 * 60 * 1000);
      }
    }
  };

  const nextResetDate = getNextResetTime();

  // Live countdown to next reset
  useEffect(() => {
    if (!isOpen) return;
    
    const updateCountdown = () => {
      const diff = nextResetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeLeft(`${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextResetDate, isOpen]);

  // Format date/time nicely
  const getFormattedResetTime = () => {
    const tz = "Asia/Dhaka";
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const en = new Intl.DateTimeFormat("en-US", options).format(nextResetDate);
      const bn = new Intl.DateTimeFormat("bn-BD", options).format(nextResetDate);
      return { en, bn };
    } catch (e) {
      return {
        en: "Today/Tomorrow at 01:00 PM (BST)",
        bn: "আজ/আগামীকাল দুপুর ১:৩০ মিনিটে"
      };
    }
  };

  const formattedTimes = getFormattedResetTime();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <>
      <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Full-screen backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container matching App Theme */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-3xl max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground font-sans select-none z-10 flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Bar matching QuotaDashboardModal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20 shrink-0">
                  <Database className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                      Daily Database Quota Exceeded
                    </h2>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                      Safety Active
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                    <span className="font-semibold text-foreground">{company?.name || 'Your Company'}</span>
                    <span aria-hidden="true" className="text-muted-foreground/60">·</span>
                    <span>Reset Time: 01:00 PM BST</span>
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

            {/* Scrollable Content Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 no-scrollbar bg-background/50">
              {/* Usage Analytics Highlight Panel */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Current Day Operations Usage
                  </span>
                  <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    {percentUsed}% Exhausted
                  </span>
                </div>

                <div>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                    {quotaUsed.toLocaleString()}{' '}
                    <span className="text-sm font-normal text-muted-foreground font-sans">
                      / {quotaLimit.toLocaleString()} Ops
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    দৈনিক ডেটাবেজ সীমা স্পর্শ করায় অতিরিক্ত এন্ট্রি সাময়িকভাবে স্থগিত রাখা হয়েছে।
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-muted border border-border h-3 rounded-full overflow-hidden p-0.5 relative">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-700"
                    style={{ width: `${Math.min(100, percentUsed)}%` }}
                  />
                </div>

                {/* Dual Details Tiles */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">ব্যবহৃত অপারেশন (Used)</span>
                    <span className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 mt-0.5 block">
                      {quotaUsed.toLocaleString()} Ops
                    </span>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">বরাদ্দকৃত সীমা (Daily Limit)</span>
                    <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                      {quotaLimit.toLocaleString()} Ops
                    </span>
                  </div>
                </div>
              </div>

              {/* Countdown & Schedule Banner */}
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 border border-primary/20 text-primary rounded-lg shrink-0">
                    <Clock className="w-4.5 h-4.5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">স্বয়ংক্রিয় রিসেট সময়সূচি (Automatic Reset Schedule)</h4>
                    <p className="text-[11px] text-muted-foreground">প্রতিদিন দুপুর ০১:০০ টায় (বাংলাদেশ সময়) স্বয়ংক্রিয়ভাবে কোটা ০-তে রিসেট হবে।</p>
                  </div>
                </div>
                <div className="text-center sm:text-right shrink-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-mono font-bold tracking-wider">রিসেট বাকি</p>
                  <p className="text-base font-black font-mono text-primary tracking-tight">{timeLeft || '--h --m --s'}</p>
                </div>
              </div>

              {/* Direct Quick Action Note & Developer Contact */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-500" />
                    তাত্ক্ষণিক অনুমোদন ও যোগাযোগ (Instant Clearance Support)
                  </span>
                  <span className="text-[10px] text-muted-foreground">Founder Hotline</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="tel:+8801742058246"
                    className="p-3 bg-muted/40 hover:bg-muted border border-border rounded-xl flex items-center gap-2.5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 group-hover:scale-105 transition-transform">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Call Founder</p>
                      <p className="text-xs font-bold font-mono text-foreground mt-0.5 truncate">+880 1742 058246</p>
                    </div>
                  </a>

                  <a
                    href="mailto:sapientman46@gmail.com?subject=TallyFlow ERP Daily Quota Limit Increase Request"
                    className="p-3 bg-muted/40 hover:bg-muted border border-border rounded-xl flex items-center gap-2.5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Email Founder</p>
                      <p className="text-xs font-medium text-foreground mt-0.5 truncate">sapientman46@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>

            {/* Actions Footer Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card/90 shrink-0">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
              >
                Close / সাময়িকভাবে বন্ধ করুন
              </button>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleRefresh}
                  className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-foreground bg-card hover:bg-muted border border-border rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
                  <span>{isRefreshing ? "Refreshing..." : "Reload & Check Status"}</span>
                </button>

                {company?.id && (
                  (isFounder || isSuperAdmin) ? (
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={async () => {
                        setIsResetting(true);
                        try {
                          await erpService.resetQuotaNow(company.id);
                          showNotification('Quota reset successfully to 0 Ops!', 'success');
                          onClose();
                          window.location.reload();
                        } catch (err) {
                          showNotification('Failed to reset quota. Please check network connection.', 'error');
                        } finally {
                          setIsResetting(false);
                        }
                      }}
                      className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-xs font-bold text-white rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                      title="Founder: Reset quota usage now"
                    >
                      {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>{isResetting ? 'Resetting...' : 'Founder: Reset Quota Now (কোটা রিসেট)'}</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={async () => {
                        setIsResetting(true);
                        try {
                          await erpService.requestQuotaReset(company.id, company.name, {
                            name: user?.displayName || (user as any)?.name,
                            email: user?.email,
                            userId: user?.uid,
                            quotaUsed,
                            quotaLimit
                          });
                          showNotification('কোটা বৃদ্ধির অনুরোধ ফাউন্ডারকে পাঠানো হয়েছে!', 'success');
                          setShowRequestModal(true);
                        } catch (err) {
                          setShowRequestModal(true);
                        } finally {
                          setIsResetting(false);
                        }
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-xs font-bold text-slate-950 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
                      title="Request quota increase from Founder"
                    >
                      {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                      <span>{isResetting ? 'অনুরোধ পাঠানো হচ্ছে...' : 'Request Quota Increase (কোটা বৃদ্ধির অনুরোধ)'}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </div>
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
