import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  TrendingUp, 
  CreditCard, 
  Activity, 
  Package, 
  FileText, 
  Play, 
  Lock, 
  Building2, 
  Sparkles, 
  Clock, 
  Check, 
  Layers, 
  DollarSign,
  ChevronRight,
  Maximize2,
  RefreshCw,
  Search,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface EnterpriseSaaSHeroProps {
  content?: any;
  onOpenDemoModal?: () => void;
}

export function EnterpriseSaaSHero({ content, onOpenDemoModal }: EnterpriseSaaSHeroProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Active showcase tab for interactive MacBook display
  const [activeTab, setActiveTab] = useState<'sales' | 'inventory' | 'vat' | 'banking'>('sales');

  // Simulated live counter for user engagement
  const [liveVoucherCount, setLiveVoucherCount] = useState(3372);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateVoucher = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setLiveVoucherCount(prev => prev + 1);
      setIsSimulating(false);
    }, 600);
  };

  return (
    <section className="relative pt-24 sm:pt-32 pb-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-slate-50/60 to-white text-slate-900 border-b border-slate-100">
      
      {/* Subtle Royal Blue Background Glow & Grid Accent (QuickBooks & Xero Style) */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(#2563eb 0.6px, transparent 0.6px), radial-gradient(#3b82f6 0.6px, #ffffff 0.6px)`,
          backgroundSize: '24px 24px',
          backgroundPosition: '0 0, 12px 12px'
        }}
      />
      
      {/* Soft radial blue gradient at top center */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-gradient-to-b from-blue-100/60 via-indigo-50/30 to-transparent rounded-full blur-3xl pointer-events-none -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* ================= 1. ABOVE-THE-FOLD HERO HEADER ================= */}
        <div className="text-center max-w-4xl mx-auto space-y-6">
          
          {/* Trust Kicker / Announcement Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 border border-blue-200/80 text-blue-900 shadow-xs"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
            </span>
            <span className="text-xs font-semibold tracking-wide">
              {isBn 
                ? '⭐️ ১,২০০+ ব্যবসা প্রতিষ্ঠানের আস্থা · এনবিআর ভ্যাট ও ট্যাক্স রেডি' 
                : '⭐️ Trusted by 1,200+ Enterprises · 100% NBR VAT & Tax Ready'}
            </span>
            <span className="text-blue-400">·</span>
            <span className="text-xs font-medium text-blue-700 hidden sm:inline">
              {isBn ? 'ক্লাউড ইআরপি v1.9.9' : 'Cloud ERP v1.9.9'}
            </span>
          </motion.div>

          {/* Main Hero Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]"
          >
            {isBn ? (
              <>
                আপনার ব্যবসার হিসাব ও ইনভেন্টরি <br className="hidden sm:inline" />
                পরিচালনা করুন <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">সহজ, দ্রুত ও নির্ভুলভাবে</span>
              </>
            ) : (
              <>
                Smart Cloud Accounting & ERP <br className="hidden sm:inline" />
                Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600">Growing Enterprises</span>
              </>
            )}
          </motion.h1>

          {/* Subtitle / Value Proposition */}
          <motion.p 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed"
          >
            {isBn 
              ? 'ভাউচার এন্ট্রি, অটোমেটিক ভ্যাট চালান, গোডাউনভিত্তিক লাইভ স্টক ট্র্যাকিং এবং ব্যাংক রিকনসিলিয়েশন—সবকিছু একটি মাত্র আধুনিক ক্লাউড প্ল্যাটফর্মে। কোনো জটিলতা ছাড়াই পরিচালনা করুন পুরো ব্যবসা।'
              : 'Automate invoicing, track multi-godown stock in real time, generate NBR-compliant VAT reports, and make confident business decisions from anywhere, on any device.'}
          </motion.p>

          {/* Primary & Secondary Call to Actions (CTAs) */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Link
              to="/auth"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base shadow-lg shadow-blue-600/25 hover:shadow-blue-600/35 transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <span>{isBn ? '১৪ দিনের ফ্রি ট্রায়াল শুরু করুন' : 'Start Free 14-Day Trial'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <button
              type="button"
              onClick={onOpenDemoModal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-base border border-slate-200/90 shadow-sm hover:border-slate-300 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span>{isBn ? 'লাইভ ডেমো এক্সপ্লোর করুন' : 'Explore Interactive Demo'}</span>
            </button>
          </motion.div>

          {/* Micro Trust Bullets below CTAs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 pt-1"
          >
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'কোনো ক্রেডিট কার্ড লাগবে না' : 'No credit card required'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? '২ মিনিটে সেটআপ রেডি' : 'Instant 2-minute setup'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isBn ? 'ট্যালি ও এক্সেল থেকে ফ্রি ডেটা মাইগ্রেশন' : 'Free data migration'}</span>
            </div>
          </motion.div>
        </div>

        {/* ================= 2. CENTERPIECE: MACBOOK PRO & TABLET ERP MOCKUP ================= */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="mt-12 sm:mt-16 lg:mt-20 relative max-w-6xl mx-auto"
        >
          {/* Subtle Ambient Shadow and Depth */}
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 rounded-[40px] blur-2xl opacity-70 -z-10" />

          {/* Device Mockup Shell (MacBook Pro Unibody Aluminum Finish) */}
          <div className="bg-[#1e232d] p-2.5 sm:p-3.5 rounded-[24px] sm:rounded-[32px] shadow-2xl border border-slate-700/60">
            
            {/* macOS Browser Chrome Header */}
            <div className="bg-[#181c24] px-4 py-2.5 rounded-t-[18px] sm:rounded-t-[24px] flex items-center justify-between border-b border-slate-800">
              {/* Traffic Light Window Dots */}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#ff5f56] inline-block shadow-xs" />
                <span className="w-3 h-3 rounded-full bg-[#ffbd2e] inline-block shadow-xs" />
                <span className="w-3 h-3 rounded-full bg-[#27c93f] inline-block shadow-xs" />
              </div>

              {/* URL Address Bar */}
              <div className="flex items-center gap-2 px-3 sm:px-6 py-1 rounded-lg bg-[#0f1217] border border-slate-800 text-[11px] sm:text-xs font-mono text-slate-400 max-w-md w-full justify-center">
                <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">https://app.tallyflow.erp/dashboard</span>
                <span className="ml-auto text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 hidden sm:inline">
                  TLS 1.3 SECURE
                </span>
              </div>

              {/* Right Mini Controls: Tab Switcher Buttons */}
              <div className="hidden sm:flex items-center gap-1 text-xs">
                {(['sales', 'inventory', 'vat', 'banking'] as const).map((tabKey) => (
                  <button
                    key={tabKey}
                    type="button"
                    onClick={() => setActiveTab(tabKey)}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer",
                      activeTab === tabKey 
                        ? "bg-blue-600 text-white font-semibold" 
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    )}
                  >
                    {tabKey === 'sales' && (isBn ? 'সেলস' : 'Sales')}
                    {tabKey === 'inventory' && (isBn ? 'ইনভেন্টরি' : 'Inventory')}
                    {tabKey === 'vat' && (isBn ? 'ভ্যাট/ট্যাক্স' : 'VAT / Tax')}
                    {tabKey === 'banking' && (isBn ? 'ক্যাশ ও ব্যাংক' : 'Banking')}
                  </button>
                ))}
              </div>
            </div>

            {/* Inside Screen Content: Pristine Enterprise ERP Software Interface */}
            <div className="bg-white rounded-b-[18px] sm:rounded-b-[24px] p-4 sm:p-6 lg:p-7 text-slate-900 overflow-hidden select-none">
              
              {/* App Topbar Inside Display */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-5 border-b border-slate-100 gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    TF
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">
                        {isBn ? 'মদিনা এন্টারপ্রাইজ লিমিটেড' : 'Modina Enterprise Ltd.'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isBn ? 'লাইভ সিঙ্ক' : 'LIVE SYNC'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono">
                      DHAKA, BANGLADESH · FY 2026-27 · VAT REG: 002948192-0101
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleSimulateVoucher}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Simulate a new sales voucher entry in real time"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5", isSimulating && "animate-spin text-blue-600")} />
                    <span>{isBn ? '+ দ্রুত ভাউচার এন্ট্রি' : '+ Quick Voucher Entry'}</span>
                  </button>

                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>{liveVoucherCount.toLocaleString()} {isBn ? 'ভাউচার' : 'Vouchers'}</span>
                  </div>
                </div>
              </div>

              {/* 4 Financial Key Performance Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                
                {/* Metric 1: Monthly Sales */}
                <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>{isBn ? 'মোট বিক্রয় (মাসিক)' : 'Total Sales (Month)'}</span>
                    <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900">
                    ৳৪৫,৬০,৫০০
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <span>↑ ১৮.৪%</span>
                    <span className="text-slate-400 font-normal">{isBn ? 'গত মাসের চেয়ে বৃদ্ধি' : 'vs last month'}</span>
                  </div>
                </div>

                {/* Metric 2: Net Profit */}
                <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>{isBn ? 'নিট লাভ (মার্জিন)' : 'Net Profit (Margin)'}</span>
                    <span className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                      <DollarSign className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-emerald-600">
                    ৳১৬,৪০,২০০
                  </div>
                  <div className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
                    <span>↑ ২২.৬%</span>
                    <span className="text-slate-400 font-normal">{isBn ? 'নিট মার্জিন ৩৫.৯%' : 'net margin 35.9%'}</span>
                  </div>
                </div>

                {/* Metric 3: Total Stock Valuation */}
                <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>{isBn ? 'ইনভেন্টরি ভ্যালুয়েশন' : 'Inventory Value'}</span>
                    <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                      <Package className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900">
                    ৳৮২,৪৫,০০০
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-1">
                    <span>৫টি গোডাউন</span>
                    <span className="text-slate-400 font-normal">· ৫৮৬টি সক্রিয় আইটেম</span>
                  </div>
                </div>

                {/* Metric 4: Cash & Bank Liquidity */}
                <div className="bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 sm:p-4 transition-all">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
                    <span>{isBn ? 'লিকুইডিটি (ক্যাশ ও ব্যাংক)' : 'Cash & Bank'}</span>
                    <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <CreditCard className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold font-mono text-slate-900">
                    ৳২৩,৮৫,০০০
                  </div>
                  <div className="text-[11px] text-blue-600 font-medium flex items-center gap-1 mt-1">
                    <span>সিটি ও ইস্টার্ন ব্যাংক</span>
                    <span className="text-slate-400 font-normal">· রিকনসাইলড</span>
                  </div>
                </div>

              </div>

              {/* Main Analytics & Transaction Area Inside Mockup */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                
                {/* Left 7 Columns: Visual Sales & Invoicing Performance Bar Chart */}
                <div className="lg:col-span-7 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {isBn ? 'মাসিক বিক্রয় বনাম খরচ তুলনা' : 'Monthly Sales & Revenue Growth'}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {isBn ? 'বিগত ৬ মাসের আর্থিক পারফরম্যান্স ট্রেন্ড' : 'Past 6-month comparative trajectory'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/80">
                      AUG - JAN 2026
                    </span>
                  </div>

                  {/* Clean SVG Performance Chart */}
                  <div className="h-44 sm:h-52 w-full pt-2">
                    <div className="h-full w-full flex items-end justify-between gap-3 sm:gap-6 px-2">
                      {[
                        { month: 'Aug', sales: 45, expense: 28, val: '৳২৮.৫L' },
                        { month: 'Sep', sales: 58, expense: 32, val: '৳৩৪.২L' },
                        { month: 'Oct', sales: 65, expense: 36, val: '৳৩৮.০L' },
                        { month: 'Nov', sales: 74, expense: 40, val: '৳৪২.৫L' },
                        { month: 'Dec', sales: 88, expense: 46, val: '৳৪৮.০L' },
                        { month: 'Jan', sales: 96, expense: 50, val: '৳৪৫.৬L' },
                      ].map((bar, i) => (
                        <div key={bar.month} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                          <span className="text-[9px] font-mono font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {bar.val}
                          </span>
                          <div className="w-full flex items-end justify-center gap-1 h-32 sm:h-36">
                            {/* Blue Sales Bar */}
                            <div 
                              style={{ height: `${bar.sales}%` }}
                              className="w-1/2 max-w-[20px] rounded-t-md bg-gradient-to-t from-blue-700 to-blue-500 group-hover:brightness-110 transition-all shadow-xs"
                            />
                            {/* Indigo Expense Bar */}
                            <div 
                              style={{ height: `${bar.expense}%` }}
                              className="w-1/2 max-w-[20px] rounded-t-md bg-slate-300 group-hover:bg-slate-400 transition-all"
                            />
                          </div>
                          <span className="text-[10px] font-mono font-bold text-slate-600">
                            {bar.month}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chart Footnote Legends */}
                  <div className="flex items-center justify-center gap-5 pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                      <span>{isBn ? 'বিক্রয় রেভিনিউ' : 'Sales Revenue'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-slate-300" />
                      <span>{isBn ? 'অপারেশনাল খরচ' : 'Operating Expenses'}</span>
                    </div>
                  </div>
                </div>

                {/* Right 5 Columns: Live Invoices & Recent Ledger Transactions */}
                <div className="lg:col-span-5 bg-slate-50/50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {isBn ? 'সাম্প্রতিক চালান ও লেনদেন' : 'Recent Invoices & Transactions'}
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      REAL-TIME
                    </span>
                  </div>

                  {/* Transaction items list */}
                  <div className="space-y-2.5 my-auto">
                    {[
                      { 
                        id: 'INV-2026-089', 
                        party: isBn ? 'স্কয়ার ফার্মাসিউটিক্যালস' : 'Square Pharmaceuticals Ltd.', 
                        amount: '৳১,৮৫,০০০', 
                        status: isBn ? 'পরিশোধিত' : 'Paid', 
                        statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                      },
                      { 
                        id: 'INV-2026-088', 
                        party: isBn ? 'বেক্সিমকো টেক্সটাইল' : 'Beximco Textiles Ltd.', 
                        amount: '৳৩,২০,০০০', 
                        status: isBn ? 'পরিশোধিত' : 'Paid', 
                        statusColor: 'text-emerald-700 bg-emerald-50 border-emerald-200' 
                      },
                      { 
                        id: 'BILL-2026-042', 
                        party: isBn ? 'মেঘনা লজিস্টিকস সার্ভিসেস' : 'Meghna Logistics Services', 
                        amount: '৳৪৫,৫০০', 
                        status: isBn ? 'বাকি (Due)' : 'Pending', 
                        statusColor: 'text-amber-700 bg-amber-50 border-amber-200' 
                      },
                      { 
                        id: 'VAT-2026-11A', 
                        party: isBn ? 'এনবিআর ভ্যাট চালান (মূসক-৬.৩)' : 'NBR VAT Challan (Mushak 6.3)', 
                        amount: '৳৩৮,৫০০', 
                        status: isBn ? 'কমপ্লায়েন্ট' : 'Compliant', 
                        statusColor: 'text-blue-700 bg-blue-50 border-blue-200' 
                      },
                    ].map((tx) => (
                      <div key={tx.id} className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between text-xs hover:border-slate-300 transition-colors">
                        <div className="truncate pr-2">
                          <p className="font-bold text-slate-800 truncate">{tx.party}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{tx.id}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono font-bold text-slate-900">{tx.amount}</p>
                          <span className={cn("text-[9px] font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5", tx.statusColor)}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 text-center border-t border-slate-200/80">
                    <span className="text-[11px] text-blue-600 font-semibold hover:underline cursor-pointer">
                      {isBn ? 'সবগুলো ভাউচার ও রিপোর্ট এক্সপ্লোর করুন →' : 'View all vouchers & accounting books →'}
                    </span>
                  </div>
                </div>

              </div>

            </div>
          </div>

          {/* ================= 3. FLOATING HIGHLIGHT CARDS (XERO & QUICKBOOKS STYLE) ================= */}
          
          {/* Floating Card 1: Payment Received (Top-Left) */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="hidden md:flex items-center gap-3.5 absolute -top-6 -left-6 lg:-left-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-slate-900 z-20 max-w-xs animate-bounce-subtle"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/30 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900 leading-tight">
                {isBn ? 'পেমেন্ট রিসিভড: ৳৮৫,০০০' : 'Payment Received: ৳85,000'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'সিটি ব্যাংক · অটো ভাউচার পোস্ট' : 'City Bank · Auto Voucher Posted'}
              </p>
            </div>
          </motion.div>

          {/* Floating Card 2: NBR VAT Shield (Bottom-Right) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="hidden md:flex items-center gap-3.5 absolute -bottom-6 -right-6 lg:-right-10 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200/90 text-slate-900 z-20 max-w-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/30 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  {isBn ? 'এনবিআর ভ্যাট চালান মূসক-৬.৩' : 'NBR VAT Mushak 6.3'}
                </p>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">
                {isBn ? '১০০% স্বয়ংক্রিয় ও বৈধ' : '100% Tax Compliant & Verified'}
              </p>
            </div>
          </motion.div>

          {/* Floating Card 3: Stock Synchronized (Bottom-Left) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="hidden lg:flex items-center gap-3 absolute -bottom-8 left-12 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200/90 text-slate-900 z-20"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono font-bold text-slate-800">
              {isBn ? 'গোডাউন ইনভেন্টরি: ১০০% ইন-সিঙ্ক' : 'Godown Stock: 100% In-Sync'}
            </span>
          </motion.div>

        </motion.div>

        {/* ================= 4. SOCIAL PROOF / ENTERPRISE CREDIBILITY BAR ================= */}
        <div className="mt-16 sm:mt-24 pt-10 border-t border-slate-200/80 text-center">
          <p className="text-xs font-bold font-mono uppercase tracking-widest text-slate-400 mb-8">
            {isBn 
              ? 'বাংলাদেশের শীর্ষ রিটেল, হোলসেল ও ম্যানুফ্যাকচারিং প্রতিষ্ঠানের পছন্দ' 
              : 'POWERING INDUSTRY LEADERS ACROSS TRADING, RETAIL & MANUFACTURING'}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8 max-w-4xl mx-auto items-center">
            <div className="p-3 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-700">১,২০০+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{isBn ? 'সক্রিয় ব্যবসা প্রতিষ্ঠান' : 'Active Businesses'}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-slate-900">৳৮৫০M+</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{isBn ? 'মাসিক লেনদেন প্রসেসড' : 'Monthly Transactions'}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600">৯৯.৯৯%</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{isBn ? 'ক্লাউড আপটাইম এসএলএ' : 'Guaranteed Uptime'}</div>
            </div>
            <div className="p-3 text-center">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-indigo-600">২৪/৭</div>
              <div className="text-xs text-slate-500 font-medium mt-0.5">{isBn ? 'ডেডিকেটেড হটলাইন সাপোর্ট' : 'Expert Support'}</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
