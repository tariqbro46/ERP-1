import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  Factory,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Layers,
  Lock,
  Mail,
  Printer,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { useAuth } from '../../contexts/AuthContext';
import { APP_FEATURES, FeatureCategory } from '../../constants/features';
import { LATEST_VERSION } from '../../data/releaseNotes';
import { cn } from '../../lib/utils';
import {
  DOCS_SCREENSHOTS_UPDATED_EVENT,
  readStoredScreenshots,
  resolveShowcaseScreenshot,
} from '../../constants/helpContent';
import { AppScreenshotCard } from '../../components/AppScreenshotCard';

type ModuleTab = 'vouchers' | 'inventory' | 'production' | 'payroll';

const MODULE_DETAILS: Record<
  ModuleTab,
  {
    slotKey: string;
    step: string;
    titleEn: string;
    titleBn: string;
    descEn: string;
    descBn: string;
    bulletsEn: string[];
    bulletsBn: string[];
  }
> = {
  vouchers: {
    slotKey: 'features-vouchers',
    step: '01',
    titleEn: 'Double-Entry Vouchers & Auto Serials',
    titleBn: 'ডাবল-এন্ট্রি ভাউচার ও অটো সিরিয়াল',
    descEn:
      'Post balanced Sales, Purchase, Receipt, Payment, Contra, and Journal vouchers with atomic counter serials and live running ledger balances.',
    descBn:
      'বিক্রয়, ক্রয়, রিসিট, পেমেন্ট, কন্ট্রা ও জার্নালে অটো-সিরিয়াল এবং রানিং লেজার ব্যালেন্সসহ নির্ভুল ডাবল-এন্ট্রি হিসাব সংরক্ষণ করুন।',
    bulletsEn: [
      '8 Voucher Types (Sales, Purchase, Receipt, Payment, Contra, Journal, Transfer, Physical Stock)',
      'Real-time Debit = Credit verification before posting',
      'Instant A4 invoice & POS receipt printing',
      'Optional cost centre & narration tracking',
    ],
    bulletsBn: [
      '৮ ধরনের ভাউচার (বিক্রয়, ক্রয়, রিসিট, পেমেন্ট, কন্ট্রা, জার্নাল, স্টক ট্রান্সফার ও ফিজিক্যাল স্টক)',
      'পোস্ট করার আগেই ডেবিট ও ক্রেডিট সমতা যাচাই',
      'তাৎক্ষণিক A4 ইনভয়েস এবং POS রিসিট প্রিন্ট',
      'কস্ট সেন্টার ও বিস্তারিত ন্যারেশন সংরক্ষণ',
    ],
  },
  inventory: {
    slotKey: 'features-inventory',
    step: '02',
    titleEn: 'Multi-Godown FIFO Stock & Unit Precision',
    titleBn: 'মাল্টি-গোডাউন FIFO স্টক ও ব্যাচ নিয়ন্ত্রণ',
    descEn:
      'Track warehouse stock balances per godown with FIFO valuation, batch expiry dates, reorder thresholds, and whole-integer Pcs/Nos rules.',
    descBn:
      'প্রতিটি গোডাউনের স্টক ব্যালেন্স, FIFO মূল্যায়ন, ব্যাচ ও মেয়াদ, লো-স্টক সতর্কতা এবং Pcs/Nos-এ দশমিকবিহীন নির্ভুল হিসাব রাখুন।',
    bulletsEn: [
      'Warehouse-wise stock tracking and inter-godown transfers',
      'Strict whole-number formatting for Pcs, Pc & Nos',
      'Batch lot numbers, expiry tracking & reorder alerts',
      'Physical stock audit adjustment & negative stock guard',
    ],
    bulletsBn: [
      'গুদামভিত্তিক মজুদ পর্যবেক্ষণ ও আন্তঃগোডাউন ট্রান্সফার',
      'Pcs, Pc ও Nos-এ পূর্ণসংখ্যা এবং ওজনে সর্বোচ্চ ২ দশমিক নিয়ম',
      'ব্যাচ নম্বর, মেয়াদোত্তীর্ণ তারিখ এবং লো-স্টক সতর্কতা',
      'ফিজিক্যাল স্টক সমন্বয় ও নেগেটিভ স্টক প্রতিরোধ',
    ],
  },
  production: {
    slotKey: 'features-production',
    step: '03',
    titleEn: 'Production Orders, Machine Tracking & Stock Journal',
    titleBn: 'উৎপাদন অর্ডার, মেশিন ও কাঁচামাল কনভার্সন',
    descEn:
      'Manage customer production orders, assign factory machines, record raw material consumption, and log finished goods directly into stock.',
    descBn:
      'গ্রাহক অর্ডার থেকে মেশিন বরাদ্দ, কাঁচামাল খরচ এবং ফিনিশড গুডস উৎপাদন ধাপে ধাপে পরিচালনা ও স্টকে সংযুক্ত করুন।',
    bulletsEn: [
      'Customer order book & stage-by-stage completion tracking',
      'Machine assignment, capacity & utilization records',
      'Bill of Materials (BOM) raw material consumption logs',
      'Direct Stock Journal posting for finished goods output',
    ],
    bulletsBn: [
      'গ্রাহক অর্ডার বুক ও ধাপে ধাপে অগ্রগতি ট্র্যাকিং',
      'মেশিন বরাদ্দ ও উৎপাদন সক্ষমতা পর্যবেক্ষণ',
      'কাঁচামাল ব্যবহার ও BOM খরচ হিসাবরক্ষণ',
      'ফিনিশড গুডস সরাসরি স্টক জার্নালে সংযুক্তি',
    ],
  },
  payroll: {
    slotKey: 'features-payroll',
    step: '04',
    titleEn: 'Payroll Processing, Attendance & Payslips',
    titleBn: 'পেরোল, উপস্থিতি ও পে-স্লিপ রেজিস্টার',
    descEn:
      'Calculate monthly salary sheets from attendance registers, custom pay-heads, employee advances, deductions, and printable payment advice.',
    descBn:
      'মূল বেতন, ভাতা, কর্তন, অগ্রিম সমন্বয় এবং উপস্থিতির দিন অনুযায়ী স্বয়ংক্রিয় মাসিক স্যালারি শিট ও পে-স্লিপ তৈরি করুন।',
    bulletsEn: [
      'Daily Attendance Register & Attendance-linked Pay Heads',
      'Automated loan & advance EMI deduction on monthly runs',
      'One-click Bulk Salary Sheet generation & posting',
      'Individual Employee Payslips & Bank Payment Advice',
    ],
    bulletsBn: [
      'দৈনিক উপস্থিতি রেজিস্টার ও উপস্থিতি-ভিত্তিক পে-হেড',
      'কর্মীদের অগ্রিম ও ঋণের কিস্তি স্বয়ংক্রিয় সমন্বয়',
      'এক ক্লিকে মাসিক বাল্ক স্যালারি শিট জেনারেশন',
      'পৃথক কর্মী পে-স্লিপ ও ব্যাংক পেমেন্ট অ্যাডভাইস প্রিন্ট',
    ],
  },
};

