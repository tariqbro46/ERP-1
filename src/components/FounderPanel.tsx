import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Building2,
  CreditCard,
  Globe,
  Palette,
  RefreshCw,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { soundService } from '../services/soundService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { AppNotification, SubscriptionPlan } from '../types';
import { cn } from '../lib/utils';
import { AuditTrailDetailView } from './AuditTrailDetailView';
import { FounderAppBrandingView } from './founder/FounderAppBrandingView';
import { FounderBillingView } from './founder/FounderBillingView';
import { FounderHeroAndCmsView } from './founder/FounderHeroAndCmsView';
import { FounderObservabilityView } from './founder/FounderObservabilityView';
import { FounderSystemSettingsView } from './founder/FounderSystemSettingsView';
import { FounderTenantsView } from './founder/FounderTenantsView';
import { FounderUsersView } from './founder/FounderUsersView';
import { CompanyStats, FounderMainView, QuotaModalData } from './founder/types';

export default function FounderPanel() {
  const { uiStyle, appIdentity } = useSettings();
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const isSuperAdmin =
    currentUser?.role === 'Founder' ||
    currentUser?.email?.toLowerCase() === 'sapientman46@gmail.com';

  const [activeView, setActiveView] = useState<FounderMainView>('tenants');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Shared directory state (fetched once on load, shared across modular views to save quota)
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState<any[]>([]);
  const [quotaRequests, setQuotaRequests] = useState<any[]>([]);

  // Cross-view interaction state
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null);
  const [quotaModalData, setQuotaModalData] = useState<QuotaModalData | null>(null);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState(false);

  // Unsaved draft protection across stateful settings views
  const [dirtyViews, setDirtyViews] = useState<Partial<Record<FounderMainView, boolean>>>({});
  const [pendingViewSwitch, setPendingViewSwitch] = useState<FounderMainView | null>(null);

  const setViewDirty = useCallback((view: FounderMainView, dirty: boolean) => {
    setDirtyViews((prev) => {
      if (Boolean(prev[view]) === dirty) return prev;
      return { ...prev, [view]: dirty };
    });
  }, []);

  const handleHeroCmsDirty = useCallback(
    (dirty: boolean) => setViewDirty('heroCms', dirty),
    [setViewDirty]
  );
  const handleSystemDirty = useCallback(
    (dirty: boolean) => setViewDirty('system', dirty),
    [setViewDirty]
  );
  const handleAppBrandingDirty = useCallback(
    (dirty: boolean) => setViewDirty('appBranding', dirty),
    [setViewDirty]
  );

  const fetchData = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      try {
        const [
          companiesSnap,
          usersSnap,
          notificationsData,
          activityData,
          plansData,
          ordersData,
          quotaRequestsData,
        ] = await Promise.all([
          erpService.getAllCompanies(),
          erpService.getAllUsers(),
          erpService.getNotifications(currentUser?.uid || '', currentUser?.companyId || '', true),
          erpService.getActivityLogs(),
          erpService.getSubscriptionPlans(),
          erpService.getSubscriptionOrders(),
          erpService.getQuotaResetRequests(),
        ]);

        setAllUsers(usersSnap || []);
        setNotifications(notificationsData || []);
        setGlobalActivity(activityData || []);
        setSubscriptionPlans(plansData || []);
        setSubscriptionOrders(ordersData || []);
        setQuotaRequests(quotaRequestsData || []);

        const companyData = await Promise.all(
          (companiesSnap || []).map(async (data) => {
            const creatorId = data.createdBy || data.ownerId;
            let creatorEmail = 'Unknown';
            if (creatorId) {
              const creatorUser = (usersSnap || []).find((u: any) => u.uid === creatorId);
              if (creatorUser?.email) {
                creatorEmail = creatorUser.email;
              }
            }

            const userCount = (usersSnap || []).filter((u: any) => u.companyId === data.id).length;

            const [vCount, lCount, iCount, lastActData] = await Promise.all([
              erpService.getCollectionCount('vouchers', data.id),
              erpService.getCollectionCount('ledgers', data.id),
              erpService.getCollectionCount('items', data.id),
              erpService.getActivityLogs(data.id, 1),
            ]);

            return {
              ...data,
              userCount,
              voucherCount: vCount,
              ledgerCount: lCount,
              itemCount: iCount,
              lastActivity: lastActData?.[0],
              creatorEmail,
            } as CompanyStats;
          })
        );

        setCompanies(companyData);
        if (selectedCompany) {
          const updatedSelected = companyData.find((c) => c.id === selectedCompany.id);
          if (updatedSelected) {
            setSelectedCompany(updatedSelected);
          }
        }
      } catch (error) {
        console.error('Error fetching Founder Panel directory:', error);
        showNotification('Failed to load Founder directory data', 'error');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentUser?.uid, currentUser?.companyId, showNotification]
  );

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData(false);
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const handleRefresh = useCallback(async () => {
    soundService.play('click');
    await fetchData(true);
  }, [fetchData]);

  const handleSwitchCompany = useCallback(
    async (companyId: string) => {
      if (!currentUser?.uid) return;
      try {
        setRefreshing(true);
        await erpService.switchCompany(currentUser.uid, companyId);
        soundService.play('success');
        showNotification('Active workspace switched successfully', 'success');
      } catch (error) {
        console.error('Error switching company:', error);
        showNotification('Failed to switch company', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [currentUser?.uid, showNotification]
  );

  const handleDeleteCompany = useCallback(
    async (companyId: string) => {
      try {
        setRefreshing(true);
        await erpService.deleteCompany(companyId);

        const remainingCompanies = companies.filter((c) => c.id !== companyId);
        setCompanies(remainingCompanies);
        setSelectedCompany((prev) => (prev?.id === companyId ? null : prev));

        if (currentUser?.companyId === companyId && currentUser?.uid) {
          if (remainingCompanies.length > 0) {
            await erpService.switchCompany(currentUser.uid, remainingCompanies[0].id);
          } else {
            await erpService.switchCompany(currentUser.uid, 'placeholder');
          }
        }
        soundService.play('delete');
        showNotification('Company and associated records deleted', 'success');
      } catch (error) {
        console.error('Error deleting company:', error);
        showNotification('Failed to delete company', 'error');
      } finally {
        setRefreshing(false);
      }
    },
    [companies, currentUser?.companyId, currentUser?.uid, showNotification]
  );

  const requestViewSwitch = useCallback(
    (target: FounderMainView) => {
      if (target === activeView) return;
      soundService.play('click');
      if (dirtyViews[activeView]) {
        setPendingViewSwitch(target);
        return;
      }
      setActiveView(target);
    },
    [activeView, dirtyViews]
  );

  const handleOpenQuotaModalFromTelemetry = useCallback(
    (company: CompanyStats) => {
      const pendingReq = quotaRequests.find(
        (r) => r.companyId === company.id && r.status === 'pending'
      );
      const currentLimit = company.quotaLimit ?? 40000;
      const currentUsed = company.quotaUsed ?? 0;
      const newLimit = currentLimit === -1 ? -1 : currentLimit + 10000;

      setQuotaModalData({
        isOpen: true,
        requestId: pendingReq?.id,
        companyId: company.id,
        companyName: company.name,
        requestedBy: pendingReq?.requestedBy,
        requestedByEmail: pendingReq?.requestedByEmail,
        currentLimit,
        currentUsed,
        newLimit,
        resetUsage: false,
      });

      if (dirtyViews[activeView]) {
        setPendingViewSwitch('tenants');
      } else {
        setActiveView('tenants');
      }
    },
    [quotaRequests, dirtyViews, activeView]
  );

  const handleSelectCompanyFromUsers = useCallback(
    (company: CompanyStats) => {
      setSelectedCompany(company);
      requestViewSwitch('tenants');
    },
    [requestViewSwitch]
  );

  const pendingQuotaCount = useMemo(
    () => quotaRequests.filter((r) => r.status === 'pending').length,
    [quotaRequests]
  );

  const pendingOrderCount = useMemo(
    () => subscriptionOrders.filter((o) => o.status === 'pending').length,
    [subscriptionOrders]
  );

  const navTabs: Array<{
    id: FounderMainView;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeTone?: 'amber' | 'rose';
    accent?: boolean;
  }> = [
    {
      id: 'tenants',
      label: 'Tenants',
      icon: Building2,
      badge: pendingQuotaCount > 0 ? pendingQuotaCount : undefined,
      badgeTone: 'rose',
    },
    { id: 'users', label: 'Users', icon: Users },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      badge: pendingOrderCount > 0 ? pendingOrderCount : undefined,
      badgeTone: 'amber',
    },
    { id: 'observability', label: 'Observability', icon: Activity },
    { id: 'heroCms', label: 'Hero & CMS', icon: Globe },
    { id: 'system', label: 'System Settings', icon: Settings },
    {
      id: 'appBranding',
      label: 'App Identity & Branding',
      icon: Palette,
      accent: true,
    },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
        <Activity className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">
            Access Denied
          </h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
            The Founder Panel is restricted to system administrators only.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col min-h-full transition-colors',
        uiStyle === 'UI/UX 2' && 'bg-slate-50'
      )}
    >
      {/* Fixed / Sticky Header Bar */}
      <div
        className={cn(
          'sticky top-0 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm px-4 lg:px-6 py-3.5 z-40',
          uiStyle === 'UI/UX 2' && 'bg-white/90 border-blue-100 shadow-blue-500/5'
        )}
      >
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center border',
                  uiStyle === 'UI/UX 2'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-primary/10 text-primary border-primary/20'
                )}
              >
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-black uppercase tracking-widest text-foreground">
                    Founder Control Plane
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-widest">
                    {appIdentity.appName}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-medium">
                  Multi-tenant governance, RBAC directory, billing plans, telemetry &amp; global app identity
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {dirtyViews[activeView] && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 text-[10px] font-bold uppercase tracking-widest">
                  <AlertTriangle className="w-3 h-3" />
                  Unsaved Draft
                </span>
              )}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className={cn(
                  'inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-widest transition-all',
                  uiStyle === 'UI/UX 2'
                    ? 'bg-white border-blue-200 text-blue-700 hover:bg-blue-50'
                    : 'bg-card border-border text-foreground hover:bg-muted',
                  refreshing && 'opacity-60 cursor-wait'
                )}
              >
                <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
                {refreshing ? 'Refreshing...' : 'Refresh Directory'}
              </button>
            </div>
          </div>

          {/* 6 Modular Views + Dedicated App Identity & Branding Tab */}
          <nav
            aria-label="Founder Panel Views"
            className={cn(
              'flex flex-wrap items-center gap-1.5 p-1 rounded-xl border',
              uiStyle === 'UI/UX 2' ? 'bg-blue-50/80 border-blue-100' : 'bg-muted/60 border-border'
            )}
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeView === tab.id;
              const isDirtyTab = Boolean(dirtyViews[tab.id]);

              return (
                <button
                  key={tab.id}
                  onClick={() => requestViewSwitch(tab.id)}
                  className={cn(
                    'relative inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap',
                    isActive
                      ? uiStyle === 'UI/UX 2'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : tab.accent
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-background text-foreground shadow-sm border border-border/60'
                      : uiStyle === 'UI/UX 2'
                        ? 'text-blue-600/80 hover:text-blue-700 hover:bg-white/70'
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {isDirtyTab && (
                    <span
                      title="Unsaved changes"
                      className="w-2 h-2 rounded-full bg-amber-400 ring-2 ring-amber-400/30"
                    />
                  )}
                  {tab.badge !== undefined && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded-full text-[9px] font-black leading-none',
                        tab.badgeTone === 'rose'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      )}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Scrollable Active View Content */}
      <div className="flex-1 p-4 lg:p-6">
        {activeView === 'tenants' && (
          <FounderTenantsView
            companies={companies}
            setCompanies={setCompanies}
            allUsers={allUsers}
            quotaRequests={quotaRequests}
            subscriptionPlans={subscriptionPlans}
            currentUser={currentUser}
            selectedCompany={selectedCompany}
            setSelectedCompany={setSelectedCompany}
            quotaModalData={quotaModalData}
            setQuotaModalData={setQuotaModalData}
            onSwitchCompany={handleSwitchCompany}
            onDeleteCompany={handleDeleteCompany}
            onRefresh={handleRefresh}
            showNotification={showNotification}
          />
        )}

        {activeView === 'users' && (
          <FounderUsersView
            allUsers={allUsers}
            setAllUsers={setAllUsers}
            companies={companies}
            currentUser={currentUser}
            onSwitchCompany={handleSwitchCompany}
            onSelectCompany={handleSelectCompanyFromUsers}
            onDeleteCompany={handleDeleteCompany}
            onRefresh={handleRefresh}
            showNotification={showNotification}
          />
        )}

        {activeView === 'billing' && (
          <FounderBillingView
            subscriptionPlans={subscriptionPlans}
            subscriptionOrders={subscriptionOrders}
            currentUser={currentUser}
            onRefresh={handleRefresh}
            showNotification={showNotification}
          />
        )}

        {activeView === 'observability' && (
          <FounderObservabilityView
            globalActivity={globalActivity}
            companies={companies}
            allUsers={allUsers}
            quotaRequests={quotaRequests}
            onOpenAuditTrail={() => setIsAuditTrailOpen(true)}
            onOpenQuotaModal={handleOpenQuotaModalFromTelemetry}
            showNotification={showNotification}
          />
        )}

        {activeView === 'heroCms' && (
          <FounderHeroAndCmsView
            notifications={notifications}
            companies={companies}
            allUsers={allUsers}
            currentUser={currentUser}
            onRefresh={handleRefresh}
            onDirtyChange={handleHeroCmsDirty}
            showNotification={showNotification}
          />
        )}

        {activeView === 'system' && (
          <FounderSystemSettingsView
            currentUser={currentUser}
            onDirtyChange={handleSystemDirty}
            onNavigateAppBranding={() => requestViewSwitch('appBranding')}
            showNotification={showNotification}
          />
        )}

        {activeView === 'appBranding' && (
          <FounderAppBrandingView
            onDirtyChange={handleAppBrandingDirty}
            showNotification={showNotification}
          />
        )}
      </div>

      {/* Audit Trail Modal */}
      <AuditTrailDetailView
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
      />

      {/* Unsaved Draft Protection Modal */}
      <AnimatePresence>
        {pendingViewSwitch && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-500">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h3 className="text-base font-black uppercase tracking-wider text-foreground">
                  Unsaved Draft Changes
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                You have unsaved edits in the current section. If you switch views now, your unsaved changes will be discarded.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setPendingViewSwitch(null)}
                  className="px-4 py-2 rounded-lg border border-border text-[10px] font-bold uppercase tracking-widest text-foreground hover:bg-muted transition-colors"
                >
                  Stay &amp; Keep Editing
                </button>
                <button
                  onClick={() => {
                    const target = pendingViewSwitch;
                    setViewDirty(activeView, false);
                    setPendingViewSwitch(null);
                    setActiveView(target);
                  }}
                  className="px-4 py-2 rounded-lg bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-sm"
                >
                  Discard &amp; Switch View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
