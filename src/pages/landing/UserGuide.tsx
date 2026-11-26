import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { InfoPageLayout, InfoTocItem } from '../../components/landing/InfoPageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';

interface FaqItem {
  q: string;
  a: string;
}

export const UserGuide: React.FC = () => {
  const { language } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity.appName;
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toc: InfoTocItem[] = isBn
    ? [
        { id: 'onboarding', number: '01', title: 'ধাপে ধাপে শুরু করার গাইড' },
        { id: 'vouchers', number: '02', title: 'ডাবল-এন্ট্রি ভাউচার ও স্টক' },
        { id: 'reports-export', number: '03', title: '১০টি মূল রিপোর্ট ও এক্সপোর্ট' },
        { id: 'faq', number: '04', title: 'সচরাচর জিজ্ঞাসিত প্রশ্ন (FAQ)' },
      ]
    : [
        { id: 'onboarding', number: '01', title: 'Step-by-Step Onboarding' },
        { id: 'vouchers', number: '02', title: 'Double-Entry Vouchers & Inventory' },
        { id: 'reports-export', number: '03', title: '10 Core Reports & Exports' },
        { id: 'faq', number: '04', title: 'Frequently Asked Questions (FAQ)' },
      ];

  const onboardingSteps = isBn
    ? [
        {
          step: '01',
          title: 'কোম্পানি ও অর্থবছর সেটআপ',
          detail:
            'প্রথমবার ড্যাশবোর্ডে প্রবেশের পর Settings → Company Info থেকে প্রতিষ্ঠানের নাম, ঠিকানা, অর্থবছরের শুরুর তারিখ, মুদ্রার প্রতীক (যেমন ৳ বা $) এবং প্রিন্ট হেডার/ফুটার নির্ধারণ করুন।',
        },
        {
          step: '02',
          title: 'চার্ট অফ অ্যাকাউন্টস ও পার্টি লেজার তৈরি',
          detail:
            'Masters → Create Ledger বা Chart of Accounts থেকে ক্রেতা (Sundry Debtors), সরবরাহকারী (Sundry Creditors), ব্যাংক, ক্যাশ এবং খরচের লেজার যুক্ত করুন ও প্রারম্ভিক ব্যালেন্স দিন।',
        },
        {
          step: '03',
          title: 'আইটেম, ইউনিট ও গোডাউন কনফিগারেশন',
          detail:
            'Inventory থেকে পরিমাপের একক (যেমন Pcs, Nos, Kg), একাধিক গোডাউন (Godown Master) এবং প্রতিটি পণ্যের প্রারম্ভিক স্টক ও মূল্য নির্ধারণ করুন।',
        },
        {
          step: '04',
          title: 'দৈনিক ভাউচার এন্ট্রি ও রিপোর্ট পর্যালোচনা',
          detail:
            'Transactions → Voucher Entry থেকে ক্রয়, বিক্রয়, রসিদ বা পেমেন্ট এন্ট্রি করুন। ড্যাশবোর্ড এবং Daybook, Trial Balance, Profit & Loss ও Balance Sheet-এ তাৎক্ষণিকভাবে ফলাফল দেখুন।',
        },
      ]
    : [
        {
          step: '01',
          title: 'Company Profile & Financial Year Setup',
          detail:
            'From the Dashboard, open Settings → Company Info to verify your company name, legal address, financial year start date, currency symbol, and A4 print header details.',
        },
        {
          step: '02',
          title: 'Chart of Accounts & Party Ledgers',
          detail:
            'Use Masters → Create Ledger or Chart of Accounts to create customer (Sundry Debtors), supplier (Sundry Creditors), cash, bank, and expense ledgers with opening balances (Dr positive, Cr negative).',
        },
        {
          step: '03',
          title: 'Item Master, Units & Multi-Godown Inventory',
          detail:
            'Configure units of measurement (such as Pcs, Nos, Kg), set up storage locations in Godown Master, and add inventory items with opening stock quantities and rates.',
        },
        {
          step: '04',
          title: 'Daily Voucher Entry & Live Reporting',
          detail:
            'Record daily transactions in Voucher Entry and review live balances immediately in the Dashboard, Daybook, Trial Balance, Profit & Loss, Balance Sheet, and Stock Summary.',
        },
      ];

  const coreReports = isBn
    ? [
        'Daybook (দৈনিক লেনদেন তালিকা)',
        'Ledger Statement (পার্টি ও খাতভিত্তিক বিবরণী)',
        'Trial Balance (রেওয়ামিল ও Dr/Cr সমতা)',
        'Profit & Loss (লাভ-ক্ষতি বিবরণী)',
        'Balance Sheet (উদ্বর্তপত্র)',
        'Cash Flow (নগদ প্রবাহ বিবরণী)',
        'Funds Flow (তহবিল প্রবাহ)',
        'Ratio Analysis (আর্থিক অনুপাত বিশ্লেষণ)',
        'Stock Summary (FIFO স্টক সারাংশ ও মূল্যায়ন)',
        'Negative Reports (নেগেটিভ লেজার ও স্টক সতর্কতা)',
      ]
    : [
        'Daybook (Daily chronological transaction log)',
        'Ledger Statement (Account-by-account Dr/Cr running balance)',
        'Trial Balance (Group and ledger balance verification)',
        'Profit & Loss (Trading and net income performance)',
        'Balance Sheet (Assets, liabilities, and capital position)',
        'Cash Flow (Operating cash inflows and outflows)',
        'Funds Flow (Working capital movement analysis)',
        'Ratio Analysis (Liquidity, turnover, and margin ratios)',
        'Stock Summary (Multi-godown FIFO quantity & valuation)',
        'Negative Reports (Negative ledger & negative stock alerts)',
      ];

  const faqs: FaqItem[] = isBn
    ? [
        {
          q: 'আমি কি একটি অ্যাকাউন্ট থেকে একাধিক কোম্পানি পরিচালনা করতে পারব?',
          a: 'হ্যাঁ। Company Management থেকে আপনি একাধিক প্রতিষ্ঠান তৈরি বা পরিবর্তন করতে পারেন। প্রতিটি কোম্পানির ভাউচার, লেজার, স্টক এবং সেটিংস সম্পূর্ণ আলাদাভাবে সংরক্ষিত থাকে।',
        },
        {
          q: 'ইংরেজি ও বাংলা ভাষা কীভাবে পরিবর্তন করা যায়?',
          a: 'পাবলিক হেডার, ড্যাশবোর্ড টপবার বা সেটিংসের ভাষা সুইচার (EN / বাংলা) ব্যবহার করে তাৎক্ষণিকভাবে পুরো অ্যাপের ভাষা পরিবর্তন করা যায়।',
        },
        {
          q: 'রিপোর্ট ও ভাউচার কী কী ফরম্যাটে এক্সপোর্ট করা যায়?',
          a: 'প্রাথমিক স্প্রেডশিট ফরম্যাট হিসেবে .xlsx (Excel ওয়ার্কবুক) এক্সপোর্ট সমর্থিত। এছাড়া প্রতিটি মূল রিপোর্টে একই PDF জেনারেটর ভিত্তিক Save PDF, আনুষ্ঠানিক A4 Print (Layout 1 ও Layout 2) এবং সরাসরি Email শেয়ারিং সুবিধা রয়েছে।',
        },
        {
          q: 'ইন্টারনেট বিচ্ছিন্ন হলে বা কোটা সীমায় পৌঁছালে কী হয়?',
          a: 'পূর্ব-লোডকৃত মাস্টার ডেটা ও সাম্প্রতিক রিপোর্ট ৩০ মিনিট পর্যন্ত লোকাল ক্যাশে সংরক্ষিত থাকে যাতে সিস্টেম ক্র্যাশ না করে। ইন্টারনেট না থাকলে বা কোটা সীমায় পৌঁছালে পরিষ্কার নোটিফিকেশন দেখানো হয় এবং পুনরায় সংযুক্ত হলে আপনি কাজ চালিয়ে যেতে পারেন।',
        },
        {
          q: 'Pcs বা Nos এককের পণ্যে কি দশমিক সংখ্যা দেখায়?',
          a: 'না। Pcs, Pc বা Nos এককের আইটেমে সর্বদা পূর্ণসংখ্যা (দশমিক ছাড়া) দেখানো হয়। টাকা, দর ও অন্যান্য পরিমাপের ক্ষেত্রে সর্বোচ্চ ২ দশমিক স্থান পর্যন্ত ফরম্যাট করা হয়।',
        },
        {
          q: 'নতুন টিম মেম্বার যোগ করলে কি তাদের অনুমতি সীমিত করা যাবে?',
          a: 'হ্যাঁ। User Management ও Permissions থেকে আপনি Admin, Marketing Manager বা নির্দিষ্ট মডিউল-ভিত্তিক (যেমন ভাউচার তৈরি, অল্টার, রিপোর্ট, পেরোল বা অর্ডার ম্যানেজমেন্ট) অনুমতি নির্ধারণ করতে পারেন।',
        },
        {
          q: 'ভাউচারের অটো-সিরিয়াল নম্বর কীভাবে কাজ করে?',
          a: 'প্রতিটি ভাউচারের ধরন অনুযায়ী আলাদা কাউন্টার ডকুমেন্ট থেকে পরবর্তী সিরিয়াল নম্বর স্বয়ংক্রিয়ভাবে নির্ধারিত হয়, যাতে দ্রুত এন্ট্রির সময় অতিরিক্ত ডেটাবেস রিড না হয় এবং ক্রম ঠিক থাকে।',
        },
        {
          q: 'আমি কি প্রোডাকশন অর্ডার ও কর্মচারী পেরোল পরিচালনা করতে পারি?',
          a: 'হ্যাঁ। অনুমোদিত প্ল্যান (যেমন Gold Plan ও তদূর্ধ্ব) অনুযায়ী Payroll Management (পে স্লিপ, পে শিট, উপস্থিতি) এবং Production Orders & Machine Management মডিউলগুলো ব্যবহার করা যায়।',
        },
        {
          q: 'পূর্ববর্তী এন্ট্রি কে সংশোধন করেছে তা কীভাবে দেখা যাবে?',
          a: 'Reports → Audit Trail থেকে ভাউচার ও মাস্টার রেকর্ডের পরিবর্তন ইতিহাস, সময় এবং ব্যবহারকারীর তথ্য যাচাই করা যায়।',
        },
      ]
    : [
        {
          q: 'Can I manage multiple companies from one account?',
          a: 'Yes. Through Company Management you can switch between or manage multiple company workspaces. Each company maintains isolated vouchers, ledgers, stock balances, and print settings.',
        },
        {
          q: 'How do I switch between English and Bangla?',
          a: 'Use the EN / বাংলা switcher in the landing navbar, dashboard topbar, or Settings. All core menus, reports, and public guide/legal pages switch immediately with full bilingual parity.',
        },
        {
          q: 'Which export and print formats are supported?',
          a: 'Structured .xlsx (Excel workbook) is our primary spreadsheet export format. Core accounting reports and vouchers also support Save PDF, formal A4 Print (Layout 1 and Layout 2 using the identical PDF layout), and direct Email sharing.',
        },
        {
          q: 'What happens if my internet connection drops or quota limits are reached?',
          a: 'Master lists, counts, and recent views use 30-minute memory/localStorage caching so screens stay stable without crashing. Clear offline or quota notices appear while writes are safely paused until connectivity or quota recovers.',
        },
        {
          q: 'Why do items in Pcs or Nos omit decimal places?',
          a: 'To match real warehouse counts, units such as Pcs, Pc, and Nos are always formatted as whole integers, while monetary amounts, rates, and decimal-based weights format up to 2 decimal places.',
        },
        {
          q: 'Can I restrict what staff members can view or edit?',
          a: 'Yes. Company Admins can assign roles (including Admin and Marketing Manager) and configure granular module permissions across voucher creation, alteration, reports, payroll, and manufacturing.',
        },
        {
          q: 'How does automatic voucher serial numbering work?',
          a: 'Each voucher type maintains a dedicated counter document that increments cleanly on save, ensuring sequential numbering without scanning historical vouchers.',
        },
        {
          q: 'Are Payroll and Production Management included?',
          a: 'Yes. Supported plans (such as Gold Plan and above) include full access to Payroll (payslips, attendance sheets, pay sheets) and Production Order & Machine Management.',
        },
        {
          q: 'How can administrators verify who edited or deleted a voucher?',
          a: 'Open Reports → Audit Trail in your Dashboard to inspect recorded creations, updates, timestamps, and user actions.',
        },
      ];

  return (
    <InfoPageLayout
      kicker={isBn ? 'ব্যবহার নির্দেশিকা ও সহায়তা' : 'Onboarding & Support'}
      title={isBn ? 'ইউজার গাইড ও সচরাচর জিজ্ঞাসা (FAQ)' : 'User Guide & FAQ'}
      subtitle={
        isBn
          ? `${appName}-এ কোম্পানি সেটআপ, ডাবল-এন্ট্রি ভাউচার, FIFO স্টক এবং ১০টি মূল রিপোর্ট ও .xlsx/PDF এক্সপোর্ট ব্যবহারের ব্যবহারিক নির্দেশিকা।`
          : `Practical onboarding steps for ${appName} company setup, double-entry vouchers, FIFO godown stock, and the 10 core reports.`
      }
      metaLine={
        isBn
          ? `প্রোডাক্ট ডকুমেন্টেশন · ${appName} · বাংলা ও ইংরেজি`
          : `Product Documentation · ${appName} · Bilingual EN / BN`
      }
      toc={toc}
    >
      {/* 01. Step-by-Step Onboarding */}
      <section id="onboarding" className="scroll-mt-28 space-y-5 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          01. {toc[0].title}
        </h2>
        <div className="space-y-4">
          {onboardingSteps.map((item) => (
            <div
              key={item.step}
              className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-start gap-4"
            >
              <span className="text-xs font-bold tabular-nums text-blue-600 dark:text-blue-400 shrink-0 pt-0.5">
                {isBn ? `ধাপ ${item.step}` : `Step ${item.step}`}
              </span>
              <div className="space-y-1">
                <h3 className="text-[15px] font-bold text-slate-950 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {item.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 02. Double-Entry Vouchers & Inventory */}
      <section id="vouchers" className="scroll-mt-28 space-y-4 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          02. {toc[1].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'ড্যাশবোর্ডের Voucher Entry স্ক্রিন থেকে এক জায়গাতেই সব ধরনের ব্যবসায়িক লেনদেন সম্পন্ন করা যায়। প্রতিটি সংরক্ষিত ভাউচার তাৎক্ষণিকভাবে সংশ্লিষ্ট লেজার ব্যালেন্স এবং গোডাউন স্টক সমন্বয় করে।'
            : 'All accounting and warehouse movements flow through Voucher Entry inside your Dashboard. Saving a voucher updates ledger balances and godown inventory levels cleanly.'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">
              {isBn ? 'আর্থিক ও বাণিজ্যিক ভাউচার' : 'Accounting & Trade Vouchers'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Sales, Purchase, Receipt, Payment, Contra, Journal
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white mb-1.5">
              {isBn ? 'ইনভেন্টরি ও গোডাউন নিয়ন্ত্রণ' : 'Inventory & Warehouse Vouchers'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {isBn
                ? 'Stock Transfer, Physical Stock এবং FIFO ব্যাচ মূল্যায়ন'
                : 'Stock Transfer, Physical Stock & FIFO Batch Valuation'}
            </p>
          </div>
        </div>
      </section>

      {/* 03. 10 Core Reports & Exports */}
      <section id="reports-export" className="scroll-mt-28 space-y-4 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          03. {toc[2].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'প্রতিটি মূল রিপোর্টে স্থির হেডার ও স্টিকি টেবিল কলাম, .xlsx (Excel ওয়ার্কবুক) এক্সপোর্ট, একই ফরম্যাটে PDF ডাউনলোড, A4 প্রিন্ট এবং ইমেইল শেয়ারিং যুক্ত আছে।'
            : 'Every core report features sticky table headers, structured .xlsx workbook exports, unified PDF & A4 Print layouts, and Email sharing.'}
        </p>
        <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm text-slate-700 dark:text-slate-300">
          {coreReports.map((rep, idx) => (
            <li
              key={rep}
              className="flex items-baseline gap-2.5 px-3.5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30"
            >
              <span className="text-xs font-bold tabular-nums text-slate-400">
                {String(idx + 1).padStart(2, '0')}.
              </span>
              <span>{rep}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* 04. Frequently Asked Questions */}
      <section id="faq" className="scroll-mt-28 space-y-4">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          04. {toc[3].title}
        </h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          {faqs.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={item.q} className="bg-white dark:bg-slate-900/30">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  aria-expanded={isOpen}
                  className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                    {item.q}
                  </span>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200',
                      isOpen && 'rotate-180 text-slate-900 dark:text-white'
                    )}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 flex flex-wrap items-center gap-4 text-sm">
          <Link to="/contact" className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            {isBn ? 'আরও সাহায্যের জন্য সাপোর্টে যোগাযোগ করুন →' : 'Need further assistance? Contact Support →'}
          </Link>
          <Link to="/docs" className="font-medium text-slate-600 dark:text-slate-400 hover:underline">
            {isBn ? 'বিস্তারিত মডিউল হেল্প (/docs)' : 'Detailed Module Help (/docs)'}
          </Link>
        </div>
      </section>
    </InfoPageLayout>
  );
};
