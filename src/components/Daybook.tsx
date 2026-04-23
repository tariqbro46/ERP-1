import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, ArrowRight, MessageCircle, Mail, Settings as SettingsIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatNumber } from '../lib/utils';
import { erpService } from '../services/erpService';
import { pdfService } from '../services/pdfService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printReport, printUtils } from '../utils/printUtils';
import { exportToCSV, exportToPDF, exportUtils } from '../utils/exportUtils';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
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
  const { t } = useLanguage();
  const settings = useSettings();
  const { showNotification } = useNotification();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ledgers, setLedgers] = useState<any[]>([]);
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
      const [vData, iData, gData, uData, lData, sData] = await Promise.all([
        config.format === 'Detailed'
          ? erpService.getVouchersDetailedByDateRange(user.companyId, startDate, endDate)
          : erpService.getVouchersByDateRange(user.companyId, startDate, endDate),
        erpService.getItems(user.companyId),
        erpService.getGodowns(user.companyId),
        erpService.getUsersByCompany(user.companyId),
        erpService.getLedgers(user.companyId),
        erpService.getSettings(user.companyId)
      ]);

      setItems(iData);
      setGodowns(gData);
      setUsers(uData);
      setLedgers(lData);
      if (sData?.daybookConfig) setConfig(sData.daybookConfig);

      const processed = (vData || []).map(v => ({
        ...v,
        particulars: getLedgerName(v, lData)
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

  const getOtherPartyName = (v: any, currentLedgers: any[]) => {
    if (!v.entries || v.entries.length === 0) return null;

    // For Receipt/Payment/Contra, find the ledger that isn't Cash/Bank
    if (['Receipt', 'Payment', 'Contra'].includes(v.v_type)) {
      const isBankCash = (l: any) => {
        const name = l.name?.toLowerCase() || '';
        const group = l.ledger_groups?.name?.toLowerCase() || l.group_name?.toLowerCase() || '';
        return name.includes('cash') || name.includes('bank') || 
               group.includes('cash') || group.includes('bank');
      };

      // First try to find entries that are NOT Cash/Bank
      const otherEntries = v.entries.filter((e: any) => {
        const ledger = currentLedgers.find(l => l.id === e.ledger_id);
        return ledger && !isBankCash(ledger);
      });

      if (otherEntries.length === 1) {
        return currentLedgers.find(l => l.id === otherEntries[0].ledger_id)?.name;
      } else if (otherEntries.length > 1) {
        return otherEntries.map((e: any) => currentLedgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean).join(', ');
      }
    }

    // For Sales/Purchase, usually the party is the one that's NOT the Sales/Purchase account
    if (['Sales', 'Purchase'].includes(v.v_type)) {
      const isSalesPurchaseAccount = (l: any) => {
        const name = l.name?.toLowerCase() || '';
        const group = l.ledger_groups?.name?.toLowerCase() || l.group_name?.toLowerCase() || '';
        return group.includes('sales account') || group.includes('purchase account') ||
               name === 'sales' || name === 'purchase' || name === 'sales account' || name === 'purchase account';
      };

      const otherEntries = v.entries.filter((e: any) => {
        const ledger = currentLedgers.find(l => l.id === e.ledger_id);
        return ledger && !isSalesPurchaseAccount(ledger);
      });
      if (otherEntries.length > 0) {
        return currentLedgers.find(l => l.id === otherEntries[0].ledger_id)?.name;
      }
    }

    return null;
  };

  const getLedgerName = (v: any, currentLedgers: any[] = ledgers) => {
    // Try the calculated other party first (especially for detailed mode)
    const otherParty = getOtherPartyName(v, currentLedgers);
    if (otherParty) return otherParty;

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
    printUtils.printElement('daybook-report', 'Daybook Report');
  };

  const handleDownloadPDF = () => {
    exportUtils.exportToPDF('daybook-report', 'Daybook_Report');
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

    const headers = ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Amount'];
    exportUtils.exportToCSV(`Daybook_${period.replace(/ /g, '_')}`, 'Daybook', exportData, headers, settings);
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
    <div className="flex flex-col h-screen bg-background transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-2xl space-y-4">
            <div className="flex items-center gap-4">
              <EditableHeader 
                pageId="daybook"
                defaultTitle="Daybook"
                defaultSubtitle={settings.companyName}
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateInput
                  label={t('common.from')}
                  value={startDate}
                  onChange={setStartDate}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <DateInput
                  label={t('common.to')}
                  value={endDate}
                  onChange={setEndDate}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title={t('daybook.configureReport')}
            >
              <SettingsIcon className="w-3 h-3" /> {t('common.f12Configure')}
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
              title={t('daybook.downloadExcel')}
            >
              <Download className="w-3 h-3" /> {t('common.excel')}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={vouchers.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title={t('daybook.downloadPDF')}
            >
              <Download className="w-3 h-3" /> {t('common.pdf')}
            </button>
          </div>
        </div>
      </div>

      <ReportConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        title="Daybook"
      />

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6 space-y-6">
          <div id="daybook-report" className="bg-card border border-border overflow-hidden">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50">
            {loading ? (
              <div className="p-10 text-center text-gray-500">{t('daybook.loading')}</div>
            ) : vouchers.length === 0 ? (
              <div className="p-10 text-center text-gray-500">{t('daybook.noTransactions')}</div>
            ) : vouchers.map((v, idx) => (
              <div 
                key={v.id} 
                className={cn(
                  "p-4 space-y-3 hover:bg-foreground/5 transition-colors cursor-pointer group",
                  config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                )}
                onClick={() => navigate(`/vouchers/view/${v.id}`)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 uppercase">{v.v_date}</span>
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
                      <span className="text-[8px] text-gray-400 uppercase">{t('common.providedBy')}: {users.find(u => u.uid === v.createdBy)?.displayName || 'System'}</span>
                    )}
                    <span className="text-[10px] text-gray-500">{v.v_no}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">৳ {formatNumber(v.total_amount)}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                    className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> {t('common.whatsapp')}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                    className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> {t('common.email')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block relative">
            <table className="w-full text-left text-xs min-w-[700px] lg:min-w-0 border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-card">
                <tr className="border-b border-border text-gray-500 uppercase bg-foreground/5">
                  <th className="px-4 lg:px-6 py-4 font-medium border-b border-border">{t('common.date')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium border-b border-border">{t('common.particulars')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase border-b border-border">{t('common.vchType')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase border-b border-border">{t('common.vchNo')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right border-b border-border">{t('common.amount')}</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right border-b border-border">{t('common.share')}</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                {loading ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">{t('daybook.loading')}</td></tr>
                ) : vouchers.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-500">{t('daybook.noTransactionsPeriod')}</td></tr>
                ) : vouchers.map((v, idx) => (
                  <React.Fragment key={v.id}>
                    <tr 
                      className={cn(
                        "border-b border-border/50 hover:bg-foreground/5 cursor-pointer group transition-colors",
                        config.enableStripeView && idx % 2 !== 0 && "bg-muted/30"
                      )}
                      onClick={() => navigate(`/vouchers/view/${v.id}`)}
                    >
                      <td className="px-4 lg:px-6 py-4 whitespace-nowrap">{formatReportDate(v.v_date, settings.dateFormat)}</td>
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
                            <span className="text-[8px] text-gray-400 uppercase">{t('common.providedBy')}: {users.find(u => u.uid === v.createdBy)?.displayName || 'System'}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-4 uppercase text-[10px] text-gray-500">{v.v_type}</td>
                      <td className="px-4 lg:px-6 py-4">{v.v_no}</td>
                      <td className="px-4 lg:px-6 py-4 text-right text-foreground font-bold">৳ {formatNumber(v.total_amount)}</td>
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
                            <th className="py-1 text-left">{t('common.nameOfItem')}</th>
                            <th className="py-1 text-left">{t('common.godown')}</th>
                            <th className="py-1 text-right">{t('common.quantity')}</th>
                            <th className="py-1 text-right">{t('common.free')}</th>
                            <th className="py-1 text-right">{t('common.rate')}</th>
                            <th className="py-1 text-center">{t('common.per')}</th>
                            <th className="py-1 text-right">{t('common.discPercent')}</th>
                            <th className="py-1 text-right">{t('common.taxPercent')}</th>
                            <th className="py-1 text-right">{t('common.amount')}</th>
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
                                  <td className="py-1 text-right">{formatNumber(item.qty)}</td>
                                  <td className="py-1 text-right">{formatNumber(item.free_qty || 0)}</td>
                                  <td className="py-1 text-right">{formatNumber(item.rate)}</td>
                                  <td className="py-1 text-center">{item.unit || 'pcs'}</td>
                                  <td className="py-1 text-right">{item.disc_percent || 0}%</td>
                                  <td className="py-1 text-right">{item.tax_percent || 0}%</td>
                                  <td className="py-1 text-right font-bold text-foreground/70">{formatNumber(item.amount)}</td>
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
  </div>
);
}
