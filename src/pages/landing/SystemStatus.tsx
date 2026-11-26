import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Database,
  FileSpreadsheet,
  Globe,
  History,
  Lock,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { LATEST_VERSION, RELEASE_NOTES } from '../../data/releaseNotes';
import { cn } from '../../lib/utils';

export const SystemStatus: React.FC = () => {
  const { language, t } = useLanguage();
  const {
    appIdentity,
    appVersion,
    maintenanceEnabled,
    maintenanceEndTime,
    maintenanceReason,
    maintenanceUpdates,
  } = useSettings();
  const isBn = language === 'bn';

  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const supportEmail = appIdentity.supportEmail;
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.31').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.31'
    : `v${appVersion || LATEST_VERSION || '1.9.9.31'}`;

  const subsystems = isBn
    ? [
        {
          id: 'web-workspace',
          name: 'ওয়েব ওয়ার্কস্পেস ও মাল্টি-কোম্পানি শেল',
          scope: 'React SPA, ড্যাশবোর্ড ১–৬ ডিজাইন, বাংলা ও ইংরেজি প্যারিটি, এবং লাইট/ডার্ক থিম',
          statusLabel: maintenanceEnabled ? 'নির্ধারিত রক্ষণাবেক্ষণ' : 'সচল (Operational)',
          isMaintenance: maintenanceEnabled,
          icon: Globe,
        },
        {
          id: 'auth-rbac',
          name: 'অথেনটিকেশন ও অ্যাক্সেস কন্ট্রোল',
          scope: 'Firebase Auth, Google Sign-In, companyId আইসোলেশন ও রোল-ভিত্তিক অনুমতি (RBAC)',
          statusLabel: 'সচল (Operational)',
          isMaintenance: false,
          icon: Lock,
        },
        {
          id: 'ledger-storage',
          name: 'ভাউচার, লেজার ও ইনভেন্টরি ডেটা লেয়ার',
          scope: 'ডাবল-এন্ট্রি প্যারিটি, FIFO স্টক ব্যাচ, অটো-সিরিয়াল কাউন্টার ও কোটা-বাফার্ড ক্যাশ',
          statusLabel: maintenanceEnabled ? 'রক্ষণাবেক্ষণ মোড' : 'সচল (Operational)',
          isMaintenance: maintenanceEnabled,
          icon: Database,
        },
        {
          id: 'reporting-export',
          name: 'রিপোর্টিং, .xlsx ও প্রিন্ট/PDF পাইপলাইন',
          scope: '১০টি মূল আর্থিক রিপোর্ট, কাঠামোবদ্ধ .xlsx স্প্রেডশিট, A4 Print Layout ১ ও ২, এবং PDF',
          statusLabel: 'সচল (Operational)',
          isMaintenance: false,
          icon: FileSpreadsheet,
        },
      ]
    : [
        {
          id: 'web-workspace',
          name: 'Web Workspace & Multi-Company Shell',
          scope: 'React SPA, Dashboard Designs 1–6, EN/Bangla localization, and Light/Dark themes',
          statusLabel: maintenanceEnabled ? 'Scheduled Maintenance' : 'Operational',
          isMaintenance: maintenanceEnabled,
          icon: Globe,
        },
        {
          id: 'auth-rbac',
          name: 'Authentication & Role Access Control',
          scope: 'Firebase Authentication, Google Sign-In, tenant companyId scoping, and RBAC rules',
          statusLabel: 'Operational',
          isMaintenance: false,
          icon: Lock,
        },
        {
          id: 'ledger-storage',
          name: 'Voucher, Ledger & Inventory Data Layer',
          scope: 'Double-entry validation, FIFO stock lots, atomic serial counters, and 30-min read cache',
          statusLabel: maintenanceEnabled ? 'Maintenance Window' : 'Operational',
          isMaintenance: maintenanceEnabled,
          icon: Database,
        },
        {
          id: 'reporting-export',
          name: 'Reporting, .xlsx Export & Print Pipeline',
          scope: '10 core statements, structured .xlsx export, unified A4 Print Layouts 1 & 2, PDF & Email',
          statusLabel: 'Operational',
          isMaintenance: false,
          icon: FileSpreadsheet,
        },
      ];

  const architectureSafeguards = isBn
    ? [
        {
          num: '01.',
          title: 'কোটা-বাফার্ড ক্যাশিং ও অফলাইন সহনশীলতা',
          desc: 'অপ্রয়োজনীয় ডেটাবেস রিড কমাতে এবং ক্লাউড কোটা স্থিতিশীল রাখতে ৩০ মিনিটের ক্যাশ ও লোকাল মেট্রিক বাফারিং চালু রয়েছে, যাতে নেটওয়ার্ক বিচ্ছিন্ন হলেও ওয়ার্কস্পেস ভেঙে না পড়ে।',
        },
        {
          num: '02.',
          title: 'কাউন্টার-ভিত্তিক নিরাপদ ভাউচার সিরিয়াল',
          desc: 'ভাউচার তৈরির সময় সম্পূর্ণ কালেকশন স্ক্যান না করে নির্ধারিত কাউন্টার ডকুমেন্ট থেকে সিরিয়াল নম্বর ও লেজার/স্টক ব্যালেন্স অ্যাটমিকভাবে আপডেট করা হয়।',
        },
        {
          num: '03.',
          title: 'যেকোনো সময় পোর্টেবল ব্যাকআপ সুবিধা',
          desc: 'ব্যবহারকারী প্রতিষ্ঠানগুলো সবসময় তাদের Daybook, Ledger Statement, Trial Balance, Balance Sheet এবং Stock Summary রিপোর্ট .xlsx বা A4 PDF আকারে সংরক্ষণ করতে পারেন।',
        },
      ]
    : [
        {
          num: '01.',
          title: 'Quota-Buffered Caching & Graceful Degradation',
          desc: 'Up to 30-minute read caching, targeted indexed range queries, and local buffering keep workspace navigation responsive and protect database read quotas.',
        },
        {
          num: '02.',
          title: 'Atomic Serial Counters & Balance Integrity',
          desc: 'Voucher saves update pre-aggregated ledger balances, stock quantities, and dedicated serial counter documents atomically without deep collection sweeps.',
        },
        {
          num: '03.',
          title: 'Continuous Portability via .xlsx, Print & PDF',
          desc: 'Organizations can archive Daybook, Trial Balance, Ledger Statement, Balance Sheet, and Stock Summary into structured .xlsx workbooks or unified A4 PDF files anytime.',
        },
      ];

  const recentReleases = RELEASE_NOTES.slice(0, 3);

  return (
    <div
      className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-950 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900"
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-24 relative overflow-x-clip">
        {/* Subtle Architectural Hairline Grid matching Enterprise Ledger & Workbench */}
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
          {/* Top Monospace Metadata Rail + Subtle Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200/85 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">{appName}</span>
              <span aria-hidden="true">·</span>
              <span>{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'সিস্টেম স্ট্যাটাস ও স্বাস্থ্য' : 'System Status & Service Health'}</span>
            </div>

            <nav
              aria-label="Breadcrumb"
              className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0"
            >
              <Link to="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {t('nav.breadcrumbHome')}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {t('nav.item.status')}
              </span>
            </nav>
          </div>

          {/* Editorial Header + Overall Workspace Condition */}
          <header className="pt-10 sm:pt-12 pb-12 border-b border-slate-200/85 dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              <div className="lg:col-span-7">
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                  {isBn ? 'অপারেশনাল স্বচ্ছতা ও রক্ষণাবেক্ষণ তথ্য' : 'Operational Availability & Maintenance Notices'}
                </p>
                <h1
                  className="mt-3 font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(2rem, 3.8vw, 3.25rem)',
                    textWrap: 'balance',
                  }}
                >
                  {isBn
                    ? `${appName} সিস্টেম স্ট্যাটাস ও নির্ভরযোগ্যতা।`
                    : `${appName} system health & service readiness.`}
                </h1>
                <p className="mt-5 text-[15.5px] sm:text-[16.5px] text-slate-600 dark:text-slate-300 leading-[1.65] max-w-2xl">
                  {isBn
                    ? 'এই পৃষ্ঠাটি অ্যাপ্লিকেশনের বর্তমান রক্ষণাবেক্ষণ কনফিগারেশন, মূল মডিউলসমূহের স্থাপত্য এবং সাম্প্রতিক ভার্সন প্রকাশের নির্ভুল সারাংশ প্রদর্শন করে।'
                    : 'This summary reflects the active platform maintenance state, core architectural subsystems, and recent verified release milestones—without synthetic metrics.'}
                </p>
              </div>

              {/* Overall Status Summary Panel */}
              <div className="lg:col-span-5">
                <div
                  className={cn(
                    'rounded-xl border p-6',
                    maintenanceEnabled
                      ? 'border-amber-300/90 dark:border-amber-800/70 bg-amber-50/70 dark:bg-amber-950/20'
                      : 'border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0d1320]'
                  )}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-lg border flex items-center justify-center shrink-0',
                        maintenanceEnabled
                          ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-700 dark:text-emerald-400'
                      )}
                    >
                      {maintenanceEnabled ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <CheckCircle2 className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                        {isBn ? 'বর্তমান সিস্টেম অবস্থা' : 'Current Platform Condition'}
                      </p>
                      <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-white">
                        {maintenanceEnabled
                          ? isBn
                            ? 'নির্ধারিত রক্ষণাবেক্ষণ চলমান'
                            : 'Scheduled Maintenance Active'
                          : isBn
                            ? 'সব মূল সাবসিস্টেম স্বাভাবিকভাবে সচল'
                            : 'Core Subsystems Operational'}
                      </h2>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                        {maintenanceEnabled && maintenanceReason
                          ? maintenanceReason
                          : isBn
                            ? 'অ্যাপ কনফিগারেশন অনুযায়ী বর্তমানে কোনো নির্ধারিত ডাউনটাইম সক্রিয় নেই। আপনার ওয়ার্কস্পেস ব্যবহার বা লগইনে কোনো সমস্যা হলে সরাসরি সাপোর্টে জানান।'
                            : 'No scheduled maintenance window is currently flagged in application configuration. If you experience workspace disruption, contact our support desk.'}
                      </p>
                      {maintenanceEnabled && maintenanceEndTime && (
                        <p className="mt-2.5 text-[11.5px] font-mono text-amber-800 dark:text-amber-300 tabular-nums">
                          {isBn ? 'সম্ভাব্য সমাপ্তি:' : 'Scheduled completion:'}{' '}
                          {new Date(maintenanceEndTime).toLocaleString()}
                        </p>
                      )}
                      {maintenanceEnabled && maintenanceUpdates && (
                        <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 border-t border-amber-200/70 dark:border-amber-800/50 pt-2">
                          {maintenanceUpdates}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* 01. Core Subsystems Matrix */}
          <section className="py-14 border-b border-slate-200/85 dark:border-slate-800">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                  {isBn ? '০১. কোর সাবসিস্টেম তালিকা' : '01. Core Architectural Subsystems'}
                </p>
                <h2
                  className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                >
                  {isBn ? 'মডিউলভিত্তিক সেবার প্রস্তুতি' : 'Subsystem coverage across the workspace'}
                </h2>
              </div>

              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {isBn ? `সর্বশেষ বিল্ড: ${resolvedVersion}` : `Active release: ${resolvedVersion}`}
              </span>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] overflow-hidden divide-y divide-slate-200/80 dark:divide-slate-800">
              {subsystems.map((sub) => {
                const Icon = sub.icon;
                return (
                  <div
                    key={sub.id}
                    className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-900/35 transition-colors"
                  >
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-center shrink-0 text-slate-700 dark:text-slate-300 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm sm:text-[15px] font-bold text-slate-950 dark:text-white">
                          {sub.name}
                        </h3>
                        <p className="mt-1 text-xs sm:text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          {sub.scope}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 md:pl-4">
                      {sub.isMaintenance ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                      )}
                      <span
                        className={cn(
                          'text-xs font-semibold whitespace-nowrap',
                          sub.isMaintenance
                            ? 'text-amber-700 dark:text-amber-300'
                            : 'text-emerald-700 dark:text-emerald-400'
                        )}
                      >
                        {sub.statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 02. Reliability Architecture & Recent Release History */}
          <section className="py-14 border-b border-slate-200/85 dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                    {isBn ? '০২. নির্ভরযোগ্যতা ও ধারাবাহিকতা' : '02. Reliability & Continuity Safeguards'}
                  </p>
                  <h2
                    className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white"
                    style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                  >
                    {isBn ? 'ডেটা নিরাপত্তা ও কর্মদক্ষতার ভিত্তি' : 'How workspace stability is maintained'}
                  </h2>
                </div>

                <div className="divide-y divide-slate-200/80 dark:divide-slate-800 border-t border-b border-slate-200/80 dark:border-slate-800">
                  {architectureSafeguards.map((item) => (
                    <div key={item.num} className="py-5 space-y-1.5">
                      <h3 className="text-[15px] font-bold text-slate-950 dark:text-white flex items-baseline gap-2">
                        <span className="font-mono text-xs text-blue-700 dark:text-blue-400 tabular-nums">
                          {item.num}
                        </span>
                        <span>{item.title}</span>
                      </h3>
                      <p className="text-[13.5px] leading-relaxed text-slate-600 dark:text-slate-300 pl-7">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-5 space-y-6">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                    {isBn ? '০৩. সাম্প্রতিক ভার্সন আপডেট' : '03. Recent Version Rollouts'}
                  </p>
                  <h2
                    className="mt-2 text-2xl font-bold tracking-[-0.02em] text-slate-950 dark:text-white"
                    style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                  >
                    {isBn ? 'রিলিজ নোটস সারাংশ' : 'Recent platform releases'}
                  </h2>
                </div>

                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] divide-y divide-slate-200/80 dark:divide-slate-800">
                  {recentReleases.map((rel) => (
                    <div key={rel.version} className="p-4 sm:p-5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-bold text-slate-950 dark:text-white tabular-nums">
                          {rel.version}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {isBn ? rel.bnReleaseDate : rel.releaseDate}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                        {isBn ? rel.bnTitle : rel.title}
                      </p>
                      <p className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                        {isBn
                          ? `${rel.newFeatures.length} নতুন · ${rel.improvements.length} উন্নতি · ${rel.bugFixes.length} ফিক্স`
                          : `${rel.newFeatures.length} features · ${rel.improvements.length} improvements · ${rel.bugFixes.length} fixes`}
                      </p>
                    </div>
                  ))}
                  <div className="p-4">
                    <Link
                      to="/release-notes"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      <History className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সম্পূর্ণ রিলিজ নোটস দেখুন' : 'Inspect full release changelog'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Support & Incident Reporting Strip */}
          <section className="pt-12">
            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0d1320] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.12em] text-blue-700 dark:text-blue-400 font-semibold">
                  <Activity className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সরাসরি সমস্যা প্রতিবেদন' : 'Incident & Connectivity Desk'}</span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white">
                  {isBn
                    ? 'আপনার প্রতিষ্ঠানের ওয়ার্কস্পেসে কোনো ত্রুটি বা ধীরগতি দেখছেন?'
                    : 'Seeing an unexpected error or access issue in your workspace?'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn
                    ? `প্রতিষ্ঠানের নাম, ব্যবহারকারীর ভূমিকা এবং ত্রুটির বিবরণসহ ${supportEmail} ঠিকানায় ইমেইল করুন অথবা সরাসরি সাপোর্ট ডেস্কে বার্তা পাঠান।`
                    : `Share your company name, user role, and error context via ${supportEmail} or our direct support form so our team can investigate promptly.`}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-950 dark:bg-blue-600 text-white text-xs font-semibold hover:opacity-95 transition-opacity whitespace-nowrap"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সাপোর্ট টিমে জানান' : 'Report an Issue'}</span>
                </Link>
                <Link
                  to="/security"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ডেটা নিরাপত্তা দেখুন' : 'Data Security'}</span>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
