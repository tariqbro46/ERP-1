import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Filter, 
  LayoutGrid, 
  List as ListIcon, 
  ChevronRight,
  Printer,
  ShoppingCart,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { EditableHeader } from './EditableHeader';
import { formatCurrency, formatNumber, formatQuantity, cn } from '../lib/utils';
import { printUtils } from '../utils/printUtils';

export function InventoryOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showLowStockOnly, setShowLowStockOnly] = useState(() => searchParams.get('filter') === 'lowStock');

  useEffect(() => {
    fetchInventory();
  }, [user?.companyId]);

  useEffect(() => {
    if (searchParams.get('filter') === 'lowStock') {
      setShowLowStockOnly(true);
    }
  }, [searchParams]);

  async function fetchInventory() {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getItems(user.companyId);
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  // Threshold calculation utility
  const getItemThreshold = (item: any): number => {
    return Number(item.low_stock_threshold ?? item.reorder_level ?? 0);
  };

  const isItemLowStock = (item: any): boolean => {
    const threshold = getItemThreshold(item);
    const stock = Number(item.current_stock || 0);
    return threshold > 0 ? stock <= threshold : stock <= 0;
  };

  const lowStockItems = useMemo(() => {
    return items.filter(isItemLowStock);
  }, [items]);

  const outOfStockItems = useMemo(() => {
    return items.filter(item => Number(item.current_stock || 0) <= 0);
  }, [items]);

  const totalStockValue = useMemo(() => {
    return items.reduce((sum, item) => sum + ((Number(item.current_stock) || 0) * (Number(item.avg_cost) || 0)), 0);
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.part_no || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch) return false;
      if (showLowStockOnly) return isItemLowStock(item);
      return true;
    });
  }, [items, searchTerm, showLowStockOnly]);

  const handleToggleLowStock = () => {
    const nextVal = !showLowStockOnly;
    setShowLowStockOnly(nextVal);
    if (nextVal) {
      setSearchParams({ filter: 'lowStock' });
    } else {
      setSearchParams({});
    }
  };

  const handlePrintReorderList = () => {
    printUtils.printElement('inventory-reorder-report', 'Low Stock & Reorder Requisition Report', settings);
  };

  if (loading) {
    return <SkeletonLoader type="cards" />;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background font-mono transition-colors">
      {/* Permanent Fixed Header Area */}
      <div className="flex-none p-4 lg:p-6 pb-3 space-y-4 border-b border-border bg-background z-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <EditableHeader 
            pageId="inventory_overview"
            defaultTitle="Inventory Overview" 
            defaultSubtitle="Real-time stock levels, reorder limits, and low-stock alerts"
          />
          <div className="flex items-center gap-2 shrink-0">
            {lowStockItems.length > 0 && (
              <button 
                onClick={handlePrintReorderList}
                className="px-3 py-2 border border-rose-500/30 text-rose-600 bg-rose-500/10 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500/20 transition-all flex items-center gap-1.5"
                title="Print low stock requisition list"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Reorder List</span>
              </button>
            )}
            <button 
              onClick={() => navigate('/inventory/items/new')}
              className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-card border border-border p-4 space-y-1 rounded-sm shadow-xs">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Stock Value</p>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">{formatCurrency(totalStockValue)}</h2>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500">
              <TrendingUp className="w-3 h-3" />
              <span>Across {items.length} items</span>
            </div>
          </div>

          {/* Interactive Low Stock Alert Card */}
          <div 
            onClick={handleToggleLowStock}
            className={cn(
              "p-4 space-y-1 rounded-sm border cursor-pointer transition-all relative overflow-hidden shadow-xs",
              showLowStockOnly 
                ? "bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/20" 
                : "bg-card border-border hover:border-rose-500/50 hover:bg-rose-500/5"
            )}
          >
            <div className="flex justify-between items-start">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Low Stock Alerts</p>
              {lowStockItems.length > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className={cn("text-xl lg:text-2xl font-bold", lowStockItems.length > 0 ? "text-rose-600" : "text-foreground")}>
                {lowStockItems.length}
              </h2>
              {outOfStockItems.length > 0 && (
                <span className="text-[10px] font-bold text-rose-600 uppercase bg-rose-500/10 px-1.5 py-0.5 rounded">
                  {outOfStockItems.length} Out of Stock
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-[10px] text-rose-500">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span className="truncate">{showLowStockOnly ? "Click to view all items" : "Click to filter low stock"}</span>
            </div>
          </div>

          <div className="bg-card border border-border p-4 space-y-1 rounded-sm shadow-xs">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Total Categories</p>
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">
              {new Set(items.map(i => i.category).filter(Boolean)).size}
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Package className="w-3 h-3" />
              <span>Organized item groups</span>
            </div>
          </div>
        </div>

        {/* Filters, Search & Mode Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-muted/40 p-3 border border-border rounded-sm">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text"
              placeholder="Search items, part number, category..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border pl-10 pr-4 py-2 text-xs outline-none focus:border-foreground transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Filter Toggle Buttons */}
            <div className="flex items-center border border-border rounded-xs overflow-hidden bg-background">
              <button
                type="button"
                onClick={() => { setShowLowStockOnly(false); setSearchParams({}); }}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
                  !showLowStockOnly ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted"
                )}
              >
                All Items ({items.length})
              </button>
              <button
                type="button"
                onClick={() => { setShowLowStockOnly(true); setSearchParams({ filter: 'lowStock' }); }}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5",
                  showLowStockOnly 
                    ? "bg-rose-600 text-white font-black" 
                    : lowStockItems.length > 0 
                      ? "text-rose-600 hover:bg-rose-500/10 font-bold" 
                      : "text-muted-foreground hover:bg-muted"
                )}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Low Stock ({lowStockItems.length})</span>
              </button>
            </div>

            {/* Grid / List toggle */}
            <div className="flex border border-border rounded-xs overflow-hidden bg-background">
              <button 
                onClick={() => setViewMode('grid')}
                className={cn("p-1.5", viewMode === 'grid' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={cn("p-1.5", viewMode === 'list' ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted')}
                title="Table view"
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Low Stock Active Warning Alert Banner */}
        {showLowStockOnly && (
          <div className="flex items-center justify-between gap-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-rose-700 dark:text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 animate-bounce" />
              <span className="text-xs font-bold">
                Low Stock Filter Active: Displaying {filteredItems.length} item(s) at or below their reorder threshold.
              </span>
            </div>
            <button
              onClick={() => { setShowLowStockOnly(false); setSearchParams({}); }}
              className="text-[10px] font-bold uppercase tracking-widest text-rose-600 underline hover:text-rose-700 shrink-0"
            >
              Reset to All
            </button>
          </div>
        )}
      </div>

      {/* Scrollable Data Section with Sticky Table Header */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6" id="inventory-reorder-report">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => {
              const threshold = getItemThreshold(item);
              const isLow = isItemLowStock(item);
              const isOutOfStock = Number(item.current_stock || 0) <= 0;
              const deficit = Math.max(0, threshold - Number(item.current_stock || 0));

              return (
                <div 
                  key={item.id}
                  className={cn(
                    "bg-card border p-4 space-y-3 transition-all rounded-sm relative flex flex-col justify-between group",
                    isOutOfStock 
                      ? "border-rose-500/60 bg-rose-500/[0.03] shadow-xs" 
                      : isLow 
                        ? "border-amber-500/60 bg-amber-500/[0.03] shadow-xs" 
                        : "border-border hover:border-foreground/30"
                  )}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="p-2.5 bg-foreground/5 rounded-md group-hover:bg-foreground/10 transition-colors shrink-0">
                        <Package className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isOutOfStock ? (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-rose-600 text-white flex items-center gap-1 shadow-xs">
                            <XCircle className="w-3 h-3" /> Out of Stock
                          </span>
                        ) : isLow ? (
                          <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500 text-slate-950 flex items-center gap-1 shadow-xs">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> In Stock
                          </span>
                        )}
                        {threshold > 0 && (
                          <span className="text-[9px] font-bold text-muted-foreground">
                            Min Alert: {formatQuantity(threshold, item.unit_name || item.unit)} {item.unit_name || item.unit || 'pcs'}
                          </span>
                        )}
                      </div>
                    </div>

                    <div onClick={() => navigate(`/inventory/items/edit/${item.id}`)} className="cursor-pointer">
                      <h3 className="font-bold text-sm text-foreground uppercase tracking-tight group-hover:text-primary transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                        {item.category || 'Uncategorized'} {item.part_no ? `• Part: ${item.part_no}` : ''}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border/60">
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Current Stock</p>
                        <p className={cn(
                          "text-sm font-bold",
                          isOutOfStock ? "text-rose-600 font-black" : isLow ? "text-amber-600 font-black" : "text-foreground"
                        )}>
                          {formatQuantity(item.current_stock || 0, item.unit_name || item.unit)} <span className="text-[10px] font-normal text-muted-foreground">{item.unit_name || item.unit || 'pcs'}</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Avg Cost</p>
                        <p className="text-sm font-bold text-foreground">{formatCurrency(item.avg_cost || 0)}</p>
                      </div>
                    </div>

                    {isLow && deficit > 0 && (
                      <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xs flex items-center justify-between text-[10px]">
                        <span className="text-rose-600 font-bold uppercase tracking-wider">Reorder Deficit:</span>
                        <span className="font-black text-rose-600">
                          {formatQuantity(deficit, item.unit_name || item.unit)} {item.unit_name || item.unit || 'pcs'}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/inventory/items/edit/${item.id}`)}
                      className="flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider border border-border hover:bg-muted transition-colors rounded-xs text-center"
                    >
                      Edit Details
                    </button>
                    {isLow && (
                      <button
                        onClick={() => navigate(`/vouchers/new?vType=Purchase&itemId=${item.id}`)}
                        className="py-1.5 px-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-opacity rounded-xs flex items-center gap-1"
                        title="Create Purchase Voucher for this item"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Order</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-xs border-b border-border shadow-xs">
                  <tr>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Item Name</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Category</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stock Status</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Current Stock</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Min Threshold</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Reorder Deficit</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Avg Cost</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Total Value</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredItems.map(item => {
                    const threshold = getItemThreshold(item);
                    const isLow = isItemLowStock(item);
                    const isOutOfStock = Number(item.current_stock || 0) <= 0;
                    const deficit = Math.max(0, threshold - Number(item.current_stock || 0));

                    return (
                      <tr 
                        key={item.id}
                        className={cn(
                          "hover:bg-muted/50 transition-colors group",
                          isOutOfStock ? "bg-rose-500/[0.04]" : isLow ? "bg-amber-500/[0.03]" : ""
                        )}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div>
                              <span 
                                onClick={() => navigate(`/inventory/items/edit/${item.id}`)}
                                className="text-xs font-bold text-foreground uppercase tracking-tight hover:underline cursor-pointer"
                              >
                                {item.name}
                              </span>
                              {item.part_no && (
                                <p className="text-[9px] text-muted-foreground">Part: {item.part_no}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.category || '-'}</span>
                        </td>
                        <td className="p-3">
                          {isOutOfStock ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-rose-600 text-white">
                              <XCircle className="w-3 h-3" /> Out of Stock
                            </span>
                          ) : isLow ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                              <CheckCircle2 className="w-3 h-3" /> In Stock
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex flex-col items-end">
                            <span className={cn(
                              "text-xs font-bold",
                              isOutOfStock ? "text-rose-600 font-black" : isLow ? "text-amber-600 font-black" : "text-foreground"
                            )}>
                              {formatQuantity(item.current_stock || 0, item.unit_name || item.unit)}
                            </span>
                            <span className="text-[9px] text-muted-foreground">{item.unit_name || item.unit || 'pcs'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <span className="text-xs font-mono text-muted-foreground">
                            {threshold > 0 ? formatQuantity(threshold, item.unit_name || item.unit) : '-'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          {deficit > 0 ? (
                            <span className="text-xs font-black text-rose-600 font-mono">
                              +{formatQuantity(deficit, item.unit_name || item.unit)}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right font-mono text-xs text-foreground">
                          {formatCurrency(item.avg_cost || 0)}
                        </td>
                        <td className="p-3 text-right font-mono text-xs font-bold text-foreground">
                          {formatCurrency((Number(item.current_stock) || 0) * (Number(item.avg_cost) || 0))}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {isLow && (
                              <button
                                onClick={() => navigate(`/vouchers/new?vType=Purchase&itemId=${item.id}`)}
                                className="p-1.5 bg-foreground text-background rounded hover:opacity-80 transition-opacity"
                                title="Create Purchase Voucher for this item"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => navigate(`/inventory/items/edit/${item.id}`)}
                              className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
                              title="Edit item"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="py-20 text-center border border-dashed border-border rounded-sm text-muted-foreground uppercase text-[10px] tracking-widest space-y-2">
            <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p>No items found matching the selected filter criteria.</p>
            {showLowStockOnly && (
              <button
                onClick={() => { setShowLowStockOnly(false); setSearchParams({}); }}
                className="mt-2 text-primary underline text-xs font-bold"
              >
                View all inventory items
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

