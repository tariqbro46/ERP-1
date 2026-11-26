import React from 'react';
import { Loader2 } from 'lucide-react';
import { useSettings, SkeletonPageModuleId } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

interface SkeletonLoaderProps {
  type?: 'automatic' | 'table' | 'cards' | 'profile' | 'form';
  rows?: number;
  className?: string;
  isFullPage?: boolean;
  pageKey?: SkeletonPageModuleId | string;
}

const DETERMINISTIC_BAR_HEIGHTS = [38, 62, 48, 76, 54, 84, 66, 90, 58, 72, 80, 68];

export function resolveSkeletonPageKey(routeInput?: string): SkeletonPageModuleId {
  const raw = (
    routeInput ||
    (typeof window !== 'undefined'
      ? `${window.location.pathname || ''} ${window.location.hash || ''}`
      : '')
  ).toLowerCase();

  if (
    raw.includes('business-intelligence') ||
    raw.includes('statistics') ||
    raw.includes('financial-insights')
  ) {
    return 'analytics';
  }
  if (
    raw.includes('daybook') ||
    raw.includes('-register') ||
    raw.includes('group-voucher')
  ) {
    return 'daybook';
  }
  if (raw.includes('voucher')) {
    return 'vouchers';
  }
  if (
    raw.includes('payroll') ||
    raw.includes('production') ||
    raw.includes('order') ||
    raw.includes('employee') ||
    raw.includes('attendance') ||
    raw.includes('pay-slip') ||
    raw.includes('pay-sheet')
  ) {
    return 'payroll';
  }
  if (
    raw.includes('inventory') ||
    raw.includes('stock-') ||
    raw.includes('stock_') ||
    raw.includes('location') ||
    raw.includes('godown') ||
    raw.includes('ageing') ||
    raw.includes('items')
  ) {
    return 'inventory';
  }
  if (
    raw.includes('balance-sheet') ||
    raw.includes('profit-loss') ||
    raw.includes('trial-balance') ||
    raw.includes('ratio') ||
    raw.includes('cash-flow') ||
    raw.includes('funds-flow') ||
    raw.includes('group-summary') ||
    raw.includes('/reports')
  ) {
    return 'reports';
  }
  if (
    raw.includes('ledger') ||
    raw.includes('due-payment') ||
    raw.includes('cash-bank') ||
    raw.includes('audit-trail') ||
    raw.includes('statement')
  ) {
    return 'ledgers';
  }
  if (
    raw.includes('settings') ||
    raw.includes('alter') ||
    raw.includes('companies') ||
    raw.includes('users') ||
    raw.includes('subscription') ||
    raw.includes('notification')
  ) {
    return 'settings';
  }
  return 'dashboard';
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  rows,
  className,
  isFullPage = true,
  pageKey,
}) => {
  const settings = useSettings();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const resolvedPageKey = resolveSkeletonPageKey(pageKey);
  const globalEnabled = settings.skeletonEnabled ?? true;
  const pageOverride = settings.skeletonPageOverrides?.[resolvedPageKey];

  let isEnabled = false;
  if (!globalEnabled) {
    isEnabled = false;
  } else if (typeof pageOverride === 'boolean') {
    isEnabled = pageOverride;
  } else if (settings.skeletonDashboardOnly ?? true) {
    isEnabled = resolvedPageKey === 'dashboard' || type === 'cards';
  } else {
    isEnabled = true;
  }

  const activeType = type || settings.skeletonType || 'automatic';
  const activeTheme = settings.skeletonTheme || 'modern';
  const activeSpeed = settings.skeletonSpeed || 'normal';
  const activeWaveColor = settings.skeletonWaveColor || 'indigo';
  const activeRows = rows || settings.skeletonRows || 5;

  if (!isEnabled) {
    return (
      <div
        className={cn(
          'flex items-center justify-center min-h-[200px] w-full',
          isFullPage && 'py-12',
          className
        )}
      >
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-border bg-card text-muted-foreground text-xs font-medium shadow-[var(--shadow-surface)]">
          <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
          <span>{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  const duration =
    activeSpeed === 'fast' ? '1.15s' : activeSpeed === 'slow' ? '2.6s' : '1.75s';

  const isDarkTheme = theme !== 'classic' && theme !== 'light';

  const shimmerTints: Record<string, { light: string; dark: string }> = {
    slate: { light: 'rgba(148,163,184,0.22)', dark: 'rgba(148,163,184,0.12)' },
    indigo: { light: 'rgba(99,102,241,0.16)', dark: 'rgba(129,140,248,0.15)' },
    cyan: { light: 'rgba(6,182,212,0.16)', dark: 'rgba(34,211,238,0.14)' },
    rose: { light: 'rgba(244,63,94,0.14)', dark: 'rgba(251,113,133,0.14)' },
    emerald: { light: 'rgba(16,185,129,0.15)', dark: 'rgba(52,211,153,0.14)' },
    amber: { light: 'rgba(245,158,11,0.15)', dark: 'rgba(251,191,36,0.14)' },
  };

  const currentTint = shimmerTints[activeWaveColor] || shimmerTints.slate;
  const tintColor = isDarkTheme ? currentTint.dark : currentTint.light;

  let baseBgClass = '';
  let itemBgClass = '';
  let shimmerGradient = '';

  if (activeTheme === 'glass') {
    baseBgClass = isDarkTheme
      ? 'bg-white/[0.02] border border-white/[0.06] backdrop-blur-md rounded-2xl'
      : 'bg-white/70 border border-slate-200/80 backdrop-blur-md rounded-2xl';
    itemBgClass = isDarkTheme
      ? 'bg-white/[0.06] border border-white/[0.05]'
      : 'bg-slate-200/70 border border-slate-300/40';
    shimmerGradient = `linear-gradient(110deg, transparent 20%, ${tintColor} 50%, transparent 80%)`;
  } else if (activeTheme === 'neon') {
    baseBgClass = 'bg-slate-950/90 border border-cyan-500/20 rounded-2xl';
    itemBgClass = 'bg-cyan-500/[0.07] border border-cyan-500/15';
    shimmerGradient = `linear-gradient(110deg, transparent 20%, rgba(34,211,238,0.16) 50%, transparent 80%)`;
  } else if (activeTheme === 'classic') {
    baseBgClass = 'bg-card border border-border rounded-lg';
    itemBgClass = isDarkTheme ? 'bg-zinc-800/80' : 'bg-slate-200/90';
    shimmerGradient = `linear-gradient(110deg, transparent 20%, ${tintColor} 50%, transparent 80%)`;
  } else {
    baseBgClass = 'bg-card border border-border rounded-2xl shadow-[var(--shadow-surface)]';
    itemBgClass = isDarkTheme ? 'bg-slate-800/70' : 'bg-slate-100';
    shimmerGradient = `linear-gradient(110deg, transparent 20%, ${tintColor} 50%, transparent 80%)`;
  }

  let resolvedType = activeType;
  if (activeType === 'automatic') {
    if (resolvedPageKey === 'vouchers') {
      resolvedType = 'form';
    } else if (resolvedPageKey === 'dashboard') {
      resolvedType = 'cards';
    } else if (resolvedPageKey === 'settings') {
      resolvedType = 'profile';
    } else {
      resolvedType = 'table';
    }
  }

  const skeletonStyle = {
    '--skeleton-duration': duration,
    '--skeleton-shimmer': shimmerGradient,
  } as React.CSSProperties;

  return (
    <div
      style={skeletonStyle}
      className={cn(
        'w-full overflow-hidden transition-opacity duration-200',
        isFullPage && 'p-4 lg:p-6 min-h-[420px] flex flex-col gap-5',
        className
      )}
    >
      {isFullPage && (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={cn('h-8 w-44 rounded-lg erp-skeleton-item', itemBgClass)} />
              <div className={cn('h-5 w-20 rounded-md erp-skeleton-item hidden sm:block', itemBgClass)} />
            </div>
            <div className="flex items-center gap-2">
              <div className={cn('h-8 w-24 rounded-lg erp-skeleton-item', itemBgClass)} />
              <div className={cn('h-8 w-28 rounded-lg erp-skeleton-item', itemBgClass)} />
            </div>
          </div>
          <div className={cn('h-3.5 w-60 rounded-md erp-skeleton-item', itemBgClass)} />
        </div>
      )}

      <div className={cn('flex-1', activeTheme !== 'classic' && 'space-y-5')}>
        {resolvedType === 'table' && (
          <div className={cn('w-full overflow-hidden', baseBgClass)}>
            <div className="p-4 border-b border-border flex flex-wrap gap-3 justify-between items-center bg-card/50">
              <div className="flex gap-2">
                <div className={cn('h-8 w-32 rounded-lg erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-8 w-24 rounded-lg erp-skeleton-item', itemBgClass)} />
              </div>
              <div className={cn('h-8 w-48 rounded-lg erp-skeleton-item', itemBgClass)} />
            </div>

            <div className="grid grid-cols-12 px-5 py-3.5 border-b border-border bg-muted/30">
              <div className={cn('col-span-1 h-3.5 w-6 rounded erp-skeleton-item', itemBgClass)} />
              <div className={cn('col-span-4 h-3.5 w-32 rounded erp-skeleton-item', itemBgClass)} />
              <div className={cn('col-span-2 h-3.5 w-16 rounded erp-skeleton-item', itemBgClass)} />
              <div className={cn('col-span-2 h-3.5 w-16 rounded erp-skeleton-item', itemBgClass)} />
              <div className="col-span-3 flex justify-end">
                <div className={cn('h-3.5 w-24 rounded erp-skeleton-item', itemBgClass)} />
              </div>
            </div>

            <div className="divide-y divide-border/60">
              {Array.from({ length: activeRows }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-12 px-5 py-3.5 items-center">
                  <div className="col-span-1">
                    <div className={cn('h-3.5 w-5 rounded erp-skeleton-item', itemBgClass)} />
                  </div>
                  <div className="col-span-4">
                    <div
                      className={cn('h-3.5 rounded erp-skeleton-item', itemBgClass)}
                      style={{ width: `${60 + (idx % 4) * 10}%` }}
                    />
                  </div>
                  <div className="col-span-2">
                    <div className={cn('h-3.5 w-20 rounded erp-skeleton-item', itemBgClass)} />
                  </div>
                  <div className="col-span-2">
                    <div className={cn('h-5 w-16 rounded-full erp-skeleton-item', itemBgClass)} />
                  </div>
                  <div className="col-span-3 flex justify-end">
                    <div className={cn('h-3.5 w-20 rounded erp-skeleton-item', itemBgClass)} />
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3.5 bg-muted/30 border-t border-border grid grid-cols-12 items-center">
              <div className="col-span-5">
                <div className={cn('h-4 w-24 rounded erp-skeleton-item', itemBgClass)} />
              </div>
              <div className="col-span-7 flex justify-end gap-12">
                <div className={cn('h-4 w-24 rounded erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-4 w-28 rounded erp-skeleton-item', itemBgClass)} />
              </div>
            </div>
          </div>
        )}

        {resolvedType === 'cards' &&
          ((settings.globalDashboardDesign === 'Design 6' || settings.dashboardDesign === 'Design 6') ? (
            <div className="space-y-8 py-4">
              <div className="text-center space-y-3 flex flex-col items-center">
                <div className={cn('h-5 w-36 rounded-full erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-9 w-80 max-w-full rounded-lg erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-4 w-56 rounded-md erp-skeleton-item', itemBgClass)} />
              </div>

              <div className="h-px bg-border w-full" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, scIdx) => (
                  <div key={scIdx} className={cn('p-5 flex flex-col justify-between h-44', baseBgClass)}>
                    <div className="w-full space-y-3">
                      <div className="flex justify-between items-center">
                        <div className={cn('h-10 w-10 rounded-xl erp-skeleton-item', itemBgClass)} />
                        <div className={cn('h-5 w-16 rounded-full erp-skeleton-item', itemBgClass)} />
                      </div>
                      <div className={cn('h-5 w-32 rounded erp-skeleton-item', itemBgClass)} />
                      <div className={cn('h-3.5 w-44 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className={cn('h-3.5 w-24 rounded erp-skeleton-item', itemBgClass)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={cn('p-5 flex flex-col gap-3', baseBgClass)}>
                    <div className="flex justify-between items-center">
                      <div className={cn('h-3.5 w-20 rounded erp-skeleton-item', itemBgClass)} />
                      <div className={cn('h-8 w-8 rounded-lg erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className={cn('h-7 w-28 rounded erp-skeleton-item', itemBgClass)} />
                    <div className="flex justify-between items-center mt-1">
                      <div className={cn('h-3 w-16 rounded erp-skeleton-item', itemBgClass)} />
                      <div className={cn('h-3.5 w-12 rounded-full erp-skeleton-item', itemBgClass)} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className={cn('lg:col-span-2 p-5 h-76 flex flex-col gap-4 justify-between', baseBgClass)}>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1.5">
                      <div className={cn('h-5 w-40 rounded erp-skeleton-item', itemBgClass)} />
                      <div className={cn('h-3 w-48 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className="flex gap-1.5">
                      <div className={cn('h-7 w-12 rounded erp-skeleton-item', itemBgClass)} />
                      <div className={cn('h-7 w-12 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                  </div>
                  <div className="flex-1 flex items-end gap-2.5 px-2 pt-4">
                    {DETERMINISTIC_BAR_HEIGHTS.map((heightPct, k) => (
                      <div
                        key={k}
                        className={cn('flex-1 rounded-t erp-skeleton-item', itemBgClass)}
                        style={{ height: `${heightPct}%` }}
                      />
                    ))}
                  </div>
                </div>

                <div className={cn('p-5 flex flex-col gap-4', baseBgClass)}>
                  <div className="flex justify-between items-center border-b border-border/60 pb-3">
                    <div className={cn('h-5 w-32 rounded erp-skeleton-item', itemBgClass)} />
                    <div className={cn('h-4 w-12 rounded erp-skeleton-item', itemBgClass)} />
                  </div>
                  <div className="space-y-3.5 flex-1">
                    {Array.from({ length: 4 }).map((_, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-3">
                        <div className={cn('h-9 w-9 rounded-lg shrink-0 erp-skeleton-item', itemBgClass)} />
                        <div className="flex-1 space-y-1.5">
                          <div className={cn('h-3.5 w-full rounded erp-skeleton-item', itemBgClass)} />
                          <div className={cn('h-3 w-2/3 rounded erp-skeleton-item', itemBgClass)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}

        {resolvedType === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className={cn('p-5 flex flex-col items-center text-center gap-4', baseBgClass)}>
              <div className={cn('w-24 h-24 rounded-full erp-skeleton-item', itemBgClass)} />
              <div className="space-y-2 w-full flex flex-col items-center">
                <div className={cn('h-5 w-36 rounded erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-3.5 w-24 rounded erp-skeleton-item', itemBgClass)} />
              </div>
              <div className="w-full border-t border-border/60 pt-4 mt-1 space-y-3">
                <div className="flex justify-between">
                  <div className={cn('h-3.5 w-16 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('h-3.5 w-20 rounded erp-skeleton-item', itemBgClass)} />
                </div>
                <div className="flex justify-between">
                  <div className={cn('h-3.5 w-16 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('h-3.5 w-24 rounded erp-skeleton-item', itemBgClass)} />
                </div>
              </div>
            </div>

            <div className={cn('md:col-span-2 p-5 space-y-5', baseBgClass)}>
              <div className="border-b border-border pb-3">
                <div className={cn('h-5 w-48 rounded erp-skeleton-item', itemBgClass)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, fIdx) => (
                  <div key={fIdx} className="space-y-2">
                    <div className={cn('h-3.5 w-24 rounded erp-skeleton-item', itemBgClass)} />
                    <div className={cn('h-10 w-full rounded-lg erp-skeleton-item', itemBgClass)} />
                  </div>
                ))}
              </div>
              <div className="pt-3 flex justify-end gap-3">
                <div className={cn('h-9 w-24 rounded-lg erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-9 w-32 rounded-lg erp-skeleton-item', itemBgClass)} />
              </div>
            </div>
          </div>
        )}

        {resolvedType === 'form' && (
          <div className={cn('p-5 space-y-6', baseBgClass)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-5 border-b border-border">
              {Array.from({ length: 4 }).map((_, hIdx) => (
                <div key={hIdx} className="space-y-2">
                  <div className={cn('h-3.5 w-20 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('h-9 w-full rounded-lg erp-skeleton-item', itemBgClass)} />
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className={cn('h-4 w-32 rounded erp-skeleton-item', itemBgClass)} />
              <div className="border border-border rounded-xl overflow-hidden divide-y divide-border/60 bg-card/40">
                <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-3">
                  <div className={cn('col-span-1 h-3.5 w-4 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('col-span-5 h-3.5 w-28 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('col-span-2 h-3.5 w-14 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('col-span-2 h-3.5 w-14 rounded erp-skeleton-item', itemBgClass)} />
                  <div className="col-span-2 flex justify-end">
                    <div className={cn('h-3.5 w-16 rounded erp-skeleton-item', itemBgClass)} />
                  </div>
                </div>

                {Array.from({ length: 3 }).map((_, fRow) => (
                  <div key={fRow} className="grid grid-cols-12 gap-2 items-center px-4 py-3">
                    <div className="col-span-1">
                      <div className={cn('h-5 w-5 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className="col-span-5">
                      <div className={cn('h-7 w-[80%] rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className="col-span-2">
                      <div className={cn('h-7 w-16 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className="col-span-2">
                      <div className={cn('h-7 w-16 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <div className={cn('h-7 w-20 rounded erp-skeleton-item', itemBgClass)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-5 pt-2 items-end">
              <div className="space-y-2 w-full md:w-1/2">
                <div className={cn('h-3.5 w-16 rounded erp-skeleton-item', itemBgClass)} />
                <div className={cn('h-14 w-full rounded-lg erp-skeleton-item', itemBgClass)} />
              </div>
              <div className="space-y-3 w-full md:w-1/3 flex flex-col items-end">
                <div className="flex justify-between w-full border-b border-border pb-2">
                  <div className={cn('h-4 w-20 rounded erp-skeleton-item', itemBgClass)} />
                  <div className={cn('h-4 w-24 rounded erp-skeleton-item', itemBgClass)} />
                </div>
                <div className="flex gap-3">
                  <div className={cn('h-9 w-24 rounded-lg erp-skeleton-item', itemBgClass)} />
                  <div className={cn('h-9 w-32 rounded-lg erp-skeleton-item', itemBgClass)} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
