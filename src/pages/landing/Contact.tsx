import React from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Clock,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  BookOpen,
} from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { db } from '../../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { LATEST_VERSION } from '../../data/releaseNotes';

export const Contact = () => {
  const { language, t } = useLanguage();
  const { appIdentity, appVersion } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const supportEmail = appIdentity.supportEmail;
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.31').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.31'
    : `v${appVersion || LATEST_VERSION || '1.9.9.31'}`;

  const [formState, setFormState] = React.useState({
    name: '',
    email: '',
    topic: isBn ? 'কারিগরি সহায়তা' : 'Technical Support',
    subject: '',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  const topics = isBn
    ? ['কারিগরি সহায়তা', 'অ্যাকাউন্ট ও অ্যাক্সেস রিকভারি', 'বিলিং ও সাবস্ক্রিপশন', 'নতুন কোম্পানি অনবোর্ডিং']
    : ['Technical Support', 'Account & Access Recovery', 'Billing & Subscription', 'Company Onboarding'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const trimmedEmail = formState.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSubmitError(
        isBn
          ? 'অনুগ্রহ করে একটি সঠিক ইমেইল ঠিকানা লিখুন।'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        name: formState.name.trim(),
        email: trimmedEmail,
        subject: `[${formState.topic}] ${formState.subject.trim()}`,
        message: formState.message.trim(),
        createdAt: Timestamp.now(),
      });
      setIsSubmitted(true);
      setFormState({
        name: '',
        email: '',
        topic: topics[0],
        subject: '',
        message: '',
      });
    } catch (err) {
      console.error('Error submitting inquiry:', err);
      setSubmitError(
        isBn
          ? `বার্তা পাঠানো যায়নি। অনুগ্রহ করে সরাসরি ${supportEmail} ঠিকানায় ইমেইল করুন।`
          : `Could not submit inquiry right now. Please email ${supportEmail} directly.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-white dark:bg-[#090d16] text-slate-950 dark:text-slate-100 selection:bg-blue-100 selection:text-blue-900"
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-24 relative overflow-x-clip">
        {/* Subtle Architectural Hairline Grid matching Enterprise Ledger & Workbench */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
            backgroundSize: '72px 72px',
            maskImage: 'radial-gradient(ellipse 85% 65% at 50% 8%, black 30%, transparent 82%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 65% at 50% 8%, black 30%, transparent 82%)',
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Monospace Metadata Rail + Subtle Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200/85 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">{appName}</span>
              <span aria-hidden="true">·</span>
              <span>{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'যোগাযোগ ও সাপোর্ট' : 'Contact & Support'}</span>
            </div>

            <nav
              aria-label="Breadcrumb"
              className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0"
            >
              <Link to="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {t('nav.breadcrumbHome')}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {t('nav.item.contact')}
              </span>
            </nav>
          </div>

          {/* Page Header */}
          <header className="pt-10 sm:pt-12 pb-10 border-b border-slate-200/85 dark:border-slate-800">
            <div className="max-w-3xl">
              <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                {isBn ? 'সহায়তা ও অনবোর্ডিং ডেস্ক' : 'Support & Onboarding Desk'}
              </p>
              <h1
                className="mt-3 font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                  fontSize: 'clamp(2rem, 3.8vw, 3.25rem)',
                  textWrap: 'balance',
                }}
              >
                {isBn ? (
                  <>
                    সরাসরি <span className="text-blue-700 dark:text-blue-400">{appName}</span> সাপোর্ট টিমের সাথে যোগাযোগ করুন।
                  </>
                ) : (
                  <>
                    Direct assistance from the{' '}
                    <span className="text-blue-700 dark:text-blue-400">{appName}</span> desk.
                  </>
                )}
              </h1>
              <p className="mt-4 text-[15px] sm:text-base text-slate-600 dark:text-slate-300 leading-[1.68] max-w-[60ch]">
                {isBn
                  ? 'কোম্পানি অনবোর্ডিং, অ্যাকাউন্ট রিকভারি, বিলিং বা কারিগরি সমস্যার জন্য নিচের ফর্মের মাধ্যমে অথবা সরাসরি সাপোর্ট ইমেইলে আমাদের সাথে যোগাযোগ করুন।'
                  : 'Reach our support team for workspace onboarding, account access assistance, subscription licensing, or technical troubleshooting.'}
              </p>
              <p className="mt-4 text-xs font-mono font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                {isBn
                  ? `সাপোর্ট ইমেইল: ${supportEmail} · সাধারণ উত্তর দেওয়ার সময়: ২৪ কর্মঘণ্টার মধ্যে`
                  : `Support Email: ${supportEmail} · Typical Response: Within 24 business hours`}
              </p>
            </div>
          </header>

          {/* Main 12-Column Content Split */}
          <div className="pt-10 lg:pt-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
              {/* Left 5 Columns: Support Channels & Pre-Request Checklist */}
              <div className="lg:col-span-5 space-y-5">
                <div className="p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-950 dark:text-white">
                    <Mail className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-[0.12em]">
                      {isBn ? '০১. সরাসরি ইমেইল সাপোর্ট' : '01. Direct Email Support'}
                    </h2>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isBn
                      ? 'সকল অ্যাকাউন্ট সহায়তা, সাবস্ক্রিপশন ও কারিগরি অনুরোধের জন্য অফিশিয়াল ইমেইল:'
                      : 'Official support channel for workspace access, billing, and technical requests:'}
                  </p>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="inline-block font-mono text-sm font-semibold text-blue-700 dark:text-blue-400 hover:underline select-all"
                  >
                    {supportEmail}
                  </a>
                </div>

                <div className="p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-950 dark:text-white">
                    <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-[0.12em]">
                      {isBn ? '০২. সাপোর্ট সময়সূচী' : '02. Support Hours'}
                    </h2>
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 space-y-1.5 tabular-nums">
                    <p className="font-semibold text-slate-950 dark:text-slate-100">
                      {isBn
                        ? 'শনিবার – বৃহস্পতিবার: সকাল ৯:০০ – সন্ধ্যা ৬:০০ (BST)'
                        : 'Saturday – Thursday: 9:00 AM – 6:00 PM (BST / GMT+6)'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {isBn
                        ? 'জরুরি অ্যাক্সেস বা ডেটা নিরাপত্তা সংক্রান্ত বার্তা ছুটির দিনেও পর্যবেক্ষণ করা হয়।'
                        : 'Urgent workspace access or security notices are monitored continuously.'}
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] space-y-3">
                  <div className="flex items-center gap-2.5 text-slate-950 dark:text-white">
                    <ShieldCheck className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                    <h2 className="text-xs font-mono font-bold uppercase tracking-[0.12em]">
                      {isBn ? '০৩. দ্রুত সহায়তার নির্দেশিকা' : '03. For Faster Assistance'}
                    </h2>
                  </div>
                  <ul className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 list-disc pl-4 leading-relaxed">
                    <li>
                      {isBn
                        ? 'আপনার নিবন্ধিত ইমেইল এবং প্রতিষ্ঠানের নাম উল্লেখ করুন।'
                        : 'Include your registered login email and organization name.'}
                    </li>
                    <li>
                      {isBn
                        ? 'কোন স্ক্রিন বা রিপোর্টে (.xlsx, PDF, প্রিন্ট বা ভাউচার এন্ট্রি) সমস্যা হয়েছে তা সংক্ষেপে লিখুন।'
                        : 'Describe the specific screen or report (.xlsx, PDF, Print, or Voucher Entry) involved.'}
                    </li>
                    <li>
                      {isBn
                        ? 'কখনোই আপনার পাসওয়ার্ড ইমেইল বা ফর্মে লিখবেন না।'
                        : 'Never include your account password in emails or support messages.'}
                    </li>
                  </ul>
                  <div className="pt-3 flex flex-wrap gap-4 border-t border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
                    <Link
                      to="/guide"
                      className="inline-flex items-center gap-1.5 text-blue-700 dark:text-blue-400 hover:underline"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{isBn ? 'ইউজার গাইড ও FAQ' : 'User Guide & FAQ'}</span>
                    </Link>
                    <Link
                      to="/security"
                      className="text-slate-600 dark:text-slate-400 hover:underline"
                    >
                      {isBn ? 'ডেটা নিরাপত্তা ও ব্যাকআপ' : 'Data Security & Backup'}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Right 7 Columns: Support Request Workbench Form */}
              <div className="lg:col-span-7">
                <div className="border border-slate-200/90 dark:border-slate-800 rounded-xl bg-white dark:bg-[#0d1320] overflow-hidden shadow-[0_18px_48px_-16px_rgba(15,23,42,0.06)]">
                  <div className="px-6 py-4 bg-slate-50/80 dark:bg-slate-900/70 border-b border-slate-200/85 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <h2 className="text-sm font-bold text-slate-950 dark:text-white">
                        {isBn ? 'সাপোর্ট অনুরোধ ফর্ম' : 'Submit Support Request'}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {isBn
                          ? 'নিচের তথ্যগুলো পূরণ করে পাঠান, আমাদের টিম দ্রুত উত্তর দেবে।'
                          : 'Complete the fields below and our support specialist will reply via email.'}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline">
                      {isBn ? '২৪ কর্মঘণ্টা SLA' : '24h Response Target'}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    {isSubmitted ? (
                      <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-950 dark:text-white">
                          {isBn ? 'আপনার বার্তা গৃহীত হয়েছে' : 'Inquiry Received'}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          {isBn
                            ? `ধন্যবাদ। ${appName} সাপোর্ট টিম আপনার বার্তাটি পেয়েছে এবং নির্ধারিত ইমেইলে উত্তর পাঠানো হবে।`
                            : `Thank you. The ${appName} team has recorded your inquiry and will reply to your email address shortly.`}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsSubmitted(false)}
                          className="px-5 py-2.5 bg-slate-950 dark:bg-blue-600 text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity cursor-pointer"
                        >
                          {isBn ? 'নতুন বার্তা পাঠান' : 'Send Another Message'}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              {isBn ? 'আপনার নাম' : 'Full Name'}
                            </label>
                            <input
                              type="text"
                              required
                              value={formState.name}
                              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                              placeholder={isBn ? 'যেমন: রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
                            </label>
                            <input
                              type="email"
                              required
                              value={formState.email}
                              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                              placeholder="name@company.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              {isBn ? 'সহায়তার ধরন' : 'Support Category'}
                            </label>
                            <select
                              value={formState.topic}
                              onChange={(e) => setFormState({ ...formState, topic: e.target.value })}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                            >
                              {topics.map((topic) => (
                                <option key={topic} value={topic}>
                                  {topic}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                              {isBn ? 'বিষয়' : 'Subject'}
                            </label>
                            <input
                              type="text"
                              required
                              value={formState.subject}
                              onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                              placeholder={isBn ? 'সংক্ষিপ্ত বিষয় লিখুন' : 'Brief summary of your request'}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                            {isBn ? 'বিস্তারিত বার্তা' : 'Message'}
                          </label>
                          <textarea
                            required
                            rows={5}
                            value={formState.message}
                            onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                            className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors resize-none"
                            placeholder={
                              isBn
                                ? 'আপনার প্রতিষ্ঠানের প্রয়োজন, অ্যাকাউন্ট ইস্যু বা কারিগরি প্রশ্ন বিস্তারিত লিখুন...'
                                : 'Describe your organization requirement, account issue, or technical question...'
                            }
                          />
                        </div>

                        {submitError && (
                          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full py-3 bg-slate-950 dark:bg-blue-600 hover:opacity-95 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-opacity disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>{isBn ? 'বার্তা পাঠান' : 'Send Message'}</span>
                            </>
                          )}
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
