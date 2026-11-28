import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  Factory,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  Maximize2,
  Warehouse,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';
import { LATEST_VERSION } from '../../data/releaseNotes';
import {
  DOCS_SCREENSHOTS_UPDATED_EVENT,
  readStoredScreenshots,
  resolveShowcaseScreenshot,
} from '../../constants/helpContent';
import { ResilientImage } from '../ImageNotFoundFrame';

interface EnterpriseLedgerHeroProps {
  content?: Record<string, any>;
  onOpenDemoModal?: () => void;
  showExploreLiveDemo?: boolean;
}

type FocusLens = 'overview' | 'workspace';
type CapabilityTab = 'accounting' | 'inventory' | 'reports' | 'operations';

const CAPABILITY_SLOTS: Record<
  CapabilityTab,
  { slotKey: string; titleKey: string; descKey: string }
> = {
  accounting: {
    slotKey: 'hero-vouchers',
    titleKey: 'heroLedger.accTitle',
    descKey: 'heroLedger.accDesc',
  },
  inventory: {
    slotKey: 'hero-godowns',
    titleKey: 'heroLedger.invTitle',
    descKey: 'heroLedger.invDesc',
  },
  reports: {
    slotKey: 'hero-reports',
    titleKey: 'heroLedger.repTitle',
    descKey: 'heroLedger.repDesc',
  },
  operations: {
    slotKey: 'hero-operations',
    titleKey: 'heroLedger.opsTitle',
    descKey: 'heroLedger.opsDesc',
  },
};

