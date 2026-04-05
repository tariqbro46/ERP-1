import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, ArrowLeft, Calculator, FileText, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { printReport } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { QuickAdjustmentModal } from './QuickAdjustmentModal';
import { ReportConfigModal } from './ReportConfigModal';
import { ReportConfig } from '../types';

const DEFAULT_CONFIG: ReportConfig = {
  showNarration: false,
  format: 'Condensed',
  showInventoryDetails: false,
  showStockDescriptions: false,
  showPaymentMode: false,
  showBankDetails: false,
  showCostCentre: false,
  showEnteredBy: false,
  ledgerDisplayName: 'Name Only',
  sortingMethod: 'Default',
  enableStripeView: false,
};

export function LedgerStatement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useSettings();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>('');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [showLedgerList, setShowLedgerList] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      const [lData, iData, gData, uData, sData] = await Promise.all([
        erpService.getLedgers(user.companyId),
        erpService.getItems(user.companyId),
        erpService.getGodowns(user.companyId),
        erpService.getUsersByCompany(user.companyId),
        erpService.getSettings(user.companyId)
      ]);
      if (lData) setLedgers(lData);
      setItems(iData);
      setGodowns(gData);
      setUsers(uData);
      if (sData?.ledgerConfig) setConfig(sData.ledgerConfig);
    }
    fetchData();
  }, [user?.companyId]);

  const handleSaveConfig = async (newConfig: ReportConfig) => {
    if (!user?.companyId) return;
    try {
      await erpService.updateSettings(user.companyId, { ledgerConfig: newConfig });
      setConfig(newConfig);
      setIsConfigOpen(false);
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const fetchEntries = async () => {
    if (!selectedLedger || !user?.companyId) {
      setEntries([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await erpService.getVoucherWithEntries(user.companyId, selectedLedger, startDate, endDate);
      
      const processed = data.map((v: any) => {
        // Find the specific entry for our selected ledger
        const mainEntry = v.voucher_entries.find((e: any) => e.ledger_id === selectedLedger);
        
        // Find the "other side" particulars from all_entries
        const otherEntries = v.voucher_entries.filter((e: any) => e.ledger_id !== selectedLedger);
        
        let particulars = 'Self';
        if (otherEntries.length === 1) {
          // We need to fetch the ledger name for otherEntries[0].ledger_id
          // For now, we'll assume we can find it in our ledgers state
          const otherLedger = ledgers.find(l => l.id === otherEntries[0].ledger_id);
          particulars = otherLedger?.name || 'Unknown';
        } else if (otherEntries.length > 1) {
          particulars = 'As per details';
        }

        return {
          id: v.id,
          debit: mainEntry?.debit || 0,
          credit: mainEntry?.credit || 0,
          vouchers: v,
          particulars
        };
      });

      setEntries(processed);
    } catch (err) {
      console.error('LedgerStatement Error:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [selectedLedger, startDate, endDate]);

  const filteredLedgers = ledgers.filter(l => 
    l.name.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  const handleLedgerSelect = (ledger: any) => {
    setSelectedLedger(ledger.id);
    setLedgerSearch(ledger.name);
    setShowLedgerList(false);
  };

  const currentLedger = ledgers.find(l => l.id === selectedLedger);
  let runningBalance = currentLedger?.opening_balance || 0;

  const getLedgerName = (v: any) => {
    const name = v.party_ledger_name || v.ledger_name || v.ledgers || v.particulars || v.v_type || 'Voucher';
    const alias = v.alias || ''; 
    
    switch (config.ledgerDisplayName) {
      case 'Alias (Name)':
        return alias ? `${alias} (${name})` : name;
      case 'Alias Only':
        return alias || name;
      case 'Name (Alias)':
        return alias ? `${name} (${alias})` : name;
      default:
        return name;
    }
  };

  const handlePrint = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = currentLedger?.opening_balance || 0;
    const printData = [
      {
        date: '-',
        vch_no: '-',
        vch_type: 'Opening Balance',
        debit: rb > 0 ? rb : 0,
        credit: rb < 0 ? Math.abs(rb) : 0,
        balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
      },
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        const rows = [{
          date: e.vouchers?.v_date,
          vch_no: e.vouchers?.v_no,
          vch_type: `${e.vouchers?.v_type} - ${e.particulars}`,
          debit: e.debit || 0,
          credit: e.credit || 0,
          balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
        }];

        if (config.showNarration && e.vouchers?.narration) {
          rows.push({ date: '', vch_no: '', vch_type: `(${e.vouchers.narration})`, debit: 0, credit: 0, balance: '' });
        }

        if (config.showEnteredBy) {
          const creator = users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System';
          rows.push({ date: '', vch_no: '', vch_type: `Entered by: ${creator}`, debit: 0, credit: 0, balance: '' });
        }

        if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
          e.vouchers.inventory.forEach((item: any) => {
            const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
            let itemDetail = `  > ${itemName} (${item.qty} ${item.unit || ''} @ ${item.rate})`;
            if (config.showStockDescriptions && item.description) {
              itemDetail += `\n    Desc: ${item.description}`;
            }
            rows.push({
              date: '',
              vch_no: '',
              vch_type: itemDetail,
              debit: 0,
              credit: 0,
              balance: ''
            });
          });
        }
        return rows;
      }).flat()
    ];

    const period = `Period: ${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    printReport(`Ledger Statement: ${ledgerName}\n${period}`, printData, ['Date', 'Vch No', 'Vch Type', 'Debit', 'Credit', 'Balance'], settings);
  };

  const handleDownload = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = currentLedger?.opening_balance || 0;
    const exportData = [
      {
        date: '-',
        particulars: 'Opening Balance',
        vch_no: '-',
        vch_type: '-',
        debit: rb > 0 ? rb : 0,
        credit: rb < 0 ? Math.abs(rb) : 0,
        balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
      },
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        const rows = [{
          date: e.vouchers?.v_date,
          particulars: e.particulars,
          vch_no: e.vouchers?.v_no,
          vch_type: e.vouchers?.v_type,
          debit: e.debit || 0,
          credit: e.credit || 0,
          balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
        }];

        if (config.showNarration && e.vouchers?.narration) {
          rows.push({ date: '', particulars: `(${e.vouchers.narration})`, vch_no: '', vch_type: '', debit: 0, credit: 0, balance: '' });
        }

        if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
          e.vouchers.inventory.forEach((item: any) => {
            const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
            rows.push({
              date: '',
              particulars: `  - ${itemName} (${item.qty} @ ${item.rate})`,
              vch_no: '',
              vch_type: '',
              debit: 0,
              credit: 0,
              balance: ''
            });
          });
        }
        return rows;
      }).flat()
    ];

    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    exportToCSV(`Ledger_Statement_${ledgerName.replace(/ /g, '_')}`, `Ledger Statement: ${ledgerName} (${period})`, exportData, ['Date', 'Particulars', 'Vch No', 'Vch Type', 'Debit', 'Credit', 'Balance'], settings);
  };

  const handleDownloadPDF = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = currentLedger?.opening_balance || 0;
    const exportData = [
      {
        date: '-',
        particulars: 'Opening Balance',
        vch_no: '-',
        vch_type: '-',
        debit: rb > 0 ? rb : 0,
        credit: rb < 0 ? Math.abs(rb) : 0,
        balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
      },
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        const rows = [{
          date: e.vouchers?.v_date,
          particulars: e.particulars,
          vch_no: e.vouchers?.v_no,
          vch_type: e.vouchers?.v_type,
          debit: e.debit || 0,
          credit: e.credit || 0,
          balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`
        }];

        if (config.showNarration && e.vouchers?.narration) {
          rows.push({ date: '', particulars: `(${e.vouchers.narration})`, vch_no: '', vch_type: '', debit: 0, credit: 0, balance: '' });
        }

        if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
          e.vouchers.inventory.forEach((item: any) => {
            const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
            rows.push({
              date: '',
              particulars: `  - ${itemName} (${item.qty} @ ${item.rate})`,
              vch_no: '',
              vch_type: '',
              debit: 0,
              credit: 0,
              balance: ''
            });
          });
        }
        return rows;
      }).flat()
    ];

    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    exportToPDF(`Ledger_Statement_${ledgerName.replace(/ /g, '_')}`, `Ledger Statement: ${ledgerName} (${period})`, exportData, ['Date', 'Particulars', 'Vch No', 'Vch Type', 'Debit', 'Credit', 'Balance'], settings);
  };

  const handleFullPageView = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    
    let rb = currentLedger?.opening_balance || 0;
    const reportRows = [
      `<tr>
        <td>-</td>
        <td>-</td>
        <td>Opening Balance</td>
        <td style="text-align: right;">${rb > 0 ? rb.toFixed(2) : '0.00'}</td>
        <td style="text-align: right;">${rb < 0 ? Math.abs(rb).toFixed(2) : '0.00'}</td>
        <td style="text-align: right;">${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}</td>
      </tr>`,
      ...entries.map(e => {
        rb += (e.debit || 0) - (e.credit || 0);
        let row = `<tr>
          <td>${e.vouchers?.v_date}</td>
          <td>${e.vouchers?.v_no}</td>
          <td>${e.vouchers?.v_type} - ${e.particulars}</td>
          <td style="text-align: right;">${(e.debit || 0).toFixed(2)}</td>
          <td style="text-align: right;">${(e.credit || 0).toFixed(2)}</td>
          <td style="text-align: right;">${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}</td>
        </tr>`;

        if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
          row += `<tr>
            <td colspan="6" style="padding: 0;">
              <table style="width: 100%; margin: 0; border: none; background-color: #fafafa;">
                <thead>
                  <tr style="background-color: #eee;">
                    <th style="font-size: 10px; border: none; padding: 4px; text-align: left;">Item Name</th>
                    <th style="font-size: 10px; border: none; padding: 4px; text-align: left;">Godown</th>
                    <th style="font-size: 10px; border: none; padding: 4px; text-align: right;">Qty</th>
                    <th style="font-size: 10px; border: none; padding: 4px; text-align: right;">Rate</th>
                    <th style="font-size: 10px; border: none; padding: 4px; text-align: right;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${e.vouchers.inventory.map((item: any) => `
                    <tr>
                      <td style="font-size: 10px; border: none; padding: 4px;">${items.find(i => i.id === item.item_id)?.name || 'Unknown'}</td>
                      <td style="font-size: 10px; border: none; padding: 4px;">${godowns.find(g => g.id === item.godown_id)?.name || '-'}</td>
                      <td style="font-size: 10px; border: none; padding: 4px; text-align: right;">${item.qty} ${item.unit || ''}</td>
                      <td style="font-size: 10px; border: none; padding: 4px; text-align: right;">${item.rate.toFixed(2)}</td>
                      <td style="font-size: 10px; border: none; padding: 4px; text-align: right;">${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </td>
          </tr>`;
        }
        return row;
      })
    ].join('');

    const html = `
      <html>
        <head>
          <title>Ledger Statement - ${ledgerName}</title>
          <style>
            body { font-family: monospace; padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
            th { background-color: #f4f4f4; text-transform: uppercase; }
            .header { text-align: center; margin-bottom: 30px; }
            .company-name { font-size: 20px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">${settings?.companyName || 'COMPANY NAME'}</div>
            <div>Ledger Statement: ${ledgerName}</div>
            <div>Period: ${period}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Vch No</th>
                <th>Particulars</th>
                <th style="text-align: right;">Debit</th>
                <th style="text-align: right;">Credit</th>
                <th style="text-align: right;">Balance</th>
              </tr>
            </thead>
            <tbody>
              ${reportRows}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Ledger Statement</h1>
          <button 
            onClick={() => setShowAdjustmentModal(true)}
            disabled={!selectedLedger}
            className="px-3 py-1.5 bg-emerald-600/10 border border-emerald-600/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[9px] font-bold uppercase tracking-widest"
            title="Quick Adjustment"
          >
            <Calculator className="w-3 h-3" /> Adjust
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex-1 w-full sm:max-w-2xl space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search Ledger..."
                  value={ledgerSearch || ''}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setShowLedgerList(true);
                  }}
                  onFocus={() => setShowLedgerList(true)}
                  className="w-full bg-card border border-border text-foreground pl-10 pr-4 py-3 text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>
              
              {showLedgerList && ledgerSearch && (
                <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-xl max-h-60 overflow-y-auto no-scrollbar">
                  {filteredLedgers.length > 0 ? (
                    filteredLedgers.map(l => (
                      <button
                        key={l.id}
                        onClick={() => handleLedgerSelect(l)}
                        className="w-full text-left px-4 py-3 text-sm text-foreground hover:bg-foreground/5 border-b border-border/50 last:border-none transition-colors"
                      >
                        {l.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No matching ledgers</div>
                  )}
                </div>
              )}
              {showLedgerList && (
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowLedgerList(false)}
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">From</label>
                <input 
                  type="date" 
                  value={startDate || ''} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">To</label>
                <input 
                  type="date" 
                  value={endDate || ''} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
            <div className="flex flex-wrap gap-2 justify-end">
              <button 
                onClick={() => setIsConfigOpen(true)}
                className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
                title="Configure Report"
              >
                <SettingsIcon className="w-3 h-3" /> F12: CONFIGURE
              </button>
              <button 
                onClick={fetchEntries}
                disabled={loading || !selectedLedger}
                className="p-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center disabled:opacity-50"
                title="Refresh Data"
              >
                <Search className={cn("w-4 h-4", loading && "animate-spin")} />
              </button>
              <button 
                onClick={handlePrint}
                disabled={!selectedLedger}
                className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              >
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button 
                onClick={handleDownload}
                disabled={!selectedLedger || entries.length === 0}
                className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
                title="Download CSV"
              >
                <Download className="w-3 h-3" /> CSV
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={!selectedLedger || entries.length === 0}
                className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
                title="Download PDF"
              >
                <Download className="w-3 h-3" /> PDF
              </button>
            </div>
            <button 
              onClick={handleFullPageView}
              disabled={!selectedLedger}
              className="w-full sm:w-auto px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <FileText className="w-3 h-3" /> Full Page View
            </button>
          </div>
        </div>

        <ReportConfigModal 
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={config}
          onSave={handleSaveConfig}
          title="Ledger Statement"
        />

        <div className="bg-card border border-border overflow-x-auto no-scrollbar">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-border text-gray-500 uppercase">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Vch No.</th>
                <th className="px-6 py-4 font-medium">Vch Type</th>
                <th className="px-6 py-4 font-medium text-right">Debit</th>
                <th className="px-6 py-4 font-medium text-right">Credit</th>
                <th className="px-6 py-4 font-medium text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              {!selectedLedger ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600">Please select a ledger to view statement</td></tr>
              ) : loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600">Loading entries...</td></tr>
              ) : (
                <>
                  {/* Opening Balance Row */}
                  <tr className="border-b border-border/50 bg-foreground/5 font-bold italic">
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4">Opening Balance</td>
                    <td className="px-6 py-4">-</td>
                    <td className="px-6 py-4 text-right">
                      {(currentLedger?.opening_balance || 0) > 0 ? `৳ ${currentLedger.opening_balance.toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {(currentLedger?.opening_balance || 0) < 0 ? `৳ ${Math.abs(currentLedger.opening_balance).toLocaleString()}` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right text-foreground">
                      ৳ {Math.abs(currentLedger?.opening_balance || 0).toLocaleString()} {(currentLedger?.opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}
                    </td>
                  </tr>

                  {entries.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-600 italic">No transactions found for this period</td></tr>
                  ) : entries.map((e, idx) => {
                    runningBalance += (e.debit || 0) - (e.credit || 0);
                    const currentBalance = runningBalance;
                    return (
                      <React.Fragment key={e.id}>
                        <tr 
                          className={cn(
                            "border-b border-border/50 hover:bg-foreground/5 transition-colors cursor-pointer group",
                            config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                          )}
                          onClick={() => navigate(`/vouchers/edit/${e.id}`)}
                        >
                          <td className="px-6 py-4">{e.vouchers?.v_date}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-foreground font-bold uppercase text-[10px] text-gray-500">{e.vouchers?.v_type}</span>
                              <span className="text-foreground">{e.particulars}</span>
                              {config.showNarration && e.vouchers?.narration && (
                                <span className="text-[10px] text-gray-500 italic">({e.vouchers.narration})</span>
                              )}
                              {config.showEnteredBy && (
                                <span className="text-[8px] text-gray-400 uppercase">By: {users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System'}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 uppercase text-[10px] text-gray-500">{e.vouchers?.v_no}</td>
                          <td className="px-6 py-4 text-right font-mono">{e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                          <td className="px-6 py-4 text-right font-mono">{e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                          <td className="px-6 py-4 text-right text-foreground font-bold font-mono">
                            {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currentBalance >= 0 ? 'Dr' : 'Cr'}
                          </td>
                        </tr>
                        {config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0 && (
                          <tr className="bg-foreground/[0.02] border-b border-border/30">
                            <td colSpan={6} className="px-6 py-2">
                              <table className="w-full text-[10px] text-gray-500">
                                <thead>
                                  <tr className="border-b border-border/20 uppercase text-[8px]">
                                    <th className="py-1 text-left">Name of Item</th>
                                    <th className="py-1 text-left">Godown</th>
                                    <th className="py-1 text-right">Quantity</th>
                                    <th className="py-1 text-right">Free</th>
                                    <th className="py-1 text-right">Rate</th>
                                    <th className="py-1 text-center">per</th>
                                    <th className="py-1 text-right">Disc %</th>
                                    <th className="py-1 text-right">Tax %</th>
                                    <th className="py-1 text-right">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {e.vouchers.inventory.map((item: any, iIdx: number) => (
                                    <tr key={iIdx} className="border-b border-border/10 last:border-0">
                                      <td className="py-1">
                                        <div className="flex flex-col">
                                          <span>{items.find(i => i.id === item.item_id)?.name || 'Unknown Item'}</span>
                                          {config.showStockDescriptions && item.description && (
                                            <span className="text-[9px] italic">{item.description}</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="py-1">{godowns.find(g => g.id === item.godown_id)?.name || '-'}</td>
                                      <td className="py-1 text-right">{item.qty}</td>
                                      <td className="py-1 text-right">{item.free_qty || 0}</td>
                                      <td className="py-1 text-right">{item.rate.toLocaleString()}</td>
                                      <td className="py-1 text-center">{item.unit || 'pcs'}</td>
                                      <td className="py-1 text-right">{item.disc_percent || 0}%</td>
                                      <td className="py-1 text-right">{item.tax_percent || 0}%</td>
                                      <td className="py-1 text-right font-bold text-foreground/70">{item.amount.toLocaleString()}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLedger && (
        <QuickAdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          onSuccess={() => {
            fetchEntries();
            // Also refresh ledgers to get updated balance
            async function refreshLedgers() {
              if (!user?.companyId) return;
              const data = await erpService.getLedgers(user.companyId);
              if (data) setLedgers(data);
            }
            refreshLedgers();
          }}
          partyLedgerId={selectedLedger}
          partyName={currentLedger?.name || ''}
          currentBalance={runningBalance}
        />
      )}
    </div>
  );
}
