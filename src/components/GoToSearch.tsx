import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    const handleCustomOpen = () => setIsOpen(true);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open_goto_search', handleCustomOpen);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open_goto_search', handleCustomOpen);
    };
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

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      data-enterprise-modal="true"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setIsOpen(false);
      }}
      className="fixed inset-0 z-[99990] flex items-start justify-center pt-[12vh] bg-slate-950/60 backdrop-blur-md px-4 animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-3xl bg-card border border-border shadow-[var(--shadow-modal)] overflow-hidden rounded-2xl animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center px-5 py-4 border-b border-border bg-card/80">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Go To module or report (Alt+G)..."
            className="flex-1 bg-transparent border-none outline-none text-foreground text-base font-medium placeholder:text-muted-foreground"
            value={query || ''}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-muted rounded-md border border-border text-[11px] text-muted-foreground font-mono">
            <Command className="w-3 h-3" />
            <span>G</span>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar divide-y divide-border/40">
          {filteredItems.map((item, index) => (
            <div
              key={item.path}
              className={`flex items-center justify-between px-5 py-3 cursor-pointer transition-colors ${
                index === selectedIndex ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground/80 hover:bg-muted/60'
              }`}
              onClick={() => handleSelect(item.path)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="text-sm tracking-tight">{item.title}</span>
              <kbd className="text-[11px] text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded font-mono hidden sm:block">
                {item.shortcut}
              </kbd>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="px-5 py-10 text-center text-muted-foreground text-sm">
              No matching features found
            </div>
          )}
        </div>
        <div className="px-5 py-2.5 bg-muted/40 border-t border-border flex justify-between items-center text-[11px] text-muted-foreground">
          <span>ESC to close</span>
          <span>↑↓ to navigate, Enter to open</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
