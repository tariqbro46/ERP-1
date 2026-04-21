
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
}

export function DateInput({ value, onChange, className, placeholder, label, disabled, tabIndex }: DateInputProps) {
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
    <div className={cn("space-y-1 w-full", className)}>
      {label && <label className="text-[10px] text-gray-500 uppercase font-bold">{label}</label>}
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
            "w-full bg-background border border-border p-2.5 pr-10 text-xs transition-all outline-none uppercase font-bold tracking-widest",
            "focus:border-foreground focus:ring-1 focus:ring-foreground/10",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        />
        {/* Native date picker trigger via hidden input */}
        <input 
          type="date"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 cursor-pointer z-10"
          value={value}
          onChange={(e) => {
            if (e.target.value) {
              onChange(e.target.value);
            }
          }}
          disabled={disabled}
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
}
