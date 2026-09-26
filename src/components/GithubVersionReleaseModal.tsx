import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  X,
  RefreshCw,
  Terminal,
  ExternalLink,
  ShieldCheck,
  Tag,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { LATEST_VERSION } from '../data/releaseNotes';
import { erpService } from '../services/erpService';
import { cn } from '../lib/utils';

interface GithubVersionReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVersionUpdated?: (newVersion: string) => void;
}

export function GithubVersionReleaseModal({
  isOpen,
  onClose,
  onVersionUpdated
}: GithubVersionReleaseModalProps) {
  const { appVersion, updateSystemSettings } = useSettings();
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const { user } = useAuth();

  // Current active version
  const currentVersion = appVersion || LATEST_VERSION || 'v1.8.5';

  // State
  const [targetVersion, setTargetVersion] = useState<string>('');
  const [commitMessage, setCommitMessage] = useState<string>('');
  const [releaseNotesSummary, setReleaseNotesSummary] = useState<string>('');
  const [broadcastReload, setBroadcastReload] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [copiedCommand, setCopiedCommand] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string>('');

  // Helper to parse semver and calculate next versions
  const calculateNextVersions = (ver: string) => {
    const clean = ver.replace(/^v/i, '').trim();
    const parts = clean.split('.').map(p => parseInt(p, 10));
    const major = isNaN(parts[0]) ? 1 : parts[0];
    const minor = isNaN(parts[1]) ? 0 : parts[1];
    const patch = isNaN(parts[2]) ? 0 : parts[2];

    return {
      patch: `v${major}.${minor}.${patch + 1}`,
      minor: `v${major}.${minor + 1}.0`,
      major: `v${major + 1}.0.0`
    };
  };

  const suggestions = calculateNextVersions(currentVersion);

  // Initialize target version when modal opens
  useEffect(() => {
    if (isOpen) {
      setTargetVersion(suggestions.patch);
      setCommitMessage(`Release ${suggestions.patch}: System updates and enhancements`);
      setReleaseNotesSummary('');
      setIsSuccess(false);
      setValidationError('');
      setCopiedCommand(false);
    }
  }, [isOpen, currentVersion]);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyVersion = async () => {
    const cleanTarget = targetVersion.trim();
    if (!cleanTarget) {
      setValidationError(isBn ? 'অনুগ্রহ করে একটি বৈধ সংস্করণ নাম লিখুন (যেমন: v1.8.6)' : 'Please provide a valid version name (e.g., v1.8.6)');
      return;
    }

    setValidationError('');
    setIsSubmitting(true);

    try {
      // 1. Update in system config (Firestore + SettingsContext)
      await updateSystemSettings({
        appVersion: cleanTarget,
        lastVersionUpdateDate: new Date().toISOString(),
        lastVersionCommitMessage: commitMessage.trim() || `Release ${cleanTarget}`
      });

      // 2. Persist in local storage
      try {
        localStorage.setItem('tallyflow_active_version', cleanTarget);
        localStorage.setItem('swr_app_version', cleanTarget);
      } catch (e) {
        console.warn('Could not write to localStorage:', e);
      }

      // 3. Optional: broadcast reload to active company members
      if (broadcastReload && user?.companyId) {
        try {
          await erpService.updateCompany(user.companyId, {
            forceRefreshAt: Date.now()
          });
        } catch (err) {
          console.warn('Could not broadcast refresh:', err);
        }
      }

      setIsSuccess(true);
      if (onVersionUpdated) {
        onVersionUpdated(cleanTarget);
      }
    } catch (err: any) {
      console.error('Failed to update app version:', err);
      setValidationError(err?.message || (isBn ? 'সংস্করণ আপডেট করতে ত্রুটি হয়েছে' : 'Failed to update app version'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const gitCommand = `git add .\ngit commit -m "${commitMessage || `Release ${targetVersion}`}"\ngit push origin main`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(gitCommand);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  return createPortal(
    <AnimatePresence>
      <div
        id="github-version-release-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh] text-card-foreground"
        >
          {/* Header Banner */}
          <div className="relative p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden select-none border-b border-white/10">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/15 backdrop-blur-md text-white border border-white/20">
                    <GitPullRequest className="w-3 h-3 text-indigo-300" />
                    {isBn ? 'গিটহাব সিঙ্ক ও সংস্করণ কন্ট্রোল' : 'GitHub Sync & Version Control'}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Git Ready
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white pt-1">
                  {isBn ? 'গিটহাবে পরিবর্তন পুশ ও অ্যাপ সংস্করণ আপডেট' : 'Push Changes to GitHub & Update App Version'}
                </h3>
                <p className="text-xs text-white/75 leading-relaxed">
                  {isBn 
                    ? 'গিটহাবে পুশ করার সময় অ্যাপের নতুন সংস্করণ নির্ধারণ করুন। এখানে যে সংস্করণ দেবেন সেটি পুরো অ্যাপ্লিকেশনে তাৎক্ষণিকভাবে কার্যকর হবে।'
                    : 'Specify the target app version before pushing to GitHub. Whichever version you set here will be immediately deployed across the application.'}
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[70vh] space-y-5 no-scrollbar">
            {/* Version Transition Visualizer */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  {isBn ? 'বর্তমান সংস্করণ' : 'Current Active Version'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-mono text-sm sm:text-base font-black text-foreground">
                    {currentVersion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold shrink-0">
                <span className="text-[11px] font-semibold hidden sm:inline">{isBn ? 'আপগ্রেড হচ্ছে' : 'Upgrading to'}</span>
                <ArrowRight className="w-4 h-4 animate-pulse" />
              </div>

              <div className="space-y-0.5 text-right sm:text-left">
                <span className="text-[10px] uppercase font-bold text-indigo-600 dark:text-indigo-400 tracking-wider block">
                  {isBn ? 'নতুন সংস্করণ (টার্গেট)' : 'New Version (Target)'}
                </span>
                <div className="flex items-center justify-end sm:justify-start gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                    {targetVersion || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Semantic Version Bump Suggestions */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-primary" />
                <span>{isBn ? 'দ্রুত সংস্করণ নির্বাচন (Quick Presets)' : 'Quick Version Presets'}</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setTargetVersion(suggestions.patch);
                    setCommitMessage(`Release ${suggestions.patch}: Bug fixes and performance polish`);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5",
                    targetVersion === suggestions.patch
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "bg-muted/40 hover:bg-muted border-border text-foreground hover:border-border/80"
                  )}
                >
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground">
                    Patch (ফিক্স/ছোট)
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm">{suggestions.patch}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetVersion(suggestions.minor);
                    setCommitMessage(`Release ${suggestions.minor}: New features and UI enhancements`);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5",
                    targetVersion === suggestions.minor
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "bg-muted/40 hover:bg-muted border-border text-foreground hover:border-border/80"
                  )}
                >
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground">
                    Minor (নতুন ফিচার)
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm">{suggestions.minor}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTargetVersion(suggestions.major);
                    setCommitMessage(`Release ${suggestions.major}: Major architectural upgrade`);
                  }}
                  className={cn(
                    "p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-0.5",
                    targetVersion === suggestions.major
                      ? "bg-primary/10 border-primary text-primary font-bold shadow-xs ring-2 ring-primary/20"
                      : "bg-muted/40 hover:bg-muted border-border text-foreground hover:border-border/80"
                  )}
                >
                  <span className="text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground">
                    Major (বড় আপডেট)
                  </span>
                  <span className="font-mono font-black text-xs sm:text-sm">{suggestions.major}</span>
                </button>
              </div>
            </div>

            {/* Custom Version Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>{isBn ? 'কাস্টম অ্যাপ সংস্করণ (Manual Input)' : 'Target App Version Name'}</span>
                <span className="text-[10px] font-normal text-muted-foreground lowercase">
                  {isBn ? 'উদাহরণ: v1.8.6 বা v2.0.0' : 'e.g., v1.8.6, v2.0.0-rc1'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetVersion}
                  onChange={(e) => setTargetVersion(e.target.value)}
                  placeholder="v1.8.6"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Commit Message Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                <span>{isBn ? 'গিটহাব কমিট মেসেজ (Git Commit Message)' : 'GitHub Commit Message'}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {isBn ? 'পরিবর্তন বিবরণী' : 'Summary of changes'}
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(e) => setCommitMessage(e.target.value)}
                  placeholder="Release v1.8.6: System updates and enhancements"
                  className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none text-xs">
                  <GitCommit className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Live Broadcast Refresh Option */}
            <div className="p-3 bg-muted/30 border border-border rounded-xl flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-foreground cursor-pointer flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isBn ? 'লাইভ সেশন স্বয়ংক্রিয় রিফ্রেশ ব্রডকাস্ট' : 'Broadcast Live App Refresh'}</span>
                </label>
                <p className="text-[10px] text-muted-foreground">
                  {isBn 
                    ? 'কোম্পানির সকল সক্রিয় ব্যবহারকারীর ব্রাউজারে সাথে সাথে নতুন সংস্করণ লোড হবে।' 
                    : 'Instantly sync and reload the new version on all connected active user devices.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={broadcastReload}
                onChange={(e) => setBroadcastReload(e.target.checked)}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Success State Visualizer */}
            {isSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {isBn 
                      ? `অ্যাপ সংস্করণ সফলভাবে ${targetVersion} এ উন্নীত ও কার্যকর হয়েছে!` 
                      : `App version successfully updated to ${targetVersion}!`}
                  </span>
                </div>

                <div className="p-3 bg-black/80 rounded-lg text-emerald-300 font-mono text-xs overflow-x-auto relative group">
                  <div className="text-[10px] text-slate-400 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Terminal className="w-3 h-3 text-slate-400" /> Git Commands to Push:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyCommand}
                      className="text-white hover:text-emerald-300 flex items-center gap-1 text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                    >
                      {copiedCommand ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCommand ? 'Copied!' : 'Copy Commands'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] whitespace-pre-wrap">{gitCommand}</pre>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-4 bg-muted/60 border-t border-border flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {isBn ? 'সরাসরি ডাটাবেজ ও UI সিঙ্ক' : 'Direct DB & UI Sync'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors border border-border/60"
              >
                {isSuccess ? (isBn ? 'সম্পন্ন (Close)' : 'Done') : (isBn ? 'বাতিল' : 'Cancel')}
              </button>

              <button
                type="button"
                id="btn-apply-and-push-version"
                disabled={isSubmitting}
                onClick={handleApplyVersion}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isBn ? 'সংস্করণ কার্যকর হচ্ছে...' : 'Implementing Version...'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>{isBn ? 'সংস্করণ কার্যকর ও গিটহাব সিঙ্ক করুন' : 'Implement Version & Push to GitHub'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
