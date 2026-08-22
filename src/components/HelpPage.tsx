import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, BookOpen, Search, Languages, HelpCircle, 
  Rocket, FileText, Package, Users, BarChart2, Keyboard, 
  AlertTriangle, Lightbulb, ChevronRight, CheckCircle2,
  Info, ExternalLink, Sparkles, Image as ImageIcon,
  Check, ThumbsUp, ThumbsDown, Printer, CornerDownRight,
  Layers, Settings, Share2, Compass, Shield, Zap, ChevronDown
} from 'lucide-react';
import { HELP_DOCS, DocCategory, DocSubSection } from '../constants/helpContent';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import InteractiveScreenMockup from './InteractiveScreenMockup';
import ScreenshotManagerModal from './ScreenshotManagerModal';

export default function HelpPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [activeLang, setActiveLang] = useState<'en' | 'bn'>('en');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryId, setActiveCategoryId] = useState('getting-started');
  const [activeSectionId, setActiveSectionId] = useState<string>('gs-interface');
  const [expandedFaqs, setExpandedFaqs] = useState<Record<string, boolean>>({});
  const [isScreenshotModalOpen, setIsScreenshotModalOpen] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({});

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
    settings: Settings,
    layers: Layers
  };

  // Find active category
  const activeCategory = useMemo(() => {
    return HELP_DOCS.find(cat => cat.id === activeCategoryId) || HELP_DOCS[0];
  }, [activeCategoryId]);

  // Sync active section when category changes if section not in category
  useEffect(() => {
    if (activeCategory.sections.length > 0) {
      const sectionExists = activeCategory.sections.some(s => s.id === activeSectionId);
      if (!sectionExists) {
        setActiveSectionId(activeCategory.sections[0].id);
      }
    }
  }, [activeCategoryId, activeCategory, activeSectionId]);

  // Filter categories and subsections based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const matches: { category: DocCategory; section: DocSubSection }[] = [];

    HELP_DOCS.forEach(cat => {
      cat.sections.forEach(sec => {
        const titleMatch = (activeLang === 'en' ? sec.title : sec.bnTitle).toLowerCase().includes(query);
        const contentMatch = (activeLang === 'en' ? sec.content : sec.bnContent).toLowerCase().includes(query);
        const whereMatch = ((activeLang === 'en' ? sec.whereToFind : sec.bnWhereToFind) || '').toLowerCase().includes(query);
        const pointsMatch = (activeLang === 'en' ? sec.points : sec.bnPoints)?.some(pt => pt.toLowerCase().includes(query)) || false;
        const fieldsMatch = sec.fields?.some(f => 
          (activeLang === 'en' ? f.name : f.bnName).toLowerCase().includes(query) ||
          (activeLang === 'en' ? f.description : f.bnDescription).toLowerCase().includes(query)
        ) || false;

        if (titleMatch || contentMatch || whereMatch || pointsMatch || fieldsMatch) {
          matches.push({ category: cat, section: sec });
        }
      });
    });

    return matches;
  }, [searchQuery, activeLang]);

  const handleToggleFaq = (key: string) => {
    setExpandedFaqs(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFeedback = (sectionId: string, value: 'yes' | 'no') => {
    setFeedbackGiven(prev => ({ ...prev, [sectionId]: value }));
  };

  // Keyboard shortcut Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && (e.target as HTMLElement).tagName !== 'INPUT')) {
        e.preventDefault();
        const searchInput = document.getElementById('docs-search-input');
        if (searchInput) {
          searchInput.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  // Flattened all sections for Next/Previous topic navigation
  const allSectionsWithCat = useMemo(() => {
    const list: { category: DocCategory; section: DocSubSection }[] = [];
    HELP_DOCS.forEach(cat => {
      cat.sections.forEach(sec => {
        list.push({ category: cat, section: sec });
      });
    });
    return list;
  }, []);

  const currentFlatIndex = useMemo(() => {
    return allSectionsWithCat.findIndex(item => item.section.id === activeSectionId);
  }, [allSectionsWithCat, activeSectionId]);

  const prevSection = currentFlatIndex > 0 ? allSectionsWithCat[currentFlatIndex - 1] : null;
  const nextSection = currentFlatIndex < allSectionsWithCat.length - 1 ? allSectionsWithCat[currentFlatIndex + 1] : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* 1. FIXED TOPBAR HEADER (Softr Style - Fixed and Permanent per AGENTS.md) */}
      <header className="flex-none bg-white border-b border-slate-200/90 shadow-xs px-4 lg:px-7 py-3 z-30">
        <div className="flex items-center justify-between gap-4">
          
          {/* Logo & Documentation Title */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/dashboard')}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white shadow-xs text-slate-700 flex items-center gap-1.5"
              title="Return to ERP System"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold hidden sm:inline">{activeLang === 'en' ? 'App' : 'অ্যাপ'}</span>
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
                <BookOpen className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-slate-900 tracking-tight">
                    TallyFlow <span className="text-blue-600">Docs</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Public & Live
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-semibold tracking-wide leading-none mt-0.5">
                  {activeLang === 'en' ? 'Complete User Guide & Knowledge Base' : 'পূর্ণাঙ্গ ব্যবহার নির্দেশিকা ও ফিচার নথিপত্র'}
                </p>
              </div>
            </div>
          </div>

          {/* Center Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="docs-search-input"
              type="text"
              placeholder={activeLang === 'en' ? "Search features, options, rules, shortcuts... (Ctrl+K)" : "ফিচার, অপশন, নিয়ম বা শর্টকাট খুঁজুন... (Ctrl+K)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200/90 rounded-xl pl-10 pr-9 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 hover:text-slate-600"
              >
                ESC
              </button>
            )}
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Screenshot Manager Trigger */}
            <button
              onClick={() => setIsScreenshotModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold transition-colors"
              title="Upload custom screenshots"
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-600" />
              <span>{activeLang === 'en' ? 'Screenshots' : 'স্ক্রিনশট'}</span>
            </button>

            {/* Print Documentation */}
            <button
              onClick={() => window.print()}
              className="p-2 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs transition-colors"
              title="Print Documentation"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveLang('en')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  activeLang === 'en' 
                    ? "bg-white text-blue-700 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                EN
              </button>
              <button
                onClick={() => setActiveLang('bn')}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                  activeLang === 'bn' 
                    ? "bg-white text-blue-700 shadow-xs" 
                    : "text-slate-600 hover:text-slate-900"
                )}
              >
                বাংলা
              </button>
            </div>

            {/* Launch App Button */}
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden lg:flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <span>{activeLang === 'en' ? 'Open App' : 'অ্যাপে যান'}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-2.5 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={activeLang === 'en' ? "Search docs..." : "ডক খুঁজুন..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
        </div>
      </header>

      {/* 2. MAIN 3-COLUMN SOFTR LAYOUT CONTAINER */}
      <div className="flex-1 flex overflow-hidden min-h-0 bg-slate-50">
        
        {/* LEFT COLUMN: CHAPTERS & SECTIONS SIDEBAR (Fixed & Sticky - Hidden on small screens) */}
        {!isSearching && (
          <aside className="hidden md:flex flex-col w-72 lg:w-80 bg-white border-r border-slate-200/80 overflow-y-auto flex-none custom-scrollbar">
            
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                {activeLang === 'en' ? "Knowledge Base Chapters" : "ডকুমেন্টেশন অধ্যায়সমূহ"}
              </span>
              <p className="text-[11px] text-slate-500 font-medium">
                {activeLang === 'en' ? "Explore guides by business function" : "নির্দিষ্ট মডিউল নির্বাচন করুন"}
              </p>
            </div>

            <nav className="p-3 space-y-3">
              {HELP_DOCS.map((cat) => {
                const Icon = iconMap[cat.iconName] || BookOpen;
                const isSelectedCat = cat.id === activeCategoryId;
                
                return (
                  <div key={cat.id} className="space-y-1">
                    {/* Category Header Button */}
                    <button
                      onClick={() => {
                        setActiveCategoryId(cat.id);
                        if (cat.sections.length > 0) {
                          setActiveSectionId(cat.sections[0].id);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 group",
                        isSelectedCat 
                          ? "bg-blue-50 text-blue-900 font-bold border border-blue-100" 
                          : "text-slate-700 hover:bg-slate-100/80 font-semibold"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={cn("w-4 h-4 flex-none", isSelectedCat ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600")} />
                        <span className="text-xs truncate">
                          {activeLang === 'en' ? cat.title : cat.bnTitle}
                        </span>
                      </div>
                      {cat.badge && (
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 flex-none ml-2">
                          {cat.badge}
                        </span>
                      )}
                    </button>

                    {/* Sub-sections tree (Expanded if category is active) */}
                    {isSelectedCat && (
                      <div className="pl-4 pr-1 py-1 space-y-0.5 border-l-2 border-blue-200 ml-4 my-1">
                        {cat.sections.map((sec) => {
                          const isSectionActive = sec.id === activeSectionId;
                          return (
                            <button
                              key={sec.id}
                              onClick={() => setActiveSectionId(sec.id)}
                              className={cn(
                                "w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] transition-colors flex items-center justify-between group",
                                isSectionActive
                                  ? "bg-blue-600 text-white font-bold shadow-xs"
                                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium"
                              )}
                            >
                              <span className="truncate pr-1">
                                {activeLang === 'en' ? sec.title : sec.bnTitle}
                              </span>
                              {sec.hotkey && (
                                <span className={cn(
                                  "text-[9px] font-mono font-bold px-1 rounded flex-none",
                                  isSectionActive ? "bg-blue-700 text-blue-100" : "bg-slate-100 text-slate-500"
                                )}>
                                  {sec.hotkey}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Sticky Sidebar Footer */}
            <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
              <div className="flex items-center gap-2 text-slate-600">
                <Info className="w-4 h-4 text-slate-400 flex-none" />
                <span className="text-[10px] font-semibold text-slate-500">
                  {activeLang === 'en' ? 'Need ERP configuration?' : 'সিস্টেম কনফিগার করতে চান?'}
                </span>
              </div>
              <button 
                onClick={() => navigate('/settings')}
                className="w-full flex items-center justify-between text-left px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 hover:bg-slate-100 text-blue-600 transition-colors shadow-xs"
              >
                <span>{activeLang === 'en' ? 'Branch Settings' : 'সিস্টেম সেটিংস'}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </aside>
        )}

        {/* CENTER COLUMN: MAIN DOCUMENTATION CONTENT (Scrolls underneath fixed header) */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 lg:px-12 py-6 custom-scrollbar">
          <div className="max-w-4xl mx-auto space-y-8 pb-16">
            
            <AnimatePresence mode="wait">
              {isSearching ? (
                // SEARCH RESULTS OVERVIEW
                <motion.div
                  key="search-view"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700">
                        {activeLang === 'en' 
                          ? `${searchResults.length} Result${searchResults.length !== 1 ? 's' : ''} for "${searchQuery}"`
                          : `"${searchQuery}" এর জন্য ${searchResults.length} টি ফলাফল পাওয়া গেছে`
                        }
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {activeLang === 'en' ? 'Click on any topic to jump directly to its complete guide' : 'সম্পূর্ণ গাইড দেখতে যেকোনো বিষয়ে ক্লিক করুন'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="text-xs font-bold text-blue-600 hover:underline bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200"
                    >
                      {activeLang === 'en' ? 'Clear Search' : 'সার্চ মুছুন'}
                    </button>
                  </div>

                  {searchResults.length > 0 ? (
                    <div className="space-y-4">
                      {searchResults.map(({ category, section }, idx) => (
                        <div
                          key={`${category.id}-${section.id}-${idx}`}
                          onClick={() => {
                            setActiveCategoryId(category.id);
                            setActiveSectionId(section.id);
                            setSearchQuery('');
                          }}
                          className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer space-y-3 group"
                        >
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono font-bold uppercase text-slate-400">
                            <span className="flex items-center gap-1.5 text-blue-600 font-sans">
                              <BookOpen className="w-3.5 h-3.5" />
                              {activeLang === 'en' ? category.title : category.bnTitle}
                            </span>
                            {section.hotkey && (
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-bold border border-slate-200">
                                {section.hotkey}
                              </span>
                            )}
                          </div>

                          <h3 className="font-bold text-slate-900 text-sm sm:text-base group-hover:text-blue-600 transition-colors">
                            {activeLang === 'en' ? section.title : section.bnTitle}
                          </h3>

                          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed line-clamp-3">
                            {activeLang === 'en' ? section.content : section.bnContent}
                          </p>

                          {section.whereToFind && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
                              <Compass className="w-3.5 h-3.5 text-slate-400 flex-none" />
                              <span className="font-semibold">{activeLang === 'en' ? 'Location: ' : 'কোথায় পাবেন: '}</span>
                              <span>{activeLang === 'en' ? section.whereToFind : section.bnWhereToFind}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                      <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-base text-slate-700 font-bold">
                        {activeLang === 'en' ? 'No matching documentation found' : 'কোনো নির্দেশিকা পাওয়া যায়নি'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                        {activeLang === 'en' 
                          ? 'Try searching for words like "Sales", "Voucher", "Ledger", "BOM", "Attendance", or "Trial Balance".' 
                          : '"বিক্রয়", "ভাউচার", "লেজার", "হাজিরা", বা "ট্রায়াল ব্যালেন্স" লিখে সার্চ করে দেখুন।'}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                // COMPLETE SOFTR DOCS ARTICLE VIEW
                <motion.div
                  key={`${activeCategoryId}-${activeSectionId}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  className="space-y-8"
                >
                  {/* Breadcrumbs */}
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <span className="hover:text-blue-600 cursor-pointer" onClick={() => setActiveCategoryId('getting-started')}>
                      {activeLang === 'en' ? 'Docs' : 'নির্দেশিকা'}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-700">
                      {activeLang === 'en' ? activeCategory.title : activeCategory.bnTitle}
                    </span>
                  </div>

                  {/* Active Category Mobile Tabs */}
                  <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
                    {HELP_DOCS.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          setActiveCategoryId(cat.id);
                          if (cat.sections.length > 0) {
                            setActiveSectionId(cat.sections[0].id);
                          }
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border transition-all",
                          cat.id === activeCategoryId
                            ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                            : "bg-white text-slate-700 hover:bg-slate-100 border-slate-200"
                        )}
                      >
                        {activeLang === 'en' ? cat.title.split(' ')[0] : cat.bnTitle}
                      </button>
                    ))}
                  </div>

                  {/* Top Header Card of Section */}
                  {(() => {
                    const sec = activeCategory.sections.find(s => s.id === activeSectionId) || activeCategory.sections[0];
                    if (!sec) return null;

                    return (
                      <div className="space-y-6">
                        
                        {/* Section Title & Badges */}
                        <div className="space-y-3 border-b border-slate-200 pb-6">
                          <div className="flex flex-wrap items-center gap-2">
                            {sec.hotkey && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-900 text-amber-400 shadow-xs">
                                <Keyboard className="w-3.5 h-3.5" />
                                <span>{sec.hotkey}</span>
                              </span>
                            )}
                            {sec.planBadge && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Zap className="w-3 h-3 text-amber-600" />
                                <span>{sec.planBadge}</span>
                              </span>
                            )}
                            {sec.path && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono bg-blue-50 text-blue-700 border border-blue-200">
                                <span>{sec.path}</span>
                              </span>
                            )}
                          </div>

                          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {activeLang === 'en' ? sec.title : sec.bnTitle}
                          </h1>

                          {/* Where to Find Card */}
                          {sec.whereToFind && (
                            <div className="flex items-start gap-2.5 bg-sky-50/80 border border-sky-200/80 p-3.5 rounded-xl text-xs text-sky-900">
                              <Compass className="w-4 h-4 text-sky-600 flex-none mt-0.5" />
                              <div>
                                <span className="font-black uppercase tracking-wider text-[10px] text-sky-700 block mb-0.5">
                                  {activeLang === 'en' ? 'WHERE TO FIND IN THE APP:' : 'অ্যাপ্লিকেশনে কোথায় পাবেন:'}
                                </span>
                                <span className="font-semibold font-mono">
                                  {activeLang === 'en' ? sec.whereToFind : sec.bnWhereToFind}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Interactive UI Screen Emulator / Screenshot */}
                        <div id="visual-screen-mockup" className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-amber-500" />
                              <span>
                                {activeLang === 'en' ? 'Visual UI Layout & Field Guidance' : 'ভিজ্যুয়াল স্ক্রিন লেআউট ও ফিল্ড গাইড'}
                              </span>
                            </h3>
                            <button
                              onClick={() => setIsScreenshotModalOpen(true)}
                              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{activeLang === 'en' ? 'Manage Screenshot' : 'স্ক্রিনশট পরিবর্তন'}</span>
                            </button>
                          </div>

                          <InteractiveScreenMockup 
                            categoryId={activeCategoryId}
                            sectionId={sec.id}
                            lang={activeLang}
                            onOpenScreenshotManager={() => setIsScreenshotModalOpen(true)}
                          />
                        </div>

                        {/* Main Description & Purpose */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
                          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                            <span>{activeLang === 'en' ? 'Feature Purpose & What You Can Accomplish' : 'ফিচারের মূল কাজ ও কী কী করা সম্ভব'}</span>
                          </h3>
                          <p className="text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-normal">
                            {activeLang === 'en' ? sec.content : sec.bnContent}
                          </p>
                        </div>

                        {/* Step-by-Step How-To Action Checklist */}
                        {sec.points && sec.points.length > 0 && (
                          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>{activeLang === 'en' ? 'Step-by-Step How-To Instructions' : 'ধাপে ধাপে কীভাবে কাজটি করবেন'}</span>
                              </h3>
                              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                                {sec.points.length} {activeLang === 'en' ? 'STEPS' : 'ধাপ'}
                              </span>
                            </div>

                            <div className="space-y-3">
                              {(activeLang === 'en' ? sec.points : sec.bnPoints)?.map((point, pIdx) => {
                                return (
                                  <div key={pIdx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 bg-slate-50/70 p-3 rounded-xl border border-slate-150">
                                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-[10px] flex-none mt-0.5">
                                      {pIdx + 1}
                                    </div>
                                    <span className="leading-relaxed">{point}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Option & Field Definitions Reference Table */}
                        {sec.fields && sec.fields.length > 0 && (
                          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-0">
                            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight flex items-center gap-2">
                                <Layers className="w-4 h-4 text-indigo-600" />
                                <span>{activeLang === 'en' ? 'Options & Fields Reference Guide' : 'প্রতিটি অপশন ও ফিল্ডের বিস্তারিত ব্যাখ্যা'}</span>
                              </h3>
                              <p className="text-[11px] text-slate-500 mt-1">
                                {activeLang === 'en' ? 'Detailed breakdown of all input parameters and validation rules' : 'ফর্মের প্রতিটি ইনপুট অপশনের কাজ ও নিয়মের বিবরণ'}
                              </p>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs">
                                <thead className="bg-slate-100/80 border-b border-slate-200 font-bold text-[10px] uppercase text-slate-600">
                                  <tr>
                                    <th className="px-4 py-3">{activeLang === 'en' ? 'Field / Option Name' : 'ফিল্ড বা অপশনের নাম'}</th>
                                    <th className="px-4 py-3">{activeLang === 'en' ? 'Type / Rule' : 'ধরন / নিয়ম'}</th>
                                    <th className="px-4 py-3">{activeLang === 'en' ? 'Exact Behavior & Purpose' : 'সুনির্দিষ্ট কাজ ও ব্যাখ্যা'}</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {sec.fields.map((f, fIdx) => (
                                    <tr key={fIdx} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                                        <div className="flex items-center gap-1.5">
                                          <span>{activeLang === 'en' ? f.name : f.bnName}</span>
                                          {f.required && (
                                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1 py-0.2 rounded">
                                              Required
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                          {f.type}
                                        </span>
                                      </td>
                                      <td className="px-4 py-3 text-slate-600 leading-relaxed">
                                        {activeLang === 'en' ? f.description : f.bnDescription}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Real-World Business Example Walkthrough */}
                        {sec.example && (
                          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-700/80 pb-3">
                              <Sparkles className="w-5 h-5 text-amber-400" />
                              <div>
                                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400 block">
                                  {activeLang === 'en' ? 'PRACTICAL CASE STUDY' : 'বাস্তব ব্যবসায়িক উদাহরণ'}
                                </span>
                                <h4 className="font-bold text-sm sm:text-base text-white">
                                  {activeLang === 'en' ? sec.example.scenario : sec.example.bnScenario}
                                </h4>
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 block">
                                {activeLang === 'en' ? 'Resolution Walkthrough:' : 'সমাধান প্রক্রিয়া:'}
                              </span>
                              {(activeLang === 'en' ? sec.example.steps : sec.example.bnSteps).map((step, sIdx) => (
                                <div key={sIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-200 bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                                  <CornerDownRight className="w-4 h-4 text-amber-400 flex-none mt-0.5" />
                                  <span className="leading-relaxed">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Pro-Tips Callout (Soft Sky Box) */}
                        {sec.tip && (
                          <div className="flex gap-3 bg-blue-50 border border-blue-200 text-blue-900 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs">
                            <Lightbulb className="w-5 h-5 text-blue-600 flex-none mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-black uppercase tracking-wider text-[10px] text-blue-700 block">
                                {activeLang === 'en' ? 'PRO TIP & BEST PRACTICE:' : 'প্রো-টিপ ও সেরা নিয়ম:'}
                              </span>
                              <p>{activeLang === 'en' ? sec.tip : sec.bnTip}</p>
                            </div>
                          </div>
                        )}

                        {/* Warnings Callout (Soft Rose Box) */}
                        {sec.warning && (
                          <div className="flex gap-3 bg-rose-50 border border-rose-200 text-rose-900 p-4 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs">
                            <AlertTriangle className="w-5 h-5 text-rose-600 flex-none mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-black uppercase tracking-wider text-[10px] text-rose-700 block">
                                {activeLang === 'en' ? 'CRITICAL WARNING & PITFALLS:' : 'জরুরী সতর্কতা ও ভুল এড়ানোর উপায়:'}
                              </span>
                              <p>{activeLang === 'en' ? sec.warning : sec.bnWarning}</p>
                            </div>
                          </div>
                        )}

                        {/* Next & Previous Topic Navigation Footer */}
                        <div className="pt-6 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {prevSection ? (
                            <button
                              onClick={() => {
                                setActiveCategoryId(prevSection.category.id);
                                setActiveSectionId(prevSection.section.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-left transition-all group shadow-xs"
                            >
                              <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                              <div className="min-w-0">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                                  {activeLang === 'en' ? 'Previous Topic' : 'পূর্ববর্তী বিষয়'}
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate block group-hover:text-blue-600">
                                  {activeLang === 'en' ? prevSection.section.title : prevSection.section.bnTitle}
                                </span>
                              </div>
                            </button>
                          ) : <div />}

                          {nextSection ? (
                            <button
                              onClick={() => {
                                setActiveCategoryId(nextSection.category.id);
                                setActiveSectionId(nextSection.section.id);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                              className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/40 text-right transition-all group shadow-xs sm:ml-auto w-full"
                            >
                              <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                                  {activeLang === 'en' ? 'Next Topic' : 'পরবর্তী বিষয়'}
                                </span>
                                <span className="text-xs font-bold text-slate-800 truncate block group-hover:text-blue-600">
                                  {activeLang === 'en' ? nextSection.section.title : nextSection.section.bnTitle}
                                </span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors ml-3" />
                            </button>
                          ) : <div />}
                        </div>

                        {/* Article Feedback Widget */}
                        <div className="bg-slate-100/80 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {activeLang === 'en' ? 'Was this article helpful?' : 'এই আর্টিকেলটি কি আপনার জন্য সহায়ক ছিল?'}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {activeLang === 'en' ? 'Help us improve our documentation for all business teams' : 'ডকুমেন্টেশন আরো উন্নত করতে মতামত দিন'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {feedbackGiven[sec.id] ? (
                              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5" />
                                <span>{activeLang === 'en' ? 'Thank you for your feedback!' : 'মতামতের জন্য ধন্যবাদ!'}</span>
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleFeedback(sec.id, 'yes')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                  <ThumbsUp className="w-3.5 h-3.5" />
                                  <span>{activeLang === 'en' ? 'Yes' : 'হ্যাঁ'}</span>
                                </button>
                                <button
                                  onClick={() => handleFeedback(sec.id, 'no')}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-700 hover:text-rose-700 rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                  <ThumbsDown className="w-3.5 h-3.5" />
                                  <span>{activeLang === 'en' ? 'No' : 'না'}</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })()}

                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>

        {/* RIGHT COLUMN: "ON THIS PAGE" TABLE OF CONTENTS (Desktop Only) */}
        {!isSearching && (
          <aside className="hidden xl:flex flex-col w-64 bg-slate-50/50 border-l border-slate-200/80 p-5 overflow-y-auto flex-none">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">
              {activeLang === 'en' ? 'On this page' : 'এই পাতার বিষয়সূচি'}
            </span>
            <nav className="space-y-2 text-xs font-medium text-slate-600">
              <a href="#visual-screen-mockup" className="block hover:text-blue-600 transition-colors">
                • {activeLang === 'en' ? 'Visual UI Layout & Callouts' : 'ভিজ্যুয়াল স্ক্রিন ও গাইড'}
              </a>
              <p className="text-slate-400 pl-2">
                • {activeLang === 'en' ? 'Feature Purpose' : 'ফিচারের মূল উদ্দেশ্য'}
              </p>
              <p className="text-slate-400 pl-2">
                • {activeLang === 'en' ? 'Step-by-Step Guide' : 'ধাপে ধাপে নির্দেশিকা'}
              </p>
              <p className="text-slate-400 pl-2">
                • {activeLang === 'en' ? 'Options & Fields' : 'ফিল্ড ও অপশন তালিকা'}
              </p>
              <p className="text-slate-400 pl-2">
                • {activeLang === 'en' ? 'Business Case Study' : 'কেস স্টাডি উদাহরণ'}
              </p>
              <p className="text-slate-400 pl-2">
                • {activeLang === 'en' ? 'Pro Tips & Warnings' : 'টিপস ও সতর্কতা'}
              </p>
            </nav>

            <div className="mt-8 p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {activeLang === 'en' ? 'Quick Shortcut Tip' : 'দ্রুত শর্টকাট'}
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {activeLang === 'en' 
                  ? 'Press Alt+V anywhere to quickly record a new voucher, or Alt+L for new ledgers.' 
                  : 'যেকোনো স্ক্রিনে Alt+V চেপে নতুন ভাউচার এবং Alt+L চেপে নতুন লেজার তৈরি করা যায়।'}
              </p>
            </div>
          </aside>
        )}

      </div>

      {/* Screenshot Manager Modal */}
      <ScreenshotManagerModal 
        isOpen={isScreenshotModalOpen}
        onClose={() => setIsScreenshotModalOpen(false)}
        lang={activeLang}
        initialCategoryId={activeCategoryId}
      />

    </div>
  );
}
