import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  FileSpreadsheet,
  Lock,
  ShieldCheck,
  Warehouse,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { LATEST_VERSION } from '../../data/releaseNotes';

export const About = () => {
  const { language } = useLanguage();
  const { appIdentity, appVersion } = useSettings();
  const { user } = useAuth();
  const isBn = language === 'bn';

  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.32').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.32'
    : `v${appVersion || LATEST_VERSION || '1.9.9.32'}`;

  const systemFoundations = isBn
    ? [
        {
          label: 'হিসাবরক্ষণ ইঞ্জিন',
          value: 'ডাবল-এন্ট্রি প্যারিটি · ৮ ভাউচার ধরন',
        },
        {
          label: 'মজুদ মূল্যায়ন',
          value: 'FIFO ব্যাচ কস্টিং ও মাল্টি-গোডাউন',
        },
        {
          label: 'রিপোর্ট পোর্টেবিলিটি',
          value: 'কাঠামোবদ্ধ .xlsx, A4 প্রিন্ট, PDF ও ইমেইল',
        },
        {
          label: 'ডেটা বিচ্ছিন্নতা',
          value: 'companyId ভিত্তিক আলাদা ওয়ার্কস্পেস',
        },
        {
          label: 'অপারেশন ও পেরোল',
          value: 'উৎপাদন অর্ডার, মেশিন ও মাসিক স্যালারি শিট',
        },
        {
          label: 'ভাষা ও অ্যাক্সেস',
          value: 'পূর্ণ বাংলা / English প্যারিটি ও RBAC',
        },
      ]
    : [
        {
          label: 'Accounting Engine',
          value: 'Double-Entry Parity · 8 Voucher Types',
        },
        {
          label: 'Stock Valuation',
          value: 'FIFO Batch Costing & Multi-Godown Transfers',
        },
        {
          label: 'Report Portability',
          value: 'Structured .xlsx, A4 Print Layouts 1 & 2, PDF & Email',
        },
        {
          label: 'Tenant Isolation',
          value: 'Strict companyId Scoping & Activity Audit Trail',
        },
        {
          label: 'Operations & HRM',
          value: 'Production Orders, Machine Tracking & Monthly Payroll',
        },
        {
          label: 'Localization & RBAC',
          value: 'Full EN / বাংলা Parity · Granular Role Access',
        },
      ];

  const principles = isBn
    ? [
        {
          num: '01.',
          title: 'অপরিবর্তনীয় হিসাব সমতা',
          desc: 'প্রতিটি ভাউচার এন্ট্রিতে প্রারম্ভিক ব্যালেন্স + ডেবিট − ক্রেডিট সমীকরণ কঠোরভাবে যাচাই করা হয়। কোনো কাল্পনিক বা অনুমাননির্ভর সংখ্যার বদলে প্রকৃত ট্রানজেকশন থেকেই Trial Balance, Balance Sheet এবং Profit & Loss তৈরি হয়।',
          icon: Check,
        },
        {
          num: '02.',
          title: 'গুদাম ও ব্যাচ পর্যায়ের নির্ভুলতা',
          desc: 'একাধিক গোডাউনের মধ্যে পণ্য স্থানান্তর, FIFO ভিত্তিক মজুদ মূল্যায়ন এবং পরিমাপের একক অনুযায়ী শূন্য দশমিক (Pcs, Pc, Nos) অথবা সর্বোচ্চ দুই দশমিকের (Kg, Ltr) নির্ভুলতা বজায় রাখা হয়।',
          icon: Warehouse,
        },
        {
          num: '03.',
          title: 'কোম্পানি আইসোলেশন ও রোল কন্ট্রোল',
          desc: 'প্রতিটি প্রতিষ্ঠানের হিসাব সম্পূর্ণ পৃথক থাকে। অ্যাডমিন, অ্যাকাউন্ট্যান্ট, স্টোরকিপার এবং মার্কেটিং ম্যানেজারসহ প্রতিটি ভূমিকার জন্য গ্রানুলার অনুমোদন এবং প্রতিটি পরিবর্তনের অডিট লগ সংরক্ষিত হয়।',
          icon: ShieldCheck,
        },
        {
          num: '04.',
          title: 'অফিস-প্রস্তুত এক্সপোর্ট ও দ্বিভাষিক স্পষ্টতা',
          desc: 'এক ক্লিকেই ১০টি মূল রিপোর্ট .xlsx স্প্রেডশিট বা পরিচ্ছন্ন A4 প্রিন্ট ও PDF-এ নেওয়া যায়। অ্যাকাউন্টস টিম থেকে ম্যানেজমেন্ট—সবাই বাংলা বা ইংরেজি যেকোনো ভাষায় নির্বিঘ্নে কাজ করতে পারেন।',
          icon: FileSpreadsheet,
        },
      ]
    : [
        {
          num: '01.',
          title: 'Uncompromising Double-Entry Parity',
          desc: 'Every ledger calculation resolves strictly from real transaction entries using opening balance + debit − credit. Trial Balance, Profit & Loss, and Balance Sheet never fall back on synthetic multipliers.',
          icon: Check,
        },
        {
          num: '02.',
          title: 'Warehouse & Unit Precision',
          desc: 'Multi-godown transfers and FIFO valuation respect strict measurement rules: whole integers for discrete units (Pcs, Pc, Nos) and capped two-decimal precision for weights and currency.',
          icon: Warehouse,
        },
        {
          num: '03.',
          title: 'Strict Company & Role Isolation',
          desc: 'Organization records stay partitioned by companyId, paired with granular role-based access permissions—including Marketing Manager, Storekeeper, Accountant, and Admin—plus an immutable Audit Trail.',
          icon: ShieldCheck,
        },
        {
          num: '04.',
          title: 'Audit-Grade Portability & Bilingual UX',
          desc: 'Teams move effortlessly between English and Bangla across all entry screens and export any core statement into structured .xlsx workbooks, unified A4 PDF files, or direct email dispatches.',
          icon: FileSpreadsheet,
        },
      ];

  return (
    <div
      className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-950 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900"
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-24 relative overflow-x-clip">
        {/* Subtle Architectural Hairline Grid */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 85% 65% at 50% 8%, black 30%, transparent 82%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 65% at 50% 8%, black 30%, transparent 82%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Monospace Metadata Rail */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/85 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">{appName}</span>
              <span aria-hidden="true">·</span>
              <span>{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'আর্কিটেকচার ও উদ্দেশ্য' : 'Architecture & Purpose'}</span>
            </div>

            <nav
              aria-label="Breadcrumb"
              className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0"
            >
              <Link to="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {isBn ? 'হোম' : 'Home'}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {isBn ? 'আমাদের সম্পর্কে' : 'About'}
              </span>
            </nav>
          </div>

          {/* Editorial Mission + Architectural Spec Split */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="pt-10 sm:pt-14 pb-14 border-b border-slate-200/85 dark:border-slate-800"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
              {/* Left Narrative Column */}
              <div className="lg:col-span-7 space-y-5">
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                  {isBn ? 'আমাদের লক্ষ্য ও নির্মাণ দর্শন' : 'Why TallyFlow ERP Exists'}
                </p>
                <h1
                  className="font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(2rem, 3.8vw, 3.25rem)',
                    textWrap: 'balance',
                  }}
                >
                  {isBn ? (
                    <>
                      দ্রুতগতির দৈনন্দিন বুককিপিং এবং{' '}
                      <span className="text-blue-700 dark:text-blue-400">নিরীক্ষা-সম্মত শৃঙ্খলার</span> সমন্বয়।
                    </>
                  ) : (
                    <>
                      Designed for daily ledger speed without sacrificing{' '}
                      <span className="text-blue-700 dark:text-blue-400">accounting rigor.</span>
                    </>
                  )}
                </h1>
                <p className="text-[15px] sm:text-base leading-[1.72] text-slate-600 dark:text-slate-300 max-w-[64ch]">
                  {isBn
                    ? `ট্রেডিং, ডিস্ট্রিবিউশন ও ম্যানুফ্যাকচারিং প্রতিষ্ঠানগুলোর দৈনন্দিন বাস্তবতা মাথায় রেখে ${appName} তৈরি করা হয়েছে। পুরোনো ডেস্কটপ সফটওয়্যারের সীমাবদ্ধতা বা জটিল এন্টারপ্রাইজ টুলের ধীরগতি ছাড়াই এখানে ভাউচার এন্ট্রি, একাধিক গুদামের FIFO স্টক, উৎপাদন অর্ডার, পেরোল এবং ১০টি আর্থিক বিবরণী একত্রে পরিচালিত হয়।`
                    : `${appName} is engineered for commercial enterprises, wholesalers, and manufacturers that outgrow spreadsheets yet reject bloated legacy tools. From keyboard-first double-entry voucher entry to FIFO godown costing, payroll runs, and 10 verifiable financial reports, every workflow is built around speed and audit clarity.`}
                </p>
                <p className="text-sm leading-[1.72] text-slate-600 dark:text-slate-400 max-w-[64ch]">
                  {isBn
                    ? 'সিস্টেমটি মাল্টি-কোম্পানি ডেটা আইসোলেশন, লোকাল-ক্যাশ সমর্থিত দ্রুতগতির কুয়েরি এবং বাংলা ও ইংরেজি—উভয় ভাষায় সমান অভিজ্ঞতা দেওয়ার লক্ষ্যে নির্মিত, যাতে হিসাবরক্ষক, গুদাম কর্মকর্তা এবং ব্যবস্থাপনা কর্তৃপক্ষ একই সত্য তথ্যের ওপর ভিত্তি করে সিদ্ধান্ত নিতে পারেন।'
                    : 'Every tenant workspace is cleanly partitioned by company identity, backed by quota-resilient caching and full English and Bangla parity so accountants, storekeepers, and directors work from one consistent ledger of truth.'}
                </p>
              </div>

              {/* Right System Specification Ledger Card */}
              <div className="lg:col-span-5">
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] overflow-hidden shadow-[0_18px_48px_-16px_rgba(15,23,42,0.06)]">
                  <div className="px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/70 border-b border-slate-200/85 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {isBn ? 'সিস্টেম স্থাপত্য সারাংশ' : 'Architectural Specification'}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      {resolvedVersion}
                    </span>
                  </div>
                  <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                    {systemFoundations.map((item) => (
                      <div key={item.label} className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                        <span className="font-mono text-slate-500 dark:text-slate-400">{item.label}</span>
                        <span className="font-semibold text-slate-950 dark:text-slate-100 sm:text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Operating Principles 01 - 04 */}
          <section className="py-14 border-b border-slate-200/85 dark:border-slate-800">
            <div className="mb-10">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                {isBn ? 'মূল প্রকৌশল নীতিমালা' : 'Engineering & Accounting Principles'}
              </p>
              <h2
                className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
              >
                {isBn ? 'চারটি ভিত্তি যার ওপর আমাদের প্ল্যাটফর্ম দাঁড়িয়ে' : 'Four foundations guiding every screen and calculation'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((p) => {
                const Icon = p.icon;
                return (
                  <div
                    key={p.num}
                    className="p-6 sm:p-7 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 tabular-nums">
                        {p.num}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                      {p.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Grounded Closing Action Strip */}
          <section className="mt-14 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0d1320] p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>{isBn ? 'কোম্পানি ওয়ার্কস্পেস' : 'Multi-Company Ready'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>{isBn ? 'অডিট-রেডি ডেটা' : 'Audit-Ready Books'}</span>
                </span>
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
              >
                {isBn
                  ? 'আপনার প্রতিষ্ঠানের হিসাব ও মজুদ পরিচালনা শুরু করতে প্রস্তুত?'
                  : 'Ready to bring structured ledger precision to your organization?'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn
                  ? 'সরাসরি নতুন কর্মক্ষেত্র তৈরি করুন, অথবা ইউজার গাইড ও সাপোর্ট টিমের সাথে কথা বলুন।'
                  : 'Create your company workspace, review the User Guide, or reach our onboarding desk directly.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 dark:bg-blue-600 text-white text-xs sm:text-[13px] font-semibold hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                <span>
                  {user
                    ? isBn
                      ? 'ড্যাশবোর্ডে যান'
                      : 'Open Dashboard'
                    : isBn
                      ? 'ফ্রি শুরু করুন'
                      : 'Get Started Free'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/guide"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                <span>{isBn ? 'ইউজার গাইড' : 'User Guide'}</span>
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                {isBn ? 'যোগাযোগ ও সাপোর্ট' : 'Contact Support'}
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
