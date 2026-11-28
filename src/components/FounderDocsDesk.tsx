import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode2,
  Link2,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  DOC_SCREENSHOTS,
  DOCS_SCREENSHOTS_UPDATED_EVENT,
  DocCategory,
  DocSubSection,
  HELP_DOCS,
  normalizeScreenshotUrl,
  readStoredScreenshots,
  SHOWCASE_SCREENSHOT_SLOTS,
  SHOWCASE_SCREENSHOTS,
  ShowcaseScreenshotSlot,
  writeStoredScreenshots,
} from '../constants/helpContent';
import { PUBLIC_NAV_ITEMS } from '../constants/publicNavigation';
import { LATEST_VERSION } from '../data/releaseNotes';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { Navbar } from './landing/Navbar';
import { Footer } from './landing/Footer';
import { ImageNotFoundFrame } from './ImageNotFoundFrame';

type FilterMode = 'all' | 'linked' | 'pending';

interface TargetItem {
  key: string;
  groupId: string;
  groupKind: 'hero' | 'features' | 'docs';
  groupTitleEn: string;
  groupTitleBn: string;
  category: DocCategory | null;
  section: DocSubSection | null;
  showcaseSlot: ShowcaseScreenshotSlot | null;
  title: string;
  bnTitle: string;
  alt: string;
  bnAlt: string;
  caption: string;
  bnCaption: string;
  route: string;
  staticSrc: string | null;
}

