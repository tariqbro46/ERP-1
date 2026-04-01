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
  tabIndex?: number;
  allowCustom?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  onQuickCreate,
  quickCreateLabel = "Add New",
  disabled = false,
  tabIndex,
  allowCustom = false
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(opt => opt.id === value) || (allowCustom && value ? { id: value, name: value } : null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync search term with selected value when not open
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedOption ? selectedOption.name : '');
    }
  }, [selectedOption, isOpen]);

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: string, name: string) => {
    onChange(id);
    setSearchTerm(name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setSearchTerm(newVal);
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (allowCustom && searchTerm) {
      const match = options.find(opt => opt.name.toLowerCase() === searchTerm.toLowerCase());
      if (match) {
        onChange(match.id);
      } else {
        onChange(searchTerm);
      }
    } else if (!searchTerm) {
      onChange('');
    }
    
    // Use a small timeout to allow click events on options to fire
    setTimeout(() => setIsOpen(false), 150);
  };

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      <div className="relative flex items-center group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-3.5 h-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onBlur={handleBlur}
          disabled={disabled}
          placeholder={placeholder}
          tabIndex={tabIndex}
          className={cn(
            "w-full bg-background border border-border p-2.5 pl-9 pr-10 text-xs transition-all outline-none uppercase tracking-widest font-bold",
            "focus:border-primary focus:ring-1 focus:ring-primary/20",
            isOpen ? "border-primary ring-1 ring-primary/20" : "hover:border-primary/50",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        <div className="absolute right-2 flex items-center gap-1">
          {searchTerm && !disabled && (
            <button 
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearchTerm('');
                onChange('');
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-foreground/10 rounded-full text-gray-400 hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform pointer-events-none", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (searchTerm || filteredOptions.length > 0 || onQuickCreate || allowCustom) && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border shadow-xl max-h-64 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="overflow-y-auto flex-1 no-scrollbar">
            {allowCustom && searchTerm && !options.find(o => o.name.toLowerCase() === searchTerm.toLowerCase()) && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(searchTerm, searchTerm)}
                className="px-4 py-3 text-[10px] text-primary uppercase font-bold cursor-pointer hover:bg-primary/5 italic border-b border-border flex items-center gap-2"
              >
                <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[8px]">+</span>
                Add New: "{searchTerm}"
              </div>
            )}
            {filteredOptions.length > 0 ? (
              filteredOptions.map(opt => (
                <div
                  key={opt.id}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(opt.id, opt.name)}
                  className={cn(
                    "px-4 py-2.5 text-[10px] uppercase font-bold cursor-pointer transition-colors flex items-center justify-between",
                    opt.id === value ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                  )}
                >
                  <span>{opt.name}</span>
                  {opt.id === value && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              ))
            ) : !allowCustom && (
              <div className="px-4 py-6 text-[10px] text-muted-foreground uppercase text-center font-bold tracking-widest italic">
                No matches found
              </div>
            )}
          </div>

          {onQuickCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onQuickCreate();
                setIsOpen(false);
              }}
              className="p-3 border-t border-border bg-muted/30 text-primary hover:bg-primary hover:text-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
            >
              + {quickCreateLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
