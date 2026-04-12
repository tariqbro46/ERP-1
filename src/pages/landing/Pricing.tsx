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
  Globe
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
        
        // Check if Platinum plan exists, if not, we'll handle it in the UI or seed it
        const hasPlatinum = data.some(p => p.name.toLowerCase() === 'platinum');
        
        if (!hasPlatinum) {
          // We could seed it here, but for now let's just ensure it's in the list for display
          // The user asked to add it to the app, so seeding is appropriate
          const platinumPlan: Omit<SubscriptionPlan, 'id'> = {
            name: 'Platinum',
            description: 'Customized limits and features tailored to your business needs.',
            priceMonthly: 0,
            priceYearly: 0,
            features: ['inv', 'payroll', 'production', 'insights', 'notifications', 'notes', 'search'],
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
              {plans.sort((a, b) => (a.priceMonthly || 0) - (b.priceMonthly || 0)).map((plan, i) => {
                const isPlatinum = plan.name.toLowerCase() === 'platinum';
                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
                
                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                      "relative p-8 rounded-3xl border flex flex-col transition-all hover:shadow-2xl",
                      isPlatinum 
                        ? "bg-foreground text-background border-foreground shadow-xl scale-105 z-10" 
                        : "bg-card border-border text-foreground"
                    )}
                  >
                    {isPlatinum && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-1 rounded-full">
                        Most Flexible
                      </div>
                    )}

                    <div className="mb-8">
                      <h3 className="text-2xl font-bold mb-2 uppercase tracking-tight">{plan.name}</h3>
                      <p className={cn("text-sm leading-relaxed", isPlatinum ? "text-background/70" : "text-muted-foreground")}>
                        {plan.description}
                      </p>
                    </div>

                    <div className="mb-8">
                      {isPlatinum ? (
                        <div className="text-3xl font-bold tracking-tighter">Custom Pricing</div>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold tracking-tighter">৳{price}</span>
                          <span className={cn("text-sm font-medium", isPlatinum ? "text-background/60" : "text-muted-foreground")}>
                            /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-4 mb-8">
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", isPlatinum ? "text-background/50" : "text-muted-foreground")}>
                        What's included:
                      </p>
                      <ul className="space-y-3">
                        {plan.features.map((fId) => {
                          const Icon = getFeatureIcon(fId);
                          return (
                            <li key={fId} className="flex items-center gap-3 text-sm">
                              <div className={cn("w-5 h-5 rounded-full flex items-center justify-center", isPlatinum ? "bg-background/10" : "bg-foreground/5")}>
                                <Icon className="w-3 h-3" />
                              </div>
                              <span className="capitalize">{fId.replace('_', ' ')}</span>
                            </li>
                          );
                        })}
                        <li className="flex items-center gap-3 text-sm">
                          <Check className={cn("w-4 h-4", isPlatinum ? "text-emerald-400" : "text-emerald-500")} />
                          <span>{plan.limits.vouchers === -1 ? 'Unlimited' : plan.limits.vouchers} Vouchers</span>
                        </li>
                        <li className="flex items-center gap-3 text-sm">
                          <Check className={cn("w-4 h-4", isPlatinum ? "text-emerald-400" : "text-emerald-500")} />
                          <span>{plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Users</span>
                        </li>
                      </ul>
                    </div>

                    {isPlatinum ? (
                      <Link
                        to="/contact"
                        className="w-full py-4 bg-background text-foreground rounded-2xl font-bold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Contact Sales
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className="w-full py-4 bg-foreground text-background rounded-2xl font-bold text-center hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
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
