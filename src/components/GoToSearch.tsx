import React, { useState, useEffect, useRef } from 'react';
import { Search, Command } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MENU_ITEMS = [
  { title: 'Create Voucher', path: '/vouchers/new', shortcut: 'V' },
  { title: 'Create Ledger', path: '/accounts/ledgers/new', shortcut: 'C' },
  { title: 'Create Stock Item', path: '/inventory/items/new', shortcut: 'I' },
  { title: 'Daybook', path: '/reports/daybook', shortcut: 'D' },
  { title: 'Ledger Statement', path: '/reports/ledger', shortcut: 'L' },
  { title: 'Balance Sheet', path: '/reports/balance-sheet', shortcut: 'B' },
  { title: 'Trial Balance', path: '/reports/trial-balance', shortcut: 'T' },
  { title: 'Profit & Loss', path: '/reports/pl', shortcut: 'P' },
  { title: 'Ratio Analysis', path: '/reports/ratios', shortcut: 'R' },
  { title: 'Stock Summary', path: '/reports/stock', shortcut: 'S' },
  { title: 'Chart of Accounts', path: '/accounts', shortcut: 'A' },
  { title: 'Company Settings', path: '/settings', shortcut: 'F11' },
  { title: 'Notes / Memo', path: '/notes', shortcut: 'N' },
];

export function GoToSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'g' || e.key === 'G')) {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const filteredItems = MENU_ITEMS.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      if (filteredItems[selectedIndex]) {
        handleSelect(filteredItems[selectedIndex].path);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-card border border-border shadow-2xl overflow-hidden rounded-sm">
        <div className="flex items-center px-4 py-3 border-b border-border">
          <Search className="w-5 h-5 text-gray-500 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Go To (Alt+G)..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-lg font-mono"
            value={query || ''}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-foreground/5 rounded border border-border text-[10px] text-gray-500 font-mono">
            <Command className="w-3 h-3" />
            <span>G</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
          {filteredItems.map((item, index) => (
            <div
              key={item.path}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-foreground/10 text-foreground' : 'text-gray-500 hover:bg-foreground/5'
              }`}
              onClick={() => handleSelect(item.path)}
            >
              <span className="font-mono text-sm uppercase tracking-wider">{item.title}</span>
              <span className="text-[10px] opacity-50 font-mono hidden sm:block">{item.shortcut}</span>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 font-mono text-sm">
              No matching features found
            </div>
          )}
        </div>
        <div className="px-4 py-2 bg-foreground/5 border-t border-border flex justify-between items-center">
          <span className="text-[10px] text-gray-600 font-mono">ESC to close</span>
          <span className="text-[10px] text-gray-600 font-mono">↑↓ to navigate, ENTER to select</span>
        </div>
      </div>
    </div>
  );
}
