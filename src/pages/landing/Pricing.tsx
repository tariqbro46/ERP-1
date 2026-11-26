import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import {
  ArrowRight,
  Check,
  Database,
  FileSpreadsheet,
  FileText,
  Globe,
  Layers,
  MessageSquare,
  Printer,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { SubscriptionPlan } from '../../types';
import { LATEST_VERSION } from '../../data/releaseNotes';
import { cn } from '../../lib/utils';

// Static fallback plans so Pricing renders cleanly with zero extra Firestore reads or writes
const DEFAULT_PUBLIC_PLANS: SubscriptionPlan[] = [
  {
    id: 'bronze-free',
    name: 'Bronze',
    tier: 1,
    description: 'Essential double-entry vouchers, chart of accounts, and core ledger statements.',
    priceMonthly: 0,
    priceYearly: 0,
    features: ['search', 'report_layout', 'notifications'],
    supportType: 'Email',
    supportHours: 'Sat–Thu, 9am–6pm',
    trainingIncluded: false,
    customReports: false,
    apiAccess: false,
    setupFee: 0,
    customDomain: false,
    limits: {
      vouchers: 500,
      items: 100,
      ledgers: 150,
      users: 2,
      godowns: 1,
      multiCurrency: false,
      rolePermissions: true,
    },
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: 'silver-standard',
    name: 'Silver',
    tier: 2,
    description: 'Multi-godown inventory, FIFO stock valuation, batch expiry, and expanded team access.',
    priceMonthly: 1200,
    priceYearly: 11520,
    features: ['inv', 'search', 'report_layout', 'notifications', 'notes'],
    supportType: 'Chat',
    supportHours: 'Sat–Thu, 9am–6pm',
    trainingIncluded: true,
    customReports: false,
    apiAccess: false,
    setupFee: 0,
    customDomain: false,
    limits: {
      vouchers: 5000,
      items: 1500,
      ledgers: 1000,
      users: 5,
      godowns: 5,
      multiCurrency: true,
      rolePermissions: true,
    },
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: 'gold-enterprise',
    name: 'Gold',
    tier: 3,
    description: 'Unlimited vouchers with Payroll, Order Management, Manufacturing, and Financial Insights.',
    priceMonthly: 2500,
    priceYearly: 24000,
    features: [
      'inv',
      'payroll',
      'production',
      'ord',
      'insights',
      'notifications',
      'notes',
      'search',
      'ui_custom',
      'report_layout',
      'whatsapp_temp',
    ],
    supportType: 'Phone',
    supportHours: 'Extended Hours',
    trainingIncluded: true,
    customReports: true,
    apiAccess: false,
    setupFee: 0,
    customDomain: false,
    limits: {
      vouchers: -1,
      items: -1,
      ledgers: -1,
      users: 15,
      godowns: -1,
      multiCurrency: true,
      rolePermissions: true,
    },
    createdAt: new Date(2026, 0, 1),
  },
  {
    id: 'platinum-custom',
    name: 'Platinum',
    tier: 4,
    description: 'Unlimited users and companies with dedicated onboarding, custom domain, and tailored SLA.',
    priceMonthly: 0,
    priceYearly: 0,
    features: [
      'inv',
      'payroll',
      'production',
      'ord',
      'insights',
      'notifications',
      'notes',
      'search',
      'ui_custom',
      'report_layout',
      'whatsapp_temp',
    ],
    supportType: 'Dedicated Manager',
    supportHours: '24/7 SLA',
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
      rolePermissions: true,
    },
    createdAt: new Date(2026, 0, 1),
  },
];

const FEATURE_CATALOG: Record<
  string,
  { en: string; bn: string; descEn: string; descBn: string }
