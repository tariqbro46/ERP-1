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
          
          let dateObj: Date;
          if (e.date && typeof e.date === 'string' && e.date.includes('-')) {
            const [y, m, d] = e.date.split('-').map(Number);
            dateObj = new Date(y, m - 1, d);
          } else {
            dateObj = new Date(e.date || e.created_at?.toDate?.() || 0);
          }
          
          entriesByItem[id].push({ ...e, dateObj });
        });

        const analysis = stockItems.map(item => {
          const itemEntriesWithDates = entriesByItem[String(item.id)] || [];
          
          // Opening Balance (before dateRange.from)
          const openingEntries = itemEntriesWithDates.filter(e => e.dateObj < startDate);
          
          // Current Period Entries
          const currentPeriodEntries = itemEntriesWithDates.filter(e => e.dateObj >= startDate && e.dateObj <= endDate);

          // Include master opening_qty and allocated opening godown qty if any
          const masterOpeningQty = Number(item.opening_qty) || 0;
          const historyOpeningQty = openingEntries.reduce((sum, e) => {
            const total = (Number(e.qty) || 0) + (Number(e.free_qty) || 0);
            return sum + ((e.movement_type || e.m_type || '').toLowerCase() === 'inward' ? total : -total);
          }, 0);
          const openingQty = masterOpeningQty + historyOpeningQty;

          const inward = currentPeriodEntries.filter((e: any) => (e.movement_type || e.m_type || '').toLowerCase() === 'inward');
          const outward = currentPeriodEntries.filter((e: any) => (e.movement_type || e.m_type || '').toLowerCase() === 'outward');

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

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-amber-200 text-amber-900 border-b border-amber-500 rounded-sm px-0.5">{part}</mark> 
            : part
        )}
      </>
    );
  };

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
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
            <span className="text-gray-400 font-bold uppercase text-[9px]">to</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end mb-2">
          <div className="relative max-w-md flex-1">
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
      </div>

      <div className="flex-1 overflow-hidden p-6 pt-0">
        <div className="bg-background rounded-xl border border-border shadow-sm h-full flex flex-col min-h-0">
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-background shadow-sm border-b border-border">
                <tr className="text-[10px] uppercase font-bold tracking-widest text-foreground/50 bg-background">
                  <th rowSpan={2} className="px-6 py-4 border-r border-border">Item Name</th>
                  <th rowSpan={2} className="px-6 py-4 border-r border-border bg-background/50">Opening Qty</th>
                  <th colSpan={3} className="px-6 py-2 text-center bg-emerald-500/5 text-emerald-600 border-b border-border">Inward (Purchase/Return)</th>
                  <th colSpan={3} className="px-6 py-2 text-center bg-rose-500/5 text-rose-600 border-b border-border">Outward (Sales/Return)</th>
                  <th rowSpan={2} className="px-6 py-4 border-l border-border bg-blue-500/5 text-blue-600">Closing Qty</th>
                </tr>
                <tr className="bg-background text-[10px] uppercase font-bold tracking-widest text-foreground/50">
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Avg Rate</th>
                  <th className="px-6 py-3 text-right border-r border-border">Value</th>
                  <th className="px-6 py-3 text-right">Quantity</th>
                  <th className="px-6 py-3 text-right">Avg Rate</th>
                  <th className="px-6 py-3 text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                  <tr key={idx} className={cn(
                    "hover:bg-gray-50 transition-colors capitalize cursor-pointer",
                    activeIndex === idx && "bg-primary/5"
                  )}
                  onClick={() => navigate('/reports/stock-item', { state: { itemId: item.id } })}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 border-r border-gray-100 italic">
                      {highlightText(item.name, searchTerm)}
                    </td>
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
            </table>
          </div>

          <div className="shrink-0 bg-background font-bold border-t border-border sticky bottom-0 z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.05)]">
            <table className="w-full text-left border-collapse">
              <tfoot>
                <tr className="text-[10px] uppercase font-bold tracking-widest text-foreground">
                  <td className="px-6 py-4 border-r border-border w-[20%] font-mono">Grand Total</td>
                  <td className="px-6 py-4 border-r border-border w-[10%]"></td>
                  <td className="px-6 py-4 w-[10%]"></td>
                  <td className="px-6 py-4 w-[10%]"></td>
                  <td className="px-6 py-4 text-right text-emerald-600 border-r border-border w-[10%]">
                    {formatCurrency(filteredItems.reduce((sum, i) => sum + i.inwardValue, 0))}
                  </td>
                  <td className="px-6 py-4 w-[10%]"></td>
                  <td className="px-6 py-4 w-[10%]"></td>
                  <td className="px-6 py-4 text-right text-rose-600 border-r border-border w-[10%] text-sm">
                    {formatCurrency(filteredItems.reduce((sum, i) => sum + i.outwardValue, 0))}
                  </td>
                  <td className="px-6 py-4 text-right text-blue-600 bg-blue-500/5 w-[10%] text-sm"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