const TEN_CORE_REPORTS = [
  { code: '01', en: 'Daybook Register', bn: 'ডেবুক রেজিস্টার', scopeEn: 'Chronological vouchers by date & serial', scopeBn: 'তারিখ ও সিরিয়াল অনুযায়ী ধারাবাহিক ভাউচার' },
  { code: '02', en: 'Ledger Statement', bn: 'লেজার স্টেটমেন্ট', scopeEn: 'Opening, Dr/Cr movement & running balance', scopeBn: 'প্রারম্ভিক, ডেবিট/ক্রেডিট ও রানিং ব্যালেন্স' },
  { code: '03', en: 'Trial Balance', bn: 'ট্রায়াল ব্যালেন্স', scopeEn: 'Group-wise Debit & Credit parity audit', scopeBn: 'গ্রুপভিত্তিক ডেবিট ও ক্রেডিট সমতা যাচাই' },
  { code: '04', en: 'Profit & Loss Statement', bn: 'লাভ ও ক্ষতির বিবরণ', scopeEn: 'Trading gross margin & net operating surplus', scopeBn: 'গ্রস মার্জিন এবং নিট পরিচালন মুনাফা' },
  { code: '05', en: 'Balance Sheet', bn: 'ব্যালেন্স শিট', scopeEn: 'Assets, Liabilities, Capital & Reserves', scopeBn: 'সম্পদ, দায়, মূলধন ও রিজার্ভ অবস্থান' },
  { code: '06', en: 'Stock Summary', bn: 'স্টক সামারি', scopeEn: 'Godown closing quantities & FIFO valuation', scopeBn: 'গোডাউন অনুযায়ী মজুদ ও FIFO মূল্যায়ন' },
  { code: '07', en: 'Cash Flow Statement', bn: 'ক্যাশ ফ্লো স্টেটমেন্ট', scopeEn: 'Period inflow & outflow liquidity tracking', scopeBn: 'নির্দিষ্ট সময়ের নগদ প্রবাহ ও তারল্য হিসাব' },
  { code: '08', en: 'Funds Flow Statement', bn: 'ফান্ডস ফ্লো স্টেটমেন্ট', scopeEn: 'Working capital movement across periods', scopeBn: 'ওয়ার্কিং ক্যাপিটাল পরিবর্তনের বিবরণ' },
  { code: '09', en: 'Ratio Analysis', bn: 'অনুপাত বিশ্লেষণ', scopeEn: 'Current ratio, quick ratio & debt turnover', scopeBn: 'কারেন্ট রেশিও, কুইক রেশিও ও টার্নওভার' },
  { code: '10', en: 'Negative Stock & Ledger', bn: 'নেগেটিভ স্টক ও লেজার', scopeEn: 'Exception report for anomalous balances', scopeBn: 'ব্যতিক্রমী স্টক বা লেজার ব্যালেন্স সতর্কতা' },
];

