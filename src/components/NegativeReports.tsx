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
import { SkeletonLoader } from './SkeletonLoader';

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
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <div className="p-6 pb-4 shrink-0 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              title={t('common.back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                {type === 'ledger' ? t('nav.negativeLedger') : t('nav.negativeStock')}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {type === 'ledger' 
                  ? 'List of ledgers with abnormal balances' 
                  : 'List of items with negative physical stock'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-lg hover:bg-emerald-600 hover:text-white transition-colors text-xs font-semibold"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-3.5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-xs font-semibold shadow-xs"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-xs font-semibold"
            >
              <Printer className="w-4 h-4 text-muted-foreground" /> Print
            </button>
            <button
              onClick={handleEmailReport}
              className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-muted transition-colors text-xs font-semibold"
            >
              <Mail className="w-4 h-4 text-muted-foreground" /> Email
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6">
        <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-surface)] h-full flex flex-col min-h-0">
          <div className="p-4 border-b border-border bg-muted/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border text-foreground text-sm rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/15 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="tabular-nums">Found {filteredItems.length} exceptions</span>
            </div>
          </div>

          <div className="flex-1 overflow-auto">
            {loading ? (
              <div className="p-6">
                <SkeletonLoader type="table" pageKey="reports" isFullPage={false} />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-20 bg-muted/90 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="px-6 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground align-middle">
                      {type === 'ledger' ? t('ledger.name') : t('item.name')}
                    </th>
                    <th className="px-6 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground align-middle">
                      {type === 'ledger' ? t('ledger.group') : t('item.category')}
                    </th>
                    <th className="px-6 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground text-right align-middle">
                      {type === 'ledger' ? t('common.amount') : t('common.quantity')}
                    </th>
                    <th className="px-6 py-3.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground text-center align-middle">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <tr key={item.id} className="hover:bg-rose-500/5 transition-colors">
                        <td className="px-6 py-3.5 align-middle">
                          <div className="font-semibold text-sm text-foreground">{item.name}</div>
                          {item.alias && <div className="text-xs text-muted-foreground">{item.alias}</div>}
                        </td>
                        <td className="px-6 py-3.5 text-sm text-muted-foreground align-middle">
                          {getGroupOrCategory(item)}
                        </td>
                        <td className="px-6 py-3.5 text-right align-middle">
                          <span className="font-semibold text-sm text-rose-600 dark:text-rose-400 tabular-nums">
                            {getFormattedBalanceOrQty(item)}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-center align-middle">
                          <button 
                            onClick={() => navigate(type === 'ledger' ? `/reports/ledger?ledgerId=${item.id}` : `/reports/stock-item?id=${item.id}`)}
                            className="text-primary hover:underline text-xs font-semibold"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground align-middle">
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                            <AlertCircle className="w-6 h-6 text-emerald-500" />
                          </div>
                          <p className="font-semibold text-foreground">No Negative {type === 'ledger' ? 'Balances' : 'Stock'} Found</p>
                          <p className="text-xs text-muted-foreground">Everything looks good!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

