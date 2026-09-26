import React from 'react';
import {
  FileQuestion,
  FileSpreadsheet,
  Search,
  BarChart3,
  PackageOpen,
  Receipt,
  Users,
  Layers,
  FilterX,
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Plus,
  LucideIcon
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';

export type EmptyStateVariant = 
  | 'default' 
  | 'reports' 
  | 'search' 
  | 'dashboard' 
  | 'orders' 
  | 'inventory' 
  | 'vouchers' 
  | 'payroll' 
  | 'filter';

export type EmptyStateSize = 'sm' | 'md' | 'lg';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline';
}

export interface EmptyStateProps {
  /** Variant determines the default icon set and color accents */
  variant?: EmptyStateVariant;
  /** Primary headline */
  title?: string;
  /** Explanatory description */
  description?: string;
  /** Override the main center icon */
  icon?: LucideIcon;
  /** Sizing for padding and icon dimension */
  size?: EmptyStateSize;
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Optional custom action node */
  customAction?: React.ReactNode;
  /** If provided, renders as a <tr><td colSpan={colSpan}> container for table usage */
  colSpan?: number;
  /** Extra wrapper classes */
  className?: string;
  /** Subtle background style */
  showCardBackground?: boolean;
}

const VARIANT_CONFIGS: Record<
  EmptyStateVariant,
  {
    icon: LucideIcon;
    floatingIcon1: LucideIcon;
    floatingIcon2: LucideIcon;
    gradient: string;
    iconColor: string;
    badgeBg: string;
    defaultTitleEn: string;
    defaultTitleBn: string;
    defaultDescEn: string;
    defaultDescBn: string;
  }
