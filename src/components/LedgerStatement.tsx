import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, ArrowLeft, Calculator, FileText, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn, formatCurrency, formatNumber, formatQuantity } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printReport, printUtils } from '../utils/printUtils';
import { exportToCSV, exportToPDF, exportUtils } from '../utils/exportUtils';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
import { ReportConfigModal } from './ReportConfigModal';
import { QuickAdjustmentModal } from './QuickAdjustmentModal';
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

export function LedgerStatement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const settings = useSettings();
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [selectedLedger, setSelectedLedger] = useState<string>(searchParams.get('ledgerId') || '');
  const [ledgerSearch, setLedgerSearch] = useState('');
  const [showLedgerList, setShowLedgerList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [startDate, setStartDate] = useState(() => {
    return searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    return searchParams.get('to') || new Date().toLocaleDateString('en-CA');
  });
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [config, setConfig] = useState<ReportConfig>(DEFAULT_CONFIG);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [openingBalance, setOpeningBalance] = useState(0);

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

  const handlePrint = () => {
    printUtils.printElement('ledger-report', `Ledger Statement: ${currentLedger?.name || ''}`);
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('ledger-report', `Ledger_Statement_${currentLedger?.name || 'Report'}`);
  };

  const handleDownloadPDF = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    
    let rb = openingBalance;
    const exportData: any[] = [];
    let rowCounter = 1;
    
    // Opening Balance
    const obVal = rb;
    exportData.push({
      date: formatDate(startDate),
      particulars: 'Opening Balance',
      vch_no: '-',
      vch_type: '-',
      serial_no: '-',
      debit: (isDebtor || isExpense) ? Math.abs(obVal) : (isCreditor ? 0 : (obVal > 0 ? Math.abs(obVal) : 0)),
      credit: isCreditor ? Math.abs(obVal) : ((isDebtor || isExpense) ? 0 : (obVal < 0 ? Math.abs(obVal) : 0)),
      balance: '-',
      isShaded: config.enableStripeView && rowCounter % 2 !== 0
    });
    rowCounter++;

    entries.forEach(e => {
      rb += (e.debit || 0) - (e.credit || 0);
      
      // Main row
      exportData.push({
        date: formatDate(e.vouchers?.v_date),
        particulars: e.particulars,
        vch_no: e.vouchers?.v_no || '-',
        vch_type: e.vouchers?.v_type || '-',
        serial_no: e.vouchers?.serial_no || e.vouchers?.auto_serial_no || '-',
        debit: e.debit || 0,
        credit: e.credit || 0,
        balance: config.showRunningBalance ? `${formatNumber(Math.abs(rb))} ${rb >= 0 ? 'Dr' : 'Cr'}` : '',
        isShaded: config.enableStripeView && rowCounter % 2 !== 0
      });
      rowCounter++;

      // Inventory rows
      if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
        e.vouchers.inventory.forEach((item: any) => {
          const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
          exportData.push({
            date: '',
            particulars: `  ${itemName} (${formatQuantity(item.qty, item.unit || 'pcs')} ${item.unit || 'pcs'} @ ${formatNumber(item.rate)})`,
            vch_no: '',
            vch_type: '',
            debit: 0,
            credit: 0,
            balance: '',
            isShaded: config.enableStripeView && rowCounter % 2 !== 0
          });
          rowCounter++;
        });
      }

      // Narration
      if (config.showNarration && e.vouchers?.narration) {
        exportData.push({
          date: '',
          particulars: `  (${e.vouchers.narration})`,
          vch_no: '',
          vch_type: '',
          debit: 0,
          credit: 0,
          balance: '',
          isShaded: config.enableStripeView && rowCounter % 2 !== 0
        });
        rowCounter++;
      }

      // Entered By
      if (config.showEnteredBy) {
        const creator = users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System';
        exportData.push({
          date: '',
          particulars: `  Entered By: ${creator}`,
          vch_no: '',
          vch_type: '',
          debit: 0,
          credit: 0,
          balance: '',
          isShaded: config.enableStripeView && rowCounter % 2 !== 0
        });
        rowCounter++;
      }
    });

    // Closing Balance
    const finalBalance = rb;
    exportData.push({
      date: '',
      particulars: 'Closing Balance',
      vch_no: '-',
      vch_type: '-',
      serial_no: '-',
      debit: (isDebtor || isExpense) ? Math.abs(finalBalance) : (isCreditor ? 0 : (finalBalance > 0 ? Math.abs(finalBalance) : 0)),
      credit: isCreditor ? Math.abs(finalBalance) : ((isDebtor || isExpense) ? 0 : (finalBalance < 0 ? Math.abs(finalBalance) : 0)),
      balance: '-',
      isShaded: false 
    });

    const period = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    const headers = ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Debit', 'Credit'];
    if (config.showRunningBalance) headers.push('Balance');
    
    exportToPDF(`Ledger_Statement_${ledgerName.replace(/ /g, '_')}`, `Ledger Statement: ${ledgerName} (${period})`, exportData, headers, settings);
  };

  const handleFullPageView = () => {
    if (!selectedLedger) return;
    const ledgerName = currentLedger?.name || 'Ledger';
    const layout = settings.reportLayout || 'Layout 2';
    
    const period = `${formatDate(startDate)} to ${formatDate(endDate)}`;
    
    let rb = openingBalance;
    let totalDebitCounter = 0;
    let totalCreditCounter = 0;

    const generateLayout1 = () => {
      const displayTotalDebitCalc = totalDebit + (openingBalance > 0 ? openingBalance : 0);
      const displayTotalCreditCalc = totalCredit + (openingBalance < 0 ? Math.abs(openingBalance) : 0);
      const balancedTotal = Math.max(displayTotalDebitCalc, displayTotalCreditCalc);
      
      let finalFTotalD = displayTotalDebitCalc;
      let finalFTotalC = displayTotalCreditCalc;
      
      if (isDebtor || isExpense) {
        finalFTotalD = 0;
        finalFTotalC = balancedTotal;
      } else if (isCreditor) {
        finalFTotalD = balancedTotal;
        finalFTotalC = 0;
      }

      const reportRows = [
        `<tbody style="page-break-inside: avoid; break-inside: avoid;">
          <tr style="border-bottom: 0.1mm solid #333;">
            <td style="color: #000;">${formatDate(startDate)}</td>
            <td style="color: #000;"><b>Opening Balance</b></td>
            <td></td>
            <td></td>
            <td></td>
            <td style="text-align: right; color: #000;"><b>${openingBalance > 0 ? formatNumber(openingBalance) : ''}</b></td>
            <td style="text-align: right; color: #000;">${openingBalance < 0 ? formatNumber(Math.abs(openingBalance)) : ''}</td>
            <td style="text-align: right; color: #000;"></td>
          </tr>
        </tbody>`,
        ...entries.map(e => {
          rb += (e.debit || 0) - (e.credit || 0);
          totalDebitCounter += (e.debit || 0);
          totalCreditCounter += (e.credit || 0);
          const creator = users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System';
          
          let row = `
            <tbody style="page-break-inside: avoid; break-inside: avoid;">
              <tr style="border-bottom: 0.1mm solid #333;">
                <td style="color: #000;">${formatDate(e.vouchers?.v_date)}</td>
                <td style="color: #000;">
                  <div>Dr <b>${e.particulars}</b></div>
                  ${config.showNarration && e.vouchers?.narration ? `<div style="font-size: 10px; font-style: italic; margin-left: 10px; color: #000;">${e.vouchers.narration}</div>` : ''}
                </td>
                <td style="color: #000;">${e.vouchers?.v_type}</td>
                <td style="color: #000;">${e.vouchers?.v_no || e.vouchers?.reference_no || ''}</td>
                <td style="color: #000;">${e.vouchers?.serial_no || e.vouchers?.auto_serial_no || ''}</td>
                <td style="text-align: right; color: #000;">${e.debit > 0 ? formatNumber(e.debit) : ''}</td>
                <td style="text-align: right; color: #000;">${e.credit > 0 ? formatNumber(e.credit) : ''}</td>
                <td style="text-align: right; color: #000;">${config.showRunningBalance ? `${formatNumber(Math.abs(rb))} ${rb >= 0 ? 'Dr' : 'Cr'}` : ''}</td>
              </tr>`;

          if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
            const inventoryRows = e.vouchers.inventory.map((item: any) => {
              const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
              return `
                <div style="display: flex; font-size: 11px; margin-left: 40px; color: #000;">
                  <div style="width: 150px; text-align: right; padding-right: 20px;">${itemName}</div>
                  <div style="width: 80px; text-align: right;">${formatQuantity(item.qty, item.unit || 'Pcs')} ${item.unit || 'Pcs'}</div>
                  <div style="width: 100px; text-align: right;">${formatNumber(item.rate)}/Pcs</div>
                  <div style="width: 100px; text-align: right;">${formatNumber(item.amount)}</div>
                </div>
              `;
            }).join('');
            
            row += `<tr style="border-bottom: 0.1mm solid #333;">
              <td></td>
              <td colspan="7">
                <div style="padding: 5px; margin: 2px 0 2px 20px;">
                  ${inventoryRows}
                  ${config.showEnteredBy ? `<div style="font-size: 10px; margin-top: 5px; border-top: 1px dashed #000; padding-top: 2px; color: #000;"><i>Entered By : <b>${creator}</b></i></div>` : ''}
                </div>
              </td>
            </tr>`;
          } else if (config.showEnteredBy) {
            row += `<tr style="border-bottom: 0.1mm solid #333;">
              <td></td>
              <td colspan="7">
                <div style="font-size: 10px; margin-left: 40px; color: #000;"><i>Entered By : <b>${creator}</b></i></div>
              </td>
            </tr>`;
          }
          
          row += `</tbody>`;
          return row;
        })
      ].join('');

      const finalClosingBalance = rb;
      
      const closingBalanceRow = `
        <tr class="closing-balance" style="border-bottom: 0.1mm solid #333;">
          <td></td>
          <td style="color: #000;"><b>Closing Balance</b></td>
          <td></td>
          <td></td>
          <td></td>
          <td style="text-align: right; color: #000;"><b>${((isDebtor || isExpense) || (!(isDebtor || isExpense || isCreditor) && finalClosingBalance > 0)) ? formatNumber(Math.abs(finalClosingBalance)) : ''}</b></td>
          <td style="text-align: right; color: #000;"><b>${(isCreditor || (!(isDebtor || isExpense || isCreditor) && finalClosingBalance < 0)) ? formatNumber(Math.abs(finalClosingBalance)) : ''}</b></td>
          <td style="text-align: right; color: #000;"></td>
        </tr>
      `;

      return `
        <html>
          <head>
            <title>Ledger Statement - ${ledgerName}</title>
            <style>
              @page {
                size: A4;
                margin: 1.5cm 1cm;
                @top-right {
                  content: "Page " counter(page);
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  font-size: 11px;
                  font-weight: bold;
                  color: #000;
                }
              }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #000; }
              .container { max-width: 100%; }
              .header-box { border: 1px solid #000; padding: 10px; margin-bottom: 5px; text-align: center; }
              .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; }
              .ledger-box { border: 1px solid #000; padding: 10px; margin-bottom: 10px; text-align: center; }
              .ledger-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
              .period-box { text-align: center; margin-bottom: 10px; }
              .period-label { border: 1px solid #000; padding: 2px 15px; font-size: 12px; font-weight: bold; }
              .page-num { display: none !important; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 5px; border-bottom: 1px solid #333; table-layout: fixed; }
              th { border: 1px solid #000; padding: 5px; text-align: left; font-size: 12px; text-transform: capitalize; }
              .header-columns-row th { border-top: 1px solid #333; border-bottom: 1px solid #333; }
              .print-page-number::after {
                content: counter(page);
              }
              td { padding: 5px; text-align: left; font-size: 12px; vertical-align: top; }
              .stripe-row { background-color: #F3F4F6 !important; -webkit-print-color-adjust: exact; }
              .border-all td { border: 1px solid #000; }
              .text-right { text-align: right; }
              .closing-balance { border-top: 1px solid #000; font-weight: bold; }
              .total-row td { padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              
              <div class="header-box" style="display: grid; grid-template-columns: 100px 1fr 100px; align-items: center; border-bottom: 2px solid #000; padding: 5px; margin-bottom: 10px;">
                <div style="width: 100px; display: flex; justify-content: flex-start;">
                  ${settings?.companyLogo ? `<img src="${settings.companyLogo}" style="max-width: 80px; max-height: 80px; object-fit: contain;" referrerPolicy="no-referrer" />` : ''}
                </div>
                <div style="text-align: center;">
                  <div class="company-name">${settings?.companyName || 'COMPANY NAME'}</div>
                  <div style="font-size: 12px;">${settings?.companyAddress || ''}</div>
                  <div style="font-size: 12px;">
                    ${settings?.printEmail ? `E-Mail : ${settings.printEmail}` : ''}
                    ${settings?.printPhone ? ` | Phone: ${settings.printPhone}` : ''}
                    ${settings?.printWebsite ? ` | Web: ${settings.printWebsite}` : ''}
                  </div>
                </div>
                <div style="width: 100px;"></div>
              </div>
              
              <div class="ledger-box" style="border: none; padding: 0; margin-bottom: 10px;">
                <div class="ledger-name">${ledgerName}</div>
                <div style="font-size: 12px;">${currentLedger?.address || ''}</div>
              </div>
              
              <div class="period-box">
                <span class="period-label">${period}</span>
              </div>
              
              <table>
                <thead>
                  <tr style="border: none !important;">
                    <td colspan="8" style="text-align: right; border: none !important; padding: 2px 2px 6px 0; font-size: 11px; font-weight: bold; font-family: 'Segoe UI', sans-serif; color: #000; direction: ltr;">
                      Page <span class="print-page-number"></span>
                    </td>
                  </tr>
                  <tr class="header-columns-row">
                    <th style="width: 10%; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Date</th>
                    <th style="width: 33%; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Particulars</th>
                    <th style="width: 10%; white-space: nowrap; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Vch Type</th>
                    <th style="width: 9%; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Ref No</th>
                    <th style="width: 6%; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Serial No</th>
                    <th style="width: 11%; text-align: right; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Debit</th>
                    <th style="width: 11%; text-align: right; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Credit</th>
                    <th style="width: 10%; text-align: right; border-top: 1px solid #333; border-bottom: 1px solid #333; border-left: 1px solid #000; border-right: 1px solid #000;">Balance</th>
                  </tr>
                </thead>
                ${reportRows}
                <tbody style="page-break-inside: avoid; break-inside: avoid;">
                  ${closingBalanceRow}
                </tbody>
              </table>
            </div>
            <script>window.print();</script>
          </body>
        </html>
      `;
    };

    const generateLayout2 = () => {
      let rowCounter = 1;
      
      const openingBalanceRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
      rowCounter++;

      const openingBalanceRow = `
        <tr class="border-all ${openingBalanceRowIsStripe ? 'stripe-row' : ''}">
          <td style="padding: 2px 5px;">${formatDate(startDate)}</td>
          <td style="padding: 2px 5px;"><b>Opening Balance</b></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px; text-align: right;"><b>${openingBalance > 0 ? formatNumber(openingBalance) : ''}</b></td>
          <td style="padding: 2px 5px; text-align: right;">${openingBalance < 0 ? formatNumber(Math.abs(openingBalance)) : ''}</td>
          ${config.showRunningBalance ? `<td style="padding: 2px 5px; text-align: right;"></td>` : ''}
        </tr>
      `;

      const reportRows = entries.map((e) => {
        rb += (e.debit || 0) - (e.credit || 0);
        totalDebitCounter += (e.debit || 0);
        totalCreditCounter += (e.credit || 0);
        const creator = users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System';
        
        const mainRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
        rowCounter++;

        let inventoryRows = '';
        if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
          inventoryRows = e.vouchers.inventory.map((item: any) => {
            const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
            const invRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
            rowCounter++;
            
            return `
              <tr class="${invRowIsStripe ? 'stripe-row' : ''}">
                <td></td>
                <td style="padding: 1px 5px 1px 20px; font-size: 11px; color: #000;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <span style="font-weight: 500;">${itemName}</span>
                    <span style="font-size: 10px; color: #000; white-space: nowrap;">${formatQuantity(item.qty, item.unit || 'pcs')} ${item.unit || 'pcs'}</span>
                  </div>
                  ${config.showStockDescriptions && item.description ? `<div style="font-size: 9px; font-style: italic; color: #000;">${item.description}</div>` : ''}
                </td>
                <td style="padding: 1px 5px; font-size: 11px; text-align: right; color: #000;">${formatNumber(item.rate)}</td>
                <td style="padding: 1px 5px; font-size: 11px; text-align: right; color: #000;">${formatNumber(item.amount)}</td>
                <td></td>
                <td></td>
                <td></td>
                ${config.showRunningBalance ? '<td></td>' : ''}
              </tr>
            `;
          }).join('');
        }

        let extraRows = '';
        if (config.showNarration && e.vouchers?.narration) {
          const narrationRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
          rowCounter++;
          extraRows += `
            <tr class="${narrationRowIsStripe ? 'stripe-row' : ''}">
              <td></td>
              <td colspan="${config.showRunningBalance ? '7' : '6'}" style="padding: 1px 5px 1px 20px; font-size: 10px; font-style: italic; color: #000;">
                ${e.vouchers.narration}
              </td>
            </tr>
          `;
        }
        if (config.showEnteredBy) {
          const enteredByRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
          rowCounter++;
          extraRows += `
            <tr class="${enteredByRowIsStripe ? 'stripe-row' : ''}">
              <td></td>
              <td colspan="${config.showRunningBalance ? '7' : '6'}" style="padding: 1px 5px 1px 40px; font-size: 10px; color: #000;">
                <i>Entered By : <b>${creator}</b></i>
              </td>
            </tr>
          `;
        }
        
        return `
          <tbody style="page-break-inside: avoid; break-inside: avoid;">
            <tr class="${mainRowIsStripe ? 'stripe-row' : ''}" style="border-bottom: 0.1mm solid #333;">
              <td style="padding: 2px 5px; white-space: nowrap; color: #000;">${formatDate(e.vouchers?.v_date)}</td>
              <td style="padding: 2px 5px; color: #000;">
                <div>Dr <b>${e.particulars}</b></div>
              </td>
              <td style="padding: 2px 5px; color: #000;">${e.vouchers?.v_type}</td>
              <td style="padding: 2px 5px; color: #000;">${e.vouchers?.v_no || e.vouchers?.reference_no || ''}</td>
              <td style="padding: 2px 5px; color: #000;">${e.vouchers?.serial_no || e.vouchers?.auto_serial_no || ''}</td>
              <td style="padding: 2px 5px; text-align: right; color: #000;">${e.debit > 0 ? formatNumber(e.debit) : ''}</td>
              <td style="padding: 2px 5px; text-align: right; color: #000;">${e.credit > 0 ? formatNumber(e.credit) : ''}</td>
              ${config.showRunningBalance ? `<td style="padding: 2px 5px; text-align: right; font-weight: 500; color: #000;">${formatNumber(Math.abs(rb))} ${rb >= 0 ? 'Dr' : 'Cr'}</td>` : ''}
            </tr>
            ${inventoryRows}
            ${extraRows}
          </tbody>
        `;
      }).join('');

      const finalClosingBalance = rb;
      
      const closingBalanceRow = `
        <tr class="border-all">
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"><b>Closing Balance</b></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px; text-align: right; color: #000;"><b>${((isDebtor || isExpense) || (!(isDebtor || isExpense || isCreditor) && finalClosingBalance > 0)) ? Math.abs(finalClosingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          <td style="padding: 2px 5px; text-align: right; color: #000;"><b>${(isCreditor || (!(isDebtor || isExpense || isCreditor) && finalClosingBalance < 0)) ? Math.abs(finalClosingBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          ${config.showRunningBalance ? `<td style="padding: 2px 5px; text-align: right;"></td>` : ''}
        </tr>
      `;

      const footerHtml = `
        <div class="footer">
          ${settings.showPrintFooter ? `<div style="font-size: 10px; color: #000;">${settings.printFooter}</div>` : ''}
          ${settings.showDeveloperContact ? `<div class="dev-contact">${settings.developerContactText || 'Powered by TallyFlow ERP | Developer Contact: +880 1700 000000'}</div>` : ''}
        </div>
      `;

      return `
        <html>
          <head>
            <title>Ledger Statement - ${ledgerName}</title>
            <style>
              @page {
                size: A4;
                margin: 1.5cm 1cm;
                @top-right {
                  content: "Page " counter(page);
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  font-size: 11px;
                  font-weight: bold;
                  color: #000;
                }
              }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #000; }
              .container { max-width: 100%; }
              
              .header-section { text-align: center; margin-bottom: 20px; }
              .company-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
              .company-details { font-size: 12px; margin-bottom: 2px; }
              .email-line { border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2px; margin-bottom: 15px; }
              
              .ledger-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
              .ledger-label { font-size: 12px; margin-bottom: 2px; }
              .ledger-address { font-size: 12px; margin-bottom: 15px; }
              
              .period-text { font-size: 12px; margin-bottom: 10px; }
              
              .page-num { display: none !important; }
              
              table { width: 100%; border-collapse: collapse; border-bottom: 1px solid #000; }
              th { border-bottom: 1px solid #000; padding: 5px; text-align: left; font-size: 12px; }
              .header-columns-row th { border-top: 1px solid #000; border-bottom: 1px solid #000; }
              .print-page-number::after {
                content: counter(page);
              }
              td { padding: 2px 5px; text-align: left; font-size: 12px; vertical-align: top; }
              
              .stripe-row { background-color: #F3F4F6 !important; -webkit-print-color-adjust: exact; }
              
              .footer { 
                position: fixed; 
                bottom: 0; 
                left: 0; 
                right: 0; 
                text-align: center; 
                padding: 10px 0;
                border-top: 1px solid #eee;
                background: white;
              }
              .dev-contact {
                font-size: 8px;
                color: #555;
                margin-top: 4px;
                text-align: ${settings.developerContactAlignment || 'center'};
                white-space: pre-line;
              }
              
              @media print {
                .footer { position: fixed; bottom: 0; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header-section" style="display: grid; grid-template-columns: 100px 1fr 100px; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 10px;">
                <div style="width: 100px; display: flex; justify-content: flex-start;">
                  ${settings?.companyLogo ? `<img src="${settings.companyLogo}" style="max-width: 80px; max-height: 80px; object-fit: contain;" referrerPolicy="no-referrer" />` : ''}
                </div>
                <div style="text-align: center;">
                  <div class="company-name">${settings?.companyName || 'COMPANY NAME'}</div>
                  <div class="company-details">${settings?.companyAddress || ''}</div>
                  <div class="company-details">
                    <span>E-Mail : ${settings?.printEmail || ''}</span>
                  </div>
                </div>
                <div style="width: 100px;"></div>
              </div>
              
              <div style="text-align: center; margin-bottom: 10px;">
                <div class="ledger-name">${ledgerName}</div>
                <div class="ledger-address" style="margin-bottom: 5px;">${currentLedger?.address || ''}</div>
                <div class="period-text" style="font-weight: bold;">${period}</div>
              </div>
              
              <table>
                <thead>
                  <tr style="border: none !important;">
                    <td colspan="${config.showRunningBalance ? '8' : '7'}" style="text-align: right; border: none !important; padding: 2px 2px 6px 0; font-size: 11px; font-weight: bold; font-family: 'Segoe UI', sans-serif; color: #000; direction: ltr;">
                      Page <span class="print-page-number"></span>
                    </td>
                  </tr>
                  <tr class="header-columns-row">
                    <th style="width: 12%;">Date</th>
                    <th style="width: 29%;">Particulars</th>
                    <th style="width: 10%; white-space: nowrap;">Vch Type</th>
                    <th style="width: 9%;">Ref No</th>
                    <th style="width: 6%;">Serial No</th>
                    <th style="width: 10%; text-align: right;">Debit</th>
                    <th style="width: 10%; text-align: right;">Credit</th>
                    ${config.showRunningBalance ? '<th style="width: 14%; text-align: right;">Balance</th>' : ''}
                  </tr>
                </thead>
                <tbody style="page-break-inside: avoid; break-inside: avoid;">
                  ${openingBalanceRow}
                </tbody>
                ${reportRows}
                <tbody style="page-break-inside: avoid; break-inside: avoid;">
                  ${closingBalanceRow}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="${config.showRunningBalance ? '8' : '7'}" style="border: none; padding: 0; height: 45px;"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            ${footerHtml}
            <script>window.print();</script>
          </body>
        </html>
      `;
    };

    const html = layout === 'Layout 1' ? generateLayout1() : generateLayout2();
    
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  return (
    <div className={cn(
      "h-screen flex flex-col font-mono transition-colors overflow-hidden",
      settings.reportsPageUiStyle === 'modern' ? "bg-slate-50/50" : "bg-background"
    )}>
      {/* Fixed Header Section */}
      <div className={cn(
        "flex-none border-b shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30",
        settings.reportsPageUiStyle === 'modern'
          ? "bg-white/95 backdrop-blur-md border-slate-200/60"
          : "bg-background border-border"
      )}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className={settings.reportsPageUiStyle === 'modern'
                ? "p-2.5 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl transition-all text-slate-600 shadow-sm"
                : "p-2 hover:bg-gray-100 rounded-full transition-colors"
              }
            >
              <ArrowLeft className={settings.reportsPageUiStyle === 'modern' ? "w-5 h-5" : "w-6 h-6"} />
            </button>
            <EditableHeader 
              pageId="ledger_statement"
              defaultTitle={t('ledger.statement')}
              defaultSubtitle={settings.companyName}
            />
          </div>
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
          <div className="flex-1 w-full sm:max-w-3xl space-y-4">
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('ledger.searchLedgers')}
                  value={ledgerSearch || ''}
                  onChange={(e) => {
                    setLedgerSearch(e.target.value);
                    setShowLedgerList(true);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowLedgerList(true)}
                  className="w-full bg-gray-50 border border-border text-foreground pl-11 pr-4 py-3 text-sm outline-none focus:border-foreground transition-all rounded-lg"
                />
              </div>
              
              {showLedgerList && ledgerSearch && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-border shadow-xl max-h-60 overflow-y-auto rounded-lg">
                  {filteredLedgers.length > 0 ? (
                    filteredLedgers.map((l, idx) => (
                      <button
                        key={l.id}
                        onClick={() => handleLedgerSelect(l)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={cn(
                          "w-full text-left px-4 py-3 text-sm text-foreground hover:bg-gray-50 border-b border-border/50 last:border-none transition-colors",
                          activeIndex === idx && "bg-blue-50 text-blue-700"
                        )}
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
                {t('common.print')}
              </button>
              <button 
                onClick={handleDownload}
                disabled={!selectedLedger || entries.length === 0}
                className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
                title={t('common.downloadPdf')}
              >
                <Download className="w-3 h-3" /> CSV
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={!selectedLedger || entries.length === 0}
                className="px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
                title={t('common.downloadPdf')}
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
        <div className="p-4 lg:p-6 space-y-6 min-h-full flex flex-col bg-white">
          <div id="ledger-report" className={cn(
            "bg-card border border-border relative flex-1 flex flex-col",
            settings.reportLayout === 'Layout 2' && "bg-white text-black p-8 min-h-[800px] pb-32"
          )}>
          {settings.reportLayout === 'Layout 2' && (
            <>
              <div className="text-center mb-6 border-b-2 border-black pb-4">
                <h2 className="text-xl font-bold uppercase text-black">{settings.companyName}</h2>
                <p className="text-xs text-black">{settings.companyAddress}</p>
                <p className="text-[10px] text-black">E-Mail : {settings.printEmail}</p>
                
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-black">{currentLedger?.name}</h3>
                  <p className="text-xs text-black">{currentLedger?.address}</p>
                  <p className="text-xs font-bold text-black border-t border-black/10 mt-1 pt-1">{formatReportDate(startDate, settings.dateFormat)} to {formatReportDate(endDate, settings.dateFormat)}</p>
                </div>
              </div>
              <div className="absolute top-8 right-8 border border-black px-2 py-1 text-[10px] text-black">Page 1</div>
            </>
          )}
          <div className="flex-1 min-h-0">
            <table className={cn(
              "w-full text-left text-xs min-w-[700px] border-separate border-spacing-0 h-full",
              settings.reportLayout === 'Layout 2' ? "border-y border-black table-fixed" : ""
            )}>
              <thead className="sticky top-0 z-20 bg-white shadow-[0_2px_10px_-3px_rgba(0,0,0,0.1)]">
              <tr className={cn(
                "border-b border-border text-gray-500 uppercase bg-gray-50/50",
                settings.reportLayout === 'Layout 2' && "border-y-2 border-black text-black font-bold bg-white"
              )}>
                <th className={cn("px-6 py-4 font-medium border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[12%] border-black" : "w-[120px]")}>{t('common.date')}</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[28%] border-black" : "")}>{t('ledger.particulars')}</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>{t('ledger.vchType')}</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>Ref No</th>
                <th className={cn("px-6 py-4 font-medium border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[6%] border-black" : "")}>Serial No</th>
                <th className={cn("px-6 py-4 font-medium text-right border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>{t('reports.debit')}</th>
                <th className={cn("px-6 py-4 font-medium text-right border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[10%] border-black" : "")}>{t('reports.credit')}</th>
                {config.showRunningBalance && (
                  <th className={cn("px-6 py-4 font-medium text-right border-b border-border", settings.reportLayout === 'Layout 2' ? "w-[14%] border-black" : "")}>{t('ledger.runningBalance')}</th>
                )}
              </tr>
            </thead>
            <tbody className={cn(
              "text-foreground/80",
              settings.reportLayout === 'Layout 2' && "text-black"
            )}>
              {!selectedLedger ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-600">{t('ledger.selectToView')}</td></tr>
              ) : loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-600">{t('ledger.loadingEntries')}</td></tr>
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
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>{formatReportDate(startDate, settings.dateFormat)}</td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>{t('ledger.openingBalance')}</td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                          <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            {openingBalance > 0 ? formatNumber(openingBalance) : ''}
                          </td>
                          <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            {openingBalance < 0 ? formatNumber(Math.abs(openingBalance)) : ''}
                          </td>
                          {config.showRunningBalance && (
                            <td className={cn("px-6 py-4 text-right text-foreground", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            </td>
                          )}
                        </tr>

                        {entries.length === 0 ? (
                          <tr><td colSpan={config.showRunningBalance ? 8 : 7} className="px-6 py-10 text-center text-gray-600 italic">{t('ledger.noTransactions')}</td></tr>
                        ) : entries.map((e, idx) => {
                          runningBalance += (e.debit || 0) - (e.credit || 0);
                          const currentBalance = runningBalance;
                          
                          const mainRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                          rowCounter++;

                          return (
                            <React.Fragment key={e.id}>
                              <tr 
                                className={cn(
                                  "border-b border-black/10 hover:bg-muted/80 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary",
                                  config.enableStripeView && !settings.reportLayout && idx % 2 !== 0 && "bg-muted/30",
                                  settings.reportLayout === 'Layout 2' && "bg-white text-black hover:bg-gray-50",
                                  settings.reportLayout === 'Layout 2' && mainRowIsStripe && "bg-[#F3F4F6]"
                                )}
                                onClick={() => navigate(`/vouchers/view/${e.id}`)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-black">{formatReportDate(e.vouchers?.v_date, settings.dateFormat)}</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-black font-bold">
                                      {settings.reportLayout === 'Layout 2' ? 'Dr ' : ''}{e.particulars}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 uppercase text-[10px] text-black">{e.vouchers?.v_type}</td>
                                <td className="px-6 py-4 text-[10px] text-black">
                                  {e.vouchers?.v_no || e.vouchers?.ref_no || e.vouchers?.reference_no}
                                </td>
                                <td className="px-6 py-4 text-black font-mono text-[10px]">
                                  {e.vouchers?.serial_no || e.vouchers?.auto_serial_no || '-'}
                                </td>
                                <td className="px-6 py-4 text-right text-black">{e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                <td className="px-6 py-4 text-right text-black">{e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                {config.showRunningBalance && (
                                  <td className="px-6 py-4 text-right text-black font-bold">
                                    {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currentBalance >= 0 ? 'Dr' : 'Cr'}
                                  </td>
                                )}
                              </tr>
                              {config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.map((item: any, iIdx: number) => {
                                const invRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                                rowCounter++;
                                return (
                                  <tr key={`inv-${idx}-${iIdx}`} className={cn(
                                    "border-b border-border/50",
                                    settings.reportLayout === 'Layout 2' && "bg-white text-black",
                                    settings.reportLayout === 'Layout 2' && invRowIsStripe && "bg-[#F3F4F6]"
                                  )}>
                                    <td></td>
                                    <td className="px-6 py-1 pl-10">
                                      <div className="flex flex-col">
                                        <div className="flex justify-between items-start gap-4">
                                          <span className="text-[11px] font-medium">{items.find(i => i.id === item.item_id)?.name}</span>
                                          <span className="text-[10px] text-gray-600 whitespace-nowrap">{item.qty.toLocaleString()} {item.unit || 'pcs'}</span>
                                        </div>
                                        {config.showStockDescriptions && item.description && (
                                          <span className="text-[9px] italic text-gray-400">{item.description}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td></td>
                                    <td></td>
                                    <td></td>
                                    <td className="px-6 py-1 text-right text-[11px] font-mono text-gray-400 italic">
                                      {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-1 text-right text-[11px] font-mono">
                                      {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    {config.showRunningBalance && <td></td>}
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
                                    <td></td>
                                    <td colSpan={config.showRunningBalance ? 7 : 6} className="px-6 py-1 pl-10 italic text-[10px] text-black">
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
                                    <td></td>
                                    <td colSpan={config.showRunningBalance ? 7 : 6} className="px-6 py-1 pl-16 uppercase text-[8px] text-gray-400">
                                      By: {users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System'}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </React.Fragment>
                          );
                        })}
                  
                  <tr className={cn(
                    "border-t border-black/50 font-bold",
                    settings.reportLayout === 'Layout 2' ? "bg-white text-black border border-black shadow-[0_-2px_10px_-3px_rgba(0,0,0,0.1)]" : "bg-foreground/5 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]"
                  )}>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>{t('common.grandTotal')}</td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                      {displayTotalDebit > 0 ? formatNumber(displayTotalDebit) : ''}
                    </td>
                    <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                      {displayTotalCredit > 0 ? formatNumber(displayTotalCredit) : ''}
                    </td>
                    {config.showRunningBalance && (
                      <td className={cn("px-6 py-4 text-right text-foreground font-bold bg-muted/10", settings.reportLayout === 'Layout 2' && "border border-black bg-white")}>
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
                  {settings.developerContactText || 'Powered by TallyFlow ERP | Developer Contact: +880 1700 000000'}
                </p>
              )}
            </div>
          )}
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
  </div>
</div>
);
}
