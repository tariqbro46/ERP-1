import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  LATEST_VERSION, 
  getLatestRelease, 
  markReleaseAsSeen, 
  hasUnseenRelease,
  RELEASE_NOTES 
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
  const [selectedVersion, setSelectedVersion] = useState<string>(LATEST_VERSION);

  // Auto-check on mount & sync open state
  useEffect(() => {
    if (controlledIsOpen !== undefined) {
      setIsOpen(controlledIsOpen);
      if (controlledIsOpen) {
        setSelectedVersion(LATEST_VERSION);
      }
    } else if (forceOpen || hasUnseenRelease()) {
      setIsOpen(true);
      setSelectedVersion(LATEST_VERSION);
    }
  }, [controlledIsOpen, forceOpen]);

  const activeRelease = useMemo(() => {
    return RELEASE_NOTES.find(r => r.version === selectedVersion) || getLatestRelease();
  }, [selectedVersion]);

  const activeReleaseIndex = useMemo(() => {
    return RELEASE_NOTES.findIndex(r => r.version === selectedVersion);
  }, [selectedVersion]);

  const previousRelease = useMemo(() => {
    return activeReleaseIndex >= 0 && activeReleaseIndex < RELEASE_NOTES.length - 1
      ? RELEASE_NOTES[activeReleaseIndex + 1]
      : null;
  }, [activeReleaseIndex]);

  const handleDismiss = () => {
    if (dontShowAgain && selectedVersion === LATEST_VERSION) {
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

  const totalNew = activeRelease.newFeatures.length;
  const totalImp = activeRelease.improvements.length;
  const totalFix = activeRelease.bugFixes.length;

  return createPortal(
    <AnimatePresence>
      <div 
        id="whats-new-modal-overlay"
        onClick={(e) => {
          if (e.target === e.currentTarget) handleDismiss();
        }}
        className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-2xl overflow-hidden flex flex-col max-h-[92vh] text-card-foreground"
        >
          {/* Top Banner with gradient & badges */}
          <div className="relative p-5 sm:p-6 pb-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-700 text-white overflow-hidden select-none">
            {/* Background sparkle accents */}
            <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute left-1/3 -top-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                    {isBn ? "নতুন কি? সংস্করণ পরিবর্তন বিবরণী" : "What's New? Version Updates"}
                  </span>
                  
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-black bg-white text-indigo-950 shadow-xs">
                    {activeRelease.version}
                  </span>

                  {activeRelease.version === LATEST_VERSION && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-400 text-emerald-950 uppercase tracking-wide">
                      {isBn ? 'বর্তমান সংস্করণ' : 'Current App Version'}
                    </span>
                  )}

                  <span className="flex items-center gap-1 text-[11px] text-white/85 font-medium">
                    <Calendar className="w-3 h-3 text-white/70" />
                    {isBn ? activeRelease.bnReleaseDate : activeRelease.releaseDate}
                  </span>
                </div>

                <h2 className="text-base sm:text-lg font-black tracking-tight text-white pt-1 leading-snug">
                  {isBn ? activeRelease.bnTitle : activeRelease.title}
                </h2>
                <p className="text-xs text-white/90 leading-relaxed max-w-xl line-clamp-2">
                  {isBn ? activeRelease.bnSummary : activeRelease.summary}
                </p>

                {/* Direct Version Comparison Callout */}
                <div className="mt-2.5 p-2 rounded-xl bg-black/25 border border-white/20 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 font-bold text-amber-300">
                      <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">{isBn ? 'টার্গেট ভার্সন:' : 'Version:'}</span>
                      <span className="font-mono bg-amber-400/20 px-1.5 py-0.5 rounded border border-amber-400/30 text-white font-black">{activeRelease.version}</span>
                    </div>
                    {previousRelease && (
                      <>
                        <ArrowRight className="w-3 h-3 text-white/60 shrink-0" />
                        <div className="flex items-center gap-1 text-white/90">
                          <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">{isBn ? 'তুলনা (পূর্বের):' : 'vs Previous:'}</span>
                          <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded border border-white/20">{previousRelease.version}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-white/90 font-medium">
                    <span className="inline-flex items-center gap-1 text-emerald-300 font-bold">
                      <PlusCircle className="w-3 h-3" /> {totalNew} {isBn ? 'নতুন ফিচার' : 'New'}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-amber-300 font-bold">
                      <Zap className="w-3 h-3" /> {totalImp} {isBn ? 'উন্নতি' : 'Imp'}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-blue-300 font-bold">
                      <Wrench className="w-3 h-3" /> {totalFix} {isBn ? 'ফিক্স' : 'Fixes'}
                    </span>
                  </div>
                </div>
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

            {/* Version Switcher Bar (History Timeline) */}
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/75 flex items-center gap-1 mr-1">
                  <History className="w-3 h-3 text-amber-300" />
                  {isBn ? 'রিসেন্ট ভার্সন হিস্ট্রি:' : 'Recent Releases:'}
                </span>
                {RELEASE_NOTES.slice(0, 4).map((rel) => {
                  const isSel = rel.version === selectedVersion;
                  return (
                    <button
                      key={rel.version}
                      type="button"
                      onClick={() => {
                        setSelectedVersion(rel.version);
                        setActiveTab('all');
                      }}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all shrink-0 flex items-center gap-1",
                        isSel
                          ? "bg-white text-indigo-950 shadow-xs ring-2 ring-white/60 font-black"
                          : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                      )}
                    >
                      <span>{rel.version}</span>
                      {rel.version === LATEST_VERSION && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={handleViewAllHistory}
                className="text-[10px] font-bold text-white/85 hover:text-white underline underline-offset-2 shrink-0 flex items-center gap-0.5 ml-2"
              >
                <span>{isBn ? 'সব রিলিজ দেখুন' : 'Full Release Notes'}</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pt-1">
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
          <div className="p-5 sm:p-6 overflow-y-auto max-h-[46vh] space-y-4 no-scrollbar">
            {/* New Features Section */}
            {(activeTab === 'all' || activeTab === 'new') && activeRelease.newFeatures.length > 0 && (
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
                  {activeRelease.newFeatures.map((item) => (
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
            {(activeTab === 'all' || activeTab === 'improvements') && activeRelease.improvements.length > 0 && (
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
                  {activeRelease.improvements.map((item) => (
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
            {(activeTab === 'all' || activeTab === 'fixes') && activeRelease.bugFixes.length > 0 && (
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
                  {activeRelease.bugFixes.map((item) => (
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
                {isBn ? 'এই সংস্করণের জন্য আর স্বয়ংক্রিয় দেখাবেন না' : "Don't show automatically for this version"}
              </span>
            </label>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end flex-wrap">
              <button
                type="button"
                onClick={handleViewAllHistory}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors border border-border/60"
              >
                <History className="w-3.5 h-3.5 text-blue-600" />
                <span>{isBn ? 'সম্পূর্ণ রিলিজ নোটস' : 'All Releases Page'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleDismiss();
                  navigate('/business-intelligence');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                title={isBn ? 'নতুন ফিচার ঘুরে দেখুন' : 'Take a feature tour'}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>{isBn ? 'নতুন ফিচার ট্যুর (Take a Tour)' : 'Take a Tour'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>{isBn ? 'ঠিক আছে, বুঝেছি' : 'Got it, Close'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
