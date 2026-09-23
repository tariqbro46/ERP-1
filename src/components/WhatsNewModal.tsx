import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  ArrowRight, 
  Wrench, 
  Zap, 
  PlusCircle, 
  Calendar, 
  History,
  ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  LATEST_VERSION, 
  getLatestRelease, 
  markReleaseAsSeen, 
  hasUnseenRelease 
} from '../data/releaseNotes';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

interface WhatsNewModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  forceOpen?: boolean;
}

export function WhatsNewModal({ isOpen: controlledIsOpen, onClose, forceOpen = false }: WhatsNewModalProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'new' | 'improvements' | 'fixes'>('all');
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const latestRelease = getLatestRelease();

  // Auto-check on mount
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
    } else if (forceOpen || hasUnseenRelease()) {
      setIsOpen(true);
    }
  }, [controlledIsOpen, forceOpen]);

  const handleDismiss = () => {
    if (dontShowAgain) {
      markReleaseAsSeen(LATEST_VERSION);
    }
    setIsOpen(false);
    onClose?.();
  };

  const handleViewAllHistory = () => {
    handleDismiss();
    navigate('/release-notes');
  };

  if (!isOpen) return null;

  const totalNew = latestRelease.newFeatures.length;
  const totalImp = latestRelease.improvements.length;
  const totalFix = latestRelease.bugFixes.length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[90vh] text-card-foreground"
        >
          {/* Top Banner with gradient & badge */}
          <div className="relative p-6 pb-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white overflow-hidden select-none">
            {/* Background sparkle accents */}
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -top-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    {isBn ? 'নতুন আপডেট রিলিজ' : 'New Update Released'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-white text-indigo-900 shadow-xs">
                    {latestRelease.version}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-white/80 font-medium">
                    <Calendar className="w-3 h-3 text-white/70" />
                    {isBn ? latestRelease.bnReleaseDate : latestRelease.releaseDate}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white pt-1">
                  {isBn ? latestRelease.bnTitle : latestRelease.title}
                </h2>
                <p className="text-xs text-white/90 leading-relaxed max-w-xl">
                  {isBn ? latestRelease.bnSummary : latestRelease.summary}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismiss}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-colors border border-white/20 shrink-0"
                title={isBn ? 'বন্ধ করুন' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-5 overflow-x-auto no-scrollbar pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === 'all'
                    ? "bg-white text-indigo-900 shadow-md"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
              >
                <span>{isBn ? 'সব পরিবর্তন' : 'All Changes'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                  {totalNew + totalImp + totalFix}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('new')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === 'new'
                    ? "bg-white text-indigo-900 shadow-md"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isBn ? 'নতুন ফিচার' : 'New Features'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-700/50 font-mono">
                  {totalNew}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('improvements')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === 'improvements'
                    ? "bg-white text-indigo-900 shadow-md"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
              >
                <Zap className="w-3.5 h-3.5 text-amber-300" />
                <span>{isBn ? 'উন্নতি ও পরিমার্জন' : 'Improvements'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-700/50 font-mono">
                  {totalImp}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('fixes')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5",
                  activeTab === 'fixes'
                    ? "bg-white text-indigo-900 shadow-md"
                    : "bg-white/15 text-white hover:bg-white/25"
                )}
              >
                <Wrench className="w-3.5 h-3.5 text-blue-300" />
                <span>{isBn ? 'বাগ ফিক্স' : 'Bug Fixes'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-700/50 font-mono">
                  {totalFix}
                </span>
              </button>
            </div>
          </div>

          {/* Scrollable Content Items */}
          <div className="p-6 overflow-y-auto max-h-[46vh] space-y-4 no-scrollbar">
            {/* New Features Section */}
            {(activeTab === 'all' || activeTab === 'new') && latestRelease.newFeatures.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <PlusCircle className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs uppercase font-black tracking-wider text-emerald-700 dark:text-emerald-400">
                    {isBn ? 'নতুন সংযোজিত ফিচারসমূহ (New Features)' : 'New Features Added'}
                  </h4>
                </div>

                <div className="grid gap-2.5">
                  {latestRelease.newFeatures.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-muted/40 border border-border/80 rounded-xl hover:border-emerald-500/40 transition-colors space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            {item.badge || 'NEW'}
                          </span>
                          <h5 className="text-xs font-bold text-foreground">
                            {isBn ? item.bnTitle : item.title}
                          </h5>
                        </div>
                        {item.module && (
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {item.module}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {isBn ? item.bnDescription : item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvements Section */}
            {(activeTab === 'all' || activeTab === 'improvements') && latestRelease.improvements.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                    <Zap className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs uppercase font-black tracking-wider text-amber-700 dark:text-amber-400">
                    {isBn ? 'সিস্টেম পরিমার্জন ও কার্যক্ষমতা বৃদ্ধি (Improvements)' : 'System Improvements'}
                  </h4>
                </div>

                <div className="grid gap-2.5">
                  {latestRelease.improvements.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-muted/40 border border-border/80 rounded-xl hover:border-amber-500/40 transition-colors space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <h5 className="text-xs font-bold text-foreground">
                          {isBn ? item.bnTitle : item.title}
                        </h5>
                        {item.module && (
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {item.module}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {isBn ? item.bnDescription : item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bug Fixes Section */}
            {(activeTab === 'all' || activeTab === 'fixes') && latestRelease.bugFixes.length > 0 && (
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs uppercase font-black tracking-wider text-blue-700 dark:text-blue-400">
                    {isBn ? 'বাগ ও ত্রুটি সমাধান (Bug Fixes)' : 'Bug Fixes & Patches'}
                  </h4>
                </div>

                <div className="grid gap-2.5">
                  {latestRelease.bugFixes.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-muted/40 border border-border/80 rounded-xl hover:border-blue-500/40 transition-colors space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <h5 className="text-xs font-bold text-foreground">
                            {isBn ? item.bnTitle : item.title}
                          </h5>
                        </div>
                        {item.module && (
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {item.module}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        {isBn ? item.bnDescription : item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Controls */}
          <div className="p-4 bg-muted/50 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="w-4 h-4 rounded border-border text-blue-600 focus:ring-blue-500 focus:ring-offset-0 bg-background cursor-pointer"
              />
              <span className="text-xs text-muted-foreground">
                {isBn ? 'এই সংস্করণের জন্য আর দেখাবেন না' : "Don't show again for this version"}
              </span>
            </label>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleViewAllHistory}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
              >
                <History className="w-3.5 h-3.5" />
                <span>{isBn ? 'রিলিজ হিস্ট্রি' : 'All Releases'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>{isBn ? 'ঠিক আছে, বুঝেছি' : 'Got it, Explore'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
