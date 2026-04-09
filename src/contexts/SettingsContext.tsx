import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { erpService } from '../services/erpService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

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
export type UIStyle = 'UI/UX 1' | 'UI/UX 2';
export type NotificationAnimationStyle = 'default' | 'neon' | 'snake' | 'liquid' | 'glitch' | 'shimmer';

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
  showRunningBalance: boolean;
  showMobileNav: boolean;
  mobileBottomNavItems: string[];
  voucherHeaderCompact: boolean;
  voucherTableCompact: boolean;
  reportLayout: ReportLayout;
  dashboardDesign: DashboardDesign;
  menuBarStyle: MenuBarStyle;
  layoutWidth: 'responsive' | 'constrained';
  sidebarDefaultExpanded: boolean;
  uiStyle: UIStyle;
  notificationDuration: number;
  notificationAnimationStyle: NotificationAnimationStyle;
  appVersion: string;
  statusOnlineText: string;
  statusOfflineText: string;
  statusErrorText: string;
  whatsappTemplates: WhatsAppTemplates;
  notifications: NotificationSettings;
  features: FeatureSettings[];
  updateSettings: (newSettings: Partial<SettingsContextType>) => void;
  updateSystemSettings: (newSettings: any) => Promise<void>;
}

const defaultSettings: SettingsContextType = {
  companyName: 'TallyFlow ERP',
  companyLogo: '',
  systemLogo: '',
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
  showRunningBalance: true,
  showMobileNav: false,
  mobileBottomNavItems: ['Dashboard', 'Voucher Entry', 'Daybook', 'Settings (F11)'],
  voucherHeaderCompact: false,
  voucherTableCompact: false,
  reportLayout: 'Layout 2',
  dashboardDesign: 'Design 1',
  menuBarStyle: 'classic',
  layoutWidth: 'constrained',
  sidebarDefaultExpanded: true,
  uiStyle: 'UI/UX 1',
  notificationDuration: 5000,
  notificationAnimationStyle: 'default',
  appVersion: 'v1.0.1',
  statusOnlineText: 'Status: Online',
  statusOfflineText: 'Status: Offline',
  statusErrorText: 'Database Error',
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
  updateSettings: () => {},
  updateSystemSettings: async () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsContextType>(defaultSettings);

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
          appVersion: data.appVersion || prev.appVersion,
          systemLogo: data.systemLogo || prev.systemLogo,
          notificationDuration: data.notificationDuration || prev.notificationDuration,
          notificationAnimationStyle: data.notificationAnimationStyle || prev.notificationAnimationStyle
        }));
      }
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
      return () => unsubscribeSystem();
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
    };
  }, [user?.companyId]);

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

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings, updateSystemSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
