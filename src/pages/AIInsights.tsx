import React, { useState, useEffect, useRef } from 'react';
import { Zap, Send, Sparkles, TrendingUp, BarChart3, AlertTriangle, ShieldCheck, RefreshCw, Layers, Brain, Download, Share2 } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

export default function AIInsights() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<{role: 'user' | 'ai', content: string}[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [responses]);

  const handleSend = async () => {
    if (!prompt.trim() || loading) return;
    
    const userPrompt = prompt.trim();
    setPrompt('');
    setResponses(prev => [...prev, { role: 'user', content: userPrompt }]);
    setLoading(true);

    try {
      // Gather some context for the AI
      const stats = await erpService.getDashboardStats(user?.companyId || '');
      const response = await erpService.getAIInsights(userPrompt, stats);
      
      setResponses(prev => [...prev, { role: 'ai', content: response }]);
    } catch (error) {
      showNotification('AI failed to respond. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Analyze my sales trend for this month",
    "Find slow moving inventory items",
    "How is my profit margin compared to last month?",
    "Suggest ways to reduce expenses"
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background font-mono">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30 shrink-0">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter flex items-center gap-2">
               <Brain className="w-5 h-5 lg:w-6 lg:h-6 text-emerald-500 fill-emerald-500/10" /> AI Business Auditor
            </h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block px-2 bg-emerald-500/10 text-emerald-600 rounded">Gemini Powered</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 border border-border hover:bg-muted text-gray-500 rounded"><RefreshCw className="w-4 h-4" /></button>
            <button className="p-2 border border-border hover:bg-muted text-gray-500 rounded"><Share2 className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-border bg-card/30">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6 custom-scrollbar">
             {responses.length === 0 && (
               <div className="max-w-2xl mx-auto space-y-8 py-12">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-foreground text-background flex items-center justify-center rounded-none mx-auto shadow-xl rotate-3">
                      <Zap className="w-8 h-8" />
                    </div>
                    <h2 className="text-lg font-bold uppercase tracking-widest mt-6">Ask your Financial Data Intelligence</h2>
                    <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-relaxed">
                      Powered by Google Gemini, your AI Auditor analyzes vouchers, stock, and ledger data to provide deep business insights in seconds.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => setPrompt(s)}
                        className="p-4 bg-muted border border-border text-left hover:border-foreground transition-all group"
                      >
                        <p className="text-[10px] text-gray-400 group-hover:text-foreground transition-colors uppercase tracking-widest mb-1 italic">Suggestion {i+1}</p>
                        <p className="text-xs font-bold text-foreground uppercase tracking-tight">{s}</p>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded">
                     <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                     <p className="text-[9px] text-amber-700 uppercase leading-relaxed font-bold">
                       AI can make mistakes. Always verify the output with your official Daybook and Profit & Loss reports before making financial decisions.
                     </p>
                  </div>
               </div>
             )}

             <AnimatePresence>
               {responses.map((res, i) => (
                 <motion.div 
                   key={i}
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   className={cn(
                     "flex gap-4 p-6 rounded-none border",
                     res.role === 'user' ? "bg-muted border-border ml-12" : "bg-card border-border mr-12 shadow-sm"
                   )}
                 >
                   <div className={cn(
                     "w-8 h-8 rounded shrink-0 flex items-center justify-center font-bold text-xs",
                     res.role === 'user' ? "bg-foreground text-background" : "bg-emerald-500 text-white"
                   )}>
                     {res.role === 'user' ? 'U' : <Sparkles className="w-4 h-4" />}
                   </div>
                   <div className="flex-1 space-y-1 overflow-hidden">
                     <p className="text-[9px] font-bold uppercase tracking-widest mb-2 opacity-50 text-foreground">
                       {res.role === 'user' ? 'Direct Query' : 'System Insight'}
                     </p>
                     <div className="markdown-body text-sm font-mono leading-relaxed uppercase tracking-tight text-foreground/90">
                       <ReactMarkdown>{res.content}</ReactMarkdown>
                     </div>
                   </div>
                 </motion.div>
               ))}
               {loading && (
                 <motion.div 
                   initial={{ opacity: 0 }} 
                   animate={{ opacity: 1 }} 
                   className="flex items-center gap-3 p-6 text-gray-500"
                 >
                   <div className="w-8 h-8 rounded bg-emerald-500/10 flex items-center justify-center animate-spin">
                      <RefreshCw className="w-4 h-4 text-emerald-500" />
                   </div>
                   <span className="text-[10px] font-bold uppercase tracking-widest animate-pulse">Consulting Business Neural Engine...</span>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          {/* Input Area */}
          <div className="p-4 lg:p-6 bg-background border-t border-border shrink-0">
             <div className="max-w-4xl mx-auto flex gap-3">
               <div className="relative flex-1">
                 <input 
                   type="text"
                   value={prompt}
                   onChange={e => setPrompt(e.target.value)}
                   onKeyDown={e => e.key === 'Enter' && handleSend()}
                   placeholder="Ask anything about your business..."
                   className="w-full bg-muted border border-border pl-4 pr-12 py-4 text-sm focus:ring-1 focus:ring-foreground outline-none uppercase placeholder:text-gray-400 font-bold"
                 />
                 <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                   <button className="p-2 text-gray-400 hover:text-foreground transition-colors"><Layers className="w-4 h-4" /></button>
                 </div>
               </div>
               <button 
                 onClick={handleSend}
                 disabled={!prompt.trim() || loading}
                 className="px-6 py-4 bg-foreground text-background uppercase font-bold text-xs tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2 disabled:opacity-50"
               >
                 {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                 Analyze
               </button>
             </div>
          </div>
        </div>

        {/* Action Sidebar */}
        <div className="hidden lg:flex w-80 flex-col overflow-y-auto no-scrollbar p-6 space-y-8 bg-background border-l border-border uppercase">
           <div className="space-y-4">
             <h3 className="text-[10px] font-bold tracking-widest border-b border-border pb-2 flex items-center gap-2">
               <TrendingUp className="w-3 h-3 text-emerald-500" /> Business Health
             </h3>
             <div className="space-y-4">
               {[
                 { label: 'Liquidity Score', value: '7.8/10', color: 'text-emerald-500', trend: '+0.4 this month' },
                 { label: 'Risk Factor', value: 'Low', color: 'text-blue-500', trend: 'Based on 452 cycles' },
                 { label: 'Efficiency', value: '82%', color: 'text-purple-500', trend: 'Optimizing Stock' },
               ].map((stat, i) => (
                 <div key={i} className="p-4 bg-muted/30 border border-border space-y-1">
                   <p className="text-[9px] text-gray-500 font-bold">{stat.label}</p>
                   <div className="flex items-baseline justify-between">
                     <p className={cn("text-lg font-bold font-mono tracking-tighter", stat.color)}>{stat.value}</p>
                     <span className="text-[8px] opacity-70 italic font-mono lowercase">{stat.trend}</span>
                   </div>
                 </div>
               ))}
             </div>
           </div>

           <div className="space-y-4 bg-muted p-6 border border-border">
              <h4 className="text-[10px] font-bold tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" /> Auditor Insights
              </h4>
              <p className="text-[9px] text-gray-500 leading-relaxed italic font-mono lowercase">
                your current cash flow is positive, however, ledgers with {'>'}90 day credit terms are increasing. recommended: send automated reminders via whatsapp to top 5 debtors.
              </p>
              <button className="w-full py-2 bg-foreground text-background text-[9px] font-bold tracking-widest hover:bg-foreground/90 transition-all">
                Run Advanced Audit
              </button>
           </div>

           <div className="space-y-4">
             <h3 className="text-[10px] font-bold tracking-widest border-b border-border pb-2 flex items-center gap-2">
               <BarChart3 className="w-3 h-3" /> Predictive Forecast
             </h3>
             <div className="h-40 flex items-end justify-between gap-1 px-2 border-b border-l border-border pb-2">
               {[40, 60, 50, 70, 90, 80, 95].map((h, i) => (
                 <div key={i} className="flex-1 bg-emerald-500/20 border-t border-emerald-500/40 relative group cursor-help" style={{ height: `${h}%` }}>
                   <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-foreground text-background px-1 text-[8px] opacity-0 group-hover:opacity-100 transition-opacity">৳{h}K</div>
                 </div>
               ))}
             </div>
             <p className="text-[8px] text-center text-gray-400 italic font-mono lowercase">revenue forecast (next 7 days)</p>
           </div>
        </div>
      </div>
    </div>
  );
}
