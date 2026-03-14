import React, { createContext, useContext, useState, useEffect } from 'react';

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
  const [settings, setSettings] = useState<SettingsContextType>(() => {
    const saved = localStorage.getItem('tallyflow_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge with defaultSettings to ensure new properties like 'features' exist
      return { ...defaultSettings, ...parsed };
    }
    return defaultSettings;
  });

  const updateSettings = (newSettings: Partial<SettingsContextType>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('tallyflow_settings', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <SettingsContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
