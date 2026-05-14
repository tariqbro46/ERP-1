
export interface HelpSection {
  en: string;
  bn: string;
}

export const HELP_CONTENT: Record<string, HelpSection> = {
  "/dashboard": {
    en: "Overview of your company's financial status, sales trends, and recent transactions. You can see your cash balance, bank balance, total sales, and pending orders at a glance. Use the date picker to filter data for specific periods.",
    bn: "আপনার কোম্পানির আর্থিক অবস্থা, বিক্রয়ের প্রবণতা এবং সাম্প্রতিক লেনদেনের সারসংক্ষেপ। আপনি এক নজরে আপনার ক্যাশ ব্যালেন্স, ব্যাংক ব্যালেন্স, মোট বিক্রয় এবং পেন্ডিং অর্ডার দেখতে পারেন। নির্দিষ্ট সময়ের ডেটা ফিল্টার করতে ডেট পিকার ব্যবহার করুন।"
  },
  "/vouchers/new": {
    en: "Create a new accounting voucher. \n1. Select the Voucher Type (Payment, Receipt, Journal, etc.).\n2. Select the Ledger to debit/credit.\n3. Enter the amount and narration.\n4. Add tax if applicable.\n5. Click Save to record the transaction.",
    bn: "একটি নতুন অ্যাকাউন্টিং ভাউচার তৈরি করুন। \n১. ভাউচারের ধরন নির্বাচন করুন (পেমেন্ট, রিসিট, জার্নাল ইত্যাদি)।\n২. ডেবিট/ক্রেডিট করার জন্য লেজার নির্বাচন করুন।\n৩. পরিমাণ এবং ন্যারেশন লিখুন।\n৪. প্রযোজ্য হলে ট্যাক্স যোগ করুন।\n৫. লেনদেন রেকর্ড করতে সেভ ক্লিক করুন।"
  },
  "/accounts/ledgers/new": {
    en: "Create a new account ledger to track your financial transactions.\n- Assets: Fixed Assets, Current Assets, etc.\n- Liabilities: Loans, Creditors, etc.\n- Income: Sales, Indirect Income.\n- Expenses: Purchase, Indirect Expenses.\nEnsure you select the correct 'Group' for accurate financial reporting.",
    bn: "আপনার আর্থিক লেনদেন ট্র্যাক করতে একটি নতুন অ্যাকাউন্ট লেজার তৈরি করুন।\n- সম্পদ: স্থায়ী সম্পদ, চলতি সম্পদ ইত্যাদি।\n- দায়: ঋণ, পাওনাদার ইত্যাদি।\n- আয়: বিক্রয়, পরোক্ষ আয়।\n- ব্যয়: ক্রয়, পরোক্ষ ব্যয়।\nসঠিক আর্থিক রিপোর্টিংয়ের জন্য সঠিক 'গ্রুপ' নির্বাচন নিশ্চিত করুন।"
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
    en: "Manage your workforce and compensation.\n- Employees: Add new staff and define roles.\n- Attendance: Track daily presence and leaves.\n- Salary Structures: Define basic pay, allowances, and deductions.\n- Pay Slips: Generate and download professional payslips for your team.",
    bn: "আপনার কর্মী বাহিনী এবং ক্ষতিপূরণ পরিচালনা করুন।\n- কর্মচারী: নতুন কর্মী যোগ করুন এবং ভূমিকা নির্ধারণ করুন।\n- উপস্থিতি: প্রতিদিনের উপস্থিতি এবং ছুটি ট্র্যাক করুন।\n- বেতন কাঠামো: বেসিক পে, ভাতা এবং কর্তন নির্ধারণ করুন।\n- পে স্লিপ: আপনার টিমের জন্য প্রফেশনাল পে-স্লিপ তৈরি এবং ডাউনলোড করুন।"
  },
  "/production/orders": {
    en: "Tracking the manufacturing lifecycle.\n- Create Orders: Based on client requirements or stock needs.\n- Track Progress: From 'Planning' to 'Quality Check' to 'Finished'.\n- Resource Allocation: Assign machines and labor to specific tasks.",
    bn: "ম্যানুফ্যাকচারিং লাইফসাইকেল ট্র্যাকিং।\n- অর্ডার তৈরি করুন: ক্লায়েন্টের চাহিদা বা স্টকের প্রয়োজনের ভিত্তিতে তৈরি করুন।\n- অগ্রগতি ট্র্যাক করুন: 'প্ল্যানিং' থেকে 'কোয়ালিটি চেক' হয়ে 'ফিনিশড' পর্যন্ত।\n- রিসোর্স বরাদ্দ: নির্দিষ্ট কাজে মেশিন এবং লেবার নিযুক্ত করুন।"
  },
  "/crm": {
    en: "Customer Relationship Management.\n- Leads: Capture potential customer information.\n- Pipeline: Monitor the conversion journey from lead to client.\n- History: Track past interactions, calls, and emails.\n- Tasks: Set reminders for follow-ups.",
    bn: "কাস্টমার রিলেশনশিপ ম্যানেজমেন্ট।\n- লিডস: সম্ভাব্য কাস্টমারের তথ্য সংগ্রহ করুন।\n- পাইপলাইন: লিড থেকে ক্লায়েন্টে রূপান্তরের যাত্রা পর্যবেক্ষণ করুন।\n- হিস্ট্রি: পূর্ববর্তী কথা-বার্তা, কল এবং ইমেল ট্র্যাক করুন।\n- টাস্কস: ফলো-আপের জন্য রিমাইন্ডার সেট করুন।"
  },
  "/tax-management": {
    en: "Compliance and Tax configuration.\n- Define Tax Types: GST, VAT, Service Tax.\n- Tax Ledger Mapping: Assign specific ledgers for tax collection/payment.\n- Rates: Set percentage rates for different goods or services category.",
    bn: "কমপ্লায়েন্স এবং ট্যাক্স কনফিগারেশন।\n- ট্যাক্সের ধরন নির্ধারণ করুন: GST, VAT, সার্ভিস ট্যাক্স।\n- ট্যাক্স লেজার ম্যাপিং: ট্যাক্স সংগ্রহ/প্রদানের জন্য নির্দিষ্ট লেজার বরাদ্দ করুন।\n- রেট: বিভিন্ন পণ্য বা পরিষেবা ক্যাটাগরির জন্য শতাংশের হার সেট করুন।"
  },
  "/supply-chain": {
    en: "Manage suppliers and purchasing.\n- Suppliers: Maintain a database of your vendors.\n- Purchase Orders: Document your intent to buy goods.\n- Inbound Shipment: Track when goods arrive at your warehouse.\n- Supplier Performance: Analyze lead times and consistency.",
    bn: "সাপ্লায়ার এবং পারচেজিং পরিচালনা করুন।\n- সাপ্লায়ার: আপনার বিক্রেতাদের একটি ডেটাবেস রাখুন।\n- পারচেজ অর্ডার: পণ্য কেনার অভিপ্রায় নথিবদ্ধ করুন।\n- ইনবাউন্ড শিপমেন্ট: আপনার গুদামে পণ্য কখন পৌঁছাবে তা ট্র্যাক করুন।\n- সাপ্লায়ার পারফরম্যান্স: লিড টাইম এবং ধারাবাহিকতা বিশ্লেষণ করুন।"
  },
  "/inventory-advanced": {
    en: "Advanced inventory features.\n- Batch Tracking: Perishable goods or groups of items.\n- Serial Numbers: Track unique electronics or high-value items.\n- Multi-Godown: Transfer stock between different warehouses.\n- Physical Stock: Reconcile system records with actual physical counts.",
    bn: "উন্নত ইনভেন্টরি ফিচার।\n- ব্যাচ ট্র্যাকিং: পচনশীল পণ্য বা আইটেমের গ্রুপের জন্য।\n- সিরিয়াল নম্বর: অনন্য ইলেকট্রনিক্স বা উচ্চ-মূল্যের আইটেম ট্র্যাক করুন।\n- মাল্টি-গোডাউন: বিভিন্ন গুদামের মধ্যে স্টক স্থানান্তর করুন।\n- ফিজিক্যাল স্টক: প্রকৃত ফিজিক্যাল গণনার সাথে সিস্টেম রেকর্ড মিলিয়ে নিন।"
  },
  "/data-center": {
    en: "Export and Data Security.\n- Export: Download reports in Excel, PDF, or JSON format.\n- Share Links: Create view-only access links for external stakeholders.\n- Audit logs: See who made changes to which module and when.",
    bn: "এক্সপোর্ট এবং ডেটা সিকিউরিটি।\n- এক্সপোর্ট: এক্সেল, পিডিএফ বা JSON ফরম্যাটে রিপোর্ট ডাউনলোড করুন।\n- শেয়ার লিঙ্ক: বাহ্যিক স্টেকহোল্ডারদের জন্য ভিউ-অনলি অ্যাক্সেস লিঙ্ক তৈরি করুন।\n- অডিট লগ: দেখুন কে, কখন কোন মডিউলে পরিবর্তন করেছেন।"
  },
  "/ai-insights": {
    en: "AI Analysis of your business data.\n- Trend Prediction: Use history to predict future sales peaks.\n- Smart Query: Use natural language to ask 'What was my highest selling item this month?'.\n- Risk Analysis: Identify potential cashflow issues before they happen.",
    bn: "আপনার ব্যবসায়িক ডেটার AI বিশ্লেষণ।\n- ট্রেন্ড প্রেডিকশন: ভবিষ্যতের বিক্রয়ের শীর্ষ সময় অনুমান করতে হিস্ট্রি ব্যবহার করুন।\n- স্মার্ট কুয়েরি: স্বাভাবিক ভাষায় প্রশ্ন করতে ব্যবহার করুন, যেমন 'এই মাসে আমার সবচেয়ে বেশি বিক্রি হওয়া আইটেম কোনটি?'।\n- ঝুঁকি বিশ্লেষণ: ক্যাশফ্লো সমস্যা ঘটার আগেই তা শনাক্ত করুন।"
  }
};

