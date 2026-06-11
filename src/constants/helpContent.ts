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
    bn: "আপনার ERP সিস্টেমের গ্লোবাল কনফিগারেশন।\n- কোম্পানির বিবরণ: নাম, ঠিকানা, যোগাযোগ, লোগো।\n- UI স্টাইল: বিভিন্ন ডিজাইন থিমের মধ্যে বেছে নিন।\n- ফিচার ম্যানেজমেন্ট: CRM, AI বা সাপ্লাই চেইনের মতো মডিউলগুলো চালু বা বন্ধ করুন।\n- ব্যাকআপ/رিসেট: আপনার কোম্পানির ডেটা নিরাপদে পরিচালনা করুন।"
  },
  "/payroll": {
    en: "Payroll Maintenance Guide:\n1. Employee Setup: Add/Update employees with basic salary and joining dates.\n2. Attendance Entry: Mark daily attendance (Present/Absent/Leave) in the Attendance tab. This affects 'On Attendance' pay heads.\n3. Pay Heads & Structures: Define custom earnings (e.g., HRA) and setup each employee's salary package.\n4. Advance & Loans: Record any employee advances or loans. EMI will be auto-deducted from salary.\n5. Salary Generation: Use 'Bulk View' to generate all pending sheets for the month. All calculations are automated based on attendance and structure.\n6. Distribution: Print or send payslips via WhatsApp/Email.",
    bn: "পেরোল ম্যানেজমেন্ট নির্দেশিকা:\n১. কর্মচারী সেটআপ: বেসিক স্যালারি এবং যোগদানের তারিখ সহ কর্মচারী যোগ করুন বা আপডেট করুন।\n২. উপস্থিতি এন্ট্রি: অ্যাটেনডেন্স ট্যাবে প্রতিদিনের উপস্থিতি (উপস্থিত/অনুপস্থিত/ছুটি) মার্ক করুন। এটি 'উপস্থিতি ভিত্তিক' পে-হেডগুলোকে প্রভাবিত করে।\n৩. পে-হেড এবং কাঠামো: কাস্টম আয় (যেমন: বাড়ি ভাড়া) সংজ্ঞায়িত করুন এবং প্রতিটি কর্মচারীর স্যালারি প্যাকেজ সেটআপ করুন।\n৪. অগ্রিম ও ঋণ: কর্মচারীর অগ্রিম বা ঋণ রেকর্ড করুন। ইএমআই (EMI) বেতন থেকে স্বয়ংক্রিয়ভাবে কাটা হবে।\n৫. বেতন জেনারেশন: মাসের সমস্ত পেন্ডিং শিট তৈরি করতে 'Bulk View' ব্যবহার করুন। উপস্থিতি এবং কাঠামোর উপর ভিত্তি করে সমস্ত গণনা স্বয়ংক্রিয়।\n৬. বিতরণ: পে-স্লিপ প্রিন্ট করুন অথবা হোয়াটসঅ্যাপ/ইমেলের মাধ্যমে পাঠান।"
  }
};

export interface DocSubSection {
  title: string;
  bnTitle: string;
  content: string;
  bnContent: string;
  points?: string[];
  bnPoints?: string[];
  tip?: string;
  bnTip?: string;
  warning?: string;
  bnWarning?: string;
}

export interface DocCategory {
  id: string;
  iconName: string;
  title: string;
  bnTitle: string;
  description: string;
  bnDescription: string;
  sections: DocSubSection[];
}

