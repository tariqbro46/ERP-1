import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Search, Languages, HelpCircle, 
  Rocket, FileText, Package, Users, BarChart2, Keyboard, 
  AlertTriangle, Lightbulb, ChevronRight, CheckCircle2,
  Info, ExternalLink
} from 'lucide-react';
import { HELP_DOCS, DocCategory, DocSubSection } from '../constants/helpContent';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function HelpPage() {
  const navigate = useNavigate();
  const [activeLang, setActiveLang] = useState<'en' | 'bn'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('getting-started');
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});

  // Map icon names back to Lucide components
  const iconMap: Record<string, React.ComponentType<any>> = {
    rocket: Rocket,
    'book-open': BookOpen,
    'file-text': FileText,
    package: Package,
    users: Users,
    'bar-chart-2': BarChart2,
    keyboard: Keyboard,
    'help-circle': HelpCircle,
  };

  // Filter categories and subsections based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const matches: { category: DocCategory; section: DocSubSection }[] = [];

    HELP_DOCS.forEach(cat => {
      cat.sections.forEach(sec => {
        const titleMatch = (activeLang === 'en' ? sec.title : sec.bnTitle).toLowerCase().includes(query);
        const contentMatch = (activeLang === 'en' ? sec.content : sec.bnContent).toLowerCase().includes(query);
        const pointsMatch = (activeLang === 'en' ? sec.points : sec.bnPoints)?.some(pt => pt.toLowerCase().includes(query)) || false;

        if (titleMatch || contentMatch || pointsMatch) {
          matches.push({ category: cat, section: sec });
        }
      });
    });

    return matches;
  }, [searchQuery, activeLang]);

  const activeCategory = useMemo(() => {
    return HELP_DOCS.find(cat => cat.id === activeCategoryId) || HELP_DOCS[0];
  }, [activeCategoryId]);

  const handleToggleFaq = (key: string) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      {/* Sticky Topbar Header (Fixed & Permanent) */}
      <header className="flex-none bg-white border-b border-slate-200 shadow-sm px-4 lg:px-6 py-4 space-y-4 z-30">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors border border-slate-200 bg-white shadow-xs"
              title="Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 text-slate-600" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <span>System Guide & Documentation</span>
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                  v4.2.0 Stable
                </span>
              </div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-1">
                {activeLang === 'en' ? "Central Help Workspace" : "কেন্দ্রীয় সাহায্য ও সিস্টেম নির্দেশিকা"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Interactive Language Selector Toggle */}
            <button
              onClick={() => setActiveLang(prev => prev === 'en' ? 'bn' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50/50 hover:bg-blue-50 border border-blue-200/60 rounded-xl text-[11px] font-extrabold uppercase tracking-wider transition-colors text-blue-700"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{activeLang === 'en' ? 'ENGLISH' : 'বাংলা'}</span>
            </button>
          </div>
        </div>

        {/* Global Search across Documentation */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
          <input
            type="text"
            placeholder={activeLang === 'en' ? "Search guides, terminology, codes, FAQs..." : "নির্দেশিকা, পরিভাষা, প্রশ্ন বা নিয়ম খুঁজুন..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </header>

      {/* Main split viewport container (Fixed Height, Data scrolls inside) */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-100/50">
        
        {/* Left Category Navigation Sidebar (Fixed & Sticky - Hidden on mobile, shown on lg screens) */}
        {!isSearching && (
          <aside className="hidden lg:flex flex-col w-72 bg-white border-r border-slate-200/80 overflow-y-auto flex-none">
            <div className="p-4 border-b border-slate-100 bg-slate-50/30">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block mb-1">
                {activeLang === 'en' ? "Documentation Chapters" : "নথিপত্র অধ্যায়সমূহ"}
              </span>
              <p className="text-[11px] text-slate-500">
                {activeLang === 'en' ? "Select a core module to begin reading" : "পড়তে যেকোনো ১টি মডিউল নির্বাচন করুন"}
              </p>
            </div>
            <nav className="p-3 space-y-1">
              {HELP_DOCS.map((cat) => {
                const Icon = iconMap[cat.iconName] || BookOpen;
                const isSelected = cat.id === activeCategoryId;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategoryId(cat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left border transition-all duration-150 relative group",
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                        : "bg-transparent border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <Icon className={cn("w-4.5 h-4.5", isSelected ? "text-white" : "text-slate-400 group-hover:text-slate-600")} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate leading-tight">
                        {activeLang === 'en' ? cat.title : cat.bnTitle}
                      </p>
                      <p className={cn("text-[9px] truncate mt-0.5 leading-none", isSelected ? "text-blue-100" : "text-slate-400")}>
                        {activeLang === 'en' ? cat.sections.length + " modules" : cat.sections.length + " টি নির্দেশিকা"}
                      </p>
                    </div>
                    {!isSelected && (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="w-4 h-4 text-slate-400 flex-none" />
                <span className="text-[10px] font-semibold text-slate-500">Need direct branch assist?</span>
              </div>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 transition-colors"
              >
                <span>Branch Settings</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </aside>
        )}

        {/* Right Content/Data Panel (Scrolls underneath header) */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-8 py-6 max-w-4xl mx-auto w-full custom-scrollbar">
          
          <AnimatePresence mode="wait">
            {isSearching ? (
              // SEARCH RESULTS VIEW
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-500">
                    {activeLang === 'en' 
                      ? `${searchResults.length} Match${searchResults.length !== 1 ? 'es' : ''} for "${searchQuery}"`
                      : `"${searchQuery}" এর জন্য ${searchResults.length} টি ফলাফল পাওয়া গেছে`
                    }
                  </h2>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] font-bold uppercase tracking-wider text-blue-600 hover:underline"
                  >
                    Clear Search
                  </button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-4">
                    {searchResults.map(({ category, section }, idx) => (
                      <div
                        key={`${category.id}-${idx}`}
                        className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3"
                      >
                        {/* Parent Chapter Badge */}
                        <div className="flex items-center justify-between gap-2 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                          <span className="flex items-center gap-1">
                            <Rocket className="w-3 h-3" />
                            {activeLang === 'en' ? category.title : category.bnTitle}
                          </span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                            {category.id}
                          </span>
                        </div>

                        <h3 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight border-b border-slate-100 pb-2">
                          {activeLang === 'en' ? section.title : section.bnTitle}
                        </h3>

                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                          {activeLang === 'en' ? section.content : section.bnContent}
                        </p>

                        {/* Rendering steps or points if they exist */}
                        {section.points && section.points.length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-3 sm:p-4 border border-slate-150 space-y-2 mt-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                              Key Directives / নিয়মাবলি
                            </span>
                            <ul className="space-y-2">
                              {(activeLang === 'en' ? section.points : section.bnPoints)?.map((pt, pIdx) => (
                                <li key={pIdx} className="flex gap-2 text-xs text-slate-600">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-none mt-0.5" />
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                    <Search className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 font-semibold">No detailed instructions match your query</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                      Try searching with different terms like "Ledger", "Voucher", "Tax", "Loan" or "Gold Membership".
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              // STANDARD DUAL PANEL VIEW / ACTIVE CATEGORY SELECTOR
              <motion.div
                key={activeCategory.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.15 }}
                className="space-y-6"
              >
                {/* Visual Category Header Cards */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-6 shadow-md shadow-blue-500/5 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 translate-x-1/6 translate-y-1/6 scale-120 opacity-10 pointer-events-none">
                    <BookOpen className="w-64 h-64" />
                  </div>
                  <div className="max-w-xl space-y-2 z-10 relative">
                    <span className="inline-block px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-white/20 text-white border border-white/10">
                      Chapter {HELP_DOCS.findIndex(c => c.id === activeCategoryId) + 1} Guide
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
                      {activeLang === 'en' ? activeCategory.title : activeCategory.bnTitle}
                    </h2>
                    <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
                      {activeLang === 'en' ? activeCategory.description : activeCategory.bnDescription}
                    </p>
                  </div>

                  {/* Horizontal pill navigation triggers ONLY visible on mobile views */}
                  <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-4 mt-2">
                    {HELP_DOCS.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategoryId(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap border z-10",
                          cat.id === activeCategoryId
                            ? "bg-white text-blue-700 border-white"
                            : "bg-white/10 text-white hover:bg-white/20 border-white/10"
                        )}
                      >
                        {activeLang === 'en' ? cat.title.split(' ')[0] : cat.bnTitle}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subsections Content List */}
                <div className="space-y-5">
                  {activeCategory.sections.map((sec, idx) => {
                    const isFaqSection = activeCategory.id === 'faq';
                    const faqKey = `faq-${idx}`;
                    const isFaqExpanded = expandedFaqs[faqKey] || false;

                    if (isFaqSection) {
                      // Custom Accordion Layout for FAQs
                      return (
                        <div 
                          key={idx}
                          className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-350 transition-all cursor-pointer"
                          onClick={() => handleToggleFaq(faqKey)}
                        >
                          <div className="p-4 sm:p-5 flex items-center justify-between gap-4 select-none">
                            <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                              <HelpCircle className="w-5 h-5 text-blue-500 flex-none" />
                              <span>{activeLang === 'en' ? sec.title : sec.bnTitle}</span>
                            </h3>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-full flex-none">
                              {isFaqExpanded ? (activeLang === 'en' ? 'Close' : 'বন্ধ করুন') : (activeLang === 'en' ? 'Expand' : 'উত্তর দেখুন')}
                            </span>
                          </div>
                          
                          {isFaqExpanded && (
                            <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/20 space-y-3 animate-in duration-150 slide-in-from-top-1.5">
                              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                                {activeLang === 'en' ? sec.content : sec.bnContent}
                              </p>
                              {sec.tip && (
                                <div className="flex gap-2.5 bg-blue-50 border border-blue-100 text-blue-800 p-3.5 rounded-xl text-xs leading-relaxed">
                                  <Lightbulb className="w-4 h-4 text-blue-600 flex-none mt-0.5" />
                                  <div>
                                    <span className="font-black uppercase tracking-wider text-[10px] block mb-0.5">
                                      {activeLang === 'en' ? 'PRO-TIP DOCUMENT' : 'প্রো-টিপ গাইড'}
                                    </span>
                                    <span>{activeLang === 'en' ? sec.tip : sec.bnTip}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
                      >
                        {/* Title of Instruction section */}
                        <div className="border-b border-sky-100 pb-3 flex items-center justify-between">
                          <h3 className="font-extrabold text-slate-800 text-sm sm:text-base tracking-tight">
                            {activeLang === 'en' ? sec.title : sec.bnTitle}
                          </h3>
                          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            MODULE {idx + 1}
                          </span>
                        </div>

                        {/* Summary Narrative */}
                        <p className="text-slate-650 text-xs sm:text-sm leading-relaxed text-slate-700">
                          {activeLang === 'en' ? sec.content : sec.bnContent}
                        </p>

                        {/* Rendering Bullet Action lists */}
                        {sec.points && sec.points.length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-150 space-y-3">
                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
                              {activeLang === 'en' ? 'Instruction Checklist' : 'পরিচালনা নির্দেশনাবলি'}
                            </span>
                            <div className="space-y-2.5">
                              {(activeLang === 'en' ? sec.points : sec.bnPoints)?.map((point, pIdx) => {
                                // Match and wrap keyboard keys format like "F5" or "F8" of Alt keys inside visual elements
                                const parts = point.split(/(\(.*?\)|Alt\+\w|Cmd\+\w|Ctrl\+\w)/g);
                                return (
                                  <div key={pIdx} className="flex gap-2.5 items-start text-xs text-slate-700">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-none mt-0.5" />
                                    <span>
                                      {parts.map((part, pPartIdx) => {
                                        const isShortcut = part.startsWith('Alt+') || part.startsWith('Cmd+') || part.startsWith('Ctrl+') || (part.startsWith('(') && part.endsWith(')'));
                                        if (isShortcut) {
                                          return (
                                            <kbd key={pPartIdx} className="mx-1 px-1.5 py-0.5 bg-slate-200 border-b border-slate-300 font-mono font-black rounded text-[10px] text-slate-800 shadow-sm leading-none inline-block">
                                              {part.replace(/[()]/g, '')}
                                            </kbd>
                                          );
                                        }
                                        return <span key={pPartIdx}>{part}</span>;
                                      })}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Pro-Tips Callouts (Light Blue Background) */}
                        {sec.tip && (
                          <div className="flex gap-3 bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl text-xs leading-relaxed">
                            <Lightbulb className="w-4.5 h-4.5 text-blue-500 flex-none mt-0.5" />
                            <div>
                              <span className="font-extrabold uppercase tracking-widest text-[9px] text-blue-700 block mb-0.5">
                                {activeLang === 'en' ? 'Pro-tip Guide' : 'জরুরী প্রো-টিপ'}
                              </span>
                              <span>{activeLang === 'en' ? sec.tip : sec.bnTip}</span>
                            </div>
                          </div>
                        )}

                        {/* Warnings Callouts (Soft Orange Background) */}
                        {sec.warning && (
                          <div className="flex gap-3 bg-rose-50 border border-rose-100 text-rose-800 p-4 rounded-xl text-xs leading-relaxed">
                            <AlertTriangle className="w-4.5 h-4.5 text-rose-500 flex-none mt-0.5" />
                            <div>
                              <span className="font-extrabold uppercase tracking-widest text-[9px] text-rose-700 block mb-0.5">
                                {activeLang === 'en' ? 'Critical Rule / Restriction' : 'জরুরী সতর্কতা / নিয়মাবলীবলি'}
                              </span>
                              <span>{activeLang === 'en' ? sec.warning : sec.bnWarning}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Additional Accounting Grouping reference table helper inside specific accounts chapter */}
                {activeCategory.id === 'accounting-ledgers' && (
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50 border-b border-slate-200">
                      <span className="text-[10px] font-black tracking-wider uppercase text-slate-400">
                        {activeLang === 'en' ? "Ledger Grouping Reference Table" : "লেজার গ্রুপিং নির্দেশক সাহায্য ছক"}
                      </span>
                    </div>
                    {/* Tables MUST have sticky headers as requested by AGENTS.md */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-[10px] tracking-wider uppercase font-extrabold text-slate-500 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="px-4 py-3">{activeLang === 'en' ? "Group Name" : "লেজার গ্রুপ নাম"}</th>
                            <th className="px-4 py-3">{activeLang === 'en' ? "Normal Balance" : "স্বাভাবিক ব্যালেন্স"}</th>
                            <th className="px-4 py-3">{activeLang === 'en' ? "Target Purpose / Ideal Use Cases" : "ব্যবহার ক্ষেত্র / উদাহরণ"}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          <tr>
                            <td className="px-4 py-3 bg-white font-bold">{activeLang === 'en' ? "Sundry Debtors" : "Sundry Debtors"}</td>
                            <td className="px-4 py-3 bg-white text-blue-600 font-semibold">Debit (ডেবিট)</td>
                            <td className="px-4 py-3 bg-white text-slate-500">Retailers, direct clients, distributors who acquire goods on structural credits.</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 bg-white font-bold">{activeLang === 'en' ? "Sundry Creditors" : "Sundry Creditors"}</td>
                            <td className="px-4 py-3 bg-white text-rose-600 font-semibold">Credit (ক্রেডিট)</td>
                            <td className="px-4 py-3 bg-white text-slate-500">Raw material suppliers, logistics partners, and utility service builders.</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 bg-white font-bold">{activeLang === 'en' ? "Bank Accounts" : "Bank Accounts"}</td>
                            <td className="px-4 py-3 bg-white text-blue-600 font-semibold">Debit (ডেবিট)</td>
                            <td className="px-4 py-3 bg-white text-slate-500">Corporate savings portals, current accounts, and digital check deposit books.</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 bg-white font-bold">{activeLang === 'en' ? "Hand in Cash" : "Hand in Cash"}</td>
                            <td className="px-4 py-3 bg-white text-blue-600 font-semibold">Debit (ডেবিট)</td>
                            <td className="px-4 py-3 bg-white text-slate-500">Physical shop floor registers, cash registers, safe draws, and petty cash.</td>
                          </tr>
                          <tr>
                            <td className="px-4 py-3 bg-white font-bold">{activeLang === 'en' ? "Direct/Indirect Expenses" : "Indirect Expenses"}</td>
                            <td className="px-4 py-3 bg-white text-blue-600 font-semibold">Debit (ডেবিট)</td>
                            <td className="px-4 py-3 bg-white text-slate-500">Rent, factory electricity bill, employee salary outlays, tea and coffee provisions.</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
