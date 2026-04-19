import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { ReportPrintHeader, ReportPrintFooter } from './ReportPrintHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';

export function GroupSummary() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

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
        const data = await erpService.getLedgerBalancesByGroup(user.companyId, selectedGroup);
        setLedgers(data);
      } catch (err) {
        console.error('Error fetching ledgers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedgers();
  }, [user?.companyId, selectedGroup]);

  const filteredLedgers = ledgers.filter(l => 
    l.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalDebit = filteredLedgers.reduce((sum, l) => sum + (l.current_balance > 0 ? l.current_balance : 0), 0);
  const totalCredit = filteredLedgers.reduce((sum, l) => sum + (l.current_balance < 0 ? Math.abs(l.current_balance) : 0), 0);

  const handlePrint = () => {
    printUtils.printElement('group-summary-report', 'Group Summary Report');
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('group-summary-report', 'Group_Summary_Report');
  };

  if (loading && groups.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
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
            defaultSubtitle="Summary of ledger balances by group"
          />
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer className="w-4 h-4" />
            {t('common.print')}
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Download className="w-4 h-4" />
            {t('common.downloadPdf')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 font-semibold text-gray-900">
              Select Group
            </div>
            <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-100">
              {groups.map(group => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={cn(
                    "w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between hover:bg-gray-50",
                    selectedGroup === group.id ? "bg-primary/5 text-primary font-semibold" : "text-gray-600"
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
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search ledgers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div id="group-summary-report" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-0 print:p-8 print:border-none print:shadow-none">
            <ReportPrintHeader title="Group Summary" subtitle={groups.find(g => g.id === selectedGroup)?.name} />
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Ledger Name</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Debit</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : filteredLedgers.length > 0 ? filteredLedgers.map((l) => (
                    <tr 
                      key={l.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/reports/ledger?ledgerId=${l.id}`)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {l.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        {l.current_balance > 0 ? formatCurrency(l.current_balance) : ''}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 text-right">
                        {l.current_balance < 0 ? formatCurrency(Math.abs(l.current_balance)) : ''}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                        No ledgers found in this group.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredLedgers.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td className="px-6 py-4 text-right text-gray-900">Grand Total</td>
                      <td className="px-6 py-4 text-right text-primary">{formatCurrency(totalDebit)}</td>
                      <td className="px-6 py-4 text-right text-primary">{formatCurrency(totalCredit)}</td>
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
  );
}
