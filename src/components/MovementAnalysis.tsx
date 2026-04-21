import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, TrendingUp, TrendingDown, Package, Search, Filter } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function MovementAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1).toLocaleDateString('en-CA'),
    to: new Date().toLocaleDateString('en-CA')
  });

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [stockItems, catsRes, allInvEntries, unitsRes] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getCollection('stock_categories', user.companyId),
          erpService.getCollection('inventory_entries', user.companyId),
          erpService.getCollection('units', user.companyId)
        ]);

        setCategories(catsRes);

        const parseLocal = (dateStr: string) => {
          const [y, m, d] = dateStr.split('-').map(Number);
          return new Date(y, m - 1, d);
        };

        const startDate = parseLocal(dateRange.from);
        const endDate = parseLocal(dateRange.to);
        endDate.setHours(23, 59, 59, 999);

        // Group entries by item for faster lookup
        const entriesByItem: Record<string, any[]> = {};
        allInvEntries.forEach(e => {
          const id = String(e.item_id);
          if (!entriesByItem[id]) entriesByItem[id] = [];
          entriesByItem[id].push(e);
        });

        const analysis = stockItems.map(item => {
          const allItemEntries = entriesByItem[String(item.id)] || [];
          
          const itemEntriesWithDates = allItemEntries.map(e => {
            let dateObj: Date;
            if (e.date && typeof e.date === 'string' && e.date.includes('-')) {
              const [y, m, d] = e.date.split('-').map(Number);
              dateObj = new Date(y, m - 1, d);
            } else {
              dateObj = new Date(e.date || e.created_at?.toDate?.() || 0);
            }
            return { ...e, dateObj };
          });

          // Opening Balance (before dateRange.from)
          const openingEntries = itemEntriesWithDates.filter(e => e.dateObj < startDate);
          
          // Current Period Entries
          const currentPeriodEntries = itemEntriesWithDates.filter(e => e.dateObj >= startDate && e.dateObj <= endDate);

          // Include master opening_qty in the total openingQty
          const masterOpeningQty = Number(item.opening_qty) || 0;
          const historyOpeningQty = openingEntries.reduce((sum, e) => sum + (e.movement_type === 'Inward' ? (Number(e.qty) + (Number(e.free_qty) || 0)) : -(Number(e.qty) + (Number(e.free_qty) || 0))), 0);
          const openingQty = masterOpeningQty + historyOpeningQty;

          const inward = currentPeriodEntries.filter((e: any) => (e.movement_type || '').toLowerCase() === 'inward');
          const outward = currentPeriodEntries.filter((e: any) => (e.movement_type || '').toLowerCase() === 'outward');

          const inwardQty = inward.reduce((sum, e) => sum + (Number(e.qty) || 0) + (Number(e.free_qty) || 0), 0);
          const outwardQty = outward.reduce((sum, e) => sum + (Number(e.qty) || 0) + (Number(e.free_qty) || 0), 0);
          const inwardValue = inward.reduce((sum, e) => sum + ((Number(e.qty) || 0) * (Number(e.rate) || 0)), 0);
          const outwardValue = outward.reduce((sum, e) => sum + ((Number(e.qty) || 0) * (Number(e.rate) || 0)), 0);

          return {
            ...item,
            unitName: unitsRes.find(u => u.id === item.unit_id)?.name || (item as any).unit || 'pcs',
            openingQty,
            inwardQty,
            outwardQty,
            inwardValue,
            outwardValue,
            closingQty: openingQty + inwardQty - outwardQty,
            effectiveRateIn: inwardQty > 0 ? inwardValue / inwardQty : 0,
            effectiveRateOut: outwardQty > 0 ? outwardValue / outwardQty : 0
          };
        });

        setItems(analysis);
      } catch (err) {
        console.error('Error fetching movement analysis:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.companyId, dateRange]);

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.part_no || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const hasData = item.inwardQty !== 0 || item.outwardQty !== 0 || item.openingQty !== 0;
    
    // If searching, show match even if no data. Otherwise only show items with values.
    return matchesCategory && (searchTerm ? matchesSearch : (matchesSearch && hasData));
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 >= filteredItems.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 < 0 ? filteredItems.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredItems.length) {
        navigate('/reports/stock-item', { state: { itemId: filteredItems[activeIndex].id } });
      }
    }
  };

  if (loading) {
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
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Movement Analysis</h1>
            <p className="text-gray-500">Summary of item inflows and outflows</p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2">
           <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>
          <span className="text-gray-400">to</span>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="date"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4 items-end">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setActiveIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full text-sm appearance-none"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <th rowSpan={2} className="px-6 py-4 border-r border-gray-200">Item Name</th>
                <th rowSpan={2} className="px-6 py-4 border-r border-gray-200 bg-gray-50">Opening Qty</th>
                <th colSpan={3} className="px-6 py-2 text-center border-b border-gray-200 bg-green-50 text-green-700">Inward (Purchase/Return)</th>
                <th colSpan={3} className="px-6 py-2 text-center border-b border-gray-200 bg-red-50 text-red-700">Outward (Sales/Return)</th>
                <th rowSpan={2} className="px-6 py-4 border-l border-gray-200 bg-blue-50 text-blue-700">Closing Qty</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3 text-right">Avg Rate</th>
                <th className="px-6 py-3 text-right border-r border-gray-200">Value</th>
                <th className="px-6 py-3 text-right">Quantity</th>
                <th className="px-6 py-3 text-right">Avg Rate</th>
                <th className="px-6 py-3 text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                <tr key={idx} className={cn(
                  "hover:bg-gray-50 transition-colors capitalize",
                  activeIndex === idx && "bg-primary/5"
                )}>
                  <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-100">{item.name}</td>
                  <td className="px-6 py-4 text-right border-r border-gray-100 font-bold text-gray-500">
                    {item.openingQty} {item.unitName}
                  </td>
                  <td className="px-6 py-4 text-right text-green-600 font-medium">
                    {item.inwardQty} {item.unitName}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {formatCurrency(item.effectiveRateIn)}
                  </td>
                  <td className="px-6 py-4 text-right text-green-700 font-bold border-r border-gray-100">
                    {formatCurrency(item.inwardValue)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-600 font-medium">
                    {item.outwardQty} {item.unitName}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {formatCurrency(item.effectiveRateOut)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-700 font-bold border-r border-gray-100">
                    {formatCurrency(item.outwardValue)}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-700 font-bold border-l border-gray-100 bg-blue-50">
                    {item.closingQty} {item.unitName}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-gray-500 italic">
                    No movements found in the selected date range
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-100 font-bold border-t border-gray-200">
              <tr>
                <td className="px-6 py-4 border-r border-gray-200 uppercase tracking-wider text-[10px]">Grand Total</td>
                <td className="px-6 py-4 border-r border-gray-200"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-right text-green-700 border-r border-gray-200">
                  {formatCurrency(filteredItems.reduce((sum, i) => sum + i.inwardValue, 0))}
                </td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4"></td>
                <td className="px-6 py-4 text-right text-red-700 border-r border-gray-200">
                  {formatCurrency(filteredItems.reduce((sum, i) => sum + i.outwardValue, 0))}
                </td>
                <td className="px-6 py-4 text-right text-blue-700 bg-blue-50/50"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
