import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Package, Filter, Search } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';

export function AgeingAnalysis() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [ageingData, setAgeingData] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Define ageing intervals (in days)
  const intervals = [
    { label: '< 30 days', min: 0, max: 30 },
    { label: '30 - 60 days', min: 30, max: 60 },
    { label: '60 - 90 days', min: 60, max: 90 },
    { label: '> 90 days', min: 90, max: 9999 }
  ];

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [stockItems, invEntries] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getCollection('inventory_entries', user.companyId)
        ]);

        const now = new Date();

        const analysis = stockItems.map(item => {
          // For each item, analyze its current stock by looking at inward entries (simplified FIFO-ish ageing)
          // We look at inward entries from most recent back until we account for current stock
          const itemEntries = invEntries
            .filter((e: any) => e.item_id === item.id && e.movement_type === 'Inward');

          let remainingStock = item.current_stock || 0;
          const ageing = intervals.map(() => 0);

          for (const entry of itemEntries) {
            if (remainingStock <= 0) break;
            
            const entryQty = (entry.qty || 0) + (entry.free_qty || 0);
            const takenQty = Math.min(remainingStock, entryQty);
            
            const entryDate = entry.date ? new Date(entry.date) : (entry.created_at?.toDate ? entry.created_at.toDate() : new Date(entry.created_at || 0));
            const daysOld = Math.floor((now.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

            // Find interval
            const intervalIdx = intervals.findIndex(int => daysOld >= int.min && daysOld < int.max);
            if (intervalIdx !== -1) {
              ageing[intervalIdx] += takenQty;
            }
            
            remainingStock -= takenQty;
          }

          // If there's still stock unaccounted for (opening stock), put it in the oldest bucket
          if (remainingStock > 0) {
            ageing[intervals.length - 1] += remainingStock;
          }

          return {
            ...item,
            ageing
          };
        }).filter(item => (item.current_stock || 0) > 0);

        setAgeingData(analysis);
        setItems(analysis);
      } catch (err) {
        console.error('Error fetching ageing data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user?.companyId]);

  const filteredItems = ageingData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h1 className="text-3xl font-bold text-gray-900">Ageing Analysis</h1>
            <p className="text-gray-500">Inventory age summary based on inward movements</p>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border-separate border-spacing-0">
            <thead className="sticky top-0 z-10 bg-gray-50">
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500">
                <th className="px-6 py-4 border-b border-gray-200">Item Name</th>
                <th className="px-6 py-4 text-right border-b border-gray-200">Total Qty</th>
                {intervals.map((int, idx) => (
                  <th key={idx} className="px-6 py-4 text-right whitespace-nowrap border-b border-gray-200">{int.label}</th>
                ))}
                <th className="px-6 py-4 text-right border-b border-gray-200">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredItems.length > 0 ? filteredItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {item.current_stock} {item.unit}
                  </td>
                  {item.ageing.map((qty: number, iidx: number) => (
                    <td key={iidx} className={cn("px-6 py-4 text-right", qty > 0 ? "text-gray-900" : "text-gray-300")}>
                      {qty > 0 ? qty : '-'}
                    </td>
                  ))}
                  <td className="px-6 py-4 text-right font-medium text-primary">
                    {formatCurrency(item.current_stock * (item.avg_cost || 0))}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={intervals.length + 3} className="px-6 py-12 text-center text-gray-500">
                    No positive stock items found for analysis
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
              <tr>
                <td className="px-6 py-4">Grand Total</td>
                <td className="px-6 py-4 text-right">
                  {filteredItems.reduce((sum, i) => sum + i.current_stock, 0)}
                </td>
                {intervals.map((_, idx) => (
                  <td key={idx} className="px-6 py-4 text-right">
                    {filteredItems.reduce((sum, i) => sum + i.ageing[idx], 0)}
                  </td>
                ))}
                <td className="px-6 py-4 text-right text-primary">
                  {formatCurrency(filteredItems.reduce((sum, i) => sum + (i.current_stock * (i.avg_cost || 0)), 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
