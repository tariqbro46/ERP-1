import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Calendar, ArrowRight, Download, Printer, BarChart3, PieChart as PieChartIcon, CheckCircle2, XCircle } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

export function FinancialInsights() {
  const { user } = useAuth();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [cashFlowData, setCashFlowData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [period, setPeriod] = useState('6months');
  const [activeInsightTab, setActiveInsightTab] = useState('forecast');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        // Fetch last 6 months of data for forecast
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
        
        const vouchers = await erpService.getCollection('vouchers', user.companyId);
        const filteredVouchers = vouchers.filter((v: any) => v.v_date >= sixMonthsAgo);

        if (filteredVouchers) {
          // Process for Cash Flow Forecast (Simple moving average or trend)
          const monthlyData: Record<string, { month: string, inflow: number, outflow: number }> = {};
          
          filteredVouchers.forEach((v: any) => {
            const m = new Date(v.v_date).toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!monthlyData[m]) monthlyData[m] = { month: m, inflow: 0, outflow: 0 };
            
            if (v.v_type === 'Receipt' || v.v_type === 'Sales') {
              monthlyData[m].inflow += v.total_amount;
            } else if (v.v_type === 'Payment' || v.v_type === 'Purchase') {
              monthlyData[m].outflow += v.total_amount;
            }
          });

          const chartData = Object.values(monthlyData);
          
          // Simple Forecast for next 3 months
          const avgInflow = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.inflow, 0) / chartData.length : 0;
          const avgOutflow = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.outflow, 0) / chartData.length : 0;
          
          const forecast = [];
          for (let i = 1; i <= 3; i++) {
            const nextDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
            forecast.push({
              month: nextDate.toLocaleString('default', { month: 'short', year: '2-digit' }) + ' (F)',
              inflow: avgInflow * (1 + (i * 0.05)), // 5% growth assumption
              outflow: avgOutflow,
              isForecast: true
            });
          }

          setCashFlowData([...chartData, ...forecast]);

          // Comparison Data (Current Month vs Previous Month)
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

          const currMonthVouchers = filteredVouchers.filter((v: any) => {
            const d = new Date(v.v_date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          });
          const prevMonthVouchers = filteredVouchers.filter((v: any) => {
            const d = new Date(v.v_date);
            return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
          });

          const compare = [
            {
              name: 'Revenue',
              current: currMonthVouchers.filter((v: any) => v.v_type === 'Sales').reduce((sum: number, v: any) => sum + v.total_amount, 0),
              previous: prevMonthVouchers.filter((v: any) => v.v_type === 'Sales').reduce((sum: number, v: any) => sum + v.total_amount, 0)
            },
            {
              name: 'Expenses',
              current: currMonthVouchers.filter((v: any) => v.v_type === 'Payment' || v.v_type === 'Purchase').reduce((sum: number, v: any) => sum + v.total_amount, 0),
              previous: prevMonthVouchers.filter((v: any) => v.v_type === 'Payment' || v.v_type === 'Purchase').reduce((sum: number, v: any) => sum + v.total_amount, 0)
            }
          ];
          setComparisonData(compare);
        }
      } catch (err) {
        console.error('Error fetching financial insights:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId, period]);

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="space-y-1">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Financial Insights</h1>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveInsightTab('forecast')}
                className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${activeInsightTab === 'forecast' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
              >
                Forecast & Comparison
              </button>
              <button 
                onClick={() => setActiveInsightTab('reconciliation')}
                className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${activeInsightTab === 'reconciliation' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
              >
                Bank Reconciliation
              </button>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto justify-end items-end">
            <button 
              onClick={() => window.print()}
              className="w-full sm:w-auto px-4 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button 
              onClick={() => {
                const csvContent = "data:text/csv;charset=utf-8," + 
                  "Month,Inflow,Outflow\n" + 
                  cashFlowData.map(d => `${d.month},${d.inflow},${d.outflow}`).join("\n");
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "financial_insights.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }}
              className="w-full sm:w-auto px-4 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>

        {activeInsightTab === 'forecast' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Cash Flow Forecast Chart */}
            <div className="bg-card border border-border p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Cash Flow Forecast
                </h2>
                <span className="text-[10px] text-gray-500 uppercase">Next 3 Months Projection</span>
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                    <XAxis dataKey="month" fontSize={10} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                    <YAxis fontSize={10} tick={{ fill: '#666' }} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }} />
                    <Bar dataKey="inflow" name="Inflow" fill="#10b981" radius={[2, 2, 0, 0]} />
                    <Bar dataKey="outflow" name="Outflow" fill="#f43f5e" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-gray-500 italic leading-relaxed">
                * Forecast is based on historical moving averages with a 5% projected growth in inflows. 
                Actual results may vary based on market conditions and business operations.
              </p>
            </div>

            {/* Comparison Report */}
            <div className="bg-card border border-border p-6 space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-amber-500" />
                  Period Comparison
                </h2>
                <span className="text-[10px] text-gray-500 uppercase">Current vs Previous Month</span>
              </div>
              <div className="space-y-4">
                {comparisonData.map((item, idx) => {
                  const diff = item.current - item.previous;
                  const percent = item.previous === 0 ? 100 : (diff / item.previous) * 100;
                  const isPositive = diff >= 0;

                  return (
                    <div key={idx} className="p-4 border border-border bg-foreground/[0.02] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold uppercase tracking-tighter">{item.name}</span>
                        <div className={`flex items-center gap-1 text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {Math.abs(percent).toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Current Month</p>
                          <p className="text-lg font-bold font-mono">৳ {item.current.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-[9px] text-gray-500 uppercase">Previous Month</p>
                          <p className="text-lg font-bold font-mono text-gray-500">৳ {item.previous.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="w-full bg-border h-1 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.name === 'Revenue' ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                          style={{ width: `${Math.min(100, (item.current / (item.current + item.previous)) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 uppercase font-bold">Net Profit Change</span>
                  <span className="text-sm font-bold font-mono text-emerald-500">+ ৳ 12,450.00</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-500" />
                Bank Reconciliation Statement
              </h2>
              <div className="flex gap-4">
                <select className="bg-background border border-border text-foreground px-3 py-1 text-[10px] uppercase outline-none focus:border-foreground">
                  <option>Dutch-Bangla Bank Ltd</option>
                  <option>Islami Bank Bangladesh</option>
                </select>
                <button className="px-4 py-1 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest">
                  Import Statement
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 border border-border bg-foreground/5 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase">Balance as per Books</p>
                <p className="text-xl font-bold font-mono">৳ 1,24,500.00</p>
              </div>
              <div className="p-4 border border-border bg-foreground/5 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase">Unreconciled Amount</p>
                <p className="text-xl font-bold font-mono text-rose-500">৳ 12,000.00</p>
              </div>
              <div className="p-4 border border-border bg-foreground/5 space-y-1">
                <p className="text-[9px] text-gray-500 uppercase">Balance as per Bank</p>
                <p className="text-xl font-bold font-mono text-emerald-500">৳ 1,36,500.00</p>
              </div>
            </div>

            <div className="border border-border overflow-hidden">
              <table className="w-full text-left text-[10px] uppercase tracking-widest">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Particulars</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { date: '2024-03-10', name: 'Cheque Issued to Supplier A', amount: 5000, status: 'reconciled' },
                    { date: '2024-03-12', name: 'Cash Deposit', amount: 15000, status: 'pending' },
                    { date: '2024-03-13', name: 'Bank Charges', amount: 250, status: 'pending' },
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-foreground/[0.02]">
                      <td className="px-4 py-3 text-gray-500">{row.date}</td>
                      <td className="px-4 py-3 font-bold">{row.name}</td>
                      <td className="px-4 py-3 text-right font-mono">৳ {row.amount.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold ${row.status === 'reconciled' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button className="text-blue-500 hover:underline">Match</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
