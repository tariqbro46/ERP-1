import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Receipt, Users, Package, ChevronRight, Hash, Calendar, ArrowRight } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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

export const GlobalSearch: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { company } = useAuth();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

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
        setSelectedIndex(0);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, company?.id]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSelect = (result: SearchResult) => {
    onClose();
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
      case 'ledger': return Hash;
      case 'item': return Package;
      case 'employee': return Users;
      default: return Search;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center px-4 py-4 border-b border-border bg-card/50">
              <Search className="w-5 h-5 text-muted-foreground mr-3" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search everything... (Voucher No, Ledger Name, Item Name)"
                className="flex-1 bg-transparent border-none outline-none text-lg placeholder:text-muted-foreground"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="flex items-center gap-2">
                {loading && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                )}
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ESC
                </kbd>
                <button onClick={onClose} className="p-1 hover:bg-muted rounded-md shrink-0">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div ref={resultsRef} className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2">
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result, index) => {
                    const Icon = getIcon(result.type);
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        className={cn(
                          "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                          selectedIndex === index 
                            ? "bg-primary/10 text-primary ring-1 ring-primary/20" 
                            : "hover:bg-muted"
                        )}
                        onClick={() => handleSelect(result)}
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <div className={cn(
                          "p-2 rounded-md",
                          selectedIndex === index ? "bg-primary/20" : "bg-muted"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-medium truncate">{result.title}</span>
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground ml-2 shrink-0">
                              {result.category}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2 overflow-hidden truncate">
                               {result.subtitle}
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-4 h-4 transition-transform",
                          selectedIndex === index ? "translate-x-1 text-primary" : "text-muted-foreground/30"
                        )} />
                      </button>
                    );
                  })}
                </div>
              ) : query.length >= 2 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>No results found for "{query}"</p>
                  <p className="text-xs mt-1">Try searching with a different term</p>
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground space-y-4">
                  <div className="flex justify-center flex-wrap gap-4 text-xs font-mono">
                    <div className="flex items-center gap-1"><Receipt className="w-3 h-3" /> Vouchers</div>
                    <div className="flex items-center gap-1"><Hash className="w-3 h-3" /> Ledgers</div>
                    <div className="flex items-center gap-1"><Package className="w-3 h-3" /> Items</div>
                    <div className="flex items-center gap-1"><Users className="w-3 h-3" /> Employees</div>
                  </div>
                  <p className="text-sm">Type to start searching your company data</p>
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/50 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-card px-1">↑↓</kbd> Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="rounded border bg-card px-1">Enter</kbd> Select
                </span>
              </div>
              <div className="flex items-center gap-1">
                 <ArrowRight className="w-3 h-3" /> Search recent records
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
