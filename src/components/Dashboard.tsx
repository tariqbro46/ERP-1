import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Package, CreditCard, Loader2, Plus, Calendar, ShieldCheck, AlertTriangle, Clock, Hammer, CheckCircle2, ListTodo, TrendingUp, RefreshCw, ChevronRight, Calculator, Bookmark, Pin, Layers, FileText, BookOpen, Sparkles, Cpu, Coins, Trash2 } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn, formatNumber, ensureDate } from '../lib/utils';
import { format, differenceInDays } from 'date-fns';
import { EditableHeader } from './EditableHeader';

const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, loading, color, uiStyle }: any) => (
  <div className={cn(
    "bg-card border border-border p-4 flex flex-col gap-2 transition-all",
    uiStyle === 'UI/UX 2' && color ? `${color} border-transparent shadow-md hover:brightness-95` : ""
  )}>
    <div className="flex justify-between items-center">
      <span className={cn(
        "text-[10px] uppercase tracking-wider font-mono",
        uiStyle === 'UI/UX 2' ? "text-white/70" : "text-gray-500"
      )}>{title}</span>
      <Icon className={cn("w-4 h-4", uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-600")} />
    </div>
    <div className="flex items-baseline justify-between gap-2 flex-wrap mt-auto">
      {loading ? (
        <div className="h-8 w-24 bg-foreground/5 animate-pulse rounded" />
      ) : (
        <>
          <span className={cn(
            "text-xl sm:text-2xl font-mono",
            uiStyle === 'UI/UX 2' ? "text-white" : "text-foreground"
          )}>{value}</span>
          {change && (
            <span className={cn(
              "text-[9px] sm:text-[10px] font-mono flex items-center whitespace-nowrap",
              uiStyle === 'UI/UX 2' ? "text-white/90" : trend === 'up' ? 'text-emerald-500' : 'text-rose-500'
            )}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {change}
            </span>
          )}
        </>
      )}
    </div>
  </div>
);

export function Dashboard() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { 
    companyName, 
    financialYearStart, 
    financialYearEnd, 
    dashboardDesign: localDesign, 
    globalDashboardDesign,
    uiStyle, 
    showQuickActions, 
    dashboardQuickActions = ['voucher', 'item', 'ledger', 'godown', 'users'], 
    dashboardCards = ['revenue', 'profit', 'ledgers', 'stock'],
    showQuickCalculator = true,
    showPinnedBookmarks = true,
    customControlCenterTheme = 'emerald',
    customWelcomeMessage = 'Executive Command Center',
    splashSubDesign = 'grid'
  } = useSettings();
  
  const dashboardDesign = globalDashboardDesign || localDesign;
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const cardConfigs: Record<string, any> = {
    sales: { title: t('dash.sales') || 'Sales', key: 'sales', icon: Activity, color: 'bg-blue-600' },
    purchase: { title: t('dash.purchase') || 'Purchase', key: 'purchase', icon: Package, color: 'bg-amber-600' },
    payment: { title: t('dash.payment') || 'Payment', key: 'payment', icon: CreditCard, color: 'bg-rose-600' },
    receipt: { title: t('dash.receipt') || 'Receipt', key: 'receipt', icon: CreditCard, color: 'bg-emerald-600' },
    revenue: { title: t('dash.revenue') || 'Total Revenue', key: 'revenue', icon: Activity, color: 'bg-blue-600' },
    profit: { title: t('dash.profit') || 'Net Profit', key: 'profit', icon: TrendingUp, color: 'bg-emerald-600' },
    ledgers: { title: t('dash.activeLedgers') || 'Active Ledgers', key: 'activeLedgers', icon: Users, color: 'bg-indigo-600' },
    stock: { title: t('dash.stockValue') || 'Stock Value', key: 'stockValue', icon: Package, color: 'bg-orange-600' },
  };

  const selectedCards = (dashboardCards.length > 0 ? dashboardCards : ['sales', 'purchase', 'payment', 'receipt', 'profit']).slice(0, 5).map(id => cardConfigs[id]).filter(Boolean);
  
  // Default to current month
  const getDefaultPeriod = () => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of current month
    const start = new Date(now.getFullYear(), now.getMonth() - 5, 1); // Start of 5 months ago
    
    const toLocalISO = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    return {
      start: toLocalISO(start),
      end: toLocalISO(end)
    };
  };

  const defaultPeriod = getDefaultPeriod();
  const { company } = useAuth();
  const [stats, setStats] = useState({
    revenue: 0,
    profit: 0,
    sales: 0,
    purchase: 0,
    payment: 0,
    receipt: 0,
    activeLedgers: 0,
    stockValue: 0,
    chartData: [] as any[]
  });
  const [recentVouchers, setRecentVouchers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end);

  const safeFormat = (date: any, formatStr: string) => {
    try {
      if (!date) return 'N/A';
      const d = ensureDate(date);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const [refreshKey, setRefreshKey] = useState(0);
  const isInitialMount = React.useRef(true);

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      if (dashboardDesign === 'Design 5' || dashboardDesign === 'Design 6') {
        setStats({
          revenue: 1250000,
          profit: 340000,
          sales: 850000,
          purchase: 510000,
          payment: 220000,
          receipt: 310000,
          activeLedgers: 45,
          stockValue: 620000,
          chartData: []
        });
        setRecentVouchers([
          { id: '1', v_date: '2026-05-23', v_type: 'Sales', particulars: 'Walking Customer', total_amount: 12500, v_no: 'SL-001' },
          { id: '2', v_date: '2026-05-22', v_type: 'Receipt', particulars: 'Cash In Hand', total_amount: 50000, v_no: 'RC-001' },
          { id: '3', v_date: '2026-05-21', v_type: 'Purchase', particulars: 'Main Supplier Ltd.', total_amount: 45000, v_no: 'PR-001' },
          { id: '4', v_date: '2026-05-20', v_type: 'Payment', particulars: 'Office Rent Expense', total_amount: 15000, v_no: 'PY-001' },
          { id: '5', v_date: '2026-05-19', v_type: 'Contra', particulars: 'Bank to Cash', total_amount: 10000, v_no: 'CN-001' }
        ]);
        setOrders([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const isForced = !isInitialMount.current && refreshKey > 0;
        isInitialMount.current = false;

        const [s, v, o] = await Promise.all([
          erpService.getDashboardStats(user.companyId, periodStart, periodEnd, isForced),
          erpService.getRecentVouchers(user.companyId, 5),
          erpService.getOrders(user.companyId)
        ]);
        setStats(s);
        // Filter recent vouchers by period if needed, or keep latest 5
        const processed = (v || []).filter(vch => {
          if (!periodStart || !periodEnd) return true;
          return vch.v_date >= periodStart && vch.v_date <= periodEnd;
        }).map(vch => ({
          ...vch,
          particulars: vch.party_ledger_name || vch.ledger_name || vch.ledgers || vch.particulars || vch.v_type || 'Voucher'
        }));
        setRecentVouchers(processed);
        setOrders(o || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [periodStart, periodEnd, user?.companyId, refreshKey, dashboardDesign]);

  const formatFY = (start: string, end: string) => {
    const s = new Date(start).getFullYear().toString().slice(-2);
    const e = new Date(end).getFullYear().toString().slice(-2);
    return `20${s}-${e}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      if (!dateStr) return 'N/A';
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-');
    } catch (e) {
      return 'N/A';
    }
  };

  const formatTimestamp = (ts: number) => {
    if (!ts) return 'Unknown';
    return format(new Date(ts), 'hh:mm:ss a');
  };

  const lastUpdated = erpService._dashboardStatsCache[`${user?.companyId}_${periodStart}_${periodEnd}`]?.timestamp || 0;
  const isStale = Date.now() - lastUpdated > 300000; // 5 minutes

  // Design 5 variables & local state
  const [bookmarks, setBookmarks] = useState<{ id: string; name: string; url: string }[]>(() => {
    try {
      const stored = localStorage.getItem('tallyflow_zero_bookmarks');
      return stored ? JSON.parse(stored) : [
        { id: '1', name: 'Create General Ledger', url: '/accounts' },
        { id: '2', name: 'Instant Stock Master', url: '/inventory/items' },
        { id: '3', name: 'System Setup Configs', url: '/settings' }
      ];
    } catch {
      return [];
    }
  });
  const [newBmkName, setNewBmkName] = useState('');
  const [newBmkUrl, setNewBmkUrl] = useState('/accounts');
  const [calcCost, setCalcCost] = useState(1000);
  const [calcMarkup, setCalcMarkup] = useState(25);

  const handleAddBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBmkName.trim() || !newBmkUrl.trim()) return;
    const item = {
      id: Date.now().toString(),
      name: newBmkName.trim(),
      url: newBmkUrl
    };
    const updated = [...bookmarks, item];
    setBookmarks(updated);
    localStorage.setItem('tallyflow_zero_bookmarks', JSON.stringify(updated));
    setNewBmkName('');
  };

  const handleRemoveBookmark = (id: string) => {
    const updated = bookmarks.filter(b => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem('tallyflow_zero_bookmarks', JSON.stringify(updated));
  };

  if (dashboardDesign === 'Design 5') {
    const calculatedProfit = (calcCost * (calcMarkup / 100));
    const calculatedPrice = calcCost + calculatedProfit;

    // Theme values selector
    const themeScheme = {
      emerald: {
        bg: 'bg-[#f4fbf7]',
        text: 'text-emerald-700',
        border: 'border-emerald-100',
        badge: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
        primaryBtn: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100',
        accentText: 'text-emerald-600',
        cardHover: 'hover:border-emerald-200 hover:shadow-emerald-50/50',
        halo: 'from-emerald-500/10',
        iconColor: 'text-emerald-500'
      },
      indigo: {
        bg: 'bg-[#f5f6ff]',
        text: 'text-indigo-700',
        border: 'border-indigo-100',
        badge: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
        primaryBtn: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-100',
        accentText: 'text-indigo-600',
        cardHover: 'hover:border-indigo-200 hover:shadow-indigo-50/50',
        halo: 'from-indigo-500/10',
        iconColor: 'text-indigo-500'
      },
      slate: {
        bg: 'bg-slate-50',
        text: 'text-slate-700',
        border: 'border-slate-200',
        badge: 'bg-slate-600/10 text-slate-700 border-slate-300',
        primaryBtn: 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-100',
        accentText: 'text-slate-800',
        cardHover: 'hover:border-slate-350 hover:shadow-slate-100',
        halo: 'from-slate-500/10',
        iconColor: 'text-slate-600'
      },
      cyber: {
        bg: 'bg-slate-950',
        text: 'text-cyan-400',
        border: 'border-cyan-500/20',
        badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30 font-mono',
        primaryBtn: 'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black shadow-cyan-900/30',
        accentText: 'text-cyan-400',
        cardHover: 'hover:border-cyan-500/40 hover:shadow-cyan-950/40',
        halo: 'from-cyan-500/20',
        iconColor: 'text-cyan-400'
      }
    };

    const scheme = themeScheme[customControlCenterTheme as keyof typeof themeScheme] || themeScheme.emerald;
    const isDark = customControlCenterTheme === 'cyber';

    return (
      <div className={cn("flex flex-col min-h-full font-sans transition-all", isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50/60 text-slate-800")}>
        {/* Sticky Fixed Header Section - Stays fixed as required */}
        <div className={cn("sticky top-0 z-30 border-b shadow-sm px-4 lg:px-6 py-4.5 transition-all", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border/80")}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <EditableHeader 
              pageId="dashboard_command"
              defaultTitle={customWelcomeMessage}
              defaultSubtitle={`${companyName} • Modern Management Dashboard`}
            />
          </div>
        </div>

        {/* Scrollable Data Area */}
        <div className="flex-1 p-4 lg:p-6 space-y-6 overflow-y-auto">
          {/* Active Alert Desk */}
          <div className={cn("p-4.5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all", isDark ? "bg-cyan-950/10 border-cyan-500/20" : "bg-white border-border shadow-sm")}>
            <div className="flex items-start gap-3.5">
              <div className={cn("p-2.5 rounded-xl bg-opacity-10 shrink-0", isDark ? "bg-cyan-400/10 text-cyan-400" : "bg-primary/5 text-primary")}>
                <ShieldCheck className="w-5 h-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-black uppercase tracking-tight text-foreground">Interactive Control Dashboard</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Welcome back! Pin key reports to your local pinboard, calculate dynamic margins, and quickly manage core accounting transaction modules.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Workflows Grid & Control Console */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Core Modules Shortcuts (2 cols wide) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/90 pl-1">Professional Portals Workspace</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  {/* Ledger & Accounts */}
                  <div className={cn("p-5 rounded-2xl border transition-all flex flex-col justify-between group", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border shadow-sm", scheme.cardHover)}>
                    <div>
                      <div className="flex justify-between items-start mb-3.5">
                        <div className={cn("p-2.5 rounded-xl bg-blue-500/10 text-blue-500")}>
                          <BookOpen className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">Accounting</span>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">Accounts Control</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Establish general ledgers, monitor chart of accounts, adjust matching credits, and set opening balances.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/accounts')} 
                      className="mt-6 w-full py-2 border border-border group-hover:border-foreground/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-background hover:bg-muted"
                    >
                      Enter Accounts
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Vouchers & DayBook */}
                  <div className={cn("p-5 rounded-2xl border transition-all flex flex-col justify-between group", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border shadow-sm", scheme.cardHover)}>
                    <div>
                      <div className="flex justify-between items-start mb-3.5">
                        <div className={cn("p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500")}>
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">Transactions</span>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground font-sans">Double Entry Vouchers</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Log cash sales, purchase receipts, payments, general receipts, contra transfers, and general journal vouchers.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/vouchers/new')} 
                      className="mt-6 w-full py-2 border border-border group-hover:border-foreground/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-background hover:bg-muted"
                    >
                      Post Vouchers
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                  {/* Stocks & Godowns */}
                  <div className={cn("p-5 rounded-2xl border transition-all flex flex-col justify-between group", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border shadow-sm", scheme.cardHover)}>
                    <div>
                      <div className="flex justify-between items-start mb-3.5">
                        <div className={cn("p-2.5 rounded-xl bg-orange-500/10 text-orange-500")}>
                          <Package className="w-5 h-5" />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">Inventory</span>
                      </div>
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground font-sans">Stock Control</h4>
                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                        Configure batch items, view stock value logs, track multi-godown storage allocations, and set unit definitions.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate('/inventory/items')} 
                      className="mt-6 w-full py-2 border border-border group-hover:border-foreground/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 bg-background hover:bg-muted"
                    >
                      Explore Inventory
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>

                </div>
              </div>

              {/* Daybook Preview Shortcut Header & list */}
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/90 pl-1">Recent Activity Logs</h3>
                <div className={cn("rounded-2xl border overflow-hidden", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border shadow-sm")}>
                  <div className="p-4 border-b border-border/80 flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-foreground">Recent Transactions and Adjustments</span>
                    <button onClick={() => navigate('/reports/daybook')} className="text-[9px] font-bold uppercase tracking-wider text-primary hover:underline">Full Daybook &rarr;</button>
                  </div>
                  <div className="divide-y divide-border/60">
                    {recentVouchers.map((v, idx) => (
                      <div key={v.id || idx} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={cn("w-2 h-2 rounded-full", v.v_type === 'Sales' ? "bg-emerald-500" : v.v_type === 'Receipt' ? "bg-blue-500" : "bg-amber-500")} />
                          <div>
                            <p className="text-xs font-black uppercase tracking-tight text-foreground">{v.particulars}</p>
                            <p className="text-[9px] text-muted-foreground uppercase leading-none mt-1">{v.v_no} • {v.v_date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-foreground font-mono">৳{v.total_amount?.toLocaleString()}</p>
                          <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">{v.v_type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Col: Widgets & Calculators */}
            <div className="space-y-6">
              
              {/* Local Pinned Navigation Bookmarks (LocalStorage) */}
              {showPinnedBookmarks && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/90 pl-1">Interactive Local Bookmarks</h3>
                  <div className={cn("p-5 rounded-2xl border space-y-4", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border shadow-sm")}>
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">Your Pinboard Nodes</h4>
                    </div>
                    
                    <div className="space-y-2">
                      {bookmarks.length === 0 ? (
                        <p className="text-[9px] text-muted-foreground uppercase font-semibold text-center py-2">No custom bookmark pinned yet.</p>
                      ) : (
                        bookmarks.map(bm => (
                          <div key={bm.id} className="flex items-center justify-between gap-2 p-2.5 bg-muted/20 hover:bg-muted/30 border border-border/80 rounded-xl transition-all">
                            <button 
                              onClick={() => navigate(bm.url)}
                              className="text-left flex-1 min-w-0"
                            >
                              <p className="text-[10px] font-black text-foreground uppercase truncate leading-none mb-0.5">{bm.name}</p>
                              <p className="text-[8px] text-muted-foreground uppercase font-mono leading-none truncate">{bm.url}</p>
                            </button>
                            <button 
                              onClick={() => handleRemoveBookmark(bm.id)}
                              className="text-muted-foreground hover:text-red-500 p-1 rounded-md"
                              title="Delete bookmark"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Add Bookmark form */}
                    <form onSubmit={handleAddBookmark} className="pt-3 border-t border-border/60 space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Pin Label</label>
                        <input 
                          type="text"
                          required
                          value={newBmkName}
                          onChange={e => setNewBmkName(e.target.value)}
                          className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1 text-[10px] focus:ring-1 focus:ring-primary outline-none"
                          placeholder="e.g., matching report"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest font-sans">Route Choice</label>
                          <select 
                            value={newBmkUrl}
                            onChange={e => setNewBmkUrl(e.target.value)}
                            className="w-full bg-background border border-border/80 rounded-lg px-2 text-[10px] h-[24px] focus:ring-1 focus:ring-primary outline-none"
                          >
                            <option value="/accounts">Ledgers List</option>
                            <option value="/vouchers/new">Create Voucher</option>
                            <option value="/inventory/items">Items Index</option>
                            <option value="/reports">Reports System</option>
                            <option value="/settings">Settings</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <button 
                            type="submit"
                            className={cn("w-full py-1 text-[10px] font-black uppercase rounded-lg border", scheme.badge, "hover:opacity-90")}
                          >
                            Pin Node
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Interactive Selling Margin & markup Calculator */}
              {showQuickCalculator && (
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/90 pl-1">Interactive Profit Calculator</h3>
                  <div className={cn("p-5 rounded-2xl border space-y-4", isDark ? "bg-slate-900 border-cyan-950" : "bg-white border-border shadow-sm")}>
                    <div className="flex items-center gap-2">
                      <Calculator className={cn("w-4 h-4", scheme.accentText)} />
                      <h4 className="text-xs font-black uppercase tracking-tight text-foreground">Aesthetic Margin Markup Calc</h4>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block">Primary Cost (৳)</label>
                        <input 
                          type="number"
                          value={calcCost}
                          onChange={e => setCalcCost(Number(e.target.value))}
                          className="w-full bg-background border border-border/80 rounded-lg px-2.5 py-1.5 text-xs font-mono focus:ring-1 focus:ring-primary outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest block">Profit Markup (%)</label>
                        <input 
                          type="range"
                          min="1"
                          max="200"
                          value={calcMarkup}
                          onChange={e => setCalcMarkup(Number(e.target.value))}
                          className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground mt-1">
                          <span>1%</span>
                          <span className="font-extrabold text-foreground">{calcMarkup}% Markup</span>
                          <span>200%</span>
                        </div>
                      </div>

                      <div className="p-3 bg-muted/35 border border-border/80 rounded-xl space-y-2 font-mono text-xs">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground uppercase font-black">Estimated Profit:</span>
                          <span className="text-foreground tracking-tight font-black font-sans">৳{(parseInt(calculatedProfit.toFixed(0))).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-border/40 pt-1.5">
                          <span className="text-muted-foreground uppercase font-black leading-none mt-0.5">Recommended Price:</span>
                          <span className={cn("text-sm font-black font-sans leading-none", scheme.accentText)}>
                            ৳{(parseInt(calculatedPrice.toFixed(0))).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Compact Quick Guidelines Support Card */}
              <div className={cn("p-4 rounded-xl border border-dashed", isDark ? "border-cyan-500/20" : "border-border")}>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black leading-none mb-1.5">Sandbox Operations Guide</p>
                <p className="text-[9px] text-muted-foreground uppercase leading-relaxed font-mono">
                  This console stores your bookmark configurations locally inside the Browser LocalStorage database. Any updates made in settings or menus are saved instantly without loading the cloud infrastructure.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardDesign === 'Design 6') {
    const [splashTime, setSplashTime] = useState(new Date());
    useEffect(() => {
      const timer = setInterval(() => setSplashTime(new Date()), 1000);
      return () => clearInterval(timer);
    }, []);

    const timeString = splashTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = splashTime.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    
    // Day greeting
    const hour = splashTime.getHours();
    let greeting = "Good Day";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";
    else greeting = "Good Evening";

    const shortcuts = [
      {
        id: 'vouchers',
        title: 'New Voucher entry',
        desc: 'Log sales, receipts, payments & purchases',
        descNeon: 'DEPLOY TRANSACTION ENTRIES',
        descEditorial: 'Compose journal ledger entries',
        icon: FileText,
        url: '/vouchers/new',
        color: 'from-blue-500 to-indigo-500',
        badge: 'Transactions'
      },
      {
        id: 'ledgers',
        title: 'Ledgers Registry',
        desc: 'Monitor company accounts & opening credits',
        descNeon: 'RESOLVE REGISTRY BALANCES',
        descEditorial: 'Browse accounts and chart of balances',
        icon: Users,
        url: '/accounts',
        color: 'from-emerald-500 to-teal-500',
        badge: 'Accounting'
      },
      {
        id: 'inventory',
        title: 'Inventory stock',
        desc: 'View active items, batch definitions & stores',
        descNeon: 'QUERY RAW STORES & UNITS',
        descEditorial: 'Oversee inventory and unit indices',
        icon: Package,
        url: '/inventory/items',
        color: 'from-amber-500 to-orange-500',
        badge: 'Inventory'
      },
      {
        id: 'reports',
        title: 'Reports Gateway',
        desc: 'Unlock financial summaries & trial balances',
        descNeon: 'COMPILE FISCAL TELEMETRIES',
        descEditorial: 'Examine ledger books and statements',
        icon: TrendingUp,
        url: '/reports',
        color: 'from-pink-500 to-rose-500',
        badge: 'Analytics'
      },
      {
        id: 'daybook',
        title: 'Daybook stream',
        desc: "Examine today's running register list",
        descNeon: 'AUDIT HISTORICAL STREAM',
        descEditorial: "Browse current day's business logs",
        icon: Clock,
        url: '/reports/daybook',
        color: 'from-violet-500 to-fuchsia-500',
        badge: 'Audit Trail'
      },
      {
        id: 'settings',
        title: 'General Configs',
        desc: 'Adjust enterprise layouts, rules & metrics',
        descNeon: 'MANAGE CENTRAL ENVIRONMENT',
        descEditorial: 'Calibrate parameters & layouts',
        icon: ShieldCheck,
        url: '/settings',
        color: 'from-cyan-500 to-sky-500',
        badge: 'Preferences'
      }
    ];

    if (splashSubDesign === 'neon') {
      return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] bg-slate-950 text-cyan-100 p-6 sm:p-8 md:p-12 font-sans transition-all relative overflow-hidden">
          {/* Futuristic corner glows */}
          <div className="absolute top-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-fuchsia-500/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-center space-y-10 relative z-10">
            
            {/* Cyber Header with neon decorations */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-950/40 border border-cyan-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse">
                <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                SYSTEM PORTAL ONLINE
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 tracking-tight leading-none uppercase">
                {customWelcomeMessage || "Welcome to Headquarters"}
              </h1>
              
              <p className="text-xs text-cyan-400/80 uppercase tracking-[0.25em] font-mono">
                {companyName || "CORE SYSTEM"} // SECURE ACCESS NODES
              </p>
              
              {/* Dynamic glass telemetry widget */}
              <div className="inline-flex items-center gap-4 px-4 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 mt-2">
                <span className="flex items-center gap-1.5 text-cyan-400"><Clock className="w-3.5 h-3.5" /> {timeString}</span>
                <span className="text-slate-800">|</span>
                <span className="text-fuchsia-400">{dateString.toUpperCase()}</span>
                <span className="text-slate-800">|</span>
                <span className="text-emerald-400 flex items-center gap-1 font-bold">● ACTIVE</span>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent w-full" />

            {/* Bento cybergrid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shortcuts.map(sc => {
                const Icon = sc.icon;
                return (
                  <button
                    key={sc.id}
                    onClick={() => navigate(sc.url)}
                    className="p-6 bg-slate-900/30 backdrop-blur-md border border-cyan-500/10 hover:border-cyan-400/80 rounded-2xl text-left flex flex-col justify-between group hover:shadow-[0_0_20px_rgba(6,182,212,0.12)] transition-all duration-300 transform hover:-translate-y-0.5 outline-none"
                  >
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-4">
                        <div className="p-2.5 rounded-xl bg-cyan-950/60 border border-cyan-500/20 text-cyan-400 group-hover:text-fuchsia-400 group-hover:border-fuchsia-500/30 transition-colors">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-mono uppercase font-black tracking-widest text-cyan-500/80">
                          [{sc.badge}]
                        </span>
                      </div>
                      <h3 className="text-xs font-black text-white hover:text-cyan-400 uppercase tracking-wider font-mono transition-colors">
                        &gt;_ {sc.title}
                      </h3>
                      <p className="text-[10px] text-cyan-200/50 mt-1.5 font-mono leading-relaxed uppercase">
                        {sc.descNeon}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-5 text-[9px] uppercase font-black tracking-wider text-cyan-600 group-hover:text-cyan-300 font-mono transition-colors">
                      INITIATE ACCESS
                      <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="text-center pt-4">
              <span className="text-[10px] text-fuchsia-500/60 font-mono uppercase tracking-[0.18em]">
                SYS_VER_1.01 // QUOTA_BYPASS: 100% // ENVIRONMENT: LOCAL_CACHE
              </span>
            </div>

          </div>
        </div>
      );
    }

    if (splashSubDesign === 'editorial') {
      return (
        <div className="flex flex-col min-h-[calc(100vh-120px)] bg-[#faf8f5] text-stone-850 p-6 sm:p-8 md:p-14 font-sans transition-all">
          <div className="max-w-4xl mx-auto w-full flex-grow flex flex-col justify-center space-y-12">
            
            {/* Elegant Top Meta line */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stone-200 pb-5 gap-3">
              <div className="text-[11px] font-medium tracking-[0.2em] text-stone-500 uppercase font-sans">
                {companyName || "SYSTEM PORTAL"} • OFF-READ ENVIRONMENT
              </div>
              <div className="text-[11px] font-mono text-stone-500 flex items-center gap-2">
                {dateString.toUpperCase()} &nbsp;—&nbsp; {timeString}
              </div>
            </div>

            {/* Editorial Column Split */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
              
              {/* Left Column Welcome Message */}
              <div className="lg:col-span-5 space-y-4">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-amber-700 font-serif italic">
                  Atelier Executive Hub
                </span>
                
                <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tight leading-[1.05]">
                  {customWelcomeMessage || "Welcome to Headquarters"}
                </h1>
                
                <p className="text-xs text-stone-500 leading-relaxed font-serif italic">
                  "Simplicity is the ultimate sophistication." A bespoke minimal directory crafted for quiet focus, instant performance, and smooth business administration.
                </p>
                
                <div className="pt-2">
                  <div className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                    Local Cache Active
                  </div>
                </div>
              </div>

              {/* Right Column List Menu */}
              <div className="lg:col-span-7 space-y-3">
                {shortcuts.map(sc => {
                  const Icon = sc.icon;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => navigate(sc.url)}
                      className="w-full text-left p-4.5 bg-stone-100 hover:bg-stone-200/55 border border-stone-200/40 hover:border-stone-300 rounded-xl flex items-center justify-between group transition-all duration-300 outline-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-stone-200 text-stone-700 group-hover:bg-amber-100 group-hover:text-amber-800 transition-colors">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest text-stone-800 group-hover:text-amber-900 transition-colors">
                            {sc.title}
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5 leading-normal">
                            {sc.descEditorial}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-1 rounded-full text-stone-400 group-hover:text-stone-700 group-hover:translate-x-0.5 transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>

            {/* Fine Print Footer */}
            <div className="text-center border-t border-stone-200/60 pt-6">
              <p className="text-[9px] text-stone-400 uppercase tracking-widest">
                System optimized • All core accounting, stock, and directory records fully preserved.
              </p>
            </div>

          </div>
        </div>
      );
    }

    // Default 'grid' style
    return (
      <div className="flex flex-col min-h-[calc(100vh-120px)] bg-slate-50/50 text-slate-800 p-6 sm:p-8 md:p-12 font-sans transition-all">
        <div className="max-w-5xl mx-auto w-full flex-grow flex flex-col justify-center space-y-10">
          
          {/* Header section with top badge */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200/60 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-600 font-mono shadow-sm">
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-500" />
              Enterprise Hub
            </div>
            
            <h1 className="text-3xl md:text-4.5xl font-black text-slate-900 tracking-tight leading-none">
              {greeting}, {customWelcomeMessage || "Welcome to Headquarters"}
            </h1>
            
            <p className="text-xs md:text-sm text-slate-500 uppercase tracking-[0.15em] font-medium">
              {companyName || "COMPANY ERP"} • Portal Dashboard
            </p>
            
            <div className="flex items-center justify-center gap-3 pt-2 text-xs text-muted-foreground font-mono">
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-blue-500" /> {timeString}</span>
              <span className="text-slate-300">|</span>
              <span>{dateString}</span>
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent w-full" />

          {/* Main shortcuts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shortcuts.map(sc => {
              const Icon = sc.icon;
              return (
                <button
                  key={sc.id}
                  onClick={() => navigate(sc.url)}
                  className="p-6 bg-white border border-slate-200/80 rounded-2xl text-left flex flex-col justify-between group hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/[0.04] transition-all duration-300 transform hover:-translate-y-0.5 outline-none"
                >
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-4">
                      <div className={cn("p-2.5 rounded-xl bg-gradient-to-br text-white shadow-md", sc.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[9px] uppercase font-black tracking-widest bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        {sc.badge}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide group-hover:text-blue-600 transition-colors">
                      {sc.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                      {sc.desc}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 mt-5 text-[10px] uppercase font-black tracking-wider text-slate-400 group-hover:text-blue-600 font-mono transition-colors">
                    Launch Console
                    <ChevronRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })}
          </div>

          <div className="text-center pt-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
              System Active • Bypassing database counters to conserve daily usage quota
            </p>
          </div>

        </div>
      </div>
    );
  }

  if (dashboardDesign === 'Design 3') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 transition-colors font-sans overflow-y-auto">
        {/* Fixed Header Section */}
        <div className="sticky top-0 bg-white border-b border-gray-100 shadow-sm px-4 lg:px-6 py-4 z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <EditableHeader 
              pageId="dashboard_min"
              defaultTitle={t('dash.overview')}
              defaultSubtitle={`${companyName} • ${t('dash.minimalistMode')}`}
            />
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-100 rounded text-[9px] text-amber-700 font-bold uppercase tracking-widest">
                <Clock className="w-3 h-3" />
                Quota Saver Active
              </div>
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-blue-700 transition-all shadow-sm"
              >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                {t('common.refresh')}
              </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-gray-50 pt-3">
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-bold text-gray-400 uppercase">{t('dash.period')}:</span>
               <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)} className="text-[10px] bg-transparent border-none focus:ring-0 p-0 font-bold text-gray-600" />
               <span className="text-gray-300">-</span>
               <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)} className="text-[10px] bg-transparent border-none focus:ring-0 p-0 font-bold text-gray-600" />
            </div>
            <div className="ml-auto text-[9px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-1">
              <Activity className={cn("w-2.5 h-2.5", isStale ? "text-amber-500" : "text-emerald-500")} />
              {t('dash.lastUpdated')}: {formatTimestamp(lastUpdated)}
            </div>
          </div>
        </div>

        <div className="p-4 lg:p-6 space-y-6">
          {/* Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {selectedCards.slice(0, 4).map((card: any) => (
                <div key={card.key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-center mb-4">
                      <div className={cn("p-2 rounded-xl bg-opacity-10", card.color.replace('bg-', 'bg-opacity-10 text-'))}>
                         <card.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">+12%</span>
                   </div>
                   <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</h3>
                   <p className="text-2xl font-bold text-gray-900 font-mono">
                      {card.key === 'activeLedgers' ? stats[card.key as keyof typeof stats] : `৳${formatNumber(stats[card.key as keyof typeof stats] as number)}`}
                   </p>
                </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick List - Transactions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
               <div className="p-5 border-b border-gray-50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-gray-800 uppercase tracking-tighter">{t('dash.latestActivity')}</h3>
                  <button onClick={() => navigate('/reports/daybook')} className="text-[9px] font-bold text-blue-600 uppercase hover:underline">{t('dash.fullDaybook')}</button>
               </div>
               <div className="divide-y divide-gray-50">
                  {recentVouchers.map((v) => (
                    <div key={v.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-all">
                       <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold",
                            v.v_type === 'Sales' ? "bg-emerald-100 text-emerald-600" :
                            v.v_type === 'Purchase' ? "bg-amber-100 text-amber-600" :
                            "bg-blue-100 text-blue-600"
                          )}>
                             {v.v_type[0]}
                          </div>
                          <div>
                             <p className="text-xs font-bold text-gray-800">{v.particulars}</p>
                             <p className="text-[9px] text-gray-400 font-medium uppercase">{v.v_no} • {formatDate(v.v_date)}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-xs font-bold text-gray-900">৳{formatNumber(v.total_amount)}</p>
                          <p className={`text-[8px] font-bold uppercase ${v.v_type === 'Sales' ? 'text-emerald-500' : 'text-gray-400'}`}>{v.v_type}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Performance Snapshot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-tighter mb-4">Financial Health</h3>
                <div className="space-y-4">
                   <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-emerald-500 rounded-lg text-white">
                            <TrendingUp className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-emerald-800 uppercase">Profit Margin</p>
                            <p className="text-xs text-emerald-600">Improving steadily</p>
                         </div>
                      </div>
                      <span className="text-xl font-bold text-emerald-700">68%</span>
                   </div>

                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-500 rounded-lg text-white">
                            <Users className="w-4 h-4" />
                         </div>
                         <div>
                            <p className="text-[10px] font-bold text-blue-800 uppercase">Customer Growth</p>
                            <p className="text-xs text-blue-600">Active engagement</p>
                         </div>
                      </div>
                      <span className="text-xl font-bold text-blue-700">24+</span>
                   </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardDesign === 'Design 4') {
    return (
      <div className="flex flex-col min-h-full bg-slate-900 text-slate-100 transition-colors font-sans overflow-y-auto">
        <div className="p-6 lg:p-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Executive Summary</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time analysis • {companyName}</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                   <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Last Synced</p>
                   <p className="text-xs font-mono">{formatTimestamp(lastUpdated)}</p>
                </div>
                <button 
                   onClick={() => setRefreshKey(prev => prev + 1)}
                   className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                   <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
             </div>
          </div>

          {/* Minimal KPI Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {selectedCards.slice(0, 4).map((card: any) => (
               <div key={card.key} className="bg-slate-800/50 border border-slate-700 p-6 rounded-3xl hover:bg-slate-800 transition-all">
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">{card.title}</p>
                  <p className="text-xl font-mono font-bold">
                     {card.key === 'activeLedgers' ? stats[card.key as keyof typeof stats] : formatNumber(stats[card.key as keyof typeof stats] as number)}
                  </p>
               </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-slate-800 border border-slate-700 rounded-[2rem] p-8 space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-bold uppercase tracking-widest">Recent Activity</h3>
                   <span className="text-[9px] font-bold text-slate-500 uppercase px-3 py-1 border border-slate-700 rounded-full">Top 5 Records</span>
                </div>
                <div className="space-y-4">
                   {recentVouchers.map((v) => (
                     <div key={v.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-all">
                        <div className="flex items-center gap-4">
                           <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                           <span className="text-xs font-bold w-16">{v.v_date.split('-').slice(1).join('/')}</span>
                           <span className="text-xs text-slate-300 font-medium truncate max-w-[150px]">{v.particulars}</span>
                        </div>
                        <span className="text-xs font-mono font-bold">৳{formatNumber(v.total_amount)}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-8 flex flex-col justify-between">
                <div className="space-y-6">
                   <h3 className="text-sm font-bold uppercase tracking-widest">System Health</h3>
                   <div className="space-y-4">
                      <div className="flex justify-between items-end">
                         <span className="text-[10px] text-slate-500 uppercase font-bold">Free Reads</span>
                         <span className="text-xs font-mono text-emerald-400">Stable</span>
                      </div>
                      <div className="h-1 bg-slate-900 rounded-full">
                         <div className="h-full bg-emerald-500 w-[15%]" />
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase leading-relaxed">System is running in optimized mode. Read requests are cached for 30 minutes to ensure reliability and quota safety.</p>
                   </div>
                </div>
                
                <div className="pt-8">
                   <button 
                     onClick={() => navigate('/settings')}
                     className="w-full py-4 border border-slate-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-700 transition-all"
                   >
                      System Preferences
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (dashboardDesign === 'Design 2') {
    const { revenue, profit, activeLedgers, stockValue, chartData } = stats;

    return (
      <div className="flex flex-col min-h-full bg-[#f8f9fa] transition-colors font-sans">
        {/* Fixed Header Section */}
        <div className="sticky top-0 bg-white border-b border-gray-100 shadow-sm px-4 lg:px-6 py-4 z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <EditableHeader 
              pageId="dashboard"
              defaultTitle={t('dash.overview')}
              defaultSubtitle={`${t('dash.financialSummary')} • ${companyName}`}
            />
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2">
                <input 
                  type="date" 
                  value={periodStart || ''} 
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-[10px] p-1.5 rounded outline-none focus:border-blue-500 font-mono"
                />
                <span className="text-gray-400">/</span>
                <input 
                  type="date" 
                  value={periodEnd || ''} 
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="bg-gray-50 border border-gray-200 text-[10px] p-1.5 rounded outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="text-[11px] font-bold text-gray-500 uppercase hover:text-gray-800 transition-colors"
              >
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Metric Cards Section */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('dash.kpi')}</h2>
            <div className={cn(
              "grid gap-4",
              selectedCards.length === 5 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
            )}>
              {selectedCards.map((card: any) => (
                <div key={card.key} className={cn("p-4 rounded-sm shadow-sm flex justify-between items-start group hover:brightness-95 transition-all cursor-pointer", card.color || "bg-blue-600")}>
                  <div className="space-y-4">
                    <card.icon className={cn("w-6 h-6", (card.color === 'bg-[#ffbf00]' || !card.color) ? "text-black/60" : "text-white/60")} />
                    <p className={cn("text-[10px] font-bold uppercase leading-tight", (card.color === 'bg-[#ffbf00]' || !card.color) ? "text-black/60" : "text-white/60")}>{card.title}</p>
                  </div>
                  <span className={cn("text-2xl font-light", (card.color === 'bg-[#ffbf00]' || !card.color) ? "text-black/80" : "text-white/90")}>
                    {card.key === 'activeLedgers' ? stats[card.key as keyof typeof stats] : `৳ ${formatNumber(stats[card.key as keyof typeof stats] as number)}`}
                  </span>
                </div>
              ))}
            </div>
          </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Trend */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100 lg:col-span-2">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">{t('dash.monthlySalesTrend')}</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4285f4" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#4285f4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#4285f4" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance Breakdown */}
          <div className="bg-white p-6 rounded-sm shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-6">{t('dash.performanceMetrics')}</h3>
            <div className="space-y-6">
              {[
                { label: t('dash.revenueTarget'), value: 75, color: '#4285f4' },
                { label: t('dash.profitMargin'), value: 45, color: '#673ab7' },
                { label: t('dash.stockTurnover'), value: 60, color: '#00bcd4' },
                { label: t('dash.collectionEfficiency'), value: 90, color: '#34a853' },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full transition-all duration-1000" 
                      style={{ width: `${item.value}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-sm shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">{t('dash.recentTransactions')}</h3>
            <button 
              onClick={() => navigate('/reports/daybook')}
              className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
            >
              {t('dash.viewAll')}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-100">
                  <th className="px-6 py-3">{t('common.date')}</th>
                  <th className="px-6 py-3">{t('common.voucherNo')}</th>
                  <th className="px-6 py-3">{t('common.particulars')}</th>
                  <th className="px-6 py-3">{t('common.type')}</th>
                  <th className="px-6 py-3 text-right">{t('common.amount')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentVouchers.map((v, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{v.v_date}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium hover:underline cursor-pointer" onClick={() => navigate(`/vouchers/edit/${v.id}`)}>
                      {v.v_no}
                    </td>
                    <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{v.particulars}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                        v.v_type === 'Sales' ? "bg-green-100 text-green-700" :
                        v.v_type === 'Payment' ? "bg-red-100 text-red-700" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {v.v_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">৳ {formatNumber(v.total_amount)}</td>
                  </tr>
                ))}
                {recentVouchers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 uppercase font-bold tracking-widest">{t('dash.noRecentTransactions')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer Info */}
        <div className="flex-none bg-[#0078d4] p-2 text-white text-[10px] font-medium flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3 h-3" />
            <span>{t('dash.financialYear')}: {formatFY(financialYearStart, financialYearEnd)} • {t('dash.systemStatus')}: {t('dash.online')}</span>
          </div>
          <div className="flex gap-4">
            <span className="uppercase font-bold">{t('dash.support')}</span>
            <span className="uppercase font-bold">{t('dash.documentation')}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-background transition-colors font-mono tracking-tight">
      {/* Sticky Header Section */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <EditableHeader 
            pageId="dashboard_main"
            defaultTitle={`${t('dash.gatewayOf')} ${companyName}`}
            defaultSubtitle={`${t('dash.technicalOverview')} • ${t('dash.financialYear')} ${formatFY(periodStart, periodEnd)}`}
          />
          <div className="flex flex-col items-end sm:items-end gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">{t('dash.from')}</label>
                <input 
                  type="date" 
                  value={periodStart || ''} 
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">{t('dash.to')}</label>
                <input 
                  type="date" 
                  value={periodEnd || ''} 
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4 lg:p-6 space-y-6">
        <div className={cn(
          "grid gap-4",
          selectedCards.length === 5 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        )}>
          {selectedCards.map((card: any) => (
            <StatCard 
              key={card.key}
              title={card.title} 
              value={['activeLedgers'].includes(card.key) ? stats[card.key as keyof typeof stats] : `৳ ${formatNumber(stats[card.key as keyof typeof stats] as number)}`} 
              icon={card.icon} 
              loading={loading}
              color={card.color}
              uiStyle={uiStyle}
            />
          ))}
        </div>

      {/* Subscription Status Widget - Only show if access is disabled */}
      {company && company.isAccessEnabled === false && (
        <div className={`bg-card border p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${
          company.subscriptionStatus === 'trial' ? 'border-amber-500/20 bg-amber-500/5' :
          company.subscriptionStatus === 'active' ? 'border-emerald-500/20 bg-emerald-500/5' :
          'border-rose-500/20 bg-rose-500/5'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${
              company.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-500' :
              company.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
              'bg-rose-500/10 text-rose-500'
            }`}>
              {company.subscriptionStatus === 'trial' ? <AlertTriangle className="w-6 h-6" /> :
               company.subscriptionStatus === 'active' ? <ShieldCheck className="w-6 h-6" /> :
               <Activity className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">
                {company.subscriptionStatus === 'trial' ? t('dash.trialPeriod') : 
                 company.subscriptionStatus === 'active' ? t('dash.subscriptionActive') : 
                 t('dash.subscriptionInactive')}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {t('dash.plan')}: {company.planType} • {company.expiryDate ? differenceInDays(ensureDate(company.expiryDate), new Date()) : 'N/A'} {t('dash.daysRemaining')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">{t('dash.expiresOn')}</p>
              <p className="text-sm font-mono text-foreground">
                {company.expiryDate ? safeFormat(company.expiryDate, 'dd MMM yyyy') : t('dash.notSet')}
              </p>
            </div>
            <button 
              onClick={() => {
                if (company.subscriptionStatus === 'inactive') {
                  alert('Your subscription has expired. Please contact support at sapientman46@gmail.com to renew your plan.');
                } else {
                  window.location.href = 'mailto:sapientman46@gmail.com?subject=Subscription Renewal Request for ' + company.name;
                }
              }}
              className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <CreditCard className="w-3 h-3" /> {t('dash.renewPlan')}
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {showQuickActions && (
        <div className="bg-card border border-border p-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h3 className="text-[11px] font-mono text-gray-500 uppercase tracking-widest hidden sm:block">{t('dash.quickActions')}</h3>
            <div className="grid grid-cols-3 sm:flex flex-wrap gap-2 lg:gap-3 flex-1">
              {dashboardQuickActions.includes('voucher') && (
                <button 
                  onClick={() => navigate('/vouchers/new')}
                  className={cn(
                    "px-2 py-1.5 lg:px-4 lg:py-2 border text-[8px] lg:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    uiStyle === 'UI/UX 2' 
                      ? "bg-blue-600 border-blue-500 text-white hover:bg-blue-700" 
                      : "bg-foreground/5 border-border text-foreground hover:bg-foreground hover:text-background"
                  )}
                >
                  <Plus className="w-3 h-3" /> <span className="text-center">{t('dash.voucher')}</span>
                </button>
              )}
              {dashboardQuickActions.includes('item') && (
                <button 
                  onClick={() => navigate('/inventory/items/new')}
                  className={cn(
                    "px-2 py-1.5 lg:px-4 lg:py-2 border text-[8px] lg:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    uiStyle === 'UI/UX 2' 
                      ? "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700" 
                      : "bg-foreground/5 border-border text-foreground hover:bg-foreground hover:text-background"
                  )}
                >
                  <Plus className="w-3 h-3" /> <span className="text-center">{t('dash.item')}</span>
                </button>
              )}
              {dashboardQuickActions.includes('ledger') && (
                <button 
                  onClick={() => navigate('/accounts/ledgers/new')}
                  className={cn(
                    "px-2 py-1.5 lg:px-4 lg:py-2 border text-[8px] lg:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    uiStyle === 'UI/UX 2' 
                      ? "bg-amber-600 border-amber-500 text-white hover:bg-amber-700" 
                      : "bg-foreground/5 border-border text-foreground hover:bg-foreground hover:text-background"
                  )}
                >
                  <Plus className="w-3 h-3" /> <span className="text-center">{t('dash.ledger')}</span>
                </button>
              )}
              {dashboardQuickActions.includes('godown') && (
                <button 
                  onClick={() => navigate('/inventory/godowns')}
                  className={cn(
                    "px-2 py-1.5 lg:px-4 lg:py-2 border text-[8px] lg:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    uiStyle === 'UI/UX 2' 
                      ? "bg-rose-600 border-rose-500 text-white hover:bg-rose-700" 
                      : "bg-foreground/5 border-border text-foreground hover:bg-foreground hover:text-background"
                  )}
                >
                  <Plus className="w-3 h-3" /> <span className="text-center">{t('dash.godown')}</span>
                </button>
              )}
              {isAdmin && dashboardQuickActions.includes('users') && (
                <button 
                  onClick={() => navigate('/users')}
                  className={cn(
                    "px-2 py-1.5 lg:px-4 lg:py-2 border text-[8px] lg:text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                    uiStyle === 'UI/UX 2' 
                      ? "bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700" 
                      : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white"
                  )}
                >
                  <Users className="w-3 h-3" /> <span className="text-center">{t('dash.users')}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={cn(
          "bg-card border border-border p-2 transition-all",
          uiStyle === 'UI/UX 2' && "bg-blue-600 border-blue-700 text-white shadow-lg scale-[1.02] z-10"
        )}>
          <h3 className={cn(
            "text-[10px] font-mono uppercase mb-2 tracking-widest px-1 text-center border-b border-border/10 pb-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.revenueTrajectory')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData} margin={{ top: 5, right: 10, left: 60, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#ffffff' : '#000000'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#ffffff' : '#000000'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#2563eb' : theme === 'dark' ? '#fff' : '#000' }}
                  formatter={(value: any) => [formatNumber(value), t('dash.revenue')]}
                />
                <Area type="monotone" dataKey="value" stroke={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#fff' : '#000'} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border p-2 transition-all",
          uiStyle === 'UI/UX 2' && "bg-emerald-600 border-emerald-700 text-white shadow-lg scale-[1.02] z-10"
        )}>
          <h3 className={cn(
            "text-[10px] font-mono uppercase mb-2 tracking-widest px-1 text-center border-b border-border/10 pb-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.expenseDistribution')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData} margin={{ top: 5, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#059669' : theme === 'dark' ? '#fff' : '#000' }}
                  formatter={(value: any) => [formatNumber(value), t('dash.purchase')]}
                />
                <Bar dataKey={stats.chartData.length > 0 ? "expense" : "value"} fill={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#ffffff' : '#000000'} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border p-2 transition-all",
          uiStyle === 'UI/UX 2' && "bg-amber-600 border-amber-700 text-white shadow-lg scale-[1.02] z-10"
        )}>
          <h3 className={cn(
            "text-[10px] font-mono uppercase mb-2 tracking-widest px-1 text-center border-b border-border/10 pb-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.netProfitMargin')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData.map(d => ({ ...d, profit: d.value * 0.15 }))} margin={{ top: 5, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#d97706' : theme === 'dark' ? '#fff' : '#000' }}
                  formatter={(value: any) => [formatNumber(value), t('dash.profit')]}
                />
                <Line type="monotone" dataKey="profit" stroke={uiStyle === 'UI/UX 2' ? '#fff' : "#10b981"} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border p-2 transition-all",
          uiStyle === 'UI/UX 2' && "bg-rose-600 border-rose-700 text-white shadow-lg scale-[1.02] z-10"
        )}>
          <h3 className={cn(
            "text-[10px] font-mono uppercase mb-2 tracking-widest px-1 text-center border-b border-border/10 pb-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.cashFlowProjection')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData.map(d => ({ ...d, value: d.value * 1.2 }))} margin={{ top: 5, right: 10, left: 60, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} tickFormatter={(value) => formatNumber(value)} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#e11d48' : theme === 'dark' ? '#fff' : '#000' }}
                  formatter={(value: any) => [formatNumber(value), 'Projection']}
                />
                <Area type="monotone" dataKey="value" stroke={uiStyle === 'UI/UX 2' ? '#fff' : "#3b82f6"} fill={uiStyle === 'UI/UX 2' ? '#fff' : "#3b82f6"} fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <h3 className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">{t('dash.recentTransactions')}</h3>
          <button 
            onClick={() => navigate('/reports/daybook')}
            className="text-[10px] font-mono text-gray-400 hover:text-foreground uppercase"
          >
            {t('dash.viewDaybook')}
          </button>
        </div>
        <div className="block sm:hidden divide-y divide-border/50">
          {recentVouchers.map((v) => (
            <div 
              key={v.id} 
              className="p-4 space-y-2 hover:bg-foreground/5 transition-colors cursor-pointer"
              onClick={() => navigate(`/reports/daybook`)}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] text-gray-500 uppercase">{formatDate(v.v_date)}</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase">{v.v_type}</span>
              </div>
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-foreground">
                    {v.party_ledger_name || v.ledger_name || v.ledgers || (['Sales', 'Purchase'].includes(v.particulars) ? '' : v.particulars) || v.v_type}
                  </span>
                  {v.item_names && (
                    <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{v.item_names}</span>
                  )}
                </div>
                <span className="text-sm font-bold text-foreground">৳ {formatNumber(v.total_amount)}</span>
              </div>
            </div>
          ))}
          {recentVouchers.length === 0 && !loading && (
            <div className="p-10 text-center text-gray-600 uppercase tracking-widest text-[10px]">{t('dash.noRecentTransactions')}</div>
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-mono text-xs min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="border-b border-border text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">{t('common.date')}</th>
                <th className="px-4 py-3 font-medium">{t('common.particulars')}</th>
                <th className="px-4 py-3 font-medium">{t('common.type')}</th>
                <th className="px-4 py-3 font-medium text-right">{t('common.amount')}</th>
              </tr>
            </thead>
            <tbody className="text-foreground/80">
              {recentVouchers.map((v) => (
                <tr 
                  key={v.id} 
                  className="border-b border-border/50 hover:bg-foreground/5 transition-colors cursor-pointer"
                  onClick={() => navigate(`/reports/daybook`)}
                >
                  <td className="px-4 py-3">{formatDate(v.v_date)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-foreground font-bold">
                        {v.party_ledger_name || v.ledger_name || v.ledgers || (['Sales', 'Purchase'].includes(v.particulars) ? '' : v.particulars) || v.v_type}
                      </span>
                      {v.item_names && (
                        <span className="text-[9px] text-muted-foreground uppercase tracking-widest">{v.item_names}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{v.v_type}</td>
                  <td className="px-4 py-3 text-right">৳ {formatNumber(v.total_amount)}</td>
                </tr>
              ))}
              {recentVouchers.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-600 uppercase tracking-widest">{t('dash.noRecentTransactions')}</td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-600" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);
}

