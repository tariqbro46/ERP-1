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
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';
import { LATEST_VERSION } from '../../data/releaseNotes';

type SupportTopicId = 'technical' | 'access' | 'billing' | 'onboarding';

interface ComposedSupportRequest {
  name: string;
  email: string;
  topicLabel: string;
  subject: string;
  message: string;
  fullSubject: string;
  formattedBody: string;
  mailtoUrl: string;
}

export const Contact = () => {
  const { language, t } = useLanguage();
  const { appIdentity, appVersion } = useSettings();
  const isBn = language === 'bn';
  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const supportEmail = appIdentity.supportEmail;
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.32').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.32'
    : `v${appVersion || LATEST_VERSION || '1.9.9.32'}`;

  const [formState, setFormState] = React.useState<{
    name: string;
    email: string;
    topicId: SupportTopicId;
    subject: string;
    message: string;
  }>({
    name: '',
    email: '',
    topicId: 'technical',
    subject: '',
    message: '',
  });
  const [submittedRequest, setSubmittedRequest] = React.useState<ComposedSupportRequest | null>(null);
  const [submitError, setSubmitError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const topicOptions: { id: SupportTopicId; label: string }[] = [
    { id: 'technical', label: t('contact.topic.technical') },
    { id: 'access', label: t('contact.topic.access') },
    { id: 'billing', label: t('contact.topic.billing') },
    { id: 'onboarding', label: t('contact.topic.onboarding') },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    const trimmedName = formState.name.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedSubject = formState.subject.trim();
    const trimmedMessage = formState.message.trim();

    if (!trimmedName) {
      setSubmitError(t('contact.error.nameRequired'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setSubmitError(t('contact.error.emailInvalid'));
      return;
    }

    if (!trimmedSubject) {
      setSubmitError(t('contact.error.subjectRequired'));
      return;
    }

    if (!trimmedMessage) {
      setSubmitError(t('contact.error.messageRequired'));
      return;
    }

    const topicLabel =
      topicOptions.find((opt) => opt.id === formState.topicId)?.label || t('contact.topic.technical');
    const fullSubject = `[${appName} - ${topicLabel}] ${trimmedSubject}`;
    const formattedBody = [
      `Name: ${trimmedName}`,
      `Reply Email: ${trimmedEmail}`,
      `Category: ${topicLabel}`,
      `Application: ${appName} (${resolvedVersion})`,
      '',
      'Message:',
      trimmedMessage,
    ].join('\n');

    const mailtoUrl = `mailto:${encodeURIComponent(supportEmail)}?subject=${encodeURIComponent(
      fullSubject
    )}&body=${encodeURIComponent(formattedBody)}`;

    setSubmittedRequest({
      name: trimmedName,
      email: trimmedEmail,
      topicLabel,
      subject: trimmedSubject,
      message: trimmedMessage,
      fullSubject,
      formattedBody,
      mailtoUrl,
    });
    setCopied(false);

    // Open user's configured email app cleanly without window.open or popup blockers
    const mailLink = document.createElement('a');
    mailLink.href = mailtoUrl;
    mailLink.click();
  };

  const handleCopyMessage = async () => {
    if (!submittedRequest) return;
    const clipboardText = [
      `To: ${supportEmail}`,
      `Subject: ${submittedRequest.fullSubject}`,
      '',
      submittedRequest.formattedBody,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(clipboardText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const handleNewRequest = () => {
    setSubmittedRequest(null);
    setSubmitError('');
    setCopied(false);
    setFormState({
      name: '',
      email: '',
      topicId: 'technical',
      subject: '',
      message: '',
    });
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
                  ? 'কোম্পানি অনবোর্ডিং, অ্যাকাউন্ট রিকভারি, বিলিং বা কারিগরি সমস্যার জন্য নিচের বার্তা প্রস্তুতকারক ফর্ম অথবা সরাসরি সাপোর্ট ইমেইলের মাধ্যমে যোগাযোগ করুন।'
                  : 'Use the support message composer below or email our support address directly for workspace onboarding, account access assistance, licensing, or technical troubleshooting.'}
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
                        {t('contact.formTitle')}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {t('contact.formSubtitle', { email: supportEmail })}
                      </p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap shrink-0">
                      {t('contact.slaTarget')}
                    </span>
                  </div>

                  <div className="p-6 sm:p-8">
                    {submittedRequest ? (
                      <div className="space-y-6">
                        <div className="flex items-start gap-3.5">
                          <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 text-emerald-700 dark:text-emerald-400">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-950 dark:text-white">
                              {t('contact.confirm.title')}
                            </h3>
                            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                              {t('contact.confirm.desc', { email: supportEmail })}
                            </p>
                          </div>
                        </div>

                        {/* Composed Request Details Preview */}
                        <div className="rounded-lg border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 divide-y divide-slate-200/80 dark:divide-slate-800 text-xs">
                          <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t('contact.confirm.to')}
                            </span>
                            <span className="font-mono font-semibold text-blue-700 dark:text-blue-400 select-all">
                              {supportEmail}
                            </span>
                          </div>
                          <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t('contact.confirm.from')}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {submittedRequest.name} ({submittedRequest.email})
                            </span>
                          </div>
                          <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t('contact.confirm.category')}
                            </span>
                            <span className="font-medium text-slate-900 dark:text-slate-100">
                              {submittedRequest.topicLabel}
                            </span>
                          </div>
                          <div className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              {t('contact.confirm.subject')}
                            </span>
                            <span className="font-semibold text-slate-950 dark:text-white break-words">
                              {submittedRequest.fullSubject}
                            </span>
                          </div>
                          <div className="p-4 space-y-1.5">
                            <span className="font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                              {t('contact.confirm.message')}
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {submittedRequest.message}
                            </p>
                          </div>
                        </div>

                        {/* Clear Client Actions */}
                        <div className="flex flex-wrap items-center gap-3 pt-1">
                          <a
                            href={submittedRequest.mailtoUrl}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-950 dark:bg-blue-600 text-white rounded-lg text-xs font-semibold hover:opacity-95 transition-opacity whitespace-nowrap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>{t('contact.confirm.openEmail')}</span>
                          </a>

                          <button
                            type="button"
                            onClick={handleCopyMessage}
                            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {copied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{t('contact.confirm.copied')}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>{t('contact.confirm.copyText')}</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSubmittedRequest(null)}
                            className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer whitespace-nowrap"
                          >
                            {t('contact.confirm.editDraft')}
                          </button>

                          <button
                            type="button"
                            onClick={handleNewRequest}
                            className="px-3.5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors cursor-pointer whitespace-nowrap ml-auto"
                          >
                            {t('contact.confirm.newRequest')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} noValidate className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="contact-full-name"
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                            >
                              {t('contact.field.name')} <span className="text-rose-600">*</span>
                            </label>
                            <input
                              id="contact-full-name"
                              type="text"
                              required
                              value={formState.name}
                              onChange={(e) => {
                                setFormState({ ...formState, name: e.target.value });
                                if (submitError) setSubmitError('');
                              }}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                              placeholder={t('contact.field.namePlaceholder')}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="contact-email"
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                            >
                              {t('contact.field.email')} <span className="text-rose-600">*</span>
                            </label>
                            <input
                              id="contact-email"
                              type="email"
                              required
                              value={formState.email}
                              onChange={(e) => {
                                setFormState({ ...formState, email: e.target.value });
                                if (submitError) setSubmitError('');
                              }}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                              placeholder="name@company.com"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label
                              htmlFor="contact-category"
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                            >
                              {t('contact.field.category')}
                            </label>
                            <select
                              id="contact-category"
                              value={formState.topicId}
                              onChange={(e) =>
                                setFormState({ ...formState, topicId: e.target.value as SupportTopicId })
                              }
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                            >
                              {topicOptions.map((topic) => (
                                <option key={topic.id} value={topic.id}>
                                  {topic.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor="contact-subject"
                              className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                            >
                              {t('contact.field.subject')} <span className="text-rose-600">*</span>
                            </label>
                            <input
                              id="contact-subject"
                              type="text"
                              required
                              value={formState.subject}
                              onChange={(e) => {
                                setFormState({ ...formState, subject: e.target.value });
                                if (submitError) setSubmitError('');
                              }}
                              className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors"
                              placeholder={t('contact.field.subjectPlaceholder')}
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor="contact-message"
                            className="text-xs font-semibold text-slate-700 dark:text-slate-300 block"
                          >
                            {t('contact.field.message')} <span className="text-rose-600">*</span>
                          </label>
                          <textarea
                            id="contact-message"
                            required
                            rows={5}
                            value={formState.message}
                            onChange={(e) => {
                              setFormState({ ...formState, message: e.target.value });
                              if (submitError) setSubmitError('');
                            }}
                            className="w-full bg-slate-50/70 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-lg px-3.5 py-2.5 text-sm text-slate-950 dark:text-white outline-none transition-colors resize-none"
                            placeholder={t('contact.field.messagePlaceholder')}
                          />
                        </div>

                        {submitError && (
                          <div
                            role="alert"
                            className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium"
                          >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {t('contact.submitNote')}
                        </p>

                        <button
                          type="submit"
                          className="w-full py-3 bg-slate-950 dark:bg-blue-600 hover:opacity-95 text-white rounded-lg font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-opacity"
                        >
                          <Send className="w-4 h-4" />
                          <span>{t('contact.submitBtn')}</span>
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
