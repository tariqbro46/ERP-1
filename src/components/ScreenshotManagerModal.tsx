import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Image as ImageIcon,
  Trash2,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Info,
  Link2,
  ArrowUpRight,
} from 'lucide-react';
import {
  HELP_DOCS,
  normalizeScreenshotUrl,
  readStoredScreenshots,
  writeStoredScreenshots,
} from '../constants/helpContent';
import { ImageNotFoundFrame } from './ImageNotFoundFrame';

interface ScreenshotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  initialCategoryId?: string;
  onUpdate?: () => void;
}

export default function ScreenshotManagerModal({
  isOpen,
  onClose,
  lang,
  initialCategoryId,
  onUpdate,
}: ScreenshotManagerModalProps) {
  const isBn = lang === 'bn';
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>(
    initialCategoryId || 'getting-started'
  );
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedTargetKey(initialCategoryId);
    }
  }, [initialCategoryId]);

  useEffect(() => {
    if (!isOpen) return;
    setScreenshots(readStoredScreenshots());
  }, [isOpen]);

  useEffect(() => {
    setPreviewError(false);
    setImageUrlInput(screenshots[selectedTargetKey] || '');
  }, [selectedTargetKey, screenshots]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentScreenshot = normalizeScreenshotUrl(screenshots[selectedTargetKey]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeScreenshotUrl(imageUrlInput);
    if (!normalized) {
      setFeedbackMsg({
        type: 'error',
        text: isBn
          ? 'অনুগ্রহ করে একটি সঠিক https:// ইমেজ URL (অথবা /screenshots/... পাথ) দিন। বেস৬৪ ফাইল ডাটা অনুমোদিত নয়।'
          : 'Please enter a valid external image URL (https://...) or /screenshots/... path. Inline base64 files are not supported.',
      });
      return;
    }

    try {
      const updated = writeStoredScreenshots({
        ...screenshots,
        [selectedTargetKey]: normalized,
      });
      setScreenshots(updated);
      setPreviewError(false);
      onUpdate?.();
      setFeedbackMsg({
        type: 'success',
        text: isBn
          ? 'স্ক্রিনশট URL সফলভাবে যুক্ত হয়েছে!'
          : 'Screenshot URL linked successfully!',
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({
        type: 'error',
        text: isBn
          ? 'ব্রাউজার স্টোরেজে সংরক্ষণ করা যায়নি।'
          : 'Could not save URL to browser preferences.',
      });
    }
  };

  const handleDeleteScreenshot = (key: string) => {
    const next = { ...screenshots };
    delete next[key];
    const updated = writeStoredScreenshots(next);
    setScreenshots(updated);
    setImageUrlInput('');
    setPreviewError(false);
    onUpdate?.();
    setFeedbackMsg({
      type: 'success',
      text: isBn ? 'স্ক্রিনশট লিংক সরানো হয়েছে।' : 'Screenshot URL removed.',
    });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white dark:bg-[#0d1320] rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white shrink-0">
              <Link2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white truncate">
                {isBn ? 'হেল্প ডক স্ক্রিনশট URL ম্যানেজার' : 'Help Docs Screenshot URL Manager'}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {isBn
                  ? 'বাইরে হোস্ট করা বাস্তব অ্যাপ স্ক্রিনশটের URL যেকোনো সেকশনে যুক্ত করুন'
                  : 'Link externally hosted real app screenshot URLs to any documentation topic'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close'}
            className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Target Section Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              {isBn ? '১. সেকশন বা অধ্যায় নির্বাচন করুন' : '1. Select Help Section or Chapter'}
            </label>
            <select
              value={selectedTargetKey}
              onChange={(e) => setSelectedTargetKey(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden"
            >
              {HELP_DOCS.map((cat) => (
                <optgroup key={cat.id} label={isBn ? cat.bnTitle : cat.title}>
                  <option value={cat.id}>
                    {isBn
                      ? `অধ্যায় ডিফল্ট: ${cat.bnTitle}`
                      : `Chapter Default: ${cat.title}`}{' '}
                    {screenshots[cat.id] ? '✓' : ''}
                  </option>
                  {cat.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {isBn ? sec.bnTitle : sec.title} {screenshots[sec.id] ? '✓' : ''}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Current Status Preview */}
          <div className="bg-slate-50/80 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-200/90 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                {isBn ? 'বর্তমান স্ক্রিনশট অবস্থা' : 'Current Screen Reference'}
              </span>
              {currentScreenshot && !previewError ? (
                <span className="text-[11px] font-mono font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isBn ? 'URL সংযুক্ত' : 'URL Linked'}</span>
                </span>
              ) : (
                <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>
                    {previewError
                      ? isBn
                        ? 'লোড ব্যর্থ হয়েছে'
                        : 'Load Failed'
                      : isBn
                      ? 'স্ক্রিনশট অপেক্ষমাণ'
                      : 'Capture Pending'}
                  </span>
                </span>
              )}
            </div>

            {currentScreenshot ? (
              <div className="space-y-2.5">
                <div className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 min-h-[148px] max-h-52 flex items-center justify-center">
                  {previewError ? (
                    <ImageNotFoundFrame
                      className="w-full min-h-[148px] rounded-none border-0"
                      sublabel={
                        isBn
                          ? 'এই URL থেকে ছবি লোড করা যায়নি।'
                          : 'Could not load image from this URL.'
                      }
                    />
                  ) : (
                    <img
                      src={currentScreenshot}
                      alt="Linked documentation screenshot"
                      className="max-h-52 w-full object-contain"
                      referrerPolicy="no-referrer"
                      onError={() => setPreviewError(true)}
                    />
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <a
                    href={currentScreenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline font-mono truncate max-w-md"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{currentScreenshot}</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteScreenshot(selectedTargetKey)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isBn ? 'লিংক মুছুন' : 'Remove URL'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <ImageNotFoundFrame
                className="w-full min-h-[148px]"
                sublabel={
                  isBn
                    ? 'এই বিষয়ে এখনো কোনো এক্সটার্নাল স্ক্রিনশট লিংক যুক্ত করা হয়নি।'
                    : 'No external screenshot URL is assigned to this topic yet.'
                }
              />
            )}
          </div>

          {/* URL Form */}
          <form onSubmit={handleUrlSubmit} className="space-y-2">
            <label className="text-[11px] font-mono font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
              {isBn
                ? '২. এক্সটার্নাল ইমেজ URL (https://...)'
                : '2. External Screenshot Image URL (https://...)'}
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="https://your-server.com/screenshots/dashboard.png"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-hidden"
              />
              <button
                type="submit"
                disabled={!imageUrlInput.trim()}
                className="bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {isBn ? 'URL সংরক্ষণ করুন' : 'Save Image URL'}
              </button>
            </div>
          </form>

          {/* Info footer box */}
          <div className="flex gap-2.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/70 text-slate-700 dark:text-slate-300 p-3.5 rounded-xl text-xs leading-relaxed">
            <Info className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
            <p>
              {isBn
                ? 'ছবির ফাইল অ্যাপে আপলোড বা ডাটাবেজে সংরক্ষণ করা হয় না। বাইরে হোস্ট করা ইমেজের সরাসরি লিংক (https://...) দিলে তা সরাসরি প্রদর্শিত হবে; স্থায়ীভাবে সবার জন্য সেট করতে helpContent.ts-এর DOC_SCREENSHOTS ম্যাপে URL-টি যুক্ত করুন।'
                : 'Images are hosted externally—only the direct URL reference is stored locally with zero Firestore reads or base64 blobs. For site-wide permanent publishing across all visitors, add the URL to DOC_SCREENSHOTS in helpContent.ts.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <Link
            to="/founder-desk"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            <span>{isBn ? 'পূর্ণ ডকস ডেস্ক খুলুন' : 'Open Full Docs Desk'}</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-950 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white font-semibold px-5 py-2 rounded-lg text-xs transition-colors cursor-pointer"
          >
            {isBn ? 'সম্পন্ন / বন্ধ করুন' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
