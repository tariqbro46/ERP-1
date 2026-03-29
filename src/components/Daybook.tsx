import React, { useState, useEffect } from 'react';
import { Search, Filter, Download, Printer, ArrowRight, Share2, MessageCircle, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { printReport } from '../utils/printUtils';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { pdfService } from '../services/pdfService';

import { exportService } from '../services/exportService';

export function Daybook() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSettings();
  const { showNotification } = useNotification();
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailed, setIsDetailed] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
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
      const [vData, iData, gData] = await Promise.all([
        isDetailed 
          ? erpService.getVouchersDetailedByDateRange(user.companyId, startDate, endDate)
          : erpService.getVouchersByDateRange(user.companyId, startDate, endDate),
        erpService.getItems(user.companyId),
        erpService.getGodowns(user.companyId)
      ]);

      setItems(iData);
      setGodowns(gData);

      const processed = (vData || []).map(v => ({
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
  }, [startDate, endDate, isDetailed]);

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

  const handleShareWhatsApp = (v: any) => {
    pdfService.shareViaWhatsApp(v, settings);
    showNotification('Opening WhatsApp...', 'success');
  };

  const handleShareEmail = (v: any) => {
    pdfService.shareViaEmail(v, settings);
    showNotification('Opening Email Client...', 'success');
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex-1 w-full sm:max-w-2xl space-y-4">
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
              onClick={() => setIsDetailed(!isDetailed)}
              className={cn(
                "flex-1 sm:flex-none px-3 py-2 border border-border transition-colors flex items-center gap-2 text-[10px] font-bold uppercase",
                isDetailed ? "bg-foreground text-background" : "text-gray-500 hover:text-foreground"
              )}
            >
              {isDetailed ? 'Condensed' : 'Detailed'}
            </button>
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
                <div className="flex gap-2 pt-2 border-t border-border/20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                    className="flex-1 py-1.5 bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <MessageCircle className="w-3 h-3" /> WhatsApp
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                    className="flex-1 py-1.5 bg-blue-500/10 text-blue-500 text-[9px] font-bold uppercase rounded flex items-center justify-center gap-1"
                  >
                    <Mail className="w-3 h-3" /> Email
                  </button>
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
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase">Vch Type</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase">Vch No.</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right">Amount</th>
                  <th className="px-4 lg:px-6 py-4 font-medium uppercase text-right">Share</th>
                </tr>
              </thead>
              <tbody className="text-foreground/80">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading transactions...</td></tr>
                ) : vouchers.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No transactions recorded for this period</td></tr>
                ) : vouchers.map((v) => (
                  <React.Fragment key={v.id}>
                    <tr 
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
                      <td className="px-4 lg:px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShareWhatsApp(v); }}
                            className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Share via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleShareEmail(v); }}
                            className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                            title="Share via Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isDetailed && v.inventory && v.inventory.length > 0 && (
                      <tr className="bg-foreground/[0.02] border-b border-border/30">
                        <td colSpan={5} className="px-4 lg:px-12 py-2">
                          <table className="w-full text-[10px] text-gray-500">
                            <thead>
                              <tr className="border-b border-border/20 uppercase text-[8px]">
                                <th className="py-1 text-left">Name of Item</th>
                                <th className="py-1 text-left">Godown</th>
                                <th className="py-1 text-right">Quantity</th>
                                <th className="py-1 text-right">Free</th>
                                <th className="py-1 text-right">Rate</th>
                                <th className="py-1 text-center">per</th>
                                <th className="py-1 text-right">Disc %</th>
                                <th className="py-1 text-right">Tax %</th>
                                <th className="py-1 text-right">Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {v.inventory.map((item: any, idx: number) => (
                                <tr key={idx} className="border-b border-border/10 last:border-0">
                                  <td className="py-1">{items.find(i => i.id === item.item_id)?.name || 'Unknown Item'}</td>
                                  <td className="py-1">{godowns.find(g => g.id === item.godown_id)?.name || '-'}</td>
                                  <td className="py-1 text-right">{item.qty}</td>
                                  <td className="py-1 text-right">{item.free_qty || 0}</td>
                                  <td className="py-1 text-right">{item.rate.toLocaleString()}</td>
                                  <td className="py-1 text-center">{item.unit || 'pcs'}</td>
                                  <td className="py-1 text-right">{item.disc_percent || 0}%</td>
                                  <td className="py-1 text-right">{item.tax_percent || 0}%</td>
                                  <td className="py-1 text-right font-bold text-foreground/70">{item.amount.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
