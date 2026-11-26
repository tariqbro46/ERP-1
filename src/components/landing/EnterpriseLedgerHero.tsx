import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  Factory,
  FileSpreadsheet,
  FileText,
  Layers,
  LayoutDashboard,
  Lock,
  Mail,
  Package,
  Printer,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';
import { LATEST_VERSION } from '../../data/releaseNotes';

interface EnterpriseLedgerHeroProps {
  content?: Record<string, any>;
  onOpenDemoModal?: () => void;
  showExploreLiveDemo?: boolean;
}

type FocusLens = 'overview' | 'workspace';
type CapabilityTab = 'accounting' | 'inventory' | 'reports' | 'operations';
type SampleVoucherKey = 'sales' | 'receipt' | 'transfer';
type SampleReportKey = 'trial_balance' | 'daybook' | 'stock_summary';

interface SampleJournalLine {
  accountEn: string;
  accountBn: string;
  groupEn: string;
  groupBn: string;
  debit: number;
  credit: number;
}

const SAMPLE_VOUCHERS: Record<
  SampleVoucherKey,
  {
    serial: string;
    typeEn: string;
    typeBn: string;
    date: string;
    godownEn: string;
    godownBn: string;
    costCentreEn: string;
    costCentreBn: string;
    narrationEn: string;
    narrationBn: string;
    lines: SampleJournalLine[];
  }
> = {
  sales: {
    serial: 'SL-2026-0418',
    typeEn: 'Sales Voucher',
    typeBn: 'বিক্রয় ভাউচার (Sales)',
    date: '26 Nov 2026',
    godownEn: 'Dhaka Central Depot',
    godownBn: 'ঢাকা সেন্ট্রাল ডিপো',
    costCentreEn: 'Wholesale Distribution',
    costCentreBn: 'হোলসেল ডিস্ট্রিবিউশন',
    narrationEn: '120 Pcs dispatched via Delivery Note · FIFO lot cost posted',
    narrationBn: '১২০ Pcs পণ্য ডেলিভারি ও FIFO লট কস্ট স্বয়ংক্রিয়ভাবে পোস্টিং',
    lines: [
      {
        accountEn: 'Meghna Trading Co. (Sundry Debtors)',
        accountBn: 'মেঘনা ট্রেডিং কোং (দেনাদার)',
        groupEn: 'Sundry Debtors · Dr',
        groupBn: 'দেনাদার খাত · Dr',
        debit: 184000,
        credit: 0,
      },
      {
        accountEn: 'Wholesale Sales Account',
        accountBn: 'হোলসেল বিক্রয় হিসাব',
        groupEn: 'Sales Accounts · Cr',
        groupBn: 'বিক্রয় খাত · Cr',
        debit: 0,
        credit: 160000,
      },
      {
        accountEn: 'Output VAT 15% Payable',
        accountBn: 'আউটপুট ভ্যাট ১৫% প্রদেয়',
        groupEn: 'Duties & Taxes · Cr',
        groupBn: 'শুল্ক ও কর · Cr',
        debit: 0,
        credit: 24000,
      },
    ],
  },
  receipt: {
    serial: 'RC-2026-0194',
    typeEn: 'Receipt Voucher',
    typeBn: 'রিসিট ভাউচার (Receipt)',
    date: '26 Nov 2026',
    godownEn: 'Treasury · Head Office',
    godownBn: 'ট্রেজারি · হেড অফিস',
    costCentreEn: 'Accounts Receivable',
    costCentreBn: 'প্রাপ্য হিসাব',
    narrationEn: 'Party settlement cleared into Eastern Bank Current A/C',
    narrationBn: 'পার্টি বকেয়া পরিশোধ ইস্টার্ন ব্যাংক কারেন্ট অ্যাকাউন্টে জমা',
    lines: [
      {
        accountEn: 'Eastern Bank Ltd. — Current A/C',
        accountBn: 'ইস্টার্ন ব্যাংক লিমিটেড — কারেন্ট হিসাব',
        groupEn: 'Bank Accounts · Dr',
        groupBn: 'ব্যাংক অ্যাকাউন্টস · Dr',
        debit: 95000,
        credit: 0,
      },
      {
        accountEn: 'Meghna Trading Co. (Sundry Debtors)',
        accountBn: 'মেঘনা ট্রেডিং কোং (দেনাদার)',
        groupEn: 'Sundry Debtors · Cr',
        groupBn: 'দেনাদার খাত · Cr',
        debit: 0,
        credit: 95000,
      },
    ],
  },
  transfer: {
    serial: 'ST-2026-0076',
    typeEn: 'Stock Transfer',
    typeBn: 'স্টক ট্রান্সফার (Stock Transfer)',
    date: '26 Nov 2026',
    godownEn: 'Dhaka Central → Chattogram Depot',
    godownBn: 'ঢাকা সেন্ট্রাল → চট্টগ্রাম ডিপো',
    costCentreEn: 'Inter-Warehouse Logistics',
    costCentreBn: 'গুদাম স্থানান্তর',
    narrationEn: '45 Pcs & 28.50 Kg moved between branches with lot preservation',
    narrationBn: '৪৫ Pcs এবং ২৮.৫০ Kg পণ্য ব্যাচসহ শাখা গুদামে স্থানান্তর',
    lines: [
      {
        accountEn: 'Chattogram Port Depot (Destination)',
        accountBn: 'চট্টগ্রাম পোর্ট ডিপো (গন্তব্য)',
        groupEn: 'Closing Stock Inward · Dr',
        groupBn: 'স্টক গ্রহণ · Dr',
        debit: 142500,
        credit: 0,
      },
      {
        accountEn: 'Dhaka Central Depot (Source)',
        accountBn: 'ঢাকা সেন্ট্রাল ডিপো (উৎস)',
        groupEn: 'Closing Stock Outward · Cr',
        groupBn: 'স্টক প্রেরণ · Cr',
        debit: 0,
        credit: 142500,
      },
    ],
  },
};