> = {
  default: {
    icon: FolderOpen,
    floatingIcon1: Layers,
    floatingIcon2: Sparkles,
    gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    iconColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-950/50 border-blue-200/60 dark:border-blue-800/40',
    defaultTitleEn: 'No records available',
    defaultTitleBn: 'কোনো রেকর্ড পাওয়া যায়নি',
    defaultDescEn: 'There is no data to display right now.',
    defaultDescBn: 'এই মুহূর্তে প্রদর্শনের জন্য কোনো তথ্য নেই।'
  },
  reports: {
    icon: FileSpreadsheet,
    floatingIcon1: BarChart3,
    floatingIcon2: FileQuestion,
    gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/40',
    defaultTitleEn: 'No report data for this period',
    defaultTitleBn: 'নির্বাচিত সময়ে কোনো রিপোর্ট ডাটা নেই',
    defaultDescEn: 'Try selecting a different date range or adjusting report parameters.',
    defaultDescBn: 'অন্য কোনো তারিখ নির্বাচন করুন অথবা রিপোর্টের ফিল্টার পরিবর্তন করে দেখুন।'
  },
  search: {
    icon: Search,
    floatingIcon1: FilterX,
    floatingIcon2: Sparkles,
    gradient: 'from-purple-500/10 via-indigo-500/5 to-transparent',
    iconColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/50 border-purple-200/60 dark:border-purple-800/40',
    defaultTitleEn: 'No matching results found',
    defaultTitleBn: 'কোনো ফলাফল পাওয়া যায়নি',
    defaultDescEn: 'We could not find any records matching your search query. Check for typos or clear filters.',
    defaultDescBn: 'আপনার অনুসন্ধানের সাথে মিল পাওয়া যায়নি। বানান চেক করুন অথবা ফিল্টার ক্লিয়ার করুন।'
  },
  filter: {
    icon: FilterX,
    floatingIcon1: Search,
    floatingIcon2: RefreshCw,
    gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/40',
    defaultTitleEn: 'No records match the applied filters',
    defaultTitleBn: 'ফিল্টারের শর্ত অনুযায়ী কোনো তথ্য নেই',
    defaultDescEn: 'Try clearing some filters or widening the parameters to see more records.',
    defaultDescBn: 'ফিল্টার শিথিল করুন বা ক্লিয়ার করে নতুন করে দেখুন।'
  },
  dashboard: {
    icon: BarChart3,
    floatingIcon1: Sparkles,
    floatingIcon2: Layers,
    gradient: 'from-cyan-500/10 via-blue-500/5 to-transparent',
    iconColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/50 border-cyan-200/60 dark:border-cyan-800/40',
    defaultTitleEn: 'No metrics to display',
    defaultTitleBn: 'প্রদর্শনের জন্য মেট্রিক্স নেই',
    defaultDescEn: 'Once transactions and activities are recorded, dashboard analytics will populate here.',
    defaultDescBn: 'লেনদেন ও কার্যক্রম রেকর্ড হওয়া শুরু হলে এখানে স্বয়ংক্রিয়ভাবে অ্যানালিটিক্স দেখা যাবে।'
  },
  orders: {
    icon: PackageOpen,
    floatingIcon1: BarChart3,
    floatingIcon2: Sparkles,
    gradient: 'from-amber-500/10 via-yellow-500/5 to-transparent',
    iconColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200/60 dark:border-amber-800/40',
    defaultTitleEn: 'No orders recorded',
    defaultTitleBn: 'কোনো অর্ডার রেকর্ড নেই',
    defaultDescEn: 'No customer orders or purchase orders found for this selection.',
    defaultDescBn: 'এই নির্বাচনের জন্য কোনো বিক্রয় বা ক্রয় অর্ডার পাওয়া যায়নি।'
  },
  inventory: {
    icon: PackageOpen,
    floatingIcon1: Layers,
    floatingIcon2: BarChart3,
    gradient: 'from-emerald-500/10 via-lime-500/5 to-transparent',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200/60 dark:border-emerald-800/40',
    defaultTitleEn: 'No inventory items found',
    defaultTitleBn: 'কোনো ইনভেন্টরি আইটেম পাওয়া যায়নি',
    defaultDescEn: 'Add items or check your godown/category filters to inspect stock.',
    defaultDescBn: 'আইটেম যোগ করুন অথবা গোডাউন ও ক্যাটাগরি ফিল্টার চেক করুন।'
  },
  vouchers: {
    icon: Receipt,
    floatingIcon1: Layers,
    floatingIcon2: Sparkles,
    gradient: 'from-indigo-500/10 via-blue-500/5 to-transparent',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200/60 dark:border-indigo-800/40',
    defaultTitleEn: 'No vouchers recorded',
    defaultTitleBn: 'কোনো ভাউচার পাওয়া যায়নি',
    defaultDescEn: 'No journal, sales, payment, or receipt transactions recorded yet.',
    defaultDescBn: 'এখনও পর্যন্ত কোনো ভাউচার বা লেনদেন এন্ট্রি করা হয়নি।'
  },
  payroll: {
    icon: Users,
    floatingIcon1: Layers,
    floatingIcon2: Sparkles,
    gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
    iconColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-950/50 border-rose-200/60 dark:border-rose-800/40',
    defaultTitleEn: 'No payroll records',
    defaultTitleBn: 'কোনো পে-রোল রেকর্ড পাওয়া যায়নি',
    defaultDescEn: 'Salary sheets, attendance, or bonus records are not available for this period.',
    defaultDescBn: 'এই সময়ের জন্য কোনো বেতন শিট, উপস্থিতি বা বোনাস রেকর্ড তৈরি হয়নি।'
  }
};

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon: CustomIcon,
  size = 'md',
  action,
  secondaryAction,
  customAction,
  colSpan,
  className,
  showCardBackground = false
}: EmptyStateProps) {
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const config = VARIANT_CONFIGS[variant] || VARIANT_CONFIGS.default;
  const MainIcon = CustomIcon || config.icon;
  const FloatIcon1 = config.floatingIcon1;
  const FloatIcon2 = config.floatingIcon2;

  const displayTitle = title || (isBn ? config.defaultTitleBn : config.defaultTitleEn);
  const displayDesc = description || (isBn ? config.defaultDescBn : config.defaultDescEn);

  // Size styling tokens
  const sizeClasses = {
    sm: {
      wrapper: 'py-6 px-4',
      illustration: 'w-14 h-14',
      centerCircle: 'w-11 h-11',
      mainIcon: 'w-5 h-5',
      float1: 'w-5 h-5 -top-1 -right-1',
      float2: 'w-5 h-5 -bottom-1 -left-1',
      floatIcon: 'w-2.5 h-2.5',
      title: 'text-xs font-bold',
      desc: 'text-[11px] max-w-xs mt-0.5',
      btn: 'px-2.5 py-1 text-[11px]'
    },
    md: {
      wrapper: 'py-10 px-6',
      illustration: 'w-20 h-20',
      centerCircle: 'w-16 h-16',
      mainIcon: 'w-8 h-8',
      float1: 'w-7 h-7 -top-1.5 -right-1.5',
      float2: 'w-7 h-7 -bottom-1.5 -left-1.5',
      floatIcon: 'w-3.5 h-3.5',
      title: 'text-sm sm:text-base font-bold',
      desc: 'text-xs sm:text-[13px] max-w-md mt-1',
      btn: 'px-3.5 py-1.5 text-xs'
    },
    lg: {
      wrapper: 'py-14 sm:py-20 px-6',
      illustration: 'w-28 h-28',
      centerCircle: 'w-20 h-20',
      mainIcon: 'w-10 h-10',
      float1: 'w-9 h-9 -top-2 -right-2',
      float2: 'w-9 h-9 -bottom-2 -left-2',
      floatIcon: 'w-4 h-4',
      title: 'text-base sm:text-lg font-black tracking-tight',
      desc: 'text-xs sm:text-sm max-w-lg mt-1.5',
      btn: 'px-4 py-2 text-xs sm:text-sm'
    }
  }[size];

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center select-none transition-all',
        sizeClasses.wrapper,
        showCardBackground && 'bg-card/60 backdrop-blur-xs border border-border/70 rounded-2xl shadow-xs',
        className
      )}
    >
      {/* Subtle Layered Illustration */}
      <div className={cn('relative flex items-center justify-center', sizeClasses.illustration)}>
        {/* Soft Background Radial Gradient Halo */}
        <div
          className={cn(
            'absolute inset-0 rounded-full bg-gradient-to-tr blur-md opacity-70 dark:opacity-50 transition-opacity',
            config.gradient
          )}
        />

        {/* Outer concentric subtle ring */}
        <div className="absolute inset-1 rounded-full border border-dashed border-border/80 dark:border-border/40 animate-[spin_60s_linear_infinite]" />

        {/* Central Icon Badge */}
        <div
          className={cn(
            'relative z-10 flex items-center justify-center rounded-2xl shadow-sm border transition-transform duration-300 hover:scale-105',
            sizeClasses.centerCircle,
            config.badgeBg
          )}
        >
          <MainIcon className={cn(sizeClasses.mainIcon, config.iconColor, 'transition-transform duration-300')} />
        </div>

        {/* Floating Mini Satellite Badge 1 (Top-Right) */}
        <div
          className={cn(
            'absolute z-20 flex items-center justify-center rounded-full bg-card border border-border shadow-xs text-muted-foreground transition-all duration-300 hover:scale-110',
            sizeClasses.float1
          )}
        >
          <FloatIcon1 className={sizeClasses.floatIcon} />
        </div>

        {/* Floating Mini Satellite Badge 2 (Bottom-Left) */}
        <div
          className={cn(
            'absolute z-20 flex items-center justify-center rounded-full bg-card border border-border shadow-xs text-muted-foreground transition-all duration-300 hover:scale-110',
            sizeClasses.float2
          )}
        >
          <FloatIcon2 className={sizeClasses.floatIcon} />
        </div>
      </div>

      {/* Primary Headline */}
      <h4 className={cn('text-foreground font-semibold tracking-normal text-balance mt-3.5', sizeClasses.title)}>
        {displayTitle}
      </h4>

      {/* Explanatory Subtitle */}
      {displayDesc && (
        <p className={cn('text-muted-foreground leading-relaxed text-balance', sizeClasses.desc)}>
          {displayDesc}
        </p>
      )}

      {/* Action Buttons / Custom Actions */}
      {(action || secondaryAction || customAction) && (
        <div className="mt-4 flex items-center justify-center gap-2.5 flex-wrap">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className={cn(
                'inline-flex items-center gap-1.5 font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95',
                sizeClasses.btn,
                action.variant === 'secondary'
                  ? 'bg-muted hover:bg-muted/80 text-foreground border border-border'
                  : action.variant === 'outline'
                  ? 'bg-transparent hover:bg-muted text-foreground border border-border'
                  : 'bg-primary hover:bg-primary/90 text-primary-foreground'
              )}
            >
              {action.icon && <action.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{action.label}</span>
            </button>
          )}

          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              className={cn(
                'inline-flex items-center gap-1.5 font-bold rounded-xl transition-all cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground border border-border/80 active:scale-95',
                sizeClasses.btn
              )}
            >
              {secondaryAction.icon && <secondaryAction.icon className="w-3.5 h-3.5 shrink-0" />}
              <span>{secondaryAction.label}</span>
            </button>
          )}

          {customAction}
        </div>
      )}
    </div>
  );

  // If used inside a table, wrap in <tr><td colSpan={...}>
  if (typeof colSpan === 'number' && colSpan > 0) {
    return (
      <tr className="border-b-0 hover:bg-transparent">
        <td colSpan={colSpan} className="p-0 border-0 bg-transparent text-center">
          {content}
        </td>
      </tr>
    );
  }

  return content;
}

export default EmptyState;
