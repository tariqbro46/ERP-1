import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Printer, Download, ArrowLeft, Loader2 } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { EditableHeader } from './EditableHeader';
import { useSettings } from '../contexts/SettingsContext';
import { ReportPrintHeader, ReportPrintFooter } from './ReportPrintHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';

interface RegisterReportProps {
  type: 'Contra' | 'Payment' | 'Receipt' | 'Sales' | 'Purchase' | 'Journal' | 'Stock Transfer' | 'Physical Stock';
  title: string;
}

export function RegisterReport({ type, title }: RegisterReportProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [vData, lData] = await Promise.all([
          erpService.getVouchersByType(user.companyId, type, dateRange.from, dateRange.to),
          erpService.getLedgers(user.companyId)
        ]);
        setVouchers(vData);
        setLedgers(lData);
      } catch (err) {
        console.error(`Error fetching ${type} register:`, err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId, type, dateRange]);

  const getCounterpartyName = (v: any) => {
    if (!v.entries || v.entries.length === 0) return v.party_ledger_name || 'Multiple Ledgers';

    const isBankCash = (l: any) => {
      const name = l.name?.toLowerCase() || '';
      const group = l.ledger_groups?.name?.toLowerCase() || l.group_name?.toLowerCase() || '';
      return name.includes('cash') || name.includes('bank') || 
             group.includes('cash') || group.includes('bank');
    };

    if (['Receipt', 'Payment', 'Contra'].includes(v.v_type)) {
      const otherEntries = v.entries.filter((e: any) => {
        const ledger = ledgers.find(l => l.id === e.ledger_id);
        return ledger && !isBankCash(ledger);
      });

      if (otherEntries.length === 1) {
        return ledgers.find(l => l.id === otherEntries[0].ledger_id)?.name || 'N/A';
      } else if (otherEntries.length > 1) {
        const names = otherEntries.map((e: any) => ledgers.find(l => l.id === e.ledger_id)?.name).filter(Boolean);
        return names.length > 0 ? names.join(', ') : 'Multiple Ledgers';
      }
    }

    if (['Sales', 'Purchase'].includes(v.v_type)) {
      const isSalesPurchaseAccount = (l: any) => {
        const name = l.name?.toLowerCase() || '';
        const group = l.ledger_groups?.name?.toLowerCase() || l.group_name?.toLowerCase() || '';
        return group.includes('sales account') || group.includes('purchase account') ||
               name === 'sales' || name === 'purchase' || name === 'sales account' || name === 'purchase account';
      };

      const otherEntries = v.entries.filter((e: any) => {
        const ledger = ledgers.find(l => l.id === e.ledger_id);
        return ledger && !isSalesPurchaseAccount(ledger);
      });
      if (otherEntries.length > 0) {
        return ledgers.find(l => l.id === otherEntries[0].ledger_id)?.name || 'N/A';
      }
    }

    if (v.v_type === 'Journal') {
      const drEntries = v.entries.filter((e: any) => e.type === 'Dr');
      if (drEntries.length > 0) {
        return ledgers.find(l => l.id === drEntries[0].ledger_id)?.name || 'N/A';
      }
    }

    return v.party_ledger_name || 'N/A';
  };

  const filteredVouchers = vouchers.filter(v => 
    v.v_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.party_ledger_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCounterpartyName(v).toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.narration || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredVouchers.reduce((sum, v) => sum + (v.total_amount || 0), 0);

  const handlePrint = () => {
    printUtils.printElement('register-report', `${title} Report`);
  };

  const handleDownload = () => {
    exportUtils.exportToPDF('register-report', `${type}_Register_Report`);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <EditableHeader 
            pageId={`register_${type.toLowerCase()}`}
            defaultTitle={title}
            defaultSubtitle={`List of all ${type} vouchers`}
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

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by voucher no, party name or narration..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <DateInput
              value={dateRange.from}
              onChange={val => setDateRange({ ...dateRange, from: val })}
              className="w-32"
            />
            <span className="text-gray-500 font-bold uppercase text-[9px] px-1 italic">to</span>
            <DateInput
              value={dateRange.to}
              onChange={val => setDateRange({ ...dateRange, to: val })}
              className="w-32"
            />
          </div>
        </div>
      </div>

      <div id="register-report" className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm p-0 print:p-8 print:border-none print:shadow-none">
        <ReportPrintHeader title={title} subtitle={`From ${formatReportDate(dateRange.from, settings.dateFormat)} to ${formatReportDate(dateRange.to, settings.dateFormat)}`} />
        
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
                    {formatReportDate(v.v_date, settings.dateFormat)}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {v.v_no}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="font-medium text-gray-900">{getCounterpartyName(v)}</div>
                    {v.narration && <div className="text-xs text-gray-400 mt-1 italic line-clamp-1">{v.narration}</div>}
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
                    No vouchers found for the selected period.
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

        <ReportPrintFooter />
      </div>
    </div>
  );
}
