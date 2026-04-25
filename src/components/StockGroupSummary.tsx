import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Package, Search, ChevronRight, Filter } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';

export function StockGroupSummary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [selectedGodown, setSelectedGodown] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [stockGroups, stockItems, godownsRes, allInv] = await Promise.all([
          erpService.getCollection('stock_groups', user.companyId),
          erpService.getItems(user.companyId),
          erpService.getGodowns(user.companyId),
          erpService.getCollection('inventory_entries', user.companyId)
        ]);

        setGodowns(godownsRes || []);
        setInventory(allInv || []);

        const getStock = (item: any, gId: string) => {
          const openingQty = Number(item.opening_qty) || 0;
          const transactionStock = allInv
            .filter(inv => inv.item_id === item.id && inv.godown_id === gId)
            .reduce((sum, inv) => {
              const qty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
              return inv.movement_type === 'Inward' ? sum + qty : sum - qty;
            }, 0);
          return openingQty + transactionStock;
        };

        const summary = stockGroups.map(group => {
          const groupItems = stockItems.filter(item => item.group_id === group.id);
          
          let totalQty = 0;
          let totalValue = 0;

          if (!selectedGodown) {
            totalQty = groupItems.reduce((sum, item) => sum + (item.current_stock || 0), 0);
            totalValue = groupItems.reduce((sum, item) => sum + ((item.current_stock || 0) * (item.avg_cost || item.opening_rate || 0)), 0);
          } else {
            groupItems.forEach(item => {
              const qty = getStock(item, selectedGodown);
              totalQty += qty;
              totalValue += qty * (item.avg_cost || item.opening_rate || 0);
            });
          }
          
          return {
            ...group,
            itemCount: groupItems.length,
            totalQty,
            totalValue
          };
        });

        // Add "Uncategorized" if any items have no group
        const uncategorizedItems = stockItems.filter(item => !item.group_id);
        if (uncategorizedItems.length > 0) {
          let totalQty = 0;
          let totalValue = 0;

          if (!selectedGodown) {
            totalQty = uncategorizedItems.reduce((sum, item) => sum + (item.current_stock || 0), 0);
            totalValue = uncategorizedItems.reduce((sum, item) => sum + ((item.current_stock || 0) * (item.avg_cost || item.opening_rate || 0)), 0);
          } else {
            uncategorizedItems.forEach(item => {
              const qty = getStock(item, selectedGodown);
              totalQty += qty;
              totalValue += qty * (item.avg_cost || item.opening_rate || 0);
            });
          }

          summary.push({
            id: 'uncategorized',
            name: 'Uncategorized',
            itemCount: uncategorizedItems.length,
            totalQty,
            totalValue
          });
        }

        setGroups(summary);
        setItems(stockItems);
      } catch (err) {
        console.error('Error fetching stock group summary:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.companyId, selectedGodown]);

  const filteredGroups = groups
    .filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Stock Group Summary</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                {selectedGodown ? `Location: ${godowns.find(g => g.id === selectedGodown)?.name}` : 'All Locations'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-lg">
              <Filter className="w-3.5 h-3.5 text-gray-400" />
              <select
                value={selectedGodown}
                onChange={(e) => setSelectedGodown(e.target.value)}
                className="bg-transparent border-none text-[10px] font-bold text-foreground uppercase tracking-widest outline-none focus:ring-0"
              >
                <option value="">All Godowns</option>
                {godowns.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:border-foreground text-foreground text-xs uppercase tracking-widest w-full md:w-64 transition-colors"
            />
          </div>
        </div>
      </div>
    </div>

    {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <div 
                key={group.id}
                className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-foreground transition-all flex flex-col group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Package className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {group.itemCount} Items
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-4">{group.name}</h3>
                
                <div className="space-y-3 mb-6 flex-1 italic text-xs uppercase tracking-widest border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Quantity</span>
                    <span className="font-bold text-foreground">{formatNumber(group.totalQty)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Estimated Value</span>
                    <span className="font-bold text-primary">{formatCurrency(group.totalValue)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/reports/stock', { state: { groupId: group.id } })}
                  className="mt-auto pt-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-primary hover:gap-2 transition-all uppercase tracking-widest"
                >
                  View Items
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {filteredGroups.length === 0 && (
            <div className="text-center py-20 bg-foreground/5 rounded-2xl border border-dashed border-border">
              <p className="text-gray-500 italic uppercase text-[10px] tracking-widest">No stock groups found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
