import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertCircle, 
  ArrowLeft, 
  Search, 
  Download, 
  Printer,
  Package,
  UserPlus
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';

interface NegativeReportsProps {
  type: 'ledger' | 'stock';
}

export const NegativeReports: React.FC<NegativeReportsProps> = ({ type }) => {
  const { t } = useLanguage();
  const { company } = useAuth();
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
        const ledgers = await erpService.getLedgers(company.id);
        const groups = await erpService.getLedgerGroups(company.id);
        
        const negativeLedgers = ledgers.filter(ledger => {
          const group = groups.find(g => g.id === ledger.group_id);
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

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Download className="w-4 h-4" /> Export
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
              <Printer className="w-4 h-4" /> Print
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
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500">
                    {type === 'ledger' ? t('ledger.name') : t('item.name')}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500">
                    {type === 'ledger' ? t('ledger.group') : t('item.category')}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500 text-right">
                    {type === 'ledger' ? t('common.amount') : t('common.quantity')}
                  </th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-gray-500 text-center">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <span>{t('common.loading')}</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-900">{item.name}</div>
                        {item.alias && <div className="text-xs text-gray-500">{item.alias}</div>}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {type === 'ledger' ? item.ledger_groups?.name : item.category}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-red-600">
                          {type === 'ledger' 
                            ? formatCurrency(Math.abs(item.current_balance || 0)) + (item.current_balance < 0 ? ' Cr' : ' Dr')
                            : (item.current_stock || 0).toFixed(2) + ' ' + (item.unit || '')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
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
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
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
