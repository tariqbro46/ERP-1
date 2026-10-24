import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Plus, 
  Trash2, 
  UploadCloud, 
  CheckCircle2, 
  Loader2, 
  Tag, 
  Layers, 
  GitCommit, 
  AlertCircle,
  Wrench,
  Zap,
  PlusCircle,
  ExternalLink
} from 'lucide-react';
import { LATEST_VERSION } from '../data/releaseNotes';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { soundService } from '../services/soundService';
import { cn } from '../lib/utils';

export interface ReleaseItemDraft {
  id?: string;
  title: string;
  bnTitle: string;
  description: string;
  bnDescription: string;
  module: string;
  badge: string;
}

interface ReleaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (version: string) => void;
}

export function ReleaseManagerModal({ isOpen, onClose, onPublished }: ReleaseManagerModalProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { showNotification } = useNotification();

  // Helper to compute next semver
  const getNextVersion = (type: 'patch' | 'minor' | 'major') => {
    const clean = LATEST_VERSION.replace(/^v/, '');
    const parts = clean.split('.').map(p => parseInt(p, 10) || 0);
    while (parts.length < 3) parts.push(0);

    if (type === 'patch') {
      return `v${parts[0]}.${parts[1]}.${parts[2] + 1}`;
    } else if (type === 'minor') {
      return `v${parts[0]}.${parts[1] + 1}.0`;
    } else {
      return `v${parts[0] + 1}.0.0`;
    }
  };

  const [version, setVersion] = useState<string>(getNextVersion('patch'));
  const [title, setTitle] = useState<string>('');
  const [bnTitle, setBnTitle] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [bnSummary, setBnSummary] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>('');

  const [activeSection, setActiveSection] = useState<'features' | 'improvements' | 'fixes'>('features');
  
  const [newFeatures, setNewFeatures] = useState<ReleaseItemDraft[]>([
    {
      title: '',
      bnTitle: '',
      description: '',
      bnDescription: '',
      module: 'Core ERP',
      badge: 'NEW'
    }
  ]);

  const [improvements, setImprovements] = useState<ReleaseItemDraft[]>([]);
  const [bugFixes, setBugFixes] = useState<ReleaseItemDraft[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverLogs, setServerLogs] = useState<string>('');

  if (!isOpen) return null;

  // Add Item to active section
  const handleAddItem = (section: 'features' | 'improvements' | 'fixes') => {
    const defaultModule = section === 'features' ? 'Feature' : section === 'improvements' ? 'Performance' : 'Bug Fix';
    const defaultBadge = section === 'features' ? 'NEW' : section === 'improvements' ? 'IMPROVEMENT' : 'FIX';
    const newItem: ReleaseItemDraft = {
      title: '',
      bnTitle: '',
      description: '',
      bnDescription: '',
      module: defaultModule,
      badge: defaultBadge
    };

    if (section === 'features') setNewFeatures([...newFeatures, newItem]);
    else if (section === 'improvements') setImprovements([...improvements, newItem]);
    else setBugFixes([...bugFixes, newItem]);
  };

  const handleUpdateItem = (
    section: 'features' | 'improvements' | 'fixes',
    index: number,
    field: keyof ReleaseItemDraft,
    val: string
  ) => {
    if (section === 'features') {
      const copy = [...newFeatures];
      copy[index] = { ...copy[index], [field]: val };
      setNewFeatures(copy);
    } else if (section === 'improvements') {
      const copy = [...improvements];
      copy[index] = { ...copy[index], [field]: val };
      setImprovements(copy);
    } else {
      const copy = [...bugFixes];
      copy[index] = { ...copy[index], [field]: val };
      setBugFixes(copy);
    }
  };

  const handleRemoveItem = (section: 'features' | 'improvements' | 'fixes', index: number) => {
    if (section === 'features') {
      setNewFeatures(newFeatures.filter((_, i) => i !== index));
    } else if (section === 'improvements') {
      setImprovements(improvements.filter((_, i) => i !== index));
    } else {
      setBugFixes(bugFixes.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (isPushDirect: boolean = false) => {
    const cleanVersion = version.trim() || LATEST_VERSION;
    if (!cleanVersion) {
      showNotification(isBn ? 'অনুগ্রহ করে ভার্সন নম্বর প্রদান করুন' : 'Please provide a version number', 'error');
      return;
    }

    // Filter valid items
    const validFeatures = newFeatures.filter(f => f.title.trim() || f.description.trim());
    const validImprovements = improvements.filter(imp => imp.title.trim() || imp.description.trim());
    const validFixes = bugFixes.filter(fix => fix.title.trim() || fix.description.trim());

    if (!title.trim() && validFeatures.length === 0 && validImprovements.length === 0 && validFixes.length === 0) {
      showNotification(isBn ? 'রিলিজের নাম অথবা অন্তত একটি ফিচার বা ফিক্স যোগ করুন' : 'Provide a release title or at least one feature/fix', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      soundService.play('click');
      const endpoint = isPushDirect ? '/api/github/push' : '/api/github/release';

      const payload = {
        version: cleanVersion,
        title: title.trim() || `Version ${cleanVersion} Updates`,
        bnTitle: bnTitle.trim() || title.trim() || `সংস্করণ ${cleanVersion} আপডেট`,
        summary: summary.trim() || `New release ${cleanVersion} deployed with latest system enhancements and features.`,
        bnSummary: bnSummary.trim() || summary.trim() || `সংস্করণ ${cleanVersion} নতুন ফিচার ও পারফরম্যান্স উন্নয়নসহ কার্যকর করা হয়েছে।`,
        newFeatures: validFeatures,
        improvements: validImprovements,
        bugFixes: validFixes,
        commitMessage: commitMessage.trim() || title.trim() || `Release ${cleanVersion}`
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.logs) {
        setServerLogs(data.logs);
      }

      if (data.success) {
        soundService.play('success');
        showNotification(
          isBn 
            ? `সংস্করণ ${data.version} এবং রিলিজ নোটস সফলভাবে প্রস্তুত ও কমিট হয়েছে!`
            : `Version ${data.version} & Release Notes successfully saved and committed!`,
          'success'
        );

        if (onPublished) {
          onPublished(data.version);
        }

        // Trigger what's new preview
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open_whats_new'));
        }, 800);

        onClose();
      } else {
        soundService.play('error');
        showNotification(data.error || 'Failed to publish release', 'error');
      }
    } catch (err: any) {
      soundService.play('error');
      showNotification(err.message || 'Error publishing release', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-card border border-border w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (Permanent Fixed) */}
        <div className="shrink-0 px-6 py-4 border-b border-border bg-card/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  {isBn ? 'রিলিজ ম্যানেজার ও সংস্করণ প্রকাশক' : 'Release Manager & Version Publisher'}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-muted text-muted-foreground border border-border">
                  Current: {LATEST_VERSION}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn 
                  ? 'নতুন অ্যাপ সংস্করণ, ফিচার লিস্ট ও বাগ ফিক্স রিলিজ নোটস এবং গিটহাবে যোগ করুন' 
                  : 'Define custom version number, release notes changelog, and synchronize with GitHub'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* 1. Version Selection Card */}
          <div className="p-4 sm:p-5 rounded-xl border border-border bg-muted/20 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {isBn ? 'অ্যাপের সংস্করণ নির্ধারণ (App Version)' : 'Select or Enter Version Number'}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground mr-1">
                  {isBn ? 'কুইক বাটন:' : 'Quick Bumps:'}
                </span>
                <button
                  type="button"
                  onClick={() => setVersion(getNextVersion('patch'))}
                  className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-card hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
                  title="Next Patch"
                >
                  {getNextVersion('patch')}
                </button>
                <button
                  type="button"
                  onClick={() => setVersion(getNextVersion('minor'))}
                  className="px-2 py-1 text-[10px] font-mono font-bold rounded bg-card hover:bg-muted border border-border text-foreground transition-colors cursor-pointer"
                  title="Next Minor"
                >
                  {getNextVersion('minor')}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>{isBn ? 'নতুন ভার্সন কোড (যেমন: 1.1.2, 1.1.11, 1.2.0)' : 'New Version Code (e.g. 1.1.2, 1.1.11, 1.2.0)'}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="e.g. 1.1.2 or v1.1.2"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {isBn 
                    ? 'আপনি যা লিখবেন সেটাই হেডার, সেটিংস, package.json এবং রিলিজ নোটসে প্রদর্শিত হবে।' 
                    : 'The entered version will appear on the Header badge, Settings, package.json, and Release Notes.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  {isBn ? 'গিট কমিট মেসেজ (ঐচ্ছিক)' : 'Git Commit Message (Optional)'}
                </label>
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder={`Release ${version || 'update'}: Feature rollout`}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground">
                  {isBn ? 'GitHub কমিটে যে মেসেজটি দেখা যাবে।' : 'Visible in GitHub commit history.'}
                </p>
              </div>
            </div>
          </div>

          {/* 2. Release Title & Summary */}
          <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground border-b border-border/60 pb-2">
              {isBn ? 'রিলিজের নাম ও সারসংক্ষেপ' : 'Release Title & Summary'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isBn ? 'রিলিজ টাইটেল (English)' : 'Release Title (English)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Bank Ledger Filtering Fix & GitHub Version Release Manager"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isBn ? 'রিলিজ টাইটেল (বাংলা)' : 'Release Title (Bengali)'}
                </label>
                <input
                  type="text"
                  value={bnTitle}
                  onChange={(e) => setBnTitle(e.target.value)}
                  placeholder="যেমন: ব্যাংক লেজার ফিল্টারিং সমাধান ও গিটহাব রিলিজ ম্যানেজার"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isBn ? 'রিলিজ সারসংক্ষেপ (English Summary)' : 'Release Summary (English)'}
                </label>
                <textarea
                  rows={2}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Summary of this update for users..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  {isBn ? 'রিলিজ সারসংক্ষেপ (বাংলা সারসংক্ষেপ)' : 'Release Summary (Bengali)'}
                </label>
                <textarea
                  rows={2}
                  value={bnSummary}
                  onChange={(e) => setBnSummary(e.target.value)}
                  placeholder="এই আপডেটের সংক্ষিপ্ত বিবরণ..."
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-sans"
                />
              </div>
            </div>
          </div>

          {/* 3. Detailed Changelog Builder (Features, Improvements, Fixes) */}
          <div className="p-4 sm:p-5 rounded-xl border border-border bg-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  {isBn ? 'পরিবর্তনসমূহের বিস্তারিত তালিকা (Changelog Items)' : 'Changelog Items'}
                </h3>
              </div>

              {/* Category Tabs */}
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setActiveSection('features')}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    activeSection === 'features' ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন ফিচার' : 'New Features'} ({newFeatures.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('improvements')}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    activeSection === 'improvements' ? "bg-card text-amber-600 dark:text-amber-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isBn ? 'উন্নয়ন' : 'Improvements'} ({improvements.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection('fixes')}
                  className={cn(
                    "px-3 py-1 rounded text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                    activeSection === 'fixes' ? "bg-card text-blue-600 dark:text-blue-400 shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>{isBn ? 'বাগ ফিক্স' : 'Bug Fixes'} ({bugFixes.length})</span>
                </button>
              </div>
            </div>

            {/* List of Items for Active Category */}
            <div className="space-y-3">
              {(() => {
                const items = activeSection === 'features' ? newFeatures : activeSection === 'improvements' ? improvements : bugFixes;
                if (items.length === 0) {
                  return (
                    <div className="text-center py-6 border border-dashed border-border rounded-xl text-muted-foreground space-y-2">
                      <p className="text-xs">
                        {isBn 
                          ? `কোনো ${activeSection === 'features' ? 'নতুন ফিচার' : activeSection === 'improvements' ? 'উন্নয়ন' : 'বাগ ফিক্স'} যুক্ত করা হয়নি`
                          : `No ${activeSection} added yet.`}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddItem(activeSection)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{isBn ? '+ নতুন আইটেম যোগ করুন' : '+ Add Item'}</span>
                      </button>
                    </div>
                  );
                }

                return (
                  <>
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3.5 border border-border/80 bg-muted/20 rounded-xl space-y-3 relative group">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                            #{idx + 1} {activeSection === 'features' ? 'FEATURE' : activeSection === 'improvements' ? 'IMPROVEMENT' : 'FIX'}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={item.module}
                              onChange={(e) => handleUpdateItem(activeSection, idx, 'module', e.target.value)}
                              placeholder="Module (e.g. Voucher Entry)"
                              className="px-2 py-0.5 bg-background border border-border rounded text-[10px] text-foreground font-medium w-36"
                              title="Module name"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(activeSection, idx)}
                              className="text-muted-foreground hover:text-rose-500 p-1 transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => handleUpdateItem(activeSection, idx, 'title', e.target.value)}
                              placeholder={isBn ? "আইটেম টাইটেল (English)..." : "Item Title (English)..."}
                              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => handleUpdateItem(activeSection, idx, 'description', e.target.value)}
                              placeholder={isBn ? "বিস্তারিত বিবরণ (English)..." : "Detailed description (English)..."}
                              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                            />
                          </div>

                          <div className="space-y-1">
                            <input
                              type="text"
                              value={item.bnTitle}
                              onChange={(e) => handleUpdateItem(activeSection, idx, 'bnTitle', e.target.value)}
                              placeholder={isBn ? "আইটেম টাইটেল (বাংলা)..." : "Item Title (Bengali)..."}
                              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                            <textarea
                              rows={2}
                              value={item.bnDescription}
                              onChange={(e) => handleUpdateItem(activeSection, idx, 'bnDescription', e.target.value)}
                              placeholder={isBn ? "বিস্তারিত বিবরণ (বাংলা)..." : "Detailed description (Bengali)..."}
                              className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => handleAddItem(activeSection)}
                      className="w-full py-2 border border-dashed border-border/80 hover:border-primary/50 hover:bg-primary/5 text-primary text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>
                        {isBn 
                          ? `আরেকটি ${activeSection === 'features' ? 'ফিচার' : activeSection === 'improvements' ? 'উন্নয়ন' : 'বাগ ফিক্স'} যোগ করুন` 
                          : `Add Another ${activeSection === 'features' ? 'Feature' : activeSection === 'improvements' ? 'Improvement' : 'Bug Fix'}`}
                      </span>
                    </button>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="p-3.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
            <div className="text-xs text-indigo-700 dark:text-indigo-300 space-y-1">
              <p className="font-bold">
                {isBn ? 'কিভাবে কাজ করবে:' : 'How this works:'}
              </p>
              <p className="leading-relaxed">
                {isBn
                  ? 'এই ফর্মে রিলিজ সেভ করলে স্বয়ংক্রিয়ভাবে package.json ও releaseNotes.ts আপডেট হয়ে লোকাল গিট কমিট ও ট্যাগ তৈরি হবে। এরপর Google AI Studio-এর ডানদিকের "Push changes to GitHub" বাটনে অথবা নিচের বাটনে ক্লিক করলেই আপনার কোড GitHub হয়ে Vercel-এ লাইভ রিলিজ হয়ে যাবে!'
                  : 'Saving this release updates package.json and releaseNotes.ts with an automated local Git commit. Then clicking AI Studio\'s "Push changes to GitHub" button pushes the commit to GitHub, triggering your Vercel deployment!'}
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions (Permanent Fixed) */}
        <div className="shrink-0 px-6 py-4 border-t border-border bg-card/90 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 border border-border text-foreground hover:bg-muted text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {isBn ? 'বাতিল করুন' : 'Cancel'}
          </button>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-center gap-2.5">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(false)}
              className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving Release...'}</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? `রিলিজ প্রস্তুত ও সংরক্ষণ করুন (${version})` : `Save & Stage Release (${version})`}</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSubmit(true)}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isBn ? 'প্রসেসিং...' : 'Processing...'}</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{isBn ? 'রিলিজ ও সরাসরি গিটহাবে পুশ' : 'Save & Push to GitHub'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
