import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, ArrowLeft, ArrowRight, Receipt, Users, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { erpService } from '../services/erpService';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'voucher' | 'ledger' | 'item' | 'employee';
  category: string;
  metadata: any;
}

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'voucher' | 'ledger' | 'item' | 'employee'>('all');
  const { company } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const data = await erpService.searchCompanyData(company?.id || '', query);
        setResults(data as SearchResult[]);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, company?.id]);

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

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/50">
      {/* Sticky Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-4 lg:px-6 py-4 space-y-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vouchers, ledgers, stock items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              autoFocus
            />
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
                  : "bg-slate-55 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
              )}
            >
              {tab === 'all' ? 'All Results' : `${tab}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Main results list (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-6 max-w-2xl mx-auto w-full">
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
                    <span className="text-[10px] bg-slate-100 text-slate-650 px-2.5 py-1 rounded-full uppercase font-bold tracking-wider">
                      {result.type}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : query.length >= 2 ? (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No results found for "{query}"</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 font-medium">Type at least 2 characters to search</p>
            <p className="text-xs text-slate-400 mt-1">Search vouchers, ledgers, items, and employees quickly.</p>
          </div>
        )}
      </div>
    </div>
  );
}
