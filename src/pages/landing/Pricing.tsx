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
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden bg-white">
        {/* Geometric Grid Pattern matching Login & Home */}
        <div 
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(241, 245, 249, 0.8) 0%, rgba(255, 255, 255, 1) 75%),
              linear-gradient(to right, #f1f5f9 1px, transparent 1px),
              linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 88px 88px, 88px 88px'
          }}
        />

        {/* Ambient Pastel Glows */}
        <div className="absolute top-12 left-1/3 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-24 right-1/4 w-[400px] h-[400px] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-100 mb-6 inline-block shadow-2xs">
                TRANSPARENT VALUE PLANS
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
                Simple, Transparent Pricing
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
                Choose the plan that's right for your business. All plans include our reliable core ERP features.
              </p>

              {/* Billing Cycle Switcher */}
              <div className="inline-flex items-center justify-center gap-2 bg-slate-100/90 border border-slate-200/90 p-1.5 rounded-full shadow-inner select-none">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer",
                    billingCycle === 'monthly' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    "px-6 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5",
                    billingCycle === 'yearly' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
                  )}
                >
                  Yearly
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Save 20%</span>
                </button>
              </div>
            </motion.div>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900"></div>
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
                      "relative p-7 rounded-2xl border flex flex-col justify-between transition-all hover:translate-y-[-2px]",
                      isBronze && "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md",
                      isSilver && "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs hover:shadow-md",
                      isGold && "bg-white border-amber-300 shadow-md ring-2 ring-amber-400/20",
                      isPlatinum && "bg-white border-blue-300 shadow-md ring-2 ring-blue-500/20"
                    )}
                  >
                    {isPlatinum && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[9px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                        Most Flexible
                      </div>
                    )}
                    {isGold && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-bold uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                        Top Enterprise Value
                      </div>
                    )}

                    <div>
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xl font-bold tracking-tight text-slate-900">
                            {plan.name} {isBronze && <span className="text-xs text-slate-400 font-normal">(Free)</span>}
                          </h3>
                          {discount && discount.value > 0 && (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {discount.type === 'percentage' ? `${discount.value}% OFF` : `৳${discount.value} OFF`}
                            </span>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-slate-500 font-normal min-h-[36px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-6 py-4 border-y border-slate-100">
                        {isPlatinum ? (
                          <div className="text-2xl font-extrabold tracking-tight text-slate-900">Custom SLA Pricing</div>
                        ) : (
                          <div className="flex flex-col">
                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-extrabold tracking-tight text-slate-900">৳{price}</span>
                              <span className="text-xs font-semibold text-slate-500">
                                /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                              </span>
                            </div>
                            {discount && discount.value > 0 && (
                              <p className="text-xs line-through text-slate-400 mt-1">
                                ৳{billingCycle === 'monthly' ? plan.priceMonthly + (discount.type === 'percentage' ? (plan.priceMonthly * discount.value / 100) : discount.value) : plan.priceYearly + (discount.type === 'percentage' ? (plan.priceYearly * discount.value / 100) : discount.value)}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="space-y-3.5 mb-8">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                          Included Parameters:
                        </p>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium select-none">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{plan.limits.vouchers === -1 ? 'Unlimited' : plan.limits.vouchers} Vouchers</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium select-none">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{plan.limits.users === -1 ? 'Unlimited' : plan.limits.users} Staff Users</span>
                          </li>
                          <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium select-none">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{plan.supportType || 'Email'} Support <span className="text-slate-400 font-normal">({plan.supportHours || '24/7'})</span></span>
                          </li>
                          <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium select-none">
                            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{plan.setupFee && plan.setupFee > 0 ? `Setup Fee: ৳${plan.setupFee}` : 'Free Deployment'}</span>
                          </li>
                          {plan.customDomain && (
                            <li className="flex items-center gap-2.5 text-xs text-slate-700 font-medium select-none">
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              <span>Custom Domain Link</span>
                            </li>
                          )}
                          
                          {/* Limit features initially to 5 for visual cleanliness */}
                          {plan.features.slice(0, 5).map((fId) => {
                            const Icon = getFeatureIcon(fId);
                            return (
                              <li key={fId} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium select-none">
                                <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80">
                                  <Icon className="w-3 h-3" />
                                </div>
                                <span>{getFeatureLabel(fId)}</span>
                              </li>
                            );
                          })}

                          {plan.features.length > 5 && (
                            <li className="pt-1">
                              <button
                                onClick={() => setSelectedPlanDetails(plan)}
                                className="w-full text-left py-2 px-3 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-[0.05em] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
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
                        className="w-full py-3 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Contact Sales Team
                      </Link>
                    ) : (
                      <Link
                        to="/register"
                        className="w-full py-3 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 shadow-sm active:scale-[0.99]"
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
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-100 mb-4 inline-block shadow-2xs">
                FEATURE BREAKDOWN
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2">Compare Plans in Detail</h2>
              <p className="text-slate-600 text-sm font-medium">Verify system boundaries and authorized features across tiers.</p>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-sm">
              <table className="w-full text-left border-collapse min-w-[760px]">
                {/* Table heads are sticky so they stay on top while scanning down */}
                <thead className="sticky top-0 bg-slate-50/95 border-b border-slate-200 z-20 shadow-xs backdrop-blur-md">
                  <tr>
                    <th className="py-4 px-6 text-xs font-bold uppercase tracking-[0.15em] text-slate-500 bg-slate-50/95">System Modules</th>
                    {sortedPlans.map(plan => (
                      <th key={plan.id} className="py-4 px-6 text-center text-xs font-bold uppercase tracking-[0.1em] text-slate-800 bg-slate-50/95">
                        {plan.name} {plan.tier === 1 && '(Free)'}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-xs">
                  
                  {/* General Limits & Pricing */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-800 font-semibold">Monthly Subscription Rate</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center font-mono font-bold text-slate-900">
                        {plan.name.toLowerCase() === 'platinum' ? 'Custom SLA' : `৳${plan.priceMonthly}`}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-800 font-semibold">Max Vouchers (Voucher cap)</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center text-slate-600 font-mono font-medium">
                        {plan.limits.vouchers === -1 ? 'Unlimited (No Cap)' : plan.limits.vouchers.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-800 font-semibold">Authorized Staff Users</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center text-slate-600 font-mono font-medium">
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
                    <tr key={fItem.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">{fItem.label}</td>
                      {sortedPlans.map(plan => {
                        const hasFeat = plan.features.includes(fItem.id) || plan.tier >= 3;
                        return (
                          <td key={plan.id} className="py-4 px-6 text-center">
                            {hasFeat ? (
                              <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300 font-bold">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Extras */}
                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-700 font-medium">Custom Domain Links</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center">
                        {plan.customDomain ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-700 font-medium">Multi-Currency Capability</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center">
                        {plan.limits.multiCurrency ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-700 font-medium">Role-Based Permission Security</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center">
                        {plan.limits.rolePermissions ? (
                          <Check className="w-4 h-4 text-emerald-600 mx-auto" />
                        ) : (
                          <span className="text-slate-300 font-bold">-</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-700 font-medium">Technical Support Level</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center text-slate-800 font-semibold font-mono text-[11px]">
                        {plan.supportType || 'Email'} ({plan.supportHours || '24/7'})
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 text-slate-700 font-medium">On-Demand Setup & Mentorship</td>
                    {sortedPlans.map(plan => (
                      <td key={plan.id} className="py-4 px-6 text-center text-slate-600 font-medium">
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                <div>
                  <span className="text-[10px] font-bold uppercase text-blue-700 tracking-[0.2em] block mb-1">
                    FULL ADVANCED SUBSYSTEMS
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedPlanDetails.name} Tier Capabilities
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedPlanDetails(null)}
                  className="p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed font-normal">
                  This tier grants full operational access to the following specialized ERP subsystems:
                </p>

                <div className="space-y-3">
                  {selectedPlanDetails.features.map(fId => {
                    const Icon = getFeatureIcon(fId);
                    return (
                      <div key={fId} className="flex gap-3.5 p-4 rounded-xl bg-slate-50/70 border border-slate-200/80 hover:border-slate-300 transition-all">
                        <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                            {getFeatureLabel(fId)}
                          </h4>
                          <p className="text-xs text-slate-600 leading-relaxed mt-0.5 font-normal">
                            {getFeatureDesc(fId)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2.5">
                <button
                  onClick={() => setSelectedPlanDetails(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 cursor-pointer"
                >
                  Close
                </button>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-[#1e293b] hover:bg-[#0f172a] text-white flex items-center gap-1.5"
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
