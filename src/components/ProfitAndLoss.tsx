import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printProfitAndLoss, printUtils } from '../utils/printUtils';
import { exportToCSV, exportToPDF, exportUtils } from '../utils/exportUtils';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { formatNumber, cn, ensureDate, parseEntryDate, getMovementType } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { useNavigate } from 'react-router-dom';

export function ProfitAndLoss() {
  const navigate = useNavigate();
  const { user } = useAuth();
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
      setLoading(true);
      try {
        const [ledgers, allItems, invEntries, vEntries, allVoucherEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', endDate),
          erpService.getVouchersByDateRange(user.companyId, startDate, endDate),
          erpService.getCollection('voucher_entries', user.companyId)
        ]);
        
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
          const sortedEntries = [...invEntries].sort((a, b) => {
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

        setTradingData({
          openingStock: openingStockValue,
          closingStock: closingStockValue,
          purchaseGroups: purchaseG,
          salesGroups: salesG,
          directExpenseGroups: directExpG
        });

        setPlData({
          indirectExpenseGroups: indirectExpG,
          indirectIncomeGroups: indirectIncG
        });

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

  const handlePrint = () => {
    printUtils.printElement('pl-report', 'Profit & Loss Report');
  };

  const handleDownloadPDF = () => {
    exportUtils.exportToPDF('pl-report', 'Profit_Loss_Report');
  };

  const handleDownload = () => {
    const exportData: any[] = [];
    exportData.push({ particulars: 'Opening Stock', amount: tradingData.openingStock });
    tradingData.purchaseGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: g.balance }));
    tradingData.salesGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: Math.abs(g.balance) }));
    exportData.push({ particulars: 'Closing Stock', amount: tradingData.closingStock });
    exportData.push({ particulars: 'NET PROFIT', amount: netProfit });

    exportToCSV('Profit_And_Loss', 'Profit & Loss A/c', exportData, ['Particulars', 'Amount'], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  const finalTotal = Math.max(debitTotal + (netProfit > 0 ? netProfit : 0), creditTotal + (netProfit < 0 ? Math.abs(netProfit) : 0));

  return (
    <div className="flex flex-col min-h-full bg-background transition-colors">
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
                pageId="profit_loss"
                defaultTitle={t('reports.profitAndLoss')}
                defaultSubtitle={settings.companyName}
              />
            </div>
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
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="p-2 aspect-square hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors border border-border"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-all font-medium text-sm shadow-sm active:scale-95"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div id="pl-report" className="p-4 lg:p-6 space-y-6 pb-20">
          <div className="border border-border bg-card shadow-sm rounded-lg overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border">
              {/* Left Side: Debit (Expenses) */}
              <div className="flex flex-col min-h-[400px]">
                <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.particulars')}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.amount')}</span>
                </div>
                
                <div className="flex-1 divide-y divide-border/30">
                  {/* Opening Stock */}
                  <div 
                    onClick={() => navigate(`/reports/stock?from=${startDate}&to=${endDate}`)}
                    className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                  >
                    <span className="text-sm font-medium text-foreground">{t('reports.openingStock')}</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(tradingData.openingStock)}</span>
                  </div>

                  {/* Purchase Accounts */}
                  {tradingData.purchaseGroups.map((g: any) => (
                    <div 
                      key={g.name} 
                      onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(g.balance)}</span>
                    </div>
                  ))}

                  {/* Direct Expenses */}
                  {tradingData.directExpenseGroups.map((g: any) => (
                    <div 
                      key={g.name} 
                      onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(g.balance)}</span>
                    </div>
                  ))}

                  {/* Indirect Expenses */}
                  {plData.indirectExpenseGroups.map((g: any) => (
                    <div 
                      key={g.name} 
                      onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(g.balance)}</span>
                    </div>
                  ))}

                  {/* Nett Profit */}
                  {netProfit > 0 && (
                    <div className="px-4 py-3 flex justify-between items-center bg-emerald-500/5 group hover:bg-emerald-500/10 transition-colors cursor-pointer border-l-4 border-emerald-500">
                      <span className="text-sm font-bold italic text-emerald-600">Nett Profit</span>
                      <span className="text-sm font-bold text-emerald-600 tabular-nums underline decoration-emerald-500/30 underline-offset-4">{formatNumber(netProfit)}</span>
                    </div>
                  )}
                </div>

                {/* Total Left */}
                <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-between items-center mt-auto">
                  <span className="text-sm font-black uppercase tracking-tight text-foreground">Total</span>
                  <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalTotal)}</span>
                </div>
              </div>

              {/* Right Side: Credit (Incomes) */}
              <div className="flex flex-col min-h-[400px]">
                <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.particulars')}</span>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.amount')}</span>
                </div>

                <div className="flex-1 divide-y divide-border/30">
                  {/* Sales Accounts */}
                  {tradingData.salesGroups.map((g: any) => (
                    <div 
                      key={g.name} 
                      onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(g.balance))}</span>
                    </div>
                  ))}

                  {/* Indirect Incomes */}
                  {plData.indirectIncomeGroups.map((g: any) => (
                    <div 
                      key={g.name} 
                      onClick={() => navigate(`/reports/group-summary?groupId=${g.groupId}&groupName=${encodeURIComponent(g.name)}&from=${startDate}&to=${endDate}`)}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground">{g.name}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(g.balance))}</span>
                    </div>
                  ))}

                  {/* Closing Stock */}
                  <div 
                    onClick={() => navigate(`/reports/stock?from=${startDate}&to=${endDate}`)}
                    className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                  >
                    <span className="text-sm font-medium text-foreground">Closing Stock</span>
                    <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(tradingData.closingStock)}</span>
                  </div>

                  {/* Nett Loss */}
                  {netProfit < 0 && (
                    <div className="px-4 py-3 flex justify-between items-center bg-rose-500/5 hover:bg-rose-500/10 transition-colors cursor-pointer border-l-4 border-rose-500">
                      <span className="text-sm font-bold italic text-rose-600">Nett Loss</span>
                      <span className="text-sm font-bold text-rose-600 tabular-nums underline decoration-rose-500/30 underline-offset-4">{formatNumber(Math.abs(netProfit))}</span>
                    </div>
                  )}
                </div>

                {/* Total Right */}
                <div className="px-4 py-3 border-t border-border bg-muted/20 flex justify-between items-center mt-auto">
                  <span className="text-sm font-black uppercase tracking-tight text-foreground">Total</span>
                  <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

