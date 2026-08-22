import React, { useState, useEffect } from 'react';
import { 
  Compass, AlertCircle, FileText, LayoutGrid,
  TrendingUp, Activity, ArrowRightLeft, BookOpen, Key,
  Sparkles, Check, HelpCircle, Upload, Image as ImageIcon,
  ZoomIn, X, Trash2, ShieldCheck, CheckCircle2, DollarSign,
  Layers, Package, Users, BarChart2, Settings, ExternalLink
} from 'lucide-react';

interface InteractiveScreenMockupProps {
  categoryId: string;
  sectionId?: string;
  lang: 'en' | 'bn';
  onOpenScreenshotManager?: () => void;
}

interface CalloutPoint {
  id: number;
  top: string;
  left: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
}

export default function InteractiveScreenMockup({ 
  categoryId, 
  sectionId, 
  lang,
  onOpenScreenshotManager 
}: InteractiveScreenMockupProps) {
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);
  const [activeVoucherTab, setActiveVoucherTab] = useState<'payment' | 'receipt' | 'sales' | 'contra'>('sales');
  const [customScreenshotUrl, setCustomScreenshotUrl] = useState<string | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Check localStorage for any custom uploaded screenshot
  useEffect(() => {
    try {
      const storedScreenshots = localStorage.getItem('erp_help_docs_screenshots');
      if (storedScreenshots) {
        const parsed = JSON.parse(storedScreenshots);
        const url = (sectionId && parsed[sectionId]) || parsed[categoryId] || null;
        setCustomScreenshotUrl(url);
      } else {
        setCustomScreenshotUrl(null);
      }
    } catch {
      setCustomScreenshotUrl(null);
    }
  }, [categoryId, sectionId]);

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
        titleEn: "Sales Performance Graph",
        titleBn: "বিক্রয় পারফরম্যান্স ড্যাশবোর্ড গ্রাফ",
        descEn: "Interactive bar analytics illustrating revenue indices split across dynamic custom daily and monthly periods.",
        descBn: "দৈনিক ও মাসিক বিভাজনে রাজস্ব আয়ের গতিপথ বিশ্লেষণের ইন্টারঅ্যাক্টিভ অ্যানালিটিক্যাল চার্ট ড্যাশবোর্ড।"
      },
      {
        id: 3,
        top: 'top-[75%]',
        left: 'left-[78%]',
        titleEn: "System Activities Logger",
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
        descEn: "Enter the full regulatory legal name of the entity or cost account (e.g. 'Dhaka Fashion Mart' or 'Office Rent Expense').",
        descBn: "গ্রাহক, সরবরাহকারী বা খরচের হিসাব খাতার প্রাতিষ্ঠানিক নাম টাইপ করুন (যেমন- 'অফিস ভাড়া' বা 'ঢাকা ফ্যাশন মার্ট')।"
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
        titleBn: "কমপ্লায়েন্স ও ট্যাক্স/টিআইএন বিবরণ",
        descEn: "Store mailing addresses and tax numbers. Standard addresses are automatically compiled on voucher print invoices.",
        descBn: "সংশ্লিষ্ট পার্টির ঠিকানা ও ট্যাক্স কোড সেভ করে রাখুন। বিক্রয় বিল প্রিন্ট করার সময় এগুলো স্বয়ংক্রিয়ভাবে বিলে চলে আসবে।"
      }
    ],
    'vouchers': [
      {
        id: 1,
        top: 'top-[12%]',
        left: 'left-[15%]',
        titleEn: "Voucher Type Selectors",
        titleBn: "ভাউচার টাইপ প্যানেল",
        descEn: "Toggle forms between Sales (F8), Payment (F5), Receipt (F6), Purchase (F9), and Contra (F4). Dynamically configures input fields.",
        descBn: "লেনদেনের ধরন অনুযায়ী Sales (F8), Payment (F5), Receipt (F6), Purchase (F9) বা Contra (F4) মোড সিলেক্ট করুন।"
      },
      {
        id: 2,
        top: 'top-[20%]',
        left: 'left-[75%]',
        titleEn: "Voucher Timeline Calendar",
        titleBn: "ভাউচার লেনদেন তারিখ বা ডেট পিকার",
        descEn: "Ensures transactions align with active accounting calendar. Essential for period-specific profit and loss statements.",
        descBn: "লেনদেনটি কোন তারিখ ভুক্ত হবে তা নির্দেশ করে। এটি মাসিক লাভ-ক্ষতি বিবরণী বা ট্রায়াল ব্যালেন্সের জন্য অত্যন্ত গুরুত্বপূর্ণ।"
      },
      {
        id: 3,
        top: 'top-[38%]',
        left: 'left-[45%]',
        titleEn: "Party / Ledger Account Selection",
        titleBn: "পার্টি বা মূল লেজার নির্বাচন",
        descEn: "Choose customer or source account. Displays live account balance and outstanding credit limit in real-time.",
        descBn: "গ্রাহক বা আয়ের উৎস লেজার নির্বাচন করুন। এটি রিয়েল-টাইমে বর্তমান বকেয়া ও ক্যাশ ব্যালেন্স প্রদর্শন করে।"
      },
      {
        id: 4,
        top: 'top-[60%]',
        left: 'left-[45%]',
        titleEn: "Stock Items & Godown Dispatch",
        titleBn: "পণ্য তালিকা ও গোডাউন নির্ধারণ",
        descEn: "For inventory invoices, specify SKU name, warehouse/godown, integer quantity, rate, discount, and tax percentage.",
        descBn: "পণ্য বিক্রয় ও ক্রয়ের ক্ষেত্রে আইটেম, নির্দিষ্ট গোডাউন, পরিমাণ (Pcs হলে পূর্ণসংখ্যা), রেট, ছাড় ও ভ্যাট যুক্ত করুন।"
      },
      {
        id: 5,
        top: 'top-[82%]',
        left: 'left-[35%]',
        titleEn: "Audit Narration & Print Engine",
        titleBn: "ন্যারেশন ও সরাসরি প্রিন্ট সুবিধা",
        descEn: "Enter a brief audit note explaining the transaction. Click Save to immediately print thermal POS or A4 invoices.",
        descBn: "ভবিষ্যতে অডিটের জন্য একটি ছোট বিবরণ বা নোট লিখুন। সেভ করার সাথে সাথে থার্মাল বা A4 ইনভয়েস প্রিন্ট করা যাবে।"
      }
    ],
    'inventory': [
      {
        id: 1,
        top: 'top-[22%]',
        left: 'left-[35%]',
        titleEn: "SKU & Barcode Identifier",
        titleBn: "ইউনিক এসকিউ (SKU) ও বারকোড",
        descEn: "Map unique barcodes and short codes for rapid inventory lookup and automated billing.",
        descBn: "দ্রুত পণ্য সার্চ ও নির্ভুল চালানের জন্য একটি স্বতন্ত্র কোড এবং ডাকনাম যুক্ত করুন।"
      },
      {
        id: 2,
        top: 'top-[42%]',
        left: 'left-[35%]',
        titleEn: "Unit of Measure (UoM)",
        titleBn: "পরিমাপের একক (UoM)",
        descEn: "Items with units like 'Pcs' or 'Nos' strictly omit decimal points, whereas weight units (Kg, Ltr) support decimals.",
        descBn: "'Pcs' বা 'Nos' ইউনিটে কোনো দশমিক থাকবে না, তবে কেজি বা লিটারের ক্ষেত্রে দশমিক সমর্থিত।"
      },
      {
        id: 3,
        top: 'top-[62%]',
        left: 'left-[32%]',
        titleEn: "Reorder Alert Level",
        titleBn: "সর্বনিম্ন মজুদ ও রিঅর্ডার লেভেল",
        descEn: "System triggers an immediate low-stock dashboard alert when warehouse balance falls beneath this quantity.",
        descBn: "পণ্যের স্টক এই সীমার নিচে নেমে আসার সাথে সাথে সিস্টেম সতর্কবার্তা পাঠাবে যাতে সময়মতো পুনরায় ক্রয় করা যায়।"
      },
      {
        id: 4,
        top: 'top-[78%]',
        left: 'left-[65%]',
        titleEn: "Multi-Godown Storage Allocation",
        titleBn: "মাল্টি-লোকেশন গোডাউন ব্যবস্থাপনা",
        descEn: "Allocate stock across physical godowns and use Stock Transfer vouchers to shift materials safely.",
        descBn: "একাধিক গুদামে স্টক বন্টন করুন এবং স্টক ট্রান্সফার ভাউচারের সাহায্যে এক গুদাম থেকে অন্যটিতে নিরাপদে পণ্য স্থানান্তর করুন।"
      }
    ],
    'manufacturing': [
      {
        id: 1,
        top: 'top-[20%]',
        left: 'left-[35%]',
        titleEn: "Finished Product (BOM Output)",
        titleBn: "ফিনিশড পণ্য (BOM আউটপুট)",
        descEn: "Select the target finished item being produced (e.g., 'Executive Office Chair').",
        descBn: "যে তৈরি পণ্যটি উৎপাদন করা হবে তা নির্বাচন করুন (যেমন: 'এক্সিকিউটিভ অফিস চেয়ার')।"
      },
      {
        id: 2,
        top: 'top-[45%]',
        left: 'left-[45%]',
        titleEn: "Raw Materials Recipe Ingredients",
        titleBn: "কাঁচামালের রেসিপি উপাদানসমূহ",
        descEn: "List of raw components consumed per unit: Steel frame, leather cushion, hydraulic cylinder, and screws.",
        descBn: "প্রতি ইউনিটে প্রয়োজনীয় কাঁচামালের পরিমাণ: স্টিল ফ্রেম, লেদার কুশন, হাইড্রোলিক সিলিন্ডার ও স্ক্রু।"
      },
      {
        id: 3,
        top: 'top-[75%]',
        left: 'left-[55%]',
        titleEn: "Production Work Order Execution",
        titleBn: "প্রোডাকশন ওয়ার্ক অর্ডার এক্সিকিউশন",
        descEn: "Trigger batch manufacturing. Automatically consumes raw inventory and deposits finished units into target godown.",
        descBn: "প্রোডাকশন রান করলে স্বয়ংক্রিয়ভাবে কাঁচামালের স্টক বিয়োগ হবে এবং তৈরি পণ্য গোডাউনে যুক্ত হবে।"
      }
    ],
    'payroll': [
      {
        id: 1,
        top: 'top-[25%]',
        left: 'left-[22%]',
        titleEn: "Daily Attendance Console",
        titleBn: "দৈনিক স্মার্ট হাজিরা কনসোল",
        descEn: "Mark staff Present/Absent/Leave daily. Pro-rata salary formulas automatically deduct pay for unapproved absences.",
        descBn: "কর্মচারীদের দৈনিক উপস্থিতি ট্র্যাকিং শিট। এটি মাস শেষে স্বয়ংক্রিয়ভাবে অনুপস্থিতির আনুপাতিক বেতন সমন্বয় করে।"
      },
      {
        id: 2,
        top: 'top-[36%]',
        left: 'left-[72%]',
        titleEn: "Allowances & Dynamic Pay Heads",
        titleBn: "ভাতা ও পে-হেড কনফিগারেশন",
        descEn: "Configure Basic Pay, House Rent Allowance (HRA), Medical, Transport, and Provident Fund deductions.",
        descBn: "মূল বেতন, বাড়িভাড়া ও চিকিৎসা ভাতা এবং প্রভিডেন্ট ফান্ড কর্তন সহ পূর্ণাঙ্গ প্যাকেজ সেটআপ করুন।"
      },
      {
        id: 3,
        top: 'top-[62%]',
        left: 'left-[45%]',
        titleEn: "Advance Loans & Auto-EMI Deduction",
        titleBn: "অগ্রিম লোন ও মাসিক কিস্তি (EMI) কর্তন",
        descEn: "Corporate advance loans automatically deduct the preset monthly EMI from gross earnings during payroll runs.",
        descBn: "কর্মচারীর অগ্রিম লোনের মাসিক কিস্তি বেতন তৈরির সময় স্বয়ংক্রিয়ভাবে মোট স্যালারি থেকে কেটে নেওয়া হবে।"
      },
      {
        id: 4,
        top: 'top-[82%]',
        left: 'left-[45%]',
        titleEn: "1-Click Bulk Salary Generation",
        titleBn: "১-ক্লিকে বাল্ক স্যালারি শীট ও পে-স্লিপ",
        descEn: "Calculates net payouts for all employees in seconds. Generates printable PDF payslips with WhatsApp share links.",
        descBn: "১টি ক্লিকে পুরো মাসের স্যালারি শিট হিসাব করুন এবং সরাসরি লোগো সহ প্রিন্টযোগ্য পে-স্লিপ বা পিডিএফ ডাউনলোড করুন।"
      }
    ],
    'crm': [
      {
        id: 1,
        top: 'top-[20%]',
        left: 'left-[25%]',
        titleEn: "Leads Funnel & Deal Stages",
        titleBn: "লিড ফানেল ও ডিল স্টেজ",
        descEn: "Organize prospects: New Lead -> Contacted -> Proposal Sent -> In Negotiation -> Deal Won.",
        descBn: "সম্ভাব্য ক্রেতাদের স্টেজ অনুযায়ী ট্র্যাক করুন: নতুন লিড -> যোগাযোগ -> প্রস্তাবনা -> দর কষাকষি -> ডিল সম্পন্ন।"
      },
      {
        id: 2,
        top: 'top-[55%]',
        left: 'left-[60%]',
        titleEn: "1-Click Convert to Sales Invoice",
        titleBn: "১-ক্লিকে সেলস ইনভয়েসে রূপান্তর",
        descEn: "When a deal is won, click 'Convert to Invoice' to auto-populate customer details into Sales Voucher (F8).",
        descBn: "ডিল জেতার সাথে সাথে 'Convert to Invoice' ক্লিক করে সরাসরি সেলস ভাউচার (F8) বিল তৈরি করা যায়।"
      }
    ],
    'reports': [
      {
        id: 1,
        top: 'top-[20%]',
        left: 'left-[40%]',
        titleEn: "Debit & Credit Equality (Trial Balance)",
        titleBn: "ডেবিট ও ক্রেডিট সমতা (ট্রায়াল ব্যালেন্স)",
        descEn: "Checks double-entry balance. Cumulative Debits must perfectly equal Credits (Dr = Cr).",
        descBn: "হিসাবের নির্ভুলতা যাচাই। ডেবিট কলামের মোট মূল্য ক্রেডিট কলামের ১০০% সমান হতে হবে।"
      },
      {
        id: 2,
        top: 'top-[50%]',
        left: 'left-[50%]',
        titleEn: "Assets vs Liabilities Symmetry (Balance Sheet)",
        titleBn: "সম্পদ ও দায় সমতা (ব্যালেন্স শীট)",
        descEn: "Balance Sheet balances total Assets against Liabilities & Equity with drill-down ledger access.",
        descBn: "ব্যালেন্স শীটের মোট সম্পদ এবং মোট দায় ও মূলধনের সমতা নিশ্চিত করে।"
      },
      {
        id: 3,
        top: 'top-[85%]',
        left: 'left-[80%]',
        titleEn: "Excel & PDF Report Export",
        titleBn: "এক্সেল ও পিডিএফ এক্সপোর্ট সুবিধা",
        descEn: "Export any statement instantly as Excel spreadsheets or certified formal PDF audit records.",
        descBn: "যেকোনো আর্থিক বিবরণী এক ক্লিকে এক্সেল শিট বা প্রিন্টযোগ্য পিডিএফ ফাইলে ডাউনলোড করুন।"
      }
    ],
    'settings': [
      {
        id: 1,
        top: 'top-[20%]',
        left: 'left-[30%]',
        titleEn: "Company Profile & Logo Styling",
        titleBn: "কোম্পানি প্রোফাইল ও লোগো স্টাইল",
        descEn: "Set legal address, slogan, and configure custom logo background (Transparent, White, or Custom).",
        descBn: "কোম্পানির নাম, ঠিকানা, স্লোগান এবং সাইডবারে লোগো সুন্দর রাখতে লোগো ব্যাকগ্রাউন্ড সেট করুন।"
      },
      {
        id: 2,
        top: 'top-[50%]',
        left: 'left-[60%]',
        titleEn: "UI Theme Selectors",
        titleBn: "ইউআই থিম নির্বাচন",
        descEn: "Switch between Firebase Console Light/Dark, Classic Tally, macOS, or Colorful modern themes.",
        descBn: "ফায়ারবেস কনসোল লাইট/ডার্ক, ক্ল্যাসিক ট্যালি বা ম্যাক-ওএস থিম সিলেক্ট করুন।"
      },
      {
        id: 3,
        top: 'top-[75%]',
        left: 'left-[50%]',
        titleEn: "Help Docs Screenshot Manager",
        titleBn: "হেল্প ডক স্ক্রিনশট ম্যানেজার",
        descEn: "Founders can upload real high-res screenshots for any doc chapter to display in the public help center.",
        descBn: "প্রতিষ্ঠাতারা যেকোনো বিষয়ের জন্য সরাসরি বাস্তব স্ক্রিনশট আপলোড করতে পারবেন।"
      }
    ],
    'shortcuts': []
  };

  const activePoints = callouts[categoryId] || [];

  const handlePointClick = (id: number) => {
    setSelectedPointId(id);
  };

  const activeSelectedPoint = activePoints.find(p => p.id === selectedPointId);

  return (
    <div className="bg-slate-900 text-white rounded-2xl overflow-hidden border border-slate-700/80 shadow-2xl scale-100 duration-150 animate-in fade-in-50">
      
      {/* 1. App Emulator Chromebox Header Bar */}
      <div className="bg-slate-850 px-4 sm:px-5 py-3 border-b border-slate-700/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {/* Simulated Browser Buttons */}
          <div className="flex gap-1.5 flex-none">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 block"></span>
          </div>
          <span className="text-[10px] font-mono tracking-wider text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded ml-2 flex items-center gap-1.5 truncate">
            <Compass className="w-3 h-3 text-blue-400 flex-none" />
            <span className="truncate">tallyflow-erp://{customScreenshotUrl ? 'custom-screenshot' : 'interactive-emulator'}/{categoryId}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-none">
          {customScreenshotUrl ? (
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="flex items-center gap-1 text-[10px] font-bold text-blue-300 hover:text-white bg-blue-900/60 hover:bg-blue-900 border border-blue-700 px-2.5 py-1 rounded transition-colors"
              title="Zoom In Screenshot"
            >
              <ZoomIn className="w-3 h-3" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Zoom In' : 'বড় করে দেখুন'}</span>
            </button>
          ) : null}

          {onOpenScreenshotManager && (
            <button
              onClick={onOpenScreenshotManager}
              className="flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-white bg-amber-950/60 hover:bg-amber-900 border border-amber-800 px-2.5 py-1 rounded transition-colors"
              title={lang === 'en' ? 'Upload custom real screenshot' : 'আসল স্ক্রিনশট আপলোড করুন'}
            >
              <Upload className="w-3 h-3" />
              <span className="hidden sm:inline">{lang === 'en' ? 'Upload Screenshot' : 'স্ক্রিনশট আপলোড'}</span>
            </button>
          )}

          <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950 border border-emerald-900 px-2 py-0.5 rounded">
            {customScreenshotUrl 
              ? (lang === 'en' ? 'REAL SCREENSHOT' : 'বাস্তব স্ক্রিনশট') 
              : (lang === 'en' ? 'LIVE INTERACTIVE UI' : 'ইন্টারেক্টিভ ভিজ্যুয়াল গাইড')}
          </span>
        </div>
      </div>

      {/* 2. Visual Content Area */}
      {customScreenshotUrl ? (
        // RENDER CUSTOM UPLOADED SCREENSHOT
        <div className="p-4 sm:p-6 bg-slate-950 flex flex-col items-center justify-center">
          <div className="relative group max-w-3xl w-full rounded-xl overflow-hidden border border-slate-800 shadow-xl bg-slate-900">
            <img 
              src={customScreenshotUrl} 
              alt="Feature Screenshot" 
              className="w-full h-auto object-contain max-h-[500px] cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => setIsLightboxOpen(true)}
              referrerPolicy="no-referrer"
            />
            <div 
              onClick={() => setIsLightboxOpen(true)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-xs"
            >
              <div className="flex items-center gap-2 bg-slate-900/90 text-white px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 shadow-lg">
                <ZoomIn className="w-4 h-4 text-blue-400" />
                <span>{lang === 'en' ? 'Click to Enlarge Full Resolution' : 'সম্পূর্ণ রেজোলিউশনে দেখতে ক্লিক করুন'}</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 text-center">
            {lang === 'en' 
              ? "Custom live screenshot captured directly from the ERP application."
              : "ইআরপি সিস্টেমের সরাসরি ক্যাপচারকৃত বাস্তব স্ক্রিনশট।"}
          </p>
        </div>
      ) : (
        // RENDER HIGH-FIDELITY INTERACTIVE SCREENSHOT EMULATOR
        <div className="grid grid-cols-1 xl:grid-cols-12 min-h-[420px] divide-y xl:divide-y-0 xl:divide-x divide-slate-800">
          
          {/* Interactive visual simulator canvas */}
          <div className="xl:col-span-8 p-4 sm:p-6 bg-slate-950 relative flex items-center justify-center overflow-hidden min-h-[360px]">
            
            {/* Ambient Cosmic Background Elements */}
            <div className="absolute inset-0 bg-radial-gradient from-blue-500/5 to-transparent pointer-events-none"></div>

            {/* SCREEN SIMULATORS DEFINITIONS */}
            
            {/* 1. Dashboard Simulator */}
            {categoryId === 'getting-started' && (
              <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-[9px] font-bold">TF</div>
                    <span className="text-xs font-bold font-mono">TallyFlow Hub</span>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Cash (নগদ)</p>
                      <p className="text-[10px] text-emerald-400 font-mono font-bold">$42,500.00</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wide">Bank (ব্যাংক)</p>
                      <p className="text-[10px] text-emerald-400 font-mono font-bold">$125,180.00</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-[8px] text-slate-400 font-bold">Total Sales (বিক্রয়)</p>
                    <p className="text-xs font-bold font-mono mt-0.5 text-blue-400">$84,300</p>
                    <div className="w-full bg-slate-800 h-1 rounded mt-2 overflow-hidden">
                      <div className="bg-blue-400 w-3/4 h-full"></div>
                    </div>
                  </div>

                  <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-[8px] text-slate-400 font-bold">Active Debtors (ক্রেতা)</p>
                    <p className="text-xs font-bold font-mono mt-0.5 text-indigo-400">14 Parties</p>
                    <div className="w-full bg-slate-800 h-1 rounded mt-2 overflow-hidden">
                      <div className="bg-indigo-400 w-1/2 h-full"></div>
                    </div>
                  </div>

                  <div className="bg-slate-850 p-2.5 rounded-lg border border-slate-800">
                    <p className="text-[8px] text-slate-400 font-bold">Expenses (খরচ)</p>
                    <p className="text-xs font-bold font-mono mt-0.5 text-rose-400">$19,450</p>
                    <div className="w-full bg-slate-800 h-1 rounded mt-2 overflow-hidden">
                      <div className="bg-rose-400 w-1/3 h-full"></div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-slate-400">Revenue Velocity</span>
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                    </div>
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

            {/* 2. Ledger Creation Simulator */}
            {categoryId === 'accounting-ledgers' && (
              <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-750 p-5 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block font-mono">Chart of Accounts</span>
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
                      <span className="text-[8px] bg-blue-950 text-blue-400 px-1 py-0.5 rounded font-mono">DEBTOR</span>
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
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">4. Mailing Address & TIN/GST Code</label>
                    <textarea 
                      rows={2}
                      readOnly 
                      value="Plot 24, Dhanmondi R/A, Dhaka-1209. TIN: 4882190412" 
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-[11px] text-slate-300 resize-none font-medium leading-relaxed"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" className="w-full bg-blue-600 text-white font-bold py-1.5 rounded text-xs pointer-events-none">
                    Create Ledger Account (Alt+L)
                  </button>
                </div>
              </div>
            )}

            {/* 3. Vouchers Form Simulator */}
            {categoryId === 'vouchers' && (
              <div className="w-full max-w-xl bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
                <div className="flex items-center gap-1.5 border-b border-slate-800 pb-3 overflow-x-auto no-scrollbar">
                  <button 
                    onClick={() => setActiveVoucherTab('sales')}
                    className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-colors ${activeVoucherTab === 'sales' ? 'bg-indigo-600 text-white border border-indigo-500' : 'bg-slate-850 text-slate-400 hover:bg-slate-800'}`}
                  >
                    F8: Sales (বিক্রয়)
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
                        <p className="text-xs font-bold text-white mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Jamuna Traders Mart</p>
                      </div>
                      <div className="w-28">
                        <p className="text-[8px] text-slate-400 uppercase font-black">Voucher Date</p>
                        <p className="text-xs font-mono font-bold text-white mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850 text-center">13-Jun-2026</p>
                      </div>
                    </div>

                    <div className="bg-slate-950 rounded-lg p-2 border border-slate-850 space-y-1.5">
                      <p className="text-[8px] text-slate-400 uppercase font-black px-1">Selected Stock Materials / Items</p>
                      <div className="divide-y divide-slate-850">
                        <div className="flex justify-between items-center text-xs py-1.5 px-1 bg-slate-900/45">
                          <span className="font-semibold text-white">Cotton Shirts (SKU-CS1)</span>
                          <span className="font-mono font-bold text-blue-400">50 Pcs @ $20/Pc = $1,000.00</span>
                        </div>
                        <div className="flex justify-between items-center text-xs py-1.5 px-1">
                          <span className="font-semibold text-white">Denim Jeans (SKU-DJ2)</span>
                          <span className="font-mono font-bold text-blue-400">20 Pcs @ $35/Pc = $700.00</span>
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-slate-850 flex justify-between items-center text-[10px] font-mono font-bold text-emerald-400 px-1">
                        <span className="text-slate-400">VAT 5% (+$85.00)</span>
                        <span>Gross Total: $1,785.00</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeVoucherTab === 'payment' && (
                  <div className="space-y-3 animate-in fade-in-40 duration-100">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <p className="text-[8px] text-slate-400 uppercase font-black">Debit Account Ledger (গ্রহীতা)</p>
                        <p className="text-xs font-bold text-rose-400 mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Office Rent Expense Account</p>
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
                      <p className="text-xs font-bold text-indigo-400 mt-0.5 bg-slate-950 px-2 py-1 rounded border border-slate-850">Jamuna Traders Mart</p>
                    </div>

                    <div className="flex-1">
                      <p className="text-[8px] text-slate-400 uppercase font-black">Collected Net Amount ($)</p>
                      <p className="text-sm font-mono font-black text-emerald-400 mt-0.5 bg-slate-950 px-2.5 py-1.5 rounded border border-slate-850 text-right">$8,500.00</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-[8px] text-slate-500 uppercase font-black">5. Brief Audit Narration (মন্তব্য)</p>
                  <input 
                    type="text" 
                    readOnly 
                    value="Voucher recorded for customer invoice audit reference." 
                    className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-slate-300 font-medium"
                  />
                </div>

                <div className="flex justify-end gap-2 text-xs">
                  <span className="text-[10px] text-slate-500 font-semibold self-center font-mono">Shortkey: F8 / Alt+V</span>
                  <button type="button" className="bg-indigo-600 text-white font-bold px-4 py-1.5 rounded pointer-events-none">
                    Save & Print Voucher
                  </button>
                </div>
              </div>
            )}

            {/* 4. Stock & Godown Simulator */}
            {categoryId === 'inventory' && (
              <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-750 p-5 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">Inventory Logistics</span>
                  <span className="text-xs font-bold text-white">Add New Stock Item</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">1. SKU Code & Product Title</label>
                    <input 
                      type="text" 
                      readOnly 
                      value="Cotton Polo Shirt [SKU-PS1]" 
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">2. Unit of Measure (UoM)</label>
                    <div className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-blue-400 flex items-center justify-between font-bold">
                      <span>Pcs / Piece (ভগ্নাংশহীন গোটা সংখ্যা)</span>
                      <span className="text-[8px] bg-blue-950 text-blue-400 px-1 py-0.5 rounded font-mono">INTEGER</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">3. Optimal Reorder Threshold Level</label>
                    <input 
                      type="text" 
                      readOnly 
                      value="25" 
                      className="w-full bg-slate-950 border border-slate-850 rounded px-2.5 py-1.5 text-xs text-white font-mono text-right"
                    />
                    <span className="text-[8px] text-slate-500 block">Triggers low-stock warning dashboards when inventory counts drop to 25.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 block uppercase">4. Store / Godowns Allocation</label>
                    <div className="w-full bg-slate-950 border border-slate-850 rounded p-2 text-xs text-slate-300 font-medium">
                      <div className="flex justify-between py-1">
                        <span>Central Godown (কেন্দ্রীয় গুদাম)</span>
                        <span className="font-mono text-emerald-400">120 Pcs</span>
                      </div>
                      <div className="flex justify-between py-1 border-t border-slate-850">
                        <span>Dhanmondi Outlet (শোরুম)</span>
                        <span className="font-mono text-emerald-400">35 Pcs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="button" className="w-full bg-indigo-600 font-bold py-1.5 rounded text-xs pointer-events-none">
                    Save Stock Item (Alt+I)
                  </button>
                </div>
              </div>
            )}

            {/* 5. Manufacturing (BOM) Simulator */}
            {categoryId === 'manufacturing' && (
              <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Bill of Materials (BOM)</span>
                  <span className="text-xs font-bold text-white">Recipe: Executive Wooden Desk</span>
                </div>

                <div className="bg-slate-950 rounded-lg p-3 border border-slate-850 space-y-2">
                  <span className="text-[8px] text-slate-400 uppercase font-black">Raw Ingredients Recipe per 1 Unit Desk</span>
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-white">Wood Planks (কাঠের তক্তা)</span>
                      <span className="text-amber-400">4 Nos @ $15 = $60</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-white">Steel Screws (স্ক্রু)</span>
                      <span className="text-amber-400">16 Pcs @ $0.5 = $8</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-white">Polish Varnish (বার্নিশ)</span>
                      <span className="text-amber-400">2 Ltr @ $6 = $12</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-slate-850 flex justify-between items-center text-xs font-bold text-emerald-400">
                    <span>Standard Unit Production Cost</span>
                    <span>$80.00 / Desk</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button type="button" className="bg-amber-600 text-slate-950 font-black px-4 py-1.5 rounded text-xs pointer-events-none">
                    Issue Production Order (Batch: 50 Units)
                  </button>
                </div>
              </div>
            )}

            {/* 6. HR & Payroll Simulator */}
            {categoryId === 'payroll' && (
              <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest block font-mono">Smart HR Payroll Module</span>
                  <span className="text-xs font-bold text-white">Monthly Active Attendance & Paysheet Roster</span>
                </div>

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

                <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">2. Allowances & Deductions</span>
                    <div className="text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">HRA Allowance (বাড়ি ভাড়া)</span>
                        <span className="font-mono text-emerald-400">+$6,000.00</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Provident Fund (পিএফ)</span>
                        <span className="font-mono text-rose-400">-$2,200.00</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-black block mb-1">3. Outstanding Repayments</span>
                    <div className="text-[10px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Loan Outstanding</span>
                        <span className="font-mono text-slate-400">$18,000.00</span>
                      </div>
                      <div className="flex justify-between text-rose-400 font-bold">
                        <span>Monthly EMI Deduct</span>
                        <span className="font-mono text-rose-400">-$3,000.00</span>
                      </div>
                    </div>
                  </div>
                </div>

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

            {/* 7. Reports Simulator */}
            {categoryId === 'reports' && (
              <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-widest block font-mono">Double-Entry Audit</span>
                    <span className="text-xs font-bold text-white">Trial Balance Sheet Verification</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono rounded text-[8px]">EXCEL</span>
                    <span className="px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 font-mono rounded text-[8px]">PDF</span>
                  </div>
                </div>

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
                      <tr className="bg-slate-900/60 font-black border-t border-slate-800 text-white">
                        <td className="px-3 py-2 font-sans">Final Footings Balance</td>
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
                      ? "Symmetry Check Passed. Debit and Credit balance totals perfectly equated."
                      : "সামঞ্জস্যতা কোড উত্তীর্ণ। ডেবিট এবং ক্রেডিট কলামের মোট মূল্য শতভাগ মিলেছে।"
                    }
                  </p>
                </div>
              </div>
            )}

            {/* 8. CRM Simulator */}
            {categoryId === 'crm' && (
              <div className="w-full max-w-lg bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest block font-mono">CRM Deals Pipeline</span>
                    <span className="text-xs font-bold text-white">Lead Stages & Conversion</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-900 text-emerald-400 font-bold rounded text-[8px]">
                    CONVERT TO INVOICE (F8)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <span className="text-[8px] text-slate-500 uppercase font-black">Proposal Sent</span>
                    <p className="text-xs font-bold text-white mt-1">Apex Footwear</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold">$14,000</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <span className="text-[8px] text-slate-500 uppercase font-black">In Negotiation</span>
                    <p className="text-xs font-bold text-white mt-1">Rupali Garments</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold">$28,500</p>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-emerald-900/60 bg-emerald-950/20">
                    <span className="text-[8px] text-emerald-400 uppercase font-black">Deal Won ✓</span>
                    <p className="text-xs font-bold text-white mt-1">Meghna Corp</p>
                    <p className="text-[10px] text-emerald-400 font-mono font-bold">$45,000</p>
                  </div>
                </div>
              </div>
            )}

            {/* 9. Settings Simulator */}
            {categoryId === 'settings' && (
              <div className="w-full max-w-sm bg-slate-900 rounded-xl border border-slate-750 p-4 space-y-3 shadow-xl">
                <div className="border-b border-slate-800 pb-2">
                  <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest block font-mono">System Configuration</span>
                  <span className="text-xs font-bold text-white">Company Branding & UI Theme</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Logo Background Style</span>
                    <div className="flex gap-2 mt-1.5">
                      <span className="px-2 py-1 bg-slate-800 text-white rounded text-[10px] font-bold">Transparent</span>
                      <span className="px-2 py-1 bg-white text-slate-900 rounded text-[10px] font-bold">Pure White</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded border border-slate-850">
                    <span className="text-[8px] text-slate-400 uppercase font-bold">Active Theme</span>
                    <p className="text-xs font-bold text-blue-400 mt-1">Firebase Console Light / Dark</p>
                  </div>
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

          {/* Side Explanation Card Panel */}
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

            <div className="pt-4 border-t border-slate-800/80 text-[10px] text-slate-500 leading-relaxed font-mono flex items-center justify-between">
              <span>TallyFlow Prime Methodology</span>
              <span className="text-emerald-400 font-bold">● Active</span>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal for Screenshot */}
      {isLightboxOpen && customScreenshotUrl && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button 
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white bg-slate-800/80 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={customScreenshotUrl} 
              alt="Enlarged Screenshot" 
              className="max-w-full max-h-[85vh] object-contain rounded-xl border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
