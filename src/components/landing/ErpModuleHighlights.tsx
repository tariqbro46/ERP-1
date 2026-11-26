import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  BarChart3,
  BookOpen,
  Calculator,
  CalendarCheck,
  Clock,
  FileCheck2,
  FileSpreadsheet,
  Layers,
  Package,
  Receipt,
  ShieldCheck,
  Users,
  Warehouse,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

interface ErpModuleHighlightsProps {
  isMonochrome?: boolean;
}

type ModuleTab = 'all' | 'inventory' | 'accounting' | 'payroll';

interface FeatureItem {
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ModuleSpec {
  id: Exclude<ModuleTab, 'all'>;
  index: string;
  labelEn: string;
  labelBn: string;
  headlineEn: string;
  headlineBn: string;
  summaryEn: string;
  summaryBn: string;
  icon: React.ComponentType<{ className?: string }>;
  features: FeatureItem[];
}

const MODULES: ModuleSpec[] = [
  {
    id: 'inventory',
    index: '01',
    labelEn: 'Inventory',
    labelBn: 'ইনভেন্টরি',
    headlineEn: 'Multi-godown stock and batch control',
    headlineBn: 'মাল্টি-গোডাউন স্টক ও ব্যাচ নিয়ন্ত্রণ',
    summaryEn:
      'Track exact quantities, FIFO valuations, and inter-warehouse transfers across every branch without manual stock sweeps.',
    summaryBn:
      'প্রতিটি গুদাম ও শাখাজুড়ে পণ্যের সঠিক পরিমাণ, FIFO মূল্যায়ন এবং স্টক ট্রান্সফার রিয়েল-টাইমে পরিচালনা করুন।',
    icon: Package,
    features: [
      {
        titleEn: 'Multi-Godown Tracking',
        titleBn: 'মাল্টি-গোডাউন ট্র্যাকিং',
        descEn: 'Monitor real-time stock availability across central depots and retail outlets.',
        descBn: 'সেন্ট্রাল ডিপো ও শাখা অফিসগুলোর লাইভ স্টক অবস্থান একসাথে দেখুন।',
        icon: Warehouse,
      },
      {
        titleEn: 'FIFO Batch Valuation',
        titleBn: 'FIFO ব্যাচ মূল্যায়ন',
        descEn: 'Automatic lot-wise purchase cost and gross margin calculation on every dispatch.',
        descBn: 'প্রতিটি বিক্রয়ে লটভিত্তিক ক্রয়মূল্য ও প্রকৃত লাভের স্বয়ংক্রিয় হিসাব।',
        icon: Layers,
      },
      {
        titleEn: 'Low-Stock Reorder Alerts',
        titleBn: 'রিঅর্ডার সতর্কতা',
        descEn: 'Set item thresholds to catch shortages early and plan procurement cleanly.',
        descBn: 'ন্যূনতম স্টক সীমা নির্ধারণ করে ঘাটতির আগেই ক্রয় পরিকল্পনা করুন।',
        icon: AlertCircle,
      },
      {
        titleEn: 'Godown Stock Transfers',
        titleBn: 'গোডাউন স্টক ট্রান্সফার',
        descEn: 'Record branch-to-branch stock movements with instant audit trail updates.',
        descBn: 'এক গুদাম থেকে অন্য গুদামে পণ্য স্থানান্তর ও সম্পূর্ণ অডিট লগ সংরক্ষণ।',
        icon: ArrowLeftRight,
      },
    ],
  },
  {
    id: 'accounting',
    index: '02',
    labelEn: 'Accounting',
    labelBn: 'অ্যাকাউন্টিং',
    headlineEn: 'Double-entry ledgering and statutory readiness',
    headlineBn: 'ডাবল-এন্ট্রি লেজার ও ভ্যাট কমপ্লায়েন্স',
    summaryEn:
      'Every sales, purchase, receipt, and journal voucher posts atomically to balanced ledgers and audit-ready statements.',
    summaryBn:
      'বিক্রয়, ক্রয়, রিসিট ও জার্নাল ভাউচার সেভ করার সাথে সাথেই লেজার ব্যালেন্স ও আর্থিক রিপোর্ট হালনাগাদ হয়।',
    icon: BookOpen,
    features: [
      {
        titleEn: 'Balanced Voucher Entry',
        titleBn: 'নির্ভুল ভাউচার এন্ট্রি',
        descEn: 'Enforced debit-credit parity across Sales, Purchase, Receipt, Payment, and Journal.',
        descBn: 'সেলস, পারচেজ, রিসিট, পেমেন্ট ও জার্নালে শতভাগ ডেবিট-ক্রেডিট সমতা।',
        icon: FileCheck2,
      },
      {
        titleEn: 'Instant Financial Reports',
        titleBn: 'তাৎক্ষণিক আর্থিক বিবরণী',
        descEn: 'Generate Trial Balance, Balance Sheet, and P&L directly from live postings.',
        descBn: 'সরাসরি লাইভ ট্রানজ্যাকশন থেকে ট্রায়াল ব্যালেন্স, ব্যালেন্স শিট ও লাভ-ক্ষতি।',
        icon: BarChart3,
      },
      {
        titleEn: 'Debtors & Creditors Aging',
        titleBn: 'দেনাদার ও পাওনাদার এজিং',
        descEn: 'Track overdue party balances, credit limits, and settlement timelines clearly.',
        descBn: 'বকেয়া পাওনা ও পরিশোধের সময়সীমা পার্টি অনুযায়ী সহজে পর্যবেক্ষণ করুন।',
        icon: Clock,
      },
      {
        titleEn: 'NBR VAT & Audit Trail',
        titleBn: 'এনবিআর ভ্যাট ও অডিট লগ',
        descEn: 'Structured Mushak-ready tax records and immutable role-based approval logs.',
        descBn: 'মুসক-উপযোগী ভ্যাট রেকর্ড এবং রোল-ভিত্তিক অনুমোদনের স্থায়ী ইতিহাস।',
        icon: ShieldCheck,
      },
    ],
  },
  {
    id: 'payroll',
    index: '03',
    labelEn: 'Payroll',
    labelBn: 'পেরোল ও এইচআর',
    headlineEn: 'Structured salary runs linked to your ledger',
    headlineBn: 'লেজারের সাথে সংযুক্ত স্বয়ংক্রিয় বেতন ব্যবস্থাপনা',
    summaryEn:
      'Process monthly payroll, attendance adjustments, and employee advances with direct accounting integration.',
    summaryBn:
      'মাসিক বেতন শিট, উপস্থিতি সমন্বয় এবং অগ্রিম কর্তন সরাসরি মূল অ্যাকাউন্টিংয়ের সাথে যুক্ত রাখুন।',
    icon: Users,
    features: [
      {
        titleEn: 'Automated Salary Sheets',
        titleBn: 'স্বয়ংক্রিয় বেতন শিট',
        descEn: 'Compute basic pay, allowances, overtime, and statutory deductions in minutes.',
        descBn: 'মূল বেতন, ভাতা, ওভারটাইম এবং কর্তন এক ক্লিকেই নির্ভুলভাবে গণনা করুন।',
        icon: Calculator,
      },
      {
        titleEn: 'Attendance & Leave Sync',
        titleBn: 'উপস্থিতি ও ছুটি সমন্বয়',
        descEn: 'Tie shift attendance and approved leave days directly into monthly pay runs.',
        descBn: 'দৈনিক হাজিরা ও অনুমোদিত ছুটির হিসাব সরাসরি মাসিক বেতনে যুক্ত করুন।',
        icon: CalendarCheck,
      },
      {
        titleEn: 'Advances & Loan Recovery',
        titleBn: 'অগ্রিম ও ঋণ সমন্বয়',
        descEn: 'Track staff advances and schedule automated monthly installment deductions.',
        descBn: 'কর্মীদের অগ্রিম প্রদান এবং মাসিক কিস্তির স্বয়ংক্রিয় কর্তন ট্র্যাক করুন।',
        icon: Receipt,
      },
      {
        titleEn: 'Payslips & Ledger Posting',
        titleBn: 'পে-স্লিপ ও লেজার পোস্টিং',
        descEn: 'Export printable payslips and post consolidated salary expenses to accounts.',
        descBn: 'প্রিন্ট-রেডি পে-স্লিপ তৈরি এবং সরাসরি অ্যাকাউন্টসে বেতন খরচ পোস্টিং।',
        icon: FileSpreadsheet,
      },
    ],
  },
];

export const ErpModuleHighlights: React.FC<ErpModuleHighlightsProps> = ({
  isMonochrome = false,
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const [activeTab, setActiveTab] = useState<ModuleTab>('all');

  const visibleModules =
    activeTab === 'all' ? MODULES : MODULES.filter((mod) => mod.id === activeTab);

  return (
    <section
      id="erp-modules"
      aria-labelledby="erp-modules-heading"
      className={cn(
        'py-20 sm:py-28 border-t transition-colors scroll-mt-20',
        isMonochrome
          ? 'bg-[#0c0d10] border-white/[0.06] text-neutral-100'
          : 'bg-[#FAFAFA] border-zinc-200/80 text-zinc-950'
      )}
    >
      <div className="max-w-[1220px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header + Filter Bar */}
        <div
          className={cn(
            'flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-10 border-b',
            isMonochrome ? 'border-white/[0.08]' : 'border-zinc-200/80'
          )}
        >
          <div className="max-w-2xl">
            <p
              className={cn(
                'text-[11px] font-mono font-medium uppercase tracking-[0.14em]',
                isMonochrome ? 'text-neutral-400' : 'text-zinc-500'
              )}
            >
              {isBn
                ? 'কোর ইআরপি মডিউলসমূহ  ·  ইনভেন্টরি  ·  অ্যাকাউন্টিং  ·  পেরোল'
                : 'Core ERP Suite  ·  Inventory  ·  Accounting  ·  Payroll'}
            </p>
            <h2
              id="erp-modules-heading"
              className={cn(
                'mt-3 text-2xl sm:text-4xl font-bold tracking-[-0.025em] leading-[1.15]',
                isMonochrome ? 'text-white' : 'text-zinc-950'
              )}
              style={{ textWrap: 'balance' }}
            >
              {isBn
                ? 'প্রতিটি বিভাগ পরিচালনার জন্য সমন্বিত মডিউল'
                : 'Essential ERP modules built to work in sync'}
            </h2>
            <p
              className={cn(
                'mt-3 text-[15px] leading-relaxed max-w-[58ch]',
                isMonochrome ? 'text-neutral-400' : 'text-zinc-600'
              )}
            >
              {isBn
                ? 'ইনভেন্টরি, অ্যাকাউন্টিং এবং পেরোল মডিউল একসাথে যুক্ত থাকায় প্রতিটি এন্ট্রি স্বয়ংক্রিয়ভাবে সঠিক লেজারে প্রতিফলিত হয়।'
                : 'Explore how Inventory, Accounting, and Payroll connect inside one unified workspace without duplicate data entry.'}
            </p>
          </div>

          {/* Interactive Module Segmented Filter */}
          <div
            role="tablist"
            aria-label={isBn ? 'ইআরপি মডিউল ফিল্টার' : 'Filter ERP modules'}
            className={cn(
              'inline-flex items-center p-1 rounded-lg border self-start lg:self-auto overflow-x-auto max-w-full',
              isMonochrome
                ? 'bg-[#14151a] border-white/[0.08]'
                : 'bg-zinc-100 border-zinc-200/80'
            )}
          >
            {(
              [
                { id: 'all', labelEn: 'All Modules', labelBn: 'সব মডিউল' },
                { id: 'inventory', labelEn: 'Inventory', labelBn: 'ইনভেন্টরি' },
                { id: 'accounting', labelEn: 'Accounting', labelBn: 'অ্যাকাউন্টিং' },
                { id: 'payroll', labelEn: 'Payroll', labelBn: 'পেরোল' },
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-3.5 py-2 text-[12.5px] font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0',
                    isSelected
                      ? isMonochrome
                        ? 'bg-white text-zinc-950 font-semibold shadow-xs'
                        : 'bg-white text-zinc-950 font-semibold shadow-[0_1px_2px_rgba(9,9,11,0.06)]'
                      : isMonochrome
                        ? 'text-neutral-400 hover:text-white'
                        : 'text-zinc-600 hover:text-zinc-950'
                  )}
                >
                  {isBn ? tab.labelBn : tab.labelEn}
                </button>
              );
            })}
          </div>
        </div>

