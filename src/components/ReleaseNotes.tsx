import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  History,
  PlusCircle,
  Printer,
  Search,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { RELEASE_NOTES, LATEST_VERSION } from '../data/releaseNotes';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_APP_BRANDING, escapeHtml } from '../constants/appIdentity';
import { cn } from '../lib/utils';
import { executePrint } from '../utils/printUtils';
import { ReleaseManagerModal } from './ReleaseManagerModal';
import { Navbar } from './landing/Navbar';
import { Footer } from './landing/Footer';

export function ReleaseNotes() {
  const { language, t } = useLanguage();
  const isBn = language === 'bn';
  const { appIdentity, appVersion } = useSettings();
  const { isFounder } = useAuth();

  const appDisplayName = appIdentity?.appName || DEFAULT_APP_BRANDING.appName;
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.31').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.31'
    : `v${appVersion || LATEST_VERSION || '1.9.9.31'}`;

  const [selectedVersion, setSelectedVersion] = useState<string>(LATEST_VERSION);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'new' | 'improvements' | 'fixes'>('all');
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  const activeRelease = useMemo(() => {
    return RELEASE_NOTES.find((r) => r.version === selectedVersion) || RELEASE_NOTES[0];
  }, [selectedVersion]);

  const filteredRelease = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch = (item: any) => {
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.bnTitle.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.bnDescription.toLowerCase().includes(term) ||
        (item.module && item.module.toLowerCase().includes(term))
      );
    };

    const newFeatures =
      activeCategory === 'all' || activeCategory === 'new'
        ? activeRelease.newFeatures.filter(matchesSearch)
        : [];

    const improvements =
      activeCategory === 'all' || activeCategory === 'improvements'
        ? activeRelease.improvements.filter(matchesSearch)
        : [];

    const bugFixes =
      activeCategory === 'all' || activeCategory === 'fixes'
        ? activeRelease.bugFixes.filter(matchesSearch)
        : [];

    return {
      newFeatures,
      improvements,
      bugFixes,
      total: newFeatures.length + improvements.length + bugFixes.length,
    };
  }, [activeRelease, searchTerm, activeCategory]);

  const handlePrint = () => {
    const safeAppName = escapeHtml(appDisplayName);
    const safeVersion = escapeHtml(activeRelease.version);
    executePrint(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Release Notes ${safeVersion} - ${safeAppName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; }
            h1 { color: #1e3a8a; margin-bottom: 4px; font-size: 24px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 24px; }
            h3 { margin-top: 24px; padding-bottom: 6px; font-size: 16px; border-bottom: 2px solid #e2e8f0; }
            .new-h3 { color: #059669; border-bottom-color: #059669; }
            .imp-h3 { color: #d97706; border-bottom-color: #d97706; }
            .fix-h3 { color: #2563eb; border-bottom-color: #2563eb; }
            ul { padding-left: 20px; margin-top: 8px; }
            li { margin-bottom: 12px; }
            .desc { color: #475569; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>${safeAppName} - Release Notes (${safeVersion})</h1>
          <div class="meta">Release Date: ${escapeHtml(activeRelease.releaseDate)} (${escapeHtml(activeRelease.bnReleaseDate)})</div>
          <div class="summary">
            <strong>${escapeHtml(activeRelease.title)}</strong><br/>
            <span>${escapeHtml(activeRelease.summary)}</span>
          </div>

          <h3 class="new-h3">New Features (${activeRelease.newFeatures.length})</h3>
          <ul>
            ${activeRelease.newFeatures
              .map(
                (f) => `
              <li>
                <strong>${escapeHtml(f.title)}</strong> (${escapeHtml(f.module || 'Core')})<br/>
                <div class="desc">${escapeHtml(f.description)}</div>
              </li>
            `
              )
              .join('')}
          </ul>

          <h3 class="imp-h3">System Improvements (${activeRelease.improvements.length})</h3>
          <ul>
            ${activeRelease.improvements
              .map(
                (imp) => `
              <li>
                <strong>${escapeHtml(imp.title)}</strong><br/>
                <div class="desc">${escapeHtml(imp.description)}</div>
              </li>
            `
              )
              .join('')}
          </ul>

          <h3 class="fix-h3">Bug Fixes (${activeRelease.bugFixes.length})</h3>
          <ul>
            ${activeRelease.bugFixes
              .map(
                (fix) => `
              <li>
                <strong>${escapeHtml(fix.title)}</strong><br/>
                <div class="desc">${escapeHtml(fix.description)}</div>
              </li>
            `
              )
              .join('')}
          </ul>
        </body>
      </html>
    `);
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
              <span className="text-slate-900 dark:text-white font-semibold">{appDisplayName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'রিলিজ নোটস ও চেঞ্জলগ' : 'Release Notes & Changelog'}</span>
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
                {t('nav.item.releaseNotes')}
              </span>
            </nav>
          </div>

          {/* Editorial Header & Search Controls */}
          <header className="pt-10 sm:pt-12 pb-10 border-b border-slate-200/85 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                {isBn ? 'ভার্সন ইতিহাস ও আপডেট রেকর্ড' : 'Version Archive & Product Updates'}
              </p>
              <h1
                className="mt-3 font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                  fontSize: 'clamp(2rem, 3.8vw, 3.25rem)',
                  textWrap: 'balance',
                }}
              >
                {isBn ? 'রিলিজ নোটস ও ভার্সন ইতিহাস' : 'Release Notes & Changelog'}
              </h1>
              <p className="mt-4 text-[15.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn
                  ? 'প্রতিটি সংস্করণে যুক্ত হওয়া নতুন ফিচার, কর্মদক্ষতা উন্নয়ন এবং বাগ সমাধানের পূর্ণ বিবরণ দেখুন।'
                  : 'Complete archive of product updates, workflow refinements, and verified bug fixes across versions.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-64 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder={isBn ? 'ফিচার বা পরিবর্তন খুঁজুন...' : 'Search changelog...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-[#0d1320] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-hidden"
                />
              </div>

              {isFounder && (
                <button
                  type="button"
                  onClick={() => setIsReleaseModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 dark:bg-blue-600 text-white hover:opacity-95 text-xs font-semibold transition-opacity shrink-0 cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন রিলিজ' : 'New Release'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1320] hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
              </button>
            </div>
          </header>

          {/* Two-Column Release Explorer */}
          <div className="pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Version Selector */}
            <aside className="lg:col-span-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] overflow-hidden">
              <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                  <span>{isBn ? 'ভার্সন তালিকা' : 'Release Versions'}</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                  {RELEASE_NOTES.length} {isBn ? 'টি সংস্করণ' : 'versions'}
                </span>
              </div>

              <div className="p-2.5 space-y-1.5 max-h-[540px] overflow-y-auto no-scrollbar">
                {RELEASE_NOTES.map((rel) => {
                  const isSelected = rel.version === selectedVersion;
                  return (
                    <button
                      key={rel.version}
                      type="button"
                      onClick={() => setSelectedVersion(rel.version)}
                      className={cn(
                        'w-full text-left p-3 rounded-lg transition-colors flex flex-col gap-1 border cursor-pointer',
                        isSelected
                          ? 'bg-white dark:bg-slate-900 border-blue-600/40 dark:border-blue-500/40 text-slate-950 dark:text-white shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-white/70 dark:hover:bg-slate-900/50 text-slate-600 dark:text-slate-400'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-mono">
                          <span
                            className={cn(
                              'font-bold tabular-nums',
                              isSelected
                                ? 'text-blue-700 dark:text-blue-400'
                                : 'text-slate-900 dark:text-slate-200'
                            )}
                          >
                            {rel.version}
                          </span>
                          {rel.isLatest && (
                            <>
                              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                                ·
                              </span>
                              <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400">
                                {isBn ? 'বর্তমান' : 'Latest'}
                              </span>
                            </>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform',
                            isSelected ? 'text-blue-700 dark:text-blue-400 translate-x-0.5' : 'opacity-40'
                          )}
                        />
                      </div>

                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {isBn ? rel.bnTitle : rel.title}
                      </p>

                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-mono">
                        <Calendar className="w-3 h-3 opacity-70" />
                        <span>{isBn ? rel.bnReleaseDate : rel.releaseDate}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Right Side: Active Release Ledger */}
            <section className="lg:col-span-8 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] overflow-hidden">
              {/* Selected Release Header */}
              <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-950 dark:text-white tabular-nums">
                    {activeRelease.version}
                  </span>
                  {activeRelease.isLatest && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isBn ? 'সর্বশেষ রিলিজ' : 'Latest Release'}</span>
                      </span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{isBn ? activeRelease.bnReleaseDate : activeRelease.releaseDate}</span>
                  </span>
                </div>

                <h2
                  className="mt-2.5 text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif" }}
                >
                  {isBn ? activeRelease.bnTitle : activeRelease.title}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn ? activeRelease.bnSummary : activeRelease.summary}
                </p>

                {/* Category Filter Segmented Controls */}
                <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-200/75 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveCategory('all')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer',
                      activeCategory === 'all'
                        ? 'bg-slate-950 dark:bg-slate-100 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    )}
                  >
                    <span>{isBn ? 'সব' : 'All'}</span>
                    <span className="font-mono text-[11px] opacity-80 tabular-nums">
                      (
                      {activeRelease.newFeatures.length +
                        activeRelease.improvements.length +
                        activeRelease.bugFixes.length}
                      )
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('new')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer',
                      activeCategory === 'new'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-emerald-700 dark:hover:text-emerald-400'
                    )}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isBn ? 'নতুন ফিচার' : 'New Features'}</span>
                    <span className="font-mono text-[11px] opacity-80 tabular-nums">
                      ({activeRelease.newFeatures.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('improvements')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer',
                      activeCategory === 'improvements'
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-amber-700 dark:hover:text-amber-400'
                    )}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isBn ? 'পরিমার্জন' : 'Improvements'}</span>
                    <span className="font-mono text-[11px] opacity-80 tabular-nums">
                      ({activeRelease.improvements.length})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveCategory('fixes')}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer',
                      activeCategory === 'fixes'
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400'
                    )}
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>{isBn ? 'বাগ সমাধান' : 'Bug Fixes'}</span>
                    <span className="font-mono text-[11px] opacity-80 tabular-nums">
                      ({activeRelease.bugFixes.length})
                    </span>
                  </button>
                </div>
              </div>

              {/* Changelog Items */}
              <div className="p-6 space-y-8">
                {filteredRelease.total === 0 ? (
                  <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                    <p className="text-sm font-semibold">
                      {isBn ? 'কোনো পরিবর্তন খুঁজে পাওয়া যায়নি।' : 'No changelog items match your filter.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {filteredRelease.newFeatures.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <PlusCircle className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <h3 className="text-xs font-mono uppercase font-bold tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                            {isBn ? 'নতুন সংযোজিত ফিচারসমূহ (New Features)' : 'New Features'}
                          </h3>
                        </div>

                        <div className="divide-y divide-slate-200/80 dark:divide-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-800">
                          {filteredRelease.newFeatures.map((item) => (
                            <div key={item.id} className="p-4 space-y-1.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                                  {isBn ? item.bnTitle : item.title}
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                  {item.badge && <span>{item.badge}</span>}
                                  {item.badge && item.module && <span aria-hidden="true">·</span>}
                                  {item.module && <span>{item.module}</span>}
                                </div>
                              </div>
                              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                {isBn ? item.bnDescription : item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredRelease.improvements.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <h3 className="text-xs font-mono uppercase font-bold tracking-[0.12em] text-amber-700 dark:text-amber-400">
                            {isBn ? 'উন্নতি ও সিস্টেম পরিমার্জন (Improvements)' : 'Improvements'}
                          </h3>
                        </div>

                        <div className="divide-y divide-slate-200/80 dark:divide-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-800">
                          {filteredRelease.improvements.map((item) => (
                            <div key={item.id} className="p-4 space-y-1.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                                  {isBn ? item.bnTitle : item.title}
                                </h4>
                                {item.module && (
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    {item.module}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                {isBn ? item.bnDescription : item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {filteredRelease.bugFixes.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Wrench className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                          <h3 className="text-xs font-mono uppercase font-bold tracking-[0.12em] text-blue-700 dark:text-blue-400">
                            {isBn ? 'বাগ সমাধান ও স্থিতিশীলতা (Bug Fixes)' : 'Bug Fixes'}
                          </h3>
                        </div>

                        <div className="divide-y divide-slate-200/80 dark:divide-slate-800 rounded-lg border border-slate-200/80 dark:border-slate-800">
                          {filteredRelease.bugFixes.map((item) => (
                            <div key={item.id} className="p-4 space-y-1.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />
                                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                                    {isBn ? item.bnTitle : item.title}
                                  </h4>
                                </div>
                                {item.module && (
                                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                    {item.module}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed pl-5.5">
                                {isBn ? item.bnDescription : item.description}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />

      {isFounder && (
        <ReleaseManagerModal
          isOpen={isReleaseModalOpen}
          onClose={() => setIsReleaseModalOpen(false)}
          onPublished={(newVer) => {
            setSelectedVersion(newVer);
          }}
        />
      )}
    </div>
  );
}
