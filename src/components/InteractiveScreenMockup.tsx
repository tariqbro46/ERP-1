import React, { useState } from 'react';
import { 
  Laptop, Calendar, Tag, ShieldCheck, DollarSign, 
  Layers, Package, ChevronRight, UserCheck, Calculator,
  Compass, AlertCircle, FileText, Smartphone, LayoutGrid,
  TrendingUp, Activity, ArrowRightLeft, BookOpen, Key,
  Sparkles, Check, HelpCircle
} from 'lucide-react';

interface InteractiveScreenMockupProps {
  categoryId: string;
  lang: 'en' | 'bn';
}

interface CalloutPoint {
  id: number;
  top: string; // Tailwind percentage position (e.g. 'top-[10%]')
  left: string; // Tailwind percentage position (e.g. 'left-[20%]')
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
}

export default function InteractiveScreenMockup({ categoryId, lang }: InteractiveScreenMockupProps) {
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [activeVoucherTab, setActiveVoucherTab] = useState<'payment' | 'receipt' | 'sales'>('sales');

  // Load callouts based on active Category
  const callouts: Record<string, CalloutPoint[]> = {
    'getting-started': [
      {
        id: 1,
        top: 'top-[8%]',
        left: 'left-[22%]',
        titleEn: "Head Navigation & Liquidity Bar",
        titleBn: "হেডার নেভিগেশন ও তারল্য বার",
        descEn: "Displays instant live feeds of Cash-in-Hand and Corporate Bank Balances without running manual reports.",
        descBn: "ম্যানুয়ালি রিপোর্ট রান না করেই হাতে থাকা নগদ ও ব্যাংকের মোট রিয়েল-টাইম ব্যালেন্স প্রদর্শন করে।"
      },
      {
        id: 2,
        top: 'top-[35%]',
        left: 'left-[45%]',
        titleEn: "Sales Performance graph",
        titleBn: "বিক্রয় পারফরম্যান্স ড্যাশবোর্ড গ্রাফ",
        descEn: "Interactive bar analytics illustrating revenue indices split across dynamic custom daily and monthly periods.",
        descBn: "দৈনিক ও মাসিক বিভাজনে রাজস্ব আয়ের গতিপথ বিশ্লেষণের ইন্টারঅ্যাক্টিভ অ্যানালিটিক্যাল চার্ট ড্যাশবোর্ড।"
      },
      {
        id: 3,
        top: 'top-[75%]',
        left: 'left-[78%]',
        titleEn: "System Activities Logger Logging",
        titleBn: "সিস্টেম অ্যাক্টিভিটি স্ট্রিম ট্র্যাকিং",
        descEn: "A transparent live timeline log archiving state mutations, newly booked vouchers, and database modifications for audit readiness.",
        descBn: "অডিট ও ডাটা সুরক্ষার লক্ষ্যে প্রতিটি ভাউচার এন্ট্রি বা পরিবর্তনের রিয়েল-টাইম ক্রনোলজিক্যাল লগ।"
      },
      {
        id: 4,
        top: 'top-[18%]',
        left: 'left-[88%]',
        titleEn: "ERP Pinned Shortcuts Module",
        titleBn: "পিনযুক্ত কুইক শর্টকাট মডিউল",
        descEn: "One-click action panels pinned directly at the desktop header to jump straight to critical creation sub-menus.",
        descBn: "কম সময়ে কাজ করতে ড্যাশবোর্ডের উপরে পিন করা কুইক বাটন প্যানেল যা সরাসরি সংশ্লিষ্ট ফর্মে নিয়ে যায়।"
      }
    ],
    'accounting-ledgers': [
      {
        id: 1,
        top: 'top-[18%]',
        left: 'left-[35%]',
        titleEn: "Legal Name Designation",
        titleBn: "লেজারের আইনি নাম নির্ধারণ",
        descEn: "Enter the full regulatory legal name of the entity or cost account (e.g. 'Dhanmondi Retail Hub Ltd' or 'Office Rent Expenses').",
        descBn: "গ্রাহক, সরবরাহকারী বা খরচের হিসাব খাতার প্রাতিষ্ঠানিক নাম টাইপ করুন (যেমন- 'অফিস ডেকোরেশন' বা 'ধানমন্ডি রিটেইল হাব')।"
      },
      {
        id: 2,
        top: 'top-[36%]',
        left: 'left-[35%]',
        titleEn: "Classification Grouping Definition",
        titleBn: "অ্যাকাউন্টস গ্রুপ বা ক্যাটাগরি ম্যাপিং",
        descEn: "Critically important. Map customer ledgers under 'Sundry Debtors', suppliers under 'Sundry Creditors', and cash portals under 'Hand in Cash'.",
        descBn: "অত্যন্ত গুরুত্বপূর্ণ ক্ষেত্র। কাস্টমার লেজারকে 'Sundry Debtors', সাপ্লায়ারদের 'Sundry Creditors' এবং প্রধান ক্যাশকে 'Hand in Cash' এর সাথে ট্যাগ করুন।"
      },
      {
        id: 3,
        top: 'top-[52%]',
        left: 'left-[35%]',
        titleEn: "Opening Balances Declared",
        titleBn: "প্রারম্ভিক ব্যালেন্স (Opening Balance)",
        descEn: "Enter the ledger's starting balance at fiscal migration. Asset categories carry a Debit tag, whereas Liability/Capital carry Credit.",
        descBn: "মাইগ্রেশনের সময় আগের হিসাব খাতা থেকে আসা শুরুর অবশিষ্টাংশ। হিসাবের প্রকৃতি অনুযায়ী ডেবিট (Dr) বা ক্রেডিট (Cr) নির্বাচন করুন।"
      },
      {
        id: 4,
        top: 'top-[78%]',
        left: 'left-[65%]',
        titleEn: "Compliance & VAT/GST details",
        titleBn: "কমপ্লায়েন্স ও ট্যাক্স/জিএসটি বিবরণ",
        descEn: "Store mailing addresses and tax numbers. Standard addresses are automatically compiled on voucher print invoices.",
        descBn: "সংশ্লিষ্ট পার্টির ঠিকানা ও ট্যাক্স কোড সেভ করে রাখুন। বিক্রয় বিল বা ডিল চালানের সময় এগুলো চালানে স্বয়ংক্রিয়ভাবে প্রিন্ট হবে।"
      }
    ],
    'vouchers': [
      {
        id: 1,
        top: 'top-[12%]',
        left: 'left-[15%]',
        titleEn: "Voucher Type Selectors",
        titleBn: "ভাউচার টাইপ ওয়াইড প্যানেল",
        descEn: "Toggle forms between Payments (F5), Receipts (F6), Contra (F4), Sales (F8), and Purchase (F9). Modifies inputs automatically.",
        descBn: "লেনদেনের প্রকৃতি অনুযায়ী Contra (F4), Payment (F5), Receipt (F6), Sales (F8) অথবা Purchase (F9) মোড পরিবর্তন করতে সাহায্য করে।"
      },
      {
        id: 2,
        top: 'top-[20%]',
        left: 'left-[75%]',
        titleEn: "Voucher Timeline calendar",
        titleBn: "ভাউচার লেনদেন পঞ্জিকা বা ডেট পিকার",
        descEn: "Ensures transactions align with active monthly accounting calendars. Essential for running valid periodical reports.",
        descBn: "লেনদেনটি কোন তারিখ ভুক্ত হবে তা নির্দেশ করে। এটি মাসিক লাভ-ক্ষতি বিবরণী বা ট্রায়াল ব্যালেন্সে গভীর প্রভাব ফেলে।"
      },
      {
        id: 3,
        top: 'top-[38%]',
        left: 'left-[45%]',
        titleEn: "Double-Entry Ledger allocation",
        titleBn: "ডাবল-এন্ট্রি প্রভাবিত লেজার নির্ধারণ",
        descEn: "Choose participating debited/credited accounts. The system verifies balance bounds to secure ledger precision.",
        descBn: "প্রভাবিত ডেবিট ও ক্রেডিট লেজারগুলো চয়ন করুন। লেজার গুলোর বর্তমান বুক ব্যালেন্স রিয়েল-টাইমে এখানে দেখা যায়।"
      },
      {
        id: 4,
        top: 'top-[60%]',
        left: 'left-[45%]',
        titleEn: "Physical inventory list (Sales/Purchase)",
        titleBn: "ইনভেন্টরি আইটেমেটেড তালিকা গ্রেট",
        descEn: "In Sales (F8) and Purchase (F9) vouchers, map actual SKU codes, quantities, and rates. Generates sub-totals automatically with taxes.",
        descBn: "বিক্রয় ও ক্রয়ের ক্ষেত্রে পণ্যের নির্দিষ্ট নাম (SKU), গোডাউন, সঠিক পরিমাণ এবং ইউনিট রেট ইনপুট দিন। সাব-টোটাল নিচে হিসাব হবে।"
      },
      {
        id: 5,
        top: 'top-[82%]',
        left: 'left-[35%]',
        titleEn: "Audit Narrative (Narration)",
        titleBn: "ন্যারেশন বা লেনদেনের সংক্ষিপ্ত মন্তব্য",
        descEn: "Enter a brief text description explaining the transactional grounds for future audit verification records (e.g. 'Office Rent Cash Paid').",
        descBn: "অডিট বা যাচাইয়ের সুবিধার্থে লেনদেনের একটি সংক্ষিপ্ত বর্ণনা বা নোট লিখে রাখুন (যেমন- 'মে মাসের বিদ্যুৎ বিল ব্যাংক হতে পরিশোধ')।"
      }
    ],
    'inventory': [
      {
        id: 1,
        top: 'top-[22%]',
        left: 'left-[35%]',
        titleEn: "SKU & General Identifiers",
        titleBn: "ইউনিক এসকিউ (SKU) কোডিং",
        descEn: "Map unique barcodes and short codes for rapid inventory lookup and automated invoicing.",
        descBn: "দ্রুত পণ্য সার্চ ও নির্ভুল চালানের জন্য একটি স্বতন্ত্র কোড এবং ডাকনাম যুক্ত করুন।"
      },
      {
        id: 2,
        top: 'top-[42%]',
        left: 'left-[35%]',
        titleEn: "Measurement calibration (UoM)",
        titleBn: "পরিমাপের স্ট্যান্ডার্ড একক (UoM) নির্ধারণ",
        descEn: "Set units (e.g., Pcs vs Kgs). Items marked 'Pcs' are strictly treated as whole integers with zero decimals as per AGENTS.md mandates.",
        descBn: "পরিমাপ ইউনিট সেট করুন (যেমন Kgs বা Pcs)। 'Pcs' বা 'Nos' ইউনিটের আন্ডারে থাকা পণ্যের সংখ্যায় কোনো দশমিক থাকবে না।"
      },
      {
        id: 3,
        top: 'top-[62%]',
        left: 'left-[32%]',
        titleEn: "Optimal Inventory Reorder Limit",
        titleBn: "সর্বনিম্ন মজুদ ও রিঅর্ডার সীমা",
        descEn: "Establish safety limits. The platform triggers immediate reorder warnings when physical stocks dip beneath this value.",
        descBn: "নিরাপদ ন্যূনতম মজুদ স্তর সেট করুন। পণ্যের স্টক এই নিচে নেমে আসার সাথে সাথে সিস্টেম রিঅর্ডার সংকেত বা অ্যালার্ট পাঠাবে।"
      },
      {
        id: 4,
        top: 'top-[78%]',
        left: 'left-[65%]',
        titleEn: "Godown Hub & Logistical Movements",
        titleBn: "মাল্টি-লোকেশন গোডাউন ও স্টক ট্রান্সফার",
        descEn: "Configure warehouse locations. Transfer materials easily across active zones via Stock Journal transactions.",
        descBn: "একাধিক ফিজিক্যাল গুদাম অ্যাড করুন এবং 'Stock Journal' ভাউচারের সাহায্যে এক গুদাম থেকে অন্যটিতে ডেটা স্থানান্তর করুন।"
      }
    ],
    'payroll': [
      {
        id: 1,
        top: 'top-[25%]',
        left: 'left-[22%]',
        titleEn: "Daily Attendance Ledger Rosters",
        titleBn: "দৈনিক স্মার্ট হাজিরা কনসোল",
        descEn: "Mark staff Present/Absent/Leave daily. Linked directly to monthly payroll computations and attendance-dependent pay structures.",
        descBn: "কর্মচারীদের দৈনিক উপস্থিতি ট্র্যাকিং শিট। এটি মূলত মাস শেষে স্বয়ংক্রিয়ভাবে অনুপস্থিতির আনুপাতিক বেতন কাটতে সাহায্য করে।"
      },
      {
        id: 2,
        top: 'top-[36%]',
        left: 'left-[72%]',
        titleEn: "Dynamic Earnings & Deductions",
        titleBn: "পে-হেড কনফিগ বার (Earnings / Deductions)",
        descEn: "Separate earnings allowances (HRA, transport incentives) from deductions (provident funds, loan repayments).",
        descBn: "মূল বেতনের সাথে আলাদা করুন অন্যান্য ভাতা (বাড়ি ভাড়া, যাতায়াত) এবং বিধিবদ্ধ কর্তনসমূহ (প্রভিডেন্ট ফান্ড, ট্যাক্স)।"
      },
      {
        id: 3,
        top: 'top-[62%]',
        left: 'left-[45%]',
        titleEn: "Advances & Corporate Loan Ledgers",
        titleBn: "কর্মচারী অ্যাডভান্স লোন ও ইএমআই (EMI) ডিডাকশন",
        descEn: "Disburse corporate employee advances. The payroll engine auto-deducts the predetermined monthly EMI when running monthly salary generation.",
        descBn: "কর্মী অগ্রিম লোন বুক করুন। প্রতি মাসের বেতন প্রসেসের দিন সিস্টেম স্যালারি শিট থেকে স্বয়ংক্রিয়ভাবে EMI এর সমপরিমাণ কেটে নেবে।"
      },
      {
        id: 4,
        top: 'top-[82%]',
        left: 'left-[45%]',
        titleEn: "Automated Bulk Monthly Salary Run",
        titleBn: "বাল্ক স্যালারি প্রসেস ও পে-স্লিপ প্রিন্ট",
        descEn: "One-click triggers batch calculators compiling net payouts, generating printable individual slips with instant WhatsApp dispatch.",
        descBn: "১টি ক্লিকে পুরো মাসের স্যালারি শিট হিসেব করুন এবং সরাসরি কোম্পানির লোগো সহ প্রিন্টযোগ্য পে-স্লিপ বা পিডিএফ ডাউনলোড করুন।"
      }
    ],
    'reports': [
      {
        id: 1,
        top: 'top-[20%]',
        left: 'left-[40%]',
        titleEn: "Column Balance Equalities (Trial Balance)",
        titleBn: "ডেবিট ও ক্রেডিট কলাম রিকনসিলিলেশন",
        descEn: "Checks compliance limits. Cumulative Debits must perfectly match cumulative Credits (Dr = Cr) for accounting validity.",
        descBn: "হিসাবের নির্ভুলতা যাচাই। গাণিতিক সামঞ্জস্য প্রমাণ করতে ডেবিট কলামের মোট মূল্য ক্রেডিট কলামের ১০০% সমান হতে হবে।"
      },
      {
        id: 2,
        top: 'top-[50%]',
        left: 'left-[50%]',
        titleEn: "Assets vs Liabilities Symmetry",
        titleBn: "সম্পদ এবং দায় ব্যালেন্স শিট সমতা",
        descEn: "The Balance Sheet splits Assets on one side and Liabilities + Equity on the other side. Supports click-to-drill-down ledger histories.",
        descBn: "ব্যালেন্স শিটের বাম পাশে দায় ও মূলধন এবং ডান পাশে মোট সম্পদ দেখা যায়। ডাবল ক্লিক করে যেকোনো লেজারের গভীরে ঢোকা যায়।"
      },
      {
        id: 3,
        top: 'top-[85%]',
        left: 'left-[80%]',
        titleEn: "Dynamic Export portability",
        titleBn: "রিয়েল-টাইম ডাটা এক্সপোর্ট টুলস",
        descEn: "Click to download detailed statements instantly as standard Excel spreadsheets or certified PDF balance records.",
        descBn: "ক্লিন এক্সপোর্ট সুবিধা। যেকোনো ব্যালেন্স স্টেটমেন্ট এক ক্লিকে এক্সেল শিট বা প্রিন্টযোগ্য পিডিএফ ফাইলে ডাউনলোড করতে পারবেন।"
      }
    ],
    'shortcuts': []
  };

  const activePoints = callouts[categoryId] || [];

  // Determine active schematic rendering
  const handlePointClick = (id: number) => {
    setSelectedPointId(id);
  };

  const activeSelectedPoint = activePoints.find(p => p.id === selectedPointId);

  return (
    <div className="bg-slate-900 text-white rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl scale-100 duration-150 animate-in fade-in-50">
      
      {/* 1. App Emulator Chromebox Header Bar */}
      <div className="bg-slate-850 px-5 py-3.5 border-b border-slate-700/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Simulated Browser Buttons */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded ml-3 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-blue-400" />
            <span>tallyflow-erp://simulated-screenshot/{categoryId}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded animate-pulse">
            {lang === 'en' ? 'LIVE SCHEMATIC SCREEN' : 'লাইভ নির্দেশমূলক স্ক্রিন'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[420px] divide-y xl:divide-y-0 xl:divide-x divide-slate-800">
        
        {/* 2. Interactive visual simulator canvas */}
        <div className="xl:col-span-8 p-6 bg-slate-950 relative flex items-center justify-center overflow-hidden min-h-[360px]">
          
          {/* Ambient Cosmic Background Elements */}
          <div className="absolute inset-0 bg-radial-gradient from-blue-500/5 to-transparent pointer-events-none"></div>

          {/* SCREEN SIMULATORS DEFINITIONS */}
          
          {/* Category-1: Dashboard Simulator */}
          {categoryId === 'getting-started' && (
            <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
              {/* Fake Micro-Header showing accounts */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold">TF</div>
                  <span className="text-xs font-bold font-mono">TallyFlow Hub</span>
                </div>
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Cash Register (নগদ)</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold">$42,500.00</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Prime Bank (ব্যাংক)</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold">$125,180.00</p>
                  </div>
                </div>
              </div>

              {/* Fake Grid showing KPI & Analytics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800 relative">
                  <p className="text-[8px] text-slate-400 font-bold">Total Sales (মোট বিক্রয়)</p>
                  <p className="text-xs font-bold font-mono mt-0.5 text-blue-400">$84,300</p>
                  <div className="w-full bg-slate-800 h-1 rounded mt-2 overflow-hidden">
                    <div className="bg-blue-400 w-3/4 h-full"></div>
                  </div>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-[8px] text-slate-400 font-bold">Active Debtors (ক্রেতার সংখ্যা)</p>
                  <p className="text-xs font-bold font-mono mt-0.5 text-indigo-400">14 Parties</p>
                  <div className="w-full bg-slate-800 h-1 rounded mt-2 overflow-hidden">
                    <div className="bg-indigo-400 w-1/2 h-full"></div>
                  </div>
                </div>

                <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-[8px] text-slate-400 font-bold">Total Expenses (মোট খরচ)</p>
                  <p className="text-xs font-bold font-mono mt-0.5 text-rose-400">$19,450</p>
                  <div className="w-full bg-slate-800 h-1 rounded mt-2 overflow-hidden">
                    <div className="bg-rose-400 w-1/3 h-full"></div>
                  </div>
                </div>
              </div>

              {/* Graphical Segment + Timeline Activity Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-400">Sales Trends</span>
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  </div>
                  {/* Fake bars */}
                  <div className="flex items-end justify-between h-14 pt-2">
                    <div className="w-3 bg-blue-500/40 rounded-t h-1/4"></div>
                    <div className="w-3 bg-blue-500/50 rounded-t h-2/5"></div>
                    <div className="w-3 bg-blue-500/70 rounded-t h-3/5"></div>
                    <div className="w-3 bg-blue-500/90 rounded-t h-4/5"></div>
                    <div className="w-3 bg-blue-600 rounded-t h-full"></div>
                  </div>
                </div>

                <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 block border-b border-slate-800 pb-1">Activity Stream Logs</span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[8px] text-slate-300 font-mono">
                      <span>Vch #SL-104 Saved</span>
                      <span className="text-slate-500">2 mins ago</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-slate-300 font-mono">
                      <span>Ledger 'Petty Cash' Created</span>
                      <span className="text-slate-500">10 mins ago</span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-slate-300 font-mono">
                      <span>Salaries Disbursed bulk</span>
                      <span className="text-slate-500">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Category-2: Ledger Creation Form Simulator */}
          {categoryId === 'accounting-ledgers' && (
            <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-750 p-5 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block font-mono">Configuration Manager</span>
                <span className="text-xs font-bold text-white">Create New Accounts Ledger</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">1. Ledger Base Name</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="Dhaka Traders Ltd" 
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white outline-none font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">2. Group Classification Under</label>
                  <div className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-blue-400 flex items-center justify-between font-bold">
                    <span>Sundry Debtors (গ্রাহক খাত)</span>
                    <span className="text-[8px] bg-blue-950 text-blue-400 px-1 py-0.5 rounded font-mono">SELECTION</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">3. Opening Balance</label>
                    <input 
                      type="text" 
                      readOnly 
                      value="4,500.00" 
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white font-mono text-right"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">Dr/Cr Flag</label>
                    <div className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-center text-emerald-400 font-black">
                      Debit (Dr)
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">4. Mailing Location & Trade Code (TIN/GST)</label>
                  <textarea 
                    rows={2}
                    readOnly 
                    value="Plot 24, Dhanmondi R/A, Dhaka-1209. GSTIN: 24AAACD102A1Z4" 
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-[11px] text-slate-300 resize-none font-medium leading-relaxed"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button type="button" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-xs transition-all pointer-events-none">
                  Create Ledger Account (Alt+L)
                </button>
              </div>
            </div>
          )}

          {/* Category-3: Vouchers Form Simulator */}
          {categoryId === 'vouchers' && (
            <div className="w-full max-w-xl bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
              {/* Virtual Top Buttons */}
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
                <button 
                  onClick={() => setActiveVoucherTab('sales')}
                  className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${activeVoucherTab === 'sales' ? 'bg-indigo-600 text-white border border-indigo-500' : 'bg-slate-850 text-slate-400 hover:bg-slate-800'}`}
                >
                  F8: Sales Voucher (বিক্রয়)
                </button>
                <button 
                  onClick={() => setActiveVoucherTab('payment')}
                  className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${activeVoucherTab === 'payment' ? 'bg-rose-600 text-white border border-rose-500' : 'bg-slate-850 text-slate-400 hover:bg-slate-800'}`}
                >
                  F5: Payment (পেমেন্ট)
                </button>
                <button 
                  onClick={() => setActiveVoucherTab('receipt')}
                  className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${activeVoucherTab === 'receipt' ? 'bg-emerald-600 text-white border border-emerald-500' : 'bg-slate-850 text-slate-400 hover:bg-slate-800'}`}
                >
                  F6: Receipt (রিসিট)
                </button>
              </div>

              {activeVoucherTab === 'sales' && (
                <div className="space-y-3 animate-in fade-in-40 duration-100">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Party Debited Account (খাত)</p>
                      <p className="text-xs font-bold text-white mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Jamuna Distributors Ledger</p>
                    </div>
                    <div className="w-28">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Voucher Date</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850 text-center">13-Jun-2026</p>
                    </div>
                  </div>

                  {/* Fake Items table */}
                  <div className="bg-slate-950 rounded-lg p-2 border border-slate-850 space-y-1.5">
                    <p className="text-[8px] text-slate-400 uppercase font-black px-1">Selected Stock Materials / Items</p>
                    <div className="divide-y divide-slate-850">
                      <div className="flex justify-between items-center text-xs py-1.5 px-1 bg-slate-900/45">
                        <span className="font-semibold text-white">Teak Wood Logs (SKU-T1)</span>
                        <span className="font-mono font-bold text-blue-400">12 Pcs @ $240/Pc = $2,880.00</span>
                      </div>
                      <div className="flex justify-between items-center text-xs py-1.5 px-1">
                        <span className="font-semibold text-white">Iron Screws Box (SKU-S4)</span>
                        <span className="font-mono font-bold text-blue-400">4 Pcs @ $15/Pc = $60.00</span>
                      </div>
                    </div>
                    <div className="pt-1.5 border-t border-slate-850 text-right text-[10px] font-mono font-bold text-emerald-400 px-1">
                      Gross Total: $2,940.00
                    </div>
                  </div>
                </div>
              )}

              {activeVoucherTab === 'payment' && (
                <div className="space-y-3 animate-in fade-in-40 duration-100">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Debit Account Ledger (গ্রহীতা)</p>
                      <p className="text-xs font-bold text-rose-450 mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Office Rent Expense Account</p>
                    </div>
                    <div className="w-28">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Payment Date</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850 text-center">13-Jun-2026</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[8px] text-slate-400 uppercase font-black">Credit Asset Source Account (উৎস)</p>
                    <p className="text-xs font-bold text-emerald-400 mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Petty Cash In Hand Account</p>
                  </div>

                  <div className="flex-1">
                    <p className="text-[8px] text-slate-400 uppercase font-black">Disbursed net Amount ($)</p>
                    <p className="text-sm font-mono font-black text-rose-400 mt-0.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-850 text-right">$12,000.00</p>
                  </div>
                </div>
              )}

              {activeVoucherTab === 'receipt' && (
                <div className="space-y-3 animate-in fade-in-40 duration-100">
                  <div className="flex justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Debit Destination Account (গ্রহীতা)</p>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Prime Commercial Bank Account</p>
                    </div>
                    <div className="w-28">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Receipt Date</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850 text-center">13-Jun-2026</p>
                    </div>
                  </div>

                  <div className="flex-1">
                    <p className="text-[8px] text-slate-400 uppercase font-black">Credit Source Account Ledger (উৎস)</p>
                    <p className="text-xs font-bold text-indigo-400 mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Jamuna Distributors Ledger</p>
                  </div>

                  <div className="flex-1">
                    <p className="text-[8px] text-slate-400 uppercase font-black">Collected Net Amount ($)</p>
                    <p className="text-sm font-mono font-black text-emerald-400 mt-0.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-850 text-right">$8,500.00</p>
                  </div>
                </div>
              )}

              {/* General Narration & Submit */}
              <div className="space-y-1">
                <p className="text-[8px] text-slate-500 uppercase font-black">5. Brief Audit Narration (মন্তব্য)</p>
                <input 
                  type="text" 
                  readOnly 
                  value="Voucher recorded for fiscal month entry audit reference." 
                  className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 text-xs">
                <span className="text-[10px] text-slate-500 font-semibold self-center font-mono">Shortkey: Alt+V</span>
                <button type="button" className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold px-4 py-1.5 rounded pointer-events-none transition-all">
                  Save Transaction Record
                </button>
              </div>
            </div>
          )}

          {/* Category-4: Stock & Godown Simulator */}
          {categoryId === 'inventory' && (
            <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-750 p-5 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">Stock Material Control</span>
                <span className="text-xs font-bold text-white">Add New Inventory Item</span>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">1. SKU Code & Identifier Name</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="Teak Wooden Logs [SKU-T1]" 
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">2. Base Unit of Measure (UoM)</label>
                  <div className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-blue-400 flex items-center justify-between font-bold">
                    <span>Piece / Pcs (ভগ্নাংশহীন গোটা সংখ্যা)</span>
                    <span className="text-[8px] bg-blue-950 text-blue-400 px-1 py-0.5 rounded font-mono">INTEGER</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">3. Optimal Reorder Threshold Level</label>
                  <input 
                    type="text" 
                    readOnly 
                    value="15" 
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white font-mono text-right"
                  />
                  <span className="text-[8px] text-slate-500 block">Triggers low-stock warning dashboards when inventory counts drop to 15.</span>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 block uppercase">4. Store / Godowns Allocation</label>
                  <div className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-300 font-medium">
                    <div className="flex justify-between py-1">
                      <span>Primary Godown (উত্পাদন কেন্দ্র)</span>
                      <span className="font-mono text-emerald-400">42 Pcs</span>
                    </div>
                    <div className="flex justify-between py-1 border-t border-slate-850">
                      <span>Dhanmondi Outlet (বিতরণ শো-রুম)</span>
                      <span className="font-mono text-emerald-400">18 Pcs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button type="button" className="w-full bg-indigo-600 font-bold py-1.5 rounded text-xs pointer-events-none">
                  Save Stock Item
                </button>
              </div>
            </div>
          )}

          {/* Category-5: HR & Payroll Simulator */}
          {categoryId === 'payroll' && (
            <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
              <div className="border-b border-slate-800 pb-2">
                <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">Smart HR Payroll Module</span>
                <span className="text-xs font-bold text-white">Monthly Active Attendance & Paysheet Roster</span>
              </div>

              {/* Attendance checklist Grid */}
              <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-850 space-y-2">
                <span className="text-[8px] text-slate-400 uppercase font-black">1. Operational Daily Attendance Check</span>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs py-1 border-b border-slate-900 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <p className="font-semibold text-white">Tanvir Rahman (Manager)</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-900 text-emerald-400 font-bold rounded text-[8px]">PRESENT (২৪ দিন)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <p className="font-semibold text-white">Nisha Parveen (Senior Developer)</p>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 bg-amber-950 border border-amber-900 text-amber-400 font-bold rounded text-[8px]">SICK LEAVE (২ দিন)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Allowances, EMIs, and Gross calculator block */}
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">2. Allowances & Deductions Structure</span>
                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">HRA Allowance (বাড়ি ভাড়া)</span>
                      <span className="font-mono text-emerald-400">+$6,000.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Provident Fund Deduct (পিএফ)</span>
                      <span className="font-mono text-rose-400">-$2,200.00</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">3. Outstanding Repayments</span>
                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Active Loan Outstanding</span>
                      <span className="font-mono text-slate-400">$18,000.00</span>
                    </div>
                    <div className="flex justify-between text-rose-450 font-bold">
                      <span>Monthly Loan EMI Deduct</span>
                      <span className="font-mono text-rose-405">-$3,000.00</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payout Summary */}
              <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-850">
                <div>
                  <span className="text-[8px] text-slate-500 uppercase font-black block mb-0.5">Automated Bulk Process Salary</span>
                  <span className="text-xs text-white font-bold leading-none">Net Bank Disburse Sum</span>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 font-mono font-black">$46,800.00</p>
                  <p className="text-[8px] text-slate-500 font-bold font-mono">Processed using Gold License</p>
                </div>
              </div>
            </div>
          )}

          {/* Category-6: Reports Simulator */}
          {categoryId === 'reports' && (
            <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Double-Entry Audit Ledger</span>
                  <span className="text-xs font-bold text-white">Trial Balance Sheet Verification</span>
                </div>
                <div className="flex gap-1.5">
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono rounded text-[8px]">EXPORT EXCEL</span>
                  <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono rounded text-[8px]">EXPORT PDF</span>
                </div>
              </div>

              {/* Table rendering sticky columns inside the preview screenshots mockup */}
              <div className="bg-slate-950 rounded-lg overflow-hidden border border-slate-850">
                <table className="w-full text-left text-[11px] font-mono">
                  <thead className="bg-slate-900 border-b border-slate-800 font-bold text-[8px] uppercase text-slate-400">
                    <tr>
                      <th className="px-3 py-2">Ledger Account Title</th>
                      <th className="px-3 py-2 text-right">Debit Balance (Dr)</th>
                      <th className="px-3 py-2 text-right">Credit Balance (Cr)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300">
                    <tr className="bg-slate-900/10">
                      <td className="px-3 py-1.5 font-sans font-semibold">TallyFlow Cash Portal</td>
                      <td className="px-3 py-1.5 text-right font-medium text-blue-400">$42,500.00</td>
                      <td className="px-3 py-1.5 text-right text-slate-600">-</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-sans font-semibold">Sundry Customers Roster</td>
                      <td className="px-3 py-1.5 text-right font-medium text-blue-400">$54,200.00</td>
                      <td className="px-3 py-1.5 text-right text-slate-600">-</td>
                    </tr>
                    <tr className="bg-slate-900/10">
                      <td className="px-3 py-1.5 font-sans font-semibold">Sundry Suppliers Roster</td>
                      <td className="px-3 py-1.5 text-right text-slate-600">-</td>
                      <td className="px-3 py-1.5 text-right font-medium text-rose-400">$18,500.00</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-sans font-semibold">Initial Share Capital</td>
                      <td className="px-3 py-1.5 text-right text-slate-600">-</td>
                      <td className="px-3 py-1.5 text-right font-medium text-rose-400">$78,200.00</td>
                    </tr>
                    {/* Footings total row */}
                    <tr className="bg-slate-900/60 font-black border-t border-slate-800 text-white">
                      <td className="px-3 py-2 font-sans">Final Verified Footings Balance</td>
                      <td className="px-3 py-2 text-right text-emerald-400">$96,700.00</td>
                      <td className="px-3 py-2 text-right text-emerald-400">$96,700.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex gap-2 bg-emerald-950/25 border border-emerald-900 text-emerald-400 p-2.5 rounded text-[10px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-none mt-0.5" />
                <p className="leading-relaxed">
                  {lang === 'en' 
                    ? "Symmetry Check Passed. Debit and Credit balance totals perfectly equated. Reliable audit ledger approved."
                    : "সামঞ্জস্যতা কোড উত্তীর্ণ। ডেবিট এবং ক্রেডিট কলামের মোট মূল্য শতভাগ মিলেছে যা সঠিক অডিট নিশ্চিত করে।"
                  }
                </p>
              </div>
            </div>
          )}

          {/* Interactive Numbered Overlay Badges */}
          {activePoints.map(p => (
            <button
              key={p.id}
              onClick={() => handlePointClick(p.id)}
              className={`absolute ${p.top} ${p.left} w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shadow-md border animate-bounce cursor-pointer duration-100 transition-all ${selectedPointId === p.id ? 'bg-amber-400 text-slate-950 border-white scale-110 ring-4 ring-amber-400/30' : 'bg-blue-600 text-white border-blue-300 hover:bg-blue-500'}`}
              style={{ animationDelay: `${p.id * 0.2}s` }}
              title={lang === 'en' ? `View Section ${p.id} Guidance` : `ধাপ ${p.id} গাইড দেখুন`}
            >
              {p.id}
            </button>
          ))}
        </div>

        {/* 3. Side Explanation Card Panel (Details drawer) */}
        <div className="xl:col-span-4 p-5 bg-slate-900 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-mono">
                {lang === 'en' ? 'INTERACTIVE GLOSSARY' : 'ইন্টারেক্টিভ গাইড ব্যাখ্যা'}
              </span>
              <h4 className="font-extrabold text-sm text-white mt-1.5 flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-blue-400" />
                <span>{lang === 'en' ? 'Tally Solutions Guide' : 'ট্যালি সলিউশন গাইডলাইন'}</span>
              </h4>
            </div>

            {activeSelectedPoint ? (
              <div className="space-y-3 animate-in fade-in-40 duration-150">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs">
                    {activeSelectedPoint.id}
                  </span>
                  <h5 className="font-bold text-slate-200 text-xs sm:text-sm">
                    {lang === 'en' ? activeSelectedPoint.titleEn : activeSelectedPoint.titleBn}
                  </h5>
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {lang === 'en' ? activeSelectedPoint.descEn : activeSelectedPoint.descBn}
                </p>
              </div>
            ) : (
              <div className="text-center py-10 space-y-3">
                <LayoutGrid className="w-10 h-10 text-slate-650 mx-auto opacity-55" />
                <p className="text-xs text-slate-400 font-medium">
                  {lang === 'en' 
                    ? "Click on any blinking numbered circle (①, ②, ③, ④) in the simulated screenshot to explore exact form rules and Tally guidelines."
                    : "ইন্টারেক্টিভ ফর্মে থাকা যেকোনো ব্লিঙ্কিং গোল বাটন (①, ②, ③, ④) ক্লিক করে ইনভয়েস এডিটিং নিয়ম ও টিপস দেখে নিন।"
                  }
                </p>
              </div>
            )}
          </div>

          {/* Core Applet Footing */}
          <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 leading-relaxed font-mono">
            <span>Powered by TallySolutions Prime Methodology</span>
          </div>
        </div>
      </div>
    </div>
  );
}
