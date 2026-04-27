import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Check, 
  AlertCircle, 
  Calendar, 
  Clock, 
  CreditCard, 
  ArrowUpCircle, 
  History,
  Info,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ExternalLink,
  Zap,
  Star,
  Crown,
  Gem
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { erpService } from '../services/erpService';
import { SubscriptionPlan, SubscriptionOrder } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { AVAILABLE_FEATURES } from '../constants/features';

import { useLanguage } from '../contexts/LanguageContext';

export function SubscriptionPage() {
  const { company, user, isAdmin } = useAuth();
  const { subscriptionPlans, appFeatures } = useSettings();
  const { t } = useLanguage();
  const [orders, setOrders] = useState<SubscriptionOrder[]>([]);
  const [usageStats, setUsageStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (company?.id) {
      fetchOrders();
      fetchUsageStats();
    }
  }, [company?.id]);

  const fetchUsageStats = async () => {
    if (!company?.id) return;
    try {
      const stats = await Promise.all([
        erpService.getCollectionCount('vouchers', company.id),
        erpService.getCollectionCount('items', company.id),
        erpService.getCollectionCount('ledgers', company.id),
        erpService.getCollectionCount('users', company.id),
        erpService.getCollectionCount('godowns', company.id),
        erpService.getCollectionCount('employees', company.id)
      ]);

      setUsageStats({
        vouchers: stats[0],
        items: stats[1],
        ledgers: stats[2],
        users: stats[3],
        godowns: stats[4],
        employees: stats[5]
      });
    } catch (err) {
      console.error('Error fetching usage stats:', err);
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await erpService.getSubscriptionOrders(company!.id);
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateOrder = async () => {
    if (!selectedPlan || !company) return;

    try {
      setIsSubmitting(true);
      const orderData: any = {
        companyId: company.id,
        companyName: company.name,
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        planType: billingCycle,
        amount: billingCycle === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly,
        status: 'pending',
        requestedBy: user?.uid || 'unknown',
        requestedByName: user?.displayName || 'Unknown User',
        paymentMethod: 'Manual Transfer',
        notes: `Upgrade request to ${selectedPlan.name} (${billingCycle})`
      };

      await erpService.createSubscriptionOrder(orderData);
      showNotification('Subscription request submitted successfully. Our team will review it shortly.');
      setIsUpgradeModalOpen(false);
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      showNotification('Failed to submit subscription request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to cancel this pending request?')) return;
    
    try {
      await erpService.deleteSubscriptionOrder(orderId);
      showNotification('Request cancelled successfully');
      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      showNotification('Failed to cancel request', 'error');
    }
  };

  const safeFormat = (date: any, formatStr: string) => {
    try {
      if (!date) return 'N/A';
      // Handle Firestore Timestamp
      const d = (date as any)?.toDate ? (date as any).toDate() : (date instanceof Date ? date : new Date(date));
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const activePlan = subscriptionPlans.find(p => p.id === company?.planId);
  const currentTier = activePlan?.tier || 0;

  const getTierIcon = (tier: number) => {
    switch(tier) {
      case 1: return <Zap className="w-5 h-5 text-slate-400" />;
      case 2: return <Star className="w-5 h-5 text-blue-400" />;
      case 3: return <Crown className="w-5 h-5 text-amber-400" />;
      case 4: return <Gem className="w-5 h-5 text-indigo-400" />;
      default: return <Shield className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            {t('subscription.title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('subscription.subtitle')}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setIsUpgradeModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
          >
            <ArrowUpCircle className="w-4 h-4" />
            {t('subscription.upgradePlan')}
          </button>
        )}
      </div>

      {notification && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={cn(
            "p-4 rounded-xl flex items-center gap-3 text-sm font-medium shadow-lg",
            notification.type === 'success' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
          )}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {notification.message}
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-widest">{t('subscription.currentSubscription')}</h2>
              </div>
              <span className={cn(
                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                company?.subscriptionStatus === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                company?.subscriptionStatus === 'trial' ? "bg-amber-500/10 text-amber-500" :
                "bg-rose-500/10 text-rose-500"
              )}>
                {company?.subscriptionStatus === 'active' ? t('subscription.active') :
                 company?.subscriptionStatus === 'trial' ? t('subscription.trial') :
                 t('subscription.inactive')}
              </span>
            </div>
            
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="flex-1 space-y-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">
                        {activePlan?.name || t('subscription.freePlan')}
                      </h3>
                      {activePlan && getTierIcon(activePlan.tier)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {activePlan?.description || t('subscription.freePlanDesc')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('subscription.planType')}</p>
                      <p className="text-sm font-bold text-foreground uppercase">
                        {company?.planType === 'yearly' ? t('subscription.yearly') :
                         company?.planType === 'monthly' ? t('subscription.monthly') :
                         t('subscription.freePlan')}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('subscription.expiryDate')}</p>
                      <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                        <Calendar className="w-4 h-4 text-primary" />
                        {company?.expiryDate ? safeFormat(company.expiryDate, 'dd MMM yyyy') : t('subscription.noExpiry')}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('subscription.price')}</p>
                      <p className="text-sm font-bold text-foreground">
                        {company?.planType === 'yearly' ? activePlan?.priceYearly : activePlan?.priceMonthly || 0} ৳
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">/{company?.planType === 'yearly' ? t('subscription.yearly').slice(0,2) : t('subscription.monthly').slice(0,2)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('subscription.featuresIncluded')}</p>
                    <div className="space-y-6">
                      {appFeatures.map(category => {
                        const filteredFeatures = category.features.filter(f => activePlan?.features.includes(f.id));
                        if (filteredFeatures.length === 0) return null;
                        
                        return (
                          <div key={category.id} className="space-y-3">
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest border-b border-border/30 pb-1">{category.label}</p>
                            <div className="flex flex-wrap gap-2">
                              {filteredFeatures.map(feature => {
                                const limitText = activePlan?.featureLimits?.[feature.id];
                                return (
                                  <div 
                                    key={feature.id} 
                                    className="group relative px-3 py-1.5 bg-muted rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 border border-border/50 hover:border-primary/30 transition-all"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                                    <span>{feature.label}</span>
                                    {limitText && <span className="text-[9px] opacity-70">({limitText})</span>}
                                    
                                    {feature.description && (
                                      <div className="ml-1 opacity-40 hover:opacity-100 transition-opacity">
                                        <Info className="w-3 h-3 cursor-help" />
                                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-popover text-popover-foreground text-[9px] font-medium leading-relaxed rounded-lg shadow-xl border border-border opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-10">
                                          {feature.description}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <History className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold uppercase tracking-widest">{t('subscription.orderHistory')}</h2>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/30">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.orderId')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.plan')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.amount')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.status')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.date')}</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('subscription.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                        {t('subscription.loadingOrders')}
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground italic">
                        {t('subscription.noOrders')}
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <p className="text-xs font-mono text-muted-foreground">#{order.id.slice(-6).toUpperCase()}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-foreground uppercase">{order.planName}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">{order.planType}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-primary">{order.amount} ৳</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest",
                            order.status === 'approved' ? "bg-emerald-500/10 text-emerald-500" :
                            order.status === 'pending' ? "bg-amber-500/10 text-amber-500" :
                            "bg-rose-500/10 text-rose-500"
                          )}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-xs text-muted-foreground">{safeFormat(order.createdAt, 'dd MMM yyyy')}</p>
                        </td>
                        <td className="px-6 py-4">
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                              title={t('subscription.cancelRequest')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Usage Limits moved to sidebar */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              {t('subscription.usageLimits')}
            </h3>
            <div className="space-y-5">
              {[
                { label: t('common.vouchers'), key: 'vouchers' },
                { label: t('common.items'), key: 'items' },
                { label: t('common.ledgers'), key: 'ledgers' },
                { label: t('common.users'), key: 'users' },
                { label: t('common.godowns'), key: 'godowns' },
                { label: t('common.employees'), key: 'employees' }
              ].map(limit => {
                const customVal = company?.customLimits?.[limit.key];
                const planVal = activePlan?.limits?.[limit.key as keyof typeof activePlan.limits];
                const limitVal = customVal ?? planVal ?? 0;
                const currentVal = usageStats[limit.key] || 0;
                
                const percentage = limitVal === -1 ? 0 : Math.min(100, (currentVal / limitVal) * 100);
                const isNearLimit = limitVal !== -1 && percentage > 80;
                const isOverLimit = limitVal !== -1 && currentVal >= limitVal;

                return (
                  <div key={limit.key} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{limit.label}</p>
                        <p className={cn(
                          "text-xs font-mono font-bold",
                          isOverLimit ? "text-rose-500" : isNearLimit ? "text-amber-500" : "text-foreground"
                        )}>
                          {currentVal.toLocaleString()} 
                          <span className="text-[9px] text-muted-foreground font-normal ml-1">
                            / {limitVal === -1 ? '∞' : limitVal.toLocaleString()}
                          </span>
                        </p>
                      </div>
                      <span className={cn(
                        "text-[9px] font-black tracking-widest",
                        isOverLimit ? "text-rose-500" : isNearLimit ? "text-amber-500" : "text-emerald-500"
                      )}>
                        {limitVal === -1 ? t('subscription.unlimited') : `${Math.round(percentage)}%`}
                      </span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${limitVal === -1 ? 100 : percentage}%` }}
                        className={cn(
                          "h-full rounded-full transition-all",
                          limitVal === -1 ? "bg-primary" :
                          isOverLimit ? "bg-rose-500" :
                          isNearLimit ? "bg-amber-500" : "bg-emerald-500"
                        )}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {company?.subscriptionStatus === 'trial' && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[9px] text-amber-600 font-medium leading-tight">
                  {t('subscription.trialAlert')}
                </p>
              </div>
            )}
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
              <Info className="w-4 h-4" />
              {t('subscription.needHelp')}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t('subscription.needHelpDesc')}
            </p>
            <div className="space-y-2">
              <button className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                {t('subscription.contactSupport')}
              </button>
              <button className="w-full py-2.5 border border-primary/20 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/5 transition-all">
                {t('subscription.viewDocumentation')}
              </button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              {t('subscription.paymentMethods')}
            </h3>
            <p className="text-xs text-muted-foreground">
              {t('subscription.paymentMethodsDesc')}
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-1.5 bg-muted rounded-lg text-[9px] font-bold uppercase tracking-widest border border-border/50">bKash</div>
              <div className="px-3 py-1.5 bg-muted rounded-lg text-[9px] font-bold uppercase tracking-widest border border-border/50">Nagad</div>
              <div className="px-3 py-1.5 bg-muted rounded-lg text-[9px] font-bold uppercase tracking-widest border border-border/50">Bank Transfer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {isUpgradeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <ArrowUpCircle className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">{t('subscription.upgradeExperience')}</h2>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('subscription.choosePerfectPlan')}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsUpgradeModalOpen(false)}
                  className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar flex-1 space-y-10">
                {/* Billing Toggle */}
                <div className="flex justify-center">
                  <div className="bg-muted p-1 rounded-xl flex items-center gap-1">
                    <button
                      onClick={() => setBillingCycle('monthly')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                        billingCycle === 'monthly' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t('subscription.monthly')}
                    </button>
                    <button
                      onClick={() => setBillingCycle('yearly')}
                      className={cn(
                        "px-6 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all relative",
                        billingCycle === 'yearly' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {t('subscription.yearly')}
                      <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[7px] px-1.5 py-0.5 rounded-full font-black animate-bounce">
                        {t('subscription.savePercentage', { percent: 20 })}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subscriptionPlans.sort((a, b) => (a.tier || 0) - (b.tier || 0)).map((plan) => {
                    const isCurrent = plan.id === company?.planId;
                    const isSelected = selectedPlan?.id === plan.id;
                    const isLowerTier = (plan.tier || 0) < currentTier;

                    return (
                      <div 
                        key={plan.id}
                        onClick={() => !isCurrent && !isLowerTier && setSelectedPlan(plan)}
                        className={cn(
                          "relative group cursor-pointer border-2 rounded-3xl p-6 transition-all duration-300 flex flex-col",
                          isSelected ? "border-primary bg-primary/5 shadow-xl shadow-primary/10 scale-105" : "border-border bg-card hover:border-primary/50",
                          isCurrent && "opacity-60 cursor-default border-emerald-500/50",
                          isLowerTier && "opacity-40 cursor-not-allowed"
                        )}
                      >
                        {plan.tier === 3 && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            {t('subscription.mostPopular')}
                          </div>
                        )}
                        {isCurrent && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            {t('subscription.currentPlan')}
                          </div>
                        )}

                        <div className="mb-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black uppercase tracking-tighter text-foreground">{plan.name}</h3>
                            {getTierIcon(plan.tier || 1)}
                          </div>
                          <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">{plan.description}</p>
                        </div>

                        <div className="mb-8">
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-foreground">
                              {billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly} ৳
                            </span>
                            <span className="text-[10px] text-muted-foreground font-bold uppercase">/{billingCycle === 'monthly' ? t('subscription.monthly').slice(0,2) : t('subscription.yearly').slice(0,2)}</span>
                          </div>
                          {billingCycle === 'yearly' && plan.priceMonthly > 0 && (
                            <p className="text-[9px] text-emerald-500 font-bold mt-1">
                              {t('subscription.equivMo', { amount: (plan.priceYearly / 12).toFixed(0) })}
                            </p>
                          )}
                        </div>

                        <div className="flex-1 space-y-4 mb-8">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border pb-2">{t('subscription.whatsIncluded')}</p>
                          <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                            {appFeatures.map(category => {
                              const filteredFeatures = category.features.filter(f => plan.features.includes(f.id));
                              if (filteredFeatures.length === 0) return null;

                              return (
                                <div key={category.id} className="space-y-2">
                                  <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest opacity-50">{category.label}</p>
                                  <ul className="space-y-2">
                                    {filteredFeatures.map(feature => {
                                      const limitText = plan.featureLimits?.[feature.id];
                                      return (
                                        <li key={feature.id} className="flex items-start gap-2 text-[10px] font-medium text-foreground/80 group/feat relative">
                                          <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                                          <div className="flex flex-col">
                                            <div className="flex items-center gap-1.5 leading-tight">
                                              <span>{feature.label}</span>
                                              {feature.description && (
                                                <div className="relative inline-block opacity-40 hover:opacity-100 transition-opacity">
                                                  <Info className="w-2.5 h-2.5 cursor-help" />
                                                  <div className="absolute bottom-full left-0 mb-2 w-40 p-2 bg-popover text-popover-foreground text-[8px] font-normal leading-relaxed rounded shadow-xl border border-border opacity-0 group-hover/feat:opacity-100 pointer-events-none transition-all z-20">
                                                    {feature.description}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                            {limitText && <span className="text-[8px] mt-0.5 text-primary font-bold">({limitText})</span>}
                                          </div>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-auto">
                          <div className={cn(
                            "w-full py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all",
                            isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : 
                            isCurrent ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                            isLowerTier ? "bg-muted text-muted-foreground" :
                            "bg-muted text-foreground hover:bg-foreground/5"
                          )}>
                            {isCurrent ? t('subscription.currentPlan') : isLowerTier ? t('subscription.lowerTier') : isSelected ? t('subscription.selected') : t('subscription.selectPlan')}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Selected Plan Summary */}
                {selectedPlan && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-muted/30 border border-border rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-8"
                  >
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                        {getTierIcon(selectedPlan.tier || 1)}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-foreground uppercase tracking-tighter">
                          {t('subscription.upgradeTo', { plan: selectedPlan.name })}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {t('subscription.upgradeRequestDesc', { plan: selectedPlan.name, cycle: billingCycle })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-2">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('subscription.totalAmountDue')}</p>
                      <p className="text-3xl font-black text-primary">
                        {billingCycle === 'monthly' ? selectedPlan.priceMonthly : selectedPlan.priceYearly} ৳
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="p-8 border-t border-border bg-muted/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <AlertCircle className="w-5 h-5" />
                  <p className="text-[10px] font-medium leading-relaxed max-w-md">
                    {t('subscription.termsNotice')}
                  </p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <button
                    onClick={() => setIsUpgradeModalOpen(false)}
                    className="flex-1 sm:flex-none px-8 py-4 border border-border rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-card transition-all"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    disabled={!selectedPlan || isSubmitting}
                    onClick={handleCreateOrder}
                    className={cn(
                      "flex-1 sm:flex-none px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                      !selectedPlan || isSubmitting 
                        ? "bg-muted text-muted-foreground cursor-not-allowed" 
                        : "bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                    )}
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    {t('subscription.submitRequest')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
