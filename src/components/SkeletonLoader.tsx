import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useTheme } from '../contexts/ThemeContext';
import { cn } from '../lib/utils';

interface SkeletonLoaderProps {
  type?: 'automatic' | 'table' | 'cards' | 'profile' | 'form';
  rows?: number;
  className?: string;
  isFullPage?: boolean;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type,
  rows,
  className,
  isFullPage = true
}) => {
  const settings = useSettings();
  const { theme } = useTheme();

  // Evaluate if skeleton loader should be displayed
  let isEnabled = false;
  if (settings.skeletonEnabled ?? true) {
    isEnabled = true;
  } else if (settings.skeletonDashboardOnly ?? true) {
    const hash = window.location.hash || '';
    const isDashboard = hash.includes('dashboard') || hash === '' || hash === '#/';
    if (isDashboard || type === 'cards') {
      isEnabled = true;
    }
  }

  const activeType = type || settings.skeletonType || 'automatic';
  const activeTheme = settings.skeletonTheme || 'modern';
  const activeSpeed = settings.skeletonSpeed || 'normal';
  const activeWaveColor = settings.skeletonWaveColor || 'indigo';
  const activeRows = rows || settings.skeletonRows || 5;

  if (!isEnabled) {
    return (
      <div className="flex items-center justify-center min-h-[400px] w-full">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Animation duration
  const duration = 
    activeSpeed === 'fast' ? '1.2s' : 
    activeSpeed === 'slow' ? '3s' : '2s';

  // Determine colors based on activeTheme and system dark mode options
  const isDarkTheme = theme !== 'classic' && theme !== 'light';
  
  let baseBgClass = '';
  let itemBgClass = '';
  let shimmerGradient = '';

  // Get wave tint color hex codes for custom shimmer gloss sweeps
  const shimmerTints: Record<string, { light: string, dark: string }> = {
    slate: { light: 'rgba(148,163,184,0.15)', dark: 'rgba(71,85,105,0.2)' },
    indigo: { light: 'rgba(99,102,241,0.2)', dark: 'rgba(79,70,229,0.25)' },
    cyan: { light: 'rgba(6,182,212,0.2)', dark: 'rgba(8,145,178,0.25)' },
    rose: { light: 'rgba(244,63,94,0.15)', dark: 'rgba(225,29,72,0.2)' },
    emerald: { light: 'rgba(16,185,129,0.15)', dark: 'rgba(5,150,105,0.2)' },
    amber: { light: 'rgba(245,158,11,0.15)', dark: 'rgba(217,119,6,0.2)' }
  };

  const currentTint = shimmerTints[activeWaveColor] || shimmerTints.slate;
  const tintColor = isDarkTheme ? currentTint.dark : currentTint.light;

  if (activeTheme === 'glass') {
    baseBgClass = isDarkTheme 
      ? 'bg-white/[0.02] border border-white/[0.05] backdrop-blur-md rounded-2xl' 
      : 'bg-slate-500/[0.02] border border-slate-500/[0.07] backdrop-blur-md rounded-2xl';
    itemBgClass = isDarkTheme 
      ? 'bg-white/[0.05] border border-white/[0.05]' 
      : 'bg-black/[0.04] border border-black/[0.02]';
    shimmerGradient = isDarkTheme
      ? `linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 100%)`
      : `linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)`;
  } else if (activeTheme === 'neon') {
    baseBgClass = 'bg-[#060814] border border-cyan-500/10 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.03)]';
    itemBgClass = 'bg-cyan-500/[0.04] border border-cyan-500/[0.08]';
    shimmerGradient = `linear-gradient(115deg, rgba(6,182,212,0) 0%, rgba(6,182,212,0.1) 50%, rgba(244,63,94,0) 100%)`;
  } else if (activeTheme === 'classic') {
    baseBgClass = 'bg-background rounded-none';
    itemBgClass = isDarkTheme ? 'bg-zinc-800' : 'bg-slate-200';
    shimmerGradient = isDarkTheme
      ? 'linear-gradient(115deg, rgba(39,39,42,0) 0%, rgba(255,255,255,0.03) 50%, rgba(39,39,42,0) 100%)'
      : 'linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0) 100%)';
  } else { // 'modern'
    baseBgClass = 'bg-card border border-border p-6 rounded-2xl shadow-sm';
    itemBgClass = isDarkTheme ? 'bg-zinc-800/60' : 'bg-slate-100/90';
    shimmerGradient = isDarkTheme
      ? `linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.04) 50%, rgba(255,255,255,0) 100%)`
      : `linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0) 100%)`;
  }

  // Detect route to select layout if automatic
  let resolvedType = activeType;
  if (activeType === 'automatic') {
    const hash = window.location.hash || '';
    if (hash.includes('voucher') || hash.includes('entry') || hash.includes('creation') || hash.includes('alter')) {
      resolvedType = 'form';
    } else if (hash.includes('dashboard') || hash === '') {
      resolvedType = 'cards';
    } else if (hash.includes('summary') || hash.includes('balance') || hash.includes('daybook') || hash.includes('profit') || hash.includes('register') || hash.includes('report')) {
      resolvedType = 'table';
    } else if (hash.includes('profile') || hash.includes('user') || hash.includes('master') || hash.includes('info')) {
      resolvedType = 'profile';
    } else {
      resolvedType = 'table'; // Safe default matching ERP tables
    }
  }

  // Keyframe animation injected helper
  const uniqueId = `shimmer-${activeTheme}-${activeSpeed}-${activeWaveColor}`;

  return (
    <div className={cn(
      "w-full overflow-hidden transition-all duration-300",
      isFullPage && "p-4 lg:p-6 min-h-[500px] flex flex-col gap-6",
      className
    )} id={`skele-${uniqueId}`}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer-sweep-${uniqueId} {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .shimmer-active-${uniqueId} {
          background-image: ${shimmerGradient};
          background-size: 200% 100%;
          animation: shimmer-sweep-${uniqueId} ${duration} infinite linear;
        }
      `}} />

      {/* Top Breadcrumb/Header Skeleton */}
      {isFullPage && (
        <div className="flex flex-col gap-2 mb-2">
          {/* Main Title bar */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-9 w-40 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className={cn("h-5 w-20 rounded-md shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass, "hidden sm:block")} />
            </div>
            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <div className={cn("h-9 w-24 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className={cn("h-9 w-28 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
            </div>
          </div>
          {/* Subtitle/Date Selector */}
          <div className={cn("h-4 w-64 rounded-md mt-1 shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
        </div>
      )}

      {/* Main Body Skeleton Layouts */}
      <div className={cn("flex-1", activeTheme !== 'classic' && "space-y-6")}>
        
        {/* LAYOUT 1: TABLE SKELETON */}
        {resolvedType === 'table' && (
          <div className={cn("w-full overflow-hidden border border-border bg-card", baseBgClass)}>
            {/* Table Filters Toolbar */}
            <div className="p-4 border-b border-border flex flex-wrap gap-3 justify-between items-center bg-card/50">
              <div className="flex gap-2">
                <div className={cn("h-8 w-32 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-8 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className={cn("h-8 w-48 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
            </div>

            {/* Table Column Headers */}
            <div className="grid grid-cols-12 px-6 py-4 border-b border-border bg-card/60 font-medium text-xs">
              <div className={cn("col-span-1 h-4 w-6 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className={cn("col-span-4 h-4 w-32 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className={cn("col-span-2 h-4 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className={cn("col-span-2 h-4 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className={cn("col-span-3 h-4 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass, "text-right")} />
            </div>

            {/* Table Core Records Rows */}
            <div className="divide-y divide-border/60">
              {Array.from({ length: activeRows }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-12 px-6 py-4 items-center hover:bg-muted/10">
                  {/* SL NO */}
                  <div className="col-span-1">
                    <div className={cn("h-4 w-4 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                  {/* PARTICULARS (Randomize width for realism like Facebook/Google) */}
                  <div className="col-span-4">
                    <div className={cn("h-4 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} 
                         style={{ width: `${60 + (idx % 4) * 10}%` }} />
                  </div>
                  {/* GROUP CATEGORY */}
                  <div className="col-span-2">
                    <div className={cn("h-4 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                  {/* STATUS PILL */}
                  <div className="col-span-2">
                    <div className={cn("h-5 w-16 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                  {/* FINANCIAL NUMERIC TOTAL */}
                  <div className="col-span-3 flex justify-end">
                    <div className={cn("h-4 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                </div>
              ))}
            </div>

            {/* Table Footer Summary Row */}
            <div className="px-6 py-4 bg-muted/40 border-t border-border grid grid-cols-12 justify-between items-center">
              <div className="col-span-5">
                <div className={cn("h-5 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="col-span-7 flex justify-end gap-16">
                <div className={cn("h-5 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-5 w-28 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 2: CARDS / BENTO GRID */}
        {resolvedType === 'cards' && (
          (settings.globalDashboardDesign === 'Design 6' || settings.dashboardDesign === 'Design 6') ? (
            <div className="space-y-10 py-6">
              {/* Centered header content styled placeholder */}
              <div className="text-center space-y-4 flex flex-col items-center">
                <div className={cn("h-6 w-36 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-10 w-96 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-4 w-60 rounded-md shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-7 w-64 rounded-xl shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>

              <div className="h-px bg-slate-200/50 w-full" />

              {/* Main shortcuts grid matches Design 6 (3x2 layout) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, scIdx) => (
                  <div
                    key={scIdx}
                    className={cn("p-6 flex flex-col justify-between h-48", baseBgClass)}
                  >
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center bg-transparent">
                        <div className={cn("h-10 w-10 rounded-xl shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                        <div className={cn("h-5 w-16 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                      </div>
                      <div className={cn("h-5 w-32 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                      <div className={cn("h-4 w-48 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    
                    <div className={cn("h-4 w-24 rounded mt-4 shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Top Stat Highlight Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className={cn("p-5 flex flex-col gap-3", baseBgClass)}>
                    <div className="flex justify-between items-center">
                      <div className={cn("h-3.5 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                      <div className={cn("h-8 w-8 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    <div className={cn("h-7 w-28 rounded mt-1 shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    <div className="flex justify-between items-center mt-2">
                      <div className={cn("h-3 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                      <div className={cn("h-3.5 w-12 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Layout grids for dashboard charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Primary Large Chart Card */}
                <div className={cn("lg:col-span-2 p-6 h-80 flex flex-col gap-4 justify-between", baseBgClass)}>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className={cn("h-5 w-40 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                      <div className={cn("h-3 w-48 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    <div className="flex gap-1">
                      <div className={cn("h-7 w-12 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                      <div className={cn("h-7 w-12 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                  </div>
                  {/* Horizontal Bar charts or plot placeholders */}
                  <div className="flex-1 flex items-end gap-3 px-2 pt-6">
                    {Array.from({ length: 12 }).map((_, k) => (
                      <div 
                        key={k} 
                        className={cn("flex-1 rounded-t shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} 
                        style={{ height: `${30 + (Math.sin(k) + 1) * 30}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Sidebar list items */}
                <div className={cn("p-6 flex flex-col gap-5", baseBgClass)}>
                  <div className="flex justify-between items-center border-b border-border/60 pb-3">
                    <div className={cn("h-5 w-32 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    <div className={cn("h-4 w-12 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                  <div className="space-y-4 flex-1">
                    {Array.from({ length: 4 }).map((_, rIdx) => (
                      <div key={rIdx} className="flex items-center gap-3">
                        <div className={cn("h-10 w-10 rounded-lg shrink-0 shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                        <div className="flex-1 space-y-1.5">
                          <div className={cn("h-4 w-full rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                          <div className={cn("h-3 w-2/3 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* LAYOUT 3: MASTER DETAIL / PROFILE */}
        {resolvedType === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left side card - profile avatar info */}
            <div className={cn("p-6 flex flex-col items-center text-center gap-4", baseBgClass)}>
              <div className={cn("w-28 h-28 rounded-full shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              <div className="space-y-2 w-full flex flex-col items-center">
                <div className={cn("h-6 w-36 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-4 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="w-full border-t border-border/60 pt-4 mt-2 space-y-3">
                <div className="flex justify-between">
                  <div className={cn("h-3.5 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  <div className={cn("h-3.5 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                </div>
                <div className="flex justify-between">
                  <div className={cn("h-3.5 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  <div className={cn("h-3.5 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                </div>
              </div>
            </div>

            {/* Right side card - detailed list panels */}
            <div className={cn("md:col-span-2 p-6 space-y-6", baseBgClass)}>
              <div className="border-b border-border pb-4">
                <div className={cn("h-5 w-48 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, fIdx) => (
                  <div key={fIdx} className="space-y-2">
                    <div className={cn("h-3.5 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    <div className={cn("h-10 w-full rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  </div>
                ))}
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <div className={cn("h-10 w-24 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-10 w-32 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
            </div>
          </div>
        )}

        {/* LAYOUT 4: FORM / VOUCHER INPUTS SKELETON */}
        {resolvedType === 'form' && (
          <div className={cn("p-6 space-y-8", baseBgClass)}>
            {/* Header Voucher Detail Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-6 border-b border-border/80">
              <div className="space-y-2">
                <div className={cn("h-3.5 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-10 w-full rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="space-y-2">
                <div className={cn("h-3.5 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-10 w-full rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="space-y-2">
                <div className={cn("h-3.5 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-10 w-full rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="space-y-2">
                <div className={cn("h-3.5 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-10 w-full rounded-2xl shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
            </div>

            {/* Inner voucher items table lines */}
            <div className="space-y-4">
              <div className={cn("h-5 w-32 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              
              <div className="border border-border/80 rounded-xl overflow-hidden divide-y divide-border/60 bg-card/40">
                <div className="grid grid-cols-12 gap-2 bg-muted/30 px-4 py-3 text-xs font-semibold">
                  <div className="col-span-1">#</div>
                  <div className="col-span-5">Particulars / Stock Item</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Rate</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                {Array.from({ length: 3 }).map((_, fRow) => (
                  <div key={fRow} className="grid grid-cols-12 gap-2 items-center px-4 py-3">
                    <div className="col-span-1">
                      <div className={cn("h-6 w-5 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    <div className="col-span-5">
                      <div className={cn("h-7 w-[80%] rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    <div className="col-span-2">
                      <div className={cn("h-7 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    <div className="col-span-2">
                      <div className={cn("h-7 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <div className={cn("h-7 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Total / Meta Info Input and Submit Buttons */}
            <div className="flex flex-col md:flex-row justify-between gap-6 pt-4 items-end">
              <div className="space-y-2 w-full md:w-1/2">
                <div className={cn("h-3.5 w-16 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                <div className={cn("h-16 w-full rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
              </div>
              <div className="space-y-4 w-full md:w-1/3 flex flex-col items-end">
                <div className="flex justify-between w-full border-b pb-2">
                  <div className={cn("h-4 w-20 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  <div className={cn("h-4 w-24 rounded shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                </div>
                <div className="flex gap-3 mt-2">
                  <div className={cn("h-10 w-24 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                  <div className={cn("h-10 w-32 rounded-lg shimmer-active-", `shimmer-active-${uniqueId}`, itemBgClass)} />
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
