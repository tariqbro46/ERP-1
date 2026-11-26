import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, FileSpreadsheet, Mail, FileText, Settings as SettingsIcon, Calculator, Layout, MoreVertical } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { EnterpriseModal } from './ui/EnterpriseModal';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn, formatNumber, formatQuantity, formatVoucherNo, compareLedgerVouchers } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { executePrint } from '../utils/printUtils';
import { exportToCSV, exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import { printToPDF } from '../utils/pdfExportService';
import { generateLedgerStatementHtml } from '../utils/reports/ledgerStatementReport';
import { resolveCompanyLegalIdentity, DEFAULT_APP_BRANDING } from '../constants/appIdentity';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
import { ReportConfigModal } from './ReportConfigModal';
import { ReportBuilderModal } from './ReportBuilderModal';
import { QuickAdjustmentModal } from './QuickAdjustmentModal';
import { ReportConfig } from '../types';
import { VoucherContextMenu } from './TableContextMenu';

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

export function LedgerStatement() {
  const { user, company } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const settings = useSettings();
  const companyIdentity = resolveCompanyLegalIdentity(settings, company);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [isReportBuilderOpen, setIsReportBuilderOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<string>(() => {
    return searchParams.get('ledgerId') || sessionStorage.getItem('last_selected_ledger_id') || '';
  });
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [showLedgerList, setShowLedgerList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [startDate, setStartDate] = useState(() => {
    return searchParams.get('from') || sessionStorage.getItem('last_selected_ledger_from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    return searchParams.get('to') || sessionStorage.getItem('last_selected_ledger_to') || new Date().toLocaleDateString('en-CA');
  });
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number } | null;
    voucher: any;
    particulars?: string;
    amount?: number;
    date?: string;
  }>({
    isOpen: false,
    position: null,
    voucher: null
  });

  useEffect(() => {
    if (selectedLedger) {
      sessionStorage.setItem('last_selected_ledger_id', selectedLedger);
    } else {
      sessionStorage.removeItem('last_selected_ledger_id');
    }
  }, [selectedLedger]);

  useEffect(() => {
    if (startDate) {
      sessionStorage.setItem('last_selected_ledger_from', startDate);
    }
  }, [startDate]);

  useEffect(() => {
    if (endDate) {
      sessionStorage.setItem('last_selected_ledger_to', endDate);
    }
  }, [endDate]);
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [fullPageHtml, setFullPageHtml] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.toLocaleString('en-GB', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
  };

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
      if (lData) {
        setLedgers(lData);
        // Set selected ledger from URL if present
        const urlLedgerId = searchParams.get('ledgerId');
        if (urlLedgerId) {
          setSelectedLedger(urlLedgerId);
          const l = lData.find((l: any) => l.id === urlLedgerId);
          if (l) setLedgerSearch(l.name);
        } else if (selectedLedger) {
          const l = lData.find((l: any) => l.id === selectedLedger);
          if (l) setLedgerSearch(l.name);
        }
      }
      setItems(iData);
      setGodowns(gData);
      setUsers(uData);
      if (sData?.ledgerConfig) {
        setConfig(sData.ledgerConfig);
      } else {
        setConfig({ ...DEFAULT_CONFIG, showRunningBalance: settings.showRunningBalance });
      }
    }
    fetchData();
  }, [user?.companyId, searchParams]);

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
      const [data, movementBefore] = await Promise.all([
        erpService.getVoucherWithEntries(user.companyId, selectedLedger, startDate, endDate),
        erpService.getLedgerMovementBeforeDate(user.companyId, selectedLedger, startDate)
      ]);
      
      const l = ledgers.find(l => l.id === selectedLedger);
      setOpeningBalance((l?.opening_balance || 0) + movementBefore);
      
      const processed = data.map((v: any) => {
        // Find the specific entry for our selected ledger
        const mainEntry = v.voucher_entries.find((e: any) => e.ledger_id === selectedLedger);
        
        // Find the "other side" particulars from all_entries
        const otherEntries = v.voucher_entries.filter((e: any) => e.ledger_id !== selectedLedger);
        
        let particulars = 'Self';
        if (otherEntries.length === 1) {
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

      processed.sort(compareLedgerVouchers);
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
  }, [selectedLedger, startDate, endDate, ledgers]);

  const filteredLedgers = ledgers.filter(l => 
    l.name.toLowerCase().includes(ledgerSearch.toLowerCase())
  );

  const handleLedgerSelect = (ledger: any) => {
    setSelectedLedger(ledger.id);
    setLedgerSearch(ledger.name);
    setShowLedgerList(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showLedgerList) {
      if (e.key === 'ArrowDown') setShowLedgerList(true);
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 >= filteredLedgers.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 < 0 ? filteredLedgers.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredLedgers.length) {
        e.preventDefault();
        handleLedgerSelect(filteredLedgers[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowLedgerList(false);
    }
  };

    const currentLedger = ledgers.find(l => l.id === selectedLedger);
    const groupName = currentLedger?.group_name?.toLowerCase() || '';
    const isDebtor = groupName.includes('debtor') || groupName.includes('asset') || groupName.includes('receivable');
    const isCreditor = groupName.includes('creditor') || groupName.includes('liability') || groupName.includes('payable');
    const isExpense = groupName.includes('expense');

    const openingBalanceVal = openingBalance;
    const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
    const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
    
    // Calculate display totals that include opening balance
    const displayOpeningDebit = openingBalance > 0 ? openingBalance : 0;
    const displayOpeningCredit = openingBalance < 0 ? Math.abs(openingBalance) : 0;
    
    const displayTotalDebit = totalDebit + displayOpeningDebit;
    const displayTotalCredit = totalCredit + displayOpeningCredit;

    let runningBalance = openingBalanceVal;

  const generateLedgerReportHtml = () => {
    if (!selectedLedger) return '';
    return generateLedgerStatementHtml({
      companyName: companyIdentity.companyName,
      companyAddress: companyIdentity.companyAddress,
      companyEmail: companyIdentity.printEmail || '',
      companyPhone: companyIdentity.printPhone || '',
      companyWebsite: companyIdentity.printWebsite || '',
      companyLogo: companyIdentity.companyLogo,
      vatBinTin: companyIdentity.vatBinTin || '',
      printHeader: settings.showPrintHeader !== false ? companyIdentity.printHeader : '',
      printFooter: settings.showPrintFooter !== false ? settings.printFooter : '',
      softwareFooterText: settings.appIdentity?.softwareFooterText || settings.developerContactText || DEFAULT_APP_BRANDING.softwareFooterText,
      showDeveloperContact: settings.showDeveloperContact !== false,
      reportLayout: settings.reportLayout,
      ledgerName: currentLedger?.name || 'Ledger Account',
      ledgerAddress: currentLedger?.address || '',
      startDate,
      endDate,
      openingBalance,
      entries,
      items,
      users,
      config: {
        format: config.format,
        showNarration: config.showNarration,
        showEnteredBy: config.showEnteredBy,
        showRunningBalance: config.showRunningBalance,
        enableStripeView: config.enableStripeView,
        showStockDescriptions: config.showStockDescriptions
      }
    });
  };

  const buildLedgerSpreadsheetPayload = () => {
    const ledgerName = currentLedger?.name || 'Ledger Account';
    const headers = [
      'Date',
      'Particulars',
      'Vch Type',
      'Ref No',
      'Serial No',
      'Debit',
      'Credit',
      ...(config.showRunningBalance ? ['Running Balance'] : [])
    ];

    const rows: Record<string, any>[] = [];
    rows.push({
      date: formatReportDate(startDate, settings.dateFormat),
      particulars: 'Opening Balance',
      vch_type: '',
      ref_no: '',
      serial_no: '',
      debit: openingBalance > 0 ? Number(openingBalance.toFixed(2)) : '',
      credit: openingBalance < 0 ? Number(Math.abs(openingBalance).toFixed(2)) : '',
      ...(config.showRunningBalance
        ? {
            running_balance: `${formatNumber(Math.abs(openingBalance))} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`
          }
        : {})
    });

    let bal = openingBalanceVal;
    entries.forEach((e) => {
      const dr = Number(e.debit || 0);
      const cr = Number(e.credit || 0);
      bal += dr - cr;
      rows.push({
        date: formatReportDate(e.vouchers?.v_date, settings.dateFormat),
        particulars: e.particulars || '',
        vch_type: e.vouchers?.v_type || '',
        ref_no: formatVoucherNo(e.vouchers?.v_no || e.vouchers?.ref_no || e.vouchers?.reference_no),
        serial_no: e.vouchers?.serial_no || e.vouchers?.auto_serial_no || '',
        debit: dr > 0 ? Number(dr.toFixed(2)) : '',
        credit: cr > 0 ? Number(cr.toFixed(2)) : '',
        ...(config.showRunningBalance
          ? { running_balance: `${formatNumber(Math.abs(bal))} ${bal >= 0 ? 'Dr' : 'Cr'}` }
          : {})
      });

      if (config.format === 'Detailed' && e.vouchers?.inventory?.length) {
        e.vouchers.inventory.forEach((inv: any) => {
          const itemName = items.find(i => i.id === inv.item_id)?.name || inv.item_name || 'Item';
          const unitLabel = inv.unit || 'Pcs';
          const qtyDisplay = `${formatQuantity(inv.qty, unitLabel)} ${unitLabel}`;
          rows.push({
            date: '',
            particulars: `  • ${itemName} (${qtyDisplay} @ ${formatNumber(inv.rate)})`,
            vch_type: 'Item',
            ref_no: '',
            serial_no: '',
            debit: '',
            credit: Number((inv.amount ?? (Number(inv.qty || 0) * Number(inv.rate || 0))).toFixed(2)),
            ...(config.showRunningBalance ? { running_balance: '' } : {})
          });
        });
      }

      if (config.showNarration && e.vouchers?.narration) {
        rows.push({
          date: '',
          particulars: `  Narration: ${e.vouchers.narration}`,
          vch_type: '',
          ref_no: '',
          serial_no: '',
          debit: '',
          credit: '',
          ...(config.showRunningBalance ? { running_balance: '' } : {})
        });
      }

      if (config.showEnteredBy) {
        const creator = users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System';
        rows.push({
          date: '',
          particulars: `  By: ${creator}`,
          vch_type: '',
          ref_no: '',
          serial_no: '',
          debit: '',
          credit: '',
          ...(config.showRunningBalance ? { running_balance: '' } : {})
        });
      }
    });

    const closingLabel = `${formatNumber(Math.abs(bal))} ${bal >= 0 ? 'Dr' : 'Cr'}`;
    const footerRow: Record<string, any> = {
      date: '',
      particulars: 'Grand Total (incl. Opening)',
      vch_type: '',
      ref_no: '',
      serial_no: '',
      debit: Number(displayTotalDebit.toFixed(2)),
      credit: Number(displayTotalCredit.toFixed(2)),
      ...(config.showRunningBalance ? { running_balance: `Closing: ${closingLabel}` } : {})
    };

    const safeLedgerSlug = ledgerName.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '') || 'Ledger';
    return {
      ledgerName,
      safeLedgerSlug,
      headers,
      rows,
      footerRow,
      closingLabel
    };
  };

  const handlePrint = () => {
    if (!selectedLedger) return;
    const html = generateLedgerReportHtml();
    if (!html) return;
    executePrint(html);
  };

  const handleDownloadExcel = () => {
    if (!selectedLedger) return;
    const payload = buildLedgerSpreadsheetPayload();
    exportStructuredExcel({
      fileName: `Ledger_Statement_${payload.safeLedgerSlug}_${startDate}_to_${endDate}`,
      sheetName: 'Ledger Statement',
      title: `Ledger Statement - ${payload.ledgerName}`,
      subtitle: `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}${currentLedger?.address ? ` | Address: ${currentLedger.address}` : ''}`,
      headers: payload.headers,
      rows: payload.rows,
      footerRow: payload.footerRow,
      settings,
      company
    });
  };

  const handleDownloadCSV = () => {
    if (!selectedLedger) return;
    const payload = buildLedgerSpreadsheetPayload();
    exportToCSV(
      `Ledger_Statement_${payload.safeLedgerSlug}_${startDate}_to_${endDate}`,
      `Ledger Statement: ${payload.ledgerName} (${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)})`,
      [...payload.rows, payload.footerRow],
      payload.headers,
      settings,
      company
    );
  };

  const handleDownloadPDF = () => {
    if (!selectedLedger) return;
    const html = generateLedgerReportHtml();
    if (!html) return;
    const ledgerName = (currentLedger?.name || 'Ledger').replace(/\s+/g, '_');
    printToPDF({
      title: `Ledger Statement: ${currentLedger?.name}`,
      subtitle: `Period: ${startDate} to ${endDate}`,
      fileName: `Ledger_Statement_${ledgerName}_${startDate}_to_${endDate}`,
      htmlContent: html,
      settings,
      company
    });
  };

  const handleEmailReport = () => {
    if (!selectedLedger) return;
    const payload = buildLedgerSpreadsheetPayload();
    shareReportViaEmail({
      title: `Ledger Statement - ${payload.ledgerName}`,
      subtitle: `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`,
      settings,
      company,
      summaryLines: [
        `Ledger Account: ${payload.ledgerName}`,
        `Opening Balance: ${formatNumber(Math.abs(openingBalance))} ${openingBalance >= 0 ? 'Dr' : 'Cr'}`,
        `Period Debit Total: ${formatNumber(totalDebit)}`,
        `Period Credit Total: ${formatNumber(totalCredit)}`,
        `Closing Balance: ${payload.closingLabel}`,
        `Transactions Count: ${entries.length}`
      ]
    });
  };

  const handleFullPageView = () => {
    const html = generateLedgerReportHtml();
    if (!html) return;
    setFullPageHtml(html);
  };

  return (
    <div className={cn(
      "h-screen flex flex-col transition-colors overflow-hidden",
      settings.reportsPageUiStyle === 'modern' ? "bg-muted/30" : "bg-background"
    )}>
      {/* Fixed Header Section */}
      <div className={cn(
        "flex-none border-b shadow-sm px-4 lg:px-6 py-4 space-y-4 z-30",
        settings.reportsPageUiStyle === 'modern'
          ? "bg-card/95 backdrop-blur-md border-border"
          : "bg-background border-border"
      )}>
        {/* Line 1: Search box and From-to date picker in 1 line */}
        <div className="flex flex-col md:flex-row items-end gap-4 w-full">
          {/* Search box */}
          <div className="flex-1 w-full relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('ledger.searchLedgers')}
                value={ledgerSearch || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setLedgerSearch(val);
                  if (!val) {
                    setSelectedLedger('');
                  }
                  setShowLedgerList(true);
                  setActiveIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                onFocus={() => setShowLedgerList(true)}
                className="w-full bg-muted/40 border border-border text-foreground pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all rounded-lg"
              />
            </div>
            
            {showLedgerList && ledgerSearch && (
              <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-xl max-h-60 overflow-y-auto rounded-xl">
                {filteredLedgers.length > 0 ? (
                  filteredLedgers.map((l, idx) => (
                    <button
                      key={l.id}
                      onClick={() => handleLedgerSelect(l)}
                      onMouseEnter={() => setActiveIndex(idx)}
                      className={cn(
                        "w-full text-left px-4 py-3 text-sm text-foreground hover:bg-muted/60 border-b border-border/50 last:border-none transition-colors",
                        activeIndex === idx && "bg-primary/10 text-primary"
                      )}
                    >
                      {l.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-muted-foreground">No matching ledgers</div>
                )}
              </div>
            )}
            {showLedgerList && (
              <div 
                data-modal-ignore="true"
                className="fixed inset-0 z-40" 
                onClick={() => setShowLedgerList(false)}
              />
            )}
          </div>

          {/* From-to date picker */}
          <div className="flex items-center gap-2 w-full md:w-auto md:shrink-0">
            <div className="w-full sm:w-40">
              <DateInput
                label={t('common.from')}
                value={startDate}
                onChange={setStartDate}
                className="w-full"
              />
            </div>
            <div className="w-full sm:w-40">
              <DateInput
                label={t('common.to')}
                value={endDate}
                onChange={setEndDate}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Line 2: Other buttons aligned right */}
        <div className="flex flex-wrap gap-2 justify-end items-center w-full">
          {/* Adjust Button */}
          <button 
            onClick={() => setShowAdjustmentModal(true)}
            disabled={!selectedLedger}
            className="px-3 py-2 bg-emerald-600/10 border border-emerald-600/20 rounded-lg text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase tracking-widest"
            title="Quick Adjustment"
          >
            <Calculator className="w-3.5 h-3.5" /> Adjust
          </button>

          {/* Elementor Report Designer Button */}
          <button 
            onClick={() => setIsReportBuilderOpen(true)}
            className="px-3 py-2 bg-blue-600/10 border border-blue-600/30 rounded-lg text-blue-600 hover:bg-blue-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider"
            title="Visual Elementor-style Drag & Drop Report Designer"
          >
            <Layout className="w-3.5 h-3.5" /> DESIGN REPORT
          </button>

          {/* Configure Button */}
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="px-3 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
            title="Configure Report"
          >
            <SettingsIcon className="w-3 h-3" /> F12: CONFIGURE
          </button>

          {/* Refresh/Search Button */}
          <button 
            onClick={fetchEntries}
            disabled={loading || !selectedLedger}
            className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex justify-center disabled:opacity-50"
            title="Refresh Data"
          >
            <Search className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>

          {/* Print Button */}
          <button 
            onClick={handlePrint}
            disabled={!selectedLedger}
            className="px-3 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
          >
            <Printer className="w-4 h-4" />
            {t('common.print')}
          </button>

          {/* Excel (.xlsx Primary) Button */}
          <button
            onClick={handleDownloadExcel}
            disabled={!selectedLedger}
            className="px-3 py-2 border border-border rounded-lg text-emerald-700 bg-emerald-50/70 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
            title="Export Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
          </button>

          {/* CSV Button */}
          <button 
            onClick={handleDownloadCSV}
            disabled={!selectedLedger}
            className="px-3 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
            title="Export CSV"
          >
            <Download className="w-3 h-3" /> CSV
          </button>

          {/* PDF Button */}
          <button 
            onClick={handleDownloadPDF}
            disabled={!selectedLedger}
            className="px-3 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
            title="Print to PDF (Save professional financial statement offline)"
          >
            <Download className="w-3 h-3" /> PRINT TO PDF
          </button>

          {/* Email Button */}
          <button
            onClick={handleEmailReport}
            disabled={!selectedLedger}
            className="px-3 py-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
            title="Share Summary via Email"
          >
            <Mail className="w-3.5 h-3.5" /> EMAIL
          </button>

          {/* Full Page View Button */}
          <button 
            onClick={handleFullPageView}
            disabled={!selectedLedger}
            className="px-4 py-2 bg-foreground text-background rounded-lg text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <FileText className="w-3.5 h-3.5" /> Full Page View
          </button>
        </div>
      </div>

      <ReportConfigModal 
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={config}
        onSave={handleSaveConfig}
        title={t('ledger.statement')}
      />

      {/* Report Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0 scroll-smooth">
        <div className={cn(
          "p-4 lg:p-6 space-y-6 min-h-full flex flex-col",
          settings.reportLayout === 'Layout 2' ? "bg-white" : "bg-background"
        )}>
          {selectedLedger && loading ? (
            <SkeletonLoader type="table" pageKey="ledgers" isFullPage={false} />
          ) : (
          <div id="ledger-report" className={cn(
            "bg-card border border-border relative flex-1 flex flex-col",
            settings.reportLayout === 'Layout 2' ? "bg-white text-black p-8 min-h-[800px] pb-32" : "rounded-xl overflow-hidden shadow-xs"
          )}>
          {settings.reportLayout === 'Layout 2' && (
            <div className="relative text-center mb-6 border-b-2 border-black pb-4">
              <div className="absolute top-0 right-0 text-[10px] font-bold text-black">Page 1</div>
              {companyIdentity.companyName && (
                <h2 className="text-xl font-bold uppercase text-black">{companyIdentity.companyName}</h2>
              )}
              {companyIdentity.companyAddress && (
                <p className="text-xs text-black whitespace-pre-line">{companyIdentity.companyAddress}</p>
              )}
              {companyIdentity.vatBinTin && (
                <p className="text-[10px] text-black">VAT/BIN/TIN: {companyIdentity.vatBinTin}</p>
              )}
              {(companyIdentity.printPhone || companyIdentity.printEmail) && (
                <p className="text-[10px] text-black">
                  {[companyIdentity.printPhone ? `Phone: ${companyIdentity.printPhone}` : '', companyIdentity.printEmail ? `E-Mail : ${companyIdentity.printEmail}` : ''].filter(Boolean).join(' | ')}
                </p>
              )}

              <div className="mt-4">
                <h3 className="text-lg font-bold text-black">{currentLedger?.name}</h3>
                {currentLedger?.address && <p className="text-xs text-black">{currentLedger.address}</p>}
                <p className="text-xs font-bold text-black border-t border-black/10 mt-1 pt-1">{formatReportDate(startDate, settings.dateFormat)} to {formatReportDate(endDate, settings.dateFormat)}</p>
              </div>
            </div>
          )}
          <div className="flex-1 min-h-0">
            <table className={cn(
              "w-full text-left text-xs min-w-[700px] border-separate border-spacing-0 h-full",
              settings.reportLayout === 'Layout 2' ? "border-y border-black table-fixed" : ""
            )}>
              <thead className={cn(
                "sticky top-0 z-20 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)]",
                settings.reportLayout === 'Layout 2' ? "bg-white" : "bg-card"
              )}>
              <tr className={cn(
                "border-b border-border text-muted-foreground uppercase bg-muted/50",
                settings.reportLayout === 'Layout 2' && "border-y-2 border-black text-black font-bold bg-white"
              )}>
                <th className={cn("px-6 py-4 font-medium border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[12%] border-black" : "w-[120px]")}>{t('common.date')}</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[28%] border-black" : "")}>{t('ledger.particulars')}</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>{t('ledger.vchType')}</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>Ref No</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[6%] border-black" : "")}>Serial No</th>
                <th className={cn("px-6 py-4 font-medium text-right border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>{t('reports.debit')}</th>
                <th className={cn("px-6 py-4 font-medium text-right border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>{t('reports.credit')}</th>
                {config.showRunningBalance && (
                  <th className={cn("px-6 py-4 font-medium text-right border-b border-border align-middle", settings.reportLayout === 'Layout 2' ? "w-[14%] border-black" : "")}>{t('ledger.runningBalance')}</th>
                )}
              </tr>
            </thead>
            <tbody className={cn(
              "text-foreground/80",
              settings.reportLayout === 'Layout 2' && "text-black"
            )}>
              {!selectedLedger ? (
                <tr><td colSpan={config.showRunningBalance ? 8 : 7} className="px-6 py-10 text-center text-muted-foreground align-middle">{t('ledger.selectToView')}</td></tr>
              ) : (
                <>
                  {/* Opening Balance Row */}
                  {(() => {
                    let rowCounter = 1;
                    const openingBalanceRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                    rowCounter++;
                    
                    return (
                      <>
                        <tr className={cn(
                          "border-b border-border/50 bg-muted/20 font-bold italic hover:bg-muted/80 cursor-pointer border-l-4 border-transparent hover:border-primary transition-colors",
                          settings.reportLayout === 'Layout 2' && "bg-white border-black text-black border",
                          settings.reportLayout === 'Layout 2' && openingBalanceRowIsStripe && "bg-[#F3F4F6]"
                        )}>
                          <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>{formatReportDate(startDate, settings.dateFormat)}</td>
                          <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>{t('ledger.openingBalance')}</td>
                          <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                          <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                          <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                          <td className={cn("px-6 py-4 text-right tabular-nums align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            {openingBalance > 0 ? formatNumber(openingBalance) : ''}
                          </td>
                          <td className={cn("px-6 py-4 text-right tabular-nums align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            {openingBalance < 0 ? formatNumber(Math.abs(openingBalance)) : ''}
                          </td>
                          {config.showRunningBalance && (
                            <td className={cn("px-6 py-4 text-right text-foreground tabular-nums align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            </td>
                          )}
                        </tr>

                        {entries.length === 0 ? (
                          <tr><td colSpan={config.showRunningBalance ? 8 : 7} className="px-6 py-10 text-center text-muted-foreground italic">{t('ledger.noTransactions')}</td></tr>
                        ) : entries.map((e, idx) => {
                          runningBalance += (e.debit || 0) - (e.credit || 0);
                          const currentBalance = runningBalance;
                          
                          const mainRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                          rowCounter++;

                          return (
                            <React.Fragment key={e.id}>
                              <tr 
                                className={cn(
                                  "border-b border-border/50 hover:bg-muted/80 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary",
                                  config.enableStripeView && settings.reportLayout !== 'Layout 2' && idx % 2 !== 0 && "bg-muted/30",
                                  settings.reportLayout === 'Layout 2' && "bg-white text-black border-black/10 hover:bg-gray-50",
                                  settings.reportLayout === 'Layout 2' && mainRowIsStripe && "bg-[#F3F4F6]"
                                )}
                                onClick={() => navigate(`/vouchers/view/${e.id}`)}
                                onContextMenu={(eEvent) => {
                                  eEvent.preventDefault();
                                  setContextMenu({
                                    isOpen: true,
                                    position: { x: eEvent.clientX, y: eEvent.clientY },
                                    voucher: e.vouchers || { id: e.id, v_type: e.vouchers?.v_type, total_amount: (e.debit || e.credit || 0) },
                                    particulars: e.particulars,
                                    amount: e.debit || e.credit || 0,
                                    date: e.vouchers?.v_date
                                  });
                                }}
                              >
                                <td className={cn("px-6 py-4 whitespace-nowrap align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>{formatReportDate(e.vouchers?.v_date, settings.dateFormat)}</td>
                                <td className="px-6 py-4 align-middle">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={cn("font-bold", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>
                                      {settings.reportLayout === 'Layout 2' ? `${e.debit > 0 ? 'Dr' : 'Cr'} ` : ''}{e.particulars}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(ev) => {
                                        ev.stopPropagation();
                                        const rect = ev.currentTarget.getBoundingClientRect();
                                        setContextMenu({
                                          isOpen: true,
                                          position: { x: rect.left, y: rect.bottom + 4 },
                                          voucher: e.vouchers || { id: e.id, v_type: e.vouchers?.v_type, total_amount: (e.debit || e.credit || 0) },
                                          particulars: e.particulars,
                                          amount: e.debit || e.credit || 0,
                                          date: e.vouchers?.v_date
                                        });
                                      }}
                                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-muted/80 rounded transition-all text-muted-foreground hover:text-foreground shrink-0"
                                      title="Actions (Right-click)"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                                <td className={cn("px-6 py-4 uppercase text-[10px] align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-muted-foreground")}>{e.vouchers?.v_type}</td>
                                <td className={cn("px-6 py-4 text-[10px] tabular-nums align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>
                                  {formatVoucherNo(e.vouchers?.v_no || e.vouchers?.ref_no || e.vouchers?.reference_no)}
                                </td>
                                <td className={cn("px-6 py-4 tabular-nums text-[10px] align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>
                                  {e.vouchers?.serial_no || e.vouchers?.auto_serial_no || '-'}
                                </td>
                                <td className={cn("px-6 py-4 text-right tabular-nums align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>{e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                <td className={cn("px-6 py-4 text-right tabular-nums align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>{e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                {config.showRunningBalance && (
                                  <td className={cn("px-6 py-4 text-right font-bold tabular-nums align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-foreground")}>
                                    {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currentBalance >= 0 ? 'Dr' : 'Cr'}
                                  </td>
                                )}
                              </tr>
                              {config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.map((item: any, iIdx: number) => {
                                const invRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                                rowCounter++;
                                const unitLabel = item.unit || 'Pcs';
                                return (
                                  <tr key={`inv-${idx}-${iIdx}`} className={cn(
                                    "border-b border-border/50",
                                    settings.reportLayout === 'Layout 2' && "bg-white text-black",
                                    settings.reportLayout === 'Layout 2' && invRowIsStripe && "bg-[#F3F4F6]"
                                  )}>
                                    <td className="align-middle"></td>
                                    <td className="px-6 py-1 pl-10 align-middle">
                                      <div className="flex flex-col">
                                        <div className="flex justify-between items-center gap-4">
                                          <span className="text-[11px] font-medium">{items.find(i => i.id === item.item_id)?.name || item.item_name}</span>
                                          <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">{formatQuantity(item.qty, unitLabel)} {unitLabel}</span>
                                        </div>
                                        {config.showStockDescriptions && item.description && (
                                          <span className="text-[9px] italic text-muted-foreground">{item.description}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="align-middle"></td>
                                    <td className="align-middle"></td>
                                    <td className="align-middle"></td>
                                    <td className="px-6 py-1 text-right text-[11px] tabular-nums text-muted-foreground italic align-middle">
                                      {formatNumber(item.rate)}
                                    </td>
                                    <td className="px-6 py-1 text-right text-[11px] tabular-nums align-middle">
                                      {formatNumber(item.amount ?? (Number(item.qty || 0) * Number(item.rate || 0)))}
                                    </td>
                                    {config.showRunningBalance && <td className="align-middle"></td>}
                                  </tr>
                                );
                              })}
                              {config.showNarration && e.vouchers?.narration && (() => {
                                const narrationRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                                rowCounter++;
                                return (
                                  <tr className={cn(
                                    "border-b border-border/50",
                                    settings.reportLayout === 'Layout 2' && "bg-white text-black",
                                    settings.reportLayout === 'Layout 2' && narrationRowIsStripe && "bg-[#F3F4F6]"
                                  )}>
                                    <td className="align-middle"></td>
                                    <td className={cn("px-6 py-1 pl-10 italic text-[10px] align-middle", settings.reportLayout === 'Layout 2' ? "text-black" : "text-muted-foreground")}>
                                      {e.vouchers.narration}
                                    </td>
                                  </tr>
                                );
                              })()}
                              {config.showEnteredBy && (() => {
                                const enteredByRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                                rowCounter++;
                                return (
                                  <tr className={cn(
                                    "border-b border-border/50",
                                    settings.reportLayout === 'Layout 2' && "bg-white text-black",
                                    settings.reportLayout === 'Layout 2' && enteredByRowIsStripe && "bg-[#F3F4F6]"
                                  )}>
                                    <td className="align-middle"></td>
                                    <td colSpan={config.showRunningBalance ? 7 : 6} className="px-6 py-1 pl-16 uppercase text-[8px] text-muted-foreground align-middle">
                                      By: {users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System'}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </React.Fragment>
                          );
                        })}
                  
                  <tr className={cn(
                    "border-t border-border font-bold",
                    settings.reportLayout === 'Layout 2' ? "bg-white text-black border border-black shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]" : "bg-muted/40 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"
                  )}>
                    <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>{t('common.grandTotal')}</td>
                    <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4 align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4 text-right tabular-nums align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>
                      {displayTotalDebit > 0 ? formatNumber(displayTotalDebit) : ''}
                    </td>
                    <td className={cn("px-6 py-4 text-right tabular-nums align-middle", settings.reportLayout === 'Layout 2' && "border border-black")}>
                      {displayTotalCredit > 0 ? formatNumber(displayTotalCredit) : ''}
                    </td>
                    {config.showRunningBalance && (
                      <td className={cn("px-6 py-4 text-right text-foreground font-bold bg-muted/10 tabular-nums align-middle", settings.reportLayout === 'Layout 2' && "border border-black bg-white")}>
                      </td>
                    )}
                  </tr>

                  {/* Totals Row Removed as requested */}
                </>
              );
            })()}
          </>
        )}
      </tbody>
          </table>
          {settings.reportLayout === 'Layout 2' && (
            <div className="absolute bottom-4 left-8 right-8 text-center border-t border-gray-100 pt-4">
              {settings.showPrintFooter && <p className="text-[10px] text-gray-600">{settings.printFooter}</p>}
              {settings.showDeveloperContact && (
                <p 
                  className={cn(
                    "text-[8px] text-gray-400 mt-1 whitespace-pre-line",
                    settings.developerContactAlignment === 'left' ? "text-left" : settings.developerContactAlignment === 'right' ? "text-right" : "text-center"
                  )}
                >
                  {settings.appIdentity?.softwareFooterText || settings.developerContactText || DEFAULT_APP_BRANDING.softwareFooterText}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
          )}

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

      <ReportBuilderModal
        isOpen={isReportBuilderOpen}
        onClose={() => setIsReportBuilderOpen(false)}
        sampleData={{
          company: {
            name: companyIdentity.companyName,
            address: companyIdentity.companyAddress,
            email: companyIdentity.printEmail || '',
            phone: companyIdentity.printPhone || ''
          },
          ledgerName: currentLedger?.name || 'Ledger Account',
          period: `${startDate} to ${endDate}`
        }}
      />

      <VoucherContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false, position: null }))}
        voucher={contextMenu.voucher}
        particulars={contextMenu.particulars}
        amount={contextMenu.amount}
        date={contextMenu.date}
        onRefresh={fetchEntries}
        onDeleted={fetchEntries}
      />

      <EnterpriseModal
        isOpen={!!fullPageHtml}
        onClose={() => setFullPageHtml(null)}
        title={`Full Page Preview — ${currentLedger?.name || 'Ledger Statement'}`}
        size="full"
        className="h-[90vh]"
        bodyClassName="p-0 overflow-hidden bg-white"
        headerExtra={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs font-bold uppercase border border-border bg-card text-foreground hover:bg-muted rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> {t('common.print')}
            </button>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs font-bold uppercase bg-primary text-primary-foreground hover:opacity-90 rounded-lg flex items-center gap-1.5 transition-opacity cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
          </div>
        }
      >
        {fullPageHtml && (
          <iframe
            title="Ledger Statement Full Page Preview"
            srcDoc={fullPageHtml}
            className="w-full h-full border-0 bg-white"
          />
        )}
      </EnterpriseModal>
    </div>
  </div>
</div>
);
}
