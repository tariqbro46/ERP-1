import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Package, CreditCard, Loader2, Plus, Calendar, ShieldCheck, AlertTriangle, Clock, Hammer, CheckCircle2, ListTodo } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { cn, formatNumber } from '../lib/utils';
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
    <div className="flex justify-between items-start">
      <span className={cn(
        "text-[10px] uppercase tracking-wider font-mono",
        uiStyle === 'UI/UX 2' ? "text-white/70" : "text-gray-500"
      )}>{title}</span>
      <Icon className={cn("w-4 h-4", uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-600")} />
    </div>
    <div className="flex items-baseline justify-start gap-2 flex-wrap">
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
  const { companyName, financialYearStart, financialYearEnd, dashboardDesign, uiStyle, showQuickActions, dashboardQuickActions = ['voucher', 'item', 'ledger', 'godown', 'users'] } = useSettings();
  const { isAdmin, user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // Default to current month
  const getDefaultPeriod = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    
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
      const d = (date as any)?.toDate ? (date as any).toDate() : (date instanceof Date ? date : new Date(date));
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [s, v, o] = await Promise.all([
          erpService.getDashboardStats(user.companyId),
          erpService.getRecentVouchers(user.companyId, 5),
          erpService.getOrders(user.companyId)
        ]);
        setStats(s);
        const processed = (v || []).map(vch => ({
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
  }, [periodStart, periodEnd, user?.companyId]);

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

  if (dashboardDesign === 'Design 2') {
    const { revenue, profit, activeLedgers, stockValue, chartData } = stats;

    return (
      <div className="p-4 lg:p-6 space-y-6 bg-[#f8f9fa] min-h-screen transition-colors font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <EditableHeader 
            pageId="dashboard"
            defaultTitle={t('dash.overview')}
            defaultSubtitle={`${t('dash.financialSummary')} • ${companyName}`}
          />
          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="text-[11px] font-bold text-gray-500 uppercase hover:text-gray-800 transition-colors"
            >
              {t('common.refresh')}
            </button>
          </div>
        </div>

        {/* Metric Cards Section */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('dash.kpi')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#ffbf00] p-4 rounded-sm shadow-sm flex justify-between items-start group hover:brightness-95 transition-all cursor-pointer">
              <div className="space-y-4">
                <CreditCard className="w-6 h-6 text-black/60" />
                <p className="text-[10px] font-bold text-black/60 uppercase leading-tight">{t('dash.revenue')}</p>
              </div>
              <span className="text-2xl font-light text-black/80">৳ {formatNumber(revenue)}</span>
            </div>
            <div className="bg-[#34a853] p-4 rounded-sm shadow-sm flex justify-between items-start group hover:brightness-95 transition-all cursor-pointer">
              <div className="space-y-4">
                <Activity className="w-6 h-6 text-white/60" />
                <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">{t('dash.profit')}</p>
              </div>
              <span className="text-2xl font-light text-white/90">৳ {formatNumber(profit)}</span>
            </div>
            <div className="bg-[#ea4335] p-4 rounded-sm shadow-sm flex justify-between items-start group hover:brightness-95 transition-all cursor-pointer">
              <div className="space-y-4">
                <Users className="w-6 h-6 text-white/60" />
                <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">{t('dash.activeLedgers')}</p>
              </div>
              <span className="text-3xl font-light text-white/90">{activeLedgers}</span>
            </div>
            <div className="bg-[#e91e63] p-4 rounded-sm shadow-sm flex justify-between items-start group hover:brightness-95 transition-all cursor-pointer">
              <div className="space-y-4">
                <Package className="w-6 h-6 text-white/60" />
                <p className="text-[10px] font-bold text-white/60 uppercase leading-tight">{t('dash.stockValue')}</p>
              </div>
              <span className="text-2xl font-light text-white/90">৳ {formatNumber(stockValue)}</span>
            </div>
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

        {/* Footer Info */}
        <div className="bg-[#0078d4] p-2 text-white text-[10px] font-medium flex justify-between items-center px-4">
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
    <div className="p-4 lg:p-6 space-y-6 bg-background min-h-screen transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('dash.revenue')} 
          value={`৳ ${formatNumber(stats.revenue)}`} 
          change="+12.5%" 
          icon={Activity} 
          trend="up" 
          loading={loading}
          color="bg-blue-600"
          uiStyle={uiStyle}
        />
        <StatCard 
          title={t('dash.profit')} 
          value={`৳ ${formatNumber(stats.profit)}`} 
          change="+5.2%" 
          icon={CreditCard} 
          trend="up" 
          loading={loading}
          color="bg-emerald-600"
          uiStyle={uiStyle}
        />
        <StatCard 
          title={t('dash.activeLedgers')} 
          value={stats.activeLedgers?.toString() || '0'} 
          change="+3" 
          icon={Users} 
          trend="up" 
          loading={loading}
          color="bg-amber-600"
          uiStyle={uiStyle}
        />
        <StatCard 
          title={t('dash.stockValue')} 
          value={`৳ ${formatNumber(stats.stockValue)}`} 
          change="-2.1%" 
          icon={Package} 
          trend="down" 
          loading={loading}
          color="bg-rose-600"
          uiStyle={uiStyle}
        />
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
                {t('dash.plan')}: {company.planType} • {company.expiryDate ? differenceInDays((company.expiryDate as any)?.toDate ? (company.expiryDate as any).toDate() : new Date(company.expiryDate), new Date()) : 'N/A'} {t('dash.daysRemaining')}
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
            "text-[10px] font-mono uppercase mb-1 tracking-widest px-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.revenueTrajectory')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#ffffff' : '#000000'} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#ffffff' : '#000000'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#2563eb' : theme === 'dark' ? '#fff' : '#000' }}
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
            "text-[10px] font-mono uppercase mb-1 tracking-widest px-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.expenseDistribution')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#059669' : theme === 'dark' ? '#fff' : '#000' }}
                />
                <Bar dataKey="value" fill={uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#ffffff' : '#000000'} radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border p-2 transition-all",
          uiStyle === 'UI/UX 2' && "bg-amber-600 border-amber-700 text-white shadow-lg scale-[1.02] z-10"
        )}>
          <h3 className={cn(
            "text-[10px] font-mono uppercase mb-1 tracking-widest px-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.netProfitMargin')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chartData.length > 0 ? stats.chartData.map(d => ({ ...d, value: d.value * 0.15 })) : mockChartData.map(d => ({ ...d, value: d.value * 0.15 }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#d97706' : theme === 'dark' ? '#fff' : '#000' }}
                />
                <Line type="monotone" dataKey="value" stroke={uiStyle === 'UI/UX 2' ? '#fff' : "#10b981"} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border p-2 transition-all",
          uiStyle === 'UI/UX 2' && "bg-rose-600 border-rose-700 text-white shadow-lg scale-[1.02] z-10"
        )}>
          <h3 className={cn(
            "text-[10px] font-mono uppercase mb-1 tracking-widest px-1",
            uiStyle === 'UI/UX 2' ? "text-white/80" : "text-gray-500"
          )}>{t('dash.cashFlowProjection')}</h3>
          <div className="h-[150px] lg:h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData.length > 0 ? stats.chartData.map(d => ({ ...d, value: d.value * 1.2 })) : mockChartData.map(d => ({ ...d, value: d.value * 1.2 }))} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.1)' : theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <YAxis stroke={uiStyle === 'UI/UX 2' ? 'rgba(255,255,255,0.6)' : "#666"} fontSize={8} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#141414' : '#ffffff', 
                    border: `1px solid ${uiStyle === 'UI/UX 2' ? '#fff' : theme === 'dark' ? '#333' : '#e5e5e5'}`, 
                    fontSize: '10px', 
                    fontFamily: 'monospace',
                    color: uiStyle === 'UI/UX 2' ? '#1e293b' : 'inherit'
                  }}
                  itemStyle={{ color: uiStyle === 'UI/UX 2' ? '#e11d48' : theme === 'dark' ? '#fff' : '#000' }}
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
  );
}

