
import React, { useState } from 'react';
import { Info, X, Languages } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { HELP_CONTENT, HelpSection } from '../constants/helpContent';
import { cn } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { EnterpriseModal } from './ui/EnterpriseModal';

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

      <EnterpriseModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Module Instructions & Guide"
        subtitle={`Context guide for ${path}`}
        icon={<Info className="w-5 h-5" />}
        size="lg"
        headerExtra={
          <div className="inline-flex items-center p-1 rounded-lg bg-muted border border-border">
            <button
              type="button"
              onClick={() => setActiveTab('en')}
              className={cn(
                "px-3 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap",
                activeTab === 'en' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bn')}
              className={cn(
                "px-3 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap",
                activeTab === 'bn' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              বাংলা
            </button>
          </div>
        }
        footer={
          <div className="flex justify-end w-full">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 whitespace-nowrap"
            >
              <span>{activeTab === 'bn' ? 'বুঝেছি' : 'Got It'}</span>
            </button>
          </div>
        }
      >
        <div
          className={cn(
            "text-sm leading-relaxed whitespace-pre-wrap text-foreground/90",
            activeTab === 'bn' ? "font-hindi" : "font-sans"
          )}
        >
          {help[activeTab]}
        </div>
      </EnterpriseModal>
    </>
  );
}
