import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Search, Package, ShoppingCart, Tag, MapPin, TrendingUp, History } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function StockQuery() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [details, setDetails] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.part_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    async function fetchItems() {
      if (!user?.companyId) return;
      try {
        const [stockItems, unitsRes] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getCollection('units', user.companyId)
        ]);
        
        const mappedItems = stockItems.map(item => ({
          ...item,
          unitName: unitsRes.find(u => u.id === item.unit_id)?.name || (item as any).unit || 'pcs'
        }));

        setItems(mappedItems);
        setUnits(unitsRes);
        if (mappedItems.length > 0) {
          handleItemSelect(mappedItems[0]);
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
      const allInvEntries = await erpService.getInventoryEntriesByDate(user!.companyId, '2020-01-01', '2030-12-31');
      const itemEntries = allInvEntries
        .filter((e: any) => String(e.item_id) === String(item.id))
        .sort((a: any, b: any) => {
          const dateA = a.date || a.created_at?.toDate?.()?.toISOString() || '';
          const dateB = b.date || b.created_at?.toDate?.()?.toISOString() || '';
          return dateB.localeCompare(dateA);
        });

      const lastPurchase = itemEntries.find((e: any) => e.movement_type === 'Inward');
      const lastSales = itemEntries.find((e: any) => e.movement_type === 'Outward');

      // Group by godown
      const godowns = await erpService.getGodowns(user!.companyId);
      const stockByGodown = godowns.map((g: any) => {
        const gEntries = itemEntries.filter((e: any) => e.godown_id === g.id);
        const qty = gEntries.reduce((sum, e) => sum + (e.movement_type === 'Inward' ? (e.qty + (e.free_qty || 0)) : -(e.qty + (e.free_qty || 0))), 0);
        
        // Add opening godown allocation if any
        const openingAlloc = (item.opening_godowns || []).find((ag: any) => ag.godown_id === g.id);
        const totalQty = qty + (openingAlloc ? Number(openingAlloc.qty) : 0);
        
        return { name: g.name, qty: totalQty };
      }).filter(g => g.qty !== 0);

      setDetails({
        lastPurchase,
        lastSales,
        stockByGodown,
        recentHistory: itemEntries.slice(0, 10)
      });
    } catch (err) {
      console.error('Error fetching item details:', err);
    } finally {
      setLoading(false);
    }
  }

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
        handleItemSelect(filteredItems[activeIndex]);
      }
    }
  };

  if (loading && !selectedItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 pb-4 shrink-0">
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Query</h1>
            <p className="text-gray-500">Comprehensive view of a stock item</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-6 pt-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
          {/* Item List Sidebar */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full">
              <div className="p-4 border-b border-gray-200 bg-gray-50 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="text"
                    placeholder="Filter items..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setActiveIndex(-1);
                    }}
                    onKeyDown={handleKeyDown}
                    className="pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-full focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-border">
                {filteredItems.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => handleItemSelect(item)}
                    onMouseEnter={() => setActiveIndex(idx)}
                    className={cn(
                      "w-full px-4 py-3 text-left transition-colors flex flex-col",
                      (selectedItem?.id === item.id || activeIndex === idx) ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-gray-50"
                    )}
                  >
                    <span className="font-medium text-gray-900 truncate">{item.name}</span>
                    <span className="text-xs text-gray-500">Stock: {item.current_stock} {item.unitName}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Item Details */}
          <div className="lg:col-span-3 flex flex-col min-h-0 overflow-y-auto">
            <div className="space-y-6">
              {selectedItem && details ? (
                <>
                  {/* Header Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">In Hand</span>
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedItem.current_stock} <span className="text-sm font-normal text-gray-500">{selectedItem.unitName}</span>
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Average Cost</span>
                        <Tag className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(selectedItem.avg_cost || 0)}
                      </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-500">Stock Value</span>
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(selectedItem.current_stock * (selectedItem.avg_cost || 0))}
                      </div>
                    </div>
                  </div>

                  {/* Buying/Selling Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Last Purchase
                      </div>
                      <div className="p-6">
                        {details.lastPurchase ? (
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date</span>
                              <span className="font-medium">{details.lastPurchase.date || new Date(details.lastPurchase.created_at?.toDate?.() || 0).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Quantity</span>
                              <span className="font-medium">{details.lastPurchase.qty} {selectedItem.unitName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Rate</span>
                              <span className="font-medium">{formatCurrency(details.lastPurchase.rate)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between">
                              <span className="text-gray-500">Ledger</span>
                              <span className="font-medium text-primary">View Ledger</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">No purchase history</div>
                        )}
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-semibold text-gray-900 flex items-center gap-2">
                        <ShoppingCart className="w-4 h-4" />
                        Last Sales
                      </div>
                      <div className="p-6">
                        {details.lastSales ? (
                          <div className="space-y-4">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Date</span>
                              <span className="font-medium">{details.lastSales.date || new Date(details.lastSales.created_at?.toDate?.() || 0).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Quantity</span>
                              <span className="font-medium">{details.lastSales.qty} {selectedItem.unitName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Rate</span>
                              <span className="font-medium">{formatCurrency(details.lastSales.rate)}</span>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex justify-between">
                              <span className="text-gray-500">Customer</span>
                              <span className="font-medium text-primary">View Ledger</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500">No sales history</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Godown Wise Stock */}
                  <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border bg-background flex items-center gap-2 sticky top-0 z-10 shadow-sm">
                      <MapPin className="w-4 h-4" />
                      <span className="font-semibold text-foreground uppercase tracking-widest text-[10px]">Stock by Godown</span>
                    </div>
                    <div className="divide-y divide-border">
                      {details.stockByGodown.length > 0 ? details.stockByGodown.map((g: any, idx: number) => (
                        <div key={idx} className="px-6 py-3 flex justify-between items-center hover:bg-foreground/5 transition-colors">
                          <span className="text-foreground/70">{g.name}</span>
                          <span className="font-medium text-foreground">{g.qty} {selectedItem.unitName}</span>
                        </div>
                      )) : (
                        <div className="px-6 py-8 text-center text-gray-500">No godown stock allocation</div>
                      )}
                    </div>
                  </div>

                  {/* Recent History */}
                  <div className="bg-background rounded-xl border border-border overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-border bg-background flex items-center gap-2 sticky top-0 z-10 shadow-sm">
                      <History className="w-4 h-4" />
                      <span className="font-semibold text-foreground uppercase tracking-widest text-[10px]">Recent Movements</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-20 bg-background shadow-sm">
                          <tr className="bg-background border-b border-border text-[10px] uppercase font-bold tracking-widest text-foreground/50">
                            <th className="px-6 py-3">Date</th>
                            <th className="px-6 py-3">Type</th>
                            <th className="px-6 py-3 text-right">Inward</th>
                            <th className="px-6 py-3 text-right">Outward</th>
                            <th className="px-6 py-3 text-right">Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {details.recentHistory.map((h: any, idx: number) => (
                            <tr key={idx} className="hover:bg-foreground/5 transition-colors">
                              <td className="px-6 py-3 text-sm">{h.date || new Date(h.created_at?.toDate?.() || 0).toLocaleDateString()}</td>
                              <td className="px-6 py-3">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] uppercase font-bold",
                                  h.movement_type === 'Inward' ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"
                                )}>
                                  {h.movement_type}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-right">{h.movement_type === 'Inward' ? `${h.qty} ${selectedItem.unitName}` : '-'}</td>
                              <td className="px-6 py-3 text-right">{h.movement_type === 'Outward' ? `${h.qty} ${selectedItem.unitName}` : '-'}</td>
                              <td className="px-6 py-3 text-right">{formatCurrency(h.rate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-background rounded-xl border border-border p-12 text-center text-gray-500 italic shadow-inner">
                  Select an item to view its query report
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
