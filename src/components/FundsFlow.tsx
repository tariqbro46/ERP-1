import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileSpreadsheet, Mail, PlusCircle, MinusCircle, Wallet } from 'lucide-react';
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

export function FundsFlow() {
  const { user, company } = useAuth();
  const settings = useSettings();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  const [sources, setSources] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [workingCapitalChange, setWorkingCapitalChange] = useState(0);

  const effectiveFrom = dateRange.from <= dateRange.to ? dateRange.from : dateRange.to;
  const effectiveTo = dateRange.from <= dateRange.to ? dateRange.to : dateRange.from;

  useEffect(() => {
    async function fetchFundsFlow() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [ledgers, vEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, effectiveTo)
        ]);

        const fromDate = parseEntryDate(effectiveFrom, null);
        const toDate = parseEntryDate(effectiveTo, null);
        toDate.setHours(23, 59, 59, 999);

        const ledgerMap = new Map<string, any>();
        ledgers.forEach(l => ledgerMap.set(l.id, l));

        const periodEntries = (vEntries || []).filter((entry: any) => {
          const entryDate = parseEntryDate(entry.v_date || entry.date, entry.createdAt);
          return entryDate >= fromDate && entryDate <= toDate;
        });

        const sourceItems: any[] = [];
        const applicationItems: any[] = [];

        // Analyze movements in non-current accounts
        const nonCurrentGroups = ['Fixed Assets', 'Investments', 'Capital Account', 'Loans (Liability)'];
        const nonCurrentIds = new Set(
          ledgers
            .filter(l => nonCurrentGroups.some(g => l.group_name?.includes(g)))
            .map(l => l.id)
        );

        let income = 0;
        let expense = 0;

        periodEntries.forEach((entry: any) => {
          const ledger = ledgerMap.get(entry.ledger_id);
          if (!ledger) return;
          const debit = Number(entry.debit) || 0;
          const credit = Number(entry.credit) || 0;

          if (nonCurrentIds.has(entry.ledger_id)) {
            const amount = credit - debit; // Credit is source, Debit is application
            if (amount > 0) {
              sourceItems.push({ name: ledger.name, amount });
            } else if (amount < 0) {
              applicationItems.push({ name: ledger.name, amount: Math.abs(amount) });
            }
          }

          if (ledger.nature === 'Income') {
            income += credit - debit;
          } else if (ledger.nature === 'Expense') {
            expense += debit - credit;
          }
        });

        const fundsFromOps = income - expense;
        if (fundsFromOps > 0) {
          sourceItems.push({ name: 'Funds from Operations', amount: fundsFromOps });
        } else if (fundsFromOps < 0) {
          applicationItems.push({ name: 'Loss from Operations', amount: Math.abs(fundsFromOps) });
        }

        const groupItems = (items: any[]) => {
          const grouped: Record<string, number> = {};
          items.forEach(item => {
            grouped[item.name] = (grouped[item.name] || 0) + item.amount;
          });
          return Object.entries(grouped)
            .filter(([, amount]) => Math.abs(amount) >= 0.005)
            .map(([name, amount]) => ({ name, amount }));
        };

        const finalSources = groupItems(sourceItems);
        const finalApps = groupItems(applicationItems);

        setSources(finalSources);
        setApplications(finalApps);

        const totalSrc = finalSources.reduce((sum, i) => sum + i.amount, 0);
        const totalApp = finalApps.reduce((sum, i) => sum + i.amount, 0);
        setWorkingCapitalChange(totalSrc - totalApp);
      } catch (err) {
        console.error('Error fetching funds flow:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFundsFlow();
  }, [user?.companyId, effectiveFrom, effectiveTo]);

  const totalSources = sources.reduce((sum, item) => sum + item.amount, 0);
  const totalApplications = applications.reduce((sum, item) => sum + item.amount, 0);
  const periodSubtitle = `Period: ${formatReportDate(effectiveFrom, settings.dateFormat)} to ${formatReportDate(effectiveTo, settings.dateFormat)}`;

  const buildFundsFlowHtml = () => {
    const wcLabel = workingCapitalChange >= 0
      ? `Increase of ${formatCurrency(Math.abs(workingCapitalChange))}`
      : `Decrease of ${formatCurrency(Math.abs(workingCapitalChange))}`;

    return buildReportPrintHtml({
      title: 'Funds Flow Statement',
      subtitle: periodSubtitle,
      settings,
      company,
      summaryCards: [
        { label: 'Total Sources', value: formatCurrency(totalSources) },
        { label: 'Total Applications', value: formatCurrency(totalApplications) },
        { label: 'Net Change in Working Capital', value: wcLabel }
      ],
      sections: [
        {
          heading: 'Sources of Funds',
          columns: [
            { label: 'Particulars', width: '72%' },
            { label: 'Amount', align: 'right', width: '28%' }
          ],
          rows: [
            ...sources.map(item => ({ cells: [item.name, formatCurrency(item.amount)], tone: 'positive' as const })),
            { cells: ['Total Sources', formatCurrency(totalSources)], isTotal: true, tone: 'positive' as const }
          ],
          emptyMessage: 'No sources found'
        },
        {
          heading: 'Applications of Funds',
          columns: [
            { label: 'Particulars', width: '72%' },
            { label: 'Amount', align: 'right', width: '28%' }
          ],
          rows: [
            ...applications.map(item => ({ cells: [item.name, formatCurrency(item.amount)], tone: 'negative' as const })),
            { cells: ['Total Applications', formatCurrency(totalApplications)], isTotal: true, tone: 'negative' as const }
          ],
          emptyMessage: 'No applications found'
        }
      ],
      note: 'This represents the net change in current assets and current liabilities during the selected period.'
    });
  };

  const handlePrint = () => {
    executePrint(buildFundsFlowHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: 'Funds Flow Statement',
      subtitle: periodSubtitle,
      fileName: `Funds_Flow_${effectiveFrom}_to_${effectiveTo}`,
      htmlContent: buildFundsFlowHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    const rows: Record<string, any>[] = [
      ...sources.map(item => ({ category: 'Sources of Funds', particulars: item.name, amount: Number(item.amount.toFixed(2)) })),
      { category: 'Sources of Funds', particulars: 'Total Sources', amount: Number(totalSources.toFixed(2)) },
      ...applications.map(item => ({ category: 'Applications of Funds', particulars: item.name, amount: Number(item.amount.toFixed(2)) })),
      { category: 'Applications of Funds', particulars: 'Total Applications', amount: Number(totalApplications.toFixed(2)) }
    ];

    exportStructuredExcel({
      fileName: `Funds_Flow_${effectiveFrom}_to_${effectiveTo}`,
      sheetName: 'Funds Flow',
      title: 'Funds Flow Statement',
      subtitle: periodSubtitle,
      headers: ['Category', 'Particulars', 'Amount'],
      rows,
      footerRow: {
        category: 'Summary',
        particulars: workingCapitalChange >= 0 ? 'Net Increase in Working Capital' : 'Net Decrease in Working Capital',
        amount: Number(workingCapitalChange.toFixed(2))
      },
      settings,
      company
    });
  };

  const handleEmailReport = () => {
    shareReportViaEmail({
      title: 'Funds Flow Statement',
      subtitle: periodSubtitle,
      settings,
      company,
      summaryLines: [
        `Total Sources of Funds: ${formatNumber(totalSources)}`,
        `Total Applications of Funds: ${formatNumber(totalApplications)}`,
        `Net Change in Working Capital: ${workingCapitalChange >= 0 ? 'Increase of ' : 'Decrease of '}${formatNumber(Math.abs(workingCapitalChange))}`
      ]
    });
  };

  if (loading) {
    return <SkeletonLoader type="table" pageKey="reports" />;
  }

  return (
    <div className="h-full flex flex-col bg-background transition-colors overflow-hidden">
      <div className="flex-none bg-card/90 backdrop-blur-sm border-b border-border shadow-xs px-4 lg:px-6 py-4 z-30">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Funds Flow Statement</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Analysis of changes in financial position</p>
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-36">
              <DateInput
                label="From"
                value={dateRange.from}
                onChange={(val) => setDateRange(prev => ({ ...prev, from: val }))}
                compact
              />
            </div>
            <div className="w-36">
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
            >
              <Mail className="w-4 h-4 text-muted-foreground" />
              Email
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Sources of Funds */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-surface)]">
            <div className="px-6 py-3.5 border-b border-border bg-blue-500/10 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm">
              <PlusCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-xs">Sources of Funds</h3>
            </div>
            <div className="divide-y divide-border/60">
              {sources.length > 0 ? sources.map((item, idx) => (
                <div key={idx} className="px-6 py-3.5 flex justify-between items-center hover:bg-muted/40 transition-colors">
                  <span className="text-foreground/85 text-sm">{item.name}</span>
                  <span className="font-semibold text-foreground text-sm tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No sources found</div>
              )}
              <div className="px-6 py-3.5 bg-blue-500/10 flex justify-between items-center font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wider text-xs sticky bottom-0 border-t border-blue-500/20">
                <span>Total Sources</span>
                <span className="text-sm tabular-nums">{formatCurrency(totalSources)}</span>
              </div>
            </div>
          </div>

          {/* Applications of Funds */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-[var(--shadow-surface)]">
            <div className="px-6 py-3.5 border-b border-border bg-rose-500/10 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm">
              <MinusCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-xs">Applications of Funds</h3>
            </div>
            <div className="divide-y divide-border/60">
              {applications.length > 0 ? applications.map((item, idx) => (
                <div key={idx} className="px-6 py-3.5 flex justify-between items-center hover:bg-muted/40 transition-colors">
                  <span className="text-foreground/85 text-sm">{item.name}</span>
                  <span className="font-semibold text-foreground text-sm tabular-nums">{formatCurrency(item.amount)}</span>
                </div>
              )) : (
                <div className="px-6 py-8 text-center text-muted-foreground text-sm">No applications found</div>
              )}
              <div className="px-6 py-3.5 bg-rose-500/10 flex justify-between items-center font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider text-xs sticky bottom-0 border-t border-rose-500/20">
                <span>Total Applications</span>
                <span className="text-sm tabular-nums">{formatCurrency(totalApplications)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-card p-6 rounded-xl border border-border shadow-[var(--shadow-surface)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3.5 rounded-xl",
              workingCapitalChange >= 0 ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
            )}>
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Change in Working Capital</h4>
              <p className={cn(
                "text-2xl font-bold tabular-nums tracking-tight mt-0.5",
                workingCapitalChange >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {workingCapitalChange >= 0 ? 'Increase of ' : 'Decrease of '}
                {formatCurrency(Math.abs(workingCapitalChange))}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground max-w-xs sm:text-right leading-relaxed">
            Represents the net change in current assets and current liabilities during the selected period.
          </div>
        </div>
      </div>
    </div>
  );
}
