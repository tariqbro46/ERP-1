import React, { useState, useEffect } from 'react';
import { Search, Printer, Download, Filter, Loader2, ArrowLeft } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber } from '../lib/utils';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { printReport, printUtils } from '../utils/printUtils';
import { exportToCSV, exportToPDF, exportUtils } from '../utils/exportUtils';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { useNavigate } from 'react-router-dom';
import { EditableHeader } from './EditableHeader';

export function TrialBalance() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      try {
        const ledgers = await erpService.getLedgers(user.companyId);
        // Group by nature or just list all ledgers with their balances
        setData(ledgers);
      } catch (err) {
        console.error('Error fetching trial balance:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId]);

  const filteredData = data
    .filter(l => 
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.ledger_groups?.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalDebit = filteredData.reduce((sum, l) => sum + (l.current_balance > 0 ? l.current_balance : 0), 0);
  const totalCredit = filteredData.reduce((sum, l) => sum + (l.current_balance < 0 ? Math.abs(l.current_balance) : 0), 0);

  const handlePrint = () => {
    printUtils.printElement('trial-balance-report', 'Trial Balance Report');
  };

  const handleDownloadPDF = () => {
    exportUtils.exportToPDF('trial-balance-report', 'Trial_Balance_Report');
  };

  const handleDownload = () => {
    const exportData = filteredData.map(l => ({
      particulars: l.name,
      group: l.ledger_groups?.name,
      debit: l.current_balance > 0 ? l.current_balance : 0,
      credit: l.current_balance < 0 ? Math.abs(l.current_balance) : 0
    }));

    exportToCSV('Trial_Balance', t('reports.trialBalance'), exportData, [t('common.particulars'), t('common.group'), t('reports.debit'), t('reports.credit')], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const firstDay = formatReportDate(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0], settings.dateFormat);
  const lastDay = formatReportDate(new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0], settings.dateFormat);

  return (
    <div className="flex flex-col h-full bg-background transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <EditableHeader 
              pageId="trial_balance"
              defaultTitle={t('reports.trialBalance')}
              defaultSubtitle={`${settings.companyName} • ${firstDay} to ${lastDay}`}
            />
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <button 
              onClick={handlePrint}
              className="flex-1 sm:flex-none p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handleDownload}
              disabled={filteredData.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title={t('common.downloadPdf')}
            >
              <Download className="w-3 h-3" /> CSV
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={filteredData.length === 0}
              className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
              title={t('common.downloadPdf')}
            >
              <Download className="w-3 h-3" /> PDF
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-card border border-border px-4 py-2 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border text-foreground pl-10 pr-4 py-2 text-xs outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div className="flex gap-4 justify-end">
            <button className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground">
              <Filter className="w-3 h-3" /> {t('common.filter')}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6 space-y-6">
          {/* Table/Cards */}
          <div id="trial-balance-report" className="bg-card border border-border overflow-hidden p-0">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50">
            {filteredData.map((ledger) => (
              <div key={ledger.id} className="p-4 space-y-2 hover:bg-foreground/5 transition-colors">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-foreground">{ledger.name}</span>
                  <span className="text-[9px] text-gray-500 uppercase px-1.5 py-0.5 bg-foreground/5 border border-border">
                    {ledger.ledger_groups?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="text-emerald-500">
                    {ledger.current_balance > 0 ? `Dr ৳ ${formatNumber(ledger.current_balance)}` : ''}
                  </div>
                  <div className="text-rose-500">
                    {ledger.current_balance < 0 ? `Cr ৳ ${formatNumber(Math.abs(ledger.current_balance))}` : ''}
                  </div>
                </div>
              </div>
            ))}
            {filteredData.length === 0 && (
              <div className="p-10 text-center text-gray-600 uppercase tracking-widest text-[10px]">{t('common.noData')}</div>
            )}
            {/* Grand Total Mobile */}
            <div className="p-4 bg-foreground/10 space-y-2">
              <div className="flex justify-between items-center font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                <span>{t('reports.totalDebit')}</span>
                <span className="text-foreground text-xs">৳ {formatNumber(totalDebit)}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-[10px] text-gray-500 uppercase tracking-widest">
                <span>{t('reports.totalCredit')}</span>
                <span className="text-foreground text-xs">৳ {formatNumber(totalCredit)}</span>
              </div>
            </div>
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block relative">
            <table className="w-full text-left text-xs min-w-[600px] border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-card">
                <tr className="border-b border-border text-gray-500 uppercase bg-foreground/5">
                  <th className="px-6 py-4 font-medium border-b border-border">{t('common.particulars')}</th>
                  <th className="px-6 py-4 font-medium border-b border-border">{t('common.group')}</th>
                  <th className="px-6 py-4 font-medium text-right w-48 border-b border-border">{t('reports.debit')} (৳)</th>
                  <th className="px-6 py-4 font-medium text-right w-48 border-b border-border">{t('reports.credit')} (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredData.map((ledger, idx) => (
                  <tr 
                    key={ledger.id} 
                    onClick={() => navigate(`/reports/ledger?ledgerId=${ledger.id}`)}
                    className="hover:bg-foreground/5 transition-colors group cursor-pointer"
                  >
                    <td className="px-6 py-3 text-foreground font-medium">{ledger.name}</td>
                    <td className="px-6 py-3 text-gray-500 uppercase text-[10px]">{ledger.ledger_groups?.name}</td>
                    <td className="px-6 py-3 text-right text-foreground">
                      {ledger.current_balance > 0 ? formatNumber(ledger.current_balance) : ''}
                    </td>
                    <td className="px-6 py-3 text-right text-foreground">
                      {ledger.current_balance < 0 ? formatNumber(Math.abs(ledger.current_balance)) : ''}
                    </td>
                  </tr>
                ))}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-600 uppercase tracking-widest">{t('common.noData')}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-foreground/5 border-t border-border">
                <tr className="font-bold text-foreground">
                  <td colSpan={2} className="px-6 py-4 text-right uppercase text-[10px] text-gray-500 tracking-widest">{t('common.grandTotal')}</td>
                  <td className="px-6 py-4 text-right border-l border-border">৳ {formatNumber(totalDebit)}</td>
                  <td className="px-6 py-4 text-right border-l border-border">৳ {formatNumber(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Difference Bar */}
        {Math.abs(totalDebit - totalCredit) > 0.01 && (
          <div className="bg-rose-950/30 border border-rose-900/50 p-4 flex justify-between items-center">
            <span className="text-[10px] text-rose-400 uppercase tracking-widest font-bold">{t('reports.differenceInOpening')}</span>
            <span className="text-sm text-rose-400 font-bold">৳ {formatNumber(Math.abs(totalDebit - totalCredit))}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);
}
