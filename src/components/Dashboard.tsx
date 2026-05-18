import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, ArrowDownRight, Activity, Users, Package, CreditCard, Loader2, Plus, Calendar, ShieldCheck, AlertTriangle, Clock, Hammer, CheckCircle2, ListTodo, TrendingUp, RefreshCw, MessageSquare, Globe, Phone, Mail, StickyNote } from 'lucide-react';
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
    showAnnouncement,
    announcementText,
    announcementColor,
    showHelpfulLinks,
    helpfulLinks,
    showSupportContact,
    supportContactPhone,
    supportContactEmail,
    showCustomMessage,
    customMessageTitle,
    customMessageContent
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

  // Filter out expensive financial cards if they are not allowed
  const forbiddenKeys = ['sales', 'purchase', 'payment', 'receipt', 'stock', 'revenue'];
  const selectedCards = (dashboardCards.length > 0 ? dashboardCards : ['ledgers', 'profit'])
    .filter(id => !forbiddenKeys.includes(id))
    .slice(0, 5)
    .map(id => cardConfigs[id])
    .filter(Boolean);
  
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
      setLoading(true);
      try {
        const isForced = !isInitialMount.current && refreshKey > 0;
        isInitialMount.current = false;

        const [s, v, o] = await Promise.all([
          erpService.getDashboardStats(user.companyId, periodStart, periodEnd, isForced),
          erpService.getRecentVouchers(user.companyId, 5, isForced),
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
  }, [periodStart, periodEnd, user?.companyId, refreshKey]);

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
  // Dashboard is considered "Live" if updated in the last 10 minutes, otherwise "Cached"
  const isCacheOptimized = lastUpdated > 0 && (Date.now() - lastUpdated < 7200000); 
  const isStale = Date.now() - lastUpdated > 600000;

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
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[9px] font-black uppercase tracking-tight text-emerald-700 leading-none">
                  Live Status: Optimized
                </span>
                <span className="text-[8px] text-gray-400 font-mono ml-2 border-l border-emerald-200 pl-2">
                  DATA CACHED ({Math.round((Date.now() - lastUpdated) / 60000)}m ago)
                </span>
              </div>
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-black transition-all shadow-lg"
              >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                Refresh Data
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
          {/* Global Announcement */}
          {showAnnouncement && (
            <div className={cn(
              "p-3 rounded border flex items-center gap-3 shadow-sm",
              announcementColor === 'blue' && "bg-blue-50 border-blue-200 text-blue-700",
              announcementColor === 'amber' && "bg-amber-50 border-amber-200 text-amber-700",
              announcementColor === 'emerald' && "bg-emerald-50 border-emerald-200 text-emerald-700",
              announcementColor === 'rose' && "bg-rose-50 border-rose-200 text-rose-700",
              announcementColor === 'slate' && "bg-slate-50 border-slate-200 text-slate-700"
            )}>
              <MessageSquare className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-tight">{announcementText}</p>
            </div>
          )}

          {/* Big Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
             {selectedCards.slice(0, 4).map((card: any) => (
                <div key={card.key} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                   <div className="flex justify-between items-center mb-4">
                      <div className={cn("p-2 rounded-xl bg-opacity-10", card.color.replace('bg-', 'bg-opacity-10 text-'))}>
                         <card.icon className="w-5 h-5" />
                      </div>
                   </div>
                   <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{card.title}</h3>
                   <p className="text-2xl font-bold text-gray-900 font-mono">
                      {card.key === 'activeLedgers' ? stats[card.key as keyof typeof stats] : `৳${formatNumber(stats[card.key as keyof typeof stats] as number)}`}
                   </p>
                </div>
             ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions Widget */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
               <h3 className="text-xs font-black text-gray-800 uppercase tracking-tighter border-b pb-2">Operational Controls</h3>
               <div className="grid grid-cols-2 gap-3">
                  {dashboardQuickActions.slice(0, 4).map(action => (
                    <button 
                      key={action}
                      onClick={() => navigate(`/${action === 'voucher' ? 'vouchers/new' : action === 'item' ? 'inventory/items/new' : action === 'ledger' ? 'accounts/ledgers/new' : 'users'}`)}
                      className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all text-left"
                    >
                      <p className="text-[10px] font-black uppercase text-slate-400 mb-1">{action}</p>
                      <p className="text-[11px] font-bold text-slate-700">Access Module</p>
                    </button>
                  ))}
               </div>
            </div>

            {/* Performance Snapshot */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h3 className="text-xs font-black text-gray-800 uppercase tracking-tighter mb-4">Support & Resources</h3>
                <div className="space-y-4">
                  {showSupportContact && (
                    <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500 rounded-lg text-white">
                             <Phone className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-emerald-800 uppercase">Support Line</p>
                             <p className="text-xs text-emerald-600 font-bold">{supportContactPhone}</p>
                          </div>
                       </div>
                    </div>
                  )}

                  {showHelpfulLinks && (
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500 rounded-lg text-white">
                             <Globe className="w-4 h-4" />
                          </div>
                          <div>
                             <p className="text-[10px] font-bold text-blue-800 uppercase">Guides</p>
                             <p className="text-xs text-blue-600 font-bold">{helpfulLinks?.[0]?.title || 'View System Docs'}</p>
                          </div>
                       </div>
                    </div>
                  )}
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
          {/* Global Announcement */}
          {showAnnouncement && (
            <div className={cn(
              "p-4 rounded-2xl border flex items-center gap-4 bg-slate-800/50 border-slate-700",
              announcementColor === 'rose' && "border-rose-500/30",
              announcementColor === 'emerald' && "border-emerald-500/30",
              announcementColor === 'blue' && "border-blue-500/30"
            )}>
              <MessageSquare className="w-5 h-5 text-slate-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-slate-300">{announcementText}</p>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
             <div>
                <h1 className="text-3xl font-black tracking-tighter uppercase mb-1">Executive Summary</h1>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time analysis • {companyName}</p>
             </div>
             <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Live Status: Safe Mode</span>
                  <span className="text-[8px] text-slate-500 font-mono ml-2 border-l border-slate-700 pl-2">CACHED: {formatTimestamp(lastUpdated)}</span>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  {selectedCards.map((card: any) => (
                    <div key={card.key} className="bg-slate-800/50 border border-slate-700 p-8 rounded-[2rem] hover:bg-slate-800 transition-all">
                       <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-1">{card.title}</p>
                       <p className="text-2xl font-mono font-bold">
                          {card.key === 'activeLedgers' ? stats[card.key as keyof typeof stats] : `৳${formatNumber(stats[card.key as keyof typeof stats] as number)}`}
                       </p>
                    </div>
                  ))}
                </div>

                {showHelpfulLinks && (
                  <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-8 space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Resource links</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {helpfulLinks?.map((link: any, i: number) => (
                        <a key={i} href={link.url} className="p-3 bg-slate-900/50 border border-slate-700 rounded-xl flex justify-between items-center text-[10px] font-bold uppercase hover:bg-slate-700 transition-all">
                          {link.title}
                          <ArrowUpRight className="w-3 h-3 text-slate-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-slate-800 border border-slate-700 rounded-[2rem] p-8 flex flex-col justify-between">
                <div className="space-y-6">
                   <h3 className="text-sm font-bold uppercase tracking-widest">System Health</h3>
                   <div className="space-y-6">
                      <div className="p-4 bg-slate-900/50 border border-slate-700 rounded-2xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[10px] text-slate-500 uppercase font-bold">Read Quota Status</span>
                          <span className="text-[10px] font-mono text-emerald-400">OPTIMIZED</span>
                        </div>
                        <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[12%]" />
                        </div>
                      </div>

                      {showSupportContact && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-4 p-4 border border-slate-700 rounded-2xl">
                             <div className="p-2 bg-slate-700 rounded-lg">
                                <Phone className="w-4 h-4 text-slate-300" />
                             </div>
                             <div>
                                <p className="text-[9px] font-bold text-slate-500 uppercase">Support Line</p>
                                <p className="text-xs font-bold font-mono">{supportContactPhone}</p>
                             </div>
                          </div>
                        </div>
                      )}
                   </div>
                </div>
                
                <div className="pt-8 space-y-4">
                   <button 
                     onClick={() => setRefreshKey(prev => prev + 1)}
                     className="w-full py-4 bg-white text-slate-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:scale-[1.02] transition-all"
                   >
                      Force Cloud Sync
                   </button>
                   <button 
                     onClick={() => navigate('/settings')}
                    className="w-full py-2 border border-slate-700 rounded-xl text-[8px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all text-center"
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
    return (
      <div className="flex flex-col min-h-full bg-[#f8f9fa] transition-colors font-sans overflow-y-auto">
        {/* Fixed Header Section */}
        <div className="sticky top-0 bg-white border-b border-gray-100 shadow-sm px-4 lg:px-6 py-4 z-30">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <EditableHeader 
              pageId="dashboard"
              defaultTitle={t('dash.overview')}
              defaultSubtitle={`${t('dash.financialSummary')} • ${companyName}`}
            />
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded">
                <div className={cn("w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse")} />
                <span className="text-[9px] font-black uppercase tracking-tight text-blue-700">
                  Quota Optimized Mode
                </span>
              </div>
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest rounded hover:bg-blue-700 transition-all shadow-sm"
              >
                <RefreshCw className={cn("w-3 h-3", loading && "animate-spin")} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 lg:p-6 space-y-6">
          {/* Global Announcement */}
          {showAnnouncement && (
            <div className={cn(
              "p-4 rounded-xl border flex items-center gap-3 bg-white shadow-sm border-gray-100",
              announcementColor === 'blue' && "border-l-4 border-l-blue-500"
            )}>
              <MessageSquare className="w-5 h-5 text-gray-400" />
              <p className="text-xs font-bold text-gray-600 truncate">{announcementText}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {selectedCards.map((card: any) => (
              <div key={card.key} className={cn("p-6 rounded-2xl shadow-sm flex flex-col justify-between items-start group hover:brightness-95 transition-all", card.color || "bg-blue-600")}>
                <card.icon className={cn("w-8 h-8 mb-6", (card.color === 'bg-[#ffbf00]' || !card.color) ? "text-black/40" : "text-white/40")} />
                <div>
                  <p className={cn("text-[10px] font-bold uppercase leading-tight mb-2", (card.color === 'bg-[#ffbf00]' || !card.color) ? "text-black/60" : "text-white/60")}>{card.title}</p>
                  <span className={cn("text-3xl font-light font-mono", (card.color === 'bg-[#ffbf00]' || !card.color) ? "text-black/80" : "text-white/90")}>
                    {card.key === 'activeLedgers' ? stats[card.key as keyof typeof stats] : `৳${formatNumber(stats[card.key as keyof typeof stats] as number)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {showSupportContact && (
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-tighter text-gray-400 mb-4 border-b pb-2">Technical Support</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Support Phone</p>
                      <p className="text-xs font-bold font-gray-700">{supportContactPhone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                      <Mail className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Support Email</p>
                      <p className="text-xs font-bold font-gray-700">{supportContactEmail}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {showHelpfulLinks && (
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-tighter text-gray-400 mb-4 border-b pb-2">Self Help Center</h3>
                <div className="space-y-2">
                  {helpfulLinks?.map((link: any, i: number) => (
                    <a key={i} href={link.url} className="block p-3 bg-gray-50 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-all flex justify-between items-center">
                      {link.title}
                      <ArrowUpRight className="w-4 h-4 text-gray-300" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {showCustomMessage && (
              <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <h3 className="text-xs font-black uppercase tracking-tighter text-gray-400 mb-4 border-b pb-2">{customMessageTitle}</h3>
                <p className="text-xs leading-relaxed text-gray-500">{customMessageContent}</p>
              </div>
            )}
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
          <div className="flex flex-col items-end sm:items-end gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 border border-border rounded-lg">
              <div className={cn("w-2 h-2 rounded-full", isCacheOptimized ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-gray-400")} />
              <span className="text-[9px] font-black uppercase text-foreground/60 tracking-widest">
                {isCacheOptimized ? "Safe Quota Mode" : "Refresh Recommended"}
              </span>
              <span className="text-[9px] text-gray-500 font-mono ml-2 pl-2 border-l border-border italic">
                {isCacheOptimized ? `Cache: ${formatTimestamp(lastUpdated)}` : "Live Sync Needed"}
              </span>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <button 
                onClick={() => setRefreshKey(prev => prev + 1)}
                className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-black uppercase tracking-tighter hover:opacity-90 transition-all rounded"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
                Refresh Source
              </button>
              <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
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
    </div>

      {/* Content Section */}
      <div className="p-4 lg:p-6 space-y-6">
        {/* Global Announcement */}
        {showAnnouncement && (
          <div className={cn(
            "p-3 rounded border flex items-center gap-3 shadow-sm",
            announcementColor === 'blue' && "bg-blue-50 border-blue-200 text-blue-700",
            announcementColor === 'amber' && "bg-amber-50 border-amber-200 text-amber-700",
            announcementColor === 'emerald' && "bg-emerald-50 border-emerald-200 text-emerald-700",
            announcementColor === 'rose' && "bg-rose-50 border-rose-200 text-rose-700",
            announcementColor === 'slate' && "bg-slate-50 border-slate-200 text-slate-700"
          )}>
            <div className="p-1.5 rounded-full bg-white/50">
              <MessageSquare className="w-4 h-4" />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-tight">{announcementText}</p>
          </div>
        )}

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

        {/* Low-Read Support Widgets */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {showHelpfulLinks && (
            <div className="bg-card border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Globe className="w-4 h-4 text-emerald-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Helpful Resources</h3>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {helpfulLinks?.map((link: any, i: number) => (
                  <a 
                    key={i} 
                    href={link.url} 
                    className="p-2 bg-foreground/5 hover:bg-foreground/10 transition-all rounded text-[10px] uppercase font-bold text-foreground/70 flex justify-between items-center group"
                  >
                    {link.title}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {showSupportContact && (
            <div className="bg-card border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <Phone className="w-4 h-4 text-rose-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Official Support</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-muted-foreground">Direct Line</p>
                    <p className="text-xs font-mono font-bold">{supportContactPhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-muted-foreground">Email Support</p>
                    <p className="text-xs font-mono font-bold">{supportContactEmail}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showCustomMessage && (
            <div className="bg-card border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-border pb-2">
                <StickyNote className="w-4 h-4 text-amber-500" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">{customMessageTitle}</h3>
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                "{customMessageContent}"
              </p>
            </div>
          )}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Support Widget */}
        {showSupportContact && (
          <div className="bg-card border border-border p-6 rounded-lg space-y-4">
            <h3 className="text-xs font-black uppercase tracking-tighter text-muted-foreground mb-4">Official Technical Support</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-foreground/5 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Support Line</p>
                  <p className="text-xs font-bold font-mono text-foreground">{supportContactPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-foreground/5 rounded-xl border border-border">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase">Email Query</p>
                  <p className="text-xs font-bold font-mono text-foreground">{supportContactEmail}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Links Widget */}
        {showHelpfulLinks && (
          <div className="bg-card border border-border p-6 rounded-lg space-y-4">
            <h3 className="text-xs font-black uppercase tracking-tighter text-muted-foreground mb-4">Learning Resources</h3>
            <div className="space-y-2">
              {helpfulLinks?.map((link: any, i: number) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-foreground/5 hover:bg-foreground/10 border border-border rounded-xl transition-all group">
                  <span className="text-xs font-bold uppercase text-foreground/70">{link.title}</span>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Message Widget */}
        {showCustomMessage && (
          <div className="bg-card border border-border p-6 rounded-lg">
            <h3 className="text-xs font-black uppercase tracking-tighter text-muted-foreground mb-4 border-b border-border pb-2">{customMessageTitle}</h3>
            <p className="text-sm italic leading-relaxed text-muted-foreground">"{customMessageContent}"</p>
          </div>
        )}
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

