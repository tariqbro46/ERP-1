import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, ArrowLeft, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';

export function CashBankBooks() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Cash-in-Hand', 'Bank Accounts']));
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  useEffect(() => {
    async function fetchSummary() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const data = await erpService.getCashBankSummary(user.companyId, dateRange.from, dateRange.to);
        // Get ledger groups to identify which ones are Cash or Bank
        const groups = await erpService.getLedgerGroups(user.companyId);
        const ledgersWithGroups = data.map(l => {
          const ledgerData = summary.find(s => s.id === l.id); // Try to get from existing state if needed? No, better fetch ledgers.
          return { ...l };
        });
        
        // We'll need the group names for each ledger
        const ledgers = await erpService.getLedgers(user.companyId);
        const enrichedSummary = data.map(s => {
          const ledger = ledgers.find(l => l.id === s.id);
          return {
            ...s,
            groupName: (ledger as any)?.ledger_groups?.name || (ledger as any)?.group_name || 'Other'
          };
        });

        setSummary(enrichedSummary);
      } catch (err) {
        console.error('Error fetching cash/bank summary:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, [user?.companyId, dateRange]);

  const toggleGroup = (group: string) => {
    const next = new Set(expandedGroups);
    if (next.has(group)) next.delete(group);
    else next.add(group);
    setExpandedGroups(next);
  };

  const groupedData = summary.reduce((acc: any, item) => {
    const group = item.groupName;
    if (!acc[group]) acc[group] = { items: [], opening: 0, debit: 0, credit: 0, closing: 0 };
    acc[group].items.push(item);
    acc[group].opening += item.openingBalance;
    acc[group].debit += item.debit;
    acc[group].credit += item.credit;
    acc[group].closing += item.closingBalance;
    return acc;
  }, {});

  const filteredGroups = Object.keys(groupedData).filter(group => 
    group.toLowerCase().includes(searchTerm.toLowerCase()) ||
    groupedData[group].items.some((s: any) => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const grandTotals = summary.reduce((acc, s) => ({
    opening: acc.opening + s.openingBalance,
    debit: acc.debit + s.debit,
    credit: acc.credit + s.credit,
    closing: acc.closing + s.closingBalance
  }), { opening: 0, debit: 0, credit: 0, closing: 0 });

  const handlePrint = () => {
    printUtils.printElement('cash-bank-report', 'Cash/Bank Summary');
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('cash-bank-report', 'Cash_Bank_Summary');
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-foreground" />
          </button>
          <EditableHeader 
            pageId="cash_bank_books"
            defaultTitle="Cash/Bank Books"
            defaultSubtitle="Summary of all cash and bank ledger balances"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-500 bg-card border border-border hover:text-foreground hover:border-foreground transition-all"
          >
            <Printer className="w-4 h-4" />
            {t('common.print')}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-background bg-foreground hover:opacity-90 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            {t('common.downloadPdf')}
          </button>
        </div>
      </div>

      <div className="bg-card p-4 rounded-xl border border-border shadow-sm mb-6 transition-colors">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search by ledger group or name..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.from}
              onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm text-foreground"
            />
            <span className="text-gray-500 text-xs uppercase font-bold tracking-widest">{t('common.to')}</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
              className="px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm text-foreground"
            />
          </div>
        </div>
      </div>

      <div id="cash-bank-report" className="bg-card rounded-xl border border-border overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono">
            <thead>
              <tr className="bg-foreground/5 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Particulars</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Opening Balance</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Debit</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Credit</th>
                <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Closing Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredGroups.length > 0 ? filteredGroups.map((group) => (
                <React.Fragment key={group}>
                  {/* Group Row */}
                  <tr 
                    className="bg-foreground/[0.02] hover:bg-foreground/[0.04] transition-colors cursor-pointer group"
                    onClick={() => toggleGroup(group)}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-foreground flex items-center gap-2">
                      <div className={cn("w-4 h-4 flex items-center justify-center transition-transform", expandedGroups.has(group) ? "rotate-90" : "")}>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                      {group}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-foreground text-right">
                      {formatCurrency(groupedData[group].opening)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600 text-right">
                      {formatCurrency(groupedData[group].debit)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600 text-right">
                      {formatCurrency(groupedData[group].credit)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-primary text-right">
                      {formatCurrency(groupedData[group].closing)}
                    </td>
                  </tr>
                  {/* Ledger Rows */}
                  {expandedGroups.has(group) && groupedData[group].items.map((s: any) => (
                    <tr 
                      key={s.id} 
                      className="hover:bg-foreground/5 transition-colors cursor-pointer"
                      onClick={() => navigate(`/reports/ledger?ledgerId=${s.id}&from=${dateRange.from}&to=${dateRange.to}`)}
                    >
                      <td className="px-12 py-3 text-sm text-gray-600 italic">
                        {s.name}
                      </td>
                      <td className="px-6 py-3 text-xs text-gray-500 text-right">
                        {formatCurrency(s.openingBalance)}
                      </td>
                      <td className="px-6 py-3 text-xs text-green-500 text-right">
                        {formatCurrency(s.debit)}
                      </td>
                      <td className="px-6 py-3 text-xs text-red-500 text-right">
                        {formatCurrency(s.credit)}
                      </td>
                      <td className="px-6 py-3 text-xs font-medium text-gray-700 text-right">
                        {formatCurrency(s.closingBalance)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 lowercase tracking-widest text-[10px]">
                    No cash or bank ledgers found.
                  </td>
                </tr>
              )}
            </tbody>
            {!loading && summary.length > 0 && (
              <tfoot>
                <tr className="bg-foreground/5 font-bold border-t-2 border-border">
                  <td className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-500">Grand Total</td>
                  <td className="px-6 py-4 text-right text-foreground text-sm">{formatCurrency(grandTotals.opening)}</td>
                  <td className="px-6 py-4 text-right text-green-600 text-sm">{formatCurrency(grandTotals.debit)}</td>
                  <td className="px-6 py-4 text-right text-red-600 text-sm">{formatCurrency(grandTotals.credit)}</td>
                  <td className="px-6 py-4 text-right text-primary text-sm">{formatCurrency(grandTotals.closing)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
