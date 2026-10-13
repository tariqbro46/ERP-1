import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search as SearchIcon, 
  ArrowLeft, 
  ArrowRight, 
  Receipt, 
  Users, 
  Package, 
  Sparkles, 
  Info, 
  HelpCircle, 
  SlidersHorizontal, 
  TrendingUp, 
  Clock, 
  Database, 
  CheckCircle2, 
  ChevronRight, 
  ExternalLink, 
  BookOpen,
  Filter,
  DollarSign,
  Hash,
  FileText,
  Tag,
  Check
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { erpService } from '../services/erpService';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'voucher' | 'ledger' | 'item' | 'employee';
  category: string;
  metadata: any;
  matchedFields?: string[];
  matchBadges?: { label: string; text: string; category: string }[];
}

const MATCH_CRITERIA_OPTIONS = [
  { id: 'all', label: 'All Matches', desc: 'All matching records', icon: Sparkles },
  { id: 'amount', label: 'Amount', desc: 'Financial values & totals', icon: DollarSign },
  { id: 'serial_no', label: 'Serial No', desc: 'Voucher serial numbers', icon: Hash },
  { id: 'voucher_no', label: 'Voucher / Ref No', desc: 'Invoice, ref & voucher numbers', icon: Receipt },
  { id: 'party', label: 'Party / Ledger', desc: 'Account & party names', icon: Users },
  { id: 'narration', label: 'Narration / Details', desc: 'Remarks & particulars', icon: FileText },
  { id: 'item', label: 'Stock Item', desc: 'Product names, codes & inventory', icon: Package },
  { id: 'other', label: 'Date & Other', desc: 'Dates, instruments & banking', icon: Clock },
] as const;

// Highlight helper for search keyword in text strings
const highlightMatch = (text: string, query: string): React.ReactNode => {
  if (!text || !query || query.trim().length === 0) return text;
  const q = query.trim().toLowerCase();
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q);
  if (idx === -1) return text;

  const before = text.substring(0, idx);
  const match = text.substring(idx, idx + q.length);
  const after = text.substring(idx + q.length);

  return (
    <>
      {before}
      <mark className="bg-amber-200 text-amber-950 font-bold px-1 py-0.5 rounded shadow-xs">
        {match}
      </mark>
      {highlightMatch(after, query)}
    </>
  );
};

const getBadgeStyle = (category: string) => {
  switch (category) {
    case 'amount':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100';
    case 'serial_no':
      return 'bg-indigo-50 text-indigo-800 border-indigo-200 hover:bg-indigo-100';
    case 'voucher_no':
      return 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100';
    case 'party':
      return 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100';
    case 'narration':
      return 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100';
    case 'item':
      return 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';
  }
};

interface SearchSessionCache {
  companyId: string;
  inputValue: string;
  lastSearchedQuery: string;
  results: SearchResult[];
  activeTab: 'all' | 'voucher' | 'ledger' | 'item' | 'employee';
  selectedMatchFilter: string;
}

let inMemorySearchCache: SearchSessionCache | null = null;
const SEARCH_STORAGE_KEY = 'sapient_search_page_cache';

