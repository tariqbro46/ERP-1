import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Users, TrendingUp, Target, Award, Calendar, Search, Loader2, ArrowUpRight, ArrowDownRight, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

import { SearchableSelect } from './SearchableSelect';

interface SalespersonStat {
  uid: string;
  name: string;
  email: string;
  totalSales: number;
  target: number;
  achievement: number;
  voucherCount: number;
}

export function SalespersonReport() {
  const { user } = useAuth();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SalespersonStat[]>([]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(1); // Start of month
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user?.companyId) {
      fetchStats();
    }
  }, [user?.companyId, startDate, endDate]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [vouchers, users] = await Promise.all([
        erpService.getVouchersByDateRange(user!.companyId, startDate, endDate),
        erpService.getCompanyUsers(user!.companyId)
      ]);

      const salesVouchers = vouchers.filter(v => v.v_type === 'Sales');
      
      const salespersonStats = (users as any[]).map(u => {
        const userSales = salesVouchers.filter(v => v.salesperson_id === u.uid);
        const totalSales = userSales.reduce((sum, v) => sum + (v.total_amount || 0), 0);
        const target = u.target_amount || 0;
        const achievement = target > 0 ? (totalSales / target) * 100 : 0;

        return {
          uid: u.uid,
          name: u.displayName || 'No Name',
          email: u.email,
          totalSales,
          target,
          achievement,
          voucherCount: userSales.length
        };
      });

      setStats(salespersonStats.sort((a, b) => b.totalSales - a.totalSales));
    } catch (err) {
      console.error('Error fetching salesperson stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredStats = stats.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCompanySales = stats.reduce((sum, s) => sum + s.totalSales, 0);
  const topPerformer = stats.length > 0 ? stats[0] : null;

  return (
    <div className="p-4 lg:p-6 space-y-6 font-mono transition-colors">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          {(settings.companyLogo || settings.systemLogo) && (
            <div className="w-12 h-12 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
              <img 
                src={settings.companyLogo || settings.systemLogo} 
                alt="Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-500" />
              Sales Performance
            </h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold">{settings.companyName}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 w-full md:w-auto">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">From</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground uppercase font-bold"
              />
            </div>
            <div className="flex-1">
              <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">To</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground uppercase font-bold"
              />
            </div>
          </div>
          
          <div className="w-full sm:w-64">
            <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">Salesperson</label>
            <SearchableSelect
              options={stats.map(s => ({ id: s.uid, name: s.name }))}
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Select Salesperson..."
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border p-3 lg:p-6 rounded-xl shadow-sm space-y-2 lg:space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-500" />
            </div>
            <span className="text-[8px] lg:text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-1.5 lg:px-2 py-0.5 rounded-full">LIVE</span>
          </div>
          <div>
            <p className="text-[8px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Sales</p>
            <h3 className="text-sm lg:text-2xl font-bold text-foreground mt-1 truncate">৳ {totalCompanySales.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-card border border-border p-3 lg:p-6 rounded-xl shadow-sm space-y-2 lg:space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <Target className="w-4 h-4 lg:w-5 lg:h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <p className="text-[8px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Top Performer</p>
            <h3 className="text-sm lg:text-2xl font-bold text-foreground mt-1 truncate">{topPerformer?.name || 'N/A'}</h3>
            {topPerformer && (
              <p className="text-[8px] lg:text-[10px] text-emerald-500 font-bold mt-1">
                {topPerformer.achievement.toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-3 lg:p-6 rounded-xl shadow-sm space-y-2 lg:space-y-4">
          <div className="flex items-center justify-between">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Users className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500" />
            </div>
          </div>
          <div>
            <p className="text-[8px] lg:text-[10px] text-gray-500 uppercase tracking-widest font-bold">Active Staff</p>
            <h3 className="text-sm lg:text-2xl font-bold text-foreground mt-1 truncate">{stats.filter(s => s.voucherCount > 0).length}</h3>
            <p className="text-[8px] lg:text-[10px] text-gray-500 font-bold mt-1">
              Out of {stats.length}
            </p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-foreground/5">
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold">Salesperson</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-right">Target</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-right">Achieved</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-center">Progress</th>
                <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-bold text-right">Vouchers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 text-gray-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-xs">
                    No sales data found for this period.
                  </td>
                </tr>
              ) : (
                filteredStats.map((stat) => (
                  <tr key={stat.uid} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-foreground font-bold text-xs">
                          {stat.name[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm text-foreground font-bold">{stat.name}</p>
                          <p className="text-[10px] text-gray-500">{stat.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-foreground">
                      ৳ {stat.target.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground">৳ {stat.totalSales.toLocaleString()}</span>
                        <span className={cn(
                          "text-[9px] font-bold flex items-center gap-0.5",
                          stat.achievement >= 100 ? "text-emerald-500" : "text-amber-500"
                        )}>
                          {stat.achievement >= 100 ? <ArrowUpRight className="w-2.5 h-2.5" /> : <ArrowDownRight className="w-2.5 h-2.5" />}
                          {stat.achievement.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-full max-w-[120px] mx-auto h-1.5 bg-foreground/10 rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full transition-all duration-500",
                            stat.achievement >= 100 ? "bg-emerald-500" : 
                            stat.achievement >= 50 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${Math.min(stat.achievement, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-500">
                      {stat.voucherCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
