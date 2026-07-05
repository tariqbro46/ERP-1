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
  Settings,
  X,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { erpService } from '../../services/erpService';
import { SubscriptionPlan } from '../../types';
import { cn } from '../../lib/utils';

export const Pricing = () => {
  const { t } = useLanguage();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<SubscriptionPlan | null>(null);

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

  const getFeatureLabel = (featureId: string) => {
    const labels: Record<string, string> = {
      inv: 'Multi-Godown Inventory Module',
      payroll: 'Workforce & Automated Payroll',
      production: 'Manufacturing & Line Control',
      insights: 'AI Business Intelligence Insights',
      notifications: 'Encrypted Alert Notifications',
      notes: 'Digital Executive Memorandums',
      search: 'Instant Global Registry Search',
      ui_custom: 'Dynamic Custom Layout Builder',
      report_layout: 'PDF Export Design Layouts',
      whatsapp_temp: 'WhatsApp Dispatch Templates',
    };
    return labels[featureId] || featureId.toUpperCase();
  };

  const getFeatureDesc = (featureId: string) => {
    const descs: Record<string, string> = {
      inv: 'Real-time stock registries tracking over multi-godown zones, transit states, and reordering thresholds automatically.',
      payroll: 'Complete HR automation carrying daily shifts, digital attendance, automatic salary calculations, and direct bank dispatch links.',
      production: 'End-to-end line production pipelines with integrated Bill of Materials (BOM), machine tracking registries, and operations control.',
      insights: 'AI-driven forecasting models visualizing cash flow trends, future stock deficits, and general operations audits instantly.',
      notifications: 'Encrypted dispatch warnings and critical thresholds alerting staff via secure SMS or WhatsApp alerts instantly.',
      notes: 'Integrated memo pads allowing logs, meeting transcripts, and board notes to sync back to central project ledgers.',
      search: 'High-speed global registry queries allowing staff to recall old vouchers, transaction, or customer details in milliseconds.',
      ui_custom: 'Visual layout engine allowing founders to customize executive print banners, staff drawers, and dashboard modules easily.',
      report_layout: 'High-fidelity PDF and Excel dispatch formats designed for formal vendor correspondence or internal auditing compliance.',
      whatsapp_temp: 'Direct CRM message triggers allowing immediate stock or invoice receipts to dispatch directly to buyer phone numbers.',
    };
    return descs[featureId] || 'Advanced enterprise operations system tool.';
  };

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

  const sortedPlans = [...plans].sort((a, b) => (a.tier || 0) - (b.tier || 0));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-blue-500/30">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] -z-10 pointer-events-none">
          <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[140px] opacity-80" />
          <div className="absolute top-24 right-1/4 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">FLEXIBLE MODELS</span>
              <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                Simple, Transparent Pricing
              </h1>
              <p className="text-base text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Choose the plan that's right for your business. All plans include our core ERP features.
              </p>

              <div className="inline-flex items-center justify-center gap-4 bg-slate-900 border border-slate-800 p-1.5 rounded-full shadow-inner select-none">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    billingCycle === 'monthly' ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                    billingCycle === 'yearly' ? "bg-slate-800 text-white shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  Yearly
                  <span className="text-[9px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/25">Save 20%</span>
                </button>
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {sortedPlans.map((plan, i) => {
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
                      "relative p-8 rounded-3xl border flex flex-col justify-between transition-all hover:scale-101",
                      isBronze && "bg-slate-900/30 border-slate-900 hover:border-slate-800",
                      isSilver && "bg-slate-900/40 border-slate-900 hover:border-slate-800 shadow-sm",
                      isGold && "bg-slate-900/50 border-amber-500/30 hover:border-amber-500/50 shadow-md",
                      isPlatinum && "bg-slate-900 border-blue-500/60 shadow-xl z-10"
                    )}
                  >
                    {isPlatinum && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg border border-blue-400/30">
                        Most Flexible
                      </div>
                    )}
                    {isGold && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-500/30">
                        Top Enterprise Value
                      </div>
                    )}

                    <div>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-black uppercase tracking-wider text-slate-100">{plan.name} {isBronze && <span className="text-[10px] text-amber-400/50">(Free)</span>}</h3>
                          {discount && discount.value > 0 && (
                            <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                              {discount.type === 'percentage' ? `${discount.value}% OFF` : `৳${discount.value} OFF`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-400 font-medium">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-8 py-4 border-y border-slate-900">
                        {isPlatinum ? (
                          <div className="text-2xl font-extrabold tracking-tight text-white">Custom SLA Pricing</div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-extrabold tracking-tight text-white">৳{price}</span>
                              <span className="text-xs font-semibold text-slate-500">
                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                              </span>
                            </div>
                            {discount && discount.value > 0 && (
                              <p className="text-xs line-through text-slate-600 mt-1">
                                ৳{billingCycle === 'monthly' ? plan.priceMonthly + (discount.type === 'percentage' ? (plan.priceMonthly * discount.value / 100) : discount.value) : plan.priceYearly + (discount.type === 'percentage' ? (plan.priceYearly * discount.value / 100) : discount.value)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mb-8">
                        <p className="text-[10px] font-black tracking-widest uppercase text-slate-500">
                          Included Parameters:
                        </p>
                        <ul className="space-y-3.5">
                          <li className="flex items-center gap-3 text-xs text-slate-300 font-semibold select-none">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{plan.limits.vouchers === -1 ? 'Unlimited' : plan.limits.vouchers} Vouchers</span>
                          </li>
                          <li className="flex items-center gap-3 text-xs text-slate-300 font-semibold select-none">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Staff Users</span>
                          </li>
                          <li className="flex items-center gap-3 text-xs text-slate-300 font-semibold select-none">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{plan.supportType || 'Email'} Support <span className="text-slate-500 font-normal">({plan.supportHours || '24/7'})</span></span>
                          </li>
                          <li className="flex items-center gap-3 text-xs text-slate-300 font-semibold select-none">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{plan.setupFee && plan.setupFee > 0 ? `Setup Fee: ৳${plan.setupFee}` : 'Free Deployment'}</span>
                          </li>
                          {plan.customDomain && (
                            <li className="flex items-center gap-3 text-xs text-slate-300 font-semibold select-none">
                              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <span>Custom Domain Link</span>
                            </li>
                          )}
                          
                          {/* Limit features initially to 5 for visual cleanliness */}
                          {plan.features.slice(0, 5).map((fId) => {
                            const Icon = getFeatureIcon(fId);
                            return (
                              <li key={fId} className="flex items-center gap-3 text-xs text-slate-300 font-semibold select-none">
                                <div className="w-5 h-5 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center border border-slate-750">
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span>{getFeatureLabel(fId)}</span>
                              </li>
                            );
                          })}

                          {plan.features.length > 5 && (
                            <li>
                              <button
                                onClick={() => setSelectedPlanDetails(plan)}
                                className="w-full text-left py-2 px-3 border border-blue-500/30 rounded-xl bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-[0.1em] hover:bg-blue-500/20 active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                + {plan.features.length - 5} advanced subsystems
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {isPlatinum ? (
                      <Link
                        to="/contact"
                        className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 shadow-lg"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Contact Sales Team
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className={cn(
                          "w-full py-3.5 rounded-xl font-bold text-center transition-all flex items-center justify-center gap-2 border",
                          isBronze ? "bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800" : 
                          isSilver ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" :
                          "bg-gradient-to-r from-amber-600 to-amber-700 border-amber-500 text-white hover:opacity-90"
                        )}
                      >
                        Activate Plan
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Sticky Comparison Section */}
          <div className="mt-32 max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <span className="text-xs font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">COMPARISON INDEX</span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2">Compare Plans in Detail</h2>
              <p className="text-slate-400 text-sm font-medium">Verify system boundaries and authorized features across tiers.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-900 bg-slate-950/40 backdrop-blur">
              <table className="w-full text-left border-collapse min-w-[760px]">
                {/* Table heads are sticky so they stay on top while scanning down */}
                <thead className="sticky top-0 bg-slate-950/95 border-b border-slate-900 z-20 shadow-xl backdrop-blur-md">
                  <tr>
                    <th className="py-5 px-6 text-xs font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-950">System Modules</th>
                    {sortedPlans.map(plan => (
                      <th key={plan.id} className="py-5 px-6 text-center text-xs font-black uppercase tracking-[0.15em] text-slate-200 bg-slate-950">
                        {plan.name} {plan.tier === 1 && '(Free)'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900 font-medium text-xs">
                  
                  {/* General Limits & Pricing */}
                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Monthly Subscription Rate</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center font-mono font-bold text-slate-200">
                        {plan.name.toLowerCase() === 'platinum' ? 'Custom SLA' : `৳${plan.priceMonthly}`}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Max Vouchers (Voucher cap)</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center text-slate-400 font-mono">
                        {plan.limits.vouchers === -1 ? 'Unlimited (No Cap)' : plan.limits.vouchers.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Authorized Staff Users</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center text-slate-400 font-mono">
                        {plan.limits.users === -1 ? 'Unlimited Staff' : `${plan.limits.users} Accounts`}
                      </td>
                    ))}
                  </tr>

                  {/* Feature Flags - Dynamic Checkmarks */}
                  {[
                    { id: 'inv', label: 'Multi-Godown Inventory' },
                    { id: 'payroll', label: 'Workforce & Automated Payroll' },
                    { id: 'production', label: 'Manufacturing & Line Control' },
                    { id: 'insights', label: 'AI Business Intelligence Insights' },
                    { id: 'notifications', label: 'SMS & WhatsApp alert system' },
                    { id: 'notes', label: 'Executive Memo Registers' },
                    { id: 'search', label: 'Instant Global Registry Search' },
                    { id: 'ui_custom', label: 'Dynamic UI Layout Builder' },
                    { id: 'report_layout', label: 'Custom PDF Export formats' },
                    { id: 'whatsapp_temp', label: 'WhatsApp Dispatch Templates' },
                  ].map(fItem => (
                    <tr key={fItem.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-5 px-6 text-slate-300 font-semibold">{fItem.label}</td>
                      {sortedPlans.map(plan => {
                        const hasFeat = plan.features.includes(fItem.id) || plan.tier >= 3;
                        return (
                          <td key={plan.id} className="py-5 px-6 text-center">
                            {hasFeat ? (
                              <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-800 font-black">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Extras */}
                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Custom Domain Links</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center">
                        {plan.customDomain ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-slate-800 font-black">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Multi-Currency Capability</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center">
                        {plan.limits.multiCurrency ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-slate-800 font-black">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Role-Based Permission Security</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center">
                        {plan.limits.rolePermissions ? (
                          <Check className="w-5 h-5 text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-slate-800 font-black">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">Technical Support Level</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center text-slate-200 font-bold font-mono uppercase text-[10px]">
                        {plan.supportType || 'Email Only'} ({plan.supportHours || '24/7'})
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-5 px-6 text-slate-300 font-semibold">On-Demand Setup & Mentorship</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-5 px-6 text-center text-slate-400 font-semibold">
                        {plan.setupFee === 0 ? 'Free Setup' : `৳${plan.setupFee}`}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Modern Overlay Feature Modal */}
      <AnimatePresence>
        {selectedPlanDetails && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative"
            >
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
                <div>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.25em] block mb-1">
                    FULL ADVANCED SUBSYSTEMS
                  </span>
                  <h3 className="text-2xl font-black text-white">
                    {selectedPlanDetails.name} Tier Capabilities
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPlanDetails(null)}
                  className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <p className="text-xs text-slate-400 leading-relaxed font-semibold">
                  This tier grants full operational access to the following specialized ERP subsystems. Double-check your active workflows:
                </p>

                <div className="space-y-4">
                  {selectedPlanDetails.features.map(fId => {
                    const Icon = getFeatureIcon(fId);
                    return (
                      <div key={fId} className="flex gap-4 p-4 rounded-2xl bg-slate-950/30 border border-slate-900 hover:border-slate-800 transition-all">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/15 flex-shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                            {getFeatureLabel(fId)}
                          </h4>
                          <p className="text-xs text-slate-400 leading-relaxed mt-1 font-medium">
                            {getFeatureDesc(fId)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedPlanDetails(null)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 cursor-pointer"
                >
                  Close index
                </button>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5"
                >
                  Activate Tier 
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};
