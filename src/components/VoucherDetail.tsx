import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Mail, MessageCircle, Edit, Trash2, Loader2, FileText, Calendar, Hash, User } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';
import { EditableHeader } from './EditableHeader';

export function VoucherDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [voucher, setVoucher] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVoucher() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await erpService.getVoucherById(id);
        setVoucher(data);
      } catch (err: any) {
        console.error('Error fetching voucher:', err);
        const errorMsg = err.message ? (err.message.includes('{') ? JSON.parse(err.message).error : err.message) : 'Voucher not found';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    }
    fetchVoucher();
  }, [id]);

  const handlePrint = () => {
    if (voucher) {
      printUtils.printVoucher(voucher, settings);
    }
  };

  const handleDownload = () => {
    if (voucher) {
      exportUtils.exportElementToPDF('voucher-print-area', `Voucher_${voucher.v_no}`);
    }
  };

  const handleDelete = async () => {
    if (!voucher || !confirm('Are you sure you want to delete this voucher? This action cannot be undone.')) return;
    try {
      await erpService.deleteVoucher(voucher.id);
      navigate(-1);
    } catch (err) {
      console.error('Error deleting voucher:', err);
      alert('Failed to delete voucher');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !voucher) {
    return (
      <div className="p-8 text-center bg-background min-h-screen">
        <h2 className="text-xl font-bold text-foreground mb-4">{error || 'Voucher not found'}</h2>
        <button 
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t('common.goBack')}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen transition-colors">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <EditableHeader 
              pageId="voucher_detail"
              defaultTitle={`${voucher.v_type} Voucher`}
              defaultSubtitle={`Voucher No: ${voucher.v_no}`}
            />
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button 
              onClick={() => navigate(`/vouchers/edit/${voucher.id}`)}
              className="flex-1 sm:flex-none px-4 py-2 bg-card border border-border text-gray-700 hover:text-foreground hover:border-foreground transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <Edit className="w-4 h-4" /> {t('common.edit')}
            </button>
            <button 
              onClick={handleDelete}
              className="flex-1 sm:flex-none px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest"
            >
              <Trash2 className="w-4 h-4" /> {t('common.delete')}
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-all flex items-center justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-all flex items-center justify-center"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Voucher Content Area */}
        <div id="voucher-print-area" className="bg-card border border-border shadow-sm overflow-hidden font-mono">
          {/* Company Info */}
          <div className="p-8 border-b border-border bg-foreground/[0.02]">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold uppercase text-foreground">{settings.companyName || 'SAPIENT ERP'}</h1>
                <p className="text-xs text-gray-500 whitespace-pre-line">{settings.companyAddress}</p>
                <div className="text-[10px] text-gray-400 space-x-4">
                  {settings.printPhone && <span>Phone: {settings.printPhone}</span>}
                  {settings.printEmail && <span>Email: {settings.printEmail}</span>}
                </div>
              </div>
              <div className="text-right space-y-1">
                <div className="text-xl font-bold text-foreground uppercase border-b-2 border-primary pb-1 mb-2 inline-block">
                  {voucher.v_type} Voucher
                </div>
                <div className="flex flex-col text-xs text-gray-500">
                  <div className="flex justify-between gap-4">
                    <span className="uppercase tracking-widest">No:</span>
                    <span className="font-bold text-foreground">{voucher.v_no}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="uppercase tracking-widest">Date:</span>
                    <span className="font-bold text-foreground">{formatReportDate(voucher.v_date, settings.dateFormat)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8 text-foreground">
            {/* Meta Info */}
            <div className="grid grid-cols-2 gap-8 text-sm border-b border-border pb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <span className="text-[10px] uppercase text-gray-500 block mb-1">Particulars</span>
                    <span className="font-bold text-foreground text-base">
                      {voucher.party_ledger_name || voucher.ledger_name || 'Generic Transaction'}
                    </span>
                  </div>
                </div>
              </div>
              {voucher.reference_no && (
                <div className="text-right">
                  <span className="text-[10px] uppercase text-gray-500 block mb-1">Reference</span>
                  <span className="font-bold font-mono text-foreground">{voucher.reference_no}</span>
                </div>
              )}
            </div>

            {/* Entries Table */}
            {voucher.entries && voucher.entries.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 border-b border-border pb-2 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                  <div className="col-span-8">Particulars</div>
                  <div className="col-span-2 text-right">Debit (৳)</div>
                  <div className="col-span-2 text-right">Credit (৳)</div>
                </div>
                {voucher.entries.map((entry: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 py-3 border-b border-border/50 text-xs">
                    <div className="col-span-8">
                      <div className="font-medium">{entry.ledger_name}</div>
                      {entry.narration && <div className="text-[10px] text-gray-500 italic mt-1 line-clamp-1">({entry.narration})</div>}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {entry.debit > 0 ? formatCurrency(entry.debit).replace('৳', '').trim() : ''}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {entry.credit > 0 ? formatCurrency(entry.credit).replace('৳', '').trim() : ''}
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-12 gap-4 py-4 font-bold text-foreground text-sm border-t-2 border-border">
                  <div className="col-span-8 uppercase text-[10px] tracking-widest pt-1">Total</div>
                  <div className="col-span-2 text-right font-mono">{formatCurrency(voucher.total_amount).replace('৳', '').trim()}</div>
                  <div className="col-span-2 text-right font-mono">{formatCurrency(voucher.total_amount).replace('৳', '').trim()}</div>
                </div>
              </div>
            )}

            {/* Inventory Table (if applicable) */}
            {voucher.inventory && voucher.inventory.length > 0 && (
              <div className="space-y-4 pt-4">
                <div className="text-[10px] uppercase tracking-widest font-bold text-primary border-l-2 border-primary pl-2">Inventory Details</div>
                <div className="grid grid-cols-12 gap-4 border-b border-border pb-2 text-[10px] uppercase tracking-widest font-bold text-gray-500">
                  <div className="col-span-6">Item Description</div>
                  <div className="col-span-2 text-right">Quantity</div>
                  <div className="col-span-2 text-right">Rate</div>
                  <div className="col-span-2 text-right">Amount (৳)</div>
                </div>
                {voucher.inventory.map((item: any, idx: number) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 py-3 border-b border-border/50 text-xs">
                    <div className="col-span-6">
                      <div className="font-medium">{item.item_name}</div>
                      {item.godown_name && <div className="text-[9px] text-gray-500 mt-1">Location: {item.godown_name}</div>}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {formatNumber(item.qty)} {item.unit}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {formatNumber(item.rate)}
                    </div>
                    <div className="col-span-2 text-right font-mono">
                      {formatNumber(item.qty * item.rate)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Narration */}
            {voucher.narration && (
              <div className="pt-4">
                <span className="text-[10px] uppercase text-gray-500 block mb-1">Narration</span>
                <p className="text-sm italic text-foreground leading-relaxed">
                  {voucher.narration}
                </p>
              </div>
            )}

            {/* Amount in words (simplified mockup) */}
            <div className="pt-8 text-[10px] text-gray-400">
              <span className="uppercase tracking-widest block mb-1">Amount in words:</span>
              <span className="text-foreground font-bold italic">Taka {formatNumber(voucher.total_amount)} only</span>
            </div>

            {/* User Info */}
            <div className="pt-8 flex justify-between items-end border-t border-border border-dashed">
              <div className="text-[8px] text-gray-400 uppercase space-y-1">
                <div>Entered By: {voucher.createdBy || 'System'}</div>
                <div>Created At: {voucher.createdAt?.seconds ? new Date(voucher.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</div>
              </div>
              <div className="w-48 text-center border-t border-foreground pt-2">
                <span className="text-[10px] uppercase font-bold text-foreground">Authorized Signatory</span>
              </div>
            </div>
          </div>
          
          {/* Footer App Info */}
          <div className="p-4 bg-muted/50 border-t border-border flex justify-between items-center opacity-50">
            <span className="text-[8px] uppercase tracking-widest text-gray-500">Software Generated Receipt</span>
            <div className="flex items-center gap-1">
               <div className="w-3 h-3 bg-foreground rounded-sm flex items-center justify-center text-[6px] text-background font-bold">E</div>
               <span className="text-[8px] font-bold uppercase tracking-tight text-foreground">SAPIENT ERP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
