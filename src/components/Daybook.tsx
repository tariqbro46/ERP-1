import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { printReport } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';

import { exportService } from '../services/exportService';

export function Daybook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSettings();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-CA');
  });

  const fetchVouchers = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getVouchersByDateRange(user.companyId, startDate, endDate);
      const processed = (data || []).map(v => ({
        ...v,
        particulars: v.particulars || 'Transaction'
      }));
      setVouchers(processed);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, [startDate, endDate]);

  const handlePrint = () => {
    const printData = vouchers.map(v => ({
      date: v.v_date,
      particulars: v.particulars,
      vch_type: v.v_type,
      vch_no: v.v_no,
      amount: v.total_amount
    }));

    printReport('Daybook', printData, ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Amount'], settings);
  };

  const handleDownloadExcel = () => {
    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    const exportData = vouchers.map(v => ({
      'Date': v.v_date,
      'Particulars': v.particulars,
      'Voucher Type': v.v_type,
      'Voucher No': v.v_no,
      'Amount': v.total_amount
    }));

    exportService.exportToExcel(exportData, `Daybook_${period.replace(/ /g, '_')}`, 'Daybook');
  };

  const handleDownloadPDF = () => {
    const period = `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;
    const headers = [['Date', 'Particulars', 'Vch Type', 'Vch No', 'Amount']];
    const body = vouchers.map(v => [
      v.v_date,
      v.particulars,
      v.v_type,
      v.v_no,
      v.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })
    ]);

    exportService.exportToPDF(headers, body, `Daybook_${period.replace(/ /g, '_')}`, `Daybook Report (${period})`);
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-md space-y-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Daybook</h1>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">From</label>
                <input 
                  type="date" 
                  value={startDate || ''} 
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
              <div className="flex-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold mb-1 block">To</label>
                <input 
                  type="date" 
                  value={endDate || ''} 
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-card border border-border text-foreground text-[10px] p-2 outline-none focus:border-foreground"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownloadExcel}
              disabled={vouchers.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Download Excel"
            >
              <Download className="w-3 h-3" /> EXCEL
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={vouchers.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title="Download PDF"
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        <div className="bg-card border border-border overflow-hidden">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50">
            {loading ? (
              <div className="p-10 text-center text-gray-500">Loading transactions...</div>
            ) : vouchers.length === 0 ? (
              <div className="p-10 text-center text-gray-500">No transactions recorded</div>
            ) : vouchers.map((v) => (
              <div 
                key={v.id} 
                className="p-4 space-y-3 hover:bg-foreground/5 transition-colors cursor-pointer group"
                onClick={() => navigate(`/vouchers/edit/${v.id}`)}
              >
                <div className="flex justify-between items-start">
                  <span className="text-[10px] text-gray-500 uppercase font-mono">{v.v_date}</span>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">{v.v_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-foreground">{v.particulars}</span>
                    <span className="text-[10px] text-gray-500 font-mono">{v.v_no}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground font-mono">৳ {v.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs min-w-[700px] lg:min-w-0">
              <thead>
                <tr className="border-b border-border text-gray-500 uppercase">
                  <th className="px-4 lg:px-6 py-4 font-medium">Date</th>
                  <th className="px-4 lg:px-6 py-4 font-medium">Particulars</th>
                  <th className="px-4 lg:px-6 py-4 font-medium">Vch Type</th>
                  <th className="px-4 lg:px-6 py-4 font-medium">Vch No.</th>
                  <th className="px-4 lg:px-6 py-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading transactions...</td></tr>
                ) : vouchers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No transactions recorded for this period</td></tr>
                ) : vouchers.map((v) => (
                  <tr 
                    key={v.id} 
                    className="border-b border-border/50 hover:bg-foreground/5 cursor-pointer group transition-colors"
                    onClick={() => navigate(`/vouchers/edit/${v.id}`)}
                  >
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">{v.v_date}</td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{v.particulars}</span>
                        <ArrowRight className="w-3 h-3 text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 uppercase text-[10px] text-gray-500">{v.v_type}</td>
                    <td className="px-4 lg:px-6 py-4">{v.v_no}</td>
                    <td className="px-4 lg:px-6 py-4 text-right text-foreground font-mono">৳ {v.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
