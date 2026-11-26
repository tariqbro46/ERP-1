import React from 'react';
import { Link } from 'react-router-dom';
import { InfoPageLayout, InfoTocItem } from '../../components/landing/InfoPageLayout';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

export const TermsOfService: React.FC = () => {
  const { language } = useLanguage();
  const { appIdentity } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity.appName;
  const supportEmail = appIdentity.supportEmail;

  const toc: InfoTocItem[] = isBn
    ? [
        { id: 'acceptance', number: '01', title: 'শর্তাবলী গ্রহণ ও অনুমোদিত ব্যবহার' },
        { id: 'credentials', number: '02', title: 'অ্যাকাউন্ট ও লগইন নিরাপত্তা দায়িত্ব' },
        { id: 'accounting', number: '03', title: 'হিসাব, ভাউচার ও কর তথ্যের নির্ভুলতা' },
        { id: 'multi-company', number: '04', title: 'মাল্টি-কোম্পানি ও RBAC পরিচালনা' },
        { id: 'availability', number: '05', title: 'সাবস্ক্রিপশন, কোটা ও সেবার প্রাপ্যতা' },
        { id: 'liability', number: '06', title: 'দায়বদ্ধতার সীমাবদ্ধতা ও পরিবর্তন' },
      ]
    : [
        { id: 'acceptance', number: '01', title: 'Acceptance & Authorized Business Use' },
        { id: 'credentials', number: '02', title: 'Account & Credential Responsibility' },
        { id: 'accounting', number: '03', title: 'Accounting & Tax Accuracy Responsibility' },
        { id: 'multi-company', number: '04', title: 'Multi-Company & RBAC Governance' },
        { id: 'availability', number: '05', title: 'Subscriptions, Quotas & Availability' },
        { id: 'liability', number: '06', title: 'Limitation of Liability & Updates' },
      ];

  return (
    <InfoPageLayout
      kicker={isBn ? 'আইনি শর্তাবলী' : 'Legal Agreement'}
      title={isBn ? 'পরিষেবার শর্তাবলী (Terms of Service)' : 'Terms of Service'}
      subtitle={
        isBn
          ? `${appName}-এর অ্যাকাউন্টিং, ইনভেন্টরি, পেরোল ও উৎপাদন ওয়ার্কস্পেস ব্যবহারের ক্ষেত্রে প্রযোজ্য দায়িত্ব ও শর্তাবলী।`
          : `Terms governing your access to ${appName} accounting, inventory, payroll, and reporting workspaces.`
      }
      metaLine={
        isBn
          ? `কার্যকর তারিখ: নভেম্বর ২০২৬ · ${appName} · এন্টারপ্রাইজ সেবা শর্ত`
          : `Effective Date: November 2026 · ${appName} · Workspace Service Terms`
      }
      toc={toc}
    >
      <section id="acceptance" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          01. {toc[0].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `${appName}-এ অ্যাকাউন্ট নিবন্ধন, সাইন ইন বা কোনো প্রতিষ্ঠানের ড্যাশবোর্ড ব্যবহার করার মাধ্যমে আপনি এই পরিষেবার শর্তাবলী মেনে চলতে সম্মত হচ্ছেন। সফটওয়্যারটি বৈধ ব্যবসায়িক হিসাবরক্ষণ, ইনভেন্টরি নিয়ন্ত্রণ, অর্ডার ট্র্যাকিং ও পেরোল পরিচালনার জন্য নির্মিত; বেআইনি বা প্রতারণামূলক কার্যক্রমে ব্যবহারের জন্য নয়।`
            : `By registering an account, signing in, or operating a company workspace in ${appName}, you agree to these Terms of Service. The platform is provided strictly for legitimate business accounting, inventory management, production tracking, payroll, and financial reporting.`}
        </p>
      </section>

      <section id="credentials" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          02. {toc[1].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'আপনার লগইন ইমেইল, পাসওয়ার্ড এবং Google Sign-In অ্যাক্সেসের গোপনীয়তা রক্ষা করার দায়িত্ব সম্পূর্ণ আপনার। একই প্রতিষ্ঠানের একাধিক ব্যবহারকারী থাকলে প্রত্যেকের জন্য আলাদা অ্যাকাউন্ট ও নির্দিষ্ট ভূমিকা বরাদ্দ করা উচিত—একটি ব্যক্তিগত লগইন সবার মাঝে শেয়ার করা অনুচিত।'
            : 'You are responsible for safeguarding your login credentials, password, and linked Google Sign-In session. Each team member accessing your workspace should use an individual account with assigned permissions rather than sharing a single administrator login.'}
        </p>
      </section>

      <section id="accounting" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          03. {toc[2].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `${appName} ডাবল-এন্ট্রি হিসাবরক্ষণ, প্রারম্ভিক ব্যালেন্স ও FIFO স্টক মুভমেন্ট অনুযায়ী স্বয়ংক্রিয় গণনা এবং .xlsx, PDF ও A4 প্রিন্ট রিপোর্ট প্রদান করে। তবে প্রতিষ্ঠানে এন্ট্রি করা প্রতিটি ভাউচারের তারিখ, লেজার নির্বাচন, পণ্যের পরিমাণ, প্রারম্ভিক জের এবং স্থানীয় কর/ভ্যাট/অডিট আইন অনুযায়ী চূড়ান্ত যাচাইয়ের দায়িত্ব ব্যবহারকারী প্রতিষ্ঠানের।`
            : `${appName} calculates balances, FIFO inventory valuations, and financial statements directly from the opening balances and vouchers recorded in your workspace. Your organization remains responsible for verifying transaction accuracy, ledger classifications, tax/VAT compliance, and statutory audit filings under applicable laws.`}
        </p>
      </section>

      <section id="multi-company" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          04. {toc[3].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? 'কোম্পানির অ্যাডমিন ব্যবহারকারী নির্ধারণ করেন কোন সদস্য কোন মডিউল (যেমন ভাউচার তৈরি, এডিট, রিপোর্ট দেখা, পেরোল বা মার্কেটিং ম্যানেজার অনুমতি) দেখতে ও পরিবর্তন করতে পারবেন। কোনো কর্মীর দায়িত্ব পরিবর্তিত হলে বা প্রতিষ্ঠান ত্যাগ করলে তাৎক্ষণিকভাবে তার অ্যাক্সেস প্রত্যাহার করার দায়িত্ব কোম্পানি অ্যাডমিনের।'
            : 'Workspace Administrators control user invitations and role permissions (including Admin, Marketing Manager, and granular module privileges). Administrators are responsible for updating or revoking access promptly when employee responsibilities change or team members leave.'}
        </p>
      </section>

      <section id="availability" className="scroll-mt-28 space-y-3 border-b border-slate-200 dark:border-slate-800 pb-10">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          05. {toc[4].title}
        </h2>
        <ul className="space-y-2.5 text-[15px] leading-relaxed text-slate-700 dark:text-slate-300 list-disc pl-5">
          <li>
            {isBn
              ? 'সাবস্ক্রিপশন প্ল্যান (Free Trial, Gold বা Custom Plan) অনুযায়ী মডিউল ও ডেটা ব্যবহারের সীমা নির্ধারিত হয়।'
              : 'Available modules and operational capacities correspond to your active subscription tier (such as Trial, Gold Plan, or Custom Enterprise configurations).'}
          </li>
          <li>
            {isBn
              ? 'নিরাপদ অপারেশনের জন্য রক্ষণাবেক্ষণ বা ক্লাউড কোটা সীমা অতিক্রমের সময় সাময়িকভাবে রাইট অপারেশন সীমিত হতে পারে; তবে স্থানীয় ক্যাশ ও .xlsx/PDF এক্সপোর্টের মাধ্যমে প্রয়োজনীয় তথ্য সংরক্ষণের সুযোগ অব্যাহত থাকে।'
              : 'Planned maintenance or database quota thresholds may temporarily restrict new writes, while read caches and backup exports remain prioritized for continuity.'}
          </li>
          <li>
            {isBn
              ? 'সিস্টেমের নিরাপত্তা ভাঙার চেষ্টা, অননুমোদিত অটোমেটেড স্ক্র্যাপিং বা অন্য কোম্পানির ডেটায় প্রবেশের চেষ্টা করলে অ্যাকাউন্ট স্থগিত করা হতে পারে।'
              : 'Any attempt to bypass security rules, disrupt service infrastructure, or access another organization’s records may result in immediate suspension.'}
          </li>
        </ul>
      </section>

      <section id="liability" className="scroll-mt-28 space-y-3">
        <h2 className="text-xl font-bold text-slate-950 dark:text-white">
          06. {toc[5].title}
        </h2>
        <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">
          {isBn
            ? `আমরা নিয়মিত সফটওয়্যারের নির্ভরযোগ্যতা ও কর্মক্ষমতা উন্নত করি। তবে কোনো অপ্রত্যাশিত ইন্টারনেট বিচ্ছিন্নতা, ভুল এন্ট্রি বা তৃতীয় পক্ষের অবকাঠামোজনিত পরোক্ষ ক্ষতির জন্য ${appName} দায়ী থাকবে না; তাই নিয়মিত .xlsx ও PDF ব্যাকআপ সংরক্ষণ করার পরামর্শ দেওয়া হয়। শর্তাবলী সংক্রান্ত প্রশ্নের জন্য যোগাযোগ করুন:`
            : `${appName} is provided on a commercially reasonable basis with continuous reliability improvements. To the maximum extent permitted by law, ${appName} is not liable for indirect losses, inaccurate user entries, or external network outages. We recommend exporting regular .xlsx and PDF backups of key financial reports. Questions may be sent to:`}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 pt-1">
          <a href={`mailto:${supportEmail}`} className="font-mono text-blue-600 dark:text-blue-400 hover:underline">
            {supportEmail}
          </a>
          {' · '}
          <Link to="/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
            {isBn ? 'গোপনীয়তা নীতি পড়ুন' : 'Read Privacy Policy'}
          </Link>
        </p>
      </section>
    </InfoPageLayout>
  );
};
