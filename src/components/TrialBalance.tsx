import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Printer, 
  Download, 
  Filter, 
  Loader2, 
  ArrowLeft, 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  RefreshCw,
  SlidersHorizontal,
  ExternalLink
} from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printUtils } from '../utils/printUtils';
import { exportToCSV } from '../utils/exportUtils';
import { pdfExportService } from '../utils/pdfExportService';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EditableHeader } from './EditableHeader';
import { DateInput } from './DateInput';
import { soundService } from '../services/soundService';

interface LedgerItem {
  id: string;
  name: string;
  alias?: string;
  group_id?: string;
  group_name?: string;
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
  debit: number;
  credit: number;
}

interface SubgroupItem {
  id: string;
  name: string;
  parentGroupName: string;
  ledgers: LedgerItem[];
  debit: number;
  credit: number;
}

interface PrimaryGroupItem {
  id: string;
  name: string;
  nature: string;
  subgroups: SubgroupItem[];
  directLedgers: LedgerItem[];
  debit: number;
  credit: number;
}

const PRIMARY_GROUP_ORDER = [
  'Current Liabilities',
  'Current Assets',
  'Sales Accounts',
  'Purchase Accounts',
  'Direct Expenses',
  'Indirect Expenses',
  'Direct Incomes',
  'Indirect Incomes',
  'Capital Account',
  'Loans (Liability)',
  'Fixed Assets',
  'Investments',
  'Branch / Divisions',
  'Misc. Expenses (ASSET)',
  'Suspense A/c'
];