export const EnterpriseLedgerHero: React.FC<EnterpriseLedgerHeroProps> = ({
  onOpenDemoModal,
  showExploreLiveDemo = true,
}) => {
  const { language, t } = useLanguage();
  const { user, company, isFounder } = useAuth();
  const { appIdentity, appVersion, companyName: settingsCompanyName } = useSettings();
  const isBn = language === 'bn';

  const [focusLens, setFocusLens] = useState<FocusLens>(() => (user ? 'workspace' : 'overview'));
  const [hasManualFocusToggle, setHasManualFocusToggle] = useState(false);
  const [activeCapability, setActiveCapability] = useState<CapabilityTab>('accounting');
  const [storedScreenshots, setStoredScreenshots] = useState<Record<string, string>>(() =>
    readStoredScreenshots()
  );
  const [hasImageError, setHasImageError] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  useEffect(() => {
    if (!hasManualFocusToggle) {
      setFocusLens(user ? 'workspace' : 'overview');
    }
  }, [user, hasManualFocusToggle]);

  useEffect(() => {
    const syncStored = () => setStoredScreenshots(readStoredScreenshots());
    window.addEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, syncStored);
    window.addEventListener('storage', syncStored);
    return () => {
      window.removeEventListener(DOCS_SCREENSHOTS_UPDATED_EVENT, syncStored);
      window.removeEventListener('storage', syncStored);
    };
  }, []);

  const activeMeta = CAPABILITY_SLOTS[activeCapability];
  const resolved = resolveShowcaseScreenshot(activeMeta.slotKey, storedScreenshots);

  useEffect(() => {
    setHasImageError(false);
    setIsLightboxOpen(false);
  }, [activeMeta.slotKey, resolved.src]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isLightboxOpen]);

  const activePlatformName = appIdentity?.appName || 'TallyFlow ERP';
  const activeTenantName = company?.name || settingsCompanyName || activePlatformName;
  const resolvedVersion = (appVersion || LATEST_VERSION || 'v1.9.9.32').startsWith('v')
    ? appVersion || LATEST_VERSION || 'v1.9.9.32'
    : `v${appVersion || LATEST_VERSION || '1.9.9.32'}`;

  const workspaceShortcuts = [
    {
      step: '01',
      titleEn: 'New Voucher Entry',
      titleBn: 'নতুন ভাউচার এন্ট্রি',
      metaEn: 'Sales · Purchase · Receipt · Journal',
      metaBn: 'বিক্রয় · ক্রয় · রিসিট · জার্নাল',
      to: '/vouchers/new',
      icon: FileText,
    },
    {
      step: '02',
      titleEn: 'Inventory & Godowns',
      titleBn: 'ইনভেন্টরি ও গোডাউন',
      metaEn: 'Items · FIFO Stock · Transfers',
      metaBn: 'আইটেম · FIFO স্টক · ট্রান্সফার',
      to: '/inventory/items',
      icon: Warehouse,
    },
    {
      step: '03',
      titleEn: '10 Core Reports',
      titleBn: '১০টি মূল রিপোর্ট',
      metaEn: 'Trial Balance · BS · P&L · Daybook',
      metaBn: 'ট্রায়াল ব্যালেন্স · BS · P&L · ডেবুক',
      to: '/reports/daybook',
      icon: BookOpen,
    },
    {
      step: '04',
      titleEn: 'Orders & Payroll',
      titleBn: 'অর্ডার ও পেরোল',
      metaEn: 'Production · Machines · Payslips',
      metaBn: 'প্রোডাকশন · মেশিন · পে-স্লিপ',
      to: '/production/orders',
      icon: Factory,
    },
  ];

  const isScreenshotReady = Boolean(resolved.src && !hasImageError);

  return (
    <section
      className="relative pt-24 sm:pt-28 pb-16 sm:pb-24 bg-white text-slate-950 border-b border-slate-200/85 overflow-x-clip"
      style={{ fontFamily: "'DM Sans', 'Hind Siliguri', sans-serif" }}
    >
      {/* Subtle architectural hairline blueprint grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(15, 23, 42, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(15, 23, 42, 0.04) 1px, transparent 1px)',
          backgroundSize: '72px 72px',
          maskImage: 'radial-gradient(ellipse 85% 65% at 50% 10%, black 30%, transparent 82%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 65% at 50% 10%, black 30%, transparent 82%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Metadata Rail + Entry Overview vs Workspace Intro Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-7 border-b border-slate-200/85">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono font-medium uppercase tracking-[0.12em] text-slate-500">
            <span className="text-slate-900 font-semibold">{activePlatformName}</span>
            <span aria-hidden="true">·</span>
            <span>{resolvedVersion}</span>
            <span aria-hidden="true">·</span>
            <span>{t('heroLedger.kickerSuite')}</span>
          </div>

          <div
            role="tablist"
            aria-label={t('heroLedger.focusLabel')}
            className="inline-flex items-center p-1 rounded-lg bg-slate-100 border border-slate-200/90 self-start sm:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={focusLens === 'overview'}
              onClick={() => {
                setHasManualFocusToggle(true);
                setFocusLens('overview');
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                focusLens === 'overview'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              )}
            >
              {t('heroLedger.modeOverview')}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={focusLens === 'workspace'}
              onClick={() => {
                setHasManualFocusToggle(true);
                setFocusLens('workspace');
              }}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer whitespace-nowrap',
                focusLens === 'workspace'
                  ? 'bg-white text-slate-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-950'
              )}
            >
              {t('heroLedger.modeWorkspace')}
            </button>
          </div>
        </div>

        {/* Main 12-Column Asymmetric Split */}
        <div className="mt-10 sm:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT 5 COLUMNS: Decision Narrative, Primary CTA, Verifiable System Scope */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="lg:col-span-5 flex flex-col justify-between"
          >
            {focusLens === 'overview' ? (
              <div>
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
                  {t('heroLedger.overviewEyebrow')}
                </p>

                <h1
                  className="mt-4 font-bold tracking-[-0.03em] text-slate-950 leading-[1.09]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(2.05rem, 3.8vw, 3.25rem)',
                    textWrap: 'balance',
                  }}
                >
                  {isBn ? (
                    <>
                      নির্ভুল ডাবল-এন্ট্রি লেজার, গোডাউন স্টক ও{' '}
                      <span className="text-blue-700">অডিট-রেডি রিপোর্ট</span>—একই কর্মক্ষেত্রে।
                    </>
                  ) : (
                    <>
                      Balanced ledgers, godown stock, and{' '}
                      <span className="text-blue-700">audit-ready reports</span> in one workspace.
                    </>
                  )}
                </h1>

                <p className="mt-5 text-[15px] sm:text-base leading-[1.68] text-slate-600 max-w-[54ch]">
                  {t('heroLedger.overviewSubtitle')}
                </p>

                {/* Primary & Secondary Actions */}
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Link
                    to={user ? '/dashboard' : '/register'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[13.5px] font-semibold tracking-tight transition-colors active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    <span>
                      {user ? t('heroLedger.ctaOpenConsole') : t('heroLedger.ctaStartTrial')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </Link>

                  {!user && showExploreLiveDemo && onOpenDemoModal && (
                    <button
                      type="button"
                      onClick={onOpenDemoModal}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 text-[13.5px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <span>{t('heroLedger.ctaLiveDemo')}</span>
                    </button>
                  )}

                  <Link
                    to="/features"
                    className="inline-flex items-center gap-1 px-2 py-2 text-[13px] font-medium text-slate-600 hover:text-slate-950 transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>{t('heroLedger.ctaAllModules')}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[11.5px] font-mono uppercase tracking-[0.14em] text-blue-700 font-semibold">
                  {user ? activeTenantName : t('heroLedger.workspaceEyebrow')}
                </p>

                <h1
                  className="mt-4 font-bold tracking-[-0.03em] text-slate-950 leading-[1.1]"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', 'Hind Siliguri', sans-serif",
                    fontSize: 'clamp(1.95rem, 3.5vw, 3rem)',
                    textWrap: 'balance',
                  }}
                >
                  {user ? (
                    isBn ? (
                      <>
                        আপনার সক্রিয় ইআরপি কর্মক্ষেত্র —{' '}
                        <span className="text-blue-700">দ্রুত এন্ট্রি ও রিপোর্ট তৈরি করুন।</span>
                      </>
                    ) : (
                      <>
                        Your active workspace —{' '}
                        <span className="text-blue-700">post vouchers and inspect books.</span>
                      </>
                    )
                  ) : isBn ? (
                    <>
                      অপারেটর ওয়ার্কস্পেস পরিচিতি —{' '}
                      <span className="text-blue-700">দৈনন্দিন কাজের ধাপ।</span>
                    </>
                  ) : (
                    <>
                      Operator workspace intro —{' '}
                      <span className="text-blue-700">built for daily speed.</span>
                    </>
                  )}
                </h1>

                <p className="mt-5 text-[15px] leading-[1.68] text-slate-600 max-w-[54ch]">
                  {t('heroLedger.workspaceSubtitle')}
                </p>

                {/* Primary & Secondary Actions for Workspace Intro */}
                <div className="mt-7 flex flex-wrap items-center gap-3">
                  <Link
                    to={user ? '/vouchers/new' : '/login'}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white text-[13.5px] font-semibold tracking-tight transition-colors active:scale-[0.99] whitespace-nowrap shrink-0"
                  >
                    <span>
                      {user ? t('heroLedger.ctaNewVoucher') : t('heroLedger.ctaSignInWorkspace')}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300" />
                  </Link>

                  <Link
                    to={user ? '/dashboard' : '/register'}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 hover:border-slate-300 text-[13.5px] font-medium transition-colors whitespace-nowrap shrink-0"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-500" />
                    <span>{user ? t('heroLedger.ctaOpenConsole') : t('heroLedger.ctaStartTrial')}</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Structured Capability Architecture Strip (Fact-Aligned, Zero Fake Metrics) */}
            <div className="mt-10 pt-6 border-t border-slate-200/85 grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-0 sm:divide-x sm:divide-slate-200/85">
              <div className="sm:pr-5">
                <div className="text-lg font-bold tracking-tight text-slate-950 font-mono tabular-nums">
                  {isBn ? '৮ ধরন' : '8 Types'}
                </div>
                <div className="mt-1 text-xs text-slate-600 leading-snug">
                  {t('heroLedger.statVouchers')}
                </div>
              </div>
              <div className="sm:px-5">
                <div className="text-lg font-bold tracking-tight text-slate-950 font-mono tabular-nums">
                  .xlsx · PDF
                </div>
                <div className="mt-1 text-xs text-slate-600 leading-snug">
                  {t('heroLedger.statReports')}
                </div>
              </div>
              <div className="sm:pl-5">
                <div className="text-lg font-bold tracking-tight text-slate-950 font-mono tabular-nums">
                  EN / বাংলা
                </div>
                <div className="mt-1 text-xs text-slate-600 leading-snug">
                  {t('heroLedger.statLocalization')}
                </div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT 7 COLUMNS: Authentic App Screen Showcase Workbench */}
          <motion.div
            id="telemetry"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-7 scroll-mt-24"
          >
            <div className="rounded-xl border border-slate-200/90 bg-white shadow-[0_18px_48px_-16px_rgba(15,23,42,0.08)] overflow-hidden">
              {/* Workbench Header + Module Tabs */}
              <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-b border-slate-200/85 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-slate-950 text-white flex items-center justify-center font-mono text-[11px] font-bold shrink-0">
                    {(appIdentity?.appShortName || 'TF').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">
                      {focusLens === 'workspace' && user
                        ? activeTenantName
                        : t('heroLedger.workbenchTitle')}
                    </p>
                    <p className="text-[11px] font-mono text-slate-500 truncate">
                      {focusLens === 'workspace'
                        ? t('heroLedger.workbenchWorkspaceSub')
                        : t('heroLedger.workbenchOverviewSub')}
                    </p>
                  </div>
                </div>

                <div
                  role="tablist"
                  aria-label={t('heroLedger.moduleTabsLabel')}
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar"
                >
                  {(
                    [
                      { id: 'accounting', en: 'Vouchers', bn: 'ভাউচার' },
                      { id: 'inventory', en: 'Godowns', bn: 'গোডাউন' },
                      { id: 'reports', en: '10 Reports', bn: '১০ রিপোর্ট' },
                      { id: 'operations', en: 'Ops & RBAC', bn: 'অপারেশনস' },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activeCapability === tab.id}
                      onClick={() => setActiveCapability(tab.id)}
                      className={cn(
                        'px-2.5 py-1.5 rounded-md text-[11.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0',
                        activeCapability === tab.id
                          ? 'bg-slate-950 text-white'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                      )}
                    >
                      {isBn ? tab.bn : tab.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Workbench Body */}
              <div className="p-4 sm:p-5 space-y-4">
                {focusLens === 'workspace' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-4 border-b border-slate-200/80">
                    {workspaceShortcuts.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.step}
                          to={user ? item.to : '/login'}
                          className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-200/85 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-md bg-white border border-slate-200 flex items-center justify-center text-slate-700 group-hover:text-blue-700 shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                <span className="font-mono text-slate-400 mr-1.5">{item.step}.</span>
                                {isBn ? item.titleBn : item.titleEn}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate">
                                {isBn ? item.metaBn : item.metaEn}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Active Tab Description & Action Links */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="text-sm font-bold text-slate-950">
                      {t(activeMeta.titleKey)}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                      {t(activeMeta.descKey)}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pt-0.5">
                    {isFounder && (
                      <Link
                        to={`/founder-desk?target=${encodeURIComponent(activeMeta.slotKey)}`}
                        className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-blue-700 hover:underline whitespace-nowrap"
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{t('heroLedger.manageScreenshot')}</span>
                      </Link>
                    )}
                    <Link
                      to={user ? resolved.route : '/features'}
                      className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-slate-700 hover:text-slate-950 whitespace-nowrap"
                    >
                      <span>{user ? t('heroLedger.openModuleScreen') : t('heroLedger.ctaAllModules')}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Real Application Screenshot Frame (falls back to ImageNotFoundFrame when URL is missing/broken) */}
                <figure className="rounded-xl border border-slate-200/90 bg-white overflow-hidden">
                  <div className="px-3.5 py-2 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0 text-[11px] font-mono text-slate-600">
                      <span className="truncate">{resolved.route}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={cn(
                          'font-semibold whitespace-nowrap shrink-0',
                          isScreenshotReady ? 'text-emerald-700' : 'text-slate-500'
                        )}
                      >
                        {isScreenshotReady
                          ? t('docs.screenshot.verifiedBadge')
                          : t('docs.screenshot.pendingBadge')}
                      </span>
                    </div>

                    {isScreenshotReady && (
                      <button
                        type="button"
                        onClick={() => setIsLightboxOpen(true)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-slate-200 bg-white hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Maximize2 className="w-3 h-3" />
                        <span>{t('docs.screenshot.zoomIn')}</span>
                      </button>
                    )}
                  </div>

                  <div className="p-2.5 sm:p-3.5 bg-slate-100/70 flex items-center justify-center">
                    <ResilientImage
                      src={resolved.src || ''}
                      alt={isBn ? resolved.bnAlt : resolved.alt}
                      onError={() => setHasImageError(true)}
                      onClick={isScreenshotReady ? () => setIsLightboxOpen(true) : undefined}
                      className={cn(
                        'w-full h-auto max-h-[340px] object-contain rounded-lg border border-slate-200/80 bg-white',
                        isScreenshotReady && 'cursor-zoom-in'
                      )}
                      fallbackClassName="w-full min-h-[260px] sm:min-h-[320px] rounded-lg"
                      fallbackSublabel={
                        hasImageError
                          ? t('docs.screenshot.loadError')
                          : isBn
                            ? resolved.bnCaption
                            : resolved.caption
                      }
                    />
                  </div>

                  <figcaption className="px-3.5 py-2.5 border-t border-slate-200/80 text-[11.5px] text-slate-600 leading-relaxed flex flex-wrap items-center justify-between gap-2">
                    <span>{isBn ? resolved.bnCaption : resolved.caption}</span>
                    <span className="text-[10.5px] font-mono text-slate-400">
                      {activePlatformName}
                    </span>
                  </figcaption>
                </figure>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {isLightboxOpen && isScreenshotReady && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isBn ? resolved.bnAlt : resolved.alt}
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 sm:p-8"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-5xl w-full bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-2xl"
          >
            <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-950 truncate">
                  {isBn ? resolved.bnCaption : resolved.caption}
                </p>
                <p className="text-[11px] font-mono text-slate-500 truncate">{resolved.route}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                aria-label={t('docs.screenshot.closeLightbox')}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 sm:p-5 bg-slate-100 flex items-center justify-center">
              <img
                src={resolved.src || ''}
                alt={isBn ? resolved.bnAlt : resolved.alt}
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
    </section>
  );
};

export default EnterpriseLedgerHero;