const GODOWN_STOCK_ROWS = [
  {
    sku: 'ITM-104',
    nameEn: 'Industrial Servo Motor 2HP',
    nameBn: 'ইন্ডাস্ট্রিয়াল সার্ভো মোটর ২HP',
    godownEn: 'Dhaka Central',
    godownBn: 'ঢাকা সেন্ট্রাল',
    qtyDisplay: '140 Pcs',
    fifoRate: 8450,
    valuation: 1183000,
    status: 'nominal' as const,
  },
  {
    sku: 'ITM-209',
    nameEn: 'Copper Winding Coil (Batch B-19)',
    nameBn: 'কপার ওয়াইন্ডিং কয়েল (ব্যাচ B-19)',
    godownEn: 'Gazipur Plant',
    godownBn: 'গাজীপুর প্ল্যান্ট',
    qtyDisplay: '285.50 Kg',
    fifoRate: 1120,
    valuation: 319760,
    status: 'nominal' as const,
  },
  {
    sku: 'ITM-312',
    nameEn: 'Hydraulic Valve Assembly',
    nameBn: 'হাইড্রোলিক ভালভ অ্যাসেম্বলি',
    godownEn: 'Chattogram Port',
    godownBn: 'চট্টগ্রাম পোর্ট',
    qtyDisplay: '9 Nos',
    fifoRate: 4200,
    valuation: 37800,
    status: 'low' as const,
  },
];

const CORE_REPORTS_LIST = [
  { id: 'Daybook', en: 'Daybook', bn: 'ডেবুক' },
  { id: 'Ledger Statement', en: 'Ledger Statement', bn: 'লেজার স্টেটমেন্ট' },
  { id: 'Trial Balance', en: 'Trial Balance', bn: 'ট্রায়াল ব্যালেন্স' },
  { id: 'Profit & Loss', en: 'Profit & Loss', bn: 'লাভ ও ক্ষতি' },
  { id: 'Balance Sheet', en: 'Balance Sheet', bn: 'ব্যালেন্স শিট' },
  { id: 'Stock Summary', en: 'Stock Summary', bn: 'স্টক সামারি' },
  { id: 'Cash Flow', en: 'Cash Flow', bn: 'ক্যাশ ফ্লো' },
  { id: 'Funds Flow', en: 'Funds Flow', bn: 'ফান্ডস ফ্লো' },
  { id: 'Ratio Analysis', en: 'Ratio Analysis', bn: 'অনুপাত বিশ্লেষণ' },
  { id: 'Negative Reports', en: 'Negative Stock & Ledger', bn: 'নেগেটিভ স্টক ও লেজার' },
];

const REPORT_SAMPLE_ROWS: Record<
  SampleReportKey,
  {
    titleEn: string;
    titleBn: string;
    col1En: string;
    col1Bn: string;
    col2En: string;
    col2Bn: string;
    col3En: string;
    col3Bn: string;
    rows: Array<{ c1En: string; c1Bn: string; c2: string; c3: string; tone?: 'dr' | 'cr' | 'neutral' }>;
  }
