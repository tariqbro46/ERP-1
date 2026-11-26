import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  ArrowLeft, 
  Search, 
  Download, 
  Printer,
  FileSpreadsheet,
  Mail
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatQuantity } from '../lib/utils';
import { buildReportPrintHtml, executePrint } from '../utils/printUtils';
import { printToPDF } from '../utils/pdfExportService';
import { exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';

interface NegativeReportsProps {
  type: 'ledger' | 'stock';
}

export const NegativeReports: React.FC<NegativeReportsProps> = ({ type }) => {
  const { t } = useLanguage();
  const { company } = useAuth();
  const settings = useSettings();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (company) {
      fetchData();
    }
  }, [company, type]);

  const fetchData = async () => {
    if (!company) return;
    setLoading(true);
    try {
      if (type === 'ledger') {
        const [ledgers, groups] = await Promise.all([
          erpService.getLedgers(company.id),
          erpService.getLedgerGroups(company.id)
        ]);
        const groupMap = new Map<string, any>();
        groups.forEach(g => groupMap.set(g.id, g));

        const negativeLedgers = ledgers.filter(ledger => {
          const group = groupMap.get(ledger.group_id);
          const balance = ledger.current_balance || 0;

          if (!group) return false;

          // Assets and Expenses are normally Debit (+)
          // Liabilities and Incomes are normally Credit (-)
          if (group.nature === 'Asset' || group.nature === 'Expense') {
            return balance < 0; // Negative if Credit
          } else {
            return balance > 0; // Negative if Debit
          }
        });
        setItems(negativeLedgers);
      } else {
        const stockItems = await erpService.getItems(company.id);
        const negativeStock = stockItems.filter(item => (item.current_stock || 0) < 0);
        setItems(negativeStock);
      }
    } catch (error) {
      console.error('Error fetching negative reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    (item.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reportTitle = type === 'ledger' ? 'Negative Ledgers Report' : 'Negative Stock Report';
  const reportSubtitle = type === 'ledger'
    ? `Ledgers with abnormal balances (${filteredItems.length} exceptions)`
    : `Stock items with negative physical balance (${filteredItems.length} exceptions)`;

  const getGroupOrCategory = (item: any) =>
    type === 'ledger'
      ? (item.group_name || item.ledger_groups?.name || 'Uncategorized')
      : (item.category || 'Uncategorized');

  const getFormattedBalanceOrQty = (item: any) => {
    if (type === 'ledger') {
      const bal = item.current_balance || 0;
      return `${formatCurrency(Math.abs(bal))} ${bal < 0 ? 'Cr' : 'Dr'}`;
    }
    const unitLabel = item.unit || 'Pcs';
    return `${formatQuantity(item.current_stock || 0, unitLabel)} ${unitLabel}`;
  };

  const buildNegativePrintHtml = () => {
    return buildReportPrintHtml({
      title: reportTitle,
      subtitle: reportSubtitle,
      settings,
      company,
      summaryCards: [
        { label: 'Report Type', value: type === 'ledger' ? 'Negative Ledgers' : 'Negative Stock' },
        { label: 'Exceptions Found', value: String(filteredItems.length) }
      ],
      sections: [
        {
          columns: [
            { label: '#', align: 'center', width: '7%' },
            { label: type === 'ledger' ? 'Ledger Name' : 'Item Name', width: '43%' },
            { label: type === 'ledger' ? 'Group' : 'Category', width: '28%' },
            { label: type === 'ledger' ? 'Balance' : 'Stock Qty', align: 'right', width: '22%' }
          ],
          rows: filteredItems.map((item, idx) => ({
            cells: [
              String(idx + 1),
              item.name || '',
              getGroupOrCategory(item),
              getFormattedBalanceOrQty(item)
            ],
            tone: 'negative'
          })),
          emptyMessage: `No negative ${type === 'ledger' ? 'balances' : 'stock'} found`
        }
      ]
    });
  };

  const handlePrint = () => {
    executePrint(buildNegativePrintHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: reportTitle,
      subtitle: reportSubtitle,
      fileName: `${type === 'ledger' ? 'Negative_Ledgers' : 'Negative_Stock'}_${new Date().toISOString().split('T')[0]}`,
      htmlContent: buildNegativePrintHtml(),
      settings,
      company
    });
  };

  const handleDownloadExcel = () => {
    const headers = type === 'ledger'
      ? ['Ledger Name', 'Alias', 'Group', 'Abnormal Balance']
      : ['Item Name', 'Alias', 'Category', 'Quantity', 'Unit'];

    const rows = filteredItems.map(item =>
      type === 'ledger'
        ? {
            ledger_name: item.name || '',
            alias: item.alias || '',
            group: getGroupOrCategory(item),
            abnormal_balance: getFormattedBalanceOrQty(item)
          }
        : {
            item_name: item.name || '',
            alias: item.alias || '',
            category: getGroupOrCategory(item),
            quantity: Number(formatQuantity(item.current_stock || 0, item.unit || 'Pcs')),
            unit: item.unit || 'Pcs'
          }
    );

    exportStructuredExcel({
      fileName: `${type === 'ledger' ? 'Negative_Ledgers' : 'Negative_Stock'}_${new Date().toISOString().split('T')[0]}`,
      sheetName: type === 'ledger' ? 'Negative Ledgers' : 'Negative Stock',
      title: reportTitle,
      subtitle: reportSubtitle,
      headers,
      rows,
      settings,
      company
    });
  };

  const handleEmailReport = () => {
    shareReportViaEmail({
      title: reportTitle,
      subtitle: reportSubtitle,
      settings,
      company,
      summaryLines: [
        `Total Exceptions: ${filteredItems.length}`,
        ...filteredItems.slice(0, 10).map(item => `${item.name}: ${getFormattedBalanceOrQty(item)}`)
      ]
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {type === 'ledger' ? t('nav.negativeLedger') : t('nav.negativeStock')}
              </h1>
              <p className="text-gray-500">
                {type === 'ledger' 
                  ? 'List of ledgers with abnormal balances' 
                  : 'List of items with negative physical stock'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-sm font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleEmailReport}
              className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              <Mail className="w-4 h-4" /> Email
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 pt-0">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-full flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>Found {filteredItems.length} exceptions</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-background shadow-sm">
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500 align-middle">
                    {type === 'ledger' ? t('ledger.name') : t('item.name')}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500 align-middle">
                    {type === 'ledger' ? t('ledger.group') : t('item.category')}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500 text-right align-middle">
                    {type === 'ledger' ? t('common.amount') : t('common.quantity')}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500 text-center align-middle">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 align-middle">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>{t('common.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 align-middle">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        {item.alias && <div className="text-xs text-gray-500">{item.alias}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 align-middle">
                        {getGroupOrCategory(item)}
                      </td>
                      <td className="px-6 py-4 text-right align-middle">
                        <span className="font-mono font-bold text-red-600">
                          {getFormattedBalanceOrQty(item)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center align-middle">
                        <button 
                          onClick={() => navigate(type === 'ledger' ? `/reports/ledger?ledgerId=${item.id}` : `/reports/stock-item?id=${item.id}`)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 align-middle">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-2">
                          <AlertCircle className="w-6 h-6 text-green-500" />
                        </div>
                        <p className="font-medium text-gray-900">No Negative {type === 'ledger' ? 'Balances' : 'Stock'} Found</p>
                        <p className="text-sm">Everything looks good!</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

