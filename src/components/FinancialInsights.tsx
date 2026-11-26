import React, { useState, useEffect, useMemo, useRef } from 'react';
import { TrendingUp, TrendingDown, Calendar, Download, Printer, BarChart3, CheckCircle2, Clock } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { printElement } from '../utils/printUtils';
import { exportStructuredExcel } from '../utils/exportUtils';
import { formatNumber, ensureDate, formatToYMD } from '../lib/utils';
import { resolveCompanyLegalIdentity, sanitizeAssetUrl } from '../constants/appIdentity';

interface BankReconRow {
  id: string;
  date: string;
  particulars: string;
  bankName: string;
  amount: number;
  signedAmount: number;
  isReconciled: boolean;
}

export function FinancialInsights() {
  const { user } = useAuth();
  const settings = useSettings();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [vouchersList, setVouchersList] = useState<any[]>([]);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('ALL');
  const [matchedIds, setMatchedIds] = useState<Record<string, boolean>>({});
  const [importNotice, setImportNotice] = useState<string>('');
  const [activeInsightTab, setActiveInsightTab] = useState('forecast');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const legalIdentity = useMemo(() => resolveCompanyLegalIdentity(settings), [settings]);
  const safeLogoUrl = useMemo(() => sanitizeAssetUrl(legalIdentity.companyLogo || ''), [legalIdentity.companyLogo]);

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const now = new Date();
        const sixMonthsAgo = formatToYMD(new Date(now.getFullYear(), now.getMonth() - 6, 1));

        const vouchers = await erpService.getCollection('vouchers', user.companyId);
        const filteredVouchers = (vouchers || []).filter((v: any) => {
          const vDate = v.v_date || v.date || '';
          return vDate >= sixMonthsAgo;
        });

        setVouchersList(filteredVouchers);

        const monthlyData: Record<string, { month: string; inflow: number; outflow: number }> = {};

        filteredVouchers.forEach((v: any) => {
          const parsed = ensureDate(v.v_date || v.date);
          const m = parsed.toLocaleString('default', { month: 'short', year: '2-digit' });
          if (!monthlyData[m]) monthlyData[m] = { month: m, inflow: 0, outflow: 0 };

          const amt = Number(v.total_amount) || 0;
          if (v.v_type === 'Receipt' || v.v_type === 'Sales') {
            monthlyData[m].inflow += amt;
          } else if (v.v_type === 'Payment' || v.v_type === 'Purchase') {
            monthlyData[m].outflow += amt;
          }
        });

        const chartData = Object.values(monthlyData);

        if (chartData.length > 0) {
          const avgInflow = chartData.reduce((sum, d) => sum + d.inflow, 0) / chartData.length;
          const avgOutflow = chartData.reduce((sum, d) => sum + d.outflow, 0) / chartData.length;

          const forecast = [];
          for (let i = 1; i <= 3; i++) {
            const nextDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            forecast.push({
              month: nextDate.toLocaleString('default', { month: 'short', year: '2-digit' }) + ' (F)',
              inflow: Number((avgInflow * (1 + i * 0.05)).toFixed(2)),
              outflow: Number(avgOutflow.toFixed(2)),
              isForecast: true
            });
          }
          setCashFlowData([...chartData, ...forecast]);
        } else {
          setCashFlowData([]);
        }

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currMonthVouchers = filteredVouchers.filter((v: any) => {
          const d = ensureDate(v.v_date || v.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });
        const prevMonthVouchers = filteredVouchers.filter((v: any) => {
          const d = ensureDate(v.v_date || v.date);
          return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
        });

        const compare = [
          {
            name: 'Revenue',
            current: currMonthVouchers
              .filter((v: any) => v.v_type === 'Sales')
              .reduce((sum: number, v: any) => sum + (Number(v.total_amount) || 0), 0),
            previous: prevMonthVouchers
              .filter((v: any) => v.v_type === 'Sales')
              .reduce((sum: number, v: any) => sum + (Number(v.total_amount) || 0), 0)
          },
          {
            name: 'Expenses',
            current: currMonthVouchers
              .filter((v: any) => v.v_type === 'Payment' || v.v_type === 'Purchase')
              .reduce((sum: number, v: any) => sum + (Number(v.total_amount) || 0), 0),
            previous: prevMonthVouchers
              .filter((v: any) => v.v_type === 'Payment' || v.v_type === 'Purchase')
              .reduce((sum: number, v: any) => sum + (Number(v.total_amount) || 0), 0)
          }
        ];
        setComparisonData(compare);
      } catch (err) {
        console.error('Error fetching financial insights:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId]);

  const netProfitChange = useMemo(() => {
    const rev = comparisonData.find((c) => c.name === 'Revenue');
    const exp = comparisonData.find((c) => c.name === 'Expenses');
    const currNet = (rev?.current || 0) - (exp?.current || 0);
    const prevNet = (rev?.previous || 0) - (exp?.previous || 0);
    return currNet - prevNet;
  }, [comparisonData]);

  const bankTransactions = useMemo<BankReconRow[]>(() => {
    const bankKeywords = /(bank|cheque|chq|transfer|eft|rtgs|npsb|bkash|nagad|rocket)/i;

    return vouchersList
      .filter((v: any) => {
        const vType = (v.v_type || '').toString();
        const hasBankMeta = Boolean(
          v.bank_details?.bank_name ||
            v.bank_details?.inst_no ||
            v.bank_details?.transaction_type
        );
        const textBlob = `${v.party_ledger_name || ''} ${v.particulars || ''} ${v.narration || ''} ${v.payment_mode || ''}`;
        return vType === 'Contra' || hasBankMeta || ((vType === 'Payment' || vType === 'Receipt') && bankKeywords.test(textBlob));
      })
      .map((v: any, idx: number) => {
        const id = String(v.id || `${v.v_date || v.date || 'row'}_${idx}`);
        const amount = Math.abs(Number(v.total_amount) || 0);
        const isOutflow = v.v_type === 'Payment';
        const signedAmount = isOutflow ? -amount : amount;
        const bankName = String(v.bank_details?.bank_name || v.payment_mode || '').trim();
        const particulars = String(
          v.party_ledger_name || v.particulars || v.narration || v.v_type || '-'
        ).trim();
        const defaultReconciled = Boolean(v.is_reconciled || v.reconciled);
        const isReconciled = Object.prototype.hasOwnProperty.call(matchedIds, id)
          ? matchedIds[id]
          : defaultReconciled;

        return {
          id,
          date: String(v.v_date || v.date || '-'),
          particulars,
          bankName,
          amount,
          signedAmount,
          isReconciled
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [vouchersList, matchedIds]);

  const bankAccounts = useMemo(() => {
    const unique = new Set<string>();
    bankTransactions.forEach((row) => {
      if (row.bankName) unique.add(row.bankName);
    });
    return Array.from(unique);
  }, [bankTransactions]);

  const visibleReconRows = useMemo(() => {
    if (selectedBank === 'ALL') return bankTransactions;
    return bankTransactions.filter((row) => row.bankName === selectedBank);
  }, [bankTransactions, selectedBank]);

  const reconSummary = useMemo(() => {
    const booksBalance = visibleReconRows.reduce((sum, r) => sum + r.signedAmount, 0);
    const unreconciledNet = visibleReconRows
      .filter((r) => !r.isReconciled)
      .reduce((sum, r) => sum + r.signedAmount, 0);
    const bankBalance = booksBalance - unreconciledNet;
    return {
      booksBalance,
      unreconciledAmount: Math.abs(unreconciledNet),
      bankBalance
    };
  }, [visibleReconRows]);

  const handleToggleMatch = (id: string, currentState: boolean) => {
    setMatchedIds((prev) => ({
      ...prev,
      [id]: !currentState
    }));
  };

  const handleStatementImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const lines = content
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (lines.length === 0 || visibleReconRows.length === 0) {
        setImportNotice(t('common.noData'));
        return;
      }

      let newlyMatched = 0;
      const nextMatches: Record<string, boolean> = { ...matchedIds };
      visibleReconRows.forEach((row) => {
        if (!row.isReconciled && row.amount > 0) {
          const amountStr = String(row.amount);
          const hasMatch = lines.some(
            (line) => line.includes(amountStr) && (row.date === '-' || line.includes(row.date))
          );
          if (hasMatch) {
            nextMatches[row.id] = true;
            newlyMatched += 1;
          }
        }
      });

      setMatchedIds(nextMatches);
      setImportNotice(`${newlyMatched} matched`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportExcel = () => {
    if (activeInsightTab === 'reconciliation') {
      exportStructuredExcel({
        fileName: 'bank_reconciliation_statement',
        sheetName: 'Reconciliation',
        title: t('insights.bankReconciliationStmt'),
        subtitle: selectedBank === 'ALL' ? t('common.all') : selectedBank,
        headers: [t('common.date'), t('common.particulars'), t('common.amount'), t('common.status')],
        rows: visibleReconRows.map((row) => [
          row.date,
          row.particulars,
          row.amount,
          row.isReconciled ? 'Reconciled' : 'Pending'
        ]),
        settings
      });
      return;
    }

    exportStructuredExcel({
      fileName: 'financial_insights',
      sheetName: 'CashFlow',
      title: t('insights.title'),
      subtitle: t('insights.cashFlowForecast'),
      headers: ['Month', 'Inflow', 'Outflow'],
      rows: cashFlowData.map((d) => [d.month, Number(d.inflow) || 0, Number(d.outflow) || 0]),
      settings
    });
  };

  return (
    <div id="insights-report" className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            {safeLogoUrl && (
              <div className="w-12 h-12 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                <img
                  src={safeLogoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">{t('insights.title')}</h1>
              <p className="text-[10px] text-gray-500 uppercase font-bold">{legalIdentity.companyName || settings.companyName}</p>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setActiveInsightTab('forecast')}
                  className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${activeInsightTab === 'forecast' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
                >
                  {t('insights.forecastComparison')}
                </button>
                <button
                  onClick={() => setActiveInsightTab('reconciliation')}
                  className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${activeInsightTab === 'reconciliation' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
                >
                  {t('insights.bankReconciliation')}
                </button>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end items-end">
            <button
              onClick={() => printElement('insights-report', t('insights.title'), settings)}
              className="w-full sm:w-auto px-4 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <Printer className="w-4 h-4" />
              {t('common.print')}
            </button>
            <button
              onClick={handleExportExcel}
              className="w-full sm:w-auto px-4 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <Download className="w-4 h-4" />
              {t('insights.download')} (.xlsx)
            </button>
          </div>
        </div>

        {activeInsightTab === 'forecast' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cash Flow Forecast Chart */}
            <div className="bg-card border border-border p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  {t('insights.cashFlowForecast')}
                </h2>
                <span className="text-[10px] text-gray-500 uppercase">{t('insights.next3Months')}</span>
              </div>
              <div className="h-[300px] w-full select-none">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-[10px] uppercase text-gray-500">...</div>
                ) : cashFlowData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cashFlowData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                      <XAxis dataKey="month" fontSize={10} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                      <YAxis fontSize={10} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                      <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="outflow" name="Outflow" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center border border-dashed border-border text-[10px] uppercase tracking-widest text-gray-500">
                    {t('common.noData')}
                  </div>
                )}
              </div>
              <p className="text-[9px] text-gray-500 italic leading-relaxed">
                * Forecast is based on historical moving averages with a 5% projected growth in inflows.
                Actual results may vary based on market conditions and business operations.
              </p>
            </div>

            {/* Comparison Report */}
            <div className="bg-card border border-border p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  {t('insights.periodComparison')}
                </h2>
                <span className="text-[10px] text-gray-500 uppercase">{t('insights.currentVsPrevious')}</span>
              </div>
              <div className="space-y-4">
                {comparisonData.map((item, idx) => {
                  const diff = item.current - item.previous;
                  const percent =
                    item.previous === 0
                      ? item.current === 0
                        ? 0
                        : 100
                      : (diff / item.previous) * 100;
                  const isPositive = diff >= 0;
                  const total = item.current + item.previous;
                  const barWidth = total > 0 ? Math.min(100, (item.current / total) * 100) : 0;

                  return (
                    <div key={idx} className="p-4 border border-border bg-foreground/[0.02] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-tighter">{item.name}</span>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(percent).toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">{t('insights.currentMonth')}</p>
                          <p className="text-lg font-bold font-mono">৳ {formatNumber(item.current)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">{t('insights.previousMonth')}</p>
                          <p className="text-lg font-bold font-mono text-gray-500">৳ {formatNumber(item.previous)}</p>
                        </div>
                      </div>
                      <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${item.name === 'Revenue' ? 'bg-emerald-500' : 'bg-rose-500'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">{t('insights.netProfitChange')}</span>
                  <span className={`text-sm font-bold font-mono ${netProfitChange >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {netProfitChange > 0 ? '+' : netProfitChange < 0 ? '-' : ''} ৳ {formatNumber(Math.abs(netProfitChange))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-border pb-4 gap-4">
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                {t('insights.bankReconciliationStmt')}
              </h2>
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="bg-background border border-border text-foreground px-3 py-1 text-[10px] uppercase outline-none focus:border-foreground"
                >
                  <option value="ALL">{t('common.all')}</option>
                  {bankAccounts.map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleStatementImport}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-1 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest"
                >
                  {t('insights.importStatement')}
                </button>
                {importNotice && (
                  <span className="text-[10px] text-emerald-500 uppercase font-bold">{importNotice}</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border border-border bg-foreground/5 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase">{t('insights.booksBalance')}</p>
                <p className="text-xl font-bold font-mono">
                  {reconSummary.booksBalance < 0 ? '-' : ''}৳ {formatNumber(Math.abs(reconSummary.booksBalance))}
                </p>
              </div>
              <div className="p-4 border border-border bg-foreground/5 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase">{t('insights.unreconciledAmount')}</p>
                <p className="text-xl font-bold font-mono text-rose-500">
                  ৳ {formatNumber(reconSummary.unreconciledAmount)}
                </p>
              </div>
              <div className="p-4 border border-border bg-foreground/5 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase">{t('insights.bankBalance')}</p>
                <p className="text-xl font-bold font-mono text-emerald-500">
                  {reconSummary.bankBalance < 0 ? '-' : ''}৳ {formatNumber(Math.abs(reconSummary.bankBalance))}
                </p>
              </div>
            </div>

            <div className="border border-border overflow-x-auto">
              <table className="w-full text-left text-[10px] uppercase tracking-widest">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="px-4 py-3 align-middle">{t('common.date')}</th>
                    <th className="px-4 py-3 align-middle">{t('common.particulars')}</th>
                    <th className="px-4 py-3 text-right align-middle">{t('common.amount')}</th>
                    <th className="px-4 py-3 text-center align-middle">{t('common.status')}</th>
                    <th className="px-4 py-3 text-right align-middle">{t('insights.action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visibleReconRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500 align-middle">
                        {t('common.noData')}
                      </td>
                    </tr>
                  ) : (
                    visibleReconRows.map((row) => (
                      <tr key={row.id} className="hover:bg-foreground/[0.02]">
                        <td className="px-4 py-3 text-gray-500 align-middle">{row.date}</td>
                        <td className="px-4 py-3 font-bold align-middle">
                          <div className="flex items-center gap-2">
                            <span>{row.particulars}</span>
                            {row.bankName && (
                              <span className="text-[9px] text-gray-500 font-normal">({row.bankName})</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-mono align-middle">
                          {row.signedAmount < 0 ? '-' : ''}৳ {formatNumber(row.amount)}
                        </td>
                        <td className="px-4 py-3 text-center align-middle">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold ${
                              row.isReconciled
                                ? 'bg-emerald-500/20 text-emerald-500'
                                : 'bg-amber-500/20 text-amber-500'
                            }`}
                          >
                            {row.isReconciled ? (
                              <CheckCircle2 className="w-2.5 h-2.5" />
                            ) : (
                              <Clock className="w-2.5 h-2.5" />
                            )}
                            {row.isReconciled ? 'reconciled' : 'pending'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right align-middle">
                          <button
                            type="button"
                            onClick={() => handleToggleMatch(row.id, row.isReconciled)}
                            className="text-blue-500 hover:underline font-bold uppercase"
                          >
                            {t('insights.match')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
