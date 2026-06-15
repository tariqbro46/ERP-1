import React, { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
}

export default function SearchPage() {
  const [inputValue, setInputValue] = useState('');
  const [lastSearchedQuery, setLastSearchedQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'voucher' | 'ledger' | 'item' | 'employee'>('all');
  const { company } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();

  const searchPageUiStyle = settings?.searchPageUiStyle || 'classic';

  const executeSearch = async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setLastSearchedQuery(trimmed);
      return;
    }

    setLoading(true);
    setLastSearchedQuery(trimmed);
    try {
      const data = await erpService.searchCompanyData(company?.id || '', trimmed);
      setResults(data as SearchResult[]);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeSearch(inputValue);
    }
  };

  const handleClear = () => {
    setInputValue('');
    setLastSearchedQuery('');
    setResults([]);
  };

  const filteredResults = results.filter(r => activeTab === 'all' || r.type === activeTab);

  const handleSelect = (result: SearchResult) => {
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

  // ==================== RENDERING CLASSIC VIEW ====================
  const renderClassic = () => (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50/50 font-sans">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 lg:px-6 py-4 space-y-4 flex-shrink-0">
        <div className="flex items-center">
          <div className="flex-1 flex items-stretch h-12">
            <div className="relative flex-1 h-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search vouchers, ledgers, stock items..."
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
              onClick={() => setActiveTab(tab)}
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
      </div>

      {/* Main results list */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full no-scrollbar">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="space-y-2.5">
            {filteredResults.map((result, idx) => {
              const Icon = getIcon(result.type);
              return (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200/60 hover:border-blue-500 cursor-pointer shadow-sm group transition-all duration-200"
                >
                  <div className="p-2.5 rounded-lg bg-slate-50 text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                      {result.title}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {result.subtitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                      {result.type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : lastSearchedQuery.length >= 2 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No results found for "{lastSearchedQuery}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium font-sans">Type search query and press Enter</p>
            <p className="text-xs text-slate-400 mt-1">Search vouchers, ledgers, items, and employees quickly.</p>
          </div>
        )}
      </div>
    </div>
  );

  // ==================== RENDERING MODERN PREMIUM VIEW ====================
  const renderModern = () => {
    // Collect stats on current results matching categories
    const counts = {
      all: filteredResults.length,
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
                  placeholder="Query ledgers, voucher vouchers, stock items, employee names..."
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
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      "relative px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap flex items-center gap-2",
                      isActive
                        ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-200/50"
                    )}
                  >
                    <span>{tab === 'all' ? 'All Indexes' : `${tab}s`}</span>
                    {lastSearchedQuery.length >= 2 && (
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
            {lastSearchedQuery.length >= 2 && results.length > 0 && (
              <div className="flex items-center gap-2 shrink-0 hidden lg:flex">
                <div className="bg-blue-50 text-blue-600 rounded-xl px-4 py-2.5 border border-blue-100/50 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider shadow-xs animate-pulse whitespace-nowrap">
                  <Database className="w-3.5 h-3.5" />
                  <span>Found: {results.length} Matches</span>
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
              {loading ? (
                <div className="flex flex-col justify-center items-center py-20 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
                  <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-bold uppercase text-slate-400 mt-4 tracking-wider animate-pulse">Running systemic lookup...</p>
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-widest px-1 pb-1">
                    <span>Index results</span>
                    <span>{filteredResults.length} entry found</span>
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
                            "flex items-center gap-4 bg-white p-4 lg:p-4.5 rounded-2xl border-2 border-slate-100 cursor-pointer shadow-xs group transition-all duration-300",
                            style.hoverBg
                          )}
                        >
                          <div className={cn("p-3 rounded-xl transition-colors duration-300", style.iconBg)}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                                {result.title}
                              </p>
                              <span className={cn(
                                "text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border",
                                style.bg
                              )}>
                                {result.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-1">
                              {result.subtitle}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
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
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              ) : lastSearchedQuery.length >= 2 ? (
                <div className="text-center py-20 bg-white border border-slate-200/60 rounded-2xl shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Info className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">No matching indexes found</p>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-sm mx-auto">We couldn't search any ledger, voucher, stock item or employee matching "{lastSearchedQuery}". Check spelling and retry.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        Quick Access index
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">Simply type two characters to let our smart look-up index fetch references from your dynamic chart of accounts, active physical stock ledgers, and employee details.</p>
                    </div>

                    <div className="p-4 bg-slate-50/55 border border-slate-100 rounded-xl space-y-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-slate-500" />
                        Live Synced Modules
                      </h4>
                      <p className="text-[11px] text-slate-550 leading-relaxed">Search profiles remain fully synchronized with live cloud records, ensuring you query and navigate directly to your destination with absolute certainty.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Search Tips / Statistics Sidebar Info (lg and above) */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Box 1: Helper shortcuts */}
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-xs space-y-4">
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
                      <p className="text-[11px] text-slate-500 mt-0.5">Query payment, sales, and purchase slips by voucher accounts.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-blue-50 text-blue-600 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Ledgers</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Navigate to statements of individual supplier, buyer, or tax masters.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-amber-50 text-amber-600 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Stock Inventory</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Locate stock balances, descriptions, and edit prices for active items.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="p-1 rounded-md bg-purple-50 text-purple-600 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Employees</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Find registered staffs, active designations, and pay logs instantly.</p>
                    </div>
                  </li>
                </ul>
              </div>

              {/* Box 2: System status or tip */}
              <div className="bg-blue-600/5 text-blue-800 border border-blue-100 rounded-2xl p-5 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 text-blue-800">
                  <Database className="w-4 h-4 text-blue-600 animate-pulse" />
                  ERP Database Synced
                </h4>
                <p className="text-[11px] text-blue-700/90 leading-relaxed">
                  Hitting <strong>Enter</strong> or click <strong>Enter / Search</strong> indexes active vouchers, stock registries, ledger profiles, or employee dossiers seamlessly. Click any row to navigate straight to transactions.
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
