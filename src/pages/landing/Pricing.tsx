import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  Check, 
  ArrowRight,
  MessageSquare,
  Shield,
  Zap,
  Users,
  Database,
  FileText,
  Printer,
  Globe,
  Settings
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { erpService } from '../../services/erpService';
import { SubscriptionPlan } from '../../types';
import { cn } from '../../lib/utils';

export const Pricing = () => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await erpService.getSubscriptionPlans();
        
        // Check if Platinum plan exists by tier or name
        const hasPlatinum = data.some(p => p.tier === 4 || p.name.toLowerCase() === 'platinum');
        
        if (!hasPlatinum && data.length > 0) {
          const platinumPlan: Omit<SubscriptionPlan, 'id'> = {
            name: 'Platinum',
            tier: 4,
            description: 'Customized limits and features tailored to your business needs.',
            priceMonthly: 0,
            priceYearly: 0,
            features: ['inv', 'payroll', 'production', 'insights', 'notifications', 'notes', 'search', 'ui_custom', 'report_layout', 'whatsapp_temp'],
            supportType: 'Dedicated Manager',
            supportHours: '24/7',
            trainingIncluded: true,
            customReports: true,
            apiAccess: true,
            setupFee: 0,
            customDomain: true,
            limits: {
              vouchers: -1,
              items: -1,
              ledgers: -1,
              users: -1,
              godowns: -1,
              multiCurrency: true,
              rolePermissions: true
            },
            createdAt: new Date()
          };
          await erpService.createSubscriptionPlan(platinumPlan);
          const updatedData = await erpService.getSubscriptionPlans();
          setPlans(updatedData);
        } else {
          setPlans(data);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case 'inv': return Database;
      case 'payroll': return Users;
      case 'production': return Printer;
      case 'insights': return Zap;
      case 'notifications': return Shield;
      case 'notes': return FileText;
      case 'search': return Globe;
      case 'ui_custom': return Settings;
      case 'report_layout': return FileText;
      case 'whatsapp_temp': return MessageSquare;
      default: return Check;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6 text-foreground">
                Simple, Transparent Pricing
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                Choose the plan that's right for your business. All plans include our core ERP features.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-4 mb-12">
                <span className={cn("text-sm font-bold uppercase tracking-widest", billingCycle === 'monthly' ? "text-foreground" : "text-muted-foreground")}>Monthly</span>
                <button 
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-14 h-7 bg-foreground/10 rounded-full relative p-1 transition-colors hover:bg-foreground/20"
                >
                  <div className={cn(
                    "w-5 h-5 bg-foreground rounded-full transition-all shadow-sm",
                    billingCycle === 'yearly' ? "translate-x-7" : "translate-x-0"
                  )} />
                </button>
                <span className={cn("text-sm font-bold uppercase tracking-widest", billingCycle === 'yearly' ? "text-foreground" : "text-muted-foreground")}>
                  Yearly <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full ml-1">Save 20%</span>
                </span>
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-foreground"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {plans.sort((a, b) => (a.tier || 0) - (b.tier || 0)).map((plan, i) => {
                const isPlatinum = plan.tier === 4;
                const isGold = plan.tier === 3;
                const isSilver = plan.tier === 2;
                const isBronze = plan.tier === 1;

                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                const discount = plan.discount;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                      "relative p-8 rounded-3xl border flex flex-col transition-all hover:shadow-2xl",
                      isBronze && "bg-white border-slate-200 text-slate-900",
                      isSilver && "bg-slate-50 border-slate-300 text-slate-900 shadow-sm",
                      isGold && "bg-amber-50 border-amber-200 text-amber-900 shadow-md",
                      isPlatinum && "bg-blue-600 border-blue-500 text-white shadow-xl scale-105 z-10"
                    )}
                  >
                    {isPlatinum && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-blue-600 text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                        Most Flexible
                      </div>
                    )}

                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-2xl font-bold uppercase tracking-tight">{plan.name}</h3>
                        {discount && discount.value > 0 && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
                            isPlatinum ? "bg-white/20 text-white" : "bg-emerald-500/10 text-emerald-600"
                          )}>
                            {discount.type === 'percentage' ? `${discount.value}% OFF` : `৳${discount.value} OFF`}
                          </span>
                        )}
                      </div>
                      <p className={cn("text-sm leading-relaxed opacity-70")}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-8">
                      {isPlatinum ? (
                        <div className="text-3xl font-bold tracking-tighter">Custom Pricing</div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold tracking-tighter">৳{price}</span>
                            <span className="text-sm font-medium opacity-60">
                              /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          {discount && discount.value > 0 && (
                            <p className="text-xs line-through opacity-40 mt-1">
                              ৳{billingCycle === 'monthly' ? plan.priceMonthly + (discount.type === 'percentage' ? (plan.priceMonthly * discount.value / 100) : discount.value) : plan.priceYearly + (discount.type === 'percentage' ? (plan.priceYearly * discount.value / 100) : discount.value)}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                        What's included:
                      </p>
                      <ul className="space-y-3">
                        <li className="flex items-center gap-3 text-sm">
                          <Check className={cn("w-4 h-4", isPlatinum ? "text-white" : "text-emerald-500")} />
                          <span>{plan.limits.vouchers === -1 ? 'Unlimited' : plan.limits.vouchers} Vouchers</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Check className={cn("w-4 h-4", isPlatinum ? "text-white" : "text-emerald-500")} />
                          <span>{plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Users</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Check className={cn("w-4 h-4", isPlatinum ? "text-white" : "text-emerald-500")} />
                          <span>{plan.supportType || 'Email'} Support ({plan.supportHours || '24/7'})</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Check className={cn("w-4 h-4", isPlatinum ? "text-white" : "text-emerald-500")} />
                          <span>{plan.setupFee && plan.setupFee > 0 ? `Setup Fee: ৳${plan.setupFee}` : 'Free Setup'}</span>
                        </li>
                        {plan.customDomain && (
                          <li className="flex items-center gap-3 text-sm">
                            <Check className={cn("w-4 h-4", isPlatinum ? "text-white" : "text-emerald-500")} />
                            <span>Custom Domain Supported</span>
                          </li>
                        )}
                        {plan.features.slice(0, 6).map((fId) => {
                          const Icon = getFeatureIcon(fId);
                          return (
                            <li key={fId} className="flex items-center gap-3 text-sm">
                              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isPlatinum ? "bg-white/10" : "bg-black/5")}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="capitalize">{fId.replace('_', ' ')}</span>
                            </li>
                          );
                        })}
                        {plan.features.length > 6 && (
                          <li className="text-[10px] font-bold uppercase tracking-widest opacity-40 pl-8">
                            + {plan.features.length - 6} more features
                          </li>
                        )}
                      </ul>
                    </div>

                    {isPlatinum ? (
                      <Link
                        to="/contact"
                        className="w-full py-4 bg-white text-blue-600 rounded-2xl font-bold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Contact Sales
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className={cn(
                          "w-full py-4 rounded-2xl font-bold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2",
                          isBronze ? "bg-slate-900 text-white" : 
                          isSilver ? "bg-slate-800 text-white" :
                          "bg-amber-600 text-white"
                        )}
                      >
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Comparison Section */}
          <div className="mt-32 text-center">
            <h2 className="text-3xl font-bold mb-12">Compare Plans</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-6 px-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">Features</th>
                    {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map(plan => (
                      <th key={plan.id} className="py-6 px-4 text-center text-sm font-bold uppercase tracking-widest">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-6 px-4 text-sm font-medium">Monthly Price</td>
                    {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map(plan => (
                      <td key={plan.id} className="py-6 px-4 text-center font-bold">
                        {plan.name.toLowerCase() === 'platinum' ? 'Custom' : `৳${plan.priceMonthly}`}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-6 px-4 text-sm font-medium">Vouchers Limit</td>
                    {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map(plan => (
                      <td key={plan.id} className="py-6 px-4 text-center text-sm">
                        {plan.limits.vouchers === -1 ? 'Unlimited' : plan.limits.vouchers}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-6 px-4 text-sm font-medium">User Limit</td>
                    {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map(plan => (
                      <td key={plan.id} className="py-6 px-4 text-center text-sm">
                        {plan.limits.users === -1 ? 'Unlimited' : plan.limits.users}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-6 px-4 text-sm font-medium">Multi-Currency</td>
                    {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map(plan => (
                      <td key={plan.id} className="py-6 px-4 text-center">
                        {plan.limits.multiCurrency ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : '-'}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-6 px-4 text-sm font-medium">Role Permissions</td>
                    {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map(plan => (
                      <td key={plan.id} className="py-6 px-4 text-center">
                        {plan.limits.rolePermissions ? <Check className="w-5 h-5 text-emerald-500 mx-auto" /> : '-'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
