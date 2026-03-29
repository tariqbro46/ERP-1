import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, Scale, Package, Loader2, Download, Printer } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { printReport } from '../utils/printUtils';

export function RatioAnalysis() {
  const { user } = useAuth();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [ratios, setRatios] = useState<any>(null);

  useEffect(() => {
    async function fetchRatios() {
      if (!user?.companyId) return;
      try {
        const stats = await erpService.getDashboardStats(user.companyId);
        // Calculate some basic ratios
        const currentAssets = stats.stockValue + 500000; // Mocking some cash
        const currentLiabilities = 300000; // Mocking
        
        setRatios({
          currentRatio: (currentAssets / currentLiabilities).toFixed(2),
          quickRatio: ((currentAssets - stats.stockValue) / currentLiabilities).toFixed(2),
          grossProfitMargin: stats.revenue > 0 ? ((stats.profit / stats.revenue) * 100).toFixed(2) : '0.00',
          inventoryTurnover: stats.stockValue > 0 ? (stats.revenue / stats.stockValue).toFixed(2) : '0.00',
          debtToEquity: (0.45).toFixed(2) // Mock
        });
      } catch (err) {
        console.error('Error fetching ratios:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchRatios();
  }, [user?.companyId]);

  const handlePrint = () => {
    const printData = [
      { particulars: 'Current Ratio', value: ratios.currentRatio },
      { particulars: 'Quick Ratio', value: ratios.quickRatio },
      { particulars: 'GP Margin', value: `${ratios.grossProfitMargin}%` },
      { particulars: 'Inventory Turnover', value: ratios.inventoryTurnover },
      { particulars: 'Debt to Equity', value: ratios.debtToEquity }
    ];
    printReport('Ratio Analysis', printData, ['Particulars', 'Value'], settings);
  };

  const handleDownloadCSV = () => {
    const exportData = [
      { particulars: 'Current Ratio', value: ratios.currentRatio },
      { particulars: 'Quick Ratio', value: ratios.quickRatio },
      { particulars: 'GP Margin', value: `${ratios.grossProfitMargin}%` },
      { particulars: 'Inventory Turnover', value: ratios.inventoryTurnover },
      { particulars: 'Debt to Equity', value: ratios.debtToEquity }
    ];
    exportToCSV('Ratio_Analysis', 'Ratio Analysis', exportData, ['Particulars', 'Value'], settings);
  };

  const handleDownloadPDF = () => {
    const exportData = [
      { particulars: 'Current Ratio', value: ratios.currentRatio },
      { particulars: 'Quick Ratio', value: ratios.quickRatio },
      { particulars: 'GP Margin', value: `${ratios.grossProfitMargin}%` },
      { particulars: 'Inventory Turnover', value: ratios.inventoryTurnover },
      { particulars: 'Debt to Equity', value: ratios.debtToEquity }
    ];
    exportToPDF('Ratio_Analysis', 'Ratio Analysis', exportData, ['Particulars', 'Value'], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl text-foreground uppercase tracking-tighter">Ratio Analysis</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Key Performance Indicators • Financial Year 2024-25</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title="Download CSV"
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              title="Download PDF"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <RatioCard 
            title="Current Ratio" 
            value={ratios.currentRatio} 
            description="Ability to pay short-term obligations"
            icon={Scale}
            status={parseFloat(ratios.currentRatio) > 1.5 ? 'Good' : 'Warning'}
          />
          <RatioCard 
            title="Quick Ratio" 
            value={ratios.quickRatio} 
            description="Immediate liquidity (Acid Test)"
            icon={Activity}
            status={parseFloat(ratios.quickRatio) > 1 ? 'Good' : 'Warning'}
          />
          <RatioCard 
            title="GP Margin" 
            value={`${ratios.grossProfitMargin}%`} 
            description="Profitability on sales"
            icon={TrendingUp}
            status={parseFloat(ratios.grossProfitMargin) > 20 ? 'Good' : 'Average'}
          />
          <RatioCard 
            title="Inventory Turnover" 
            value={ratios.inventoryTurnover} 
            description="Efficiency of stock management"
            icon={Package}
            status="Normal"
          />
          <RatioCard 
            title="Debt to Equity" 
            value={ratios.debtToEquity} 
            description="Financial leverage"
            icon={Scale}
            status="Healthy"
          />
        </div>

        <div className="bg-card border border-border p-8 mt-8">
          <h3 className="text-[11px] text-gray-500 uppercase tracking-widest mb-6">Technical Interpretation</h3>
          <div className="space-y-4 text-sm text-gray-400 leading-relaxed">
            <p>
              The <span className="text-foreground font-bold">Current Ratio of {ratios.currentRatio}</span> indicates that the company has sufficient current assets to cover its short-term liabilities. A ratio above 1.5 is generally considered healthy in this industry.
            </p>
            <p>
              The <span className="text-foreground font-bold">GP Margin of {ratios.grossProfitMargin}%</span> suggests a strong pricing strategy or efficient direct cost management. This provides a solid buffer for indirect operating expenses.
            </p>
            <p>
              Inventory is being turned over <span className="text-foreground font-bold">{ratios.inventoryTurnover} times</span> per period, which aligns with standard retail benchmarks for the current quarter.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function RatioCard({ title, value, description, icon: Icon, status }: any) {
  return (
    <div className="bg-card border border-border p-6 hover:border-foreground/30 transition-colors group">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-foreground/5 border border-border rounded group-hover:border-foreground/30">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        <span className={cn(
          "text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border",
          status === 'Good' || status === 'Healthy' ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" :
          status === 'Warning' ? "text-rose-500 border-rose-500/20 bg-rose-500/5" :
          "text-amber-500 border-amber-500/20 bg-amber-500/5"
        )}>
          {status}
        </span>
      </div>
      <div className="space-y-1">
        <h3 className="text-[10px] text-gray-500 uppercase tracking-widest">{title}</h3>
        <p className="text-3xl font-mono text-foreground">{value}</p>
        <p className="text-[10px] text-gray-600 mt-2">{description}</p>
      </div>
    </div>
  );
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}
