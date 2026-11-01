import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Search, 
  Printer, 
  Download, 
  ArrowLeft, 
  Loader2, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  Filter,
  Layers,
  Sparkles
} from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { ReportPrintHeader, ReportPrintFooter } from './ReportPrintHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';
import { DateInput } from './DateInput';

export function GroupSummary() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const isBn = language === 'bn';
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>(searchParams.get('groupId') || '');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Toggles requested by user:
  // 1. showZeroBalance: initial false (prathomik vabe 0.00 balance ledgers dekhabe na)
  const [showZeroBalance, setShowZeroBalance] = useState<boolean>(false);
  // 2. showNegativeOnly: initial false (ey option theke sudhu negative Ledgers Dekha jabe)
  const [showNegativeOnly, setShowNegativeOnly] = useState<boolean>(false);

  const [startDate, setStartDate] = useState(
    searchParams.get('from') || 
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA')
  );
  const [endDate, setEndDate] = useState(
    searchParams.get('to') || 
    new Date().toLocaleDateString('en-CA')
  );
  const [ledgers, setLedgers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchGroups() {
      if (!user?.companyId) return;
      try {
        const data = await erpService.getLedgerGroups(user.companyId);
        const unique = Array.from(new Map<string, any>(data.map((g: any) => [g.name.trim().toLowerCase(), g])).values());
        setGroups(unique);
        
        const paramGroupId = searchParams.get('groupId');
        const paramGroupName = searchParams.get('groupName');
        
        if (paramGroupId && unique.some(g => g.id === paramGroupId)) {
          setSelectedGroup(paramGroupId);
        } else if (paramGroupName) {
          const group = unique.find(g => g.name.toLowerCase() === paramGroupName.toLowerCase());
          if (group) setSelectedGroup(group.id);
          else if (unique.length > 0) setSelectedGroup(unique[0].id);
        } else if (unique.length > 0 && !selectedGroup) {
          setSelectedGroup(unique[0].id);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, [user?.companyId]);

  useEffect(() => {
    async function fetchLedgers() {
      if (!user?.companyId || !selectedGroup) return;
      setLoading(true);
      try {
        const data = await erpService.getGroupSummary(user.companyId, selectedGroup, startDate, endDate);
        setLedgers(data);
      } catch (err) {
        console.error('Error fetching ledgers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedgers();
  }, [user?.companyId, selectedGroup, startDate, endDate]);

  const selectedGroupObj = useMemo(() => {
    return groups.find(g => g.id === selectedGroup);
  }, [groups, selectedGroup]);

  const groupNameLower = useMemo(() => {
    return (selectedGroupObj?.name || '').toLowerCase().trim();
  }, [selectedGroupObj]);

  const isLiabilityOrIncomeGroup = useMemo(() => {
    const nature = selectedGroupObj?.nature;
    return nature === 'Liability' || 
           nature === 'Income' || 
           groupNameLower.includes('creditor') || 
           groupNameLower.includes('payable') || 
           groupNameLower.includes('liability');
  }, [selectedGroupObj, groupNameLower]);

  const isDebtorGroup = useMemo(() => {
    const nature = selectedGroupObj?.nature;
    return nature === 'Asset' || 
           groupNameLower.includes('debtor') || 
           groupNameLower.includes('receivable');
  }, [selectedGroupObj, groupNameLower]);

  // Evaluates whether a ledger has an abnormal / negative balance according to accounting truth
  const checkIsNegative = (l: any): boolean => {
    const bal = l.closingBalance ?? l.current_balance ?? 0;
    if (Math.abs(bal) < 0.005) return false;

    // For Liabilities / Creditors: normal is Credit (< 0). So Debit (> 0) is abnormal/negative.
    if (isLiabilityOrIncomeGroup) {
      return bal > 0;
    }

    // For Assets / Debtors: normal is Debit (> 0). So Credit (< 0) is abnormal/negative.
    if (isDebtorGroup) {
      return bal < 0;
    }

    // Fallback: check ledger groups nature or signed balance
    const lNature = l.ledger_groups?.nature;
    if (lNature === 'Liability' || lNature === 'Income') {
      return bal > 0;
    } else {
      return bal < 0;
    }
  };

  // Metrics computation for active group
  const metrics = useMemo(() => {
    const totalCount = ledgers.length;
    let zeroCount = 0;
    let activeCount = 0;
    let negativeCount = 0;

    ledgers.forEach(l => {
      const bal = l.closingBalance ?? l.current_balance ?? 0;
      const isZero = Math.abs(bal) < 0.005;
      if (isZero) {
        zeroCount++;
      } else {
        activeCount++;
      }
      if (checkIsNegative(l)) {
        negativeCount++;
      }
    });

    return { totalCount, zeroCount, activeCount, negativeCount };
  }, [ledgers, isLiabilityOrIncomeGroup, isDebtorGroup]);

  // Filtered ledgers based on search, showZeroBalance, and showNegativeOnly
  const filteredLedgers = useMemo(() => {
    return ledgers
      .filter(l => {
        const bal = l.closingBalance ?? l.current_balance ?? 0;
        const isZero = Math.abs(bal) < 0.005;
        const isNeg = checkIsNegative(l);

        // When showNegativeOnly is true: strictly show only negative ledgers
        if (showNegativeOnly) {
          return isNeg;
        }

        // When showZeroBalance is false (default): hide 0.00 closing balance ledgers
        if (!showZeroBalance && isZero) {
          return false;
        }

        return true;
      })
      .filter(l => (l.name || '').toLowerCase().includes(searchTerm.toLowerCase().trim()))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [ledgers, showZeroBalance, showNegativeOnly, searchTerm, isLiabilityOrIncomeGroup, isDebtorGroup]);

  const totalOpening = useMemo(() => {
    return filteredLedgers.reduce((sum, l) => sum + (l.openingBalance || 0), 0);
  }, [filteredLedgers]);

  const totalDebit = useMemo(() => {
    return filteredLedgers.reduce((sum, l) => sum + (l.debit || 0), 0);
  }, [filteredLedgers]);

  const totalCredit = useMemo(() => {
    return filteredLedgers.reduce((sum, l) => sum + (l.credit || 0), 0);
  }, [filteredLedgers]);

  const totalClosing = useMemo(() => {
    return filteredLedgers.reduce((sum, l) => sum + (l.closingBalance ?? l.current_balance ?? 0), 0);
  }, [filteredLedgers]);

  const handlePrint = () => {
    printUtils.printElement('group-summary-report', `Group Summary Report - ${selectedGroupObj?.name || 'Report'}`);
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('group-summary-report', `Group_Summary_${selectedGroupObj?.name?.replace(/\s+/g, '_') || 'Report'}`);
  };

  if (loading && groups.length === 0) {
    return <SkeletonLoader type="table" />;
  }

  return (
    <div className="flex flex-col min-h-full bg-background font-mono transition-colors">
      {/* 1. Permanent Fixed Page Header Section */}
      <div className="sticky top-0 bg-background border-b border-border shadow-xs px-4 lg:px-6 py-3.5 space-y-4 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-xl transition-colors cursor-pointer text-muted-foreground hover:text-foreground"
              title={isBn ? "পূর্বের পেজে ফিরে যান" : "Go Back"}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <EditableHeader 
                  pageId="group_summary"
                  defaultTitle={isBn ? "গ্রুপ সামারি রিপোর্ট" : "Group Summary"}
                  className="text-base sm:text-lg font-bold tracking-tight text-foreground uppercase"
                />
                {selectedGroupObj && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                    {selectedGroupObj.name}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                {selectedGroupObj?.name || ''} ({startDate} {isBn ? "থেকে" : "to"} {endDate})
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            <div className="flex items-center gap-2">
              <DateInput
                label={isBn ? "শুরু" : "From"}
                value={startDate}
                onChange={setStartDate}
                className="w-28 sm:w-32"
              />
              <DateInput
                label={isBn ? "শেষ" : "To"}
                value={endDate}
                onChange={setEndDate}
                className="w-28 sm:w-32"
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded-lg border border-border bg-card hover:bg-muted text-foreground transition-all grow sm:grow-0 justify-center shadow-2xs cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t('common.print')}</span>
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase rounded-lg text-white bg-primary hover:opacity-90 transition-all grow sm:grow-0 justify-center shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('common.downloadPdf')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Permanent Sticky Filter & Toggle Strip */}
        <div className="pt-2 border-t border-border/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Quick Metrics & Filter Badges */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setShowNegativeOnly(false);
                setShowZeroBalance(false);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                !showNegativeOnly && !showZeroBalance
                  ? "bg-foreground text-background border-foreground shadow-2xs"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <span>{isBn ? "অ্যাক্টিভ লেজার" : "Active Ledgers"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-mono font-bold">
                {metrics.activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNegativeOnly(false);
                setShowZeroBalance(true);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                showZeroBalance && !showNegativeOnly
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-muted/40 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              <span>{isBn ? "সকল লেজার (মোট)" : "All Ledgers"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-mono font-bold">
                {metrics.totalCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowNegativeOnly(!showNegativeOnly);
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer",
                showNegativeOnly
                  ? "bg-amber-600 text-white border-amber-600 shadow-2xs animate-pulse"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              )}
              title={isBn ? "শুধু নেগেটিভ ও অস্বাভাবিক ব্যালেন্স লেজার দেখুন" : "View abnormal/negative balance ledgers only"}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{isBn ? "নেগেটিভ লেজার" : "Negative Ledgers"}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20 text-white font-mono font-bold">
                {metrics.negativeCount}
              </span>
            </button>
          </div>

          {/* Interactive Checkbox Options */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* 1. Show Reports with 0.00 Balance Ledgers Option */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-foreground hover:text-primary transition-colors">
              <input
                type="checkbox"
                checked={showZeroBalance}
                onChange={(e) => {
                  setShowZeroBalance(e.target.checked);
                  if (e.target.checked && showNegativeOnly) {
                    setShowNegativeOnly(false);
                  }
                }}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary"
              />
              <span className="text-[11px] font-bold">
                {isBn ? "0.00 ব্যালেন্স সহ লেজার দেখুন" : "Show Reports with 0.00 Balance Ledgers"}
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted text-muted-foreground border border-border">
                {metrics.zeroCount}
              </span>
            </label>

            {/* 2. Show Negative Ledgers Only Option */}
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-foreground hover:text-amber-600 transition-colors">
              <input
                type="checkbox"
                checked={showNegativeOnly}
                onChange={(e) => setShowNegativeOnly(e.target.checked)}
                className="w-4 h-4 rounded border-border text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
              />
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                {isBn ? "শুধু নেগেটিভ লেজার দেখুন (Negative Only)" : "Show Negative Ledgers Only"}
              </span>
              {metrics.negativeCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  {metrics.negativeCount}
                </span>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Data Section Below Header */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Column: Select Group Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden sticky top-4">
                <div className="px-4 py-3 border-b border-border bg-muted/40 font-bold uppercase tracking-widest text-[10px] text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>{isBn ? "গ্রুপ নির্বাচন করুন" : "Select Group"}</span>
                  </span>
                  <span className="text-[9px] font-mono text-muted-foreground">
                    {groups.length} {isBn ? "টি" : "groups"}
                  </span>
                </div>
                
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-220px)] overflow-y-auto divide-y divide-border/50 no-scrollbar">
                  {groups.sort((a,b) => a.name.localeCompare(b.name)).map(group => {
                    const isSelected = selectedGroup === group.id;
                    const isCred = group.name.toLowerCase().includes('creditor');
                    const isDebt = group.name.toLowerCase().includes('debtor');

                    return (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroup(group.id)}
                        className={cn(
                          "w-full px-4 py-2.5 text-left text-[11px] uppercase tracking-wider transition-all flex items-center justify-between hover:bg-muted/60 cursor-pointer",
                          isSelected ? "bg-primary/10 text-primary font-bold border-l-4 border-primary pl-3" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex flex-col truncate pr-2">
                          <span className="truncate">{group.name}</span>
                          <span className="text-[9px] font-mono text-muted-foreground lowercase opacity-70">
                            {group.nature || 'group'}
                          </span>
                        </div>
                        {isSelected && <ChevronRight className="w-4 h-4 shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Column: Search & Ledgers Table */}
            <div className="lg:col-span-3 space-y-4">
              {/* Search Bar & Active Filter Feedback Banner */}
              <div className="bg-card p-3 rounded-xl border border-border shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={isBn ? "লেজারের নাম দিয়ে ফিল্টার করুন..." : "Search ledgers by name..."}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-lg text-foreground text-xs outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all uppercase tracking-wider font-mono"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    {isBn ? "প্রদর্শিত:" : "Showing:"}{' '}
                    <strong className="text-foreground">{filteredLedgers.length}</strong>{' '}
                    {isBn ? "টি লেজার" : "ledgers"}
                  </span>
                  {(showZeroBalance || showNegativeOnly || searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowZeroBalance(false);
                        setShowNegativeOnly(false);
                        setSearchTerm('');
                      }}
                      className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={isBn ? "সব ফিল্টার রিসেট করুন" : "Reset all filters"}
                    >
                      {isBn ? "রিসেট" : "Reset"}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Note When Filter is Active */}
              {showNegativeOnly && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-300 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      {isBn 
                        ? `নেগেটিভ লেজার ফিল্টার সক্রিয়: এখানে শুধুমাত্র ${selectedGroupObj?.name || 'গ্রুপের'} অস্বাভাবিক বা নেগেটিভ ব্যালেন্সের লেজার দেখানো হচ্ছে।`
                        : `Negative Ledgers Filter Active: Showing only ledgers with abnormal / negative balances for ${selectedGroupObj?.name || 'this group'}.`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNegativeOnly(false)}
                    className="underline text-[11px] font-bold ml-2 hover:text-amber-950 dark:hover:text-amber-100 cursor-pointer shrink-0"
                  >
                    {isBn ? "সব দেখুন" : "View All"}
                  </button>
                </div>
              )}

              {/* Table Report Container */}
              <div id="group-summary-report" className="bg-card rounded-xl border border-border shadow-xs overflow-hidden print:p-8 print:border-none print:shadow-none min-h-[400px]">
                <ReportPrintHeader 
                  title={`${selectedGroupObj?.name || 'Group'} Summary Report`} 
                  subtitle={`${startDate} to ${endDate} ${showNegativeOnly ? '(Negative Ledgers Only)' : showZeroBalance ? '(Including 0.00 Balances)' : ''}`} 
                />
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border-separate border-spacing-0">
                    {/* Sticky Table Header */}
                    <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur-xs">
                      <tr className="bg-muted/50 border-b border-border">
                        <th 
                          className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground border-b border-border"
                          style={{ verticalAlign: 'middle' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{isBn ? "লেজারের নাম" : "Ledger Name"}</span>
                          </div>
                        </th>
                        <th 
                          className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground text-right border-b border-border"
                          style={{ verticalAlign: 'middle' }}
                        >
                          {isBn ? "প্রারম্ভিক (Opening)" : "Opening"}
                        </th>
                        <th 
                          className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 text-right border-b border-border"
                          style={{ verticalAlign: 'middle' }}
                        >
                          {isBn ? "ডেবিট (Debit)" : "Debit"}
                        </th>
                        <th 
                          className="px-4 py-3 text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 text-right border-b border-border"
                          style={{ verticalAlign: 'middle' }}
                        >
                          {isBn ? "ক্রেডিট (Credit)" : "Credit"}
                        </th>
                        <th 
                          className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-foreground text-right border-b border-border"
                          style={{ verticalAlign: 'middle' }}
                        >
                          {isBn ? "সমাপনী (Closing)" : "Closing"}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-border/50 text-foreground">
                      {loading ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center" style={{ verticalAlign: 'middle' }}>
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-primary" />
                              <span className="text-xs text-muted-foreground">
                                {isBn ? "লেজার তথ্য লোড হচ্ছে..." : "Loading group ledger summary..."}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : filteredLedgers.length > 0 ? (
                        filteredLedgers.map((l) => {
                          const op = l.openingBalance || 0;
                          const opAbs = Math.abs(op);
                          const opIsZero = opAbs < 0.005;
                          const opIsDr = op > 0;

                          const cl = l.closingBalance ?? l.current_balance ?? 0;
                          const clAbs = Math.abs(cl);
                          const clIsZero = clAbs < 0.005;
                          const clIsDr = cl > 0;
                          const isNeg = checkIsNegative(l);

                          return (
                            <tr 
                              key={l.id} 
                              className={cn(
                                "hover:bg-muted/40 transition-colors cursor-pointer group",
                                isNeg && "bg-amber-500/5 hover:bg-amber-500/10",
                                clIsZero && "opacity-80"
                              )}
                              onClick={() => navigate(`/reports/ledger?ledgerId=${l.id}`)}
                            >
                              {/* Ledger Name & Tags */}
                              <td className="px-5 py-3.5 text-xs text-foreground font-bold tracking-tight" style={{ verticalAlign: 'middle' }}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="truncate group-hover:text-primary transition-colors font-medium">
                                      {l.name}
                                    </span>
                                    {isNeg && (
                                      <span 
                                        className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5 shrink-0"
                                        title={
                                          isLiabilityOrIncomeGroup
                                            ? (isBn ? "অস্বাভাবিক ব্যালেন্স: পাওনাদারের নিকট ডেবিট ব্যালেন্স (অগ্রিম প্রদান)" : "Abnormal balance: Debit balance for vendor / creditor")
                                            : (isBn ? "অস্বাভাবিক ব্যালেন্স: দেনাদারের ক্রেডিট ব্যালেন্স (অগ্রিম গ্রহণ)" : "Abnormal balance: Credit balance for customer / debtor")
                                        }
                                      >
                                        <AlertTriangle className="w-2.5 h-2.5" />
                                        <span>{isBn ? "নেগেটিভ" : "Negative"}</span>
                                      </span>
                                    )}
                                    {clIsZero && (
                                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono text-muted-foreground bg-muted border border-border shrink-0">
                                        0.00
                                      </span>
                                    )}
                                  </div>

                                  {l.group_name && l.group_name.toLowerCase().trim() !== groupNameLower && (
                                    <span className="text-[9px] font-mono text-muted-foreground hidden sm:inline-block px-1.5 py-0.2 rounded bg-muted/40 shrink-0">
                                      {l.group_name}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Opening Balance */}
                              <td className="px-4 py-3.5 text-xs font-mono text-right" style={{ verticalAlign: 'middle' }}>
                                {!opIsZero ? (
                                  <span className={cn(
                                    opIsDr ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"
                                  )}>
                                    {formatCurrency(opAbs)} {opIsDr ? 'Dr' : 'Cr'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/60">-</span>
                                )}
                              </td>

                              {/* Debit */}
                              <td className="px-4 py-3.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono text-right font-semibold" style={{ verticalAlign: 'middle' }}>
                                {l.debit !== 0 ? formatCurrency(l.debit) : (
                                  <span className="text-muted-foreground/60">-</span>
                                )}
                              </td>

                              {/* Credit */}
                              <td className="px-4 py-3.5 text-xs text-rose-600 dark:text-rose-400 font-mono text-right font-semibold" style={{ verticalAlign: 'middle' }}>
                                {l.credit !== 0 ? formatCurrency(l.credit) : (
                                  <span className="text-muted-foreground/60">-</span>
                                )}
                              </td>

                              {/* Closing Balance (Dr is Green, Cr is Red per rule) */}
                              <td className="px-5 py-3.5 text-xs font-bold font-mono text-right" style={{ verticalAlign: 'middle' }}>
                                {!clIsZero ? (
                                  <span className={cn(
                                    clIsDr ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                  )}>
                                    {formatCurrency(clAbs)} {clIsDr ? 'Dr' : 'Cr'}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground font-normal">
                                    {formatCurrency(0)}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground text-xs" style={{ verticalAlign: 'middle' }}>
                            <div className="max-w-md mx-auto space-y-2">
                              <p className="font-semibold text-foreground">
                                {showNegativeOnly 
                                  ? (isBn ? "এই গ্রুপে কোনো নেগেটিভ লেজার নেই।" : "No negative ledgers found in this group.")
                                  : (isBn ? "কোনো লেজার পাওয়া যায়নি।" : "No ledgers found for the selected criteria.")}
                              </p>
                              {!showZeroBalance && metrics.zeroCount > 0 && !showNegativeOnly && (
                                <p className="text-[11px] text-muted-foreground">
                                  {isBn
                                    ? `এই গ্রুপে ${metrics.zeroCount}টি লেজারের ব্যালেন্স 0.00 রয়েছে। সেগুলো দেখতে উপরের "0.00 ব্যালেন্স সহ লেজার দেখুন" অপশনটি চালু করুন।`
                                    : `There are ${metrics.zeroCount} ledgers with 0.00 balance in this group. Turn on "Show Reports with 0.00 Balance Ledgers" above to view them.`}
                                </p>
                              )}
                              {(showZeroBalance || showNegativeOnly) && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowZeroBalance(true);
                                    setShowNegativeOnly(false);
                                  }}
                                  className="mt-2 px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg cursor-pointer"
                                >
                                  {isBn ? "সকল লেজার প্রদর্শন করুন" : "Show All Ledgers"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>

                    {/* Sticky Table Footer */}
                    {filteredLedgers.length > 0 && (
                      <tfoot className="sticky bottom-0 bg-card/95 backdrop-blur-xs border-t-2 border-border shadow-xs">
                        <tr className="bg-muted/60 font-bold">
                          <td className="px-5 py-3.5 text-right text-[11px] uppercase tracking-wider text-foreground" style={{ verticalAlign: 'middle' }}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-muted-foreground font-mono font-normal">
                                {filteredLedgers.length} {isBn ? "টি লেজার" : "records"}
                              </span>
                              <span>{isBn ? "সর্বমোট (Grand Total)" : "Grand Total"}</span>
                            </div>
                          </td>
                          
                          {/* Total Opening */}
                          <td className="px-4 py-3.5 text-right font-mono text-xs text-foreground" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(Math.abs(totalOpening))} {totalOpening >= 0 ? 'Dr' : 'Cr'}
                          </td>

                          {/* Total Debit */}
                          <td className="px-4 py-3.5 text-right text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(totalDebit)}
                          </td>

                          {/* Total Credit */}
                          <td className="px-4 py-3.5 text-right text-rose-600 dark:text-rose-400 font-mono text-xs font-bold" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(totalCredit)}
                          </td>

                          {/* Total Closing */}
                          <td className="px-5 py-3.5 text-right font-mono text-xs font-bold" style={{ verticalAlign: 'middle' }}>
                            <span className={cn(
                              totalClosing >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                              {formatCurrency(Math.abs(totalClosing))} {totalClosing >= 0 ? 'Dr' : 'Cr'}
                            </span>
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <ReportPrintFooter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
