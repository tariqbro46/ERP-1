import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight,
  Globe,
  Database
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';

export const Home = () => {
  const { t, language } = useLanguage();
  const DEFAULT_CONTENT = {
    heroTitle: t('home.heroTitle'),
    heroTitleColor: "#1e293b",
    heroSubtitle: t('home.heroSubtitle'),
    heroSubtitleColor: "#334155",
    heroCtaPrimary: t('home.startTrial'),
    heroCtaPrimaryBg: "#0f172a",
    heroCtaPrimaryText: "#ffffff",
    heroCtaSecondary: t('home.viewFeatures'),
    heroCtaSecondaryBg: "#ffffff",
    heroCtaSecondaryText: "#0f172a",
    heroImage: "https://picsum.photos/seed/erp-hero-dashboard/1600/900",
    heroBgColor: "#f1f5f9",
    showHero: true,
    statsClients: t('home.statsClientsVal'),
    statsUptime: t('home.statsUptimeVal'),
    statsSupport: t('home.statsSupportVal'),
    statsExperience: t('home.statsExperienceVal'),
    statsSectionBg: "#f8fafc",
    statsTitleColor: "#1e293b",
    statsSubtitleColor: "#334155",
    showStats: true,
    featuresTitle: t('home.featuresTitle'),
    featuresTitleColor: "#1e293b",
    featuresSubtitle: t('home.featuresSubtitle'),
    featuresSubtitleColor: "#334155",
    featuresSectionBg: "#ffffff",
    featureCardBg: "#ffffff",
    featureCardTitleColor: "#1e293b",
    featureCardDescColor: "#334155",
    showFeatures: true,
    ctaTitle: t('home.ctaTitle'),
    ctaTitleColor: "#ffffff",
    ctaSubtitle: t('home.ctaSubtitle'),
    ctaSubtitleColor: "rgba(255,255,255,0.8)",
    ctaSectionBg: "#0f172a",
    ctaButton: t('home.getStarted'),
    ctaButtonBg: "#ffffff",
    ctaButtonText: "#0f172a",
    showCta: true,
    adaptiveLoaderEnabled: true,
    skeletonLoaderEnabled: true
  };

  const { content } = useSiteContent('home', DEFAULT_CONTENT);

  const [activeTab, setActiveTab] = React.useState<'finance' | 'inventory' | 'production' | 'payroll'>('finance');

  const isAdaptiveLoaderEnabled = content.adaptiveLoaderEnabled !== false;
  const isSkeletonEnabled = content.skeletonLoaderEnabled !== false;

  const [loading, setLoading] = React.useState(() => {
    return isAdaptiveLoaderEnabled || isSkeletonEnabled;
  });
  const [currentPhraseIdx, setCurrentPhraseIdx] = React.useState(0);

  const loadingPhrases = [
    "Initializing Secure TLS Handshake...",
    "Querying ERP Business Logic...",
    "Binding Interactive Layout Components...",
    "Finishing Assembly..."
  ];

  React.useEffect(() => {
    if (!isAdaptiveLoaderEnabled && !isSkeletonEnabled) {
      setLoading(false);
      return;
    }

    const phraseInterval = setInterval(() => {
      setCurrentPhraseIdx((prev) => (prev < loadingPhrases.length - 1 ? prev + 1 : prev));
    }, 400);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    return () => {
      clearInterval(phraseInterval);
      clearTimeout(timer);
    };
  }, [isAdaptiveLoaderEnabled, isSkeletonEnabled]);

  if (loading && (isAdaptiveLoaderEnabled || isSkeletonEnabled)) {
    if (isSkeletonEnabled) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden">
          {/* Skeleton Navbar Header */}
          <div className="h-20 border-b border-slate-900/50 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-slate-850 rounded-xl animate-pulse" />
              <div className="w-24 h-5 bg-slate-850 rounded-lg animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="w-16 h-4 bg-slate-900 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-900 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-900 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-900 rounded animate-pulse" />
            </div>
            <div className="w-24 h-10 bg-blue-600/20 rounded-xl animate-pulse" />
          </div>

          {/* Skeleton Hero Section */}
          <div className="flex-1 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center w-full space-y-8">
            <div className="flex justify-center">
              <div className="w-56 h-8 bg-slate-900 border border-slate-800 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
              <div className="h-16 md:h-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl" />
              <div className="h-16 md:h-20 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl w-3/4 mx-auto" />
            </div>

            <div className="space-y-2.5 max-w-2xl mx-auto pt-4 animate-pulse">
              <div className="h-4 bg-slate-900 rounded w-full" />
              <div className="h-4 bg-slate-900 rounded w-5/6 mx-auto" />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 animate-pulse">
              <div className="w-36 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl" />
              <div className="w-36 h-12 bg-slate-900 border border-slate-800 rounded-xl" />
            </div>

            {/* Simulated app interface mockup skeleton */}
            <div className="mt-16 border border-slate-800 bg-slate-900/10 rounded-2xl aspect-[16/9] w-full animate-pulse flex flex-col p-4 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-850" />
                  <span className="w-3 h-3 rounded-full bg-slate-850" />
                  <span className="w-3 h-3 rounded-full bg-slate-850" />
                </div>
                <div className="w-32 h-4 bg-slate-900 rounded" />
              </div>
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div className="col-span-1 bg-slate-900/40 rounded-xl" />
                <div className="col-span-3 bg-slate-900/40 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Bottom Right Progressive Step Indicator */}
          {isAdaptiveLoaderEnabled && (
            <div 
              className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800/80 bg-slate-950/90 text-slate-300 font-mono text-[11px] uppercase tracking-widest shadow-2xl animate-in fade-in duration-300"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500 font-black tracking-tighter">PROGRESS STATUS</span>
                <span className="text-white font-bold">{loadingPhrases[currentPhraseIdx]}</span>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden text-white">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/20 via-transparent to-slate-950 opacity-40 animate-pulse" />
          
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin" />
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Loading Hero Portfolio...</span>
          </div>

          {isAdaptiveLoaderEnabled && (
            <div 
              className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-900/80 bg-slate-950/90 text-slate-300 font-mono text-[11px] uppercase tracking-widest shadow-2xl"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-500 font-black tracking-tighter">PROGRESS STATUS</span>
                <span className="text-white font-bold">{loadingPhrases[currentPhraseIdx]}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-white selection:bg-blue-500/30 selection:text-white">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        {content.showHero && (
          <section className="relative pt-32 pb-24 overflow-hidden bg-slate-950">
            {/* Dark Cyber Mesh Background Grids */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b1a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] -z-10 pointer-events-none">
              <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/20 to-indigo-600/0 rounded-full blur-[140px] opacity-80" />
              <div className="absolute top-24 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/10 to-indigo-600/0 rounded-full blur-[120px] opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  {/* Inline trending announcement badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:border-slate-700/80 transition-all shadow-lg shadow-black/80 text-xs font-semibold text-slate-300 mb-8 select-none scale-95 sm:scale-100">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-slate-400 font-normal">✨ ERP Enterprise Intelligence</span>
                    <span className="w-[1px] h-3 bg-slate-800" />
                    <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-0.5">Explore Features <ArrowRight className="w-3 h-3" /></span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black tracking-tight mb-8">
                    <span className="bg-gradient-to-b from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                      {language === 'bn' ? 'বুদ্ধিমত্তার সাথে' : 'Manage Your Business'}
                    </span>
                    <br />
                    <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
                      {language === 'bn' ? 'আপনার ব্যবসা পরিচালনা করুন' : 'With Pure Intelligence'}
                    </span>
                  </h1>

                  <p className="text-lg sm:text-xl text-slate-400 max-w-3xl mx-auto mb-12 font-medium leading-relaxed">
                    {content.heroSubtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                      to="/register"
                      className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all shadow-[0_4px_20px_rgba(37,99,235,0.3)] hover:shadow-[0_4px_25px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 flex items-center justify-center gap-2 group"
                    >
                      {content.heroCtaPrimary}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/pricing"
                      className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/80 text-slate-200 hover:text-white transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                    >
                      View Pricing Models
                    </Link>
                  </div>
                </motion.div>

                {/* Trending Interactive Dashboard Mockup Preview */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                  className="mt-20 relative max-w-5xl mx-auto z-20"
                >
                  <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-tr from-blue-500/20 via-indigo-500/10 to-emerald-500/15 opacity-40 blur-lg" />
                  
                  {/* Outer Frame */}
                  <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-slate-950 shadow-[0_30px_100px_rgba(0,0,0,0.8)]">
                    
                    {/* Simulated OS Browser Tab and Action Bar */}
                    <div className="bg-slate-900/90 border-b border-slate-800/60 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        {/* macOS lights */}
                        <div className="flex gap-2">
                          <span className="w-3.5 h-3.5 rounded-full bg-rose-500/80 block border border-rose-600/40" />
                          <span className="w-3.5 h-3.5 rounded-full bg-amber-500/80 block border border-amber-600/40" />
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/80 block border border-emerald-600/40" />
                        </div>
                        <span className="text-xs font-mono text-slate-400 tracking-wider font-extrabold">TallyFlow ERP</span>
                      </div>
                      
                      {/* Interactive App Tabs */}
                      <div className="flex bg-slate-950 p-1 rounded-full border border-slate-800/80">
                        {(['finance', 'inventory', 'production', 'payroll'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                              activeTab === tab 
                                ? 'bg-slate-800 text-white shadow-md border-t border-slate-700/60' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                            }`}
                          >
                            {language === 'bn' 
                              ? (tab === 'finance' ? 'অর্থায়ন' : tab === 'inventory' ? 'ইনভেন্টরি' : tab === 'production' ? 'উৎপাদন' : 'পেরোল')
                              : tab
                            }
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* App Visual Canvas */}
                    <div className="p-8 bg-slate-950/40 min-h-[440px] text-left transition-all">
                      {activeTab === 'finance' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Financial Analytics Summary</h4>
                              <p className="text-2xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">৳2,482,900 Total Asset Flow</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">+18.4% Revenue Target</span>
                              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">Live Status</span>
                            </div>
                          </div>

                          {/* Minimal Live Visual chart representation */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3 bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between min-h-[220px]">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-400">Quarterly Income Flow Trend</span>
                                <span className="text-[10px] font-mono text-slate-500">Auto-calculated</span>
                              </div>
                              <div className="h-28 flex items-end gap-2 pt-2">
                                {[54, 76, 45, 90, 68, 100, 85, 95, 110, 80, 95, 120].map((val, i) => (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div 
                                      className="w-full bg-gradient-to-t from-blue-600/40 to-blue-400 rounded-t-md hover:to-indigo-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                                      style={{ height: `${val}%` }} 
                                    />
                                    <span className="text-[9px] font-mono text-slate-600 group-hover:text-slate-300">Q{i+1}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-2xl">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Net Profit Margin</p>
                                <p className="text-xl font-bold tracking-tight text-white mt-1">24.5%</p>
                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: '24.5%' }} />
                                </div>
                              </div>
                              <div className="bg-slate-900/50 border border-slate-850 p-5 rounded-2xl">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total Invoices Disbursed</p>
                                <p className="text-xl font-bold tracking-tight text-white mt-1">3,485 Pcs</p>
                                <p className="text-[10px] text-emerald-400 mt-2 font-bold select-none">• No Error Found</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'inventory' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Multi-Godown Stock Levels</h4>
                              <p className="text-2xl font-black bg-gradient-to-r from-amber-400 to-orange-300 bg-clip-text text-transparent">৳14,560,000 Active Inventory Value</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">Low-Stock Warnings Configured</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-4">
                              <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-bold text-white">Dhaka Warehouse Alpha</span>
                                  <span className="text-xs font-bold text-slate-400">82% Volume Capacity</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                                  <span>24,800 Items Loaded</span>
                                  <span>Limit: 30,000</span>
                                </div>
                              </div>

                              <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-bold text-white">Chittagong Port Terminal</span>
                                  <span className="text-xs font-bold text-rose-400">Low Stock - 38% Volume</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '38%' }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                                  <span>11,400 Items Loaded</span>
                                  <span>Limit: 30,000</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-900/50 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-4">Stock Ledger Quick Ticker</span>
                              <div className="divide-y divide-slate-800/80">
                                {[
                                  { name: 'Ultra-Tough Cement', qty: '4,500 Bags', godown: 'Dhaka Alpha', color: 'text-emerald-400' },
                                  { name: 'Deformed Steel Rods', qty: '180 Tons', godown: 'Dhaka Alpha', color: 'text-emerald-400' },
                                  { name: 'Fibre Glass Insulation', qty: '12 Rolls', godown: 'Chittagong-Port', color: 'text-rose-400' },
                                ].map((item, i) => (
                                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <p className="font-bold text-slate-200">{item.name}</p>
                                      <p className="text-[10px] text-slate-500">{item.godown}</p>
                                    </div>
                                    <span className={`font-mono font-bold ${item.color}`}>{item.qty}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'production' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Line Production Monitoring</h4>
                              <p className="text-2xl font-black bg-gradient-to-r from-purple-400 to-pink-300 bg-clip-text text-transparent">Automatic Machine Dispatch Logs</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold">4 Active Lines Online</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {[
                              { lineName: 'Alpha Extruder X1', speed: '48m/min', load: '94% Power Load', progress: 94, statusClass: 'text-purple-400 bg-purple-500/10' },
                              { lineName: 'Litho Printer L2', speed: '120 Sheets/min', load: '78% Power Load', progress: 78, statusClass: 'text-blue-400 bg-blue-500/10' },
                              { lineName: 'Fila Wapper F3', speed: 'Idle', load: 'Ready to Process Order', progress: 0, statusClass: 'text-slate-500 bg-slate-800' },
                            ].map((machine, i) => (
                              <div key={i} className="bg-slate-900/50 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between min-h-[160px]">
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-white">{machine.lineName}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${machine.statusClass}`}>ONLINE</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-300">{machine.speed}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${machine.progress}%` }} />
                                  </div>
                                  <p className="text-[9px] text-slate-500 font-medium">{machine.load}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'payroll' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-widest text-slate-500 font-bold">Automated Workforce Disbursements</h4>
                              <p className="text-2xl font-black bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">৳324,500 Outstanding Salaries Disbursed</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">Attendance Secure Track</span>
                          </div>

                          <div className="bg-slate-900/50 border border-slate-850 rounded-2xl overflow-hidden pt-2">
                            <table className="w-full text-xs text-left">
                              <thead>
                                <tr className="border-b border-slate-800/80 text-slate-500 font-bold uppercase tracking-wider">
                                  <th className="py-3.5 px-4">Employee Full Name</th>
                                  <th className="py-3.5 px-4 text-center">Designation Room</th>
                                  <th className="py-3.5 px-4 text-center">Attendance Checklist</th>
                                  <th className="py-3.5 px-4 text-right">Current Disbursed Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-medium">
                                {[
                                  { name: 'Ahmad Rafique', role: 'Production Analyst', attendance: 'Present (On Time)', colorId: 'bg-emerald-500', status: '৳45,000 Transferred' },
                                  { name: 'Nusrat Jahan', role: 'Financial Manager', attendance: 'Present (On Time)', colorId: 'bg-emerald-500', status: '৳72,000 Transferred' },
                                  { name: 'Kamrul Hassan', role: 'Inventory Operator', attendance: 'Excused Leave (Paid)', colorId: 'bg-amber-500', status: '৳34,000 Transferred' },
                                ].map((emp, i) => (
                                  <tr key={i} className="hover:bg-slate-900/30 transition-colors">
                                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold font-mono text-[10px]">
                                        {emp.name.split(' ').map(n=>n[0]).join('')}
                                      </div>
                                      <span className="text-slate-200">{emp.name}</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-slate-400">{emp.role}</td>
                                    <td className="py-3.5 px-4 text-center">
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-300">
                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.colorId}`} />
                                        {emp.attendance}
                                      </span>
                                    </td>
                                    <td className="py-3.5 px-4 text-right text-emerald-400 font-mono font-bold">{emp.status}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        )}

        {/* Stats Section */}
        {content.showStats && (
          <section className="py-16 border-y border-slate-900 bg-slate-950/40 relative">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: content.statsClients, label: t('home.statsClients') },
                  { value: content.statsUptime, label: t('home.statsUptime') },
                  { value: content.statsSupport, label: t('home.statsSupport') },
                  { value: content.statsExperience, label: t('home.statsExperience') },
                ].map((stat, i) => (
                  <div key={i} className="group relative">
                    <p className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2 group-hover:text-blue-400 transition-colors duration-300 font-mono">
                      {stat.value}
                    </p>
                    <p className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-black text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Trending Bento Grid Features Section */}
        {content.showFeatures && (
          <section className="py-32 bg-slate-950 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-24 max-w-2xl mx-auto">
                <span className="text-xs font-black uppercase tracking-[0.3em] bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-full border border-indigo-500/20 mb-6 inline-block">MODULAR ECOSYSTEM</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">
                  {content.featuresTitle}
                </h2>
                <p className="text-slate-400 text-lg leading-relaxed font-medium">
                  {content.featuresSubtitle}
                </p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Bento Cell 1: Wide financial card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-4 p-8 rounded-3xl border border-slate-900 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/25 mb-6 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">{t('home.feature1Title')}</h3>
                    <p className="text-sm leading-relaxed text-slate-400 select-none">{t('home.feature1Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-900 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Live Tracking Activated</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </motion.div>

                {/* Bento Cell 2: Secure card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-2 p-8 rounded-3xl border border-slate-900 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/25 mb-6 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{t('home.feature4Title')}</h3>
                    <p className="text-xs leading-relaxed text-slate-400">{t('home.feature4Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    AES-256 ENCRYPTION
                  </div>
                </motion.div>

                {/* Bento Cell 3: Small Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-2 p-8 rounded-3xl border border-slate-900 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/25 mb-6 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{t('home.feature5Title')}</h3>
                    <p className="text-xs leading-relaxed text-slate-400">{t('home.feature5Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    0ms Latency Pipeline
                  </div>
                </motion.div>

                {/* Bento Cell 4: Large Wide Warehouse card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-4 p-8 rounded-3xl border border-slate-900 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/25 mb-6 group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3 text-white">{t('home.feature2Title')}</h3>
                    <p className="text-sm leading-relaxed text-slate-400 select-none">{t('home.feature2Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-900 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="uppercase tracking-widest">STOCK METRICS CONNECTED</span>
                    <span className="font-mono text-[10px]">DB_ACTIVE // SECURE_CON_99%</span>
                  </div>
                </motion.div>

                {/* Bento Cell 5: Small Card Users */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-3 p-8 rounded-3xl border border-slate-900 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center border border-sky-500/25 mb-6 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{t('home.feature3Title')}</h3>
                    <p className="text-xs leading-relaxed text-slate-400">{t('home.feature3Desc')}</p>
                  </div>
                </motion.div>

                {/* Bento Cell 6: Small Card Globe */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-3 p-8 rounded-3xl border border-slate-900 bg-slate-900/35 backdrop-blur-md flex flex-col justify-between hover:border-slate-800 transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/25 mb-6 group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{t('home.feature6Title')}</h3>
                    <p className="text-xs leading-relaxed text-slate-400">{t('home.feature6Desc')}</p>
                  </div>
                </motion.div>

              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {content.showCta && (
          <section className="relative py-32 bg-slate-950 overflow-hidden text-center border-t border-slate-900">
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#1e293b1a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b1a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] -z-10 pointer-events-none">
              <div className="absolute bottom-[-100px] left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-blue-600/15 to-indigo-600/0 rounded-full blur-[120px] opacity-80" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-4xl sm:text-6xl font-black mb-8 tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                {content.ctaTitle}
              </h2>
              <p className="max-w-xl mx-auto mb-12 text-slate-400 text-lg leading-relaxed">
                {content.ctaSubtitle}
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold bg-white text-slate-950 hover:bg-slate-100 hover:scale-103 transition-all font-sans tracking-wide shadow-xl hover:shadow-[0_20px_40px_rgba(255,255,255,0.06)]"
              >
                {content.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

