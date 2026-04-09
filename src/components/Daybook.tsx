import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, ArrowRight, Share2, MessageCircle, Mail, Settings as SettingsIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { printReport } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { pdfService } from '../services/pdfService';
import { exportService } from '../services/exportService';
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
  showRunningBalance: true,
  ledgerDisplayName: 'Name Only',
  sortingMethod: 'Default',
  enableStripeView: false,
};

export function Daybook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSettings();
  const { showNotification } = useNotification();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });

  const fetchVouchers = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [vData, iData, gData, uData, sData] = await Promise.all([
        config.format === 'Detailed'
          ? erpService.getVouchersDetailedByDateRange(user.companyId, startDate, endDate)
          : erpService.getVouchersByDateRange(user.companyId, startDate, endDate),
        erpService.getItems(user.companyId),
        erpService.getGodowns(user.companyId),
        erpService.getUsersByCompany(user.companyId),
        erpService.getSettings(user.companyId)
      ]);

      setItems(iData);
      setGodowns(gData);
      setUsers(uData);
      if (sData?.daybookConfig) setConfig(sData.daybookConfig);

      const processed = (vData || []).map(v => ({
        ...v,
        particulars: v.party_ledger_name || v.ledger_name || v.ledgers || v.particulars || v.v_type || 'Voucher'
      }));

      // Apply sorting
      const sorted = sortVouchers(processed);
      setVouchers(sorted);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const sortVouchers = (data: any[]) => {
    const sorted = [...data];
    switch (config.sortingMethod) {
      case 'Alphabetical (A to Z)':
        sorted.sort((a, b) => (a.particulars || '').localeCompare(b.particulars || ''));
        break;
      case 'Alphabetical (Z to A)':
        sorted.sort((a, b) => (b.particulars || '').localeCompare(a.particulars || ''));
        break;
      case 'Amount (Decreasing)':
        sorted.sort((a, b) => b.total_amount - a.total_amount);
        break;
      case 'Amount (Increasing)':
        sorted.sort((a, b) => a.total_amount - b.total_amount);
        break;
      case 'Voucher Number (Ascending)':
        sorted.sort((a, b) => (a.v_no || '').localeCompare(b.v_no || '', undefined, { numeric: true }));
        break;
      case 'Voucher Number (Descending)':
        sorted.sort((a, b) => (b.v_no || '').localeCompare(a.v_no || '', undefined, { numeric: true }));
        break;
      case 'In Sequence of entry':
        sorted.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeA - timeB;
        });
        break;
      default:
        sorted.sort((a, b) => new Date(a.v_date).getTime() - new Date(b.v_date).getTime());
    }
    return sorted;
  };

  useEffect(() => {
    fetchVouchers();
  }, [startDate, endDate, config.format, config.sortingMethod]);

  const handleSaveConfig = async (newConfig: ReportConfig) => {
    if (!user?.companyId) return;
    try {
      await erpService.updateSettings(user.companyId, { daybookConfig: newConfig });
      setConfig(newConfig);
      setIsConfigOpen(false);
      showNotification('Configuration saved', 'success');
    } catch (err) {
      showNotification('Failed to save configuration', 'error');
    }
  };

  const getLedgerName = (v: any) => {
    const name = v.party_ledger_name || v.ledger_name || v.ledgers || (['Sales', 'Purchase'].includes(v.particulars) ? '' : v.particulars) || v.v_type || 'Voucher';
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
    const printData = vouchers.map(v => {
      const rows = [{
        date: v.v_date,
        particulars: getLedgerName(v) + (config.format !== 'Detailed' && config.showInventoryDetails && v.item_names ? `\n(${v.item_names})` : ''),
        vch_type: v.v_type,
        vch_no: v.v_no,
        amount: v.total_amount
      }];

      if (config.showNarration && v.narration) {
        rows.push({ date: '', particulars: `(${v.narration})`, vch_type: '', vch_no: '', amount: 0 });
      }

      if (config.showEnteredBy) {
        const creator = users.find(u => u.uid === v.createdBy)?.displayName || 'System';
        rows.push({ date: '', particulars: `Entered by: ${creator}`, vch_type: '', vch_no: '', amount: 0 });
      }

      if (config.format === 'Detailed' && v.inventory && v.inventory.length > 0) {
        v.inventory.forEach((item: any) => {
          const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
          let itemDetail = `  > ${itemName} (${item.qty} ${item.unit_name || 'pcs'} @ ৳${item.rate.toLocaleString()})`;
          if (config.showStockDescriptions && item.description) {
            itemDetail += `\n    Desc: ${item.description}`;
          }
          rows.push({
            date: '',
            particulars: itemDetail,
            vch_type: '',
            vch_no: '',
            amount: 0
          });
        });
      }
      return rows;
    }).flat();

    printReport('Daybook', printData, ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Amount'], settings);
  };

  const handleDownloadExcel = () => {
    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    const exportData = vouchers.map(v => {
      const rows = [{
        'Date': v.v_date,
        'Particulars': getLedgerName(v) + (config.format !== 'Detailed' && config.showInventoryDetails && v.item_names ? ` (${v.item_names})` : ''),
        'Voucher Type': v.v_type,
        'Voucher No': v.v_no,
        'Amount': v.total_amount
      }];

      if (config.showNarration && v.narration) {
        rows.push({ 'Date': '', 'Particulars': `(${v.narration})`, 'Voucher Type': '', 'Voucher No': '', 'Amount': 0 });
      }

      if (config.format === 'Detailed' && v.inventory && v.inventory.length > 0) {
        v.inventory.forEach((item: any) => {
          const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
          rows.push({
            'Date': '',
            'Particulars': `  > ${itemName} (${item.qty} @ ${item.rate})`,
            'Voucher Type': '',
            'Voucher No': '',
            'Amount': 0
          });
        });
      }
      return rows;
    }).flat();

    exportService.exportToExcel(exportData, `Daybook_${period.replace(/ /g, '_')}`, 'Daybook');
  };

  const handleDownloadPDF = () => {
    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    const headers = [['Date', 'Particulars', 'Vch Type', 'Vch No', 'Amount']];
    const body = vouchers.map(v => {
      const rows = [[
        v.v_date,
        getLedgerName(v) + (config.format !== 'Detailed' && config.showInventoryDetails && v.item_names ? `\n(${v.item_names})` : ''),
        v.v_type,
        v.v_no,
        v.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
      ]];

      if (config.showNarration && v.narration) {
        rows.push(['', `(${v.narration})`, '', '', '']);
      }

      if (config.format === 'Detailed' && v.inventory && v.inventory.length > 0) {
        v.inventory.forEach((item: any) => {
          const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
          rows.push([
            '',
            `  > ${itemName} (${item.qty} @ ${item.rate})`,
            '',
            '',
            ''
          ]);
        });
      }
      return rows;
    }).flat();

    exportService.exportToPDF(headers, body, `Daybook_${period.replace(/ /g, '_')}`, `Daybook Report (${period})`, settings);
  };

  const handleShareWhatsApp = (v: any) => {
    pdfService.shareViaWhatsApp(v, settings);
    showNotification('Opening WhatsApp...', 'success');
  };

  const handleShareEmail = (v: any) => {
    pdfService.shareViaEmail(v, settings);
    showNotification('Opening Email Client...', 'success');
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-2xl space-y-4">
            <div className="flex items-center gap-4">
              {(settings.companyLogo || settings.systemLogo) && (
                <div className="w-12 h-12 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                  <img 
                    src={settings.companyLogo || settings.systemLogo} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Daybook</h1>
                <p className="text-[10px] text-gray-500 uppercase font-bold">{settings.companyName}</p>
              </div>
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
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title="Configure Report"
            >
              <SettingsIcon className="w-3 h-3" /> F12: CONFIGURE
            </button>
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownloadExcel}
              disabled={vouchers.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Download Excel"
            >
              <Download className="w-3 h-3" /> EXCEL
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={vouchers.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Download PDF"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        <ReportConfigModal 
          isOpen={isConfigOpen}
          onClose={() => setIsConfigOpen(false)}
          config={config}
          onSave={handleSaveConfig}
          title="Daybook"
        />

        <div className="bg-card border border-border overflow-hidden">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading transactions...</div>
            ) : vouchers.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No transactions recorded</div>
            ) : vouchers.map((v, idx) => (
              <div 
                key={v.id} 
                className={cn(
                  "p-4 space-y-3 hover:bg-foreground/5 transition-colors cursor-pointer group",
                  config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                )}
                onClick={() => navigate(`/vouchers/edit/${v.id}`)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">{v.v_date}</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">{v.v_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">
                      {v.party_ledger_name || v.ledger_name || v.ledgers || (['Sales', 'Purchase'].includes(v.particulars) ? '' : v.particulars) || v.v_type}
                    </span>
                    {config.showInventoryDetails && v.item_names && (
                      <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{v.item_names}</span>
                    )}
                    {config.showNarration && v.narration && (
                      <span className="text-[9px] text-gray-500 italic">({v.narration})</span>
                    )}
                    {config.showEnteredBy && (
                      <span className="text-[8px] text-gray-400 uppercase">By: {users.find(u => u.uid === v.createdBy)?.displayName || 'System'}</span>
                    )}
                    <span className="text-[10px] text-gray-500 font-mono">{v.v_no}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground font-mono">৳ {v.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                    className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                    className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs min-w-[700px] lg:min-w-0">
              <thead>
                <tr className="border-b border-border text-gray-500 uppercase">
                  <th className="px-4 lg:px-6 py-4 font-medium">Date</th>
                  <th className="px-4 lg:px-6 py-4 font-medium">Particulars</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase">Vch Type</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase">Vch No.</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right">Amount</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right">Share</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading transactions...</td></tr>
                ) : vouchers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No transactions recorded for this period</td></tr>
                ) : vouchers.map((v, idx) => (
                  <React.Fragment key={v.id}>
                    <tr 
                      className={cn(
                        "border-b border-border/50 hover:bg-foreground/5 cursor-pointer group transition-colors",
                        config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                      )}
                      onClick={() => navigate(`/vouchers/edit/${v.id}`)}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">{v.v_date}</td>
                      <td className="px-4 lg:px-6 py-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-foreground font-bold">
                              {getLedgerName(v)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          {config.showInventoryDetails && v.item_names && (
                            <span className="text-[9px] text-muted-foreground uppercase tracking-widest">
                              {v.item_names}
                            </span>
                          )}
                          {config.showNarration && v.narration && (
                            <span className="text-[9px] text-gray-500 italic">({v.narration})</span>
                          )}
                          {config.showEnteredBy && (
                            <span className="text-[8px] text-gray-400 uppercase">By: {users.find(u => u.uid === v.createdBy)?.displayName || 'System'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 uppercase text-[10px] text-gray-500">{v.v_type}</td>
                      <td className="px-4 lg:px-6 py-4">{v.v_no}</td>
                      <td className="px-4 lg:px-6 py-4 text-right text-foreground font-mono font-bold">৳ {v.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Share via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                            title="Share via Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {config.format === 'Detailed' && v.inventory && v.inventory.length > 0 && (
                      <tr className="bg-foreground/[0.02] border-b border-border/30">
                        <td colSpan={6} className="px-4 lg:px-12 py-2">
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
                              {v.inventory.map((item: any, iIdx: number) => (
                                <tr key={iIdx} className="border-b border-border/10 last:border-0">
                                  <td className="py-1">
                                    <div className="flex flex-col">
                                      <span>{items.find(i => i.id === item.item_id)?.name || 'Unknown Item'}</span>
                                      {config.showStockDescriptions && item.description && (
                                        <span className="text-[9px] italic text-gray-400">{item.description}</span>
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
