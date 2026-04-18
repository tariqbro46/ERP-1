import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, ArrowLeft, Loader2, ChevronRight } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency } from '../lib/utils';
import { cn } from '../lib/utils';
import { EditableHeader } from './EditableHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';

export function GroupVoucher() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  useEffect(() => {
    async function fetchGroups() {
      if (!user?.companyId) return;
      try {
        const [gData, lData] = await Promise.all([
          erpService.getLedgerGroups(user.companyId),
          erpService.getLedgers(user.companyId)
        ]);
        setGroups(gData);
        setLedgers(lData);
        if (gData.length > 0 && !selectedGroup) {
          setSelectedGroup(gData[0].id);
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
    async function fetchVouchers() {
      if (!user?.companyId || !selectedGroup) return;
      setLoading(true);
      try {
        const data = await erpService.getVouchersByGroup(user.companyId, selectedGroup, dateRange.from, dateRange.to);
        setVouchers(data);
      } catch (err) {
        console.error('Error fetching group vouchers:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVouchers();
  }, [user?.companyId, selectedGroup, dateRange]);

  const getCounterpartyName = (v: any) => {
    if (!v.entries || v.entries.length === 0) return v.party_ledger_name || 'Multiple Ledgers';

    // In a group voucher report, the "counterparty" is usually the entries that do NOT belong to the selected group or its sub-groups.
    const getChildGroupIds = (parentId: string): string[] => {
      let ids = [parentId];
      const children = groups.filter(g => g.parent_id === parentId);
      children.forEach(child => {
        ids = [...ids, ...getChildGroupIds(child.id)];
      });
      return ids;
    };
    const targetGroupIds = getChildGroupIds(selectedGroup);
    const groupLedgerIds = ledgers.filter(l => targetGroupIds.includes(l.group_id)).map(l => l.id);
    
    // For a group report, users often want to see which specific ledger in that group was used.
    const inGroupEntries = v.entries.filter((e: any) => groupLedgerIds.includes(e.ledger_id));
    if (inGroupEntries.length === 1) {
      return ledgers.find(l => l.id === inGroupEntries[0].ledger_id)?.name || 'N/A';
    } else if (inGroupEntries.length > 1) {
      const names = inGroupEntries.map((e: any) => ledgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'Multiple Ledgers';
    }

    // Fallback back to the other side if no entry is in the group (shouldn't happen with group vouchers)
    const otherEntries = v.entries.filter((e: any) => !groupLedgerIds.includes(e.ledger_id));
    if (otherEntries.length === 1) {
      return ledgers.find(l => l.id === otherEntries[0].ledger_id)?.name || 'N/A';
    } else if (otherEntries.length > 1) {
      const names = otherEntries.map((e: any) => ledgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean);
      return names.length > 0 ? names.join(', ') : 'Multiple Ledgers';
    }
    
    return v.party_ledger_name || 'N/A';
  };

  const filteredVouchers = vouchers.filter(v => 
    v.v_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.party_ledger_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCounterpartyName(v).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);

  const handlePrint = () => {
    printUtils.printElement('group-voucher-report', 'Group Voucher Report');
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('group-voucher-report', 'Group_Voucher_Report');
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
            pageId="group_voucher"
            defaultTitle="Group Voucher"
            defaultSubtitle="List of vouchers for all ledgers in a group"
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by voucher no or party name..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div id="group-voucher-report" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Date</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Voucher No</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Particulars</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900">Voucher Type</th>
                    <th className="px-6 py-4 text-sm font-semibold text-gray-900 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
                      </td>
                    </tr>
                  ) : filteredVouchers.length > 0 ? filteredVouchers.map((v) => (
                    <tr 
                      key={v.id} 
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/vouchers/view/${v.id}`)}
                    >
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(v.v_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {v.v_no}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        {getCounterpartyName(v)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {v.v_type}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                        {formatCurrency(v.total_amount)}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        No vouchers found for this group in the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
                {filteredVouchers.length > 0 && (
                  <tfoot>
                    <tr className="bg-gray-50 font-bold">
                      <td colSpan={4} className="px-6 py-4 text-right text-gray-900">Total</td>
                      <td className="px-6 py-4 text-right text-primary">{formatCurrency(totalAmount)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
