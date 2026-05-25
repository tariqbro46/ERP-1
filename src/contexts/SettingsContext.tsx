import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { erpService } from '../services/erpService';
import { doc, onSnapshot, collection, getDocFromServer, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SubscriptionPlan } from '../types';
import { FeatureCategory, APP_FEATURES } from '../constants/features';

interface NotificationSettings {
  voucherSaved: string;
  ledgerCreated: string;
  itemCreated: string;
  settingsUpdated: string;
}

interface FeatureSettings {
  id: string;
  label: string;
  enabled: boolean;
}

export type MenuBarStyle = 'classic' | 'ribbon' | 'macos' | 'windows11' | 'colorful';
export type ReportLayout = 'Layout 1' | 'Layout 2';
export type DashboardDesign = 'Design 1' | 'Design 2' | 'Design 3' | 'Design 4' | 'Design 5' | 'Design 6';
export type UIStyle = 'UI/UX 1' | 'UI/UX 2' | 'UI/UX 3' | 'UI/UX 4';
export type NotificationAnimationStyle = 'default' | 'neon' | 'snake' | 'liquid' | 'glitch' | 'shimmer';
export type GlassBackground = 'default' | 'sunset' | 'ocean' | 'aurora' | 'minimal';

export interface SidebarBgOption {
  id: string;
  label: string;
  labelBn: string;
  className: string;
  isDark: boolean;
}

export interface SidebarTextOption {
  id: string;
  label: string;
  labelBn: string;
  textClass: string;
  activeClass: string;
  mutedClass: string;
  lightTextClass?: string;
  lightActiveClass?: string;
  lightMutedClass?: string;
}

export const SIDEBAR_BG_OPTIONS: SidebarBgOption[] = [
  { id: 'default', label: 'Theme Default', labelBn: 'থিম ডিফল্ট', className: '', isDark: true },
  { id: 'aurora-night', label: 'Midnight Aurora Navy', labelBn: 'মিডনাইট অরোরা নেভি', className: 'bg-gradient-to-b from-[#0a0f26] via-[#040614] to-[#0d0e23] border-r border-[#312e81]/40 shadow-[6px_0_30px_rgba(4,6,18,0.5)] text-slate-100', isDark: true },
  { id: 'deep-forest', label: 'Imperial Emerald Jade', labelBn: 'ইম্পেরিয়াল এমারেল্ড জেড', className: 'bg-gradient-to-b from-[#02180e] via-[#010e09] to-[#042416] border-r border-emerald-900/40 shadow-[6px_0_30px_rgba(2,10,6,0.4)] text-emerald-100', isDark: true },
  { id: 'burgundy-velvet', label: 'Burgundy Silk Velvet', labelBn: 'বারগান্ডি সিল্ক ভেলভেট', className: 'bg-gradient-to-b from-[#1c0209] via-[#0f0105] to-[#250310] border-r border-rose-950/40 shadow-[6px_0_30px_rgba(15,2,4,0.4)] text-rose-100', isDark: true },
  { id: 'obsidian-gold', label: 'Obsidian & Liquid Gold', labelBn: 'অবসিডিয়ান ও লিকুইড গোল্ড', className: 'bg-gradient-to-b from-[#050505] via-[#121212] to-[#0a0a0a] border-r border-amber-950/30 shadow-[10px_0_40px_rgba(0,0,0,0.7)] text-[#fef3c7]', isDark: true },
  { id: 'nordic-alabaster', label: 'Nordic Minimal Alabaster', labelBn: 'ক্লাসিক মিনিমাল আলবাস্টার', className: 'bg-[#fafaf9] border-r border-stone-200 text-stone-800 shadow-sm', isDark: false },
  { id: 'cyberpunk-carbon', label: 'Cyberpunk Neon Carbon', labelBn: 'সাইবারপাঙ্ক নিওন কার্বন', className: 'bg-[#0b0e14] border-r border-cyan-500/20 text-[#22d3ee] shadow-[6px_0_24px_rgba(6,182,212,0.15)]', isDark: true }
];