> = {
  trial_balance: {
    titleEn: 'Trial Balance — FY Summary',
    titleBn: 'ট্রায়াল ব্যালেন্স — আর্থিক সারসংক্ষেপ',
    col1En: 'Ledger Group',
    col1Bn: 'লেজার গ্রুপ',
    col2En: 'Debit (৳)',
    col2Bn: 'ডেবিট (৳)',
    col3En: 'Credit (৳)',
    col3Bn: 'ক্রেডিট (৳)',
    rows: [
      { c1En: 'Cash & Bank Balances', c1Bn: 'ক্যাশ ও ব্যাংক ব্যালেন্স', c2: '1,420,500.00', c3: '—', tone: 'dr' },
      { c1En: 'Sundry Debtors', c1Bn: 'দেনাদার হিসাব', c2: '864,200.00', c3: '—', tone: 'dr' },
      { c1En: 'Sundry Creditors', c1Bn: 'পাওনাদার হিসাব', c2: '—', c3: '612,400.00', tone: 'cr' },
      { c1En: 'Capital & Reserves', c1Bn: 'মূলধন ও রিজার্ভ', c2: '—', c3: '1,672,300.00', tone: 'cr' },
    ],
  },
  daybook: {
    titleEn: 'Daybook Register — Chronological Vouchers',
    titleBn: 'ডেবুক রেজিস্টার — ধারাবাহিক ভাউচার',
    col1En: 'Particulars & Serial',
    col1Bn: 'বিবরণ ও সিরিয়াল',
    col2En: 'Type',
    col2Bn: 'ধরন',
    col3En: 'Amount (৳)',
    col3Bn: 'পরিমাণ (৳)',
    rows: [
      { c1En: 'SL-2026-0418 · Meghna Trading', c1Bn: 'SL-2026-0418 · মেঘনা ট্রেডিং', c2: 'Sales', c3: '184,000.00', tone: 'dr' },
      { c1En: 'RC-2026-0194 · Eastern Bank', c1Bn: 'RC-2026-0194 · ইস্টার্ন ব্যাংক', c2: 'Receipt', c3: '95,000.00', tone: 'dr' },
      { c1En: 'PR-2026-0112 · Padma Polymers', c1Bn: 'PR-2026-0112 · পদ্মা পলিমার্স', c2: 'Purchase', c3: '128,500.00', tone: 'cr' },
      { c1En: 'PM-2026-0087 · Office Rent', c1Bn: 'PM-2026-0087 · অফিস ভাড়া', c2: 'Payment', c3: '42,000.00', tone: 'cr' },
    ],
  },
  stock_summary: {
    titleEn: 'Stock Summary — Multi-Godown FIFO Valuation',
    titleBn: 'স্টক সামারি — মাল্টি-গোডাউন FIFO মূল্যায়ন',
    col1En: 'Stock Item & Godown',
    col1Bn: 'পণ্য ও গোডাউন',
    col2En: 'Closing Qty',
    col2Bn: 'মজুদ পরিমাণ',
    col3En: 'Value (৳)',
    col3Bn: 'মূল্য (৳)',
    rows: [
      { c1En: 'Servo Motor 2HP · Dhaka Central', c1Bn: 'সার্ভো মোটর ২HP · ঢাকা সেন্ট্রাল', c2: '140 Pcs', c3: '1,183,000.00', tone: 'neutral' },
      { c1En: 'Copper Coil · Gazipur Plant', c1Bn: 'কপার কয়েল · গাজীপুর প্ল্যান্ট', c2: '285.50 Kg', c3: '319,760.00', tone: 'neutral' },
      { c1En: 'Hydraulic Valve · Chattogram', c1Bn: 'হাইড্রোলিক ভালভ · চট্টগ্রাম', c2: '9 Nos', c3: '37,800.00', tone: 'cr' },
    ],
  },
};

