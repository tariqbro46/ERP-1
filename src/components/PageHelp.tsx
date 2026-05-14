
import React, { useState } from 'react';
import { Info, X, Languages } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { HELP_CONTENT, HelpSection } from '../constants/helpContent';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';

const DEFAULT_HELP: HelpSection = {
  en: "Welcome to this module. This section allows you to manage and view your business records effectively. Use the available actions and tools to process your data.",
  bn: "এই মডিউলে আপনাকে স্বাগতম। এই বিভাগটি আপনাকে আপনার ব্যবসায়িক রেকর্ডগুলো কার্যকরভাবে পরিচালনা এবং দেখতে সহায়তা করে। আপনার ডেটা প্রসেস করতে উপলভ্য অ্যাকশন এবং টুলস ব্যবহার করুন।"
};

export function PageHelp() {
  const location = useLocation();
  const { enableHelpButton, uiStyle } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'en' | 'bn'>('en');

  // Skip if disabled in settings
  if (enableHelpButton === false) return null;

  // Try to find help for current path
  const path = location.pathname;
  let help = HELP_CONTENT[path];
  
  // Try pattern matching for dynamic routes
  if (!help) {
    if (path.startsWith('/vouchers/')) help = HELP_CONTENT['/vouchers/new'];
    else if (path.startsWith('/accounts/ledgers/')) help = HELP_CONTENT['/accounts/ledgers/new'];
    else if (path.startsWith('/inventory/items/')) help = HELP_CONTENT['/inventory/items/new'];
    else if (path.startsWith('/reports/')) {
      // First try to see if there's a specific report help, otherwise fallback to generic
      help = HELP_CONTENT['/reports/stock']; 
    }
  }

  // Fallback to default help if still not found
  if (!help) {
    help = DEFAULT_HELP;
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "p-1.5 rounded-full transition-colors group flex items-center justify-center border",
          uiStyle === 'UI/UX 2' 
            ? "hover:bg-white/10 border-white/20 hover:border-white/40" 
            : "hover:bg-foreground/5 border-border/50 hover:border-primary/50"
        )}
        title="Page Instructions"
      >
        <Info className={cn(
          "w-4 h-4 transition-colors",
          uiStyle === 'UI/UX 2'
            ? "text-white/70 group-hover:text-white"
            : "text-gray-400 group-hover:text-primary"
        )} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border shadow-2xl w-full max-w-md rounded-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-foreground/5">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-bold uppercase tracking-widest">Instructions</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-foreground/5 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <div className="p-1 flex border-b border-border bg-card">
              <button 
                onClick={() => setActiveTab('en')}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded",
                  activeTab === 'en' ? "bg-primary text-white" : "text-gray-500 hover:bg-foreground/5"
                )}
              >
                English
              </button>
              <button 
                onClick={() => setActiveTab('bn')}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded",
                  activeTab === 'bn' ? "bg-primary text-white" : "text-gray-500 hover:bg-foreground/5"
                )}
              >
                বাংলা
              </button>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className={cn(
                "text-sm leading-relaxed whitespace-pre-wrap",
                activeTab === 'bn' ? "font-hindi" : "font-sans text-gray-600"
              )}>
                {help[activeTab]}
              </div>
              
              <div className="mt-8 pt-4 border-t border-border flex justify-end">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 shadow-lg shadow-primary/20 transition-all flex items-center gap-2 group"
                >
                  <span>Got It</span>
                  <X className="w-3 h-3 transition-transform group-hover:rotate-90" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
