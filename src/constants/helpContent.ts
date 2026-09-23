export interface HelpSection {
  en: string;
  bn: string;
}

export const HELP_CONTENT: Record<string, HelpSection> = {
  "/dashboard": {
    en: "The Command Center of your business. Here you can monitor:\n1. Financial Health: View live Cash and Bank balances.\n2. Sales Performance: Track revenue trends over days, months, or years.\n3. Recent Activity: See the latest vouchers and transactions.\n4. Quick Actions: Jump directly to voucher entry or ledger creation.\n5. Pending Tasks: Monitor orders that need your attention.",
    bn: "আপনার ব্যবসার কমান্ড সেন্টার। এখানে আপনি যা মনিটর করতে পারেন:\n১. আর্থিক অবস্থা: বর্তমান ক্যাশ এবং ব্যাংক ব্যালেন্স দেখুন।\n২. বিক্রয়ের পারফরম্যান্স: দিন, মাস বা বছর অনুযায়ী আয়ের প্রবণতা ট্র্যাক করুন।\n৩. সাম্প্রতিক কার্যক্রম: সর্বশেষ ভাউচার এবং লেনদেন দেখুন।\n৪. কুইক অ্যাকশন: সরাসরি ভাউচার এন্ট্রি বা লেজার তৈরিতে যান।\n৫. পেন্ডিং টাস্ক: আপনার মনোযোগ প্রয়োজন এমন অর্ডারগুলো মনিটর করুন।"
  },
  "/vouchers/new": {
    en: "Step-by-step Guide to Recording a Transaction:\n1. Choose Type: Select if it's a Payment, Receipt, Sales, or Purchase.\n2. Date Selection: Use the date picker for retrospective or future entries.\n3. Ledger Selection: Choose the account affected. Search by name or code.\n4. Item Details: For inventory vouchers, add items, quantities, and rates.\n5. Tax & Discounts: Apply applicable taxes or discounts at the bottom.\n6. Narration: Add a brief note for future audit reference.\n7. Print/Save: You can choose to print the invoice immediately after saving.",
    bn: "লেনদেন রেকর্ড করার ধাপে ধাপে নির্দেশিকা:\n১. ধরন বেছে নিন: পেমেন্ট, রিসিট, সেলস বা পারচেজ কিনা তা নির্বাচন করুন।\n২. তারিখ নির্বাচন: পূর্ববর্তী বা ভবিষ্যতের এন্ট্রির জন্য ডেট পিকার ব্যবহার করুন।\n৩. লেজার নির্বাচন: সংশ্লিষ্ট অ্যাকাউন্ট বেছে নিন। নাম বা কোড দিয়ে সার্চ করুন।\n৪. আইটেমের বিবরণ: ইনভেন্টরি ভাউচারের জন্য আইটেম, পরিমাণ এবং রেট যোগ করুন।\n৫. ট্যাক্স ও ডিসকাউন্ট: নিচে প্রযোজ্য ট্যাক্স বা ডিসকাউন্ট প্রয়োগ করুন।\n৬. ন্যারেশন: ভবিষ্যতের অডিট রেফারেন্সের জন্য একটি ছোট নোট যোগ করুন।\n৭. প্রিন্ট/সেভ: সেভ করার সাথে সাথে ইনভয়েস প্রিন্ট করার অপশন পাবেন।"
  },
  "/accounts/ledgers/new": {
    en: "Creating a robust Chart of Accounts:\n1. Name: Enter the full legal name of the account/party.\n2. Grouping: This is CRITICAL. Select 'Hand in Cash' for cash accounts, 'Bank Accounts' for bank, 'Sundry Debtors' for customers, and 'Sundry Creditors' for suppliers.\n3. Opening Balance: Enter any balance carried forward from your previous system.\n4. Contact Info: Add address and GST/Tax details for parties to ensure accurate invoicing.",
    bn: "একটি শক্তিশালী চার্ট অফ অ্যাকাউন্টস তৈরি করা:\n১. নাম: অ্যাকাউন্ট বা পার্টির পূর্ণ আইনি নাম লিখুন।\n২. গ্রুপিং: এটি অত্যন্ত গুরুত্বপূর্ণ। ক্যাশ অ্যাকাউন্টের জন্য 'Hand in Cash', ব্যাংকের জন্য 'Bank Accounts', কাস্টমারদের জন্য 'Sundry Debtors' এবং সাপ্লায়ারদের জন্য 'Sundry Creditors' নির্বাচন করুন।\n৩. ওপেনিং ব্যালেন্স: পূর্ববর্তী সিস্টেম থেকে আসা কোনো ব্যালেন্স থাকলে তা লিখুন।\n৪. যোগাযোগের তথ্য: সঠিক ইনভয়েসিং নিশ্চিত করতে পার্টির ঠিকানা এবং ট্যাক্স সম্পর্কিত বিস্তারিত যোগ করুন।"
  },
  "/inventory/items/new": {
    en: "Add a new stock item to your inventory.\n- Define the Item Name and Code.\n- Select the Category and Group.\n- Set Units of Measure (Pcs, Kg, etc.).\n- Add Opening Stock balance if any.\n- Configure Reorder levels to get alerts when stock is low.",
    bn: "আপনার ইনভেন্টরিতে একটি নতুন স্টক আইটেম যোগ করুন।\n- আইটেমের নাম এবং কোড নির্ধারণ করুন।\n- ক্যাটাগরি এবং গ্রুপ নির্বাচন করুন।\n- পরিমাপের ইউনিট (Pcs, Kg ইত্যাদি) সেট করুন।\n- থাকলে ওপেনিং স্টক ব্যালেন্স যোগ করুন।\n- স্টক কমে গেলে সতর্কতা পেতে রিঅর্ডার লেভেল কনফিগার করুন।"
  },
  "/reports/stock": {
    en: "View current stock levels for all items across multiple locations (Godowns).\n- Monitor 'Inward' and 'Outward' movements.\n- Check 'Closing Balance' for valuation.\n- Use filters to find specific items or groups.\n- Export findings to Excel for further analysis.",
    bn: "বিভিন্ন লোকেশনে (গোডাউন) সমস্ত আইটেমের বর্তমান স্টকের অবস্থা দেখুন।\n- 'ইনওয়ার্ড' এবং 'আউটওয়ার্ড' মুভমেন্ট মনিটর করুন।\n- মূল্যায়নের জন্য 'ক্লোজিং ব্যালেন্স' চেক করুন।\n- নির্দিষ্ট আইটেম বা গ্রুপ খুঁজতে ফিল্টার ব্যবহার করুন।\n- আরও বিশ্লেষণের জন্য এক্সেল-এ এক্সপোর্ট করুন।"
  },
  "/reports/ledger": {
    en: "Detailed record of all transactions for a specific account ledger.\n- Select the Ledger and Date Range to generate the statement.\n- View Opening Balance, Debit/Credit transactions, and Running Balance.\n- Use filters to find specific vouchers or amounts.\n- Useful for party reconciliation and auditing.",
    bn: "একটি নির্দিষ্ট অ্যাকাউন্ট লেজারের সমস্ত লেনদেনের বিস্তারিত রেকর্ড।\n- স্টেটমেন্ট তৈরি করতে লেজার এবং তারিখের পরিসর নির্বাচন করুন।\n- ওপেনিং ব্যালেন্স, ডেবিট/ক্রেডিট লেনদেন এবং রানিং ব্যালেন্স দেখুন।\n- নির্দিষ্ট ভাউচার বা পরিমাণ খুঁজতে ফিল্টার ব্যবহার করুন।\n- পার্টি রিকনসিলিলেশন এবং অডিটিংয়ের জন্য দরকারী।"
  },
  "/reports/cash-bank": {
    en: "Monitor your liquid assets across Cash and Bank accounts.\n- Summary of all Cash in Hand and Bank Balances.\n- Drills down into individual bank statements or cash registers.\n- Helps in maintaining liquidity and planning upcoming payments.",
    bn: "ক্যাশ এবং ব্যাংক অ্যাকাউন্টে আপনার তরল সম্পদ পর্যবেক্ষণ করুন।\n- হাতে থাকা ক্যাশ এবং ব্যাংক ব্যালেন্সের সারাংশ।\n- স্বতন্ত্র ব্যাংক স্টেটমেন্ট বা ক্যাশ রেজিস্টারে বিস্তারিত তথ্য দেখুন।\n- তারল্য বজায় রাখতে এবং আসন্ন পেমেন্টগুলো পরিকল্পনা করতে সাহায্য করে।"
  },
  "/reports/daybook": {
    en: "Chronological list of all transactions recorded during a specific period.\n- Monitor daily business activities at a glance.\n- Filter by date to see vouchers created on that day.\n- Use quick-search to find specific entries.\n- Essential for daily cash and bank reconciliation.",
    bn: "একটি নির্দিষ্ট সময়ের মধ্যে রেকর্ড করা সমস্ত লেনদেনের কালানুক্রমিক তালিকা।\n- এক নজরে প্রতিদিনের ব্যবসায়িক কার্যক্রম পর্যবেক্ষণ করুন।\n- সেই দিনের তৈরি করা ভাউচারগুলো দেখতে তারিখ অনুযায়ী ফিল্টার করুন।\n- নির্দিষ্ট এন্ট্রি খুঁজে পেতে কুইক-সার্চ ব্যবহার করুন।\n- প্রতিদিনের ক্যাশ এবং ব্যাংক রিকনসিলিলেশনের জন্য অপরিহার্য।"
  },
  "/reports/trial-balance": {
    en: "A summary of all ledger balances to ensure accounting accuracy.\n- Lists all Debit and Credit balances separately.\n- The total of Debits must equal the total of Credits.\n- Helps in detecting errors before preparing Final Accounts (P&L and Balance Sheet).",
    bn: "অ্যাকাউন্টিং সঠিকতা নিশ্চিত করতে সমস্ত লেজার ব্যালেন্সের সারাংশ।\n- সমস্ত ডেবিট এবং ক্রেডিট ব্যালেন্স আলাদাভাবে তালিকাভুক্ত করে।\n- ডেবিটের মোট পরিমাণ অবশ্যই ক্রেডিটের মোট পরিমাণের সমান হতে হবে।\n- ফাইনাল অ্যাকাউন্টস (P&L এবং ব্যালেন্স শিট) তৈরির আগে ভুল শনাক্ত করতে সাহায্য করে।"
  },
  "/reports/balance-sheet": {
    en: "A snapshot of your company's financial position.\n- Left Side: Liabilities (Capital, Loans, Current Liabilities).\n- Right Side: Assets (Fixed Assets, Investments, Current Assets).\n- Both sides must balance. Click on any group to drill down into individual ledger balances.",
    bn: "আপনার কোম্পানির আর্থিক অবস্থার একটি প্রতিচ্ছবি।\n- বাম দিকে: দায় (মূলধন, ঋণ, চলতি দায়)।\n- ডান দিকে: সম্পদ (স্থায়ী সম্পদ, বিনিয়োগ, চলতি সম্পদ)।\n- উভয় পক্ষ অবশ্যই সমান হতে হবে। একক লেজার ব্যালেন্স দেখতে যেকোনো গ্রুপে ক্লিক করুন।"
  },
  "/reports/pl": {
    en: "Monitor the performance of your business over time.\n- Gross Profit: Calculated from Sales and Direct Costs.\n- Net Profit: Total Income minus all Operating Expenses.\n- Helps in understanding the profitability and Identifying areas for cost reduction.",
    bn: "সময়ের সাথে সাথে আপনার ব্যবসার পারফরম্যান্স পর্যবেক্ষণ করুন।\n- মোট লাভ (Gross Profit): বিক্রয় এবং সরাসরি খরচ থেকে গণনা করা হয়।\n- নিট লাভ (Net Profit): মোট আয় থেকে সমস্ত অপারেটিং খরচ বিয়োগ করে পাওয়া যায়।\n- এটি ব্যবসার লাভজনকতা বুঝতে এবং খরচ কমানোর ক্ষেত্রগুলো শনাক্ত করতে সাহায্য করে।"
  },
  "/settings": {
    en: "Global configuration for your ERP system.\n- Company Details: Name, Address, Contact, Logo.\n- UI Style: Choose between different design themes.\n- Feature Management: Enable or disable modules like CRM, AI, or Supply Chain.\n- Backup/Reset: Manage your company data safely.",
    bn: "আপনার ERP সিস্টেমের গ্লোবাল কনফিগারেশন।\n- কোম্পানির বিবরণ: নাম, ঠিকানা, যোগাযোগ, লোগো।\n- UI স্টাইল: বিভিন্ন ডিজাইন থিমের মধ্যে বেছে নিন।\n- ফিচার ম্যানেজমেন্ট: CRM, AI বা সাপ্লাই চেইনের মতো মডিউলগুলো চালু বা বন্ধ করুন।\n- ব্যাকআপ/রিসেট: আপনার কোম্পানির ডেটা নিরাপদে পরিচালনা করুন।"
  },
  "/payroll": {
    en: "Payroll Maintenance Guide:\n1. Employee Setup: Add/Update employees with basic salary and joining dates.\n2. Attendance Entry: Mark daily attendance (Present/Absent/Leave) in the Attendance tab. This affects 'On Attendance' pay heads.\n3. Pay Heads & Structures: Define custom earnings (e.g., HRA) and setup each employee's salary package.\n4. Advance & Loans: Record any employee advances or loans. EMI will be auto-deducted from salary.\n5. Salary Generation: Use 'Bulk View' to generate all pending sheets for the month. All calculations are automated based on attendance and structure.\n6. Distribution: Print or send payslips via WhatsApp/Email.",
    bn: "পেরোল ম্যানেজমেন্ট নির্দেশিকা:\n১. কর্মচারী সেটআপ: বেসিক স্যালারি এবং যোগদানের তারিখ সহ কর্মচারী যোগ করুন বা আপডেট করুন।\n২. উপস্থিতি এন্ট্রি: অ্যাটেনডেন্স ট্যাবে প্রতিদিনের উপস্থিতি (উপস্থিত/অনুপস্থিত/ছুটি) মার্ক করুন। এটি 'উপস্থিতি ভিত্তিক' পে-হেডগুলোকে প্রভাবিত করে।\n৩. পে-হেড এবং কাঠামো: কাস্টম আয় (যেমন: বাড়ি ভাড়া) সংজ্ঞায়িত করুন এবং প্রতিটি কর্মচারীর স্যালারি প্যাকেজ সেটআপ করুন।\n৪. অগ্রিম ও ঋণ: কর্মচারীর অগ্রিম বা ঋণ রেকর্ড করুন। ইএমআই (EMI) বেতন থেকে স্বয়ংক্রিয়ভাবে কাটা হবে।\n৫. বেতন জেনারেশন: মাসের সমস্ত পেন্ডিং শিট তৈরি করতে 'Bulk View' ব্যবহার করুন। উপস্থিতি এবং কাঠামোর উপর ভিত্তি করে সমস্ত গণনা স্বয়ংক্রিয়।\n৬. বিতরণ: পে-স্লিপ প্রিন্ট করুন অথবা হোয়াটসঅ্যাপ/ইমেলের মাধ্যমে পাঠান।"
  },
  "/reports/due-payments": {
    en: "Customer Overdue & Due Payment Recovery Hub:\n1. Overdue Aging Analysis: Automatically categorizes unpaid customer balances into 0-15 Days, 16-30 Days, 31-60 Days, and 60+ Days (Critical).\n2. Automated Reminders: Dispatch polite, formal, or urgent payment reminders directly via WhatsApp, SMS, or Email in 1 click.\n3. Legal Demand Notices: Generate formal printed payment demand letters with bank routing and overdue breakdown on company letterhead.\n4. Call Log Records: Track every phone follow-up with customer response remarks and scheduled promise-to-pay dates.",
    bn: "বকেয়া আদায় ও দেনাদার ব্যবস্থাপনা হাব:\n১. বকেয়ার বয়স ভিত্তিক বিশ্লেষণ (Aging): অনাদায়ী পাওনা স্বয়ংক্রিয়ভাবে ০-১৫ দিন, ১৬-৩০ দিন, ৩১-৬০ দিন এবং ৬০+ দিন (ঝুঁকিপূর্ণ) ক্যাটাগরিতে বিভক্ত করে।\n২. অটোমেটেড রিমাইন্ডার: ১ ক্লিকেই হোয়াটসঅ্যাপ, এসএমএস বা ইমেলের মাধ্যমে নমনীয়, তাগাদা বা জরুরি রিমাইন্ডার মেসেজ পাঠান।\n৩. লিগ্যাল ডিমান্ড নোটিশ: কোম্পানির নিজস্ব লেটারহেডে ব্যাংক অ্যাকাউন্ট ও বকেয়া চালান উল্লেখসহ আনুষ্ঠানিক আইনি তাগাদাপত্র তৈরি ও প্রিন্ট করুন।\n৪. কল লগ রেকর্ড: কাস্টমারের সাথে ফোনে কথা বলার পর তাদের বক্তব্য ও পরবর্তী পেমেন্টের সম্ভাব্য তারিখ ডায়রিতে লিখে রাখুন।"
  },
  "/reports/audit-trail": {
    en: "Statutory Audit Trail & Historical Transaction Log:\n1. Immutable Event Logging: Captures every Create, Update, Delete, and Cancel action with timestamp, IP, and authorized User ID.\n2. Deep Diff Inspection: Compare before and after values for altered vouchers down to the individual ledger row and amount.\n3. Auditor Review Notes: Qualified internal and statutory auditors can append review remarks without altering financial books.\n4. Regulatory Compliance: Meets MCA, GST, and ISO accounting audit trail compliance standards.",
    bn: "বিধিবদ্ধ অডিট ট্রেইল ও কার্যক্রমের ইতিহাস সংরক্ষণ:\n১. অপরিবর্তনীয় ইভেন্ট লগ: প্রতিটি ভাউচার তৈরি, পরিবর্তন বা মুছে ফেলার সাথে সাথে তারিখ, সময়, ইউজার আইডি ও আইপি রেকর্ড করে।\n২. পরিবর্তন তুলনামূলক নিরীক্ষা: কোনো ভাউচার সংশোধন করা হলে আগের তথ্য এবং বর্তমান তথ্যের নিখুঁত পার্থক্য খতিয়ে দেখুন।\n৩. অডিটর রিভিউ নোট: অভ্যন্তরীণ বা সরকারি নিরীক্ষক হিসাবের মূল খতিয়ান পরিবর্তন না করেই নিজস্ব মতামত ও মন্তব্য সংরক্ষণ করতে পারবেন।\n৪. প্রাতিষ্ঠানিক কমপ্লায়েন্স: আয়কর, ভ্যাট এবং ISO স্ট্যান্ডার্ডের ডিজিটাল অডিট ট্রেইল নীতিমালা শতভাগ পূরণ করে।"
  },
  "/inventory": {
    en: "Inventory Overview & Stock Health Monitor:\n1. Real-Time Stock Status: Live monitoring of current quantity, reserved quantity, and stock valuation.\n2. Low Stock Alerts: Instant visual alerts for items falling below minimum safety threshold with 1-click Requisition Print.\n3. Negative Stock Prevention: Real-time warnings during sales voucher entry to eliminate negative balances.\n4. Multi-Warehouse Tracking: Track balances per godown with automated stock valuation (FIFO/Moving Average).",
    bn: "ইনভেন্টরি সার্বিক অবস্থা ও স্টক মনিটরিং:\n১. রিয়েল-টাইম স্টক স্ট্যাটাস: প্রতিটি আইটেমের বর্তমান স্টক, সংরক্ষিত স্টক এবং মোট মজুত মূল্য পর্যবেক্ষণ করুন।\n২. লো-স্টক সতর্কতা: স্টক রিঅর্ডার লেভেলের নিচে নামার সাথে সাথে সতর্কবার্তা এবং ১ ক্লিকে সাপ্লায়ার রিকুইজিশন তৈরি ও প্রিন্ট করুন।\n৩. ঘাটতি স্টক প্রতিরোধ: সেলস ভাউচার এন্ট্রির সময় সরাসরি সতর্কতা যাতে গোডাউনে নেগেটিভ স্টক না হয়।\n৪. মাল্টি-গোডাউন ব্যবস্থাপনা: একাধিক গুদামের আলাদা স্টক পর্যবেক্ষণ এবং স্বয়ংক্রিয় স্টক ভ্যালুয়েশন।"
  }
};