function escapeSingleQuotes(val: string): string {
  return val.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function buildEntrySnippet(item: TargetItem, src: string): string {
  const safeSrc = escapeSingleQuotes(src);
  const alt = escapeSingleQuotes(item.alt);
  const bnAlt = escapeSingleQuotes(item.bnAlt);
  const caption = escapeSingleQuotes(item.caption);
  const bnCaption = escapeSingleQuotes(item.bnCaption);
  const route = escapeSingleQuotes(item.route);

  return `  '${item.key}': {
    src: '${safeSrc}',
    alt: '${alt}',
    bnAlt: '${bnAlt}',
    caption: '${caption}',
    bnCaption: '${bnCaption}',
    route: '${route}',
  },`;
}

export default function FounderDocsDesk() {
  const { isFounder, user } = useAuth();
  const { language, t } = useLanguage();
  const { appIdentity, appVersion } = useSettings();
  const [searchParams] = useSearchParams();

  const isBn = language === 'bn';
  const appName = appIdentity?.appName || 'TallyFlow ERP';
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.32').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.32'
    : `v${appVersion || LATEST_VERSION || '1.9.9.32'}`;

  const [storedScreenshots, setStoredScreenshots] = useState<Record<string, string>>(() =>
    readStoredScreenshots()
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedKey, setSelectedKey] = useState<string>(
    () => searchParams.get('target') || 'hero-vouchers'
  );
  const [urlInput, setUrlInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [forcePendingPreview, setForcePendingPreview] = useState(false);
  const [imageState, setImageState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [importJsonOpen, setImportJsonOpen] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  useEffect(() => {
    const syncStored = () => setStoredScreenshots(readStoredScreenshots());
    window.addEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, syncStored);
    window.addEventListener('storage', syncStored);
    return () => {
      window.removeEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, syncStored);
      window.removeEventListener('storage', syncStored);
    };
  }, []);

  const allTargets = useMemo<TargetItem[]>(() => {
    const items: TargetItem[] = [];

    // 1. Home Hero & Features Showcase Slots
    SHOWCASE_SCREENSHOT_SLOTS.forEach((slot) => {
      const staticSrc =
        normalizeScreenshotUrl(SHOWCASE_SCREENSHOTS[slot.key]?.src) ||
        normalizeScreenshotUrl(DOC_SCREENSHOTS[slot.key]?.src);
      items.push({
        key: slot.key,
        groupId: slot.group === 'hero' ? 'showcase-hero' : 'showcase-features',
        groupKind: slot.group,
        groupTitleEn:
          slot.group === 'hero' ? 'Home Hero Preview' : 'Features Module Explorer',
        groupTitleBn:
          slot.group === 'hero' ? 'হোম হিরো প্রিভিউ' : 'ফিচার মডিউল এক্সপ্লোরার',
        category: null,
        section: null,
        showcaseSlot: slot,
        title: slot.title,
        bnTitle: slot.bnTitle,
        alt: slot.alt,
        bnAlt: slot.bnAlt,
        caption: slot.description,
        bnCaption: slot.bnDescription,
        route: slot.route,
        staticSrc,
      });
    });

    // 2. Documentation Chapters & Sections
    HELP_DOCS.forEach((cat) => {
      const catRegistrySrc = normalizeScreenshotUrl(DOC_SCREENSHOTS[cat.id]?.src);
      items.push({
        key: cat.id,
        groupId: cat.id,
        groupKind: 'docs',
        groupTitleEn: cat.title,
        groupTitleBn: cat.bnTitle,
        category: cat,
        section: null,
        showcaseSlot: null,
        title: cat.title,
        bnTitle: cat.bnTitle,
        alt: cat.title,
        bnAlt: cat.bnTitle,
        caption: `${cat.title} overview screen in TallyFlow ERP.`,
        bnCaption: `TallyFlow ERP-এর ${cat.bnTitle} অধ্যায়ের চিত্র।`,
        route: DOC_SCREENSHOTS[cat.id]?.route || `/${cat.id}`,
        staticSrc: catRegistrySrc,
      });

      cat.sections.forEach((sec) => {
        const secStatic =
          normalizeScreenshotUrl(sec.screenshotSrc) ||
          normalizeScreenshotUrl(DOC_SCREENSHOTS[sec.id]?.src);
        items.push({
          key: sec.id,
          groupId: cat.id,
          groupKind: 'docs',
          groupTitleEn: cat.title,
          groupTitleBn: cat.bnTitle,
          category: cat,
          section: sec,
          showcaseSlot: null,
          title: sec.title,
          bnTitle: sec.bnTitle,
          alt: sec.screenshotAlt || sec.title,
          bnAlt: sec.screenshotBnAlt || sec.bnTitle,
          caption: sec.screenshotCaption || `${sec.title} screen capture in TallyFlow ERP.`,
          bnCaption: sec.screenshotBnCaption || `TallyFlow ERP-এর ${sec.bnTitle} স্ক্রিনের চিত্র।`,
          route: sec.path || DOC_SCREENSHOTS[sec.id]?.route || `/${cat.id}`,
          staticSrc: secStatic,
        });
      });
    });

    return items;
  }, []);

  // Honor ?target=<key> when navigating directly from Home Hero, Features, or Docs
  useEffect(() => {
    const requested = searchParams.get('target');
    if (requested && allTargets.some((tItem) => tItem.key === requested)) {
      setSelectedKey(requested);
    }
  }, [searchParams, allTargets]);

  const countableTargets = useMemo(
    () => allTargets.filter((item) => item.section !== null || item.showcaseSlot !== null),
    [allTargets]
  );

  const stats = useMemo(() => {
    let linkedCount = 0;
    countableTargets.forEach((item) => {
      const catId = item.category?.id;
      const effective =
        normalizeScreenshotUrl(storedScreenshots[item.key]) ||
        item.staticSrc ||
        (catId
          ? normalizeScreenshotUrl(storedScreenshots[catId]) ||
            normalizeScreenshotUrl(DOC_SCREENSHOTS[catId]?.src)
          : null);
      if (effective) linkedCount += 1;
    });
    return {
      totalSections: countableTargets.length,
      linkedSections: linkedCount,
      pendingSections: countableTargets.length - linkedCount,
      localOverrides: Object.keys(storedScreenshots).length,
    };
  }, [countableTargets, storedScreenshots]);

  const filteredTargetsByGroup = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groupsOrder: Array<{
      id: string;
      titleEn: string;
      titleBn: string;
      items: TargetItem[];
    }> = [];
    const groupMap = new Map<
      string,
      { id: string; titleEn: string; titleBn: string; items: TargetItem[] }
    >();

    allTargets.forEach((item) => {
      const effectiveSrc =
        normalizeScreenshotUrl(storedScreenshots[item.key]) || item.staticSrc;
      const isLinked = Boolean(effectiveSrc);

      if (filterMode === 'linked' && !isLinked) return;
      if (filterMode === 'pending' && isLinked) return;

      if (q) {
        const matches =
          item.key.toLowerCase().includes(q) ||
          item.title.toLowerCase().includes(q) ||
          item.bnTitle.toLowerCase().includes(q) ||
          item.route.toLowerCase().includes(q) ||
          item.groupTitleEn.toLowerCase().includes(q) ||
          item.groupTitleBn.toLowerCase().includes(q);
        if (!matches) return;
      }

      let grp = groupMap.get(item.groupId);
      if (!grp) {
        grp = {
          id: item.groupId,
          titleEn: item.groupTitleEn,
          titleBn: item.groupTitleBn,
          items: [],
        };
        groupMap.set(item.groupId, grp);
        groupsOrder.push(grp);
      }
      grp.items.push(item);
    });

    return groupsOrder;
  }, [allTargets, storedScreenshots, filterMode, searchQuery]);

  const selectedTarget = useMemo(() => {
    return allTargets.find((tItem) => tItem.key === selectedKey) || allTargets[0];
  }, [allTargets, selectedKey]);

  const selectedLocalUrl = normalizeScreenshotUrl(storedScreenshots[selectedTarget.key]);
  const selectedEffectiveUrl = selectedLocalUrl || selectedTarget.staticSrc;
  const effectiveSourceType = selectedLocalUrl
    ? 'local'
    : selectedTarget.staticSrc
      ? 'registry'
      : 'none';

  useEffect(() => {
    setUrlInput(selectedLocalUrl || selectedTarget.staticSrc || '');
    setForcePendingPreview(false);
    setImageDims(null);
    if (selectedEffectiveUrl) {
      setImageState('loading');
    } else {
      setImageState('idle');
    }
  }, [selectedTarget.key, selectedLocalUrl, selectedTarget.staticSrc, selectedEffectiveUrl]);

  if (!isFounder) {
    return <Navigate to={user ? '/dashboard' : '/login'} replace />;
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 3200);
  };

  const handleSaveUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = normalizeScreenshotUrl(urlInput);
    if (!normalized) {
      showToast(
        'error',
        isBn
          ? 'বৈধ https:// ইমেজ URL বা /screenshots/... পাথ দিন। ফাইল বা base64 ডেটা অনুমোদিত নয়।'
          : 'Enter a valid external https:// image URL or /screenshots/... path. File blobs and data: URIs are not accepted.'
      );
      return;
    }

    const updated = writeStoredScreenshots({
      ...storedScreenshots,
      [selectedTarget.key]: normalized,
    });
    setStoredScreenshots(updated);
    setForcePendingPreview(false);
    setImageDims(null);
    setImageState('loading');
    showToast(
      'success',
      isBn ? 'স্ক্রিনশট URL সংযুক্ত হয়েছে।' : 'Screenshot URL saved to workspace.'
    );
  };

  const handleRemoveUrl = () => {
    if (!storedScreenshots[selectedTarget.key]) return;
    const next = { ...storedScreenshots };
    delete next[selectedTarget.key];
    const updated = writeStoredScreenshots(next);
    setStoredScreenshots(updated);
    setUrlInput(selectedTarget.staticSrc || '');
    setImageDims(null);
    setImageState(selectedTarget.staticSrc ? 'loading' : 'idle');
    showToast(
      'success',
      isBn ? 'লোকাল স্ক্রিনশট লিংক মুছে ফেলা হয়েছে।' : 'Local screenshot URL override removed.'
    );
  };

  const handleClearAllOverrides = () => {
    if (Object.keys(storedScreenshots).length === 0) return;
    const updated = writeStoredScreenshots({});
    setStoredScreenshots(updated);
    setUrlInput(selectedTarget.staticSrc || '');
    setImageDims(null);
    setImageState(selectedTarget.staticSrc ? 'loading' : 'idle');
    showToast(
      'success',
      isBn ? 'সব লোকাল স্ক্রিনশট লিংক পরিষ্কার করা হয়েছে।' : 'Cleared all local screenshot overrides.'
    );
  };

  const handleCopyText = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((curr) => (curr === id ? null : curr)), 2000);
    } catch {
      showToast(
        'error',
        isBn ? 'ক্লিপবোর্ডে কপি করা যায়নি।' : 'Could not access clipboard.'
      );
    }
  };

  const handleCopySingleSnippet = () => {
    const targetUrl =
      normalizeScreenshotUrl(urlInput) ||
      selectedEffectiveUrl ||
      'https://assets.example.com/tallyflow/screen.png';
    const snippet = buildEntrySnippet(selectedTarget, targetUrl);
    handleCopyText('single-ts', snippet);
  };

  const handleCopyAllRegistryTs = () => {
    const docEntries: string[] = [];
    const showcaseEntries: string[] = [];
    allTargets.forEach((item) => {
      const effective = normalizeScreenshotUrl(storedScreenshots[item.key]) || item.staticSrc;
      if (effective) {
        if (item.groupKind === 'docs') {
          docEntries.push(buildEntrySnippet(item, effective));
        } else {
          showcaseEntries.push(buildEntrySnippet(item, effective));
        }
      }
    });

    const docBlock =
      docEntries.length > 0
        ? `export const DOC_SCREENSHOTS: Record<string, DocScreenshotSpec> = {\n${docEntries.join('\n')}\n};`
        : `export const DOC_SCREENSHOTS: Record<string, DocScreenshotSpec> = {};`;

    const showcaseBlock =
      showcaseEntries.length > 0
        ? `export const SHOWCASE_SCREENSHOTS: Record<string, DocScreenshotSpec> = {\n${showcaseEntries.join('\n')}\n};`
        : `export const SHOWCASE_SCREENSHOTS: Record<string, DocScreenshotSpec> = {};`;

    handleCopyText('all-ts', `${docBlock}\n\n${showcaseBlock}`);
  };

  const handleExportJson = () => {
    const merged: Record<string, string> = {};
    allTargets.forEach((item) => {
      const effective = normalizeScreenshotUrl(storedScreenshots[item.key]) || item.staticSrc;
      if (effective) merged[item.key] = effective;
    });
    const blob = new Blob([JSON.stringify(merged, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tallyflow-screenshots-registry.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = () => {
    const raw = importJsonText.trim();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        showToast(
          'error',
          isBn
            ? 'সঠিক JSON অবজেক্ট দিন, যেমন {"hero-vouchers": "https://..."}'
            : 'Provide a valid JSON object mapping slot keys to external https:// URLs.'
        );
        return;
      }

      const validKeys = new Set(allTargets.map((item) => item.key));
      const nextMap: Record<string, string> = { ...storedScreenshots };
      let appliedCount = 0;

      Object.entries(parsed as Record<string, unknown>).forEach(([key, val]) => {
        if (!validKeys.has(key) || typeof val !== 'string') return;
        const normalized = normalizeScreenshotUrl(val);
        if (normalized) {
          nextMap[key] = normalized;
          appliedCount += 1;
        }
      });

      if (appliedCount === 0) {
        showToast(
          'error',
          isBn
            ? 'JSON-এ কোনো বৈধ স্লট কী বা https:// URL পাওয়া যায়নি।'
            : 'No matching slot keys with valid external URLs found in JSON.'
        );
        return;
      }

      const updated = writeStoredScreenshots(nextMap);
      setStoredScreenshots(updated);
      setImportJsonText('');
      setImportJsonOpen(false);
      showToast(
        'success',
        isBn
          ? `${appliedCount}টি স্ক্রিনশট URL লোকাল প্রিভিউতে যুক্ত হয়েছে।`
          : `Applied ${appliedCount} validated screenshot URL(s) to local preview.`
      );
    } catch {
      showToast(
        'error',
        isBn ? 'অবৈধ JSON ফরম্যাট। অনুগ্রহ করে যাচাই করুন।' : 'Invalid JSON syntax. Please check and try again.'
      );
    }
  };

  const liveViewLink =
    selectedTarget.groupKind === 'hero'
      ? '/'
      : selectedTarget.groupKind === 'features'
        ? '/features'
        : selectedTarget.section
          ? `/docs?section=${encodeURIComponent(selectedTarget.key)}`
          : '/docs';

  const liveViewLabel =
    selectedTarget.groupKind === 'docs'
      ? t('founderDesk.viewInDocs')
      : t('founderDesk.viewLivePage');

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

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          {/* Top Monospace Metadata Rail + Subtle Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-6 border-b border-slate-200/85 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
              <span className="text-slate-900 dark:text-white font-semibold">{appName}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">{resolvedVersion}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isBn ? 'ফাউন্ডার এক্সেস' : 'Founder Access'}</span>
              </span>
            </div>

            <nav
              aria-label="Breadcrumb"
              className="text-[11.5px] font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5 shrink-0"
            >
              <Link to="/" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {t('nav.breadcrumbHome')}
              </Link>
              <span aria-hidden="true">/</span>
              <Link to="/docs" className="hover:text-slate-950 dark:hover:text-white transition-colors">
                {isBn ? 'ডকুমেন্টেশন' : 'Docs'}
              </Link>
              <span aria-hidden="true">/</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {t('founderDesk.breadcrumb')}
              </span>
            </nav>
          </div>

          {/* Editorial Header */}
          <header className="pb-8 border-b border-slate-200/85 dark:border-slate-800 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 dark:text-blue-400 font-semibold">
                {t('founderDesk.kicker')}
              </p>
              <h1
                className="mt-2.5 font-bold tracking-[-0.03em] text-slate-950 dark:text-white leading-[1.09]"
                style={{
                  fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                  fontSize: 'clamp(1.85rem, 3.4vw, 2.75rem)',
                  textWrap: 'balance',
                }}
              >
                {t('founderDesk.title')}
              </h1>
              <p className="mt-3 text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {t('founderDesk.subtitle')}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/docs"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0d1320] hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                <span>{t('founderDesk.openDocs')}</span>
              </Link>
              <Link
                to="/founder"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-950 dark:bg-blue-600 hover:bg-slate-800 dark:hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t('founderDesk.openFounderPanel')}</span>
              </Link>
            </div>
          </header>

          {/* Summary Metrics Strip (Single-Elevation Ledger Strip) */}
          <section className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200/90 dark:border-slate-800 rounded-xl bg-slate-50/60 dark:bg-[#0d1320] divide-y lg:divide-y-0 lg:divide-x divide-slate-200/90 dark:divide-slate-800">
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {t('founderDesk.totalTargets')}
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                {String(stats.totalSections).padStart(2, '0')}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {isBn ? 'লিংক যুক্ত স্ক্রিন' : 'Linked Screenshots'}
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {String(stats.linkedSections).padStart(2, '0')}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {isBn ? 'অপেক্ষমাণ স্ক্রিন' : 'Capture Pending'}
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-700 dark:text-slate-200">
                {String(stats.pendingSections).padStart(2, '0')}
              </p>
            </div>
            <div className="p-4 sm:p-5">
              <p className="text-[11px] font-mono uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {isBn ? 'লোকাল ওভাররাইড' : 'Local URL Overrides'}
              </p>
              <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-blue-700 dark:text-blue-400">
                {String(stats.localOverrides).padStart(2, '0')}
              </p>
            </div>
          </section>

          {/* Local Override -> Repository Persistence Banner for Vercel Deployment */}
          {stats.localOverrides > 0 && (
            <div className="rounded-xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/75 dark:bg-amber-950/25 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1 min-w-0">
                  <p className="text-xs font-bold text-slate-950 dark:text-white">
                    {t('founderDesk.vercelSyncTitle')}
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    {t('founderDesk.vercelSyncDesc', { count: stats.localOverrides })}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyAllRegistryTs}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 dark:bg-blue-600 hover:opacity-95 text-white text-xs font-semibold transition-opacity cursor-pointer whitespace-nowrap"
                >
                  {copiedId === 'all-ts' ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {copiedId === 'all-ts'
                      ? t('founderDesk.copied')
                      : t('founderDesk.copyAllTs')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleExportJson}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 hover:bg-amber-100/60 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{t('founderDesk.exportJson')}</span>
                </button>
              </div>
            </div>
          )}

          {/* Main 2-Column Screenshot URL Control Center */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Index Rail */}
            <aside className="lg:col-span-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] overflow-hidden">
              <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800 space-y-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('founderDesk.searchPlaceholder')}
                    className="w-full pl-8.5 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                {/* Segmented Filter Controls */}
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-200/60 dark:bg-slate-900 rounded-lg">
                  {(
                    [
                      { id: 'all', label: t('founderDesk.filterAll') },
                      { id: 'linked', label: t('founderDesk.filterLinked') },
                      { id: 'pending', label: t('founderDesk.filterPending') },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFilterMode(tab.id)}
                      className={cn(
                        'py-1.5 px-2 rounded-md text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap',
                        filterMode === tab.id
                          ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-200/75 dark:divide-slate-800/80">
                {filteredTargetsByGroup.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    {isBn
                      ? 'এই ফিল্টার অনুযায়ী কোনো সেকশন পাওয়া যায়নি।'
                      : 'No slots or sections match this filter.'}
                  </div>
                ) : (
                  filteredTargetsByGroup.map((group) => (
                    <div key={group.id} className="py-2">
                      <div className="px-3.5 py-1.5 text-[10.5px] font-mono font-semibold uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
                        {isBn ? group.titleBn : group.titleEn}
                      </div>
                      <div className="px-2 space-y-0.5">
                        {group.items.map((item) => {
                          const isSelected = item.key === selectedTarget.key;
                          const hasLocal = Boolean(normalizeScreenshotUrl(storedScreenshots[item.key]));
                          const hasStatic = Boolean(item.staticSrc);

                          const rowLabel =
                            item.showcaseSlot || item.section
                              ? isBn
                                ? item.bnTitle
                                : item.title
                              : t('founderDesk.chapterDefault');

                          return (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setSelectedKey(item.key)}
                              className={cn(
                                'w-full px-2.5 py-2 rounded-lg text-left flex items-center justify-between gap-2 transition-colors cursor-pointer',
                                isSelected
                                  ? 'bg-slate-950 dark:bg-blue-600 text-white'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-900'
                              )}
                            >
                              <span className="min-w-0 truncate text-xs font-medium">
                                {rowLabel}
                              </span>
                              <span
                                className={cn(
                                  'text-[10px] font-mono font-semibold shrink-0',
                                  isSelected
                                    ? 'text-white/90'
                                    : hasLocal
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : hasStatic
                                        ? 'text-blue-700 dark:text-blue-400'
                                        : 'text-slate-400 dark:text-slate-500'
                                )}
                              >
                                {hasLocal
                                  ? t('founderDesk.statusLinked')
                                  : hasStatic
                                    ? t('founderDesk.statusRegistry')
                                    : t('founderDesk.statusPending')}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Right Workbench Inspector */}
            <div className="lg:col-span-8 space-y-6">
              {feedback && (
                <div
                  role="status"
                  className={cn(
                    'px-4 py-3 rounded-xl border text-xs font-semibold flex items-center gap-2',
                    feedback.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300'
                  )}
                >
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{feedback.text}</span>
                </div>
              )}

              {/* Selected Target Editor Card */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] overflow-hidden">
                <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span>{isBn ? selectedTarget.groupTitleBn : selectedTarget.groupTitleEn}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-800 dark:text-slate-200 font-semibold">
                        #{selectedTarget.key}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{selectedTarget.route}</span>
                    </div>
                    <h2 className="mt-1 text-base sm:text-lg font-bold text-slate-950 dark:text-white truncate">
                      {selectedTarget.showcaseSlot || selectedTarget.section
                        ? isBn
                          ? selectedTarget.bnTitle
                          : selectedTarget.title
                        : `${t('founderDesk.chapterDefault')}: ${
                            isBn ? selectedTarget.bnTitle : selectedTarget.title
                          }`}
                    </h2>
                  </div>

                  <Link
                    to={liveViewLink}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
                  >
                    <span>{liveViewLabel}</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-5 sm:p-6 space-y-6">
                  {/* Source Info + URL Input Form */}
                  <form onSubmit={handleSaveUrl} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <label
                        htmlFor="founder-desk-url-input"
                        className="text-[11px] font-mono font-semibold uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300"
                      >
                        {t('founderDesk.urlLabel')}
                      </label>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        {effectiveSourceType === 'local'
                          ? t('founderDesk.sourceLocal')
                          : effectiveSourceType === 'registry'
                            ? t('founderDesk.sourceRegistry')
                            : t('founderDesk.sourceNone')}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <div className="relative flex-1">
                        <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          id="founder-desk-url-input"
                          type="text"
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          placeholder={t('founderDesk.urlPlaceholder')}
                          className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-hidden"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!urlInput.trim()}
                        className="px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {t('founderDesk.applyUrl')}
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopySingleSnippet}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        {copiedId === 'single-ts' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {copiedId === 'single-ts'
                            ? t('founderDesk.copied')
                            : t('founderDesk.copyEntryTs')}
                        </span>
                      </button>

                      {selectedEffectiveUrl && (
                        <a
                          href={selectedEffectiveUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-blue-700 dark:text-blue-400 transition-colors whitespace-nowrap"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>{t('founderDesk.openExternal')}</span>
                        </a>
                      )}

                      {selectedLocalUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveUrl}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{t('founderDesk.removeOverride')}</span>
                        </button>
                      )}
                    </div>
                  </form>

                  {/* Live Preview & Capture Pending Verification */}
                  <div className="pt-5 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.1em] text-slate-600 dark:text-slate-300 font-semibold">
                        <span>{t('founderDesk.previewHeading')}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={cn(
                            imageState === 'loaded' && !forcePendingPreview
                              ? 'text-emerald-700 dark:text-emerald-400'
                              : imageState === 'error'
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-500 dark:text-slate-400'
                          )}
                        >
                          {forcePendingPreview || !selectedEffectiveUrl
                            ? t('docs.screenshot.pendingBadge')
                            : imageState === 'loaded'
                              ? `${t('founderDesk.previewVerified')}${
                                  imageDims ? ` (${imageDims.w}×${imageDims.h})` : ''
                                }`
                              : imageState === 'loading'
                                ? t('founderDesk.previewLoading')
                                : t('founderDesk.previewFailed')}
                        </span>
                      </div>

                      {selectedEffectiveUrl && (
                        <button
                          type="button"
                          onClick={() => setForcePendingPreview((prev) => !prev)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {forcePendingPreview ? (
                            <>
                              <Eye className="w-3 h-3" />
                              <span>{t('founderDesk.toggleLivePreview')}</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3" />
                              <span>{t('founderDesk.togglePendingPreview')}</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {selectedEffectiveUrl && !forcePendingPreview && imageState !== 'error' ? (
                      <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/80 p-3 sm:p-4 flex items-center justify-center min-h-[220px]">
                        <img
                          src={selectedEffectiveUrl}
                          alt={isBn ? selectedTarget.bnAlt : selectedTarget.alt}
                          referrerPolicy="no-referrer"
                          onLoad={(e) => {
                            const img = e.currentTarget;
                            setImageState('loaded');
                            setImageDims({ w: img.naturalWidth, h: img.naturalHeight });
                          }}
                          onError={() => {
                            setImageState('error');
                            setImageDims(null);
                          }}
                          className="w-full h-auto max-h-[420px] object-contain rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900"
                        />
                      </div>
                    ) : (
                      <ImageNotFoundFrame
                        className="w-full min-h-[240px] sm:min-h-[300px] rounded-xl"
                        sublabel={
                          imageState === 'error'
                            ? t('docs.screenshot.loadError')
                            : t('founderDesk.previewPendingDesc')
                        }
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Bulk Registry Export, Import & Clear Bar */}
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/70 dark:bg-[#0d1320] p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                      <FileCode2 className="w-4 h-4 text-blue-700 dark:text-blue-400" />
                      <span>
                        {isBn
                          ? 'রেজিস্ট্রি এক্সপোর্ট ও ব্যাকআপ (DOC + SHOWCASE)'
                          : 'Registry Export & Local Backup (DOC + SHOWCASE)'}
                      </span>
                    </h3>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-400">
                      {isBn
                        ? 'সকল সংযুক্ত URL-এর TypeScript কোড বা JSON ফাইল কপি/ডাউনলোড করুন (শূন্য Firestore রিড)।'
                        : 'Copy TypeScript mapping for helpContent.ts or export/import validated URL JSON with zero Firestore reads.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyAllRegistryTs}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {copiedId === 'all-ts' ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {copiedId === 'all-ts'
                          ? t('founderDesk.copied')
                          : t('founderDesk.copyAllTs')}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{t('founderDesk.exportJson')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setImportJsonOpen((prev) => !prev)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <Link2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                      <span>{t('founderDesk.importJson')}</span>
                    </button>

                    {stats.localOverrides > 0 && (
                      <button
                        type="button"
                        onClick={handleClearAllOverrides}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-950/70 text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t('founderDesk.resetAll')}</span>
                      </button>
                    )}
                  </div>
                </div>

                {importJsonOpen && (
                  <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-2.5">
                    <textarea
                      rows={4}
                      value={importJsonText}
                      onChange={(e) => setImportJsonText(e.target.value)}
                      placeholder={t('founderDesk.importJsonPlaceholder')}
                      className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:outline-hidden"
                    />
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setImportJsonOpen(false)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {t('founderDesk.cancelJson')}
                      </button>
                      <button
                        type="button"
                        onClick={handleImportJson}
                        disabled={!importJsonText.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        {t('founderDesk.applyJson')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Compact Editorial & Public Content Quick Links Ledger */}
          <section className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0d1320] overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-950 dark:text-white">
                  {t('founderDesk.editorialTitle')}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('founderDesk.editorialSubtitle')}
                </p>
              </div>
              <span className="text-[11px] font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {String(PUBLIC_NAV_ITEMS.length).padStart(2, '0')} {isBn ? 'রুট' : 'Routes'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-5 align-middle font-semibold">
                      {isBn ? 'পৃষ্ঠা' : 'Page'}
                    </th>
                    <th className="py-2.5 px-4 align-middle font-semibold">
                      {isBn ? 'রুট' : 'Route'}
                    </th>
                    <th className="py-2.5 px-4 align-middle font-semibold hidden sm:table-cell">
                      {isBn ? 'বিবরণ' : 'Summary'}
                    </th>
                    <th className="py-2.5 px-5 align-middle text-right font-semibold">
                      {isBn ? 'লিংক' : 'Open'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/75 dark:divide-slate-800/80 text-xs">
                  {PUBLIC_NAV_ITEMS.map((navItem) => {
                    const Icon = navItem.icon;
                    return (
                      <tr
                        key={navItem.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors"
                      >
                        <td className="py-3 px-5 align-middle font-semibold text-slate-950 dark:text-white whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <Icon className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                            <span>
                              {isBn ? navItem.defaultLabelBn : navItem.defaultLabelEn}
                            </span>
                          </span>
                        </td>
                        <td className="py-3 px-4 align-middle font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {navItem.path}
                        </td>
                        <td className="py-3 px-4 align-middle text-slate-600 dark:text-slate-400 hidden sm:table-cell">
                          {isBn ? navItem.defaultDescBn : navItem.defaultDescEn}
                        </td>
                        <td className="py-3 px-5 align-middle text-right whitespace-nowrap">
                          <Link
                            to={navItem.path}
                            className="inline-flex items-center gap-1 font-semibold text-blue-700 dark:text-blue-400 hover:underline"
                          >
                            <span>{isBn ? 'খুলুন' : 'Open'}</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
