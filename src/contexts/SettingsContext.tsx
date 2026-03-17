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

interface SettingsContextType {
  companyName: string;
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
  notifications: NotificationSettings;
  features: FeatureSettings[];
  updateSettings: (newSettings: Partial<SettingsContextType>) => void;
}

const defaultSettings: SettingsContextType = {
  companyName: 'TallyFlow ERP',
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
  ],
  updateSettings: () => {}
};

const SettingsContext = createContext<SettingsContextType>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<SettingsContextType>(defaultSettings);

  useEffect(() => {
    if (!user?.companyId) {
      setSettings(defaultSettings);
      return;
    }

    const ref = doc(db, 'settings', user.companyId);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setSettings(prev => ({ ...defaultSettings, ...snap.data(), updateSettings: prev.updateSettings }));
      } else {
        // If no settings exist for this company, use defaults
        setSettings(prev => ({ ...defaultSettings, updateSettings: prev.updateSettings }));
      }
    }, (error) => {
      console.error("Settings snapshot error:", error);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const updateSettings = async (newSettings: Partial<SettingsContextType>) => {
    if (!user?.companyId) return;
    
    try {
      // Remove updateSettings function before saving
      const { updateSettings: _, ...dataToSave } = newSettings as any;
      await erpService.updateSettings(user.companyId, dataToSave);
    } catch (err) {
      console.error('Error updating settings:', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