const sanitizeFeatureLabel = (id: string, rawLabel: string, isBn: boolean): string => {
  if (id === 'ana_insights' || id === 'enableAI') {
    return isBn ? 'ফিন্যান্সিয়াল ইনসাইটস ও বিজনেস ইন্টেলিজেন্স' : 'Financial Insights & Business Intelligence';
  }
  const bnMap: Record<string, string> = {
    acc_masters_create: 'মাস্টার্স তৈরি (লেজার ও গ্রুপ)',
    acc_masters_alter: 'মাস্টার্স পরিবর্তন ও মুছুন',
    acc_vouchers_create: 'ভাউচার এন্ট্রি (৮ ধরনের ভাউচার)',
    acc_vouchers_alter: 'ভাউচার সংশোধন ও বাতিলকরণ',
    acc_reports_view: 'মূল রিপোর্টসমূহ (ডেবুক, ট্রায়াল ব্যালেন্স, লেজার)',
    acc_reports_financial: 'আর্থিক বিবরণী (ব্যালেন্স শিট, লাভ-ক্ষতি)',
    inv_masters_create: 'ইনভেন্টরি মাস্টার্স (আইটেম, ইউনিট, গোডাউন)',
    inv_masters_alter: 'ইনভেন্টরি মাস্টার্স পরিবর্তন',
    inv_vouchers_create: 'ইনভেন্টরি লেনদেন (স্টক ট্রান্সফার ও ফিজিক্যাল স্টক)',
    inv_reports_view: 'ইনভেন্টরি রিপোর্ট (স্টক সামারি ও মুভমেন্ট)',
    pay_masters: 'কর্মী ও পে-হেড ব্যবস্থাপনা',
    pay_transactions: 'উপস্থিতি ও মাসিক বেতন প্রক্রিয়াকরণ',
    pay_reports: 'পেরোল রিপোর্ট (পে-স্লিপ ও স্যালারি শিট)',
    ord_create: 'বিক্রয় ও উৎপাদন অর্ডার তৈরি',
    ord_process: 'অর্ডার অগ্রগতি ও স্ট্যাটাস ট্র্যাকিং',
    ord_reports: 'অর্ডার বুক ও রেজিস্টার রিপোর্ট',
    mac_manage: 'মেশিন ব্যবস্থাপনা ও স্টেটাস',
    mac_production: 'কাঁচামাল থেকে উৎপাদন এন্ট্রি',
    ana_ratio: 'আর্থিক অনুপাত বিশ্লেষণ (Ratio Analysis)',
    ana_cashflow: 'ক্যাশ ও ফান্ডস ফ্লো বিবরণী',
    ana_ageing: 'বকেয়া ও স্টক এজিং বিশ্লেষণ',
    enableTax: 'ভ্যাট ও ট্যাক্স ব্যবস্থাপনা',
    enableCRM: 'কাস্টমার রিলেশনস (CRM)',
    enableSupplyChain: 'সাপ্লাই চেইন ও ক্রয় অর্ডার',
    enableInventory: 'উন্নত মাল্টি-গোডাউন ইনভেন্টরি',
    enableDataExport: 'ডেটা সেন্টার ও .xlsx / PDF এক্সপোর্ট',
  };
  return isBn && bnMap[id] ? bnMap[id] : rawLabel;
};

