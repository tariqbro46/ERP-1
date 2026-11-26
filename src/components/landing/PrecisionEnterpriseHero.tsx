import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Building2,
  Check,
  ChevronRight,
  FileSpreadsheet,
  Layers,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface PrecisionEnterpriseHeroProps {
  content?: Record<string, any>;
  onOpenDemoModal?: () => void;
  showExploreLiveDemo?: boolean;
}

type WorkspaceModule = 'overview' | 'ledger' | 'inventory' | 'vat';
type PeriodKey = '7D' | '30D' | 'Q4';
type LedgerGroupFilter = 'ALL' | 'DEBTORS' | 'CREDITORS' | 'TREASURY';
type GodownFilter = 'ALL' | 'Dhaka Central' | 'Chattogram Port' | 'Gazipur Depot';

interface VoucherRecord {
  id: string;
  party: string;
  partyBn: string;
  type: 'Sales' | 'Receipt' | 'Purchase' | 'Journal' | 'Payment';
  date: string;
  status: 'Posted' | 'Reconciled' | 'Pending';
  direction: 'Dr' | 'Cr';
  amount: number;
  narration: string;
  costCentre: string;
}

interface ChartPoint {
  label: string;
  inflow: number;
  outflow: number;
}

const PERIOD_DATA: Record<
  PeriodKey,
  {
    netCash: number;
    cashDelta: string;
    receivables: number;
    openInvoices: number;
    stockValue: number;
    godowns: number;
    operatingMargin: string;
    marginDelta: string;
    series: ChartPoint[];
  }
> = {
  '7D': {
    netCash: 4892450,
    cashDelta: '+4.8% vs prior 7d',
    receivables: 1940800,
    openInvoices: 14,
    stockValue: 6415200,
    godowns: 3,
    operatingMargin: '25.4%',
    marginDelta: '+1.1 pts WoW',
    series: [
      { label: 'Sat', inflow: 640000, outflow: 410000 },
      { label: 'Sun', inflow: 785000, outflow: 460000 },
      { label: 'Mon', inflow: 710000, outflow: 520000 },
      { label: 'Tue', inflow: 920000, outflow: 590000 },
      { label: 'Wed', inflow: 880000, outflow: 495000 },
      { label: 'Thu', inflow: 1090000, outflow: 610000 },
      { label: 'Fri', inflow: 985000, outflow: 540000 },
    ],
  },
  '30D': {
    netCash: 4892450,
    cashDelta: '+12.4% vs prior 30d',
    receivables: 1940800,
    openInvoices: 18,
    stockValue: 6415200,
    godowns: 3,
    operatingMargin: '24.8%',
    marginDelta: '+1.9 pts MoM',
    series: [
      { label: 'W1', inflow: 2450000, outflow: 1720000 },
      { label: 'W2', inflow: 2790000, outflow: 1890000 },
      { label: 'W3', inflow: 3180000, outflow: 2040000 },
      { label: 'W4', inflow: 3420000, outflow: 2110000 },
      { label: 'W5', inflow: 3890000, outflow: 2350000 },
      { label: 'W6', inflow: 4160000, outflow: 2490000 },
    ],
  },
  Q4: {
    netCash: 5340800,
    cashDelta: '+18.7% vs Q3',
    receivables: 2215400,
    openInvoices: 23,
    stockValue: 6890400,
    godowns: 3,
    operatingMargin: '26.1%',
    marginDelta: '+2.6 pts QoQ',
    series: [
      { label: 'Oct', inflow: 9840000, outflow: 7120000 },
      { label: 'Nov', inflow: 11250000, outflow: 7860000 },
      { label: 'Dec', inflow: 12640000, outflow: 8490000 },
      { label: 'Jan', inflow: 11920000, outflow: 8140000 },
      { label: 'Feb', inflow: 13480000, outflow: 8910000 },
      { label: 'Mar', inflow: 14820000, outflow: 9520000 },
    ],
  },
};

const INITIAL_VOUCHERS: VoucherRecord[] = [
  {
    id: 'JV-2604-118',
    party: 'Bengal Polymer Industries Ltd.',
    partyBn: 'বেঙ্গল পলিমার ইন্ডাস্ট্রিজ লি.',
    type: 'Sales',
    date: '14 Nov 2026',
    status: 'Posted',
    direction: 'Dr',
    amount: 485200,
    narration: 'Invoice #SL-892 against Mushak 6.3 challan (Dhaka Central)',
    costCentre: 'Distribution — Dhaka',
  },
  {
    id: 'RC-2604-409',
    party: 'Padma Hardware & Co.',
    partyBn: 'পদ্মা হার্ডওয়্যার অ্যান্ড কোং',
    type: 'Receipt',
    date: '14 Nov 2026',
    status: 'Reconciled',
    direction: 'Cr',
    amount: 312500,
    narration: 'BEFTN settlement cleared into SCB Corporate A/C #4089',
    costCentre: 'Treasury — HQ',
  },
  {
    id: 'PV-2604-274',
    party: 'Karnafuli Logistics & Freight',
    partyBn: 'কর্ণফুলী লজিস্টিকস অ্যান্ড ফ্রেইট',
    type: 'Purchase',
    date: '13 Nov 2026',
    status: 'Posted',
    direction: 'Cr',
    amount: 164800,
    narration: 'Port haulage & bonded warehouse batch transfer to Gazipur',
    costCentre: 'Supply Chain — CTG',
  },
  {
    id: 'PM-2604-192',
    party: 'National Board of Revenue (VAT)',
    partyBn: 'জাতীয় রাজস্ব বোর্ড (ভ্যাট)',
    type: 'Payment',
    date: '12 Nov 2026',
    status: 'Reconciled',
    direction: 'Dr',
    amount: 228450,
    narration: 'Treasury Challan A-Challan #98124 for Mushak 9.1 settlement',
    costCentre: 'Statutory Tax Desk',
  },
  {
    id: 'JV-2604-115',
    party: 'Jamuna Steel Distributors',
    partyBn: 'যমুনা স্টিল ডিস্ট্রিবিউটরস',
    type: 'Journal',
    date: '11 Nov 2026',
    status: 'Pending',
    direction: 'Dr',
    amount: 94600,
    narration: 'Credit note & early settlement rebate pending CFO sign-off',
    costCentre: 'Wholesale — North',
  },
];

