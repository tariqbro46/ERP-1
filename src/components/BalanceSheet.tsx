import React, { useState, useEffect } from 'react';
import { Loader2, Printer, Download, ChevronDown, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber, parseEntryDate, getMovementType } from '../lib/utils';
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
  const [openingBalanceDiff, setOpeningBalanceDiff] = useState(0);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function fetchBalances() {
      if (!user?.companyId) return;
      
      const cached = erpService.getCachedData(`balancesheet_${asOnDate}`, user.companyId);
      if (cached) {
        setAssetGroups(cached.assetsFinal || []);
        setLiabilityGroups(cached.liabilitiesFinal || []);
        setOpeningBalanceDiff(cached.openingDiff || 0);
        setLoading(false);
      } else {
        setLoading(true);
      }

      try {
        const [ledgers, vEntries, items, invEntries, groupsData, allVouchers] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getVoucherEntriesByDate(user.companyId, asOnDate),
          erpService.getItems(user.companyId),
          erpService.getInventoryEntriesByDate(user.companyId, '1900-01-01', asOnDate),
          erpService.getLedgerGroups(user.companyId),
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

        // 1. Calculate Closing Stock
        const itemStocks: Record<string, number> = {};
        const costMap: Record<string, number> = {};
        
        items.forEach(i => {
           itemStocks[i.id] = Number(i.opening_qty) || 0;
           costMap[i.id] = i.avg_cost || i.opening_rate || 0;
        });

        const sortedInv = [...enrichedInv].sort((a, b) => {
          const da = parseEntryDate(a.date, a.created_at);
          const db = parseEntryDate(b.date, b.created_at);
          if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
          return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
        });

        for (const entry of sortedInv) {
          if (!itemStocks[entry.item_id] && itemStocks[entry.item_id] !== 0) {
             const itm = items.find(i => i.id === entry.item_id);
             itemStocks[entry.item_id] = Number(itm?.opening_qty) || 0;
             costMap[entry.item_id] = itm?.avg_cost || itm?.opening_rate || 0;
          }
          const mType = getMovementType(entry);
          const qty = (Number(entry.qty) || 0) + (Number(entry.free_qty) || 0);
          const isPhysical = (entry.v_type || '').toLowerCase() === 'physical stock' || !!entry.is_physical_snapshot;

          if (isPhysical) {
             // Basic implementation matching erpService
             itemStocks[entry.item_id] = (Number(entry.qty) || 0);
          } else if (mType === 'inward') {
            itemStocks[entry.item_id] = (Number(itemStocks[entry.item_id]) || 0) + qty;
          } else {
            itemStocks[entry.item_id] = (Number(itemStocks[entry.item_id]) || 0) - qty;
          }
        }
        const closingStockValue = Object.keys(itemStocks).reduce((sum, id) => {
           const val = itemStocks[id] * (costMap[id] || 0);
           return sum + (val > 0 ? val : 0);
        }, 0);

        // 2. Calculate Individual Ledger Balances
        const ledgerBalances: Record<string, number> = {};
        ledgers.forEach(l => {
          const ledgerEntries = vEntries?.filter(e => e.ledger_id === l.id) || [];
          const periodMovement = ledgerEntries.reduce((sum, e) => sum + (Number(e.debit) || 0) - (Number(e.credit) || 0), 0);
          ledgerBalances[l.id] = (Number(l.opening_balance) || 0) + periodMovement;
        });

        // 3. Define Standard Report Hierarchy and categorization logic
        const catMap = {
          'Capital Account': ['Capital Account', 'Reserves & Surplus'],
          'Loans (Liability)': ['Loans (Liability)', 'Secured Loans', 'Unsecured Loans'],
          'Current Liabilities': ['Current Liabilities', 'Sundry Creditors', 'Duties & Taxes', 'Provisions'],
          'Fixed Assets': ['Fixed Assets'],
          'Investments': ['Investments'],
          'Current Assets': ['Current Assets', 'Bank Accounts', 'Cash-in-hand', 'Sundry Debtors', 'Loans & Advances (Asset)', 'Stock-in-hand', 'Deposits (Asset)']
        };

        const getCategory = (l: any) => {
          const gName = (l.group_name || '').toLowerCase();
          for (const [cat, matches] of Object.entries(catMap)) {
            if (matches.some(m => gName.includes(m.toLowerCase()))) return cat;
          }
          return l.nature === 'Asset' ? 'Current Assets' : 'Current Liabilities';
        };

        // 4. Group data by Categories
        const categories: Record<string, any> = {};
        ledgers.forEach(l => {
          const cat = getCategory(l);
          if (!categories[cat]) {
            categories[cat] = { name: cat, total: 0, groups: {} };
          }
          
          const balance = ledgerBalances[l.id] || 0;
          if (balance === 0) return;

          const gName = l.group_name || 'Others';
          if (!categories[cat].groups[gName]) {
            categories[cat].groups[gName] = { name: gName, balance: 0, groupId: l.group_id };
          }
          categories[cat].groups[gName].balance += balance;
          categories[cat].total += balance;
        });

        // 5. Special Sections (P&L, Stock)
        const incomeL = ledgers.filter(l => l.nature === 'Income');
        const expenseL = ledgers.filter(l => l.nature === 'Expense');
        const totalIncome = incomeL.reduce((sum, l) => sum + Math.abs(ledgerBalances[l.id]), 0);
        const totalExpense = expenseL.reduce((sum, l) => sum + ledgerBalances[l.id], 0);
        
        const plLedger = ledgers.find(l => l.name.toLowerCase().includes('profit & loss') || l.name.toLowerCase().includes('p & l'));
        const plOpeningBalance = plLedger ? (Number(plLedger.opening_balance) || 0) : 0;
        const netProfit = (totalIncome + closingStockValue) - totalExpense;

        // Assets
        const assetsFinal: any[] = [];
        ['Fixed Assets', 'Investments', 'Current Assets'].forEach(name => {
          const cat = categories[name];
          if (!cat) return;

          let subItems: any[] = Object.values(cat.groups).map((g: any) => ({
            name: g.name,
            balance: g.balance,
            groupId: g.groupId
          }));

          if (name === 'Current Assets') {
            subItems.push({ name: 'Closing Stock', balance: closingStockValue, isSystem: true, type: 'Stock' });
            cat.total += closingStockValue;
          }

          assetsFinal.push({ name: cat.name, total: cat.total, subItems });
        });

        // Liabilities
        const liabilitiesFinal: any[] = [];
        ['Capital Account', 'Loans (Liability)', 'Current Liabilities'].forEach(name => {
          const cat = categories[name];
          if (cat) {
            liabilitiesFinal.push({
              name: cat.name,
              total: cat.total,
              subItems: Object.values(cat.groups).map((g: any) => ({
                name: g.name,
                balance: g.balance,
                groupId: g.groupId
              }))
            });
          }
        });

        // P&L Container
        liabilitiesFinal.push({ 
          name: 'Profit & Loss A/c', 
          total: plOpeningBalance + netProfit, 
          subItems: [
            { name: 'Opening Balance', balance: plOpeningBalance, isPLSub: true },
            { name: 'Current Period', balance: netProfit, isPLSub: true }
          ],
          isPLContainer: true
        });

        const totalOpeningDebit = ledgers.reduce((sum, l) => sum + (Number(l.opening_balance) > 0 ? Number(l.opening_balance) : 0), 0);
        const totalOpeningCredit = ledgers.reduce((sum, l) => sum + (Number(l.opening_balance) < 0 ? Math.abs(Number(l.opening_balance)) : 0), 0);
        const openingDiff = totalOpeningDebit - totalOpeningCredit;

        // Save fresh results to cache
        erpService.setCachedData(`balancesheet_${asOnDate}`, user.companyId, {
          assetsFinal,
          liabilitiesFinal,
          openingDiff
        });

        setAssetGroups(assetsFinal);
        setLiabilityGroups(liabilitiesFinal);
        setOpeningBalanceDiff(openingDiff);

      } catch (err) {
        console.error('Error fetching balance sheet:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBalances();
  }, [asOnDate, user?.companyId]);

  const toggleGroup = (name: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(name)) newSet.delete(name);
    else newSet.add(name);
    setExpandedGroups(newSet);
  };

  const totalAssets = assetGroups.reduce((sum, g) => sum + g.total, 0);
  const totalLiabilitiesCombined = liabilityGroups.reduce((sum, g) => sum + g.total, 0);
  
  // Final Balance Check
  // Total must include opening difference if any
  const absTotalAssets = totalAssets + (openingBalanceDiff > 0 ? openingBalanceDiff : 0);
  const absTotalLiabilities = Math.abs(totalLiabilitiesCombined) + (openingBalanceDiff < 0 ? Math.abs(openingBalanceDiff) : 0);
  
  const finalBalanceValue = Math.max(absTotalAssets, absTotalLiabilities);

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
    exportData.push({ particulars: 'TOTAL LIABILITIES', amount: absTotalLiabilities });
    
    exportData.push({ particulars: '', amount: '' }); // Spacer
    
    // Add Assets
    exportData.push({ particulars: 'ASSETS', amount: '' });
    assetGroups.forEach(g => {
      exportData.push({ particulars: g.name, amount: Math.abs(g.balance) });
    });
    exportData.push({ particulars: 'TOTAL ASSETS', amount: totalAssets });

    exportToCSV('Balance_Sheet', 'Balance Sheet', exportData, ['Particulars', 'Amount'], settings);
  };

  if (loading) {
    return <SkeletonLoader type="table" />;
  }

  const finalTotal = Math.max(Math.abs(totalAssets), absTotalLiabilities);

  return (
    <div className="flex flex-col h-screen bg-background transition-colors overflow-hidden">
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
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
              id="print-btn"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title={t('common.downloadCsv')}
              id="csv-btn"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title={t('common.downloadPdf')}
              id="pdf-btn"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0 bg-background scroll-smooth">
        <div id="balance-sheet-report" className="p-4 lg:p-6 min-h-full flex flex-col bg-white">
          <div className="flex-1 border border-border bg-card shadow-sm rounded-lg overflow-hidden flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-border flex-1">
            {/* Liabilities Side */}
            <div className="flex flex-col border-r border-border">
              <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.particulars')}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.amount')}</span>
              </div>
              
              <div className="flex-1 min-h-[500px]">
                {liabilityGroups.map(group => (
                  <div key={group.name} className="flex flex-col">
                    <div 
                      onClick={() => {
                        if (group.isPLContainer) navigate(`/reports/pl?to=${asOnDate}`);
                        else navigate(`/reports/group-summary?groupId=${group.groupId || ''}&groupName=${encodeURIComponent(group.name)}&to=${asOnDate}`);
                      }}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground uppercase tracking-tight">
                        {group.name}
                      </span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(group.total))}</span>
                    </div>

                    {group.subItems.map((item: any) => (
                      <div 
                        key={item.id || item.name}
                        onClick={() => {
                          if (item.isPLSub) navigate(`/reports/pl?to=${asOnDate}`);
                          else navigate(item.groupId ? `/reports/group-summary?groupId=${item.groupId}&groupName=${encodeURIComponent(item.name)}&to=${asOnDate}` : `/reports/ledger?ledgerId=${item.id}`);
                        }}
                        className="px-8 py-1.5 flex justify-between items-center group/item cursor-pointer hover:bg-muted/60 transition-colors border-l-4 border-transparent hover:border-primary/40"
                      >
                        <span className="text-[13px] italic text-muted-foreground font-medium group-hover/item:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[13px] text-muted-foreground font-mono italic">
                          {item.balance < 0 ? `(-)${formatNumber(Math.abs(item.balance))}` : formatNumber(item.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {openingBalanceDiff > 0 && (
                  <div className="px-4 py-3 border-t border-border/5 mt-4">
                    <div className="flex justify-between items-center bg-rose-500/5 p-2 rounded">
                      <span className="text-sm text-rose-600 italic font-medium">Difference in opening balances</span>
                      <span className="text-sm text-rose-600 font-bold">{formatNumber(Math.abs(openingBalanceDiff))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto px-4 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tight text-foreground pl-4">Total</span>
                <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalBalanceValue)}</span>
              </div>
            </div>

            {/* Assets Side */}
            <div className="flex flex-col">
              <div className="bg-muted px-4 py-2 border-b border-border flex justify-between items-center group">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.particulars')}</span>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t('common.amount')}</span>
              </div>

              <div className="flex-1 min-h-[500px]">
                {assetGroups.map(group => (
                  <div key={group.name} className="flex flex-col">
                    <div 
                      onClick={() => navigate(`/reports/group-summary?groupId=${group.groupId || ''}&groupName=${encodeURIComponent(group.name)}&to=${asOnDate}`)}
                      className="px-4 py-3 flex justify-between items-center hover:bg-muted/80 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary"
                    >
                      <span className="text-sm font-medium text-foreground uppercase tracking-tight">{group.name}</span>
                      <span className="text-sm font-bold text-foreground tabular-nums">{formatNumber(Math.abs(group.total))}</span>
                    </div>

                    {group.subItems.map((item: any) => (
                      <div 
                        key={item.id || item.name}
                        onClick={() => navigate(item.type === 'Stock' ? `/reports/stock?to=${asOnDate}` : (item.groupId ? `/reports/group-summary?groupId=${item.groupId}&groupName=${encodeURIComponent(item.name)}&to=${asOnDate}` : `/reports/ledger?ledgerId=${item.id}`))}
                        className="px-8 py-1.5 flex justify-between items-center group/item cursor-pointer hover:bg-muted/60 transition-colors border-l-4 border-transparent hover:border-primary/40"
                      >
                        <span className="text-[13px] italic text-muted-foreground font-medium group-hover/item:text-primary transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[13px] text-muted-foreground font-mono italic">
                          {item.balance < 0 ? `(-)${formatNumber(Math.abs(item.balance))}` : formatNumber(item.balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}

                {openingBalanceDiff < 0 && (
                  <div className="px-4 py-3 border-t border-border/5 mt-4">
                    <div className="flex justify-between items-center bg-rose-500/5 p-2 rounded">
                      <span className="text-sm text-rose-600 italic font-medium">Difference in opening balances</span>
                      <span className="text-sm text-rose-600 font-bold">{formatNumber(Math.abs(openingBalanceDiff))}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto px-4 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
                <span className="text-sm font-black uppercase tracking-tight text-foreground pl-4">Total</span>
                <span className="text-sm font-black text-foreground tabular-nums border-b-2 border-double border-foreground py-0.5">{formatNumber(finalBalanceValue)}</span>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </div>
);
}