> = {
  inv: {
    en: 'Multi-Godown Inventory & FIFO',
    bn: 'মাল্টি-গোডাউন ইনভেন্টরি ও FIFO',
    descEn: 'Track stock transfers across warehouses, FIFO batch lots, expiry dates, and low-stock alerts.',
    descBn: 'একাধিক গুদামে স্টক ট্রান্সফার, FIFO ব্যাচ লট, মেয়াদ এবং লো-স্টক সতর্কতা পরিচালনা।',
  },
  payroll: {
    en: 'Workforce Payroll & Attendance',
    bn: 'পেরোল ও উপস্থিতি ব্যবস্থাপনা',
    descEn: 'Manage employee masters, monthly salary sheets, attendance registers, payslips, and payment advice.',
    descBn: 'কর্মী প্রোফাইল, মাসিক স্যালারি শিট, উপস্থিতি রেজিস্টার, পে-স্লিপ ও পেমেন্ট অ্যাডভাইস।',
  },
  production: {
    en: 'Manufacturing & Machine Control',
    bn: 'উৎপাদন ও মেশিন নিয়ন্ত্রণ',
    descEn: 'Convert customer orders and raw material consumption into finished goods with machine tracking.',
    descBn: 'অর্ডার ও কাঁচামাল ব্যবহার থেকে মেশিন ট্র্যাকিংসহ ফিনিশড গুডস উৎপাদন এন্ট্রি।',
  },
  ord: {
    en: 'Order Management Workflow',
    bn: 'অর্ডার ম্যানেজমেন্ট কর্মপ্রবাহ',
    descEn: 'Record, schedule, and track sales and production orders from booking to final dispatch.',
    descBn: 'বুকিং থেকে ডেলিভারি পর্যন্ত বিক্রয় ও উৎপাদন অর্ডার সংরক্ষণ ও ট্র্যাকিং।',
  },
  insights: {
    en: 'Financial Insights & Analytics',
    bn: 'ফিন্যান্সিয়াল ইনসাইটস ও বিশ্লেষণ',
    descEn: 'Period-accurate expense distribution, ratio analysis, cash flow, and cost centre breakdowns.',
    descBn: 'নির্ধারিত সময়ের ব্যয় বিভাজন, অনুপাত বিশ্লেষণ, ক্যাশ ফ্লো ও কস্ট সেন্টার রিপোর্ট।',
  },
  notifications: {
    en: 'System Alerts & Reminders',
    bn: 'সিস্টেম অ্যালার্ট ও রিমাইন্ডার',
    descEn: 'Low-stock warnings, overdue party payment reminders, and voucher action notifications.',
    descBn: 'লো-স্টক সতর্কতা, বকেয়া পরিশোধ রিমাইন্ডার এবং ভাউচার নোটিফিকেশন।',
  },
  notes: {
    en: 'Executive Notes & Memos',
    bn: 'এক্সিকিউটিভ নোট ও মেমো',
    descEn: 'Structured internal workspace notes and pinned operational reminders for teams.',
    descBn: 'টিমের জন্য অভ্যন্তরীণ নোট ও পিন করা কাজের অনুস্মারক।',
  },
  search: {
    en: 'Quota-Capped Global Search',
    bn: 'কোটা-সুরক্ষিত গ্লোবাল সার্চ',
    descEn: 'Fast cached lookup across vouchers, ledgers, stock items, and godowns.',
    descBn: 'ক্যাশ-সমর্থিত দ্রুত ভাউচার, লেজার, আইটেম ও গোডাউন অনুসন্ধান।',
  },
  ui_custom: {
    en: '6 Dashboard Layouts & Themes',
    bn: '৬টি ড্যাশবোর্ড ডিজাইন ও থিম',
    descEn: 'Switch between Dashboard Designs 1–6, Light/Dark modes, and Skeleton loader preferences.',
    descBn: 'ড্যাশবোর্ড ডিজাইন ১–৬, লাইট/ডার্ক থিম এবং স্কেলিটন লোডার নিয়ন্ত্রণ।',
  },
  report_layout: {
    en: '.xlsx Export, A4 Print & PDF',
    bn: '.xlsx এক্সপোর্ট, A4 প্রিন্ট ও PDF',
    descEn: 'Structured Excel (.xlsx) export plus unified A4 Print Layout 1 & 2 and PDF generation.',
    descBn: 'কাঠামোবদ্ধ Excel (.xlsx) এক্সপোর্ট ও অভিন্ন A4 Print Layout ১ ও ২ এবং PDF তৈরি।',
  },
  whatsapp_temp: {
    en: 'WhatsApp & Email Dispatch Templates',
    bn: 'হোয়াটসঅ্যাপ ও ইমেইল টেমপ্লেট',
    descEn: 'Pre-formatted invoice and payment confirmation messages for instant party sharing.',
    descBn: 'ইনভয়েস ও পেমেন্ট নিশ্চিতকরণ দ্রুত পাঠানোর জন্য নির্ধারিত মেসেজ টেমপ্লেট।',
  },
};