const LEDGER_ACCOUNTS: Array<{
  code: string;
  name: string;
  group: 'DEBTORS' | 'CREDITORS' | 'TREASURY';
  groupLabel: string;
  turnover: number;
  netBalance: number;
}> = [
  {
    code: '1102-01',
    name: 'Standard Chartered BD — Operating',
    group: 'TREASURY',
    groupLabel: 'Cash & Bank',
    turnover: 14250000,
    netBalance: 3240500,
  },
  {
    code: '1102-04',
    name: 'Dutch-Bangla Bank — Collection A/C',
    group: 'TREASURY',
    groupLabel: 'Cash & Bank',
    turnover: 8640000,
    netBalance: 1651950,
  },
  {
    code: '1201-14',
    name: 'Bengal Polymer Industries Ltd.',
    group: 'DEBTORS',
    groupLabel: 'Sundry Debtors',
    turnover: 5420000,
    netBalance: 845200,
  },
  {
    code: '1201-29',
    name: 'Apex Infrastructure & Civil Works',
    group: 'DEBTORS',
    groupLabel: 'Sundry Debtors',
    turnover: 3890000,
    netBalance: 612400,
  },
  {
    code: '2104-08',
    name: 'Karnafuli Logistics & Freight',
    group: 'CREDITORS',
    groupLabel: 'Sundry Creditors',
    turnover: 2940000,
    netBalance: -418900,
  },
  {
    code: '2104-19',
    name: 'Meghna Packaging Converters',
    group: 'CREDITORS',
    groupLabel: 'Sundry Creditors',
    turnover: 4110000,
    netBalance: -572300,
  },
];

const INVENTORY_ITEMS: Array<{
  sku: string;
  name: string;
  godown: 'Dhaka Central' | 'Chattogram Port' | 'Gazipur Depot';
  qty: number;
  unit: 'Pcs' | 'Nos' | 'Kg';
  rate: number;
  valuation: number;
}> = [
  {
    sku: 'IND-VALVE-40',
    name: 'SS-316 Industrial Gate Valve 40mm',
    godown: 'Dhaka Central',
    qty: 420,
    unit: 'Pcs',
    rate: 2850,
    valuation: 1197000,
  },
  {
    sku: 'HDPE-RESIN-01',
    name: 'Blow-Grade HDPE Polymer Granules',
    godown: 'Chattogram Port',
    qty: 12450.5,
    unit: 'Kg',
    rate: 192.4,
    valuation: 2395476.2,
  },
  {
    sku: 'SERVO-DRV-5K',
    name: 'Three-Phase Control Inverter 5.5kW',
    godown: 'Gazipur Depot',
    qty: 86,
    unit: 'Nos',
    rate: 18400,
    valuation: 1582400,
  },
  {
    sku: 'CABLE-AR-16',
    name: 'Armoured Copper Core Cable 16mm',
    godown: 'Dhaka Central',
    qty: 1840,
    unit: 'Pcs',
    rate: 674.1,
    valuation: 1240344,
  },
];

const VAT_AUDIT_RECORDS = [
  {
    ref: 'M6.3-2026-4418',
    filing: 'Output VAT Challan · Domestic Sales',
    taxableValue: 3234666.67,
    vatAmount: 485200,
    approver: 'A. Rahman (CFO)',
    timestamp: '14 Nov, 14:22',
    status: 'Verified',
  },
  {
    ref: 'M6.2-2026-1904',
    filing: 'Input Tax Credit · Port Import BoE #C-9941',
    taxableValue: 1850000,
    vatAmount: 277500,
    approver: 'F. Yasmin (Tax Lead)',
    timestamp: '13 Nov, 17:08',
    status: 'Matched',
  },
  {
    ref: 'M9.1-2026-NOV',
    filing: 'Monthly NBR Return Summary (Draft Lock)',
    taxableValue: 5084666.67,
    vatAmount: 207700,
    approver: 'System Integrity Check',
    timestamp: '12 Nov, 19:45',
    status: 'Ready to File',
  },
];

