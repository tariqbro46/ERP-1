import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, ChevronDown, ChevronRight, ArrowLeft } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printBalanceSheet, printUtils } from '../utils/printUtils';
import { exportToCSV, exportToPDF, exportUtils } from '../utils/exportUtils';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
import { useNavigate } from 'react-router-dom';

export function BalanceSheet() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
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
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', asOnDate)
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
          { name: t('reports.closingStock'), balance: closingStockValue, ledgers: [], isSystem: true }
        ].sort((a, b) => a.name.localeCompare(b.name)));

        setLiabilityGroups([
          ...gList.filter(g => g.nature === 'Liability'),
          { name: t('reports.profitAndLoss'), balance: -netProfit, ledgers: [], isSystem: true }
        ].sort((a, b) => a.name.localeCompare(b.name)));

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
    printUtils.printElement('balance-sheet-report', 'Balance Sheet Report');
  };

  const handleDownloadPDF = () => {
    exportUtils.exportToPDF('balance-sheet-report', 'Balance_Sheet_Report');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
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
                pageId="balance_sheet"
                defaultTitle={t('reports.balanceSheet')}
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
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title={t('common.downloadPdf')}
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title={t('common.downloadPdf')}
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6 space-y-6">
          <div id="balance-sheet-report" className="grid grid-cols-1 lg:grid-cols-2 border border-border bg-card divide-y lg:divide-y-0 lg:divide-x divide-border relative">
            {/* Liabilities Side */}
            <div className="relative">
              <div className="sticky top-0 z-10 px-4 lg:px-6 py-3 bg-foreground/5 border-b border-border flex justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('reports.liabilities')}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right font-bold">{t('common.amount')} (৳)</span>
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
                      <span className="text-sm text-foreground font-mono">{formatNumber(Math.abs(group.balance))}</span>
                    </div>
                    {expandedGroups.has(group.name) && (
                      <div className="bg-foreground/[0.02] px-8 lg:px-12 py-2 space-y-2">
                        {group.ledgers.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((l: any) => (
                          <div 
                            key={l.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reports/ledger?ledgerId=${l.id}`);
                            }}
                            className="flex justify-between text-[11px] text-gray-500 hover:text-foreground cursor-pointer transition-colors"
                          >
                            <span>{l.name}</span>
                            <span className="font-mono">{formatNumber(Math.abs(l.current_balance))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 lg:px-6 py-4 bg-foreground/5 border-t border-border flex justify-between font-bold text-foreground">
                <span className="uppercase text-[10px] tracking-widest">{t('reports.totalLiabilities')}</span>
                <span className="font-mono">৳ {formatNumber(Math.abs(totalLiabilities))}</span>
              </div>
            </div>

            {/* Assets Side */}
            <div className="relative">
              <div className="sticky top-0 z-10 px-4 lg:px-6 py-3 bg-foreground/5 border-b border-border flex justify-between">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{t('reports.assets')}</span>
                <span className="text-[10px] text-gray-500 uppercase tracking-widest text-right font-bold">{t('common.amount')} (৳)</span>
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
                      <span className="text-sm text-foreground font-mono">{formatNumber(Math.abs(group.balance))}</span>
                    </div>
                    {expandedGroups.has(group.name) && (
                      <div className="bg-foreground/[0.02] px-8 lg:px-12 py-2 space-y-2">
                        {group.ledgers.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((l: any) => (
                          <div 
                            key={l.id} 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reports/ledger?ledgerId=${l.id}`);
                            }}
                            className="flex justify-between text-[11px] text-gray-500 hover:text-foreground cursor-pointer transition-colors"
                          >
                            <span>{l.name}</span>
                            <span className="font-mono">{formatNumber(Math.abs(l.current_balance))}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="px-4 lg:px-6 py-4 bg-foreground/5 border-t border-border flex justify-between font-bold text-foreground">
                <span className="uppercase text-[10px] tracking-widest">{t('reports.totalAssets')}</span>
                <span className="font-mono">৳ {formatNumber(Math.abs(totalAssets))}</span>
              </div>
            </div>
          </div>

          {/* Difference Check */}
          {Math.abs(totalAssets - Math.abs(totalLiabilities)) > 0.01 && (
            <div className="bg-rose-950/30 border border-rose-900/50 p-4 flex justify-between items-center">
              <span className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">{t('reports.differenceInOpening')}</span>
              <span className="text-sm text-rose-400 font-mono font-bold">৳ {formatNumber(Math.abs(totalAssets - Math.abs(totalLiabilities)))}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

