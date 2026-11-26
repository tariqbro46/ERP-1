import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  BookOpen,
  Box,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Database,
  FileText,
  Info,
  Loader2,
  Lock,
  Package,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  Sliders,
  Trash2,
  Unlock,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, collection, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase';
import { erpService } from '../../services/erpService';
import { soundService } from '../../services/soundService';
import { useSettings } from '../../contexts/SettingsContext';
import { AVAILABLE_FEATURES } from '../../constants/features';
import { SubscriptionPlan, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { CompanyStats, QuotaModalData, safeFormatDate } from './types';

interface FounderTenantsViewProps {
  companies: CompanyStats[];
  setCompanies: React.Dispatch<React.SetStateAction<CompanyStats[]>>;
  allUsers: any[];
  quotaRequests: any[];
  subscriptionPlans: SubscriptionPlan[];
  currentUser: UserProfile | null;
  selectedCompany: CompanyStats | null;
  setSelectedCompany: React.Dispatch<React.SetStateAction<CompanyStats | null>>;
  quotaModalData: QuotaModalData | null;
  setQuotaModalData: React.Dispatch<React.SetStateAction<QuotaModalData | null>>;
  onSwitchCompany: (companyId: string) => Promise<void>;
  onDeleteCompany: (companyId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FounderTenantsView: React.FC<FounderTenantsViewProps> = ({
  companies,
  setCompanies,
  allUsers,
  quotaRequests,
  subscriptionPlans,
  currentUser,
  selectedCompany,
  setSelectedCompany,
  quotaModalData,
  setQuotaModalData,
  onSwitchCompany,
  onDeleteCompany,
  onRefresh,
  showNotification,
}) => {
  const { uiStyle, appFeatures } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'trial' | 'inactive'>('all');
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [editDraft, setEditDraft] = useState<Partial<CompanyStats> | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [isSavingQuotaApproval, setIsSavingQuotaApproval] = useState(false);

  const filteredCompanies = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q);
      const st = (c.subscriptionStatus || '').toLowerCase();
      const matchesStatus = statusFilter === 'all' || st === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [companies, searchTerm, statusFilter]);

  const pendingQuotaRequests = useMemo(
    () => quotaRequests.filter((r) => r.status === 'pending'),
    [quotaRequests]
  );

  const toggleAccess = async (company: CompanyStats) => {
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        isAccessEnabled: !company.isAccessEnabled,
      });
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === company.id ? { ...c, isAccessEnabled: !c.isAccessEnabled } : c
        )
      );
      if (selectedCompany?.id === company.id) {
        setSelectedCompany({ ...selectedCompany, isAccessEnabled: !company.isAccessEnabled });
      }
      showNotification(
        `Access ${!company.isAccessEnabled ? 'enabled' : 'disabled'} for ${company.name}`,
        'info'
      );
    } catch (error) {
      console.error('Error toggling access:', error);
      showNotification('Failed to toggle company access', 'error');
    }
  };

  const updateSubscription = async (companyId: string, updates: any) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const mostRecentResetTime = erpService.getMostRecent130PM(new Date()).getTime();
      const parsedQuotaLimit =
        updates.quotaLimit !== undefined && updates.quotaLimit !== ''
          ? Number(updates.quotaLimit)
          : 10000;
      const parsedQuotaUsed =
        updates.quotaUsed !== undefined && updates.quotaUsed !== ''
          ? Number(updates.quotaUsed)
          : 0;
      const isQuotaReset = parsedQuotaUsed === 0;

      const finalUpdates: any = {
        ...updates,
        quotaLimit: parsedQuotaLimit,
        quotaUsed: parsedQuotaUsed,
        forceRefreshAt: Date.now(),
        quotaLastReset: mostRecentResetTime,
        quotaLastResetDateStr: new Date(mostRecentResetTime).toISOString(),
      };

      if (isQuotaReset) {
        finalUpdates.quotaReads = 0;
        finalUpdates.quotaWrites = 0;
        finalUpdates.quotaDeletes = 0;
      } else {
        finalUpdates.quotaReads = parsedQuotaUsed;
        finalUpdates.quotaWrites = 0;
        finalUpdates.quotaDeletes = 0;
      }

      await updateDoc(companyRef, finalUpdates);

      if (isQuotaReset) {
        try {
          const usersQuery = query(collection(db, 'users'), where('companyId', '==', companyId));
          const usersSnap = await getDocs(usersQuery);
          if (!usersSnap.empty) {
            const b = writeBatch(db);
            usersSnap.docs.forEach((uDoc) => {
              b.update(uDoc.ref, { quotaUsed: 0 });
            });
            await b.commit();
          }
        } catch (uErr) {
          console.warn('[FOUNDER] Could not reset users quotaUsed:', uErr);
        }
      }

      try {
        const cached = localStorage.getItem('cached_auth_company');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.id === companyId || parsed.companyId === companyId) {
            parsed.quotaLimit = parsedQuotaLimit;
            parsed.quotaUsed = parsedQuotaUsed;
            parsed.quotaReads = finalUpdates.quotaReads;
            parsed.quotaWrites = finalUpdates.quotaWrites;
            parsed.quotaDeletes = finalUpdates.quotaDeletes;
            if (parsedQuotaLimit === -1 || parsedQuotaUsed < parsedQuotaLimit) {
              localStorage.removeItem('company_quota_exceeded');
            }
            localStorage.setItem('cached_auth_company', JSON.stringify(parsed));
          }
        }
      } catch {}

      setCompanies((prev) =>
        prev.map((c) => (c.id === companyId ? { ...c, ...finalUpdates } : c))
      );

      if (selectedCompany?.id === companyId) {
        setSelectedCompany({ ...selectedCompany, ...finalUpdates });
      }

      setIsEditingSubscription(false);
      showNotification(
        'Company subscription & quota limit updated successfully! / কোম্পানির কোটা লিমিট সফলভাবে হালনাগাদ করা হয়েছে!',
        'success'
      );
    } catch (error) {
      console.error('Error updating subscription:', error);
      showNotification('Failed to update subscription. Please check network connection.', 'error');
    }
  };

  const handleApproveQuotaReset = (requestId: string, companyId: string, companyName: string) => {
    soundService.play('click');
    const comp = companies.find((c) => c.id === companyId);
    const req = quotaRequests.find((r) => r.id === requestId);
    const currentLimit =
      comp?.quotaLimit !== undefined ? Number(comp.quotaLimit) : req?.quotaLimit || 20000;
    const currentUsed = comp?.quotaUsed !== undefined ? Number(comp.quotaUsed) : req?.quotaUsed || 0;
    const initialNewLimit = currentLimit > 0 ? currentLimit + 10000 : 30000;

    setQuotaModalData({
      isOpen: true,
      requestId,
      companyId,
      companyName,
      requestedBy:
        req?.requestedByName || req?.requestedByEmail || comp?.quotaResetRequestedBy || 'Company Admin',
      requestedByEmail: req?.requestedByEmail || comp?.email || '',
      createdAtStr: req?.createdAtStr || '',
      currentLimit,
      currentUsed,
      newLimit: initialNewLimit,
      resetUsage: false,
    });
  };

  const handleDirectResetQuota = (companyId: string, companyName: string) => {
    soundService.play('click');
    const comp = companies.find((c) => c.id === companyId);
    const pendingReq = quotaRequests.find(
      (r) => r.companyId === companyId && r.status === 'pending'
    );
    const currentLimit = comp?.quotaLimit !== undefined ? Number(comp.quotaLimit) : 20000;
    const currentUsed = comp?.quotaUsed !== undefined ? Number(comp.quotaUsed) : 0;
    const initialNewLimit = currentLimit > 0 ? currentLimit + 10000 : 30000;

    setQuotaModalData({
      isOpen: true,
      requestId: pendingReq?.id,
      companyId,
      companyName,
      requestedBy:
        pendingReq?.requestedByName ||
        pendingReq?.requestedByEmail ||
        comp?.quotaResetRequestedBy ||
        'Company Admin',
      requestedByEmail: pendingReq?.requestedByEmail || comp?.email || '',
      createdAtStr: pendingReq?.createdAtStr || '',
      currentLimit,
      currentUsed,
      newLimit: initialNewLimit,
      resetUsage: false,
    });
  };

  const handleConfirmQuotaApproval = async () => {
    if (!quotaModalData) return;
    setIsSavingQuotaApproval(true);
    try {
      await erpService.approveQuotaIncrease(
        quotaModalData.requestId || '',
        quotaModalData.companyId,
        quotaModalData.newLimit,
        quotaModalData.resetUsage,
        currentUser?.email || 'sapientman46@gmail.com'
      );
      soundService.play('success');
      showNotification(
        `কোটা সফলভাবে কার্যকর করা হয়েছে! "${quotaModalData.companyName}" এর নতুন দৈনিক লিমিট: ${
          quotaModalData.newLimit === -1
            ? 'Unlimited'
            : quotaModalData.newLimit.toLocaleString() + ' Ops'
        }`,
        'success'
      );
      setQuotaModalData(null);
      await onRefresh();
    } catch (err: any) {
      soundService.play('error');
      showNotification('Failed to update quota limit: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSavingQuotaApproval(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          className={cn(
            'bg-card border border-border rounded-xl p-6 shadow-sm transition-all',
            uiStyle === 'UI/UX 2' && 'bg-blue-600 border-blue-700 text-white shadow-blue-200'
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-lg', uiStyle === 'UI/UX 2' ? 'bg-white/20' : 'bg-primary/10')}>
              <Users className={cn('w-6 h-6', uiStyle === 'UI/UX 2' ? 'text-white' : 'text-primary')} />
            </div>
            <div>
              <p className={cn('text-sm', uiStyle === 'UI/UX 2' ? 'text-blue-100' : 'text-muted-foreground')}>
                Total Users
              </p>
              <p className="text-2xl font-bold">{allUsers.length}</p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'bg-card border border-border rounded-xl p-6 shadow-sm transition-all',
            uiStyle === 'UI/UX 2' && 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-200'
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-lg', uiStyle === 'UI/UX 2' ? 'bg-white/20' : 'bg-emerald-500/10')}>
              <CheckCircle2
                className={cn('w-6 h-6', uiStyle === 'UI/UX 2' ? 'text-white' : 'text-emerald-500')}
              />
            </div>
            <div>
              <p className={cn('text-sm', uiStyle === 'UI/UX 2' ? 'text-emerald-100' : 'text-muted-foreground')}>
                Active Subscriptions
              </p>
              <p className="text-2xl font-bold">
                {companies.filter((c) => c.subscriptionStatus?.toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div
          className={cn(
            'bg-card border border-border rounded-xl p-6 shadow-sm transition-all',
            uiStyle === 'UI/UX 2' && 'bg-amber-500 border-amber-600 text-white shadow-amber-200'
          )}
        >
          <div className="flex items-center gap-4">
            <div className={cn('p-3 rounded-lg', uiStyle === 'UI/UX 2' ? 'bg-white/20' : 'bg-amber-500/10')}>
              <AlertCircle
                className={cn('w-6 h-6', uiStyle === 'UI/UX 2' ? 'text-white' : 'text-amber-500')}
              />
            </div>
            <div>
              <p className={cn('text-sm', uiStyle === 'UI/UX 2' ? 'text-amber-100' : 'text-muted-foreground')}>
                Trial Users
              </p>
              <p className="text-2xl font-bold">
                {companies.filter((c) => c.subscriptionStatus?.toLowerCase() === 'trial').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Quota Reset Requests Alert Section */}
      {pendingQuotaRequests.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-foreground shadow-md">
          <div className="flex items-center justify-between gap-3 mb-3 pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-amber-500" />
              <h4 className="text-sm font-bold text-amber-500">
                Pending Quota Reset Requests ({pendingQuotaRequests.length}) / কোটা রিসেটের অনুরোধ
              </h4>
            </div>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold uppercase tracking-wider">
              Action Required
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingQuotaRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-card border border-amber-500/30 rounded-lg flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-foreground">{req.companyName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 font-bold uppercase">
                      Pending
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Requested by:{' '}
                    <span className="text-foreground font-medium">
                      {req.requestedByName || req.requestedByEmail}
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">Email: {req.requestedByEmail || 'N/A'}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Requested: {req.createdAtStr ? safeFormatDate(req.createdAtStr, 'dd MMM, HH:mm') : 'Recently'}
                  </p>
                </div>
                <button
                  onClick={() => handleApproveQuotaReset(req.id, req.companyId, req.companyName)}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all shadow cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Approve &amp; Reset Quota (কোটা রিসেট)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Status Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search companies by name, email, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary outline-none"
          />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(['all', 'active', 'trial', 'inactive'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-colors',
                statusFilter === status
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border hover:text-foreground'
              )}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Companies Table */}
      <div
        className={cn(
          'bg-card border border-border rounded-xl shadow-sm overflow-x-auto',
          uiStyle === 'UI/UX 2' && 'border-blue-100 shadow-md'
        )}
      >
        <div className="min-w-[1000px] lg:min-w-0">
          <table className="w-full text-left text-sm">
            <thead
              className={cn(
                'font-medium border-b border-border',
                uiStyle === 'UI/UX 2' ? 'bg-blue-600 text-white' : 'bg-muted/50 text-muted-foreground'
              )}
            >
              <tr>
                <th className="px-6 py-4 align-middle">Company</th>
                <th className="px-6 py-4 align-middle">Subscription</th>
                <th className="px-6 py-4 align-middle">Usage</th>
                <th className="px-6 py-4 align-middle">Last Activity</th>
                <th className="px-6 py-4 align-middle">Status</th>
                <th className="px-6 py-4 text-right align-middle">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCompanies.length > 0 ? (
                filteredCompanies.map((company) => (
                  <tr
                    key={company.id}
                    className={cn(
                      'transition-colors group',
                      uiStyle === 'UI/UX 2' ? 'hover:bg-blue-50/50' : 'hover:bg-muted/30'
                    )}
                  >
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">{company.name}</span>
                          {company.quotaResetRequested && (
                            <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded font-bold uppercase animate-pulse">
                              Quota Request
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">{company.email || 'No email'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${
                            company.subscriptionStatus === 'active'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : company.subscriptionStatus === 'trial'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-rose-500/10 text-rose-500'
                          }`}
                        >
                          {company.subscriptionStatus}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Exp: {safeFormatDate(company.expiryDate, 'dd MMM yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs flex items-center gap-1">
                          <Users className="w-3 h-3" /> {company.userCount} Users
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <FileText className="w-3 h-3" /> {company.voucherCount} Vouchers
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {company.ledgerCount} Ledgers
                        </span>
                        <span className="text-xs flex items-center gap-1">
                          <Package className="w-3 h-3" /> {company.itemCount} Items
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-middle">
                      {company.lastActivity ? (
                        <div className="flex flex-col">
                          <span className="text-xs text-foreground">{company.lastActivity.action}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {company.lastActivity.timestamp
                              ? safeFormatDate(company.lastActivity.timestamp, 'dd MMM, HH:mm')
                              : 'N/A'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">No activity</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                          company.isAccessEnabled ? 'text-emerald-500' : 'text-rose-500'
                        }`}
                      >
                        {company.isAccessEnabled ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" /> Enabled
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" /> Disabled
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        {currentUser?.companyId !== company.id ? (
                          <button
                            onClick={() => onSwitchCompany(company.id)}
                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Switch to this Company"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="p-2 text-emerald-500" title="Currently Active">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        )}
                        <button
                          onClick={() => handleDirectResetQuota(company.id, company.name)}
                          className={cn(
                            'p-2 rounded-lg transition-colors cursor-pointer',
                            company.quotaResetRequested
                              ? 'bg-amber-500/20 text-amber-500 animate-pulse border border-amber-500/40'
                              : 'text-emerald-500 hover:bg-emerald-500/10'
                          )}
                          title={
                            company.quotaResetRequested
                              ? 'Pending Quota Reset Request - Click to Reset'
                              : 'Adjust or Reset Quota for this Company'
                          }
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleAccess(company)}
                          className={`p-2 rounded-lg transition-colors ${
                            company.isAccessEnabled
                              ? 'text-rose-500 hover:bg-rose-500/10'
                              : 'text-emerald-500 hover:bg-emerald-500/10'
                          }`}
                          title={company.isAccessEnabled ? 'Disable Access' : 'Enable Access'}
                        >
                          {company.isAccessEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => setCompanyToDelete(company.id)}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Company"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedCompany(company)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
                          title="Inspect Company Details"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground text-xs italic align-middle">
                    No matching companies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Details Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Company Details: {selectedCompany.name}</h2>
                <button
                  onClick={() => {
                    setSelectedCompany(null);
                    setIsEditingSubscription(false);
                    setEditDraft(null);
                  }}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Subscription Status
                    </p>
                    {isEditingSubscription && editDraft ? (
                      <div className="grid grid-cols-3 gap-2">
                        {(['active', 'inactive', 'trial'] as const).map((status) => (
                          <button
                            key={status}
                            type="button"
                            onClick={() =>
                              setEditDraft((prev) => (prev ? { ...prev, subscriptionStatus: status } : null))
                            }
                            className={cn(
                              'py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                              editDraft.subscriptionStatus === status
                                ? status === 'active'
                                  ? 'bg-emerald-500 border-emerald-600 text-white shadow-lg'
                                  : status === 'trial'
                                  ? 'bg-amber-500 border-amber-600 text-white shadow-lg'
                                  : 'bg-rose-500 border-rose-600 text-white shadow-lg'
                                : 'bg-background border-border text-muted-foreground hover:border-foreground'
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        className={cn(
                          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest',
                          selectedCompany.subscriptionStatus === 'active'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : selectedCompany.subscriptionStatus === 'trial'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        )}
                      >
                        <div
                          className={cn(
                            'w-1.5 h-1.5 rounded-full animate-pulse',
                            selectedCompany.subscriptionStatus === 'active'
                              ? 'bg-emerald-500'
                              : selectedCompany.subscriptionStatus === 'trial'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          )}
                        />
                        {selectedCompany.subscriptionStatus}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Plan Type
                    </p>
                    {isEditingSubscription && editDraft ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {(['free', 'monthly', 'yearly'] as const).map((plan) => (
                            <button
                              key={plan}
                              type="button"
                              onClick={() =>
                                setEditDraft((prev) => (prev ? { ...prev, planType: plan } : null))
                              }
                              className={cn(
                                'py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all',
                                editDraft.planType === plan
                                  ? 'bg-primary border-primary text-white shadow-lg'
                                  : 'bg-background border-border text-muted-foreground hover:border-foreground'
                              )}
                            >
                              {plan}
                            </button>
                          ))}
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                            Assigned Subscription Plan
                          </label>
                          <select
                            value={editDraft.planId || ''}
                            onChange={(e) =>
                              setEditDraft((prev) => (prev ? { ...prev, planId: e.target.value } : null))
                            }
                            className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary"
                          >
                            <option value="">No Plan Assigned</option>
                            {subscriptionPlans.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.priceMonthly}/mo)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg w-fit">
                          {selectedCompany.planType}
                        </p>
                        {selectedCompany.planId && (
                          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                            Plan: {subscriptionPlans.find((p) => p.id === selectedCompany.planId)?.name || 'Unknown'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Expiry Date
                    </p>
                    {isEditingSubscription && editDraft ? (
                      <input
                        type="date"
                        value={editDraft.expiryDate ? safeFormatDate(editDraft.expiryDate, 'yyyy-MM-dd') : ''}
                        onChange={(e) =>
                          setEditDraft((prev) =>
                            prev
                              ? { ...prev, expiryDate: e.target.value ? new Date(e.target.value).toISOString() : '' }
                              : null
                          )
                        }
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-lg w-fit">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {safeFormatDate(selectedCompany.expiryDate, 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                      Access Control
                    </p>
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full',
                          selectedCompany.isAccessEnabled
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-rose-500/10 text-rose-500'
                        )}
                      >
                        {selectedCompany.isAccessEnabled ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Enabled
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Disabled
                          </>
                        )}
                      </span>
                      <button
                        onClick={() => toggleAccess(selectedCompany)}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extra Features & Custom Limits */}
                <div className="space-y-6 pt-6 border-t border-border">
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      Extra Features &amp; Custom Limits
                    </h3>

                    {isEditingSubscription && editDraft ? (
                      <div className="space-y-6">
                        <div className="space-y-6">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Grant Extra Features
                          </label>
                          <div className="space-y-6">
                            {appFeatures.map((category) => (
                              <div key={category.id} className="space-y-2">
                                <p className="text-[8px] uppercase font-black text-muted-foreground/40">
                                  {category.label}
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                  {category.features.map((feature) => {
                                    const isExtra = editDraft.extraFeatures?.includes(feature.id);
                                    const plan = subscriptionPlans.find((p) => p.id === editDraft.planId);
                                    const inPlan = plan?.features.includes(feature.id);

                                    return (
                                      <button
                                        key={feature.id}
                                        type="button"
                                        onClick={() => {
                                          const currentExtra = editDraft.extraFeatures || [];
                                          const newExtra = isExtra
                                            ? currentExtra.filter((id) => id !== feature.id)
                                            : [...currentExtra, feature.id];
                                          setEditDraft((prev) =>
                                            prev ? { ...prev, extraFeatures: newExtra } : null
                                          );
                                        }}
                                        className={cn(
                                          'flex items-center gap-2 p-2 border rounded-lg text-[9px] font-bold uppercase tracking-tight transition-all text-left group/extra relative',
                                          isExtra
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-background border-border text-muted-foreground',
                                          inPlan && 'opacity-50 cursor-not-allowed grayscale'
                                        )}
                                        disabled={inPlan}
                                        title={inPlan ? 'Included in Plan' : ''}
                                      >
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <Box className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{feature.label}</span>
                                          </div>
                                          {feature.description && (
                                            <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[8px] font-medium leading-relaxed rounded-lg shadow-xl border border-border opacity-0 group-hover/extra:opacity-100 pointer-events-none transition-all z-50">
                                              {feature.description}
                                            </div>
                                          )}
                                        </div>
                                        {isExtra && <Check className="w-2 h-2 ml-auto" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                            Custom Plan Limits
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {(['vouchers', 'items', 'ledgers', 'users', 'godowns'] as const).map((limitKey) => (
                              <div key={limitKey} className="space-y-1">
                                <label className="text-[9px] uppercase font-bold text-muted-foreground">
                                  {limitKey}
                                </label>
                                <input
                                  type="number"
                                  value={(editDraft.customLimits as any)?.[limitKey] ?? ''}
                                  placeholder="Plan Default"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? undefined : Number(e.target.value);
                                    const newLimits = { ...(editDraft.customLimits || {}), [limitKey]: val };
                                    setEditDraft((prev) =>
                                      prev ? { ...prev, customLimits: newLimits } : null
                                    );
                                  }}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-border pt-4">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                              Firebase/Firestore Daily Quota (Operations Limit)
                            </label>
                            <span className="text-[10px] font-mono text-primary font-bold">
                              {Number(editDraft.quotaLimit) === -1
                                ? '∞ Unlimited'
                                : String(Number(editDraft.quotaLimit) || 10000) + ' Ops'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] uppercase font-bold text-muted-foreground">
                              Quick Presets (সহজ প্রিসেট বাটন)
                            </label>
                            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                              {[5000, 10000, 20000, 25000, 50000, -1].map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() =>
                                    setEditDraft((prev) => (prev ? { ...prev, quotaLimit: val } : null))
                                  }
                                  className={cn(
                                    'py-1.5 px-2 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider border transition-all text-center cursor-pointer',
                                    Number(editDraft.quotaLimit) === val
                                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                      : 'bg-background border-border text-muted-foreground hover:border-foreground'
                                  )}
                                >
                                  {val === -1 ? '∞ Unltd' : String(val / 1000) + 'k Ops'}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">
                                Firestore Quota Limit (-1 = আনলিমিটেড)
                              </label>
                              <input
                                type="number"
                                value={editDraft.quotaLimit ?? ''}
                                placeholder="e.g. 10000 or -1"
                                onChange={(e) => {
                                  const val = e.target.value === '' ? '' : Number(e.target.value);
                                  setEditDraft((prev) =>
                                    prev ? { ...prev, quotaLimit: val as any } : null
                                  );
                                }}
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary font-mono"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">
                                Firestore Quota Used (Ops)
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  value={editDraft.quotaUsed === 0 ? '0' : editDraft.quotaUsed ?? ''}
                                  placeholder="0"
                                  onChange={(e) => {
                                    const val = e.target.value === '' ? '' : Number(e.target.value);
                                    setEditDraft((prev) =>
                                      prev ? { ...prev, quotaUsed: val as any } : null
                                    );
                                  }}
                                  className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary flex-1 font-mono"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditDraft((prev) => (prev ? { ...prev, quotaUsed: 0 } : null))
                                  }
                                  className="px-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Reset
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">
                                Sidebar Quota Display Rule
                              </label>
                              <select
                                value={editDraft.quotaDisplayRule || 'exceed_50'}
                                onChange={(e) =>
                                  setEditDraft((prev) =>
                                    prev
                                      ? { ...prev, quotaDisplayRule: e.target.value as 'always' | 'exceed_50' }
                                      : null
                                  )
                                }
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary font-medium"
                              >
                                <option value="always">Always Show Quota Indicator in Sidebar</option>
                                <option value="exceed_50">Only Show When Usage Exceeds 50%</option>
                              </select>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">
                                Daybook Date Highlight
                              </label>
                              <select
                                value={editDraft.enableDaybookDateHighlight === false ? 'false' : 'true'}
                                onChange={(e) =>
                                  setEditDraft((prev) =>
                                    prev ? { ...prev, enableDaybookDateHighlight: e.target.value === 'true' } : null
                                  )
                                }
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary font-medium"
                              >
                                <option value="true">Enabled (Glow/Highlight From/To fields for 2 seconds on load)</option>
                                <option value="false">Disabled</option>
                              </select>
                            </div>

                            <div className="space-y-1 sm:col-span-2">
                              <label className="text-[9px] uppercase font-bold text-muted-foreground">
                                Maintenance Break Custom Message
                              </label>
                              <textarea
                                value={editDraft.quotaExceededMsg || ''}
                                placeholder="Enter custom message or custom support guidelines here."
                                onChange={(e) =>
                                  setEditDraft((prev) =>
                                    prev ? { ...prev, quotaExceededMsg: e.target.value } : null
                                  )
                                }
                                className="w-full bg-background border border-border rounded-lg p-2 text-xs outline-none focus:border-primary h-20 resize-y font-normal"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedCompany.extraFeatures && selectedCompany.extraFeatures.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              Extra Features Granted:
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {selectedCompany.extraFeatures.map((fId) => {
                                const feature = AVAILABLE_FEATURES.find((af) => af.id === fId);
                                return (
                                  <span
                                    key={fId}
                                    className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
                                  >
                                    <Plus className="w-3 h-3" />
                                    {feature?.label || fId}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {selectedCompany.customLimits && Object.keys(selectedCompany.customLimits).length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                              Custom Limit Overrides:
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {Object.entries(selectedCompany.customLimits).map(([key, val]) => (
                                <div
                                  key={key}
                                  className="px-2 py-1 bg-muted rounded text-[9px] font-bold uppercase tracking-widest flex justify-between"
                                >
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="text-foreground">{String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {!selectedCompany.extraFeatures?.length && !selectedCompany.customLimits && (
                          <p className="text-xs text-muted-foreground italic">
                            No extra features or custom limits assigned.
                          </p>
                        )}

                        <div className="space-y-2 border-t border-border pt-3 mt-3">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            Firebase/Firestore Quota (Operations):
                          </p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs font-mono bg-muted/40 p-2.5 rounded-lg border border-border">
                              <span className="text-muted-foreground">Usage Stat:</span>
                              {(() => {
                                const qLim =
                                  selectedCompany.quotaLimit !== undefined ? selectedCompany.quotaLimit : 10000;
                                const isUnlimited = qLim === -1;
                                const qUsed = isUnlimited
                                  ? selectedCompany.quotaUsed || 0
                                  : Math.min(qLim, selectedCompany.quotaUsed || 0);
                                const qPct = isUnlimited ? 0 : Math.min(100, Math.round((qUsed / qLim) * 100));
                                return (
                                  <span
                                    className={
                                      !isUnlimited &&
                                      selectedCompany.quotaLimit &&
                                      selectedCompany.quotaUsed !== undefined &&
                                      selectedCompany.quotaUsed >= selectedCompany.quotaLimit
                                        ? 'text-rose-500 font-bold animate-pulse'
                                        : 'text-emerald-500 font-bold'
                                    }
                                  >
                                    {isUnlimited
                                      ? `${qUsed.toLocaleString()} / ∞ (Unlimited)`
                                      : `${qUsed.toLocaleString()} / ${qLim.toLocaleString()} ops (${qPct}%)`}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono bg-muted/20 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground">
                              <span>Display Rule:</span>
                              <span className="text-foreground capitalize font-semibold">
                                {selectedCompany.quotaDisplayRule === 'always'
                                  ? 'Always Show'
                                  : 'Show Over 50% only'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] font-mono bg-muted/20 px-2.5 py-1.5 rounded-lg border border-dashed border-border text-muted-foreground mt-1">
                              <span>Daybook Date Highlight:</span>
                              <span
                                className={cn(
                                  'font-semibold uppercase text-xs',
                                  selectedCompany.enableDaybookDateHighlight !== false
                                    ? 'text-emerald-500 font-bold'
                                    : 'text-rose-500 font-bold'
                                )}
                              >
                                {selectedCompany.enableDaybookDateHighlight !== false ? 'Enabled' : 'Disabled'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-border pt-3 mt-3 bg-blue-500/5 p-3 rounded-lg border border-dashed border-blue-500/20">
                          <p className="text-[10px] text-blue-500 uppercase font-black tracking-widest flex items-center gap-1.5">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin [animation-duration:6s]" />
                            <span>Live Force Refresh / ফোর্স রিফ্রেশ:</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-normal">
                            Click below to force-refresh the application for all active users of this company in real-time.
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                await erpService.updateCompany(selectedCompany.id, {
                                  forceRefreshAt: Date.now(),
                                });
                                showNotification(
                                  'Force refresh command sent successfully! / ফোর্স রিফ্রেশ কমান্ড সফলভাবে পাঠানো হয়েছে!',
                                  'success'
                                );
                              } catch {
                                showNotification('Failed to send refresh command.', 'error');
                              }
                            }}
                            className="w-full mt-1.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[10px] font-bold uppercase tracking-widest rounded-md shadow-md transition-all flex items-center justify-center gap-1.5"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Force Refresh All Sessions / রিফ্রেশ করুন</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex gap-4">
                  <button
                    onClick={() => {
                      setSelectedCompany(null);
                      setIsEditingSubscription(false);
                      setEditDraft(null);
                    }}
                    className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      if (isEditingSubscription) {
                        if (editDraft) {
                          updateSubscription(selectedCompany.id, editDraft);
                        }
                      } else {
                        setEditDraft({
                          subscriptionStatus: selectedCompany.subscriptionStatus,
                          planType: selectedCompany.planType,
                          planId: selectedCompany.planId || '',
                          expiryDate: selectedCompany.expiryDate || '',
                          extraFeatures: selectedCompany.extraFeatures || [],
                          customLimits: selectedCompany.customLimits || {},
                          quotaLimit: selectedCompany.quotaLimit ?? 10000,
                          quotaUsed: selectedCompany.quotaUsed ?? 0,
                          quotaDisplayRule: selectedCompany.quotaDisplayRule || 'exceed_50',
                          quotaExceededMsg: selectedCompany.quotaExceededMsg || '',
                          enableDaybookDateHighlight: selectedCompany.enableDaybookDateHighlight !== false,
                        });
                        setIsEditingSubscription(true);
                      }
                    }}
                    className={cn(
                      'flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg',
                      isEditingSubscription
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-primary text-primary-foreground hover:opacity-90'
                    )}
                  >
                    {isEditingSubscription ? 'Save Changes' : 'Edit Subscription'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Company Confirmation Modal */}
      <AnimatePresence>
        {companyToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Company?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this company and all its data? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const id = companyToDelete;
                    setCompanyToDelete(null);
                    await onDeleteCompany(id);
                  }}
                  className="px-4 py-2 bg-rose-500 text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Interactive Quota Approval Console Modal */}
      <AnimatePresence>
        {quotaModalData &&
          quotaModalData.isOpen &&
          (() => {
            const isOverQuota =
              quotaModalData.currentLimit > 0 && quotaModalData.currentUsed >= quotaModalData.currentLimit;
            const pctUsed =
              quotaModalData.currentLimit > 0
                ? Math.round((quotaModalData.currentUsed / quotaModalData.currentLimit) * 100)
                : 0;
            const diffOps =
              quotaModalData.newLimit === -1
                ? 'Unlimited'
                : Math.max(0, quotaModalData.newLimit - quotaModalData.currentLimit);

            return (
              <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => !isSavingQuotaApproval && setQuotaModalData(null)}
                  className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-md cursor-pointer"
                />

                <motion.div
                  initial={{ scale: 0.96, opacity: 0, y: 12 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.98, opacity: 0, y: 8 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="relative w-full max-w-4xl lg:max-w-5xl max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden text-foreground font-sans select-none z-10 flex flex-col my-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90 shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center border border-amber-500/20 shrink-0">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                            Database Quota &amp; Operations Intelligence
                          </h2>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-semibold">
                            Quota Approval Console
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono mt-0.5">
                          <span className="font-semibold text-foreground">{quotaModalData.companyName}</span>
                          <span aria-hidden="true" className="text-muted-foreground/60">
                            ·
                          </span>
                          <span>Requested by: {quotaModalData.requestedBy || 'Company Admin'}</span>
                          {quotaModalData.createdAtStr && (
                            <>
                              <span aria-hidden="true" className="text-muted-foreground/60">
                                ·
                              </span>
                              <span>{safeFormatDate(quotaModalData.createdAtStr, 'dd MMM, HH:mm')}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      disabled={isSavingQuotaApproval}
                      onClick={() => setQuotaModalData(null)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                      title="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="p-6 overflow-y-auto flex-1 no-scrollbar bg-background/50">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                      <div className="lg:col-span-5 space-y-4">
                        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                              Current Day Total Operations
                            </span>
                            <span
                              className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded border font-mono',
                                isOverQuota
                                  ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20'
                                  : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                              )}
                            >
                              {quotaModalData.currentLimit === -1 ? 'Unlimited' : `${pctUsed}% Exhausted`}
                            </span>
                          </div>

                          <div>
                            <div className="text-2xl sm:text-3xl font-bold font-mono text-foreground">
                              {quotaModalData.currentUsed.toLocaleString()}{' '}
                              <span className="text-sm font-normal text-muted-foreground font-sans">
                                /{' '}
                                {quotaModalData.currentLimit === -1
                                  ? '∞ Unlimited'
                                  : `${quotaModalData.currentLimit.toLocaleString()} Ops`}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              {isOverQuota
                                ? 'কোটার সীমা শেষ হওয়ায় নতুন ডেটা রিড ও রাইট সাময়িকভাবে ব্লক রয়েছে।'
                                : 'কোম্পানিটির দৈনিক কোটা স্বাভাবিক কার্যকর রয়েছে।'}
                            </p>
                          </div>

                          <div className="w-full bg-muted border border-border h-3 rounded-full overflow-hidden p-0.5 relative">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-700',
                                quotaModalData.currentLimit === -1
                                  ? 'bg-gradient-to-r from-indigo-500 via-primary to-teal-400'
                                  : isOverQuota
                                  ? 'bg-gradient-to-r from-orange-500 to-rose-600'
                                  : pctUsed >= 75
                                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                  : 'bg-gradient-to-r from-emerald-500 to-teal-500'
                              )}
                              style={{
                                width:
                                  quotaModalData.currentLimit === -1
                                    ? '100%'
                                    : `${Math.min(100, pctUsed)}%`,
                              }}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                                পূর্ববর্তী সীমা (Limit)
                              </span>
                              <span className="text-sm font-bold font-mono text-foreground mt-0.5 block">
                                {quotaModalData.currentLimit === -1
                                  ? 'Unlimited'
                                  : `${quotaModalData.currentLimit.toLocaleString()} Ops`}
                              </span>
                            </div>
                            <div className="bg-muted/40 border border-border rounded-lg p-2.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                                আজকের ব্যবহার (Used)
                              </span>
                              <span
                                className={cn(
                                  'text-sm font-bold font-mono mt-0.5 block',
                                  isOverQuota
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                )}
                              >
                                {quotaModalData.currentUsed.toLocaleString()} Ops
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-4 shadow-xs space-y-2.5">
                          <div className="flex items-center justify-between border-b border-border pb-2">
                            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-primary" />
                              কোম্পানি ও অনুরোধ বিবরণ
                            </span>
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold uppercase border border-amber-500/20">
                              Action Pending
                            </span>
                          </div>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">কোম্পানি:</span>
                              <span className="font-semibold text-foreground">{quotaModalData.companyName}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">অনুরোধকারী:</span>
                              <span className="font-medium text-foreground">
                                {quotaModalData.requestedBy || 'Company Admin'}
                              </span>
                            </div>
                            {quotaModalData.requestedByEmail && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">ইমেইল:</span>
                                <span className="font-mono text-[11px] text-muted-foreground">
                                  {quotaModalData.requestedByEmail}
                                </span>
                              </div>
                            )}
                            {quotaModalData.createdAtStr && (
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">অনুরোধের সময়:</span>
                                <span className="font-medium text-foreground">
                                  {safeFormatDate(quotaModalData.createdAtStr, 'dd MMM yyyy, HH:mm')}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-7 space-y-4">
                        <div className="bg-card border border-border rounded-xl p-5 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-border pb-3">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                                <Sliders className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="text-sm font-bold text-foreground">
                                  দৈনিক কোটা বৃদ্ধি ও সিদ্ধান্ত (Quota Increment Controls)
                                </h3>
                                <p className="text-[11px] text-muted-foreground">
                                  আজকের দিনের জন্য কোম্পানির সর্বোচ্চ অনুমোদিত ডেটাবেজ সীমা নির্ধারণ করুন।
                                </p>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                              কুইক প্রিসেট বোতাম (Quick Presets)
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                              {[
                                { label: '+5,000 Ops', add: 5000 },
                                { label: '+10,000 Ops', add: 10000 },
                                { label: '+20,000 Ops', add: 20000 },
                                { label: '+50,000 Ops', add: 50000 },
                                { label: 'Unlimited', val: -1 },
                              ].map((preset, idx) => {
                                const targetVal =
                                  preset.val !== undefined
                                    ? preset.val
                                    : quotaModalData.currentLimit > 0
                                    ? quotaModalData.currentLimit + preset.add
                                    : 30000;
                                const isSelected = quotaModalData.newLimit === targetVal;
                                return (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      soundService.play('click');
                                      setQuotaModalData((prev) =>
                                        prev ? { ...prev, newLimit: targetVal } : null
                                      );
                                    }}
                                    className={cn(
                                      'py-2 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer text-center',
                                      isSelected
                                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                        : 'bg-card hover:bg-muted text-foreground border-border hover:border-primary/40'
                                    )}
                                  >
                                    {preset.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                নির্দিষ্ট কাস্টম দৈনিক কোটা লিমিট (Custom Daily Limit in Ops)
                              </label>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                (-1 = Unlimited Ops)
                              </span>
                            </div>
                            <div className="relative">
                              <input
                                type="number"
                                value={quotaModalData.newLimit}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value, 10) || 0;
                                  setQuotaModalData((prev) => (prev ? { ...prev, newLimit: val } : null));
                                }}
                                className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-lg px-3.5 py-2 text-sm font-mono font-bold text-foreground outline-none transition-colors"
                                placeholder="e.g. 30000"
                              />
                              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                                Ops / দিন
                              </span>
                            </div>
                          </div>

                          <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">পূর্ববর্তী সীমা:</span>
                              <span className="font-mono font-semibold text-foreground">
                                {quotaModalData.currentLimit === -1
                                  ? 'Unlimited'
                                  : `${quotaModalData.currentLimit.toLocaleString()} Ops`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">কোটা বৃদ্ধি (Net Added):</span>
                              <span className="font-mono font-semibold text-primary">
                                {diffOps === 'Unlimited'
                                  ? 'Full Unlimited Ceiling'
                                  : `+${diffOps.toLocaleString()} Ops`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between pt-1.5 border-t border-border">
                              <span className="font-bold text-foreground">অনুমোদনের পর নতুন লিমিট:</span>
                              <span className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                                {quotaModalData.newLimit === -1
                                  ? '∞ Unlimited Ops'
                                  : `${quotaModalData.newLimit.toLocaleString()} Ops`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <label className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-start gap-3 cursor-pointer hover:bg-muted/30 transition-colors">
                          <input
                            type="checkbox"
                            checked={quotaModalData.resetUsage}
                            onChange={(e) => {
                              soundService.play('click');
                              setQuotaModalData((prev) =>
                                prev ? { ...prev, resetUsage: e.target.checked } : null
                              );
                            }}
                            className="mt-0.5 w-4 h-4 rounded text-primary bg-card border-border focus:ring-primary/20 cursor-pointer"
                          />
                          <div className="text-xs space-y-0.5">
                            <span className="font-bold text-foreground block">
                              আজকের ব্যবহৃত কাউন্টারও ০-তে রিসেট করুন (Reset today&apos;s used count to 0 Ops)
                            </span>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              {quotaModalData.resetUsage
                                ? `টিক দেওয়া আছে: আজ ব্যবহৃত ${quotaModalData.currentUsed.toLocaleString()} Ops মুছে দিয়ে নতুন লিমিটের পুরো কোটা ০ থেকে শুরু করা হবে।`
                                : `টিক দেওয়া নেই (প্রস্তাবিত): আজ ইতোমধ্যে ব্যবহৃত ${quotaModalData.currentUsed.toLocaleString()} Ops বহাল থাকবে।`}
                            </p>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-border bg-card/90 shrink-0">
                    <div className="text-xs text-muted-foreground font-mono w-full sm:w-auto text-left">
                      নতুন অনুমোদিত দৈনিক সীমা:{' '}
                      <span className="font-bold text-foreground">
                        {quotaModalData.newLimit === -1
                          ? 'Unlimited Ops'
                          : `${quotaModalData.newLimit.toLocaleString()} Ops`}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <button
                        type="button"
                        disabled={isSavingQuotaApproval}
                        onClick={() => setQuotaModalData(null)}
                        className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        বাতিল করুন (Cancel)
                      </button>

                      <button
                        type="button"
                        disabled={isSavingQuotaApproval}
                        onClick={handleConfirmQuotaApproval}
                        className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        {isSavingQuotaApproval ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>অনুমোদন হচ্ছে...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>অনুমোদন ও কোটা কার্যকর করুন (Approve &amp; Increase)</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })()}
      </AnimatePresence>
    </div>
  );
};
