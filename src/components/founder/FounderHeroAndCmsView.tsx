import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Bell,
  Boxes,
  Check,
  Clock,
  Eye,
  FileText,
  Globe,
  LayoutDashboard,
  MessageSquare,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sliders,
  Sparkles,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { handleFirestoreError, OperationType } from '../../lib/firestore-errors';
import { erpService } from '../../services/erpService';
import { useSettings } from '../../contexts/SettingsContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { SiteContentEditor } from '../SiteContentEditor';
import { AppNotification, UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { CompanyStats, safeFormatDate } from './types';

interface FounderHeroAndCmsViewProps {
  notifications: AppNotification[];
  companies: CompanyStats[];
  allUsers: any[];
  currentUser: UserProfile | null;
  onRefresh: () => Promise<void>;
  onDirtyChange: (dirty: boolean) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FounderHeroAndCmsView: React.FC<FounderHeroAndCmsViewProps> = ({
  notifications,
  companies,
  allUsers,
  currentUser,
  onRefresh,
  onDirtyChange,
  showNotification,
}) => {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const {
    uiStyle,
    systemConfig,
    updateSystemSettings,
    landingPageEnabled,
    heroDesignStyle,
    heroThreeUiTheme,
    heroThreeUiGlowColor,
    heroThreeUiPerspective,
    heroThreeUiShowParticles,
    heroThreeUiShowFloatingBadges,
    heroThreeUiShowExperienceHubDemo,
    heroThreeUiShowSimulateVoucher,
    heroThreeUiEnableTiltDefault,
    heroShowExperienceHubDemo,
    heroShowExploreLiveDemo,
    heroShowFloatingQuickNav,
    heroEyebrowText,
    heroTitleText,
    heroSubtitleText,
    heroCtaPrimaryText,
    heroCtaDemoText,
    heroNavActionText,
    heroMetric1Value,
    heroMetric1Label,
    heroMetric2Value,
    heroMetric2Label,
    heroMetric3Value,
    heroMetric3Label,
  } = useSettings();

  const [subTab, setSubTab] = useState<'siteContent' | 'hero' | 'notifications' | 'inquiries'>('siteContent');

  // Inquiries (subscribed only while inquiries sub-tab is active)
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<any | null>(null);

  // Notifications modals
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [notifToDelete, setNotifToDelete] = useState<AppNotification | null>(null);
  const [isSubmittingNotif, setIsSubmittingNotif] = useState(false);
  const [newNotification, setNewNotification] = useState<Partial<AppNotification>>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    status: 'sent',
    scheduledAt: Timestamp.now(),
  });

  // Hero Engine draft state (read authoritatively from systemConfig first, fallback to resolved context)
  const rawSavedHeroStyle = systemConfig?.heroDesignStyle ?? heroDesignStyle;
  const normalizedHeroStyle =
    rawSavedHeroStyle === 'three-matrix' || rawSavedHeroStyle === 'three-interactive'
      ? 'monochrome-parallax'
      : rawSavedHeroStyle || 'monochrome-parallax';

  const initialHeroSnapshot = useMemo(
    () => ({
      landingPageEnabled: (systemConfig?.landingPageEnabled ?? landingPageEnabled) !== false,
      heroDesignStyle: normalizedHeroStyle,
      heroThreeUiTheme: heroThreeUiTheme || 'aurora-navy',
      heroThreeUiGlowColor: heroThreeUiGlowColor || 'cyan',
      heroThreeUiPerspective: heroThreeUiPerspective || 'cinematic',
      heroThreeUiShowParticles: heroThreeUiShowParticles ?? true,
      heroThreeUiShowFloatingBadges: heroThreeUiShowFloatingBadges ?? true,
      heroThreeUiShowExperienceHubDemo: heroThreeUiShowExperienceHubDemo ?? true,
      heroThreeUiShowSimulateVoucher: heroThreeUiShowSimulateVoucher ?? true,
      heroThreeUiEnableTiltDefault: heroThreeUiEnableTiltDefault ?? false,
      heroShowExperienceHubDemo: heroShowExperienceHubDemo ?? false,
      heroShowExploreLiveDemo: heroShowExploreLiveDemo ?? true,
      heroShowFloatingQuickNav: (systemConfig?.heroShowFloatingQuickNav ?? heroShowFloatingQuickNav) !== false,
      heroEyebrowText: heroEyebrowText || 'ERP ARCHITECTURE // SOVEREIGN FINANCIAL KERNEL',
      heroTitleText: heroTitleText || 'Absolute Truth in Commercial Ledgering.',
      heroSubtitleText:
        heroSubtitleText ||
        'Atomic double-entry balance computation, multi-location godown stock velocity, and board-level liquidity reporting on zero-overhead in-memory persistence. Pure accounting truth.',
      heroCtaPrimaryText: heroCtaPrimaryText || 'Enter Production Console',
      heroCtaDemoText: heroCtaDemoText || 'Experience Hub Demo',
      heroNavActionText: heroNavActionText || 'Launch Console',
      heroMetric1Value: heroMetric1Value || '0 ms',
      heroMetric1Label: heroMetric1Label || 'Balance Drift Latency',
      heroMetric2Value: heroMetric2Value || '100%',
      heroMetric2Label: heroMetric2Label || 'Real FIFO Valuation',
      heroMetric3Value: heroMetric3Value || 'Gold+',
      heroMetric3Label: heroMetric3Label || 'Quota Protection',
    }),
    [
      systemConfig?.landingPageEnabled,
      landingPageEnabled,
      normalizedHeroStyle,
      heroThreeUiTheme,
      heroThreeUiGlowColor,
      heroThreeUiPerspective,
      heroThreeUiShowParticles,
      heroThreeUiShowFloatingBadges,
      heroThreeUiShowExperienceHubDemo,
      heroThreeUiShowSimulateVoucher,
      heroThreeUiEnableTiltDefault,
      heroShowExperienceHubDemo,
      heroShowExploreLiveDemo,
      systemConfig?.heroShowFloatingQuickNav,
      heroShowFloatingQuickNav,
      heroEyebrowText,
      heroTitleText,
      heroSubtitleText,
      heroCtaPrimaryText,
      heroCtaDemoText,
      heroNavActionText,
      heroMetric1Value,
      heroMetric1Label,
      heroMetric2Value,
      heroMetric2Label,
      heroMetric3Value,
      heroMetric3Label,
    ]
  );

  const [heroDraft, setHeroDraft] = useState(initialHeroSnapshot);
  const [isSavingHero, setIsSavingHero] = useState(false);

  const isHeroDirty = useMemo(
    () => JSON.stringify(heroDraft) !== JSON.stringify(initialHeroSnapshot),
    [heroDraft, initialHeroSnapshot]
  );

  useEffect(() => {
    onDirtyChange(subTab === 'hero' && isHeroDirty);
  }, [subTab, isHeroDirty, onDirtyChange]);

  useEffect(() => {
    return () => onDirtyChange(false);
  }, [onDirtyChange]);

  // Sync draft when remote settings update and user hasn't modified draft
  useEffect(() => {
    if (!isHeroDirty) {
      setHeroDraft(initialHeroSnapshot);
    }
  }, [initialHeroSnapshot]);

  // Subscribe to inquiries only when inquiries sub-tab is active
  useEffect(() => {
    if (subTab !== 'inquiries') return;
    setInquiriesLoading(true);
    const q = query(collection(db, 'inquiries'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        setInquiries(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setInquiriesLoading(false);
      },
      (err) => {
        setInquiriesLoading(false);
        handleFirestoreError(err, OperationType.GET, 'inquiries');
      }
    );
    return () => unsubscribe();
  }, [subTab]);

  const handleSaveHero = async () => {
    setIsSavingHero(true);
    try {
      await updateSystemSettings(heroDraft);
      showNotification('Hero configuration saved successfully.', 'success');
    } catch {
      showNotification('Failed to save hero configuration.', 'error');
    } finally {
      setIsSavingHero(false);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) return;
    setIsSubmittingNotif(true);
    try {
      const data: any = {
        ...newNotification,
        createdBy: currentUser?.uid,
      };
      if (newNotification.status === 'sent') {
        data.sentAt = new Date();
      }
      await erpService.createNotification(data);
      setIsCreatingNotification(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        status: 'sent',
      });
      showNotification('Notification saved.', 'success');
      await onRefresh();
    } catch {
      showNotification('Failed to create notification.', 'error');
    } finally {
      setIsSubmittingNotif(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('siteContent')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'siteContent'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileText className="w-3.5 h-3.5" />
            Site Content & CMS
          </button>
          <button
            type="button"
            onClick={() => setSubTab('hero')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'hero'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Boxes className="w-3.5 h-3.5" />
            Hero Engine
            {isHeroDirty && <span className="w-2 h-2 rounded-full bg-amber-500" />}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('notifications')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'notifications'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Bell className="w-3.5 h-3.5" />
            System Notifications ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('inquiries')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'inquiries'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Visitor Inquiries
          </button>
        </div>

        {subTab === 'hero' && (
          <div className="flex items-center gap-2">
            {isHeroDirty && (
              <button
                type="button"
                onClick={() => setHeroDraft(initialHeroSnapshot)}
                className="px-3.5 py-2 border border-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Discard
              </button>
            )}
            <button
              type="button"
              disabled={isSavingHero}
              onClick={handleSaveHero}
              className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-md hover:opacity-90 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingHero ? 'Saving...' : 'Save Hero Configuration'}
            </button>
          </div>
        )}
      </div>

      {/* Sub-tab 1: Site Content CMS */}
      {subTab === 'siteContent' && <SiteContentEditor showNotification={showNotification} />}

      {/* Sub-tab 2: Hero Engine */}
      {subTab === 'hero' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-cyan-500/10 border border-blue-500/20 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                <Boxes className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  Landing Page Hero Engine
                  <span className="text-[9px] uppercase px-2 py-0.5 rounded-full font-mono font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">
                    ThreeUI Integrated
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure landing page visibility, hero architecture, copy, metrics, and ThreeUI 3D tilt presets.
                </p>
              </div>
            </div>
            <a
              href="/#/"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-background border border-border hover:border-primary/50 text-foreground text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 self-start sm:self-auto"
            >
              <Eye className="w-3.5 h-3.5 text-primary" />
              Preview Landing Page
              <ArrowRight className="w-3 h-3 text-muted-foreground" />
            </a>
          </div>

          {/* Public Access + Style Picker */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className={cn('w-4 h-4', heroDraft.landingPageEnabled ? 'text-emerald-500' : 'text-muted-foreground')} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Landing Page Public Access
                  </h4>
                  <span
                    className={cn(
                      'text-[9px] uppercase px-2 py-0.5 rounded font-mono font-bold',
                      heroDraft.landingPageEnabled
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                        : 'bg-red-500/15 text-red-500 border border-red-500/20'
                    )}
                  >
                    {heroDraft.landingPageEnabled ? 'PUBLIC LANDING ACTIVE' : 'OFF (DIRECT LOGIN ONLY)'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  When OFF, root visitors route directly to the login screen.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHeroDraft((p) => ({ ...p, landingPageEnabled: !p.landingPageEnabled }))
                }
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  heroDraft.landingPageEnabled ? 'bg-emerald-500' : 'bg-neutral-600'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition',
                    heroDraft.landingPageEnabled ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Sliders className={cn('w-4 h-4', heroDraft.heroShowFloatingQuickNav ? 'text-blue-500' : 'text-muted-foreground')} />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {isBn ? 'ফ্লোটিং কুইক-ন্যাভ ডক (৩টি বাটন)' : 'Hero Floating Quick-Nav Buttons (3 Icons)'}
                  </h4>
                  <span
                    className={cn(
                      'text-[9px] uppercase px-2 py-0.5 rounded font-mono font-bold',
                      heroDraft.heroShowFloatingQuickNav
                        ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                        : 'bg-slate-500/15 text-slate-400 border border-slate-500/20'
                    )}
                  >
                    {heroDraft.heroShowFloatingQuickNav
                      ? isBn ? 'চালু (ENABLED)' : 'ENABLED'
                      : isBn ? 'বন্ধ (DISABLED)' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isBn
                    ? 'হিরো পেজের ডান পাশে ভাসমান ৩টি সেকশন ন্যাভিগেশন বাটন (টেলিমেট্রি, ক্যাপাবিলিটিজ, আর্কিটেকচার) দেখান বা বন্ধ করুন।'
                    : 'Enable or disable the 3 floating right-edge section jump buttons (Telemetry, Capabilities, Architecture) across Hero designs.'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={heroDraft.heroShowFloatingQuickNav}
                aria-label={isBn ? 'ফ্লোটিং কুইক-ন্যাভ বাটন চালু বা বন্ধ করুন' : 'Toggle Hero Floating Quick-Nav Buttons'}
                onClick={() =>
                  setHeroDraft((p) => ({ ...p, heroShowFloatingQuickNav: !p.heroShowFloatingQuickNav }))
                }
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  heroDraft.heroShowFloatingQuickNav ? 'bg-emerald-500' : 'bg-neutral-600'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition',
                    heroDraft.heroShowFloatingQuickNav ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
            </div>

            <div className="flex items-center gap-2 border-b border-border pb-3">
              <LayoutDashboard className="w-4 h-4 text-primary" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Hero Design Architecture
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Select the active landing hero experience visible to visitors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'enterprise-ledger',
                  title: isBn ? 'এন্টারপ্রাইজ লেজার ও ওয়ার্কবেঞ্চ' : 'Enterprise Ledger & Workbench',
                  badge: isBn ? 'ওভারভিউ + ওয়ার্কস্পেস' : 'Entry + Workspace',
                  desc: isBn
                    ? 'এন্ট্রি/ওভারভিউ ও ওয়ার্কস্পেস মোডসহ দ্বি-তরফা ভাউচার, FIFO মাল্টি-গোডাউন স্টক, ১০টি কোর রিপোর্ট ও .xlsx এক্সপোর্ট প্রিভিউ।'
                    : 'Editorial ERP ledger workbench with Entry/Overview & Workspace lens, interactive Dr/Cr voucher preview, FIFO multi-godown stock, and 10 Core Reports.',
                },
                {
                  id: 'precision-enterprise',
                  title: isBn ? 'প্রিসিশন এডিটোরিয়াল ইআরপি' : 'Precision Editorial ERP',
                  badge: isBn ? 'এডিটোরিয়াল এন্টারপ্রাইজ' : 'Editorial Enterprise',
                  desc: isBn
                    ? 'লাইভ ইআরপি ওয়ার্কস্পেস, জেনারেল লেজার, FIFO স্টক এবং মুশক ভ্যাট মডিউলসহ পরিচ্ছন্ন এডিটোরিয়াল হিরো।'
                    : 'Architectural light editorial hero with live ERP workspace, General Ledger, FIFO Stock, and Mushak VAT modules.',
                },
                {
                  id: 'enterprise-saas',
                  title: isBn ? 'এন্টারপ্রাইজ স্যাস মকআপ' : 'QuickBooks & Xero',
                  badge: isBn ? 'এন্টারপ্রাইজ স্যাস' : 'Enterprise SaaS',
                  desc: isBn
                    ? 'ইন্টারেক্টিভ ল্যাপটপ ও ট্যাবলেট মকআপ এবং মেট্রিক কার্ডসহ রয়্যাল ব্লু ও হোয়াইট এন্টারপ্রাইজ স্যাস হিরো।'
                    : 'Royal Blue & White enterprise SaaS hero with interactive MacBook Pro & tablet mockup and metric cards.',
                },
                {
                  id: 'monochrome-parallax',
                  title: isBn ? 'মনোক্রম প্যারালাক্স ৩ডি' : 'Monochrome Parallax 3D',
                  badge: isBn ? 'Three.js + প্যারালাক্স' : 'Three.js + Parallax',
                  desc: isBn
                    ? 'Three.js ক্রিস্টাল মনোলিথ এবং ডুয়াল-অ্যাক্সিস প্যারালাক্স স্ক্রলিংসহ ব্ল্যাক অ্যান্ড হোয়াইট মনোক্রোম ডিজাইন।'
                    : 'Black & white monochromatic design with Three.js crystal monolith and dual-axis parallax scrolling.',
                },
                {
                  id: 'threeui',
                  title: isBn ? 'থ্রি-ইউআই ৩ডি হলোগ্রাম' : 'ThreeUI 3D Hologram',
                  badge: isBn ? 'আইসোমেট্রিক ৩ডি টিল্ট' : 'Isometric 3D Tilt',
                  desc: isBn
                    ? 'পার্টিকেল কনস্টেলেশন, লাইভ টেলিমেট্রি কাউন্টার এবং হলোগ্রাফিক অরাসহ আইসোমেট্রিক ৩ডি টিল্ট পার্সপেক্টিভ।'
                    : 'Isometric 3D tilt perspective with particle constellation, live telemetry counters, and holographic aura.',
                },
                {
                  id: 'default',
                  title: isBn ? 'ক্লাসিক ক্লিন লাইট স্যাস' : 'Classic Clean Light SaaS',
                  badge: isBn ? 'মিনিমালিস্ট হোয়াইট' : 'Minimalist White',
                  desc: isBn
                    ? 'সফট জ্যামিতিক ভেক্টর, ফ্ল্যাট ড্যাশবোর্ড কার্ড প্রিভিউ এবং ডিপার্টমেন্ট ট্যাবসহ স্ট্যান্ডার্ড ব্রাইট লেআউট।'
                    : 'Standard bright aesthetic with soft geometric vectors, flat dashboard card preview, and department tabs.',
                },
              ].map((styleOpt) => {
                const isSelected = heroDraft.heroDesignStyle === styleOpt.id;
                return (
                  <button
                    key={styleOpt.id}
                    type="button"
                    onClick={() =>
                      setHeroDraft((p) => ({ ...p, heroDesignStyle: styleOpt.id as any }))
                    }
                    className={cn(
                      'p-4 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between',
                      isSelected
                        ? 'border-primary bg-primary/5 shadow-md ring-1 ring-primary/20'
                        : 'border-border hover:border-muted-foreground/40 bg-background'
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                    <div className="space-y-1.5 pr-6">
                      <h5 className="text-xs font-extrabold text-foreground">{styleOpt.title}</h5>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{styleOpt.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>{styleOpt.badge}</span>
                      <span className={isSelected ? 'text-primary font-bold' : ''}>
                        {isSelected ? (isBn ? 'সক্রিয় / ডিফল্ট' : 'ACTIVE') : (isBn ? 'নির্বাচন করুন' : 'Select')}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Hero Content & CTA Buttons */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sliders className="w-4 h-4 text-primary" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Hero Content &amp; Buttons Customizer
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <p className="text-xs font-bold text-foreground">Show Experience Hub Demo Button</p>
                  <p className="text-[10px] text-muted-foreground">Display secondary Experience Hub trigger on hero</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setHeroDraft((p) => ({
                      ...p,
                      heroShowExperienceHubDemo: !p.heroShowExperienceHubDemo,
                    }))
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                    heroDraft.heroShowExperienceHubDemo ? 'bg-emerald-500' : 'bg-neutral-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                      heroDraft.heroShowExperienceHubDemo ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                <div>
                  <p className="text-xs font-bold text-foreground">Show Explore Live Demo Button</p>
                  <p className="text-[10px] text-muted-foreground">Display Explore Live Demo on Precision & SaaS heroes</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setHeroDraft((p) => ({
                      ...p,
                      heroShowExploreLiveDemo: !p.heroShowExploreLiveDemo,
                    }))
                  }
                  className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors',
                    heroDraft.heroShowExploreLiveDemo ? 'bg-emerald-500' : 'bg-neutral-600'
                  )}
                >
                  <span
                    className={cn(
                      'inline-block h-5 w-5 transform rounded-full bg-white shadow transition',
                      heroDraft.heroShowExploreLiveDemo ? 'translate-x-5' : 'translate-x-0'
                    )}
                  />
                </button>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Hero Eyebrow / Kicker Badge
                </label>
                <input
                  type="text"
                  value={heroDraft.heroEyebrowText}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroEyebrowText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Hero Main Headline Title
                </label>
                <input
                  type="text"
                  value={heroDraft.heroTitleText}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroTitleText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Hero Subtitle Description
                </label>
                <textarea
                  rows={2}
                  value={heroDraft.heroSubtitleText}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroSubtitleText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Primary CTA Button Text
                </label>
                <input
                  type="text"
                  value={heroDraft.heroCtaPrimaryText}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroCtaPrimaryText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Top Nav Launch Button Text
                </label>
                <input
                  type="text"
                  value={heroDraft.heroNavActionText}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroNavActionText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                  Experience Hub Demo Button Text
                </label>
                <input
                  type="text"
                  value={heroDraft.heroCtaDemoText}
                  onChange={(e) => setHeroDraft((p) => ({ ...p, heroCtaDemoText: e.target.value }))}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border">
              {[
                { idx: 1, valKey: 'heroMetric1Value' as const, lblKey: 'heroMetric1Label' as const },
                { idx: 2, valKey: 'heroMetric2Value' as const, lblKey: 'heroMetric2Label' as const },
                { idx: 3, valKey: 'heroMetric3Value' as const, lblKey: 'heroMetric3Label' as const },
              ].map((m) => (
                <div key={m.idx} className="p-3 rounded-lg border border-border bg-muted/10 space-y-2">
                  <span className="text-[9px] font-mono font-bold text-muted-foreground uppercase">
                    Metric {m.idx}
                  </span>
                  <input
                    type="text"
                    value={heroDraft[m.valKey]}
                    onChange={(e) => setHeroDraft((p) => ({ ...p, [m.valKey]: e.target.value }))}
                    className="w-full px-2.5 py-1 text-xs rounded border border-border bg-background font-mono font-bold"
                  />
                  <input
                    type="text"
                    value={heroDraft[m.lblKey]}
                    onChange={(e) => setHeroDraft((p) => ({ ...p, [m.lblKey]: e.target.value }))}
                    className="w-full px-2.5 py-1 text-[11px] rounded border border-border bg-background text-muted-foreground"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ThreeUI 3D Customizer */}
          <div
            className={cn(
              'bg-card border border-border rounded-xl p-5 space-y-5 shadow-xs',
              heroDraft.heroDesignStyle !== 'threeui' && 'opacity-85'
            )}
          >
            <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  ThreeUI 3D Dashboard Engine Customizer
                </h4>
              </div>
              {heroDraft.heroDesignStyle !== 'threeui' && (
                <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/20 font-bold">
                  Applies when ThreeUI style is active
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: 'aurora-navy', label: 'Aurora Navy', desc: 'Cosmic slate & cyan stars' },
                { id: 'cyber-dark', label: 'Cyber Dark', desc: 'OLED midnight black' },
                { id: 'emerald-obsidian', label: 'Emerald Matrix', desc: 'Obsidian & emerald glow' },
                { id: 'glass-light', label: 'Glass Light', desc: 'Frosted crystal light canvas' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setHeroDraft((p) => ({ ...p, heroThreeUiTheme: t.id as any }))}
                  className={cn(
                    'p-3 rounded-xl border text-left transition-all',
                    heroDraft.heroThreeUiTheme === t.id
                      ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500'
                      : 'border-border bg-background hover:bg-muted/50'
                  )}
                >
                  <p className="text-xs font-bold text-foreground">{t.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{t.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 p-4 bg-muted/20 border border-border rounded-xl">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                  Dynamic Glow Aura Reflection
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cyan', label: 'Cyan', color: 'bg-cyan-500' },
                    { id: 'emerald', label: 'Emerald', color: 'bg-emerald-500' },
                    { id: 'indigo', label: 'Indigo', color: 'bg-indigo-500' },
                    { id: 'amber', label: 'Amber', color: 'bg-amber-500' },
                  ].map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setHeroDraft((p) => ({ ...p, heroThreeUiGlowColor: g.id as any }))}
                      className={cn(
                        'py-2 px-1 rounded-lg border flex flex-col items-center gap-1',
                        heroDraft.heroThreeUiGlowColor === g.id
                          ? 'border-primary bg-primary/10 ring-1 ring-primary'
                          : 'border-border bg-background'
                      )}
                    >
                      <div className={cn('w-4 h-4 rounded-full', g.color)} />
                      <span className="text-[9px] font-bold">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 p-4 bg-muted/20 border border-border rounded-xl">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">
                  3D Isometric Tilt Sensitivity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'subtle', label: 'Subtle (±7°)' },
                    { id: 'cinematic', label: 'Cinematic (±12°)' },
                    { id: 'extreme', label: 'Extreme (±18°)' },
                  ].map((persp) => (
                    <button
                      key={persp.id}
                      type="button"
                      onClick={() =>
                        setHeroDraft((p) => ({ ...p, heroThreeUiPerspective: persp.id as any }))
                      }
                      className={cn(
                        'p-2 rounded-lg border text-[10px] font-bold',
                        heroDraft.heroThreeUiPerspective === persp.id
                          ? 'border-cyan-500 bg-cyan-500/10 ring-1 ring-cyan-500'
                          : 'border-border bg-background'
                      )}
                    >
                      {persp.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'heroThreeUiShowParticles' as const, label: 'Particle Constellations' },
                { key: 'heroThreeUiShowFloatingBadges' as const, label: '3D Floating Telemetry' },
                { key: 'heroThreeUiShowExperienceHubDemo' as const, label: 'Experience HUB Demo Trigger' },
                { key: 'heroThreeUiShowSimulateVoucher' as const, label: 'Simulate Voucher Pulse' },
                { key: 'heroThreeUiEnableTiltDefault' as const, label: 'Default 3D Tilt Enabled' },
              ].map((toggle) => (
                <div
                  key={toggle.key}
                  className="flex items-center justify-between p-3 bg-muted/20 border border-border rounded-xl"
                >
                  <span className="text-xs font-bold text-foreground">{toggle.label}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setHeroDraft((p) => ({ ...p, [toggle.key]: !p[toggle.key] }))
                    }
                    className={cn(
                      'w-10 h-5.5 rounded-full transition-colors relative shrink-0',
                      heroDraft[toggle.key] ? 'bg-cyan-500' : 'bg-neutral-600'
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white transition-all',
                        heroDraft[toggle.key] ? 'right-0.5' : 'left-0.5'
                      )}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: System Notifications */}
      {subTab === 'notifications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2
              className={cn(
                'text-lg font-bold uppercase tracking-widest',
                uiStyle === 'UI/UX 2' ? 'text-blue-600' : 'text-foreground'
              )}
            >
              System Notifications
            </h2>
            <button
              type="button"
              onClick={() => setIsCreatingNotification(true)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md',
                uiStyle === 'UI/UX 2'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-primary text-white hover:opacity-90'
              )}
            >
              <Plus className="w-4 h-4" />
              New Notification
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    'bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 transition-all',
                    uiStyle === 'UI/UX 2' && 'border-blue-100 shadow-md'
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        n.type === 'info'
                          ? 'bg-blue-500/10 text-blue-500'
                          : n.type === 'warning'
                          ? 'bg-amber-500/10 text-amber-500'
                          : n.type === 'success'
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : n.type === 'system_update'
                          ? 'bg-purple-500/10 text-purple-500'
                          : 'bg-rose-500/10 text-rose-500'
                      )}
                    >
                      {n.type === 'system_update' ? (
                        <Activity className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn('font-bold', uiStyle === 'UI/UX 2' ? 'text-blue-600' : 'text-foreground')}>
                          {n.title}
                        </h3>
                        <span
                          className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            n.status === 'sent'
                              ? 'bg-emerald-500/10 text-emerald-500'
                              : n.status === 'scheduled'
                              ? 'bg-blue-500/10 text-blue-500'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {n.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-4 pt-2 flex-wrap">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Target: {n.targetType.toUpperCase()} {n.targetId ? `(${n.targetId})` : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {n.status === 'scheduled'
                            ? `Scheduled: ${safeFormatDate(n.scheduledAt, 'dd MMM, HH:mm')}`
                            : `Sent: ${safeFormatDate(n.sentAt || n.createdAt, 'dd MMM, HH:mm')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifToDelete(n)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground italic">No notifications sent yet.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-tab 4: Visitor Inquiries */}
      {subTab === 'inquiries' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2
              className={cn(
                'text-lg font-bold uppercase tracking-widest',
                uiStyle === 'UI/UX 2' ? 'text-blue-600' : 'text-foreground'
              )}
            >
              Visitor Inquiries ({inquiries.length})
            </h2>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Live updates via Firestore
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b border-border">
                  <tr>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Sender Info
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Inquiry Subject
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Message Details
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Timestamp
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-6 align-middle">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {inquiriesLoading ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground italic align-middle">
                        Loading inquiries details...
                      </td>
                    </tr>
                  ) : inquiries.length > 0 ? (
                    inquiries.map((inquiry) => {
                      const date = inquiry.createdAt?.toDate
                        ? inquiry.createdAt.toDate().toLocaleString()
                        : inquiry.createdAt?.seconds
                        ? new Date(inquiry.createdAt.seconds * 1000).toLocaleString()
                        : 'N/A';
                      return (
                        <tr key={inquiry.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 align-middle">
                            <p className="text-sm font-bold text-foreground">{inquiry.name}</p>
                            <p className="text-xs text-muted-foreground font-mono select-all">{inquiry.email}</p>
                          </td>
                          <td className="p-4 font-semibold text-xs text-foreground align-middle">
                            {inquiry.subject}
                          </td>
                          <td className="p-4 max-w-sm align-middle">
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed">
                              {inquiry.message}
                            </p>
                          </td>
                          <td className="p-4 text-xs font-mono text-muted-foreground align-middle">{date}</td>
                          <td className="p-4 text-right px-6 align-middle">
                            <button
                              type="button"
                              onClick={() => setInquiryToDelete(inquiry)}
                              className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete inquiry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="p-12 text-center align-middle">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                        <p className="text-sm text-muted-foreground italic">No inquiries found yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      <AnimatePresence>
        {isCreatingNotification && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">New System Notification</h2>
                <button
                  type="button"
                  onClick={() => setIsCreatingNotification(false)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={newNotification.title || ''}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Notification Title"
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Message</label>
                  <textarea
                    value={newNotification.message || ''}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Enter your message here..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="info">Information</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="system_update">System Update</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Status</label>
                    <select
                      value={newNotification.status}
                      onChange={(e) => setNewNotification({ ...newNotification, status: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="sent">Send Now</option>
                      <option value="scheduled">Schedule for Later</option>
                      <option value="draft">Save as Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Type</label>
                    <select
                      value={newNotification.targetType}
                      onChange={(e) =>
                        setNewNotification({
                          ...newNotification,
                          targetType: e.target.value as any,
                          targetId: '',
                        })
                      }
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="all">All Users</option>
                      <option value="company">Specific Company</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>
                  {newNotification.targetType !== 'all' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Target</label>
                      {newNotification.targetType === 'company' ? (
                        <select
                          value={newNotification.targetId || ''}
                          onChange={(e) => setNewNotification({ ...newNotification, targetId: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="">Select Company</option>
                          {companies.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={newNotification.targetId || ''}
                          onChange={(e) => setNewNotification({ ...newNotification, targetId: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="">Select User</option>
                          {allUsers.map((u) => (
                            <option key={u.uid} value={u.uid}>
                              {u.displayName || u.email}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {newNotification.status === 'scheduled' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">
                      Schedule Date &amp; Time
                    </label>
                    <input
                      type="datetime-local"
                      onChange={(e) => {
                        if (e.target.value) {
                          setNewNotification({
                            ...newNotification,
                            scheduledAt: Timestamp.fromDate(new Date(e.target.value)),
                          });
                        }
                      }}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNotification(false)}
                    className="flex-1 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateNotification}
                    disabled={isSubmittingNotif || !newNotification.title || !newNotification.message}
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {newNotification.status === 'sent' ? 'Send Now' : 'Save Notification'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Notification Confirmation Modal */}
      <AnimatePresence>
        {notifToDelete && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Notification?</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Remove notification <span className="font-semibold text-foreground">{notifToDelete.title}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setNotifToDelete(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await erpService.deleteNotification(notifToDelete.id);
                      setNotifToDelete(null);
                      showNotification('Notification deleted.', 'success');
                      await onRefresh();
                    } catch {
                      showNotification('Failed to delete notification.', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Inquiry Confirmation Modal */}
      <AnimatePresence>
        {inquiryToDelete && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Inquiry?</h3>
              </div>
              <p className="text-xs text-muted-foreground">
                Delete visitor inquiry from <span className="font-semibold text-foreground">{inquiryToDelete.name}</span>?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setInquiryToDelete(null)}
                  className="px-4 py-2 text-xs font-bold uppercase text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await deleteDoc(doc(db, 'inquiries', inquiryToDelete.id));
                      setInquiryToDelete(null);
                      showNotification('Inquiry deleted successfully.', 'success');
                    } catch {
                      showNotification('Failed to delete inquiry.', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
