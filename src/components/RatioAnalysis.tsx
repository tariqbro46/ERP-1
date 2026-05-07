import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Scale, Package, Loader2, Download, Printer, ArrowLeft, Info, BarChart2, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn, formatNumber } from '../lib/utils';
import { printUtils } from '../utils/printUtils';
import { exportToCSV } from '../utils/exportUtils';
import { DateInput } from './DateInput';
import { EditableHeader } from './EditableHeader';

export function RatioAnalysis() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
        const [ledgers, vEntries, items, invEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, asOnDate),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', asOnDate)
        ]);

        // 1. Calculate Ledger Balances
        const ledgerBalances: Record<string, number> = {};
        ledgers.forEach(l => {
          const entries = vEntries?.filter(e => e.ledger_id === l.id) || [];
          const movement = entries.reduce((s, e) => s + (Number(e.debit) || 0) - (Number(e.credit) || 0), 0);
          ledgerBalances[l.id] = (Number(l.opening_balance) || 0) + movement;
        });

        // 2. Calculate Closing Stock
        const itemStocks: Record<string, number> = {};
        invEntries.forEach(entry => {
          const qty = (Number(entry.qty) || 0) + (Number(entry.free_qty) || 0);
          const type = (entry.movement_type || entry.m_type || '').toLowerCase();
          itemStocks[entry.item_id] = (itemStocks[entry.item_id] || 0) + (type === 'inward' ? qty : -qty);
        });
        const closingStockValue = Object.entries(itemStocks).reduce((sum, [id, qty]) => {
          const item = items.find(i => i.id === id);
          const cost = item?.avg_cost || item?.opening_rate || 0;
          return sum + (qty * (cost || 0));
        }, 0);

        // 3. Group and Calculate Totals
        const getGroupTotal = (groupMatches: string[]) => {
          return ledgers
            .filter(l => groupMatches.some(m => l.group_name?.toLowerCase().includes(m.toLowerCase())))
            .reduce((sum, l) => sum + (ledgerBalances[l.id] || 0), 0);
        };

        const currentAssetsVal = getGroupTotal(['current assets', 'bank accounts', 'cash-in-hand', 'sundry debtors', 'loans & advances (asset)', 'deposits (asset)']) + closingStockValue;
        const currentLiabilitiesVal = Math.abs(getGroupTotal(['current liabilities', 'sundry creditors', 'duties & taxes', 'provisions']));
        const workingCapital = currentAssetsVal - currentLiabilitiesVal;
        
        const cashInHand = getGroupTotal(['cash-in-hand']);
        const bankAccounts = getGroupTotal(['bank accounts']);
        const bankOD = Math.abs(getGroupTotal(['bank od a/c']));
        const debtors = getGroupTotal(['sundry debtors']);
        const creditors = Math.abs(getGroupTotal(['sundry creditors']));
        const salesVal = Math.abs(getGroupTotal(['sales accounts', 'direct income']));
        const purchaseVal = getGroupTotal(['purchase accounts', 'direct expense']);

        // Profit Logic
        const incomeL = ledgers.filter(l => l.nature === 'Income');
        const expenseL = ledgers.filter(l => l.nature === 'Expense');
        const totalIncome = incomeL.reduce((sum, l) => sum + Math.abs(ledgerBalances[l.id]), 0);
        const totalExpense = expenseL.reduce((sum, l) => sum + ledgerBalances[l.id], 0);
        const netProfit = (totalIncome + closingStockValue) - totalExpense;
        
        const capitalAcc = Math.abs(getGroupTotal(['capital account', 'reserves']));
        const loansLiability = Math.abs(getGroupTotal(['loans (liability)']));

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
            { name: 'Wkg. Capital Turnover', value: workingCapital !== 0 ? Math.abs(salesVal / workingCapital) : 0, formula: '(Sales Accounts / Working Capital)', isRatio: true },
            { name: 'Inventory Turnover', value: closingStockValue !== 0 ? Math.abs(salesVal / closingStockValue) : 0, formula: '(Sales Accounts / Closing Stock)', isRatio: true },
          ],
          ratios: [
            { name: 'Current Ratio', value: currentLiabilitiesVal !== 0 ? (currentAssetsVal / currentLiabilitiesVal) : 0, formula: '(Current Assets : Current Liabilities)', type: 'ratio' },
            { name: 'Quick Ratio', value: currentLiabilitiesVal !== 0 ? ((currentAssetsVal - closingStockValue) / currentLiabilitiesVal) : 0, formula: '(Current Assets-Stock-in-Hand : Current Liabilities)', type: 'ratio' },
            { name: 'Debt/Equity Ratio', value: (capitalAcc + netProfit) !== 0 ? (loansLiability / (capitalAcc + netProfit)) : 0, formula: '(Loans (Liability) : Capital Account + Nett Profit)', type: 'ratio' },
            { name: 'Gross Profit %', value: salesVal !== 0 ? ((netProfit / salesVal) * 100) : 0, type: 'percent' }, 
            { name: 'Nett Profit %', value: salesVal !== 0 ? ((netProfit / salesVal) * 100) : 0, type: 'percent' },
            { name: 'Operating Cost %', value: salesVal !== 0 ? ((totalExpense / salesVal) * 100) : 0, formula: '(as percentage of Sales Accounts)', type: 'percent' },
            { name: 'Recv. Turnover in days', value: (salesVal !== 0 && debtors !== 0) ? (debtors / (salesVal / 365)) : 0, formula: '(payment performance of Debtors)', type: 'days' },
            { name: 'Return on Investment %', value: (capitalAcc + netProfit) !== 0 ? (netProfit / (capitalAcc + netProfit) * 100) : 0, formula: '(Nett Profit / Capital Account + Nett Profit )', type: 'percent' },
            { name: 'Return on Wkg. Capital %', value: workingCapital !== 0 ? (netProfit / workingCapital * 100) : 0, formula: '(Nett Profit / Working Capital) %', type: 'percent' },
          ]
        });
      } catch (err) {
        console.error('Ratio analysis error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalysisData();
  }, [user?.companyId, asOnDate]);

  const handlePrint = () => {
    printUtils.printElement('ratio-analysis-report', 'Ratio Analysis Report');
  };

  const handleDownloadCSV = () => {
    const exportData: any[] = [];
    exportData.push({ type: 'GROUP', name: 'PRINCIPAL GROUPS', value: '' });
    data?.groups.forEach((g: any) => exportData.push({ type: 'GROUP', name: g.name, value: g.value }));
    exportData.push({ type: 'RATIO', name: 'PRINCIPAL RATIOS', value: '' });
    data?.ratios.forEach((r: any) => exportData.push({ type: 'RATIO', name: r.name, value: r.value }));
    exportToCSV('Ratio_Analysis', 'Ratio Analysis', exportData, ['Type', 'Particulars', 'Value'], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const renderGroups = () => (
    <div className="flex flex-col">
      <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Principal Groups :</span>
      </div>
      <div className="flex-1 divide-y divide-border/30">
        {data.groups.map((group: any) => (
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
                <span className="text-[13px] font-bold text-foreground font-mono tracking-tighter">
                  {group.isRatio ? group.value.toFixed(2) : formatNumber(Math.abs(group.value))}
                </span>
                {!group.isRatio && (
                  <span className="text-[11px] font-bold text-muted-foreground min-w-[20px]">
                    {group.value >= 0 ? 'Dr' : 'Cr'}
                  </span>
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
        {data.ratios.map((ratio: any) => (
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
              <span className="text-[13px] font-bold text-foreground font-mono">
                {ratio.type === 'ratio' ? `${ratio.value.toFixed(2)} : 1` : 
                 ratio.type === 'percent' ? `${ratio.value.toFixed(2)} %` : 
                 `${ratio.value.toFixed(2)} days`}
              </span>
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
          <div className="flex-1 w-full sm:max-w-md space-y-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-foreground" />
              </button>
              <EditableHeader 
                pageId="ratio_analysis"
                defaultTitle="Ratio Analysis"
                defaultSubtitle={settings.companyName}
              />
            </div>
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
          <div className="flex gap-3 w-full sm:w-auto">
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
              onClick={handlePrint}
              className="p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
             <button 
              onClick={handleDownloadCSV}
              className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
            >
              <Download className="w-3 h-3" /> CSV
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

