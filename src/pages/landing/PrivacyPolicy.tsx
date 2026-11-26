import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout, InfoTocItem } from '../../components/landing/InfoPageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

export const PrivacyPolicy: React.FC = () => {
  const { language } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity.appName;
  const supportEmail = appIdentity.supportEmail;

  const toc: InfoTocItem[] = isBn
    ? [
        { id: 'scope', number: '01', title: 'নীতিমালার আওতা ও পরিচয়' },
        { id: 'collection', number: '02', title: 'আমরা কোন তথ্য সংগ্রহ করি' },
        { id: 'usage', number: '03', title: 'তথ্যের ব্যবহার ও উদ্দেশ্য' },
        { id: 'ownership', number: '04', title: 'ব্যবহারকারীর মালিকানা ও ডেটা পৃথকীকরণ' },
        { id: 'infrastructure', number: '05', title: 'ক্লাউড অবকাঠামো ও তৃতীয় পক্ষ' },
        { id: 'retention', number: '06', title: 'ডেটা সংরক্ষণ, এক্সপোর্ট ও মুছে ফেলার অধিকার' },
        { id: 'contact', number: '07', title: 'গোপনীয়তা সংক্রান্ত যোগাযোগ' },
      ]
    : [
        { id: 'scope', number: '01', title: 'Scope & Applicability' },
        { id: 'collection', number: '02', title: 'Information We Collect' },
        { id: 'usage', number: '03', title: 'How We Use Information' },
        { id: 'ownership', number: '04', title: 'Data Ownership & Company Isolation' },
        { id: 'infrastructure', number: '05', title: 'Cloud Infrastructure & Sub-processors' },
        { id: 'retention', number: '06', title: 'Retention, Export & Deletion Rights' },
        { id: 'contact', number: '07', title: 'Privacy Contact' },
      ];

  return (
    <InfoPageLayout
      kicker={isBn ? 'আইনি ও গোপনীয়তা নথি' : 'Legal & Privacy'}
      title={isBn ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
      subtitle={
        isBn
          ? `${appName} ব্যবহারের সময় আপনার অ্যাকাউন্ট প্রোফাইল এবং প্রতিষ্ঠানের হিসাব ও ইনভেন্টরি তথ্য কীভাবে সংগৃহীত, ব্যবহৃত ও সুরক্ষিত থাকে তার স্পষ্ট বিবরণ।`
          : `How ${appName} collects, processes, protects, and respects your authentication profile and organization accounting records.`
      }
      metaLine={
        isBn
          ? `কার্যকর তারিখ: নভেম্বর ২০২৬ · ${appName} · OAuth ও ডেটা সম্মতি`
          : `Effective Date: November 2026 · ${appName} · OAuth & Workspace Compliance`
      }
      toc={toc}
    >
      <section id="scope" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          01. {toc[0].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `এই গোপনীয়তা নীতি ${appName} ওয়েব অ্যাপ্লিকেশন এবং সংশ্লিষ্ট পাবলিক লগইন, নিবন্ধন ও অ্যাকাউন্টিং ড্যাশবোর্ড ব্যবহারের ক্ষেত্রে প্রযোজ্য। আপনি যখন ইমেইল/পাসওয়ার্ড বা Google Sign-In ব্যবহার করে সাইন ইন করেন, তখন আমরা কেবল আপনার ওয়ার্কস্পেস পরিচালনা, নিরাপত্তা নিশ্চিত করা এবং আপনার প্রতিষ্ঠানের হিসাব সংরক্ষণের জন্য প্রয়োজনীয় তথ্য প্রক্রিয়া করি।`
            : `This Privacy Policy applies to the ${appName} web application, authentication screens, and multi-company accounting and inventory dashboard. When you create a workspace or sign in using Email/Password or Google Sign-In, we process only the information required to authenticate your session, isolate your company workspace, and maintain the business records you enter.`}
        </p>
      </section>

      <section id="collection" className="scroll-mt-28 space-y-4 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          02. {toc[1].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'সফটওয়্যার পরিচালনার জন্য আমরা দুটি স্পষ্ট শ্রেণির তথ্য সংরক্ষণ করি:'
            : 'We collect and store two clearly separated categories of information needed to run your workspace:'}
        </p>
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 w-1/3">
                  {isBn ? 'তথ্যের শ্রেণি' : 'Category'}
                </th>
                <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                  {isBn ? 'সংগৃহীত বিবরণ' : 'Specific Data Elements'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  {isBn ? 'অ্যাকাউন্ট ও প্রমাণীকরণ তথ্য' : 'Account & Authentication Profile'}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn
                    ? 'Firebase Authentication UID, নাম (Display Name), ইমেইল ঠিকানা, নির্ধারিত কোম্পানি আইডি ও ভূমিকা (যেমন: Admin, Marketing Manager, Operator)। Google Sign-In ব্যবহার করলে কেবল মৌলিক নাম ও ইমেইল প্রোফাইল নেওয়া হয়।'
                    : 'Firebase Authentication UID, display name, email address, assigned company ID, and workspace role (such as Admin, Marketing Manager, or Operator). When signing in with Google, only basic identity profile fields (name and email) are requested.'}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  {isBn ? 'ব্যবহারকারী-প্রদত্ত ব্যবসায়িক ও হিসাব তথ্য' : 'User-Entered Business & Accounting Records'}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn
                    ? 'কোম্পানির নাম, ঠিকানা, অর্থবছরের শুরু, মুদ্রার প্রতীক, লেজার গ্রুপ, পার্টি লেজার, ভাউচার (Sales, Purchase, Receipt, Payment, Contra, Journal, Stock Transfer, Physical Stock), স্টক আইটেম, গোডাউন, কর্মচারী ও পে-রোল রেকর্ড এবং উৎপাদন অর্ডার।'
                    : 'Company profile, financial year configuration, currency symbol, chart of accounts, ledgers, double-entry vouchers (Sales, Purchase, Receipt, Payment, Contra, Journal, Stock Transfer, Physical Stock), inventory items, godowns, payroll records, and production orders entered by authorized team members.'}
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                  {isBn ? 'যোগাযোগ ফর্ম ও সাপোর্ট বার্তা' : 'Contact & Support Inquiries'}
                </td>
                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn
                    ? 'আপনি স্বেচ্ছায় Contact ফর্ম জমা দিলে আপনার নাম, ইমেইল, বিষয় ও বার্তা শুধুমাত্র উত্তর দেওয়ার জন্য সংরক্ষণ করা হয়।'
                    : 'Name, email address, subject, and message voluntarily submitted through the public Contact & Support form solely to respond to your request.'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="usage" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          03. {toc[2].title}
        </h2>
        <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'আপনার প্রতিষ্ঠানের ডাবল-এন্ট্রি ভাউচার পোস্ট করা, FIFO স্টক ভ্যালুয়েশন গণনা এবং ১০টি মূল আর্থিক ও ইনভেন্টরি রিপোর্ট তৈরি করা।'
              : 'Operating your accounting books, FIFO stock valuations, multi-godown tracking, and generating core financial and inventory reports.'}
          </li>
          <li>
            {isBn
              ? 'ভূমিকা-ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ (RBAC) ও অডিট ট্রেইল লগিং কার্যকর রাখা যাতে প্রতিটি পরিবর্তন কে ও কখন করেছে তা যাচাই করা যায়।'
              : 'Enforcing role-based access control (RBAC) permissions and maintaining an audit trail so company administrators can review record modifications.'}
          </li>
          <li>
            {isBn
              ? 'ডেটাবেস কোটা স্থিতিশীল রাখা, অফলাইন/লোকাল ক্যাশিং সমর্থন করা এবং কারিগরি সাপোর্ট প্রদান করা।'
              : 'Maintaining workspace responsiveness through local caching, managing quota stability, and resolving support or billing requests.'}
          </li>
          <li>
            {isBn
              ? 'আমরা কখনোই আপনার আর্থিক বা ব্যবসায়িক তথ্য বিজ্ঞাপনদাতা বা তৃতীয় পক্ষের ডেটা ব্রোকারের কাছে বিক্রি বা ভাড়া দিই না।'
              : 'We never sell, rent, or trade your company accounting records or personal details to advertisers or third-party data brokers.'}
          </li>
        </ul>
      </section>

      <section id="ownership" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          04. {toc[3].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `${appName}-এ প্রবেশ করানো প্রতিটি ভাউচার, লেজার, স্টক আইটেম ও রিপোর্টের সম্পূর্ণ মালিকানা আপনার এবং আপনার প্রতিষ্ঠানের। প্রতিটি কোম্পানি একটি স্বতন্ত্র companyId দ্বারা পৃথক থাকে এবং Firestore নিরাপত্তা নিয়মাবলি অনুযায়ী অনুমোদিত ব্যবহারকারী ছাড়া অন্য কোনো প্রতিষ্ঠান আপনার রেকর্ড দেখতে পারে না।`
            : `You and your organization retain full ownership of all accounting, inventory, payroll, and customer/vendor records entered into ${appName}. Each workspace is scoped to its own companyId, and access is restricted by Firebase Authentication and Firestore security rules to authorized members of that company.`}
        </p>
      </section>

      <section id="infrastructure" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          05. {toc[4].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `${appName} নিরাপদ সেশন ও ক্লাউড ডেটাবেস পরিচালনার জন্য Google Firebase (Firebase Authentication ও Cloud Firestore) অবকাঠামো ব্যবহার করে। ব্রাউজার থেকে সার্ভার পর্যন্ত সমস্ত ডেটা আদান-প্রদান এনক্রিপ্টেড HTTPS/TLS সংযোগের মাধ্যমে সম্পন্ন হয়। এছাড়া দ্রুতগতির কাজের জন্য ব্রাউজারের localStorage-এ অস্থায়ী ক্যাশ (যেমন ভাষা পছন্দ, UI সেটিংস ও সাম্প্রতিক মাস্টার ডেটা ক্যাশ) সংরক্ষিত থাকতে পারে, যা সাইন-আউট বা ব্রাউজার ডেটা ক্লিয়ার করলে মুছে ফেলা যায়।`
            : `${appName} relies on Google Firebase (Firebase Authentication and Cloud Firestore) for identity verification and persistent cloud storage. All traffic between your browser and cloud endpoints is encrypted in transit using HTTPS/TLS. Temporary workspace preferences and read-optimization caches (such as selected language, UI preferences, and company master caches) may be stored in browser localStorage for performance and offline resilience.`}
        </p>
      </section>

      <section id="retention" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          06. {toc[5].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'আপনি যেকোনো সময় ড্যাশবোর্ডের ডেটা সেন্টার বা প্রতিটি রিপোর্ট থেকে .xlsx (Excel ওয়ার্কবুক), PDF এবং A4 প্রিন্ট ফরম্যাটে আপনার প্রতিষ্ঠানের সম্পূর্ণ হিসাব ও স্টক তথ্য এক্সপোর্ট করে নিজস্ব ব্যাকআপ রাখতে পারেন। আপনার প্রতিষ্ঠান সক্রিয় থাকা পর্যন্ত রেকর্ড সংরক্ষিত থাকে। অ্যাকাউন্ট বা কোম্পানির সম্পূর্ণ ডেটা মুছে ফেলার অনুরোধ করতে আমাদের সাপোর্ট ইমেইলে লিখুন।'
            : 'You can export your ledgers, vouchers, stock summaries, and financial statements at any time as .xlsx workbooks, PDF files, or A4 print layouts for your own records. We retain company records while your workspace remains active. To request account or company data deletion, contact our support team using your registered administrator email.'}
        </p>
      </section>

      <section id="contact" className="scroll-mt-28 space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          07. {toc[6].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'গোপনীয়তা নীতি, ডেটা এক্সপোর্ট বা অ্যাকাউন্ট মুছে ফেলার অনুরোধ সংক্রান্ত যেকোনো প্রশ্নের জন্য সরাসরি যোগাযোগ করুন:'
            : 'For privacy questions, data access requests, or workspace deletion inquiries, please reach out to:'}
        </p>
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-1.5 text-sm">
          <p className="font-semibold text-slate-900 dark:text-white">{appName}</p>
          <p className="text-slate-600 dark:text-slate-300">
            {isBn ? 'সাপোর্ট ইমেইল:' : 'Support Email:'}{' '}
            <a href={`mailto:${supportEmail}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">
              {supportEmail}
            </a>
          </p>
          <p className="pt-1">
            <Link to="/contact" className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
              {isBn ? 'যোগাযোগ ও সাপোর্ট পেজ দেখুন →' : 'Open Contact & Support Page →'}
            </Link>
          </p>
        </div>
      </section>
    </InfoPageLayout>
  );
};