export const SIDEBAR_TEXT_OPTIONS: SidebarTextOption[] = [
  { id: 'default', label: 'Theme Default', labelBn: 'থিম ডিফল্ট', textClass: '', activeClass: '', mutedClass: '' },
  { id: 'electric-cyan', label: 'Nebula Electric Cyan', labelBn: 'নেবুলা ইলেকট্রিক সায়ান', textClass: 'text-slate-400 hover:text-cyan-300', activeClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-400', mutedClass: 'text-cyan-500/80', lightTextClass: 'text-stone-600 hover:text-cyan-600', lightActiveClass: 'text-cyan-700 bg-cyan-50 border-cyan-500', lightMutedClass: 'text-cyan-600' },
  { id: 'emerald', label: 'Vaporwave Mint Green', labelBn: 'ভেপারওয়েভ মিন্ট গ্রিন', textClass: 'text-slate-400 hover:text-emerald-300', activeClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-400', mutedClass: 'text-emerald-500/80', lightTextClass: 'text-stone-600 hover:text-emerald-600', lightActiveClass: 'text-emerald-700 bg-emerald-50 border-emerald-500', lightMutedClass: 'text-emerald-600' },
  { id: 'gold-ink', label: 'Golden Imperial Ink', labelBn: 'গোল্ডেন ইম্পেরিয়াল ইঙ্ক', textClass: 'text-slate-400 hover:text-amber-200', activeClass: 'text-amber-400 bg-amber-500/10 border-amber-400', mutedClass: 'text-amber-500/80', lightTextClass: 'text-stone-600 hover:text-amber-700', lightActiveClass: 'text-amber-850 bg-amber-500/5 border-amber-600', lightMutedClass: 'text-amber-600' },
  { id: 'royal-lilac', label: 'Royal Orchid Lilac', labelBn: 'রয়েল অর্কিড লাইলাক', textClass: 'text-slate-400 hover:text-indigo-300', activeClass: 'text-indigo-400 bg-indigo-500/10 border-indigo-400', mutedClass: 'text-indigo-500/80', lightTextClass: 'text-stone-600 hover:text-indigo-600', lightActiveClass: 'text-indigo-700 bg-indigo-50 border-indigo-500', lightMutedClass: 'text-indigo-600' },
  { id: 'rose-cherry', label: 'Sunset Cherry Blossom', labelBn: 'সানসেট চেরি ব্লসম', textClass: 'text-slate-400 hover:text-rose-300', activeClass: 'text-rose-400 bg-rose-500/10 border-rose-400', mutedClass: 'text-rose-500/80', lightTextClass: 'text-stone-600 hover:text-rose-600', lightActiveClass: 'text-rose-700 bg-[#fff1f2] border-rose-500', lightMutedClass: 'text-rose-600' },
  { id: 'sleek-stark', label: 'Minimal Stark Charcoal', labelBn: 'মিনিমাল ডার্ক চারকোল', textClass: 'text-slate-400 hover:text-white', activeClass: 'text-white bg-white/10 border-white', mutedClass: 'text-slate-400', lightTextClass: 'text-stone-600 hover:text-stone-900', lightActiveClass: 'text-stone-950 bg-stone-100 border-stone-800', lightMutedClass: 'text-stone-500' }
];

interface WhatsAppTemplates {
  Sales: string;
  Purchase: string;
  Payment: string;
  Receipt: string;
}

interface SettingsContextType {
  companyName: string;
  companyLogo?: string;
  systemLogo?: string;
  systemFavicon?: string;
  companyAddress: string;
  slogan: string;
  financialYearStart: string;
  financialYearEnd: string;
  printHeader: string;
  printFooter: string;
  printPhone: string;
  printEmail: string;
  printWebsite: string;
  showPrintHeader: boolean;
  showPrintPhone: boolean;
  showPrintEmail: boolean;
  showPrintWebsite: boolean;
  showPrintFooter: boolean;
  printSignature1: string;
  printSignature2: string;
  printSignature3: string;
  showSignature1: boolean;
  showSignature2: boolean;
  showSignature3: boolean;
  signatureAlignment: 'left' | 'center' | 'right' | 'spread';
  showDeveloperContact: boolean;
  baseCurrencySymbol: string;
  timezone: string;
  refNoFormat: string;
  showFreeQty: boolean;
  showDiscPercent: boolean;
  showTaxPercent: boolean;
  showCurrency: boolean;
  showExRate: boolean;
  showSalesperson: boolean;
  showRunningBalance: boolean;
  showMobileNav: boolean;
  mobileBottomNavItems: string[];
  dateFormat: string;
  voucherHeaderCompact: boolean;
  voucherTableCompact: boolean;
  reportLayout: ReportLayout;
  dashboardDesign: DashboardDesign;
  globalDashboardDesign?: DashboardDesign;
  menuBarStyle: MenuBarStyle;
  layoutWidth: 'responsive' | 'constrained';
  sidebarDefaultExpanded: boolean;
  enableTax: boolean;
  enableCRM: boolean;
  enableSupplyChain: boolean;
  enableInventory: boolean;
  enableDataExport: boolean;
  enableAI: boolean;
  enableHelpButton: boolean;
  pwaEnabled: boolean;
  uiStyle: UIStyle;
  systemUiStyle?: UIStyle;
  systemMenuBarStyle?: MenuBarStyle;
  sidebarBgColor?: string;
  sidebarTextColor?: string;
  glassBackground: GlassBackground;
  notificationDuration: number;
  notificationAnimationStyle: NotificationAnimationStyle;
  appVersion: string;
  englishFont: string;
  banglaFont: string;
  statusOnlineText: string;
  statusOfflineText: string;
  statusErrorText: string;
  showGoToShortcut: boolean;
  showScrollingBar: boolean;
  showQuickActions: boolean;
  dashboardQuickActions: string[];
  dashboardCards: string[];
  whatsappTemplates: WhatsAppTemplates;
  notifications: NotificationSettings;
  searchPlaceholder?: string;
  searchHelpText?: string;
  showSearchShortcut?: boolean;
  searchIconColor?: string;
  loaderBlurStyle?: 'sm' | 'md' | 'lg' | 'none';
  loaderIconStyle?: 'spinner' | 'dots' | 'circle-bar' | 'quantum';
  loaderPhrases?: string;
  loaderTheme?: 'dark' | 'light' | 'glass';
  adaptiveLoaderEnabled?: boolean;
  showQuickCalculator?: boolean;
  showPinnedBookmarks?: boolean;
  customControlCenterTheme?: 'emerald' | 'indigo' | 'slate' | 'cyber';
  customWelcomeMessage?: string;
  splashSubDesign?: 'grid' | 'neon' | 'editorial';
  skeletonEnabled?: boolean;
  skeletonDashboardOnly?: boolean;
  skeletonType?: 'automatic' | 'table' | 'cards' | 'profile' | 'form';
  skeletonSpeed?: 'slow' | 'normal' | 'fast';
  skeletonTheme?: 'classic' | 'modern' | 'glass' | 'neon';
  skeletonRows?: number;
  skeletonWaveColor?: string;
  features: FeatureSettings[];
  appFeatures: FeatureCategory[];
  subscriptionPlans: SubscriptionPlan[];
  activePlan?: SubscriptionPlan;
  userSettings: any;
  loading?: boolean;
  updateSettings: (newSettings: Partial<SettingsContextType>) => void;
  updateSystemSettings: (newSettings: any) => Promise<void>;
  updateFeaturesSettings: (newFeatures: FeatureCategory[]) => Promise<void>;
  updateUserSettings: (newSettings: any) => Promise<void>;
}

const defaultSettings: SettingsContextType = {
  companyName: 'TallyFlow ERP',
  companyLogo: '',
  systemLogo: '',
  systemFavicon: '',
  companyAddress: 'Dhaka, Bangladesh',
  slogan: 'Enterprise ERP Solution',
  financialYearStart: '2024-04-01',
  financialYearEnd: '2025-03-31',
  printHeader: 'Official Document',
  printFooter: 'Thank you for your business.',
  printPhone: '+880 1234 567890',
  printEmail: 'info@tallyflow.erp',
  printWebsite: 'www.tallyflow.erp',
  showPrintHeader: true,
  showPrintPhone: true,
  showPrintEmail: true,
  showPrintWebsite: true,
  showPrintFooter: true,
  printSignature1: 'Prepared By',
  printSignature2: 'Authorized Signatory',
  printSignature3: "Receiver's Signature",
  showSignature1: true,
  showSignature2: true,
  showSignature3: true,
  signatureAlignment: 'spread',
  showDeveloperContact: true,
  baseCurrencySymbol: '৳',
  timezone: 'UTC+06:00 (Dhaka)',
  refNoFormat: 'SAL/{YEAR}/{NO}',
  showFreeQty: true,
  showDiscPercent: true,
  showTaxPercent: true,
  showCurrency: true,
  showExRate: true,
  showSalesperson: true,
  showRunningBalance: true,
  showMobileNav: false,
  mobileBottomNavItems: ['Dashboard', 'Voucher Entry', 'Daybook', 'Settings (F11)'],
  dateFormat: 'DD-MM-YYYY',
  voucherHeaderCompact: false,
  voucherTableCompact: false,
  reportLayout: 'Layout 2',
  dashboardDesign: 'Design 1',
  menuBarStyle: 'classic',
  layoutWidth: 'constrained',
  sidebarDefaultExpanded: true,
  enableTax: true,
  enableCRM: true,
  enableSupplyChain: true,
  enableInventory: true,
  enableDataExport: true,
  enableAI: true,
  enableHelpButton: true,
  pwaEnabled: true,
  showScrollingBar: false,
  uiStyle: 'UI/UX 1',
  systemUiStyle: undefined,
  systemMenuBarStyle: undefined,
  sidebarBgColor: 'default',
  sidebarTextColor: 'default',
  glassBackground: 'default',
  notificationDuration: 5000,
  notificationAnimationStyle: 'default',
  appVersion: 'v1.0.1',
  englishFont: 'Inter',
  banglaFont: 'Hind Siliguri',
  statusOnlineText: 'Status: Online',
  statusOfflineText: 'Status: Offline',
  statusErrorText: 'Database Error',
  loaderBlurStyle: 'md',
  loaderIconStyle: 'spinner',
  loaderPhrases: 'Connecting to server, Requesting data, Waiting for response, Almost done, Here we go!',
  loaderTheme: 'glass',
  adaptiveLoaderEnabled: true,
  showQuickCalculator: true,
  showPinnedBookmarks: true,
  customControlCenterTheme: 'emerald',
  customWelcomeMessage: 'Executive Command Center',
  splashSubDesign: 'grid',
  skeletonEnabled: true,
  skeletonDashboardOnly: true,
  skeletonType: 'automatic',
  skeletonSpeed: 'normal',
  skeletonTheme: 'modern',
  skeletonRows: 5,
  skeletonWaveColor: 'indigo',
  showGoToShortcut: true,
  showQuickActions: true,
  dashboardQuickActions: ['voucher', 'item', 'ledger', 'godown', 'users'],
  dashboardCards: ['revenue', 'profit', 'ledgers', 'stock'],
  whatsappTemplates: {
    Sales: "*{{companyName}}*\nSales Voucher No: {{voucherNo}}\nDate: {{date}}\nAmount: {{currency}} {{totalAmount}}\n\nShared via TallyFlow ERP",
    Purchase: "*{{companyName}}*\nPurchase Voucher No: {{voucherNo}}\nDate: {{date}}\nAmount: {{currency}} {{totalAmount}}\n\nShared via TallyFlow ERP",
    Payment: "*{{companyName}}*\nPayment Voucher No: {{voucherNo}}\nDate: {{date}}\nAmount: {{currency}} {{totalAmount}}\n\nShared via TallyFlow ERP",
    Receipt: "*{{companyName}}*\nReceipt Voucher No: {{voucherNo}}\nDate: {{date}}\nAmount: {{currency}} {{totalAmount}}\n\nShared via TallyFlow ERP"
  },
  notifications: {
    voucherSaved: 'Voucher has been saved successfully!',
    ledgerCreated: 'New ledger account created.',
    itemCreated: 'Stock item added to inventory.',
    settingsUpdated: 'System settings updated.'
  },
  features: [],
  appFeatures: [],
  subscriptionPlans: [],
  userSettings: {},
  loading: true,
  updateSettings: () => {},
  updateSystemSettings: async () => {},
  updateFeaturesSettings: async () => {},
  updateUserSettings: async () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<SettingsContextType>(() => {
    try {
      const systemPersisted = localStorage.getItem('swr_system_config');
      const cachedSystem = systemPersisted ? JSON.parse(systemPersisted) : {};

      const keys = Object.keys(localStorage);
      const companyKey = keys.find(k => k.startsWith('swr_settings_'));
      if (companyKey) {
        const cachedCompany = localStorage.getItem(companyKey);
        if (cachedCompany) {
          const cachedData = JSON.parse(cachedCompany);
          return {
            ...defaultSettings,
            ...cachedSystem,
            ...cachedData,
            loading: false,
            // Keep actual handlers as they are initialized/replaced on render
            updateSettings: defaultSettings.updateSettings,
            updateSystemSettings: defaultSettings.updateSystemSettings,
            updateFeaturesSettings: defaultSettings.updateFeaturesSettings,
            appFeatures: defaultSettings.appFeatures,
            subscriptionPlans: defaultSettings.subscriptionPlans
          };
        }
      }

      if (systemPersisted) {
        return {
          ...defaultSettings,
          ...cachedSystem,
          loading: false
        };
      }
    } catch (e) {}
    return defaultSettings;
  });
  const [userSettings, setUserSettings] = useState<any>({});

  useEffect(() => {
    if (authLoading) return;

    if (!user?.uid) {
      setUserSettings({});
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserSettings(data.settings || {});
      }
    }, (error) => {
      console.error("User settings snapshot error:", error);
    });

    return () => unsubscribeUser();
  }, [user?.uid]);    // Cache for global settings to avoid redundant fetches across tabs/sessions
    const globalConfigLoaded = React.useRef(false);

    useEffect(() => {
    // Fetch global system config - One-time fetch to save quota
    const fetchSystemConfig = async () => {
      try {
        const persisted = localStorage.getItem('swr_system_config');
        if (persisted) {
          const cachedSystem = JSON.parse(persisted);
          setSettings(prev => ({
            ...prev,
            ...cachedSystem
          }));
        }
      } catch (e) {}

      try {
        const systemRef = doc(db, 'system', 'config');
        const snap = await getDocFromServer(systemRef);
        if (snap.exists()) {
          const data = snap.data();
          try {
            localStorage.setItem('swr_system_config', JSON.stringify(data));
          } catch (e) {}
          setSettings(prev => ({
            ...prev,
            statusOnlineText: data.statusOnlineText || prev.statusOnlineText,
            statusOfflineText: data.statusOfflineText || prev.statusOfflineText,
            statusErrorText: data.statusErrorText || prev.statusErrorText,
            showGoToShortcut: data.showGoToShortcut !== undefined ? data.showGoToShortcut : prev.showGoToShortcut,
            appVersion: data.appVersion || prev.appVersion,
            englishFont: data.englishFont || prev.englishFont,
            banglaFont: data.banglaFont || prev.banglaFont,
            systemLogo: data.systemLogo || prev.systemLogo,
            systemFavicon: data.systemFavicon || prev.systemFavicon,
            glassBackground: data.glassBackground || prev.glassBackground,
            notificationDuration: data.notificationDuration || prev.notificationDuration,
            notificationAnimationStyle: data.notificationAnimationStyle || prev.notificationAnimationStyle,
            searchPlaceholder: data.searchPlaceholder || prev.searchPlaceholder,
            searchHelpText: data.searchHelpText || prev.searchHelpText,
            showSearchShortcut: data.showSearchShortcut !== undefined ? data.showSearchShortcut : prev.showSearchShortcut,
            searchIconColor: data.searchIconColor || prev.searchIconColor,
            loaderBlurStyle: data.loaderBlurStyle || prev.loaderBlurStyle || 'md',
            loaderIconStyle: data.loaderIconStyle || prev.loaderIconStyle || 'spinner',
            loaderPhrases: data.loaderPhrases || prev.loaderPhrases || 'Connecting to server, Requesting data, Waiting for response, Almost done, Here we go!',
            loaderTheme: data.loaderTheme || prev.loaderTheme || 'glass',
            adaptiveLoaderEnabled: data.adaptiveLoaderEnabled !== undefined ? data.adaptiveLoaderEnabled : prev.adaptiveLoaderEnabled,
            showQuickCalculator: data.showQuickCalculator !== undefined ? data.showQuickCalculator : prev.showQuickCalculator,
            showPinnedBookmarks: data.showPinnedBookmarks !== undefined ? data.showPinnedBookmarks : prev.showPinnedBookmarks,
            customControlCenterTheme: data.customControlCenterTheme || prev.customControlCenterTheme || 'emerald',
            customWelcomeMessage: data.customWelcomeMessage || prev.customWelcomeMessage || 'Executive Command Center',
            splashSubDesign: data.splashSubDesign || prev.splashSubDesign || 'grid',
            skeletonEnabled: data.skeletonEnabled !== undefined ? data.skeletonEnabled : prev.skeletonEnabled,
            skeletonDashboardOnly: data.skeletonDashboardOnly !== undefined ? data.skeletonDashboardOnly : prev.skeletonDashboardOnly,
            skeletonType: data.skeletonType || prev.skeletonType || 'automatic',
            skeletonSpeed: data.skeletonSpeed || prev.skeletonSpeed || 'normal',
            skeletonTheme: data.skeletonTheme || prev.skeletonTheme || 'modern',
            skeletonRows: data.skeletonRows !== undefined ? Number(data.skeletonRows) : prev.skeletonRows,
            skeletonWaveColor: data.skeletonWaveColor || prev.skeletonWaveColor || 'indigo',
            systemUiStyle: data.uiStyle || prev.systemUiStyle,
            systemMenuBarStyle: data.menuBarStyle || prev.systemMenuBarStyle,
            sidebarBgColor: data.sidebarBgColor || prev.sidebarBgColor || 'default',
            sidebarTextColor: data.sidebarTextColor || prev.sidebarTextColor || 'default',
            globalDashboardDesign: data.dashboardDesign || prev.globalDashboardDesign
          }));
          globalConfigLoaded.current = true;
        }
      } catch (error: any) {
        if (!error.message?.includes('Quota exceeded')) {
          console.error("System settings fetch error:", error);
        }
      }
    };

    // Fetch subscription plans - One-time fetch
    const fetchPlans = async () => {
      try {
        const plansRef = collection(db, 'subscription_plans');
        const snap = await getDocs(plansRef);
        const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
        setSettings(prev => ({ ...prev, subscriptionPlans: plans }));
      } catch (error: any) {
        if (!error.message?.includes('Quota exceeded')) {
          console.error("Subscription plans fetch error:", error);
        }
      }
    };

    // Fetch app features config - One-time fetch
    const fetchFeatures = async () => {
      try {
        const featuresRef = doc(db, 'system', 'features');
        const snap = await getDocFromServer(featuresRef);
        if (snap.exists()) {
          const data = snap.data();
          setSettings(prev => ({ ...prev, appFeatures: data.categories || APP_FEATURES }));
        } else {
          setSettings(prev => ({ ...prev, appFeatures: APP_FEATURES }));
        }
      } catch (error: any) {
        if (!error.message?.includes('Quota exceeded')) {
          console.error("Features configuration fetch error:", error);
        }
        setSettings(prev => ({ ...prev, appFeatures: APP_FEATURES }));
      }
    };

    fetchSystemConfig();
    fetchPlans();
    fetchFeatures();

    if (authLoading) return;

    if (!user?.companyId) {
      // Keep system settings but reset company settings
      setSettings(prev => ({ 
        ...defaultSettings, 
        statusOnlineText: prev.statusOnlineText,
        statusOfflineText: prev.statusOfflineText,
        statusErrorText: prev.statusErrorText,
        appVersion: prev.appVersion,
        loading: false,
        updateSettings: prev.updateSettings,
        updateSystemSettings: prev.updateSystemSettings,
        updateFeaturesSettings: prev.updateFeaturesSettings,
        appFeatures: prev.appFeatures,
        subscriptionPlans: prev.subscriptionPlans
      }));
      return;
    }

    const ref = doc(db, 'settings', user.companyId);

    // Try to load cached settings for this company first to avoid layout flashing
    try {
      const persisted = localStorage.getItem(`swr_settings_${user.companyId}`);
      if (persisted) {
        const cachedData = JSON.parse(persisted);
        setSettings(prev => ({
          ...prev,
          ...cachedData,
          loading: false,
          updateSettings: prev.updateSettings,
          updateSystemSettings: prev.updateSystemSettings,
          updateFeaturesSettings: prev.updateFeaturesSettings,
          appFeatures: prev.appFeatures,
          subscriptionPlans: prev.subscriptionPlans
        }));
      }
    } catch (e) {}

    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const snapData = snap.data();
        try {
          localStorage.setItem(`swr_settings_${user.companyId}`, JSON.stringify(snapData));
        } catch (e) {}
        setSettings(prev => ({ 
          ...prev, 
          ...snapData, 
          loading: false,
          updateSettings: prev.updateSettings,
          updateSystemSettings: prev.updateSystemSettings,
          updateFeaturesSettings: prev.updateFeaturesSettings,
          appFeatures: prev.appFeatures,
          subscriptionPlans: prev.subscriptionPlans
        }));
      } else {
        // If no settings exist for this company, use defaults (but keep system settings)
        setSettings(prev => ({ 
          ...defaultSettings, 
          statusOnlineText: prev.statusOnlineText,
          statusOfflineText: prev.statusOfflineText,
          statusErrorText: prev.statusErrorText,
          appVersion: prev.appVersion,
          loading: false,
          updateSettings: prev.updateSettings,
          updateSystemSettings: prev.updateSystemSettings,
          updateFeaturesSettings: prev.updateFeaturesSettings,
          appFeatures: prev.appFeatures,
          subscriptionPlans: prev.subscriptionPlans
        }));
      }
    }, (error) => {
      console.error("Settings snapshot error:", error);
      setSettings(prev => ({ ...prev, loading: false }));
    });

    return () => {
      unsubscribe();
    };
  }, [user?.companyId, authLoading]);

  useEffect(() => {
    if (settings.systemFavicon) {
      const iconUrl = settings.systemFavicon;
      
      // Update favicon
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = iconUrl;

      // Update apple-touch-icon
      let appleIcon = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!appleIcon) {
        appleIcon = document.createElement('link');
        appleIcon.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(appleIcon);
      }
      appleIcon.href = iconUrl;

      // Update Manifest dynamically for 'Add to home screen' support with custom icon
      try {
        const myManifest = {
          "name": settings.companyName || "TallyFlow ERP",
          "short_name": settings.companyName || "TallyFlow",
          "description": settings.slogan || "Enterprise ERP Solution",
          "start_url": window.location.origin,
          "scope": window.location.origin,
          "display": "standalone",
          "theme_color": "#3b82f6",
          "background_color": "#ffffff",
          "icons": [
            { "src": iconUrl, "sizes": "192x192", "type": "image/png", "purpose": "any" },
            { "src": iconUrl, "sizes": "512x512", "type": "image/png", "purpose": "any" },
            { "src": iconUrl, "sizes": "192x192", "type": "image/png", "purpose": "maskable" },
            { "src": iconUrl, "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
          ]
        };
        const stringManifest = JSON.stringify(myManifest);
        const blob = new Blob([stringManifest], {type: 'application/json'});
        const manifestURL = URL.createObjectURL(blob);
        
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          manifestLink.href = manifestURL;
        } else {
          const newManifestLink = document.createElement('link');
          newManifestLink.rel = 'manifest';
          newManifestLink.href = manifestURL;
          document.getElementsByTagName('head')[0].appendChild(newManifestLink);
        }
      } catch (err) {
        console.error('Error updating dynamic manifest:', err);
      }
    }
  }, [settings.systemFavicon, settings.companyName, settings.slogan]);

  const updateSettings = async (newSettings: Partial<SettingsContextType>) => {
    if (!user?.companyId) return;
    
    try {
      // Remove functions before saving
      const { updateSettings: _, updateSystemSettings: __, ...dataToSave } = newSettings as any;
      await erpService.updateSettings(user.companyId, dataToSave);
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  const updateSystemSettings = async (newSettings: any) => {
    try {
      await erpService.updateSystemConfig(newSettings);
      // Update local state to reflect changes immediately
      setSettings(prev => ({
        ...prev,
        ...newSettings,
        systemUiStyle: newSettings.uiStyle !== undefined ? newSettings.uiStyle : prev.systemUiStyle,
        systemMenuBarStyle: newSettings.menuBarStyle !== undefined ? newSettings.menuBarStyle : prev.systemMenuBarStyle,
        // Map dashboardDesign back to globalDashboardDesign if it's in the payload
        globalDashboardDesign: newSettings.dashboardDesign || prev.globalDashboardDesign
      }));
    } catch (err) {
      console.error('Error updating system settings:', err);
    }
  };

  const updateFeaturesSettings = async (newFeatures: FeatureCategory[]) => {
    try {
      await erpService.updateFeaturesConfig(newFeatures);
    } catch (err) {
      console.error('Error updating features settings:', err);
    }
  };

  const updateUserSettings = async (newSettings: any) => {
    if (!user?.uid) return;
    try {
      await erpService.updateUserSettings(user.uid, newSettings);
    } catch (err) {
      console.error('Error updating user settings:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ 
      ...settings, 
      ...userSettings,
      uiStyle: settings.systemUiStyle || userSettings.uiStyle || settings.uiStyle || 'UI/UX 1',
      menuBarStyle: settings.systemMenuBarStyle || userSettings.menuBarStyle || settings.menuBarStyle || 'classic',
      sidebarBgColor: userSettings.sidebarBgColor || settings.sidebarBgColor || 'default',
      sidebarTextColor: userSettings.sidebarTextColor || settings.sidebarTextColor || 'default',
      userSettings,
      updateSettings, 
      updateSystemSettings, 
      updateUserSettings 
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
