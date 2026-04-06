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
  showRunningBalance: true,
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
      if (lData) setLedgers(lData);
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
  const openingBalance = currentLedger?.opening_balance || 0;
  const totalDebit = entries.reduce((sum, e) => sum + (e.debit || 0), 0);
  const totalCredit = entries.reduce((sum, e) => sum + (e.credit || 0), 0);
  let runningBalance = openingBalance;

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
    if (settings.reportLayout === 'Layout 2') {
      handleFullPageView();
      return;
    }
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
    const exportData: any[] = [];
    let rowCounter = 1;
    
    // Opening Balance
    exportData.push({
      date: formatDate(startDate),
      particulars: 'Opening Balance',
      vch_no: '-',
      vch_type: '-',
      debit: rb > 0 ? rb : 0,
      credit: rb < 0 ? Math.abs(rb) : 0,
      balance: `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}`,
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
        debit: e.debit || 0,
        credit: e.credit || 0,
        balance: config.showRunningBalance ? `${Math.abs(rb).toFixed(2)} ${rb >= 0 ? 'Dr' : 'Cr'}` : '',
        isShaded: config.enableStripeView && rowCounter % 2 !== 0
      });
      rowCounter++;

      // Inventory rows
      if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
        e.vouchers.inventory.forEach((item: any) => {
          const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
          exportData.push({
            date: '',
            particulars: `  ${itemName} (${item.qty} ${item.unit || 'pcs'} @ ${item.rate})`,
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
      vch_no: '',
      vch_type: '',
      debit: finalBalance < 0 ? Math.abs(finalBalance) : 0,
      credit: finalBalance >= 0 ? Math.abs(finalBalance) : 0,
      balance: Math.abs(finalBalance).toFixed(2),
      isShaded: false // Closing balance usually not shaded or special
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
    
    let rb = currentLedger?.opening_balance || 0;
    let totalDebit = (rb > 0 ? rb : 0);
    let totalCredit = (rb < 0 ? Math.abs(rb) : 0);

    const generateLayout1 = () => {
      const reportRows = [
        `<tr>
          <td>${formatDate(startDate)}</td>
          <td>Dr <b>Opening Balance</b></td>
          <td></td>
          <td></td>
          <td style="text-align: right;"><b>${rb > 0 ? rb.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          <td style="text-align: right;">${rb < 0 ? Math.abs(rb).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
          <td style="text-align: right;">${Math.abs(rb).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${rb >= 0 ? 'Dr' : 'Cr'}</td>
        </tr>`,
        ...entries.map(e => {
          rb += (e.debit || 0) - (e.credit || 0);
          totalDebit += (e.debit || 0);
          totalCredit += (e.credit || 0);
          const creator = users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System';
          
          let row = `<tr>
            <td>${formatDate(e.vouchers?.v_date)}</td>
            <td>
              <div>Dr <b>${e.particulars}</b></div>
              ${config.showNarration && e.vouchers?.narration ? `<div style="font-size: 10px; font-style: italic; margin-left: 10px;">(${e.vouchers.narration})</div>` : ''}
            </td>
            <td>${e.vouchers?.v_type}</td>
            <td>${e.vouchers?.v_no}</td>
            <td style="text-align: right;">${e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
            <td style="text-align: right;">${e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
            <td style="text-align: right;">${config.showRunningBalance ? `${Math.abs(rb).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${rb >= 0 ? 'Dr' : 'Cr'}` : ''}</td>
          </tr>`;

          if (config.format === 'Detailed' && e.vouchers?.inventory && e.vouchers.inventory.length > 0) {
            const inventoryRows = e.vouchers.inventory.map((item: any) => {
              const itemName = items.find(i => i.id === item.item_id)?.name || 'Unknown';
              return `
                <div style="display: flex; font-size: 11px; margin-left: 40px; color: #000;">
                  <div style="width: 150px; text-align: right; padding-right: 20px;">${itemName}</div>
                  <div style="width: 80px; text-align: right;">${item.qty.toLocaleString()} ${item.unit || 'Pcs'}</div>
                  <div style="width: 100px; text-align: right;">${item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}/Pcs</div>
                  <div style="width: 100px; text-align: right;">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              `;
            }).join('');
            
            row += `<tr>
              <td></td>
              <td colspan="6">
                <div style="border: 1px solid #eee; padding: 5px; margin: 2px 0 2px 20px;">
                  ${inventoryRows}
                  ${config.showEnteredBy ? `<div style="font-size: 10px; margin-top: 5px; border-top: 1px dashed #ccc; padding-top: 2px;"><i>Entered By : <b>${creator}</b></i></div>` : ''}
                </div>
              </td>
            </tr>`;
          } else if (config.showEnteredBy) {
            row += `<tr>
              <td></td>
              <td colspan="6">
                <div style="font-size: 10px; margin-left: 40px;"><i>Entered By : <b>${creator}</b></i></div>
              </td>
            </tr>`;
          }
          
          return row;
        })
      ].join('');

      const finalBalance = rb;
      const closingBalanceRow = `
        <tr class="closing-balance">
          <td></td>
          <td><b>${finalBalance >= 0 ? 'Cr' : 'Dr'} Closing Balance</b></td>
          <td></td>
          <td></td>
          <td style="text-align: right;"><b>${finalBalance < 0 ? Math.abs(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          <td style="text-align: right;"><b>${finalBalance >= 0 ? Math.abs(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          <td style="text-align: right;"></td>
        </tr>
        <tr class="total-row">
          <td></td>
          <td></td>
          <td></td>
          <td></td>
          <td style="text-align: right; border-top: 1px solid #000; border-bottom: 3px double #000;"><b>${(totalDebit + (finalBalance < 0 ? Math.abs(finalBalance) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
          <td style="text-align: right; border-top: 1px solid #000; border-bottom: 3px double #000;"><b>${(totalCredit + (finalBalance >= 0 ? Math.abs(finalBalance) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
          <td></td>
        </tr>
      `;

      return `
        <html>
          <head>
            <title>Ledger Statement - ${ledgerName}</title>
            <style>
              @page { size: A4; margin: 1cm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #000; }
              .container { max-width: 100%; }
              .header-box { border: 1px solid #000; padding: 10px; margin-bottom: 5px; text-align: center; }
              .company-name { font-size: 18px; font-weight: bold; text-transform: uppercase; }
              .ledger-box { border: 1px solid #000; padding: 10px; margin-bottom: 10px; text-align: center; }
              .ledger-name { font-size: 16px; font-weight: bold; text-transform: uppercase; }
              .period-box { text-align: center; margin-bottom: 10px; }
              .period-label { border: 1px solid #000; padding: 2px 15px; font-size: 12px; font-weight: bold; }
              .page-num { text-align: right; font-size: 11px; margin-bottom: 5px; }
              .page-num span { border: 1px solid #000; padding: 2px 10px; }
              
              table { width: 100%; border-collapse: collapse; margin-top: 5px; border-top: 2px solid #000; border-bottom: 2px solid #000; table-layout: fixed; }
              th { border: 1px solid #000; padding: 5px; text-align: left; font-size: 12px; text-transform: capitalize; }
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
              <div class="page-num"><span>Page 1</span></div>
              
              <div class="header-box">
                <div class="company-name">${settings?.companyName || 'COMPANY NAME'}</div>
                <div style="font-size: 12px;">${settings?.companyAddress || ''}</div>
                <div style="font-size: 12px;">
                  ${settings?.printEmail ? `E-Mail : ${settings.printEmail}` : ''}
                  ${settings?.printPhone ? ` | Phone: ${settings.printPhone}` : ''}
                  ${settings?.printWebsite ? ` | Web: ${settings.printWebsite}` : ''}
                </div>
              </div>
              
              <div class="ledger-box">
                <div class="ledger-name">${ledgerName}</div>
                <div style="font-size: 12px;">${currentLedger?.address || ''}</div>
              </div>
              
              <div class="period-box">
                <span class="period-label">${period}</span>
              </div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 10%;">Date</th>
                    <th style="width: 40%;">Particulars</th>
                    <th style="width: 10%;">Vch Type</th>
                    <th style="width: 10%;">Vch No.</th>
                    <th style="width: 10%; text-align: right;">Debit</th>
                    <th style="width: 10%; text-align: right;">Credit</th>
                    <th style="width: 10%; text-align: right;">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportRows}
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
          <td style="padding: 2px 5px;"><b>Dr Opening Balance</b></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px; text-align: right;">${(currentLedger?.opening_balance || 0) > 0 ? Math.abs(currentLedger?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
          <td style="padding: 2px 5px; text-align: right;">${(currentLedger?.opening_balance || 0) < 0 ? Math.abs(currentLedger?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
          ${config.showRunningBalance ? `<td style="padding: 2px 5px; text-align: right;">${Math.abs(currentLedger?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} ${(currentLedger?.opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}</td>` : ''}
        </tr>
      `;

      const reportRows = entries.map((e) => {
        rb += (e.debit || 0) - (e.credit || 0);
        totalDebit += (e.debit || 0);
        totalCredit += (e.credit || 0);
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
                <td style="padding: 1px 5px 1px 20px; font-size: 11px; color: #333;">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    <span style="font-weight: 500;">${itemName}</span>
                    <span style="font-size: 10px; color: #666; white-space: nowrap;">${item.qty.toLocaleString()} ${item.unit || 'pcs'}</span>
                  </div>
                  ${config.showStockDescriptions && item.description ? `<div style="font-size: 9px; font-style: italic; color: #666;">${item.description}</div>` : ''}
                </td>
                <td style="padding: 1px 5px; font-size: 11px; text-align: right;">${item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td style="padding: 1px 5px; font-size: 11px; text-align: right;">${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
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
              <td colspan="${config.showRunningBalance ? '6' : '5'}" style="padding: 1px 5px 1px 20px; font-size: 10px; font-style: italic; color: #666;">
                (${e.vouchers.narration})
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
              <td colspan="${config.showRunningBalance ? '6' : '5'}" style="padding: 1px 5px 1px 40px; font-size: 10px; color: #666;">
                <i>Entered By : <b>${creator}</b></i>
              </td>
            </tr>
          `;
        }
        
        return `
          <tr class="${mainRowIsStripe ? 'stripe-row' : ''}">
            <td style="padding: 2px 5px; white-space: nowrap;">${formatDate(e.vouchers?.v_date)}</td>
            <td style="padding: 2px 5px;">
              <div>Dr <b>${e.particulars}</b></div>
            </td>
            <td style="padding: 2px 5px;">${e.vouchers?.v_type}</td>
            <td style="padding: 2px 5px;">${e.vouchers?.v_no}</td>
            <td style="padding: 2px 5px; text-align: right;">${e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
            <td style="padding: 2px 5px; text-align: right;">${e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</td>
            ${config.showRunningBalance ? '<td style="padding: 2px 5px; text-align: right;"></td>' : ''}
          </tr>
          ${inventoryRows}
          ${extraRows}
        `;
      }).join('');

      const finalBalance = rb;
      const displayTotalDebit = totalDebit + (openingBalance > 0 ? openingBalance : 0) + (finalBalance < 0 ? Math.abs(finalBalance) : 0);
      const displayTotalCredit = totalCredit + (openingBalance < 0 ? Math.abs(openingBalance) : 0) + (finalBalance >= 0 ? finalBalance : 0);
      
      const closingBalanceRow = `
        <tr class="border-all">
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"><b>Dr Closing Balance</b></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px;"></td>
          <td style="padding: 2px 5px; text-align: right;"><b>${finalBalance < 0 ? Math.abs(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          <td style="padding: 2px 5px; text-align: right;"><b>${finalBalance >= 0 ? Math.abs(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : ''}</b></td>
          ${config.showRunningBalance ? `<td style="padding: 2px 5px; text-align: right;"><b>${Math.abs(finalBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>` : ''}
        </tr>
        <tr class="border-all" style="border-top: 1px solid #000; border-bottom: 2px solid #000;">
          <td style="padding: 2px 5px; text-align: right;" colspan="4"><b>Total</b></td>
          <td style="padding: 2px 5px; text-align: right;"><b>${displayTotalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
          <td style="padding: 2px 5px; text-align: right;"><b>${displayTotalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td>
          ${config.showRunningBalance ? '<td style="padding: 2px 5px; text-align: right;"></td>' : ''}
        </tr>
      `;

      const footerHtml = `
        <div class="footer">
          ${settings.showPrintFooter ? `<div style="font-size: 10px; color: #666;">${settings.printFooter}</div>` : ''}
          ${settings.showDeveloperContact ? `<div style="font-size: 8px; color: #999; margin-top: 2px;">Powered by TallyFlow ERP | Developer Contact: +880 1700 000000</div>` : ''}
        </div>
      `;

      return `
        <html>
          <head>
            <title>Ledger Statement - ${ledgerName}</title>
            <style>
              @page { size: A4; margin: 1.5cm 1cm; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; margin: 0; color: #000; min-height: 100vh; position: relative; }
              .container { max-width: 100%; position: relative; padding-bottom: 60px; }
              
              .header-section { text-align: center; margin-bottom: 20px; }
              .company-name { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
              .company-details { font-size: 12px; margin-bottom: 2px; }
              .email-line { border-bottom: 1px solid #000; display: inline-block; padding-bottom: 2px; margin-bottom: 15px; }
              
              .ledger-name { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
              .ledger-label { font-size: 12px; margin-bottom: 2px; }
              .ledger-address { font-size: 12px; margin-bottom: 15px; }
              
              .period-text { font-size: 12px; margin-bottom: 10px; }
              
              .page-num { text-align: right; font-size: 11px; margin-bottom: 2px; }
              
              table { width: 100%; border-collapse: collapse; border-top: 1px solid #000; border-bottom: 1px solid #000; }
              th { border-bottom: 1px solid #000; padding: 5px; text-align: left; font-size: 12px; }
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
              
              @media print {
                .footer { position: fixed; bottom: 0; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header-section">
                <div class="company-name">${settings?.companyName || 'COMPANY NAME'}</div>
                <div class="company-details">${settings?.companyAddress || ''}</div>
                <div class="company-details">
                  <span class="email-line">E-Mail : ${settings?.printEmail || ''}</span>
                </div>
                
                <div class="ledger-name">${ledgerName}</div>
                <div class="ledger-label">Ledger Account</div>
                <div class="ledger-address">${currentLedger?.address || ''}</div>
                
                <div class="period-text">${period}</div>
              </div>
              
              <div class="page-num">Page 1</div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 12%;">Date</th>
                    <th style="width: 38%;">Particulars</th>
                    <th style="width: 10%;">Vch Type</th>
                    <th style="width: 10%;">Vch No.</th>
                    <th style="width: 10%; text-align: right;">Debit</th>
                    <th style="width: 10%; text-align: right;">Credit</th>
                    ${config.showRunningBalance ? '<th style="width: 10%; text-align: right;">Balance</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${openingBalanceRow}
                  ${reportRows}
                  ${closingBalanceRow}
                </tbody>
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

        <div className={cn(
          "bg-card border border-border overflow-x-auto no-scrollbar relative",
          settings.reportLayout === 'Layout 2' && "bg-white text-black font-serif p-8 min-h-[800px] pb-32"
        )}>
          {settings.reportLayout === 'Layout 2' && (
            <>
              <div className="text-center mb-8 border-b border-black pb-4">
                <h2 className="text-xl font-bold uppercase">{settings.companyName}</h2>
                <p className="text-xs">{settings.companyAddress}</p>
                <p className="text-[10px] underline decoration-black">E-Mail : {settings.printEmail}</p>
                
                <div className="mt-6">
                  <h3 className="text-lg font-bold">{currentLedger?.name}</h3>
                  <p className="text-xs">Ledger Account</p>
                  <p className="text-xs">{currentLedger?.address}</p>
                </div>
                
                <div className="mt-4 text-xs font-bold">
                  {new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-')} to {new Date(endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-')}
                </div>
              </div>
              <div className="absolute top-8 right-8 border border-black px-2 py-1 text-[10px]">Page 1</div>
            </>
          )}
          <table className={cn(
            "w-full text-left text-xs min-w-[700px]",
            settings.reportLayout === 'Layout 2' ? "border-y border-black table-fixed" : ""
          )}>
            <thead>
              <tr className={cn(
                "border-b border-border text-gray-500 uppercase",
                settings.reportLayout === 'Layout 2' && "border-black text-black font-bold"
              )}>
                <th className={cn("px-6 py-4 font-medium", settings.reportLayout === 'Layout 2' ? "w-[12%]" : "w-[120px]")}>Date</th>
                <th className={cn("px-6 py-4 font-medium", settings.reportLayout === 'Layout 2' ? "w-[38%]" : "")}>Particulars</th>
                <th className={cn("px-6 py-4 font-medium", settings.reportLayout === 'Layout 2' ? "w-[10%]" : "")}>Vch Type</th>
                <th className={cn("px-6 py-4 font-medium", settings.reportLayout === 'Layout 2' ? "w-[10%]" : "")}>Vch No.</th>
                <th className={cn("px-6 py-4 font-medium text-right", settings.reportLayout === 'Layout 2' ? "w-[10%]" : "")}>Debit</th>
                <th className={cn("px-6 py-4 font-medium text-right", settings.reportLayout === 'Layout 2' ? "w-[10%]" : "")}>Credit</th>
                {config.showRunningBalance && (
                  <th className={cn("px-6 py-4 font-medium text-right", settings.reportLayout === 'Layout 2' ? "w-[10%]" : "")}>Balance</th>
                )}
              </tr>
            </thead>
            <tbody className={cn(
              "text-foreground/80",
              settings.reportLayout === 'Layout 2' && "text-black"
            )}>
              {!selectedLedger ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-600">Please select a ledger to view statement</td></tr>
              ) : loading ? (
                <tr><td colSpan={7} className="px-6 py-10 text-center text-gray-600">Loading entries...</td></tr>
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
                          "border-b border-border/50 bg-foreground/5 font-bold italic",
                          settings.reportLayout === 'Layout 2' && "bg-white border-black text-black border",
                          settings.reportLayout === 'Layout 2' && openingBalanceRowIsStripe && "bg-[#F3F4F6]"
                        )}>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>{new Date(startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }).replace(/ /g, '-')}</td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>Dr Opening Balance</td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>-</td>
                          <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>-</td>
                          <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            {(currentLedger?.opening_balance || 0) > 0 ? Math.abs(currentLedger?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                            {(currentLedger?.opening_balance || 0) < 0 ? Math.abs(currentLedger?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                          </td>
                          {config.showRunningBalance && (
                            <td className={cn("px-6 py-4 text-right text-foreground", settings.reportLayout === 'Layout 2' && "border border-black")}>
                              {Math.abs(currentLedger?.opening_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })} {(currentLedger?.opening_balance || 0) >= 0 ? 'Dr' : 'Cr'}
                            </td>
                          )}
                        </tr>

                        {entries.length === 0 ? (
                          <tr><td colSpan={config.showRunningBalance ? 7 : 6} className="px-6 py-10 text-center text-gray-600 italic">No transactions found for this period</td></tr>
                        ) : entries.map((e, idx) => {
                          runningBalance += (e.debit || 0) - (e.credit || 0);
                          const currentBalance = runningBalance;
                          
                          const mainRowIsStripe = config.enableStripeView && rowCounter % 2 !== 0;
                          rowCounter++;

                          return (
                            <React.Fragment key={e.id}>
                              <tr 
                                className={cn(
                                  "border-b border-border/50 hover:bg-foreground/5 transition-colors cursor-pointer group",
                                  config.enableStripeView && !settings.reportLayout && idx % 2 !== 0 && "bg-muted/30",
                                  settings.reportLayout === 'Layout 2' && "bg-white text-black hover:bg-gray-50",
                                  settings.reportLayout === 'Layout 2' && mainRowIsStripe && "bg-[#F3F4F6]"
                                )}
                                onClick={() => navigate(`/vouchers/edit/${e.id}`)}
                              >
                                <td className="px-6 py-4 whitespace-nowrap">{e.vouchers?.v_date}</td>
                                <td className="px-6 py-4">
                                  <div className="flex flex-col">
                                    <span className="text-foreground font-bold">
                                      {settings.reportLayout === 'Layout 2' ? 'Dr ' : ''}{e.particulars}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 uppercase text-[10px] text-gray-500">{e.vouchers?.v_type}</td>
                                <td className="px-6 py-4 uppercase text-[10px] text-gray-500">{e.vouchers?.v_no}</td>
                                <td className="px-6 py-4 text-right font-mono">{e.debit > 0 ? e.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                <td className="px-6 py-4 text-right font-mono">{e.credit > 0 ? e.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}</td>
                                {config.showRunningBalance && (
                                  <td className="px-6 py-4 text-right text-foreground font-bold font-mono">
                                    {settings.reportLayout !== 'Layout 2' ? (
                                      <>
                                        {Math.abs(currentBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currentBalance >= 0 ? 'Dr' : 'Cr'}
                                      </>
                                    ) : '-'}
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
                                    <td className="px-6 py-1 text-right text-[11px]">
                                      {item.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-1 text-right text-[11px]">
                                      {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </td>
                                    <td></td>
                                    <td></td>
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
                                    <td colSpan={config.showRunningBalance ? 6 : 5} className="px-6 py-1 pl-10 italic text-[10px] text-gray-500">
                                      ({e.vouchers.narration})
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
                                    <td colSpan={config.showRunningBalance ? 6 : 5} className="px-6 py-1 pl-16 uppercase text-[8px] text-gray-400">
                                      By: {users.find(u => u.uid === e.vouchers?.createdBy)?.displayName || 'System'}
                                    </td>
                                  </tr>
                                );
                              })()}
                            </React.Fragment>
                          );
                        })}
                  
                  {/* Closing Balance Row */}
                  <tr className={cn(
                    "border-t-2 border-black font-bold",
                    settings.reportLayout === 'Layout 2' ? "bg-white text-black border border-black" : "bg-foreground/5"
                  )}>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}>Dr Closing Balance</td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4", settings.reportLayout === 'Layout 2' && "border border-black")}></td>
                    <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                      {runningBalance < 0 ? Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    <td className={cn("px-6 py-4 text-right", settings.reportLayout === 'Layout 2' && "border border-black")}>
                      {runningBalance >= 0 ? Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                    </td>
                    {config.showRunningBalance && (
                      <td className={cn("px-6 py-4 text-right text-foreground", settings.reportLayout === 'Layout 2' && "border border-black")}>
                        {Math.abs(runningBalance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    )}
                  </tr>

                  {/* Totals Row for Layout 2 */}
                  {settings.reportLayout === 'Layout 2' && (
                    <tr className="border-t-2 border-black font-bold bg-white text-black">
                      <td colSpan={4} className="px-6 py-4 text-right border border-black">Total</td>
                      <td className="px-6 py-4 text-right border border-black">
                        {(totalDebit + (openingBalance > 0 ? openingBalance : 0) + (runningBalance < 0 ? Math.abs(runningBalance) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right border border-black">
                        {(totalCredit + (openingBalance < 0 ? Math.abs(openingBalance) : 0) + (runningBalance >= 0 ? Math.abs(runningBalance) : 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      {config.showRunningBalance && <td className="px-6 py-4 border border-black"></td>}
                    </tr>
                  )}
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
              {settings.showDeveloperContact && <p className="text-[8px] text-gray-400 mt-1">Powered by TallyFlow ERP | Developer Contact: +880 1700 000000</p>}
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
  );
}
