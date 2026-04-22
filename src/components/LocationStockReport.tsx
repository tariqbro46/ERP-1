import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  MapPin, 
  Search, 
  Printer, 
  Download,
  ChevronRight,
  Package,
  TrendingUp
} from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, cn } from '../lib/utils';
import { ReportPrintHeader, ReportPrintFooter } from './ReportPrintHeader';
import { printUtils } from '../utils/printUtils';
import { exportUtils } from '../utils/exportUtils';

export function LocationStockReport() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      try {
        const [godownsRes, allInv, allItems] = await Promise.all([
          erpService.getGodowns(user.companyId),
          erpService.getCollection('inventory_entries', user.companyId),
          erpService.getItems(user.companyId)
        ]);
        setGodowns(godownsRes || []);
        setInventory(allInv || []);
        setItems(allItems || []);
      } catch (err) {
        console.error('Error fetching location data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId]);

  const calculateGodownValue = (godownId: string) => {
    const godownInv = inventory.filter(inv => inv.godown_id === godownId);
    let totalValue = 0;

    // Group by item first to get net qty from transactions
    const itemTotals: Record<string, number> = {};
    godownInv.forEach(inv => {
      const qty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
      const change = inv.movement_type === 'Inward' ? qty : -qty;
      itemTotals[inv.item_id] = (itemTotals[inv.item_id] || 0) + change;
    });

    // Add opening godown allocations
    items.forEach(item => {
      const allocation = (item.opening_godowns || []).find((a: any) => a.godown_id === godownId);
      if (allocation) {
        const qty = Number(allocation.qty) || 0;
        itemTotals[item.id] = (itemTotals[item.id] || 0) + qty;
      }
    });

    // Multiply by item rate (avg cost)
    Object.entries(itemTotals).forEach(([itemId, qty]) => {
      if (qty <= 0) return;
      const item = items.find(i => i.id === itemId);
      const rate = item?.avg_cost || item?.opening_rate || 0;
      totalValue += qty * rate;
    });

    return totalValue;
  };

  const calculateGodownQty = (godownId: string) => {
    // Transactional qty
    const transactionQty = inventory
      .filter(inv => inv.godown_id === godownId)
      .reduce((sum, inv) => {
        const qty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
        return inv.movement_type === 'Inward' ? sum + qty : sum - qty;
      }, 0);

    // Opening allocations
    const openingQty = items.reduce((sum, item) => {
      const allocation = (item.opening_godowns || []).find((a: any) => a.godown_id === godownId);
      return sum + (allocation ? Number(allocation.qty) || 0 : 0);
    }, 0);

    return transactionQty + openingQty;
  };

  const processedGodowns = godowns.map(g => ({
    ...g,
    totalValue: calculateGodownValue(g.id),
    totalQty: calculateGodownQty(g.id)
  })).filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
     .sort((a, b) => a.name.localeCompare(b.name));

  const totalValue = processedGodowns.reduce((sum, g) => sum + g.totalValue, 0);

  const handlePrint = () => {
    printUtils.printElement('location-report', 'Location Summary Report');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background font-mono transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-6 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-end border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl lg:text-2xl text-foreground uppercase tracking-tighter">{t('location.title')}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('location.subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">{t('location.totalAcross')}</p>
              <p className="text-lg lg:text-xl text-foreground font-bold">{formatCurrency(totalValue)}</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={handlePrint}
                className="px-3 py-2 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase"
              >
                <Printer className="w-4 h-4" />
                {t('common.print')}
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex bg-card border border-border px-4 py-2 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
            <input
              type="text"
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border text-foreground pl-10 pr-4 py-2 text-xs outline-none focus:border-foreground transition-colors uppercase tracking-widest"
            />
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6">
          {/* Report Content */}
          <div id="location-report" className="bg-card border border-border overflow-hidden p-0 print:p-8 print:border-none print:shadow-none bg-white">
            <ReportPrintHeader title={t('location.title')} subtitle={t('location.subtitle')} />
            
            <table className="w-full text-left text-xs border-separate border-spacing-0">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b border-border text-gray-500 uppercase bg-foreground/5 text-[10px] tracking-widest">
                  <th className="px-6 py-4 font-bold border-b border-border">{t('common.particulars')}</th>
                  <th className="px-6 py-4 font-bold text-right border-b border-border">{t('location.netQty')}</th>
                  <th className="px-6 py-4 font-bold text-right border-b border-border">{t('location.closingValue')} (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {processedGodowns.map((godown) => (
                  <tr 
                    key={godown.id}
                    onClick={() => navigate('/reports/stock', { state: { godownId: godown.id } })}
                    className="hover:bg-foreground/5 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-foreground/5 rounded-lg text-gray-400 group-hover:text-primary transition-colors">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <span className="text-foreground font-bold uppercase tracking-tight">{godown.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-foreground font-mono">
                      {godown.totalQty.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right text-foreground font-mono font-bold">
                      {formatCurrency(godown.totalValue)}
                    </td>
                  </tr>
                ))}
                {processedGodowns.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-gray-500 uppercase tracking-widest italic">
                      {t('location.noLocations')}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-foreground/5 border-t-2 border-border font-bold text-foreground">
                <tr>
                  <td className="px-6 py-4 uppercase text-[10px] text-gray-500 tracking-widest">{t('location.grandTotal')}</td>
                  <td className="px-6 py-4 text-right font-mono border-l border-border">
                    {processedGodowns.reduce((sum, g) => sum + g.totalQty, 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right font-mono border-l border-border text-lg">
                    {formatCurrency(totalValue)}
                  </td>
                </tr>
              </tfoot>
            </table>

            <ReportPrintFooter />
          </div>
        </div>
      </div>
    </div>
  );
}
