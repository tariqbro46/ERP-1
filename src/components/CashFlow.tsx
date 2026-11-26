import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileSpreadsheet, Mail, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatNumber, cn, parseEntryDate } from '../lib/utils';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { buildReportPrintHtml, executePrint } from '../utils/printUtils';
import { printToPDF } from '../utils/pdfExportService';
import { exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import { DateInput } from './DateInput';

export function CashFlow() {
  const { user, company } = useAuth();
  const settings = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  const [operatingActivities, setOperatingActivities] = useState<any[]>([]);
  const [investingActivities, setInvestingActivities] = useState<any[]>([]);
  const [financingActivities, setFinancingActivities] = useState<any[]>([]);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [closingBalance, setClosingBalance] = useState(0);

  useEffect(() => {
    async function fetchCashFlow() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const effectiveFrom = dateRange.from <= dateRange.to ? dateRange.from : dateRange.to;
        const effectiveTo = dateRange.from <= dateRange.to ? dateRange.to : dateRange.from;

        const [ledgers, vEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, effectiveTo)
        ]);

        const isCashOrBankLedger = (l: any): boolean => {
          const gName = (l.group_name || '').toLowerCase().trim();
          if (gName.includes('bank od') || gName.includes('overdraft') || gName.includes('loan')) {
            return false;
          }
          if (gName.includes('cash') || gName.includes('bank')) {
            return true;
          }
          const lName = (l.name || '').toLowerCase();
          return l.nature === 'Asset' && (lName.includes('cash') || lName.includes('bank'));
        };

        const classifyActivity = (ledger: any): 'operating' | 'investing' | 'financing' => {
          const gName = (ledger?.group_name || '').toLowerCase().trim();
          if (gName.includes('fixed asset') || gName.includes('investment')) {
            return 'investing';
          }
          if (
            gName.includes('capital') ||
            gName.includes('reserve') ||
            gName.includes('loans (liability)') ||
            gName.includes('secured loan') ||
            gName.includes('unsecured loan') ||
            gName.includes('bank od') ||
            gName.includes('overdraft')
          ) {
            return 'financing';
          }
          return 'operating';
        };

        const ledgerMap = new Map<string, any>();
        ledgers.forEach(l => ledgerMap.set(l.id, l));

        const cashBankLedgers = ledgers.filter(isCashOrBankLedger);
        const cashBankIds = new Set(cashBankLedgers.map(l => l.id));

        const fromDate = parseEntryDate(effectiveFrom, null);
        const toDate = parseEntryDate(effectiveTo, null);
        toDate.setHours(23, 59, 59, 999);

        // 1. Opening Balance = Ledger opening_balance + all cash/bank movements strictly prior to dateRange.from
        let prePeriodCashMovement = 0;
        const periodVouchersMap = new Map<string, any[]>();

        (vEntries || []).forEach((entry: any) => {
          const entryDate = parseEntryDate(entry.v_date || entry.date, entry.createdAt);
          if (entryDate < fromDate) {
            if (cashBankIds.has(entry.ledger_id)) {
              prePeriodCashMovement += (Number(entry.debit) || 0) - (Number(entry.credit) || 0);
            }
          } else if (entryDate <= toDate) {
            const vId = entry.voucher_id || entry.id;
            if (!vId) return;
            const existing = periodVouchersMap.get(vId);
            if (existing) {
              existing.push(entry);
            } else {
              periodVouchersMap.set(vId, [entry]);
            }
          }
        });

        const baseOpening = cashBankLedgers.reduce((sum, l) => sum + (Number(l.opening_balance) || 0), 0);
        const computedOpening = baseOpening + prePeriodCashMovement;
        setOpeningBalance(computedOpening);

        // 2. Analyze in-period vouchers grouped by voucher_id (O(N))
        // Pure Cash <-> Bank Contra vouchers net to cashNet === 0 and are excluded from activity flows.
        // Compound vouchers with multiple non-cash counterparts allocate cashNet proportionally without double counting.
        const operating: Array<{ name: string; amount: number }> = [];
        const investing: Array<{ name: string; amount: number }> = [];
        const financing: Array<{ name: string; amount: number }> = [];

        const pushToBucket = (bucket: 'operating' | 'investing' | 'financing', name: string, amount: number) => {
          if (Math.abs(amount) < 0.0001) return;
          if (bucket === 'investing') investing.push({ name, amount });
          else if (bucket === 'financing') financing.push({ name, amount });
          else operating.push({ name, amount });
        };

        periodVouchersMap.forEach((voucherLines) => {
          let cashNet = 0;
          const nonCashLines: Array<{ ledger: any; cashEffect: number }> = [];

          voucherLines.forEach((line: any) => {
            const delta = (Number(line.debit) || 0) - (Number(line.credit) || 0);
            if (cashBankIds.has(line.ledger_id)) {
              cashNet += delta;
            } else {
              // From cash's perspective, a credit on a non-cash ledger corresponds to cash inflow (+),
              // and a debit on a non-cash ledger corresponds to cash outflow (-).
              const cashEffect = -delta;
              if (Math.abs(cashEffect) >= 0.0001) {
                nonCashLines.push({
                  ledger: ledgerMap.get(line.ledger_id) || null,
                  cashEffect
                });
              }
            }
          });

          // Skip non-cash vouchers and pure Cash <-> Bank Contra transfers
          if (Math.abs(cashNet) < 0.001) return;

          if (nonCashLines.length === 0) {
            pushToBucket('operating', 'Unmapped Cash Adjustment', cashNet);
            return;
          }

          // Prefer lines moving in the same cash direction (all lines in standard split payments/receipts)
          const sameDirectionLines = nonCashLines.filter(item =>
            cashNet > 0 ? item.cashEffect > 0 : item.cashEffect < 0
          );
          const sameDirectionTotal = sameDirectionLines.reduce((s, item) => s + Math.abs(item.cashEffect), 0);

          if (sameDirectionLines.length > 0 && sameDirectionTotal > 0) {
            sameDirectionLines.forEach(item => {
              const allocatedAmount = cashNet * (Math.abs(item.cashEffect) / sameDirectionTotal);
              const bucket = item.ledger ? classifyActivity(item.ledger) : 'operating';
              pushToBucket(bucket, item.ledger?.name || 'Other Account', allocatedAmount);
            });
          } else {
            nonCashLines.forEach(item => {
              const bucket = item.ledger ? classifyActivity(item.ledger) : 'operating';
              pushToBucket(bucket, item.ledger?.name || 'Other Account', item.cashEffect);
            });
          }
        });

        const groupItems = (items: Array<{ name: string; amount: number }>) => {
          const grouped: Record<string, number> = {};
          items.forEach(item => {
            grouped[item.name] = (grouped[item.name] || 0) + item.amount;
          });
          return Object.entries(grouped)
            .filter(([, amount]) => Math.abs(amount) >= 0.005)
            .map(([name, amount]) => ({ name, amount }));
        };

        const groupedOp = groupItems(operating);
        const groupedInv = groupItems(investing);
        const groupedFin = groupItems(financing);

        setOperatingActivities(groupedOp);
        setInvestingActivities(groupedInv);
        setFinancingActivities(groupedFin);

        const totalChange = [...groupedOp, ...groupedInv, ...groupedFin].reduce((sum, item) => sum + item.amount, 0);
        setClosingBalance(computedOpening + totalChange);
      } catch (err) {
        console.error('Error fetching cash flow:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchCashFlow();
  }, [user?.companyId, dateRange.from, dateRange.to]);

  const totalOperating = operatingActivities.reduce((sum, item) => sum + item.amount, 0);
  const totalInvesting = investingActivities.reduce((sum, item) => sum + item.amount, 0);
  const totalFinancing = financingActivities.reduce((sum, item) => sum + item.amount, 0);
  const netCashFlow = totalOperating + totalInvesting + totalFinancing;

  const effectiveFrom = dateRange.from <= dateRange.to ? dateRange.from : dateRange.to;
  const effectiveTo = dateRange.from <= dateRange.to ? dateRange.to : dateRange.from;
  const periodSubtitle = `Period: ${formatReportDate(effectiveFrom, settings.dateFormat)} to ${formatReportDate(effectiveTo, settings.dateFormat)}`;

  const buildCashFlowPrintHtml = () => {
    const mapSectionRows = (items: any[], totalLabel: string, totalVal: number) => {
      const rows = items.map(item => ({
        cells: [item.name, formatCurrency(item.amount)],
        tone: (item.amount >= 0 ? 'positive' : 'negative') as 'positive' | 'negative'
      }));
      rows.push({
        cells: [totalLabel, formatCurrency(totalVal)],
        isTotal: true,
        tone: (totalVal >= 0 ? 'positive' : 'negative') as 'positive' | 'negative'
      } as any);
      return rows;
    };

    return buildReportPrintHtml({
      title: 'Cash Flow Statement',
      subtitle: periodSubtitle,
      settings,
      company,
      summaryCards: [
        { label: 'Opening Balance', value: formatCurrency(openingBalance) },
        { label: 'Net Cash Flow', value: formatCurrency(netCashFlow) },
        { label: 'Closing Balance', value: formatCurrency(closingBalance) }
      ],
      sections: [
        {
          heading: 'Cash Flow from Operating Activities',
          columns: [
            { label: 'Particulars', width: '72%' },
            { label: 'Amount', align: 'right', width: '28%' }
          ],
          rows: mapSectionRows(operatingActivities, 'Net Cash from Operating Activities', totalOperating),
          emptyMessage: 'No operating activities found'
        },
        {
          heading: 'Cash Flow from Investing Activities',
          columns: [
            { label: 'Particulars', width: '72%' },
            { label: 'Amount', align: 'right', width: '28%' }
          ],
          rows: mapSectionRows(investingActivities, 'Net Cash from Investing Activities', totalInvesting),
          emptyMessage: 'No investing activities found'
        },
        {
          heading: 'Cash Flow from Financing Activities',
          columns: [
            { label: 'Particulars', width: '72%' },
            { label: 'Amount', align: 'right', width: '28%' }
          ],
          rows: mapSectionRows(financingActivities, 'Net Cash from Financing Activities', totalFinancing),
          emptyMessage: 'No financing activities found'
        }
      ]
    });
  };

  const handlePrint = () => {
    executePrint(buildCashFlowPrintHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: 'Cash Flow Statement',
      subtitle: periodSubtitle,
      fileName: `Cash_Flow_${effectiveFrom}_to_${effectiveTo}`,
      htmlContent: buildCashFlowPrintHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    const rows: Record<string, any>[] = [
      { section: 'Summary', particulars: 'Opening Cash & Bank Balance', amount: Number(openingBalance.toFixed(2)) },
      ...operatingActivities.map(item => ({
        section: 'Operating Activities',
        particulars: item.name,
        amount: Number(item.amount.toFixed(2))
      })),
      { section: 'Operating Activities', particulars: 'Net Cash from Operating Activities', amount: Number(totalOperating.toFixed(2)) },
      ...investingActivities.map(item => ({
        section: 'Investing Activities',
        particulars: item.name,
        amount: Number(item.amount.toFixed(2))
      })),
      { section: 'Investing Activities', particulars: 'Net Cash from Investing Activities', amount: Number(totalInvesting.toFixed(2)) },
      ...financingActivities.map(item => ({
        section: 'Financing Activities',
        particulars: item.name,
        amount: Number(item.amount.toFixed(2))
      })),
      { section: 'Financing Activities', particulars: 'Net Cash from Financing Activities', amount: Number(totalFinancing.toFixed(2)) },
      { section: 'Summary', particulars: 'Net Cash Flow', amount: Number(netCashFlow.toFixed(2)) }
    ];

    exportStructuredExcel({
      fileName: `Cash_Flow_${effectiveFrom}_to_${effectiveTo}`,
      sheetName: 'Cash Flow',
      title: 'Cash Flow Statement',
      subtitle: periodSubtitle,
      headers: ['Section', 'Particulars', 'Amount'],
      rows,
      footerRow: {
        section: 'Summary',
        particulars: 'Closing Cash & Bank Balance',
        amount: Number(closingBalance.toFixed(2))
      },
      settings,
      company
    });
  };

  const handleEmailReport = () => {
    shareReportViaEmail({
      title: 'Cash Flow Statement',
      subtitle: periodSubtitle,
      settings,
      company,
      summaryLines: [
        `Opening Balance: ${formatNumber(openingBalance)}`,
        `Operating Activities Net: ${formatNumber(totalOperating)}`,
        `Investing Activities Net: ${formatNumber(totalInvesting)}`,
        `Financing Activities Net: ${formatNumber(totalFinancing)}`,
        `Net Cash Flow: ${formatNumber(netCashFlow)}`,
        `Closing Balance: ${formatNumber(closingBalance)}`
      ]
    });
  };

  if (loading) {
    return <SkeletonLoader type="table" pageKey="reports" />;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="p-6 pb-4 shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Cash Flow Statement</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Summary of cash inflows and outflows</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="w-40">
              <DateInput
                label="From"
                value={dateRange.from}
                onChange={(val) => setDateRange(prev => ({ ...prev, from: val }))}
                compact
              />
            </div>
            <div className="w-40">
              <DateInput
                label="To"
                value={dateRange.to}
                onChange={(val) => setDateRange(prev => ({ ...prev, to: val }))}
                compact
              />
            </div>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors"
              title="Export Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Excel
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
            >
              <Printer className="w-4 h-4 text-muted-foreground" />
              {t('common.print')}
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-colors shadow-xs"
            >
              <Download className="w-4 h-4" />
              {t('common.downloadPdf')}
            </button>
            <button
              onClick={handleEmailReport}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-foreground bg-card border border-border rounded-lg hover:bg-muted transition-colors"
              title="Share via Email"
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card p-5 rounded-xl border border-border shadow-[var(--shadow-surface)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Opening Balance</span>
              <DollarSign className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(openingBalance)}</div>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border shadow-[var(--shadow-surface)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Net Cash Flow</span>
              {netCashFlow >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-rose-500" />}
            </div>
            <div className={cn("text-2xl font-bold tabular-nums", netCashFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {formatCurrency(netCashFlow)}
            </div>
          </div>
          <div className="bg-card p-5 rounded-xl border border-border shadow-[var(--shadow-surface)]">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Closing Balance</span>
              <DollarSign className="w-4 h-4 text-primary" />
            </div>
            <div className="text-2xl font-bold text-foreground tabular-nums">{formatCurrency(closingBalance)}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-5">
          {/* Operating Activities */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-surface)]">
            <div className="px-6 py-3.5 border-b border-border bg-muted/40 sticky top-0 z-10">
              <h3 className="font-semibold text-foreground uppercase tracking-wider text-xs">Cash Flow from Operating Activities</h3>
            </div>
            <div className="divide-y divide-border/60">
              {operatingActivities.length > 0 ? operatingActivities.map((item, idx) => (
                <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-muted/40 transition-colors">
                  <span className="text-sm text-foreground/85">{item.name}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", item.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No operating activities found</div>
              )}
              <div className="px-6 py-3.5 bg-muted/30 flex justify-between items-center text-sm font-bold sticky bottom-0 z-10 border-t border-border">
                <span className="text-foreground">Net Cash from Operating Activities</span>
                <span className={cn("tabular-nums", totalOperating >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {formatCurrency(totalOperating)}
                </span>
              </div>
            </div>
          </div>

          {/* Investing Activities */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-surface)]">
            <div className="px-6 py-3.5 border-b border-border bg-muted/40 sticky top-0 z-10">
              <h3 className="font-semibold text-foreground uppercase tracking-wider text-xs">Cash Flow from Investing Activities</h3>
            </div>
            <div className="divide-y divide-border/60">
              {investingActivities.length > 0 ? investingActivities.map((item, idx) => (
                <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-muted/40 transition-colors">
                  <span className="text-sm text-foreground/85">{item.name}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", item.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No investing activities found</div>
              )}
              <div className="px-6 py-3.5 bg-muted/30 flex justify-between items-center text-sm font-bold sticky bottom-0 z-10 border-t border-border">
                <span className="text-foreground">Net Cash from Investing Activities</span>
                <span className={cn("tabular-nums", totalInvesting >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {formatCurrency(totalInvesting)}
                </span>
              </div>
            </div>
          </div>

          {/* Financing Activities */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-surface)]">
            <div className="px-6 py-3.5 border-b border-border bg-muted/40 sticky top-0 z-10">
              <h3 className="font-semibold text-foreground uppercase tracking-wider text-xs">Cash Flow from Financing Activities</h3>
            </div>
            <div className="divide-y divide-border/60">
              {financingActivities.length > 0 ? financingActivities.map((item, idx) => (
                <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-muted/40 transition-colors">
                  <span className="text-sm text-foreground/85">{item.name}</span>
                  <span className={cn("text-sm font-semibold tabular-nums", item.amount >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                    {formatCurrency(item.amount)}
                  </span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-sm text-muted-foreground">No financing activities found</div>
              )}
              <div className="px-6 py-3.5 bg-muted/30 flex justify-between items-center text-sm font-bold sticky bottom-0 z-10 border-t border-border">
                <span className="text-foreground">Net Cash from Financing Activities</span>
                <span className={cn("tabular-nums", totalFinancing >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                  {formatCurrency(totalFinancing)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
