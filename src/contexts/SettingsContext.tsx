import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { erpService } from '../services/erpService';
import { doc, onSnapshot, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { SubscriptionPlan } from '../types';

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

export type MenuBarStyle = 'classic' | 'ribbon' | 'macos' | 'windows11';
export type ReportLayout = 'Layout 1' | 'Layout 2';
export type DashboardDesign = 'Design 1' | 'Design 2';
export type UIStyle = 'UI/UX 1' | 'UI/UX 2' | 'UI/UX 3';
export type NotificationAnimationStyle = 'default' | 'neon' | 'snake' | 'liquid' | 'glitch' | 'shimmer';
export type GlassBackground = 'default' | 'sunset' | 'ocean' | 'aurora' | 'minimal';

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
  showRunningBalance: boolean;
  showMobileNav: boolean;
  mobileBottomNavItems: string[];
  dateFormat: string;
  voucherHeaderCompact: boolean;
  voucherTableCompact: boolean;
  reportLayout: ReportLayout;
  dashboardDesign: DashboardDesign;
  menuBarStyle: MenuBarStyle;
  layoutWidth: 'responsive' | 'constrained';
  sidebarDefaultExpanded: boolean;
  uiStyle: UIStyle;
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
  showQuickActions: boolean;
  dashboardQuickActions: string[];
  whatsappTemplates: WhatsAppTemplates;
  notifications: NotificationSettings;
  features: FeatureSettings[];
  subscriptionPlans: SubscriptionPlan[];
  activePlan?: SubscriptionPlan;
  userSettings: any;
  updateSettings: (newSettings: Partial<SettingsContextType>) => void;
  updateSystemSettings: (newSettings: any) => Promise<void>;
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
  uiStyle: 'UI/UX 1',
  glassBackground: 'default',
  notificationDuration: 5000,
  notificationAnimationStyle: 'default',
  appVersion: 'v1.0.1',
  englishFont: 'Inter',
  banglaFont: 'Hind Siliguri',
  statusOnlineText: 'Status: Online',
  statusOfflineText: 'Status: Offline',
  statusErrorText: 'Database Error',
  showGoToShortcut: true,
  showQuickActions: true,
  dashboardQuickActions: ['voucher', 'item', 'ledger', 'godown', 'users'],
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
  features: [
    { id: 'inv', label: 'Maintain Accounts with Inventory', enabled: true },
    { id: 'bill', label: 'Enable Bill-wise Entry', enabled: true },
    { id: 'cost', label: 'Enable Cost Centers', enabled: false },
    { id: 'int', label: 'Enable Interest Calculation', enabled: true },
    { id: 'godown', label: 'Maintain Multiple Godowns', enabled: true },
    { id: 'cat', label: 'Maintain Stock Categories', enabled: true },
    { id: 'batch', label: 'Maintain Stock Batches', enabled: false },
    { id: 'expiry', label: 'Track Expiry Dates', enabled: false },
    { id: 'tax', label: 'Enable Tax % in Vouchers', enabled: true },
    { id: 'barcode', label: 'Enable Barcode Scanning', enabled: false },
  ],
  subscriptionPlans: [],
  userSettings: {},
  updateSettings: () => {},
  updateSystemSettings: async () => {},
  updateUserSettings: async () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsContextType>(defaultSettings);
  const [userSettings, setUserSettings] = useState<any>({});

  useEffect(() => {
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
    });

    return () => unsubscribeUser();
  }, [user?.uid]);

  useEffect(() => {
    // Listen to global system config
    const systemRef = doc(db, 'system', 'config');
    const unsubscribeSystem = onSnapshot(systemRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
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
          notificationAnimationStyle: data.notificationAnimationStyle || prev.notificationAnimationStyle
        }));
      }
    }, (error) => {
      console.error("System settings snapshot error:", error);
    });

    // Listen to subscription plans
    const plansRef = collection(db, 'subscription_plans');
    const unsubscribePlans = onSnapshot(plansRef, (snap) => {
      const plans = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubscriptionPlan));
      setSettings(prev => ({ ...prev, subscriptionPlans: plans }));
    }, (error) => {
      console.error("Subscription plans snapshot error:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      console.error("Current User:", auth.currentUser?.uid, auth.currentUser?.email);
    });

    if (!user?.companyId) {
      // Keep system settings but reset company settings
      setSettings(prev => ({ 
        ...defaultSettings, 
        statusOnlineText: prev.statusOnlineText,
        statusOfflineText: prev.statusOfflineText,
        statusErrorText: prev.statusErrorText,
        appVersion: prev.appVersion,
        updateSettings: prev.updateSettings,
        updateSystemSettings: prev.updateSystemSettings
      }));
      return () => {
        unsubscribeSystem();
        unsubscribePlans();
      };
    }

    const ref = doc(db, 'settings', user.companyId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings(prev => ({ 
          ...prev, 
          ...snap.data(), 
          updateSettings: prev.updateSettings,
          updateSystemSettings: prev.updateSystemSettings
        }));
      } else {
        // If no settings exist for this company, use defaults (but keep system settings)
        setSettings(prev => ({ 
          ...defaultSettings, 
          statusOnlineText: prev.statusOnlineText,
          statusOfflineText: prev.statusOfflineText,
          statusErrorText: prev.statusErrorText,
          appVersion: prev.appVersion,
          updateSettings: prev.updateSettings,
          updateSystemSettings: prev.updateSystemSettings
        }));
      }
    }, (error) => {
      console.error("Settings snapshot error:", error);
    });

    return () => {
      unsubscribe();
      unsubscribeSystem();
      unsubscribePlans();
    };
  }, [user?.companyId]);

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
    } catch (err) {
      console.error('Error updating system settings:', err);
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