export interface FieldDefinition {
  name: string;
  bnName: string;
  type: string;
  description: string;
  bnDescription: string;
  required?: boolean;
}

export interface DocSubSection {
  id: string;
  title: string;
  bnTitle: string;
  path?: string;
  hotkey?: string;
  planBadge?: string;
  content: string;
  bnContent: string;
  whereToFind?: string;
  bnWhereToFind?: string;
  points?: string[];
  bnPoints?: string[];
  fields?: FieldDefinition[];
  example?: {
    scenario: string;
    bnScenario: string;
    steps: string[];
    bnSteps: string[];
  };
  tip?: string;
  bnTip?: string;
  warning?: string;
  bnWarning?: string;
  screenshotMockupKey?: string;
}

export interface DocCategory {
  id: string;
  iconName: string;
  title: string;
  bnTitle: string;
  description: string;
  bnDescription: string;
  badge?: string;
  sections: DocSubSection[];
}

export const HELP_DOCS: DocCategory[] = [
  {
    id: "getting-started",
    iconName: "rocket",
    badge: "Core",
    title: "Getting Started & Workspace",
    bnTitle: "শুরু করার নির্দেশিকা ও ইন্টারফেস",
    description: "Welcome to TallyFlow ERP. Understand core workspace components, topbar liquidity feeds, and navigation hotkeys.",
    bnDescription: "সিস্টেমের মূল ড্যাশবোর্ড, শীর্ষ তারল্য বার, দ্রুত নেভিগেশন এবং কোম্পানির তথ্য সেটআপের সম্পূর্ণ পরিচিতি।",
    sections: [
      {
        id: "gs-interface",
        title: "1.1 System Interface & Executive Dashboard",
        bnTitle: "১.১ ইন্টারফেস পরিচিতি ও এক্সিকিউটিভ ড্যাশবোর্ড",
        path: "/dashboard",
        hotkey: "Alt+D",
        planBadge: "All Plans",
        whereToFind: "Left Sidebar > Dashboard (or click Top-Left Logo / press Alt+D)",
        bnWhereToFind: "বাম সাইডবার > ড্যাশবোর্ড (অথবা উপরের লোগোতে ক্লিক করুন / Alt+D চাপুন)",
        content: "Our unified ERP software integrates financial bookkeeping, stock logistics, CRM sales pipeline, manufacturing Bill of Materials, and automated payroll under a singular, ultra-secure cloud engine. The Executive Dashboard acts as your central flight deck.",
        bnContent: "আমাদের সমন্বিত ERP প্ল্যাটফর্ম একই সুরক্ষিত ক্লাউড ইঞ্জিনের অধীনে ফাইন্যান্সিয়াল বুককিপিং, স্টক ওয়্যারহাউস লজিস্টিকস, CRM সেলস পাইপলাইন, ম্যানুফ্যাকচারিং এবং অটোমেটেড পেরোল পরিচালনা করে। এক্সিকিউটিভ ড্যাশবোর্ড হলো আপনার ব্যবসার মূল কমান্ড সেন্টার।",
        points: [
          "Real-time Liquidity Feed: Monitor actual cash on hand and live bank statement balances direct from the head bar without running reports.",
          "Dynamic Revenue Charts: Interactive daily and monthly bar charts track revenue trends and transaction volumes.",
          "Live Activity Stream: A real-time chronological ledger archives newly posted vouchers for transparent auditing.",
          "Quick Action Shortcuts: Direct one-click buttons to record Sales (F8), Payments (F5), Receipts (F6), or create Ledgers."
        ],
        bnPoints: [
          "রিয়েল-টাইম তারল্য পর্যবেক্ষণ: কোনো রিপোর্ট রান না করেই সরাসরি ড্যাশবোর্ড ও হেডবার থেকে নগদ ও ব্যাংকের মোট ব্যালেন্স দেখুন।",
          "ডায়নামিক বিক্রয় চার্ট: দৈনিক ও মাসিক ফিল্টারিং সহ ইনভয়েস ট্র্যাক করুন ও আয়ের প্রবৃদ্ধি বিশ্লেষণ করুন।",
          "লাইভ অ্যাক্টিভিটি স্ট্রিম: প্রতিটি নতুন এন্ট্রি বা ট্রানজেকশনের রিয়েল-টাইম ক্রনোলজিক্যাল লগ অডিট সক্ষমতা নিশ্চিত করে।",
          "কুইক শর্টকাট বাটন: এক ক্লিকে নতুন সেলস বিল (F8), পেমেন্ট (F5), রিসিট (F6) বা লেজার তৈরি করার বাটন।"
        ],
        fields: [
          { name: "Cash in Hand Card", bnName: "ক্যাশ ইন হ্যান্ড কার্ড", type: "Metric", description: "Displays real-time physical liquid cash available across all active cash registers.", bnDescription: "সকল ক্যাশ কাউন্টারে থাকা মোট নগদ টাকার পরিমাণ প্রদর্শন করে।" },
          { name: "Bank Balance Card", bnName: "ব্যাংক ব্যালেন্স কার্ড", type: "Metric", description: "Sum of all active bank account balances linked in your Chart of Accounts.", bnDescription: "চার্ট অফ অ্যাকাউন্টসে যুক্ত সকল ব্যাংক হিসাবের মোট জমার পরিমাণ।" },
          { name: "Revenue Bar Chart", bnName: "রেভিনিউ বার চার্ট", type: "Chart", description: "Interactive visual comparison of month-over-month and day-over-day sales turnover.", bnDescription: "দৈনিক ও মাসিক বিক্রির টার্নওভারের দৃশ্যমান গ্রাফিক্যাল চিত্র।" }
        ],
        example: {
          scenario: "Starting your business day and reviewing liquidity before paying vendor bills.",
          bnScenario: "দিনের শুরুতে ব্যবসায়িক কার্যক্রম শুরু করার আগে ক্যাশ ও ব্যাংকের স্থিতি যাচাই করা।",
          steps: [
            "Log in and land on /dashboard.",
            "Check 'Cash in Hand' and 'Bank Accounts' to confirm available liquid cash.",
            "Inspect 'Pending Orders' and 'Recent Activity' to see yesterday's transactions.",
            "Click '+ New Voucher' to record any immediate morning cash movement."
          ],
          bnSteps: [
            "সিস্টেমে লগইন করে /dashboard এ প্রবেশ করুন।",
            "হাতে থাকা ক্যাশ এবং ব্যাংকের স্থিতি দেখে নিশ্চিত হোন পর্যাপ্ত ফান্ড আছে কিনা।",
            "পেন্ডিং অর্ডার এবং রিসেন্ট অ্যাক্টিভিটি দেখে গতকালের বকেয়া ও নতুন কাজের অগ্রগতি জানুন।",
            "সকালের লেনদেন দ্রুত তুলতে '+ New Voucher' বাটনে ক্লিক করুন।"
          ]
        },
        tip: "You can toggle the sidebar collapse button at the top header to maximize desktop viewing space when analyzing dense financial tables.",
        bnTip: "বড় ফাইন্যান্সিয়াল টেবিল সহজে পড়ার জন্য হেডারের তীর বাটন চেপে সাইডবারটি সঙ্কুচিত বা ছোট করে নিতে পারেন।"
      },
      {
        id: "gs-search",
        title: "1.2 Global Search Commander & Instant Navigation",
        bnTitle: "১.২ গ্লোবাল সার্চ কমান্ডার ও দ্রুত অনুসন্ধান",
        path: "/search",
        hotkey: "Cmd+K / Ctrl+K / '/'",
        planBadge: "All Plans",
        whereToFind: "Top Bar Search Box, or press '/' or 'Cmd + K' on any screen",
        bnWhereToFind: "টপ বার সার্চ বক্স, অথবা যেকোনো স্ক্রিনে '/' বা 'Cmd + K' চাপুন",
        content: "Power users can operate the entire ERP hands-free. Execute instant navigations or find structural ledgers, stock items, customer invoices, and reports using the global search commander.",
        bnContent: "কিবোর্ড পাওয়ার-ইউজাররা মাউস স্পর্শ ছাড়াই সম্পূর্ণ সিস্টেম অপারেট করতে পারবেন। গ্লোবাল সার্চ উইন্ডো দিয়ে চোখের পলকে যেকোনো পেজে যাওয়া, গ্রাহকের নাম, লেজার বা পণ্য খুঁজে পাওয়া যায়।",
        points: [
          "Trigger Key: Press either '/' (Forward Slash) or 'Cmd + K' / 'Ctrl + K' on any screen to launch search drawer.",
          "Entity Search: Enter customer names, ledger codes, or stock item SKUs to fetch matched profile summaries.",
          "Pinned Navigation: Frequently used modules are automatically pinned to the top of search for 1-click access."
        ],
        bnPoints: [
          "ট্রিগার বাটন: যেকোনো স্ক্রিনে থাকা অবস্থায় '/' অথবা 'Cmd + K' / 'Ctrl + K' চেপে তাৎক্ষণিক সার্চ ড্রয়ার চালু করুন।",
          "দ্রুত সন্ধান: লেজার কোড, কাস্টমারের নাম, স্টক আইটেম SKU টাইপ করে সরাসরি সংশ্লিষ্ট প্রোফাইলে প্রবেশ করুন।",
          "পিনযুক্ত শর্টকাট: দ্রুত ব্যবহারের জন্য সবচেয়ে বেশি ব্যবহৃত ফিচারগুলো সার্চ ড্রয়ারের ডানে পিন হয়ে থাকে।"
        ]
      },
      {
        id: "gs-company",
        title: "1.3 Multi-Company Switching & Profile Setup",
        bnTitle: "১.৩ মাল্টি-কোম্পানি সুইচিং ও প্রোফাইল সেটআপ",
        path: "/companies",
        planBadge: "All Plans",
        whereToFind: "Sidebar Top Header > Click Company Name Dropdown > 'Switch / Manage Companies'",
        bnWhereToFind: "সাইডবার টপ হেডার > কোম্পানির নামের ড্রপডাউনে ক্লিক করুন > 'Switch / Manage Companies'",
        content: "Manage multiple business branches or separate corporate entities within a single unified account. Switch active company profiles seamlessly without logging out.",
        bnContent: "একটি অ্যাকাউন্ট থেকেই আপনার একাধিক শাখা বা ভিন্ন ভিন্ন ব্যবসা পরিচালনা করুন। লগআউট ছাড়াই চোখের পলকে এক কোম্পানি থেকে অন্য কোম্পানিতে সুইচ করতে পারবেন।",
        points: [
          "Instant Organization Switcher: Click the company banner at the top of the sidebar to switch between sister companies.",
          "Dedicated Data Isolation: Each company retains completely segregated ledgers, vouchers, godowns, and payroll sheets.",
          "Custom Slogan & Legal Address: Configure branch address, contact details, and tax identification numbers individually."
        ],
        bnPoints: [
          "তাৎক্ষণিক কোম্পানি সুইচিং: সাইডবারের শীর্ষে থাকা কোম্পানির ব্যানার ড্রপডাউনে ক্লিক করে যেকোনো শাখা নির্বাচন করুন।",
          "সম্পূর্ণ ডেটা বিচ্ছিন্নতা: প্রতিটি কোম্পানির লেজার, স্টক, ভাউচার ও পেরোল সম্পূর্ণ পৃথক ও সুরক্ষিত থাকে।",
          "কাস্টম স্লোগান ও ঠিকানা: প্রতিটি শাখার নিজস্ব ঠিকানা, যোগাযোগের নম্বর এবং ট্যাক্স নম্বর আলাদাভাবে সেট করুন।"
        ]
      }
    ]
  },
  {
    id: "vouchers",
    iconName: "file-text",
    badge: "Essential",
    title: "Vouchers & Daily Invoicing",
    bnTitle: "ভাউচার এন্ট্রি ও দৈনন্দিন লেনদেন",
    description: "Master double-entry accounting transactions: Sales (F8), Purchase (F9), Payment (F5), Receipt (F6), Contra (F4), and Journal (F7).",
    bnDescription: "ডাবল-এন্ট্রি বুককিপিং অনুযায়ী সেলস, পারচেজ, পেমেন্ট, রিসিট, কন্ট্রা ও জার্নাল ভাউচার তৈরির সম্পূর্ণ নির্দেশিকা।",
    sections: [
      {
        id: "vouch-sales",
        title: "2.1 Sales Invoice Entry (F8)",
        bnTitle: "২.১ সেলস ইনভয়েস / বিক্রয় বিল এন্ট্রি (F8)",
        path: "/vouchers/new",
        hotkey: "F8 or Alt+V",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Vouchers > New Voucher > Click 'Sales (F8)' tab",
        bnWhereToFind: "সাইডবার > Vouchers > New Voucher > 'Sales (F8)' ট্যাবে ক্লিক করুন",
        content: "The Sales Voucher (F8) is used to record customer sales on cash or credit. It automatically reduces stock from selected godowns, calculates taxes/discounts, updates the customer's ledger balance, and generates a printable invoice.",
        bnContent: "সেলস ভাউচার (F8) নগদ বা বাকিতে গ্রাহকের কাছে পণ্য বিক্রির বিল তৈরির জন্য ব্যবহৃত হয়। এটি স্বয়ংক্রিয়ভাবে গোডাউন থেকে স্টক হ্রাস করে, ভ্যাট ও ডিসকাউন্ট হিসাব করে এবং গ্রাহকের লেজার ব্যালেন্স ও প্রিন্টযোগ্য ইনভয়েস আপডেট করে।",
        points: [
          "Dual Billing Mode: Supports Itemized Inventory Invoice mode (Stock Items + Quantities + Rates) as well as Account-Only service invoice mode.",
          "Multi-Godown Dispatch: Select exactly which warehouse or shop counter items are being dispatched from.",
          "Tax & Trade Discounts: Apply flat or percentage discounts and select applicable tax rates seamlessly.",
          "One-Click Thermal/A4 Printing: Save and immediately preview or print professional GST/VAT invoices."
        ],
        bnPoints: [
          "দ্বৈত বিলিং মোড: স্টক আইটেম সহ ইনভেন্টরি ইনভয়েস অথবা সরাসরি সার্ভিস বিলিং উভয় পদ্ধতিতেই বিক্রয় বিল করা যায়।",
          "মাল্টি-গোডাউন ডেলিভারি: পণ্যটি কোন নির্দিষ্ট গোডাউন বা শাখা থেকে ডেলিভারি হচ্ছে তা নির্বাচন করা যায়।",
          "ভ্যাট ও ছাড়: ইনভয়েসে ফ্ল্যাট অথবা শতকরা ডিসকাউন্ট ও ভ্যাট স্বয়ংক্রিয়ভাবে হিসাব করা হয়।",
          "ইনস্ট্যান্ট প্রিন্টিং: সেভ করার সাথে সাথে প্রফেশনাল থার্মাল পিওএস স্লিপ বা A4 ইনভয়েস প্রিন্ট করার অপশন পাওয়া যায়।"
        ],
        fields: [
          { name: "Party A/c Name", bnName: "পার্টি বা গ্রাহকের নাম", type: "Dropdown (Required)", description: "Select the customer ledger (Sundry Debtors) or 'Hand in Cash' / Bank for direct counter sales.", bnDescription: "গ্রাহকের খতিয়ান (Sundry Debtors) অথবা সরাসরি নগদ বিক্রির ক্ষেত্রে 'Hand in Cash' নির্বাচন করুন।" },
          { name: "Voucher Date", bnName: "ভাউচারের তারিখ", type: "Date Picker", description: "The transaction date. Defaults to today, can be backdated for audit reconciliations.", bnDescription: "লেনদেনের তারিখ। স্বয়ংক্রিয়ভাবে আজকের তারিখ থাকে, তবে পূর্বের তারিখও বেছে নেওয়া যায়।" },
          { name: "Item / SKU", bnName: "আইটেম বা পণ্য", type: "Searchable Dropdown", description: "Select the stock item being sold. Displays live available stock balance in selected godown.", bnDescription: "বিক্রিত পণ্য নির্বাচন করুন। এটি নির্বাচিত গোডাউনে বর্তমান স্টক ব্যালেন্স প্রদর্শন করে।" },
          { name: "Quantity & Rate", bnName: "পরিমাণ ও দর", type: "Number", description: "Quantity sold (integers for Pcs/Nos, decimals for Kg/Ltr) and unit selling price.", bnDescription: "পণ্য বিক্রয়ের পরিমাণ এবং প্রতি ইউনিটের বিক্রয় মূল্য।" },
          { name: "Discount & Tax", bnName: "ছাড় ও ভ্যাট", type: "Percentage / Flat", description: "Optional discount applied before/after subtotal, and tax slab calculation.", bnDescription: "সাবটোটালের ওপর প্রযোজ্য ছাড়ের শতকরা হার এবং ভ্যাটের হিসাব।" },
          { name: "Narration", bnName: "ব্যাখ্যা বা ন্যারেশন", type: "Textarea", description: "Brief memo regarding payment terms, PO number, or delivery notes.", bnDescription: "পেমেন্ট শর্ত, চালান নম্বর বা ডেলিভারি সংক্রান্ত সংক্ষিপ্ত মন্তব্য।" }
        ],
        example: {
          scenario: "Selling 50 Pcs Cotton Shirts @ $20 each to Dhaka Retail Mart on 30-day credit with 5% VAT.",
          bnScenario: "ঢাকা রিটেইল মার্টের কাছে ৩০ দিনের বাকিতে প্রতি পিস ২০ টাকা দরে ৫০ পিস কটন শার্ট বিক্রয় এবং ৫% ভ্যাট যোগ করা।",
          steps: [
            "Go to /vouchers/new and click 'Sales (F8)'.",
            "Under 'Party A/c Name', select 'Dhaka Retail Mart'.",
            "Under Item, select 'Cotton Shirt', Godown: 'Main Warehouse', Qty: '50', Rate: '20'.",
            "In Tax section, select 'VAT 5%'. Total calculates to $1,050.",
            "Type Narration: 'Invoice for PO# 8841 due in 30 days'.",
            "Click 'Save Transaction' and print the official receipt."
          ],
          bnSteps: [
            "/vouchers/new এ গিয়ে 'Sales (F8)' ট্যাবে ক্লিক করুন।",
            "'Party A/c Name' এ 'Dhaka Retail Mart' লেজারটি নির্বাচন করুন।",
            "আইটেম ড্রপডাউনে 'Cotton Shirt', গোডাউন: 'Main Warehouse', পরিমাণ: '50', রেট: '20' দিন।",
            "ট্যাক্স ড্রপডাউনে 'VAT 5%' নির্বাচন করুন। মোট টাকার পরিমাণ $১,০৫০ হবে।",
            "ন্যারেশনে লিখুন: 'PO# 8841 অনুযায়ী ৩০ দিনের বাকিতে বিক্রয়'।",
            "'Save Transaction' বাটনে ক্লিক করে ভাউচারটি সংরক্ষণ ও প্রিন্ট করুন।"
          ]
        },
        tip: "Items with units like 'Pcs' or 'Nos' will strictly omit decimals (e.g. 50 Pcs), whereas weight items (Kg) support up to 2 decimal places.",
        bnTip: "Pcs বা Nos ইউনিটের ক্ষেত্রে দশমিক বাদ দিয়ে পূর্ণসংখ্যা (যেমন ৫০ পিস) প্রদর্শিত হবে, আর কেজির ক্ষেত্রে ২ দশমিক স্থান সমর্থিত।"
      },
      {
        id: "vouch-purchase",
        title: "2.2 Purchase Invoice Entry (F9)",
        bnTitle: "২.২ পারচেজ ইনভয়েস / ক্রয় বিল এন্ট্রি (F9)",
        path: "/vouchers/new",
        hotkey: "F9",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Vouchers > New Voucher > Click 'Purchase (F9)' tab",
        bnWhereToFind: "সাইডবার > Vouchers > New Voucher > 'Purchase (F9)' ট্যাবে ক্লিক করুন",
        content: "The Purchase Voucher (F9) records incoming inventory or raw materials bought from suppliers. It increases stock quantities in the receiving godown and credits the vendor's payable account.",
        bnContent: "পারচেজ ভাউচার (F9) সরবরাহকারীদের কাছ থেকে কেনা কাঁচামাল বা বাণিজ্যিক পণ্যের বিল তোলার জন্য ব্যবহৃত হয়। এটি নির্দিষ্ট গোডাউনে স্টক বৃদ্ধি করে এবং সরবরাহকারীর পাওনা খতিয়ান ক্রেডিট করে।",
        points: [
          "Supplier Bill Reconciliation: Input vendor's original invoice number for effortless cross-audit.",
          "Automatic Cost Valuation: Automatically updates average unit cost in stock valuation summaries.",
          "Direct Godown Intake: Select the destination warehouse where raw materials are physically stored."
        ],
        bnPoints: [
          "সাপ্লায়ার বিল ট্র্যাকিং: সরবরাহকারীর মূল চালানের নম্বর ইনপুট দিয়ে সহজে হিসাব মেলানো যায়।",
          "স্বয়ংক্রিয় স্টক মূল্যায়ন: পণ্য ক্রয়ের সাথে সাথে স্টকের গড় ক্রয়মূল্য স্বয়ংক্রিয়ভাবে আপডেট হয়।",
          "সরাসরি গোডাউনে এন্ট্রি: কাঁচামাল বা পণ্য কোন গুদামে আনলোড হচ্ছে তা নির্বাচন করুন।"
        ]
      },
      {
        id: "vouch-payment-receipt",
        title: "2.3 Payment (F5) & Receipt (F6) Vouchers",
        bnTitle: "২.৩ পেমেন্ট (F5) ও রিসিট (F6) ভাউচার",
        path: "/vouchers/new",
        hotkey: "F5 (Payment) / F6 (Receipt)",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Vouchers > New Voucher > Click 'Payment (F5)' or 'Receipt (F6)'",
        bnWhereToFind: "সাইডবার > Vouchers > New Voucher > 'Payment (F5)' বা 'Receipt (F6)' এ ক্লিক করুন",
        content: "Payment Vouchers (F5) record money paid out to suppliers or operational expense ledgers (Rent, Utilities, Salaries). Receipt Vouchers (F6) record customer debt settlements, capital injections, or other business income.",
        bnContent: "পেমেন্ট ভাউচার (F5) এর মাধ্যমে সরবরাহকারীর বিল পরিশোধ, অফিস ভাড়া বা অন্যান্য যাবতীয় খরচ রেকর্ড করা হয়। রিসিট ভাউচার (F6) এর মাধ্যমে কাস্টমারের বকেয়া আদায়, মূলধন জমা বা অন্যান্য আয় ক্যাশ বা ব্যাংকে গ্রহণ করা হয়।",
        points: [
          "Payment (F5): Debit Expense/Vendor Ledger, Credit Cash/Bank Ledger.",
          "Receipt (F6): Debit Cash/Bank Ledger, Credit Customer/Income Ledger.",
          "Party Bill Allocation: Clear outstanding invoice balances directly when receiving payments."
        ],
        bnPoints: [
          "পেমেন্ট (F5): খরচের খাত বা সরবরাহকারী ডেবিট হবে এবং ক্যাশ/ব্যাংক ক্রেডিট হবে।",
          "রিসিট (F6): ক্যাশ বা ব্যাংক ডেবিট হবে এবং আয়ের উৎস বা কাস্টমার ক্রেডিট হবে।",
          "বকেয়া বিল সমন্বয়: টাকা পাওয়ার সাথে সাথে কাস্টমারের বকেয়া বিল স্বয়ংক্রিয়ভাবে অ্যাডজাস্ট হবে।"
        ]
      },
      {
        id: "vouch-contra",
        title: "2.4 Contra Voucher (F4) - Internal Funds Movement",
        bnTitle: "২.৪ কন্ট্রা ভাউচার (F4) - অভ্যন্তরীণ তহবিল স্থানান্তর",
        path: "/vouchers/new",
        hotkey: "F4",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Vouchers > New Voucher > Click 'Contra (F4)' tab",
        bnWhereToFind: "সাইডবার > Vouchers > New Voucher > 'Contra (F4)' ট্যাবে ক্লিক করুন",
        content: "Contra Vouchers are strictly restricted to internal cash-to-bank, bank-to-cash, or bank-to-bank transfers. No external revenue, party invoices, or expense ledgers can be mapped here.",
        bnContent: "কন্ট্রা ভাউচার শুধুমাত্র প্রতিষ্ঠানের নিজস্ব ক্যাশ থেকে ব্যাংক, ব্যাংক থেকে ক্যাশ, অথবা এক ব্যাংক থেকে অন্য ব্যাংকে টাকা স্থানান্তরের জন্য ব্যবহৃত হয়। এতে কোনো বাহ্যিক আয়-ব্যয় বা পার্টি বিল এন্ট্রি করা যাবে না।",
        warning: "Never use a Contra Voucher to pay vendor bills or record customer receipts. Doing so violates double-entry audit principles.",
        bnWarning: "কখনো সাপ্লায়ারকে টাকা দেওয়া বা কাস্টমারের টাকা তোলার কাজে কন্ট্রা ভাউচার ব্যবহার করবেন না।"
      }
    ]
  },
  {
    id: "accounting-ledgers",
    iconName: "book-open",
    badge: "Finance",
    title: "Chart of Accounts & Ledgers",
    bnTitle: "চার্ট অফ অ্যাকাউন্টস ও লেজার সেটআপ",
    description: "Design your organizational Chart of Accounts across 28 accounting groups: Sundry Debtors, Creditors, Cash, Banks, Expenses, and Assets.",
    bnDescription: "২৮টি প্রধান অ্যাকাউন্টিং গ্রুপের আওতায় কাস্টমার, সাপ্লায়ার, ব্যাংক, ক্যাশ এবং আয়-ব্যয়ের খতিয়ান খোলার সম্পূর্ণ নিয়মাবলী।",
    sections: [
      {
        id: "acc-chart",
        title: "3.1 Understanding 28 Accounting Groups",
        bnTitle: "৩.১ অ্যাকাউন্টিং গ্রুপ ও শ্রেণিবিভাগ পরিচিতি",
        path: "/accounts",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Chart of Accounts (or press Alt+L)",
        bnWhereToFind: "সাইডবার > Chart of Accounts (অথবা Alt+L চাপুন)",
        content: "Accurate financial statements depend on placing every account into its correct group. The system provides the standard 28 double-entry hierarchy groups.",
        bnContent: "সঠিক আর্থিক বিবরণী পাওয়ার মূল শর্ত হলো প্রতিটি লেজারকে তার সঠিক গ্রুপে যুক্ত করা। আমাদের সিস্টেমে স্ট্যান্ডার্ড ২৮টি অ্যাকাউন্টিং গ্রুপ রয়েছে।",
        points: [
          "Sundry Debtors (গ্রাহক): Customers buying goods on credit (Asset - Normal Debit).",
          "Sundry Creditors (সরবরাহকারী): Vendors supplying raw stock on credit (Liability - Normal Credit).",
          "Bank Accounts (ব্যাংক): Commercial bank checking/savings portals (Asset - Normal Debit).",
          "Hand in Cash (নগদ তহবিল): Physical shop and register cash balances (Asset - Normal Debit).",
          "Direct/Indirect Expenses (খরচসমূহ): Factory wages, freight, office rent, power bills (Expense - Normal Debit)."
        ],
        bnPoints: [
          "Sundry Debtors (গ্রাহক খাত): যেসব কাস্টমার বাকিতে পণ্য কেনে এবং যাদের কাছ থেকে টাকা পাওয়া যাবে।",
          "Sundry Creditors (সরবরাহকারী খাত): যেসব ভেন্ডরের কাছ থেকে বাকিতে কাঁচামাল কেনা হয় এবং যাদের বিল পরিশোধ করতে হবে।",
          "Bank Accounts (ব্যাংক হিসাব): প্রতিষ্ঠানের বাণিজ্যিক ও সঞ্চয়ী ব্যাংক অ্যাকাউন্ট।",
          "Hand in Cash (নগদ তহবিল): ক্যাশ কাউন্টার ও ড্রয়ারে রক্ষিত নগদ অর্থ।",
          "Direct/Indirect Expenses (ব্যয় খাত): কারখানার মজুরি, পরিবহন, অফিস ভাড়া, বিদ্যুৎ বিল ইত্যাদি।"
        ]
      },
      {
        id: "acc-ledger-new",
        title: "3.2 Creating & Altering Ledgers",
        bnTitle: "৩.২ নতুন লেজার তৈরি ও সংশোধন",
        path: "/accounts/ledgers/new",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Ledgers > New Ledger (or Sidebar > Masters > Alter)",
        bnWhereToFind: "সাইডবার > Ledgers > New Ledger (অথবা সাইডবার > Masters > Alter)",
        content: "Create individual party accounts, expense heads, or bank registers with detailed tax codes, opening balances, and addresses.",
        bnContent: "প্রতিটি কাস্টমার, সাপ্লায়ার বা খরচের জন্য আলাদা খতিয়ান খুলুন। এতে প্রারম্ভিক ব্যালেন্স, ঠিকানা ও ট্যাক্স আইডি যুক্ত করা যায়।",
        fields: [
          { name: "Ledger Name", bnName: "লেজারের নাম", type: "Text (Required)", description: "Legal entity or expense name (e.g., 'ABC Fashion Mart' or 'Factory Electricity Expense').", bnDescription: "গ্রাহক, সরবরাহকারী বা খরচের পূর্ণ নাম।" },
          { name: "Group Under", bnName: "গ্রুপ নির্বাচন", type: "Dropdown (Required)", description: "Select the classification parent group (e.g. Sundry Debtors, Bank Accounts, Indirect Expenses).", bnDescription: "সংশ্লিষ্ট প্যারেন্ট গ্রুপ নির্বাচন করুন (যেমন: Sundry Debtors, Bank Accounts)।" },
          { name: "Opening Balance", bnName: "প্রারম্ভিক ব্যালেন্স", type: "Amount + Dr/Cr", description: "Opening starting balance carried forward from previous bookkeeping system.", bnDescription: "পূর্ববর্তী হিসাবকাল থেকে আগত শুরুর ব্যালেন্স এবং এটি ডেবিট নাকি ক্রেডিট তা নির্বাচন।" },
          { name: "TIN / Tax Number", bnName: "টিআইএন বা ট্যাক্স নম্বর", type: "Text", description: "Tax identification number for auto-inclusion in printed sales invoices.", bnDescription: "স্বয়ংক্রিয়ভাবে ইনভয়েসে প্রিন্ট হওয়ার জন্য ট্যাক্স/টিআইএন নম্বর।" }
        ]
      }
    ]
  },
  {
    id: "inventory",
    iconName: "package",
    badge: "Logistics",
    title: "Inventory, Godowns & Stock",
    bnTitle: "ইনভেন্টরি, গোডাউন ও স্টক ব্যবস্থাপনা",
    description: "Manage product SKUs, units of measure, multiple godowns/warehouses, inter-warehouse stock transfers, and reorder levels.",
    bnDescription: "পণ্য ক্যাটালগ, পরিমাপের ইউনিট, মাল্টি-লোকেশন গোডাউন স্থানান্তর এবং রিঅর্ডার লেভেল সতর্কতার সম্পূর্ণ গাইড।",
    sections: [
      {
        id: "inv-items",
        title: "4.1 Registering Stock Items & Units",
        bnTitle: "৪.১ স্টক আইটেম ও পরিমাপের ইউনিট সেটআপ",
        path: "/inventory/items/new",
        hotkey: "Alt+I",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Inventory > Stock Items > Click '+ New Item'",
        bnWhereToFind: "সাইডবার > Inventory > Stock Items > '+ New Item' এ ক্লিক করুন",
        content: "Register products with custom barcodes/SKUs, category groupings, standard selling/purchase rates, and unit definitions (Pcs, Kg, Nos, Ltr).",
        bnContent: "বারকোড/SKU, ক্যাটাগরি, ক্রয়-বিক্রয় মূল্য এবং পরিমাপের ইউনিট (Pcs, Kg, Nos, Ltr) সহ নতুন পণ্য যুক্ত করার নিয়ম।",
        fields: [
          { name: "Item Name & Code", bnName: "পণ্যের নাম ও কোড", type: "Text (Required)", description: "Distinct product name and barcode/SKU identifier.", bnDescription: "পণ্যের নাম এবং ইউনিক কোড বা বারকোড।" },
          { name: "Unit of Measure (UoM)", bnName: "পরিমাপের ইউনিট", type: "Dropdown (Required)", description: "Measurement metric (e.g., Pcs, Kg, Box, Litre).", bnDescription: "পরিমাপের একক যেমন: পিস, কেজি, বক্স, লিটার।" },
          { name: "Opening Stock & Valuation", bnName: "ওপেনিং স্টক ও মূল্য", type: "Number", description: "Initial quantity in stock and per-unit purchase cost.", bnDescription: "শুরুতে গোডাউনে থাকা পণ্যের সংখ্যা ও গড় মূল্য।" },
          { name: "Reorder Alert Level", bnName: "রিঅর্ডার লেভেল", type: "Number", description: "System triggers an alert when stock drops below this number.", bnDescription: "স্টক এই সংখ্যার নিচে নামলে ক্রয় করার জন্য স্বয়ংক্রিয় নোটিফিকেশন দেবে।" }
        ]
      },
      {
        id: "inv-godowns",
        title: "4.2 Warehouses (Godowns) & Stock Transfers",
        bnTitle: "৪.২ গোডাউন ব্যবস্থাপনা ও স্টক ট্রান্সফার",
        path: "/inventory/godowns",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Inventory > Godowns (or Vouchers > Stock Transfer)",
        bnWhereToFind: "সাইডবার > Inventory > Godowns (অথবা Vouchers > Stock Transfer)",
        content: "Keep track of inventory across multiple physical locations (e.g. Central Warehouse, Factory Storage, Retail Counter). Use Stock Transfer vouchers to shift inventory between sites with full audit trail.",
        bnContent: "একাধিক গোডাউন বা শাখা গুদামের স্টক আলাদাভাবে ট্র্যাক করুন। এক গুদাম থেকে অন্য গুদামে পণ্য স্থানান্তর করতে 'Stock Transfer' ভাউচার ব্যবহার করুন।",
        points: [
          "Unlimited Godown Locations: Set up physical branches, central depots, and factory bins.",
          "Audited Transfer Vouchers: Deducts item quantity from Source Godown and adds to Destination Godown simultaneously.",
          "Negative Stock Protection: System halts transfers if the source location has insufficient stock."
        ],
        bnPoints: [
          "আনলিমিটেড গোডাউন: কেন্দ্রীয় ডিপো, ফ্যাক্টরি বা শো-রুম কাউন্টার নামে একাধিক গুদাম খুলুন।",
          "নিরাপদ স্থানান্তর: সোর্স গোডাউন থেকে স্বয়ংক্রিয়ভাবে স্টক বিয়োগ করে ডেস্টিনেশন গোডাউনে যোগ করবে।",
          "ঘাটতি স্টক প্রতিরোধ: সোর্স গুদামে পর্যাপ্ত ব্যালেন্স না থাকলে সিস্টেম ভুল ট্রান্সফার আটকে দেবে।"
        ]
      },
      {
        id: "inv-low-stock",
        title: "4.3 Low Stock Warnings & Reorder Requisitions",
        bnTitle: "৪.৩ লো-স্টক সতর্কতা ও স্বয়ংক্রিয় রি-অর্ডার রিকুইজিশন",
        path: "/inventory",
        hotkey: "Alt+K",
        planBadge: "All Plans",
        whereToFind: "Dashboard Alert Banner (in Standard & Minimalist Splash) | Sidebar > Inventory > Click 'Low Stock Alerts' tab | Sales Voucher Entry (F8)",
        bnWhereToFind: "ড্যাশবোর্ড অ্যালার্ট ব্যানার (স্ট্যান্ডার্ড ও মিনিমালিস্ট স্প্ল্যাশ উভয় লেআউটেই) | সাইডবার > Inventory > 'Low Stock Alerts' ট্যাব | সেলস ভাউচার এন্ট্রি (F8)",
        content: "Automated inventory depletion alert engine and procurement requisition generator.\n\n### Why Use This Feature (কেন ব্যবহার করবেন):\n1. Prevent Stockouts: Never turn away paying customers due to unmonitored stock depletion.\n2. Optimize Working Capital: Balance inventory so you never overstock slow-moving goods nor run out of fast-selling SKUs.\n3. Instant Procurement Workflows: Convert endangered items into formal supplier purchase requisitions in one click.\n4. Frontline Cashier Alerts: When issuing a Sales Invoice (F8), the billing screen automatically warns the operator if current stock breaches the safety threshold.\n\n### How to Use Step-by-Step (কীভাবে ব্যবহার করবেন):\n1. Configure Threshold: In Inventory > Stock Items (or Alt+I), specify the 'Low Stock Threshold / Reorder Level' for each item (e.g., 10 Pcs).\n2. View Dashboard Warnings: On the home Dashboard (both Standard and Minimalist Splash layouts), a high-visibility alert banner alerts you whenever items breach safety margins.\n3. Inspect Inventory Alerts: Navigate to Sidebar > Inventory and click the 'Low Stock Alerts' tab to see current stock, threshold deficit, and supplier details.\n4. Print Requisition: Click 'Print Reorder Sheet' to generate a formal supplier requisition order with recommended procurement quantities.",
        bnContent: "স্বয়ংক্রিয় স্টক ঘাটতি শনাক্তকরণ এবং সাপ্লায়ার রিকুইজিশন তৈরির পূর্ণাঙ্গ ব্যবস্থা।\n\n### কেন ব্যবহার করবেন (Why Use This Feature):\n১. বিক্রি বন্ধ হওয়া প্রতিরোধ: হঠাৎ স্টক শেষ হয়ে কাস্টমার ফিরে যাওয়া বা অর্ডার বাতিল হওয়া সম্পূর্ণ দূর করে।\n২. কার্যকরি মূলধন নিয়ন্ত্রণ: অলস পণ্য অতিরিক্ত না কিনে শুধুমাত্র প্রয়োজনীয় পণ্য সঠিক সময়ে রি-অর্ডার করার সুযোগ দেয়।\n৩. তাৎক্ষণিক রিকুইজিশন: সংকটপূর্ণ পণ্যগুলোর জন্য ১ ক্লিকেই সাপ্লায়ারের জন্য ফরমাল পারচেজ রিকুইজিশন শিট তৈরি করা যায়।\n৪. বিক্রয় পয়েন্টে তাৎক্ষণিক সতর্কতা: সেলস ভাউচার (F8) তৈরির সময় ক্যাশিয়ার তাৎক্ষণিক ওয়ার্নিং দেখতে পান যদি স্টক নির্ধারিত সীমার নিচে নেমে যায়।\n\n### কীভাবে ব্যবহার করবেন (Step-by-Step Usage Guide):\n১. থ্রেশহোল্ড সেটআপ: Inventory > Stock Items এ গিয়ে প্রতিটি পণ্যের 'Low Stock Threshold / Reorder Level' ফিল্ডে ন্যূনতম মজুত সংখ্যা দিন (যেমন: ১০ পিস)।\n২. ড্যাশবোর্ড অ্যালার্ট মনিটরিং: হোম ড্যাশবোর্ডে (স্ট্যান্ডার্ড ও মিনিমালিস্ট স্প্ল্যাশ উভয় ডিজাইনেই) লাল রঙের সতর্কবার্তা প্রদর্শিত হবে যদি কোনো আইটেমের স্টক কমে যায়।\n৩. স্টক অডিট তালিকা: সাইডবার থেকে Inventory পেজে গিয়ে 'Low Stock Alerts' ট্যাবে ক্লিক করুন। এখানে ঝুঁকিপূর্ণ সকল আইটেমের তালিকা ও ঘাটতির পরিমাণ দেখতে পাবেন।\n৪. রিকুইজিশন প্রিন্ট: 'Print Requisition' বাটনে ক্লিক করে সাপ্লায়ারের কাছে পাঠানোর উপযোগী অফিসিয়াল পারচেজ রিকুইজিশন প্রিন্ট বা পিডিএফ করুন।",
        points: [
          "Dual-Layout Dashboard Integration: Alerts appear dynamically in both Standard Grid and Minimalist Splash layouts.",
          "Live Point-of-Sale Guard: Real-time visual badge inside Sales Voucher (F8) line items.",
          "Automated Deficit Calculation: Automatically calculates reorder quantity = Reorder Threshold - Current Stock.",
          "One-Click Supplier Requisition: Direct print-ready procurement purchase orders with formal header."
        ],
        bnPoints: [
          "উভয় ড্যাশবোর্ডেই কার্যকর: স্ট্যান্ডার্ড গ্রিড এবং মিনিমালিস্ট স্প্ল্যাশ উভয় লেআউটেই সতর্কবার্তা ফুটে ওঠে।",
          "সেলস ভাউচারে সরাসরি ওয়ার্নিং: সেলস চালানে আইটেম সিলেক্ট করলেই লাইভ স্টক ও থ্রেশহোল্ড অ্যালার্ট দেখায়।",
          "স্বয়ংক্রিয় ঘাটতি পরিমাপ: প্রয়োজনীয় ঘাটতির পরিমাণ স্বয়ংক্রিয়ভাবে গণনা করে।",
          "১ ক্লিকে রিকুইজিশন প্রিন্ট: সাপ্লায়ারের ঠিকানাসহ প্রাতিষ্ঠানিক ফরম্যাটে রি-অর্ডার তালিকা প্রিন্ট করার সুবিধা।"
        ],
        fields: [
          { name: "Low Stock Threshold", bnName: "লো-স্টক থ্রেশহোল্ড", type: "Number (Required)", description: "The safety stock boundary. If current stock <= threshold, alert fires.", bnDescription: "ন্যূনতম সংরক্ষিত সংখ্যা। স্টক এর সমান বা নিচে নামলে অ্যালার্ট চালু হবে।" },
          { name: "Reorder Quantity", bnName: "রিঅর্ডার পরিমাণ", type: "Number", description: "Standard batch volume to order when replenishing stock.", bnDescription: "একবারে নতুন করে যে পরিমাণ পণ্য সাপ্লায়ার থেকে ক্রয় করতে চান।" },
          { name: "Primary Supplier", bnName: "প্রধান সরবরাহকারী", type: "Ledger", description: "Preferred vendor to automatically attach to procurement sheets.", bnDescription: "যে সাপ্লায়ারের নিকট থেকে সাধারণত পণ্যটি কেনা হয়।" }
        ],
        example: {
          scenario: "Electronics wholesaler with fast-selling LED monitors.",
          bnScenario: "একটি ইলেকট্রনিক্স প্রতিষ্ঠান যাদের এলইডি মনিটরের দ্রুত বিক্রি হয়।",
          steps: [
            "Set Reorder Level to 15 Pcs for 24-inch LED Monitor.",
            "Sales invoice issued for 8 units, reducing stock from 20 to 12 Pcs.",
            "Dashboard and Inventory overview immediately highlight 'Low Stock Warning: 1 Item Below Reorder Level'.",
            "Store manager clicks 'Print Requisition' and sends purchase order to supplier without delay."
          ],
          bnSteps: [
            "২৪ ইঞ্চি এলইডি মনিটরের রিঅর্ডার লেভেল ১৫ পিস নির্ধারণ করলেন।",
            "৮টি মনিটর বিক্রির চালান কাটায় গোডাউনের স্টক ২০ থেকে কমে ১২ পিসে নেমে এলো।",
            "ড্যাশবোর্ড ও ইনভেন্টরি পেজে সাথে সাথে 'Low Stock Warning: 1 Item Below Reorder Level' নোটিফিকেশন চলে আসলো।",
            "স্টোর ম্যানেজার ১ ক্লিকে 'Print Requisition' চেপে সাপ্লায়ারকে নতুন পারচেজ অর্ডার পাঠিয়ে দিলেন।"
          ]
        },
        tip: "Set thresholds slightly higher than your average vendor delivery lead time so stock arrives before your warehouse runs completely dry.",
        bnTip: "সাপ্লায়ারের মাল সরবরাহ করতে যত দিন লাগে, সেই সময়ের গড় বিক্রির উপর ভিত্তি করে থ্রেশহোল্ড একটু বাড়িয়ে সেট করুন যাতে স্টক কখনোই শূন্য না হয়।"
      }
    ]
  },
  {
    id: "manufacturing",
    iconName: "layers",
    badge: "Gold Plan",
    title: "Manufacturing & Production (BOM)",
    bnTitle: "ম্যানুফ্যাকচারিং ও প্রোডাকশন অর্ডার (BOM)",
    description: "Configure Bill of Materials (BOM) recipes, generate production work orders, assign factory machines, and track finished product yields.",
    bnDescription: "কাঁচামালের রেসিপি (BOM), প্রোডাকশন ওয়ার্ক অর্ডার, মেশিন ট্র্যাকিং এবং তৈরি পণ্যের স্টক জেনারেশন গাইড।",
    sections: [
      {
        id: "mfg-bom",
        title: "5.1 Bill of Materials (BOM) Recipe Setup",
        bnTitle: "৫.১ বিল অফ ম্যাটেরিয়ালস (BOM) রেসিপি গঠন",
        path: "/production/orders",
        planBadge: "Gold Tier+",
        whereToFind: "Sidebar > Production > Bill of Materials (BOM)",
        bnWhereToFind: "সাইডবার > Production > Bill of Materials (BOM)",
        content: "Define the exact raw material ingredients recipe required to manufacture one unit of a finished product. When a production batch is run, the engine automatically consumes raw materials and produces finished stock.",
        bnContent: "১টি ফিনিশড পণ্য উৎপাদনে কতটুকু কাঁচামাল প্রয়োজন তার রেসিপি তৈরি করুন। প্রোডাকশন রান করলে স্বয়ংক্রিয়ভাবে কাঁচামাল বিয়োগ হয়ে তৈরি পণ্য গোডাউনে যোগ হবে।",
        points: [
          "Recipe Mapping: Example: 1 Unit 'Executive Desk' requires 'Wood Planks: 4 Nos', 'Steel Screws: 16 Pcs', 'Varnish: 2 Ltrs'.",
          "Standard Cost Calculation: Aggregates raw material cost + overhead costs to compute total production cost per unit."
        ],
        bnPoints: [
          "রেসিপি ম্যাপিং: যেমন ১টি 'এক্সিকিউটিভ টেবিল' তৈরিতে 'কাঠের তক্তা: ৪টি', 'স্ক্রু: ১৬টি', 'বার্নিশ: ২ লিটার' প্রয়োজন।",
          "উৎপাদন ব্যয় গণনা: কাঁচামালের মূল্য ও অপারেশনাল খরচ যোগ করে প্রতি ইউনিটের মোট উৎপাদন ব্যয় বের করে।"
        ]
      },
      {
        id: "mfg-orders",
        title: "5.2 Production Work Orders & Machine Tracking",
        bnTitle: "৫.২ প্রোডাকশন অর্ডার ও মেশিন ম্যানেজমেন্ট",
        path: "/production/orders/new",
        planBadge: "Gold Tier+",
        whereToFind: "Sidebar > Production > Work Orders > '+ New Production Order'",
        bnWhereToFind: "সাইডবার > Production > Work Orders > '+ New Production Order'",
        content: "Issue factory work orders, assign designated machinery, monitor stages (Cutting, Assembly, Quality Control), and record output batch numbers.",
        bnContent: "কারখানার কাজের আদেশ দিন, মেশিন নির্ধারণ করুন, বিভিন্ন ধাপ (কাটিং, অ্যাসেম্বলি, কোয়ালিটি চেক) পর্যবেক্ষণ করুন এবং ফিনিশড ব্যাচ সংরক্ষণ করুন।"
      }
    ]
  },
  {
    id: "payroll",
    iconName: "users",
    badge: "Gold Plan",
    title: "HR, Attendance & Automated Payroll",
    bnTitle: "পেরোল, হাজিরা ও স্যালারি অটোমেশন",
    description: "Manage employee profiles, daily attendance, custom allowances & deductions, corporate advance loans, and 1-click bulk monthly salary sheet generation.",
    bnDescription: "কর্মচারী ডেটাবেস, দৈনিক হাজিরা খাতা, লোন ও কিস্তি কর্তন এবং ১-ক্লিকে পুরো মাসের স্যালারি শীট ও পে-স্লিপ তৈরির সম্পূর্ণ গাইড।",
    sections: [
      {
        id: "pay-employees",
        title: "6.1 Employee Master & Salary Structure Setup",
        bnTitle: "৬.১ কর্মচারী প্রোফাইল ও স্যালারি কাঠামো নির্ধারণ",
        path: "/employees",
        planBadge: "Gold Tier+",
        whereToFind: "Sidebar > Payroll > Employees (or /employees)",
        bnWhereToFind: "সাইডবার > Payroll > Employees (অথবা /employees)",
        content: "Register staff with basic monthly pay, allowances (House Rent, Medical, Transport), and statutory deductions (Provident Fund, Tax).",
        bnContent: "কর্মচারীদের বেসিক বেতন, বাড়িভাড়া ও যাতায়াত ভাতা এবং প্রভিডেন্ট ফান্ড কর্তন সহ পূর্ণাঙ্গ স্যালারি প্যাকেজ সেটআপ করুন।"
      },
      {
        id: "pay-attendance",
        title: "6.2 Daily Attendance & Salary Pro-Rata Rules",
        bnTitle: "৬.২ দৈনিক হাজিরা ট্র্যাকিং ও বেতন অনুপাত",
        path: "/payroll",
        planBadge: "Gold Tier+",
        whereToFind: "Sidebar > Payroll > Attendance Tab",
        bnWhereToFind: "সাইডবার > Payroll > Attendance Tab",
        content: "Mark daily attendance (Present, Absent, Leave). Pay heads designated 'On Attendance' calculate automatically using: (Basic Pay / Total Month Days) * Present Days.",
        bnContent: "প্রতিদিনের উপস্থিতি (উপস্থিত, অনুপস্থিত, ছুটি) রেকর্ড করুন। উপস্থিতি ভিত্তিক পে-হেডগুলোর বেতন স্বয়ংক্রিয়ভাবে প্রদেয় দিনের অনুপাতে হিসাব হয়।"
      },
      {
        id: "pay-loans",
        title: "6.3 Advance Salary Loans & Auto-EMI Deduction",
        bnTitle: "৬.৩ অগ্রিম ঋণ ও মাসিক কিস্তি (EMI) কর্তন",
        path: "/payroll",
        planBadge: "Gold Tier+",
        whereToFind: "Sidebar > Payroll > Advance & Loans Tab",
        bnWhereToFind: "সাইডবার > Payroll > Advance & Loans Tab",
        content: "Disburse corporate advance loans to staff. When generating monthly salaries, the pre-set monthly EMI is automatically deducted from gross earnings without manual calculations.",
        bnContent: "কর্মচারীকে দেওয়া অগ্রিম লোনের মাসিক কিস্তি (EMI) সেট করে রাখলে মাস শেষে বেতন তৈরির সময় স্বয়ংক্রিয়ভাবে নেট স্যালারি থেকে কিস্তির টাকা কেটে নেওয়া হবে।"
      },
      {
        id: "pay-bulk",
        title: "6.4 One-Click Bulk Monthly Salary Sheet Generation",
        bnTitle: "৬.৪ ১-ক্লিকে পুরো মাসের স্যালারি শীট ও পে-স্লিপ তৈরি",
        path: "/payroll",
        planBadge: "Gold Tier+",
        whereToFind: "Sidebar > Payroll > Salary Generation Tab > 'Bulk View / Process'",
        bnWhereToFind: "সাইডবার > Payroll > Salary Generation Tab > 'Bulk View / Process'",
        content: "Generate balanced salary sheets for all employees in seconds. Auto-calculates earnings, attendance cuts, and loan EMIs, then compiles printable PDF pay-slips with WhatsApp/Email share links.",
        bnContent: "এক ক্লিকে সকল কর্মচারীর স্যালারি শিট তৈরি করুন। সিস্টেম রিয়েল-টাইমে উপস্থিতি ও কিস্তি সমন্বয় করে প্রদেয় নেট স্যালারি বের করে এবং প্রিন্টযোগ্য পে-স্লিপ তৈরি করে।"
      }
    ]
  },
  {
    id: "crm",
    iconName: "user-check",
    badge: "CRM",
    title: "CRM Pipeline & Deal Management",
    bnTitle: "সিআরএম ও সেলস পাইপলাইন",
    description: "Track sales leads from prospecting to closing. Convert won deals directly into customer ledgers and sales invoices.",
    bnDescription: "নতুন কাস্টমার লিড সংগ্রহ, ফলো-আপ ট্র্যাকিং এবং লিড জিতে যাওয়ার সাথে সাথে সরাসরি সেলস ইনভয়েসে রূপান্তর করার গাইড।",
    sections: [
      {
        id: "crm-pipeline",
        title: "7.1 Managing Sales Leads & Stages",
        bnTitle: "৭.১ সেলস লিড ট্র্যাকিং ও পাইপলাইন স্টেজ",
        path: "/crm",
        planBadge: "All Plans",
        whereToFind: "Sidebar > CRM > Leads Pipeline",
        bnWhereToFind: "সাইডবার > CRM > Leads Pipeline",
        content: "Track prospective buyers across stages: New Lead, Contacted, Proposal Sent, In Negotiation, and Deal Won. Convert won leads into official sales invoices with 1-click.",
        bnContent: "সম্ভাব্য ক্রেতাদের স্টেজ অনুযায়ী ট্র্যাক করুন: নতুন লিড, যোগাযোগ সম্পন্ন, প্রস্তাবনা পাঠানো, দর কষাকষি এবং সম্পন্ন ডিল।"
      }
    ]
  },
  {
    id: "reports",
    iconName: "bar-chart-2",
    badge: "Auditing",
    title: "Financial Reports & Audit Statements",
    bnTitle: "আর্থিক অডিট ও পূর্ণাঙ্গ রিপোর্টস",
    description: "Generate Trial Balances, Balance Sheets, Profit & Loss statements, Cash/Bank books, Daybooks, and Inventory stock summaries.",
    bnDescription: "ট্রায়াল ব্যালেন্স, ব্যালেন্স শীট, লাভ-ক্ষতির খতিয়ান, ক্যাশ ও ব্যাংক বই এবং স্টক অডিট রিপোর্টের সম্পূর্ণ নির্দেশিকা।",
    sections: [
      {
        id: "rep-trial",
        title: "8.1 Trial Balance Verification",
        bnTitle: "৮.১ ট্রায়াল ব্যালেন্স ও গাণিতিক নির্ভুলতা যাচাই",
        path: "/reports/trial-balance",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Reports > Trial Balance",
        bnWhereToFind: "সাইডবার > Reports > Trial Balance",
        content: "Verify that total debit balances equal credit balances across all ledger hierarchies before finalizing financial statements.",
        bnContent: "চূড়ান্ত হিসাবের আগে নিশ্চিত করুন যে সকল ডেবিট ব্যালেন্সের মোট যোগফল ক্রেডিট ব্যালেন্সের শতভাগ সমান রয়েছে।"
      },
      {
        id: "rep-pl",
        title: "8.2 Profit & Loss (P&L) Statement",
        bnTitle: "৮.২ লাভ-ক্ষতি (P&L) হিসাব বিশ্লেষণ",
        path: "/reports/pl",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Reports > Profit & Loss",
        bnWhereToFind: "সাইডবার > Reports > Profit & Loss",
        content: "Track business performance across any custom date range. Calculates Gross Profit (Sales - Direct Cost) and Net Profit (Gross Profit - Indirect Expenses).",
        bnContent: "যেকোনো তারিখের জন্য ব্যবসার মোট লাভ (Gross Profit) এবং নিট লাভ (Net Profit) বিশ্লেষণ করুন।"
      },
      {
        id: "rep-bs",
        title: "8.3 Balance Sheet & Net-Worth Audit",
        bnTitle: "৮.৩ ব্যালেন্স শীট ও আর্থিক স্থিতিপত্র",
        path: "/reports/balance-sheet",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Reports > Balance Sheet",
        bnWhereToFind: "সাইডবার > Reports > Balance Sheet",
        content: "The master financial statement displaying total Assets (Fixed, Bank, Cash, Stock, Debtors) balanced against total Liabilities & Capital (Equity, Loans, Creditors).",
        bnContent: "প্রতিষ্ঠানের মোট সম্পদ (ক্যাশ, ব্যাংক, স্টক, পাওনা) এবং মোট দায় ও মূলধনের সমতা নিশ্চিতকারী প্রধান আর্থিক বিবরণী।"
      },
      {
        id: "rep-daybook",
        title: "8.4 Daybook & Ledger Statements",
        bnTitle: "৮.৪ ডে-বুক ও লেজার স্টেটমেন্ট",
        path: "/reports/daybook",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Reports > Daybook (or Ledger Statement)",
        bnWhereToFind: "সাইডবার > Reports > Daybook (বা Ledger Statement)",
        content: "Chronological audit trail of all transactions recorded on any specific day. Drill down into individual party ledgers to reconcile customer or vendor balances.",
        bnContent: "প্রতিদিনের সকল লেনদেনের সময়ানুক্রমিক তালিকা এবং যেকোনো নির্দিষ্ট কাস্টমার বা সাপ্লায়ারের বিস্তারিত খতিয়ান।"
      },
      {
        id: "rep-due-alerts",
        title: "8.5 Due Payment Alerts, Overdue Aging & Legal Demand Notices",
        bnTitle: "৮.৫ বকেয়া রিমাইন্ডার, দেনাদার এজিং ও লিগ্যাল ডিমান্ড নোটিশ",
        path: "/reports/due-payments",
        hotkey: "Alt+D",
        planBadge: "All Plans",
        whereToFind: "Dashboard 'Due Payment Alerts' shortcut & alert badge (All layouts) | Sidebar > Reports > Due Payment Alerts | URL /reports/due-payments",
        bnWhereToFind: "ড্যাশবোর্ড 'Due Payment Alerts' শর্টকাট ও ব্যানার (সকল লেআউটেই) | সাইডবার > Reports > Due Payment Alerts | সরাসরি লিংক /reports/due-payments",
        content: "Comprehensive receivables recovery engine and automated debt collection management.\n\n### Why Use This Feature (কেন ব্যবহার করবেন):\n1. Protect Business Liquidity: Eliminate cash shortages by speeding up debtor collections and lowering Days Sales Outstanding (DSO).\n2. Prevent Bad Debts: Track overdue invoices across aging brackets (0-15d, 16-30d, 31-60d, 60+d) before receivables become uncollectible.\n3. 1-Click Multi-Channel Reminders: Instantly dispatch pre-formatted payment notices via WhatsApp, SMS, or Email directly to customer contacts.\n4. Formal Legal Demand Notices: Generate lawyer-grade printed payment demand letters on company letterhead with bank routing and overdue invoices breakdown.\n5. Documented Call History: Log every phone follow-up with customer promises-to-pay and scheduled callback dates for internal team accountability.\n\n### How to Use Step-by-Step (কীভাবে ব্যবহার করবেন):\n1. Open Due Payment Alerts: Click the 'Due Payment Alerts' card on the Dashboard (works in both Standard and Minimalist Splash layouts) or navigate to Sidebar > Reports > Due Payment Alerts.\n2. Filter by Aging Bracket: Click filter chips (0-15 Days, 16-30 Days, 31-60 Days, 60+ Days Critical) to prioritize delinquent debtors.\n3. Send Instant Reminder: Click the WhatsApp, SMS, or Email button next to any debtor. The system generates a personalized message with exact balance, due date, and your company bank account details.\n4. Print Legal Demand Notice: Click the 'Legal Notice' button to generate a formal, lawyer-standard demand letter with official company header, invoice schedule, and signature block.\n5. Log Call Notes: Click 'Log Call' to enter summaries of phone commitments, check numbers promised, and repayment deadlines.\n6. Export Aging Sheet: Click 'Export CSV' to export the complete debtor list for management and recovery review.",
        bnContent: "বকেয়া আদায় গতিশীলকরণ এবং স্বয়ংক্রিয় দেনাদার অনুসরণের পূর্ণাঙ্গ সমাধান।\n\n### কেন ব্যবহার করবেন (Why Use This Feature):\n১. তারল্য সংকট প্রতিরোধ: কাস্টমারদের কাছ থেকে সময়মতো বকেয়া টাকা তুলে আনার মাধ্যমে নগদ টাকার প্রবাহ স্বাভাবিক রাখে।\n২. মন্দ ঋণ (Bad Debt) দূরীকরণ: বকেয়ার বয়স অনুযায়ী (০-১৫ দিন, ১৬-৩০ দিন, ৩১-৬০ দিন, ৬০+ দিন) সময়মতো তাগাদা দিয়ে বকেয়া টাকা আটকে যাওয়া প্রতিরোধ করে।\n৩. ১ ক্লিকে মাল্টি-চ্যানেল রিমাইন্ডার: হোয়াটসঅ্যাপ, এসএমএস বা ইমেলের মাধ্যমে মুহূর্তেই কাস্টমারের মোবাইলে পাওনার পরিমাণ ও ব্যাংক একাউন্ট নম্বরসহ মেসেজ পাঠানোর সুবিধা।\n৪. প্রাতিষ্ঠানিক লিগ্যাল ডিমান্ড নোটিশ: কোম্পানির নিজস্ব প্যাডে ব্যাংক হিসাব নম্বর ও চালানের বিবরণসহ আইনজীবীর নোটিশের মতো আনুষ্ঠানিক ডিমান্ড লেটার প্রিন্ট করার ব্যবস্থা।\n৫. ফলো-আপ কল ডায়রি: দেনাদারের সাথে ফোনে কথা বলে তারা কী প্রতিশ্রুতি দিল এবং কবে টাকা পরিশোধ করবে তা সিস্টেমে নোট আকারে সংরক্ষণ করা যায়।\n\n### কীভাবে ব্যবহার করবেন (Step-by-Step Usage Guide):\n১. মডিউলে প্রবেশ: হোম ড্যাশবোর্ডের 'Due Payment Alerts' কার্ড বা ব্যানার থেকে (স্ট্যান্ডার্ড ও মিনিমালিস্ট স্প্ল্যাশ উভয় লেআউটেই রয়েছে) অথবা সাইডবার > Reports > Due Payment Alerts এ যান।\n২. বকেয়া ফিল্টারিং: ০-১৫ দিন, ১৬-৩০ দিন, ৩১-৬০ দিন বা ৬০+ দিন (ঝুঁকিপূর্ণ) ফিল্টারে ক্লিক করে সবচেয়ে পুরনো দেনাদারদের আলাদা করুন।\n৩. রিমাইন্ডার প্রেরণ: সংশ্লিষ্ট কাস্টমারের পাশে থাকা WhatsApp, SMS বা Email বাটনে ক্লিক করুন। স্বয়ংক্রিয়ভাবে মোট বকেয়া ও ব্যাংক হিসাব সহ মেসেজ প্রস্তুত হয়ে যাবে।\n৪. লিগ্যাল ডিমান্ড নোটিশ প্রিন্ট: 'Legal Notice' বাটনে ক্লিক করে প্রাতিষ্ঠানিক লেটারহেডে আনুষ্ঠানিক তাগাদাপত্র প্রস্তুত করুন এবং প্রিন্ট বা পিডিএফ সেভ করুন।\n৫. কল লগ সংরক্ষণ: 'Log Call' বাটনে ক্লিক করে কাস্টমারের আশ্বাস, চেক দেওয়ার তারিখ ইত্যাদি নোট লিখে রাখুন।\n৬. এক্সেল এক্সপোর্ট: 'Export CSV' ক্লিক করে মিটিং বা অডিটের জন্য সকল দেনাদারের তালিকা ডাউনলোড করুন।",
        points: [
          "Dynamic Aging Buckets: Categorized into 0-15d, 16-30d, 31-60d, and 60+d critical exposure tiers.",
          "Automated Message Placeholders: Supports {{customerName}}, {{dueAmount}}, {{currency}}, and {{companyName}}.",
          "Court-Ready Legal Notices: Includes invoice schedules, interest notice warnings, and official company seals.",
          "Direct Dashboard Badges: Prominently featured across all dashboard design layouts."
        ],
        bnPoints: [
          "স্বয়ংক্রিয় এজিং ক্যাটাগরি: ০-১৫ দিন, ১৬-৩০ দিন, ৩১-৬০ দিন ও ৬০+ দিন অনুযায়ী স্বয়ংক্রিয় গ্রুপিং।",
          "ডাইনামিক টেমপ্লেট ট্যাগ: কাস্টমারের নাম, বকেয়া টাকার পরিমাণ ও কোম্পানির নাম স্বয়ংক্রিয়ভাবে বসে যায়।",
          "আনুষ্ঠানিক আইনি নোটিশ: চালানের তালিকা, ব্যাংকের বিস্তারিত ও স্বাক্ষরের ঘর সহ স্ট্যান্ডার্ড নোটিশ ফরম্যাট।",
          "ড্যাশবোর্ডে সার্বক্ষণিক অ্যালার্ট: মিনিমালিস্ট স্প্ল্যাশ সহ সকল ড্যাশবোর্ডেই নোটিফিকেশন প্রদর্শন।"
        ],
        fields: [
          { name: "Debtor Name & Phone", bnName: "কাস্টমারের নাম ও মোবাইল", type: "Ledger", description: "Customer account and primary mobile number for messaging.", bnDescription: "গ্রাহকের নাম এবং মেসেজ পাঠানোর জন্য মোবাইল নম্বর।" },
          { name: "Overdue Amount", bnName: "বকেয়ার পরিমাণ", type: "Currency", description: "Net outstanding closing balance derived from sales and receipts.", bnDescription: "বিক্রয় ও আদায়ের পর গ্রাহকের কাছে মোট বকেয়ার স্থিতি।" },
          { name: "Aging Bucket", bnName: "বকেয়ার বয়স", type: "Category", description: "Age tier (0-15d, 16-30d, 31-60d, 60+d) based on last invoice date.", bnDescription: "সর্বশেষ চালানের তারিখ থেকে কত দিন পার হয়েছে তার হিসাব।" }
        ],
        example: {
          scenario: "Distributor recovering ৳85,000 from an overdue retail merchant (45 days unpaid).",
          bnScenario: "একটি পরিবেশক প্রতিষ্ঠান যার এক খুচরা বিক্রেতার কাছে ৪৫ দিন যাবত ৮৫,০০০ টাকা বকেয়া পড়ে আছে।",
          steps: [
            "Open Due Payment Alerts and select the '31-60 Days' filter.",
            "Click the WhatsApp icon next to the merchant's name; a professional reminder with bank coordinates is sent in 2 seconds.",
            "Click 'Log Call' and note: 'Merchant promised bank transfer by Thursday 3 PM'.",
            "On Friday, if unpaid, click 'Legal Notice' and send a formal written demand notice on company letterhead."
          ],
          bnSteps: [
            "Due Payment Alerts পেজে গিয়ে '31-60 Days' ফিল্টার সিলেক্ট করলেন।",
            "কাস্টমারের নামের পাশে WhatsApp বাটনে চাপ দিলেন; ২ সেকেন্ডেই পাওনার বিস্তারিত ও ব্যাংক একাউন্ট সহ মেসেজ চলে গেল।",
            "'Log Call' এ গিয়ে লিখলেন: 'কাস্টমার বৃহস্পতিবার বিকাল ৩টার মধ্যে ব্যাংকে জমা দেওয়ার প্রতিশ্রুতি দিয়েছেন'।",
            "শুক্রবার টাকা জমা না হলে 'Legal Notice' এ ক্লিক করে প্রাতিষ্ঠানিক লেটারহেডে চূড়ান্ত ডিমান্ড লেটার ইস্যু করলেন।"
          ]
        },
        tip: "Send polite automated reminders within 1-15 days, and reserve formal demand notices only for accounts exceeding 45 days.",
        bnTip: "০-১৫ দিনের মধ্যে থাকা গ্রাহকদের নমনীয় ভাষায় সাধারণ রিমাইন্ডার পাঠান এবং ৪৫ দিনের বেশি বকেয়া হলে তবেই আনুষ্ঠানিক লিগ্যাল নোটিশ ইস্যু করুন।"
      },
      {
        id: "rep-audit-trail",
        title: "8.6 Audit Trail & Historical Activity Logs",
        bnTitle: "৮.৬ অডিট ট্রেইল ও কার্যক্রম হিস্ট্রি ট্র্যাকিং",
        path: "/reports/audit-trail",
        hotkey: "Alt+A",
        planBadge: "All Plans",
        whereToFind: "Dashboard 'Audit Trail & Logs' shortcut (All layouts) | Sidebar > Reports > Audit Trail (or Exception Reports) | URL /reports/audit-trail",
        bnWhereToFind: "ড্যাশবোর্ড 'Audit Trail & Logs' শর্টকাট (সকল লেআউটেই) | সাইডবার > Reports > Audit Trail | সরাসরি লিংক /reports/audit-trail",
        content: "Statutory transaction audit logging, data forensics, and auditor review console.\n\n### Why Use This Feature (কেন ব্যবহার করবেন):\n1. Strict Statutory Compliance: Meets MCA, Income Tax, VAT, and ISO corporate accounting standards requiring continuous, tamper-evident audit logs.\n2. Internal Fraud & Error Prevention: Instantly know which staff member created, updated, or deleted a voucher, with exact timestamp and device IP.\n3. Before/After Field Comparison: Deep inspection reveals exactly what ledger amount, quantity, or narration was modified during voucher alterations.\n4. Independent Auditor Workspace: Qualified statutory or internal auditors can inspect logs and append certified review remarks without corrupting ledger balances.\n5. Complete System Transparency: Tracks non-voucher events as well, including ledger alterations, inventory edits, data exports, and logins.\n\n### How to Use Step-by-Step (কীভাবে ব্যবহার করবেন):\n1. Access Audit Trail: Click 'Audit Trail & Logs' on the Dashboard or go to Sidebar > Reports > Audit Trail.\n2. Filter Historical Events: Use quick filter buttons (Create, Update, Delete, Export) and date range presets (Today, 7 Days, 30 Days, Custom).\n3. Inspect Log Details: Click on any log row to open the Log Inspector modal. View author name, user ID, module, description, and exact timestamp.\n4. Compare Changes: For 'UPDATE' logs, view the before/after delta comparing previous values against new values.\n5. Append Auditor Remarks: Statutory auditors can type official verification notes and mark logs as 'Audited / Verified'.\n6. Export Compliance Report: Click 'Print Audit Report' or 'Export CSV' to create physical or digital proof for external tax and audit authorities.",
        bnContent: "আর্থিক লেনদেনের ডিজিটাল অডিট ট্রেইল, ফরেনসিক ট্র্যাকিং এবং নিরীক্ষকদের রিভিউ কনসোল।\n\n### কেন ব্যবহার করবেন (Why Use This Feature):\n১. সরকারি ও আইনি বাধ্যবাধকতা: আয়কর, ভ্যাট আইন এবং ISO স্ট্যান্ডার্ডের আওতায় যেকোনো লেনদেনের অপরিবর্তনীয় পরিবর্তন ট্রেইল থাকা বাধ্যতামূলক।\n২. অভ্যন্তরীণ জালিয়াতি ও ভুল প্রতিরোধ: কোন কর্মী কখন কোন ভাউচার তৈরি, সংশোধন বা মুছে ফেলেছেন তা সুনির্দিষ্ট সময় ও আইপিসহ রেকর্ড থাকে।\n৩. পরিবর্তনের তুলনামূলক যাচাই (Before/After): কোনো ভাউচার এডিট করা হলে আগে কী পরিমাণ বা লেজার ছিল এবং পরে কী করা হয়েছে তার নিখুঁত পার্থক্য দেখা যায়।\n৪. স্বাধীন অডিটর প্যানেল: হিসাবের মূল বই পরিবর্তন না করেই অভ্যন্তরীণ বা সরকারি নিরীক্ষক অডিট ট্রেইলে নিজস্ব প্রত্যয়ন ও মন্তব্য যোগ করতে পারেন।\n৫. সার্বিক সিস্টেমের স্বচ্ছতা: ভাউচারের পাশাপাশি লেজার মাস্টার পরিবর্তন, স্টক এডিট এবং এক্সেল এক্সপোর্ট কার্যক্রমও নজরদারিতে থাকে।\n\n### কীভাবে ব্যবহার করবেন (Step-by-Step Usage Guide):\n১. অডিট ট্রেইলে প্রবেশ: ড্যাশবোর্ডের 'Audit Trail & Logs' শর্টকাট থেকে অথবা সাইডবার > Reports > Audit Trail এ ক্লিক করুন।\n২. ইভেন্ট ফিল্টারিং: অ্যাকশন ফিল্টার (Create, Update, Delete, Export) এবং তারিখের ফিল্টার (আজ, ৭ দিন, ৩০ দিন ইত্যাদি) দিয়ে নির্দিষ্ট ইভেন্ট খুঁজুন।\n৩. বিস্তারিত লগ পরিদর্শণ: যেকোনো লগ লাইনে ক্লিক করলে বিস্তারিত ইনস্পেক্টর ওপেন হবে যেখানে ইউজার নেম, তারিখ, আইপি ও বিবরণ দেখা যাবে।\n৪. পরিবর্তন পর্যালোচনা: 'Update' লগে ক্লিক করে আগের ডাটা এবং নতুন ডাটার হুবহু তুলনামূলক পার্থক্য পরীক্ষা করুন।\n৫. অডিটর মন্তব্য যোগ: নিরীক্ষক সরাসরি 'Add Auditor Note' এ গিয়ে ভাউচারটি যাচাই হয়েছে কিনা তা লিখে সিলমোহর দিতে পারেন।\n৬. অডিট রিপোর্ট তৈরি: অডিট কমিটি বা আয়কর কর্মকর্তার নিকট জমা দেওয়ার জন্য 'Print Audit Report' বা 'Export CSV' ক্লিক করে প্রাতিষ্ঠানিক রিপোর্ট প্রিন্ট করুন।",
        points: [
          "Tamper-Evident Event Stream: Automated background recording for all vouchers, ledgers, items, and exports.",
          "Before vs. After Delta Comparison: Visual diff highlighting modified ledger rows and voucher totals.",
          "Certified Auditor Remarks: Non-destructive compliance notation system for external auditors.",
          "Comprehensive Search & Filters: Real-time filtering by User, Action Type, Module, or Date Range."
        ],
        bnPoints: [
          "অপরিবর্তনীয় ডিজিটাল রেকর্ড: ভাউচার তৈরি, এডিট বা ডিলিটের সাথে সাথে ব্যাকগ্রাউন্ডে স্বয়ংক্রিয় লগ তৈরি হয়।",
          "পূর্বের ও পরের ডাটার পার্থক্য: কোনো এন্ট্রিতে টাকার অংক বদলানো হলে আগের ও বর্তমান মানের ভিজ্যুয়াল তুলনা।",
          "নিরীক্ষকের অফিসিয়াল মন্তব্য: মূল খতিয়ানের ক্ষতি না করে অডিটরদের মন্তব্য ও ভেরিফিকেশন স্ট্যাম্প যুক্ত করার সুযোগ।",
          "শক্তিশালী ফিল্টার: ইউজার, অ্যাকশনের ধরন, মডিউল বা তারিখ দিয়ে মুহূর্তেই যেকোনো কার্যকলাপ খুঁজে বের করার সুবিধা।"
        ],
        fields: [
          { name: "Timestamp & Log ID", bnName: "সময় ও লগ আইডি", type: "Text (Immutable)", description: "Precise date, time, and unique cryptographic log identifier.", bnDescription: "সিস্টেমের সময় এবং স্বতন্ত্র অডিট রেফারেন্স আইডি।" },
          { name: "Action & Module", bnName: "অ্যাকশন ও মডিউল", type: "Category", description: "Action taken (CREATE, UPDATE, DELETE, EXPORT) and target module.", bnDescription: "কী ধরণের কাজ করা হয়েছে এবং কোন মডিউলে কাজ হয়েছে।" },
          { name: "User Details", bnName: "ইউজার পরিচিতি", type: "Profile", description: "Name, email, and user role of the operator performing the action.", bnDescription: "যে অপারেটর কাজটি সম্পন্ন করেছেন তার নাম ও ভূমিকা।" }
        ],
        example: {
          scenario: "An accountant mistakenly edits a sales voucher amount from ৳50,000 to ৳45,000.",
          bnScenario: "হিসাবরক্ষক অসাবধানতাবশত একটি সেলস চালানের টাকার অংক ৫০,০০০ টাকার স্থলে ৪৫,০০০ টাকা এডিট করলেন।",
          steps: [
            "Managing Director notices a disparity in sales register.",
            "Opens Audit Trail and filters by 'Action: Update' and 'Module: Vouchers'.",
            "Instantly sees the exact timestamp, accountant's username, and previous amount (৳50,000) vs new amount (৳45,000).",
            "Auditor leaves a remark and instructs rectification without confrontation."
          ],
          bnSteps: [
            "ব্যবস্থাপনা পরিচালক সেলস রেজিস্টারে টাকার গরমিল লক্ষ্য করলেন।",
            "Audit Trail ওপেন করে 'Action: Update' এবং 'Module: Vouchers' ফিল্টার করলেন।",
            "মুহূর্তেই দেখতে পেলেন কোন তারিখে, কোন হিসাবরক্ষক ৫০,০০০ টাকার স্থলে ৪৫,০০০ টাকা সংশোধন করেছেন।",
            "অডিটর সেখানে মন্তব্য লিখে দিলেন এবং ভুলটি সাথে সাথে সংশোধন করা সম্ভব হলো।"
          ]
        },
        tip: "Regularly export weekly audit trail summaries to encrypted offline storage to maintain multi-year statutory compliance.",
        bnTip: "প্রতি সপ্তাহের শেষে অডিট ট্রেইলটি এক্সপোর্ট করে ব্যাকআপ রাখুন যাতে যেকোনো বার্ষিক সরকারি বা প্রাতিষ্ঠানিক অডিটে দ্রুত প্রমাণপত্র পেশ করা যায়।"
      }
    ]
  },
  {
    id: "settings",
    iconName: "settings",
    badge: "Admin",
    title: "System Settings & Founder Controls",
    bnTitle: "সিস্টেম সেটিংস ও প্রতিষ্ঠাতা প্যানেল",
    description: "Configure company details, logo backgrounds, invoice print formats, theme styles (Firebase Console Light/Dark), roles, and help doc screenshot management.",
    bnDescription: "কোম্পানি প্রোফাইল, লোগো ব্যাকগ্রাউন্ড, ইনভয়েস ফরম্যাট, ইউজার রোল পারমিশন এবং হেল্প ডক স্ক্রিনশট ম্যানেজমেন্ট গাইড।",
    sections: [
      {
        id: "set-branding",
        title: "9.1 Company Profile & Logo Background Styling",
        bnTitle: "৯.১ কোম্পানি প্রোফাইল ও লোগো ব্যাকগ্রাউন্ড কাস্টমাইজেশন",
        path: "/settings",
        hotkey: "Alt+S",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Settings > Company Tab (or Founder Panel > Branding)",
        bnWhereToFind: "সাইডবার > Settings > Company Tab (অথবা Founder Panel > Branding)",
        content: "Upload corporate logos, set your brand slogan, and configure custom logo backgrounds (Transparent, Pure White, or Custom Colors) to guarantee crisp logo visibility in the sidebar.",
        bnContent: "কোম্পানির লোগো আপলোড করুন, স্লোগান দিন এবং সাইডবারে লোগো সুন্দরভাবে ফুটিয়ে তুলতে লোগো ব্যাকগ্রাউন্ড (স্বচ্ছ, সাদা বা কাস্টম কালার) নির্বাচন করুন।"
      },
      {
        id: "set-themes",
        title: "9.2 UI Styles & Firebase Console Light Theme",
        bnTitle: "৯.২ ইউআই স্টাইল ও ফায়ারবেস কনসোল লাইট থিম",
        path: "/settings/ui",
        planBadge: "All Plans",
        whereToFind: "Sidebar > Settings > UI Style Tab",
        bnWhereToFind: "সাইডবার > Settings > UI Style Tab",
        content: "Choose between different navigation layouts: Firebase Console Light/Dark, Classic Tally, macOS, or Colorful modern themes.",
        bnContent: "আপনার পছন্দের নেভিগেশন স্টাইল বেছে নিন: ফায়ারবেস কনসোল লাইট/ডার্ক, ক্ল্যাসিক ট্যালি, ম্যাক-ওএস বা কালারফুল থিম।"
      },
      {
        id: "set-screenshots",
        title: "9.3 Help Docs Screenshot Manager (For Founders)",
        bnTitle: "৯.৩ হেল্প ডক স্ক্রিনশট ম্যানেজার (প্রতিষ্ঠাতা বা অ্যাডমিনদের জন্য)",
        path: "/founder",
        planBadge: "Founder Only",
        whereToFind: "Help Docs Header > 'Manage Screenshots' (or Founder Panel > Help Docs)",
        bnWhereToFind: "হেল্প ডক হেডার > 'Manage Screenshots' (অথবা Founder Panel > Help Docs)",
        content: "Founders and Admins can upload real screenshots (PNG/JPG/WebP) or paste image URLs for any specific documentation topic. The uploaded images automatically display in the public help center, overriding the default interactive emulator.",
        bnContent: "প্রতিষ্ঠাতা ও অ্যাডমিনরা যেকোনো বিষয়ের জন্য সরাসরি বাস্তব স্ক্রিনশট আপলোড করতে পারবেন। আপলোড করা ছবিগুলো তাৎক্ষণিকভাবে পাবলিক হেল্প সেন্টারে প্রদর্শিত হবে।"
      }
    ]
  },
  {
    id: "shortcuts",
    iconName: "keyboard",
    badge: "Hotkeys",
    title: "Keyboard Shortcuts & Hotkeys",
    bnTitle: "কিবোর্ড শর্টকাট গাইড (পাওয়ার ইউজার)",
    description: "Accelerate your data entry speed. Complete invoices, navigation, and audits in seconds using keyboard shortcuts.",
    bnDescription: "মাউস স্পর্শ না করেই কিবোর্ডের মাধ্যমে দ্রুত ভাউচার তৈরি ও নেভিগেশন করার সমস্ত শর্টকাট কী।",
    sections: [
      {
        id: "key-hotkeys",
        title: "10.1 Global Hotkeys Reference",
        bnTitle: "১০.১ গ্লোবাল কিবোর্ড শর্টকাট তালিকা",
        path: "/dashboard",
        planBadge: "All Plans",
        whereToFind: "Accessible globally across all screens",
        bnWhereToFind: "সিস্টেমের যেকোনো স্ক্রিনে ব্যবহারযোগ্য",
        content: "Use these key commands anywhere in the application to trigger instant workflows:",
        bnContent: "দ্রুত কাজের জন্য নিচের কিবোর্ড কম্বিনেশনগুলো ব্যবহার করুন:",
        points: [
          "F8 -> Record Sales Invoice (সেলস ভাউচার)",
          "F9 -> Record Purchase Invoice (ক্রয় ভাউচার)",
          "F5 -> Record Outgoing Payment (পেমেন্ট ভাউচার)",
          "F6 -> Record Incoming Receipt (রিসিট ভাউচার)",
          "F4 -> Internal Contra Transfer (কন্ট্রা ভাউচার)",
          "Cmd+K / Ctrl+K or '/' -> Launch Global Search (গ্লোবাল সার্চ)",
          "Alt+D -> Jump to Dashboard (ড্যাশবোর্ডে যান)",
          "Alt+V -> Create New Voucher (নতুন ভাউচার এন্ট্রি)",
          "Alt+L -> Ledgers & Accounts Setup (লেজার সেটআপ)",
          "Alt+I -> Stock Inventory Master (স্টক ইনভেন্টরি)",
          "Alt+S -> Global System Settings (সিস্টেম সেটিংস)"
        ],
        bnPoints: [
          "F8 -> নতুন সেলস ইনভয়েস খুলতে",
          "F9 -> নতুন পারচেজ বা ক্রয় বিল খুলতে",
          "F5 -> পেমেন্ট ভাউচার খুলতে",
          "F6 -> রিসিট বা টাকা জমার ভাউচার খুলতে",
          "F4 -> কন্ট্রা ফান্ড স্থানান্তর খুলতে",
          "Cmd+K / Ctrl+K অথবা '/' -> গ্লোবাল সার্চ উইন্ডো চালু করতে",
          "Alt+D -> ড্যাশবোর্ডে ফিরে যেতে",
          "Alt+V -> ভাউচার এন্ট্রি স্ক্রিনে যেতে",
          "Alt+L -> লেজার তালিকায় যেতে",
          "Alt+I -> স্টক ইনভেন্টরি পেজে যেতে",
          "Alt+S -> সেটিংস পেজে যেতে"
        ]
      }
    ]
  },
  {
    id: "faq",
    iconName: "help-circle",
    badge: "FAQ",
    title: "Frequently Asked Questions (FAQ)",
    bnTitle: "সাধারণ জিজ্ঞাসা ও সমাধান (FAQ)",
    description: "Clear solutions to common bookkeeping questions, inventory reconciliation, and troubleshooting.",
    bnDescription: "হিসাব মেলানো, লাভ-ক্ষতির সাথে ক্যাশ ব্যালেন্সের পার্থক্য এবং সাধারণ সমস্যা সমাধানের প্রশ্নোত্তর।",
    sections: [
      {
        id: "faq-profit-cash",
        title: "Q: Why does my Profit & Loss profit not match my physical Cash in Hand?",
        bnTitle: "প্রশ্ন: লাভ-ক্ষতির মুনাফার পরিমাণ কেন ক্যাশ ইন হ্যান্ডের সাথে হুবহু মিলছে না?",
        content: "Accounting follows the Accrual model, not cash accounting. If you make credit sales (F8 Voucher) to customers, your revenue rises immediately in the P&L statement, but your cash in hand only increases when the customer actually pays via a Receipt Voucher (F6).",
        bnContent: "আমাদের সফটওয়্যার স্ট্যান্ডার্ড এক্রুয়াল (বকেয়া ভিত্তিক) হিসাববিজ্ঞান মডেল অনুসরণ করে। বাকিতে পণ্য বিক্রয় করলে লাভ-ক্ষতির স্টেটমেন্টে লাভ যোগ হয়, কিন্তু বাস্তবে কাস্টমার টাকা পরিশোধ না করা পর্যন্ত ক্যাশ ড্রয়ারে টাকা জমা হয় না। টাকা গ্রহণের পর রিসিট ভাউচারের মাধ্যমে ক্যাশ ব্যালেন্স বৃদ্ধি পায়।",
        tip: "Generate the Cash Flow report under Reports > Cash Flow to audit real-time cash inflows versus outflows.",
        bnTip: "বাস্তব নগদ প্রবাহ দেখতে Reports > Cash Flow স্টেটমেন্টটি দেখুন।"
      },
      {
        id: "faq-negative-stock",
        title: "Q: Can I sell items when physical stock balance is zero?",
        bnTitle: "প্রশ্ন: স্টকে পণ্য না থাকলে বা ব্যালেন্স শূন্য থাকলে কি সেলস বিল করা সম্ভব?",
        content: "By default, the ERP allows negative sales warning prompts if configured in Settings > Features > Negative Stock. However, we recommend entering the Purchase Voucher (F9) first to maintain strict audit integrity and average cost calculations.",
        bnContent: "ডিফল্টভাবে সেটিংসে অনুমতি থাকলে নেগেটিভ স্টকে ওয়ার্নিং দিয়ে বিল করা যায়। তবে অডিট এবং গড় ক্রয়মূল্য সঠিক রাখতে আগে পারচেজ ভাউচার (F9) এন্ট্রি দেওয়া উত্তম।"
      },
      {
        id: "faq-custom-screenshots",
        title: "Q: Can I upload my own real screenshots into these Help Docs?",
        bnTitle: "প্রশ্ন: আমি কি এই হেল্প ডকে আমার নিজের অ্যাপের আসল স্ক্রিনশট আপলোড করতে পারব?",
        content: "Yes! Founders and Admins can click 'Manage Screenshots' in the top header or in the Founder Panel. You can upload high-resolution screenshots for any topic, and they will immediately be visible to all users in the public Help Center.",
        bnContent: "হ্যাঁ! প্রতিষ্ঠাতা বা অ্যাডমিনরা টপ হেডারে থাকা 'Manage Screenshots' বাটনে ক্লিক করে যেকোনো বিষয়ের জন্য নিজস্ব স্ক্রিনশট আপলোড করতে পারবেন। আপলোড করার সাথে সাথে তা সবার জন্য দৃশ্যমান হবে।"
      }
    ]
  },
  {
    id: "desktop-app",
    iconName: "layers",
    badge: "Desktop .EXE",
    title: "Desktop Application & Offline Database",
    bnTitle: "ডেস্কটপ সফটওয়্যার ও অফলাইন ডাটাবেজ গাইড",
    description: "Guide on how to convert, install, and run this ERP as an offline Desktop Software (.exe) on Windows with local database storage.",
    bnDescription: "উইন্ডোজ কম্পিউটারে সফটওয়্যার (.exe) হিসেবে ইন্সটল, ইন্টারনেট ছাড়া অফলাইনে চালানো এবং লোকাল ডাটাবেজ ব্যাকআপ ব্যবস্থাপনার নিয়মাবলী।",
    sections: [
      {
        id: "desktop-overview",
        title: "Desktop Application Software (.exe) Overview",
        bnTitle: "ডেস্কটপ সফটওয়্যার (.exe) পরিচিতি ও সুবিধা",
        content: "You can run this ERP both as a Web Application in browsers and as a native Desktop Application Software on Windows/Mac. In desktop mode, data is securely stored right on the user's computer hard disk (Offline SQLite / Dexie), requiring zero internet connection.",
        bnContent: "আপনার এই সম্পূর্ণ ERP সিস্টেমটি একই সাথে ব্রাউজারে অনলাইন ওয়েব অ্যাপ হিসেবে এবং উইন্ডোজ পিসিতে ইনস্টল করা অফলাইন ডেস্কটপ সফটওয়্যার (.exe) হিসেবে চলতে পারে। ডেস্কটপ মোডে কোনো ইন্টারনেট সংযোগ লাগে না এবং সকল ডাটা সরাসরি কম্পিউটারের নিজস্ব হার্ডড্রাইভে নিরাপদে সংরক্ষিত থাকে।",
        whereToFind: "Electron Configuration / Settings > Data Management",
        bnWhereToFind: "ইলেকট্রন কনফিগারেশন / সেটিংস > ডাটা ব্যাকআপ",
        points: [
          "1. 100% Offline Billing: Make sales, vouchers, invoices, and payroll entries without internet.",
          "2. Zero Database Cost: Eliminates cloud bandwidth, monthly Firestore bills, or read quota limits.",
          "3. Native Printer Speed: Lightning-fast receipt and invoice printing with POS & Thermal printers.",
          "4. Single Click Backup: Export your entire company database into a single file (.json / .db) to flash drive."
        ],
        bnPoints: [
          "১. ১০০% অফলাইন বিলিং: কোনো ইন্টারনেট সংযোগ ছাড়াই সেলস বিল, ভাউচার এন্ট্রি, ইনভেন্টরি ও বেতন তৈরি করুন।",
          "২. জিরো ক্লাউড খরচ: কোনো ক্লাউড ডাটাবেজ রিড কোটা বা মাসিক বিলের ঝামেলা নেই।",
          "৩. সুপার ফাস্ট প্রিন্টিং: থার্মাল ও লেজার প্রিন্টারে সাথে সাথে ইনভয়েস প্রিন্ট করার সুবিধা।",
          "৪. ১-ক্লিকে পেনড্রাইভ ব্যাকআপ: সম্পূর্ণ ডাটাবেজ একটি ফাইলে এক্সপোর্ট করে পেনড্রাইভে সংরক্ষণ করুন।"
        ],
        tip: "Updating features in the desktop app will NEVER delete or corrupt your stored local database records.",
        bnTip: "সফটওয়্যার আপডেট করলেও কম্পিউটারে আগে থেকে তৈরি করা কোনো ভাউচার বা লেজারের ডাটা নষ্ট হবে না।"
      },
      {
        id: "desktop-packaging-steps",
        title: "How to Build & Package into Windows Setup (.exe)",
        bnTitle: "কীভাবে Windows Setup (.exe) তৈরি করবেন (Build Guide)",
        content: "Follow this simple 3-step packaging command to generate your standalone installer 'TallyFlow-Setup.exe' using Electron-Builder.",
        bnContent: "নিচের ৩টি সহজ কমান্ড দিয়ে আপনি আপনার প্রজেক্টকে সরাসরি উইন্ডোজ ইনস্টলার ফাইলে (.exe) রূপান্তর করতে পারেন:",
        whereToFind: "Terminal / Command Prompt in your project folder",
        bnWhereToFind: "প্রজেক্টের টার্মিনাল বা কমান্ড প্রম্পট",
        points: [
          "Step 1: Install electron & electron-builder (npm install -D electron electron-builder).",
          "Step 2: Run 'npm run build' to generate the production React web bundle.",
          "Step 3: Run 'npx electron-builder --win' to produce the final 'dist/TallyFlow-Setup.exe' file.",
          "Step 4: Distribute and install 'TallyFlow-Setup.exe' on any Windows computer!"
        ],
        bnPoints: [
          "ধাপ ১: টার্মিনালে কমান্ড দিন: npm install -D electron electron-builder",
          "ধাপ ২: ওয়েব বান্ডিল তৈরি করতে কমান্ড দিন: npm run build",
          "ধাপ ৩: ইনস্টলার বানাতে কমান্ড দিন: npx electron-builder --win",
          "ধাপ ৪: 'dist' ফোল্ডারে 'TallyFlow-Setup.exe' তৈরি হয়ে যাবে; এটি যেকোনো পিসিতে ইনস্টল করতে পারবেন।"
        ],
        example: {
          scenario: "Installing on a retail shop computer with no internet",
          bnScenario: "ইন্টারনেটবিহীন দোকানে বা অফিসে নতুন সফটওয়্যার ইন্সটল",
          steps: [
            "1. Copy 'TallyFlow-Setup.exe' to a USB Pendrive.",
            "2. Plug into the shop's computer and double-click to install.",
            "3. The desktop icon will appear on desktop. Launch and start creating companies and billing offline!"
          ],
          bnSteps: [
            "১. পেনড্রাইভে 'TallyFlow-Setup.exe' ফাইলটি কপি করুন।",
            "২. দোকানে থাকা কম্পিউটারে ডাবল-ক্লিক করে ইনস্টল করুন।",
            "৩. ডেস্কটপে আইকন আসবে; ক্লিক করলেই অফলাইনে ক্যাশ বিলিং ও হিসাব রাখা শুরু হবে।"
          ]
        }
      },
      {
        id: "desktop-backup-restore",
        title: "1-Click Offline Data Backup & Migration",
        bnTitle: "১-ক্লিকে অফলাইন ডাটা ব্যাকআপ ও রিস্টোর করার নিয়ম",
        content: "To safeguard against computer hardware failure or Windows reinstall, use the built-in 1-Click Backup tool to save your database to USB drive or external storage.",
        bnContent: "কম্পিউটার নষ্ট হওয়া বা উইন্ডোজ পরিবর্তনের ঝুঁকি এড়াতে 'Settings > Data Backup' অপশন থেকে নিয়মিত ১-ক্লিকে পেনড্রাইভে ব্যাকআপ রাখুন।",
        whereToFind: "Settings > Data Management > Backup & Restore",
        bnWhereToFind: "সেটিংস > ডাটা ম্যানেজমেন্ট > ব্যাকআপ ও রিস্টোর",
        points: [
          "1. Click 'Export Local Backup' to instantly download your complete company ledger, vouchers, items, and settings.",
          "2. Store the downloaded backup file (.json) in a safe USB drive or Google Drive.",
          "3. On any new computer or after reinstall, click 'Import Backup' to restore all vouchers and financial reports in seconds!"
        ],
        bnPoints: [
          "১. 'Export Local Backup' বাটনে ক্লিক করলেই মুহূর্তেই সমস্ত লেজার, ভাউচার ও সেটিংস ব্যাকআপ ফাইল হিসেবে সেভ হবে।",
          "২. ফাইলটি পেনড্রাইভ বা ক্লাউডে নিরাপদ রাখুন।",
          "৩. যেকোনো নতুন কম্পিউটারে ইনস্টল করে 'Import Backup' এ ক্লিক করলেই সাথে সাথে পূর্বের সকল হিসাব হুবহু ফিরে আসবে।"
        ]
      }
    ]
  }
];
