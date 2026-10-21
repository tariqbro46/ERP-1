import React, { useState, useEffect, useMemo } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ChevronRight, 
  ChevronDown, 
  Folder, 
  FolderOpen,
  FileText, 
  Edit2, 
  Search, 
  Loader2, 
  Layers, 
  Plus, 
  ExternalLink, 
  ChevronsUpDown,
  RefreshCw,
  Users,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatNumber, cn } from '../lib/utils';
import { soundService } from '../services/soundService';

const STANDARD_SYSTEM_GROUPS = [
  { id: 'g_debtors', name: 'Sundry Debtors', nature: 'Asset' },
  { id: 'g_creditors', name: 'Sundry Creditors', nature: 'Liability' },
  { id: 'g_cash', name: 'Cash-in-Hand', nature: 'Asset' },
  { id: 'g_bank', name: 'Bank Accounts', nature: 'Asset' },
  { id: 'g_sales', name: 'Sales Accounts', nature: 'Income' },
  { id: 'g_purchase', name: 'Purchase Accounts', nature: 'Expense' },
  { id: 'g_direct_exp', name: 'Direct Expenses', nature: 'Expense' },
  { id: 'g_indirect_exp', name: 'Indirect Expenses', nature: 'Expense' },
  { id: 'g_direct_inc', name: 'Direct Incomes', nature: 'Income' },
  { id: 'g_indirect_inc', name: 'Indirect Incomes', nature: 'Income' },
  { id: 'g_current_assets', name: 'Current Assets', nature: 'Asset' },
  { id: 'g_current_liabilities', name: 'Current Liabilities', nature: 'Liability' },
  { id: 'g_fixed_assets', name: 'Fixed Assets', nature: 'Asset' },
  { id: 'g_capital', name: 'Capital Account', nature: 'Liability' },
];

