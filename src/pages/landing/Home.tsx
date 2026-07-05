import React from 'react';
import { Link } from 'react-router-dom';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  ArrowRight,
  Globe,
  Database,
  Sparkles,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { erpService } from '../../services/erpService';

export const Home = () => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { adaptiveLoaderEnabled = true, skeletonEnabled = true, skeletonDashboardOnly = true } = useSettings();

  const DEFAULT_CONTENT = {
    heroTitle: language === 'bn' ? 'বুদ্ধিমত্তার সাথে আপনার ব্যবসা পরিচালনা করুন' : 'Manage Your Business With Pure Intelligence',
    heroTitleColor: "#ffffff",
    heroSubtitle: t('home.heroSubtitle'),
    heroSubtitleColor: "#94a3b8",
    heroCtaPrimary: t('home.startTrial'),
    heroCtaPrimaryBg: "#3b82f6",
    heroCtaPrimaryText: "#ffffff",
    heroCtaSecondary: "View Pricing Models",
    heroCtaSecondaryBg: "transparent",
    heroCtaSecondaryText: "#ffffff",
    heroImage: "https://picsum.photos/seed/erp-hero-dashboard/1600/900",
    heroBgColor: "#020617",
    showHero: true,
    statsClients: t('home.statsClientsVal'),
    statsUptime: t('home.statsUptimeVal'),
    statsSupport: t('home.statsSupportVal'),
    statsExperience: t('home.statsExperienceVal'),
    statsSectionBg: "#090d16",
    statsTitleColor: "#ffffff",
    statsSubtitleColor: "#64748b",
    showStats: true,
    featuresTitle: t('home.featuresTitle'),
    featuresTitleColor: "#ffffff",
    featuresSubtitle: t('home.featuresSubtitle'),
    featuresSubtitleColor: "#94a3b8",
    featuresSectionBg: "#020617",
    featureCardBg: "#0b1329",
    featureCardTitleColor: "#ffffff",
    featureCardDescColor: "#94a3b8",
    showFeatures: true,
    ctaTitle: t('home.ctaTitle'),
    ctaTitleColor: "#ffffff",
    ctaSubtitle: t('home.ctaSubtitle'),
    ctaSubtitleColor: "rgba(255,255,255,0.8)",
    ctaSectionBg: "#020617",
    ctaButton: t('home.getStarted'),
    ctaButtonBg: "#ffffff",
    ctaButtonText: "#020617",
    showCta: true,
    adaptiveLoaderEnabled: true,
    skeletonLoaderEnabled: true
  };

  const { content: rawContent } = useSiteContent('home', DEFAULT_CONTENT);

  // Normalize content to use consistent dark theme backgrounds and colors, matching Features, Pricing, About, and Contact pages
  const content = {
    ...rawContent,
    heroBgColor: "#020617",
    heroTitleColor: "#ffffff",
    heroSubtitleColor: "#94a3b8",
    heroCtaPrimaryBg: "#3b82f6",
    heroCtaPrimaryText: "#ffffff",
    heroCtaSecondaryText: "#ffffff",
    statsSectionBg: "#090d16",
    statsTitleColor: "#ffffff",
    statsSubtitleColor: "#64748b",
    featuresSectionBg: "#020617",
    featureCardBg: "#0b1329",
    featureCardTitleColor: "#ffffff",
    featureCardDescColor: "#94a3b8",
    ctaTitleColor: "#ffffff",
    ctaSubtitleColor: "rgba(255,255,255,0.8)",
    ctaSectionBg: "#020617",
    ctaButtonBg: "#ffffff",
    ctaButtonText: "#020617",
  };

  const [activeTab, setActiveTab] = React.useState<'finance' | 'inventory' | 'production' | 'payroll'>('finance');

  const [showDemoModal, setShowDemoModal] = React.useState(false);
  const [demoForm, setDemoForm] = React.useState({
    name: '',
    companyName: '',
    address: '',
    phone: '',
    email: ''
  });
  const [demoSubmitLoading, setDemoSubmitLoading] = React.useState(false);
  const [demoError, setDemoError] = React.useState('');

  const handleDemoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoForm.name || !demoForm.companyName || !demoForm.address || !demoForm.phone || !demoForm.email) {
      setDemoError(language === 'bn' ? 'দয়া করে সবগুলি ফিল্ড পূরণ করুন।' : 'Please fill out all fields.');
      return;
    }
    setDemoSubmitLoading(true);
    setDemoError('');

    try {
      await addDoc(collection(db, 'inquiries'), {
        name: demoForm.name,
        email: demoForm.email,
        subject: "Experience Hub Activation",
        message: `Company Name: ${demoForm.companyName}\nAddress: ${demoForm.address}\nPhone Number: ${demoForm.phone}\nMode: Demo Mode Enabled`,
        createdAt: serverTimestamp()
      });

      localStorage.removeItem('erp_demo_db');
      localStorage.removeItem('erp_demo_db_initialized');
      localStorage.setItem('erp_is_demo_mode', 'true');
      localStorage.setItem('erp_demo_visitor', JSON.stringify({
        name: demoForm.name,
        companyName: demoForm.companyName,
        address: demoForm.address,
        phone: demoForm.phone,
        email: demoForm.email,
        activatedAt: new Date().toISOString()
      }));

      // Initialize the seeded demo database immediately
      erpService.initDemoDbIfNeeded();

      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error("Failed to activate Experience Hub:", err);
      setDemoError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setDemoSubmitLoading(false);
    }
  };

  const isAdaptiveLoaderEnabled = content.adaptiveLoaderEnabled !== false && adaptiveLoaderEnabled !== false;
  const isSkeletonEnabled = content.skeletonLoaderEnabled !== false && skeletonEnabled !== false && !skeletonDashboardOnly;

  const [loading, setLoading] = React.useState(() => {
    try {
      const persisted = localStorage.getItem('swr_site_content_home');
      if (persisted) {
        const data = JSON.parse(persisted);
        const pageContent = data.content || {};
        const localAdaptive = pageContent.adaptiveLoaderEnabled !== false && adaptiveLoaderEnabled !== false;
        const localSkeleton = pageContent.skeletonLoaderEnabled !== false && skeletonEnabled !== false && !skeletonDashboardOnly;
        return localAdaptive || localSkeleton;
      }
    } catch (e) {}
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
              <div className="h-16 md:h-20 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl" />
              <div className="h-16 md:h-20 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-2xl w-3/4 mx-auto" />
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
              <div className="flex justify-between items-center border-slate-900 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-slate-850" />
                  <span className="w-3 h-3 rounded-full bg-slate-850" />
                  <span className="w-3 h-3 rounded-full bg-slate-850" />
                </div>
                <div className="w-32 h-4 bg-slate-850 rounded" />
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
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-450 opacity-75"></span>
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
            <div className="w-12 h-12 rounded-full border-slate-800 border-t-blue-500 animate-spin" />
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Loading Hero Portfolio...</span>
          </div>

          {isAdaptiveLoaderEnabled && (
            <div 
              className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800/80 bg-slate-950/90 text-slate-300 font-mono text-[11px] uppercase tracking-widest shadow-2xl"
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
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30 bg-slate-950 text-white transition-colors duration-300 animate-fadeIn">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        {content.showHero && (
          <section className="relative pt-32 pb-24 overflow-hidden" style={{ backgroundColor: content.heroBgColor || '#020617' }}>
            {/* Dark Cyber Mesh Background Grids */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] -z-10 pointer-events-none">
              <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-600/0 rounded-full blur-[140px] opacity-80" />
              <div className="absolute top-24 right-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-emerald-500/5 to-indigo-600/0 rounded-full blur-[120px] opacity-60" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  {/* Inline trending announcement badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 hover:bg-slate-850 transition-all shadow-sm text-xs font-semibold text-slate-350 mb-8 select-none scale-95 sm:scale-100">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    <span className="text-slate-400">✨ {language === 'bn' ? 'ইআরপি এন্টারপ্রাইজ ইন্টেলিজেন্স' : 'ERP Enterprise Intelligence'}</span>
                    <span className="w-[1px] h-3 bg-slate-800" />
                    <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer flex items-center gap-0.5">Explore Features <ArrowRight className="w-3 h-3" /></span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight mb-8 animate-fadeIn" style={{ color: content.heroTitleColor || '#ffffff' }}>
                    {content.heroTitle}
                  </h1>

                  <p className="text-lg sm:text-xl max-w-3xl mx-auto mb-12 font-medium leading-relaxed" style={{ color: content.heroSubtitleColor || '#94a3b8' }}>
                    {content.heroSubtitle}
                  </p>

                   <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                    <Link
                      to={user ? "/dashboard" : "/register"}
                      className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold transition-all shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2 group hover:opacity-90 text-white"
                      style={{ backgroundColor: content.heroCtaPrimaryBg || '#3b82f6' }}
                    >
                      {user ? t('nav.dashboard') : content.heroCtaPrimary}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                      to="/pricing"
                      className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold border border-slate-800 text-white transition-all hover:bg-slate-900"
                    >
                      {content.heroCtaSecondary || "View Pricing Models"}
                    </Link>
                    {!user && (
                      <button
                        onClick={() => setShowDemoModal(true)}
                        className="w-full sm:w-auto px-8 py-4 rounded-full text-base font-bold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2 text-emerald-400 bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                        {language === 'bn' ? 'এক্সপেরিয়েন্স হাব (ডেমো)' : 'Experience Hub (Demo)'}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Trending Interactive Dashboard Mockup Preview */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 40 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.2 }}
                  className="mt-20 relative max-w-5xl mx-auto z-20"
                >
                  <div className="absolute -inset-1 rounded-[32px] bg-blue-500/10 opacity-40 blur-lg" />
                  
                  {/* Outer Frame */}
                  <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/95 shadow-2xl text-white">
                    
                    {/* Simulated OS Browser Tab and Action Bar */}
                    <div className="bg-slate-950 border-b border-slate-850 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
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
                                ? 'bg-blue-600 text-white shadow-sm' 
                                : 'text-slate-400 hover:text-white'
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
                              <p className="text-2xl font-black text-blue-400">৳2,482,900 Total Asset Flow</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">+18.4% Revenue Target</span>
                              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-450 border border-blue-500/20 font-bold">Live Status</span>
                            </div>
                          </div>

                          {/* Minimal Live Visual chart representation */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3 bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between min-h-[220px]">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-bold text-slate-450">Quarterly Income Flow Trend</span>
                                <span className="text-[10px] font-mono text-slate-500">Auto-calculated</span>
                              </div>
                              <div className="h-28 flex items-end gap-2 pt-2">
                                {[54, 76, 45, 90, 68, 100, 85, 95, 110, 80, 95, 120].map((val, i) => (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div 
                                      className="w-full bg-blue-500/70 rounded-t-md hover:bg-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300"
                                      style={{ height: `${val}%` }} 
                                    />
                                    <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-350">Q{i+1}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Net Profit Margin</p>
                                <p className="text-xl font-bold tracking-tight text-white mt-1">24.5%</p>
                                <div className="w-full bg-slate-900 h-1.5 rounded-full mt-3 overflow-hidden">
                                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '24.5%' }} />
                                </div>
                              </div>
                              <div className="bg-slate-950 border border-slate-850 p-5 rounded-2xl">
                                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Total Invoices Disbursed</p>
                                <p className="text-xl font-bold tracking-tight text-white mt-1">3,485 Pcs</p>
                                <p className="text-[10px] text-emerald-450 mt-2 font-bold select-none">• No Error Found</p>
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
                              <p className="text-2xl font-black text-amber-500">৳14,560,000 Active Inventory Value</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-550 border border-amber-500/20 font-bold">Low-Stock Warnings Configured</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            <div className="space-y-4">
                              <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-bold text-slate-200">Dhaka Warehouse Alpha</span>
                                  <span className="text-xs font-bold text-slate-450">82% Volume Capacity</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-450 mt-2">
                                  <span>24,800 Items Loaded</span>
                                  <span>Limit: 30,000</span>
                                </div>
                              </div>

                              <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-bold text-slate-200">Chittagong Port Terminal</span>
                                  <span className="text-xs font-bold text-rose-500">Low Stock - 38% Volume</span>
                                </div>
                                <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '38%' }} />
                                </div>
                                <div className="flex justify-between items-center text-[10px] text-slate-450 mt-2">
                                  <span>11,400 Items Loaded</span>
                                  <span>Limit: 30,000</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl flex flex-col justify-between">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-4">Stock Ledger Quick Ticker</span>
                              <div className="divide-y divide-slate-900">
                                {[
                                  { name: 'Ultra-Tough Cement', qty: '4,500 Bags', godown: 'Dhaka Alpha', color: 'text-emerald-450' },
                                  { name: 'Deformed Steel Rods', qty: '180 Tons', godown: 'Dhaka Alpha', color: 'text-emerald-450' },
                                  { name: 'Fibre Glass Insulation', qty: '12 Rolls', godown: 'Chittagong-Port', color: 'text-rose-500' },
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
                              <p className="text-2xl font-black text-purple-400">Automatic Machine Dispatch Logs</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-450 border border-purple-500/20 font-bold">4 Active Lines Online</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {[
                              { lineName: 'Alpha Extruder X1', speed: '48m/min', load: '94% Power Load', progress: 94, statusClass: 'text-purple-450 bg-purple-500/10 border-purple-500/20' },
                              { lineName: 'Litho Printer L2', speed: '120 Sheets/min', load: '78% Power Load', progress: 78, statusClass: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
                              { lineName: 'Fila Wrapper F3', speed: 'Idle', load: 'Ready to Process Order', progress: 0, statusClass: 'text-slate-500 bg-slate-900 border-none' },
                            ].map((machine, i) => (
                              <div key={i} className="bg-slate-950 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between min-h-[160px]">
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-200">{machine.lineName}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${machine.statusClass}`}>ONLINE</span>
                                  </div>
                                  <p className="text-sm font-bold text-slate-400">{machine.speed}</p>
                                </div>
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
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
                              <p className="text-2xl font-black text-sky-400">৳324,500 Outstanding Salaries Disbursed</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-450 border border-blue-500/20 font-bold">Attendance Secure Track</span>
                          </div>

                          <div className="bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden pt-2">
                            <table className="w-full text-xs text-left relative">
                              <thead className="sticky top-0 bg-slate-950 z-10 border-b border-slate-850 text-slate-400 font-bold uppercase tracking-wider">
                                <tr>
                                  <th className="py-3.5 px-4">Employee Full Name</th>
                                  <th className="py-3.5 px-4 text-center">Designation Room</th>
                                  <th className="py-3.5 px-4 text-center">Attendance Checklist</th>
                                  <th className="py-3.5 px-4 text-right">Current Disbursed Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-900 font-medium select-none">
                                {[
                                  { name: 'Ahmad Rafique', role: 'Production Analyst', attendance: 'Present (On Time)', colorId: 'bg-emerald-500', status: '৳45,000 Transferred' },
                                  { name: 'Nusrat Jahan', role: 'Financial Manager', attendance: 'Present (On Time)', colorId: 'bg-emerald-500', status: '৳72,050 Transferred' },
                                  { name: 'Kamrul Hassan', role: 'Inventory Operator', attendance: 'Excused Leave (Paid)', colorId: 'bg-amber-500', status: '৳34,000 Transferred' },
                                ].map((emp, i) => (
                                  <tr key={i} className="hover:bg-slate-900/40 transition-colors">
                                    <td className="py-3.5 px-4 flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold font-mono text-[10px]">
                                        {emp.name.split(' ').map(n=>n[0]).join('')}
                                      </div>
                                      <span className="text-slate-200">{emp.name}</span>
                                    </td>
                                    <td className="py-3.5 px-4 text-center text-slate-450">{emp.role}</td>
                                    <td className="py-3.5 px-4 text-center">
                                      <span className="inline-flex items-center gap-1.5 text-[10px] text-slate-400">
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
          <section 
            className="py-16 border-y border-slate-900/60 relative"
            style={{ backgroundColor: content.statsSectionBg || '#090d16' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {[
                  { value: content.statsClients, label: t('home.statsClients') },
                  { value: content.statsUptime, label: t('home.statsUptime') },
                  { value: content.statsSupport, label: t('home.statsSupport') },
                  { value: content.statsExperience, label: t('home.statsExperience') },
                ].map((stat, i) => (
                  <div key={i} className="group relative">
                    <p 
                      className="text-4xl sm:text-5xl font-black tracking-tight mb-2 group-hover:text-blue-450 transition-colors duration-300 font-mono"
                      style={{ color: content.statsTitleColor || '#ffffff' }}
                    >
                      {stat.value}
                    </p>
                    <p 
                      className="text-[10px] sm:text-xs tracking-[0.2em] uppercase font-black"
                      style={{ color: content.statsSubtitleColor || '#64748b' }}
                    >
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
          <section 
            className="py-32 relative overflow-hidden" 
            style={{ backgroundColor: content.featuresSectionBg || '#020617' }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[160px] pointer-events-none" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-24 max-w-2xl mx-auto">
                <span className="text-xs font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">MODULAR ECOSYSTEM</span>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6" style={{ color: content.featuresTitleColor || '#ffffff' }}>
                  {content.featuresTitle}
                </h2>
                <p className="text-lg leading-relaxed font-medium" style={{ color: content.featuresSubtitleColor || '#94a3b8' }}>
                  {content.featuresSubtitle}
                </p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Bento Cell 1: Wide financial card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-4 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-blue-550/40 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: content.featureCardBg || '#0b1329' }}
                >
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: content.featureCardTitleColor || '#ffffff' }}>{t('home.feature1Title')}</h3>
                    <p className="text-sm leading-relaxed select-none" style={{ color: content.featureCardDescColor || '#94a3b8' }}>{t('home.feature1Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-850/60 flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <span>Live Tracking Activated</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </motion.div>

                {/* Bento Cell 2: Secure card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-2 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-blue-550/40 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: content.featureCardBg || '#0b1329' }}
                >
                  <div>
                    <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center border border-blue-500/20 mb-6 group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: content.featureCardTitleColor || '#ffffff' }}>{t('home.feature4Title')}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: content.featureCardDescColor || '#94a3b8' }}>{t('home.feature4Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-850_60 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    AES-256 ENCRYPTION
                  </div>
                </motion.div>

                {/* Bento Cell 3: Small Card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-2 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-blue-550/40 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: content.featureCardBg || '#0b1329' }}
                >
                  <div>
                    <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center border border-purple-500/20 mb-6 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: content.featureCardTitleColor || '#ffffff' }}>{t('home.feature5Title')}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: content.featureCardDescColor || '#94a3b8' }}>{t('home.feature5Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-850/60 text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    0ms Latency Pipeline
                  </div>
                </motion.div>

                {/* Bento Cell 4: Large Wide Warehouse card */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-4 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-blue-550/40 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: content.featureCardBg || '#0b1329' }}
                >
                  <div>
                    <div className="w-12 h-12 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center border border-amber-500/20 mb-6 group-hover:scale-110 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3" style={{ color: content.featureCardTitleColor || '#ffffff' }}>{t('home.feature2Title')}</h3>
                    <p className="text-sm leading-relaxed select-none" style={{ color: content.featureCardDescColor || '#94a3b8' }}>{t('home.feature2Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-850/60 flex items-center justify-between text-xs font-bold text-slate-500">
                    <span className="uppercase tracking-widest">STOCK METRICS CONNECTED</span>
                    <span className="font-mono text-[10px]">DB_ACTIVE // SECURE_CON_99%</span>
                  </div>
                </motion.div>

                {/* Bento Cell 5: Small Card Users */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-3 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-blue-550/40 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: content.featureCardBg || '#0b1329' }}
                >
                  <div>
                    <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center border border-sky-500/20 mb-6 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: content.featureCardTitleColor || '#ffffff' }}>{t('home.feature3Title')}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: content.featureCardDescColor || '#94a3b8' }}>{t('home.feature3Desc')}</p>
                  </div>
                </motion.div>

                {/* Bento Cell 6: Small Card Globe */}
                <motion.div
                  whileHover={{ y: -4 }}
                  className="md:col-span-3 p-8 rounded-3xl border border-slate-800 flex flex-col justify-between hover:border-blue-550/40 hover:shadow-lg transition-all group"
                  style={{ backgroundColor: content.featureCardBg || '#0b1329' }}
                >
                  <div>
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center border border-emerald-500/20 mb-6 group-hover:scale-110 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold mb-3" style={{ color: content.featureCardTitleColor || '#ffffff' }}>{t('home.feature6Title')}</h3>
                    <p className="text-xs leading-relaxed" style={{ color: content.featureCardDescColor || '#94a3b8' }}>{t('home.feature6Desc')}</p>
                  </div>
                </motion.div>

              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {content.showCta && (
          <section 
            className="relative py-32 overflow-hidden text-center border-t border-slate-900"
            style={{ backgroundColor: content.ctaSectionBg || '#020617' }}
          >
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_100%,#000_70%,transparent_100%)] pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[400px] -z-10 pointer-events-none">
              <div className="absolute bottom-[-100px] left-1/3 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/10 to-indigo-600/0 rounded-full blur-[120px] opacity-80" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-4xl sm:text-6xl font-black mb-8 tracking-tight" style={{ color: content.ctaTitleColor || '#ffffff' }}>
                {content.ctaTitle}
              </h2>
              <p className="max-w-xl mx-auto mb-12 text-lg leading-relaxed font-semibold animate-pulse" style={{ color: content.ctaSubtitleColor || 'rgba(255,255,255,0.8)' }}>
                {content.ctaSubtitle}
              </p>
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-base font-bold transition-all font-sans tracking-wide shadow-xl hover:-translate-y-0.5"
                style={{ backgroundColor: content.ctaButtonBg || '#ffffff', color: content.ctaButtonText || '#020617' }}
              >
                {user ? t('nav.dashboard') : content.ctaButton}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </section>
        )}
      </main>

      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider font-mono">
                  {language === 'bn' ? 'এক্সপেরিয়েন্স হাব অ্যাক্টিভেশন' : 'Activate Experience Hub'}
                </h3>
              </div>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                id="close_demo_modal_btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDemoSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                {language === 'bn' 
                  ? 'এক্সপেরিয়েন্স হাবে স্বাগতম! এখানে এন্ট্রি করা কোনো ডাটা ডাটাবেজে স্টোর হবে না, তবে আপনি রিয়েল-টাইম রিপোর্ট এবং সমস্ত ফিচার সম্পূর্ণ ফ্রিতে ট্রাই করতে পারবেন।' 
                  : 'Welcome to the Experience Hub! All entries here will stay non-persistent inside your browser cache, allowing you to test reports and operations without storing them in the cloud.'}
              </p>

              {demoError && (
                <div className="p-3 text-xs bg-red-950/50 border border-red-500/30 text-red-400 rounded-lg">
                  {demoError}
                </div>
              )}

              <div className="space-y-3 text-left">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    {language === 'bn' ? 'আপনার নাম' : 'Your Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ আরিফুল ইসলাম' : 'e.g. John Doe'}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    {language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Company Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={demoForm.companyName}
                    onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ স্কাইলাইন ট্রেডার্স' : 'e.g. Skyline Traders'}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    {language === 'bn' ? 'ঠিকানা' : 'Address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={demoForm.address}
                    onChange={(e) => setDemoForm({ ...demoForm, address: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ উত্তরা, ঢাকা' : 'e.g. Uttara, Dhaka'}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={demoForm.phone}
                    onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ ০১৮XXXXXXXX' : 'e.g. +88018XXXXXXXX'}
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 uppercase tracking-wider">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    placeholder="e.g. name@company.com"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-850 transition-colors"
                >
                  {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={demoSubmitLoading}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all hover:scale-[1.02] flex items-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
                  id="submit_demo_visitor_btn"
                >
                  {demoSubmitLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      {language === 'bn' ? 'প্রবেশ করা হচ্ছে...' : 'Entering...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      {language === 'bn' ? 'এক্সপেরিয়েন্স হাব শুরু করুন' : 'Launch Experience Hub'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

