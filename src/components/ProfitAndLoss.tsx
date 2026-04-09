import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { printProfitAndLoss } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export function ProfitAndLoss() {
  const { user } = useAuth();
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
        const ledgers = await erpService.getLedgers(user.companyId);
        
        // Calculate closing stock based on movements up to endDate
        const [allItems, invEntries] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, endDate)
        ]);

        const itemStocks: Record<string, { qty: number, cost: number }> = {};
        
        // Initialize with opening stock if needed, or just from entries
        for (const entry of invEntries) {
          if (!itemStocks[entry.item_id]) {
            const item = allItems.find(i => i.id === entry.item_id);
            itemStocks[entry.item_id] = { qty: 0, cost: item?.avg_cost || item?.opening_rate || 0 };
          }
          const movementType = entry.movement_type || entry.m_type;
          if (movementType === 'Inward') {
            itemStocks[entry.item_id].qty += entry.qty;
          } else {
            itemStocks[entry.item_id].qty -= entry.qty;
          }
        }

        const closingStock = Object.values(itemStocks).reduce((sum, item) => sum + (item.qty * item.cost), 0);

        // Fetch voucher entries within date range for P&L
        const vEntries = await erpService.getVouchersByDateRange(user.companyId, startDate, endDate);
        // We need the entries for these vouchers
        const allVoucherEntries = await erpService.getCollection('voucher_entries', user.companyId);
        const filteredVEntries = allVoucherEntries.filter((e: any) => vEntries.some((v: any) => v.id === e.voucher_id));

        const groups: Record<string, any> = {};
        
        // Initialize groups from ledgers to ensure all groups are present
        ledgers.forEach(l => {
          const groupName = l.group_name || 'Uncategorized';
          if (!groups[groupName]) {
            groups[groupName] = {
              name: groupName,
              nature: l.nature,
              balance: 0,
              ledgers: []
            };
          }
          // We don't use current_balance here, we'll calculate from vEntries
        });

        filteredVEntries.forEach((e: any) => {
          const ledger = ledgers.find(l => l.id === e.ledger_id);
          if (ledger) {
            const groupName = ledger.group_name || 'Uncategorized';
            if (groups[groupName]) {
              groups[groupName].balance += (e.debit - e.credit);
              // Add ledger to group if not already there
              if (!groups[groupName].ledgers.find((l: any) => l.id === ledger.id)) {
                groups[groupName].ledgers.push({ ...ledger, period_balance: 0 });
              }
              const ledgerInGroup = groups[groupName].ledgers.find((l: any) => l.id === ledger.id);
              ledgerInGroup.period_balance += (e.debit - e.credit);
            }
          }
        });

        const gList = Object.values(groups).map((g: any) => ({
          ...g,
          // Use period_balance for display
          ledgers: g.ledgers.map((l: any) => ({ ...l, balance: l.period_balance }))
        }));

        setTradingData({
          openingStock: 0, // Simplified
          closingStock,
          purchaseGroups: gList.filter(g => g.name.includes('Purchase')),
          salesGroups: gList.filter(g => g.name.includes('Sales')),
          directExpenseGroups: gList.filter(g => g.name.includes('Direct Expense')),
          directIncomeGroups: gList.filter(g => g.name.includes('Direct Income'))
        });

        setPlData({
          indirectExpenseGroups: gList.filter(g => g.nature === 'Expense' && !g.name.includes('Direct')),
          indirectIncomeGroups: gList.filter(g => g.nature === 'Income' && !g.name.includes('Direct'))
        });

      } catch (err) {
        console.error('Error fetching P&L:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPL();
  }, [startDate, endDate]);

  const toggleGroup = (name: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedGroups(newSet);
  };

  const totalPurchases = tradingData.purchaseGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalSales = tradingData.salesGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalDirectExp = tradingData.directExpenseGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalDirectInc = tradingData.directIncomeGroups.reduce((s: number, g: any) => s + g.balance, 0);
  
  const grossProfit = (Math.abs(totalSales) + tradingData.closingStock + Math.abs(totalDirectInc)) - (tradingData.openingStock + Math.abs(totalPurchases) + totalDirectExp);
  
  const totalIndirectExp = plData.indirectExpenseGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const totalIndirectInc = plData.indirectIncomeGroups.reduce((s: number, g: any) => s + g.balance, 0);
  const netProfit = (grossProfit + Math.abs(totalIndirectInc)) - totalIndirectExp;

  const handlePrint = () => {
    printProfitAndLoss({
      trading: tradingData,
      pl: plData,
      grossProfit,
      netProfit
    }, settings);
  };

  const handleDownload = () => {
    const exportData: any[] = [];
    
    // Trading Account
    exportData.push({ particulars: 'TRADING ACCOUNT', amount: '' });
    exportData.push({ particulars: 'Opening Stock', amount: tradingData.openingStock });
    tradingData.purchaseGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: Math.abs(g.balance) }));
    exportData.push({ particulars: 'Sales', amount: Math.abs(totalSales) });
    exportData.push({ particulars: 'Closing Stock', amount: tradingData.closingStock });
    exportData.push({ particulars: 'GROSS PROFIT', amount: grossProfit });
    
    exportData.push({ particulars: '', amount: '' }); // Spacer
    
    // P&L Account
    exportData.push({ particulars: 'PROFIT & LOSS ACCOUNT', amount: '' });
    plData.indirectExpenseGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: g.balance }));
    plData.indirectIncomeGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: g.balance }));
    exportData.push({ particulars: 'NET PROFIT', amount: netProfit });

    exportToCSV('Profit_And_Loss', 'Profit & Loss A/c', exportData, ['Particulars', 'Amount'], settings);
  };

  const handleDownloadPDF = () => {
    const exportData: any[] = [];
    
    // Trading Account
    exportData.push({ particulars: 'TRADING ACCOUNT', amount: '' });
    exportData.push({ particulars: 'Opening Stock', amount: tradingData.openingStock });
    tradingData.purchaseGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: Math.abs(g.balance) }));
    exportData.push({ particulars: 'Sales', amount: Math.abs(totalSales) });
    exportData.push({ particulars: 'Closing Stock', amount: tradingData.closingStock });
    exportData.push({ particulars: 'GROSS PROFIT', amount: grossProfit });
    
    exportData.push({ particulars: '', amount: '' }); // Spacer
    
    // P&L Account
    exportData.push({ particulars: 'PROFIT & LOSS ACCOUNT', amount: '' });
    plData.indirectExpenseGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: g.balance }));
    plData.indirectIncomeGroups.forEach((g: any) => exportData.push({ particulars: g.name, amount: g.balance }));
    exportData.push({ particulars: 'NET PROFIT', amount: netProfit });

    exportToPDF('Profit_And_Loss', 'Profit & Loss A/c', exportData, ['Particulars', 'Amount'], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-md space-y-4">
            <div className="flex items-center gap-4">
              {(settings.companyLogo || settings.systemLogo) && (
                <div className="w-12 h-12 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                  <img 
                    src={settings.companyLogo || settings.systemLogo} 
                    alt="Logo" 
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl lg:text-2xl text-foreground uppercase tracking-tighter">Profit & Loss A/c</h1>
                <p className="text-[10px] text-gray-500 uppercase font-bold">{settings.companyName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">From</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">To</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title="Download CSV"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title="Download PDF"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        {/* Trading Account */}
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Expenses Side */}
          <div className="overflow-hidden">
            <div className="px-4 lg:px-6 py-3 bg-foreground/5 border-b border-border flex justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Particulars</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right font-bold">Amount (৳)</span>
            </div>
            <div className="min-h-[200px] lg:min-h-[300px] divide-y divide-border/50">
              <div className="px-4 lg:px-6 py-3 flex justify-between text-sm text-gray-400">
                <span>Opening Stock</span>
                <span className="font-mono">{tradingData.openingStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {tradingData.purchaseGroups.map((group: any) => (
                <div key={group.name}>
                  <div onClick={() => toggleGroup(group.name)} className="px-4 lg:px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-foreground/5 transition-colors">
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.name) ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                      <span className="text-sm text-foreground">{group.name}</span>
                    </div>
                    <span className="text-sm text-foreground font-mono">{Math.abs(group.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
              {grossProfit > 0 && (
                <div className="px-4 lg:px-6 py-4 flex justify-between text-emerald-500 font-bold border-t border-border">
                  <span className="uppercase text-[10px] tracking-widest">Gross Profit c/o</span>
                  <span className="font-mono">{grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>

          {/* Income Side */}
          <div className="overflow-hidden">
            <div className="px-4 lg:px-6 py-3 bg-foreground/5 border-b border-border flex justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Particulars</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right font-bold">Amount (৳)</span>
            </div>
            <div className="min-h-[200px] lg:min-h-[300px] divide-y divide-border/50">
              {tradingData.salesGroups.map((group: any) => (
                <div key={group.name}>
                  <div onClick={() => toggleGroup(group.name)} className="px-4 lg:px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-foreground/5 transition-colors">
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.name) ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                      <span className="text-sm text-foreground">{group.name}</span>
                    </div>
                    <span className="text-sm text-foreground font-mono">{Math.abs(group.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              ))}
              <div className="px-4 lg:px-6 py-3 flex justify-between text-sm text-gray-400">
                <span>Closing Stock</span>
                <span className="font-mono">{tradingData.closingStock.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              {grossProfit < 0 && (
                <div className="px-4 lg:px-6 py-4 flex justify-between text-rose-500 font-bold border-t border-border">
                  <span className="uppercase text-[10px] tracking-widest">Gross Loss c/o</span>
                  <span className="font-mono">{Math.abs(grossProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* P&L Account */}
        <div className="grid grid-cols-1 lg:grid-cols-2 border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border mt-6">
          <div className="divide-y divide-border/50">
            {plData.indirectExpenseGroups.map((group: any) => (
              <div key={group.name} className="px-4 lg:px-6 py-3 flex justify-between items-center">
                <span className="text-sm text-gray-400">{group.name}</span>
                <span className="text-sm text-foreground font-mono">{group.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
            {netProfit > 0 && (
              <div className="px-4 lg:px-6 py-4 flex justify-between text-emerald-500 font-bold border-t border-border">
                <span className="uppercase text-[10px] tracking-widest">Net Profit</span>
                <span className="font-mono">{netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
          <div className="divide-y divide-border/50">
            <div className="px-4 lg:px-6 py-3 flex justify-between text-sm text-gray-400">
              <span>Gross Profit b/f</span>
              <span className="font-mono">{grossProfit > 0 ? grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}</span>
            </div>
            {netProfit < 0 && (
              <div className="px-4 lg:px-6 py-4 flex justify-between text-rose-500 font-bold border-t border-border">
                <span className="uppercase text-[10px] tracking-widest">Net Loss</span>
                <span className="font-mono">{Math.abs(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