const sanitizeFeatureDesc = (id: string, rawDesc: string | undefined, isBn: boolean): string => {
  if (id === 'ana_insights' || id === 'enableAI') {
    return isBn
      ? 'নির্বাচিত তারিখ অনুযায়ী আয়, ব্যয়, কস্ট সেন্টার বরাদ্দ এবং নগদ প্রবাহের প্রকৃত বিশ্লেষণ।'
      : 'Period-locked analysis of revenue, expense distribution, cost centre allocation, and liquidity trends.';
  }
  const bnDescMap: Record<string, string> = {
    acc_masters_create: 'নতুন লেজার অ্যাকাউন্ট, প্রাইমারি গ্রুপ ও কস্ট সেন্টার তৈরি।',
    acc_masters_alter: 'বিদ্যমান লেজার ও গ্রুপের তথ্য হালনাগাদ ও নিয়ন্ত্রণ।',
    acc_vouchers_create: 'বিক্রয়, ক্রয়, পেমেন্ট, রিসিট, কন্ট্রা ও জার্নাল ভাউচার পোস্টিং।',
    acc_vouchers_alter: 'অডিট ট্রেইলসহ সংরক্ষিত ভাউচার সংশোধন বা পরিচালনা।',
    acc_reports_view: 'ডেবুক, ট্রায়াল ব্যালেন্স ও পার্টি লেজার স্টেটমেন্ট।',
    acc_reports_financial: 'তাৎক্ষণিক ব্যালেন্স শিট এবং লাভ ও ক্ষতির বিবরণী।',
    inv_masters_create: 'স্টক আইটেম, পরিমাপের একক ও একাধিক গোডাউন তৈরি।',
    inv_masters_alter: 'স্টক আইটেম ও গুদামের তথ্য আপডেট।',
    inv_vouchers_create: 'স্টক জার্নাল, গোডাউন ট্রান্সফার ও ফিজিক্যাল স্টক গণনা।',
    inv_reports_view: 'FIFO মূল্যায়নসহ স্টক সামারি ও আইটেম মুভমেন্ট রিপোর্ট।',
    pay_masters: 'কর্মচারী প্রোফাইল, পে-হেড এবং বেতন কাঠামো সংরক্ষণ।',
    pay_transactions: 'দৈনিক উপস্থিতি ও মাসিক বেতন শিট প্রস্তুতকরণ।',
    pay_reports: 'কর্মীদের পে-স্লিপ, পেমেন্ট অ্যাডভাইস এবং স্যালারি শিট।',
    ord_create: 'কাস্টমার অর্ডার ও প্রিন্টিং/উৎপাদন অর্ডার এন্ট্রি।',
    ord_process: 'উৎপাদন পর্যায় অনুযায়ী অর্ডার ট্র্যাকিং ও আপডেট।',
    ord_reports: 'অর্ডার রেজিস্টার ও পেন্ডিং ডেলিভারি তালিকা।',
    mac_manage: 'মেশিনের সক্ষমতা, ব্যবহার ও রক্ষণাবেক্ষণ ট্র্যাকিং।',
    mac_production: 'কাঁচামাল ব্যবহার থেকে ফিনিশড গুডস উৎপাদন কনভার্সন।',
    ana_ratio: 'তারল্য, সলভেন্সি ও টার্নওভার অনুপাত পর্যালোচনা।',
    ana_cashflow: 'নির্ধারিত সময়ের নগদ আগমন ও নির্গমন বিশ্লেষণ।',
    ana_ageing: 'পার্টি বকেয়া ও স্টকের মেয়াদভিত্তিক এজিং রিপোর্ট।',
    enableTax: 'ভাউচারে স্বয়ংক্রিয় ভ্যাট ও ট্যাক্স হার প্রয়োগ।',
    enableCRM: 'ক্লায়েন্ট যোগাযোগ, ফলো-আপ ও লেনদেনের ইতিহাস।',
    enableSupplyChain: 'ক্রয় চাহিদা, সরবরাহকারী ও ডেলিভারি পর্যবেক্ষণ।',
    enableInventory: 'ব্যাচ, লট ও একাধিক গুদামের সমন্বিত নিয়ন্ত্রণ।',
    enableDataExport: 'কাঠামোবদ্ধ .xlsx, PDF এবং A4 প্রিন্ট এক্সপোর্ট সুবিধা।',
  };
  return isBn && bnDescMap[id] ? bnDescMap[id] : rawDesc || '';
};

