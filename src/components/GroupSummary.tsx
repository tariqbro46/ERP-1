import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, ArrowLeft, Loader2, ChevronRight, Calendar } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { ReportPrintHeader, ReportPrintFooter } from './ReportPrintHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';
import { DateInput } from './DateInput';

export function GroupSummary() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));

  useEffect(() => {
    async function fetchGroups() {
      if (!user?.companyId) return;
      try {
        const data = await erpService.getLedgerGroups(user.companyId);
        setGroups(data);
        if (data.length > 0) {
          setSelectedGroup(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching groups:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGroups();
  }, [user?.companyId]);

  useEffect(() => {
    async function fetchLedgers() {
      if (!user?.companyId || !selectedGroup) return;
      setLoading(true);
      try {
        const data = await erpService.getGroupSummary(user.companyId, selectedGroup, startDate, endDate);
        setLedgers(data);
      } catch (err) {
        console.error('Error fetching ledgers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedgers();
  }, [user?.companyId, selectedGroup, startDate, endDate]);

  const filteredLedgers = ledgers
    .filter(l => l.current_balance !== 0)
    .filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalDebit = filteredLedgers.reduce((sum, l) => sum + (l.debit || 0), 0);
  const totalCredit = filteredLedgers.reduce((sum, l) => sum + (l.credit || 0), 0);
  const totalClosingDebit = filteredLedgers.reduce((sum, l) => sum + (l.current_balance > 0 ? l.current_balance : 0), 0);
  const totalClosingCredit = filteredLedgers.reduce((sum, l) => sum + (l.current_balance < 0 ? Math.abs(l.current_balance) : 0), 0);

  const handlePrint = () => {
    printUtils.printElement('group-summary-report', 'Group Summary Report');
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('group-summary-report', 'Group_Summary_Report');
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <EditableHeader 
              pageId="group_summary"
              defaultTitle="Group Summary"
              defaultSubtitle={`${groups.find(g => g.id === selectedGroup)?.name || ''} (${startDate} to ${endDate})`}
            />
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="flex items-center gap-2">
              <DateInput
                label="From"
                value={startDate}
                onChange={setStartDate}
                className="w-32"
              />
              <DateInput
                label="To"
                value={endDate}
                onChange={setEndDate}
                className="w-32"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase text-gray-700 bg-card border border-border transition-colors grow sm:grow-0 justify-center"
              >
                <Printer className="w-4 h-4" />
                {t('common.print')}
              </button>
              <button 
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase text-white bg-primary transition-colors grow sm:grow-0 justify-center"
              >
                <Download className="w-4 h-4" />
                {t('common.downloadPdf')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden sticky top-0">
                <div className="px-4 py-3 border-b border-border bg-foreground/5 font-bold uppercase tracking-widest text-[10px] text-foreground">
                  Select Group
                </div>
                <div className="max-h-[50vh] lg:max-h-[calc(100vh-250px)] overflow-y-auto divide-y divide-border/50 no-scrollbar">
                  {groups.sort((a,b) => a.name.localeCompare(b.name)).map(group => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedGroup(group.id)}
                      className={cn(
                        "w-full px-4 py-3 text-left text-[11px] uppercase tracking-wider transition-colors flex items-center justify-between hover:bg-foreground/5",
                        selectedGroup === group.id ? "bg-primary/5 text-primary font-bold" : "text-gray-500"
                      )}
                    >
                      {group.name}
                      {selectedGroup === group.id && <ChevronRight className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search ledgers..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border text-foreground text-xs outline-none focus:border-foreground transition-colors uppercase tracking-widest"
                  />
                </div>
              </div>

              <div id="group-summary-report" className="bg-white rounded-xl border border-border shadow-sm p-0 print:p-8 print:border-none print:shadow-none min-h-[400px]">
                <ReportPrintHeader title="Group Summary" subtitle={groups.find(g => g.id === selectedGroup)?.name} />
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse border-separate border-spacing-0">
                    <thead className="sticky top-0 z-10 bg-white">
                      <tr className="bg-foreground/5 border-b border-border">
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground border-b border-border">Ledger Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground text-right border-b border-border">Opening</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground text-right border-b border-border">Debit</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground text-right border-b border-border">Credit</th>
                        <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-foreground text-right border-b border-border">Closing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {loading ? (
                        <tr>
                          <td colSpan={3} className="px-6 py-12 text-center">
                            <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                          </td>
                        </tr>
                      ) : filteredLedgers.length > 0 ? filteredLedgers.map((l) => (
                        <tr 
                          key={l.id} 
                          className="hover:bg-foreground/5 transition-colors cursor-pointer"
                          onClick={() => navigate(`/reports/ledger?ledgerId=${l.id}`)}
                        >
                          <td className="px-6 py-4 text-[11px] text-foreground font-bold uppercase tracking-tight">
                            {l.name}
                          </td>
                          <td className="px-6 py-4 text-[11px] text-foreground font-mono text-right">
                            {l.openingBalance !== 0 ? formatCurrency(l.openingBalance) : '-'}
                          </td>
                          <td className="px-6 py-4 text-[11px] text-green-600 font-mono text-right">
                            {l.debit !== 0 ? formatCurrency(l.debit) : '-'}
                          </td>
                          <td className="px-6 py-4 text-[11px] text-red-600 font-mono text-right">
                            {l.credit !== 0 ? formatCurrency(l.credit) : '-'}
                          </td>
                          <td className="px-6 py-4 text-[11px] text-primary font-bold font-mono text-right">
                            {formatCurrency(l.closingBalance)}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-gray-500 uppercase text-[10px] tracking-widest">
                            No ledgers found in this group.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    {filteredLedgers.length > 0 && (
                      <tfoot className="sticky bottom-0 bg-white border-t-2 border-border/100">
                        <tr className="bg-foreground/5 font-bold">
                          <td className="px-6 py-4 text-right text-[10px] uppercase tracking-widest text-foreground">Grand Total</td>
                          <td className="px-6 py-4 text-right text-foreground font-mono">
                            {formatCurrency(filteredLedgers.reduce((sum, l) => sum + (l.openingBalance || 0), 0))}
                          </td>
                          <td className="px-6 py-4 text-right text-green-600 font-mono">{formatCurrency(totalDebit)}</td>
                          <td className="px-6 py-4 text-right text-red-600 font-mono">{formatCurrency(totalCredit)}</td>
                          <td className="px-6 py-4 text-right text-primary font-mono">
                            {formatCurrency(filteredLedgers.reduce((sum, l) => sum + (l.closingBalance || 0), 0))}
                          </td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>

                <ReportPrintFooter />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
