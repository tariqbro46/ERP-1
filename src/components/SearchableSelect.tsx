import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Option {
  id: string;
  name: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onQuickCreate?: () => void;
  quickCreateLabel?: string;
  disabled?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  onQuickCreate,
  quickCreateLabel = "Quick Create",
  disabled = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
    setSearchTerm('');
  };

  const toggleOpen = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div
        onClick={toggleOpen}
        className={cn(
          "flex items-center justify-between w-full bg-background border border-border p-2 text-sm cursor-pointer transition-all",
          isOpen ? "border-foreground ring-1 ring-foreground/10" : "hover:border-foreground/50",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <span className={cn("truncate", !selectedOption && "text-gray-500")}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-xl max-h-64 flex flex-col overflow-hidden">
          <div className="p-2 border-b border-border bg-foreground/5 flex items-center gap-2">
            <Search className="w-3 h-3 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-[11px] w-full uppercase tracking-widest"
              onClick={(e) => e.stopPropagation()}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 no-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => handleSelect(opt.id)}
                  className={cn(
                    "px-4 py-2 text-[11px] uppercase tracking-widest cursor-pointer transition-colors",
                    opt.id === value ? "bg-foreground text-background font-bold" : "hover:bg-foreground/10 text-foreground"
                  )}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-[10px] text-gray-500 uppercase text-center italic">
                No results found
              </div>
            )}
          </div>

          {onQuickCreate && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickCreate();
                setIsOpen(false);
              }}
              className="p-2 border-t border-border bg-foreground/5 text-amber-600 hover:bg-amber-600 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              + {quickCreateLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