export function TrialBalance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isBn = language === 'bn';
  const settings = useSettings();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rawLedgers, setRawLedgers] = useState<any[]>([]);
  const [rawGroups, setRawGroups] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [stockItems, setStockItems] = useState<any[]>([]);

  // Format mode: 'condensed' (Screenshot 1) vs 'detailed' (Screenshot 2)
  const [viewFormat, setViewFormat] = useState<'condensed' | 'detailed'>('condensed');
  
  // Collapse state for primary groups and subgroups
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [expandedSubgroups, setExpandedSubgroups] = useState<Record<string, boolean>>({});
  
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });

  const fetchData = async (forceRefresh = false) => {
    if (!user?.companyId) return;
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [ledgersData, groupsData, vouchersData, itemsData] = await Promise.all([
        erpService.getLedgers(user.companyId, forceRefresh),
        erpService.getLedgerGroups(user.companyId),
        erpService.getVoucherEntriesByDateRange(user.companyId, '1900-01-01', endDate),
        erpService.getItems(user.companyId, forceRefresh).catch(() => [])
      ]);

      setRawLedgers(ledgersData || []);
      setRawGroups(groupsData || []);
      setVouchers(vouchersData || []);
      setStockItems(itemsData || []);
    } catch (err) {
      console.error('Error fetching trial balance data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.companyId, endDate]);

  // Keyboard shortcut for toggling Condensed / Detailed (Alt+F1 or F5 in Tally)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key === 'F1') || e.key === 'F5') {
        e.preventDefault();
        setViewFormat(prev => prev === 'condensed' ? 'detailed' : 'condensed');
        soundService.play('click');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute calculated balances for each ledger
  const computedLedgers = useMemo<LedgerItem[]>(() => {
    return rawLedgers.map(l => {
      const entriesBeforeStart = vouchers.filter(e => e.ledger_id === l.id && e.v_date < startDate);
      const entriesInRange = vouchers.filter(e => e.ledger_id === l.id && e.v_date >= startDate && e.v_date <= endDate);

      const openingBalance = (Number(l.opening_balance) || 0) + 
        entriesBeforeStart.reduce((sum, e) => sum + (Number(e.debit || 0) - Number(e.credit || 0)), 0);
      const periodDebit = entriesInRange.reduce((sum, e) => sum + Number(e.debit || 0), 0);
      const periodCredit = entriesInRange.reduce((sum, e) => sum + Number(e.credit || 0), 0);
      const closingBalance = openingBalance + periodDebit - periodCredit;

      const debit = closingBalance > 0 ? closingBalance : 0;
      const credit = closingBalance < 0 ? Math.abs(closingBalance) : 0;

      return {
        id: l.id,
        name: l.name,
        alias: l.alias,
        group_id: l.group_id,
        group_name: l.group_name || l.ledger_groups?.name || 'General Accounts',
        openingBalance,
        periodDebit,
        periodCredit,
        closingBalance,
        debit,
        credit
      };
    });
  }, [rawLedgers, vouchers, startDate, endDate]);

  // Hierarchical grouping structure matching Tally & screenshots
  const trialBalanceTree = useMemo(() => {
    // Helper to identify parent group
    const resolveParentGroupName = (gName: string, gId?: string): string => {
      const lower = (gName || '').toLowerCase().trim();
      const raw = rawGroups.find(g => g.id === gId || (g.name && g.name.toLowerCase().trim() === lower));

      // 1. If explicit parent_id in database
      if (raw && raw.parent_id) {
        const parentGroup = rawGroups.find(p => p.id === raw.parent_id);
        if (parentGroup && parentGroup.name) {
          return parentGroup.name;
        }
      }

      // 2. Standard Tally hierarchy mapping
      if (
        lower.includes('debtor') || 
        lower.includes('customer') || 
        lower.includes('cash') || 
        lower.includes('bank') || 
        lower.includes('stock') || 
        lower.includes('deposit') || 
        lower.includes('advance') ||
        lower === 'current assets'
      ) {
        return 'Current Assets';
      }

      if (
        lower.includes('creditor') || 
        lower.includes('supplier') || 
        lower.includes('vendor') || 
        lower.includes('duty') || 
        lower.includes('tax') || 
        lower.includes('provision') ||
        lower === 'current liabilities'
      ) {
        return 'Current Liabilities';
      }

      if (lower.includes('sale')) return 'Sales Accounts';
      if (lower.includes('purchase')) return 'Purchase Accounts';
      if (lower.includes('direct exp') || lower === 'direct expense' || lower === 'direct expenses') return 'Direct Expenses';
      if (lower.includes('indirect exp') || lower.includes('cost') || lower === 'indirect expense' || lower === 'indirect expenses') return 'Indirect Expenses';
      if (lower.includes('direct inc')) return 'Direct Incomes';
      if (lower.includes('indirect inc')) return 'Indirect Incomes';
      if (lower.includes('capital') || lower.includes('reserve') || lower.includes('surplus')) return 'Capital Account';
      if (lower.includes('loan') || lower.includes('od a/c')) return 'Loans (Liability)';
      if (lower.includes('fixed') || lower.includes('asset')) return 'Fixed Assets';
      if (lower.includes('investment')) return 'Investments';

      return 'Current Assets';
    };

    // Helper to determine if a group is a recognized sub-group vs a top group
    const isKnownSubgroup = (gName: string): boolean => {
      const lower = gName.toLowerCase().trim();
      const subNames = [
        'sundry creditors',
        'sundry debtors',
        'cash-in-hand',
        'cash in hand',
        'bank accounts',
        'opening stock',
        'stock-in-hand',
        'loans & advances (asset)',
        'loans and advances',
        'duties & taxes',
        'provisions',
        'bank od a/c',
        'secured loans',
        'unsecured loans',
        'reserves & surplus',
        'deposits (asset)'
      ];
      return subNames.some(s => lower.includes(s));
    };

    const groupMap = new Map<string, PrimaryGroupItem>();

    // Initialize standard primary groups
    PRIMARY_GROUP_ORDER.forEach(pName => {
      groupMap.set(pName, {
        id: `pg_${pName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        name: pName,
        nature: pName.includes('Liabilit') || pName.includes('Capital') || pName.includes('Loans') ? 'Liability' :
                pName.includes('Asset') ? 'Asset' :
                pName.includes('Sales') || pName.includes('Income') ? 'Income' : 'Expense',
        subgroups: [],
        directLedgers: [],
        debit: 0,
        credit: 0
      });
    });

    // Bucket each ledger
    computedLedgers.forEach(ledger => {
      // Check search filter
      if (search.trim()) {
        const query = search.toLowerCase().trim();
        const matches = 
          ledger.name.toLowerCase().includes(query) ||
          (ledger.alias && ledger.alias.toLowerCase().includes(query)) ||
          ledger.group_name.toLowerCase().includes(query);
        if (!matches) return;
      }

      // Special check: Opening Stock or Profit & Loss A/c
      const lNameLower = ledger.name.toLowerCase();
      if (lNameLower.includes('profit & loss') || lNameLower === 'profit and loss a/c') {
        // Will be displayed in dedicated P&L row
        return;
      }

      const rawGroupName = ledger.group_name;
      const parentName = resolveParentGroupName(rawGroupName, ledger.group_id);
      
      let pGroup = groupMap.get(parentName);
      if (!pGroup) {
        pGroup = {
          id: `pg_${parentName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: parentName,
          nature: 'Asset',
          subgroups: [],
          directLedgers: [],
          debit: 0,
          credit: 0
        };
        groupMap.set(parentName, pGroup);
      }

      // Is it a subgroup (e.g. Sundry Creditors, Sundry Debtors, Bank Accounts, Cash-in-Hand)?
      const isSub = isKnownSubgroup(rawGroupName);

      if (isSub) {
        let sub = pGroup.subgroups.find(s => s.name.toLowerCase().trim() === rawGroupName.toLowerCase().trim());
        if (!sub) {
          sub = {
            id: `sub_${rawGroupName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
            name: rawGroupName,
            parentGroupName: parentName,
            ledgers: [],
            debit: 0,
            credit: 0
          };
          pGroup.subgroups.push(sub);
        }
        sub.ledgers.push(ledger);
        sub.debit += ledger.debit;
        sub.credit += ledger.credit;
      } else {
        // Direct ledger under primary group (e.g. Mess Bills under Current Liabilities, Sales A/C under Sales Accounts)
        pGroup.directLedgers.push(ledger);
      }

      pGroup.debit += ledger.debit;
      pGroup.credit += ledger.credit;
    });

    // Check if Opening Stock is tracked via items stock valuation and not yet present as a ledger
    const currentAssetsGroup = groupMap.get('Current Assets');
    if (currentAssetsGroup && stockItems.length > 0) {
      const hasStockLedger = currentAssetsGroup.subgroups.some(s => s.name.toLowerCase().includes('stock')) ||
                             currentAssetsGroup.directLedgers.some(l => l.name.toLowerCase().includes('stock'));
      
      if (!hasStockLedger) {
        const totalStockValue = stockItems.reduce((sum, item) => {
          const qty = Number(item.opening_stock ?? item.current_stock ?? 0);
          const rate = Number(item.avg_cost ?? item.purchase_price ?? item.rate ?? 0);
          return sum + (qty * rate);
        }, 0);

        if (totalStockValue > 0) {
          currentAssetsGroup.directLedgers.unshift({
            id: 'virtual_opening_stock',
            name: 'Opening Stock',
            group_name: 'Current Assets',
            openingBalance: totalStockValue,
            periodDebit: 0,
            periodCredit: 0,
            closingBalance: totalStockValue,
            debit: totalStockValue,
            credit: 0
          });
          currentAssetsGroup.debit += totalStockValue;
        }
      }
    }

    // Filter out primary groups that have 0 debit and 0 credit (unless explicitly searching)
    const activeGroups: PrimaryGroupItem[] = [];
    PRIMARY_GROUP_ORDER.forEach(pName => {
      const g = groupMap.get(pName);
      if (g && (g.debit > 0 || g.credit > 0 || g.directLedgers.length > 0 || g.subgroups.length > 0)) {
        // Sort subgroups & direct ledgers nicely
        g.subgroups.sort((a, b) => a.name.localeCompare(b.name));
        g.directLedgers.sort((a, b) => a.name.localeCompare(b.name));
        activeGroups.push(g);
      }
    });

    // Add any custom active groups not in PRIMARY_GROUP_ORDER
    groupMap.forEach((g, key) => {
      if (!PRIMARY_GROUP_ORDER.includes(key) && (g.debit > 0 || g.credit > 0)) {
        activeGroups.push(g);
      }
    });

    return activeGroups;
  }, [computedLedgers, rawGroups, stockItems, search]);

  // Profit & Loss calculation for Trial Balance
  const profitAndLossRow = useMemo(() => {
    // 1. Look for explicit Profit & Loss ledger
    const explicitPnl = computedLedgers.find(l => {
      const n = l.name.toLowerCase();
      return n.includes('profit & loss') || n.includes('profit and loss');
    });

    if (explicitPnl && (explicitPnl.debit > 0 || explicitPnl.credit > 0)) {
      return {
        name: explicitPnl.name,
        debit: explicitPnl.debit,
        credit: explicitPnl.credit
      };
    }

    // 2. Calculate net profit from revenues vs expenses in Trial Balance
    let totalIncome = 0;
    let totalExpense = 0;

    trialBalanceTree.forEach(g => {
      if (g.nature === 'Income' || g.name.includes('Sales') || g.name.includes('Income')) {
        totalIncome += (g.credit - g.debit);
      } else if (g.nature === 'Expense' || g.name.includes('Purchase') || g.name.includes('Expense')) {
        totalExpense += (g.debit - g.credit);
      }
    });

    const netProfit = totalIncome - totalExpense;
    if (Math.abs(netProfit) > 0.01) {
      return {
        name: isBn ? 'লাভ ও ক্ষতি হিসাব (Profit & Loss A/c)' : 'Profit & Loss A/c',
        debit: netProfit < 0 ? Math.abs(netProfit) : 0,
        credit: netProfit > 0 ? netProfit : 0
      };
    }

    return null;
  }, [computedLedgers, trialBalanceTree, isBn]);

  // Difference in opening balances calculation to ensure 100% Grand Total balancing
  const totalsAndDiff = useMemo(() => {
    let sumDebit = 0;
    let sumCredit = 0;

    trialBalanceTree.forEach(g => {
      sumDebit += g.debit;
      sumCredit += g.credit;
    });

    if (profitAndLossRow) {
      sumDebit += profitAndLossRow.debit;
      sumCredit += profitAndLossRow.credit;
    }

    const diff = sumDebit - sumCredit;
    let diffDebit = 0;
    let diffCredit = 0;

    if (Math.abs(diff) > 0.005) {
      if (diff > 0) {
        // Debits exceed credits -> difference placed on Credit side
        diffCredit = diff;
      } else {
        // Credits exceed debits -> difference placed on Debit side
        diffDebit = Math.abs(diff);
      }
    }

    const grandTotalDebit = sumDebit + diffDebit;
    const grandTotalCredit = sumCredit + diffCredit;

    return {
      sumDebit,
      sumCredit,
      diffDebit,
      diffCredit,
      hasDiff: Math.abs(diff) > 0.005,
      diffAmount: Math.abs(diff),
      grandTotalDebit,
      grandTotalCredit
    };
  }, [trialBalanceTree, profitAndLossRow]);

  const toggleGroupCollapse = (groupName: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleSubgroupExpand = (subgroupId: string) => {
    setExpandedSubgroups(prev => ({
      ...prev,
      [subgroupId]: !prev[subgroupId]
    }));
  };

  const expandAll = () => {
    setCollapsedGroups({});
    const allSubs: Record<string, boolean> = {};
    trialBalanceTree.forEach(g => {
      g.subgroups.forEach(s => {
        allSubs[s.id] = true;
      });
    });
    setExpandedSubgroups(allSubs);
    setViewFormat('detailed');
    soundService.play('click');
  };

  const collapseAll = () => {
    const allGroups: Record<string, boolean> = {};
    trialBalanceTree.forEach(g => {
      allGroups[g.name] = true;
    });
    setCollapsedGroups(allGroups);
    setExpandedSubgroups({});
    setViewFormat('condensed');
    soundService.play('click');
  };

  const handlePrint = () => {
    soundService.play('click');
    printUtils.printElement('trial-balance-report', 'Trial Balance Report');
  };

  const handleDownloadPDF = () => {
    soundService.play('click');
    pdfExportService.printTrialBalanceToPDF(
      computedLedgers, 
      settings, 
      endDate,
      {
        viewFormat,
        groups: trialBalanceTree,
        profitAndLoss: profitAndLossRow,
        diff: totalsAndDiff,
        grandTotalDebit: totalsAndDiff.grandTotalDebit,
        grandTotalCredit: totalsAndDiff.grandTotalCredit,
        startDate,
        endDate
      }
    );
  };

  const handleDownloadCSV = () => {
    soundService.play('click');
    const exportRows: any[] = [];
    trialBalanceTree.forEach(g => {
      exportRows.push({
        particulars: g.name.toUpperCase(),
        group: 'PRIMARY GROUP',
        debit: g.debit > 0 ? g.debit : 0,
        credit: g.credit > 0 ? g.credit : 0
      });
      if (viewFormat === 'detailed') {
        g.subgroups.forEach(s => {
          exportRows.push({
            particulars: `  ${s.name}`,
            group: g.name,
            debit: s.debit > 0 ? s.debit : 0,
            credit: s.credit > 0 ? s.credit : 0
          });
        });
        g.directLedgers.forEach(l => {
          exportRows.push({
            particulars: `  ${l.name}`,
            group: g.name,
            debit: l.debit > 0 ? l.debit : 0,
            credit: l.credit > 0 ? l.credit : 0
          });
        });
      }
    });

    if (profitAndLossRow) {
      exportRows.push({
        particulars: profitAndLossRow.name,
        group: 'P&L',
        debit: profitAndLossRow.debit > 0 ? profitAndLossRow.debit : 0,
        credit: profitAndLossRow.credit > 0 ? profitAndLossRow.credit : 0
      });
    }

    if (totalsAndDiff.hasDiff) {
      exportRows.push({
        particulars: 'Difference in opening balances',
        group: 'Difference',
        debit: totalsAndDiff.diffDebit > 0 ? totalsAndDiff.diffDebit : 0,
        credit: totalsAndDiff.diffCredit > 0 ? totalsAndDiff.diffCredit : 0
      });
    }

    exportRows.push({
      particulars: 'Grand Total',
      group: 'TOTAL',
      debit: totalsAndDiff.grandTotalDebit,
      credit: totalsAndDiff.grandTotalCredit
    });

    exportToCSV(
      `Trial_Balance_${viewFormat}`, 
      `${t('reports.trialBalance')} (${viewFormat === 'condensed' ? 'Condensed' : 'Detailed'})`, 
      exportRows, 
      [t('common.particulars'), t('common.group'), t('reports.debit'), t('reports.credit')], 
      settings
    );
  };

  if (loading) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <div className={cn(
      "flex flex-col h-full bg-background font-mono transition-colors text-[11px] overflow-hidden select-none",
      settings.reportsPageUiStyle === 'modern' ? "bg-slate-50/50" : "bg-background"
    )}>
      {/* Permanent Fixed Header */}
      <div className={cn(
        "flex-none border-b shadow-sm px-4 lg:px-6 py-3.5 space-y-3 z-[40]",
        settings.reportsPageUiStyle === 'modern'
          ? "bg-white/95 dark:bg-card/95 backdrop-blur-md border-slate-200/60 dark:border-border"
          : "bg-background/95 backdrop-blur-md border-border"
      )}>
        {/* Top Title & Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-1.5 bg-card border border-border text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
              title={t('common.back')}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <EditableHeader 
              pageId="trial_balance"
              defaultTitle={isBn ? 'রেওয়ামিল (Trial Balance)' : 'Trial Balance'}
              defaultSubtitle={settings.companyName || 'Closing Balance Statement'}
            />
          </div>

          {/* Action Buttons: Print, PDF, CSV, Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-2.5 py-1.5 border border-border text-foreground hover:bg-muted text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title={isBn ? 'রিফ্রেশ করুন' : 'Refresh Data'}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
              <span className="hidden md:inline">{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>

            <button 
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-card border border-border text-foreground hover:bg-muted text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Print Trial Balance"
            >
              <Printer className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="hidden sm:inline">{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>

            <button 
              onClick={handleDownloadCSV}
              className="px-2.5 py-1.5 bg-card border border-border text-foreground hover:bg-muted text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download CSV"
            >
              <Download className="w-3.5 h-3.5 text-muted-foreground" />
              <span>CSV</span>
            </button>

            <button 
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              title="Print to PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar: Format Toggle (Condensed vs Detailed) + Date Pickers + Search */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1 border-t border-border/50">
          {/* Format Mode Toggle & Hierarchy Expanders */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center p-1 bg-muted/60 dark:bg-card border border-border rounded-lg shadow-inner">
              <button
                type="button"
                onClick={() => {
                  setViewFormat('condensed');
                  soundService.play('click');
                }}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  viewFormat === 'condensed'
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Condensed View (Primary Groups only)"
              >
                <span>{isBn ? 'সংক্ষিপ্ত ফরম্যাট' : 'Condensed Format'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setViewFormat('detailed');
                  soundService.play('click');
                }}
                className={cn(
                  "px-3 py-1 text-[11px] font-bold uppercase rounded-md transition-all cursor-pointer flex items-center gap-1.5",
                  viewFormat === 'detailed'
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                title="Detailed View (Subgroups & Ledgers expanded)"
              >
                <span>{isBn ? 'বিস্তারিত ফরম্যাট' : 'Detailed Format'}</span>
              </button>
            </div>

            <button
              onClick={expandAll}
              className="px-2 py-1 border border-border text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
              title={isBn ? 'সব প্রসারিত করুন' : 'Expand All'}
            >
              {isBn ? 'সব প্রসারিত' : 'Expand All'}
            </button>

            <button
              onClick={collapseAll}
              className="px-2 py-1 border border-border text-muted-foreground hover:text-foreground text-[10px] font-bold uppercase rounded transition-colors cursor-pointer"
              title={isBn ? 'সব সংকুচিত করুন' : 'Collapse All'}
            >
              {isBn ? 'সব সংকুচিত' : 'Collapse All'}
            </button>
          </div>

          {/* Date Range & Search Box */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold">{t('common.from')}:</span>
              <DateInput
                value={startDate}
                onChange={setStartDate}
                className="w-32 bg-card text-[11px]"
              />
              <span className="text-[10px] text-muted-foreground uppercase font-semibold ml-1">{t('common.to')}:</span>
              <DateInput
                value={endDate}
                onChange={setEndDate}
                className="w-32 bg-card text-[11px]"
              />
            </div>

            <div className="relative min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder={isBn ? 'হিসাব বা গ্রুপ খুঁজুন...' : 'Search accounts or groups...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-card border border-border text-foreground pl-8 pr-6 py-1 text-[11px] outline-none focus:border-primary transition-colors rounded-lg font-mono placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Scrollable Table Area */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 no-scrollbar">
        <div id="trial-balance-report" className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
          
          {/* Printable Report Header */}
          <div className="hidden print:block p-4 border-b border-border text-center space-y-1">
            <h1 className="text-base font-bold uppercase tracking-wider">{settings.companyName || 'SAPIENT ERP'}</h1>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {viewFormat === 'condensed' ? 'TRIAL BALANCE (CONDENSED)' : 'TRIAL BALANCE (DETAILED)'}
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Period: {formatReportDate(startDate, settings.dateFormat)} to {formatReportDate(endDate, settings.dateFormat)}
            </p>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            {/* Table Sticky Header */}
            <thead className="sticky top-0 z-20 bg-muted/90 dark:bg-card/95 backdrop-blur-md shadow-xs">
              <tr className="border-b border-border text-[10px] uppercase tracking-widest text-muted-foreground">
                <th 
                  rowSpan={2} 
                  className="px-4 py-2.5 font-bold border-r border-border text-foreground"
                  style={{ verticalAlign: 'middle' }}
                >
                  {isBn ? 'হিসাবের বিবরণ (Particulars)' : 'Particulars'}
                </th>
                <th 
                  colSpan={2} 
                  className="px-4 py-1.5 font-bold text-center border-b border-border text-foreground"
                  style={{ verticalAlign: 'middle' }}
                >
                  {isBn ? 'ক্লোজিং ব্যালেন্স (Closing Balance)' : 'Closing Balance'}
                </th>
              </tr>
              <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                <th 
                  className="px-4 py-2 font-bold text-right w-44 md:w-56 border-r border-border text-foreground"
                  style={{ verticalAlign: 'middle' }}
                >
                  {isBn ? 'ডেবিট (Debit)' : 'Debit'}
                </th>
                <th 
                  className="px-4 py-2 font-bold text-right w-44 md:w-56 text-foreground"
                  style={{ verticalAlign: 'middle' }}
                >
                  {isBn ? 'ক্রেডিট (Credit)' : 'Credit'}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border/40 font-mono">
              {trialBalanceTree.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-16 text-center text-muted-foreground uppercase tracking-widest text-[11px]" style={{ verticalAlign: 'middle' }}>
                    {isBn ? 'কোনো লেনদেন বা ব্যালেন্স পাওয়া যায়নি' : 'No records or balances found for selected period'}
                  </td>
                </tr>
              ) : (
                trialBalanceTree.map(group => {
                  const isGroupCollapsed = viewFormat === 'condensed' 
                    ? !collapsedGroups[group.name] // in condensed, collapsed by default unless user opened
                    : collapsedGroups[group.name] === true; // in detailed, open by default unless user closed

                  return (
                    <React.Fragment key={group.id}>
                      {/* 1. Primary Group Header Row (Screenshot 1 & 2 bold row with subtle grey bg) */}
                      <tr 
                        onClick={() => toggleGroupCollapse(group.name)}
                        className={cn(
                          "cursor-pointer transition-colors group select-none",
                          "bg-muted/40 dark:bg-card hover:bg-muted/70 dark:hover:bg-muted/30 font-bold border-t border-b border-border/80"
                        )}
                      >
                        {/* Particulars (Primary Group Name) */}
                        <td className="px-4 py-2.5 text-foreground border-r border-border" style={{ verticalAlign: 'middle' }}>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground group-hover:text-foreground transition-transform">
                              {isGroupCollapsed ? (
                                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                              )}
                            </span>
                            <span className="font-bold text-foreground text-xs uppercase tracking-wide">
                              {group.name}
                            </span>
                          </div>
                        </td>

                        {/* Debit Total */}
                        <td className="px-4 py-2.5 text-right font-bold text-foreground border-r border-border" style={{ verticalAlign: 'middle' }}>
                          {group.debit > 0 ? formatNumber(group.debit) : ''}
                        </td>

                        {/* Credit Total */}
                        <td className="px-4 py-2.5 text-right font-bold text-foreground" style={{ verticalAlign: 'middle' }}>
                          {group.credit > 0 ? formatNumber(group.credit) : ''}
                        </td>
                      </tr>

                      {/* 2. Subgroups & Direct Ledgers (Expanded in Detailed mode, or when clicked in Condensed mode) */}
                      {!isGroupCollapsed && (
                        <>
                          {/* A. Subgroups (e.g. Sundry Creditors, Sundry Debtors, Bank Accounts, Cash-in-Hand) */}
                          {group.subgroups.map(sub => {
                            const isSubExpanded = !!expandedSubgroups[sub.id];

                            return (
                              <React.Fragment key={sub.id}>
                                <tr 
                                  onClick={() => toggleSubgroupExpand(sub.id)}
                                  className="hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors group cursor-pointer"
                                >
                                  {/* Indented Subgroup Name */}
                                  <td className="py-2 pr-4 pl-8 text-foreground border-r border-border" style={{ verticalAlign: 'middle' }}>
                                    <div className="flex items-center gap-2">
                                      <span className="text-muted-foreground/70 group-hover:text-foreground">
                                        {isSubExpanded ? (
                                          <ChevronDown className="w-3 h-3 shrink-0" />
                                        ) : (
                                          <ChevronRight className="w-3 h-3 shrink-0" />
                                        )}
                                      </span>
                                      <Folder className="w-3 h-3 text-muted-foreground shrink-0" />
                                      <span className="font-semibold text-foreground text-[11px]">
                                        {sub.name}
                                      </span>
                                      <span className="text-[9px] text-muted-foreground font-normal">
                                        ({sub.ledgers.length})
                                      </span>
                                    </div>
                                  </td>

                                  {/* Subgroup Debit */}
                                  <td className="px-4 py-2 text-right font-semibold text-foreground border-r border-border" style={{ verticalAlign: 'middle' }}>
                                    {sub.debit > 0 ? formatNumber(sub.debit) : ''}
                                  </td>

                                  {/* Subgroup Credit */}
                                  <td className="px-4 py-2 text-right font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>
                                    {sub.credit > 0 ? formatNumber(sub.credit) : ''}
                                  </td>
                                </tr>

                                {/* Individual Ledgers under Subgroup (when subgroup expanded) */}
                                {isSubExpanded && sub.ledgers.map(ledger => (
                                  <tr 
                                    key={ledger.id}
                                    onClick={() => navigate(`/reports/ledger-statement?ledgerId=${ledger.id}`)}
                                    className="hover:bg-foreground/5 transition-colors group cursor-pointer text-[10.5px]"
                                  >
                                    <td className="py-1.5 pr-4 pl-14 text-muted-foreground hover:text-primary border-r border-border italic" style={{ verticalAlign: 'middle' }}>
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <FileText className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                          <span>{ledger.name}</span>
                                          {ledger.alias && (
                                            <span className="text-[9px] opacity-75 font-normal">({ledger.alias})</span>
                                          )}
                                        </div>
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary shrink-0 transition-opacity" />
                                      </div>
                                    </td>

                                    <td className="px-4 py-1.5 text-right font-normal text-muted-foreground group-hover:text-foreground border-r border-border" style={{ verticalAlign: 'middle' }}>
                                      {ledger.debit > 0 ? formatNumber(ledger.debit) : ''}
                                    </td>

                                    <td className="px-4 py-1.5 text-right font-normal text-muted-foreground group-hover:text-foreground" style={{ verticalAlign: 'middle' }}>
                                      {ledger.credit > 0 ? formatNumber(ledger.credit) : ''}
                                    </td>
                                  </tr>
                                ))}
                              </React.Fragment>
                            );
                          })}

                          {/* B. Direct Ledgers under Primary Group (e.g. Mess Bills, Sales A/C, Purchase A/C, Expense Heads) */}
                          {group.directLedgers.map(ledger => (
                            <tr 
                              key={ledger.id}
                              onClick={() => navigate(`/reports/ledger-statement?ledgerId=${ledger.id}`)}
                              className="hover:bg-foreground/5 transition-colors group cursor-pointer text-[11px]"
                            >
                              <td className="py-2 pr-4 pl-8 text-foreground group-hover:text-primary border-r border-border italic font-normal" style={{ verticalAlign: 'middle' }}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                                    <span>{ledger.name}</span>
                                    {ledger.alias && (
                                      <span className="text-[9px] text-muted-foreground font-normal">({ledger.alias})</span>
                                    )}
                                  </div>
                                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-primary shrink-0 transition-opacity" />
                                </div>
                              </td>

                              <td className="px-4 py-2 text-right font-normal text-foreground border-r border-border" style={{ verticalAlign: 'middle' }}>
                                {ledger.debit > 0 ? formatNumber(ledger.debit) : ''}
                              </td>

                              <td className="px-4 py-2 text-right font-normal text-foreground" style={{ verticalAlign: 'middle' }}>
                                {ledger.credit > 0 ? formatNumber(ledger.credit) : ''}
                              </td>
                            </tr>
                          ))}
                        </>
                      )}
                    </React.Fragment>
                  );
                })
              )}

              {/* 3. Profit & Loss A/c Row (Exact as in 1.jpg & 2.jpg) */}
              {profitAndLossRow && (
                <tr className="border-t border-border font-normal italic text-foreground hover:bg-muted/20">
                  <td className="px-4 py-2.5 border-r border-border" style={{ verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 shrink-0" />
                      <span>{profitAndLossRow.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right border-r border-border" style={{ verticalAlign: 'middle' }}>
                    {profitAndLossRow.debit > 0 ? formatNumber(profitAndLossRow.debit) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>
                    {profitAndLossRow.credit > 0 ? formatNumber(profitAndLossRow.credit) : ''}
                  </td>
                </tr>
              )}

              {/* 4. Difference in opening balances Row (Exact as in 1.jpg & 2.jpg) */}
              {totalsAndDiff.hasDiff && (
                <tr className="border-t border-border font-normal italic text-foreground hover:bg-rose-500/5">
                  <td className="px-4 py-2.5 border-r border-border text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {isBn ? 'ওপেনিং ব্যালেন্সে পার্থক্য (Difference in opening balances)' : 'Difference in opening balances'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground font-semibold border-r border-border" style={{ verticalAlign: 'middle' }}>
                    {totalsAndDiff.diffDebit > 0 ? formatNumber(totalsAndDiff.diffDebit) : ''}
                  </td>
                  <td className="px-4 py-2.5 text-right text-foreground font-semibold" style={{ verticalAlign: 'middle' }}>
                    {totalsAndDiff.diffCredit > 0 ? formatNumber(totalsAndDiff.diffCredit) : ''}
                  </td>
                </tr>
              )}
            </tbody>

            {/* 5. Grand Total Row (Double underline below, matching Screenshot 1 & 2) */}
            <tfoot className="bg-muted/60 dark:bg-card border-t-2 border-b-4 border-double border-foreground/80 font-bold text-foreground">
              <tr>
                <td className="px-4 py-3 border-r border-border uppercase tracking-widest text-xs" style={{ verticalAlign: 'middle' }}>
                  <span className="tracking-[0.25em] font-extrabold">
                    {isBn ? 'সর্বমোট (Grand Total)' : 'G r a n d   T o t a l'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-foreground font-extrabold text-xs border-r border-border" style={{ verticalAlign: 'middle' }}>
                  {formatNumber(totalsAndDiff.grandTotalDebit)}
                </td>
                <td className="px-4 py-3 text-right text-foreground font-extrabold text-xs" style={{ verticalAlign: 'middle' }}>
                  {formatNumber(totalsAndDiff.grandTotalCredit)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
