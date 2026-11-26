import React, { useMemo, useState } from 'react';
import {
  Box,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Info,
  Mail,
  MapPin,
  Phone,
  Plus,
  Settings,
  Trash2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { erpService } from '../../services/erpService';
import { useSettings } from '../../contexts/SettingsContext';
import { AVAILABLE_FEATURES } from '../../constants/features';
import { SubscriptionPlan, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { safeFormatDate } from './types';

interface FounderBillingViewProps {
  subscriptionPlans: SubscriptionPlan[];
  subscriptionOrders: any[];
  currentUser: UserProfile | null;
  onRefresh: () => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const DEFAULT_PLAN_DRAFT: Partial<SubscriptionPlan> = {
  name: '',
  description: '',
  priceMonthly: 0,
  priceYearly: 0,
  features: [],
  tier: 1,
  discount: { type: 'percentage', value: 0 },
  supportType: 'Email',
  supportHours: '24/7',
  trainingIncluded: false,
  customReports: false,
  apiAccess: false,
  setupFee: 0,
  customDomain: false,
  featureLimits: {},
  limits: {
    vouchers: 100,
    items: 50,
    ledgers: 50,
    users: 1,
    godowns: 1,
    multiCurrency: false,
    rolePermissions: false,
  },
};

export const FounderBillingView: React.FC<FounderBillingViewProps> = ({
  subscriptionPlans,
  subscriptionOrders,
  currentUser,
  onRefresh,
  showNotification,
}) => {
  const { uiStyle, appFeatures } = useSettings();
  const [subTab, setSubTab] = useState<'plans' | 'orders'>('plans');
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<SubscriptionPlan>>(DEFAULT_PLAN_DRAFT);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const [orderAction, setOrderAction] = useState<{
    type: 'approve' | 'reject' | 'delete';
    order: any;
  } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);

  const pendingOrderCount = useMemo(
    () => subscriptionOrders.filter((o) => o.status === 'pending').length,
    [subscriptionOrders]
  );

  const toggleFeatureForPlan = (featureId: string) => {
    setCurrentPlan((prev) => {
      const features = prev.features || [];
      if (features.includes(featureId)) {
        return { ...prev, features: features.filter((f) => f !== featureId) };
      }
      return { ...prev, features: [...features, featureId] };
    });
  };

  const handleSavePlan = async () => {
    if (!currentPlan.name || !currentPlan.description) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    const planData = {
      ...currentPlan,
      tier: currentPlan.tier || 1,
      discount: currentPlan.discount || { type: 'percentage', value: 0 },
    } as Omit<SubscriptionPlan, 'id'>;

    try {
      if (currentPlan.id) {
        await erpService.updateSubscriptionPlan(currentPlan.id, planData);
        showNotification('Subscription plan updated successfully');
      } else {
        await erpService.createSubscriptionPlan(planData);
        showNotification('Subscription plan created successfully');
      }
      setIsEditingPlan(false);
      setCurrentPlan(DEFAULT_PLAN_DRAFT);
      onRefresh();
    } catch {
      showNotification('Failed to save subscription plan', 'error');
    }
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;
    try {
      await erpService.deleteSubscriptionPlan(planToDelete);
      showNotification('Subscription plan deleted successfully');
      setPlanToDelete(null);
      onRefresh();
    } catch {
      showNotification('Failed to delete subscription plan', 'error');
    }
  };

  const confirmOrderAction = async () => {
    if (!orderAction) return;
    const { type, order } = orderAction;
    setIsProcessingOrder(true);
    try {
      if (type === 'approve') {
        await erpService.updateSubscriptionOrder(order.id, { status: 'approved' });
        await erpService.updateCompanySubscription(order.companyId, {
          planId: order.planId,
          planType: order.planType,
          subscriptionStatus: 'active',
          expiryDate:
            order.planType === 'monthly'
              ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        });
        showNotification('Order approved and company plan updated');
      } else if (type === 'reject') {
        await erpService.updateSubscriptionOrder(order.id, {
          status: 'rejected',
          founderNotes: rejectionReason.trim(),
        });
        showNotification('Order rejected');
      } else if (type === 'delete') {
        await erpService.deleteSubscriptionOrder(order.id);
        showNotification('Order deleted');
      }
      setOrderAction(null);
      setRejectionReason('');
      await onRefresh();
    } catch {
      showNotification(`Failed to ${type} order`, 'error');
    } finally {
      setIsProcessingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Billing Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSubTab('plans')}
            className={cn(
              'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
              subTab === 'plans'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <CreditCard className="w-4 h-4" />
            Subscription Plans ({subscriptionPlans.length})
          </button>
          <button
            onClick={() => setSubTab('orders')}
            className={cn(
              'px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 transition-all',
              subTab === 'orders'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            <ClipboardList className="w-4 h-4" />
            Orders ({subscriptionOrders.length})
            {pendingOrderCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px]">
                {pendingOrderCount}
              </span>
            )}
          </button>
        </div>

        {subTab === 'plans' && (
          <button
            onClick={() => {
              setCurrentPlan(DEFAULT_PLAN_DRAFT);
              setIsEditingPlan(true);
            }}
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md',
              uiStyle === 'UI/UX 2'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-primary text-white hover:opacity-90'
            )}
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        )}
      </div>

      {subTab === 'plans' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...subscriptionPlans]
            .sort((a, b) => (a.tier || 0) - (b.tier || 0))
            .map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  'bg-card border border-border rounded-2xl p-6 space-y-4 transition-all hover:shadow-xl',
                  uiStyle === 'UI/UX 2' && 'border-blue-100',
                  plan.tier === 1 && 'border-slate-200 dark:border-slate-800',
                  plan.tier === 2 && 'border-slate-300 dark:border-slate-700',
                  plan.tier === 3 && 'border-amber-200 dark:border-amber-900/50',
                  plan.tier === 4 && 'border-blue-200 dark:border-blue-900/50'
                )}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-foreground">{plan.name}</h3>
                      <span className="text-[8px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full font-bold uppercase">
                        Tier {plan.tier}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setCurrentPlan(plan);
                        setIsEditingPlan(true);
                      }}
                      className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPlanToDelete(plan.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-border">
                  <div className="text-center">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Monthly</p>
                    <p className="text-xl font-bold text-primary">
                      {plan.priceMonthly} {currentUser?.companyId ? '৳' : '$'}
                    </p>
                  </div>
                  <div className="text-center border-l border-border">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Yearly</p>
                    <p className="text-xl font-bold text-primary">
                      {plan.priceYearly} {currentUser?.companyId ? '৳' : '$'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Features Included:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.map((fId) => {
                      const feature = AVAILABLE_FEATURES.find((af) => af.id === fId);
                      const limitText = plan.featureLimits?.[fId];
                      return (
                        <span
                          key={fId}
                          className="px-2 py-1 bg-muted rounded text-[9px] font-bold uppercase tracking-tighter flex items-center gap-1"
                        >
                          <Check className="w-3 h-3 text-primary" />
                          {feature?.label || fId}
                          {limitText && <span className="opacity-70 ml-1">({limitText})</span>}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                    Customer / Company
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                    Plan Details
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                    Amount
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                    Status
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                    Date &amp; Time
                  </th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {subscriptionOrders.length > 0 ? (
                  subscriptionOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="p-4 align-middle">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">{order.userName}</p>
                          <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                            {order.companyName}
                          </p>
                          <div className="flex flex-col gap-0.5 text-[9px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {order.userEmail}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {order.userPhone}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" /> {order.userAddress}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-foreground uppercase">{order.planName}</p>
                          <p className="text-[9px] text-muted-foreground uppercase font-bold">{order.planType}</p>
                          {order.notes && (
                            <p className="text-[9px] text-amber-600 italic mt-1 max-w-[200px] line-clamp-2">
                              &quot; {order.notes} &quot;
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="text-sm font-bold text-foreground">{order.amount} ৳</p>
                      </td>
                      <td className="p-4 align-middle">
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest',
                            order.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-500'
                              : order.status === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : order.status === 'rejected'
                              ? 'bg-rose-500/10 text-rose-500'
                              : 'bg-gray-500/10 text-gray-500'
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 align-middle">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          {safeFormatDate(order.createdAt, 'dd MMM yyyy, HH:mm')}
                        </p>
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex gap-2 items-center">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setOrderAction({ type: 'approve', order })}
                                className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setRejectionReason('');
                                  setOrderAction({ type: 'reject', order });
                                }}
                                className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setOrderAction({ type: 'delete', order })}
                            className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-12 text-center align-middle">
                      <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                      <p className="text-sm text-muted-foreground italic">No subscription orders found.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Plan Modal */}
      <AnimatePresence>
        {isEditingPlan && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  {currentPlan.id ? 'Edit Plan' : 'New Subscription Plan'}
                </h2>
                <button
                  onClick={() => setIsEditingPlan(false)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar text-foreground">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Plan Name
                    </label>
                    <input
                      type="text"
                      value={currentPlan.name || ''}
                      onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="e.g. Professional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Plan Tier (1-4)
                    </label>
                    <select
                      value={currentPlan.tier || 1}
                      onChange={(e) => setCurrentPlan({ ...currentPlan, tier: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value={1}>Tier 1: Bronze (Free)</option>
                      <option value={2}>Tier 2: Silver</option>
                      <option value={3}>Tier 3: Gold</option>
                      <option value={4}>Tier 4: Platinum</option>
                    </select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Description
                    </label>
                    <input
                      type="text"
                      value={currentPlan.description || ''}
                      onChange={(e) => setCurrentPlan({ ...currentPlan, description: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="Short description of the plan"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Monthly Price
                    </label>
                    <input
                      type="number"
                      value={currentPlan.priceMonthly || 0}
                      onChange={(e) =>
                        setCurrentPlan({ ...currentPlan, priceMonthly: Number(e.target.value) })
                      }
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Yearly Price
                    </label>
                    <input
                      type="number"
                      value={currentPlan.priceYearly || 0}
                      onChange={(e) =>
                        setCurrentPlan({ ...currentPlan, priceYearly: Number(e.target.value) })
                      }
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Discount Type
                    </label>
                    <select
                      value={currentPlan.discount?.type || 'percentage'}
                      onChange={(e) =>
                        setCurrentPlan({
                          ...currentPlan,
                          discount: {
                            type: e.target.value as 'percentage' | 'fixed',
                            value: currentPlan.discount?.value || 0,
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Fixed Amount (৳)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Discount Value
                    </label>
                    <input
                      type="number"
                      value={currentPlan.discount?.value || 0}
                      onChange={(e) =>
                        setCurrentPlan({
                          ...currentPlan,
                          discount: {
                            type: currentPlan.discount?.type || 'percentage',
                            value: Number(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Support Type
                    </label>
                    <select
                      value={currentPlan.supportType || 'Email'}
                      onChange={(e) => setCurrentPlan({ ...currentPlan, supportType: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="Email">Email</option>
                      <option value="Chat">Chat</option>
                      <option value="Phone">Phone</option>
                      <option value="Dedicated Manager">Dedicated Manager</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Support Hours
                    </label>
                    <input
                      type="text"
                      value={currentPlan.supportHours || ''}
                      onChange={(e) => setCurrentPlan({ ...currentPlan, supportHours: e.target.value })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="e.g. 24/7 or 9am-5pm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Setup Fee (৳)
                    </label>
                    <input
                      type="number"
                      value={currentPlan.setupFee || 0}
                      onChange={(e) => setCurrentPlan({ ...currentPlan, setupFee: Number(e.target.value) })}
                      className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2 md:col-span-2">
                    {[
                      { key: 'trainingIncluded', label: 'Training Included' },
                      { key: 'customReports', label: 'Custom Reports' },
                      { key: 'apiAccess', label: 'API Access' },
                      { key: 'customDomain', label: 'Custom Domain' },
                    ].map((opt) => (
                      <label key={opt.key} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean((currentPlan as any)[opt.key])}
                          onChange={(e) =>
                            setCurrentPlan({ ...currentPlan, [opt.key]: e.target.checked })
                          }
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">
                          {opt.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Plan Limits (-1 for Unlimited)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {(['vouchers', 'items', 'ledgers', 'users', 'godowns'] as const).map((k) => (
                      <div key={k} className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground">{k}</label>
                        <input
                          type="number"
                          value={(currentPlan.limits as any)?.[k] || 0}
                          onChange={(e) =>
                            setCurrentPlan({
                              ...currentPlan,
                              limits: { ...currentPlan.limits!, [k]: Number(e.target.value) },
                            })
                          }
                          className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-primary outline-none"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentPlan.limits?.multiCurrency || false}
                        onChange={(e) =>
                          setCurrentPlan({
                            ...currentPlan,
                            limits: { ...currentPlan.limits!, multiCurrency: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Multi-Currency
                      </span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentPlan.limits?.rolePermissions || false}
                        onChange={(e) =>
                          setCurrentPlan({
                            ...currentPlan,
                            limits: { ...currentPlan.limits!, rolePermissions: e.target.checked },
                          })
                        }
                        className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        Role Permissions
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                    Select Features
                  </label>
                  <div className="space-y-6">
                    {appFeatures.map((category) => (
                      <div key={category.id} className="space-y-3">
                        <p className="text-[9px] uppercase font-black text-muted-foreground/50 tracking-tighter border-b border-border/30 pb-1">
                          {category.label}
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {category.features.map((feature) => {
                            const isSelected = currentPlan.features?.includes(feature.id);
                            return (
                              <div key={feature.id} className="space-y-2">
                                <button
                                  type="button"
                                  onClick={() => toggleFeatureForPlan(feature.id)}
                                  className={cn(
                                    'w-full flex items-center gap-3 p-3 border rounded-xl transition-all text-left group relative',
                                    isSelected
                                      ? 'bg-primary/10 border-primary text-primary shadow-sm'
                                      : 'bg-background border-border text-muted-foreground hover:border-foreground'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                      isSelected
                                        ? 'bg-primary text-white'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                  >
                                    <Box className="w-4 h-4" />
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-[10px] font-bold uppercase tracking-widest break-words">
                                      {feature.label}
                                    </span>
                                    {feature.description && (
                                      <div className="flex items-center gap-1 opacity-40 hover:opacity-100 transition-opacity">
                                        <Info className="w-2.5 h-2.5" />
                                      </div>
                                    )}
                                  </div>
                                  {isSelected && <Check className="w-3 h-3 ml-auto" />}
                                </button>
                                {isSelected && (
                                  <input
                                    type="text"
                                    placeholder="Feature Limit Description"
                                    value={currentPlan.featureLimits?.[feature.id] || ''}
                                    onChange={(e) => {
                                      const newLimits = {
                                        ...(currentPlan.featureLimits || {}),
                                        [feature.id]: e.target.value,
                                      };
                                      setCurrentPlan({ ...currentPlan, featureLimits: newLimits });
                                    }}
                                    className="w-full bg-background border border-border rounded-lg p-2 text-[9px] focus:ring-1 focus:ring-primary outline-none"
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-border flex gap-4">
                <button
                  onClick={() => setIsEditingPlan(false)}
                  className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-muted transition-all text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePlan}
                  className="flex-1 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                >
                  Save Plan
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Plan Confirmation Modal */}
      <AnimatePresence>
        {planToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Delete Plan?</h2>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete this subscription plan? This action cannot be undone.
                </p>
              </div>
              <div className="p-6 border-t border-border flex gap-4">
                <button
                  onClick={() => setPlanToDelete(null)}
                  className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-muted transition-all text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeletePlan}
                  className="flex-1 py-3 bg-rose-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Order Action Modal (Replaces window.confirm/prompt) */}
      <AnimatePresence>
        {orderAction && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              <h3 className="text-base font-bold text-foreground">
                {orderAction.type === 'approve'
                  ? 'Approve Subscription Order?'
                  : orderAction.type === 'reject'
                  ? 'Reject Subscription Order'
                  : 'Delete Order Record?'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {orderAction.type === 'approve'
                  ? `Activate "${orderAction.order.planName}" (${orderAction.order.planType}) for ${orderAction.order.companyName}?`
                  : orderAction.type === 'reject'
                  ? `Provide an optional rejection note for ${orderAction.order.companyName}:`
                  : `Delete order record for ${orderAction.order.companyName}? This action cannot be undone.`}
              </p>
              {orderAction.type === 'reject' && (
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                />
              )}
              <div className="flex gap-3 pt-2">
                <button
                  disabled={isProcessingOrder}
                  onClick={() => setOrderAction(null)}
                  className="flex-1 py-2.5 border border-border rounded-lg text-[10px] font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={isProcessingOrder}
                  onClick={confirmOrderAction}
                  className={cn(
                    'flex-1 py-2.5 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50',
                    orderAction.type === 'approve' ? 'bg-emerald-600' : 'bg-rose-600'
                  )}
                >
                  {isProcessingOrder ? 'Processing...' : `Confirm ${orderAction.type}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