const sanitizeCategoryLabel = (cat: FeatureCategory, isBn: boolean): string => {
  const bnCats: Record<string, string> = {
    accounts: 'হিসাবরক্ষণ ও অর্থ (Accounts & Finance)',
    inventory: 'ইনভেন্টরি ও গুদাম ব্যবস্থাপনা',
    payroll: 'পেরোল ও মানবসম্পদ (HRM)',
    orders: 'অর্ডার ও ডেলিভারি ব্যবস্থাপনা',
    production: 'উৎপাদন ও মেশিন নিয়ন্ত্রণ',
    adv_analytics: 'আর্থিক বিশ্লেষণ ও অনুপাত',
    advanced: 'অ্যাডভান্সড এন্টারপ্রাইজ মডিউল',
  };
  return isBn ? bnCats[cat.id] || cat.label : cat.label;
};

export const Features = () => {
  const { language, t } = useLanguage();
  const { appIdentity, appVersion, appFeatures } = useSettings();
  const { user, isFounder } = useAuth();
  const isBn = language === 'bn';

  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.32').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.32'
    : `v${appVersion || LATEST_VERSION || '1.9.9.32'}`;

  const [activeTab, setActiveTab] = useState<ModuleTab>('vouchers');
  const [storedScreenshots, setStoredScreenshots] = useState<Record<string, string>>(() =>
    readStoredScreenshots()
  );

  useEffect(() => {
    const syncStored = () => setStoredScreenshots(readStoredScreenshots());
    window.addEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, syncStored);
    window.addEventListener('storage', syncStored);
    return () => {
      window.removeEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, syncStored);
      window.removeEventListener('storage', syncStored);
    };
  }, []);

  const currentModule = MODULE_DETAILS[activeTab];
  const resolved = resolveShowcaseScreenshot(currentModule.slotKey, storedScreenshots);

  const featureCategories = appFeatures && appFeatures.length > 0 ? appFeatures : APP_FEATURES;

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
          {/* Top Monospace Metadata Rail */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/85 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">{appName}</span>
              <span aria-hidden="true">·</span>
              <span>{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'মডিউল ও সক্ষমতা ডিরেক্টরি' : 'Platform Capabilities & Modules'}</span>
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
                {isBn ? 'ফিচারসমূহ' : 'Features'}
              </span>
            </nav>
          </div>

          {/* Editorial Hero Lead */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="pt-10 sm:pt-12 pb-12 border-b border-slate-200/85 dark:border-slate-800"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-end">
              <div className="lg:col-span-8">
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                  {isBn ? 'এন্টারপ্রাইজ হিসাবরক্ষণ ও অপারেশনাল সুইট' : 'Enterprise Accounting & Operational Suite'}
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
                      প্রতিটি ভাউচার, গোডাউন লট ও{' '}
                      <span className="text-blue-700 dark:text-blue-400">অডিট রিপোর্ট</span>—পূর্ণ নিয়ন্ত্রণে।
                    </>
                  ) : (
                    <>
                      Every ledger entry, godown lot, and{' '}
                      <span className="text-blue-700 dark:text-blue-400">audit report</span> in one system.
                    </>
                  )}
                </h1>
                <p className="mt-5 text-[15px] sm:text-base leading-[1.68] text-slate-600 dark:text-slate-300 max-w-[62ch]">
                  {isBn
                    ? `${appName} ডাবল-এন্ট্রি বুককিপিং, FIFO মাল্টি-গোডাউন ইনভেন্টরি, উৎপাদন ও মেশিন ট্র্যাকিং, কর্মচারী পেরোল এবং ১০টি অডিট-সম্মত রিপোর্টকে একটি দ্রুত ও দ্বিভাষিক (বাংলা ও English) কর্মক্ষেত্রে একত্রিত করে।`
                    : `${appName} unifies double-entry bookkeeping, multi-godown FIFO inventory, production and machine tracking, workforce payroll, and 10 audit-ready statements inside one fast bilingual workspace.`}
                </p>
              </div>

              <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-3">
                <Link
                  to={user ? '/dashboard' : '/register'}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 dark:bg-blue-600 hover:opacity-95 text-white text-[13.5px] font-semibold tracking-tight transition-opacity whitespace-nowrap shrink-0"
                >
                  <span>
                    {user
                      ? isBn
                        ? 'ড্যাশবোর্ডে প্রবেশ করুন'
                        : 'Open Dashboard'
                      : isBn
                        ? 'ফ্রি ট্রায়াল শুরু করুন'
                        : 'Start Free Trial'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/guide"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-[13.5px] font-medium transition-colors whitespace-nowrap shrink-0"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>{isBn ? 'ইউজার গাইড' : 'User Guide'}</span>
                </Link>
              </div>
            </div>

            {/* Fact-Aligned Capability Index Strip */}
            <div className="mt-10 pt-7 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-slate-200/85 dark:lg:divide-slate-800">
              <div className="lg:pr-6">
                <div className="text-lg font-bold tracking-tight text-slate-950 dark:text-white font-mono tabular-nums">
                  {isBn ? '৮ ধরন' : '8 Voucher Types'}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isBn
                    ? 'বিক্রয়, ক্রয়, রিসিট, পেমেন্ট, কন্ট্রা, জার্নাল, স্টক ট্রান্সফার ও ফিজিক্যাল স্টক।'
                    : 'Sales, Purchase, Receipt, Payment, Contra, Journal, Transfer & Physical Stock.'}
                </p>
              </div>
              <div className="lg:px-6">
                <div className="text-lg font-bold tracking-tight text-slate-950 dark:text-white font-mono tabular-nums">
                  {isBn ? 'FIFO মাল্টি-গোডাউন' : 'FIFO Multi-Godown'}
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isBn
                    ? 'Pcs/Pc/Nos-এ পূর্ণসংখ্যা ও ওজন/পরিমাপে ২ দশমিক পর্যন্ত নির্ভুলতা ও ব্যাচ ট্র্যাকিং।'
                    : 'Integer Pcs/Pc/Nos precision, max 2-decimal weights, batch expiry & low-stock alerts.'}
                </p>
              </div>
              <div className="lg:px-6">
                <div className="text-lg font-bold tracking-tight text-slate-950 dark:text-white font-mono tabular-nums">
                  .xlsx · Print · PDF
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isBn
                    ? '১০টি মূল রিপোর্ট সরাসরি কাঠামোবদ্ধ Excel (.xlsx), A4 প্রিন্ট, PDF ও ইমেইলে।'
                    : '10 core statements exported directly to structured .xlsx, A4 Print, PDF & Email.'}
                </p>
              </div>
              <div className="lg:pl-6">
                <div className="text-lg font-bold tracking-tight text-slate-950 dark:text-white font-mono tabular-nums">
                  EN / বাংলা · RBAC
                </div>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {isBn
                    ? 'মাল্টি-কোম্পানি আইসোলেশন, অডিট ট্রেইল ও মার্কেটিং ম্যানেজারসহ রোল পারমিশন।'
                    : 'Multi-company isolation, Audit Trail & role permissions incl. Marketing Manager.'}
                </p>
              </div>
            </div>
          </motion.section>

          {/* SECTION 01: FUNCTIONAL MODULE SCREENSHOT EXPLORER */}
          <section className="py-14 border-b border-slate-200/85 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                  {isBn ? '০১. কার্যকরী মডিউল ও স্ক্রিন প্রদর্শনী' : '01. Functional Module Screen Explorer'}
                </p>
                <h2
                  className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                >
                  {isBn
                    ? 'বাস্তব অ্যাপ স্ক্রিন ও কর্মপ্রবাহ দেখুন'
                    : 'Inspect authentic application screens by module'}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                {isBn
                  ? 'নিচের ৪টি মডিউল ট্যাব পরিবর্তন করে ডাবল-এন্ট্রি ভাউচার, গোডাউন স্টক, উৎপাদন অর্ডার ও পেরোলের প্রকৃত ইন্টারফেস দেখুন।'
                  : 'Switch across the four module tabs below to inspect authentic application screens for vouchers, godown inventory, production orders, and payroll.'}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] overflow-hidden shadow-[0_18px_48px_-16px_rgba(15,23,42,0.06)]">
              {/* Clean Workbench Header Bar */}
              <div className="px-4 sm:px-6 py-3.5 bg-slate-50/80 dark:bg-slate-900/70 border-b border-slate-200/85 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-slate-950 dark:bg-blue-600 text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                    {(appIdentity?.appShortName || 'TF').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {isBn ? 'কার্যকরী মডিউল এক্সপ্লোরার' : 'Functional Module Explorer'}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                      {isBn ? 'লেজার · ইনভেন্টরি · উৎপাদন · পেরোল' : 'Ledgers · Inventory · Manufacturing · Payroll'}
                    </p>
                  </div>
                </div>

                {/* Module Segmented Tabs */}
                <div
                  role="tablist"
                  aria-label={isBn ? 'মডিউল নির্বাচন' : 'Select module explorer tab'}
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar"
                >
                  {(
                    [
                      { id: 'vouchers', en: '01. Vouchers & Ledgers', bn: '০১. ভাউচার ও লেজার', icon: FileText },
                      { id: 'inventory', en: '02. Multi-Godown Stock', bn: '০২. মাল্টি-গোডাউন স্টক', icon: Warehouse },
                      { id: 'production', en: '03. Production & Orders', bn: '০৩. উৎপাদন ও অর্ডার', icon: Factory },
                      { id: 'payroll', en: '04. Payroll & Attendance', bn: '০৪. পেরোল ও উপস্থিতি', icon: Users },
                    ] as const
                  ).map((tab) => {
                    const TabIcon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                          activeTab === tab.id
                            ? 'bg-slate-950 dark:bg-blue-600 text-white'
                            : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800'
                        )}
                      >
                        <TabIcon className="w-3.5 h-3.5" />
                        <span>{isBn ? tab.bn : tab.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workbench Inner Layout: Module Summary (Left) + Real App Screenshot Frame (Right) */}
              <div className="p-5 sm:p-7">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
                  {/* Left 4 Columns: Authentic Module Context & Route */}
                  <div className="lg:col-span-4 space-y-5">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-blue-700 dark:text-blue-400 font-semibold">
                        {isBn ? `মডিউল ${currentModule.step}` : `Module ${currentModule.step}`} · {resolved.route}
                      </p>
                      <h3 className="mt-1.5 text-lg font-bold text-slate-950 dark:text-white leading-snug">
                        {isBn ? currentModule.titleBn : currentModule.titleEn}
                      </h3>
                      <p className="mt-2 text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                        {isBn ? currentModule.descBn : currentModule.descEn}
                      </p>
                    </div>

                    <ul className="space-y-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                      {(isBn ? currentModule.bulletsBn : currentModule.bulletsEn).map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center gap-3">
                      <Link
                        to={user ? resolved.route : '/register'}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 dark:bg-blue-600 hover:opacity-95 text-white text-xs font-semibold transition-opacity whitespace-nowrap"
                      >
                        <span>
                          {user
                            ? t('heroLedger.openModuleScreen')
                            : isBn
                              ? 'ফ্রি শুরু করুন'
                              : 'Get Started'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      {isFounder && (
                        <Link
                          to={`/founder-desk?target=${encodeURIComponent(currentModule.slotKey)}`}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-blue-700 dark:text-blue-400 transition-colors whitespace-nowrap"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>{t('heroLedger.manageScreenshot')}</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Right 8 Columns: Real App Screenshot Viewer (image first, route badge + caption below, hover zoom & click-to-expand) */}
                  <div className="lg:col-span-8">
                    <AppScreenshotCard
                      src={resolved.src}
                      alt={isBn ? resolved.bnAlt : resolved.alt}
                      caption={isBn ? resolved.bnCaption : resolved.caption}
                      route={resolved.route}
                      imageContainerClassName="p-3 sm:p-4"
                      imageClassName="max-h-[460px]"
                      fallbackClassName="min-h-[300px] sm:min-h-[380px]"
                      fallbackSublabel={isBn ? resolved.bnCaption : resolved.caption}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 02: 10 CORE REPORTS & EXPORT MATRIX (.xlsx Primary) */}
          <section className="py-14 border-b border-slate-200/85 dark:border-slate-800">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-5 space-y-4">
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                  {isBn ? '০২. রিপোর্টিং ও এক্সপোর্ট স্ট্যান্ডার্ড' : '02. Verified Reports & Export Engine'}
                </p>
                <h2
                  className="text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white leading-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                >
                  {isBn
                    ? '১০টি মূল আর্থিক ও স্টক রিপোর্ট — .xlsx, প্রিন্ট ও PDF-এ।'
                    : '10 core financial & stock statements built for audit portability.'}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn
                    ? 'প্রতিটি রিপোর্ট পিরিয়ড ফিল্টার, টেবিলের মাঝ-বরাবর নিখুঁত অ্যালাইনমেন্ট এবং Layout 1 ও Layout 2 অনুযায়ী অভিন্ন A4 PDF ও প্রিন্ট আউটপুট নিশ্চিত করে।'
                    : 'Every report respects strict date-period boundaries, vertical-middle table precision, and identical A4 Print Layout 1 & 2 and PDF generation.'}
                </p>

                <div className="pt-2 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                    <span>
                      {isBn
                        ? 'প্রাইমারি এক্সেল এক্সপোর্ট: কাঠামোবদ্ধ .xlsx ফরম্যাট'
                        : 'Primary Spreadsheet Standard: Structured .xlsx Workbook'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium">
                    <Printer className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                    <span>
                      {isBn
                        ? 'A4 প্রিন্ট ও Save PDF: অভিন্ন ব্লব ইঞ্জিন ও টপ-রাইট পেজ নম্বর'
                        : 'A4 Print & Save PDF: Unified PDF generator with formal company header'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-800 dark:text-slate-200 font-medium">
                    <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
                    <span>
                      {isBn
                        ? 'ইমেইল শেয়ার ও কোম্পানি আইসোলেশন'
                        : 'Direct Email Dispatch with Strict Company Isolation'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {TEN_CORE_REPORTS.map((rep) => (
                  <div
                    key={rep.code}
                    className="p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-white dark:bg-[#0d1320] flex items-start gap-3"
                  >
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-slate-500 pt-0.5 tabular-nums">
                      {rep.code}.
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                        {isBn ? rep.bn : rep.en}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {isBn ? rep.scopeBn : rep.scopeEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* SECTION 03: COMPLETE SUBSYSTEM DIRECTORY (FROM IN-MEMORY APP_FEATURES) */}
          <section className="py-14">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 font-semibold">
                  {isBn ? '০৩. সম্পূর্ণ সিস্টেম ডিরেক্টরি' : '03. Complete Subsystem Directory'}
                </p>
                <h2
                  className="mt-2 text-2xl sm:text-3xl font-bold tracking-[-0.025em] text-slate-950 dark:text-white"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                >
                  {isBn ? 'সকল মডিউল ও অনুমোদনের তালিকা' : 'Granular capabilities across every department'}
                </h2>
              </div>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {isBn
                  ? `মোট ${featureCategories.length}টি বিভাগ · রোল-ভিত্তিক নিয়ন্ত্রণ (RBAC)`
                  : `${featureCategories.length} Functional Categories · Granular RBAC`}
              </p>
            </div>

            <div className="space-y-10">
              {featureCategories.map((category, cIdx) => (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                    <span className="font-mono text-xs text-slate-400 tabular-nums">
                      {String(cIdx + 1).padStart(2, '0')}.
                    </span>
                    <h3 className="text-base font-bold text-slate-950 dark:text-white">
                      {sanitizeCategoryLabel(category, isBn)}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.features.map((feat) => (
                      <div
                        key={feat.id}
                        className="p-4 rounded-xl border border-slate-200/85 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/35 flex items-start gap-3"
                      >
                        <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-[13px] font-bold text-slate-900 dark:text-slate-100">
                            {sanitizeFeatureLabel(feat.id, feat.label, isBn)}
                          </h4>
                          {feat.description && (
                            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                              {sanitizeFeatureDesc(feat.id, feat.description, isBn)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 04: ARCHITECTURAL CALL TO ACTION */}
          <section className="mt-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0d1320] p-7 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                  <span>{isBn ? 'মাল্টি-কোম্পানি আইসোলেশন' : 'Multi-Company Isolation'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>{isBn ? 'অডিট ট্রেইল ও RBAC' : 'Audit Trail & RBAC'}</span>
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                  <span>{isBn ? 'কোটা-সুরক্ষিত ক্যাশিং' : 'Quota-Protected Caching'}</span>
                </span>
              </div>
              <h2
                className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white"
                style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
              >
                {isBn
                  ? 'আপনার প্রতিষ্ঠানের জন্য উপযুক্ত প্ল্যান নির্বাচন করুন বা কর্মক্ষেত্রে প্রবেশ করুন।'
                  : 'Compare plan tiers or enter your accounting workspace directly.'}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to={user ? '/dashboard' : '/register'}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 dark:bg-blue-600 text-white text-xs sm:text-[13px] font-semibold hover:opacity-95 transition-opacity whitespace-nowrap"
              >
                <span>
                  {user
                    ? isBn
                      ? 'ড্যাশবোর্ড খুলুন'
                      : 'Open Dashboard'
                    : isBn
                      ? 'ফ্রি অ্যাকাউন্ট তৈরি করুন'
                      : 'Get Started Free'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs sm:text-[13px] font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>{isBn ? 'প্রাইসিং ও প্ল্যান' : 'Pricing & Plans'}</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};
