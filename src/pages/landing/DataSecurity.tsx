import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout, InfoTocItem } from '../../components/landing/InfoPageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

export const DataSecurity: React.FC = () => {
  const { language } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity.appName;
  const supportEmail = appIdentity.supportEmail;

  const toc: InfoTocItem[] = isBn
    ? [
        { id: 'overview', number: '01', title: 'নিরাপত্তা স্থাপত্যের সারসংক্ষেপ' },
        { id: 'auth', number: '02', title: 'Firebase Authentication ও সেশন সুরক্ষা' },
        { id: 'isolation', number: '03', title: 'কোম্পানি-ভিত্তিক ডেটা পৃথকীকরণ' },
        { id: 'rbac-audit', number: '04', title: 'RBAC অনুমতি ও অডিট ট্রেইল' },
        { id: 'backups', number: '05', title: 'ব্যবহারকারী-নিয়ন্ত্রিত ব্যাকআপ (.xlsx, PDF ও Print)' },
        { id: 'resilience', number: '06', title: 'কোটা সুরক্ষা ও ক্যাশ স্থিতিশীলতা' },
      ]
    : [
        { id: 'overview', number: '01', title: 'Security Architecture Overview' },
        { id: 'auth', number: '02', title: 'Firebase Authentication & Session Controls' },
        { id: 'isolation', number: '03', title: 'Company-Level Firestore Isolation' },
        { id: 'rbac-audit', number: '04', title: 'Role-Based Access & Audit Trail' },
        { id: 'backups', number: '05', title: 'User-Controlled Backups (.xlsx, PDF & Print)' },
        { id: 'resilience', number: '06', title: 'Quota Protection & Cache Resilience' },
      ];

  return (
    <InfoPageLayout
      kicker={isBn ? 'নিরাপত্তা ও ব্যাকআপ' : 'Trust & Infrastructure'}
      title={isBn ? 'ডেটা নিরাপত্তা ও ব্যাকআপ' : 'Data Security & Backup'}
      subtitle={
        isBn
          ? `${appName}-এ কীভাবে প্রমাণীকরণ, কোম্পানি-ভিত্তিক Firestore সুরক্ষা, RBAC নিয়ন্ত্রণ, অডিট ট্রেইল এবং .xlsx/PDF ব্যাকআপ একত্রে আপনার প্রতিষ্ঠানের তথ্য নিরাপদ রাখে।`
          : `How ${appName} protects business records through Firebase Authentication, Firestore tenant isolation, RBAC, audit logging, and user-controlled .xlsx and PDF exports.`
      }
      metaLine={
        isBn
          ? `নিরাপত্তা মানদণ্ড · ${appName} · TLS এনক্রিপশন ও অডিট ট্রেইল`
          : `Security Controls · ${appName} · TLS Encryption & Audit Logging`
      }
      toc={toc}
    >
      <section id="overview" className="scroll-mt-28 space-y-4 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          01. {toc[0].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'আর্থিক ও ইনভেন্টরি সফটওয়্যারে নির্ভরযোগ্যতা কেবল পাসওয়ার্ডের ওপর নির্ভর করে না; ডেটা সংযোগ, প্রতিষ্ঠানের সীমানা নির্ধারণ, ব্যবহারকারীর ভূমিকা এবং অফলাইন ব্যাকআপ—সব স্তরেই সুরক্ষা প্রয়োজন।'
            : 'Reliable accounting software requires protection across every layer—session authentication, organization boundaries, permission checks, change history, and portable user-owned exports.'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {isBn ? 'ট্রানজিট এনক্রিপশন' : 'Encryption in Transit'}
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {isBn
                ? 'সকল API ও Firestore যোগাযোগ HTTPS/TLS এর মাধ্যমে এনক্রিপ্টেড।'
                : 'All browser-to-cloud traffic runs over encrypted HTTPS/TLS channels.'}
            </p>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              {isBn ? 'পারমাণবিক লেনদেন' : 'Atomic Voucher Writes'}
            </p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
              {isBn
                ? 'ভাউচার সংরক্ষণের সাথে সাথে লেজার ব্যালেন্স ও স্টক অ্যাটমিক ব্যাচে আপডেট হয়।'
                : 'Voucher saves commit ledger balances and item stock updates in atomic batches.'}
            </p>
          </div>
        </div>
      </section>

      <section id="auth" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          02. {toc[1].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'ব্যবহারকারীর প্রমাণীকরণ Google Firebase Authentication দ্বারা পরিচালিত হয়। সিস্টেমে ইমেইল/পাসওয়ার্ড এবং Google Sign-In সমর্থিত, পাসওয়ার্ড কখনোই প্লেইনটেক্সটে ডেটাবেসে সংরক্ষণ করা হয় না এবং সাইন-ইন পৃষ্ঠা থেকেই নিরাপদ পাসওয়ার্ড রিসেট লিংক পাঠানো যায়।'
            : 'Identity verification is handled through Google Firebase Authentication supporting Email/Password and Google Sign-In. Passwords are never stored in application collections, and password recovery uses Firebase verification emails.'}
        </p>
      </section>

      <section id="isolation" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          03. {toc[2].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'প্রতিটি প্রতিষ্ঠানের লেজার, ভাউচার, আইটেম, গোডাউন এবং সেটিংস নথিতে একটি নির্ধারিত companyId থাকে। ক্লায়েন্ট কোয়েরি এবং Firestore Security Rules শুধুমাত্র আপনার অনুমোদিত কোম্পানির নথিতেই অ্যাক্সেস সীমাবদ্ধ রাখে—অন্য প্রতিষ্ঠানের তথ্যের সাথে কখনোই মিশ্রণ হয় না।'
            : 'Every company workspace is bound to a dedicated companyId across ledgers, vouchers, inventory items, godowns, and settings documents. Targeted indexed queries and Firestore security rules enforce strict tenant separation between organizations.'}
        </p>
      </section>

      <section id="rbac-audit" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          04. {toc[3].title}
        </h2>
        <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'ভূমিকা-ভিত্তিক অনুমতি (RBAC): Admin, Marketing Manager এবং কাস্টম অপারেটর ভূমিকার মাধ্যমে ভাউচার তৈরি, এডিট, আর্থিক রিপোর্ট, পেরোল ও ইনভেন্টরি অ্যাক্সেস আলাদাভাবে নিয়ন্ত্রণ করা যায়।'
              : 'Role-Based Access Control (RBAC): Assign Admin, Marketing Manager, or custom operator permissions to control who can create/alter vouchers, inspect financial statements, or manage payroll.'}
          </li>
          <li>
            {isBn
              ? 'অডিট ট্রেইল ও হিস্ট্রি ট্র্যাকিং: গুরুত্বপূর্ণ ভাউচার ও মাস্টার রেকর্ড তৈরি, সংশোধন বা মুছে ফেলার কার্যক্রম Audit Trail মডিউলে নথিভুক্ত থাকে।'
              : 'Audit Trail & Change History: Key master and voucher creations, edits, and deletions are logged in the Audit Trail report for internal oversight.'}
          </li>
          <li>
            {isBn
              ? 'কোম্পানির আইনি পরিচয় সুরক্ষা: প্রিন্ট ও পিডিএফ ইনভয়েসে কেবল অনুমোদিত কোম্পানির নাম, ঠিকানা, ফোন ও ভ্যাট/টিআইএন নম্বর ব্যবহৃত হয়।'
              : 'Strict Legal Print Identity: Printed vouchers and PDF statements strictly resolve the active company’s legal identity, address, and tax registration fields.'}
          </li>
        </ul>
      </section>

      <section id="backups" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          05. {toc[4].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `${appName}-এ আপনার প্রতিষ্ঠানের ডেটার ওপর আপনার পূর্ণ নিয়ন্ত্রণ রয়েছে। প্রাথমিক স্প্রেডশিট মানদণ্ড হিসেবে .xlsx (Excel ওয়ার্কবুক) এক্সপোর্টের পাশাপাশি প্রতিটি মূল রিপোর্ট ও ভাউচার থেকে তাৎক্ষণিকভাবে PDF ডাউনলোড, A4 প্রিন্ট (Layout 1 ও Layout 2) এবং ইমেইল শেয়ারিং করা যায়।`
            : `Your organization always holds portable copies of its financial records. ${appName} provides structured .xlsx workbook exports as the primary spreadsheet standard alongside instant PDF downloads, formal A4 Print (Layout 1 & Layout 2), and Email delivery directly from reports and vouchers.`}
        </p>
      </section>

      <section id="resilience" className="scroll-mt-28 space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          06. {toc[5].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'টার্গেটেড রেঞ্জ কোয়েরি, প্রি-অ্যাগ্রিগেটেড লেজার ব্যালেন্স এবং ৩০ মিনিটের স্মার্ট মেমোরি/লোকাল ক্যাশিং অপ্রয়োজনীয় ডেটাবেস রিড কমায়। ইন্টারনেট সংযোগ বিচ্ছিন্ন হলে বা কোটা সীমায় পৌঁছালে অ্যাপটি ক্র্যাশ না হয়ে পরিষ্কার সতর্কবার্তা প্রদর্শন করে। কোনো নিরাপত্তা সমস্যা নজরে এলে অবিলম্বে ইমেইল করুন:'
            : 'Targeted indexed queries, pre-aggregated ledger balances, and 30-minute memory/localStorage caching protect database stability. If the network drops or a quota limit is reached, the workspace notifies users cleanly without crashing. To report a security concern, contact:'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          <a href={`mailto:${supportEmail}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">
            {supportEmail}
          </a>
          {' · '}
          <Link to="/guide" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {isBn ? 'ইউজার গাইড ও FAQ দেখুন' : 'View User Guide & FAQ'}
          </Link>
        </p>
      </section>
    </InfoPageLayout>
  );
};
