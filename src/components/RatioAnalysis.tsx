import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Scale, Package, Loader2, Download, Printer, FileSpreadsheet, Mail, ArrowLeft, Info, BarChart2, Calendar } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn, formatNumber, formatToYMD, parseEntryDate, getMovementType, compareInventorySequence } from '../lib/utils';
import { buildReportPrintHtml, executePrint } from '../utils/printUtils';
import { printToPDF } from '../utils/pdfExportService';
import { exportToCSV, exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { DateInput } from './DateInput';
import { EditableHeader } from './EditableHeader';

export function RatioAnalysis() {
  const navigate = useNavigate();
  const { user, company } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showExplanation, setShowExplanation] = useState(true);
  const [viewVertical, setViewVertical] = useState(false);
  const [asOnDate, setAsOnDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });

  useEffect(() => {
    async function fetchAnalysisData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [ledgers, vEntries, items, invEntries, vouchers] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, asOnDate),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', asOnDate),
          erpService.getVouchersByDateRange(user.companyId, '1900-01-01', asOnDate)
        ]);

        // Determine active financial year start (falls back to inception if unset or > asOnDate)
        const rawFyStart = settings.financialYearStart ? formatToYMD(settings.financialYearStart) : '';
        const hasValidFyStart = Boolean(rawFyStart && rawFyStart <= asOnDate);
        const fyStartDate = hasValidFyStart ? parseEntryDate(rawFyStart, null) : null;
        const asOnEndDate = parseEntryDate(asOnDate, null);
        asOnEndDate.setHours(23, 59, 59, 999);

        // 1. Calculate Cumulative Balance Sheet Balances (as of asOnDate)
        //    and Period-Consistent P&L Balances (FY-to-date when FY start <= asOnDate, else inception-to-date)
        const ledgerBalances: Record<string, number> = {};
        const fyMovementBalances: Record<string, number> = {};

        ledgers.forEach(l => {
          ledgerBalances[l.id] = Number(l.opening_balance) || 0;
          // Include opening_balance in FY movement only if no FY start scoping is splitting prior periods
          fyMovementBalances[l.id] = hasValidFyStart ? 0 : (Number(l.opening_balance) || 0);
        });

        (vEntries || []).forEach((e: any) => {
          const delta = (Number(e.debit) || 0) - (Number(e.credit) || 0);
          const lId = e.ledger_id;
          if (!lId) return;
          if (ledgerBalances[lId] === undefined) ledgerBalances[lId] = 0;
          ledgerBalances[lId] += delta;

          if (!hasValidFyStart) {
            if (fyMovementBalances[lId] === undefined) fyMovementBalances[lId] = 0;
            fyMovementBalances[lId] += delta;
          } else if (fyStartDate) {
            const eDate = parseEntryDate(e.v_date || e.date, e.createdAt);
            if (eDate >= fyStartDate && eDate <= asOnEndDate) {
              if (fyMovementBalances[lId] === undefined) fyMovementBalances[lId] = 0;
              fyMovementBalances[lId] += delta;
            }
          }
        });

        // If FY start is active, preserve ledger opening_balance when there are no pre-FY entries on P&L ledgers
        const hasPreFyEntries = hasValidFyStart && fyStartDate
          ? (vEntries || []).some((e: any) => parseEntryDate(e.v_date || e.date, e.createdAt) < fyStartDate)
          : false;
        const plBalances = hasPreFyEntries ? fyMovementBalances : ledgerBalances;

        // 2. Chronological Stock Valuation (aligned with StockSummary & ProfitAndLoss)
        const voucherMap: Record<string, any> = {};
        (vouchers || []).forEach((v: any) => {
          if (v?.id) voucherMap[v.id] = v;
        });

        const enrichedInv = (invEntries || []).map((e: any) => {
          const v = voucherMap[e.voucher_id] || {};
          const vType = (e.v_type || v.v_type || '').toString();
          const mType = e.m_type || e.movement_type || e.entry_type || v.m_type || v.movement_type || '';
          return {
            ...e,
            v_type: vType,
            v_no: e.v_no || v.v_no || '',
            v_serial_no: e.v_serial_no || v.serial_no || 0,
            v_createdAt: e.created_at || v.createdAt,
            date: e.date || v.v_date || '',
            m_type: getMovementType({ ...e, v_type: vType, m_type: mType })
          };
        }).sort((a: any, b: any) => compareInventorySequence(a, b));

        const calculateStockValue = (targetEndDate: Date | null): number => {
          const itemStates: Record<string, { total: number; godowns: Record<string, number> }> = {};
          (items || []).forEach((item: any) => {
            const godownBalances: Record<string, number> = {};
            (item.opening_godowns || []).forEach((ag: any) => {
              if (ag.godown_id) godownBalances[ag.godown_id] = Number(ag.qty) || 0;
            });
            itemStates[item.id] = {
              total: Number(item.opening_qty) || 0,
              godowns: godownBalances
            };
          });

          if (targetEndDate) {
            enrichedInv.forEach((entry: any) => {
              const entryDate = parseEntryDate(entry.date, entry.v_createdAt);
              if (entryDate > targetEndDate) return;

              const state = itemStates[entry.item_id];
              if (!state) return;

              const qty = (Number(entry.qty) || 0) + (Number(entry.free_qty) || 0);
              const mType = entry.m_type || getMovementType(entry);
              const isPhysical = (entry.v_type || '').toLowerCase() === 'physical stock' || !!entry.is_physical_snapshot;
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
            });
          }

          return (items || []).reduce((sum: number, item: any) => {
            const state = itemStates[item.id];
            const qty = state ? Math.max(0, state.total) : 0;
            const rate = Number(item?.avg_cost) || Number(item?.opening_rate) || 0;
            return sum + (qty * rate);
          }, 0);
        };

        let dayBeforeFyEnd: Date | null = null;
        if (hasPreFyEntries && fyStartDate) {
          dayBeforeFyEnd = new Date(fyStartDate.getTime() - 1);
        }

        const openingStockValue = calculateStockValue(dayBeforeFyEnd);
        const closingStockValue = calculateStockValue(asOnEndDate);

        // 3. Safe Ledger Group Matching (prevents 'indirect expense' matching 'direct expense')
        const matchesGroup = (groupName: string | undefined, includesAny: string[], excludesAny: string[] = []): boolean => {
          const g = (groupName || '').toLowerCase().trim();
          if (!g) return false;
          if (excludesAny.some(ex => g.includes(ex))) return false;
          return includesAny.some(inc => g.includes(inc));
        };

        const sumGroup = (balances: Record<string, number>, includesAny: string[], excludesAny: string[] = []): number => {
          return ledgers
            .filter(l => matchesGroup(l.group_name, includesAny, excludesAny))
            .reduce((sum, l) => sum + (balances[l.id] || 0), 0);
        };

        const currentAssetsVal =
          sumGroup(ledgerBalances, ['current asset', 'bank account', 'cash-in-hand', 'cash in hand', 'sundry debtor', 'loans & advances (asset)', 'deposits (asset)']) +
          closingStockValue;
        const currentLiabilitiesVal = Math.max(
          0,
          -sumGroup(ledgerBalances, ['current liabilit', 'sundry creditor', 'duties & taxes', 'provision', 'bank od'])
        );
        const workingCapital = currentAssetsVal - currentLiabilitiesVal;

        const cashInHand = sumGroup(ledgerBalances, ['cash-in-hand', 'cash in hand']);
        const bankAccounts = sumGroup(ledgerBalances, ['bank account']);
        const bankOD = Math.max(0, -sumGroup(ledgerBalances, ['bank od']));
        const debtors = sumGroup(ledgerBalances, ['sundry debtor']);
        const creditors = Math.max(0, -sumGroup(ledgerBalances, ['sundry creditor']));

        // 4. Trading & P&L Math (Preserving Dr/Cr Signs: Credit Income is negative in Dr-Cr, Debit Expense is positive)
        let salesVal = 0;
        let directIncomeVal = 0;
        let purchaseVal = 0;
        let directExpenseVal = 0;
        let indirectIncomeVal = 0;
        let indirectExpenseVal = 0;

        let cumTotalIncome = 0;
        let cumTotalExpense = 0;

        ledgers.forEach(l => {
          const bal = plBalances[l.id] || 0;
          const cumBal = ledgerBalances[l.id] || 0;

          if (l.nature === 'Income') cumTotalIncome += -cumBal;
          if (l.nature === 'Expense') cumTotalExpense += cumBal;

          if (matchesGroup(l.group_name, ['sales account', 'sales'])) {
            salesVal += -bal;
          } else if (matchesGroup(l.group_name, ['direct income'], ['indirect'])) {
            directIncomeVal += -bal;
          } else if (matchesGroup(l.group_name, ['purchase account', 'purchase'])) {
            purchaseVal += bal;
          } else if (matchesGroup(l.group_name, ['direct expense'], ['indirect'])) {
            directExpenseVal += bal;
          } else if (l.nature === 'Income') {
            indirectIncomeVal += -bal;
          } else if (l.nature === 'Expense') {
            indirectExpenseVal += bal;
          }
        });

        const cogs = openingStockValue + purchaseVal + directExpenseVal - closingStockValue;
        const grossProfit = (salesVal + directIncomeVal + closingStockValue) - (openingStockValue + purchaseVal + directExpenseVal);
        const netProfit = grossProfit + indirectIncomeVal - indirectExpenseVal;

        const initialOpeningStock = calculateStockValue(null);
        const cumNetProfit = (cumTotalIncome + closingStockValue) - (cumTotalExpense + initialOpeningStock);

        const capitalAcc = -sumGroup(ledgerBalances, ['capital account', 'reserve']);
        const loansLiability = Math.max(0, -sumGroup(ledgerBalances, ['loans (liability)', 'secured loan', 'unsecured loan']));
        const equityBase = capitalAcc + cumNetProfit;

        setData({
          groups: [
            { name: 'Working Capital', value: workingCapital, formula: '(Current Assets-Current Liabilities)' },
            { name: 'Cash-in-Hand', value: cashInHand },
            { name: 'Bank Accounts', value: bankAccounts },
            { name: 'Bank OD A/c', value: -bankOD },
            { name: 'Sundry Debtors', value: debtors },
            { name: 'Sundry Creditors', value: -creditors },
            { name: 'Sales Accounts', value: -salesVal },
            { name: 'Purchase Accounts', value: purchaseVal },
            { name: 'Stock-in-Hand', value: closingStockValue },
            { name: 'Nett Profit', value: -netProfit },
            {
              name: 'Wkg. Capital Turnover',
              value: workingCapital !== 0 && salesVal > 0 ? Math.abs(salesVal / workingCapital) : 0,
              formula: '(Sales Accounts / Working Capital)',
              isRatio: true
            },
            {
              name: 'Inventory Turnover',
              value: closingStockValue > 0 && salesVal > 0 ? (salesVal / closingStockValue) : 0,
              formula: '(Sales Accounts / Closing Stock)',
              isRatio: true
            },
          ],
          ratios: [
            {
              name: 'Current Ratio',
              value: currentLiabilitiesVal > 0 ? (currentAssetsVal / currentLiabilitiesVal) : 0,
              formula: '(Current Assets : Current Liabilities)',
              type: 'ratio'
            },
            {
              name: 'Quick Ratio',
              value: currentLiabilitiesVal > 0 ? ((currentAssetsVal - closingStockValue) / currentLiabilitiesVal) : 0,
              formula: '(Current Assets-Stock-in-Hand : Current Liabilities)',
              type: 'ratio'
            },
            {
              name: 'Debt/Equity Ratio',
              value: equityBase > 0 ? (loansLiability / equityBase) : 0,
              formula: '(Loans (Liability) : Capital Account + Nett Profit)',
              type: 'ratio'
            },
            {
              name: 'Gross Profit %',
              value: salesVal > 0 ? ((grossProfit / salesVal) * 100) : 0,
              formula: '(Gross Profit / Sales Accounts) %',
              type: 'percent'
            },
            {
              name: 'Nett Profit %',
              value: salesVal > 0 ? ((netProfit / salesVal) * 100) : 0,
              formula: '(Nett Profit / Sales Accounts) %',
              type: 'percent'
            },
            {
              name: 'Operating Cost %',
              value: salesVal > 0 ? (((cogs + indirectExpenseVal) / salesVal) * 100) : 0,
              formula: '((COGS + Indirect Expenses) / Sales Accounts) %',
              type: 'percent'
            },
            {
              name: 'Recv. Turnover in days',
              value: (salesVal > 0 && debtors > 0) ? (debtors / (salesVal / 365)) : 0,
              formula: '(payment performance of Debtors)',
              type: 'days'
            },
            {
              name: 'Return on Investment %',
              value: equityBase > 0 ? ((netProfit / equityBase) * 100) : 0,
              formula: '(Nett Profit / Capital Account + Nett Profit) %',
              type: 'percent'
            },
            {
              name: 'Return on Wkg. Capital %',
              value: workingCapital > 0 ? ((netProfit / workingCapital) * 100) : 0,
              formula: '(Nett Profit / Working Capital) %',
              type: 'percent'
            },
          ]
        });
      } catch (err) {
        console.error('Ratio analysis error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysisData();
  }, [user?.companyId, asOnDate, settings.financialYearStart]);

  const asOnSubtitle = `As on ${formatReportDate(asOnDate, settings.dateFormat)}`;

  const formatGroupDisplay = (group: any) =>
    group.isRatio
      ? Number(group.value || 0).toFixed(2)
      : `${formatNumber(Math.abs(group.value || 0))} ${group.value >= 0 ? 'Dr' : 'Cr'}`;

  const formatRatioDisplay = (ratio: any) =>
    ratio.type === 'ratio'
      ? `${Number(ratio.value || 0).toFixed(2)} : 1`
      : ratio.type === 'percent'
        ? `${Number(ratio.value || 0).toFixed(2)} %`
        : `${Number(ratio.value || 0).toFixed(2)} days`;

  const buildRatioAnalysisPrintHtml = () => {
    const groups = data?.groups || [];
    const ratios = data?.ratios || [];

    const workingCap = groups.find((g: any) => g.name === 'Working Capital');
    const netProfitGroup = groups.find((g: any) => g.name === 'Nett Profit');
    const currentRatio = ratios.find((r: any) => r.name === 'Current Ratio');
    const gpRatio = ratios.find((r: any) => r.name === 'Gross Profit %');

    return buildReportPrintHtml({
      title: 'Ratio Analysis Report',
      subtitle: asOnSubtitle,
      settings,
      company,
      summaryCards: [
        { label: 'Working Capital', value: workingCap ? formatGroupDisplay(workingCap) : '0.00' },
        { label: 'Nett Profit', value: netProfitGroup ? formatGroupDisplay(netProfitGroup) : '0.00' },
        { label: 'Current Ratio', value: currentRatio ? formatRatioDisplay(currentRatio) : '0.00 : 1' },
        { label: 'Gross Profit %', value: gpRatio ? formatRatioDisplay(gpRatio) : '0.00 %' }
      ],
      sections: [
        {
          heading: 'Principal Groups',
          columns: [
            { label: 'Particulars', width: '44%' },
            { label: 'Formula / Basis', width: '34%' },
            { label: 'Value', align: 'right', width: '22%' }
          ],
          rows: groups.map((g: any) => ({
            cells: [g.name, showExplanation && g.formula ? g.formula : '—', formatGroupDisplay(g)],
            tone: g.isRatio ? 'neutral' : (g.value >= 0 ? 'positive' : 'negative')
          })),
          emptyMessage: 'No group data available'
        },
        {
          heading: 'Principal Ratios',
          columns: [
            { label: 'Particulars', width: '44%' },
            { label: 'Formula / Basis', width: '34%' },
            { label: 'Value', align: 'right', width: '22%' }
          ],
          rows: ratios.map((r: any) => ({
            cells: [r.name, showExplanation && r.formula ? r.formula : '—', formatRatioDisplay(r)],
            tone: r.value >= 0 ? 'positive' : 'negative'
          })),
          emptyMessage: 'No ratio data available'
        }
      ]
    });
  };

  const handlePrint = () => {
    if (!data) return;
    executePrint(buildRatioAnalysisPrintHtml());
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    printToPDF({
      title: 'Ratio Analysis Report',
      subtitle: asOnSubtitle,
      fileName: `Ratio_Analysis_${asOnDate}`,
      htmlContent: buildRatioAnalysisPrintHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    if (!data) return;
    const rows: Record<string, any>[] = [
      ...data.groups.map((g: any) => ({
        section: 'Principal Groups',
        particulars: g.name,
        formula: g.formula || '',
        value: Number(Math.abs(g.value || 0).toFixed(2)),
        unit_sign: g.isRatio ? 'Ratio' : (g.value >= 0 ? 'Dr' : 'Cr')
      })),
      ...data.ratios.map((r: any) => ({
        section: 'Principal Ratios',
        particulars: r.name,
        formula: r.formula || '',
        value: Number((r.value || 0).toFixed(2)),
        unit_sign: r.type === 'ratio' ? ': 1' : r.type === 'percent' ? '%' : 'days'
      }))
    ];

    exportStructuredExcel({
      fileName: `Ratio_Analysis_${asOnDate}`,
      sheetName: 'Ratio Analysis',
      title: 'Ratio Analysis Report',
      subtitle: asOnSubtitle,
      headers: ['Section', 'Particulars', 'Formula', 'Value', 'Unit / Sign'],
      rows: rows.map(r => [r.section, r.particulars, r.formula, r.value, r.unit_sign]),
      settings,
      company
    });
  };

  const handleDownloadCSV = () => {
    if (!data) return;
    const exportData: any[] = [];
    exportData.push({ Type: 'GROUP', Particulars: 'PRINCIPAL GROUPS', Formula: '', Value: '' });
    data.groups.forEach((g: any) =>
      exportData.push({
        Type: 'GROUP',
        Particulars: g.name,
        Formula: g.formula || '',
        Value: formatGroupDisplay(g)
      })
    );
    exportData.push({ Type: 'RATIO', Particulars: 'PRINCIPAL RATIOS', Formula: '', Value: '' });
    data.ratios.forEach((r: any) =>
      exportData.push({
        Type: 'RATIO',
        Particulars: r.name,
        Formula: r.formula || '',
        Value: formatRatioDisplay(r)
      })
    );
    exportToCSV(`Ratio_Analysis_${asOnDate}`, 'Ratio Analysis', exportData, ['Type', 'Particulars', 'Formula', 'Value'], settings, company);
  };

  const handleEmailReport = () => {
    if (!data) return;
    shareReportViaEmail({
      title: 'Ratio Analysis Report',
      subtitle: asOnSubtitle,
      settings,
      company,
      summaryLines: [
        'PRINCIPAL GROUPS:',
        ...data.groups.map((g: any) => `- ${g.name}: ${formatGroupDisplay(g)}`),
        '',
        'PRINCIPAL RATIOS:',
        ...data.ratios.map((r: any) => `- ${r.name}: ${formatRatioDisplay(r)}`)
      ]
    });
  };

  const dummyGroups = [
    { name: 'Working Capital', value: 0, formula: '(Current Assets-Current Liabilities)' },
    { name: 'Cash-in-Hand', value: 0 },
    { name: 'Bank Accounts', value: 0 },
    { name: 'Bank OD A/c', value: 0 },
    { name: 'Sundry Debtors', value: 0 },
    { name: 'Sundry Creditors', value: 0 },
    { name: 'Sales Accounts', value: 0 },
    { name: 'Purchase Accounts', value: 0 },
    { name: 'Stock-in-Hand', value: 0 },
    { name: 'Nett Profit', value: 0 },
    { name: 'Wkg. Capital Turnover', value: 0, formula: '(Sales Accounts / Working Capital)', isRatio: true },
    { name: 'Inventory Turnover', value: 0, formula: '(Sales Accounts / Closing Stock)', isRatio: true },
  ];

  const dummyRatios = [
    { name: 'Current Ratio', value: 0, formula: '(Current Assets : Current Liabilities)', type: 'ratio' },
    { name: 'Quick Ratio', value: 0, formula: '(Current Assets-Stock-in-Hand : Current Liabilities)', type: 'ratio' },
    { name: 'Debt/Equity Ratio', value: 0, formula: '(Loans (Liability) : Capital Account + Nett Profit)', type: 'ratio' },
    { name: 'Gross Profit %', value: 0, formula: '(Gross Profit / Sales Accounts) %', type: 'percent' },
    { name: 'Nett Profit %', value: 0, formula: '(Nett Profit / Sales Accounts) %', type: 'percent' },
    { name: 'Operating Cost %', value: 0, formula: '((COGS + Indirect Expenses) / Sales Accounts) %', type: 'percent' },
    { name: 'Recv. Turnover in days', value: 0, formula: '(payment performance of Debtors)', type: 'days' },
    { name: 'Return on Investment %', value: 0, formula: '(Nett Profit / Capital Account + Nett Profit) %', type: 'percent' },
    { name: 'Return on Wkg. Capital %', value: 0, formula: '(Nett Profit / Working Capital) %', type: 'percent' },
  ];

  const activeData = loading ? { groups: dummyGroups, ratios: dummyRatios } : (data || { groups: [], ratios: [] });

  const renderGroups = () => (
    <div className="flex flex-col">
      <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Principal Groups :</span>
      </div>
      <div className="flex-1 divide-y divide-border/30">
        {activeData.groups.map((group: any) => (
          <div key={group.name} className="px-4 py-2 group hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-foreground transition-colors leading-tight">
                  {group.name}
                </span>
                {showExplanation && group.formula && (
                  <span className="text-[10px] italic text-muted-foreground leading-tight">{group.formula}</span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {loading ? (
                  <div className="h-4 w-16 bg-muted-foreground/20 animate-pulse rounded" />
                ) : (
                  <>
                    <span className="text-[13px] font-bold text-foreground font-mono tracking-tighter">
                      {group.isRatio ? group.value.toFixed(2) : formatNumber(Math.abs(group.value))}
                    </span>
                    {!group.isRatio && (
                      <span className="text-[11px] font-bold text-muted-foreground min-w-[20px]">
                        {group.value >= 0 ? 'Dr' : 'Cr'}
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRatios = () => (
    <div className={cn("flex flex-col", viewVertical ? "" : "bg-muted/5")}>
      <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Principal Ratios :</span>
      </div>
      <div className="flex-1 divide-y divide-border/30">
        {activeData.ratios.map((ratio: any) => (
          <div key={ratio.name} className="px-4 py-2 group hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[13px] font-bold text-foreground transition-colors leading-tight">
                  {ratio.name}
                </span>
                {showExplanation && ratio.formula && (
                  <span className="text-[10px] italic text-muted-foreground leading-tight">{ratio.formula}</span>
                )}
              </div>
              {loading ? (
                <div className="h-4 w-16 bg-muted-foreground/20 animate-pulse rounded" />
              ) : (
                <span className="text-[13px] font-bold text-foreground font-mono">
                  {ratio.type === 'ratio' ? `${ratio.value.toFixed(2)} : 1` : 
                   ratio.type === 'percent' ? `${ratio.value.toFixed(2)} %` : 
                   `${ratio.value.toFixed(2)} days`}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background transition-colors">
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
              onClick={() => setShowExplanation(!showExplanation)}
              className={cn("px-3 py-2 border flex items-center gap-2 text-[10px] font-bold uppercase transition-colors", showExplanation ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-gray-500 hover:text-foreground")}
            >
              <Info className="w-3 h-3" /> {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
            </button>
            <button 
              onClick={() => setViewVertical(!viewVertical)}
              className={cn("px-3 py-2 border flex items-center gap-2 text-[10px] font-bold uppercase transition-colors", viewVertical ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-gray-500 hover:text-foreground")}
            >
              <BarChart2 className="w-3 h-3" /> {viewVertical ? 'Standard View' : 'Vertical Analysis'}
            </button>
            <button
              onClick={handleDownloadExcel}
              disabled={loading || !data}
              className="px-3 py-2 bg-emerald-50/70 border border-emerald-200 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Export Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
            </button>
            <button
              onClick={handleDownloadCSV}
              disabled={loading || !data}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Export CSV"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handlePrint}
              disabled={loading || !data}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title={t('common.print')}
            >
              <Printer className="w-3.5 h-3.5" /> {t('common.print')}
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={loading || !data}
              className="px-3 py-2 bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Print to PDF"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button
              onClick={handleEmailReport}
              disabled={loading || !data}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase disabled:opacity-50"
              title="Share Summary via Email"
            >
              <Mail className="w-3.5 h-3.5" /> EMAIL
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-background">
        <div id="ratio-analysis-report" className="p-4 lg:p-6 space-y-6 pb-20">
          <div className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            {viewVertical ? (
              <div className="flex flex-col divide-y divide-border">
                {renderGroups()}
                {renderRatios()}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border">
                {renderGroups()}
                {renderRatios()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

