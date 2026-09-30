export interface ReleaseNoteItem {
  id: string;
  title: string;
  bnTitle: string;
  description: string;
  bnDescription: string;
  module?: string;
  badge?: string;
}

export interface ReleaseVersion {
  version: string;
  releaseDate: string;
  bnReleaseDate: string;
  title: string;
  bnTitle: string;
  summary: string;
  bnSummary: string;
  isLatest?: boolean;
  newFeatures: ReleaseNoteItem[];
  improvements: ReleaseNoteItem[];
  bugFixes: ReleaseNoteItem[];
}

export const LATEST_VERSION = "v1.9.0";
export const LAST_SEEN_VERSION_KEY = "tallyflow_last_seen_release_version";

export const RELEASE_NOTES: ReleaseVersion[] = [
  {
    version: "v1.9.0",
    releaseDate: "September 29, 2026",
    bnReleaseDate: "২৯ সেপ্টেম্বর, ২০২৬",
    title: "Business Intelligence Hub, Feature Controls & On-Demand Analytics",
    bnTitle: "বিজনেস ইন্টেলিজেন্স হাব, ফিচার নিয়ন্ত্রণ ও অন-ডিমান্ড ভিজ্যুয়াল অ্যানালিটিক্স",
    summary: "Introducing a dedicated enterprise Business Intelligence & Telemetry Hub featuring complete Trading details, financial ratios, asset/liability analysis, 6-month trends, inventory dynamics, banking telemetry, and System Guide Assistant feature controls with on-demand toggles.",
    bnSummary: "যুক্ত হলো সম্পূর্ণ নতুন ডেডিকেটেড বিজনেস ইন্টেলিজেন্স ও টেলিমেট্রি হাব — যাতে রয়েছে ট্রেডিং একাউন্ট ডিটেইলস, ৮টি ফাইন্যান্সিয়াল রেশিও, এসেট-লায়াবিলিটি সামারি, ৬ মাসের ট্রেন্ড গ্রাফ, ইনভেন্টরি ও ব্যাংকিং কার্যক্রম। সাথে সিস্টেম গাইড সহকারীতে ফিচার অন/অফ নিয়ন্ত্রণ এবং অন-ডিমান্ড ড্যাশবোর্ড উইজেট।",
    isLatest: true,
    newFeatures: [
      {
        id: "feat-bi-hub",
        title: "Enterprise Business Intelligence & Telemetry Hub (/business-intelligence)",
        bnTitle: "বিজনেস ইন্টেলিজেন্স ও টেলিমেট্রি হাব (/business-intelligence)",
        description: "Full-scale corporate analytics dashboard providing Trading Account analysis (Direct Sales, Purchases, Expenses, Incomes, Gross Profit), 8 key financial ratios (Current, Quick, Debt-Equity, GP%, NP%, Working Capital, ROA), 6 monthly trends, Top Cost Centres, Top Groups, Inventory telemetry, and Banking inflows/outflows with zero extra Firestore quota.",
        bnDescription: "ট্রেডিং ডিটেইলস, ৮টি জরুরি অর্থনৈতিক অনুপাত, সম্পদ ও দায়, ৬ মাসের গ্রস ও নেট প্রফিট ট্রেন্ড, পারচেজ ও সেলস ভলিউম, শীর্ষ কস্ট সেন্টার ও গ্রুপ, ইনভেন্টরি ও ব্যাংক ফ্লো অ্যানালাইসিস সম্বলিত ডেডিকেটেড অ্যানালিটিক্স কনসোল।",
        module: "Analytics & BI",
        badge: "NEW"
      },
      {
        id: "feat-guide-feature-controls",
        title: "System Guide Assistant Desktop Feature Controls",
        bnTitle: "সিস্টেম গাইড সহকারীতে 'Features' কন্ট্রোল প্যানেল",
        description: "System Guide Assistant now features a front-and-center 'Features' tab allowing users to selectively turn on or off dashboard visual widgets like Cash vs. Bank Balance, Top 5 Expenses, Low Stock Warning, and Due Receivables alerts.",
        bnDescription: "সিস্টেম গাইড সহকারীর সর্বপ্রথমে 'Features' (ফিচারসমূহ) ট্যাব যুক্ত করা হয়েছে, যেখান থেকে ব্যবহারকারী প্রয়োজনমতো ক্যাশ বনাম ব্যাংক ব্যালেন্স, শীর্ষ ৫টি ব্যয় খাত, লো-স্টক ও বকেয়া দেনাদার অ্যালার্ট অন বা অফ করতে পারবেন।",
        module: "Preferences",
        badge: "NEW"
      },
      {
        id: "feat-on-demand-dashboard-widgets",
        title: "On-Demand Cash vs. Bank & Top 5 Expenses Visual Analytics",
        bnTitle: "অন-ডিমান্ড ক্যাশ বনাম ব্যাংক এবং শীর্ষ ৫টি ব্যয়ের রিয়েল চার্ট",
        description: "Visual Cash vs. Bank Donut and Top 5 Expenses Bar charts are kept clean and default OFF, appearing instantly when enabled by the user with 100% accurate voucher and ledger calculations.",
        bnDescription: "ড্যাশবোর্ডকে পরিচ্ছন্ন ও দ্রুতগতি রাখতে ক্যাশ বনাম ব্যাংক এবং শীর্ষ ৫টি ব্যয় খাত ডিফল্টভাবে অফ থাকে। ব্যবহারকারী অন করলেই রিয়েল ভাউচার ও লেজারের নিখুঁত লাইভ চার্ট তাৎক্ষণিকভাবে প্রদর্শিত হয়।",
        module: "Dashboard",
        badge: "NEW"
      }
    ],
    improvements: [
      {
        id: "imp-real-expense-tracking",
        title: "Deep Transaction-Level Expense & Cash Inflow Aggregation",
        bnTitle: "ট্রানজেকশন ভিত্তিক খরচের খাত ও তরল তহবিলের নিখুঁত হিসাব",
        description: "Payment vouchers and expense heads are now dynamically extracted and aggregated in descending order with real currency values directly from cached memory without any extra Firestore reads.",
        bnDescription: "পেমেন্ট ভাউচারের প্রকৃত খরচের খাত এবং ক্যাশ/ব্যাংক মুভমেন্ট রিয়েল ডেটার মাধ্যমে স্বয়ংক্রিয়ভাবে হিসাব করে টপ ৫ ব্যয় ও ডোনাট চার্ট তৈরি করা হয়।",
        module: "Accounting Engine"
      },
      {
        id: "imp-dashboard-cleanup",
        title: "Streamlined Dashboard Layout & Removed Redundancies",
        bnTitle: "ড্যাশবোর্ড লেআউট পরিমার্জন ও অপ্রয়োজনীয় বাটন অপসারণ",
        description: "Cleaned up the executive dashboard layout and removed redundant General Configs button, focusing on core workflows and high-level KPIs.",
        bnDescription: "ড্যাশবোর্ড থেকে অপ্রয়োজনীয় 'General Configs' বাটন অপসারণ করে ইন্টারফেসকে আরও আধুনিক ও পরিচ্ছন্ন করা হয়েছে।",
        module: "UI/UX"
      }
    ],
    bugFixes: [
      {
        id: "fix-zero-fallback-charts",
        title: "Chart Zero Value & Nominal Fallback Handling",
        bnTitle: "চার্ট খালি বা শূন্য ব্যালেন্সের ত্রুটি সমাধান",
        description: "Resolved issues where charts would disappear or render empty when balances were nascent or unrecorded.",
        bnDescription: "নতুন কোম্পানি বা শূন্য ব্যালেন্স থাকা সত্ত্বেও যাতে চার্ট কোনো ত্রুটি ছাড়া সুন্দরভাবে রেন্ডার হয় তা নিশ্চিত করা হয়েছে।",
        module: "Data Visualization"
      }
    ]
  },
  {
    version: "v1.8.5",
    releaseDate: "September 22, 2026",
    bnReleaseDate: "২২ সেপ্টেম্বর, ২০২৬",
    title: "Overdue Receivables Recovery, Statutory Audit Trail & Release Center",
    bnTitle: "বকেয়া দেনাদার আদায় হাব, বিধিবদ্ধ অডিট ট্রেইল ও রিলিজ সেন্টার",
    summary: "Major enterprise accounting and compliance release featuring automated debtor follow-ups with 1-click multi-channel dispatch, legal demand notices, full statutory transaction audit trail with before/after diffs, supplier reorder sheets, and multi-user update alerts.",
    bnSummary: "একটি বৃহৎ প্রাতিষ্ঠানিক রিলিজ — যার মাধ্যমে যুক্ত হয়েছে ১ ক্লিকে হোয়াটসঅ্যাপ/এসএমএস/ইমেল বকেয়া রিমাইন্ডার, আদালতের মতো লিগ্যাল ডিমান্ড নোটিশ, সরকারি অডিট ট্রেইল ও পরিবর্তন ডিটেইলস, লো-স্টক রিকুইজিশন এবং স্বয়ংক্রিয় রিলিজ নোটিফিকেশন সিস্টেম।",
    isLatest: false,
    newFeatures: [
      {
        id: "feat-due-payments",
        title: "Due Payment Alerts & Overdue Aging Recovery Hub (/reports/due-payments)",
        bnTitle: "বকেয়া রিমাইন্ডার ও দেনাদার এজিং রিকভারি হাব (/reports/due-payments)",
        description: "Intelligent debtor aging analysis (0-15d, 16-30d, 31-60d, 60+d Critical) with 1-click WhatsApp, SMS, and Email payment reminders with bank details, plus formal printable legal demand notices on company letterhead.",
        bnDescription: "বকেয়ার বয়স ভিত্তিক স্বয়ংক্রিয় এজিং (০-১৫ দিন, ১৬-৩০ দিন, ৩১-৬০ দিন, ৬০+ দিন) এবং ১ ক্লিকে হোয়াটসঅ্যাপ, এসএমএস ও ইমেলে ব্যাংক একাউন্ট সহ রিমাইন্ডার মেসেজ ও প্রাতিষ্ঠানিক আইনি তাগাদাপত্র প্রিন্ট করার পূর্ণাঙ্গ হাব।",
        module: "Reports & Receivables",
        badge: "NEW"
      },
      {
        id: "feat-audit-trail",
        title: "Statutory Transaction Audit Trail & Activity Logs (/reports/audit-trail)",
        bnTitle: "বিধিবদ্ধ লেনদেন অডিট ট্রেইল ও কার্যক্রম হিস্ট্রি লগ (/reports/audit-trail)",
        description: "Tamper-evident chronological event stream recording every voucher create, alter, delete, and export with user ID, IP, and timestamps. Features deep before-and-after change diffs and non-destructive auditor review notations.",
        bnDescription: "প্রতিটি ভাউচার তৈরি, সংশোধন বা মুছে ফেলার নিখুঁত ডিজিটাল রেকর্ড (সময়, ইউজার ও আইপিসহ)। রয়েছে পরিবর্তনের আগের ও পরের ডাটা তুলনামূলক যাচাই এবং অডিটরদের প্রত্যয়ন নোট যোগ করার সুবিধা।",
        module: "Compliance & Security",
        badge: "NEW"
      },
      {
        id: "feat-whats-new",
        title: "Update Notification Center & What's New Release Popup",
        bnTitle: "রিলিজ নোটিফিকেশন সেন্টার ও স্বয়ংক্রিয় আপডেট পপআপ",
        description: "Instant in-app notifications and informative popup modals when new GitHub updates are pushed. Detailed version history timeline showing every feature, improvement, and bug fix across releases.",
        bnDescription: "গিটহাবে নতুন আপডেট পুশ করার সাথে সাথে সকল ব্যবহারকারীর স্ক্রিনে স্পষ্ট ভাষায় কি কি যুক্ত বা সংশোধন হয়েছে তার স্বয়ংক্রিয় নোটিফিকেশন পপআপ এবং বিস্তারিত ভার্সন হিস্ট্রি।",
        module: "System Core",
        badge: "NEW"
      },
      {
        id: "feat-low-stock-req",
        title: "Low Stock Warning & 1-Click Procurement Requisition Sheet",
        bnTitle: "লো-স্টক সতর্কতা ও ১ ক্লিকে সাপ্লায়ার পারচেজ রিকুইজিশন",
        description: "Direct printable supplier procurement purchase sheets for items dropping below reorder thresholds, with supplier information and auto-calculated reorder deficits.",
        bnDescription: "নির্ধারিত রিঅর্ডার সীমার নিচে নেমে যাওয়া পণ্যের জন্য ১ ক্লিকেই সাপ্লায়ারের কাছে পাঠানোর উপযোগী অফিসিয়াল পারচেজ রিকুইজিশন শিট প্রিন্ট বা পিডিএফ করার সুবিধা।",
        module: "Inventory",
        badge: "NEW"
      }
    ],
    improvements: [
      {
        id: "imp-minimalist-splash",
        title: "Minimalist Splash Dashboard Integration",
        bnTitle: "মিনিমালিস্ট স্প্ল্যাশ ড্যাশবোর্ডে অ্যালার্ট ও শর্টকাট অন্তর্ভুক্তি",
        description: "Added dedicated warning banners (Low Stock, Due Receivables) and quick access buttons to Minimalist Splash (Design 6) across Grid, Neon Cyber, and Editorial sub-styles.",
        bnDescription: "মিনিমালিস্ট স্প্ল্যাশ (Design 6)-এর গ্রিড, নিয়ন সাইবার এবং এডিটোরিয়াল সবকটি স্টাইলেই বকেয়া অ্যালার্ট, লো-স্টক অ্যালার্ট এবং সরাসরি শর্টকাট যুক্ত করা হয়েছে।",
        module: "Dashboard"
      },
      {
        id: "imp-guide-controls",
        title: "System Guide Assistant Desktop Alert Controls",
        bnTitle: "সিস্টেম গাইড সহকারী থেকে ড্যাশবোর্ড অ্যালার্ট প্রদর্শন/লুকানোর নিয়ন্ত্রণ",
        description: "Direct toggle switches in the desktop System Guide Assistant to show or hide 'Low Stock Warning' and 'Due Receivables Alert' banners according to user preference.",
        bnDescription: "ডেস্কটপ স্ক্রিনে সিস্টেম গাইড সহকারী প্যানেল থেকে ব্যবহারকারী নিজের পছন্দমতো লো-স্টক সতর্কতা ও বকেয়া অ্যালার্ট অন বা অফ (Show/Hide) করতে পারবেন।",
        module: "User Preferences"
      },
      {
        id: "imp-docs-bilingual",
        title: "TallyFlow Docs Comprehensive Knowledge Base Update",
        bnTitle: "ট্যালিফ্লো ডকস-এ পূর্ণাঙ্গ দ্বিভাষিক নির্দেশিকা সংযোজন",
        description: "Integrated complete documentation for Low Stock, Due Payments, and Audit Trail under inventory and report guides in both Bengali and English.",
        bnDescription: "ট্যালিফ্লো ডকসে ৩টি ফিচারের ব্যবহার পদ্ধতি, প্রয়োজনীয়তা ও স্ক্রিন নির্দেশিকা বাংলা ও ইংরেজিতে পূর্ণাঙ্গভাবে যুক্ত করা হয়েছে।",
        module: "Documentation"
      }
    ],
    bugFixes: [
      {
        id: "fix-inventory-404",
        title: "Resolved 404 Not Found error when clicking Low Stock Warning text",
        bnTitle: "লো-স্টক ওয়ার্নিং ব্যানারে ক্লিক করলে ৪০৪ এরর আসা সমাধান",
        description: "Registered dedicated `/inventory` and `/inventory/overview` routes mapping directly to InventoryOverview with auto-applied low-stock safety filter.",
        bnDescription: "ড্যাশবোর্ড থেকে লো-স্টক সতর্কতায় ক্লিক করলে যাতে ৪০৪ না আসে সেজন্য `/inventory` রাউট সফলভাবে সংযুক্ত করা হয়েছে যা সরাসরি ঝুঁকিপূর্ণ স্টক ফিল্টার করে দেখায়।",
        module: "Navigation & Routing"
      },
      {
        id: "fix-dashboard-currency",
        title: "Cleaned up currency symbols and layout padding across all dashboard styles",
        bnTitle: "ড্যাশবোর্ড কারেন্সি সিম্বল ও লেআউট প্যাডিং সংশোধন",
        description: "Fixed type discrepancies for company currency rendering and standardized visual alert badges.",
        bnDescription: "কোম্পানি মুদ্রা চিহ্ন এবং সতর্কবার্তা বক্সের ভিজ্যুয়াল ফরম্যাটিং ত্রুটিমুক্ত ও দৃষ্টিনন্দন করা হয়েছে।",
        module: "UI/UX"
      }
    ]
  },
  {
    version: "v1.8.2",
    releaseDate: "September 15, 2026",
    bnReleaseDate: "১৫ সেপ্টেম্বর, ২০২৬",
    title: "Database Performance Optimization & Quota Protection",
    bnTitle: "ডাটাবেজ পারফরম্যান্স অপ্টিমাইজেশন ও কোটা সুরক্ষা",
    summary: "Major Firestore cloud quota optimization with indexed range queries, pre-aggregated ledger balances, and client-side memory quota buffering.",
    bnSummary: "ক্লাউড কোটা সাশ্রয়ের জন্য ইনডেক্সড কুয়েরি, প্রি-অ্যাগ্রিগেটেড লেজার ব্যালেন্স এবং মেমোরি কোটা বাফারিং প্রযুক্তি যুক্ত করা হয়েছে।",
    newFeatures: [
      {
        id: "feat-quota-buffer",
        title: "In-Memory Quota Buffering Engine",
        bnTitle: "ইন-মেমোরি কোটা বাফারিং ইঞ্জিন",
        description: "Batches quota metric writes every 10 seconds or on page unload to prevent real-time database hits.",
        bnDescription: "প্রতি সেকেন্ডে ডাটাবেজ হিট না করে ১০ সেকেন্ড পর পর এবং পেজ বন্ধের সময় একসাথে কোটা ট্র্যাকিং সিঙ্ক করে।",
        module: "Database Engine"
      }
    ],
    improvements: [
      {
        id: "imp-ledger-cache",
        title: "Pre-aggregated ledger current balances reducing reads from thousands to 1",
        bnTitle: "প্রি-অ্যাগ্রিগেটেড লেজার ব্যালেন্সের মাধ্যমে হাজার হাজার রিড ১ টিতে নামিয়ে আনা",
        description: "Reads current_balance directly from ledger record with local 30-minute in-memory caching.",
        bnDescription: "হাজার হাজার ভাউচার স্ক্যান না করে সরাসরি লেজারের ব্যালেন্স পড়ে এবং ৩০ মিনিট লোকাল ক্যাশ বজায় রাখে।",
        module: "Accounting Core"
      }
    ],
    bugFixes: [
      {
        id: "fix-quota-crash",
        title: "Graceful fallbacks when database quota is reached or network goes offline",
        bnTitle: "ডাটাবেজ কোটা শেষ বা ইন্টারনেট অফলাইন হলে নিরাপদ হ্যান্ডলিং",
        description: "System now displays informative alerts instead of white-screening during quota limits.",
        bnDescription: "কোটা শেষ হলে সিস্টেম ক্র্যাশ না করে মার্জিত নোটিফিকেশন প্রদান করে।",
        module: "Core Reliability"
      }
    ]
  },
  {
    version: "v1.8.0",
    releaseDate: "August 28, 2026",
    bnReleaseDate: "২৮ আগস্ট, ২০২৬",
    title: "Manufacturing & Multi-Godown Production Architecture",
    bnTitle: "ম্যানুফ্যাকচারিং ও মাল্টি-গোডাউন প্রোডাকশন কাঠামো",
    summary: "Bill of Materials (BOM) recipes, production work orders, machine allocation, and inter-godown stock transfers.",
    bnSummary: "কাঁচামালের রেসিপি (BOM), প্রোডাকশন ওয়ার্ক অর্ডার, মেশিন বরাদ্দ এবং আন্তঃগোডাউন পণ্য স্থানান্তর সুবিধা।",
    newFeatures: [
      {
        id: "feat-bom",
        title: "Bill of Materials (BOM) Recipes & Machine Work Orders",
        bnTitle: "বিল অফ ম্যাটেরিয়ালস (BOM) ও মেশিন ওয়ার্ক অর্ডার",
        description: "Define raw material consumption recipes and automatically generate finished goods upon work order completion.",
        bnDescription: "উৎপাদনের জন্য কাঁচামালের অনুপাত নির্ধারণ এবং অর্ডার সম্পন্ন হলে স্বয়ংক্রিয়ভাবে তৈরি পণ্য স্টকে যুক্ত হওয়া।",
        module: "Manufacturing",
        badge: "GOLD PLAN"
      }
    ],
    improvements: [
      {
        id: "imp-print-engine",
        title: "High-precision PDF & Thermal invoice printing engine",
        bnTitle: "উন্নতমানের পিডিএফ ও থার্মাল চালান প্রিন্ট ইঞ্জিন",
        description: "Print formatting with customizable headers, background colors, and single top-right page numbering.",
        bnDescription: "কাস্টমাইজড হেডার ও দৃষ্টিনন্দন ডিজাইনে চালান প্রিন্টিং সুবিধা।",
        module: "Printing & Invoicing"
      }
    ],
    bugFixes: [
      {
        id: "fix-pcs-decimals",
        title: "Enforced strict zero decimal places for Pcs / Pc / Nos units",
        bnTitle: "পিস (Pcs/Pc/Nos) এককের জন্য দশমিক শূন্য রাখা বাধ্যতামূলক করা",
        description: "Ensured quantities formatted with discrete units never show fraction decimal digits.",
        bnDescription: "পিস বা সংখ্যার ক্ষেত্রে কোনো অপ্রয়োজনীয় দশমিক সংখ্যা না দেখানোর নিশ্চয়তা।",
        module: "Formatting"
      }
    ]
  }
];

export function getLatestRelease(): ReleaseVersion {
  return RELEASE_NOTES[0];
}

export function hasUnseenRelease(): boolean {
  try {
    const lastSeen = localStorage.getItem(LAST_SEEN_VERSION_KEY);
    return lastSeen !== LATEST_VERSION;
  } catch (e) {
    return false;
  }
}

export function markReleaseAsSeen(version: string = LATEST_VERSION): void {
  try {
    localStorage.setItem(LAST_SEEN_VERSION_KEY, version);
  } catch (e) {
    console.error("Failed to mark release as seen in localStorage", e);
  }
}
