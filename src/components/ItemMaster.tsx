import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Package, Search, Edit2, Plus, Loader2, Filter, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn, formatNumber } from '../lib/utils';

export function ItemMaster() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'master' | 'pricelist'>('master');
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculateAll = async () => {
    if (!user?.companyId) return;
    setRecalculating(true);
    try {
      await Promise.all(items.map(item => erpService.recalculateItemStats(item.id)));
      // Refresh items
      const [itemsData, unitsData] = await Promise.all([
        erpService.getItems(user.companyId),
        erpService.getUnits(user.companyId)
      ]);
      
      const itemsWithUnits = itemsData.map(item => ({
        ...item,
        units: unitsData.find(u => u.id === item.unit_id) || unitsData.find(u => u.name.toLowerCase() === item.unit_id?.toLowerCase())
      }));
      
      setItems(itemsWithUnits);
    } catch (err) {
      console.error('Error recalculating stats:', err);
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      try {
        const [itemsData, unitsData] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getUnits(user.companyId)
        ]);
        
        const itemsWithUnits = itemsData.map(item => ({
          ...item,
          units: unitsData.find(u => u.id === item.unit_id) || unitsData.find(u => u.name.toLowerCase() === item.unit_id?.toLowerCase())
        }));
        
        setItems(itemsWithUnits);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId]);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                           item.part_no?.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-2xl font-mono text-foreground uppercase tracking-tighter">{t('item.title')}</h1>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex gap-4">
              <button 
                onClick={() => setViewMode('master')}
                className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'master' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
              >
                {t('item.masterView')}
              </button>
              <button 
                onClick={() => setViewMode('pricelist')}
                className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'pricelist' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
              >
                {t('item.priceList')}
              </button>
            </div>
            <button 
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="px-4 py-2 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {recalculating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              {t('item.recalculateStats')}
            </button>
            <button 
              onClick={() => navigate('/inventory/items/new')}
              className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              {t('item.createNewItem')}
            </button>
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input 
              type="text"
              placeholder={t('item.searchPlaceholder')}
              value={search || ''}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border text-foreground pl-10 pr-4 py-2 text-[10px] outline-none focus:border-foreground transition-colors uppercase tracking-widest"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-background border border-border text-foreground pl-10 pr-4 py-2 text-[10px] outline-none focus:border-foreground transition-colors uppercase tracking-widest appearance-none"
            >
              {categories.map(cat => (
                <option key={String(cat)} value={String(cat)}>{String(cat).toUpperCase()}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end text-[10px] text-gray-600 uppercase tracking-widest pr-2">
            {t('item.totalItems')}: {filteredItems.length}
          </div>
        </div>
      </div>

      {/* Fixed spacer to prevent the "jump" when scrolling starts */}
      <div className="flex-none h-4 lg:h-6 bg-background z-20" />

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-4 lg:px-6 pb-4 lg:pb-6">
          <div className="bg-card border border-border">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-6 h-6 text-foreground animate-spin" />
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">{t('item.loadingInventory')}</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-border mx-auto mb-4" />
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">{t('item.noItemsFound')}</p>
            </div>
          ) : viewMode === 'master' ? (
            <>
              {/* Mobile View: Cards */}
              <div className="block md:hidden divide-y divide-border/50">
                {filteredItems.map(item => (
                  <div key={item.id} className="p-4 space-y-3 hover:bg-foreground/5 transition-colors cursor-pointer group" onClick={() => navigate(`/inventory/items/edit/${item.id}`)}>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground/5 border border-border">
                          <Package className="w-4 h-4 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-[11px] text-foreground font-bold uppercase tracking-wider">{item.name}</p>
                          <span className="text-[8px] text-gray-500 uppercase tracking-widest px-1.5 py-0.5 bg-foreground/5 border border-border">
                            {item.category}
                          </span>
                        </div>
                      </div>
                      <Edit2 className="w-3 h-3 text-gray-400" />
                    </div>
                    <div className="flex justify-between items-end">
                      <div className="space-y-1">
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest">{t('item.partNo')}: {item.part_no || '---'}</p>
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest">{t('item.openingQty')}: {formatNumber(item.opening_qty)} @ ৳ {formatNumber(item.opening_rate)}</p>
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest">{t('item.avgCost')}: ৳ {formatNumber(item.avg_cost)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest">{t('item.currentStock')}</p>
                        <p className={cn(
                          "text-sm font-bold font-mono",
                          item.current_stock > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {formatNumber(item.current_stock)} <span className="text-[10px] uppercase">{item.units?.name}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block">
                <table className="w-full text-left border-separate border-spacing-0 min-w-[800px] table-fixed">
                  <thead className="sticky top-0 z-30">
                    <tr className="shadow-sm">
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-border w-[25%]">{t('item.name')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-border w-[12%]">{t('item.category')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-border w-[12%]">{t('item.partNo')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-border w-[8%]">{t('item.unit')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border w-[10%]">{t('item.openingQty')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border w-[10%]">{t('item.openingRate')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border w-[12%]">{t('item.currentStock')}</th>
                      <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border w-[10%]">{t('item.avgCost')}</th>
                      <th className="bg-card px-6 py-4 text-right w-[5%] border-b border-border"></th>
                    </tr>
                  </thead>
                  <tbody className="">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="group hover:bg-foreground/5 transition-colors">
                        <td className="px-6 py-4 border-b border-border/50">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-foreground/5 border border-border group-hover:border-foreground/30 transition-colors">
                              <Package className="w-4 h-4 text-gray-400 group-hover:text-foreground" />
                            </div>
                            <div>
                              <p className="text-[11px] text-foreground font-bold uppercase tracking-wider">{item.name}</p>
                              {item.barcode && <p className="text-[8px] text-gray-600 mt-0.5">SKU: {item.barcode}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[9px] text-gray-500 uppercase tracking-widest px-2 py-1 bg-foreground/5 border border-border">
                            {item.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[10px] text-gray-500 font-mono">
                          {item.part_no || '---'}
                        </td>
                        <td className="px-6 py-4 text-[10px] text-gray-500 uppercase">
                          {item.units?.name}
                        </td>
                        <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-mono">
                          {formatNumber(item.opening_qty)}
                        </td>
                        <td className="px-6 py-4 text-right text-[10px] text-gray-500 font-mono">
                          ৳ {formatNumber(item.opening_rate)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <p className={cn(
                            "text-[11px] font-bold font-mono",
                            item.current_stock > 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {formatNumber(item.current_stock)}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right text-[11px] text-gray-400 font-mono">
                          ৳ {formatNumber(item.avg_cost)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => navigate(`/inventory/items/edit/${item.id}`)}
                            className="p-2 bg-card border border-border text-gray-600 hover:text-foreground hover:border-foreground transition-all opacity-0 group-hover:opacity-100"
                            title="Edit Item"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="hidden md:block">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
                <thead className="sticky top-0 z-30">
                  <tr className="shadow-sm">
                    <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-border">{t('item.name')}</th>
                    <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold border-b border-border">{t('item.category')}</th>
                    <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border">{t('item.standardPrice')}</th>
                    <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border">{t('item.wholesalePrice')}</th>
                    <th className="bg-card px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right border-b border-border">{t('item.retailPrice')}</th>
                    <th className="bg-card px-6 py-4 text-right w-20 border-b border-border"></th>
                  </tr>
                </thead>
                <tbody className="">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="group hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4 border-b border-border/50">
                        <p className="text-[11px] text-foreground font-bold uppercase tracking-wider">{item.name}</p>
                        <p className="text-[8px] text-gray-600 mt-0.5">SKU: {item.barcode || '---'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest px-2 py-1 bg-foreground/5 border border-border">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-mono">
                        ৳ {formatNumber(item.standard_price)}
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-mono text-blue-500">
                        ৳ {formatNumber(item.standard_price * 0.9)}
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-mono text-emerald-500">
                        ৳ {formatNumber(item.standard_price * 1.1)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-500 text-[10px] uppercase font-bold hover:underline">{t('common.update')}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
);
}