export const HELP_DOCS: DocCategory[] = [
  {
    id: "getting-started",
    iconName: "rocket",
    title: "Getting Started & Interface",
    bnTitle: "শুরু করার নির্দেশিকা",
    description: "Welcome to the central Command Center. Understand core workspace components and quick navigation keys.",
    bnDescription: "সিস্টেমের মূল ড্যাশবোর্ড এবং নেভিগেশন পরিচিতি। ড্যাশবোর্ডের ডেটা ফিল্টারিং এবং স্পেস ম্যানেজমেন্ট বুঝুন।",
    sections: [
      {
        title: "1.1 System Interface Overview",
        bnTitle: "১.১ ইন্টারফেস ও মূল ফিচার পরিচিতি",
        content: "Our unified ERP software integrates financial bookkeeping, stock logistics, CRM pipeline tracker, manufacturing controls, and automated payroll under a singular secure channel.",
        bnContent: "আমাদের সমন্বিত ERP সফটওয়্যার একই সুরক্ষিত চ্যানেয়ের অধীনে ফাইনান্সিয়াল বুককিপিং, স্টক রসদ, CRM পাইপলাইন ট্র্যাকার, ম্যানুফ্যাকচারিং এবং অটোমেটেড পেরোল সরবরাহ করে।",
        points: [
          "Real-time Balance Feed: Monitor actual cash on hand and live bank statement balances direct from the head panel.",
          "Dynamic Performance Charts: Track sales trajectories and revenue indexes across dynamic custom daily/monthly splits.",
          "Activity Stream Logging: Real-time chronologic logs trace every created voucher ensuring strict auditability.",
          "Core Menu Styles: Switch between classic, colorful, minimalist, or macOS styled layouts in system settings."
        ],
        bnPoints: [
          "রিয়েল-টাইম ব্যালেন্স ফিড: মূল ড্যাশবোর্ডে সরাসরি ক্যাশ অফ হ্যান্ড এবং লাইভ ব্যাংক ব্যালেন্স পর্যবেক্ষণ করুন।",
          "ডায়নামিক চার্ট: দৈনিক ও মাসিক ফিল্টারিং সহ ইনভয়েস ট্র্যাক করুন ও বিক্রয়ের প্রবৃদ্ধি বিশ্লেষণ করুন।",
          "অ্যাক্টিভিটি স্ট্রিম লগিং: প্রতিটি নতুন এন্ট্রি বা ট্রানজেকশন ট্র্যাকিং লগ তৈরি হয় যা অডিট সক্ষমতা বজায় রাখে।",
          "নেভিগেশন স্টাইল: সেটিংস থেকে ক্ল্যাসিক, কালারফুল, মিনিমাল অথবা ম্যাক-ওএস টাইপ নেভিগেশন প্যানেল পরিবর্তন করতে পারেন।"
        ],
        tip: "You can fully collapse the sidebar on desktop screens using the arrow key in the corner to maximize transaction data visibility.",
        bnTip: "লেনদেনের ডেটা আরও গভীরভাবে দেখতে স্ক্রিনের কোণে থাকা তীর চিহ্নিত বাটন চেপে সাইডবারটি কুঁচকে বা ছোট করে নিতে পারেন।"
      },
      {
        title: "1.2 Seamless Global Search Engine",
        bnTitle: "১.২ গ্লোবাল সার্চ ও কুয়েরি কমান্ডার",
        content: "Power users can operate the ERP hands-free. Execute instant navigations or find structural entities using the global search layout.",
        bnContent: "কিবোর্ড পাওয়ার-ইউজাররা মাউস স্পর্শ ছাড়াই সম্পূর্ণ সিস্টেম অপারেট করতে পারবেন। গ্লোবাল সার্চ উইন্ডো দিয়ে চোখের পলকে যেকোনো পেজে যাওয়া যায়।",
        points: [
          "Trigger Key: Press either '/' (Forward Slash) or 'Cmd + K' / 'Ctrl + K' on any screen to launch the search drawer instantly.",
          "Entity Scrape: Enter customer names, ledger codes, or stock item SKUs to fetch matched profile summaries.",
          "App Pinned Shortcuts: Your most-used modules are automatically pinned to the top of the search context for fast access."
        ],
        bnPoints: [
          "ট্রিগার বাটন: যেকোনো স্ক্রিনে থাকা অবস্থায় '/' অথবা 'Cmd + K' / 'Ctrl + K' চেপে তাৎক্ষণিক সার্চ ড্রয়ারটি চালু করুন।",
          "দ্রুত সন্ধান: লেজার কোড, কাস্টমারের নাম, স্টক আইটেম এসকিউ (SKU) টাইপ করে সরাসরি সংশ্লিষ্ট মডিউলে প্রবেশ করুন।",
          "পিনযুক্ত শর্টকাট: দ্রুত ব্যবহারের জন্য সবচেয়ে বেশি ব্যবহৃত ফিচারগুলো সার্চ ড্রয়ারের ডানে পিন হয়ে থাকে।"
        ]
      },
      {
        title: "1.3 Enterprise Subscription Tiers",
        bnTitle: "১.৩ এন্টারপ্রাইজ সাবস্ক্রিপশন প্ল্যানসমূহ",
        content: "To support diverse business sizes, the system partitions modules across clear performance levels.",
        bnContent: "ব্যবসার পরিধি ও প্রয়োজনীয়তা অনুযায়ী বিভিন্ন সাবস্ক্রিপশন স্তরের মাধ্যমে ফিচারসমূহ সুবিন্যস্ত করা হয়েছে।",
        points: [
          "Silver/Bronze Tier: Unlocks general invoicing, physical ledger generation, and raw daybook sheets.",
          "Gold Plan (Tier 3 + Above): Required for advanced capabilities. Unlocks Payroll Automation, Bill of Materials Manufacturing, Supply Chain Godown Transfers, and Real-time AI Business Insights."
        ],
        bnPoints: [
          "সিলভার/ব্রোঞ্জ স্তর: সাধারণত বেসিক ইনভয়েসিং, ট্রানজেকশন বুককিপিং এবং লেজার ও ক্যাশ স্টেটমেন্ট রিকনসিলিলেশন সুবিধা দেয়।",
          "গোল্ড প্ল্যান (টায়ার ৩ এবং তদুর্ধ্ব): অটোমেটেড পেরোল স্যালারি শিট, ম্যানুফ্যাকচারিং ম্যানুয়াল, মাল্টি-লোকেশন গোডাউন স্থানান্তর এবং উন্নত রিয়েল-টাইম এআই অ্যানালিটিক্স অ্যাক্সেস আনলক করতে হবে।"
        ],
        warning: "Advanced payroll and production worksheets demand high processing limits. Ensure your branch aligns with an active Gold subscription to avoid processing interruptions.",
        bnWarning: "পেরোল শীট বাল্ক ক্যালকুলেশন এবং প্রোডাকশন ওয়ার্কফ্লোর জন্য গোল্ড মেম্বারশিপ প্ল্যান সক্রিয় থাকা বাধ্যতামূলক।"
      }
    ]
  },
  {
    id: "accounting-ledgers",
    iconName: "book-open",
    title: "Ledger Setup & Bookkeeping",
    bnTitle: "অ্যাকাউন্টস এবং লেজার ব্যবস্থাপনা",
    description: "Build a robust Chart of Accounts. Configure customer/vendor relationships and proper asset groupings.",
    bnDescription: "একটি শক্তিশালী চার্ট অফ অ্যাকাউন্টস প্রতিষ্ঠা করুন। কাস্টমার এবং সরবরাহকারী লেজারের গ্রুপ নিরূপণ ও ওপেনিং ব্যালেন্স সেট করুন।",
    sections: [
      {
        title: "2.1 Designing your Chart of Accounts",
        bnTitle: "২.১ অ্যাকাউন্টের চার্ট এবং লেজার গ্রুপিং",
        content: "The bedrock of accounting accuracy lies in designating the correct classification group for every active financial account.",
        bnContent: "সঠিক হিসাব ব্যবস্থার মূল ভিত্তি হলো প্রতিটি লেজার অ্যাকাউন্টকে যথাযথ ক্যাটাগরি বা গ্রুপে শ্রেণীবদ্ধ করা।",
        points: [
          "Sundry Debtors (গ্রাহক খাত): Represents customers or organizations whom you sell products to on credit and owe your business money.",
          "Sundry Creditors (সরবরাহকারী খাত): Represents vendors, manufacturers, or suppliers from whom you purchase bulk stock or raw materials on credit.",
          "Bank Accounts (ব্যাংক হিসাব): Dedicated accounts tracking liquid holdings in commercial/savings bank portals.",
          "Hand in Cash (ক্যাশ ইন হ্যান্ড): Physical cash draws and retail cash registers located at physical retail fronts.",
          "Indirect Expenses (পরোক্ষ খরচ): Fixed operational overheads such as warehouse rent, staff beverages, electricity, and machinery depreciation."
        ],
        bnPoints: [
          "Sundry Debtors (গ্রাহক খাত): যেসব গ্রাহক বা প্রতিষ্ঠানের নিকট বাকিতে পণ্য বিক্রয় করা হয় এবং যাদের কাছ থেকে পাওনা আদায় হবে।",
          "Sundry Creditors (সরবরাহকারী খাত): যাদের কাছ থেকে বাকিতে স্টক বা কাঁচামাল ক্রয় করা হয় এবং যাদের বিল পরিশোধ করতে হবে।",
          "Bank Accounts (ব্যাংক হিসাব): বাণিজ্যিক ও সঞ্চয়ী ব্যাংক অ্যাকাউন্টে জমা থাকা তরল তহবিল ট্র্যাক করার অ্যাকাউন্ট।",
          "Hand in Cash (ক্যাশ ইন হ্যান্ড): প্রধান ক্যাশ বাক্স এবং খুচরা বিক্রয় কাউন্টারে থাকা ক্যাশ তহবিল।",
          "Indirect Expenses (পরোক্ষ খরচ): প্রতিষ্ঠানের ফিক্সড অপারেশনাল ওভারহেড যেমন অফিসের ভাড়া, চা-নাস্তা খরচ, বিদ্যুৎ বিল ইত্যাদি।"
        ],
        tip: "Always configure unique tax identification numbers (like GST/TIN) for Sundry Debtors and Creditors in their profile schema to automate tax compliance invoicing.",
        bnTip: "ট্যাক্স কম্প্লায়েন্স বজায় রাখতে ডেটরস এবং ক্রেডিটরস তৈরির সময় তাদের লেজারে অবশ্যই সঠিক টিআইএন/জিএসটি ইনপুট দিন।"
      },
      {
        title: "2.2 Opening Balances & Compliance Details",
        bnTitle: "২.২ ওপেনিং ব্যালেন্স এবং রেগুলেটরি কমপ্লায়েন্স",
        content: "When migrating from an older bookkeeping platform to our ERP, you must declare correct opening statements as of your fiscal start date.",
        bnContent: "পুরাতন কোনো হিসাব খাতা থেকে আমাদের সিস্টেমে মাইগ্রেট করার সময় অর্থ-বছরের প্রথম তারিখ অনুযায়ী সঠিক ওপেনিং ব্যালেন্স প্রদান করা আবশ্যক।",
        points: [
          "Opening Debits: Typically applied to assets, bank accounts, cash registers, or outstanding invoices due from Sundry Debtors.",
          "Opening Credits: Typically applied to capital reserves, long-term bank liabilities, and outstanding vendor bills grouped under Sundry Creditors.",
          "Contact Schemes: Ensure detailed mailing addresses are keyed. Standardised addresses are automatically pulled by the sales/purchase printing engine."
        ],
        bnPoints: [
          "ওপেনিং ডেবিট: সাধারণত সম্পদ, ডুপ্লিকেট ব্যাংক হোল্ডিং, পেটি ক্যাশ এবং কাস্টমারদের পূর্বের বকেয়া ডেবিট ক্যাটাগরিতে পড়ে।",
          "ওপেনিং ক্রেডিট: সাধারণত মূলধন বিনিয়োগ, প্রভিডেন্ট ফান্ড ডিপোজিট এবং সরবরাহকারীদের বকেয়া ক্রেডিট ক্যাটাগরিতে পড়ে।",
          "ঠিকানার বিবরণ: লেজার প্রোফাইলে লেজার মালিকের সম্পূর্ণ পোস্টাল ঠিকানা টাইপ করুন, যা সেলস বিল জেনারেট করার সময় সরাসরি ইনভয়েসে প্রিন্ট হবে।"
        ]
      }
    ]
  },
  {
    id: "vouchers",
    iconName: "file-text",
    title: "Double-Entry Transaction Vouchers",
    bnTitle: "ভাউচার এন্ট্রি এবং লেনদেন",
    description: "Learn how to record Payment, Receipt, Sales, Purchase, and Contra transactions securely.",
    bnDescription: "পেমেন্ট, রিসিট, সেলস, পারচেজ এবং কন্ট্রা ট্রানজেকশন পরিচালনার ধাপে ধাপে নির্দেশনাবলী।",
    sections: [
      {
        title: "3.1 Core Voucher Categories",
        bnTitle: "৩.১ প্রধান ৫টি ভাউচার ক্যাটাগরি",
        content: "Vouchers enforce accounting integrity via strict balanced entries. Our platform supports five primary journal documents:",
        bnContent: "ভাউচার হলো হিসাব সংরক্ষণের প্রামাণ্য দলিল। আমাদের ERP ৫টি প্রাথমিক জার্নাল ডকুমেন্ট সাপোর্ট করে:",
        points: [
          "Contra Voucher (F4): Used strictly for funds transfers occurring within your internally managed accounts (e.g., depositing cash into Bank Account, or withdrawing cash from Bank ATM to the cash drawer). No external incomes/expenses can be recorded here.",
          "Payment Voucher (F5): Used for recording all outgoing payments. Debit the receiving Ledger (e.g. Supplier, operational expenses like Salary/Rent) and Credit the source account (Cash or Bank account).",
          "Receipt Voucher (F6): Used for recording money entering the business. Debit the destination Cash/Bank Ledger and Credit the source Ledger (e.g. Sales Income, Capital Deposit, or outstanding Customer payments).",
          "Sales Voucher (F8): Documents customer bills. Credits 'Sales Account' and Debits Customer Ledger (debt) or Cash/Bank. Allows inputting detailed stock items, quantity, rate, tax, and discount allocations.",
          "Purchase Voucher (F9): Documents incoming raw inventory from suppliers. Debits 'Purchase Account' and Credits the Supplier Ledger (credit) or bank account."
        ],
        bnPoints: [
          "কন্ট্রা ভাউচার (F4): শুধুমাত্র আপনার নিজস্ব অভ্যন্তরীণ অ্যাকাউন্টগুলোর মধ্যকার তহবিল স্থানান্তরের জন্য ব্যবহৃত হয় (যেমন: ব্যাংক অ্যাকাউন্টে নগদ জমা দেওয়া, বা ব্যাংক এটিএম থেকে ক্যাশ ড্রয়ারে তোলার এন্ট্রি)। এর বাইরে কোনো বাহ্যিক লেনদেন করা যাবে না।",
          "পেমেন্ট ভাউচার (F5): সমস্ত ধরণের বহির্গামী পেমেন্ট রেকর্ড করার জন্য। প্রাপক লেজার ডেবিট হবে (যেমন: সরবরাহকারী বা ভাড়া/বেতন খরচ) এবং ক্যাশ বা ব্যাংক অ্যাকাউন্ট ক্রেডিট হবে।",
          "রিসিট ভাউচার (F6): ব্যবসায় অর্জিত নগদ বা ব্যাংক ফান্ড রেকর্ড করার জন্য। ডেস্টিনেশন ক্যাশ/ব্যাংক লেজার ডেবিট হবে এবং আয়ের উৎস ক্রেডিট হবে।",
          "सेलস ভাউচার (F8): গ্রাহকদের জন্য পন্য বিক্রয়ের ইনভয়েস টিকিট। সেলস অ্যাকাউন্ট ক্রেডিট এবং গ্রাহকের লেজার ডেবিট হবে। এতে স্টক আইটেম, বিবরণ, পরিমাণ, ট্যাক্স ও ডিসকাউন্ট যোগ করা হয়।",
          "পারচেজ ভাউচার (F9): সরবরাহকারীদের থেকে আগত পণ্য ইনভেন্টরিতে প্রবেশ করার জন্য। পারচেজ বা ক্রয় অ্যাকাউন্ট ডেবিট এবং সরবরাহকারীর লেজার ক্রেডিট হবে।"
        ],
        warning: "A Contra Voucher is strictly for internal cash-bank and bank-to-bank movements. Never map indirect expenses or party invoices to a Contra Voucher.",
        bnWarning: "কন্ট্রা ভাউচারটি শুধুমাত্র ডাবল-এন্ট্রি অভ্যন্তরীণ স্থানান্তরের সুরক্ষার জন্য। এতে কখনো কোনো প্রকার পরোক্ষ খরচ, পার্টি বিল বা পণ্যের লেনদেন যুক্ত করবেন না।"
      },
      {
        title: "3.2 Structured Step-by-Step Transaction Recording",
        bnTitle: "৩.২ লেনদেন রেকর্ড করার ধাপে ধাপে প্রক্রিয়া",
        content: "To record any commercial voucher with zero bookkeeping discrepancies, follow this strict procedure:",
        bnContent: "ভুল এড়িয়ে নিখুঁত বুককিপিং বা ভাউচার নিশ্চিত করতে নিট-এন্ট্রি নেওয়ার ধাপসমূহ:",
        points: [
          "Step 1: Choose the transaction type from the top button bar based on financial nature.",
          "Step 2: Check the Voucher Date. Make sure it aligns with your corporate accounting calendar block.",
          "Step 3: Select the Account elements. The form dynamically toggles between structural accounts based on selected voucher type.",
          "Step 4: For inventory vouchers (Sales/Purchase), enter item specifications: Select SKU title, physical Godown, specify Quantity, and unit Rate.",
          "Step 5: Review taxes and discount percentages. The system calculates sub-totals and final transaction value automatically.",
          "Step 6: Write a brief Narration. Summarise transactional details for easy auditing.",
          "Step 7: Press 'Save Transaction' or use keyboard shortcut to store the record."
        ],
        bnPoints: [
          "ধাপ ১: স্ক্রিনের উপর লাল/নীল বাটন প্যানেল থেকে কার্যকারণ অনুযায়ী সঠিক ভাউচার টাইপ নির্বাচন করুন।",
          "ধাপ ২: ভাউচারের তারিখ বা ডেট পিকারটি চেক করুন। নিশ্চিত করুন এটি কোম্পানির বর্তমান হিসাবকালের অংশ কিনা।",
          "ধাপ ৩: মূল লেজার চয়ন করুন। ভাউচার টাইপের ওপর ভিত্তি করে ফর্মটি প্রয়োজনীয় অ্যাকাউন্ট ড্রপডাউন প্রদর্শন করে।",
          "ধাপ ৪: ইনভেন্টরি ভাউচারের ক্ষেত্রে (সেলস/পারচেজ) আইটেম যুক্ত করুন: সঠিক SKU বা আইটেম এবং গোডাউন সিলেক্ট করুন, এর পর সঠিক পরিমাণ এবং ইউনিট রেট দিন।",
          "ধাপ ৫: ভ্যাট-ট্যাক্স এবং ডিসকাউন্ট শতাংশ চেক করুন। সিস্টেম স্বয়ংক্রিয়ভাবে সাব-টোটাল এবং ইনভয়েসের মোট ভ্যালু হিসাব করবে।",
          "ধাপ ৬: একটি সংক্ষিপ্ত ন্যারেশন বা টেক্সট ব্যাখ্যা লিখুন। এটি ভবিষ্যতে অডিট করার সময় লেনদেনের প্রেক্ষাপট বুঝতে সাহায্য করবে।",
          "ধাপ ৭: 'Save Transaction' বাটন চেপে ডেটা সেভ করুন এবং ইনভয়েস প্রিন্ট বা ডাউনলোড করুন।"
        ],
        tip: "All transaction quantities with units like Pcs, Pc, or Nos will be rendered strictly as integers with NO decimal digits, while others like Kg or Litre will support double decimals."
      }
    ]
  },
  {
    id: "inventory",
    iconName: "package",
    title: "Stock Items & Godown Logistics",
    bnTitle: "ইনভেন্টরি, গোডাউন ও ব্যাচ ব্যবস্থাপনা",
    description: "Structure inventory groupings, physical warehouses (Godowns), stock transfers, and manufacturing Bill of Materials (BOM).",
    bnDescription: "পণ্যের স্টক গ্রুপ, পরিমাপের ইউনিট, মাল্টি-লোকেশন গোডাউন স্থানান্তর এবং ম্যানুফ্যাকচারিং ম্যাটেরিয়ালস সেটআপ গাইড।",
    sections: [
      {
        title: "4.1 Registering Stock Items",
        bnTitle: "৪.১ স্টক আইটেম এবং গ্রুপ পরিচিতি",
        content: "Every inventory asset require correct unit calibration, opening weights, reorder targets, and physical Godown assignments.",
        bnContent: "প্রতিটি ইনভেন্টরি প্রোডাক্টের জন্য সঠিক পরিমাপের ইউনিট, ওপেনিং স্টক, রিঅর্ডার স্তর এবং ফিজিক্যাল গোডাউন অ্যাসাইনমেন্ট বজায় রাখা প্রয়োজন।",
        points: [
          "SKU Code & Name: Define a distinct name and barcode identifier.",
          "Category or Group: Filter stock easily (e.g. 'Raw Materials', 'Finished Goods').",
          "Unit of Measures: Configure matching metrics (e.g. Pcs, Kgs, Nos, Bundles).",
          "Reorder Level Trigger: Receive system-wide warning signals when stock levels fall beneath optimal thresholds to prevent production blockages."
        ],
        bnPoints: [
          "SKU কোড ও নাম: প্রতিটি স্টক পণ্যের জন্য একটি স্বতন্ত্র কোড এবং নাম নির্ধারণ করুন।",
          "ক্যাটাগরি বা গ্রুপ: পণ্যগুলোকে ফিল্টার করতে সাহায্য করে, যেমন: 'কাঁচামাল' (Raw Materials), 'তৈরি পণ্য' (Finished Goods)।",
          "পরিমাপের ইউনিট (UoM): মিলিমিটার, কেজি, পিস, বান্ডেল বা বাক্স ইত্যাদি নিখুঁত পরিমাপ ইউনিট যুক্ত করুন।",
          "রিঅর্ডার লেভেল কোটা: গুদামে আইটেমের পরিমাণ এই স্তরের নিচে নামলে স্বয়ংক্রিয় সতর্কতা তৈরি হয় যাতে স্টক শেষ হওয়ার আগেই ক্রয় আদেশ নেওয়া যায়।"
        ]
      },
      {
        title: "4.2 Managing Warehouses (Godowns) & Inter-Stock Transfers",
        bnTitle: "৪.২ মাল্টি-লোকেশন গোডাউন ও স্টক স্থানান্তর",
        content: "Track physical materials spread across multiple warehouses or factories. Our system supports endless Godowns with fully audited stock transfer registers.",
        bnContent: "আমাদের সিস্টেমে একাধিক গুদাম বা কারখানার অবস্থান ট্র্যাক করা সহজ। প্রতিটি গোডাউনের ডেটা সহ স্টক ট্রান্সফার রেজিস্টারের মাধ্যমে পণ্য স্থানান্তরের শতভাগ নিরীক্ষা সম্ভব।",
        points: [
          "Add Godown: Standard sites may include 'Primary Warehouse', 'Dhanmondi Outlet', or 'Chittagong Factory'.",
          "Inter-Godown Transfers: Transfer physical items cleanly using 'Stock Journal' type vouchers. Specify Source Godown and Destination Godown, selecting exact item counts to enforce inventory sanity."
        ],
        bnPoints: [
          "গোডাউন যুক্ত করা: আপনি 'প্রধান গুদাম', 'ধানমন্ডি শো-রুম', বা 'চট্টগ্রাম ফ্যাক্টরি' নামে একাধিক অবস্থান সেট করতে পারেন।",
          "স্টক জার্নাল ট্রান্সফার: এক গোডাউন থেকে অন্য গোডাউনে পণ্য সরাতে 'Stock Journal' ভাউচার এন্ট্রি ব্যবহার করুন। সোর্স বা স্যাম্পল উৎস গুদাম এবং গন্তব্য গুদাম সিলেক্ট করে স্থানান্তর করুন।"
        ],
        tip: "To prevent asset leakage, the system blocks stock transfer actions if the source godown contains insufficient stock quantities of the selected item.",
        bnTip: "পণ্যের অপচয় রোধ করতে সোর্স গোডাউনে যদি কোনো আইটেমের পর্যাপ্ত ব্যালেন্স না থাকে, তবে স্টক ট্রান্সফার সিস্টেম স্বয়ংক্রিয়ভাবে লেনদেন আটকে দেবে।"
      },
      {
        title: "4.3 Bill of Materials (BOM) & Manufacture Worksheets",
        bnTitle: "৪.৩ বিল অফ ম্যাটেরিয়ালস (BOM) এবং উৎপাদন ওয়ার্কশীট",
        content: "For assembly plants and complex manufacturing yards, configure the recipe of ingredients required to manufacture a single product.",
        bnContent: "ম্যানুফ্যাকচারিং প্রতিষ্ঠানের প্রধান কাজ হলো একটি ফিনিশড পণ্য উৎপাদনে কোন কোন অপশন ও কাঁচামাল প্রয়োজন (BOM) তার পরিমাণ নির্ধারণ করা।",
        points: [
          "Ingredients Recipe: For example, producing 1 item of 'Wooden Table' demands 'Wood Logs: 2 Nos', 'Screws: 12 Pcs', and 'Polish Varnishing: 1 Litre'.",
          "Standard Cost Sheet: Auto-calculates standard ingredient inputs during batch production orders, creating raw consumption and finished goods addition entries instantaneously."
        ],
        bnPoints: [
          "উপাদানের রেসিপি (BOM): যেমন, ১টি 'কাঠের টেবিল' উৎপাদনে 'কাঠের তক্তা:২টি', 'স্ক্রু: ১২টি' এবং 'বার্নিশ: ১ লিটার' এর কম্বিনেশন সেট করুন।",
          "স্ট্যান্ডার্ড কস্ট শীট: উৎপাদন শুরু করার পর সিস্টেম স্বয়ংক্রিয়ভাবে কাঁচামাল এবং কনজাম্পশন ব্যালেন্স হ্রাস করে ক্যাশ কস্ট হিসাব করে দেয়।"
        ]
      }
    ]
  },
  {
    id: "payroll",
    iconName: "users",
    title: "HR, Attendance & Salary Rules",
    bnTitle: "পেরোল ও মানবসম্পদ অটোমেশন",
    description: "Comprehensive guide to setting up employees, daily attendance sheets, loans, advancements, auto-calculating salaries, and exporting pay-slips.",
    bnDescription: "কর্মচারী প্রোফাইল এবং হাজিরা ট্র্যাকিং, অগ্রিম লোন পরিশোধ এবং এক ক্লিকে মাসের বেতন হিসেব ও পে-স্লিপ প্রিন্ট করার বিস্তারিত নির্দেশাবলী।",
    sections: [
      {
        title: "5.1 Employee Profile & Salary Structures",
        bnTitle: "৫.১ কর্মচারী প্রোফাইল এবং স্যালারি কাঠামো গঠন",
        content: "To initiate an accurate automated salary dispersal engine, configure structural properties for every workforce personnel:",
        bnContent: "নিখুঁতভাবে প্রতি মাসের স্যালারি প্রসেস করতে প্রথমে মানবসম্পদ ডেটাবেস এবং স্যালারি কাঠামো সাজান:",
        points: [
          "Employee Metadata: Name, Mobile, Designation, Deep Department, and Date of Joining.",
          "Basic Pay: Set the core structural monthly base price.",
          "Pay Heads Configuration: Establish custom dynamic heads representing Earnings (e.g. House Rent Allowance HRA, Medical allowance, Transport incentive) and Deductions (e.g. Provident Fund contribution, Professional taxes)."
        ],
        bnPoints: [
          "কর্মচারী বিবরণ: সম্পূর্ণ নাম, মোবাইল নম্বর, ডেজিগনেশন এবং যোগদানের তারিখ।",
          "বেসিক বা প্রধান বেতন: মূল মাসিক বেতনের হার ইনপুট করুন।",
          "পে-হেড কনফিগারেশন: আয়ের ক্ষেত্র (যেমন: বাড়ি ভাড়া ভাতা, চিকিৎসা ভাতা, যাতায়াত ভাতা) এবং কর্তনের ক্ষেত্র (যেমন: প্রভিডেন্ট ফান্ড কর্তন, পেশাগত ট্যাক্স) যোগ করুন।"
        ]
      },
      {
        title: "5.2 Daily Attendance Sheet Reconciliation",
        bnTitle: "৫.২ দৈনিক উপস্থিতি রিকনসিলিলেশন ও নিয়ন্ত্রণ",
        content: "Salary calculation leverages attendance parameters. You must mark attendance for employees daily to guarantee balanced payroll runs.",
        bnContent: "উপস্থিতি হারের ওপর কোম্পানির বেতন নির্ভশীল। প্রতিদিন উপস্থিতির ডেটা সিস্টেমে সংরক্ষণ করা অত্যন্ত জরুরী:",
        points: [
          "Attendance Labels: Mark Present, Absent, Sick Leave, or Casual Leave.",
          "Pay impact: If a dynamic Pay Head is formatted 'On Attendance', the payroll algorithm calculates the actual pay-rate pro-rata basis: (Basic Salary / Current month days) * Present Days counted."
        ],
        bnPoints: [
          "উপстояিতির লেবেল: প্রতিটি কর্মচারীকে 'উপস্থিত', 'অনুপস্থিত', 'অসুস্থতাজনিত ছুটি' বা 'নৈমিত্তিক ছুটি' হিসেবে চিহ্নিত করুন।",
          "বেতন প্রভাব: কোনো পে-হেড যদি 'উপস্থিতি ভিত্তিক' হিসেবে চিহ্নিত থাকে, তবে পেরোল অ্যালগরিদম নিম্নোক্ত সূত্র মেনে প্রসেস করবে: (মূল বেতন / মাসের মোট দিন) * উপস্থিত থাকার দিন সংখ্যা।"
        ],
        warning: "Unapproved absences drastically impact final payroll run computations. Always perform attendance reconciliation before closing the monthly ledger cycle.",
        bnWarning: "অনুমোদনহীন অনুপস্থিতির কারণে স্যালারির অটো-ক্যালকুলেশন ক্ষতিগ্রস্ত হতে পারে। স্যালারি রিলিজ বা জেনারেট করার আগে উপস্থিতি ডাটা পুনরায় নিরীক্ষা করুন।"
      },
      {
        title: "5.3 Advances, Corporate Loans & EMI Deductions",
        bnTitle: "৫.৩ কর্মচারীদের অগ্রিম বেতন ও কিস্তি (EMI) কর্তন",
        content: "Our system has a fully built ledger tracking interest-free corporate loans given out to workforce members.",
        bnContent: "আমাদের সিস্টেমে কর্মচারীদের অগ্রিম ঋণ প্রদান এবং প্রতি মাসে স্যালারি থেকে কিস্তির টাকা স্বয়ংক্রিয়ভাবে কেটে নেওয়ার সমন্বিত লেজার ব্যবস্থা রয়েছে।",
        points: [
          "Disburse Advance: Record employee advances directly under Loan journals or voucher options.",
          "Monthly Equated Installments: When setting up the loan duration, specify the monthly EMI. The payment calculations automatically reduce the employee's payroll statement for that month by the specified installment amount."
        ],
        bnPoints: [
          "বকেয়া লোন বিতরণ: কোম্পানির ফাইন্যান্সিয়াল ড্রয়ার বা সোর্স থেকে অগ্রিম লোন রেকর্ড করুন।",
          "মাসিক কিস্তি (EMI): লোন দেওয়ার সময় মাসিক কিস্তি পরিমাণ জানিয়ে সেট করে রাখলে বেতন প্রসেস করার দিনে কর্মচারীর স্যালারি শিট থেকে স্বয়ংক্রিয়ভাবে কিস্তির অংশ কেটে নেট ক্যাশ ব্যালেন্স প্রস্তুত হবে।"
        ],
        tip: "Outstanding loan balances are fully traceable in individual employee profiles, protecting your organization from financial deficits if staff resign."
      },
      {
        title: "5.4 Executing Bulk Monthly Payroll Runs",
        bnTitle: "৫.৪ বাল্ক উপায়ে প্রতি মাসের স্যালারি শীট ও পে-স্লিপ তৈরি",
        content: "Save hours of manual computation at month-end. Run the billing loop for all active workers securely:",
        bnContent: "মাস শেষে দিনব্যাপী ম্যানুয়াল স্যালারি হিসাব করার দিন শেষ। পেরোল মডিউলে গিয়ে ১টি ক্লিক করুন:",
        points: [
          "Run Payroll Cycle: Navigate to the Payroll module and click the Bulk View action panel.",
          "Verify calculations: The calculation engine aggregates gross basic rates, adds allowances, deducts professional funds, deducts pending loan EMIs, and subtracts absent deductions in real-time.",
          "Disburse & Distribute: Once checked, click 'Process Salary Vouchers'. Printable PDF pay-slips will instantly compile for physical distribution, accompanied by direct WhatsApp/Email dispatch links."
        ],
        bnPoints: [
          "পেরোল চক্র চালানো: পেরোল মডিউলের বাল্ক ভিউ প্যানেল-এ ক্লিক করে চলমান মাস সিলেক্ট করুন।",
          "হিসাব পুনঃনিরীক্ষণ: সিস্টেম অটোমেটিক উপস্থিতি ডেটা এবং চলমান লোন কিস্তির হিসাব রিয়েল-টাইমে গণনা করে নেট স্যালারি প্রস্তুত করবে।",
          "বিতরণ: সঠিক থাকলে 'Process Salary Vouchers' ক্লিক করুন। প্রতিটি কর্মচারীর জন্য সুন্দর প্রিন্টযোগ্য পিডিএফ পে-স্লিপ ও হোয়াটসঅ্যাপ/ইমেইলে পাঠানোর লিঙ্ক তৈরি হবে।"
        ]
      }
    ]
  },
  {
    id: "reports",
    iconName: "bar-chart-2",
    title: "Financial Auditing & Statement Analysis",
    bnTitle: "রিপোর্ট বিশ্লেষণ এবং ফাইনাল অ্যাকাউন্টস অডিট",
    description: "Generate compliant Trial Balances, accurate Cash/Bank books, detailed Profit & Loss ledgers, and audited Balance Sheets.",
    bnDescription: "ব্যবসার লাভ-ক্ষতির খতিয়ান, ক্যাশ ও ব্যাংক বহি, ট্রায়াল ব্যালেন্স এবং শতভাগ আইনানুগ ব্যালেন্স শীট প্রতিবেদন প্রস্তুত ও এক্সপোর্ট করার গাইড।",
    sections: [
      {
        title: "6.1 Audit Verification with the Trial Balance",
        bnTitle: "৬.১ ট্রায়াল ব্যালেন্সের মাধ্যমে হিসাবের গাণিতিক নির্ভুলতা যাচাই",
        content: "Before creating final statements, run a Trial Balance to verify that standard double-entry balances align across all ledger hierarchies.",
        bnContent: "চূড়ান্ত হিসাব বা প্রতিবেদন তৈরির আগে সমস্ত ডেবিট ও ক্রেডিট ব্যালেন্সের গাণিতিক নির্ভুলতা নিশ্চিত করতে ট্রায়াল ব্যালেন্স রান করুন।",
        points: [
          "The Audit Law: Total of all accumulated Debit column balances must exactly equal the total of Credit accounts.",
          "Discrepancies: If unbalanced amounts appear, review the Daybook to search for voucher entry errors or incomplete records."
        ],
        bnPoints: [
          "হিসাববিজ্ঞান সূত্র: সমস্ত ডেবিট ব্যালেন্সের সমষ্টি অবশ্যই ক্রেডিট ব্যালেন্সের মোট অংকের শতভাগ সমান হতে হবে।",
          "ব্যতিক্রম দূরীকরণ: কোনো অসঙ্গতি বা গ্যাপ পাওয়া গেলে ‘Daybook’ ফিল্টার করে ত্রুটিপূর্ণ জার্নাল বা ভাউচার দ্রুত সংশোধন করুন।"
        ],
        warning: "Unbalanced Trial Balances indicate mathematical gaps. Correct these before locking in tax filing schedules.",
        bnWarning: "অসামঞ্জস্যপূর্ণ ট্রায়াল ব্যালেন্স থাকলে ট্যাক্স বা আর্থিক অডিট সফল হবে না। লকডাউন করার আগে সব ভাউচার সামঞ্জস্যপূর্ণ করুন।"
      },
      {
        title: "6.2 Demystifying Profit & Loss (P&L) Accounts",
        bnTitle: "৬.২ লাভ-ক্ষতি (P&L) স্টেটমেন্ট বিশ্লেষণ",
        content: "Track business performance across custom duration splits. Determine exact operational yields:",
        bnContent: "ব্যবসায়িক কার্যক্রম কতটা লাভজনক তা নির্দিষ্ট সময়ের ফিল্টার অনুযায়ী মূল্যায়ন বা ট্র্যাকিং করতে পিএন্ডএল (P&L) স্টেটমেন্ট দেখুন:",
        points: [
          "Gross Profit calculation: Net Sales minus Direct Cost of Goods Sold (COGS).",
          "Net Profit calculation: Gross Profit plus other indirect incomes, minus indirect administrative expenses and tax provisions.",
          "Cost Allocation: Identify critical spikes in indirect expenses to schedule proactive cost-reduction strategies."
        ],
        bnPoints: [
          "মোট লাভ (Gross Profit): মোট বিক্রিত পণ্যের মূল্য থেকে পণ্য ক্রয়ের সরাসরি খরচ (COGS) বিয়োগ করে বের করা হয়।",
          "নিট লাভ (Net Profit): করপূর্ব মোট লাভের সাথে অন্যান্য আয় যোগ করে অপারেশনাল বা পরোক্ষ খরচ এবং ট্যাক্স বাদ দিলে নিট লাভ পাওয়া যায়।",
          "ব্যয় অপটিমাইজেশন: প্রতিষ্ঠানের অপ্রয়োজনীয় এবং অতিরিক্ত খরচের খতিয়ান চিহ্নিত করে ব্যবসার অপচয় কমাতে সাহায্য করে।"
        ]
      },
      {
        title: "6.3 Navigating the Comprehensive Balance Sheet",
        bnTitle: "৬.৩ ব্যালেন্স শীট (আর্থিক স্থিতিপত্র) বিশ্লেষণ",
        content: "The pinnacle statement reflecting the financial health and structural net-worth of your business entity at any given date.",
        bnContent: "যেকোনো নির্দিষ্ট কার্যদিবসে প্রতিষ্ঠানের মোট সম্পদ, বকেয়া দায়দেনা এবং মূলধনের সামগ্রিক চিত্র বা নেট-ওয়ার্থ বোঝার জন্য এটি প্রধান আর্থিক বিবরণী।",
        points: [
          "Left Wing (Liabilities): Tracks investor Capital Accounts, Reserves/Surplus, Bank Loans, and Current Liabilities (grouped Creditors).",
          "Right Wing (Assets): Tracks Fixed Assets, Investments, Liquid Bank Balances, physical Godown stock valuation, and Current Assets (uncollected Debtors).",
          "System Balanced Check: Net Assets must perfectly equate to ultimate Capital reserves plus Liabilities. Drill down into any item group to explore ledger-by-ledger transactional entries."
        ],
        bnPoints: [
          "বাম কলাম (দায় ও মূলধন): এখানে প্রতিষ্ঠানের শেয়ার মূলধন, অর্জিত মুনাফা এবং স্বল্প ও দীর্ঘমেয়াদী ঋণের হিসাব ট্র্যাক করা হয়।",
          "ডান কলাম (সম্পদ ও সম্পত্তি): ফিক্সড বা স্থায়ী সম্পদ, স্টক মূল্যায়ন, লিকুইড ব্যাংক ক্যাশ এবং কাস্টমারদের থেকে পাওনা বিল প্রদর্শিত হয়।",
          "ব্যালেন্স চেইন: মোট সম্পদ অবশ্যই মোট মূলধন ও দায়ের সমান হতে হবে। যেকোনো গ্রুপে ডাবল ক্লিক করে সংশ্লিষ্ট অ্যাকাউন্ট বিশ্লেষণ করা যায়।"
        ]
      }
    ]
  },
  {
    id: "shortcuts",
    iconName: "keyboard",
    title: "System Keyboard Shortcuts",
    bnTitle: "কিবোর্ড শর্টকাট গাইড (পাওয়ার ইউজার)",
    description: "Accelerate your data-entry speed. Execute global routines instantaneously with hotkeys.",
    bnDescription: "মাউস ছাড়া কিবোর্ডের সাহায্যে চোখের পলকে কাজ করার শর্টকাট কীসমূহ।",
    sections: [
      {
        title: "Core System Keys",
        bnTitle: "প্রধান কিবোর্ড শর্টকাট কোয়ালিশন",
        content: "Use these key commands globally inside any dashboard workspace to jump across screens instantly.",
        bnContent: "যেকোনো স্ক্রিনে বা কাজের ড্যাশবোর্ডে থাকা অবস্থায় নিচের কি কম্বিনেশনগুলো ব্যবহার করতে পারেন।",
        points: [
          "Cmd+K / Ctrl+K or '/' -> Launches Global Search / Cmd Drawer instantly",
          "Esc (Escape Key) -> Closes open search windows, active popups or drawers",
          "Alt+D -> Jumps directly to Dashboard analytics screen",
          "Alt+V -> Navigates to New Voucher Entry system",
          "Alt+L -> Navigates to Accounts Ledger Setup module",
          "Alt+I -> Open Stock Inventory page",
          "Alt+S -> Opens Global ERP configuration settings"
        ],
        bnPoints: [
          "Cmd+K / Ctrl+K অথবা '/' -> যেকোনো সময় গ্লোবাল সার্চ উইন্ডো চালু করতে",
          "Esc (এসকিপ কি) -> যেকোনো পপ-আপ, ড্রয়ার বা সার্চ বক্স বন্ধ করতে",
          "Alt+D -> সরাসরি ড্যাশবোর্ড স্ক্রিনে ফিরে যেতে",
          "Alt+V -> সরাসরি নতুন ভাউচার এন্ট্রি স্ক্রিনে যেতে",
          "Alt+L -> সরাসরি লেজার এবং অ্যাকাউন্ট সেটআপ স্ক্রিনে যেতে",
          "Alt+I -> সরাসরি স্টক ইনভেন্টরি পেজ চালু করতে",
          "Alt+S -> গ্লোবাল ইআরপি কনফিগারেশন পেজে যেতে"
        ],
        tip: "Keyboard shortcut overrides do not conflict with normal standard browser tasks like refresh or page zoom.",
        bnTip: "আমাদের কাস্টম কিবোর্ড হটকিগুলো ব্রাউজারের নিজস্ব রিফ্রেশ বা জুম ফিচারের সাথে কোনো প্রকার সংঘাত তৈরি করে না।"
      }
    ]
  },
  {
    id: "faq",
    iconName: "help-circle",
    title: "Frequently Asked Questions (FAQ)",
    bnTitle: "সাধারণ জিজ্ঞাসা ও উত্তরসমূহ (FAQ)",
    description: "Troubleshooting errors and detailed clarifications of financial policies.",
    bnDescription: "ব্যবসার হিসাব মেলাতে সাধারণ জটিলতা দূরীকরণ এবং প্রায়শই জিজ্ঞাসিত প্রশ্নাদি ও উত্তর।",
    sections: [
      {
        title: "Q: Why is my Profit & Loss profit not matching my actual cash in hand?",
        bnTitle: "প্রশ্ন: লাভ-ক্ষতির মুনাফার পরিমাণ কেন ক্যাশ ইন হ্যান্ডের সাথে মিলছে না?",
        content: "Accounting follows the Accrual model, not cash accounting. If you make structural credit sales (F8 Voucher) to customers, your sales revenue rises immediately (reflected in Profit & Loss), but your cash balance only changes when actual payments are received via Receipt Vouchers (F6). Therefore, profit yields and physical cash are conceptually distinct indicators.",
        bnContent: "আমাদের সফটওয়্যারটি স্ট্যান্ডার্ড এক্রুয়াল (বকেয়া ভিত্তিক) মডেল অনুসরণ করে। যদি আপনি কোনো গ্রাহকের কাছে বাকিতে বড় পণ্য বিক্রয় করেন, সেটি সিস্টেমের লাভ-ক্ষতির হিসাবে যোগ হয়ে মোট প্রবৃদ্ধি বাড়ায়, কিন্তু বাস্তবে নগদ লেনদেন না হওয়া পর্যন্ত ক্যাশ ড্রয়ারে টাকা জমা হবে না। কাস্টমার বিল পরিশোধ করলে রিসিট ভাউচারের (F6) মাধ্যমে ক্যাশ ইন হ্যান্ড বৃদ্ধি পায়।",
        tip: "Generate a Cash Flow report continuously to audit actual physical inflows and outlays accurately."
      },
      {
        title: "Q: How do employee advance loans adjust inside Monthly Payslips?",
        bnTitle: "প্রশ্ন: কর্মচারীর অগ্রিম লোন কীভাবে মাসিক পে-স্লিপে সমন্বয় করা হয়?",
        content: "When you disburse a corporate loan to an employee and assign a specific monthly installment EMI, our calculation engine automatically checks if the current month matches the payroll cycle. The predetermined EMI deduction is subtracted from their Gross Earnings before finalizing the NET salary invoice, ensuring zero manual calculations.",
        bnContent: "যখন কোনো কর্মচারীকে কোম্পানি থেকে অগ্রিম লোন প্রদান করা হয় এবং স্যালারি প্রোফাইলে কিস্তির পরিমাণ বা EMI সেট করা থাকে, তখন প্রতি মাসের স্যালারি শিট চালুর সময় পেরোল ইঞ্জিন স্বয়ংক্রিয়ভাবে মোট আয় থেকে ঐ নির্দিষ্ট ইএমআই কর্তন করবে। এটি মাস শেষে নিখুঁত ক্যাশ ব্যালেন্স প্রস্তুত করতে সহায়তা করে।"
      },
      {
        title: "Q: Who possesses access to modify Leads inside the CRM pipeline?",
        bnTitle: "প্রশ্ন: CRM পাইপলাইনের লিড মুছে ফেলা বা পরিবর্তন করার অধিকার কার আছে?",
        content: "Our CRM features multi-user administrative safety. While standard roles like Marketing Manager can easily register and nurture sales leads, only authorized administrators and managers possessing executive Gold permissions can perform permanently destructive deletion actions using the trash icons.",
        bnContent: "সফ্টওয়্যারের ডাটা সুরক্ষার্থে সিআরএম মেম্বার রোল সাজানো হয়েছে। 'মার্কেটিং ম্যানেজার' রোলভুক্ত ব্যবহারকারীরা নতুন লিড যোগ ও পর্যবেক্ষণ করতে পারেন, কিন্তু চূড়ান্ত ডিল বা লিডিং হিস্ট্রির কোনো লিড পারমানেন্টলি মুছতে বা ডিলিট করতে শুধুমাত্র অ্যাডমিন প্যানেল এবং অ্যাকসেস টিম ম্যানেজারদের গোল্ডেন ক্ষমতা দেওয়া হয়েছে।"
      }
    ]
  }
];
