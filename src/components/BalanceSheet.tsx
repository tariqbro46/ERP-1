import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, ChevronDown, ChevronRight } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { printBalanceSheet } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

export function BalanceSheet() {
  const { user } = useAuth();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [asOnDate, setAsOnDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });
  const [assetGroups, setAssetGroups] = useState<any[]>([]);
  const [liabilityGroups, setLiabilityGroups] = useState<any[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchBalances() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [ledgers, vEntries, items, invEntries] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, asOnDate),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, asOnDate)
        ]);

        // Calculate Closing Stock
        const itemStocks: Record<string, { qty: number, cost: number }> = {};
        for (const entry of invEntries) {
          if (!itemStocks[entry.item_id]) {
            const item = items.find(i => i.id === entry.item_id);
            itemStocks[entry.item_id] = { qty: 0, cost: item?.avg_cost || item?.opening_rate || 0 };
          }
          const movementType = entry.movement_type || entry.m_type;
          if (movementType === 'Inward') {
            itemStocks[entry.item_id].qty += entry.qty;
          } else {
            itemStocks[entry.item_id].qty -= entry.qty;
          }
        }
        const closingStockValue = Object.values(itemStocks).reduce((sum, item) => sum + (item.qty * item.cost), 0);

        // Group ledgers by their group name and calculate balances
        const groups: Record<string, any> = {};
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
          const ledgerEntries = vEntries?.filter(e => e.ledger_id === l.id) || [];
          const periodMovement = ledgerEntries.reduce((sum, e) => sum + (e.debit - e.credit), 0);
          const currentBalance = (l.opening_balance || 0) + periodMovement;

          if (currentBalance !== 0) {
            groups[groupName].balance += currentBalance;
            groups[groupName].ledgers.push({ ...l, current_balance: currentBalance });
          }
        });

        const gList = Object.values(groups);
        
        // Calculate Net Profit
        const totalSales = gList.filter(g => g.nature === 'Income' && g.name.includes('Sales')).reduce((s, g) => s + g.balance, 0);
        const totalPurchases = gList.filter(g => g.nature === 'Expense' && g.name.includes('Purchase')).reduce((s, g) => s + g.balance, 0);
        const totalDirectExp = gList.filter(g => g.nature === 'Expense' && g.name.includes('Direct')).reduce((s, g) => s + g.balance, 0);
        const totalDirectInc = gList.filter(g => g.nature === 'Income' && g.name.includes('Direct')).reduce((s, g) => s + g.balance, 0);
        
        const grossProfit = (Math.abs(totalSales) + closingStockValue + totalDirectInc) - (Math.abs(totalPurchases) + totalDirectExp);
        
        const totalIndirectExp = gList.filter(g => g.nature === 'Expense' && !g.name.includes('Direct') && !g.name.includes('Purchase')).reduce((s, g) => s + g.balance, 0);
        const totalIndirectInc = gList.filter(g => g.nature === 'Income' && !g.name.includes('Direct') && !g.name.includes('Sales')).reduce((s, g) => s + g.balance, 0);
        
        const netProfit = (grossProfit + totalIndirectInc) - totalIndirectExp;

        setAssetGroups([
          ...gList.filter(g => g.nature === 'Asset'),
          { name: 'Closing Stock', balance: closingStockValue, ledgers: [], isSystem: true }
        ]);

        setLiabilityGroups([
          ...gList.filter(g => g.nature === 'Liability'),
          { name: 'Profit & Loss A/c', balance: -netProfit, ledgers: [], isSystem: true }
        ]);

      } catch (err) {
        console.error('Error fetching balance sheet:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBalances();
  }, [asOnDate]);

  const toggleGroup = (name: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedGroups(newSet);
  };

  const totalAssets = assetGroups.reduce((sum, g) => sum + g.balance, 0);
  const totalLiabilities = liabilityGroups.reduce((sum, g) => sum + g.balance, 0);

  const handlePrint = () => {
    printBalanceSheet({
      assets: assetGroups,
      liabilities: liabilityGroups,
      totalAssets: Math.abs(totalAssets),
      totalLiabilities: Math.abs(totalLiabilities),
      closingStock: 0, // Need to fetch this if needed
      netProfit: 0 // Need to fetch this if needed
    }, settings);
  };

  const handleDownload = () => {
    const exportData: any[] = [];
    
    // Add Liabilities
    exportData.push({ particulars: 'LIABILITIES', amount: '' });
    liabilityGroups.forEach(g => {
      exportData.push({ particulars: g.name, amount: Math.abs(g.balance) });
    });
    exportData.push({ particulars: 'TOTAL LIABILITIES', amount: Math.abs(totalLiabilities) });
    
    exportData.push({ particulars: '', amount: '' }); // Spacer
    
    // Add Assets
    exportData.push({ particulars: 'ASSETS', amount: '' });
    assetGroups.forEach(g => {
      exportData.push({ particulars: g.name, amount: Math.abs(g.balance) });
    });
    exportData.push({ particulars: 'TOTAL ASSETS', amount: Math.abs(totalAssets) });

    exportToCSV('Balance_Sheet', 'Balance Sheet', exportData, ['Particulars', 'Amount'], settings);
  };

  const handleDownloadPDF = () => {
    const exportData: any[] = [];
    
    // Add Liabilities
    exportData.push({ particulars: 'LIABILITIES', amount: '' });
    liabilityGroups.forEach(g => {
      exportData.push({ particulars: g.name, amount: Math.abs(g.balance) });
    });
    exportData.push({ particulars: 'TOTAL LIABILITIES', amount: Math.abs(totalLiabilities) });
    
    exportData.push({ particulars: '', amount: '' }); // Spacer
    
    // Add Assets
    exportData.push({ particulars: 'ASSETS', amount: '' });
    assetGroups.forEach(g => {
      exportData.push({ particulars: g.name, amount: Math.abs(g.balance) });
    });
    exportData.push({ particulars: 'TOTAL ASSETS', amount: Math.abs(totalAssets) });

    exportToPDF('Balance_Sheet', 'Balance Sheet', exportData, ['Particulars', 'Amount'], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const displayDate = new Date(asOnDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-md space-y-4">
            <h1 className="text-xl lg:text-2xl text-foreground uppercase tracking-tighter">Balance Sheet</h1>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">As on Date</label>
                <input 
                  type="date" 
                  value={asOnDate} 
                  onChange={(e) => setAsOnDate(e.target.value)}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border">
          {/* Liabilities Side */}
          <div className="overflow-hidden">
            <div className="px-4 lg:px-6 py-3 bg-foreground/5 border-b border-border flex justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Liabilities</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right font-bold">Amount (৳)</span>
            </div>
            <div className="min-h-[300px] lg:min-h-[500px] divide-y divide-border/50">
              {liabilityGroups.map(group => (
                <div key={group.name} className="group">
                  <div 
                    onClick={() => toggleGroup(group.name)}
                    className="px-4 lg:px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-foreground/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.name) ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                      <span className="text-sm text-foreground font-medium">{group.name}</span>
                    </div>
                    <span className="text-sm text-foreground font-mono">{Math.abs(group.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {expandedGroups.has(group.name) && (
                    <div className="bg-foreground/[0.02] px-8 lg:px-12 py-2 space-y-2">
                      {group.ledgers.map((l: any) => (
                        <div key={l.id} className="flex justify-between text-[11px] text-gray-500">
                          <span>{l.name}</span>
                          <span className="font-mono">{Math.abs(l.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 lg:px-6 py-4 bg-foreground/5 border-t border-border flex justify-between font-bold text-foreground">
              <span className="uppercase text-[10px] tracking-widest">Total Liabilities</span>
              <span className="font-mono">৳ {Math.abs(totalLiabilities).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Assets Side */}
          <div className="overflow-hidden">
            <div className="px-4 lg:px-6 py-3 bg-foreground/5 border-b border-border flex justify-between">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Assets</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right font-bold">Amount (৳)</span>
            </div>
            <div className="min-h-[300px] lg:min-h-[500px] divide-y divide-border/50">
              {assetGroups.map(group => (
                <div key={group.name} className="group">
                  <div 
                    onClick={() => toggleGroup(group.name)}
                    className="px-4 lg:px-6 py-3 flex justify-between items-center cursor-pointer hover:bg-foreground/5 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups.has(group.name) ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                      <span className="text-sm text-foreground font-medium">{group.name}</span>
                    </div>
                    <span className="text-sm text-foreground font-mono">{Math.abs(group.balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {expandedGroups.has(group.name) && (
                    <div className="bg-foreground/[0.02] px-8 lg:px-12 py-2 space-y-2">
                      {group.ledgers.map((l: any) => (
                        <div key={l.id} className="flex justify-between text-[11px] text-gray-500">
                          <span>{l.name}</span>
                          <span className="font-mono">{Math.abs(l.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="px-4 lg:px-6 py-4 bg-foreground/5 border-t border-border flex justify-between font-bold text-foreground">
              <span className="uppercase text-[10px] tracking-widest">Total Assets</span>
              <span className="font-mono">৳ {Math.abs(totalAssets).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Difference Check */}
        {Math.abs(totalAssets - Math.abs(totalLiabilities)) > 0.01 && (
          <div className="bg-rose-950/30 border border-rose-900/50 p-4 flex justify-between items-center">
            <span className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">Difference in Opening Balances</span>
            <span className="text-sm text-rose-400 font-mono font-bold">৳ {Math.abs(totalAssets - Math.abs(totalLiabilities)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

