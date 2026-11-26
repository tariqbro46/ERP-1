import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, FileSpreadsheet, Mail, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { executePrint } from '../utils/printUtils';
import { exportToCSV, exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import { printToPDF } from '../utils/pdfExportService';
import {
  DEFAULT_APP_BRANDING,
  escapeHtml,
  resolveCompanyLegalIdentity,
  sanitizeAssetUrl
} from '../constants/appIdentity';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { formatNumber, cn, ensureDate, parseEntryDate, getMovementType } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { useNavigate } from 'react-router-dom';

export function ProfitAndLoss() {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });
  const [tradingData, setTradingData] = useState<any>({
    openingStock: 0,
    closingStock: 0,
    purchaseGroups: [],
    salesGroups: [],
    directExpenseGroups: [],
    directIncomeGroups: []
  });
  const [plData, setPlData] = useState<any>({
    indirectExpenseGroups: [],
    indirectIncomeGroups: []
  });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchPL() {
      if (!user?.companyId) return;
      
      const cacheKey = `profitloss_${startDate}_${endDate}`;
      const cached = erpService.getCachedData(cacheKey, user.companyId);
      if (cached) {
        setTradingData(cached.tradingData);
        setPlData(cached.plData);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [ledgers, allItems, invEntries, vEntries, allVoucherEntries, allVouchers] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', endDate),
          erpService.getVouchersByDateRange(user.companyId, startDate, endDate),
          erpService.getCollection('voucher_entries', user.companyId),
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

        // 1. Calculate Opening & Closing Stock using per-godown simulation
        const calculateStockValue = (asOfDate: string) => {
          const targetDate = parseEntryDate(asOfDate, null);
          targetDate.setHours(23, 59, 59, 999);

          // Track precise state for each item
          const itemStates: Record<string, { total: number, godowns: Record<string, number> }> = {};
          
          allItems.forEach(item => {
            const godownBalances: Record<string, number> = {};
            (item.opening_godowns || []).forEach((ag: any) => {
              if (ag.godown_id) godownBalances[ag.godown_id] = Number(ag.qty) || 0;
            });
            itemStates[item.id] = {
              total: Number(item.opening_qty) || 0,
              godowns: godownBalances
            };
          });

          // Sort entries by date/time for accurate simulation
          const sortedEntries = [...enrichedInv].sort((a, b) => {
            const d_a = parseEntryDate(a.date, a.created_at);
            const d_b = parseEntryDate(b.date, b.created_at);
            if (d_a.getTime() !== d_b.getTime()) return d_a.getTime() - d_b.getTime();
            return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
          });

          sortedEntries.forEach((entry: any) => {
            const entryDate = parseEntryDate(entry.date, entry.created_at);
            if (entryDate <= targetDate) {
              const state = itemStates[entry.item_id];
              if (!state) return;

              const qty = (Number(entry.qty) || 0) + (Number(entry.free_qty) || 0);
              const mType = getMovementType(entry);
              const isPhysical = entry.v_type?.toLowerCase() === 'physical stock' || !!entry.is_physical_snapshot;
              const gId = entry.godown_id;

              let adjustment = 0;
              if (isPhysical) {
                if (gId) {
                  const oldVal = state.godowns[gId] || 0;
                  adjustment = qty - oldVal;
                  state.godowns[gId] = qty;
                } else {
                  adjustment = qty - state.total;
                  state.total = qty;
                  // Reset godowns
                  Object.keys(state.godowns).forEach(k => {
                    state.godowns[k] = 0;
                  });
                }
              } else {
                adjustment = mType === 'inward' ? qty : -qty;
                if (gId) state.godowns[gId] = (state.godowns[gId] || 0) + adjustment;
              }

              if (!isPhysical || gId) {
                state.total += adjustment;
              }
            }
          });

          return Object.entries(itemStates).reduce((sum, [id, state]) => {
            const item = allItems.find(i => i.id === id);
            const rate = Number(item?.avg_cost) || Number(item?.opening_rate) || 0;
            return sum + (state.total * rate);
          }, 0);
        };

        const openingStockValue = calculateStockValue(new Date(new Date(startDate).getTime() - 86400000).toISOString().split('T')[0]);
        const closingStockValue = calculateStockValue(endDate);

        // 2. Fetch and Filter Voucher Entries
        const voucherIdSet = new Set(vEntries.map((v: any) => v.id));
        const filteredVEntries = allVoucherEntries.filter((e: any) => voucherIdSet.has(e.voucher_id));

        const groups: Record<string, any> = {};
        ledgers.forEach(l => {
          const groupName = l.group_name || 'Uncategorized';
          if (!groups[groupName]) {
            groups[groupName] = {
              name: groupName,
              nature: l.nature,
              balance: 0,
              groupId: l.group_id,
              ledgers: new Map()
            };
          }
        });

        filteredVEntries.forEach((e: any) => {
          const ledger = ledgers.find(l => l.id === e.ledger_id);
          if (ledger) {
            const groupName = ledger.group_name || 'Uncategorized';
            const change = (Number(e.debit) || 0) - (Number(e.credit) || 0);
            
            if (groups[groupName]) {
              groups[groupName].balance += change;
              if (!groups[groupName].ledgers.has(ledger.id)) {
                groups[groupName].ledgers.set(ledger.id, { ...ledger, balance: 0 });
              }
              const lData = groups[groupName].ledgers.get(ledger.id);
              lData.balance += change;
            }
          }
        });

        const gList = Object.values(groups).map((g: any) => ({
          ...g,
          ledgers: Array.from(g.ledgers.values())
        }));

        const purchaseG = gList.filter(g => g.name.toLowerCase().includes('purchase')).sort((a,b) => a.name.localeCompare(b.name));
        const salesG = gList.filter(g => g.name.toLowerCase().includes('sales')).sort((a,b) => a.name.localeCompare(b.name));
        const directExpG = gList.filter(g => g.name.toLowerCase().includes('direct expense')).sort((a,b) => a.name.localeCompare(b.name));
        const indirectExpG = gList.filter(g => g.nature === 'Expense' && !g.name.toLowerCase().includes('direct') && !g.name.toLowerCase().includes('purchase')).sort((a,b) => a.name.localeCompare(b.name));
        const indirectIncG = gList.filter(g => g.nature === 'Income' && !g.name.toLowerCase().includes('direct') && !g.name.toLowerCase().includes('sales')).sort((a,b) => a.name.localeCompare(b.name));

        const tradingPayload = {
          openingStock: openingStockValue,
          closingStock: closingStockValue,
          purchaseGroups: purchaseG,
          salesGroups: salesG,
          directExpenseGroups: directExpG
        };

        const plPayload = {
          indirectExpenseGroups: indirectExpG,
          indirectIncomeGroups: indirectIncG
        };

        // Save fresh results to cache
        erpService.setCachedData(`profitloss_${startDate}_${endDate}`, user.companyId, {
          tradingData: tradingPayload,
          plData: plPayload
        });

        setTradingData(tradingPayload);
        setPlData(plPayload);

      } catch (err) {
        console.error('Error fetching P&L:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPL();
  }, [startDate, endDate, user?.companyId]);

  const toggleGroup = (name: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedGroups(newSet);
  };

  const totalPurchases = tradingData.purchaseGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalSales = Math.abs(tradingData.salesGroups.reduce((s: number, g: any) => s + g.balance, 0));
  const totalDirectExp = tradingData.directExpenseGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalIndirectExp = plData.indirectExpenseGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalIndirectInc = Math.abs(plData.indirectIncomeGroups.reduce((s: number, g: any) => s + g.balance, 0));
  
  // Left side sum (Debit): Opening + Purchases + Direct Exp + Indirect Exp
  // Right side sum (Credit): Sales + Closing Stock + Indirect Income
  const debitTotal = tradingData.openingStock + totalPurchases + totalDirectExp + totalIndirectExp;
  const creditTotal = totalSales + tradingData.closingStock + totalIndirectInc;
  
  const netProfit = creditTotal - debitTotal;

  const plPeriodSubtitle = `For the Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`;

  const buildProfitAndLossHtml = () => {
    const legal = resolveCompanyLegalIdentity(settings, company);
    const isLayout2 = settings?.reportLayout === 'Layout 2';
    const safeLogoUrl = sanitizeAssetUrl(legal.companyLogo || '');
    const logoHtml = safeLogoUrl
      ? `<div style="width: 68px; height: 68px; margin-right: 16px; flex-shrink: 0;"><img src="${escapeHtml(safeLogoUrl)}" style="width: 100%; height: 100%; object-fit: contain;" /></div>`
      : '';

    const contactItems: string[] = [];
    if (settings?.showPrintPhone !== false && legal.printPhone) contactItems.push(`Tel: ${escapeHtml(legal.printPhone)}`);
    if (settings?.showPrintEmail !== false && legal.printEmail) contactItems.push(`Email: ${escapeHtml(legal.printEmail)}`);
    if (settings?.showPrintWebsite !== false && legal.printWebsite) contactItems.push(`Web: ${escapeHtml(legal.printWebsite)}`);

    const softwareFooter =
      settings?.showDeveloperContact !== false
        ? (settings?.appIdentity?.softwareFooterText ||
          settings?.developerContactText ||
          DEFAULT_APP_BRANDING.softwareFooterText)
        : '';

    const sigAlignment = settings?.signatureAlignment || 'spread';
    const justifyMap: Record<string, string> = {
      spread: 'space-between',
      left: 'flex-start',
      center: 'center',
      right: 'flex-end'
    };

    const computedFinalTotal = Math.max(
      debitTotal + (netProfit > 0 ? netProfit : 0),
      creditTotal + (netProfit < 0 ? Math.abs(netProfit) : 0)
    );

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Profit & Loss Account</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: ${isLayout2 ? 'Arial, Helvetica, sans-serif' : "'JetBrains Mono', Courier, monospace"};
              color: #000000;
              background: #ffffff;
              padding: 16px;
              margin: 0;
              font-size: 10px;
              line-height: 1.4;
            }
            table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
            th, td {
              border: 1px solid ${isLayout2 ? '#000' : '#111827'};
              padding: 5px 8px;
              font-size: 9.5px;
              vertical-align: middle !important;
            }
            th {
              background-color: ${isLayout2 ? '#ffffff' : '#f3f4f6'};
              text-transform: uppercase;
              font-weight: 800;
            }
            .total-row td {
              font-weight: 800;
              border-top: 2px solid #000;
              border-bottom: 3px double #000;
              background-color: ${isLayout2 ? '#ffffff' : '#f9fafb'};
            }
            @media print {
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div style="position: relative; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 16px;">
            <div style="position: absolute; top: 0; right: 0; font-size: 10px; font-weight: 700; color: #374151; font-family: monospace;">Page 1</div>
            <div style="display: flex; align-items: center; justify-content: center;">
              ${logoHtml}
              <div style="flex: 1; text-align: center;">
                ${legal.companyName ? `<div style="font-size: 20px; font-weight: 800; text-transform: uppercase;">${escapeHtml(legal.companyName)}</div>` : ''}
                ${legal.companyAddress ? `<div style="font-size: 10px; color: #374151; margin-top: 2px; white-space: pre-line;">${escapeHtml(legal.companyAddress)}</div>` : ''}
                ${legal.vatBinTin ? `<div style="font-size: 9px; color: #374151; margin-top: 2px;">VAT/BIN/TIN: ${escapeHtml(legal.vatBinTin)}</div>` : ''}
                ${contactItems.length > 0 ? `<div style="font-size: 9px; color: #4b5563; margin-top: 2px;">${contactItems.join(' | ')}</div>` : ''}
                ${settings?.showPrintHeader !== false && legal.printHeader ? `<div style="font-size: 10px; font-style: italic; color: #4b5563; margin-top: 3px;">${escapeHtml(legal.printHeader)}</div>` : ''}
                <div style="margin-top: 8px;">
                  <span style="display: inline-block; font-size: 14px; font-weight: 800; text-transform: uppercase; border-bottom: 1.5px solid #000; padding-bottom: 1px;">PROFIT &amp; LOSS A/C</span>
                </div>
                <div style="font-size: 10px; font-weight: 600; color: #374151; margin-top: 3px;">${escapeHtml(plPeriodSubtitle)}</div>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 12px; width: 100%;">
            <div style="flex: 1;">
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; width: 65%;">PARTICULARS (EXPENSES)</th>
                    <th style="text-align: right; width: 35%;">AMOUNT (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Opening Stock</td>
                    <td style="text-align: right;">${formatNumber(tradingData.openingStock || 0)}</td>
                  </tr>
                  ${(tradingData.purchaseGroups || []).map((g: any) => `
                    <tr>
                      <td>${escapeHtml(g.name)}</td>
                      <td style="text-align: right;">${formatNumber(Math.abs(g.balance || 0))}</td>
                    </tr>
                  `).join('')}
                  ${(tradingData.directExpenseGroups || []).map((g: any) => `
                    <tr>
                      <td>${escapeHtml(g.name)}</td>
                      <td style="text-align: right;">${formatNumber(Math.abs(g.balance || 0))}</td>
                    </tr>
                  `).join('')}
                  ${(plData.indirectExpenseGroups || []).map((g: any) => `
                    <tr>
                      <td>${escapeHtml(g.name)}</td>
                      <td style="text-align: right;">${formatNumber(Math.abs(g.balance || 0))}</td>
                    </tr>
                  `).join('')}
                  ${netProfit > 0 ? `
                    <tr style="font-weight: 700; color: #15803d; background-color: #f0fdf4;">
                      <td>Nett Profit (Transferred to Capital)</td>
                      <td style="text-align: right;">${formatNumber(netProfit)}</td>
                    </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td>TOTAL</td>
                    <td style="text-align: right;">৳ ${formatNumber(computedFinalTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style="flex: 1;">
              <table>
                <thead>
                  <tr>
                    <th style="text-align: left; width: 65%;">PARTICULARS (INCOMES)</th>
                    <th style="text-align: right; width: 35%;">AMOUNT (৳)</th>
                  </tr>
                </thead>
                <tbody>
                  ${(tradingData.salesGroups || []).map((g: any) => `
                    <tr>
                      <td>${escapeHtml(g.name)}</td>
                      <td style="text-align: right;">${formatNumber(Math.abs(g.balance || 0))}</td>
                    </tr>
                  `).join('')}
                  ${(plData.indirectIncomeGroups || []).map((g: any) => `
                    <tr>
                      <td>${escapeHtml(g.name)}</td>
                      <td style="text-align: right;">${formatNumber(Math.abs(g.balance || 0))}</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td>Closing Stock</td>
                    <td style="text-align: right;">${formatNumber(tradingData.closingStock || 0)}</td>
                  </tr>
                  ${netProfit < 0 ? `
                    <tr style="font-weight: 700; color: #b91c1c; background-color: #fef2f2;">
                      <td>Nett Loss (Transferred to Capital)</td>
                      <td style="text-align: right;">${formatNumber(Math.abs(netProfit))}</td>
                    </tr>
                  ` : ''}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td>TOTAL</td>
                    <td style="text-align: right;">৳ ${formatNumber(computedFinalTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div style="display: flex; justify-content: ${justifyMap[sigAlignment] || 'space-between'}; gap: 24px; margin-top: 44px;">
            ${settings?.showSignature1 !== false ? `<div style="border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${escapeHtml(settings?.printSignature1 || 'Prepared By')}</div>` : ''}
            ${settings?.showSignature2 !== false ? `<div style="border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${escapeHtml(settings?.printSignature2 || 'Checked By')}</div>` : ''}
            ${settings?.showSignature3 !== false ? `<div style="border-top: 1px solid #000; width: 160px; text-align: center; padding-top: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase;">${escapeHtml(settings?.printSignature3 || 'Authorised Signatory')}</div>` : ''}
          </div>

          <div style="margin-top: 24px; border-top: 1px solid #cbd5e1; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #4b5563;">
            <div>${settings?.showPrintFooter !== false ? escapeHtml(legal.printFooter || settings?.printFooter || '') : ''}</div>
            <div>${escapeHtml(softwareFooter)}</div>
          </div>
        </body>
      </html>
    `;
  };

  const buildStructuredRows = () => {
    const rows: Array<{ side: string; category: string; particulars: string; amount: number }> = [
      { side: 'Debit (Expenses)', category: 'Trading', particulars: 'Opening Stock', amount: Number((tradingData.openingStock || 0).toFixed(2)) },
      ...tradingData.purchaseGroups.map((g: any) => ({
        side: 'Debit (Expenses)',
        category: 'Purchase Accounts',
        particulars: g.name,
        amount: Number((g.balance || 0).toFixed(2))
      })),
      ...tradingData.directExpenseGroups.map((g: any) => ({
        side: 'Debit (Expenses)',
        category: 'Direct Expenses',
        particulars: g.name,
        amount: Number((g.balance || 0).toFixed(2))
      })),
      ...plData.indirectExpenseGroups.map((g: any) => ({
        side: 'Debit (Expenses)',
        category: 'Indirect Expenses',
        particulars: g.name,
        amount: Number((g.balance || 0).toFixed(2))
      })),
      ...tradingData.salesGroups.map((g: any) => ({
        side: 'Credit (Incomes)',
        category: 'Sales Accounts',
        particulars: g.name,
        amount: Number(Math.abs(g.balance || 0).toFixed(2))
      })),
      ...plData.indirectIncomeGroups.map((g: any) => ({
        side: 'Credit (Incomes)',
        category: 'Indirect Incomes',
        particulars: g.name,
        amount: Number(Math.abs(g.balance || 0).toFixed(2))
      })),
      { side: 'Credit (Incomes)', category: 'Trading', particulars: 'Closing Stock', amount: Number((tradingData.closingStock || 0).toFixed(2)) }
    ];
    return rows;
  };

  const handlePrint = () => {
    executePrint(buildProfitAndLossHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: 'Profit & Loss Account',
      subtitle: plPeriodSubtitle,
      fileName: `Profit_And_Loss_${startDate}_to_${endDate}`,
      htmlContent: buildProfitAndLossHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    const rows = buildStructuredRows();
    const computedFinalTotal = Math.max(
      debitTotal + (netProfit > 0 ? netProfit : 0),
      creditTotal + (netProfit < 0 ? Math.abs(netProfit) : 0)
    );

    exportStructuredExcel({
      fileName: `Profit_And_Loss_${startDate}_to_${endDate}`,
      sheetName: 'Profit & Loss',
      title: 'Profit & Loss Account',
      subtitle: plPeriodSubtitle,
      headers: ['Side', 'Category', 'Particulars', 'Amount'],
      rows: rows.map(r => [r.side, r.category, r.particulars, r.amount]),
      footerRow: [
        netProfit >= 0 ? 'Debit (Expenses)' : 'Credit (Incomes)',
        'Summary',
        netProfit >= 0 ? 'Nett Profit' : 'Nett Loss',
        Number(Math.abs(netProfit).toFixed(2))
      ],
      extraRows: [
        ['Summary', 'Total', 'Statement Total (Dr = Cr)', Number(computedFinalTotal.toFixed(2))]
      ],
      settings,
      company
    });
  };

  const handleDownload = () => {
    const rows = buildStructuredRows();
    const computedFinalTotal = Math.max(
      debitTotal + (netProfit > 0 ? netProfit : 0),
      creditTotal + (netProfit < 0 ? Math.abs(netProfit) : 0)
    );
    const exportData = [
      ...rows.map(r => ({
        Side: r.side,
        Category: r.category,
        Particulars: r.particulars,
        Amount: r.amount
      })),
      {
        Side: netProfit >= 0 ? 'Debit (Expenses)' : 'Credit (Incomes)',
        Category: 'Summary',
        Particulars: netProfit >= 0 ? 'Nett Profit' : 'Nett Loss',
        Amount: Number(Math.abs(netProfit).toFixed(2))
      },
      {
        Side: 'Summary',
        Category: 'Total',
        Particulars: 'Statement Total',
        Amount: Number(computedFinalTotal.toFixed(2))
      }
    ];

    exportToCSV(
      `Profit_And_Loss_${startDate}_to_${endDate}`,
      'Profit & Loss A/c',
      exportData,
      ['Side', 'Category', 'Particulars', 'Amount'],
      settings,
      company
    );
  };

  const handleEmailReport = () => {
    shareReportViaEmail({
      title: 'Profit & Loss Account',
      subtitle: plPeriodSubtitle,
      settings,
      company,
      summaryLines: [
        `Opening Stock: ${formatNumber(tradingData.openingStock || 0)}`,
        `Total Purchases: ${formatNumber(totalPurchases)}`,
        `Direct Expenses: ${formatNumber(totalDirectExp)}`,
        `Indirect Expenses: ${formatNumber(totalIndirectExp)}`,
        `Total Sales: ${formatNumber(totalSales)}`,
        `Indirect Incomes: ${formatNumber(totalIndirectInc)}`,
        `Closing Stock: ${formatNumber(tradingData.closingStock || 0)}`,
        `${netProfit >= 0 ? 'Nett Profit' : 'Nett Loss'}: ${formatNumber(Math.abs(netProfit))}`
      ]
    });
  };

  const activeTradingData = tradingData;
  const activePlData = plData;

  const finalTotal = Math.max(debitTotal + (netProfit > 0 ? netProfit : 0), creditTotal + (netProfit < 0 ? Math.abs(netProfit) : 0));

  return (
    <div className="flex flex-col h-screen bg-background transition-colors overflow-hidden">
      <div className="flex-none bg-card/90 backdrop-blur-sm border-b border-border shadow-xs px-4 lg:px-6 py-4 sticky top-0 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateInput
                  label={t('common.from')}
                  value={startDate}
                  onChange={setStartDate}
                  className="w-full shadow-none border-0 bg-muted/50 focus:bg-background"
                />
              </div>
              <div className="flex-1">
                <DateInput
                  label={t('common.to')}
                  value={endDate}
                  onChange={setEndDate}
                  className="w-full shadow-none border-0 bg-muted/50 focus:bg-background"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadExcel}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors text-xs font-semibold disabled:opacity-50"
              title="Export Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handleDownload}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg transition-colors border border-border text-xs font-semibold disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              CSV
            </button>
            <button 
              onClick={handlePrint}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg transition-colors border border-border text-xs font-semibold disabled:opacity-50"
              title={t('common.print')}
            >
              <Printer className="w-4 h-4 text-muted-foreground" />
              {t('common.print')}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all font-semibold text-xs shadow-xs active:scale-95 disabled:opacity-50"
              title="Print to PDF (Save professional financial statement offline)"
            >
              <Download className="w-4 h-4" />
              Print to PDF
            </button>
            <button
              onClick={handleEmailReport}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-muted text-foreground rounded-lg transition-colors border border-border text-xs font-semibold disabled:opacity-50"
              title="Share Summary via Email"
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div id="pl-report" className="p-4 lg:p-6 space-y-6 pb-20">
          {loading ? (
            <SkeletonLoader type="table" pageKey="reports" isFullPage={false} />
          ) : (
            <div className="border border-border bg-card shadow-[var(--shadow-surface)] rounded-xl overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border">
                {/* Left Side: Debit (Expenses) */}
                <div className="flex flex-col min-h-[400px]">
                  <div className="bg-muted px-4 py-2.5 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.particulars')}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.amount')}</span>
                  </div>
                  
                  <div className="flex-1 divide-y divide-border/40">
                    {/* Opening Stock */}
                    <div 
                      onClick={() => navigate(`/reports/stock?from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">{t('reports.openingStock')}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(tradingData.openingStock)}</span>
                    </div>

                    {/* Purchase Accounts */}
                    {activeTradingData.purchaseGroups.map((g: any) => (
                      <div 
                        key={g.name} 
                        onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                        className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                      >
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(g.balance)}</span>
                      </div>
                    ))}

                    {/* Direct Expenses */}
                    {activeTradingData.directExpenseGroups.map((g: any) => (
                      <div 
                        key={g.name} 
                        onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                        className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                      >
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(g.balance)}</span>
                      </div>
                    ))}

                    {/* Indirect Expenses */}
                    {activePlData.indirectExpenseGroups.map((g: any) => (
                      <div 
                        key={g.name} 
                        onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                        className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                      >
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(g.balance)}</span>
                      </div>
                    ))}

                    {/* Nett Profit */}
                    {netProfit > 0 && (
                      <div className="px-4 py-3 flex justify-between items-center bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors cursor-pointer border-l-4 border-emerald-500">
                        <span className="text-sm font-bold italic text-emerald-600 dark:text-emerald-400">Nett Profit</span>
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums underline decoration-emerald-500/30 underline-offset-4">{formatNumber(netProfit)}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Left */}
                  <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between items-center mt-auto">
                    <span className="text-sm font-black uppercase tracking-tight text-foreground">Total</span>
                    <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalTotal)}</span>
                  </div>
                </div>

                {/* Right Side: Credit (Incomes) */}
                <div className="flex flex-col min-h-[400px]">
                  <div className="bg-muted px-4 py-2.5 border-b border-border flex justify-between items-center">
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.particulars')}</span>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t('common.amount')}</span>
                  </div>

                  <div className="flex-1 divide-y divide-border/40">
                    {/* Sales Accounts */}
                    {activeTradingData.salesGroups.map((g: any) => (
                      <div 
                        key={g.name} 
                        onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                        className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                      >
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(g.balance))}</span>
                      </div>
                    ))}

                    {/* Indirect Incomes */}
                    {activePlData.indirectIncomeGroups.map((g: any) => (
                      <div 
                        key={g.name} 
                        onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                        className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                      >
                        <span className="text-sm font-medium text-foreground">{g.name}</span>
                        <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(g.balance))}</span>
                      </div>
                    ))}

                    {/* Closing Stock */}
                    <div 
                      onClick={() => navigate(`/reports/stock?from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center transition-colors border-l-4 border-transparent cursor-pointer hover:bg-muted/70 hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">Closing Stock</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(tradingData.closingStock)}</span>
                    </div>

                    {/* Nett Loss */}
                    {netProfit < 0 && (
                      <div className="px-4 py-3 flex justify-between items-center bg-rose-500/5 hover:bg-rose-500/10 transition-colors cursor-pointer border-l-4 border-rose-500">
                        <span className="text-sm font-bold italic text-rose-600 dark:text-rose-400">Nett Loss</span>
                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums underline decoration-rose-500/30 underline-offset-4">{formatNumber(Math.abs(netProfit))}</span>
                      </div>
                    )}
                  </div>

                  {/* Total Right */}
                  <div className="px-4 py-3 border-t border-border bg-muted/30 flex justify-between items-center mt-auto">
                    <span className="text-sm font-black uppercase tracking-tight text-foreground">Total</span>
                    <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