export function ChartOfAccounts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const isBn = language === 'bn';

  const [rawGroups, setRawGroups] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [natureFilter, setNatureFilter] = useState<string>('all');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  const fetchData = async (forceRefresh = false) => {
    if (!user?.companyId) return;
    try {
      if (forceRefresh) setRefreshing(true);
      else setLoading(true);

      const [g, l] = await Promise.all([
        erpService.getLedgerGroups(user.companyId),
        erpService.getLedgers(user.companyId, forceRefresh)
      ]);

      setRawGroups(g || []);
      setLedgers(l || []);
    } catch (err) {
      console.error('Error fetching chart of accounts:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.companyId]);

  // Build unified, robust catalog of groups
  const groups = useMemo(() => {
    const groupMap = new Map<string, any>();

    // 1. Add standard system groups as base reference
    STANDARD_SYSTEM_GROUPS.forEach(sg => {
      const key = sg.name.toLowerCase().trim();
      groupMap.set(key, { ...sg, isStandard: true });
    });

    // 2. Add/merge actual groups from database
    (rawGroups || []).forEach(g => {
      if (!g || !g.name) return;
      const key = g.name.toLowerCase().trim();
      const existing = groupMap.get(key);
      groupMap.set(key, {
        ...existing,
        ...g,
        id: g.id || existing?.id || key,
        name: g.name,
        nature: g.nature || existing?.nature || 'Asset'
      });
    });

    // 3. Ensure any group referenced in existing ledgers is accounted for
    (ledgers || []).forEach(l => {
      const gName = (l.group_name || l.ledger_groups?.name || '').trim();
      if (gName) {
        const key = gName.toLowerCase();
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            id: l.group_id || `g_${key.replace(/[^a-z0-9]/g, '_')}`,
            name: gName,
            nature: l.nature || l.ledger_groups?.nature || 'Asset'
          });
        }
      }
    });

    return Array.from(groupMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawGroups, ledgers]);

  // Robust function to determine if a ledger belongs to a group
  const isLedgerInGroup = (l: any, group: any): boolean => {
    if (!l || !group) return false;

    const groupNameLower = (group.name || '').toLowerCase().trim();
    const ledgerGroupName = (l.group_name || l.ledger_groups?.name || l.group || '').toLowerCase().trim();
    const ledgerGroupId = String(l.group_id || l.ledger_groups?.id || l.parent_group_id || (l as any).groupId || '').trim();

    const isDebtorGroup = groupNameLower.includes('debtor') || groupNameLower.includes('receivable');
    const isCreditorGroup = groupNameLower.includes('creditor') || groupNameLower.includes('payable');
    const isCashGroup = groupNameLower.includes('cash');
    const isBankGroup = groupNameLower.includes('bank');

    // 1. Direct ID match
    if (ledgerGroupId && (ledgerGroupId === group.id || ledgerGroupId === group.parent_id)) {
      return true;
    }

    // 2. Direct Name match
    if (groupNameLower && ledgerGroupName && groupNameLower === ledgerGroupName) {
      return true;
    }

    // 3. Match across any database group sharing this group's name
    const sameNamedGroupIds = rawGroups
      .filter(g => (g.name || '').toLowerCase().trim() === groupNameLower)
      .map(g => g.id);

    if (sameNamedGroupIds.length > 0 && sameNamedGroupIds.includes(ledgerGroupId)) {
      return true;
    }

    // 4. Comprehensive Sundry Debtors identification
    if (isDebtorGroup) {
      if (ledgerGroupId === 'g_debtors' || sameNamedGroupIds.includes('g_debtors')) return true;
      if (
        ledgerGroupName.includes('debtor') || 
        ledgerGroupName.includes('customer') || 
        ledgerGroupName.includes('client') ||
        ledgerGroupName.includes('receivable') ||
        ledgerGroupName.includes('গ্রাহক') ||
        ledgerGroupName.includes('দেনাদার')
      ) {
        // Exclude expenses/liabilities that accidentally contain debtor in text
        const lNameLower = ((l.name || '') + ' ' + (l.alias || '')).toLowerCase();
        const isExpense = lNameLower.includes('expense') || lNameLower.includes('expence') || lNameLower.includes('খরচ') || lNameLower.includes('ব্যয়') || l.nature === 'Expense';
        if (!isExpense) return true;
      }

      // Check if ledger's group in rawGroups is a child/sub-group of Sundry Debtors
      const matchingRawGroup = rawGroups.find(g => g.id === ledgerGroupId);
      if (matchingRawGroup) {
        const rawParentId = matchingRawGroup.parent_id || matchingRawGroup.parent_group_id;
        const rawParentName = (matchingRawGroup.parent_name || matchingRawGroup.parent || '').toLowerCase();
        if (
          rawParentId === group.id || 
          rawParentId === 'g_debtors' || 
          sameNamedGroupIds.includes(rawParentId) ||
          rawParentName.includes('debtor') ||
          rawParentName.includes('receivable')
        ) {
          return true;
        }
      }

      // If customer party flag or nature asset with customer characteristics
      if ((l as any).party_type === 'customer' || (l as any).is_customer) {
        return true;
      }
    }

    // 5. Comprehensive Sundry Creditors identification
    if (isCreditorGroup) {
      if (ledgerGroupId === 'g_creditors' || sameNamedGroupIds.includes('g_creditors')) return true;
      if (
        ledgerGroupName.includes('creditor') || 
        ledgerGroupName.includes('supplier') || 
        ledgerGroupName.includes('vendor') ||
        ledgerGroupName.includes('payable') ||
        ledgerGroupName.includes('সরবরাহকারী') ||
        ledgerGroupName.includes('পাওনাদার')
      ) {
        return true;
      }

      const matchingRawGroup = rawGroups.find(g => g.id === ledgerGroupId);
      if (matchingRawGroup) {
        const rawParentId = matchingRawGroup.parent_id || matchingRawGroup.parent_group_id;
        const rawParentName = (matchingRawGroup.parent_name || matchingRawGroup.parent || '').toLowerCase();
        if (
          rawParentId === group.id || 
          rawParentId === 'g_creditors' || 
          sameNamedGroupIds.includes(rawParentId) ||
          rawParentName.includes('creditor') ||
          rawParentName.includes('payable')
        ) {
          return true;
        }
      }
    }

    // 6. Child / Sub-group resolution (general)
    // Note: If Current Assets, do NOT swallow ledgers that belong to Sundry Debtors, Bank, or Cash
    if (groupNameLower === 'current assets') {
      const isSpecialChild = 
        ledgerGroupName.includes('debtor') || 
        ledgerGroupName.includes('creditor') || 
        ledgerGroupName.includes('bank') || 
        ledgerGroupName.includes('cash') ||
        ledgerGroupId === 'g_debtors' ||
        ledgerGroupId === 'g_bank' ||
        ledgerGroupId === 'g_cash';

      if (isSpecialChild) {
        return false; // Displayed under their respective dedicated group cards
      }
    }

    if (groupNameLower === 'current liabilities') {
      const isSpecialChild = 
        ledgerGroupName.includes('creditor') || 
        ledgerGroupName.includes('supplier') || 
        ledgerGroupName.includes('vendor') || 
        ledgerGroupId === 'g_creditors';

      if (isSpecialChild) {
        return false; // Displayed under Sundry Creditors card
      }
    }

    const matchingRawGroup = rawGroups.find(g => g.id === ledgerGroupId);
    if (matchingRawGroup && matchingRawGroup.parent_id) {
      if (matchingRawGroup.parent_id === group.id || sameNamedGroupIds.includes(matchingRawGroup.parent_id)) {
        return true;
      }
    }

    return false;
  };

  // Filtered ledgers by search term
  const filteredLedgers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return ledgers;
    return ledgers.filter(l => 
      (l.name && l.name.toLowerCase().includes(term)) ||
      (l.alias && l.alias.toLowerCase().includes(term)) ||
      (l.group_name && l.group_name.toLowerCase().includes(term)) ||
      (l.ledger_groups?.name && l.ledger_groups.name.toLowerCase().includes(term)) ||
      (l.contact_phone && l.contact_phone.includes(term)) ||
      (l.primary_mobile && l.primary_mobile.includes(term))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [ledgers, search]);

  // Groups mapped with their respective ledgers
  const groupDataList = useMemo(() => {
    return groups.map(group => {
      const matchingLedgers = filteredLedgers
        .filter(l => isLedgerInGroup(l, group))
        .sort((a, b) => a.name.localeCompare(b.name));

      const totalBalance = matchingLedgers.reduce((sum, l) => {
        return sum + Number(l.current_balance ?? l.opening_balance ?? 0);
      }, 0);

      return {
        ...group,
        ledgers: matchingLedgers,
        count: matchingLedgers.length,
        totalBalance
      };
    });
  }, [groups, filteredLedgers, rawGroups]);

  // Filter groups according to search and nature tabs
  const displayGroups = useMemo(() => {
    return groupDataList.filter(g => {
      if (natureFilter !== 'all') {
        if (natureFilter === 'debtors') {
          const isDebtor = 
            g.name.toLowerCase().includes('debtor') || 
            g.name.toLowerCase().includes('receivable') || 
            g.name.toLowerCase().includes('customer') || 
            g.name.toLowerCase().includes('client') || 
            g.name.toLowerCase().includes('গ্রাহক') || 
            g.name.toLowerCase().includes('দেনাদার');
          if (!isDebtor) return false;
        }
        if (natureFilter === 'creditors') {
          const isCreditor = 
            g.name.toLowerCase().includes('creditor') || 
            g.name.toLowerCase().includes('payable') || 
            g.name.toLowerCase().includes('supplier') || 
            g.name.toLowerCase().includes('vendor') || 
            g.name.toLowerCase().includes('সরবরাহকারী') || 
            g.name.toLowerCase().includes('পাওনাদার');
          if (!isCreditor) return false;
        }
        if (['Asset', 'Liability', 'Income', 'Expense'].includes(natureFilter) && g.nature !== natureFilter) return false;
      }
      if (search.trim() !== '') {
        return g.count > 0;
      }
      return true;
    });
  }, [groupDataList, natureFilter, search]);

  const toggleGroupCollapse = (groupKey: string) => {
    setCollapsedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }));
  };

  const expandAll = () => {
    setCollapsedGroups({});
    soundService.play('click');
  };

  const collapseAll = () => {
    const allCollapsed: Record<string, boolean> = {};
    groups.forEach(g => {
      allCollapsed[g.name] = true;
    });
    setCollapsedGroups(allCollapsed);
    soundService.play('click');
  };

  // Helper for balance display and color coding
  const renderBalance = (ledger: any, groupName: string) => {
    const balance = Number(ledger.current_balance ?? ledger.opening_balance ?? 0);
    const gLower = groupName.toLowerCase();
    const isDebtor = gLower.includes('debtor');
    const isCreditor = gLower.includes('creditor');

    if (balance === 0) {
      return <span className="text-muted-foreground font-mono">0.00</span>;
    }

    let isDr = balance > 0;
    let badgeColor = 'text-emerald-500';
    
    if (isDebtor) {
      isDr = balance >= 0;
      badgeColor = isDr ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold';
    } else if (isCreditor) {
      isDr = balance > 0;
      badgeColor = balance <= 0 ? 'text-rose-500 font-bold' : 'text-emerald-500 font-bold';
    } else {
      badgeColor = isDr ? 'text-emerald-500' : 'text-rose-500';
    }

    return (
      <span className={cn("font-mono text-xs flex items-center justify-end gap-1.5", badgeColor)}>
        <span>{formatNumber(Math.abs(balance))}</span>
        <span className={cn(
          "text-[9px] px-1 py-0.2 rounded font-bold uppercase",
          isDr ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
        )}>
          {isDr ? 'Dr' : 'Cr'}
        </span>
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors text-[11px] overflow-hidden select-none">
      {/* Permanent Fixed Header */}
      <div className="flex-none bg-background/95 backdrop-blur-sm border-b border-border z-30 shadow-xs py-3 px-4 lg:px-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-primary shrink-0 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-foreground uppercase tracking-widest">
                  {isBn ? 'চার্ট অফ অ্যাকাউন্টস' : 'Chart of Accounts'}
                </h1>
                <span className="px-2 py-0.5 bg-muted text-muted-foreground border border-border/60 rounded-full text-[10px] font-bold">
                  {ledgers.length} {isBn ? 'টি লেজার' : 'Ledgers'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                {isBn ? 'হিসাব খাতের সম্পূর্ণ কাঠামো ও লেজার ব্যালেন্স' : 'Master account hierarchy & point-in-time balances'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="px-2.5 py-1.5 border border-border text-foreground hover:bg-muted text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title={isBn ? 'ডেটাবেজ থেকে রিফ্রেশ করুন' : 'Refresh from database'}
            >
              <RefreshCw className={cn("w-3.5 h-3.5", refreshing && "animate-spin text-primary")} />
              <span className="hidden sm:inline">{isBn ? 'রিফ্রেশ' : 'Refresh'}</span>
            </button>

            <button
              onClick={expandAll}
              className="px-2.5 py-1.5 border border-border text-foreground hover:bg-muted text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title={isBn ? 'সকল গ্রুপ খুলুন' : 'Expand All Groups'}
            >
              <span>{isBn ? 'সব প্রসারিত' : 'Expand All'}</span>
            </button>

            <button
              onClick={collapseAll}
              className="px-2.5 py-1.5 border border-border text-foreground hover:bg-muted text-[11px] font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
              title={isBn ? 'সকল গ্রুপ বন্ধ করুন' : 'Collapse All Groups'}
            >
              <span>{isBn ? 'সব সংকুচিত' : 'Collapse All'}</span>
            </button>

            <button
              onClick={() => navigate('/accounts/ledgers/create')}
              className="px-3 py-1.5 bg-primary text-primary-foreground hover:opacity-90 text-[11px] font-bold rounded-lg flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isBn ? 'নতুন লেজার' : 'New Ledger'}</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar Strip */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 pt-1">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder={isBn ? 'লেজারের নাম, গ্রুপ বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search ledgers by name, alias, group, or phone...'}
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-card border border-border text-foreground pl-10 pr-8 py-2 text-[11px] outline-none focus:border-primary transition-colors rounded-lg font-mono placeholder:text-muted-foreground"
              autoFocus
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Group Filter Tabs */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/50 self-start md:self-auto overflow-x-auto max-w-full">
            {[
              { id: 'all', label: isBn ? 'সকল' : 'All' },
              { id: 'debtors', label: isBn ? 'সান্ড্রি ডেটরস (গ্রাহক)' : 'Sundry Debtors', highlight: true },
              { id: 'creditors', label: isBn ? 'সান্ড্রি ক্রেডিটরস (সাপ্লায়ার)' : 'Sundry Creditors' },
              { id: 'Asset', label: isBn ? 'সম্পদ' : 'Assets' },
              { id: 'Liability', label: isBn ? 'দায়' : 'Liabilities' },
              { id: 'Income', label: isBn ? 'আয়' : 'Income' },
              { id: 'Expense', label: isBn ? 'ব্যয়' : 'Expense' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setNatureFilter(tab.id);
                  soundService.play('click');
                }}
                className={cn(
                  "px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer",
                  natureFilter === tab.id
                    ? tab.highlight 
                      ? "bg-emerald-600 text-white shadow-xs" 
                      : "bg-card text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 no-scrollbar">
        <div className="bg-card border border-border rounded-xl p-4 lg:p-6 shadow-xs">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <div className="text-xs text-muted-foreground uppercase tracking-widest">
                {t('accounts.loadingHierarchy')}
              </div>
            </div>
          ) : search.trim() ? (
            /* Flat search results view */
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest pb-2 border-b border-border flex items-center justify-between">
                <span>Search Results: {filteredLedgers.length} {isBn ? 'টি লেজার পাওয়া গেছে' : 'ledgers found'}</span>
                <span className="text-primary font-bold">"{search}"</span>
              </div>

              {filteredLedgers.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground uppercase tracking-widest">
                  {isBn ? 'কোনো লেজার খুঁজে পাওয়া যায়নি' : 'No matching ledgers found'}
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredLedgers.map(ledger => {
                    const groupName = ledger.group_name || ledger.ledger_groups?.name || 'General Accounts';
                    return (
                      <div 
                        key={ledger.id} 
                        className="flex flex-col sm:flex-row sm:items-center justify-between py-2.5 px-3 group hover:bg-muted/50 rounded-lg transition-colors gap-2"
                      >
                        <div className="flex items-center gap-3">
                          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                            <span 
                              onClick={() => navigate(`/reports/ledger-statement?ledgerId=${ledger.id}`)}
                              className="font-bold text-foreground hover:text-primary transition-colors cursor-pointer"
                            >
                              {ledger.name}
                            </span>
                            {ledger.alias && (
                              <span className="text-[9px] text-muted-foreground italic">({ledger.alias})</span>
                            )}
                            <span className="text-[9px] px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground font-semibold">
                              {groupName}
                            </span>
                            {ledger.primary_mobile && (
                              <span className="text-[9px] text-muted-foreground font-mono">
                                {ledger.primary_mobile}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-5 pl-6 sm:pl-0">
                          <div>
                            {renderBalance(ledger, groupName)}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate(`/reports/ledger-statement?ledgerId=${ledger.id}`)}
                              className="p-1.5 hover:bg-card border border-transparent hover:border-border text-muted-foreground hover:text-primary rounded transition-all cursor-pointer"
                              title={isBn ? 'লেজার স্টেটমেন্ট দেখুন' : 'View Ledger Statement'}
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => navigate(`/accounts/ledgers/edit/${ledger.id}`)}
                              className="p-1.5 hover:bg-card border border-transparent hover:border-border text-muted-foreground hover:text-foreground rounded transition-all cursor-pointer"
                              title={t('ledger.edit')}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Hierarchical Groups View */
            <div className="space-y-6">
              {displayGroups.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground uppercase tracking-widest">
                  {isBn ? 'এই ক্যাটাগরিতে কোনো গ্রুপ পাওয়া যায়নি' : 'No groups found under this category'}
                </div>
              ) : (
                displayGroups.map(group => {
                  const isCollapsed = !!collapsedGroups[group.name];
                  const isDebtorGroup = group.name.toLowerCase().includes('debtor');
                  const isCreditorGroup = group.name.toLowerCase().includes('creditor');

                  return (
                    <div 
                      key={group.id || group.name} 
                      className={cn(
                        "rounded-xl border transition-all",
                        isDebtorGroup 
                          ? "border-emerald-500/30 bg-emerald-500/5 shadow-xs" 
                          : isCreditorGroup 
                          ? "border-rose-500/30 bg-rose-500/5 shadow-xs" 
                          : "border-border/80 bg-background/50"
                      )}
                    >
                      {/* Sticky Group Header Banner */}
                      <div 
                        onClick={() => toggleGroupCollapse(group.name)}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 cursor-pointer select-none rounded-t-xl transition-colors",
                          isDebtorGroup ? "hover:bg-emerald-500/10" : isCreditorGroup ? "hover:bg-rose-500/10" : "hover:bg-muted/40"
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}

                          {isCollapsed ? (
                            <Folder className={cn("w-4 h-4", isDebtorGroup ? "text-emerald-500" : isCreditorGroup ? "text-rose-500" : "text-amber-500")} />
                          ) : (
                            <FolderOpen className={cn("w-4 h-4", isDebtorGroup ? "text-emerald-500" : isCreditorGroup ? "text-rose-500" : "text-amber-500")} />
                          )}

                          <span className={cn(
                            "font-bold text-xs uppercase tracking-wider",
                            isDebtorGroup ? "text-emerald-600 dark:text-emerald-400" : isCreditorGroup ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                          )}>
                            {group.name}
                          </span>

                          <span className="text-[9px] text-muted-foreground font-normal tracking-wider">
                            ({group.nature})
                          </span>

                          <span className={cn(
                            "text-[9px] px-2 py-0.5 rounded-full font-bold",
                            group.count > 0 
                              ? isDebtorGroup 
                                ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30" 
                                : "bg-muted text-foreground border border-border"
                              : "bg-muted/40 text-muted-foreground"
                          )}>
                            {group.count} {isBn ? 'টি লেজার' : 'Ledgers'}
                          </span>
                        </div>

                        {/* Group Balance Summary */}
                        <div className="flex items-center gap-3">
                          {group.count > 0 && (
                            <div className="text-[11px] font-mono">
                              <span className="text-[10px] text-muted-foreground mr-1.5 uppercase tracking-wider">
                                {isBn ? 'মোট ব্যালেন্স:' : 'Total:'}
                              </span>
                              <span className={cn(
                                "font-bold",
                                isDebtorGroup 
                                  ? (group.totalBalance >= 0 ? "text-emerald-500" : "text-rose-500") 
                                  : isCreditorGroup 
                                  ? (group.totalBalance <= 0 ? "text-rose-500" : "text-emerald-500") 
                                  : "text-foreground"
                              )}>
                                {formatNumber(Math.abs(group.totalBalance))} {group.totalBalance >= 0 ? 'Dr' : 'Cr'}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/accounts/ledgers/create?group_id=${group.id}`);
                            }}
                            className="p-1 hover:bg-card border border-transparent hover:border-border rounded text-muted-foreground hover:text-foreground transition-all"
                            title={isBn ? 'এই গ্রুপে নতুন লেজার তৈরি করুন' : 'Add ledger to this group'}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Group Ledgers Body */}
                      {!isCollapsed && (
                        <div className="border-t border-border/50 px-4 py-2 bg-card/40 rounded-b-xl">
                          {group.ledgers.length === 0 ? (
                            <div className="text-[10px] text-muted-foreground italic uppercase tracking-wider py-2 pl-6">
                              {t('accounts.noLedgersInGroup')}
                            </div>
                          ) : (
                            <div className="divide-y divide-border/30 pl-4">
                              {group.ledgers.map((ledger: any) => (
                                <div 
                                  key={ledger.id} 
                                  className="flex flex-col sm:flex-row sm:items-center justify-between py-2 group hover:bg-foreground/5 px-2.5 -ml-2 rounded-lg transition-colors gap-2"
                                >
                                  <div className="flex items-center gap-3 text-muted-foreground text-[11px] group-hover:text-foreground transition-colors">
                                    <FileText className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2.5">
                                      <span 
                                        onClick={() => navigate(`/reports/ledger-statement?ledgerId=${ledger.id}`)}
                                        className="font-bold sm:font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                                      >
                                        {ledger.name}
                                      </span>
                                      {ledger.alias && (
                                        <span className="text-[9px] text-muted-foreground italic">({ledger.alias})</span>
                                      )}
                                      {ledger.contact_phone && (
                                        <span className="text-[9px] text-muted-foreground font-mono">
                                          {ledger.contact_phone}
                                        </span>
                                      )}
                                      {ledger.credit_limit > 0 && (
                                        <span className="text-[8px] px-1.5 py-0.2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-mono">
                                          Limit: {formatNumber(ledger.credit_limit)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between sm:justify-end gap-5 pl-6 sm:pl-0">
                                    <div>
                                      {renderBalance(ledger, group.name)}
                                    </div>

                                    <div className="flex items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                        onClick={() => navigate(`/reports/ledger-statement?ledgerId=${ledger.id}`)}
                                        className="p-1 bg-card border border-border text-muted-foreground hover:text-primary hover:border-primary rounded transition-all cursor-pointer"
                                        title={isBn ? 'লেজার স্টেটমেন্ট দেখুন' : 'View Ledger Statement'}
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                      </button>
                                      <button 
                                        onClick={() => navigate(`/accounts/ledgers/edit/${ledger.id}`)}
                                        className="p-1 bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground rounded transition-all cursor-pointer"
                                        title={t('ledger.edit')}
                                      >
                                        <Edit2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
