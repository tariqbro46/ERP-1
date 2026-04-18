import React, { useState, useEffect } from 'react';
import { 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  ArrowRight,
  Loader2,
  Search,
  Filter,
  LayoutGrid,
  List as ListIcon,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { EditableHeader } from './EditableHeader';
import { formatCurrency } from '../lib/utils';

export function InventoryOverview() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchInventory();
  }, [user?.companyId]);

  async function fetchInventory() {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getItems(user.companyId);
      setItems(data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items.filter(item => item.current_stock <= (item.reorder_level || 0));
  const totalStockValue = items.reduce((sum, item) => sum + (item.current_stock * (item.avg_cost || 0)), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <EditableHeader 
            pageId="inventory_overview"
            defaultTitle="Inventory Overview" 
            defaultSubtitle="Real-time stock levels and inventory insights"
          />
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/inventory/items/new')}
              className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
            >
              Add Item
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border p-6 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Stock Value</p>
            <h2 className="text-2xl font-bold text-foreground">{formatCurrency(totalStockValue)}</h2>
            <div className="flex items-center gap-1 text-[10px] text-emerald-500">
              <TrendingUp className="w-3 h-3" />
              <span>Across {items.length} items</span>
            </div>
          </div>
          <div className="bg-card border border-border p-6 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Low Stock Alerts</p>
            <h2 className="text-2xl font-bold text-rose-500">{lowStockItems.length}</h2>
            <div className="flex items-center gap-1 text-[10px] text-rose-500">
              <AlertTriangle className="w-3 h-3" />
              <span>Items below reorder level</span>
            </div>
          </div>
          <div className="bg-card border border-border p-6 space-y-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Total Categories</p>
            <h2 className="text-2xl font-bold text-foreground">
              {new Set(items.map(i => i.category).filter(Boolean)).size}
            </h2>
            <div className="flex items-center gap-1 text-[10px] text-gray-400">
              <Package className="w-3 h-3" />
              <span>Organized groups</span>
            </div>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-foreground/5 p-4 border border-border">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search items or categories..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border pl-10 pr-4 py-2 text-sm outline-none focus:border-foreground transition-colors"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex border border-border rounded overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-foreground text-background' : 'bg-background text-gray-400'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-foreground text-background' : 'bg-background text-gray-400'}`}
              >
                <ListIcon className="w-4 h-4" />
              </button>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-background border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-colors">
              <Filter className="w-3 h-3" /> Filter
            </button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <div 
                key={item.id}
                onClick={() => navigate(`/inventory/items/edit/${item.id}`)}
                className="bg-card border border-border p-5 space-y-4 hover:border-foreground/30 transition-all cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-foreground/5 rounded-lg group-hover:bg-foreground/10 transition-colors">
                    <Package className="w-5 h-5 text-gray-500" />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${
                    item.current_stock <= (item.reorder_level || 0) 
                      ? 'bg-rose-500/10 text-rose-500' 
                      : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    {item.current_stock <= (item.reorder_level || 0) ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-foreground uppercase tracking-tight group-hover:text-blue-500 transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                    {item.category || 'Uncategorized'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Quantity</p>
                    <p className="text-sm font-bold text-foreground">
                      {item.current_stock} <span className="text-[10px] font-normal text-gray-500">{item.unit_name}</span>
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase tracking-widest">Avg. Cost</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(item.avg_cost || 0)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-foreground/5 border-b border-border">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Item Name</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Stock Level</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Avg. Cost</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Total Value</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map(item => (
                  <tr 
                    key={item.id}
                    onClick={() => navigate(`/inventory/items/edit/${item.id}`)}
                    className="hover:bg-foreground/[0.02] transition-colors cursor-pointer group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-bold text-foreground uppercase tracking-tight">{item.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest">{item.category || '-'}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${
                          item.current_stock <= (item.reorder_level || 0) ? 'text-rose-500' : 'text-foreground'
                        }`}>
                          {item.current_stock}
                        </span>
                        <span className="text-[10px] text-gray-400">{item.unit_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-bold text-foreground">{formatCurrency(item.avg_cost || 0)}</span>
                    </td>
                    <td className="p-4 text-right">
                      <span className="text-sm font-bold text-foreground">
                        {formatCurrency(item.current_stock * (item.avg_cost || 0))}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-foreground transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredItems.length === 0 && (
          <div className="py-20 text-center border border-dashed border-border text-gray-500 uppercase text-[10px] tracking-widest">
            No items found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
