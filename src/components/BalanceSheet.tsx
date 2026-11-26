import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, ChevronDown, ChevronRight, ArrowLeft, AlertCircle, FileSpreadsheet, Mail } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber, parseEntryDate, getMovementType } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { executePrint, formatPrintedAmount } from '../utils/printUtils';
import { exportToCSV, exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import { getPdfHeaderHtml, getPdfSignaturesHtml, getPdfFooterHtml, printToPDF } from '../utils/pdfExportService';
import { escapeHtml, resolveCompanyLegalIdentity } from '../constants/appIdentity';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
import { useNavigate } from 'react-router-dom';

export function BalanceSheet() {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [asOnDate, setAsOnDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });
  const [assetGroups, setAssetGroups] = useState<any[]>([]);
  const [liabilityGroups, setLiabilityGroups] = useState<any[]>([]);
  const [openingBalanceDiff, setOpeningBalanceDiff] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchBalances() {
      if (!user?.companyId) return;
      
      const cached = erpService.getCachedData(`balancesheet_${asOnDate}`, user.companyId);
      if (cached) {
        setAssetGroups(cached.assetsFinal || []);
        setLiabilityGroups(cached.liabilitiesFinal || []);
        setOpeningBalanceDiff(cached.openingDiff || 0);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [ledgers, vEntries, items, invEntries, groupsData, allVouchers] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, asOnDate),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', asOnDate),
          erpService.getLedgerGroups(user.companyId),
          erpService.getCollection('vouchers', user.companyId)
        ]);

        const voucherMap = (allVouchers || []).reduce((acc: any, v: any) => {
          acc[v.id] = v;
          return acc;
        }, {});

        // Enrich inventory entries with voucher data
        const enrichedInv = (invEntries || []).map((e: any) => {
          const v = voucherMap[e.voucher_id] || {};
          return {
            ...e,
            v_type: e.v_type || v.v_type || '',
            m_type: e.m_type || e.movement_type || e.entry_type || ''
          };
        });

        // 1. Calculate Closing Stock
        const itemStocks: Record<string, number> = {};
        const costMap: Record<string, number> = {};
        
        items.forEach(i => {
           itemStocks[i.id] = Number(i.opening_qty) || 0;
           costMap[i.id] = i.avg_cost || i.opening_rate || 0;
        });

        const sortedInv = [...enrichedInv].sort((a, b) => {
          const da = parseEntryDate(a.date, a.created_at);
          const db = parseEntryDate(b.date, b.created_at);
          if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
          return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
        });

        for (const entry of sortedInv) {
          if (!itemStocks[entry.item_id] && itemStocks[entry.item_id] !== 0) {
             const itm = items.find(i => i.id === entry.item_id);
             itemStocks[entry.item_id] = Number(itm?.opening_qty) || 0;
             costMap[entry.item_id] = itm?.avg_cost || itm?.opening_rate || 0;
          }
          const mType = getMovementType(entry);
          const qty = (Number(entry.qty) || 0) + (Number(entry.free_qty) || 0);
          const isPhysical = (entry.v_type || '').toLowerCase() === 'physical stock' || !!entry.is_physical_snapshot;

          if (isPhysical) {
             // Basic implementation matching erpService
             itemStocks[entry.item_id] = (Number(entry.qty) || 0);
          } else if (mType === 'inward') {
            itemStocks[entry.item_id] = (Number(itemStocks[entry.item_id]) || 0) + qty;
          } else {
            itemStocks[entry.item_id] = (Number(itemStocks[entry.item_id]) || 0) - qty;
          }
        }
        const closingStockValue = Object.keys(itemStocks).reduce((sum, id) => {
           const val = itemStocks[id] * (costMap[id] || 0);
           return sum + (val > 0 ? val : 0);
        }, 0);

        // 2. Calculate Individual Ledger Balances
        const ledgerBalances: Record<string, number> = {};
        ledgers.forEach(l => {
          const ledgerEntries = vEntries?.filter(e => e.ledger_id === l.id) || [];
          const periodMovement = ledgerEntries.reduce((sum, e) => sum + (Number(e.debit) || 0) - (Number(e.credit) || 0), 0);
          ledgerBalances[l.id] = (Number(l.opening_balance) || 0) + periodMovement;
        });

        // 3. Define Standard Report Hierarchy and categorization logic
        const catMap = {
          'Capital Account': ['Capital Account', 'Reserves & Surplus'],
          'Loans (Liability)': ['Loans (Liability)', 'Secured Loans', 'Unsecured Loans'],
          'Current Liabilities': ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes', 'Provisions'],
          'Fixed Assets': ['Fixed Assets'],
          'Investments': ['Investments'],
          'Current Assets': ['Current Assets', 'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Loans & Advances (Asset)', 'Stock-in-hand', 'Deposits (Asset)']
        };

        const getCategory = (l: any) => {
          const gName = (l.group_name || '').toLowerCase();
          for (const [cat, matches] of Object.entries(catMap)) {
            if (matches.some(m => gName.includes(m.toLowerCase()))) return cat;
          }
          return l.nature === 'Asset' ? 'Current Assets' : 'Current Liabilities';
        };

        // 4. Group data by Categories
        const categories: Record<string, any> = {};
        ledgers.forEach(l => {
          const cat = getCategory(l);
          if (!categories[cat]) {
            categories[cat] = { name: cat, total: 0, groups: {} };
          }
          
          const balance = ledgerBalances[l.id] || 0;
          if (balance === 0) return;

          const gName = l.group_name || 'Others';
          if (!categories[cat].groups[gName]) {
            categories[cat].groups[gName] = { name: gName, balance: 0, groupId: l.group_id };
          }
          categories[cat].groups[gName].balance += balance;
          categories[cat].total += balance;
        });

        // 5. Special Sections (P&L, Stock)
        const incomeL = ledgers.filter(l => l.nature === 'Income');
        const expenseL = ledgers.filter(l => l.nature === 'Expense');
        const totalIncome = incomeL.reduce((sum, l) => sum + Math.abs(ledgerBalances[l.id]), 0);
        const totalExpense = expenseL.reduce((sum, l) => sum + ledgerBalances[l.id], 0);
        
        const plLedger = ledgers.find(l => l.name.toLowerCase().includes('profit & loss') || l.name.toLowerCase().includes('p & l'));
        const plOpeningBalance = plLedger ? (Number(plLedger.opening_balance) || 0) : 0;
        const netProfit = (totalIncome + closingStockValue) - totalExpense;

        // Assets
        const assetsFinal: any[] = [];
        ['Fixed Assets', 'Investments', 'Current Assets'].forEach(name => {
          const cat = categories[name];
          if (!cat) return;

          let subItems: any[] = Object.values(cat.groups).map((g: any) => ({
            name: g.name,
            balance: g.balance,
            groupId: g.groupId
          }));

          if (name === 'Current Assets') {
            subItems.push({ name: 'Closing Stock', balance: closingStockValue, isSystem: true, type: 'Stock' });
            cat.total += closingStockValue;
          }

          assetsFinal.push({ name: cat.name, total: cat.total, subItems });
        });

        // Liabilities
        const liabilitiesFinal: any[] = [];
        ['Capital Account', 'Loans (Liability)', 'Current Liabilities'].forEach(name => {
          const cat = categories[name];
          if (cat) {
            liabilitiesFinal.push({
              name: cat.name,
              total: cat.total,
              subItems: Object.values(cat.groups).map((g: any) => ({
                name: g.name,
                balance: g.balance,
                groupId: g.groupId
              }))
            });
          }
        });

        // P&L Container
        liabilitiesFinal.push({ 
          name: 'Profit & Loss A/c', 
          total: plOpeningBalance + netProfit, 
          subItems: [
            { name: 'Opening Balance', balance: plOpeningBalance, isPLSub: true },
            { name: 'Current Period', balance: netProfit, isPLSub: true }
          ],
          isPLContainer: true
        });

        const totalOpeningDebit = ledgers.reduce((sum, l) => sum + (Number(l.opening_balance) > 0 ? Number(l.opening_balance) : 0), 0);
        const totalOpeningCredit = ledgers.reduce((sum, l) => sum + (Number(l.opening_balance) < 0 ? Math.abs(Number(l.opening_balance)) : 0), 0);
        const openingDiff = totalOpeningDebit - totalOpeningCredit;

        // Save fresh results to cache
        erpService.setCachedData(`balancesheet_${asOnDate}`, user.companyId, {
          assetsFinal,
          liabilitiesFinal,
          openingDiff
        });

        setAssetGroups(assetsFinal);
        setLiabilityGroups(liabilitiesFinal);
        setOpeningBalanceDiff(openingDiff);

      } catch (err) {
        console.error('Error fetching balance sheet:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBalances();
  }, [asOnDate, user?.companyId]);

  const toggleGroup = (name: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedGroups(newSet);
  };

  const totalAssets = assetGroups.reduce((sum, g) => sum + g.total, 0);
  const totalLiabilitiesCombined = liabilityGroups.reduce((sum, g) => sum + g.total, 0);
  
  // Final Balance Check
  // Total must include opening difference if any
  const absTotalAssets = totalAssets + (openingBalanceDiff > 0 ? openingBalanceDiff : 0);
  const absTotalLiabilities = Math.abs(totalLiabilitiesCombined) + (openingBalanceDiff < 0 ? Math.abs(openingBalanceDiff) : 0);
  
  const finalBalanceValue = Math.max(absTotalAssets, absTotalLiabilities);

  const formatSignedBalanceHtml = (balance: number) => {
    const absText = formatPrintedAmount(Math.abs(balance));
    return balance < 0 ? `(-)${absText}` : absText;
  };

  const buildBalanceSheetHtml = () => {
    const formattedAsOn = formatReportDate(asOnDate, settings.dateFormat);
    const isLayout2 = settings?.reportLayout === 'Layout 2';

    const liabilitiesRowsHtml = liabilityGroups.map((group: any) => `
      <tr style="font-weight: 700; background-color: ${isLayout2 ? '#ffffff' : '#f9fafb'};">
        <td style="border: 1px solid #111827; padding: 5px 8px; text-transform: uppercase; vertical-align: middle;">${escapeHtml(group.name)}</td>
        <td style="border: 1px solid #111827; padding: 5px 8px; text-align: right; vertical-align: middle;">${formatPrintedAmount(Math.abs(group.total))}</td>
      </tr>
      ${(group.subItems || []).map((sub: any) => `
        <tr style="color: #374151;">
          <td style="border: 1px solid #e5e7eb; padding: 3px 8px 3px 20px; font-size: 8.5px; font-style: italic; vertical-align: middle;">• ${escapeHtml(sub.name)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 3px 8px; text-align: right; font-size: 8.5px; font-style: italic; vertical-align: middle;">${formatSignedBalanceHtml(Number(sub.balance || 0))}</td>
        </tr>
      `).join('')}
    `).join('');

    const assetsRowsHtml = assetGroups.map((group: any) => `
      <tr style="font-weight: 700; background-color: ${isLayout2 ? '#ffffff' : '#f9fafb'};">
        <td style="border: 1px solid #111827; padding: 5px 8px; text-transform: uppercase; vertical-align: middle;">${escapeHtml(group.name)}</td>
        <td style="border: 1px solid #111827; padding: 5px 8px; text-align: right; vertical-align: middle;">${formatPrintedAmount(Math.abs(group.total))}</td>
      </tr>
      ${(group.subItems || []).map((sub: any) => `
        <tr style="color: #374151;">
          <td style="border: 1px solid #e5e7eb; padding: 3px 8px 3px 20px; font-size: 8.5px; font-style: italic; vertical-align: middle;">• ${escapeHtml(sub.name)}</td>
          <td style="border: 1px solid #e5e7eb; padding: 3px 8px; text-align: right; font-size: 8.5px; font-style: italic; vertical-align: middle;">${formatSignedBalanceHtml(Number(sub.balance || 0))}</td>
        </tr>
      `).join('')}
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Balance Sheet - ${escapeHtml(formattedAsOn)}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: ${isLayout2 ? 'Arial, Helvetica, sans-serif' : "'JetBrains Mono', Courier, monospace"};
              color: #000000;
              background: #ffffff;
              padding: 16px;
              margin: 0;
              font-size: 10px;
            }
            table { width: 100%; border-collapse: collapse; }
            th, td { vertical-align: middle !important; }
            @media print {
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          ${getPdfHeaderHtml(settings, 'BALANCE SHEET', `As on ${formattedAsOn}`, company)}
          <div style="display: flex; gap: 12px; width: 100%; align-items: stretch;">
            <div style="flex: 1; display: flex; flex-direction: column;">
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; width: 65%; border: 1px solid #111827; background-color: ${isLayout2 ? '#ffffff' : '#f3f4f6'}; padding: 6px 8px; font-size: 10px; text-transform: uppercase;">LIABILITIES</th>
                    <th style="text-align: right; width: 35%; border: 1px solid #111827; background-color: ${isLayout2 ? '#ffffff' : '#f3f4f6'}; padding: 6px 8px; font-size: 10px; text-transform: uppercase;">AMOUNT (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  ${liabilitiesRowsHtml}
                  ${openingBalanceDiff > 0 ? `
                    <tr style="color: #dc2626; font-style: italic;">
                      <td style="border: 1px solid #111827; padding: 5px 8px; vertical-align: middle;">Difference in opening balances</td>
                      <td style="border: 1px solid #111827; padding: 5px 8px; text-align: right; vertical-align: middle;">${formatPrintedAmount(Math.abs(openingBalanceDiff))}</td>
                    </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: ${isLayout2 ? '#ffffff' : '#f9fafb'};">
                    <td style="border: 1px solid #111827; padding: 7px 8px; text-transform: uppercase; vertical-align: middle;">TOTAL LIABILITIES</td>
                    <td style="border: 1px solid #111827; padding: 7px 8px; text-align: right; vertical-align: middle;">৳ ${formatPrintedAmount(finalBalanceValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div style="flex: 1; display: flex; flex-direction: column;">
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; width: 65%; border: 1px solid #111827; background-color: ${isLayout2 ? '#ffffff' : '#f3f4f6'}; padding: 6px 8px; font-size: 10px; text-transform: uppercase;">ASSETS</th>
                    <th style="text-align: right; width: 35%; border: 1px solid #111827; background-color: ${isLayout2 ? '#ffffff' : '#f3f4f6'}; padding: 6px 8px; font-size: 10px; text-transform: uppercase;">AMOUNT (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  ${assetsRowsHtml}
                  ${openingBalanceDiff < 0 ? `
                    <tr style="color: #dc2626; font-style: italic;">
                      <td style="border: 1px solid #111827; padding: 5px 8px; vertical-align: middle;">Difference in opening balances</td>
                      <td style="border: 1px solid #111827; padding: 5px 8px; text-align: right; vertical-align: middle;">${formatPrintedAmount(Math.abs(openingBalanceDiff))}</td>
                    </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr style="font-weight: 800; border-top: 2px solid #000; border-bottom: 3px double #000; background-color: ${isLayout2 ? '#ffffff' : '#f9fafb'};">
                    <td style="border: 1px solid #111827; padding: 7px 8px; text-transform: uppercase; vertical-align: middle;">TOTAL ASSETS</td>
                    <td style="border: 1px solid #111827; padding: 7px 8px; text-align: right; vertical-align: middle;">৳ ${formatPrintedAmount(finalBalanceValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
          ${getPdfSignaturesHtml(settings)}
          ${getPdfFooterHtml(settings)}
        </body>
      </html>
    `;
  };

  const buildBalanceSheetExportRows = () => {
    const rows: Array<{
      side: string;
      levelGroup: string;
      particulars: string;
      amount: number | '';
    }> = [];

    liabilityGroups.forEach((g: any) => {
      rows.push({
        side: 'Liabilities',
        levelGroup: 'Primary Group',
        particulars: g.name,
        amount: Number(Math.abs(g.total).toFixed(2))
      });
      (g.subItems || []).forEach((item: any) => {
        rows.push({
          side: 'Liabilities',
          levelGroup: g.name,
          particulars: `  ${item.name}`,
          amount: Number(Number(item.balance || 0).toFixed(2))
        });
      });
    });

    if (openingBalanceDiff > 0) {
      rows.push({
        side: 'Liabilities',
        levelGroup: 'Adjustment',
        particulars: 'Difference in opening balances',
        amount: Number(Math.abs(openingBalanceDiff).toFixed(2))
      });
    }

    assetGroups.forEach((g: any) => {
      rows.push({
        side: 'Assets',
        levelGroup: 'Primary Group',
        particulars: g.name,
        amount: Number(Math.abs(g.total).toFixed(2))
      });
      (g.subItems || []).forEach((item: any) => {
        rows.push({
          side: 'Assets',
          levelGroup: g.name,
          particulars: `  ${item.name}`,
          amount: Number(Number(item.balance || 0).toFixed(2))
        });
      });
    });

    if (openingBalanceDiff < 0) {
      rows.push({
        side: 'Assets',
        levelGroup: 'Adjustment',
        particulars: 'Difference in opening balances',
        amount: Number(Math.abs(openingBalanceDiff).toFixed(2))
      });
    }

    return rows;
  };

  const handlePrint = () => {
    executePrint(buildBalanceSheetHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: 'Balance Sheet',
      subtitle: `As on ${formatReportDate(asOnDate, settings.dateFormat)}`,
      fileName: `Balance_Sheet_${asOnDate}`,
      htmlContent: buildBalanceSheetHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    const rows = buildBalanceSheetExportRows().map(r => [
      r.side,
      r.levelGroup,
      r.particulars,
      r.amount
    ]);
    exportStructuredExcel({
      fileName: `Balance_Sheet_${asOnDate}`,
      sheetName: 'Balance Sheet',
      title: 'Balance Sheet',
      subtitle: `As on ${formatReportDate(asOnDate, settings.dateFormat)}`,
      headers: ['Side', 'Level / Group', 'Particulars', 'Amount'],
      rows,
      footerRow: ['Summary', 'Total', 'Balanced Statement Total', Number(finalBalanceValue.toFixed(2))],
      extraRows: [
        ['Summary', 'Total', 'Total Liabilities', Number(absTotalLiabilities.toFixed(2))],
        ['Summary', 'Total', 'Total Assets', Number(absTotalAssets.toFixed(2))]
      ],
      settings,
      company
    });
  };

  const handleDownload = () => {
    const rows = buildBalanceSheetExportRows().map(r => ({
      'Side': r.side,
      'Level / Group': r.levelGroup,
      'Particulars': r.particulars,
      'Amount': r.amount === '' ? '' : formatNumber(r.amount)
    }));
    rows.push({
      'Side': 'Summary',
      'Level / Group': 'Total',
      'Particulars': 'Total Liabilities',
      'Amount': formatNumber(absTotalLiabilities)
    });
    rows.push({
      'Side': 'Summary',
      'Level / Group': 'Total',
      'Particulars': 'Total Assets',
      'Amount': formatNumber(absTotalAssets)
    });
    rows.push({
      'Side': 'Summary',
      'Level / Group': 'Total',
      'Particulars': 'Balanced Statement Total',
      'Amount': formatNumber(finalBalanceValue)
    });

    exportToCSV(
      `Balance_Sheet_${asOnDate}`,
      `Balance Sheet (As on ${formatReportDate(asOnDate, settings.dateFormat)})`,
      rows,
      ['Side', 'Level / Group', 'Particulars', 'Amount'],
      settings,
      company
    );
  };

  const handleEmailReport = () => {
    const legal = resolveCompanyLegalIdentity(settings, company);
    const summaryLines = [
      `Total Liabilities: ৳ ${formatNumber(absTotalLiabilities)}`,
      `Total Assets: ৳ ${formatNumber(absTotalAssets)}`,
      `Balanced Statement Total: ৳ ${formatNumber(finalBalanceValue)}`,
      ...(openingBalanceDiff !== 0
        ? [`Difference in Opening Balances: ৳ ${formatNumber(Math.abs(openingBalanceDiff))}`]
        : []),
      '',
      'Liabilities Breakdown:',
      ...liabilityGroups.map((g: any) => `- ${g.name}: ৳ ${formatNumber(Math.abs(g.total))}`),
      '',
      'Assets Breakdown:',
      ...assetGroups.map((g: any) => `- ${g.name}: ৳ ${formatNumber(Math.abs(g.total))}`)
    ];

    shareReportViaEmail({
      title: 'Balance Sheet',
      subtitle: `As on ${formatReportDate(asOnDate, settings.dateFormat)}`,
      summaryLines,
      settings,
      company,
      recipientEmail: legal.printEmail || ''
    });
  };

  const dummyLiabilityGroups = [
    {
      name: 'Capital Account',
      total: 0,
      subItems: [
        { name: 'Share Capital', balance: 0, isLoading: true },
        { name: 'Reserves & Surplus', balance: 0, isLoading: true }
      ],
      isLoading: true
    },
    {
      name: 'Loans (Liability)',
      total: 0,
      subItems: [
        { name: 'Secured Loans', balance: 0, isLoading: true },
        { name: 'Unsecured Loans', balance: 0, isLoading: true }
      ],
      isLoading: true
    },
    {
      name: 'Current Liabilities',
      total: 0,
      subItems: [
        { name: 'Sundry Creditors', balance: 0, isLoading: true },
        { name: 'Duties & Taxes', balance: 0, isLoading: true }
      ],
      isLoading: true
    },
    {
      name: 'Profit & Loss A/c',
      total: 0,
      subItems: [
        { name: 'Opening Balance', balance: 0, isPLSub: true, isLoading: true },
        { name: 'Current Period', balance: 0, isPLSub: true, isLoading: true }
      ],
      isPLContainer: true,
      isLoading: true
    }
  ];

  const dummyAssetGroups = [
    {
      name: 'Fixed Assets',
      total: 0,
      subItems: [
        { name: 'Plant & Machinery', balance: 0, isLoading: true },
        { name: 'Office Equipments', balance: 0, isLoading: true }
      ],
      isLoading: true
    },
    {
      name: 'Investments',
      total: 0,
      subItems: [
        { name: 'Mutual Funds / Shares', balance: 0, isLoading: true }
      ],
      isLoading: true
    },
    {
      name: 'Current Assets',
      total: 0,
      subItems: [
        { name: 'Closing Stock', balance: 0, isSystem: true, type: 'Stock', isLoading: true },
        { name: 'Bank Accounts', balance: 0, isLoading: true },
        { name: 'Cash-in-hand', balance: 0, isLoading: true },
        { name: 'Sundry Debtors', balance: 0, isLoading: true }
      ],
      isLoading: true
    }
  ];

  const liabilitiesToRender = loading ? dummyLiabilityGroups : liabilityGroups;
  const assetsToRender = loading ? dummyAssetGroups : assetGroups;

  const finalTotal = Math.max(Math.abs(totalAssets), absTotalLiabilities);

  return (
    <div className="flex flex-col h-screen bg-background transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-xs">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateInput
                  label={t('reports.asOnDate')}
                  value={asOnDate}
                  onChange={setAsOnDate}
                  className="w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button 
              onClick={handlePrint}
              disabled={loading}
              className="p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center items-center disabled:opacity-50"
              title="Print Balance Sheet"
              id="print-btn"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownloadExcel}
              disabled={loading}
              className="px-3 py-2 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Export Genuine Excel (.xlsx)"
              id="excel-btn"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
            </button>
            <button 
              onClick={handleDownload}
              disabled={loading}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase disabled:opacity-50"
              title={t('common.downloadCsv')}
              id="csv-btn"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={loading}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Print to PDF (Save professional financial statement offline)"
              id="pdf-btn"
            >
              <Download className="w-3 h-3" /> PRINT TO PDF
            </button>
            <button 
              onClick={handleEmailReport}
              disabled={loading}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Share Balance Sheet Summary via Email"
              id="email-btn"
            >
              <Mail className="w-3.5 h-3.5" /> EMAIL
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-background scroll-smooth">
        <div id="balance-sheet-report" className="p-4 lg:p-6 min-h-full flex flex-col bg-white">
          <div className="flex-1 border border-border bg-card shadow-sm rounded-lg overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border flex-1">
            {/* Liabilities Side */}
            <div className="flex flex-col border-r border-border">
              <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.particulars')}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.amount')}</span>
              </div>
              
              <div className="flex-1 min-h-[500px]">
                {liabilitiesToRender.map(group => (
                  <div key={group.name} className="flex flex-col">
                    <div 
                      onClick={() => {
                        if (loading) return;
                        if (group.isPLContainer) navigate(`/reports/pl?to=${asOnDate}`);
                        else navigate(`/reports/group-summary?groupId=${group.groupId || ''}&groupName=${encodeURIComponent(group.name)}&to=${asOnDate}`);
                      }}
                      className={cn(
                        "px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent",
                        loading ? "cursor-default" : "cursor-pointer hover:bg-muted/80 hover:border-primary"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground uppercase tracking-tight">
                        {group.name}
                      </span>
                      {group.isLoading ? (
                        <div className="h-4 w-20 bg-muted-foreground/20 animate-pulse rounded" />
                      ) : (
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(group.total))}</span>
                      )}
                    </div>

                    {group.subItems.map((item: any) => (
                      <div 
                        key={item.name}
                        onClick={() => {
                          if (loading) return;
                          if (item.isPLSub) navigate(`/reports/pl?to=${asOnDate}`);
                          else navigate(item.groupId ? `/reports/group-summary?groupId=${item.groupId}&groupName=${encodeURIComponent(item.name)}&to=${asOnDate}` : `/reports/ledger?ledgerId=${item.id}`);
                        }}
                        className={cn(
                          "px-8 py-1.5 flex justify-between items-center group/item transition-colors border-l-4 border-transparent",
                          loading ? "cursor-default" : "cursor-pointer hover:bg-muted/60 hover:border-primary/40"
                        )}
                      >
                        <span className="text-[13px] italic text-muted-foreground font-medium group-hover/item:text-primary transition-colors">
                          {item.name}
                        </span>
                        {item.isLoading ? (
                          <div className="h-3.5 w-16 bg-muted-foreground/10 animate-pulse rounded" />
                        ) : (
                          <span className="text-[13px] text-muted-foreground font-mono italic">
                            {item.balance < 0 ? `(-)${formatNumber(Math.abs(item.balance))}` : formatNumber(item.balance)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {openingBalanceDiff > 0 && !loading && (
                  <div className="px-4 py-3 border-t border-border/5 mt-4">
                    <div className="flex justify-between items-center bg-rose-500/5 p-2 rounded">
                      <span className="text-sm text-rose-600 italic font-medium">Difference in opening balances</span>
                      <span className="text-sm text-rose-600 font-bold">{formatNumber(Math.abs(openingBalanceDiff))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto px-4 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tight text-foreground pl-4">Total</span>
                {loading ? (
                  <div className="h-5 w-24 bg-muted-foreground/20 animate-pulse rounded" />
                ) : (
                  <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalBalanceValue)}</span>
                )}
              </div>
            </div>

            {/* Assets Side */}
            <div className="flex flex-col">
              <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.particulars')}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.amount')}</span>
              </div>

              <div className="flex-1 min-h-[500px]">
                {assetsToRender.map(group => (
                  <div key={group.name} className="flex flex-col">
                    <div 
                      onClick={() => {
                        if (loading) return;
                        navigate(`/reports/group-summary?groupId=${group.groupId || ''}&groupName=${encodeURIComponent(group.name)}&to=${asOnDate}`);
                      }}
                      className={cn(
                        "px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent",
                        loading ? "cursor-default" : "cursor-pointer hover:bg-muted/80 hover:border-primary"
                      )}
                    >
                      <span className="text-sm font-medium text-foreground uppercase tracking-tight">{group.name}</span>
                      {group.isLoading ? (
                        <div className="h-4 w-20 bg-muted-foreground/20 animate-pulse rounded" />
                      ) : (
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(group.total))}</span>
                      )}
                    </div>

                    {group.subItems.map((item: any) => (
                      <div 
                        key={item.name}
                        onClick={() => {
                          if (loading) return;
                          navigate(item.type === 'Stock' ? `/reports/stock?to=${asOnDate}` : (item.groupId ? `/reports/group-summary?groupId=${item.groupId}&groupName=${encodeURIComponent(item.name)}&to=${asOnDate}` : `/reports/ledger?ledgerId=${item.id}`));
                        }}
                        className={cn(
                          "px-8 py-1.5 flex justify-between items-center group/item transition-colors border-l-4 border-transparent",
                          loading ? "cursor-default" : "cursor-pointer hover:bg-muted/60 hover:border-primary/40"
                        )}
                      >
                        <span className="text-[13px] italic text-muted-foreground font-medium group-hover/item:text-primary transition-colors">
                          {item.name}
                        </span>
                        {item.isLoading ? (
                          <div className="h-3.5 w-16 bg-muted-foreground/10 animate-pulse rounded" />
                        ) : (
                          <span className="text-[13px] text-muted-foreground font-mono italic">
                            {item.balance < 0 ? `(-)${formatNumber(Math.abs(item.balance))}` : formatNumber(item.balance)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {openingBalanceDiff < 0 && !loading && (
                  <div className="px-4 py-3 border-t border-border/5 mt-4">
                    <div className="flex justify-between items-center bg-rose-500/5 p-2 rounded">
                      <span className="text-sm text-rose-600 italic font-medium">Difference in opening balances</span>
                      <span className="text-sm text-rose-600 font-bold">{formatNumber(Math.abs(openingBalanceDiff))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto px-4 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tight text-foreground pl-4">Total</span>
                {loading ? (
                  <div className="h-5 w-24 bg-muted-foreground/20 animate-pulse rounded" />
                ) : (
                  <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalBalanceValue)}</span>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
);
}

