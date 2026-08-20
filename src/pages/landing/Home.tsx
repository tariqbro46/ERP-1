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

  // Normalize content to use consistent light theme backgrounds and colors, matching Login and Softr design
  const content = {
    ...rawContent,
    heroBgColor: "#ffffff",
    heroTitleColor: "#0f172a",
    heroSubtitleColor: "#475569",
    heroCtaPrimaryBg: "#1e293b",
    heroCtaPrimaryText: "#ffffff",
    heroCtaSecondaryText: "#334155",
    statsSectionBg: "#fafafa",
    statsTitleColor: "#0f172a",
    statsSubtitleColor: "#64748b",
    featuresSectionBg: "#ffffff",
    featureCardBg: "#f8fafc",
    featureCardTitleColor: "#0f172a",
    featureCardDescColor: "#64748b",
    ctaTitleColor: "#0f172a",
    ctaSubtitleColor: "#475569",
    ctaSectionBg: "#fafafa",
    ctaButtonBg: "#1e293b",
    ctaButtonText: "#ffffff",
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
        <div className="min-h-screen bg-white text-slate-900 flex flex-col relative overflow-hidden">
          {/* Skeleton Navbar Header */}
          <div className="h-16 border-b border-slate-100 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-24 h-5 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="hidden md:flex items-center gap-6">
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
              <div className="w-16 h-4 bg-slate-100 rounded animate-pulse" />
            </div>
            <div className="w-24 h-9 bg-slate-100 rounded-lg animate-pulse" />
          </div>

          {/* Skeleton Hero Section */}
          <div className="flex-1 max-w-7xl mx-auto px-6 pt-24 pb-20 text-center w-full space-y-8">
            <div className="flex justify-center">
              <div className="w-52 h-7 bg-slate-100 rounded-full animate-pulse" />
            </div>
            
            <div className="space-y-4 max-w-4xl mx-auto animate-pulse">
              <div className="h-14 md:h-16 bg-slate-100 rounded-2xl" />
              <div className="h-14 md:h-16 bg-slate-100 rounded-2xl w-3/4 mx-auto" />
            </div>

            <div className="space-y-2 max-w-2xl mx-auto pt-2 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6 mx-auto" />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 animate-pulse">
              <div className="w-36 h-11 bg-slate-200 rounded-lg" />
              <div className="w-36 h-11 bg-slate-100 rounded-lg" />
            </div>

            {/* Simulated app interface mockup skeleton */}
            <div className="mt-12 border border-slate-100 bg-slate-50/50 rounded-2xl aspect-[16/9] w-full animate-pulse flex flex-col p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                </div>
                <div className="w-32 h-4 bg-slate-200 rounded" />
              </div>
              <div className="flex-1 grid grid-cols-4 gap-4">
                <div className="col-span-1 bg-slate-100 rounded-xl" />
                <div className="col-span-3 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>

          {/* Bottom Right Progressive Step Indicator */}
          {isAdaptiveLoaderEnabled && (
            <div 
              className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-mono text-[11px] uppercase tracking-wider shadow-lg animate-in fade-in duration-300"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold tracking-tight">PROGRESS STATUS</span>
                <span className="text-slate-900 font-semibold">{loadingPhrases[currentPhraseIdx]}</span>
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden text-slate-900">
          <div className="flex flex-col items-center gap-4 relative z-10">
            <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-slate-900 animate-spin" />
            <span className="text-xs font-mono tracking-wider text-slate-500 uppercase">Loading Workspace...</span>
          </div>

          {isAdaptiveLoaderEnabled && (
            <div 
              className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-mono text-[11px] uppercase tracking-wider shadow-lg"
            >
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-slate-400 font-bold tracking-tight">PROGRESS STATUS</span>
                <span className="text-slate-900 font-semibold">{loadingPhrases[currentPhraseIdx]}</span>
              </div>
            </div>
          )}
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-slate-200 selection:text-slate-900 transition-colors duration-300 animate-fadeIn">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        {content.showHero && (
          <section className="relative pt-28 sm:pt-36 pb-20 overflow-hidden bg-white">
            
            {/* Subtle grid pattern background matching Login page */}
            <div 
              className="absolute inset-0 opacity-[0.55] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
                backgroundSize: '88px 88px'
              }}
            />

            {/* Large Decorative Geometric Outlines matching Login page */}
            <div className="absolute top-10 left-8 w-[360px] h-[360px] rounded-full border border-pink-300/50 pointer-events-none" />
            <div className="absolute top-24 right-12 w-[320px] h-[260px] rounded-[36px] border border-indigo-200/60 pointer-events-none" />
            <div className="absolute bottom-20 left-16 w-[360px] h-[240px] rounded-[32px] border border-blue-200/60 pointer-events-none" />
            <div className="absolute -bottom-8 right-20 w-[380px] h-[380px] rounded-[48px] border border-amber-200/50 pointer-events-none" />
            
            {/* Ambient soft glow */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-gradient-to-tr from-pink-100/35 via-indigo-50/25 to-blue-100/25 rounded-full blur-[140px] pointer-events-none" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Inline trending announcement badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200/90 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-xs font-semibold text-slate-700 mb-8 select-none">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                    </span>
                    <span className="text-slate-600">✨ {language === 'bn' ? 'ইআরপি এন্টারপ্রাইজ ইন্টেলিজেন্স' : 'ERP Enterprise Intelligence'}</span>
                    <span className="w-[1px] h-3 bg-slate-200" />
                    <span className="text-blue-600 hover:text-blue-700 transition-colors cursor-pointer flex items-center gap-1 font-medium">
                      Explore Features <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>

                  <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 animate-fadeIn">
                    {content.heroTitle}
                  </h1>

                  <p className="text-base sm:text-lg lg:text-xl max-w-2xl mx-auto mb-10 text-slate-600 font-normal leading-relaxed">
                    {content.heroSubtitle}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-center items-center gap-3.5">
                    {/* Primary Button: Solid Dark Navy Blue */}
                    <Link
                      to={user ? "/dashboard" : "/register"}
                      id="hero-primary-cta"
                      className="w-full sm:w-auto px-7 py-3 rounded-lg text-[13px] font-semibold bg-[#1e293b] hover:bg-[#0f172a] text-white transition-all shadow-[0_1px_2px_rgba(0,0,0,0.08)] active:scale-[0.99] flex items-center justify-center gap-2 group cursor-pointer"
                    >
                      {user ? t('nav.dashboard') : content.heroCtaPrimary}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>

                    {/* Secondary Button: Outline/Light Grey border style */}
                    <Link
                      to="/pricing"
                      id="hero-secondary-cta"
                      className="w-full sm:w-auto px-7 py-3 rounded-lg text-[13px] font-semibold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {content.heroCtaSecondary || "View Pricing Models"}
                    </Link>

                    {/* Experience Hub Demo Button */}
                    {!user && (
                      <button
                        onClick={() => setShowDemoModal(true)}
                        id="hero-demo-cta"
                        className="w-full sm:w-auto px-6 py-3 rounded-lg text-[13px] font-semibold border border-emerald-200 bg-emerald-50/90 hover:bg-emerald-100/80 text-emerald-800 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        {language === 'bn' ? 'এক্সপেরিয়েন্স হাব (ডেমো)' : 'Experience Hub (Demo)'}
                      </button>
                    )}
                  </div>
                </motion.div>

                {/* Light-Themed Dashboard Preview Card matching Floating Card on Login Page */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.98, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 }}
                  className="mt-14 relative max-w-5xl mx-auto z-20"
                >
                  <div className="relative rounded-2xl bg-white border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] overflow-hidden text-slate-900 text-left">
                    
                    {/* Simulated OS Browser Tab and Action Bar */}
                    <div className="bg-[#fafafa] border-b border-slate-100 px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {/* Softr style macOS lights */}
                        <div className="flex gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
                        </div>
                        <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                          <div className="flex items-center gap-0.5">
                            <div className="w-2 h-2 rounded-[1px] bg-[#f97316]" />
                            <div className="w-2 h-2 rounded-[1px] bg-[#e11d48]" />
                            <div className="w-2 h-2 rounded-[1px] bg-[#3b82f6]" />
                            <div className="w-2 h-2 rounded-[1px] bg-[#eab308]" />
                          </div>
                          <span className="text-xs font-bold text-slate-800 tracking-tight">TallyFlow ERP</span>
                        </div>
                      </div>
                      
                      {/* Interactive App Tabs */}
                      <div className="flex bg-slate-100/90 p-1 rounded-lg border border-slate-200/60">
                        {(['finance', 'inventory', 'production', 'payroll'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                              activeTab === tab 
                                ? 'bg-white text-slate-900 shadow-xs' 
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            {language === 'bn' 
                              ? (tab === 'finance' ? 'অর্থায়ন' : tab === 'inventory' ? 'ইনভেন্টরি' : tab === 'production' ? 'উৎপাদন' : 'পেরোল')
                              : (tab.charAt(0).toUpperCase() + tab.slice(1))
                            }
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* App Visual Canvas */}
                    <div className="p-6 sm:p-8 bg-white min-h-[420px] text-left transition-all">
                      {activeTab === 'finance' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Financial Analytics Summary</h4>
                              <p className="text-2xl font-bold text-slate-900 mt-0.5">৳2,482,900 Total Asset Flow</p>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-semibold">+18.4% Revenue Target</span>
                              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60 font-semibold">Live Real-time</span>
                            </div>
                          </div>

                          {/* Live Visual chart representation */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-3 bg-slate-50/70 border border-slate-100 p-6 rounded-xl flex flex-col justify-between min-h-[220px]">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-semibold text-slate-700">Quarterly Income Flow Trend</span>
                                <span className="text-[11px] font-mono text-slate-500">Auto-calculated</span>
                              </div>
                              <div className="h-28 flex items-end gap-2 pt-2">
                                {[54, 76, 45, 90, 68, 100, 85, 95, 110, 80, 95, 120].map((val, i) => (
                                  <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                                    <div 
                                      className="w-full bg-blue-600 hover:bg-blue-700 rounded-t transition-all duration-300"
                                      style={{ height: `${val}%` }} 
                                    />
                                    <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-700">Q{i+1}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Net Profit Margin</p>
                                <p className="text-xl font-bold tracking-tight text-slate-900 mt-1">24.5%</p>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{ width: '24.5%' }} />
                                </div>
                              </div>
                              <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl">
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Total Invoices Disbursed</p>
                                <p className="text-xl font-bold tracking-tight text-slate-900 mt-1">3,485 Pcs</p>
                                <p className="text-[11px] text-emerald-600 mt-2 font-semibold select-none">• Verified & Balanced</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'inventory' && (
                        <div className="space-y-6 animate-fadeIn">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Multi-Godown Stock Levels</h4>
                              <p className="text-2xl font-bold text-slate-900 mt-0.5">৳14,560,000 Active Inventory Value</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">Low-Stock Warnings Configured</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                            <div className="space-y-4">
                              <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-slate-800">Dhaka Warehouse Alpha</span>
                                  <span className="text-xs font-semibold text-slate-600">82% Volume Capacity</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                                  <span>24,800 Items Loaded</span>
                                  <span>Limit: 30,000</span>
                                </div>
                              </div>

                              <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-slate-800">Chittagong Port Terminal</span>
                                  <span className="text-xs font-semibold text-rose-600">Low Stock - 38% Volume</span>
                                </div>
                                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                  <div className="bg-rose-500 h-full rounded-full" style={{ width: '38%' }} />
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                                  <span>11,400 Items Loaded</span>
                                  <span>Limit: 30,000</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl flex flex-col justify-between">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">Stock Ledger Quick Ticker</span>
                              <div className="divide-y divide-slate-200/80">
                                {[
                                  { name: 'Ultra-Tough Cement', qty: '4,500 Bags', godown: 'Dhaka Alpha', color: 'text-emerald-700' },
                                  { name: 'Deformed Steel Rods', qty: '180 Tons', godown: 'Dhaka Alpha', color: 'text-emerald-700' },
                                  { name: 'Fibre Glass Insulation', qty: '12 Rolls', godown: 'Chittagong-Port', color: 'text-rose-600' },
                                ].map((item, i) => (
                                  <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                                    <div>
                                      <p className="font-semibold text-slate-800">{item.name}</p>
                                      <p className="text-[11px] text-slate-500">{item.godown}</p>
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
                              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Line Production Monitoring</h4>
                              <p className="text-2xl font-bold text-slate-900 mt-0.5">Automatic Machine Dispatch Logs</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-semibold">4 Active Lines Online</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {[
                              { lineName: 'Alpha Extruder X1', speed: '48m/min', load: '94% Power Load', progress: 94, statusClass: 'text-purple-700 bg-purple-50 border-purple-200' },
                              { lineName: 'Litho Printer L2', speed: '120 Sheets/min', load: '78% Power Load', progress: 78, statusClass: 'text-blue-700 bg-blue-50 border-blue-200' },
                              { lineName: 'Fila Wrapper F3', speed: 'Idle', load: 'Ready to Process Order', progress: 0, statusClass: 'text-slate-600 bg-slate-100 border-slate-200' },
                            ].map((machine, i) => (
                              <div key={i} className="bg-slate-50/70 border border-slate-100 p-5 rounded-xl flex flex-col justify-between min-h-[150px]">
                                <div>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-slate-800">{machine.lineName}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold border ${machine.statusClass}`}>ONLINE</span>
                                  </div>
                                  <p className="text-xs font-semibold text-slate-500">{machine.speed}</p>
                                </div>
                                <div className="space-y-1.5">
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-purple-600 h-full rounded-full" style={{ width: `${machine.progress}%` }} />
                                  </div>
                                  <p className="text-[10px] text-slate-500 font-medium">{machine.load}</p>
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
                              <h4 className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Automated Workforce Disbursements</h4>
                              <p className="text-2xl font-bold text-slate-900 mt-0.5">৳324,500 Outstanding Salaries Disbursed</p>
                            </div>
                            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">Attendance Secure Track</span>
                          </div>

                          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden pt-1 shadow-xs">
                            <table className="w-full text-xs text-left relative">
                              <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                                <tr>
                                  <th className="py-3 px-4">Employee Full Name</th>
                                  <th className="py-3 px-4 text-center">Designation</th>
                                  <th className="py-3 px-4 text-center">Attendance Status</th>
                                  <th className="py-3 px-4 text-right">Disbursed Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 font-medium select-none">
                                {[
                                  { name: 'Ahmad Rafique', role: 'Production Analyst', attendance: 'Present (On Time)', colorId: 'bg-emerald-500', status: '৳45,000 Transferred' },
                                  { name: 'Nusrat Jahan', role: 'Financial Manager', attendance: 'Present (On Time)', colorId: 'bg-emerald-500', status: '৳72,050 Transferred' },
                                  { name: 'Kamrul Hassan', role: 'Inventory Operator', attendance: 'Excused Leave (Paid)', colorId: 'bg-amber-500', status: '৳34,000 Transferred' },
                                ].map((emp, i) => (
                                  <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="py-3 px-4 flex items-center gap-2.5">
                                      <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold font-mono text-[10px] border border-slate-200">
                                        {emp.name.split(' ').map(n=>n[0]).join('')}
                                      </div>
                                      <span className="text-slate-800 font-semibold">{emp.name}</span>
                                    </td>
                                    <td className="py-3 px-4 text-center text-slate-500">{emp.role}</td>
                                    <td className="py-3 px-4 text-center">
                                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600">
                                        <span className={`w-1.5 h-1.5 rounded-full ${emp.colorId}`} />
                                        {emp.attendance}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-right text-emerald-700 font-mono font-bold">{emp.status}</td>
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
            className="py-16 border-y border-slate-100 relative bg-[#fafafa]"
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
                      className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 text-slate-900 font-sans"
                    >
                      {stat.value}
                    </p>
                    <p 
                      className="text-xs tracking-wider uppercase font-semibold text-slate-500"
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
            className="py-24 sm:py-32 relative overflow-hidden bg-white border-b border-slate-100" 
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <div className="text-center mb-16 sm:mb-20 max-w-2xl mx-auto">
                <span className="text-xs font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full border border-blue-100 mb-4 inline-block">MODULAR ECOSYSTEM</span>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
                  {content.featuresTitle}
                </h2>
                <p className="text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                  {content.featuresSubtitle}
                </p>
              </div>

              {/* Bento Grid Layout */}
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                
                {/* Bento Cell 1: Wide financial card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="md:col-span-4 p-7 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center border border-slate-200/70 shadow-xs mb-6 group-hover:scale-105 transition-transform">
                      <BarChart3 className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2.5">{t('home.feature1Title')}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed select-none">{t('home.feature1Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span>Live Tracking Activated</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  </div>
                </motion.div>

                {/* Bento Cell 2: Secure card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="md:col-span-2 p-7 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-white text-blue-600 rounded-xl flex items-center justify-center border border-slate-200/70 shadow-xs mb-6 group-hover:scale-105 transition-transform">
                      <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2.5">{t('home.feature4Title')}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('home.feature4Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-200/60 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    AES-256 ENCRYPTION
                  </div>
                </motion.div>

                {/* Bento Cell 3: Small Card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="md:col-span-2 p-7 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-white text-purple-600 rounded-xl flex items-center justify-center border border-slate-200/70 shadow-xs mb-6 group-hover:scale-105 transition-transform">
                      <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2.5">{t('home.feature5Title')}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('home.feature5Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-200/60 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                    0ms Latency Pipeline
                  </div>
                </motion.div>

                {/* Bento Cell 4: Large Wide Warehouse card */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="md:col-span-4 p-7 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-white text-amber-600 rounded-xl flex items-center justify-center border border-slate-200/70 shadow-xs mb-6 group-hover:scale-105 transition-transform">
                      <Database className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2.5">{t('home.feature2Title')}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed select-none">{t('home.feature2Desc')}</p>
                  </div>
                  <div className="mt-8 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span className="uppercase tracking-wider">STOCK METRICS CONNECTED</span>
                    <span className="font-mono text-[11px]">DB_ACTIVE // 99.9% UPTIME</span>
                  </div>
                </motion.div>

                {/* Bento Cell 5: Small Card Users */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="md:col-span-3 p-7 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-white text-sky-600 rounded-xl flex items-center justify-center border border-slate-200/70 shadow-xs mb-6 group-hover:scale-105 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2.5">{t('home.feature3Title')}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('home.feature3Desc')}</p>
                  </div>
                </motion.div>

                {/* Bento Cell 6: Small Card Globe */}
                <motion.div
                  whileHover={{ y: -3 }}
                  className="md:col-span-3 p-7 sm:p-8 rounded-2xl bg-slate-50/70 border border-slate-100 hover:border-slate-200 hover:shadow-md flex flex-col justify-between transition-all group"
                >
                  <div>
                    <div className="w-12 h-12 bg-white text-emerald-600 rounded-xl flex items-center justify-center border border-slate-200/70 shadow-xs mb-6 group-hover:scale-105 transition-transform">
                      <Globe className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2.5">{t('home.feature6Title')}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{t('home.feature6Desc')}</p>
                  </div>
                </motion.div>

              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        {content.showCta && (
          <section 
            className="relative py-24 sm:py-32 overflow-hidden text-center bg-[#fafafa] border-t border-slate-100"
          >
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.4] pointer-events-none"
              style={{
                backgroundImage: `linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)`,
                backgroundSize: '88px 88px'
              }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight text-slate-900">
                {content.ctaTitle}
              </h2>
              <p className="max-w-xl mx-auto mb-10 text-base sm:text-lg text-slate-600 font-normal leading-relaxed">
                {content.ctaSubtitle}
              </p>
              <Link
                to={user ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold bg-[#1e293b] hover:bg-[#0f172a] text-white shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
              >
                {user ? t('nav.dashboard') : content.ctaButton}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}
      </main>

      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {language === 'bn' ? 'এক্সপেরিয়েন্স হাব অ্যাক্টিভেশন' : 'Activate Experience Hub'}
                </h3>
              </div>
              <button 
                onClick={() => setShowDemoModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                id="close_demo_modal_btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleDemoSubmit} className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                {language === 'bn' 
                  ? 'এক্সপেরিয়েন্স হাবে স্বাগতম! এখানে এন্ট্রি করা কোনো ডাটা ডাটাবেজে স্টোর হবে না, তবে আপনি রিয়েল-টাইম রিপোর্ট এবং সমস্ত ফিচার সম্পূর্ণ ফ্রিতে ট্রাই করতে পারবেন।' 
                  : 'Welcome to the Experience Hub! All entries here will stay non-persistent inside your browser cache, allowing you to test reports and operations without storing them in the cloud.'}
              </p>

              {demoError && (
                <div className="p-3 text-xs bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                  {demoError}
                </div>
              )}

              <div className="space-y-3 text-left">
                {/* Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'আপনার নাম' : 'Your Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={demoForm.name}
                    onChange={(e) => setDemoForm({ ...demoForm, name: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ আরিফুল ইসলাম' : 'e.g. John Doe'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                {/* Company Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'প্রতিষ্ঠানের নাম' : 'Company Name'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={demoForm.companyName}
                    onChange={(e) => setDemoForm({ ...demoForm, companyName: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ স্কাইলাইন ট্রেডার্স' : 'e.g. Skyline Traders'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ঠিকানা' : 'Address'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={demoForm.address}
                    onChange={(e) => setDemoForm({ ...demoForm, address: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ উত্তরা, ঢাকা' : 'e.g. Uttara, Dhaka'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ফোন নম্বর' : 'Phone Number'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={demoForm.phone}
                    onChange={(e) => setDemoForm({ ...demoForm, phone: e.target.value })}
                    placeholder={language === 'bn' ? 'উদাঃ ০১৮XXXXXXXX' : 'e.g. +88018XXXXXXXX'}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {language === 'bn' ? 'ইমেইল অ্যাড্রেস' : 'Email Address'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={demoForm.email}
                    onChange={(e) => setDemoForm({ ...demoForm, email: e.target.value })}
                    placeholder="e.g. name@company.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  {language === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={demoSubmitLoading}
                  className="px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50"
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