function formatMoney(amount: number): string {
  return `৳${Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatQty(qty: number, unit: 'Pcs' | 'Nos' | 'Kg'): string {
  const isWholeUnit = unit === 'Pcs' || unit === 'Nos';
  const formatted = isWholeUnit
    ? Math.round(qty).toLocaleString('en-US', { maximumFractionDigits: 0 })
    : qty.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return `${formatted} ${unit}`;
}

export const PrecisionEnterpriseHero: React.FC<PrecisionEnterpriseHeroProps> = ({
  onOpenDemoModal,
  showExploreLiveDemo = true,
}) => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isBn = language === 'bn';

  const [activeModule, setActiveModule] = useState<WorkspaceModule>('overview');
  const [period, setPeriod] = useState<PeriodKey>('30D');
  const [searchQuery, setSearchQuery] = useState('');
  const [vouchers, setVouchers] = useState<VoucherRecord[]>(INITIAL_VOUCHERS);
  const [selectedVoucherId, setSelectedVoucherId] = useState<string | null>(INITIAL_VOUCHERS[0].id);
  const [ledgerFilter, setLedgerFilter] = useState<LedgerGroupFilter>('ALL');
  const [godownFilter, setGodownFilter] = useState<GodownFilter>('ALL');
  const [hoveredPointIdx, setHoveredPointIdx] = useState<number | null>(null);
  const [quickComposerOpen, setQuickComposerOpen] = useState(false);
  const [quickParty, setQuickParty] = useState('Dhaka Textile Mills Ltd.');
  const [quickType, setQuickType] = useState<'Sales' | 'Receipt' | 'Journal'>('Sales');
  const [quickAmount, setQuickAmount] = useState('145000');
  const [postedDelta, setPostedDelta] = useState(0);

  const periodStats = PERIOD_DATA[period];
  const currentNetCash = periodStats.netCash + postedDelta;

  const filteredVouchers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return vouchers;
    return vouchers.filter(
      (v) =>
        v.id.toLowerCase().includes(q) ||
        v.party.toLowerCase().includes(q) ||
        v.partyBn.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
    );
  }, [vouchers, searchQuery]);

  const filteredLedgers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return LEDGER_ACCOUNTS.filter((acc) => {
      const groupMatch = ledgerFilter === 'ALL' || acc.group === ledgerFilter;
      const queryMatch =
        !q ||
        acc.name.toLowerCase().includes(q) ||
        acc.code.toLowerCase().includes(q) ||
        acc.groupLabel.toLowerCase().includes(q);
      return groupMatch && queryMatch;
    });
  }, [ledgerFilter, searchQuery]);

  const filteredInventory = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return INVENTORY_ITEMS.filter((item) => {
      const godownMatch = godownFilter === 'ALL' || item.godown === godownFilter;
      const queryMatch =
        !q ||
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        item.godown.toLowerCase().includes(q);
      return godownMatch && queryMatch;
    });
  }, [godownFilter, searchQuery]);

  const selectedVoucher = useMemo(
    () => vouchers.find((v) => v.id === selectedVoucherId) || null,
    [vouchers, selectedVoucherId]
  );

  const chartGeometry = useMemo(() => {
    const pts = periodStats.series;
    const width = 560;
    const height = 176;
    const padX = 24;
    const padTop = 18;
    const padBottom = 26;
    const usableW = width - padX * 2;
    const usableH = height - padTop - padBottom;
    const maxVal = Math.max(...pts.map((p) => Math.max(p.inflow, p.outflow))) * 1.12;

    const mapped = pts.map((p, idx) => {
      const x = padX + (pts.length === 1 ? usableW / 2 : (idx / (pts.length - 1)) * usableW);
      const yIn = padTop + usableH - (p.inflow / maxVal) * usableH;
      const yOut = padTop + usableH - (p.outflow / maxVal) * usableH;
      return { ...p, x, yIn, yOut };
    });

    const linePath = mapped
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yIn.toFixed(1)}`)
      .join(' ');
    const areaPath = `${linePath} L ${mapped[mapped.length - 1].x.toFixed(1)} ${(padTop + usableH).toFixed(1)} L ${mapped[0].x.toFixed(1)} ${(padTop + usableH).toFixed(1)} Z`;

    const outflowPath = mapped
      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.yOut.toFixed(1)}`)
      .join(' ');

    return { width, height, padX, padTop, usableH, mapped, linePath, areaPath, outflowPath };
  }, [periodStats]);

  const activePoint =
    hoveredPointIdx !== null ? chartGeometry.mapped[hoveredPointIdx] : null;

  const handleQuickPost = (e: React.FormEvent) => {
    e.preventDefault();
    const numeric = parseFloat(quickAmount);
    if (!quickParty.trim() || isNaN(numeric) || numeric <= 0) return;

    const nextSeq = 120 + vouchers.length;
    const prefix = quickType === 'Receipt' ? 'RC' : quickType === 'Journal' ? 'JV' : 'SL';
    const newEntry: VoucherRecord = {
      id: `${prefix}-2604-${nextSeq}`,
      party: quickParty.trim(),
      partyBn: quickParty.trim(),
      type: quickType,
      date: '14 Nov 2026',
      status: 'Posted',
      direction: quickType === 'Receipt' ? 'Cr' : 'Dr',
      amount: Math.round(numeric * 100) / 100,
      narration: `Interactive preview entry posted via Quick Journal (${quickType})`,
      costCentre: 'Head Office — Dhaka',
    };

    setVouchers((prev) => [newEntry, ...prev]);
    setSelectedVoucherId(newEntry.id);
    setPostedDelta((prev) => prev + (quickType === 'Journal' ? 0 : newEntry.amount));
    setQuickComposerOpen(false);
    setActiveModule('overview');
  };

  return (
    <section
      className="relative pt-28 sm:pt-36 pb-20 sm:pb-28 bg-white text-zinc-950 overflow-x-clip border-b border-zinc-200/80"
      style={{
        fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif",
      }}
    >
      {/* Architectural 1px grid with soft radial fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(228, 228, 231, 0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(228, 228, 231, 0.55) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage:
            'radial-gradient(ellipse 80% 55% at 50% 18%, black 30%, transparent 80%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 80% 55% at 50% 18%, black 30%, transparent 80%)',
        }}
      />

      <div className="relative z-10 max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* ================= 1. EDITORIAL HEADER BLOCK ================= */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center"
        >
          <p className="text-[11px] font-mono font-medium tracking-[0.14em] uppercase text-zinc-500">
            {isBn
              ? 'এন্টারপ্রাইজ ইআরপি  ·  ডাবল-এন্ট্রি লেজার  ·  এনবিআর ভ্যাট প্রস্তুত'
              : 'Enterprise Resource Planning  ·  Double-Entry Core  ·  NBR VAT Ready'}
          </p>

          <h1
            className="mt-5 font-bold tracking-[-0.032em] text-zinc-950 leading-[1.08]"
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
              fontSize: 'clamp(2.15rem, 4.4vw, 3.75rem)',
              textWrap: 'balance',
            }}
          >
            {isBn ? (
              <>
                বৃহৎ ব্যবসার হিসাব ও ইনভেন্টরির জন্য{' '}
                <span className="text-blue-700">একক, নির্ভুল প্ল্যাটফর্ম।</span>
              </>
            ) : (
              <>
                Financial clarity built for{' '}
                <span className="text-blue-700">serious enterprise scale.</span>
              </>
            )}
          </h1>

          <p className="mt-5 max-w-[58ch] mx-auto text-[15.5px] sm:text-[17px] leading-[1.65] text-zinc-600 font-normal">
            {isBn
              ? 'ডাবল-এন্ট্রি অ্যাকাউন্টিং, মাল্টি-গোডাউন FIFO ইনভেন্টরি, এনবিআর ভ্যাট অটোমেশন এবং রোল-ভিত্তিক অনুমোদন পরিচালনা করুন একটি দ্রুত, অডিট-রেডি কর্মক্ষেত্রে।'
              : 'Unify double-entry accounting, multi-godown FIFO inventory, automated NBR VAT compliance, and role-governed approvals inside one fast, auditable operating system.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-800 text-white text-[13.5px] font-semibold tracking-tight shadow-[0_1px_2px_rgba(9,9,11,0.16)] transition-all duration-150 active:scale-[0.99] whitespace-nowrap shrink-0"
            >
              <span>
                {user
                  ? isBn
                    ? 'প্রোডাকশন কনসোল খুলুন'
                    : 'Open Production Console'
                  : isBn
                    ? 'বিনামূল্যে ট্রায়াল শুরু করুন'
                    : 'Start Free Trial'}
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-300" />
            </Link>

            {showExploreLiveDemo && onOpenDemoModal && (
              <button
                type="button"
                onClick={onOpenDemoModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 hover:border-zinc-300 text-[13.5px] font-medium tracking-tight transition-all duration-150 active:scale-[0.99] cursor-pointer whitespace-nowrap shrink-0"
              >
                <span>{isBn ? 'লাইভ ডেমো দেখুন' : 'Explore Live Demo'}</span>
              </button>
            )}

            <Link
              to="/pricing"
              className="inline-flex items-center gap-1 px-2.5 py-2 text-[13px] font-medium text-zinc-500 hover:text-zinc-900 transition-colors whitespace-nowrap shrink-0"
            >
              <span>{isBn ? 'প্ল্যান ও মূল্য' : 'Plans & SLA'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-zinc-200/80 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x sm:divide-zinc-200/80 max-w-2xl mx-auto">
            <div className="sm:px-5">
              <div className="text-[20px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                0 ms
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">
                {isBn ? 'ডাবল-এন্ট্রি ব্যালেন্স ড্রিফট' : 'Balance drift across postings'}
              </div>
            </div>
            <div className="sm:px-5">
              <div className="text-[20px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                FIFO
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">
                {isBn ? 'মাল্টি-গোডাউন রিয়েল-টাইম ভ্যালুয়েশন' : 'Multi-godown stock valuation'}
              </div>
            </div>
            <div className="sm:px-5">
              <div className="text-[20px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                Mushak 6.3
              </div>
              <div className="mt-0.5 text-[12px] text-zinc-500">
                {isBn ? 'স্বয়ংক্রিয় এনবিআর ভ্যাট ও অডিট ট্রেইল' : 'NBR VAT & audit trail readiness'}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ================= 2. PRODUCTION ERP WORKSPACE PREVIEW ================= */}
        <motion.div
          id="telemetry"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 sm:mt-16 scroll-mt-24"
        >
          <div className="rounded-xl border border-zinc-200/90 bg-white shadow-[0_24px_60px_-15px_rgba(9,9,11,0.08),0_2px_8px_-2px_rgba(9,9,11,0.04)] overflow-hidden">
            {/* Application Toolbar */}
            <div className="px-4 sm:px-5 py-3 bg-[#FAFAFA] border-b border-zinc-200/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center justify-between gap-3 min-w-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-zinc-950 text-white flex items-center justify-center text-[11px] font-bold tracking-tight shrink-0">
                    TF
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px] font-semibold text-zinc-900 truncate">
                      <span className="truncate">
                        {isBn ? 'মদিনা এন্টারপ্রাইজ লিমিটেড' : 'Modina Enterprise Ltd.'}
                      </span>
                      <span className="text-zinc-300 font-normal">/</span>
                      <span className="text-zinc-500 font-mono text-[11.5px] font-medium shrink-0">
                        FY 2026–27
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setQuickComposerOpen((prev) => !prev)}
                  className="lg:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-[11.5px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন এন্ট্রি' : 'Quick Entry'}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="relative flex-1 sm:flex-initial sm:w-56">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      isBn ? 'ভাউচার, লেজার বা SKU খুঁজুন...' : 'Filter vouchers, ledgers, SKUs...'
                    }
                    aria-label="Filter ERP preview records"
                    className="w-full pl-8 pr-7 py-1.5 text-[12px] bg-white border border-zinc-200 rounded-md text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear filter"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div
                  role="group"
                  aria-label="Financial period range"
                  className="inline-flex items-center p-0.5 bg-zinc-100 border border-zinc-200/80 rounded-md shrink-0"
                >
                  {(['7D', '30D', 'Q4'] as PeriodKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setPeriod(key)}
                      className={cn(
                        'px-2.5 py-1 text-[11.5px] font-mono font-medium rounded-[4px] transition-all cursor-pointer whitespace-nowrap shrink-0',
                        period === key
                          ? 'bg-white text-zinc-950 shadow-[0_1px_2px_rgba(9,9,11,0.06)]'
                          : 'text-zinc-500 hover:text-zinc-900'
                      )}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setQuickComposerOpen((prev) => !prev)}
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-700 hover:bg-blue-800 text-white text-[12px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'দ্রুত ভাউচার' : 'New Entry'}</span>
                </button>
              </div>
            </div>

            {quickComposerOpen && (
              <form
                onSubmit={handleQuickPost}
                className="px-4 sm:px-5 py-3 bg-blue-50/50 border-b border-blue-200/70 flex flex-col sm:flex-row sm:items-end gap-3"
              >
                <div className="flex-1 min-w-0">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    {isBn ? 'পার্টি / লেজার নাম' : 'Ledger Party'}
                  </label>
                  <input
                    type="text"
                    value={quickParty}
                    onChange={(e) => setQuickParty(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-[12.5px] text-zinc-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div className="sm:w-32">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    {isBn ? 'ভাউচার ধরন' : 'Type'}
                  </label>
                  <select
                    value={quickType}
                    onChange={(e) => setQuickType(e.target.value as 'Sales' | 'Receipt' | 'Journal')}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-[12.5px] text-zinc-900 focus:outline-none focus:border-blue-600"
                  >
                    <option value="Sales">Sales</option>
                    <option value="Receipt">Receipt</option>
                    <option value="Journal">Journal</option>
                  </select>
                </div>
                <div className="sm:w-36">
                  <label className="block text-[10.5px] font-semibold uppercase tracking-wider text-zinc-600 mb-1">
                    {isBn ? 'পরিমাণ (BDT)' : 'Amount (BDT)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-zinc-200 rounded-md text-[12.5px] font-mono tabular-nums text-zinc-900 focus:outline-none focus:border-blue-600"
                    required
                  />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-md bg-zinc-950 hover:bg-zinc-800 text-white text-[12px] font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {isBn ? 'পোস্ট করুন' : 'Post Entry'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickComposerOpen(false)}
                    className="px-2.5 py-1.5 rounded-md bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 text-[12px] font-medium cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[216px_1fr]">
              <aside className="bg-[#FAFAFA] border-b lg:border-b-0 lg:border-r border-zinc-200/80 p-2.5 lg:p-3 flex lg:flex-col justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex lg:flex-col gap-1 min-w-max lg:min-w-0">
                  <div className="hidden lg:block px-2.5 pt-1 pb-2 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-400">
                    {isBn ? 'ওয়ার্কস্পেস' : 'Workspace'}
                  </div>
                  {(
                    [
                      {
                        id: 'overview',
                        label: isBn ? 'এক্সিকিউটিভ ওভারভিউ' : 'Overview',
                        shortcut: 'G O',
                        icon: LayoutGrid,
                      },
                      {
                        id: 'ledger',
                        label: isBn ? 'জেনারেল লেজার' : 'General Ledger',
                        shortcut: 'G L',
                        icon: BookOpen,
                      },
                      {
                        id: 'inventory',
                        label: isBn ? 'ইনভেন্টরি ও গোডাউন' : 'Inventory & Stock',
                        shortcut: 'G I',
                        icon: Layers,
                      },
                      {
                        id: 'vat',
                        label: isBn ? 'ভ্যাট ও অডিট ট্রেইল' : 'VAT & Audit',
                        shortcut: 'G V',
                        icon: ShieldCheck,
                      },
                    ] as const
                  ).map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setActiveModule(item.id)}
                        className={cn(
                          'flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0',
                          isActive
                            ? 'bg-white text-zinc-950 border border-zinc-200/90 shadow-[0_1px_2px_rgba(9,9,11,0.04)] font-semibold'
                            : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70 border border-transparent'
                        )}
                      >
                        <span className="flex items-center gap-2">
                          <Icon
                            className={cn(
                              'w-3.5 h-3.5 shrink-0',
                              isActive ? 'text-blue-700' : 'text-zinc-400'
                            )}
                          />
                          <span>{item.label}</span>
                        </span>
                        <span className="hidden lg:inline text-[10px] font-mono text-zinc-400">
                          {item.shortcut}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="hidden lg:block pt-3 border-t border-zinc-200/80 px-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{isBn ? 'বেস কারেন্সি' : 'Currency'}</span>
                    <span className="font-mono font-semibold text-zinc-800">BDT (৳)</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500">
                    <span>{isBn ? 'ট্রায়াল ব্যালেন্স' : 'Trial Balance'}</span>
                    <span className="font-semibold text-emerald-700">Matched</span>
                  </div>
                </div>
              </aside>

              <div className="p-4 sm:p-5 lg:p-6 bg-white min-w-0">
                {activeModule === 'overview' && (
                  <div className="space-y-5">
                    <div className="grid grid-cols-2 xl:grid-cols-4 border border-zinc-200/80 rounded-lg divide-y xl:divide-y-0 xl:divide-x divide-zinc-200/80 bg-[#FAFAFA]/50">
                      <div className="p-3.5 sm:p-4">
                        <div className="text-[11.5px] font-medium text-zinc-500">
                          {isBn ? 'নিট ক্যাশ পজিশন' : 'Net Cash Position'}
                        </div>
                        <div className="mt-1.5 text-[19px] sm:text-[22px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                          {formatMoney(currentNetCash)}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-emerald-700 tabular-nums">
                          {periodStats.cashDelta}
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 border-l border-zinc-200/80 xl:border-l-0">
                        <div className="text-[11.5px] font-medium text-zinc-500">
                          {isBn ? 'পাওনা হিসাব (AR)' : 'Accounts Receivable'}
                        </div>
                        <div className="mt-1.5 text-[19px] sm:text-[22px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                          {formatMoney(periodStats.receivables)}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                          {periodStats.openInvoices} {isBn ? 'টি খোলা ইনভয়েস' : 'open invoices'}
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4">
                        <div className="text-[11.5px] font-medium text-zinc-500">
                          {isBn ? 'মোট স্টক ভ্যালু (FIFO)' : 'Inventory Value (FIFO)'}
                        </div>
                        <div className="mt-1.5 text-[19px] sm:text-[22px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                          {formatMoney(periodStats.stockValue)}
                        </div>
                        <div className="mt-1 text-[11px] text-zinc-500 tabular-nums">
                          {periodStats.godowns} {isBn ? 'টি সক্রিয় গোডাউন' : 'active godowns'}
                        </div>
                      </div>

                      <div className="p-3.5 sm:p-4 border-l border-zinc-200/80 xl:border-l-0">
                        <div className="text-[11.5px] font-medium text-zinc-500">
                          {isBn ? 'অপারেটিং মার্জিন' : 'Operating Margin'}
                        </div>
                        <div className="mt-1.5 text-[19px] sm:text-[22px] font-bold tracking-tight text-zinc-950 font-mono tabular-nums">
                          {periodStats.operatingMargin}
                        </div>
                        <div className="mt-1 text-[11px] font-medium text-blue-700 tabular-nums">
                          {periodStats.marginDelta}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
                      <div className="xl:col-span-8 border border-zinc-200/80 rounded-lg p-4 bg-white select-none">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                          <div>
                            <h3 className="text-[13px] font-semibold text-zinc-900">
                              {isBn ? 'ক্যাশ ইনফ্লো বনাম আউটফ্লো' : 'Cash Inflow vs Outflow'}
                            </h3>
                            <p className="text-[11.5px] text-zinc-500">
                              {isBn
                                ? 'প্রতিটি পিরিয়ডের প্রকৃত ডেটা দেখতে পয়েন্টে মাউস রাখুন'
                                : 'Hover any period node to inspect verified ledger volume'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-medium text-zinc-600">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-[2px] bg-blue-700 inline-block" />
                              {isBn ? 'আয় (Inflow)' : 'Inflow'}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <span className="w-2.5 h-[2px] bg-zinc-400 inline-block border-b border-dashed border-zinc-400" />
                              {isBn ? 'ব্যয় (Outflow)' : 'Outflow'}
                            </span>
                          </div>
                        </div>

                        <div className="relative">
                          {activePoint && (
                            <div className="mb-2 px-3 py-1.5 rounded-md bg-zinc-950 text-white text-[11px] font-mono tabular-nums flex flex-wrap items-center justify-between gap-3">
                              <span className="font-semibold text-zinc-300">
                                {activePoint.label} ({period})
                              </span>
                              <span>
                                Inflow: <strong>{formatMoney(activePoint.inflow)}</strong>
                              </span>
                              <span>
                                Outflow:{' '}
                                <strong className="text-zinc-300">
                                  {formatMoney(activePoint.outflow)}
                                </strong>
                              </span>
                              <span className="text-emerald-400">
                                Net: +{formatMoney(activePoint.inflow - activePoint.outflow)}
                              </span>
                            </div>
                          )}

                          <svg
                            viewBox={`0 0 ${chartGeometry.width} ${chartGeometry.height}`}
                            className="w-full h-[176px] overflow-visible"
                            role="img"
                            aria-label="Cash inflow and outflow chart"
                          >
                            <defs>
                              <linearGradient id="precisionCashFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1D4ED8" stopOpacity="0.14" />
                                <stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>

                            {[0.25, 0.5, 0.75, 1].map((ratio) => {
                              const y = chartGeometry.padTop + chartGeometry.usableH * ratio;
                              return (
                                <line
                                  key={ratio}
                                  x1={chartGeometry.padX}
                                  y1={y}
                                  x2={chartGeometry.width - chartGeometry.padX}
                                  y2={y}
                                  stroke="#E4E4E7"
                                  strokeDasharray="3 3"
                                  strokeWidth="1"
                                />
                              );
                            })}

                            <path d={chartGeometry.areaPath} fill="url(#precisionCashFill)" />
                            <path
                              d={chartGeometry.outflowPath}
                              fill="none"
                              stroke="#A1A1AA"
                              strokeWidth="1.5"
                              strokeDasharray="4 4"
                            />
                            <path
                              d={chartGeometry.linePath}
                              fill="none"
                              stroke="#1D4ED8"
                              strokeWidth="2.2"
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />

                            {chartGeometry.mapped.map((pt, idx) => {
                              const isHovered = hoveredPointIdx === idx;
                              return (
                                <g
                                  key={pt.label}
                                  onMouseEnter={() => setHoveredPointIdx(idx)}
                                  onMouseLeave={() => setHoveredPointIdx(null)}
                                  className="cursor-pointer"
                                >
                                  {isHovered && (
                                    <line
                                      x1={pt.x}
                                      y1={chartGeometry.padTop}
                                      x2={pt.x}
                                      y2={chartGeometry.padTop + chartGeometry.usableH}
                                      stroke="#1D4ED8"
                                      strokeOpacity="0.25"
                                      strokeWidth="1"
                                    />
                                  )}
                                  <circle
                                    cx={pt.x}
                                    cy={pt.yIn}
                                    r={isHovered ? 4.5 : 3}
                                    fill={isHovered ? '#1D4ED8' : '#FFFFFF'}
                                    stroke="#1D4ED8"
                                    strokeWidth="2"
                                  />
                                  <text
                                    x={pt.x}
                                    y={chartGeometry.height - 4}
                                    textAnchor="middle"
                                    className="fill-zinc-500 text-[10px] font-mono"
                                  >
                                    {pt.label}
                                  </text>
                                  <rect
                                    x={pt.x - 28}
                                    y={0}
                                    width={56}
                                    height={chartGeometry.height}
                                    fill="transparent"
                                  />
                                </g>
                              );
                            })}
                          </svg>
                        </div>
                      </div>

                      <div className="xl:col-span-4 border border-zinc-200/80 rounded-lg p-4 bg-white flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[13px] font-semibold text-zinc-900">
                              {isBn ? 'ট্রেজারি ও ব্যাংক ব্যালেন্স' : 'Treasury Balances'}
                            </h3>
                            <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                          </div>

                          <div className="space-y-3">
                            {[
                              { label: 'Standard Chartered BD', amount: 3240500, share: 66 },
                              { label: 'Dutch-Bangla Bank', amount: 1651950, share: 34 },
                              {
                                label: 'Corporate Cash Desk',
                                amount: 248300 + postedDelta,
                                share: 14,
                              },
                              { label: 'Pending Clearing Cheques', amount: 184200, share: 9 },
                            ].map((item) => (
                              <div key={item.label} className="space-y-1">
                                <div className="flex items-center justify-between text-[12px]">
                                  <span className="text-zinc-700 truncate pr-2">{item.label}</span>
                                  <span className="font-mono font-semibold text-zinc-950 tabular-nums shrink-0">
                                    {formatMoney(item.amount)}
                                  </span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-blue-700 rounded-full transition-all duration-300"
                                    style={{ width: `${Math.min(100, item.share)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveModule('ledger')}
                          className="mt-4 pt-3 border-t border-zinc-100 w-full flex items-center justify-between text-[12px] font-semibold text-blue-700 hover:text-blue-800 cursor-pointer"
                        >
                          <span>
                            {isBn ? 'সম্পূর্ণ জেনারেল লেজার দেখুন' : 'Inspect full General Ledger'}
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="border border-zinc-200/80 rounded-lg overflow-hidden">
                      <div className="px-4 py-2.5 bg-[#FAFAFA] border-b border-zinc-200/80 flex items-center justify-between">
                        <span className="text-[12.5px] font-semibold text-zinc-900">
                          {isBn ? 'সাম্প্রতিক অনুমোদিত ভাউচার' : 'Recent Ledger Vouchers'}
                        </span>
                        <span className="text-[11px] font-mono text-zinc-500 tabular-nums">
                          {filteredVouchers.length} {isBn ? 'টি রেকর্ড' : 'entries'}
                        </span>
                      </div>

                      <div className="max-h-[250px] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse min-w-[640px]">
                          <thead className="sticky top-0 z-10 bg-white border-b border-zinc-200/90 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="py-2.5 px-4 align-middle">Voucher #</th>
                              <th className="py-2.5 px-4 align-middle">Ledger Party</th>
                              <th className="py-2.5 px-4 align-middle">Type</th>
                              <th className="py-2.5 px-4 align-middle">Date</th>
                              <th className="py-2.5 px-4 align-middle">Status</th>
                              <th className="py-2.5 px-4 align-middle text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-[12.5px]">
                            {filteredVouchers.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  className="py-8 px-4 text-center align-middle text-zinc-500 text-[12.5px]"
                                >
                                  {isBn
                                    ? 'আপনার সার্চের সাথে মিল রেখে কোনো ভাউচার পাওয়া যায়নি।'
                                    : 'No vouchers match the current filter.'}
                                </td>
                              </tr>
                            ) : (
                              filteredVouchers.map((row) => {
                                const isSelected = selectedVoucherId === row.id;
                                return (
                                  <tr
                                    key={row.id}
                                    onClick={() =>
                                      setSelectedVoucherId(isSelected ? null : row.id)
                                    }
                                    className={cn(
                                      'transition-colors cursor-pointer h-10',
                                      isSelected ? 'bg-blue-50/50' : 'hover:bg-zinc-50/90'
                                    )}
                                  >
                                    <td className="py-2 px-4 align-middle font-mono text-[12px] font-semibold text-zinc-900 whitespace-nowrap">
                                      {row.id}
                                    </td>
                                    <td className="py-2 px-4 align-middle font-medium text-zinc-800">
                                      {isBn ? row.partyBn : row.party}
                                    </td>
                                    <td className="py-2 px-4 align-middle text-zinc-600 whitespace-nowrap">
                                      {row.type}
                                    </td>
                                    <td className="py-2 px-4 align-middle font-mono text-[11.5px] text-zinc-500 whitespace-nowrap">
                                      {row.date}
                                    </td>
                                    <td className="py-2 px-4 align-middle whitespace-nowrap">
                                      <span
                                        className={cn(
                                          'text-[11.5px] font-semibold',
                                          row.status === 'Posted'
                                            ? 'text-blue-700'
                                            : row.status === 'Reconciled'
                                              ? 'text-emerald-700'
                                              : 'text-amber-700'
                                        )}
                                      >
                                        {row.status}
                                      </span>
                                    </td>
                                    <td
                                      className={cn(
                                        'py-2 px-4 align-middle text-right font-mono font-semibold tabular-nums whitespace-nowrap',
                                        row.direction === 'Dr'
                                          ? 'text-emerald-700'
                                          : 'text-rose-700'
                                      )}
                                    >
                                      {formatMoney(row.amount)} {row.direction}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>

                      {selectedVoucher && (
                        <div className="px-4 py-2.5 bg-zinc-50 border-t border-zinc-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11.5px]">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-zinc-600">
                            <span className="font-mono font-semibold text-zinc-900">
                              {selectedVoucher.id}
                            </span>
                            <span className="text-zinc-300">·</span>
                            <span>{selectedVoucher.narration}</span>
                          </div>
                          <span className="font-mono text-[11px] text-zinc-500 shrink-0">
                            {selectedVoucher.costCentre}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeModule === 'ledger' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-[14px] font-semibold text-zinc-950">
                          {isBn
                            ? 'চার্ট অফ অ্যাকাউন্টস ও ক্লোজিং ব্যালেন্স'
                            : 'Chart of Accounts & Closing Balances'}
                        </h3>
                        <p className="text-[12px] text-zinc-500">
                          {isBn
                            ? 'গ্রুপ অনুযায়ী ডেবিট (সবুজ) ও ক্রেডিট (লাল) প্রকৃত ব্যালেন্স'
                            : 'Real-time point-in-time net balances across primary ledger groups'}
                        </p>
                      </div>

                      <div className="inline-flex items-center p-0.5 bg-zinc-100 border border-zinc-200/80 rounded-md overflow-x-auto">
                        {(
                          [
                            { id: 'ALL', label: isBn ? 'সব গ্রুপ' : 'All' },
                            { id: 'DEBTORS', label: isBn ? 'দেনাদার' : 'Debtors' },
                            { id: 'CREDITORS', label: isBn ? 'পাওনাদার' : 'Creditors' },
                            { id: 'TREASURY', label: isBn ? 'ব্যাংক ও ক্যাশ' : 'Cash & Bank' },
                          ] as const
                        ).map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setLedgerFilter(tab.id)}
                            className={cn(
                              'px-2.5 py-1 text-[11.5px] font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap shrink-0',
                              ledgerFilter === tab.id
                                ? 'bg-white text-zinc-950 shadow-[0_1px_2px_rgba(9,9,11,0.06)] font-semibold'
                                : 'text-zinc-500 hover:text-zinc-900'
                            )}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border border-zinc-200/80 rounded-lg overflow-hidden">
                      <div className="max-h-[340px] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="sticky top-0 z-10 bg-[#FAFAFA] border-b border-zinc-200/90 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="py-2.5 px-4 align-middle">Code</th>
                              <th className="py-2.5 px-4 align-middle">Ledger Account</th>
                              <th className="py-2.5 px-4 align-middle">Account Group</th>
                              <th className="py-2.5 px-4 align-middle text-right">
                                Period Turnover
                              </th>
                              <th className="py-2.5 px-4 align-middle text-right">
                                Closing Balance
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-[12.5px]">
                            {filteredLedgers.map((acc) => {
                              const isDr = acc.netBalance >= 0;
                              return (
                                <tr key={acc.code} className="hover:bg-zinc-50 h-10">
                                  <td className="py-2 px-4 align-middle font-mono text-[11.5px] text-zinc-500">
                                    {acc.code}
                                  </td>
                                  <td className="py-2 px-4 align-middle font-medium text-zinc-900">
                                    {acc.name}
                                  </td>
                                  <td className="py-2 px-4 align-middle text-zinc-600">
                                    {acc.groupLabel}
                                  </td>
                                  <td className="py-2 px-4 align-middle text-right font-mono tabular-nums text-zinc-600">
                                    {formatMoney(acc.turnover)}
                                  </td>
                                  <td
                                    className={cn(
                                      'py-2 px-4 align-middle text-right font-mono font-semibold tabular-nums',
                                      isDr ? 'text-emerald-700' : 'text-rose-700'
                                    )}
                                  >
                                    {formatMoney(acc.netBalance)} {isDr ? 'Dr' : 'Cr'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeModule === 'inventory' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3 className="text-[14px] font-semibold text-zinc-950">
                          {isBn
                            ? 'মাল্টি-গোডাউন FIFO স্টক সামারি'
                            : 'Multi-Godown FIFO Stock Valuation'}
                        </h3>
                        <p className="text-[12px] text-zinc-500">
                          {isBn
                            ? '৩টি ওয়্যারহাউজ জুড়ে রিয়েল-টাইম ব্যাচ ও পরিমাণ হিসাব'
                            : 'Live SKU quantities and FIFO batch valuation across warehouses'}
                        </p>
                      </div>

                      <div className="inline-flex items-center p-0.5 bg-zinc-100 border border-zinc-200/80 rounded-md overflow-x-auto">
                        {(
                          ['ALL', 'Dhaka Central', 'Chattogram Port', 'Gazipur Depot'] as const
                        ).map((gd) => (
                          <button
                            key={gd}
                            type="button"
                            onClick={() => setGodownFilter(gd)}
                            className={cn(
                              'px-2.5 py-1 text-[11.5px] font-medium rounded-[4px] transition-colors cursor-pointer whitespace-nowrap shrink-0',
                              godownFilter === gd
                                ? 'bg-white text-zinc-950 shadow-[0_1px_2px_rgba(9,9,11,0.06)] font-semibold'
                                : 'text-zinc-500 hover:text-zinc-900'
                            )}
                          >
                            {gd === 'ALL' ? (isBn ? 'সব গোডাউন' : 'All Godowns') : gd}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="border border-zinc-200/80 rounded-lg overflow-hidden">
                      <div className="max-h-[340px] overflow-x-auto overflow-y-auto">
                        <table className="w-full text-left border-collapse min-w-[620px]">
                          <thead className="sticky top-0 z-10 bg-[#FAFAFA] border-b border-zinc-200/90 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="py-2.5 px-4 align-middle">SKU</th>
                              <th className="py-2.5 px-4 align-middle">Item Name</th>
                              <th className="py-2.5 px-4 align-middle">Godown</th>
                              <th className="py-2.5 px-4 align-middle text-right">Stock Qty</th>
                              <th className="py-2.5 px-4 align-middle text-right">FIFO Rate</th>
                              <th className="py-2.5 px-4 align-middle text-right">Valuation</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-[12.5px]">
                            {filteredInventory.map((item) => (
                              <tr key={item.sku} className="hover:bg-zinc-50 h-10">
                                <td className="py-2 px-4 align-middle font-mono text-[11.5px] font-medium text-zinc-600">
                                  {item.sku}
                                </td>
                                <td className="py-2 px-4 align-middle font-medium text-zinc-900">
                                  {item.name}
                                </td>
                                <td className="py-2 px-4 align-middle text-zinc-600">
                                  {item.godown}
                                </td>
                                <td className="py-2 px-4 align-middle text-right font-mono tabular-nums text-zinc-900">
                                  {formatQty(item.qty, item.unit)}
                                </td>
                                <td className="py-2 px-4 align-middle text-right font-mono tabular-nums text-zinc-600">
                                  {formatMoney(item.rate)}
                                </td>
                                <td className="py-2 px-4 align-middle text-right font-mono font-semibold tabular-nums text-zinc-950">
                                  {formatMoney(item.valuation)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeModule === 'vat' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[14px] font-semibold text-zinc-950">
                          {isBn
                            ? 'এনবিআর মুসক ৬.৩ / ৯.১ কমপ্লায়েন্স ও অডিট লগ'
                            : 'NBR Mushak 6.3 / 9.1 Compliance & Audit Log'}
                        </h3>
                        <p className="text-[12px] text-zinc-500">
                          {isBn
                            ? 'প্রতিটি ভাউচারের অপরিবর্তনীয় অনুমোদন ও ট্যাক্স সমন্বয়'
                            : 'Immutable statutory VAT reconciliation and role approval trail'}
                        </p>
                      </div>
                      <FileSpreadsheet className="w-4 h-4 text-blue-700 shrink-0" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 border border-zinc-200/80 rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 bg-[#FAFAFA]/60">
                      <div className="p-3.5">
                        <div className="text-[11px] font-medium text-zinc-500">
                          {isBn ? 'আউটপুট ভ্যাট (১৫%)' : 'Output VAT (15%)'}
                        </div>
                        <div className="mt-1 text-[18px] font-bold font-mono tabular-nums text-zinc-950">
                          {formatMoney(485200)}
                        </div>
                      </div>
                      <div className="p-3.5">
                        <div className="text-[11px] font-medium text-zinc-500">
                          {isBn ? 'ইনপুট রিবেট ক্রেডিট' : 'Input Tax Credit'}
                        </div>
                        <div className="mt-1 text-[18px] font-bold font-mono tabular-nums text-emerald-700">
                          {formatMoney(277500)}
                        </div>
                      </div>
                      <div className="p-3.5">
                        <div className="text-[11px] font-medium text-zinc-500">
                          {isBn ? 'নিট প্রদেয় ভ্যাট' : 'Net Payable to Treasury'}
                        </div>
                        <div className="mt-1 text-[18px] font-bold font-mono tabular-nums text-blue-700">
                          {formatMoney(207700)}
                        </div>
                      </div>
                    </div>

                    <div className="border border-zinc-200/80 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                          <thead className="sticky top-0 z-10 bg-[#FAFAFA] border-b border-zinc-200/90 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                            <tr>
                              <th className="py-2.5 px-4 align-middle">Mushak Ref</th>
                              <th className="py-2.5 px-4 align-middle">Statutory Record</th>
                              <th className="py-2.5 px-4 align-middle">Authorized By</th>
                              <th className="py-2.5 px-4 align-middle">Status</th>
                              <th className="py-2.5 px-4 align-middle text-right">VAT Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 text-[12.5px]">
                            {VAT_AUDIT_RECORDS.map((rec) => (
                              <tr key={rec.ref} className="hover:bg-zinc-50 h-10">
                                <td className="py-2 px-4 align-middle font-mono text-[11.5px] font-semibold text-zinc-900">
                                  {rec.ref}
                                </td>
                                <td className="py-2 px-4 align-middle text-zinc-800 font-medium">
                                  {rec.filing}
                                </td>
                                <td className="py-2 px-4 align-middle text-zinc-600">
                                  <span>{rec.approver}</span>
                                  <span className="ml-2 text-[11px] font-mono text-zinc-400">
                                    {rec.timestamp}
                                  </span>
                                </td>
                                <td className="py-2 px-4 align-middle">
                                  <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-emerald-700">
                                    <Check className="w-3.5 h-3.5" />
                                    {rec.status}
                                  </span>
                                </td>
                                <td className="py-2 px-4 align-middle text-right font-mono font-semibold tabular-nums text-zinc-950">
                                  {formatMoney(rec.vatAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PrecisionEnterpriseHero;
