import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Search, Filter, History, Package } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function StockItemReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.part_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  const [monthlySummary, setMonthlySummary] = useState<any[]>([]);

  useEffect(() => {
    async function fetchItems() {
      if (!user?.companyId) return;
      try {
        const stockItems = await erpService.getItems(user.companyId);
        setItems(stockItems);
        if (stockItems.length > 0) {
          handleItemSelect(stockItems[0]);
        }
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [user?.companyId]);

  async function handleItemSelect(item: any) {
    setSelectedItem(item);
    setLoading(true);
    try {
      const allInvEntries = await erpService.getCollection('inventory_entries', user!.companyId);
      const itemEntries = allInvEntries.filter((e: any) => e.item_id === item.id);

      // Group by month
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const year = new Date().getFullYear();

      const summary = months.map((monthName, idx) => {
        const mEntries = itemEntries.filter((e: any) => {
          const dateStr = e.date || (e.created_at?.toDate ? e.created_at.toDate().toISOString() : '');
          if (!dateStr) return false;
          const date = new Date(dateStr);
          return date.getMonth() === idx && date.getFullYear() === year;
        });

        const inward = mEntries.filter((e: any) => e.movement_type === 'Inward');
        const outward = mEntries.filter((e: any) => e.movement_type === 'Outward');

        return {
          month: monthName,
          inwardQty: inward.reduce((sum, e) => sum + (e.qty + (e.free_qty || 0)), 0),
          inwardValue: inward.reduce((sum, e) => sum + (e.qty * e.rate), 0),
          outwardQty: outward.reduce((sum, e) => sum + (e.qty + (e.free_qty || 0)), 0),
          outwardValue: outward.reduce((sum, e) => sum + (e.qty * e.rate), 0)
        };
      });

      setMonthlySummary(summary);
    } catch (err) {
      console.error('Error calculating monthly summary:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !selectedItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('stockItem.title')}</h1>
          <p className="text-gray-500">{t('stockItem.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder={t('stockItem.filterPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 font-medium">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className={cn(
                    "w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors capitalize",
                    selectedItem?.id === item.id && "bg-primary/5 border-l-4 border-primary"
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedItem ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-bold text-gray-900 capitalize">{selectedItem.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {t('stockItem.currentStock')} <span className="font-bold text-primary">{selectedItem.current_stock} {selectedItem.unit}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      <th rowSpan={2} className="px-6 py-4 border-r border-gray-100">{t('stockItem.month')}</th>
                      <th colSpan={2} className="px-6 py-2 text-center border-b border-gray-100 bg-green-50 text-green-700">{t('stockItem.inward')}</th>
                      <th colSpan={2} className="px-6 py-2 text-center border-b border-gray-100 bg-red-50 text-red-700">{t('stockItem.outward')}</th>
                      <th rowSpan={2} className="px-6 py-4 text-right">{t('stockItem.netQty')}</th>
                    </tr>
                    <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                      <th className="px-6 py-3 text-right">{t('stockItem.qty')}</th>
                      <th className="px-6 py-3 text-right border-r border-gray-100">{t('stockItem.val')}</th>
                      <th className="px-6 py-3 text-right">{t('stockItem.qty')}</th>
                      <th className="px-6 py-3 text-right">{t('stockItem.val')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlySummary.map((m, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-3 font-medium text-gray-900 border-r border-gray-100">{m.month}</td>
                        <td className="px-6 py-3 text-right text-green-600">
                          {m.inwardQty > 0 ? `${m.inwardQty} ${selectedItem.unit}` : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-green-700 border-r border-gray-100">
                          {m.inwardValue > 0 ? formatCurrency(m.inwardValue) : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-red-600">
                          {m.outwardQty > 0 ? `${m.outwardQty} ${selectedItem.unit}` : '-'}
                        </td>
                        <td className="px-6 py-3 text-right text-red-700">
                          {m.outwardValue > 0 ? formatCurrency(m.outwardValue) : '-'}
                        </td>
                        <td className={cn(
                          "px-6 py-3 text-right font-bold",
                          (m.inwardQty - m.outwardQty) >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                          {m.inwardQty - m.outwardQty !== 0 ? `${m.inwardQty - m.outwardQty} ${selectedItem.unit}` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                    <tr>
                      <td className="px-6 py-4 border-r border-gray-100 uppercase text-[10px]">{t('common.total')}</td>
                      <td className="px-6 py-4 text-right">
                        {monthlySummary.reduce((sum, m) => sum + m.inwardQty, 0)} {selectedItem.unit}
                      </td>
                      <td className="px-6 py-4 text-right border-r border-gray-100">
                        {formatCurrency(monthlySummary.reduce((sum, m) => sum + m.inwardValue, 0))}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {monthlySummary.reduce((sum, m) => sum + m.outwardQty, 0)} {selectedItem.unit}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {formatCurrency(monthlySummary.reduce((sum, m) => sum + m.outwardValue, 0))}
                      </td>
                      <td className="px-6 py-4 text-right text-primary">
                      {monthlySummary.reduce((sum, m) => sum + (m.inwardQty - m.outwardQty), 0)} {selectedItem.unit}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ) : (
             <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 italic">
              {t('stockItem.selectPrompt')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