const loadSearchCache = (currentCompanyId?: string): SearchSessionCache | null => {
  try {
    if (inMemorySearchCache) {
      if (!currentCompanyId || inMemorySearchCache.companyId === currentCompanyId) {
        return inMemorySearchCache;
      }
    }
    const raw = sessionStorage.getItem(SEARCH_STORAGE_KEY);
    if (raw) {
      const parsed: SearchSessionCache = JSON.parse(raw);
      if (!currentCompanyId || parsed.companyId === currentCompanyId) {
        inMemorySearchCache = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load search cache:', e);
  }
  return null;
};

const saveSearchCache = (data: SearchSessionCache) => {
  try {
    inMemorySearchCache = data;
    sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save search cache:', e);
  }
};

const updateSearchCache = (patch: Partial<SearchSessionCache>) => {
  try {
    if (inMemorySearchCache) {
      inMemorySearchCache = { ...inMemorySearchCache, ...patch };
      sessionStorage.setItem(SEARCH_STORAGE_KEY, JSON.stringify(inMemorySearchCache));
    }
  } catch (e) {
    console.error('Failed to update search cache:', e);
  }
};

const clearSearchCache = () => {
  try {
    inMemorySearchCache = null;
    sessionStorage.removeItem(SEARCH_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear search cache:', e);
  }
};

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { company } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();

  // Load existing search cache if available for this company
  const initialCache = loadSearchCache(company?.id);
  const [inputValue, setInputValue] = useState(initialCache?.inputValue || searchParams.get('q') || '');
  const [lastSearchedQuery, setLastSearchedQuery] = useState(initialCache?.lastSearchedQuery || '');
  const [results, setResults] = useState<SearchResult[]>(initialCache?.results || []);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'voucher' | 'ledger' | 'item' | 'employee'>(initialCache?.activeTab || 'all');
  const [selectedMatchFilter, setSelectedMatchFilter] = useState<string>(initialCache?.selectedMatchFilter || 'all');

  const searchPageUiStyle = settings?.searchPageUiStyle || 'classic';

  const handleTabSelect = (tab: 'all' | 'voucher' | 'ledger' | 'item' | 'employee') => {
    setActiveTab(tab);
    updateSearchCache({ activeTab: tab });
  };

  const handleMatchFilterSelect = (filterId: string) => {
    setSelectedMatchFilter(filterId);
    updateSearchCache({ selectedMatchFilter: filterId });
  };

  const executeSearch = async (term: string, keepMatchFilter = false) => {
    const trimmed = term.trim();
    if (!trimmed) {
      handleClear();
      return;
    }

    setLoading(true);
    setLastSearchedQuery(trimmed);
    const newFilter = keepMatchFilter ? selectedMatchFilter : 'all';
    if (!keepMatchFilter) {
      setSelectedMatchFilter('all');
    }
    setSearchParams({ q: trimmed }, { replace: true });

    try {
      const data = await erpService.searchCompanyData(company?.id || '', trimmed);
      const searchData = (data || []) as SearchResult[];
      setResults(searchData);

      saveSearchCache({
        companyId: company?.id || '',
        inputValue: term,
        lastSearchedQuery: trimmed,
        results: searchData,
        activeTab,
        selectedMatchFilter: newFilter,
      });
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Re-sync with company cache or URL parameter on mount/navigation back
  useEffect(() => {
    if (!company?.id) return;
    const cached = loadSearchCache(company.id);
    if (cached && cached.lastSearchedQuery) {
      if (results.length === 0 || lastSearchedQuery !== cached.lastSearchedQuery) {
        setInputValue(cached.inputValue);
        setLastSearchedQuery(cached.lastSearchedQuery);
        setResults(cached.results);
        setActiveTab(cached.activeTab);
        setSelectedMatchFilter(cached.selectedMatchFilter);
        setSearchParams({ q: cached.lastSearchedQuery }, { replace: true });
      }
      return;
    }

    const q = searchParams.get('q');
    if (q && q.trim() && !lastSearchedQuery && results.length === 0) {
      setInputValue(q.trim());
      executeSearch(q.trim());
    }
  }, [company?.id]);

  // Strictly execute search ONLY when Enter key is pressed or Search button is clicked
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeSearch(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setLastSearchedQuery('');
    setResults([]);
    setSelectedMatchFilter('all');
    setSearchParams({}, { replace: true });
    clearSearchCache();
  };

  // Dynamic calculation of counts for each match criteria category
  const matchCounts = useMemo(() => {
    const counts: Record<string, number> = { all: 0 };
    MATCH_CRITERIA_OPTIONS.forEach(opt => { counts[opt.id] = 0; });
    
    const entityFiltered = results.filter(r => activeTab === 'all' || r.type === activeTab);
    counts.all = entityFiltered.length;
    
    entityFiltered.forEach(r => {
      if (Array.isArray(r.matchedFields)) {
        r.matchedFields.forEach(f => {
          if (counts[f] !== undefined) {
            counts[f] = (counts[f] || 0) + 1;
          }
        });
      }
    });
    return counts;
  }, [results, activeTab]);

  // Combined filtering: by entity type tab AND by selected match field
  const filteredResults = useMemo(() => {
    return results.filter(r => {
      if (activeTab !== 'all' && r.type !== activeTab) return false;
      if (selectedMatchFilter !== 'all') {
        return Array.isArray(r.matchedFields) && r.matchedFields.includes(selectedMatchFilter);
      }
      return true;
    });
  }, [results, activeTab, selectedMatchFilter]);

  const handleSelect = (result: SearchResult) => {
    // Preserve full search state before navigating away
    saveSearchCache({
      companyId: company?.id || '',
      inputValue,
      lastSearchedQuery,
      results,
      activeTab,
      selectedMatchFilter,
    });

    switch (result.type) {
      case 'voucher':
        navigate(`/vouchers/view/${result.id}`);
        break;
      case 'ledger':
        navigate(`/reports/ledger?ledgerId=${result.id}`);
        break;
      case 'item':
        navigate(`/inventory/items/edit/${result.id}`);
        break;
      case 'employee':
        navigate(`/employees`);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'voucher': return Receipt;
      case 'employee': return Users;
      case 'item': return Package;
      default: return SearchIcon;
    }
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'voucher':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-100',
          iconBg: 'bg-emerald-100 text-emerald-800',
          hoverBg: 'hover:border-emerald-300 hover:shadow-emerald-50/10'
        };
      case 'ledger':
        return {
          bg: 'bg-blue-50 text-blue-700 border-blue-100',
          iconBg: 'bg-blue-100 text-blue-800',
          hoverBg: 'hover:border-blue-300 hover:shadow-blue-50/10'
        };
      case 'item':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-100',
          iconBg: 'bg-amber-100 text-amber-800',
          hoverBg: 'hover:border-amber-300 hover:shadow-amber-50/10'
        };
      case 'employee':
        return {
          bg: 'bg-purple-50 text-purple-700 border-purple-100',
          iconBg: 'bg-purple-100 text-purple-800',
          hoverBg: 'hover:border-purple-300 hover:shadow-purple-50/10'
        };
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          iconBg: 'bg-slate-200 text-slate-800',
          hoverBg: 'hover:border-slate-400'
        };
    }
  };

  // Filter Box component to be placed above "Search Scope Info" or in sidebar
  const renderMatchFilterPanel = () => (
    <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Filter by Match Type
          </h3>
        </div>
        {selectedMatchFilter !== 'all' && (
          <button
            onClick={() => handleMatchFilterSelect('all')}
            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase transition-colors px-2 py-0.5 rounded hover:bg-blue-50"
          >
            Clear Filter
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-500 leading-snug">
        {lastSearchedQuery ? (
          <>
            Filter results matching keyword <span className="font-bold text-slate-800">"{lastSearchedQuery}"</span> by field:
          </>
        ) : (
          'Filter search results by matching criteria:'
        )}
      </p>

      <div className="space-y-1.5">
        {MATCH_CRITERIA_OPTIONS.map(opt => {
          const count = matchCounts[opt.id] || 0;
          const isSelected = selectedMatchFilter === opt.id;
          const isDisabled = count === 0 && results.length > 0;
          const Icon = opt.icon;

          return (
            <button
              key={opt.id}
              onClick={() => handleMatchFilterSelect(opt.id)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 border text-left",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm scale-[1.01]"
                  : isDisabled
                  ? "opacity-35 bg-slate-50/50 text-slate-400 border-transparent cursor-not-allowed"
                  : "bg-slate-50 hover:bg-blue-50/50 hover:border-blue-200 text-slate-700 border-slate-200/60"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-6 h-6 rounded-lg flex items-center justify-center shrink-0",
                  isSelected ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200/50"
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="truncate">
                  <span className="block truncate">{opt.label}</span>
                  <span className={cn("text-[9px] font-normal block truncate", isSelected ? "text-blue-100" : "text-slate-400")}>
                    {opt.desc}
                  </span>
                </div>
              </div>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 ml-2",
                isSelected
                  ? "bg-white text-blue-600"
                  : count > 0 
                  ? "bg-slate-200 text-slate-700" 
                  : "bg-slate-100 text-slate-400"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );

  // Search Scope Info box: positioned directly BELOW renderMatchFilterPanel
  const renderSearchScopeInfo = () => (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
        <SlidersHorizontal className="w-4 h-4 text-slate-500" />
        <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-widest">Search Scope Info</h3>
      </div>
      <ul className="space-y-3.5">
        <li className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-emerald-50 text-emerald-600 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Vouchers</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Serial No (#), Voucher/Ref No, Amount, Narration, Party, Item & Date.</p>
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-blue-50 text-blue-600 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Ledgers</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Customer, Supplier, Bank, Expense, Group, Alias & Phone.</p>
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-amber-50 text-amber-600 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Stock Inventory</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Item Name, Part No, Barcode, Stock Balance & Rate.</p>
          </div>
        </li>
        <li className="flex items-start gap-2.5">
          <div className="p-1 rounded-md bg-purple-50 text-purple-600 mt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-700">Employees</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Employee Name, Staff ID, Designation & Contact.</p>
          </div>
        </li>
      </ul>
    </div>
  );

  // Horizontal Quick Filter Chips (for responsive and quick filtering)
  const renderHorizontalMatchChips = () => {
    if (results.length === 0) return null;
    return (
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 border-b border-slate-200/60">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-blue-600" /> Match:
        </span>
        {MATCH_CRITERIA_OPTIONS.map(opt => {
          const count = matchCounts[opt.id] || 0;
          if (opt.id !== 'all' && count === 0) return null;
          const isSelected = selectedMatchFilter === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleMatchFilterSelect(opt.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 border shrink-0",
                isSelected
                  ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-50 border-slate-200/80"
              )}
            >
              <span>{opt.label}</span>
              <span className={cn("text-[9px] px-1 py-0.2 rounded font-mono font-bold", isSelected ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600")}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // ==================== RENDERING CLASSIC VIEW ====================
  const renderClassic = () => (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50/50 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 lg:px-6 py-4 space-y-3 flex-shrink-0">
        <div className="flex items-center">
          <div className="flex-1 flex items-stretch h-12">
            <div className="relative flex-1 h-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Serial No (e.g. Serial no 1), Voucher No, Party, Item, Amount, Narration..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full h-full bg-slate-50 border-2 border-r-0 border-slate-200 rounded-l-xl pl-10 pr-12 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                autoFocus
              />
              {inputValue && (
                <button 
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <button
              onClick={() => executeSearch(inputValue)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-xl px-5 flex items-center justify-center text-sm font-bold shadow-sm transition-all duration-300 shrink-0 cursor-pointer hover:shadow-md active:scale-95"
            >
              Enter / Search
            </button>
          </div>
        </div>

        {/* Dynamic filter tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {(['all', 'voucher', 'ledger', 'item', 'employee'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabSelect(tab)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap",
                activeTab === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200/60"
              )}
            >
              {tab === 'all' ? 'All Results' : `${tab}s`}
            </button>
          ))}
        </div>

        {/* Horizontal Match Criteria Chips */}
        {renderHorizontalMatchChips()}
      </div>

      {/* Main content grid: 2-column layout */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 max-w-7xl mx-auto w-full no-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Results List */}
          <div className="lg:col-span-8 space-y-3">
            {/* Active filter banner */}
            {selectedMatchFilter !== 'all' && (
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-xs font-medium text-blue-900">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>
                    Filtered by: <strong className="font-bold text-blue-700 uppercase">{MATCH_CRITERIA_OPTIONS.find(m => m.id === selectedMatchFilter)?.label}</strong> ({filteredResults.length} records)
                  </span>
                </div>
                <button
                  onClick={() => handleMatchFilterSelect('all')}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                >
                  View All Matches ({results.length})
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center items-center py-12 bg-white rounded-xl border border-slate-200">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="space-y-3">
                {filteredResults.map((result, idx) => {
                  const Icon = getIcon(result.type);
                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.03 }}
                      key={result.id}
                      onClick={() => handleSelect(result)}
                      className="bg-white p-4 rounded-xl border border-slate-200/80 hover:border-blue-500 cursor-pointer shadow-xs group transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                            {highlightMatch(result.title, lastSearchedQuery)}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {highlightMatch(result.subtitle, lastSearchedQuery)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                            {result.type}
                          </span>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                      </div>

                      {/* Matched in breakdown tags */}
                      {result.matchBadges && result.matchBadges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Matched In:
                          </span>
                          {result.matchBadges.map((badge, bIdx) => (
                            <span
                              key={bIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMatchFilterSelect(badge.category);
                              }}
                              className={cn(
                                "text-[10px] px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1 border transition-all cursor-pointer",
                                getBadgeStyle(badge.category),
                                selectedMatchFilter === badge.category && "ring-2 ring-blue-500 font-black shadow-xs"
                              )}
                              title={`Filter by ${badge.label}`}
                            >
                              <span className="opacity-75 font-bold">{badge.label}:</span>
                              <span className="font-mono">{highlightMatch(badge.text, lastSearchedQuery)}</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ) : lastSearchedQuery.length >= 1 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
                <p className="text-sm font-bold text-slate-700">No results found for "{lastSearchedQuery}"</p>
                {selectedMatchFilter !== 'all' && (
                  <button
                    onClick={() => handleMatchFilterSelect('all')}
                    className="mt-2 text-xs text-blue-600 font-bold hover:underline"
                  >
                    Clear match filter ({selectedMatchFilter}) and view all results
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
                <SearchIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600 font-bold">Type keyword and press Enter or click Search</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Type keyword and press Enter or click the Search button to view matching vouchers (Serial No, Amount, Ref, Narration), ledgers, items, or staff.
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Filter Box directly ABOVE Search Scope Info */}
          <div className="lg:col-span-4 space-y-6">
            {renderMatchFilterPanel()}
            {renderSearchScopeInfo()}
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== RENDERING MODERN PREMIUM VIEW ====================
  const renderModern = () => {
    // Collect stats on current results matching categories
    const counts = {
      all: results.length,
      voucher: results.filter(r => r.type === 'voucher').length,
      ledger: results.filter(r => r.type === 'ledger').length,
      item: results.filter(r => r.type === 'item').length,
      employee: results.filter(r => r.type === 'employee').length,
    };

    return (
      <div className="flex flex-col h-screen overflow-hidden bg-slate-50/60 transition-all duration-300 font-sans">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-md px-5 lg:px-8 py-3.5 flex-shrink-0">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between w-full">
            
            {/* Large Integrated Search Bar */}
            <div className="flex-1 min-w-0 flex items-stretch h-12">
              <div className="relative flex-1 h-full">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <SearchIcon className={cn(
                    "w-5 h-5 transition-colors duration-300",
                    lastSearchedQuery ? "text-blue-600" : "text-slate-400"
                  )} />
                </div>
                <input
                  type="text"
                  placeholder="Search by Serial No (e.g. Serial no 1), Voucher No, Party, Item, Amount, Narration..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border-2 border-r-0 border-slate-200/80 focus:border-blue-500 rounded-l-2xl pl-12 pr-12 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all duration-300"
                  autoFocus
                />
                {inputValue && (
                  <button 
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold uppercase transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button 
                onClick={() => executeSearch(inputValue)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-r-2xl px-6 flex items-center justify-center text-sm font-bold tracking-wide shadow-sm transition-all duration-300 shrink-0 cursor-pointer hover:shadow-md active:scale-95 whitespace-nowrap"
              >
                Enter / Search
              </button>
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0">
              {(['all', 'voucher', 'ledger', 'item', 'employee'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => handleTabSelect(tab)}
                    className={cn(
                      "relative px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap flex items-center gap-2",
                      isActive
                        ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-200/50"
                    )}
                  >
                    <span>{tab === 'all' ? 'All Indexes' : `${tab}s`}</span>
                    {lastSearchedQuery.length >= 1 && (
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md font-extrabold font-mono",
                        isActive 
                          ? "bg-blue-500 text-white" 
                          : "bg-slate-200 text-slate-700"
                      )}>
                        {counts[tab]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Stats Indicator */}
            {lastSearchedQuery.length >= 1 && results.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 hidden lg:flex">
                <div className="bg-blue-50 text-blue-600 rounded-xl px-4 py-2.5 border border-blue-100/50 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-xs animate-pulse whitespace-nowrap">
                  <Database className="w-3.5 h-3.5" />
                  <span>Found: {filteredResults.length} Matches</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Layout Grid */}
        <div className="flex-1 overflow-y-auto w-full max-w-7xl mx-auto px-5 lg:px-8 py-6 no-scrollbar">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Column: Search Results List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Active match filter banner if selected */}
              {selectedMatchFilter !== 'all' && (
                <div className="flex items-center justify-between bg-blue-50/90 border border-blue-200 rounded-xl px-4 py-2 text-xs font-medium text-blue-900">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>
                      Filtered by: <strong className="font-bold text-blue-700 uppercase">{MATCH_CRITERIA_OPTIONS.find(m => m.id === selectedMatchFilter)?.label}</strong> ({filteredResults.length} records)
                    </span>
                  </div>
                  <button
                    onClick={() => handleMatchFilterSelect('all')}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 underline"
                  >
                    View All Matches ({results.length})
                  </button>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col justify-center items-center py-20 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
                  <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase text-slate-400 mt-4 tracking-wider animate-pulse">Running systemic lookup...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-widest px-1 pb-1">
                    <span>Index results</span>
                    <span>{filteredResults.length} entries shown</span>
                  </div>

                  <AnimatePresence mode="popLayout">
                    {filteredResults.map((result, idx) => {
                      const Icon = getIcon(result.type);
                      const style = getTypeStyle(result.type);
                      return (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.3) }}
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={cn(
                            "flex flex-col bg-white p-4 lg:p-4.5 rounded-2xl border-2 border-slate-100 cursor-pointer shadow-xs group transition-all duration-300",
                            style.hoverBg
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-xl transition-colors duration-300 shrink-0", style.iconBg)}>
                              <Icon className="w-5 h-5" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                  {highlightMatch(result.title, lastSearchedQuery)}
                                </p>
                                <span className={cn(
                                  "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border shrink-0",
                                  style.bg
                                )}>
                                  {result.type}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 truncate mt-1">
                                {highlightMatch(result.subtitle, lastSearchedQuery)}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <span className="opacity-0 group-hover:opacity-100 text-[10px] text-blue-600 font-extrabold uppercase tracking-widest transition-opacity duration-300 hidden sm:inline">
                                {result.type === 'voucher' 
                                  ? 'View Voucher' 
                                  : result.type === 'ledger' 
                                  ? 'View Ledger' 
                                  : result.type === 'item' 
                                  ? 'View Item' 
                                  : result.type === 'employee' 
                                  ? 'View Employee' 
                                  : 'View Profile'}
                              </span>
                              <div className="p-1.5 rounded-lg bg-slate-50 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
                                <ArrowRight className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Matched In breakdown row with interactive chips */}
                          {result.matchBadges && result.matchBadges.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Matched In:
                              </span>
                              {result.matchBadges.map((badge, bIdx) => (
                                <span
                                  key={bIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMatchFilterSelect(badge.category);
                                  }}
                                  className={cn(
                                    "text-[10px] px-2.5 py-0.5 rounded-md font-semibold inline-flex items-center gap-1.5 border transition-all cursor-pointer",
                                    getBadgeStyle(badge.category),
                                    selectedMatchFilter === badge.category && "ring-2 ring-blue-500 ring-offset-1 font-black shadow-xs"
                                  )}
                                  title={`Click to filter only by ${badge.label}`}
                                >
                                  <span className="font-bold opacity-80">{badge.label}:</span>
                                  <span className="font-mono">{highlightMatch(badge.text, lastSearchedQuery)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : lastSearchedQuery.length >= 1 ? (
                <div className="text-center py-20 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Info className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No matching records found</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">
                    {selectedMatchFilter !== 'all' 
                      ? `No records matched the filter "${selectedMatchFilter}".` 
                      : `We couldn't search any ledger, voucher, stock item or employee matching "${lastSearchedQuery}". Check spelling and retry.`}
                  </p>
                  {selectedMatchFilter !== 'all' && (
                    <button
                      onClick={() => handleMatchFilterSelect('all')}
                      className="mt-3 px-4 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors"
                    >
                      Clear match filter & view all {results.length} results
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Quick Access index
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Search by serial number (e.g. Serial no 1, 1), voucher reference, ledger party name, transaction amounts, narration details, or stock items.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        Live Match Categorization
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Search results automatically show where your keyword matched (Amount, Serial No, Ref, Narration, Party) and can be filtered dynamically.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Search Tips & Sidebar Info (lg and above) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Box: FILTER BY MATCH TYPE - Positioned RIGHT ABOVE Search Scope Info as requested */}
              {renderMatchFilterPanel()}

              {/* Box 1: Helper shortcuts - Search Scope Info */}
              {renderSearchScopeInfo()}

              {/* Box 2: System status or tip */}
              <div className="bg-blue-600/5 text-blue-800 border border-blue-100 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 text-blue-800">
                  <Database className="w-4 h-4 text-blue-600 animate-pulse" />
                  ERP Database Synced
                </h4>
                <p className="text-[11px] text-blue-700/90 leading-relaxed">
                  Type keyword and press <strong>Enter</strong> or click <strong>Search</strong> to query records. Once results appear, filter by specific fields (Serial No, Amount, Ref, Narration, Item) using the panel above.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Switch between layout options based on configuration chosen in Founder Panel
  return searchPageUiStyle === 'modern' ? renderModern() : renderClassic();
}
