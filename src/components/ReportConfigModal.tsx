import React from 'react';
import { X, Check } from 'lucide-react';
import { ReportConfig } from '../types';

interface ReportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ReportConfig;
  onSave: (config: ReportConfig) => void;
  title: string;
}

export function ReportConfigModal({ isOpen, onClose, config, onSave, title }: ReportConfigModalProps) {
  const [localConfig, setLocalConfig] = React.useState<ReportConfig>(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key: keyof ReportConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const Toggle = ({ label, value, onChange, disabled = false }: { label: string, value: boolean, onChange: (v: boolean) => void, disabled?: boolean }) => (
    <div className={`flex items-center justify-between py-2 ${disabled ? 'opacity-50' : ''}`}>
      <span className="text-sm text-foreground">{label}</span>
      <button
        onClick={() => !disabled && onChange(!value)}
        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${value ? 'bg-emerald-500' : 'bg-gray-300'}`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${value ? 'translate-x-5' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-background shadow-2xl border border-border overflow-hidden">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-foreground">Configuration: {title}</h2>
          <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 space-y-1 no-scrollbar">
          <Toggle 
            label="Show Narration" 
            value={localConfig.showNarration} 
            onChange={(v) => handleChange('showNarration', v)} 
          />
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-foreground">Format of Report</span>
            <select
              value={localConfig.format}
              onChange={(e) => handleChange('format', e.target.value as any)}
              className="text-sm bg-muted border border-border rounded px-2 py-1 outline-none"
            >
              <option value="Condensed">Condensed</option>
              <option value="Detailed">Detailed</option>
            </select>
          </div>

          <Toggle 
            label="Show Inventory Details" 
            value={localConfig.showInventoryDetails} 
            onChange={(v) => handleChange('showInventoryDetails', v)}
            disabled={localConfig.format !== 'Detailed'}
          />

          <Toggle 
            label="Show Descriptions for Stock Items" 
            value={localConfig.showStockDescriptions} 
            onChange={(v) => handleChange('showStockDescriptions', v)}
            disabled={localConfig.format !== 'Detailed' || !localConfig.showInventoryDetails}
          />

          <Toggle 
            label="Show Mode of Payment/Receipt" 
            value={localConfig.showPaymentMode} 
            onChange={(v) => handleChange('showPaymentMode', v)}
            disabled={localConfig.format !== 'Detailed'}
          />

          <Toggle 
            label="Show Additional bank details and status" 
            value={localConfig.showBankDetails} 
            onChange={(v) => handleChange('showBankDetails', v)}
            disabled={localConfig.format !== 'Detailed' || !localConfig.showPaymentMode}
          />

          <Toggle 
            label="Show Cost Centre details" 
            value={localConfig.showCostCentre} 
            onChange={(v) => handleChange('showCostCentre', v)}
            disabled={localConfig.format !== 'Detailed'}
          />

          <Toggle 
            label="Show Entered by/Altered by" 
            value={localConfig.showEnteredBy} 
            onChange={(v) => handleChange('showEnteredBy', v)}
          />

          <div className="flex flex-col py-2 space-y-1">
            <span className="text-sm text-foreground">Display Name of Ledger</span>
            <select
              value={localConfig.ledgerDisplayName}
              onChange={(e) => handleChange('ledgerDisplayName', e.target.value as any)}
              className="text-sm bg-muted border border-border rounded px-2 py-1 outline-none w-full"
            >
              <option value="Alias (Name)">Alias (Name)</option>
              <option value="Alias Only">Alias Only</option>
              <option value="Name (Alias)">Name (Alias)</option>
              <option value="Name Only">Name Only</option>
            </select>
          </div>

          <div className="flex flex-col py-2 space-y-1">
            <span className="text-sm text-foreground">Sorting Method</span>
            <select
              value={localConfig.sortingMethod}
              onChange={(e) => handleChange('sortingMethod', e.target.value as any)}
              className="text-sm bg-muted border border-border rounded px-2 py-1 outline-none w-full"
            >
              <option value="Alphabetical (A to Z)">Alphabetical (A to Z)</option>
              <option value="Alphabetical (Z to A)">Alphabetical (Z to A)</option>
              <option value="Amount (Decreasing)">Amount (Decreasing)</option>
              <option value="Amount (Increasing)">Amount (Increasing)</option>
              <option value="Default">Default</option>
              <option value="In Sequence of entry">In Sequence of entry</option>
              <option value="Voucher Number (Ascending)">Voucher Number (Ascending)</option>
              <option value="Voucher Number (Descending)">Voucher Number (Descending)</option>
              <option value="Voucher Number (Sequence of A - Z)">Voucher Number (Sequence of A - Z)</option>
              <option value="Voucher Number (Sequence of Z - A)">Voucher Number (Sequence of Z - A)</option>
            </select>
          </div>

          <Toggle 
            label="Enable Stripe View" 
            value={localConfig.enableStripeView} 
            onChange={(v) => handleChange('enableStripeView', v)}
          />
        </div>

        <div className="border-t border-border p-4 bg-muted/30">
          <button
            onClick={() => onSave(localConfig)}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" /> Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
