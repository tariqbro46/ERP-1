import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Package, Search, Printer, Download, ChevronDown, ChevronRight, Loader2, Filter, MapPin, Activity, AlertTriangle, X, Calendar } from 'lucide-react';
import { exportToCSV, exportToPDF } from '../utils/exportUtils';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber, formatQuantity, ensureDate } from '../lib/utils';
import { QuickItemModal } from './QuickItemModal';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ReportPrintHeader, ReportPrintFooter } from './ReportPrintHeader';
import { DateInput } from './DateInput';
import * as printUtils from '../utils/printUtils';

export function StockSummary() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { showNotification } = useNotification();
  const locationState = location.state as { godownId?: string; categoryId?: string } | null;
  
  const [startDate, setStartDate] = useState(searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toLocaleDateString('en-CA'));
  const [endDate, setEndDate] = useState(searchParams.get('to') || new Date().toLocaleDateString('en-CA'));
  const [items, setItems] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [stockCategories, setStockCategories] = useState<any[]>([]);
  const [selectedGodown, setSelectedGodown] = useState<string>(locationState?.godownId || '');
  const [selectedCategory, setSelectedCategory] = useState<string>(locationState?.categoryId || '');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [isQuickItemOpen, setIsQuickItemOpen] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [inventory, setInventory] = useState<any[]>([]);
  const [recalculating, setRecalculating] = useState(false);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      for (const item of items) {
        await erpService.recalculateItemStats(item.id);
      }
      showNotification('All item statistics recalculated successfully');
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

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const [allItems, godownsRes, allInv, catsRes] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getGodowns(user.companyId),
          erpService.getCollection('inventory_entries', user.companyId),
          erpService.getCollection('stock_categories', user.companyId)
        ]);
        
        setInventory(allInv);
        setItems(allItems);
        setGodowns(godownsRes || []);
        setStockCategories(catsRes || []);
        
        const groups = new Set(allItems.map(i => i.category || 'General Items'));
        setExpandedGroups(groups);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId, endDate]);

  const getStockDetails = (itemId: string, godownId: string | null) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return { opening: 0, inward: 0, outward: 0, closing: 0 };

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const godownAllocation = (item.opening_godowns || []).find((a: any) => a.godown_id === godownId);
    let currentStock = godownId 
      ? (Number(godownAllocation?.qty) || 0)
      : (Number(item.opening_qty) || 0);

    let opening = 0;
    let inward = 0;
    let outward = 0;

    // Filter and sort entries for consistent calculation
    // We filter by godownId only if one is selected.
    // If "All Locations" is selected, we need all entries to calculate total stock correctly.
    const relevantEntries = inventory
      .filter(inv => inv.item_id === itemId && (!godownId || inv.godown_id === godownId))
      .sort((a, b) => {
        const dateComp = (a.date || '').localeCompare(b.date || '');
        if (dateComp !== 0) return dateComp;
        return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
      });

    relevantEntries.forEach(inv => {
      // Normalize entry date to start of day for comparison with 'start'
      let entryDate: Date;
      if (inv.date) {
        const [y, m, d] = inv.date.split('-').map(Number);
        entryDate = new Date(y, m - 1, d);
      } else {
        entryDate = ensureDate(inv.created_at);
      }
      
      const qty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
      const mType = (inv.movement_type || inv.m_type || (inv.v_type === 'Sales' ? 'outward' : 'inward')).toLowerCase();
      const isPhysical = inv.v_type?.toLowerCase() === 'physical stock' || inv.is_physical_snapshot;

      if (entryDate < start) {
        // Entries before the period affect opening balance
        if (isPhysical) {
          if (!godownId) {
            // For All Locations, a physical stock entry anywhere only changes total by its adjustment
            currentStock += (Number(inv.adjustment_qty) || 0);
          } else {
            // For a specific godown, physical stock sets the absolute value
            currentStock = Number(inv.qty) || 0;
          }
        } else {
          currentStock += (mType === 'inward' ? qty : -qty);
        }
      } else if (entryDate <= end) {
        // Entries during the period
        if (isPhysical) {
          let adj = 0;
          if (!godownId) {
            adj = Number(inv.adjustment_qty) || 0;
          } else {
            // For specific godown, adjustment is target - current
            adj = (Number(inv.qty) || 0) - currentStock;
          }

          if (adj > 0) inward += adj;
          else {
            outward += Math.abs(adj);
          }

          if (!godownId) {
            currentStock += adj;
          } else {
            currentStock = Number(inv.qty) || 0;
          }
        } else {
          if (mType === 'inward') {
            inward += qty;
            currentStock += qty;
          } else {
            outward += qty;
            currentStock -= qty;
          }
        }
      }
    });

    opening = currentStock - inward + outward;

    return {
      opening,
      inward,
      outward,
      closing: currentStock
    };
  };

  const processedItems = items.map(item => {
    const details = getStockDetails(item.id, selectedGodown);
    return {
      ...item,
      ...details,
      displayStock: details.closing,
      isLowStock: (details.closing <= (item.low_stock_threshold || 0)) && (item.low_stock_threshold > 0)
    };
  }).filter(item => {
    if (selectedCategory && item.category_id !== selectedCategory) {
      if (selectedCategory === 'uncategorized' && item.category_id) return false;
      if (selectedCategory !== 'uncategorized') return false;
    }
    // Only show items with any movement or balance in the period
    if (selectedGodown && item.displayStock === 0 && item.opening === 0 && item.inward === 0 && item.outward === 0) return false;
    if (showLowStockOnly && !item.isLowStock) return false;
    return true;
  }).sort((a, b) => a.name.localeCompare(b.name));

  const finalFilteredItems = processedItems.filter(item => {
    const groupName = item.category || 'General Items';
    return !search || 
      item.name.toLowerCase().includes(search.toLowerCase()) || 
      groupName.toLowerCase().includes(search.toLowerCase());
  });

  const groupedItems: Record<string, any[]> = {};
  finalFilteredItems.forEach(item => {
    const group = item.category || 'General Items';
    if (!groupedItems[group]) groupedItems[group] = [];
    groupedItems[group].push(item);
  });

  const filteredGroups = Object.keys(groupedItems).sort((a, b) => a.localeCompare(b));

  const toggleGroup = (group: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(group)) newSet.delete(group);
    else newSet.add(group);
    setExpandedGroups(newSet);
  };

  const totalStockValue = finalFilteredItems.reduce((sum, item) => sum + (item.displayStock * (item.avg_cost || item.opening_rate || 0)), 0);

  const activeCategoryName = selectedCategory === 'uncategorized' 
    ? 'Uncategorized' 
    : stockCategories.find(c => c.id === selectedCategory)?.name;

  const handleDownload = () => {
    const exportData = finalFilteredItems.map(item => ({
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
    const exportData = finalFilteredItems.map(item => ({
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
  const asOnDate = formatReportDate(endDate, settings.dateFormat);

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    // Escape regex special characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() 
            ? <mark key={i} className="bg-amber-200 text-amber-900 border-b border-amber-500 rounded-sm px-0.5">{part}</mark> 
            : part
        )}
      </>
    );
  };

  return (
    <div className="flex flex-col min-h-full bg-background font-mono transition-colors">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-end border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            {(settings.companyLogo || settings.systemLogo) && (
              <div className="w-10 h-10 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                <img 
                  src={settings.companyLogo || settings.systemLogo} 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl text-foreground uppercase tracking-tighter">{t('stock.title')}</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">{settings.companyName || 'ERP System'} • {t('reports.asOnDate')} {asOnDate}</p>
            </div>
          </div>
          <div className="flex-1 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <DateInput
                  label="From"
                  value={startDate}
                  onChange={setStartDate}
                  className="w-full bg-muted/50 border-0 shadow-none focus:bg-background"
                />
              </div>
              <div className="flex-1">
                <DateInput
                  label="To"
                  value={endDate}
                  onChange={setEndDate}
                  className="w-full bg-muted/50 border-0 shadow-none focus:bg-background"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest">{t('common.totalValue')}</p>
              <p className="text-lg text-foreground font-bold">৳ {formatNumber(totalStockValue)}</p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={() => printUtils.printElement('stock-summary-report', `Stock Summary`, settings)}
                className="px-3 py-1.5 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase rounded-sm shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                {t('common.print')}
              </button>
              <button 
                onClick={handleDownload}
                disabled={finalFilteredItems.length === 0}
                className="px-3 py-1.5 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase rounded-sm shadow-sm"
                title={t('common.csv')}
              >
                <Download className="w-3 h-3" /> {t('common.csv')}
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={finalFilteredItems.length === 0}
                className="px-3 py-1.5 bg-card border border-border text-gray-500 hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase rounded-sm shadow-sm"
                title={t('common.pdf')}
              >
                <Download className="w-3 h-3" /> {t('common.pdf')}
              </button>
              <button 
                onClick={() => setIsQuickItemOpen(true)}
                className="px-3 py-1.5 bg-amber-600/10 border border-amber-600/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase rounded-sm shadow-sm"
                title={t('stock.quickCreateItem')}
              >
                <Package className="w-3.5 h-3.5" /> {t('item.new')}
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-card border border-border px-4 py-2 gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10" />
              <input
                type="text"
                placeholder={t('stock.searchPlaceholder')}
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border text-foreground pl-10 pr-4 py-2 text-xs outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {selectedCategory && (
                <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 text-[10px] font-bold uppercase rounded-lg">
                  {activeCategoryName}
                  <button onClick={() => setSelectedCategory('')} className="hover:text-amber-700">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2">
                <select
                  value={selectedGodown}
                  onChange={(e) => setSelectedGodown(e.target.value)}
                  className="bg-background border border-border text-foreground px-3 py-1.5 text-[10px] uppercase tracking-widest outline-none focus:border-foreground transition-colors"
                >
                  <option value="">{t('stock.allGodowns')}</option>
                  {godowns.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lowStockOnly"
                  checked={showLowStockOnly}
                  onChange={e => setShowLowStockOnly(e.target.checked)}
                  className="w-3.5 h-3.5 accent-foreground"
                />
                <label htmlFor="lowStockOnly" className="text-[10px] text-gray-500 uppercase tracking-widest cursor-pointer whitespace-nowrap">
                  {t('stock.lowStockOnly')}
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <button 
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground disabled:opacity-50"
            >
              {recalculating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              {t('common.recalculate')}
            </button>
            <button className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-widest hover:text-foreground">
              <Filter className="w-3 h-3" /> {t('common.f12Configure')}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-0">
        <div className="p-4 lg:p-6 space-y-6 pb-20">
          {/* Table/Cards */}
          <div id="stock-summary-report" className="bg-card border border-border p-0 print:p-8 print:border-none print:shadow-none bg-white">
          <ReportPrintHeader 
            title="Stock Summary" 
            subtitle={cn(
              selectedGodown ? `Location: ${godowns.find(g => g.id === selectedGodown)?.name}` : 'All Locations',
              selectedCategory ? ` | Category: ${activeCategoryName}` : '',
              ` | Period: ${formatReportDate(startDate)} to ${formatReportDate(endDate)}`
            )} 
          />
          
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50">
            {filteredGroups.map(groupName => {
              const groupItems = groupedItems[groupName];
              const groupQty = groupItems.reduce((sum, i) => sum + i.displayStock, 0);
              const groupValue = groupItems.reduce((sum, i) => sum + (i.displayStock * (i.avg_cost || i.opening_rate || 0)), 0);
              const isExpanded = expandedGroups.has(groupName) || search.length > 0;

              return (
                <div key={groupName} className="flex flex-col">
            <div className="p-4 bg-muted/20 flex justify-between items-center cursor-pointer hover:bg-muted/80 transition-colors border-l-4 border-transparent hover:border-primary"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                      <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                        {highlightText(groupName, search)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500 uppercase">{t('common.totalValue')}</p>
                      <p className="text-xs font-bold text-foreground font-mono">৳ {formatNumber(groupValue)}</p>
                    </div>
                  </div>
                  {isExpanded && groupItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => navigate(`/reports/stock-item?itemId=${item.id}&from=${startDate}&to=${endDate}`)}
                      className="p-4 pl-8 border-t border-border/30 space-y-2 hover:bg-muted/60 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary/40"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-foreground/80 italic">
                          {highlightText(item.name, search)}
                        </span>
                        <span className="text-xs font-bold text-foreground font-mono">{formatQuantity(item.displayStock, item.units?.name)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-500 uppercase">
                        <span>{t('common.avgRate')}: ৳ {formatNumber(item.avg_cost || item.opening_rate || 0)}</span>
                        <span className="font-bold text-foreground/60">{t('common.value')}: ৳ {formatNumber(item.displayStock * (item.avg_cost || item.opening_rate || 0))}</span>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <div className="p-10 text-center text-gray-500 uppercase tracking-widest text-[10px]">{t('stock.noItems')}</div>
            )}
            {/* Grand Total Mobile */}
            <div className="p-4 bg-foreground/10 flex justify-between items-center font-bold">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">{t('common.grandTotal')}</span>
              <div className="text-right">
                <p className="text-sm text-foreground font-mono">৳ {formatNumber(totalStockValue)}</p>
              </div>
            </div>
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block relative h-full">
            <table className="w-full text-left text-[11px] min-w-[800px] border-separate border-spacing-0">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm">
                <tr className="text-gray-500 uppercase text-[9px] font-bold tracking-widest">
                  <th className="px-4 py-3 font-medium border-b border-border sticky top-0">{t('common.particulars')}</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 border-l">Opening</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 border-l">Inward</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 border-l">Outward</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 border-l bg-amber-600 text-white z-10 shadow-sm">{t('common.quantity')}</th>
                  <th className="px-4 py-3 font-medium text-right w-28 border-b border-border sticky top-0 border-l">Rate (Avg)</th>
                  <th className="px-4 py-3 font-medium text-right w-32 border-b border-border sticky top-0 border-l">{t('common.value')} (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredGroups.map(groupName => {
                  const groupItems = groupedItems[groupName];
                  const groupOpening = groupItems.reduce((sum, i) => sum + i.opening, 0);
                  const groupInward = groupItems.reduce((sum, i) => sum + i.inward, 0);
                  const groupOutward = groupItems.reduce((sum, i) => sum + i.outward, 0);
                  const groupQty = groupItems.reduce((sum, i) => sum + i.displayStock, 0);
                  const groupValue = groupItems.reduce((sum, i) => sum + (i.displayStock * (i.avg_cost || i.opening_rate || 0)), 0);
                  const isExpanded = expandedGroups.has(groupName) || search.length > 0;

                  return (
                    <React.Fragment key={groupName}>
                      <tr 
                        onClick={() => toggleGroup(groupName)}
                        className="hover:bg-muted/80 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-gray-600" /> : <ChevronRight className="w-3 h-3 text-gray-600" />}
                            <span className="text-foreground font-bold uppercase tracking-tight">
                              {highlightText(groupName, search)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-foreground font-mono font-bold border-l border-border/10">
                          {formatQuantity(groupOpening)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground font-mono font-bold border-l border-border/10">
                          {formatQuantity(groupInward)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground font-mono font-bold border-l border-border/10">
                          {formatQuantity(groupOutward)}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-700 font-mono font-bold border-l border-amber-500/10 bg-amber-500/5">
                          {formatQuantity(groupQty)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-600 border-l border-border/10">
                          -
                        </td>
                        <td className="px-4 py-3 text-right text-foreground font-mono font-bold border-l border-border/10">
                          {formatNumber(groupValue)}
                        </td>
                      </tr>
                      {isExpanded && groupItems.map(item => (
                        <tr 
                          key={item.id} 
                          onClick={() => navigate(`/reports/stock-item?id=${item.id}&from=${startDate}&to=${endDate}`)}
                          className={cn("bg-muted/5 hover:bg-muted/60 transition-colors group/item cursor-pointer border-l-4 border-transparent hover:border-primary/40", item.isLowStock && "bg-rose-500/5")}
                        >
                        <td className="px-10 py-2.5 text-foreground/60 italic flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                          {highlightText(item.name, search)}
                          {item.isLowStock && (
                            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold uppercase rounded flex items-center gap-1">
                              <AlertTriangle className="w-2 h-2" /> Low
                            </span>
                          )}
                        </td>
                         <td className="px-4 py-2.5 text-right text-foreground/60 font-mono border-l border-border/5">
                           {formatQuantity(item.opening, item.units?.name)}
                         </td>
                         <td className="px-4 py-2.5 text-right text-foreground/60 font-mono border-l border-border/5">
                           {formatQuantity(item.inward, item.units?.name)}
                         </td>
                         <td className="px-4 py-2.5 text-right text-foreground/60 font-mono border-l border-border/5">
                           {formatQuantity(item.outward, item.units?.name)}
                         </td>
                         <td className="px-4 py-2.5 text-right text-amber-700 font-bold font-mono border-l border-amber-500/20 bg-amber-500/10">
                           {formatQuantity(item.displayStock, item.units?.name)}
                         </td>
                           <td className="px-4 py-2.5 text-right text-foreground/80 font-mono border-l border-border/5">
                             {formatNumber(item.avg_cost || item.opening_rate || 0)}
                           </td>
                           <td className="px-4 py-2.5 text-right text-foreground/80 font-mono border-l border-border/5">
                             {formatNumber(item.displayStock * (item.avg_cost || item.opening_rate || 0))}
                           </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500 uppercase tracking-widest">{t('stock.noItems')}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-background border-t-2 border-border sticky bottom-0 text-[10px] z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <tr className="font-bold text-foreground bg-background">
                  <td className="px-4 py-3 uppercase text-[9px] text-gray-500 tracking-widest bg-background">{t('common.grandTotal')}</td>
                  <td className="px-4 py-3 text-right font-mono border-l border-border bg-background">
                    {formatQuantity(finalFilteredItems.reduce((sum, i) => sum + i.opening, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono border-l border-border bg-background">
                    {formatQuantity(finalFilteredItems.reduce((sum, i) => sum + i.inward, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono border-l border-border bg-background">
                    {formatQuantity(finalFilteredItems.reduce((sum, i) => sum + i.outward, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono border-l border-amber-600 bg-amber-600 text-white">
                    {formatQuantity(finalFilteredItems.reduce((sum, i) => sum + i.displayStock, 0))}
                  </td>
                  <td className="px-4 py-3 text-right font-mono border-l border-border bg-background">
                    -
                  </td>
                  <td className="px-4 py-3 text-right font-mono border-l border-border bg-background">
                    ৳ {formatNumber(totalStockValue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <ReportPrintFooter />
        </div>

        {/* Stock Valuation Method Note */}
        <div className="flex justify-between items-center text-[9px] text-gray-500 uppercase tracking-[0.2em]">
          <span>{t('stock.valuationMethod')}: {t('stock.weightedAvg')}</span>
          <span>{t('common.f1Help')}</span>
        </div>
      </div>

      <QuickItemModal
        isOpen={isQuickItemOpen}
        onClose={() => setIsQuickItemOpen(false)}
        onSuccess={handleQuickItemSuccess}
      />
    </div>
  </div>
);
}

