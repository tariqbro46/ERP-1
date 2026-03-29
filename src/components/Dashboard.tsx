import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, Users, Package, CreditCard, Loader2, Plus, Calendar, ShieldCheck, AlertTriangle } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { format, differenceInDays } from 'date-fns';

const mockChartData = [
  { name: 'Jan', value: 4000 },
  { name: 'Feb', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Apr', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Jun', value: 2390 },
];

const StatCard = ({ title, value, change, icon: Icon, trend, loading }: any) => (
  <div className="bg-card border border-border p-4 flex flex-col gap-2 transition-colors">
    <div className="flex justify-between items-start">
      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-mono">{title}</span>
      <Icon className="w-4 h-4 text-gray-600" />
    </div>
    <div className="flex items-baseline gap-2">
      {loading ? (
        <div className="h-8 w-24 bg-foreground/5 animate-pulse rounded" />
      ) : (
        <>
          <span className="text-2xl font-mono text-foreground">{value}</span>
          {change && (
            <span className={`text-[10px] font-mono flex items-center ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
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
  const { companyName, financialYearStart, financialYearEnd } = useSettings();
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
  const [periodStart, setPeriodStart] = useState(defaultPeriod.start);
  const [periodEnd, setPeriodEnd] = useState(defaultPeriod.end);

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [s, v] = await Promise.all([
          erpService.getDashboardStats(user.companyId),
          erpService.getRecentVouchers(user.companyId, 5)
        ]);
        setStats(s);
        setRecentVouchers(v);
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

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-background min-h-screen transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
        <div className="flex items-baseline gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Gateway of {companyName}</h1>
          <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Technical Overview • Financial Year {formatFY(periodStart, periodEnd)}</p>
        </div>
        <div className="flex flex-col items-end sm:items-end gap-2 w-full sm:w-auto">
          <p className="text-[10px] text-gray-500 font-mono uppercase w-full text-right">Current Period</p>
          <div className="flex items-center gap-2 bg-card border border-border p-1 rounded w-full sm:w-auto justify-end">
            <input 
              type="date" 
              value={periodStart || ''} 
              onChange={(e) => setPeriodStart(e.target.value)}
              className="bg-transparent text-[10px] font-mono text-foreground outline-none border-none p-1"
            />
            <span className="text-gray-500 text-[10px]">to</span>
            <input 
              type="date" 
              value={periodEnd || ''} 
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="bg-transparent text-[10px] font-mono text-foreground outline-none border-none p-1"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Revenue" 
          value={`৳ ${stats.revenue.toLocaleString()}`} 
          change="+12.5%" 
          icon={Activity} 
          trend="up" 
          loading={loading}
        />
        <StatCard 
          title="Net Profit" 
          value={`৳ ${stats.profit.toLocaleString()}`} 
          change="+5.2%" 
          icon={CreditCard} 
          trend="up" 
          loading={loading}
        />
        <StatCard 
          title="Active Ledgers" 
          value={stats.activeLedgers?.toString() || '0'} 
          change="+3" 
          icon={Users} 
          trend="up" 
          loading={loading}
        />
        <StatCard 
          title="Stock Value" 
          value={`৳ ${stats.stockValue.toLocaleString()}`} 
          change="-2.1%" 
          icon={Package} 
          trend="down" 
          loading={loading}
        />
      </div>

      {/* Subscription Status Widget */}
      {company && (
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
                {company.subscriptionStatus === 'trial' ? 'Trial Period' : 
                 company.subscriptionStatus === 'active' ? 'Subscription Active' : 
                 'Subscription Inactive'}
              </h3>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Plan: {company.planType} • {company.expiryDate ? differenceInDays(new Date(company.expiryDate), new Date()) : 'N/A'} days remaining
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-mono">Expires On</p>
              <p className="text-sm font-mono text-foreground">
                {company.expiryDate ? format(new Date(company.expiryDate), 'dd MMM yyyy') : 'Not Set'}
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
              <CreditCard className="w-3 h-3" /> Renew Plan
            </button>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-card border border-border p-4">
        <h3 className="text-[11px] font-mono text-gray-500 uppercase mb-4 tracking-widest">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => navigate('/vouchers/new')}
            className="px-4 py-2 bg-foreground/5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> New Voucher
          </button>
          <button 
            onClick={() => navigate('/inventory/items/new')}
            className="px-4 py-2 bg-foreground/5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> New Item
          </button>
          <button 
            onClick={() => navigate('/accounts/ledgers/new')}
            className="px-4 py-2 bg-foreground/5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> New Ledger
          </button>
          <button 
            onClick={() => navigate('/inventory/godowns')}
            className="px-4 py-2 bg-foreground/5 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground hover:text-background transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> New Godown
          </button>
          {isAdmin && (
            <button 
              onClick={() => navigate('/users')}
              className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Users className="w-3 h-3" /> User Management
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6">
          <h3 className="text-[11px] font-mono text-gray-500 uppercase mb-6 tracking-widest">Revenue Trajectory</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={theme === 'dark' ? '#ffffff' : '#000000'} stopOpacity={0.1}/>
                    <stop offset="95%" stopColor={theme === 'dark' ? '#ffffff' : '#000000'} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#ffffff', border: `1px solid ${theme === 'dark' ? '#333' : '#e5e5e5'}`, fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Area type="monotone" dataKey="value" stroke={theme === 'dark' ? '#fff' : '#000'} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border p-6">
          <h3 className="text-[11px] font-mono text-gray-500 uppercase mb-6 tracking-widest">Expense Distribution</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.chartData.length > 0 ? stats.chartData : mockChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#e5e5e5'} vertical={false} />
                <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#ffffff', border: `1px solid ${theme === 'dark' ? '#333' : '#e5e5e5'}`, fontSize: '12px', fontFamily: 'monospace' }}
                  itemStyle={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
                <Bar dataKey="value" fill={theme === 'dark' ? '#444' : '#888'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex justify-between items-center">
          <h3 className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">Recent Transactions</h3>
          <button 
            onClick={() => navigate('/reports/daybook')}
            className="text-[10px] font-mono text-gray-400 hover:text-foreground uppercase"
          >
            View Daybook
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
                <span className="text-xs font-bold text-foreground">{v.particulars}</span>
                <span className="text-sm font-bold text-foreground">৳ {v.total_amount.toLocaleString()}</span>
              </div>
            </div>
          ))}
          {recentVouchers.length === 0 && !loading && (
            <div className="p-10 text-center text-gray-600 uppercase tracking-widest text-[10px]">No recent transactions</div>
          )}
        </div>

        <div className="hidden sm:block overflow-x-auto no-scrollbar">
          <table className="w-full text-left font-mono text-xs min-w-[600px] sm:min-w-0">
            <thead>
              <tr className="border-b border-border text-gray-500 uppercase">
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Particulars</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
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
                  <td className="px-4 py-3">{v.particulars}</td>
                  <td className="px-4 py-3">{v.v_type}</td>
                  <td className="px-4 py-3 text-right">৳ {v.total_amount.toLocaleString()}</td>
                </tr>
              ))}
              {recentVouchers.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-gray-600 uppercase tracking-widest">No recent transactions</td>
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