function formatCurrency2Dec(amount: number): string {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const EnterpriseLedgerHero: React.FC<EnterpriseLedgerHeroProps> = ({
  onOpenDemoModal,
  showExploreLiveDemo = true,
}) => {
  const { language, t } = useLanguage();
  const { user, company } = useAuth();
  const { appIdentity, appVersion, companyName: settingsCompanyName } = useSettings();
  const isBn = language === 'bn';

  const [focusLens, setFocusLens] = useState<FocusLens>(() => (user ? 'workspace' : 'overview'));
  const [hasManualFocusToggle, setHasManualFocusToggle] = useState(false);
  const [activeCapability, setActiveCapability] = useState<CapabilityTab>('accounting');
  const [selectedVoucherKey, setSelectedVoucherKey] = useState<SampleVoucherKey>('sales');
  const [selectedReportKey, setSelectedReportKey] = useState<SampleReportKey>('trial_balance');

  useEffect(() => {
    if (!hasManualFocusToggle) {
      setFocusLens(user ? 'workspace' : 'overview');
    }
  }, [user, hasManualFocusToggle]);

  const activePlatformName = appIdentity?.appName || 'TallyFlow ERP';
  const activeTenantName = company?.name || settingsCompanyName || activePlatformName;
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.31').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.31'
    : `v${appVersion || LATEST_VERSION || '1.9.9.31'}`;

  const currentVoucher = SAMPLE_VOUCHERS[selectedVoucherKey];
  const voucherTotals = useMemo(() => {
    const debit = currentVoucher.lines.reduce((s, l) => s + l.debit, 0);
    const credit = currentVoucher.lines.reduce((s, l) => s + l.credit, 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.001 };
  }, [currentVoucher]);

  const currentReportSample = REPORT_SAMPLE_ROWS[selectedReportKey];

  const workspaceShortcuts = [
    {
      step: '01',
      titleEn: 'New Voucher Entry',
      titleBn: 'নতুন ভাউচার এন্ট্রি',
      metaEn: 'Sales · Purchase · Receipt · Journal',
      metaBn: 'বিক্রয় · ক্রয় · রিসিট · জার্নাল',
      to: '/vouchers/new',
      icon: FileText,
    },
    {
      step: '02',
      titleEn: 'Inventory & Godowns',
      titleBn: 'ইনভেন্টরি ও গোডাউন',
      metaEn: 'Items · FIFO Stock · Transfers',
      metaBn: 'আইটেম · FIFO স্টক · ট্রান্সফার',
      to: '/inventory/items',
      icon: Warehouse,
    },
    {
      step: '03',
      titleEn: '10 Core Reports',
      titleBn: '১০টি মূল রিপোর্ট',
      metaEn: 'Trial Balance · BS · P&L · Daybook',
      metaBn: 'ট্রায়াল ব্যালেন্স · BS · P&L · ডেবুক',
      to: '/reports/daybook',
      icon: BookOpen,
    },
    {
      step: '04',
      titleEn: 'Orders & Payroll',
      titleBn: 'অর্ডার ও পেরোল',
      metaEn: 'Production · Machines · Payslips',
      metaBn: 'প্রোডাকশন · মেশিন · পে-স্লিপ',
      to: '/production/orders',
      icon: Factory,
    },
  ];

  return (
    <section
      className="relative pt-24 sm:pt-28 pb-16 sm:pb-24 bg-white text-slate-950 border-b border-slate-200/85 overflow-x-clip"
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      {/* Subtle architectural hairline blueprint grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 85% 65% at 50% 10%, black 30%, transparent 82%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 65% at 50% 10%, black 30%, transparent 82%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Metadata Rail + Entry Overview vs Workspace Intro Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-7 border-b border-slate-200/85">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
            <span className="text-slate-900 font-semibold">{activePlatformName}</span>
            <span aria-hidden="true">·</span>
            <span>{resolvedVersion}</span>
            <span aria-hidden="true">·</span>
            <span>{t('heroLedger.kickerSuite')}</span>
          </div>

          <div
            role="tablist"
            aria-label={t('heroLedger.focusLabel')}
            className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200/90 self-start sm:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={focusLens === 'overview'}
              onClick={() => {
                setHasManualFocusToggle(true);
                setFocusLens('overview');
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                focusLens === 'overview'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              )}
            >
              {t('heroLedger.modeOverview')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={focusLens === 'workspace'}
              onClick={() => {
                setHasManualFocusToggle(true);
                setFocusLens('workspace');
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                focusLens === 'workspace'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              )}
            >
              {t('heroLedger.modeWorkspace')}
            </button>
          </div>
        </div>

        {/* Main 12-Column Asymmetric Split */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT 5 COLUMNS: Decision Narrative, Primary CTA, Verifiable System Scope */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 flex flex-col justify-between"
          >
            {focusLens === 'overview' ? (
              <div>
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
                  {t('heroLedger.overviewEyebrow')}
                </p>

                <h1
                  className="mt-4 font-bold tracking-[-0.03em] text-slate-950 leading-[1.09]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(2.05rem, 3.8vw, 3.25rem)',
                    textWrap: 'balance',
                  }}
                >
                  {isBn ? (
                    <>
                      নির্ভুল ডাবল-এন্ট্রি লেজার, গোডাউন স্টক ও{' '}
                      <span className="text-blue-700">অডিট-রেডি রিপোর্ট</span>—একই কর্মক্ষেত্রে।
                    </>
                  ) : (
                    <>
                      Balanced ledgers, godown stock, and{' '}
                      <span className="text-blue-700">audit-ready reports</span> in one workspace.
                    </>
                  )}
                </h1>

                <p className="mt-5 text-[15px] sm:text-base leading-[1.68] text-slate-600 max-w-[54ch]">
                  {t('heroLedger.overviewSubtitle')}
                </p>

                {/* Primary & Secondary Actions */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to={user ? '/dashboard' : '/register'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[13.5px] font-semibold tracking-tight transition-colors active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    <span>
                      {user ? t('heroLedger.ctaOpenConsole') : t('heroLedger.ctaStartTrial')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </Link>

                  {!user && showExploreLiveDemo && onOpenDemoModal && (
                    <button
                      type="button"
                      onClick={onOpenDemoModal}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>{t('heroLedger.ctaLiveDemo')}</span>
                    </button>
                  )}

                  <Link
                    to="/features"
                    className="inline-flex items-center gap-1 px-2 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{t('heroLedger.ctaAllModules')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
                  {user ? activeTenantName : t('heroLedger.workspaceEyebrow')}
                </p>

                <h1
                  className="mt-4 font-bold tracking-[-0.03em] text-slate-950 leading-[1.1]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(1.95rem, 3.5vw, 3rem)',
                    textWrap: 'balance',
                  }}
                >
                  {user ? (
                    isBn ? (
                      <>
                        আপনার সক্রিয় ইআরপি কর্মক্ষেত্র —{' '}
                        <span className="text-blue-700">দ্রুত এন্ট্রি ও রিপোর্ট তৈরি করুন।</span>
                      </>
                    ) : (
                      <>
                        Your active workspace —{' '}
                        <span className="text-blue-700">post vouchers and inspect books.</span>
                      </>
                    )
                  ) : isBn ? (
                    <>
                      অপারেটর ওয়ার্কস্পেস পরিচিতি —{' '}
                      <span className="text-blue-700">দৈনন্দিন কাজের ধাপ।</span>
                    </>
                  ) : (
                    <>
                      Operator workspace intro —{' '}
                      <span className="text-blue-700">built for daily speed.</span>
                    </>
                  )}
                </h1>

                <p className="mt-5 text-[15px] leading-[1.68] text-slate-600 max-w-[54ch]">
                  {t('heroLedger.workspaceSubtitle')}
                </p>

                {/* Primary & Secondary Actions for Workspace Intro */}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    to={user ? '/vouchers/new' : '/login'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[13.5px] font-semibold tracking-tight transition-colors active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    <span>
                      {user ? t('heroLedger.ctaNewVoucher') : t('heroLedger.ctaSignInWorkspace')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </Link>

                  <Link
                    to={user ? '/dashboard' : '/register'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 text-[13.5px] font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>{user ? t('heroLedger.ctaOpenConsole') : t('heroLedger.ctaStartTrial')}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Structured Capability Architecture Strip (Fact-Aligned, Zero Fake Metrics) */}
            <div className="mt-10 pt-6 border-t border-slate-200/85 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x sm:divide-slate-200/85">
              <div className="sm:pr-5">
                <div className="text-lg font-bold tracking-tight text-slate-950 font-mono tabular-nums">
                  {isBn ? '৮ ধরন' : '8 Types'}
                </div>
                <div className="mt-1 text-xs text-slate-600 leading-snug">
                  {t('heroLedger.statVouchers')}
                </div>
              </div>
              <div className="sm:px-5">
                <div className="text-lg font-bold tracking-tight text-slate-950 font-mono tabular-nums">
                  .xlsx · PDF
                </div>
                <div className="mt-1 text-xs text-slate-600 leading-snug">
                  {t('heroLedger.statReports')}
                </div>
              </div>
              <div className="sm:pl-5">
                <div className="text-lg font-bold tracking-tight text-slate-950 font-mono tabular-nums">
                  EN / বাংলা
                </div>
                <div className="mt-1 text-xs text-slate-600 leading-snug">
                  {t('heroLedger.statLocalization')}
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT 7 COLUMNS: Interactive Architecture Workbench */}
          <motion.div
            id="telemetry"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-7 scroll-mt-24"
          >
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-[0_18px_48px_-16px_rgba(15,23,42,0.08)] overflow-hidden">
              {/* Workbench Header + Module Tabs */}
              <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-200/85 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-slate-950 text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                    {(appIdentity?.appShortName || 'TF').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {focusLens === 'workspace' && user
                        ? activeTenantName
                        : t('heroLedger.workbenchTitle')}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {focusLens === 'workspace'
                        ? t('heroLedger.workbenchWorkspaceSub')
                        : t('heroLedger.workbenchOverviewSub')}
                    </p>
                  </div>
                </div>

                <div
                  role="tablist"
                  aria-label={t('heroLedger.moduleTabsLabel')}
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar"
                >
                  {(
                    [
                      { id: 'accounting', en: 'Vouchers', bn: 'ভাউচার' },
                      { id: 'inventory', en: 'Godowns', bn: 'গোডাউন' },
                      { id: 'reports', en: '10 Reports', bn: '১০ রিপোর্ট' },
                      { id: 'operations', en: 'Ops & RBAC', bn: 'অপারেশনস' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeCapability === tab.id}
                      onClick={() => setActiveCapability(tab.id)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                        activeCapability === tab.id
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                      )}
                    >
                      {isBn ? tab.bn : tab.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workbench Body */}
              <div className="p-4 sm:p-5 space-y-5">
                {focusLens === 'workspace' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-4 border-b border-slate-200/80">
                    {workspaceShortcuts.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.step}
                          to={user ? item.to : '/login'}
                          className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200/85 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-700 shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                <span className="font-mono text-slate-400 mr-1.5">{item.step}.</span>
                                {isBn ? item.titleBn : item.titleEn}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {isBn ? item.metaBn : item.metaEn}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* TAB 1: DOUBLE-ENTRY ACCOUNTING & VOUCHERS */}
                {activeCapability === 'accounting' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-slate-950">
                          {t('heroLedger.accTitle')}
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {t('heroLedger.accDesc')}
                        </p>
                      </div>

                      {/* Voucher Scenario Switcher */}
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-md bg-slate-100 border border-slate-200/80 self-start">
                        {(
                          [
                            { key: 'sales', en: 'Sales', bn: 'বিক্রয়' },
                            { key: 'receipt', en: 'Receipt', bn: 'রিসিট' },
                            { key: 'transfer', en: 'Transfer', bn: 'ট্রান্সফার' },
                          ] as const
                        ).map((opt) => (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setSelectedVoucherKey(opt.key)}
                            className={cn(
                              'px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors',
                              selectedVoucherKey === opt.key
                                ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                                : 'text-slate-600 hover:text-slate-950'
                            )}
                          >
                            {isBn ? opt.bn : opt.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Voucher Header Metadata Strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {isBn ? 'ভাউচার সিরিয়াল' : 'Serial No.'}
                        </span>
                        <span className="font-mono font-semibold text-slate-950 tabular-nums">
                          {currentVoucher.serial}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {isBn ? 'ভাউচার ধরন' : 'Voucher Type'}
                        </span>
                        <span className="font-semibold text-slate-900">
                          {isBn ? currentVoucher.typeBn : currentVoucher.typeEn}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {isBn ? 'গোডাউন / উৎস' : 'Godown / Desk'}
                        </span>
                        <span className="font-medium text-slate-800">
                          {isBn ? currentVoucher.godownBn : currentVoucher.godownEn}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
                          {isBn ? 'কস্ট সেন্টার' : 'Cost Centre'}
                        </span>
                        <span className="font-medium text-slate-800">
                          {isBn ? currentVoucher.costCentreBn : currentVoucher.costCentreEn}
                        </span>
                      </div>
                    </div>

                    {/* Double-Entry Posting Table */}
                    <div className="overflow-x-auto border border-slate-200/90 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] font-mono uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3 font-semibold">
                              {isBn ? 'লেজার অ্যাকাউন্ট' : 'Ledger Account'}
                            </th>
                            <th className="py-2.5 px-3 font-semibold hidden sm:table-cell">
                              {isBn ? 'গ্রুপ' : 'Group'}
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-right">
                              {isBn ? 'ডেবিট (৳)' : 'Debit (৳)'}
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-right">
                              {isBn ? 'ক্রেডিট (৳)' : 'Credit (৳)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 text-xs">
                          {currentVoucher.lines.map((line) => (
                            <tr key={line.accountEn} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-medium text-slate-900">
                                {isBn ? line.accountBn : line.accountEn}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 hidden sm:table-cell">
                                {isBn ? line.groupBn : line.groupEn}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-emerald-700">
                                {line.debit > 0 ? formatCurrency2Dec(line.debit) : '—'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-rose-700">
                                {line.credit > 0 ? formatCurrency2Dec(line.credit) : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 border-t border-slate-200 text-xs font-mono font-bold tabular-nums">
                            <td className="py-2.5 px-3 text-slate-900" colSpan={1}>
                              <span className="inline-flex items-center gap-1.5 font-sans">
                                <Check className="w-3.5 h-3.5 text-emerald-700" />
                                {voucherTotals.balanced
                                  ? isBn
                                    ? 'ডাবল-এন্ট্রি সমতা যাচাইকৃত'
                                    : 'Double-Entry Parity Verified'
                                  : isBn
                                    ? 'অসম ব্যালেন্স'
                                    : 'Unbalanced'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 hidden sm:table-cell text-[11px] font-normal text-slate-500 font-sans">
                              {isBn ? currentVoucher.narrationBn : currentVoucher.narrationEn}
                            </td>
                            <td className="py-2.5 px-3 text-right text-emerald-700">
                              {formatCurrency2Dec(voucherTotals.debit)}
                            </td>
                            <td className="py-2.5 px-3 text-right text-rose-700">
                              {formatCurrency2Dec(voucherTotals.credit)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px] text-slate-500 pt-1">
                      <span>
                        {isBn
                          ? 'মাস্টার্স: চার্ট অফ অ্যাকাউন্টস, পার্টি এজিং, রানিং ব্যালেন্স ও কুইক অ্যাডজাস্টমেন্ট'
                          : 'Masters: Chart of Accounts, Party Aging, Running Balance & Quick Adjustments'}
                      </span>
                      <Link
                        to={user ? '/vouchers/new' : '/features'}
                        className="font-semibold text-blue-700 hover:text-blue-800 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <span>{user ? (isBn ? 'ভাউচার খুলুন' : 'Open Voucher Entry') : (isBn ? 'বিস্তারিত দেখুন' : 'Inspect Workflow')}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}

                {/* TAB 2: INVENTORY & MULTI-GODOWN */}
                {activeCapability === 'inventory' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        {t('heroLedger.invTitle')}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {t('heroLedger.invDesc')}
                      </p>
                    </div>

                    <div className="overflow-x-auto border border-slate-200/90 rounded-lg">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50/90 border-b border-slate-200 text-[10.5px] font-mono uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3 font-semibold">
                              {isBn ? 'আইটেম ও কোড' : 'Item & SKU'}
                            </th>
                            <th className="py-2.5 px-3 font-semibold">
                              {isBn ? 'গোডাউন' : 'Godown'}
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-right">
                              {isBn ? 'মজুদ' : 'Qty'}
                            </th>
                            <th className="py-2.5 px-3 font-semibold text-right">
                              {isBn ? 'FIFO মূল্য (৳)' : 'FIFO Value (৳)'}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 text-xs">
                          {GODOWN_STOCK_ROWS.map((row) => (
                            <tr key={row.sku} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3">
                                <p className="font-semibold text-slate-900">
                                  {isBn ? row.nameBn : row.nameEn}
                                </p>
                                <p className="text-[10.5px] font-mono text-slate-500">{row.sku}</p>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700">
                                {isBn ? row.godownBn : row.godownEn}
                              </td>
                              <td
                                className={cn(
                                  'py-2.5 px-3 text-right font-mono tabular-nums font-semibold',
                                  row.status === 'low' ? 'text-rose-700' : 'text-slate-900'
                                )}
                              >
                                {row.qtyDisplay}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono tabular-nums font-semibold text-slate-900">
                                {formatCurrency2Dec(row.valuation)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Package className="w-3.5 h-3.5 text-blue-700" />
                          <span>{isBn ? 'ইউনিট নির্ভুলতা' : 'Unit Formatting'}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'Pcs, Pc ও Nos-এ দশমিকবিহীন পূর্ণসংখ্যা এবং Kg/Ltr-এ সর্বোচ্চ ২ দশমিক।'
                            : 'Zero decimals for Pcs, Pc & Nos; max 2 decimals for weight & volume units.'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Layers className="w-3.5 h-3.5 text-blue-700" />
                          <span>{isBn ? 'ব্যাচ ও মেয়াদ' : 'Batch & Expiry'}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'বারকোড স্ক্যানিং, ব্যাচ লট, মেয়াদোত্তীর্ণ ট্র্যাকিং ও স্টক কুয়েরি।'
                            : 'Barcode lookup, batch tracking, expiry dates, and Stock Query ledger.'}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/60">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <Warehouse className="w-3.5 h-3.5 text-blue-700" />
                          <span>{isBn ? 'নেগেটিভ স্টক গার্ড' : 'Negative Guard'}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'লো-স্টক সতর্কতা এবং ফিজিক্যাল স্টক রিকনসিলিয়েশন।'
                            : 'Reorder threshold alerts, Negative Stock checks, and Physical Stock counts.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: 10 CORE REPORTS & EXPORT ENGINE */}
                {activeCapability === 'reports' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-slate-950">
                          {t('heroLedger.repTitle')}
                        </h2>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {t('heroLedger.repDesc')}
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1 p-0.5 rounded-md bg-slate-100 border border-slate-200/80 self-start">
                        {(
                          [
                            { id: 'trial_balance', en: 'Trial Balance', bn: 'ট্রায়াল ব্যালেন্স' },
                            { id: 'daybook', en: 'Daybook', bn: 'ডেবুক' },
                            { id: 'stock_summary', en: 'Stock', bn: 'স্টক' },
                          ] as const
                        ).map((rep) => (
                          <button
                            key={rep.id}
                            type="button"
                            onClick={() => setSelectedReportKey(rep.id)}
                            className={cn(
                              'px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-colors',
                              selectedReportKey === rep.id
                                ? 'bg-white text-slate-950 font-semibold shadow-2xs'
                                : 'text-slate-600 hover:text-slate-950'
                            )}
                          >
                            {isBn ? rep.bn : rep.en}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Sample Report Table */}
                    <div className="overflow-x-auto border border-slate-200/90 rounded-lg">
                      <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-800">
                          {isBn ? currentReportSample.titleBn : currentReportSample.titleEn}
                        </span>
                        <span className="font-mono text-slate-500">
                          {isBn ? 'লেআউট ১ ও ২ প্রস্তুত' : 'Print Layout 1 & 2'}
                        </span>
                      </div>
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white border-b border-slate-200 text-[10.5px] font-mono uppercase tracking-wider text-slate-500">
                            <th className="py-2 px-3 font-semibold">
                              {isBn ? currentReportSample.col1Bn : currentReportSample.col1En}
                            </th>
                            <th className="py-2 px-3 font-semibold text-right">
                              {isBn ? currentReportSample.col2Bn : currentReportSample.col2En}
                            </th>
                            <th className="py-2 px-3 font-semibold text-right">
                              {isBn ? currentReportSample.col3Bn : currentReportSample.col3En}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/80 text-xs">
                          {currentReportSample.rows.map((row) => (
                            <tr key={row.c1En} className="hover:bg-slate-50/60">
                              <td className="py-2 px-3 font-medium text-slate-900">
                                {isBn ? row.c1Bn : row.c1En}
                              </td>
                              <td
                                className={cn(
                                  'py-2 px-3 text-right font-mono tabular-nums font-semibold',
                                  row.tone === 'dr' ? 'text-emerald-700' : 'text-slate-800'
                                )}
                              >
                                {row.c2}
                              </td>
                              <td
                                className={cn(
                                  'py-2 px-3 text-right font-mono tabular-nums font-semibold',
                                  row.tone === 'cr' ? 'text-rose-700' : 'text-slate-800'
                                )}
                              >
                                {row.c3}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Verified 10 Core Reports Directory + Export Formats (.xlsx primary per Decision #5) */}
                    <div className="pt-1 flex flex-col gap-3">
                      <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-slate-600">
                        {CORE_REPORTS_LIST.map((r, idx) => (
                          <span key={r.id} className="inline-flex items-center gap-1.5">
                            <span className="font-mono text-slate-400">
                              {String(idx + 1).padStart(2, '0')}
                            </span>
                            <span className="font-medium text-slate-800">{isBn ? r.bn : r.en}</span>
                          </span>
                        ))}
                      </div>

                      <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-4 text-slate-700 font-medium">
                          <span className="inline-flex items-center gap-1.5">
                            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                            <span>{isBn ? 'Excel (.xlsx) এক্সপোর্ট' : 'Structured .xlsx Export'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <Printer className="w-3.5 h-3.5 text-slate-700" />
                            <span>{isBn ? 'A4 প্রিন্ট ও প্রিভিউ' : 'A4 Print & Full Preview'}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-blue-700" />
                            <span>{isBn ? 'PDF ও ইমেইল শেয়ার' : 'PDF & Email'}</span>
                          </span>
                        </div>
                        <Link
                          to={user ? '/reports' : '/features'}
                          className="text-xs font-semibold text-blue-700 hover:text-blue-800 whitespace-nowrap"
                        >
                          {user ? (isBn ? 'রিপোর্টস মেনু' : 'Open Reports') : (isBn ? 'সব রিপোর্ট' : 'Explore Reports')} →
                        </Link>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: OPERATIONS, PRODUCTION, PAYROLL & RBAC */}
                {activeCapability === 'operations' && (
                  <div className="space-y-4">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950">
                        {t('heroLedger.opsTitle')}
                      </h2>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {t('heroLedger.opsDesc')}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-lg border border-slate-200/85 bg-slate-50/50 space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-950">
                          <Factory className="w-4 h-4 text-blue-700" />
                          <span>{isBn ? 'উৎপাদন, অর্ডার ও মেশিন' : 'Orders & Manufacturing'}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'অর্ডার এন্ট্রি, মেশিন ম্যানেজমেন্ট, কাঁচামাল কনজাম্পশন এবং প্রোডাকশন রিপোর্টস একত্রে পরিচালনা করুন।'
                            : 'Track customer production orders, machine allocation, material consumption, and Stock Journal outputs.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg border border-slate-200/85 bg-slate-50/50 space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-950">
                          <Users className="w-4 h-4 text-blue-700" />
                          <span>{isBn ? 'পেরোল ও এমপ্লয়ি মাস্টার' : 'Payroll & Attendance'}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'পে-স্লিপ, পে-শিট, অ্যাটেনডেন্স রেজিস্টার, পেমেন্ট অ্যাডভাইস এবং কর্মী হেডকাউন্ট বিবরণী।'
                            : 'Run salary sheets, attendance registers, employee payslips, payment advice, and payroll statements.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg border border-slate-200/85 bg-slate-50/50 space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-950">
                          <Building2 className="w-4 h-4 text-blue-700" />
                          <span>{isBn ? 'মাল্টি-কোম্পানি ও RBAC' : 'Multi-Company & RBAC'}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'একাধিক কোম্পানি সুইচিং, গ্রানুলার রোল পারমিশন (মার্কেটিং ম্যানেজারসহ), ভ্যাট/ট্যাক্স, সিআরএম ও সাপ্লাই চেইন।'
                            : 'Switch across companies with role-based permissions (incl. Marketing Manager), Tax/VAT, Supply Chain & CRM.'}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-lg border border-slate-200/85 bg-slate-50/50 space-y-1.5">
                        <div className="flex items-center gap-2 font-semibold text-slate-950">
                          <ShieldCheck className="w-4 h-4 text-blue-700" />
                          <span>{isBn ? 'অডিট ট্রেইল ও কন্ট্রোল' : 'Audit Trail & Controls'}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-600 leading-relaxed">
                          {isBn
                            ? 'প্রতিটি ভাউচার পরিবর্তনের অডিট লগ, ড্যাশবোর্ড ডিজাইন ১–৬, এবং প্রতি পেজ স্কেলিটন লোডার ON/OFF।'
                            : 'Activity Audit Trail, 6 Dashboard designs, Dark/Light themes, Quota monitoring, and Skeleton ON/OFF controls.'}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <Lock className="w-3.5 h-3.5 text-slate-600" />
                        <span>
                          {isBn
                            ? 'ফিন্যান্সিয়াল ইনসাইটস ও ব্যাংক রিকনসিলিয়েশন অন্তর্ভুক্ত'
                            : 'Includes Financial Insights & Bank Reconciliation'}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-slate-500 font-mono text-[11px]">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{isBn ? 'বাংলা ও English পূর্ণ সমর্থন' : 'Full Bilingual UI (EN / BN)'}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EnterpriseLedgerHero;
