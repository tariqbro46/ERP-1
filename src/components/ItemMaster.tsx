import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { Package, Search, Edit2, Plus, Loader2, Filter, List, Grid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function ItemMaster() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'master' | 'pricelist'>('master');

  useEffect(() => {
    async function fetchItems() {
      if (!user?.companyId) return;
      try {
        const data = await erpService.getItems(user.companyId);
        setItems(data || []);
      } catch (err) {
        console.error('Error fetching items:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchItems();
  }, [user?.companyId]);

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                         item.part_no?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-mono text-foreground uppercase tracking-tighter">Item Master</h1>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setViewMode('master')}
                className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'master' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
              >
                Master View
              </button>
              <button 
                onClick={() => setViewMode('pricelist')}
                className={`text-[10px] uppercase tracking-widest pb-1 border-b-2 transition-all ${viewMode === 'pricelist' ? 'border-foreground text-foreground font-bold' : 'border-transparent text-gray-500'}`}
              >
                Price List
              </button>
            </div>
          </div>
          <button 
            onClick={() => navigate('/inventory/items/new')}
            className="flex items-center gap-2 px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
          >
            <Plus className="w-3 h-3" />
            Create New Item
          </button>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card border border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input 
              type="text"
              placeholder="SEARCH BY NAME OR PART NO..."
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
            Total Items: {filteredItems.length}
          </div>
        </div>

        {/* Items Table/Cards */}
        <div className="bg-card border border-border overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-6 h-6 text-foreground animate-spin" />
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">Loading Inventory...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-12 h-12 text-border mx-auto mb-4" />
              <p className="text-[10px] text-gray-600 uppercase tracking-widest">No items found matching your criteria</p>
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
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest">Part No: {item.part_no || '---'}</p>
                        <p className="text-[8px] text-gray-500 uppercase tracking-widest">Avg Cost: ৳ {item.avg_cost?.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase tracking-widest">Current Stock</p>
                        <p className={cn(
                          "text-sm font-bold font-mono",
                          item.current_stock > 0 ? "text-emerald-500" : "text-rose-500"
                        )}>
                          {item.current_stock?.toLocaleString()} <span className="text-[10px] uppercase">{item.units?.name}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop View: Table */}
              <div className="hidden md:block overflow-x-auto no-scrollbar">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-foreground/5 border-b border-border">
                    <tr>
                      <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Item Name</th>
                      <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Category</th>
                      <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Part No.</th>
                      <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Unit</th>
                      <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right">Current Stock</th>
                      <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right">Avg Cost</th>
                      <th className="px-6 py-4 text-right w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="group hover:bg-foreground/5 transition-colors">
                        <td className="px-6 py-4">
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
                        <td className="px-6 py-4 text-right">
                          <p className={cn(
                            "text-[11px] font-bold font-mono",
                            item.current_stock > 0 ? "text-emerald-500" : "text-rose-500"
                          )}>
                            {item.current_stock?.toLocaleString()}
                          </p>
                        </td>
                        <td className="px-6 py-4 text-right text-[11px] text-gray-400 font-mono">
                          ৳ {item.avg_cost?.toLocaleString()}
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
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Item Name</th>
                    <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold">Category</th>
                    <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right">Standard Price</th>
                    <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right">Wholesale Price</th>
                    <th className="px-6 py-4 text-[9px] text-gray-500 uppercase tracking-widest font-bold text-right">Retail Price</th>
                    <th className="px-6 py-4 text-right w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filteredItems.map(item => (
                    <tr key={item.id} className="group hover:bg-foreground/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-[11px] text-foreground font-bold uppercase tracking-wider">{item.name}</p>
                        <p className="text-[8px] text-gray-600 mt-0.5">SKU: {item.barcode || '---'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[9px] text-gray-500 uppercase tracking-widest px-2 py-1 bg-foreground/5 border border-border">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-mono">
                        ৳ {item.standard_price?.toLocaleString() || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-mono text-blue-500">
                        ৳ {(item.standard_price * 0.9)?.toLocaleString() || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-right text-[11px] font-mono text-emerald-500">
                        ৳ {(item.standard_price * 1.1)?.toLocaleString() || '0.00'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-blue-500 text-[10px] uppercase font-bold hover:underline">Update</button>
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
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
