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

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-gray-900">Stock Category Summary</h1>
            <p className="text-gray-500">Inventory breakdown by stock categories</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((cat) => (
          <div 
            key={cat.id}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col"
          >
            <div className="flex justify-between items-start mb-6">
              <div className="p-3 bg-primary/5 rounded-lg text-primary">
                <Tag className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {cat.itemCount} Items
              </span>
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-4">{cat.name}</h3>
            
            <div className="space-y-3 mb-6 flex-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Total Quantity</span>
                <span className="font-bold text-gray-900">{cat.totalQty}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Estimated Value</span>
                <span className="font-bold text-primary">{formatCurrency(cat.totalValue)}</span>
              </div>
            </div>

            <button 
              onClick={() => navigate('/reports/stock', { state: { categoryId: cat.id } })}
              className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between text-sm font-bold text-primary hover:gap-2 transition-all uppercase tracking-widest"
            >
              View Items
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
