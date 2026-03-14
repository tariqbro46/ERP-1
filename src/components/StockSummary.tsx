import React, { useState, useEffect } from 'react';
import { Package, Search, Printer, Download, ChevronDown, ChevronRight, Loader2, Filter, MapPin, Activity } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { erpService } from '../services/erpService';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import { QuickItemModal } from './QuickItemModal';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

export function StockSummary() {
  const settings = useSettings();
  const { showNotification } = useNotification();
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [selectedGodown, setSelectedGodown] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [itemsRes, godownsRes, invRes] = await Promise.all([
          supabase.from('items').select('*, units(name)'),
          erpService.getGodowns(),
          supabase.from('inventory_entries').select('*')
        ]);

        if (itemsRes.error) throw itemsRes.error;
        
        const allItems = itemsRes.data || [];
        const allInv = invRes.data || [];
        
        // Calculate stock per item per godown if needed
        // For now, we'll store the raw inventory entries to calculate on the fly
        setInventory(allInv);
        setItems(allItems);
        setGodowns(godownsRes || []);
        
        // Expand all groups by default
        const groups = new Set(allItems.map(i => i.category || 'General Items'));
        setExpandedGroups(groups);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const [inventory, setInventory] = useState<any[]>([]);

  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      for (const item of items) {
        await erpService.recalculateItemStats(item.id);
      }
      showNotification('All item statistics recalculated successfully');
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error recalculating:', err);
      showNotification('Failed to recalculate statistics', 'error');
    } finally {
      setRecalculating(false);
    }
  };

  const handleQuickItemSuccess = (newItem: any) => {
    setItems(prev => [...prev, newItem].sort((a, b) => a.name.localeCompare(b.name)));
    showNotification('Item created successfully');
  };

  const getStockForGodown = (itemId: string, godownId: string | null) => {
    if (!godownId) {
      const item = items.find(i => i.id === itemId);
      return item?.current_stock || 0;
    }
    
    return inventory
      .filter(inv => inv.item_id === itemId && inv.godown_id === godownId)
      .reduce((sum, inv) => {
        const qty = Number(inv.qty) || 0;
        return inv.movement_type === 'Inward' ? sum + qty : sum - qty;
      }, 0);
  };

  const processedItems = items.map(item => ({
    ...item,
    displayStock: getStockForGodown(item.id, selectedGodown),
    isLowStock: (getStockForGodown(item.id, null) <= (item.low_stock_threshold || 0)) && (item.low_stock_threshold > 0)
  })).filter(item => {
    if (selectedGodown && item.displayStock === 0) return false;
    if (showLowStockOnly && !item.isLowStock) return false;
    return true;
  });

  const groupedItems: Record<string, any[]> = {};
  processedItems.forEach(item => {
    const group = item.category || 'General Items';
    if (!groupedItems[group]) groupedItems[group] = [];
    groupedItems[group].push(item);
  });

  const filteredGroups = Object.keys(groupedItems).filter(group => 
    group.toLowerCase().includes(search.toLowerCase()) ||
    groupedItems[group].some(item => item.name.toLowerCase().includes(search.toLowerCase()))
  );

  const toggleGroup = (group: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(group)) newSet.delete(group);
    else newSet.add(group);
    setExpandedGroups(newSet);
  };

  const totalStockValue = processedItems.reduce((sum, item) => sum + (item.displayStock * (item.avg_cost || item.opening_rate || 0)), 0);

  const handleDownload = () => {
    const exportData = processedItems.map(item => ({
      particulars: item.name,
      category: item.category || 'General',
      quantity: item.displayStock,
      unit: item.units?.name,
      rate: item.avg_cost || item.opening_rate || 0,
      value: item.displayStock * (item.avg_cost || item.opening_rate || 0)
    }));

    exportToCSV('Stock_Summary', 'Stock Summary', exportData, ['Particulars', 'Category', 'Quantity', 'Unit', 'Rate', 'Value'], settings);
  };

  const handleDownloadPDF = () => {
    const exportData = processedItems.map(item => ({
      particulars: item.name,
      category: item.category || 'General',
      quantity: item.displayStock,
      unit: item.units?.name,
      rate: item.avg_cost || item.opening_rate || 0,
      value: item.displayStock * (item.avg_cost || item.opening_rate || 0)
    }));

    exportToPDF('Stock_Summary', 'Stock Summary', exportData, ['Particulars', 'Category', 'Quantity', 'Unit', 'Rate', 'Value'], settings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background transition-colors">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const asOnDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl text-foreground uppercase tracking-tighter">Stock Summary</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Inventory Valuation • Dutch Bangla Bank (Sample) • as on {asOnDate}</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 w-full sm:w-auto">
            <div className="text-left sm:text-right sm:mr-6">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">Total Value</p>
              <p className="text-lg lg:text-xl text-foreground font-bold">৳ {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <button className="flex-1 sm:flex-none p-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex justify-center">
                <Printer className="w-4 h-4" />
              </button>
              <button 
                onClick={handleDownload}
                disabled={processedItems.length === 0}
                className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
                title="Download CSV"
              >
                <Download className="w-3 h-3" /> CSV
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={processedItems.length === 0}
                className="flex-1 sm:flex-none px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase"
                title="Download PDF"
              >
                <Download className="w-3 h-3" /> PDF
              </button>
              <button 
                onClick={() => setIsQuickItemOpen(true)}
                className="flex-1 sm:flex-none px-3 py-2 bg-amber-600/10 border border-amber-600/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase"
                title="Quick Create Item"
              >
                <Package className="w-3 h-3" /> New Item
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center bg-card border border-border px-4 py-2 gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search items or categories..."
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border text-foreground pl-10 pr-4 py-2 text-xs outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedGodown}
                onChange={(e) => setSelectedGodown(e.target.value)}
                className="bg-background border border-border text-foreground px-3 py-1.5 text-[10px] uppercase tracking-widest outline-none focus:border-foreground transition-colors"
              >
                <option value="">All Godowns</option>
                {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 ml-2">
              <input
                type="checkbox"
                id="lowStockOnly"
                checked={showLowStockOnly}
                onChange={e => setShowLowStockOnly(e.target.checked)}
                className="w-3.5 h-3.5 accent-foreground"
              />
              <label htmlFor="lowStockOnly" className="text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer">
                Low Stock Only
              </label>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <button 
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground disabled:opacity-50"
            >
              {recalculating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              Recalculate
            </button>
            <button className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground">
              <Filter className="w-3 h-3" /> F12: Configure
            </button>
          </div>
        </div>

        {/* Table/Cards */}
        <div className="bg-card border border-border overflow-hidden">
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50">
            {filteredGroups.map(groupName => {
              const groupItems = groupedItems[groupName];
              const groupQty = groupItems.reduce((sum, i) => sum + i.displayStock, 0);
              const groupValue = groupItems.reduce((sum, i) => sum + (i.displayStock * (i.avg_cost || i.opening_rate || 0)), 0);
              const isExpanded = expandedGroups.has(groupName) || search.length > 0;

              return (
                <div key={groupName} className="flex flex-col">
                  <div 
                    onClick={() => toggleGroup(groupName)}
                    className="p-4 bg-foreground/5 flex justify-between items-center cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                      <span className="text-xs font-bold text-foreground uppercase tracking-tight">{groupName}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase">Total Value</p>
                      <p className="text-xs font-bold text-foreground font-mono">৳ {groupValue.toLocaleString()}</p>
                    </div>
                  </div>
                  {isExpanded && groupItems.map(item => (
                    <div key={item.id} className="p-4 pl-8 border-t border-border/30 space-y-2">
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-foreground/80 italic">{item.name}</span>
                        <span className="text-xs font-bold text-foreground font-mono">{item.displayStock} {item.units?.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase">
                        <span>Avg Rate: ৳ {(item.avg_cost || item.opening_rate || 0).toLocaleString()}</span>
                        <span className="font-bold text-foreground/60">Value: ৳ {(item.displayStock * (item.avg_cost || item.opening_rate || 0)).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <div className="p-10 text-center text-gray-500 uppercase tracking-widest text-[10px]">No stock items matching search</div>
            )}
            {/* Grand Total Mobile */}
            <div className="p-4 bg-foreground/10 flex justify-between items-center font-bold">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Grand Total</span>
              <div className="text-right">
                <p className="text-sm text-foreground font-mono">৳ {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead>
                <tr className="border-b border-border text-gray-500 uppercase bg-foreground/5">
                  <th className="px-6 py-4 font-medium">Particulars</th>
                  <th className="px-6 py-4 font-medium text-right w-48">Quantity</th>
                  <th className="px-6 py-4 font-medium text-right w-48">Rate (Avg)</th>
                  <th className="px-6 py-4 font-medium text-right w-48">Value (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredGroups.map(groupName => {
                  const groupItems = groupedItems[groupName];
                  const groupQty = groupItems.reduce((sum, i) => sum + i.displayStock, 0);
                  const groupValue = groupItems.reduce((sum, i) => sum + (i.displayStock * (i.avg_cost || i.opening_rate || 0)), 0);
                  const isExpanded = expandedGroups.has(groupName) || search.length > 0;

                  return (
                    <React.Fragment key={groupName}>
                      <tr 
                        onClick={() => toggleGroup(groupName)}
                        className="hover:bg-foreground/5 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                            <span className="text-foreground font-bold uppercase tracking-tight">{groupName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-foreground font-mono font-bold">
                          {groupQty.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          -
                        </td>
                        <td className="px-6 py-4 text-right text-foreground font-mono font-bold">
                          {groupValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                      {isExpanded && groupItems.map(item => (
                        <tr key={item.id} className={cn("bg-foreground/[0.02] hover:bg-foreground/5 transition-colors", item.isLowStock && "bg-rose-500/5")}>
                          <td className="px-12 py-3 text-foreground/60 italic flex items-center gap-2">
                            {item.name}
                            {item.isLowStock && (
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold uppercase rounded flex items-center gap-1">
                                <AlertTriangle className="w-2 h-2" /> Low Stock
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3 text-right text-foreground/80 font-mono">
                            {item.displayStock} <span className="text-[9px] text-gray-600 uppercase">{item.units?.name}</span>
                          </td>
                          <td className="px-6 py-3 text-right text-foreground/80 font-mono">
                            {(item.avg_cost || item.opening_rate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3 text-right text-foreground/80 font-mono">
                            {(item.displayStock * (item.avg_cost || item.opening_rate || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 uppercase tracking-widest">No stock items matching search</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-foreground/5 border-t border-border">
                <tr className="font-bold text-foreground">
                  <td className="px-6 py-4 uppercase text-[10px] text-gray-500 tracking-widest">Grand Total</td>
                  <td className="px-6 py-4 text-right font-mono border-l border-border">
                    {processedItems.reduce((sum, i) => sum + i.displayStock, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono border-l border-border">
                    -
                  </td>
                  <td className="px-6 py-4 text-right font-mono border-l border-border">
                    ৳ {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Stock Valuation Method Note */}
        <div className="flex justify-between items-center text-[9px] text-gray-500 uppercase tracking-[0.2em]">
          <span>Valuation Method: Weighted Average</span>
          <span>Press F1 for Help</span>
        </div>
      </div>

      <QuickItemModal
        isOpen={isQuickItemOpen}
        onClose={() => setIsQuickItemOpen(false)}
        onSuccess={handleQuickItemSuccess}
      />
    </div>
  );
}

