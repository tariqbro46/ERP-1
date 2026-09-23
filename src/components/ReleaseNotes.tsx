import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Search, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  PlusCircle, 
  Zap, 
  Wrench, 
  ArrowLeft, 
  Printer, 
  Download, 
  ChevronRight,
  ShieldCheck,
  History,
  Layers,
  Filter
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { RELEASE_NOTES, LATEST_VERSION, ReleaseVersion } from '../data/releaseNotes';
import { useLanguage } from '../contexts/LanguageContext';
import { EditableHeader } from './EditableHeader';
import { cn } from '../lib/utils';
import { executePrint } from '../utils/printUtils';

export function ReleaseNotes() {
  const { language } = useLanguage();
  const isBn = language === 'bn';
  const navigate = useNavigate();

  const [selectedVersion, setSelectedVersion] = useState<string>(LATEST_VERSION);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'new' | 'improvements' | 'fixes'>('all');

  const activeRelease = useMemo(() => {
    return RELEASE_NOTES.find(r => r.version === selectedVersion) || RELEASE_NOTES[0];
  }, [selectedVersion]);

  // Filtered items
  const filteredRelease = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    const matchesSearch = (item: any) => {
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.bnTitle.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term) ||
        item.bnDescription.toLowerCase().includes(term) ||
        (item.module && item.module.toLowerCase().includes(term))
      );
    };

    const newFeatures = (activeCategory === 'all' || activeCategory === 'new') 
      ? activeRelease.newFeatures.filter(matchesSearch) 
      : [];
      
    const improvements = (activeCategory === 'all' || activeCategory === 'improvements') 
      ? activeRelease.improvements.filter(matchesSearch) 
      : [];
      
    const bugFixes = (activeCategory === 'all' || activeCategory === 'fixes') 
      ? activeRelease.bugFixes.filter(matchesSearch) 
      : [];

    return {
      newFeatures,
      improvements,
      bugFixes,
      total: newFeatures.length + improvements.length + bugFixes.length
    };
  }, [activeRelease, searchTerm, activeCategory]);

  const handlePrint = () => {
    executePrint(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Release Notes ${activeRelease.version} - TallyFlow ERP</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 32px; color: #0f172a; line-height: 1.5; }
            h1 { color: #1e3a8a; margin-bottom: 4px; font-size: 24px; }
            .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
            .summary { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 8px; margin-bottom: 24px; }
            h3 { margin-top: 24px; padding-bottom: 6px; font-size: 16px; border-bottom: 2px solid #e2e8f0; }
            .new-h3 { color: #059669; border-bottom-color: #059669; }
            .imp-h3 { color: #d97706; border-bottom-color: #d97706; }
            .fix-h3 { color: #2563eb; border-bottom-color: #2563eb; }
            ul { padding-left: 20px; margin-top: 8px; }
            li { margin-bottom: 12px; }
            .desc { color: #475569; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>TallyFlow ERP - Release Notes (${activeRelease.version})</h1>
          <div class="meta">Release Date: ${activeRelease.releaseDate} (${activeRelease.bnReleaseDate})</div>
          <div class="summary">
            <strong>${activeRelease.title}</strong><br/>
            <span>${activeRelease.summary}</span>
          </div>

          <h3 class="new-h3">🚀 New Features (${activeRelease.newFeatures.length})</h3>
          <ul>
            ${activeRelease.newFeatures.map(f => `
              <li>
                <strong>${f.title}</strong> (${f.module || 'Core'})<br/>
                <div class="desc">${f.description}</div>
              </li>
            `).join('')}
          </ul>

          <h3 class="imp-h3">⚡ System Improvements (${activeRelease.improvements.length})</h3>
          <ul>
            ${activeRelease.improvements.map(imp => `
              <li>
                <strong>${imp.title}</strong><br/>
                <div class="desc">${imp.description}</div>
              </li>
            `).join('')}
          </ul>

          <h3 class="fix-h3">🛠️ Bug Fixes (${activeRelease.bugFixes.length})</h3>
          <ul>
            ${activeRelease.bugFixes.map(fix => `
              <li>
                <strong>${fix.title}</strong><br/>
                <div class="desc">${fix.description}</div>
              </li>
            `).join('')}
          </ul>
        </body>
      </html>
    `);
  };

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* Permanent Fixed Header */}
      <div className="shrink-0 bg-card border-b border-border shadow-xs z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="p-2 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                title={isBn ? 'ড্যাশবোর্ডে ফিরে যান' : 'Back to Dashboard'}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <EditableHeader
                    pageId="release_notes_page"
                    defaultTitle={isBn ? "রিলিজ নোটস ও ভার্সন হিস্ট্রি" : "Release Notes & Version History"}
                    className="text-lg sm:text-xl font-bold tracking-tight"
                  />
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                    {LATEST_VERSION}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isBn 
                    ? "সিস্টেমের সকল ভার্সন, নতুন ফিচার, পরিমার্জন এবং ফিক্সের সম্পূর্ণ রেকর্ড।"
                    : "Complete archive of product updates, feature rollouts, and changelogs."}
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={isBn ? "ফিচার বা পরিবর্তন খুঁজুন..." : "Search changelog..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-semibold text-foreground transition-colors shadow-2xs shrink-0"
              >
                <Printer className="w-4 h-4" />
                <span>{isBn ? 'প্রিন্ট' : 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content: Left version selector, Right changelog list */}
      <div className="flex-1 overflow-hidden max-w-7xl mx-auto w-full p-4 sm:p-6 flex flex-col md:flex-row gap-6">
        {/* Left Side: Version Selector Sidebar */}
        <div className="w-full md:w-72 shrink-0 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          <div className="p-3.5 border-b border-border bg-muted/40 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <History className="w-4 h-4 text-indigo-500" />
              {isBn ? 'ভার্সন তালিকা' : 'Release Versions'}
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {RELEASE_NOTES.length} {isBn ? 'টি সংস্করণ' : 'versions'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {RELEASE_NOTES.map((rel) => {
              const isSelected = rel.version === selectedVersion;
              return (
                <button
                  key={rel.version}
                  type="button"
                  onClick={() => setSelectedVersion(rel.version)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all flex flex-col gap-1 border",
                    isSelected
                      ? "bg-indigo-500/10 border-indigo-500/40 text-foreground shadow-2xs ring-1 ring-indigo-500/30"
                      : "bg-transparent border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-mono text-xs font-black",
                        isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-foreground"
                      )}>
                        {rel.version}
                      </span>
                      {rel.isLatest && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {isBn ? 'বর্তমান' : 'CURRENT'}
                        </span>
                      )}
                    </div>
                    <ChevronRight className={cn("w-4 h-4 transition-transform", isSelected ? "text-indigo-500 translate-x-0.5" : "opacity-40")} />
                  </div>

                  <p className="text-[11px] font-semibold text-foreground truncate">
                    {isBn ? rel.bnTitle : rel.title}
                  </p>

                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                    <Calendar className="w-3 h-3 opacity-70" />
                    {isBn ? rel.bnReleaseDate : rel.releaseDate}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Active Release Details */}
        <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
          {/* Version Header Banner */}
          <div className="p-5 sm:p-6 border-b border-border bg-gradient-to-br from-indigo-500/5 via-blue-500/5 to-transparent">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-mono font-black bg-indigo-600 text-white shadow-xs">
                    {activeRelease.version}
                  </span>
                  {activeRelease.isLatest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      <Sparkles className="w-3 h-3 text-emerald-500" />
                      {isBn ? 'সর্বশেষ রিলিজ' : 'Latest Release'}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {isBn ? activeRelease.bnReleaseDate : activeRelease.releaseDate}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight pt-1">
                  {isBn ? activeRelease.bnTitle : activeRelease.title}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {isBn ? activeRelease.bnSummary : activeRelease.summary}
                </p>
              </div>
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeCategory === 'all'
                    ? "bg-foreground text-background shadow-xs"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{isBn ? 'সব' : 'All'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-background/20 font-mono">
                  {activeRelease.newFeatures.length + activeRelease.improvements.length + activeRelease.bugFixes.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('new')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeCategory === 'new'
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20"
                )}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{isBn ? 'নতুন ফিচার' : 'New Features'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                  {activeRelease.newFeatures.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('improvements')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeCategory === 'improvements'
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20"
                )}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isBn ? 'পরিমার্জন' : 'Improvements'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                  {activeRelease.improvements.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveCategory('fixes')}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5",
                  activeCategory === 'fixes'
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                )}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>{isBn ? 'বাগ সমাধান' : 'Bug Fixes'}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/15 font-mono">
                  {activeRelease.bugFixes.length}
                </span>
              </button>
            </div>
          </div>

          {/* Changelog Items List */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 no-scrollbar">
            {filteredRelease.total === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm font-semibold">
                  {isBn ? 'কোনো পরিবর্তন খুঁজে পাওয়া যায়নি।' : 'No changelog items match your filter.'}
                </p>
              </div>
            ) : (
              <>
                {/* New Features */}
                {filteredRelease.newFeatures.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <PlusCircle className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                        {isBn ? 'নতুন সংযোজিত ফিচারসমূহ (New Features)' : 'New Features'}
                      </h3>
                    </div>

                    <div className="grid gap-3">
                      {filteredRelease.newFeatures.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-muted/30 border border-border/80 rounded-xl hover:border-emerald-500/40 transition-colors space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
                                {item.badge || 'NEW'}
                              </span>
                              <h4 className="text-sm font-bold text-foreground">
                                {isBn ? item.bnTitle : item.title}
                              </h4>
                            </div>
                            {item.module && (
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                                {item.module}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {isBn ? item.bnDescription : item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Improvements */}
                {filteredRelease.improvements.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                        <Zap className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs uppercase font-black tracking-wider text-amber-600 dark:text-amber-400">
                        {isBn ? 'উন্নতি ও সিস্টেম পরিমার্জন (Improvements)' : 'Improvements'}
                      </h3>
                    </div>

                    <div className="grid gap-3">
                      {filteredRelease.improvements.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-muted/30 border border-border/80 rounded-xl hover:border-amber-500/40 transition-colors space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <h4 className="text-sm font-bold text-foreground">
                              {isBn ? item.bnTitle : item.title}
                            </h4>
                            {item.module && (
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                                {item.module}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {isBn ? item.bnDescription : item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bug Fixes */}
                {filteredRelease.bugFixes.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <h3 className="text-xs uppercase font-black tracking-wider text-blue-600 dark:text-blue-400">
                        {isBn ? 'বাগ সমাধান ও স্ট্যাবিলিটি (Bug Fixes)' : 'Bug Fixes'}
                      </h3>
                    </div>

                    <div className="grid gap-3">
                      {filteredRelease.bugFixes.map((item) => (
                        <div
                          key={item.id}
                          className="p-4 bg-muted/30 border border-border/80 rounded-xl hover:border-blue-500/40 transition-colors space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                              <h4 className="text-sm font-bold text-foreground">
                                {isBn ? item.bnTitle : item.title}
                              </h4>
                            </div>
                            {item.module && (
                              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground shrink-0">
                                {item.module}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {isBn ? item.bnDescription : item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