const COMPARISON_FEATURE_IDS = [
  'inv',
  'payroll',
  'production',
  'ord',
  'insights',
  'report_layout',
  'ui_custom',
  'search',
  'notifications',
  'notes',
  'whatsapp_temp',
];

export const Pricing = () => {
  const { language } = useLanguage();
  const { subscriptionPlans, appIdentity, appVersion } = useSettings();
  const { user } = useAuth();
  const isBn = language === 'bn';

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlanDetails, setSelectedPlanDetails] = useState<SubscriptionPlan | null>(null);

  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.31').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.31'
    : `v${appVersion || LATEST_VERSION || '1.9.9.31'}`;

  // Use already-loaded SettingsContext subscriptionPlans cleanly with static fallback — zero extra Firestore reads
  const sortedPlans = useMemo(() => {
    const source = subscriptionPlans && subscriptionPlans.length > 0 ? [...subscriptionPlans] : [...DEFAULT_PUBLIC_PLANS];
    const hasPlatinum = source.some((p) => p.tier === 4 || p.name.toLowerCase() === 'platinum');
    if (!hasPlatinum) {
      source.push(DEFAULT_PUBLIC_PLANS[3]);
    }
    return source.sort((a, b) => (a.tier || 0) - (b.tier || 0));
  }, [subscriptionPlans]);

  const getTierNameBn = (plan: SubscriptionPlan) => {
    const lower = plan.name.toLowerCase();
    if (lower === 'bronze') return 'ব্রোঞ্জ';
    if (lower === 'silver') return 'সিলভার';
    if (lower === 'gold') return 'গোল্ড';
    if (lower === 'platinum') return 'প্ল্যাটিনাম';
    return plan.name;
  };

  const getTierDesc = (plan: SubscriptionPlan) => {
    if (!isBn) return plan.description;
    const lower = plan.name.toLowerCase();
    if (lower === 'bronze') return 'প্রয়োজনীয় ডাবল-এন্ট্রি ভাউচার, চার্ট অফ অ্যাকাউন্টস এবং মূল লেজার বিবরণী।';
    if (lower === 'silver') return 'মাল্টি-গোডাউন ইনভেন্টরি, FIFO স্টক মূল্যায়ন, ব্যাচ ও বাড়তি ইউজার সুবিধা।';
    if (lower === 'gold') return 'সীমাহীন ভাউচারসহ পেরোল, অর্ডার ম্যানেজমেন্ট, উৎপাদন ও ফিন্যান্সিয়াল ইনসাইটস।';
    if (lower === 'platinum') return 'সীমাহীন ইউজার ও কোম্পানি, কাস্টম ডোমেইন, ডেডিকেটেড সাপোর্ট ও SLA সুবিধা।';
    return plan.description;
  };

  const getFeatureLabel = (fId: string) => {
    const entry = FEATURE_CATALOG[fId];
    if (entry) return isBn ? entry.bn : entry.en;
    return fId.toUpperCase();
  };

  const getFeatureDesc = (fId: string) => {
    const entry = FEATURE_CATALOG[fId];
    if (entry) return isBn ? entry.descBn : entry.descEn;
    return isBn ? 'এন্টারপ্রাইজ সিস্টেম মডিউল।' : 'Enterprise ERP operational module.';
  };

  const getFeatureIcon = (featureId: string) => {
    switch (featureId) {
      case 'inv':
        return Database;
      case 'payroll':
        return Users;
      case 'production':
      case 'ord':
        return Layers;
      case 'insights':
        return FileSpreadsheet;
      case 'notifications':
        return ShieldCheck;
      case 'notes':
        return FileText;
      case 'search':
        return Globe;
      case 'ui_custom':
        return Settings;
      case 'report_layout':
        return Printer;
      case 'whatsapp_temp':
        return MessageSquare;
      default:
        return Check;
    }
  };

  const planHasFeature = (plan: SubscriptionPlan, featureId: string) => {
    // Gold (Tier 3) and Platinum (Tier 4) include all major ERP modules
    if ((plan.tier || 0) >= 3) return true;
    if (featureId === 'report_layout' || featureId === 'search') return true;
    return Array.isArray(plan.features) && plan.features.includes(featureId);
  };

  const pricingFaqs = isBn
    ? [
        {
          q: 'প্রতিটি প্ল্যানে কি .xlsx, A4 প্রিন্ট ও PDF এক্সপোর্ট পাওয়া যায়?',
          a: 'হ্যাঁ। ব্রোঞ্জ থেকে প্ল্যাটিনাম পর্যন্ত সব প্ল্যানে ১০টি মূল রিপোর্টের কাঠামোবদ্ধ .xlsx এক্সপোর্ট এবং Layout ১ ও ২ অনুযায়ী A4 প্রিন্ট ও PDF সুবিধা অন্তর্ভুক্ত।',
        },
        {
          q: 'গোল্ড (Tier 3) প্ল্যানে কোন কোন অতিরিক্ত মডিউল চালু থাকে?',
          a: 'গোল্ড এবং তার উপরের প্ল্যানে সীমাহীন ভাউচারের পাশাপাশি পেরোল, অর্ডার ম্যানেজমেন্ট, উৎপাদন ও মেশিন এবং ফিন্যান্সিয়াল ইনসাইটস স্বয়ংক্রিয়ভাবে অন্তর্ভুক্ত থাকে।',
        },
        {
          q: 'প্রতিটি কোম্পানির ডেটা কি আলাদাভাবে সুরক্ষিত থাকে?',
          a: 'হ্যাঁ। প্রতিটি প্রতিষ্ঠানের ভাউচার, লেজার, গোডাউন ও রিপোর্ট companyId দ্বারা সম্পূর্ণ পৃথক থাকে এবং মার্কেটিং ম্যানেজারসহ রোল-ভিত্তিক অনুমোদন সমর্থন করে।',
        },
        {
          q: 'প্ল্যান পরিবর্তন বা কাস্টম প্ল্যাটিনাম প্যাকেজ কীভাবে নেব?',
          a: 'ড্যাশবোর্ডের Subscription ট্যাব থেকে সরাসরি আপগ্রেড অনুরোধ পাঠাতে পারবেন অথবা যোগাযোগ পাতার মাধ্যমে আমাদের টিমের সাথে কাস্টম SLA নির্ধারণ করতে পারবেন।',
        },
      ]
    : [
        {
          q: 'Are .xlsx, A4 Print, and PDF exports included on every plan?',
          a: 'Yes. Every tier from Bronze through Platinum includes structured .xlsx export plus identical A4 Print Layout 1 & 2 and PDF generation across the core reports.',
        },
        {
          q: 'Which operational modules unlock on Gold (Tier 3) and above?',
          a: 'Gold Plan and above include unlimited vouchers plus full access to Payroll, Order Management, Manufacturing & Machines, and Financial Insights & Analytics.',
        },
        {
          q: 'How is multi-company and staff role access isolated?',
          a: 'All vouchers, ledgers, stock movements, and reports are scoped strictly by companyId with granular role permissions including Admin, Accountant, Storekeeper, and Marketing Manager.',
        },
        {
          q: 'How can an organization upgrade or request Platinum SLA?',
          a: 'Existing administrators can submit an upgrade request directly from the Subscription page inside the Dashboard, or contact our team for custom Platinum licensing.',
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
              <span>{isBn ? 'সাবস্ক্রিপশন ও লাইসেন্সিং' : 'Subscription & Licensing'}</span>
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
                {isBn ? 'প্রাইসিং' : 'Pricing'}
              </span>
            </nav>
          </div>

          {/* Pricing Header + Billing Cycle Segmented Control */}
          <header className="pt-10 sm:pt-12 pb-10 border-b border-slate-200/85 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                {isBn ? 'স্বচ্ছ মূল্য কাঠামো ও টিয়ার লিমিট' : 'Transparent Plan Tiers & Limits'}
              </p>
              <h1
                className="mt-3 font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                  fontSize: 'clamp(2rem, 3.8vw, 3.25rem)',
                  textWrap: 'balance',
                }}
              >
                {isBn ? (
                  <>
                    ব্যবসার আকার অনুযায়ী{' '}
                    <span className="text-blue-700 dark:text-blue-400">স্বচ্ছ প্ল্যান</span> নির্বাচন করুন।
                  </>
                ) : (
                  <>
                    Predictable licensing built for{' '}
                    <span className="text-blue-700 dark:text-blue-400">growing ledgers.</span>
                  </>
                )}
              </h1>
              <p className="mt-4 text-[15px] sm:text-base leading-[1.68] text-slate-600 dark:text-slate-300 max-w-[60ch]">
                {isBn
                  ? 'ফ্রি ব্রোঞ্জ প্ল্যান দিয়ে শুরু করুন অথবা মাল্টি-গোডাউন স্টক, পেরোল, উৎপাদন ও সীমাহীন ভাউচারের জন্য সিলভার, গোল্ড বা কাস্টম প্ল্যাটিনাম বেছে নিন।'
                  : 'Begin free on Bronze or scale to Silver, Gold, and custom Platinum as your transaction volume, warehouses, and payroll departments expand.'}
              </p>
            </div>

            {/* Clean Segmented Toggle */}
            <div className="shrink-0">
              <div
                role="tablist"
                aria-label={isBn ? 'বিলিং সময়কাল' : 'Billing cycle'}
                className="inline-flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingCycle === 'monthly'}
                  onClick={() => setBillingCycle('monthly')}
                  className={cn(
                    'px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                    billingCycle === 'monthly'
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  )}
                >
                  {isBn ? 'মাসিক বিলিং' : 'Monthly'}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={billingCycle === 'yearly'}
                  onClick={() => setBillingCycle('yearly')}
                  className={cn(
                    'px-4 py-2 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap',
                    billingCycle === 'yearly'
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  )}
                >
                  {isBn ? 'বাৎসরিক (২০% সাশ্রয়)' : 'Yearly (Save 20%)'}
                </button>
              </div>
            </div>
          </header>

          {/* TIER CARDS GRID */}
          <section className="py-12 border-b border-slate-200/85 dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
              {sortedPlans.map((plan, idx) => {
                const tierNum = plan.tier || idx + 1;
                const isPlatinum = tierNum === 4 || plan.name.toLowerCase() === 'platinum';
                const isGold = tierNum === 3 || plan.name.toLowerCase() === 'gold';
                const isBronze = tierNum === 1 || plan.name.toLowerCase() === 'bronze';
                const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;

                const discount = plan.discount;
                const originalPrice =
                  discount && discount.value > 0
                    ? discount.type === 'percentage'
                      ? Math.round(price / (1 - discount.value / 100))
                      : price + discount.value
                    : null;

                const displayedFeatures = (isGold || isPlatinum
                  ? ['inv', 'payroll', 'production', 'insights', 'report_layout']
                  : plan.features.slice(0, 5)
                ).filter((v, i, arr) => arr.indexOf(v) === i);

                const totalPlanFeatureCount =
                  isGold || isPlatinum ? COMPARISON_FEATURE_IDS.length : plan.features.length;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      'rounded-xl border p-6 flex flex-col justify-between transition-colors bg-white dark:bg-[#0d1320]',
                      isGold
                        ? 'border-blue-600 dark:border-blue-500 ring-1 ring-blue-600/15'
                        : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <div>
                      {/* Quiet Top Metadata Kicker */}
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-[0.1em]">
                        <span
                          className={cn(
                            'font-semibold',
                            isGold
                              ? 'text-blue-700 dark:text-blue-400'
                              : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {isBn ? `টিয়ার ০${tierNum}` : `Tier 0${tierNum}`}
                          {isGold
                            ? isBn
                              ? ' · পূর্ণ ইআরপি সুইট'
                              : ' · Full ERP Suite'
                            : isPlatinum
                              ? isBn
                                ? ' · কাস্টম SLA'
                                : ' · Custom SLA'
                              : ''}
                        </span>
                        {discount && discount.value > 0 && (
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                            {discount.type === 'percentage'
                              ? `${discount.value}% OFF`
                              : `৳${discount.value} OFF`}
                          </span>
                        )}
                      </div>

                      <h2
                        className="mt-2.5 text-xl font-bold tracking-tight text-slate-950 dark:text-white"
                        style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                      >
                        {isBn ? getTierNameBn(plan) : plan.name}
                        {isBronze && (
                          <span className="ml-2 text-xs font-normal text-slate-500 dark:text-slate-400">
                            ({isBn ? 'ফ্রি' : 'Free'})
                          </span>
                        )}
                      </h2>

                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed min-h-[38px]">
                        {getTierDesc(plan)}
                      </p>

                      {/* Price Display */}
                      <div className="my-5 py-4 border-y border-slate-200/80 dark:border-slate-800">
                        {isPlatinum ? (
                          <div>
                            <div className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white font-mono">
                              {isBn ? 'কাস্টম প্রাইসিং' : 'Custom Pricing'}
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                              {isBn ? 'প্রতিষ্ঠানের চাহিদা অনুযায়ী নির্ধারিত' : 'Tailored to multi-branch enterprise volume'}
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white font-mono tabular-nums">
                                ৳{price.toLocaleString('en-US')}
                              </span>
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                /{billingCycle === 'monthly' ? (isBn ? 'মাস' : 'month') : isBn ? 'বছর' : 'year'}
                              </span>
                            </div>
                            {originalPrice ? (
                              <p className="mt-1 text-xs line-through font-mono text-slate-400 tabular-nums">
                                ৳{originalPrice.toLocaleString('en-US')}
                              </p>
                            ) : (
                              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                {plan.setupFee && plan.setupFee > 0
                                  ? isBn
                                    ? `সেটআপ ফি: ৳${plan.setupFee.toLocaleString('en-US')}`
                                    : `Setup Fee: ৳${plan.setupFee.toLocaleString('en-US')}`
                                  : isBn
                                    ? 'বিনামূল্যে অনবোর্ডিং · কোনো সেটআপ ফি নেই'
                                    : 'Zero setup fee · Instant provisioning'}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Limits & Key Modules */}
                      <div className="space-y-3 mb-6">
                        <p className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 font-semibold">
                          {isBn ? 'বরাদ্দ ও মডিউল' : 'Capacity & Modules'}
                        </p>

                        <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span className="font-mono tabular-nums">
                              {plan.limits?.vouchers === -1
                                ? isBn
                                  ? 'সীমাহীন ভাউচার'
                                  : 'Unlimited Vouchers'
                                : isBn
                                  ? `${(plan.limits?.vouchers ?? 500).toLocaleString('en-US')} ভাউচার`
                                  : `${(plan.limits?.vouchers ?? 500).toLocaleString('en-US')} Vouchers`}
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span className="font-mono tabular-nums">
                              {plan.limits?.users === -1
                                ? isBn
                                  ? 'সীমাহীন স্টাফ ইউজার'
                                  : 'Unlimited Staff Users'
                                : isBn
                                  ? `${plan.limits?.users ?? 2} স্টাফ অ্যাকাউন্ট`
                                  : `${plan.limits?.users ?? 2} Staff Accounts`}
                            </span>
                          </li>
                          <li className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                            <span className="font-mono tabular-nums">
                              {plan.limits?.godowns === -1
                                ? isBn
                                  ? 'সীমাহীন গোডাউন'
                                  : 'Unlimited Godowns'
                                : isBn
                                  ? `${plan.limits?.godowns ?? 1}টি গোডাউন`
                                  : `${plan.limits?.godowns ?? 1} Godown(s)`}
                            </span>
                          </li>

                          {displayedFeatures.map((fId) => (
                            <li key={fId} className="flex items-start gap-2">
                              <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                              <span>{getFeatureLabel(fId)}</span>
                            </li>
                          ))}
                        </ul>

                        {totalPlanFeatureCount > displayedFeatures.length && (
                          <button
                            type="button"
                            onClick={() => setSelectedPlanDetails(plan)}
                            className="w-full mt-2 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            {isBn
                              ? `সব ${totalPlanFeatureCount}টি সাবসিস্টেম দেখুন`
                              : `Inspect all ${totalPlanFeatureCount} modules`}
                          </button>
                        )}
                      </div>
                    </div>

                    {isPlatinum ? (
                      <Link
                        to="/contact"
                        className="w-full py-2.5 px-4 rounded-lg bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950 hover:opacity-95 font-semibold text-xs text-center transition-opacity flex items-center justify-center gap-2 whitespace-nowrap"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সেলস টিমে যোগাযোগ করুন' : 'Contact Sales Desk'}</span>
                      </Link>
                    ) : (
                      <Link
                        to={user ? '/dashboard' : '/register'}
                        className={cn(
                          'w-full py-2.5 px-4 rounded-lg font-semibold text-xs text-center transition-opacity flex items-center justify-center gap-2 whitespace-nowrap hover:opacity-95',
                          isGold
                            ? 'bg-blue-700 dark:bg-blue-600 text-white'
                            : 'bg-slate-950 dark:bg-slate-800 text-white'
                        )}
                      >
                        <span>
                          {user
                            ? isBn
                              ? 'ড্যাশবোর্ডে ম্যানেজ করুন'
                              : 'Manage in Dashboard'
                            : isBn
                              ? 'প্ল্যান বেছে শুরু করুন'
                              : 'Select Plan'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* DETAILED COMPARISON MATRIX */}
          <section className="py-14 border-b border-slate-200/85 dark:border-slate-800">
            <div className="mb-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                {isBn ? '০১. বিস্তারিত তুলনামূলক তালিকা' : '01. Detailed Plan Comparison Matrix'}
              </p>
              <h2
                className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
              >
                {isBn ? 'সিস্টেম সীমা ও মডিউল যাচাই করুন' : 'Compare capacities and capabilities side by side'}
              </h2>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320]">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 z-10">
                  <tr className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-5 align-middle font-semibold">
                      {isBn ? 'মডিউল / প্যারামিটার' : 'Module / Parameter'}
                    </th>
                    {sortedPlans.map((plan) => (
                      <th key={plan.id} className="py-3.5 px-5 align-middle text-center font-bold text-slate-950 dark:text-white">
                        {isBn ? getTierNameBn(plan) : plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5 align-middle font-semibold text-slate-900 dark:text-slate-100">
                      {billingCycle === 'monthly'
                        ? isBn
                          ? 'মাসিক ফি'
                          : 'Monthly Rate'
                        : isBn
                          ? 'বাৎসরিক ফি'
                          : 'Annual Rate'}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="py-3.5 px-5 align-middle text-center font-mono tabular-nums font-bold text-slate-950 dark:text-white">
                        {plan.tier === 4 || plan.name.toLowerCase() === 'platinum'
                          ? isBn
                            ? 'কাস্টম SLA'
                            : 'Custom SLA'
                          : `৳${(billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly).toLocaleString('en-US')}`}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5 align-middle font-semibold text-slate-900 dark:text-slate-100">
                      {isBn ? 'সর্বোচ্চ ভাউচার সীমা' : 'Voucher Quota'}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="py-3.5 px-5 align-middle text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {plan.limits?.vouchers === -1
                          ? isBn
                            ? 'সীমাহীন'
                            : 'Unlimited'
                          : (plan.limits?.vouchers ?? 500).toLocaleString('en-US')}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5 align-middle font-semibold text-slate-900 dark:text-slate-100">
                      {isBn ? 'অনুমোদিত স্টাফ ইউজার' : 'Staff Accounts'}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="py-3.5 px-5 align-middle text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {plan.limits?.users === -1
                          ? isBn
                            ? 'সীমাহীন'
                            : 'Unlimited'
                          : plan.limits?.users ?? 2}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5 align-middle font-semibold text-slate-900 dark:text-slate-100">
                      {isBn ? 'গোডাউন / ওয়্যারহাউস সংখ্যা' : 'Godowns / Warehouses'}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="py-3.5 px-5 align-middle text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                        {plan.limits?.godowns === -1
                          ? isBn
                            ? 'সীমাহীন'
                            : 'Unlimited'
                          : plan.limits?.godowns ?? 1}
                      </td>
                    ))}
                  </tr>

                  {COMPARISON_FEATURE_IDS.map((fId) => (
                    <tr key={fId} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                      <td className="py-3.5 px-5 align-middle font-medium text-slate-800 dark:text-slate-200">
                        {getFeatureLabel(fId)}
                      </td>
                      {sortedPlans.map((plan) => {
                        const included = planHasFeature(plan, fId);
                        return (
                          <td key={plan.id} className="py-3.5 px-5 align-middle text-center">
                            {included ? (
                              <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5 align-middle font-medium text-slate-800 dark:text-slate-200">
                      {isBn ? 'মাল্টি-কারেন্সি লেনদেন' : 'Multi-Currency Ledgers'}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="py-3.5 px-5 align-middle text-center">
                        {plan.limits?.multiCurrency ? (
                          <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 mx-auto" />
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600 font-mono">—</span>
                        )}
                      </td>
                    ))}
                  </tr>

                  <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-900/40">
                    <td className="py-3.5 px-5 align-middle font-medium text-slate-800 dark:text-slate-200">
                      {isBn ? 'সাপোর্ট চ্যানেল ও সময়সূচী' : 'Support Channel & Hours'}
                    </td>
                    {sortedPlans.map((plan) => (
                      <td key={plan.id} className="py-3.5 px-5 align-middle text-center font-mono text-[11px] text-slate-700 dark:text-slate-300">
                        {plan.supportType || 'Email'} · {plan.supportHours || 'Sat–Thu'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* LICENSING NOTES & FAQ */}
          <section className="pt-14">
            <div className="mb-8">
              <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                {isBn ? '০২. লাইসেন্সিং সংক্রান্ত সাধারণ প্রশ্ন' : '02. Licensing Notes & Common Questions'}
              </p>
              <h2
                className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
              >
                {isBn ? 'প্ল্যান নির্বাচনের পূর্বে জানার বিষয়' : 'Everything to know before activating a plan'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pricingFaqs.map((item, idx) => (
                <div
                  key={item.q}
                  className="p-6 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35"
                >
                  <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mb-1.5 tabular-nums">
                    0{idx + 1}.
                  </p>
                  <h3 className="text-sm font-bold text-slate-950 dark:text-white leading-snug">
                    {item.q}
                  </h3>
                  <p className="mt-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* Plan Modules Detail Modal */}
      <AnimatePresence>
        {selectedPlanDetails && (
          <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.16 }}
              className="bg-white dark:bg-[#0d1320] border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-900/70">
                <div>
                  <p className="text-[10.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                    {isBn ? 'টিয়ার মডিউল বিবরণ' : 'Tier Module Scope'}
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-950 dark:text-white mt-0.5">
                    {isBn
                      ? `${getTierNameBn(selectedPlanDetails)} প্ল্যানের অন্তর্ভুক্ত মডিউলসমূহ`
                      : `${selectedPlanDetails.name} Tier Capabilities`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanDetails(null)}
                  className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
                  aria-label={isBn ? 'বন্ধ করুন' : 'Close dialog'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
                {((selectedPlanDetails.tier || 0) >= 3
                  ? COMPARISON_FEATURE_IDS
                  : selectedPlanDetails.features
                ).map((fId) => {
                  const Icon = getFeatureIcon(fId);
                  return (
                    <div
                      key={fId}
                      className="flex gap-3.5 p-4 rounded-lg bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800"
                    >
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-blue-700 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-950 dark:text-white">
                          {getFeatureLabel(fId)}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                          {getFeatureDesc(fId)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedPlanDetails(null)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-950 dark:bg-blue-600 text-white flex items-center gap-1.5 hover:opacity-95"
                >
                  <span>{user ? (isBn ? 'ড্যাশবোর্ড' : 'Dashboard') : isBn ? 'শুরু করুন' : 'Get Started'}</span>
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
