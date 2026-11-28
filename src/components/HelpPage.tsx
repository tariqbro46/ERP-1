import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BarChart2,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Compass,
  CornerDownRight,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Keyboard,
  Layers,
  Lightbulb,
  Link2,
  Maximize2,
  Monitor,
  Package,
  Printer,
  Rocket,
  Search,
  Settings,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HELP_DOCS,
  DOC_SCREENSHOTS,
  DOCS_SCREENSHOTS_UPDATED_EVENT,
  normalizeScreenshotUrl,
  readStoredScreenshots,
  DocCategory,
  DocSubSection,
} from '../constants/helpContent';
import { LATEST_VERSION } from '../data/releaseNotes';
import { cn } from '../lib/utils';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Navbar } from './landing/Navbar';
import { Footer } from './landing/Footer';
import ScreenshotManagerModal from './ScreenshotManagerModal';
import { ImageNotFoundFrame } from './ImageNotFoundFrame';

const isFounderOnlySection = (sec: DocSubSection) =>
  sec.id === 'set-screenshots' ||
  sec.id === 'faq-custom-screenshots' ||
  sec.planBadge === 'Founder Only';

function KeyCap({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center font-mono tabular-nums text-[11px] font-semibold px-1.5 py-0.5 rounded border border-slate-300/90 dark:border-slate-700 bg-slate-100/90 dark:bg-slate-900 text-slate-800 dark:text-slate-200 shadow-[0_1px_0_rgba(15,23,42,0.08)]',
        className
      )}
    >
      {children}
    </kbd>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripMarkdownTokens(text: string): string {
  return text.replace(/^###\s+/gm, '').replace(/\*\*(.*?)\*\*/g, '$1');
}

function highlightMatch(text: string, query: string): React.ReactNode {
  const trimmed = query.trim();
  if (!trimmed) return text;
  const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
  const parts = text.split(regex);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <mark
        key={i}
        className="bg-amber-200/80 dark:bg-amber-500/30 text-slate-950 dark:text-amber-100 rounded-xs px-0.5 font-semibold"
      >
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function renderInlineBold(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length <= 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-slate-950 dark:text-white">
        {part}
      </strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

function renderFormattedDocContent(rawContent: string): React.ReactNode {
  const blocks = rawContent
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {blocks.map((block, bIdx) => {
        const lines = block
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
        if (lines.length === 0) return null;

        const headingLine = lines[0].startsWith('### ') ? lines[0].slice(4).trim() : null;
        const bodyLines = headingLine ? lines.slice(1) : lines;

        const hasListOrNumbered = bodyLines.some(
          (line) => /^-\s+/.test(line) || /^[0-9০-৯]+[.)]\s+/.test(line)
        );

        return (
          <div key={bIdx} className="space-y-2.5">
            {headingLine && (
              <h4 className="font-bold text-slate-950 dark:text-white text-xs sm:text-[14px] tracking-tight pt-2 first:pt-0 pb-1.5 border-b border-slate-200/80 dark:border-slate-800">
                {headingLine}
              </h4>
            )}

            {hasListOrNumbered ? (
              <div className="space-y-2">
                {bodyLines.map((line, lIdx) => {
                  const bulletMatch = line.match(/^-\s+(.*)$/);
                  const numberedMatch = line.match(/^([0-9০-৯]+)[.)]\s+(.*)$/);

                  if (bulletMatch) {
                    return (
                      <div
                        key={lIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed pl-1"
                      >
                        <span
                          aria-hidden="true"
                          className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0 mt-2"
                        />
                        <span>{renderInlineBold(bulletMatch[1])}</span>
                      </div>
                    );
                  }

                  if (numberedMatch) {
                    const numLabel = numberedMatch[1];
                    const itemBody = numberedMatch[2];
                    const colonIdx = itemBody.indexOf(':');
                    const hasPrefixLabel = colonIdx > 0 && colonIdx < 52;

                    return (
                      <div
                        key={lIdx}
                        className="flex items-start gap-2.5 text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 leading-relaxed"
                      >
                        <span className="min-w-[20px] h-5 px-1 rounded bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono text-[10.5px] font-semibold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                          {numLabel}
                        </span>
                        <span>
                          {hasPrefixLabel ? (
                            <>
                              <strong className="font-semibold text-slate-950 dark:text-white">
                                {itemBody.slice(0, colonIdx + 1)}
                              </strong>
                              {renderInlineBold(itemBody.slice(colonIdx + 1))}
                            </>
                          ) : (
                            renderInlineBold(itemBody)
                          )}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <p
                      key={lIdx}
                      className="text-xs sm:text-[14px] text-slate-700 dark:text-slate-300 leading-[1.75]"
                    >
                      {renderInlineBold(line)}
                    </p>
                  );
                })}
              </div>
            ) : (
              bodyLines.map((line, lIdx) => (
                <p
                  key={lIdx}
                  className="text-slate-700 dark:text-slate-300 text-xs sm:text-[14px] leading-[1.75]"
                >
                  {renderInlineBold(line)}
                </p>
              ))
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function HelpPage() {
  const { language, t } = useLanguage();
  const { appIdentity, appVersion } = useSettings();
  const { isFounder } = useAuth();

  const activeLang: 'en' | 'bn' = language === 'bn' ? 'bn' : 'en';
  const isBn = activeLang === 'bn';

  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.32').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.32'
    : `v${appVersion || LATEST_VERSION || '1.9.9.32'}`;

  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('getting-started');
  const [activeSectionId, setActiveSectionId] = useState<string>('gs-interface');
  const [mobileChaptersOpen, setMobileChaptersOpen] = useState(false);
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [screenshotRefreshTick, setScreenshotRefreshTick] = useState(0);
  const [storedScreenshots, setStoredScreenshots] = useState<Record<string, string>>(() =>
    readStoredScreenshots()
  );
  const [hasImageError, setHasImageError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({});

  useEffect(() => {
    const sync = () => setStoredScreenshots(readStoredScreenshots());
    sync();
    window.addEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [screenshotRefreshTick, isScreenshotModalOpen]);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    rocket: Rocket,
    'book-open': BookOpen,
    'file-text': FileText,
    package: Package,
    users: Users,
    'bar-chart-2': BarChart2,
    keyboard: Keyboard,
    'help-circle': HelpCircle,
    settings: Settings,
    layers: Layers,
  };

  // Gate Founder-only documentation sections cleanly from non-founder visitors
  const visibleDocs = useMemo(() => {
    if (isFounder) return HELP_DOCS;
    return HELP_DOCS.map((cat) => ({
      ...cat,
      sections: cat.sections.filter((sec) => !isFounderOnlySection(sec)),
    })).filter((cat) => cat.sections.length > 0);
  }, [isFounder]);

  const activeCategory = useMemo(() => {
    return visibleDocs.find((cat) => cat.id === activeCategoryId) || visibleDocs[0];
  }, [visibleDocs, activeCategoryId]);

  useEffect(() => {
    const targetSectionParam = searchParams.get('section');
    if (!targetSectionParam) return;
    for (const cat of visibleDocs) {
      if (cat.id === targetSectionParam && cat.sections.length > 0) {
        setActiveCategoryId(cat.id);
        setActiveSectionId(cat.sections[0].id);
        return;
      }
      const found = cat.sections.find((s) => s.id === targetSectionParam);
      if (found) {
        setActiveCategoryId(cat.id);
        setActiveSectionId(found.id);
        return;
      }
    }
  }, [searchParams, visibleDocs]);

  useEffect(() => {
    if (activeCategory && activeCategory.sections.length > 0) {
      const sectionExists = activeCategory.sections.some((s) => s.id === activeSectionId);
      if (!sectionExists) {
        setActiveSectionId(activeCategory.sections[0].id);
      }
    }
  }, [activeCategoryId, activeCategory, activeSectionId]);

  const activeSection = useMemo(() => {
    if (!activeCategory) return null;
    return (
      activeCategory.sections.find((s) => s.id === activeSectionId) ||
      activeCategory.sections[0] ||
      null
    );
  }, [activeCategory, activeSectionId]);

  // Filter visible categories and subsections based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const matches: { category: DocCategory; section: DocSubSection }[] = [];

    visibleDocs.forEach((cat) => {
      cat.sections.forEach((sec) => {
        const titleMatch = (isBn ? sec.bnTitle : sec.title).toLowerCase().includes(query);
        const contentMatch = (isBn ? sec.bnContent : sec.content).toLowerCase().includes(query);
        const whereMatch = ((isBn ? sec.bnWhereToFind : sec.whereToFind) || '')
          .toLowerCase()
          .includes(query);
        const pointsMatch =
          (isBn ? sec.bnPoints : sec.points)?.some((pt) => pt.toLowerCase().includes(query)) ||
          false;
        const fieldsMatch =
          sec.fields?.some(
            (f) =>
              (isBn ? f.bnName : f.name).toLowerCase().includes(query) ||
              (isBn ? f.bnDescription : f.description).toLowerCase().includes(query)
          ) || false;

        if (titleMatch || contentMatch || whereMatch || pointsMatch || fieldsMatch) {
          matches.push({ category: cat, section: sec });
        }
      });
    });

    return matches;
  }, [searchQuery, isBn, visibleDocs]);

  const handleFeedback = (sectionId: string, value: 'yes' | 'no') => {
    setFeedbackGiven((prev) => ({ ...prev, [sectionId]: value }));
  };

  // Keyboard shortcut Ctrl+K / Cmd+K or / to focus search, Escape to clear
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.tagName === 'SELECT';

      if (((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') || (e.key === '/' && !isInputFocused)) {
        e.preventDefault();
        const searchInput = document.getElementById('docs-search-input');
        searchInput?.focus();
      } else if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  const allSectionsWithCat = useMemo(() => {
    const list: { category: DocCategory; section: DocSubSection }[] = [];
    visibleDocs.forEach((cat) => {
      cat.sections.forEach((sec) => {
        list.push({ category: cat, section: sec });
      });
    });
    return list;
  }, [visibleDocs]);

  const currentFlatIndex = useMemo(() => {
    return allSectionsWithCat.findIndex((item) => item.section.id === activeSectionId);
  }, [allSectionsWithCat, activeSectionId]);

  const prevSection = currentFlatIndex > 0 ? allSectionsWithCat[currentFlatIndex - 1] : null;
  const nextSection =
    currentFlatIndex < allSectionsWithCat.length - 1 ? allSectionsWithCat[currentFlatIndex + 1] : null;

  const scrollToAnchor = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const selectTopic = (categoryId: string, sectionId?: string) => {
    const targetCat = visibleDocs.find((c) => c.id === categoryId) || visibleDocs[0];
    const resolvedSectionId = sectionId || targetCat?.sections[0]?.id || '';
    if (targetCat) {
      setActiveCategoryId(targetCat.id);
    }
    if (resolvedSectionId) {
      setActiveSectionId(resolvedSectionId);
    }
    setSearchQuery('');
    setMobileChaptersOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resolvedScreenshot = useMemo(() => {
    if (!activeSection) return null;

    const customSrc = normalizeScreenshotUrl(
      storedScreenshots[activeSection.id] || storedScreenshots[activeCategoryId]
    );
    const registryEntry =
      DOC_SCREENSHOTS[activeSection.id] || DOC_SCREENSHOTS[activeCategoryId] || null;

    const src =
      customSrc ||
      normalizeScreenshotUrl(activeSection.screenshotSrc) ||
      normalizeScreenshotUrl(registryEntry?.src);
    if (!src) return null;

    const sectionTitle = isBn ? activeSection.bnTitle : activeSection.title;
    const defaultCaption = t('docs.screenshot.defaultCaption', {
      title: sectionTitle,
      appName,
    });

    const alt = isBn
      ? activeSection.screenshotBnAlt || registryEntry?.bnAlt || sectionTitle
      : activeSection.screenshotAlt || registryEntry?.alt || sectionTitle;

    const caption = isBn
      ? activeSection.screenshotBnCaption || registryEntry?.bnCaption || defaultCaption
      : activeSection.screenshotCaption || registryEntry?.caption || defaultCaption;

    const route = activeSection.path || registryEntry?.route || `/${activeCategoryId}`;

    return { src, alt, caption, route };
  }, [activeSection, activeCategoryId, storedScreenshots, isBn, appName, t]);

  useEffect(() => {
    setHasImageError(false);
    setIsLightboxOpen(false);
  }, [resolvedScreenshot?.src, activeSection?.id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen]);

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
          className="pointer-events-none absolute inset-0 opacity-100 dark:opacity-20 print:hidden"
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200/85 dark:border-slate-800 print:hidden">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">{appName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'ব্যবহার নির্দেশিকা ও রেফারেন্স' : 'Documentation & Knowledge Base'}</span>
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
                {isBn ? 'ডকুমেন্টেশন' : 'Docs'}
              </span>
            </nav>
          </div>

          {/* Editorial Docs Header + Quick Search & Utility Controls */}
          <header className="pt-8 sm:pt-10 pb-8 border-b border-slate-200/85 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-6 print:hidden">
            <div className="max-w-2xl">
              <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                {isBn ? 'অফিশিয়াল নলেজ বেজ ও অপারেশনাল ম্যানুয়াল' : 'Official Knowledge Base & Field Reference'}
              </p>
              <h1
                className="mt-2.5 font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                  fontSize: 'clamp(1.85rem, 3.4vw, 2.85rem)',
                  textWrap: 'balance',
                }}
              >
                {isBn ? `${appName} ডকুমেন্টেশন` : `${appName} Documentation`}
              </h1>
              <p className="mt-3 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {isBn
                  ? 'ভাউচার এন্ট্রি, লেজার ও ইনভেন্টরি, ১০টি মূল রিপোর্ট (.xlsx, A4 প্রিন্ট, PDF ও ইমেইল), পেরোল, কিবোর্ড শর্টকাট এবং সিস্টেম সেটিংসের পূর্ণাঙ্গ নির্দেশিকা।'
                  : 'Complete operational reference for double-entry vouchers, FIFO stock, 10 core reports (.xlsx, A4 Print, PDF & Email), payroll, shortcuts, and workspace controls.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="relative flex-1 sm:w-72 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  id="docs-search-input"
                  type="text"
                  placeholder={
                    isBn
                      ? 'ফিচার, অপশন বা শর্টকাট খুঁজুন... (Ctrl+K)'
                      : 'Search features, fields, hotkeys... (Ctrl+K)'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-12 py-2 bg-white dark:bg-[#0d1320] border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-hidden transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ESC
                  </button>
                )}
              </div>

              {isFounder && (
                <>
                  <button
                    type="button"
                    onClick={() => setIsScreenshotModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0d1320] hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                    <span>{isBn ? 'স্ক্রিনশট' : 'Screenshots'}</span>
                  </button>
                  <Link
                    to="/founder-desk"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-blue-200 dark:border-blue-900/70 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/80 dark:hover:bg-blue-950/70 text-xs font-semibold text-blue-800 dark:text-blue-300 transition-colors shrink-0 whitespace-nowrap"
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>{t('founderDesk.openFromDocsBtn')}</span>
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1320] hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shrink-0 cursor-pointer whitespace-nowrap"
                title={isBn ? 'ডকুমেন্টেশন প্রিন্ট করুন' : 'Print Documentation'}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
              </button>
            </div>
          </header>

          {/* Mobile / Tablet Collapsible Chapter & Topic Selector */}
          {!isSearching && (
            <div className="lg:hidden pt-6 print:hidden">
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setMobileChaptersOpen((prev) => !prev)}
                  aria-expanded={mobileChaptersOpen}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left cursor-pointer"
                >
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 block">
                      {isBn ? 'সক্রিয় অধ্যায় ও বিষয়' : 'Current Chapter & Topic'}
                    </span>
                    <span className="text-xs font-bold text-slate-950 dark:text-white truncate block mt-0.5">
                      {isBn ? activeCategory.bnTitle : activeCategory.title}
                      {activeSection ? ` · ${isBn ? activeSection.bnTitle : activeSection.title}` : ''}
                    </span>
                  </div>
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 text-slate-500 shrink-0 transition-transform duration-150',
                      mobileChaptersOpen && 'rotate-180'
                    )}
                  />
                </button>

                {mobileChaptersOpen && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800 p-3 space-y-2 max-h-80 overflow-y-auto">
                    {visibleDocs.map((cat, cIdx) => {
                      const Icon = iconMap[cat.iconName] || BookOpen;
                      const isSelectedCat = cat.id === activeCategoryId;
                      return (
                        <div key={cat.id} className="space-y-1">
                          <button
                            type="button"
                            onClick={() => selectTopic(cat.id)}
                            className={cn(
                              'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition-colors cursor-pointer',
                              isSelectedCat
                                ? 'bg-slate-950 dark:bg-blue-600 text-white'
                                : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                            )}
                          >
                            <span className="flex items-center gap-2 min-w-0">
                              <span className="text-[10px] font-mono opacity-65 tabular-nums shrink-0">
                                {String(cIdx + 1).padStart(2, '0')}
                              </span>
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{isBn ? cat.bnTitle : cat.title}</span>
                            </span>
                            <span className="text-[10px] font-mono opacity-75 shrink-0 ml-2 tabular-nums">
                              {String(cat.sections.length).padStart(2, '0')}
                            </span>
                          </button>

                          {isSelectedCat && (
                            <div className="pl-4 space-y-1">
                              {cat.sections.map((sec) => {
                                const isSecActive = sec.id === activeSectionId;
                                return (
                                  <button
                                    key={sec.id}
                                    type="button"
                                    onClick={() => selectTopic(cat.id, sec.id)}
                                    className={cn(
                                      'w-full text-left px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors cursor-pointer',
                                      isSecActive
                                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-semibold'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                                    )}
                                  >
                                    {isBn ? sec.bnTitle : sec.title}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Workbench Grid: Sticky Left TOC Sidebar + Editorial Article + On-This-Page Rail */}
          <div className="pt-8 lg:pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT SIDEBAR: Sticky Chapters & Sections */}
            {!isSearching && (
              <aside className="hidden lg:block lg:col-span-3 lg:sticky lg:top-24 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] overflow-hidden print:hidden">
                <div className="px-4 py-3.5 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 block">
                      {isBn ? 'অধ্যায় ও সূচিপত্র' : 'Chapters & Index'}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {isBn ? 'মডিউল অনুযায়ী নির্দেশিকা' : 'Browse guides by module'}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {visibleDocs.length}
                  </span>
                </div>

                <nav
                  aria-label={isBn ? 'ডকুমেন্টেশন অধ্যায়সমূহ' : 'Documentation chapters'}
                  className="p-2.5 space-y-1 max-h-[calc(100vh-14rem)] overflow-y-auto no-scrollbar"
                >
                  {visibleDocs.map((cat, cIdx) => {
                    const Icon = iconMap[cat.iconName] || BookOpen;
                    const isSelectedCat = cat.id === activeCategoryId;

                    return (
                      <div key={cat.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => selectTopic(cat.id)}
                          className={cn(
                            'w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer group',
                            isSelectedCat
                              ? 'bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-700 text-slate-950 dark:text-white font-semibold shadow-2xs'
                              : 'border border-transparent text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-900/50 hover:text-slate-950 dark:hover:text-white font-medium'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
                              {String(cIdx + 1).padStart(2, '0')}
                            </span>
                            <Icon
                              className={cn(
                                'w-3.5 h-3.5 shrink-0',
                                isSelectedCat
                                  ? 'text-blue-700 dark:text-blue-400'
                                  : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                              )}
                            />
                            <span className="text-xs truncate">
                              {isBn ? cat.bnTitle : cat.title}
                            </span>
                          </div>
                          {cat.badge && (
                            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 shrink-0 ml-2">
                              {cat.badge}
                            </span>
                          )}
                        </button>

                        {isSelectedCat && (
                          <div className="pl-3 ml-3.5 py-0.5 space-y-0.5 border-l border-slate-200 dark:border-slate-800">
                            {cat.sections.map((sec) => {
                              const isSectionActive = sec.id === activeSectionId;
                              return (
                                <button
                                  key={sec.id}
                                  type="button"
                                  onClick={() => selectTopic(cat.id, sec.id)}
                                  className={cn(
                                    'w-full text-left px-2.5 py-1.5 rounded-md text-[11.5px] transition-colors flex items-center justify-between gap-2 cursor-pointer',
                                    isSectionActive
                                      ? 'bg-slate-950 dark:bg-blue-600 text-white font-semibold'
                                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-900/60 font-medium'
                                  )}
                                >
                                  <span className="truncate">
                                    {isBn ? sec.bnTitle : sec.title}
                                  </span>
                                  {sec.hotkey && (
                                    <span
                                      className={cn(
                                        'text-[10px] font-mono shrink-0 tabular-nums',
                                        isSectionActive
                                          ? 'text-slate-200'
                                          : 'text-slate-400 dark:text-slate-500'
                                      )}
                                    >
                                      {sec.hotkey}
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </aside>
            )}

            {/* CENTER / MAIN DOCUMENTATION CONTENT */}
            <div
              className={cn(
                isSearching ? 'lg:col-span-12' : 'lg:col-span-9 xl:col-span-7',
                'min-w-0'
              )}
            >
              <AnimatePresence mode="wait">
                {isSearching ? (
                  <motion.div
                    key="search-view"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                      <div>
                        <h2 className="text-sm font-bold text-slate-950 dark:text-white tabular-nums">
                          {isBn
                            ? `"${searchQuery}" এর জন্য ${searchResults.length} টি ফলাফল পাওয়া গেছে`
                            : `${searchResults.length} Result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`}
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {isBn
                            ? 'সম্পূর্ণ নির্দেশিকা দেখতে যেকোনো বিষয়ে ক্লিক করুন'
                            : 'Select any matching topic to open its full reference'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1320] cursor-pointer"
                      >
                        {isBn ? 'সার্চ মুছুন' : 'Clear Search'}
                      </button>
                    </div>

                    {searchResults.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {searchResults.map(({ category, section }, idx) => {
                          const catTitle = isBn ? category.bnTitle : category.title;
                          const secTitle = isBn ? section.bnTitle : section.title;
                          const cleanExcerpt = stripMarkdownTokens(
                            isBn ? section.bnContent : section.content
                          );
                          const whereLabel = isBn ? section.bnWhereToFind : section.whereToFind;

                          return (
                            <button
                              key={`${category.id}-${section.id}-${idx}`}
                              type="button"
                              onClick={() => selectTopic(category.id, section.id)}
                              className="text-left bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 p-5 hover:border-blue-600/40 dark:hover:border-blue-500/40 transition-colors cursor-pointer space-y-2.5 group"
                            >
                              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                                <span className="text-blue-700 dark:text-blue-400 font-semibold truncate">
                                  {highlightMatch(catTitle, searchQuery)}
                                </span>
                                {section.hotkey && (
                                  <KeyCap className="shrink-0">{section.hotkey}</KeyCap>
                                )}
                              </div>

                              <h3 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                                {highlightMatch(secTitle, searchQuery)}
                              </h3>

                              <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-[13px] leading-relaxed line-clamp-3">
                                {highlightMatch(cleanExcerpt, searchQuery)}
                              </p>

                              {whereLabel && (
                                <div className="flex items-center gap-1.5 text-[11.5px] font-mono text-slate-500 dark:text-slate-400 pt-1">
                                  <Compass className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">
                                    {highlightMatch(whereLabel, searchQuery)}
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-16 bg-slate-50/70 dark:bg-[#0d1320] rounded-xl border border-slate-200 dark:border-slate-800 p-6">
                        <Search className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                        <p className="text-base text-slate-900 dark:text-white font-bold">
                          {isBn ? 'কোনো নির্দেশিকা পাওয়া যায়নি' : 'No matching documentation found'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1.5 leading-relaxed">
                          {isBn
                            ? '"বিক্রয়", "ভাউচার", "লেজার", "হাজিরা", বা "ট্রায়াল ব্যালেন্স" লিখে সার্চ করে দেখুন।'
                            : 'Try searching for terms such as "Sales", "Voucher", "Ledger", "BOM", "Attendance", or "Trial Balance".'}
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : activeSection ? (
                  <motion.div
                    key={`${activeCategoryId}-${activeSection.id}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-8"
                  >
                    {/* Section Metadata & Heading */}
                    <div className="space-y-4 border-b border-slate-200/85 dark:border-slate-800 pb-6">
                      <div className="flex flex-wrap items-center gap-2 text-[11.5px] font-mono text-slate-500 dark:text-slate-400">
                        <button
                          type="button"
                          onClick={() => selectTopic(activeCategory.id)}
                          className="text-blue-700 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                        >
                          {isBn ? activeCategory.bnTitle : activeCategory.title}
                        </button>
                        {activeSection.hotkey && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1.5">
                              <Keyboard className="w-3.5 h-3.5 text-slate-400" />
                              <KeyCap>{activeSection.hotkey}</KeyCap>
                            </span>
                          </>
                        )}
                        {activeSection.planBadge && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-amber-700 dark:text-amber-400 font-semibold">
                              {activeSection.planBadge}
                            </span>
                          </>
                        )}
                        {activeSection.path && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-500 dark:text-slate-400">
                              {activeSection.path}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h2
                          className="text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tracking-[-0.025em]"
                          style={{
                            fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                            textWrap: 'balance',
                          }}
                        >
                          {isBn ? activeSection.bnTitle : activeSection.title}
                        </h2>
                        <p className="text-xs sm:text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                          {isBn ? activeCategory.bnDescription : activeCategory.description}
                        </p>
                      </div>

                      {activeSection.whereToFind && (
                        <div className="flex items-start gap-2.5 bg-slate-50/80 dark:bg-[#0d1320] border border-slate-200/90 dark:border-slate-800 p-3.5 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                          <Compass className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-mono font-semibold uppercase tracking-[0.1em] text-[10.5px] text-slate-500 dark:text-slate-400 block mb-0.5">
                              {isBn ? 'অ্যাপ্লিকেশনে কোথায় পাবেন' : 'Where to Find in the App'}
                            </span>
                            <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
                              {isBn ? activeSection.bnWhereToFind : activeSection.whereToFind}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Real App Screen Reference or Honest Pending Capture State */}
                    <div id="doc-screen-reference" className="scroll-mt-24 space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Monitor className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          <span>{t('docs.screenshot.heading')}</span>
                        </h3>
                        {isFounder && (
                          <button
                            type="button"
                            onClick={() => setIsScreenshotModalOpen(true)}
                            className="text-xs font-semibold text-blue-700 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>{t('docs.screenshot.manage')}</span>
                          </button>
                        )}
                      </div>

                      {resolvedScreenshot && !hasImageError ? (
                        <figure className="bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                          <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                              <span className="truncate">{resolvedScreenshot.route}</span>
                              <span aria-hidden="true">·</span>
                              <span className="text-emerald-700 dark:text-emerald-400 font-semibold whitespace-nowrap shrink-0">
                                {t('docs.screenshot.verifiedBadge')}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setIsLightboxOpen(true)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                            >
                              <Maximize2 className="w-3 h-3" />
                              <span>{t('docs.screenshot.zoomIn')}</span>
                            </button>
                          </div>

                          <div className="p-3 sm:p-5 bg-slate-100/70 dark:bg-slate-950/80 flex items-center justify-center">
                            <img
                              src={resolvedScreenshot.src}
                              alt={resolvedScreenshot.alt}
                              referrerPolicy="no-referrer"
                              onClick={() => setIsLightboxOpen(true)}
                              onError={() => setHasImageError(true)}
                              className="w-full h-auto max-h-[540px] object-contain rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 cursor-zoom-in"
                            />
                          </div>

                          <figcaption className="px-4 sm:px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex flex-wrap items-center justify-between gap-2">
                            <span>{resolvedScreenshot.caption}</span>
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                              {appName}
                            </span>
                          </figcaption>
                        </figure>
                      ) : (
                        <figure className="bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden">
                          <div className="px-4 sm:px-5 py-2.5 bg-slate-50/90 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 min-w-0 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                              <span className="truncate">
                                {activeSection.path || `/${activeCategoryId}`}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap shrink-0">
                                {t('docs.screenshot.pendingBadge')}
                              </span>
                            </div>

                            {isFounder && (
                              <button
                                type="button"
                                onClick={() => setIsScreenshotModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                              >
                                <Link2 className="w-3 h-3 text-blue-700 dark:text-blue-400" />
                                <span>{t('docs.screenshot.upload')}</span>
                              </button>
                            )}
                          </div>

                          <ImageNotFoundFrame
                            className="min-h-[240px] sm:min-h-[320px] rounded-none border-0"
                          />

                          <figcaption className="px-4 sm:px-5 py-3 border-t border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed flex flex-wrap items-center justify-between gap-2">
                            <span>
                              {hasImageError
                                ? t('docs.screenshot.loadError')
                                : t('docs.screenshot.pendingDesc')}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                              {appName}
                            </span>
                          </figcaption>
                        </figure>
                      )}
                    </div>

                    {/* Main Description & Purpose */}
                    <section
                      id="docs-purpose"
                      className="scroll-mt-24 bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-4"
                    >
                      <h3 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base tracking-tight flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-3">
                        <BookOpen className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                        <span>
                          {isBn
                            ? 'ফিচারের মূল কাজ ও কী কী করা সম্ভব'
                            : 'Feature Purpose & What You Can Accomplish'}
                        </span>
                      </h3>
                      {renderFormattedDocContent(
                        isBn ? activeSection.bnContent : activeSection.content
                      )}
                    </section>

                    {/* Step-by-Step How-To Action Checklist */}
                    {activeSection.points && activeSection.points.length > 0 && (
                      <section
                        id="docs-steps"
                        className="scroll-mt-24 bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 p-6 space-y-4"
                      >
                        <div className="border-b border-slate-200/80 dark:border-slate-800 pb-3 flex items-center justify-between gap-2">
                          <h3 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base tracking-tight flex items-center gap-2">
                            {activeCategory.id === 'shortcuts' ? (
                              <Keyboard className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                            )}
                            <span>
                              {activeCategory.id === 'shortcuts'
                                ? isBn
                                  ? 'শর্টকাট কী ও কার্যকারিতা তালিকা'
                                  : 'Keyboard Shortcut Reference'
                                : isBn
                                ? 'ধাপে ধাপে কীভাবে কাজটি করবেন'
                                : 'Step-by-Step How-To Instructions'}
                            </span>
                          </h3>
                          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                            {activeSection.points.length}{' '}
                            {activeCategory.id === 'shortcuts'
                              ? isBn
                                ? 'শর্টকাট'
                                : 'keys'
                              : isBn
                              ? 'ধাপ'
                              : 'steps'}
                          </span>
                        </div>

                        <div className="space-y-2.5">
                          {(isBn ? activeSection.bnPoints : activeSection.points)?.map(
                            (point, pIdx) => {
                              const arrowIdx = point.indexOf('->');
                              const isHotkeyRow =
                                activeCategory.id === 'shortcuts' && arrowIdx > 0;

                              if (isHotkeyRow) {
                                const comboText = point.slice(0, arrowIdx).trim();
                                const descText = point.slice(arrowIdx + 2).trim();
                                return (
                                  <div
                                    key={pIdx}
                                    className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/75 dark:border-slate-800/80"
                                  >
                                    <div className="sm:w-44 shrink-0">
                                      <KeyCap>{comboText}</KeyCap>
                                    </div>
                                    <span className="leading-relaxed">{descText}</span>
                                  </div>
                                );
                              }

                              const colonIdx = point.indexOf(':');
                              const hasBoldLead = colonIdx > 0 && colonIdx < 52;

                              return (
                                <div
                                  key={pIdx}
                                  className="flex items-start gap-3 text-xs sm:text-[13.5px] text-slate-700 dark:text-slate-300 bg-slate-50/70 dark:bg-slate-950/60 p-3.5 rounded-lg border border-slate-200/75 dark:border-slate-800/80"
                                >
                                  <span className="w-5 h-5 rounded-md bg-slate-950 dark:bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-[10.5px] shrink-0 mt-0.5 tabular-nums">
                                    {pIdx + 1}
                                  </span>
                                  <span className="leading-relaxed">
                                    {hasBoldLead ? (
                                      <>
                                        <strong className="font-semibold text-slate-950 dark:text-white">
                                          {point.slice(0, colonIdx + 1)}
                                        </strong>
                                        {point.slice(colonIdx + 1)}
                                      </>
                                    ) : (
                                      point
                                    )}
                                  </span>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </section>
                    )}

                    {/* Option & Field Definitions Reference Table */}
                    {activeSection.fields && activeSection.fields.length > 0 && (
                      <section
                        id="docs-fields"
                        className="scroll-mt-24 bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
                      >
                        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
                          <h3 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base tracking-tight flex items-center gap-2">
                            <Layers className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                            <span>
                              {isBn
                                ? 'প্রতিটি অপশন ও ফিল্ডের বিস্তারিত ব্যাখ্যা'
                                : 'Options & Fields Reference Guide'}
                            </span>
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {isBn
                              ? 'ফর্মের প্রতিটি ইনপুট অপশনের কাজ ও নিয়মের বিবরণ'
                              : 'Detailed breakdown of all input parameters and validation rules'}
                          </p>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead className="sticky top-0 bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 font-mono text-[10.5px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                              <tr>
                                <th className="px-4 py-3 align-middle">
                                  {isBn ? 'ফিল্ড বা অপশনের নাম' : 'Field / Option Name'}
                                </th>
                                <th className="px-4 py-3 align-middle">
                                  {isBn ? 'ধরন / নিয়ম' : 'Type / Rule'}
                                </th>
                                <th className="px-4 py-3 align-middle">
                                  {isBn ? 'সুনির্দিষ্ট কাজ ও ব্যাখ্যা' : 'Exact Behavior & Purpose'}
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                              {activeSection.fields.map((f, fIdx) => (
                                <tr
                                  key={fIdx}
                                  className="hover:bg-slate-50/70 dark:hover:bg-slate-900/40 transition-colors"
                                >
                                  <td className="px-4 py-3 align-middle font-semibold text-slate-950 dark:text-slate-100 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                      <span>{isBn ? f.bnName : f.name}</span>
                                      {f.required && (
                                        <span className="text-[10px] font-mono font-semibold text-rose-700 dark:text-rose-400">
                                          · {isBn ? 'আবশ্যিক' : 'Required'}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 align-middle font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                    {f.type}
                                  </td>
                                  <td className="px-4 py-3 align-middle text-slate-600 dark:text-slate-300 leading-relaxed">
                                    {isBn ? f.bnDescription : f.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    )}

                    {/* Real-World Business Example Walkthrough */}
                    {activeSection.example && (
                      <section
                        id="docs-example"
                        className="scroll-mt-24 bg-slate-50/80 dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 border-l-4 border-l-blue-700 dark:border-l-blue-500 p-6 space-y-4"
                      >
                        <div className="flex items-start gap-2.5 border-b border-slate-200/80 dark:border-slate-800 pb-3.5">
                          <Sparkles className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-1" />
                          <div>
                            <span className="text-[10.5px] font-mono font-semibold uppercase tracking-[0.12em] text-blue-700 dark:text-blue-400 block">
                              {isBn ? 'বাস্তব ব্যবসায়িক উদাহরণ' : 'Practical Case Study'}
                            </span>
                            <h4 className="font-bold text-sm sm:text-base text-slate-950 dark:text-white mt-0.5">
                              {isBn ? activeSection.example.bnScenario : activeSection.example.scenario}
                            </h4>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <span className="text-[10.5px] font-mono uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 block">
                            {isBn ? 'সমাধান প্রক্রিয়া:' : 'Resolution Walkthrough:'}
                          </span>
                          {(isBn ? activeSection.example.bnSteps : activeSection.example.steps).map(
                            (step, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-2.5 text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800"
                              >
                                <CornerDownRight className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{step}</span>
                              </div>
                            )
                          )}
                        </div>
                      </section>
                    )}

                    {/* Pro-Tips & Warnings Callouts */}
                    {(activeSection.tip || activeSection.warning) && (
                      <section id="docs-tips" className="scroll-mt-24 space-y-4">
                        {activeSection.tip && (
                          <div className="flex gap-3 bg-blue-50/70 dark:bg-blue-950/25 border border-blue-200/90 dark:border-blue-800/70 text-slate-800 dark:text-slate-200 p-4 sm:p-5 rounded-xl text-xs sm:text-[13.5px] leading-relaxed">
                            <Lightbulb className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-mono font-semibold uppercase tracking-[0.1em] text-[10.5px] text-blue-700 dark:text-blue-400 block">
                                {isBn ? 'প্রো-টিপ ও সেরা নিয়ম' : 'Pro Tip & Best Practice'}
                              </span>
                              <p>{isBn ? activeSection.bnTip : activeSection.tip}</p>
                            </div>
                          </div>
                        )}

                        {activeSection.warning && (
                          <div className="flex gap-3 bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200/90 dark:border-rose-800/70 text-slate-800 dark:text-slate-200 p-4 sm:p-5 rounded-xl text-xs sm:text-[13.5px] leading-relaxed">
                            <AlertTriangle className="w-4 h-4 text-rose-700 dark:text-rose-400 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-mono font-semibold uppercase tracking-[0.1em] text-[10.5px] text-rose-700 dark:text-rose-400 block">
                                {isBn ? 'জরুরি সতর্কতা ও ভুল এড়ানোর উপায়' : 'Important Warning & Safeguard'}
                              </span>
                              <p>{isBn ? activeSection.bnWarning : activeSection.warning}</p>
                            </div>
                          </div>
                        )}
                      </section>
                    )}

                    {/* Next & Previous Topic Navigation Footer */}
                    <div className="pt-6 border-t border-slate-200/85 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                      {prevSection ? (
                        <button
                          type="button"
                          onClick={() => selectTopic(prevSection.category.id, prevSection.section.id)}
                          className="flex items-center gap-3 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] hover:border-blue-600/40 dark:hover:border-blue-500/40 text-left transition-colors group cursor-pointer"
                        >
                          <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400 block">
                              {isBn ? 'পূর্ববর্তী বিষয়' : 'Previous Topic'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-blue-700 dark:group-hover:text-blue-400 mt-0.5">
                              {isBn ? prevSection.section.bnTitle : prevSection.section.title}
                            </span>
                          </div>
                        </button>
                      ) : (
                        <div />
                      )}

                      {nextSection ? (
                        <button
                          type="button"
                          onClick={() => selectTopic(nextSection.category.id, nextSection.section.id)}
                          className="flex items-center justify-between gap-3 p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] hover:border-blue-600/40 dark:hover:border-blue-500/40 text-right transition-colors group sm:ml-auto w-full cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-slate-400 block">
                              {isBn ? 'পরবর্তী বিষয়' : 'Next Topic'}
                            </span>
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block group-hover:text-blue-700 dark:group-hover:text-blue-400 mt-0.5">
                              {isBn ? nextSection.section.bnTitle : nextSection.section.title}
                            </span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-700 dark:group-hover:text-blue-400 shrink-0 transition-colors" />
                        </button>
                      ) : (
                        <div />
                      )}
                    </div>

                    {/* Article Feedback Widget */}
                    <div className="bg-slate-50/80 dark:bg-[#0d1320] rounded-xl p-5 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          {isBn
                            ? 'এই নির্দেশিকাটি কি আপনার জন্য সহায়ক ছিল?'
                            : 'Was this article helpful?'}
                        </p>
                        <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {isBn
                            ? 'ডকুমেন্টেশন আরও স্পষ্ট করতে আপনার মতামত জানান'
                            : 'Help us keep workspace documentation clear and practical'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {feedbackGiven[activeSection.id] ? (
                          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {isBn ? 'মতামতের জন্য ধন্যবাদ!' : 'Thank you for your feedback!'}
                            </span>
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleFeedback(activeSection.id, 'yes')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                              <span>{isBn ? 'হ্যাঁ' : 'Yes'}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleFeedback(activeSection.id, 'no')}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-rose-700 dark:hover:text-rose-400 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                              <span>{isBn ? 'না' : 'No'}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* RIGHT RAIL: "ON THIS PAGE" TABLE OF CONTENTS (Desktop xl) */}
            {!isSearching && activeSection && (
              <aside className="hidden xl:block xl:col-span-2 xl:sticky xl:top-24 space-y-5 print:hidden">
                <div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em] block mb-3">
                    {isBn ? 'এই পাতার সূচি' : 'On This Page'}
                  </span>
                  <nav className="space-y-1.5 border-t border-slate-200/85 dark:border-slate-800 pt-3 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <button
                      type="button"
                      onClick={() => scrollToAnchor('doc-screen-reference')}
                      className="block w-full text-left py-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {t('docs.screenshot.heading')}
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollToAnchor('docs-purpose')}
                      className="block w-full text-left py-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                    >
                      {isBn ? 'ফিচারের মূল উদ্দেশ্য' : 'Feature Purpose'}
                    </button>
                    {activeSection.points && activeSection.points.length > 0 && (
                      <button
                        type="button"
                        onClick={() => scrollToAnchor('docs-steps')}
                        className="block w-full text-left py-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {isBn ? 'ধাপে ধাপে নির্দেশিকা' : 'Step-by-Step Guide'}
                      </button>
                    )}
                    {activeSection.fields && activeSection.fields.length > 0 && (
                      <button
                        type="button"
                        onClick={() => scrollToAnchor('docs-fields')}
                        className="block w-full text-left py-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {isBn ? 'ফিল্ড ও অপশন তালিকা' : 'Options & Fields'}
                      </button>
                    )}
                    {activeSection.example && (
                      <button
                        type="button"
                        onClick={() => scrollToAnchor('docs-example')}
                        className="block w-full text-left py-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {isBn ? 'ব্যবসায়িক উদাহরণ' : 'Case Study'}
                      </button>
                    )}
                    {(activeSection.tip || activeSection.warning) && (
                      <button
                        type="button"
                        onClick={() => scrollToAnchor('docs-tips')}
                        className="block w-full text-left py-1 hover:text-blue-700 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        {isBn ? 'টিপস ও সতর্কতা' : 'Tips & Warnings'}
                      </button>
                    )}
                  </nav>
                </div>

                <div className="p-4 bg-slate-50/70 dark:bg-[#0d1320] rounded-xl border border-slate-200/90 dark:border-slate-800 space-y-2">
                  <span className="text-[10.5px] font-mono font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400 block">
                    {isBn ? 'দ্রুত শর্টকাট' : 'Quick Shortcut'}
                  </span>
                  <p className="text-[11.5px] text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isBn ? (
                      <>
                        যেকোনো স্ক্রিনে <KeyCap>Alt+V</KeyCap> চেপে নতুন ভাউচার এবং{' '}
                        <KeyCap>Alt+L</KeyCap> চেপে নতুন লেজার তৈরি করা যায়।
                      </>
                    ) : (
                      <>
                        Press <KeyCap>Alt+V</KeyCap> to record a voucher, or{' '}
                        <KeyCap>Alt+L</KeyCap> to create a ledger from anywhere.
                      </>
                    )}
                  </p>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {isLightboxOpen && resolvedScreenshot && !hasImageError && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={resolvedScreenshot.alt}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-white dark:bg-[#0d1320] rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-2xl"
          >
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-950 dark:text-white truncate">
                  {resolvedScreenshot.caption}
                </p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                  {resolvedScreenshot.route}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label={t('docs.screenshot.closeLightbox')}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 sm:p-5 bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
              <img
                src={resolvedScreenshot.src}
                alt={resolvedScreenshot.alt}
                referrerPolicy="no-referrer"
                onError={() => {
                  setHasImageError(true);
                  setIsLightboxOpen(false);
                }}
                className="max-w-full max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {isFounder && (
        <ScreenshotManagerModal
          isOpen={isScreenshotModalOpen}
          onClose={() => setIsScreenshotModalOpen(false)}
          lang={activeLang}
          initialCategoryId={activeSection?.id || activeCategoryId}
          onUpdate={() => setScreenshotRefreshTick((n) => n + 1)}
        />
      )}
    </div>
  );
}
