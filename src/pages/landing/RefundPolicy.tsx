import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout, InfoTocItem } from '../../components/landing/InfoPageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

export const RefundPolicy: React.FC = () => {
  const { language } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity.appName || 'TallyFlow ERP';
  const supportEmail = appIdentity.supportEmail;

  const toc: InfoTocItem[] = isBn
    ? [
        { id: 'plan-structure', number: '01', title: 'প্ল্যান কাঠামো ও বিলিং চক্র' },
        { id: 'cancellation', number: '02', title: 'সাবস্ক্রিপশন বাতিল ও ডাউনগ্রেড প্রক্রিয়া' },
        { id: 'refund-eligibility', number: '03', title: 'রিফান্ড পাওয়ার যোগ্যতা ও সময়সীমা' },
        { id: 'data-export-rights', number: '04', title: 'বাতিলের আগে ডেটা ও রিপোর্ট এক্সপোর্ট অধিকার' },
        { id: 'disputes-timeline', number: '05', title: 'ডুপ্লিকেট চার্জ ও রিফান্ড নিষ্পত্তি সময়' },
      ]
    : [
        { id: 'plan-structure', number: '01', title: 'Plan Structure & Billing Cycles' },
        { id: 'cancellation', number: '02', title: 'Subscription Cancellation & Downgrade' },
        { id: 'refund-eligibility', number: '03', title: 'Refund Eligibility & Review Windows' },
        { id: 'data-export-rights', number: '04', title: 'Data Export Rights Prior to Changes' },
        { id: 'disputes-timeline', number: '05', title: 'Billing Disputes & Processing Timeline' },
      ];

  return (
    <InfoPageLayout
      kicker={isBn ? 'বিলিং ও রিফান্ড নীতিমালা' : 'Billing & Subscription Policy'}
      title={isBn ? 'রিফান্ড ও বাতিলকরণ নীতি (Refund & Cancellation)' : 'Refund & Cancellation Policy'}
      subtitle={
        isBn
          ? `${appName}-এর সাবস্ক্রিপশন প্ল্যান পরিবর্তন, বাতিলকরণ, রিফান্ড পর্যালোচনা এবং ডেটা রপ্তানি অধিকারের স্বচ্ছ নিয়মাবলী।`
          : `Clear terms covering subscription plan cancellations, billing cycle handling, refund review windows, and your data export rights in ${appName}.`
      }
      metaLine={
        isBn
          ? `কার্যকর তারিখ: নভেম্বর ২০২৬ · ${appName} · স্বচ্ছ সাবস্ক্রিপশন শর্ত`
          : `Effective Date: November 2026 · ${appName} · Transparent Subscription Terms`
      }
      toc={toc}
    >
      <section id="plan-structure" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          01. {toc[0].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `${appName}-এ চারটি স্বচ্ছ সাবস্ক্রিপশন টিয়ার রয়েছে: Bronze (বিনামূল্যে কোর অ্যাকাউন্টিং), Silver (মাল্টি-গোডাউন ইনভেন্টরি ও FIFO), Gold (সীমাহীন ভাউচার, পেরোল, অর্ডার ম্যানেজমেন্ট ও উৎপাদন), এবং Platinum (প্রতিষ্ঠানের চাহিদা অনুযায়ী কাস্টম এন্টারপ্রাইজ চুক্তি)।`
            : `${appName} operates four structured plan tiers: Bronze Free (core double-entry accounting), Silver (multi-godown inventory and FIFO batch valuation), Gold (unlimited vouchers with Payroll, Order Management, Manufacturing, and Insights), and Platinum (tailored multi-branch enterprise agreements).`}
        </p>
        <ul className="space-y-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'Bronze Free প্ল্যানে কোনো সাবস্ক্রিপশন চার্জ বা সেটআপ ফি নেই এবং কোনো কার্ড ছাড়াই ব্যবহার করা যায়।'
              : 'The Bronze Free tier carries zero subscription charges and no setup fees.'}
          </li>
          <li>
            {isBn
              ? 'Silver এবং Gold প্ল্যানগুলো মাসিক (Monthly) অথবা বার্ষিক (Annual — ২০% সাশ্রয়ী) বিলিং চক্রে চালু করা যায়।'
              : 'Silver and Gold plans are offered on Monthly or Annual (20% discounted) billing cycles as listed on the Pricing page.'}
          </li>
          <li>
            {isBn
              ? 'যেকোনো প্ল্যানের সীমা, মডিউল ও বর্তমান মূল্য সম্পর্কে জানতে প্রাইসিং পৃষ্ঠা দেখুন।'
              : 'Exact quotas, included modules, and published pricing rates are maintained transparently on the Pricing page.'}
          </li>
        </ul>
      </section>

      <section id="cancellation" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          02. {toc[1].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'ওয়ার্কস্পেসের অনুমোদিত অ্যাডমিনিস্ট্রেটর যেকোনো সময় পরবর্তী বিলিং রিনিউয়ালের আগে সাবস্ক্রিপশন বাতিল বা নিম্নতর টিয়ারে পরিবর্তনের অনুরোধ করতে পারবেন।'
            : 'An authorized Workspace Administrator may cancel renewal or request a plan downgrade at any time prior to the next scheduled billing cycle date.'}
        </p>
        <ul className="space-y-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'বাতিলের অনুরোধের পর চলমান পরিশোধিত মেয়াদ শেষ না হওয়া পর্যন্ত আপনার ওয়ার্কস্পেসের সব মডিউল সচল থাকবে এবং পরবর্তী চক্রে আর কোনো চার্জ করা হবে না।'
              : 'When canceled, your active modules remain available through the end of the already-paid billing period, and no subsequent renewal charge is billed.'}
          </li>
          <li>
            {isBn
              ? 'প্রোডাকশন ওয়ার্কস্পেসে হঠাৎ ডেটা বা প্রবেশাধিকার বন্ধ না করে, মেয়াদ শেষে অ্যাকাউন্ট প্রযোজ্য সীমার মধ্যে বিনামূল্যে Bronze টিয়ারে অথবা নির্ধারিত আর্কাইভ অবস্থায় রাখা হয়।'
              : 'At the conclusion of a canceled paid term, workspaces transition without silent deletion so administrators preserve access to historical records within applicable limits.'}
          </li>
        </ul>
      </section>

      <section id="refund-eligibility" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          03. {toc[2].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'সাবস্ক্রিপশন চার্জ সংক্রান্ত রিফান্ড অনুরোধগুলো নিচের স্বচ্ছ নীতিমালার ভিত্তিতে পর্যালোচনা করা হয়:'
            : 'Refund requests are reviewed fairly according to your billing cycle and workspace activation status:'}
        </p>
        <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'বার্ষিক (Annual) প্ল্যান: প্রথমবার সাবস্ক্রিপশন চালু বা রিনিউয়াল চার্জ কাটার ১৪ ক্যালেন্ডার দিনের মধ্যে লিখিত অনুরোধ করলে পূর্ণ বা যুক্তিসঙ্গত রিফান্ডের জন্য পর্যালোচনা করা হয়।'
              : 'Annual Plans: Requests submitted within 14 calendar days of initial activation or annual renewal are eligible for full refund review.'}
          </li>
          <li>
            {isBn
              ? 'মাসিক (Monthly) প্ল্যান: মাসিক বিলিং চক্র স্বল্পমেয়াদি হওয়ায় চলমান মাসের অব্যবহৃত দিনের জন্য আংশিক (prorated) রিফান্ড সাধারণত প্রযোজ্য হয় না; তবে ডুপ্লিকেট চার্জ বা যাচাইকৃত দীর্ঘস্থায়ী সিস্টেম বিভ্রাটের ক্ষেত্রে পূর্ণ বা সমানুপাতিক রিফান্ড বিবেচনা করা হয়।'
              : 'Monthly Plans: Monthly charges are non-prorated once a billing month has started, except in cases of verified duplicate billing or extended verified platform unavailability.'}
          </li>
          <li>
            {isBn
              ? 'Platinum কাস্টম এন্টারপ্রাইজ: কাস্টম ডোমেইন, ডেডিকেটেড অনবোর্ডিং বা কাস্টম রিপোর্ট ডেভেলপমেন্ট থাকলে তা উভয় পক্ষের স্বাক্ষরিত সার্ভিস চুক্তি (SLA) অনুযায়ী নিষ্পত্তি হয়।'
              : 'Platinum Custom Agreements: Custom onboarding, dedicated deployment work, and custom report terms are governed by the signed commercial agreement.'}
          </li>
        </ul>
      </section>

      <section id="data-export-rights" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          04. {toc[3].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'আপনার প্রতিষ্ঠানের হিসাব ও স্টকের মালিকানা সম্পূর্ণ আপনার। যেকোনো প্ল্যান পরিবর্তন, ডাউনগ্রেড বা ওয়ার্কস্পেস বন্ধ করার আগে আপনি সম্পূর্ণ তথ্য রপ্তানি করে নিজের সংরক্ষণে নিতে পারবেন:'
            : 'Your organization retains full ownership of its financial and inventory records. Prior to any downgrade or workspace closure, administrators can export full records at zero extra fee:'}
        </p>
        <ul className="space-y-2 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'প্রাইমারি স্প্রেডশিট ফরম্যাট: Daybook, Trial Balance, Ledger Statement, Profit & Loss, Balance Sheet, Cash Flow, Stock Summary ও Payroll শিটগুলো কাঠামোবদ্ধ .xlsx ফাইলে ডাউনলোড করুন।'
              : 'Structured .xlsx Workbooks: Export Daybook, Trial Balance, Ledger Statement, Profit & Loss, Balance Sheet, Cash Flow, Stock Summary, and Payroll schedules in .xlsx format.'}
          </li>
          <li>
            {isBn
              ? 'প্রিন্ট, PDF ও ইমেইল: অভিন্ন A4 Print Layout 1 ও 2, PDF ডকুমেন্ট বা সরাসরি ইমেইল ডিসপ্যাচের মাধ্যমে অডিট-প্রস্তুত কপি সংরক্ষণ করুন।'
              : 'Print, PDF & Email: Archive audit-ready copies via unified A4 Print Layouts 1 & 2, generated PDF files, or direct email dispatch.'}
          </li>
        </ul>
      </section>

      <section id="disputes-timeline" className="scroll-mt-28 space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          05. {toc[4].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'ভুল চার্জ, ডাবল পেমেন্ট বা রিফান্ডের অনুরোধ জানাতে অনুগ্রহ করে প্রতিষ্ঠানের নাম, নিবন্ধিত অ্যাডমিন ইমেইল এবং পেমেন্ট রেফারেন্স নম্বরসহ আমাদের সাপোর্ট ডেস্কে যোগাযোগ করুন। অনুমোদিত রিফান্ড সাধারণত ৭ থেকে ১০ কর্মদিবসের মধ্যে মূল পেমেন্ট মাধ্যমে ফেরত পাঠানো হয়।'
            : 'To request a cancellation review, refund, or billing correction, please include your organization name, registered admin email, and payment reference. Approved refunds are issued within 7–10 business days to the original payment method.'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
          <a href={`mailto:${supportEmail}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">
            {supportEmail}
          </a>
          {' · '}
          <Link to="/contact" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {isBn ? 'সাপোর্ট ফর্মে অনুরোধ পাঠান' : 'Submit request via Contact Desk'}
          </Link>
          {' · '}
          <Link to="/pricing" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {isBn ? 'প্ল্যানসমূহ দেখুন' : 'View Pricing Tiers'}
          </Link>
        </p>
      </section>
    </InfoPageLayout>
  );
};
