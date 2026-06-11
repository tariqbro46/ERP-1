import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, X, Search, Keyboard, FileText, 
  Lightbulb, ExternalLink, ChevronDown, ChevronUp, HelpCircle 
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export default function SystemGuideFloatingButton() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'quick' | 'hotkeys'>('quick');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    'dash': false,
    'vouch': false,
    'ledger': false,
    'item': false,
  });

  const isBn = language === 'bn';
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel on clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        // Wait minor delay to avoid clicking trigger button from immediately closing and reopening
        const clickedTrigger = (event.target as HTMLElement).closest('#system-guide-trigger-btn');
        if (!clickedTrigger) {
          setIsOpen(false);
        }
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const sections = [
    {
      id: 'dash',
      title: isBn ? 'ড্যাশবোর্ড ওভারভিউ' : 'Dashboard Overview',
      icon: FileText,
      description: isBn 
        ? 'আপনার সমগ্র ব্যবসায়িক কার্যক্রম একনজরে নজরদারি করার কেন্দ্রীয় স্থান। ক্যাশ ফ্লো, বিক্রয়ের প্রবণতা ও বর্তমান ব্যালেন্স জানুন।'
        : 'The central command center to monitor all liquid accounts, sales vectors, inventory valuations, and recent transaction entries.',
      points: isBn
        ? [
            'সরাসরি টপ ব্যালেন্স ফিডে ক্যাশ ও ব্যাংকের লাইভ ব্যালেন্স দেখতে পাবেন।',
            'কুইক অ্যাকশনের মাধ্যমে নতুন লেজার বা ভাউচারে সরাসরি জাম্প করতে পারবেন।'
          ]
        : [
            'Monitor actual live Cash in Hand and Bank ledger balances directly in the head indicator feed.',
            'Instantly view sales trajectories, net charts, and direct transaction links in one screen.'
          ]
    },
    {
      id: 'vouch',
      title: isBn ? 'ভাউচার ও লেনদেন রেকর্ড' : 'Voucher & Transactions',
      icon: BookOpen,
      description: isBn 
        ? 'আপনার দৈনন্দিন খরচ, বিক্রয় বা আদায় বুক করার নির্ভুল নির্দেশিকা। প্রতিটি এন্ট্রি আপনার লেজারকে সরাসরি আপডেট করে।'
        : 'Step-by-step transaction recorder. Keep robust ledgers for Sales, Purchases, Receipts, and Payments seamlessly.',
      points: isBn
        ? [
            'লেনদেনের সাথে সম্পর্কিত বুক ক্যাটেগরি (যেমন পেমেন্ট বা রিসিট) নির্বাচন করুন।',
            'ইনভেন্টরি ভাউচারের ক্ষেত্রে সঠিক স্টক কোয়ান্টিটি এবং রেট প্রদান করুন।'
          ]
        : [
            'Select transaction voucher templates (Payment, Receipt, Sales, Purchase contra).',
            'Input exact rates, item configurations, and double-check ledger mapping before committing.'
          ]
    },
    {
      id: 'ledger',
      title: isBn ? 'লেজার ও চার্ট অফ অ্যাকাউন্টস' : 'Ledger Mapping & Accounts',
      icon: HelpCircle,
      description: isBn 
        ? 'সঠিক ডাবল এন্ট্রি বুককিপিংয়ের জন্য লেজার তৈরি করা অত্যন্ত জরুরি। এটি ফাইনান্সিয়াল রিপোর্টিং এ প্রভাব ফেলে।'
        : 'Form clear grouping relationships for accounts. Ensure strict double-entry balance sheets and Profit & Loss reports.',
      points: isBn
        ? [
            'ব্যাংকের ব্যালেন্স ট্র্যাক রাখার জন্য লেজারকে Bank Accounts গ্রুপে ম্যাপিং করুন।',
            'গ্রাহকদের জন্য Sundry Debtors এবং সরবরাহকারীদের Sundry Creditors গ্রুপ বেছে নিন।'
          ]
        : [
            'Select "Sundry Debtors" for client accounts and "Sundry Creditors" for trade vendors.',
            'Categorize cash flow using hand ledger entities mapping into explicit balance classes.'
          ]
    },
    {
      id: 'item',
      title: isBn ? 'স্টক ও ইনভেন্টরি ম্যানেজমেন্ট' : 'Stock & Inventory Management',
      icon: Lightbulb,
      description: isBn 
        ? 'আপনার আইটেম, গোডাউন ও ব্যাচ ট্র্যাকিং সিস্টেম সহজে পরিচালনা করার কৌশল। সঠিক পরিমাপ ইউনিট ব্যবহারে অডিট সহজ হয়।'
        : 'Maintain precise warehouse storage controls, batch serials, reorder warnings, and exact volumetric stock valuation entries.',
      points: isBn
        ? [
            'আইটেম ক্রিয়েশনের সময় সঠিক পরিমাপ একক (Pcs, Kg) সেট করুন।',
            'গোডাউন ওয়াইজ রিয়েল-টাইম স্টক লেভেল দেখতে স্টক রিকনসিলিলেশন চেক করুন।'
          ]
        : [
            'Define item metadata including unit limits, measurement parameters, and initial pricing profiles.',
            'Monitor current raw stocks or finished good piles grouped across designated warehouse godown lots.'
          ]
    }
  ];

  const shortcuts = [
    { key: 'G', label: isBn ? 'গ্লোবাল "Go To" নেভিগেশন সার্চ' : 'Global "Go To" Navigation Search' },
    { key: 'Alt + V', label: isBn ? 'নতুন ভাউচার এন্ট্রি পাতা' : 'Create New Voucher' },
    { key: 'Alt + L', label: isBn ? 'নতুন সাধারণ লেজার পাতা' : 'Create General Ledger' },
    { key: 'Alt + I', label: isBn ? 'নতুন স্টক আইটেম পাতা' : 'Create Stock Item' },
    { key: 'Esc', label: isBn ? 'ডায়ালগ বা সার্চ ক্লোজ করুন' : 'Go back / Close search' },
  ];

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter(sec => 
      sec.title.toLowerCase().includes(q) || 
      sec.description.toLowerCase().includes(q) ||
      sec.points.some(pt => pt.toLowerCase().includes(q))
    );
  }, [searchQuery, isBn]);

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 select-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-16 right-0 w-[350px] sm:w-[380px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col z-50 text-foreground"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-blue-600/10 via-emerald-600/10 to-indigo-600/5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-sm tracking-tight text-foreground leading-none">
                    {isBn ? 'সিস্টেম গাইড সহকারী' : 'System Guide Assistant'}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-1 tracking-wide uppercase font-mono font-bold">
                    {isBn ? 'সহজ ব্যবহার সহায়ক' : 'ERP Helpdesk'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 px-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border border-transparent hover:border-border"
                title={isBn ? 'বন্ধ করুন' : 'Dismiss'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language and Tab Switches */}
            <div className="px-4 pt-3 pb-2 border-b border-border/80 flex items-center justify-between gap-3">
              <div className="flex bg-muted/65 p-1 rounded-xl w-full border border-border/50">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={cn(
                    "flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                    activeTab === 'quick' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isBn ? 'কুইক গাইড' : 'Quick Guide'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('hotkeys')}
                  className={cn(
                    "flex-1 text-center py-1.5 text-[11px] font-bold rounded-lg transition-all flex items-center justify-center gap-1.5",
                    activeTab === 'hotkeys' 
                      ? "bg-background text-foreground shadow-sm" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>{isBn ? 'ইনস্ট্যান্ট কি-বোর্ড' : 'Hotkeys'}</span>
                </button>
              </div>
            </div>

            {/* Search Input for Quick Tab */}
            {activeTab === 'quick' && (
              <div className="px-4 py-2 border-b border-border/50 bg-muted/20">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={isBn ? 'সিস্টেম গাইড খুঁজুন...' : 'Search system guidelines...'}
                    className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {/* Scrollable Body Content */}
            <div className="flex-1 max-h-[320px] overflow-y-auto p-4 space-y-3 scroll-smooth no-scrollbar">
              {activeTab === 'quick' ? (
                <div className="space-y-2">
                  {filteredSections.map((sec) => {
                    const isExpanded = expandedSections[sec.id];
                    const Icon = sec.icon;
                    return (
                      <div 
                        key={sec.id} 
                        className={cn(
                          "border rounded-xl transition-all overflow-hidden",
                          isExpanded ? "border-blue-500/50 bg-blue-500/5" : "border-border hover:border-border/100"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSection(sec.id)}
                          className="w-full flex items-center justify-between p-3 text-left transition-colors hover:bg-muted/30"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={cn(
                              "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                              isExpanded ? "bg-blue-500/20 text-blue-600 dark:text-blue-400" : "bg-muted text-muted-foreground"
                            )}>
                              <Icon className="w-4.5 h-4.5" />
                            </div>
                            <span className="font-bold text-xs text-foreground leading-snug">{sec.title}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-400 transform rotate-180 transition-transform" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400 transition-transform" />
                          )}
                        </button>
                        
                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.15 }}
                            >
                              <div className="px-3 pb-3 pt-0.5 border-t border-border/45 text-[11px] leading-relaxed text-muted-foreground space-y-2 bg-background/50">
                                <p>{sec.description}</p>
                                <div className="space-y-1.5 pl-1.5 border-l border-blue-500/30">
                                  {sec.points.map((pt, i) => (
                                    <div key={i} className="flex gap-1.5 items-start">
                                      <span className="text-blue-500 text-[10px] select-none mt-0.5">•</span>
                                      <span className="text-foreground/90">{pt}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  {filteredSections.length === 0 && (
                    <div className="p-8 text-center text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {isBn ? 'কোনো ফলাফল পাওয়া যায়নি' : 'No guidelines match'}
                    </div>
                  )}
                </div>
              ) : (
                /* Hotkeys tab */
                <table className="w-full font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border text-left hover:bg-transparent">
                      <th className="pb-2.5 font-bold uppercase text-[9px] tracking-wider text-muted-foreground">{isBn ? 'কি-বোর্ড সর্টকাট' : 'Hotkey'}</th>
                      <th className="pb-2.5 font-bold uppercase text-[9px] tracking-wider text-muted-foreground pl-4">{isBn ? 'কার্যক্রম' : 'Description'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-foreground/95">
                    {shortcuts.map((sh, idx) => (
                      <tr key={idx} className="hover:bg-muted/20 transition-colors">
                        <td className="py-2.5 whitespace-nowrap">
                          <kbd className="px-2 py-1 bg-muted border border-border shadow-sm rounded text-[10px] font-bold font-mono tracking-wide text-foreground">
                            {sh.key}
                          </kbd>
                        </td>
                        <td className="py-2.5 pl-4 text-[11px] font-sans font-medium">{sh.label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Actions redirects to system instructions page */}
            <div className="p-3 bg-muted/65 border-t border-border flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground font-semibold">
                TallyFlow Zero ERP Guide
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  navigate('/instructions');
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm"
              >
                <span>{isBn ? 'সম্পূর্ণ গাইড' : 'Full Guide'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Primary Floating Trigger Button */}
      <button
        type="button"
        id="system-guide-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-12 h-12 rounded-full text-white shadow-xl hover:shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 select-none relative",
          isOpen 
            ? "bg-slate-700 dark:bg-slate-800 shadow-slate-500/25 rotate-90" 
            : "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-500/25 active:brightness-95 hover:brightness-105"
        )}
        title={isBn ? 'সিস্টেম বুক গাইড খুলুন' : 'Open System Book Guide'}
      >
        <BookOpen className="w-5.5 h-5.5" />
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </span>
      </button>
    </div>
  );
}
