
import React, { useState, useEffect, useRef } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { formatDate, parseDateInput } from '../utils/dateUtils';
import { Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

interface DateInputProps {
  value: string; // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  tabIndex?: number;
  compact?: boolean;
  fieldSize?: 'small' | 'semi-compact' | 'medium' | 'large';
  highlighted?: boolean;
}

export function DateInput({ value, onChange, className, placeholder, label, disabled, tabIndex, compact, fieldSize, highlighted }: DateInputProps) {
  const { dateFormat } = useSettings();
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync internal text with incoming standard value
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatDate(value, dateFormat));
    }
  }, [value, dateFormat, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseDateInput(inputValue);
    if (parsed) {
      onChange(parsed);
      setInputValue(formatDate(parsed, dateFormat));
    } else if (value) {
      // Revert to current value if invalid expansion
      setInputValue(formatDate(value, dateFormat));
    } else {
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn(compact ? "space-y-0.5 w-full" : "space-y-1 w-full", className)}>
      {label && <label className={cn("text-gray-500 uppercase font-bold tracking-widest", compact ? "text-[9px]" : "text-[10px]")}>{label}</label>}
      <div className="relative group">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          tabIndex={tabIndex}
          placeholder={placeholder || dateFormat.toLowerCase()}
          className={cn(
            "w-full bg-background border transition-all outline-none uppercase font-bold tracking-widest",
            highlighted 
              ? "border-amber-500 ring-2 ring-amber-500/30 bg-amber-500/5 animate-pulse" 
              : "border-border focus:border-foreground focus:ring-1 focus:ring-foreground/10",
            fieldSize === 'small' ? "p-1 pr-6 text-[11px] h-7" :
            fieldSize === 'semi-compact' ? "p-1 lg:p-1.5 pr-6 text-[11.5px] h-8" :
            fieldSize === 'large' ? "p-2 pr-10 text-sm h-11" :
            compact 
              ? "p-1 pr-6 text-[11px] leading-tight" 
              : "p-2.5 pr-10 text-xs h-10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {/* Native date picker trigger via hidden input */}
        <input 
          type="date"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 cursor-pointer z-10",
            compact ? "right-1.5" : "right-3"
          )}
          value={value}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          disabled={disabled}
        />
        <div className={cn(
          "absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-400",
          compact ? "right-1.5" : "right-3"
        )}>
          <Calendar className={compact ? "w-3 h-3" : "w-3.5 h-3.5"} />
        </div>
      </div>
    </div>
  );
}
