import React, { useState, useEffect } from 'react';
import { 
  X, Upload, Image as ImageIcon, Trash2, CheckCircle2, 
  ExternalLink, Sparkles, AlertCircle, Info, RefreshCw
} from 'lucide-react';
import { HELP_DOCS } from '../constants/helpContent';

interface ScreenshotManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'en' | 'bn';
  initialCategoryId?: string;
}

export default function ScreenshotManagerModal({
  isOpen,
  onClose,
  lang,
  initialCategoryId
}: ScreenshotManagerModalProps) {
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>(initialCategoryId || 'getting-started');
  const [screenshots, setScreenshots] = useState<Record<string, string>>({});
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (initialCategoryId) {
      setSelectedTargetKey(initialCategoryId);
    }
  }, [initialCategoryId]);

  // Load existing screenshots from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('erp_help_docs_screenshots');
      if (stored) {
        setScreenshots(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFeedbackMsg({
        type: 'error',
        text: lang === 'en' ? 'Please select a valid image file (PNG, JPG, WebP).' : 'অনুগ্রহ করে সঠিক ইমেজ ফাইল সিলেক্ট করুন।'
      });
      return;
    }

    // Limit size to 4MB for localStorage
    if (file.size > 4 * 1024 * 1024) {
      setFeedbackMsg({
        type: 'error',
        text: lang === 'en' ? 'File too large. Maximum size is 4MB.' : 'ফাইলের সাইজ অনেক বড়। সর্বোচ্চ ৪ মেগাবাইট।'
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      saveScreenshot(selectedTargetKey, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    saveScreenshot(selectedTargetKey, imageUrlInput.trim());
    setImageUrlInput('');
  };

  const saveScreenshot = (key: string, url: string) => {
    try {
      const updated = { ...screenshots, [key]: url };
      setScreenshots(updated);
      localStorage.setItem('erp_help_docs_screenshots', JSON.stringify(updated));
      setFeedbackMsg({
        type: 'success',
        text: lang === 'en' ? 'Screenshot saved successfully!' : 'স্ক্রিনশট সফলভাবে সংরক্ষিত হয়েছে!'
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (e) {
      setFeedbackMsg({
        type: 'error',
        text: lang === 'en' ? 'Storage full. Try using an external image URL.' : 'স্টোরেজ পূর্ণ। অনুগ্রহ করে সরাসরি ইমেজ লিংক ব্যবহার করুন।'
      });
    }
  };

  const handleDeleteScreenshot = (key: string) => {
    const updated = { ...screenshots };
    delete updated[key];
    setScreenshots(updated);
    localStorage.setItem('erp_help_docs_screenshots', JSON.stringify(updated));
    setFeedbackMsg({
      type: 'success',
      text: lang === 'en' ? 'Screenshot removed. Reset to interactive simulator.' : 'স্ক্রিনশট মুছে ফেলা হয়েছে।'
    });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const currentScreenshot = screenshots[selectedTargetKey];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in-50 zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">
                {lang === 'en' ? 'Help Docs Screenshot Manager' : 'হেল্প ডক স্ক্রিনশট ম্যানেজার'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'en' ? 'Upload real app screenshots or use interactive simulators' : 'বাস্তব স্ক্রিনশট আপলোড করুন অথবা ইন্টারেক্টিভ সিমুলেটর ব্যবহার করুন'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback alert */}
        {feedbackMsg && (
          <div className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 ${feedbackMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-100' : 'bg-rose-50 text-rose-800 border-b border-rose-100'}`}>
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-none" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-none" />}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Target Section Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {lang === 'en' ? '1. Select Help Chapter / Section:' : '১. অধ্যায় বা সেকশন নির্বাচন করুন:'}
            </label>
            <select
              value={selectedTargetKey}
              onChange={(e) => setSelectedTargetKey(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
            >
              {HELP_DOCS.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.bnTitle}) {screenshots[cat.id] ? '✓ Has Screenshot' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Current Status Preview */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {lang === 'en' ? 'Current Visual State:' : 'বর্তমান ভিজ্যুয়াল অবস্থা:'}
              </span>
              {currentScreenshot ? (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {lang === 'en' ? 'Custom Screenshot Active' : 'কাস্টম স্ক্রিনশট সক্রিয়'}
                </span>
              ) : (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {lang === 'en' ? 'Interactive UI Simulator Active' : 'ইন্টারেক্টিভ সিমুলেটর সক্রিয়'}
                </span>
              )}
            </div>

            {currentScreenshot ? (
              <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-900 max-h-48 flex items-center justify-center">
                <img 
                  src={currentScreenshot} 
                  alt="Current screenshot" 
                  className="max-h-48 w-full object-contain"
                  referrerPolicy="no-referrer"
                />
                <button
                  onClick={() => handleDeleteScreenshot(selectedTargetKey)}
                  className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg shadow-md transition-colors flex items-center gap-1 text-[11px] font-bold"
                  title="Remove screenshot"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{lang === 'en' ? 'Remove' : 'মুছুন'}</span>
                </button>
              </div>
            ) : (
              <div className="p-4 bg-white rounded-lg border border-dashed border-slate-300 text-center">
                <p className="text-xs text-slate-500">
                  {lang === 'en' 
                    ? "Currently using the built-in high-fidelity Interactive Screen Simulator with ①-④ guided callouts."
                    : "বর্তমানে নির্দেশনামূলক ইন্টারঅ্যাক্টিভ সিমুলেটর সক্রিয় আছে। আপনি চাইলে নিচে আসল স্ক্রিনশট আপলোড করতে পারেন।"}
                </p>
              </div>
            )}
          </div>

          {/* Upload Method 1: Local File */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {lang === 'en' ? '2. Upload Screenshot File (PNG/JPG):' : '২. কম্পিউটার/ডিভাইস থেকে ছবি আপলোড করুন:'}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 cursor-pointer transition-colors text-xs font-semibold text-slate-600">
                <Upload className="w-4 h-4 text-blue-600" />
                <span>{lang === 'en' ? 'Click to select image file' : 'ইমেজ ফাইল নির্বাচন করতে ক্লিক করুন'}</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          {/* Upload Method 2: Image URL */}
          <form onSubmit={handleUrlSubmit} className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {lang === 'en' ? 'Or Paste Image URL:' : 'অথবা ইমেজ লিংক (URL) দিন:'}
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="https://example.com/screenshot.png"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              <button
                type="submit"
                disabled={!imageUrlInput.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors"
              >
                {lang === 'en' ? 'Save URL' : 'সেভ করুন'}
              </button>
            </div>
          </form>

          {/* Info footer box */}
          <div className="flex gap-2.5 bg-blue-50 border border-blue-100 text-blue-900 p-3.5 rounded-xl text-xs leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 flex-none mt-0.5" />
            <p>
              {lang === 'en' 
                ? "Screenshots are stored in your browser's persistent storage and rendered seamlessly across all documentation pages."
                : "আপলোড করা স্ক্রিনশটগুলো ব্রাউজারে সংরক্ষিত থাকবে এবং হেল্প ডকের সংশ্লিষ্ট পেজে চমৎকারভাবে প্রদর্শিত হবে।"}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors"
          >
            {lang === 'en' ? 'Done / Close' : 'সম্পন্ন / বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
}