        {/* Module Bands (Architectural Hairline Separation, Zero Nested Cards) */}
        <div
          className={cn(
            'divide-y',
            isMonochrome ? 'divide-white/[0.08]' : 'divide-zinc-200/80'
          )}
        >
          {visibleModules.map((mod) => {
            const ModuleIcon = mod.icon;
            return (
              <div
                key={mod.id}
                className="py-10 sm:py-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start"
              >
                {/* Module Summary Column */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center border shrink-0',
                        isMonochrome
                          ? 'bg-[#14151a] border-white/[0.1] text-white'
                          : 'bg-white border-zinc-200/90 text-blue-700'
                      )}
                    >
                      <ModuleIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[11px] font-mono font-semibold tabular-nums',
                          isMonochrome ? 'text-neutral-400' : 'text-zinc-500'
                        )}
                      >
                        {mod.index}.
                      </span>
                      <h3
                        className={cn(
                          'text-lg font-bold tracking-tight',
                          isMonochrome ? 'text-white' : 'text-zinc-950'
                        )}
                      >
                        {isBn ? mod.labelBn : mod.labelEn}
                      </h3>
                    </div>
                  </div>

                  <p
                    className={cn(
                      'text-[15px] font-semibold leading-snug',
                      isMonochrome ? 'text-neutral-200' : 'text-zinc-900'
                    )}
                  >
                    {isBn ? mod.headlineBn : mod.headlineEn}
                  </p>

                  <p
                    className={cn(
                      'text-[13.5px] leading-relaxed',
                      isMonochrome ? 'text-neutral-400' : 'text-zinc-600'
                    )}
                  >
                    {isBn ? mod.summaryBn : mod.summaryEn}
                  </p>

                  <div className="pt-1">
                    <Link
                      to="/features"
                      className={cn(
                        'inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors whitespace-nowrap shrink-0',
                        isMonochrome
                          ? 'text-neutral-200 hover:text-white'
                          : 'text-blue-700 hover:text-blue-800'
                      )}
                    >
                      <span>
                        {isBn
                          ? `${mod.labelBn} ফিচারসমূহ দেখুন`
                          : `Explore ${mod.labelEn} capabilities`}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Simplified Icon-Driven Feature Grid */}
                <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                  {mod.features.map((feat) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div
                        key={feat.titleEn}
                        className={cn(
                          'p-5 rounded-xl border transition-colors',
                          isMonochrome
                            ? 'bg-[#121317] border-white/[0.07] hover:border-white/[0.14]'
                            : 'bg-white border-zinc-200/85 hover:border-zinc-300'
                        )}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-lg flex items-center justify-center border shrink-0 mt-0.5',
                              isMonochrome
                                ? 'bg-[#181a20] border-white/[0.08] text-neutral-200'
                                : 'bg-zinc-50 border-zinc-200/80 text-zinc-800'
                            )}
                          >
                            <FeatIcon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h4
                              className={cn(
                                'text-[14px] font-semibold tracking-tight leading-snug',
                                isMonochrome ? 'text-white' : 'text-zinc-950'
                              )}
                            >
                              {isBn ? feat.titleBn : feat.titleEn}
                            </h4>
                            <p
                              className={cn(
                                'mt-1.5 text-[13px] leading-relaxed',
                                isMonochrome ? 'text-neutral-400' : 'text-zinc-600'
                              )}
                            >
                              {isBn ? feat.descBn : feat.descEn}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ErpModuleHighlights;
