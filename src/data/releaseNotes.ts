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

export const LATEST_VERSION = "v1.9.7";
export const LAST_SEEN_VERSION_KEY = "tallyflow_last_seen_release_version";

export const RELEASE_NOTES: ReleaseVersion[] = [
  {
    version: "v1.9.7",
    releaseDate: "October 13, 2026",
    bnReleaseDate: "১৩ অক্টোবর, ২০২৬",
    title: "Persistent Search State & History Preservation, Match Type Filtering & Quota-Optimized Search Engine",
    bnTitle: "সার্চ স্টেট ও হিস্ট্রি সংরক্ষণ, ম্যাচ টাইপ ফিল্টারিং এবং কোটা-বান্ধব আধুনিক সার্চ ইঞ্জিন",
    summary: "Introduced persistent search session restoration across navigations (retaining query, tab, and match type filters when returning from View Voucher or View Ledger), interactive multi-category match type filtering (Serial No, Voucher Ref, Amount, Narration, Party, Item, Date), strict Enter/Search-button execution discipline, pure English search interface localization, and resolved voucher search demo function errors in erpService.",
    bnSummary: "সার্চ রেজাল্ট থেকে ভাউচার বা লেজার দেখে ব্যাকে আসলে পূর্বের সার্চ কিউয়ার্ড, ফিল্টার ও রেজাল্ট যাতে মুছে না যায় তার জন্য স্থায়ী স্টেট ক্যাশিং সিস্টেম যোগ করা হয়েছে। সাথে ম্যাচ টাইপ ফিল্টারিং (সিরিয়াল নম্বর, ভাউচার রেফ, অ্যামাউন্ট, ন্যারেশন, পার্টি, আইটেম ইত্যাদি অনুসারে ফিল্টার), শুধু এন্টার চাপলে বা সার্চ বাটনে ক্লিক করলে সার্চ এক্সিকিউশন, শতভাগ ইংরেজি ইন্টারফেস এবং erpService সার্চ ত্রুটি দূর করা হয়েছে।",
    isLatest: true,
    newFeatures: [
      {
        id: "feat-search-state-persistence",
        title: "Persistent Search State & Seamless Back Navigation Restoration",
        bnTitle: "সার্চ স্টেট স্থায়ী সংরক্ষণ ও ব্যাক নেভিগেশনে নিরবচ্ছিন্ন রিস্টোরেশন",
        description: "When users navigate to inspect a voucher, ledger, or inventory item from the search results and return via the Back button, the full search context (input query, active tab, match filter, and results list) is preserved with zero data loss or unnecessary database re-fetches.",
        bnDescription: "সার্চ রেজাল্ট থেকে যেকোনো ভাউচার বা লেজার দেখে ব্যাকে আসলে আগের সার্চ কিউয়ার্ড, ক্যাটাগরি ট্যাব ও ফিল্টার রেজাল্ট হুবহু আগের মতোই থাকবে, পুনরায় সার্চ করতে হবে না বা কোনো ডেটা হারাবে না।",
        module: "Search & Navigation",
        badge: "NEW"
      },
      {
        id: "feat-search-match-type-filter",
        title: "Multi-Criteria Match Type Filtering & Dynamic Badges",
        bnTitle: "মাল্টি-ক্রাইটেরিয়া ম্যাচ টাইপ ফিল্টারিং ও ডায়নামিক ব্যাজ",
        description: "Search results now visually identify exact matching criteria (Serial No, Voucher Ref, Amount, Narration, Party Name, Stock Item, Date, Contact, SKU) with an interactive filter bar positioned above Search Scope Info to quickly filter results by specific match type.",
        bnDescription: "সার্চ কিউয়ার্ডের সাথে রেজাল্টগুলোর কোথায় মিল রয়েছে (সিরিয়াল নম্বর, ভাউচার রেফ, অ্যামাউন্ট, ন্যারেশন, পার্টি, আইটেম ইত্যাদি) তা স্পষ্ট ব্যাজের মাধ্যমে প্রদর্শিত হয় এবং Search Scope Info-এর উপরে থাকা ফিল্টার বার থেকে নির্দিষ্ট ম্যাচ টাইপ বেছে নিয়ে দ্রুত ফলাফল ফিল্টার করা যায়।",
        module: "Search Experience",
        badge: "NEW"
      },
      {
        id: "feat-search-trigger-discipline",
        title: "Controlled Search Execution on Enter Key & Search Button",
        bnTitle: "এন্টার কী ও সার্চ বাটনে নিয়ন্ত্রিত সার্চ এক্সিকিউশন",
        description: "Optimized the search workflow so searches strictly fire only when the user presses Enter or explicitly clicks the Search button, preventing unwanted partial queries during typing and protecting Firestore read quota.",
        bnDescription: "সার্চ বক্সে টাইপ করার সময় অপ্রয়োজনীয় স্বয়ংক্রিয় সার্চ বন্ধ করে শুধুমাত্র কিবোর্ডের Enter চাপলে অথবা Search বাটনে ক্লিক করলেই রেজাল্ট লোড হওয়ার কঠোর শৃঙ্খলা নিশ্চিত করা হয়েছে।",
        module: "Quota & Performance",
        badge: "NEW"
      },
      {
        id: "feat-search-english-localization",
        title: "Pure Professional English Search Interface",
        bnTitle: "সার্চ ইন্টারফেসে শতভাগ পেশাদার ইংরেজি পরিভাষা",
        description: "Streamlined all Match Type Filters, badge titles, scope details, and control labels to clear, professional English terminology across classic and modern search layouts.",
        bnDescription: "ম্যাচ টাইপ ফিল্টার এবং সার্চ স্কোপ বিবরণীর সকল টেক্সট সম্পূর্ণ প্রমিত ও পেশাদার ইংরেজি ভাষায় রূপান্তর করা হয়েছে।",
        module: "Localization",
        badge: "ENHANCED"
      }
    ],
    improvements: [
      {
        id: "imp-search-session-cache",
        title: "In-Memory & Session Storage Hybrid Search Cache",
        bnTitle: "ইন-মেমোরি ও সেশন স্টোরেজ হাইব্রিড সার্চ ক্যাশ",
        description: "Employed a synchronized dual-layer cache architecture that keeps search sessions instantly available without consuming network bandwidth or Firestore read quotas.",
        bnDescription: "ডুয়াল-লেয়ার ক্যাশ আর্কিটেকচারের মাধ্যমে দ্রুততম সময়ে ব্রাউজার হিস্ট্রি ও ব্যাক নেভিগেশনে সার্চ ডেটা ইনস্ট্যান্ট ফিরিয়ে আনার ব্যবস্থা করা হয়েছে।",
        module: "Architecture"
      }
    ],
    bugFixes: [
      {
        id: "fix-search-vouchers-isdemo-error",
        title: "Fixed TypeError in Voucher Search (this._isDemo)",
        bnTitle: "ভাউচার সার্চে TypeError (this._isDemo) সমাধান",
        description: "Resolved the TypeError runtime exception when executing voucher queries in erpService.ts, ensuring seamless search operations across all accounts.",
        bnDescription: "erpService.ts ফাইলের ভাউচার সার্চ মেথডে ডেমো ফাংশন সংক্রান্ত ত্রুটি দূর করে নির্ভরযোগ্য সার্চ কার্যক্রম নিশ্চিত করা হয়েছে।",
        module: "Bug Fix"
      },
      {
        id: "fix-runaway-quota-collection-scans",
        title: "Eliminated Runaway 900+ Read Collection Scans in Voucher & Ledger Views",
        bnTitle: "ভাউচার ও লেজার স্টেটমেন্টে অপ্রয়োজনীয় ৯০০+ রিড স্ক্যান সম্পূর্ণ দূরীকরণ",
        description: "Completely eliminated full collection sweeps inside getVoucherById and getVoucherWithEntries. Single voucher views now execute only targeted document reads (~3-4 reads instead of 900+), and ledger statements query only specific ledger entries (~10 reads instead of 1,200+), reducing read volume by 99% and raising daily baseline quota to 50,000 Ops with auto-recovery.",
        bnDescription: "ভাউচার ওপেন ও লেজার স্টেটমেন্ট দেখার সময় পুরো ডেটাবেস স্ক্যান করার গুরুতর সমস্যা স্থায়ীভাবে সমাধান করা হয়েছে। এখন একটি ভাউচার দেখতে মাত্র ৩-৪টি এবং লেজার স্টেটমেন্টে মাত্র ১০টি রিড খরচ হয় (পূর্বে ১,২০০+ খরচ হতো), যা ৯৯% কোটা সাশ্রয় করে। একইসাথে দৈনিক বেসলাইন কোটা ৫০,০০০ অপারেশনে উন্নীত এবং অটো-রিকভারি সক্রিয় করা হয়েছে।",
        module: "Database & Quota"
      }
    ]
  },
  {
    version: "v1.9.6",
    releaseDate: "October 5, 2026",
    bnReleaseDate: "০৫ অক্টোবর, ২০২৬",
    title: "Instant Single-Click Release Popup, SemVer Version Guard & Universal Table Centering",
    bnTitle: "ইনস্ট্যান্ট ওয়ান-ক্লিক রিলিজ পপআপ, সেমভার ভার্সন গার্ড ও সর্বজনীন টেবিল সেন্টারিং",
    summary: "Refined version release popup workflows with seamless single-click dismissal and physical ESC key support, eliminated redundant duplicate modal rendering, introduced a robust SemVer upgrade guard ensuring fresh Vercel deployments immediately reflect the latest version, and standardized Microsoft Word-style table vertical cell centering across all modules.",
    bnSummary: "রিলিজ নোট পপআপে ডাবল-ক্লোজ সমস্যা সমাধান করে দ্রুত সিঙ্গেল-ক্লিক ও ESC কী ক্লোজ সুবিধা নিশ্চিত করা হয়েছে। অপ্রয়োজনীয় গিটহাব সিঙ্ক পপআপ বাতিল করে সাইডবার থেকে সরাসরি বর্তমান সংস্করণের পূর্ণাঙ্গ নোট দেখার ব্যবস্থা করা হয়েছে। এছাড়াও সেমভার গার্ড যোগ করায় Vercel ডেপ্লয়মেন্টে ব্রাউজার ক্যাশ কোনোভাবেই অ্যাপ ভার্সন আটকে রাখতে পারবে না।",
    isLatest: false,
    newFeatures: [
      {
        id: "feat-direct-version-modal",
        title: "Direct One-Click Version Release Viewer in Sidebar",
        bnTitle: "সাইডবারে সরাসরি ওয়ান-ক্লিক সংস্করণ পরিবর্তন বিবরণী",
        description: "Clicking the version badge in the sidebar immediately opens the current version's comprehensive What's New release details without unnecessary intermediate modals or multi-step friction.",
        bnDescription: "সাইডবারের ভার্সন ট্যাগে ক্লিক করলেই কোনো অতিরিক্ত পপআপ ছাড়া সরাসরি বর্তমান সংস্করণের পূর্ণাঙ্গ রিলিজ নোট, নতুন ফিচার ও উন্নতির তালিকা চলে আসবে।",
        module: "System & Navigation",
        badge: "NEW"
      },
      {
        id: "feat-semver-cache-guard",
        title: "Automated SemVer Cache-Busting Version Guard",
        bnTitle: "স্বয়ংক্রিয় সেমভার ক্যাশ-বাস্টিং ভার্সন গার্ড",
        description: "Implemented a semantic versioning comparison engine in SettingsContext that prevents stale localStorage or legacy Firestore records from overriding the application's compiled latest version upon new GitHub/Vercel deployments.",
        bnDescription: "ব্রাউজারে বা ফায়ারস্টোরে পুরোনো কোনো ক্যাশ ডেটা থাকলে তা স্বয়ংক্রিয়ভাবে শনাক্ত করে সর্বশেষ রিলিজ ভার্সনে আপগ্রেড হবে, ফলে গিটহাব বা ভার্সেলে কোড পুশ করার সাথে সাথে ব্যবহারকারীরা তৎক্ষণাৎ নতুন সংস্করণ দেখতে পাবেন।",
        module: "Core Architecture",
        badge: "NEW"
      },
      {
        id: "feat-esc-keyboard-dismiss",
        title: "Instant Keyboard ESC & Unified Single-Click Modal Dismissal",
        bnTitle: "কিবোর্ড ESC প্রেস ও এক ক্লিকে পপআপ বন্ধ করার সুবিধা",
        description: "Users can now smoothly close the release notes popup with a single click on the dismiss button/backdrop or by pressing the Escape key on their physical keyboard.",
        bnDescription: "পপআপটির যেকোনো ক্লোজ বাটন, ব্যাকগ্রাউন্ড ওভারলে অথবা কিবোর্ডের ESC বাটন এক ক্লিকে চাপলেই পপআপটি তাৎক্ষণিকভাবে বন্ধ হয়ে যাবে।",
        module: "UI/UX",
        badge: "NEW"
      },
      {
        id: "feat-keyboard-shortcuts-modal",
        title: "Interactive Keyboard Shortcuts Cheatsheet & Functional Analysis Modal",
        bnTitle: "ইন্টারেক্টিভ কিবোর্ড শর্টকাট চিটশিট ও বিস্তারিত বিশ্লেষণ মডাল",
        description: "Comprehensive modal and help section documenting all ERP keyboard shortcuts (Alt+D, Alt+V, Alt+L, Alt+I, Alt+B, Alt+G, F4-F10 voucher function keys, Ctrl+K, /, Esc) with live category filtering, search, and instant Jump Now navigation buttons.",
        bnDescription: "অ্যাপের সকল কিবোর্ড শর্টকাটের বিস্তারিত বিশ্লেষণ, ক্যাটাগরি ফিল্টার এবং সরাসরি জাম্প সুবিধাসহ আকর্ষণীয় শর্টকাট চিটশিট মডাল যুক্ত করা হয়েছে (যেকোনো সময় '?' বা 'Alt+H' চেপে ওপেন করা যায়)।",
        module: "Power User & Navigation",
        badge: "NEW"
      }
    ],
    improvements: [
      {
        id: "imp-unified-modal-tree",
        title: "Eliminated Duplicate Modal Tree Instances",
        bnTitle: "ডুপ্লিকেট মডাল ইনস্ট্যান্স দূরীকরণ",
        description: "Removed duplicate WhatsNewModal mounting inside the floating System Guide assistant, preventing overlapping dialog trees and eliminating the double-click closing bug.",
        bnDescription: "সিস্টেম গাইড বাটন থেকে অপ্রয়োজনীয় ডুপ্লিকেট মডাল সরিয়ে কেন্দ্রীয় একক মডাল সক্রিয় করা হয়েছে, ফলে দুইবার ক্লোজ করার ঝামেলা সম্পূর্ণ দূর হয়েছে।",
        module: "Performance"
      },
      {
        id: "imp-word-centering-perfection",
        title: "Global Table Properties Vertical Centering Logic",
        bnTitle: "মাইক্রোসফট ওয়ার্ড টেবিল প্রোপার্টিজ অনুযায়ী নিখুঁত ভার্টিক্যাল সেন্টারিং",
        description: "All table cells across UI screens, BI analytics tables, Daybook, print views, and PDF documents strictly enforce Microsoft Word Table Properties > Cell > Vertical Alignment: Center standards.",
        bnDescription: "ইউআই, বিজনেস ইন্টেলিজেন্স অ্যানালিটিক্স, ডেবুক এবং প্রিন্ট/পিডিএফ ডকুমেন্টের প্রতিটি টেবিল সেল মাইক্রোসফট ওয়ার্ডের সেন্টারিং লজিক অনুসারে নিখুঁতভাবে মিডল অ্যালাইন করা হয়েছে।",
        module: "Document Engine"
      }
    ],
    bugFixes: [
      {
        id: "fix-double-close-bug",
        title: "Resolved Double-Dismiss Requirement on Version Popup",
        bnTitle: "রিলিজ নোটস পপআপ বন্ধে দুইবার ক্লিকের সমস্যা সমাধান",
        description: "Fixed the event collision where two concurrent modal portals responded to open_whats_new, restoring seamless one-click dismissal.",
        bnDescription: "একসাথে দুটি মডাল খুলে যাওয়ার কারণে দুইবার ক্লোজ করার যে সমস্যা ছিল তা পুরোপুরি সমাধান করা হয়েছে।",
        module: "UI Bug Fix"
      },
      {
        id: "fix-remove-unneeded-github-modal",
        title: "Removed Redundant GitHub Sync & Version Control Modal",
        bnTitle: "অপ্রয়োজনীয় গিটহাব সিঙ্ক পপআপ সম্পূর্ণ অপসারণ",
        description: "Purged redundant manual git bump dialogs in favor of unified real-time release notes delivery directly to users.",
        bnDescription: "অপ্রয়োজনীয় গিটহাব সিঙ্ক ও ভার্সন কন্ট্রোল ডায়ালগটি সরিয়ে রিলিজ নোটস সিস্টেমকে আরও সহজ ও নির্ভরযোগ্য করা হয়েছে।",
        module: "Core Clean-up"
      }
    ]
  },
  {
    version: "v1.9.5",
    releaseDate: "October 5, 2026",
    bnReleaseDate: "০৫ অক্টোবর, ২০২৬",
    title: "Microsoft Word Table Centering, BI Period Quota Discipline & Modal Print/PDF Engine",
    bnTitle: "মাইক্রোসফট ওয়ার্ড টেবিল সেন্টারিং, বিআই পিরিয়ড কোটা অপ্টিমাইজেশন ও মডাল প্রিন্ট/পিডিএফ ইঞ্জিন",
    summary: "Implemented universal Microsoft Word-style table cell vertical centering across the entire ERP, strict period-exclusive filtering for BI Cost Centres to protect Firestore quotas, on-demand targeted ledger verification, and high-fidelity print/PDF export inside all BI detail popup modals.",
    bnSummary: "সম্পূর্ণ অ্যাপ্লিকেশনের প্রতিটি টেবিলে মাইক্রোসফট ওয়ার্ডের সেল ভার্টিক্যাল সেন্টার লজিক কার্যকর করা হয়েছে। বিজনেস ইন্টেলিজেন্সে কোটা সাশ্রয়ের জন্য তারিখ পিরিয়ড ভিত্তিক নিখুঁত ডেটা ফিল্টারিং, অন-ডিমান্ড লেজার ব্যালেন্স ভেরিফিকেশন এবং প্রতিটি গ্রাফ মডালে চার্টসহ পূর্ণাঙ্গ প্রিন্ট ও অফলাইন পিডিএফ এক্সপোর্ট যুক্ত করা হয়েছে।",
    isLatest: false,
    newFeatures: [
      {
        id: "feat-word-table-centering",
        title: "Microsoft Word Table Properties - Universal Cell Vertical Centering",
        bnTitle: "মাইক্রোসফট ওয়ার্ড টেবিল প্রোপার্টিজ - সর্বজনীন সেল ভার্টিক্যাল সেন্টারিং",
        description: "Strictly aligned all table headers and cells across the ERP (UI screens, dashboards, modals, print reports, and PDF exports) with Microsoft Word's Table Properties > Cell tab > Vertical Alignment: Center logic.",
        bnDescription: "অ্যাপের প্রতিটি স্ক্রিন, ড্যাশবোর্ড, মডাল এবং প্রিন্ট/পিডিএফ ডকুমেন্টের সকল টেবিল সেলে মাইক্রোসফট ওয়ার্ডের মতো ভার্টিক্যাল সেন্টার অ্যালাইনমেন্ট নিশ্চিত করা হয়েছে।",
        module: "UI/UX & Core",
        badge: "NEW"
      },
      {
        id: "feat-bi-modal-print-pdf",
        title: "Full-Featured Graph Detail Popup Print & Offline PDF Export",
        bnTitle: "গ্রাফ ডিটেইল পপআপে চার্টসহ প্রিন্ট ও অফলাইন পিডিএফ এক্সপোর্ট",
        description: "Every detailed modal in Business Intelligence (Sales/Purchase trends, Cost Centres, Stock Groups, Categories, Liquidity Composition, Cash Flow Dynamics) now includes dedicated 100% functional Print and Offline PDF generator with captured graph visuals and formal company headers.",
        bnDescription: "বিজনেস ইন্টেলিজেন্সের প্রতিটি বিস্তারিত পপআপে গ্রাফ ইমেজ, কোম্পানির আনুষ্ঠানিক হেডার ও সম্পূর্ণ ডেটা টেবিল সম্বলিত ১০০% কার্যকর প্রিন্ট এবং অফলাইন পিডিএফ ডাউনলোড বাটন যুক্ত করা হয়েছে।",
        module: "Analytics & Reports",
        badge: "NEW"
      },
      {
        id: "feat-targeted-verification",
        title: "Targeted On-Demand Ledger Balance Verification",
        bnTitle: "টার্গেটেড অন-ডিমান্ড লেজার ব্যালেন্স ভেরিফিকেশন",
        description: "Introduced a smart on-demand verification system that calculates point-in-time debit/credit balances for key displayed ledgers directly from raw voucher entries in just 30-60 reads (<0.1% daily quota) with zero automatic background loops.",
        bnDescription: "সম্পূর্ণ ডেটাবেজ স্ক্যান না করে শুধুমাত্র ড্যাশবোর্ডে প্রদর্শিত লেজারগুলোর রিয়েল-টাইম ব্যালেন্স নিখুঁতভাবে যাচাই ও সিঙ্ক করার জন্য ম্যানুয়াল ভেরিফাই বাটন যোগ করা হয়েছে, যা গুগল ক্লাউড কোটা সম্পূর্ণ সুরক্ষিত রাখে।",
        module: "Accounting Engine",
        badge: "NEW"
      }
    ],
    improvements: [
      {
        id: "imp-bi-period-discipline",
        title: "Cost Centre & Analytics Strict Period Filtering Discipline",
        bnTitle: "কস্ট সেন্টার ও অ্যানালিটিক্সে কঠোর পিরিয়ড ফিল্টারিং",
        description: "Cost Centre Allocation, Expense Distribution, and monthly trends now strictly reflect transactions occurring within the user-selected date range without falling back to cumulative all-time totals, preventing unexpected quota consumption.",
        bnDescription: "কস্ট সেন্টার এবং খরচের খাতগুলোতে শুধুমাত্র সিলেক্ট করা তারিখের লেনদেন প্রদর্শিত হবে; কোনো কিউমুলেটিভ বা সর্বকালীন হিসাব ওভাররাইড করবে না, ফলে অতিরিক্ত কোটা খরচ সম্পূর্ণ বন্ধ হয়েছে।",
        module: "Business Intelligence"
      },
      {
        id: "imp-strict-expense-exclusion",
        title: "Strict Classification: Zero Expense Accounts in Debtors/Creditors",
        bnTitle: "দেনাদার ও পাওনাদার তালিকা থেকে খরচের খাত সম্পূর্ণ পৃথকীকরণ",
        description: "Enhanced exclusion heuristics to ensure indirect and direct expense heads (such as Construction Godown Expenses) are never misclassified as Sundry Debtors or Sundry Creditors under any circumstances.",
        bnDescription: "পরোক্ষ ও প্রত্যক্ষ খরচের যেকোনো লেজার যাতে ভুলবশত কোনোভাবেই সানড্রি দেনাদার বা পাওনাদার তালিকায় না আসে তা নিশ্চিত করতে ক্লাসিফিকেশন লজিক কঠোর করা হয়েছে।",
        module: "Ledger Accounting"
      },
      {
        id: "imp-pdf-engine-centering",
        title: "Standardized PDF Engine & Report Layout Geometry",
        bnTitle: "পিডিএফ ইঞ্জিন ও রিপোর্ট লেআউট জ্যামিতি আধুনিকায়ন",
        description: "Standardized all document generation templates (Daybook, Ledger Statement, Trial Balance, P&L, Vouchers) to use vertically centered middle cell alignment and formal company layout rules.",
        bnDescription: "ডেবুক, লেজার স্টেটমেন্ট, ট্রায়াল ব্যালেন্স এবং ভাউচার প্রিন্ট ইঞ্জিনের প্রতিটি সেলে ভার্টিক্যাল মিডল সেন্টারিং প্রয়োগ করা হয়েছে।",
        module: "Document Engine"
      }
    ],
    bugFixes: [
      {
        id: "fix-auto-verification-loop",
        title: "Eliminated Automatic Background Verification Loops",
        bnTitle: "স্বয়ংক্রিয় ব্যাকগ্রাউন্ড ভেরিফিকেশন লুপ অপসারণ",
        description: "Removed unintended automatic verification execution on component mount and date changes, ensuring Firestore reads only execute when explicitly initiated by user interaction.",
        bnDescription: "পেজ লোড বা তারিখ পরিবর্তনের সাথে সাথে যাতে ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় ভেরিফিকেশন চালু না হয় তা দূর করা হয়েছে।",
        module: "Performance & Quota"
      },
      {
        id: "fix-table-cell-flex-overlap",
        title: "Resolved Table Cell Flexbox Display Inconsistencies",
        bnTitle: "টেবিল সেলে ফ্লেক্সবক্সের কারণে অ্যালাইনমেন্ট ত্রুটি সমাধান",
        description: "Restructured cell contents where flex display on table cells interfered with native vertical centering, restoring uniform height and row geometry.",
        bnDescription: "টেবিল সেলের অভ্যন্তরে ফ্লেক্স কনটেইনার পৃথক করে প্রতিটি কলামের উচ্চতা ও ভার্টিক্যাল সেন্টারিং নিখুঁত করা হয়েছে।",
        module: "UI Bug Fix"
      }
    ]
  },
  {
    version: "v1.9.0",
    releaseDate: "September 29, 2026",
    bnReleaseDate: "২৯ সেপ্টেম্বর, ২০২৬",
    title: "Business Intelligence Hub, Feature Controls & On-Demand Analytics",
    bnTitle: "বিজনেস ইন্টেলিজেন্স হাব, ফিচার নিয়ন্ত্রণ ও অন-ডিমান্ড ভিজ্যুয়াল অ্যানালিটিক্স",
    summary: "Introducing a dedicated enterprise Business Intelligence & Telemetry Hub featuring complete Trading details, financial ratios, asset/liability analysis, 6-month trends, inventory dynamics, banking telemetry, and System Guide Assistant feature controls with on-demand toggles.",
    bnSummary: "যুক্ত হলো সম্পূর্ণ নতুন ডেডিকেটেড বিজনেস ইন্টেলিজেন্স ও টেলিমেট্রি হাব — যাতে রয়েছে ট্রেডিং একাউন্ট ডিটেইলস, ৮টি ফাইন্যান্সিয়াল রেশিও, এসেট-লায়াবিলিটি সামারি, ৬ মাসের ট্রেন্ড গ্রাফ, ইনভেন্টরি ও ব্যাংকিং কার্যক্রম। সাথে সিস্টেম গাইড সহকারীতে ফিচার অন/অফ নিয়ন্ত্রণ এবং অন-ডিমান্ড ড্যাশবোর্ড উইজেট।",
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
