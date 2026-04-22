import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Tag, Search, ChevronRight } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function StockCategorySummary() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [stockCategories, stockItems] = await Promise.all([
          erpService.getCollection('stock_categories', user.companyId),
          erpService.getItems(user.companyId)
        ]);

        const summary = stockCategories.map(cat => {
          const catItems = stockItems.filter(item => item.category_id === cat.id);
          const totalQty = catItems.reduce((sum, item) => sum + (item.current_stock || 0), 0);
          const totalValue = catItems.reduce((sum, item) => sum + ((item.current_stock || 0) * (item.avg_cost || 0)), 0);
          
          return {
            ...cat,
            itemCount: catItems.length,
            totalQty,
            totalValue
          };
        });

        // Add "Uncategorized"
        const uncategorizedItems = stockItems.filter(item => !item.category_id);
        if (uncategorizedItems.length > 0) {
          summary.push({
            id: 'uncategorized',
            name: 'Uncategorized',
            itemCount: uncategorizedItems.length,
            totalQty: uncategorizedItems.reduce((sum, item) => sum + (item.current_stock || 0), 0),
            totalValue: uncategorizedItems.reduce((sum, item) => sum + ((item.current_stock || 0) * (item.avg_cost || 0)), 0)
          });
        }

        setCategories(summary);
      } catch (err) {
        console.error('Error fetching stock category summary:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.companyId]);

  const filteredCategories = categories
    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
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
              <h1 className="text-xl font-bold text-foreground">Stock Category Summary</h1>
              <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Inventory breakdown by stock categories</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-card border border-border rounded-lg outline-none focus:border-foreground text-foreground text-xs uppercase tracking-widest w-full md:w-64 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => (
              <div 
                key={cat.id}
                className="bg-card p-6 rounded-xl border border-border shadow-sm hover:border-foreground transition-all flex flex-col group"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-primary/5 rounded-lg text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Tag className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {cat.itemCount} Items
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-foreground mb-4">{cat.name}</h3>
                
                <div className="space-y-3 mb-6 flex-1 italic text-xs uppercase tracking-widest border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Total Quantity</span>
                    <span className="font-bold text-foreground">{cat.totalQty}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Estimated Value</span>
                    <span className="font-bold text-primary">{formatCurrency(cat.totalValue)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/reports/stock', { state: { categoryId: cat.id } })}
                  className="mt-auto pt-4 border-t border-border flex items-center justify-between text-[10px] font-bold text-primary hover:gap-2 transition-all uppercase tracking-widest"
                >
                  View Items
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-20 bg-foreground/5 rounded-2xl border border-dashed border-border">
              <p className="text-gray-500 italic uppercase text-[10px] tracking-widest">No stock categories found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
