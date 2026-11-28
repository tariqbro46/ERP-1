import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Package, Search, Printer, Download, ChevronDown, ChevronRight, Loader2, Filter, MapPin, Activity, AlertTriangle, X, Calendar, FileSpreadsheet, Mail } from 'lucide-react';
import { exportToCSV, exportStructuredExcel, shareReportViaEmail } from '../utils/exportUtils';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { cn, formatNumber, formatQuantity, ensureDate, parseEntryDate, getMovementType, formatToYMD, compareInventorySequence } from '../lib/utils';
import { SkeletonLoader } from './SkeletonLoader';
import { QuickItemModal } from './QuickItemModal';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { DateInput } from './DateInput';
import { buildReportPrintHtml, executePrint } from '../utils/printUtils';
import { printToPDF } from '../utils/pdfExportService';
import { resolveCompanyLegalIdentity, sanitizeAssetUrl } from '../constants/appIdentity';
import { ResilientImage } from './ImageNotFoundFrame';

export function StockSummary() {
  const { user, company } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();
  const legal = resolveCompanyLegalIdentity(settings, company);
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

  const [refreshKey, setRefreshKey] = useState(0);
  const isInitialMount = React.useRef(true);

  const handleRecalculateAll = async () => {
    if (!user?.companyId) return;
    setRecalculating(true);
    try {
      for (const item of items) {
        await erpService.recalculateItemStats(item.id, user.companyId, item);
      }
      // Bust stale cached collections so fresh complete data is retrieved
      try {
        localStorage.removeItem(`col_cache_inventory_entries_${user.companyId}`);
        localStorage.removeItem(`col_cache_vouchers_${user.companyId}`);
        localStorage.removeItem(`col_cache_items_${user.companyId}`);
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && (key.startsWith(`item_inv_entries_${user.companyId}`) || key.startsWith(`col_cache_inventory_entries_${user.companyId}`))) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {}
      erpService.invalidateAllCaches(user.companyId);
      showNotification('All item statistics recalculated successfully');
      setRefreshKey(prev => prev + 1);
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
        const isForced = !isInitialMount.current && refreshKey > 0;
        isInitialMount.current = false;

        const [allItems, godownsRes, allInv, catsRes, allVouchers] = await Promise.all([
          erpService.getItems(user.companyId, isForced),
          erpService.getGodowns(user.companyId, isForced),
          erpService.getCollection('inventory_entries', user.companyId, 10000, isForced),
          erpService.getCollection('stock_categories', user.companyId, 5000, isForced),
          erpService.getCollection('vouchers', user.companyId, 10000, isForced)
        ]);
        
        const vMap = (allVouchers || []).reduce((acc: any, v: any) => {
          acc[v.id] = v;
          return acc;
        }, {});

        const enrichedInv = (allInv || []).map((e: any) => {
          const v = vMap[e.voucher_id] || {};
          const vType = (e.v_type || v.v_type || '').toString();
          
          // Ensure we have a reliable movement type by combining entry data and voucher context
          const movementData = {
            ...e,
            v_type: vType,
            m_type: e.m_type || e.movement_type || e.entry_type || v.m_type || v.movement_type || ''
          };
          
          return {
            ...e,
            v_type: vType,
            date: e.date || v.v_date || '',
            m_type: getMovementType(movementData)
          };
        });

        const existingEntryIds = new Set(enrichedInv.map(e => e.id).filter(Boolean));
        const existingPairs = new Set(enrichedInv.map(e => `${e.voucher_id}_${e.item_id}`));
        (allVouchers || []).forEach((v: any) => {
          const embeddedInv = v.inventory || v.inventory_entries;
          if (Array.isArray(embeddedInv)) {
            embeddedInv.forEach((e: any, idx: number) => {
              if (e.item_id) {
                const pairKey = `${v.id}_${e.item_id}`;
                const pseudoId = e.id || `${v.id}_inv_${idx}`;
                if (!existingEntryIds.has(pseudoId) && !existingPairs.has(pairKey)) {
                  const vType = (e.v_type || v.v_type || '').toString();
                  const dateStr = e.date || v.v_date || v.date || '';
                  const movementData = {
                    ...e,
                    v_type: vType,
                    m_type: e.m_type || e.movement_type || e.entry_type || v.m_type || v.movement_type || ''
                  };
                  enrichedInv.push({
                    ...e,
                    id: pseudoId,
                    voucher_id: v.id,
                    v_type: vType,
                    date: dateStr,
                    created_at: e.created_at || v.created_at,
                    m_type: getMovementType(movementData)
                  });
                  existingPairs.add(pairKey);
                  existingEntryIds.add(pseudoId);
                }
              }
            });
          }
        });

        setInventory(enrichedInv);
        setItems(allItems);
        setGodowns(godownsRes || []);
        setStockCategories(catsRes || []);
        
        const groups = new Set<string>(allItems.map(i => (i.category as string) || 'General Items'));
        setExpandedGroups(groups);
      } catch (err) {
        console.error('Error fetching stock data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId, startDate, endDate, refreshKey]);

  const getStockDetails = (itemId: string, godownId: string | null) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return { opening: 0, inward: 0, outward: 0, closing: 0 };

    const startD = parseEntryDate(startDate, null);
    const endD = parseEntryDate(endDate, null);
    endD.setHours(23, 59, 59, 999);

    // Track godown balances precisely during the simulation
    const godownBalances: Record<string, number> = {};
    (item.opening_godowns || []).forEach((ag: any) => {
      if (ag.godown_id) {
        godownBalances[ag.godown_id] = Number(ag.qty) || 0;
      }
    });
    
    // Total opening includes all allocated and unallocated stock
    let currentTotalStock = Number(item.opening_qty) || 0;

    let periodOpening = godownId ? (godownBalances[godownId] || 0) : currentTotalStock;
    let periodInward = 0;
    let periodOutward = 0;

    // Filter by item and sort by ACTUAL date time deterministically
    const relevantEntries = inventory
      .filter(inv => String(inv.item_id) === String(itemId))
      .sort((a, b) => compareInventorySequence(a, b));

    relevantEntries.forEach(inv => {
      const entryDateObj = parseEntryDate(inv.date, inv.created_at);
      if (entryDateObj > endD) return;

      const qty = (Number(inv.qty) || 0) + (Number(inv.free_qty) || 0);
      const mType = inv.m_type || getMovementType(inv);
      const isPhysical = (inv.v_type || '').toLowerCase() === 'physical stock' || !!inv.is_physical_snapshot;
      const invGodownId = inv.godown_id;

      let adjustment = 0;
      if (isPhysical) {
        if (invGodownId) {
          const oldGodownStock = Number(godownBalances[invGodownId]) || 0;
          adjustment = qty - oldGodownStock;
          godownBalances[invGodownId] = qty;
        } else {
          adjustment = qty - currentTotalStock;
          currentTotalStock = qty;
          Object.keys(godownBalances).forEach(key => {
            godownBalances[key] = 0;
          });
        }
      } else {
        adjustment = mType === 'inward' ? qty : -qty;
        if (invGodownId) {
          godownBalances[invGodownId] = (Number(godownBalances[invGodownId]) || 0) + adjustment;
        }
      }

      if (!isPhysical || invGodownId) {
        currentTotalStock += adjustment;
      }

      if (entryDateObj < startD) {
        periodOpening = godownId ? (godownBalances[godownId] || 0) : currentTotalStock;
      } else {
        const matchesGodownFilter = !godownId || invGodownId === godownId;
        if (matchesGodownFilter) {
          if (isPhysical) {
            if (adjustment >= 0) periodInward += adjustment;
            else periodOutward += Math.abs(adjustment);
          } else {
            if (mType === 'inward') periodInward += qty;
            else periodOutward += qty;
          }
        }
      }
    });

    const finalClosing = godownId ? (godownBalances[godownId] || 0) : currentTotalStock;

    return {
      opening: periodOpening,
      inward: periodInward,
      outward: periodOutward,
      closing: finalClosing
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

  const getItemUnit = (item: any) => String(item.unit || item.units?.name || 'Pcs');
  const isWholeNumberUnit = (unit: string) => ['pcs', 'pc', 'nos'].includes(unit.toLowerCase().trim());
  const toExcelQty = (qty: number, unit: string) =>
    isWholeNumberUnit(unit) ? Math.round(qty) : Number(qty.toFixed(2));
  const aggregateUnitForItems = (list: any[]) => {
    if (!list || list.length === 0) return '';
    const units = Array.from(new Set(list.map(i => getItemUnit(i))));
    if (units.length === 1) return units[0];
    return units.every(u => isWholeNumberUnit(u)) ? 'Pcs' : '';
  };

  const stockScopeSubtitle = [
    selectedGodown ? `Location: ${godowns.find(g => g.id === selectedGodown)?.name || ''}` : 'All Locations',
    selectedCategory ? `Category: ${activeCategoryName || ''}` : '',
    `Period: ${formatReportDate(startDate, settings.dateFormat)} to ${formatReportDate(endDate, settings.dateFormat)}`
  ].filter(Boolean).join(' | ');

  const grandOpening = finalFilteredItems.reduce((sum, i) => sum + (i.opening || 0), 0);
  const grandInward = finalFilteredItems.reduce((sum, i) => sum + (i.inward || 0), 0);
  const grandOutward = finalFilteredItems.reduce((sum, i) => sum + (i.outward || 0), 0);
  const grandClosing = finalFilteredItems.reduce((sum, i) => sum + (i.displayStock || 0), 0);
  const grandAggregateUnit = aggregateUnitForItems(finalFilteredItems);

  const buildStockSummaryPrintHtml = () => {
    const printRows = [
      ...finalFilteredItems.map(item => {
        const unit = getItemUnit(item);
        const rate = Number(item.avg_cost || item.opening_rate || 0);
        const val = Number(item.displayStock || 0) * rate;
        return {
          cells: [
            item.name,
            item.category || 'General Items',
            formatQuantity(item.opening, unit),
            formatQuantity(item.inward, unit),
            formatQuantity(item.outward, unit),
            `${formatQuantity(item.displayStock, unit)} ${unit}`,
            formatNumber(rate),
            formatNumber(val)
          ]
        };
      }),
      {
        cells: [
          'Grand Total',
          `${finalFilteredItems.length} Items`,
          formatQuantity(grandOpening, grandAggregateUnit || undefined),
          formatQuantity(grandInward, grandAggregateUnit || undefined),
          formatQuantity(grandOutward, grandAggregateUnit || undefined),
          formatQuantity(grandClosing, grandAggregateUnit || undefined),
          '-',
          `৳ ${formatNumber(totalStockValue)}`
        ],
        isTotal: true
      }
    ];

    return buildReportPrintHtml({
      title: 'Stock Summary',
      subtitle: stockScopeSubtitle,
      settings,
      company,
      summaryCards: [
        { label: 'Total Stock Items', value: String(finalFilteredItems.length) },
        { label: 'Total Closing Qty', value: formatQuantity(grandClosing, grandAggregateUnit || undefined) },
        { label: 'Total Stock Value', value: `৳ ${formatNumber(totalStockValue)}` },
        {
          label: 'Scope',
          value: selectedGodown ? (godowns.find(g => g.id === selectedGodown)?.name || 'Location') : 'All Locations'
        }
      ],
      sections: [
        {
          heading: 'Inventory Movement & Valuation',
          columns: [
            { label: 'Particulars', align: 'left', width: '25%' },
            { label: 'Category', align: 'left', width: '15%' },
            { label: 'Opening', align: 'right', width: '9%' },
            { label: 'Inward', align: 'right', width: '9%' },
            { label: 'Outward', align: 'right', width: '9%' },
            { label: 'Closing Qty', align: 'right', width: '11%' },
            { label: 'Rate (Avg)', align: 'right', width: '10%' },
            { label: 'Value (৳)', align: 'right', width: '12%' }
          ],
          rows: printRows,
          emptyMessage: 'No stock items recorded for the selected filters'
        }
      ],
      note: 'Stock quantities use integer formatting for Pcs/Pc/Nos and weighted average FIFO valuation.'
    });
  };

  const handlePrint = () => {
    executePrint(buildStockSummaryPrintHtml());
  };

  const handleDownloadPDF = () => {
    printToPDF({
      title: 'Stock Summary',
      subtitle: stockScopeSubtitle,
      fileName: `Stock_Summary_${startDate}_to_${endDate}`,
      htmlContent: buildStockSummaryPrintHtml(),
      settings,
      company,
      orientation: 'landscape'
    });
  };

  const handleDownloadExcel = () => {
    const rows = finalFilteredItems.map(item => {
      const unit = getItemUnit(item);
      const rate = Number(item.avg_cost || item.opening_rate || 0);
      const value = Number(item.displayStock || 0) * rate;
      return [
        item.name,
        item.category || 'General Items',
        toExcelQty(Number(item.opening || 0), unit),
        toExcelQty(Number(item.inward || 0), unit),
        toExcelQty(Number(item.outward || 0), unit),
        toExcelQty(Number(item.displayStock || 0), unit),
        unit,
        Number(rate.toFixed(2)),
        Number(value.toFixed(2))
      ];
    });

    exportStructuredExcel({
      fileName: `Stock_Summary_${startDate}_to_${endDate}`,
      sheetName: 'Stock Summary',
      title: 'Stock Summary',
      subtitle: stockScopeSubtitle,
      headers: ['Particulars', 'Category', 'Opening', 'Inward', 'Outward', 'Closing Qty', 'Unit', 'Rate (Avg)', 'Value'],
      rows,
      footerRow: [
        'Grand Total',
        `${finalFilteredItems.length} Items`,
        grandAggregateUnit ? toExcelQty(grandOpening, grandAggregateUnit) : Number(grandOpening.toFixed(2)),
        grandAggregateUnit ? toExcelQty(grandInward, grandAggregateUnit) : Number(grandInward.toFixed(2)),
        grandAggregateUnit ? toExcelQty(grandOutward, grandAggregateUnit) : Number(grandOutward.toFixed(2)),
        grandAggregateUnit ? toExcelQty(grandClosing, grandAggregateUnit) : Number(grandClosing.toFixed(2)),
        grandAggregateUnit || '-',
        '',
        Number(totalStockValue.toFixed(2))
      ],
      settings,
      company
    });
  };

  const handleDownload = () => {
    const exportData = finalFilteredItems.map(item => {
      const unit = getItemUnit(item);
      const rate = Number(item.avg_cost || item.opening_rate || 0);
      const value = Number(item.displayStock || 0) * rate;
      return {
        'Particulars': item.name,
        'Category': item.category || 'General Items',
        'Opening': formatQuantity(item.opening, unit),
        'Inward': formatQuantity(item.inward, unit),
        'Outward': formatQuantity(item.outward, unit),
        'Closing Qty': formatQuantity(item.displayStock, unit),
        'Unit': unit,
        'Rate (Avg)': formatNumber(rate),
        'Value': formatNumber(value)
      };
    });

    exportData.push({
      'Particulars': 'Grand Total',
      'Category': `${finalFilteredItems.length} Items`,
      'Opening': formatQuantity(grandOpening, grandAggregateUnit || undefined),
      'Inward': formatQuantity(grandInward, grandAggregateUnit || undefined),
      'Outward': formatQuantity(grandOutward, grandAggregateUnit || undefined),
      'Closing Qty': formatQuantity(grandClosing, grandAggregateUnit || undefined),
      'Unit': grandAggregateUnit || '-',
      'Rate (Avg)': '-',
      'Value': formatNumber(totalStockValue)
    });

    exportToCSV(
      `Stock_Summary_${startDate}_to_${endDate}`,
      `Stock Summary — ${stockScopeSubtitle}`,
      exportData,
      ['Particulars', 'Category', 'Opening', 'Inward', 'Outward', 'Closing Qty', 'Unit', 'Rate (Avg)', 'Value'],
      settings,
      company
    );
  };

  const handleEmailReport = () => {
    const topItems = [...finalFilteredItems]
      .sort((a, b) => (b.displayStock * (b.avg_cost || b.opening_rate || 0)) - (a.displayStock * (a.avg_cost || a.opening_rate || 0)))
      .slice(0, 8);

    const summaryLines = [
      `Total Stock Items: ${finalFilteredItems.length}`,
      `Total Closing Quantity: ${formatQuantity(grandClosing, grandAggregateUnit || undefined)}`,
      `Total Stock Valuation: ৳ ${formatNumber(totalStockValue)}`,
      ...(topItems.length > 0 ? [
        '',
        'Top Stock Items by Value:',
        ...topItems.map(item => {
          const unit = getItemUnit(item);
          const val = (item.displayStock || 0) * (item.avg_cost || item.opening_rate || 0);
          return `- ${item.name} (${formatQuantity(item.displayStock, unit)} ${unit}): ৳ ${formatNumber(val)}`;
        })
      ] : [])
    ];

    shareReportViaEmail({
      title: 'Stock Summary',
      subtitle: stockScopeSubtitle,
      summaryLines,
      settings,
      company,
      recipientEmail: legal.printEmail || ''
    });
  };

  const groupsToRender = filteredGroups;
  const activeGroupedItems = groupedItems;

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
    <div className="flex flex-col h-screen bg-background transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 space-y-4 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start md:items-end border-b border-border pb-4 gap-4">
          <div className="flex items-center gap-4">
            {sanitizeAssetUrl(legal.companyLogo || '') && (
              <div className="w-10 h-10 bg-foreground/5 rounded-lg overflow-hidden flex items-center justify-center border border-border">
                <ResilientImage
                  src={sanitizeAssetUrl(legal.companyLogo || '')}
                  alt="Logo"
                  className="w-full h-full object-contain"
                  fallbackClassName="w-full h-full border-0 rounded-none"
                  compact
                />
              </div>
            )}
            <div className="flex flex-col">
              <h1 className="text-xl text-foreground uppercase tracking-tighter">{t('stock.title')}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{legal.companyName || 'ERP System'} • {t('reports.asOnDate')} {asOnDate}</p>
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
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest">{t('common.totalValue')}</p>
              <p className="text-lg text-foreground font-bold tabular-nums">
                {loading ? '—' : `৳ ${formatNumber(totalStockValue)}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
              <button 
                onClick={handlePrint}
                disabled={loading}
                className="px-3 py-1.5 bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 text-[10px] font-bold uppercase rounded-lg shadow-sm disabled:opacity-50"
              >
                <Printer className="w-3.5 h-3.5" />
                {t('common.print')}
              </button>
              <button 
                onClick={handleDownloadExcel}
                disabled={loading || finalFilteredItems.length === 0}
                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 text-[10px] font-bold uppercase rounded-lg shadow-sm"
                title="Export Genuine Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> EXCEL
              </button>
              <button 
                onClick={handleDownload}
                disabled={loading || finalFilteredItems.length === 0}
                className="px-3 py-1.5 bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase rounded-lg shadow-sm"
                title={t('common.csv')}
              >
                <Download className="w-3 h-3" /> {t('common.csv')}
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={loading || finalFilteredItems.length === 0}
                className="px-3 py-1.5 bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2 disabled:opacity-50 text-[10px] font-bold uppercase rounded-lg shadow-sm"
                title={t('common.pdf')}
              >
                <Download className="w-3 h-3" /> {t('common.pdf')}
              </button>
              <button 
                onClick={handleEmailReport}
                disabled={loading || finalFilteredItems.length === 0}
                className="px-3 py-1.5 bg-card border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 disabled:opacity-50 text-[10px] font-bold uppercase rounded-lg shadow-sm"
                title="Share Stock Summary via Email"
              >
                <Mail className="w-3.5 h-3.5" /> EMAIL
              </button>
              <button 
                onClick={() => setIsQuickItemOpen(true)}
                disabled={loading}
                className="px-3 py-1.5 bg-amber-600/10 border border-amber-600/20 text-amber-600 hover:bg-amber-600 hover:text-white transition-all flex items-center gap-2 text-[10px] font-bold uppercase rounded-lg shadow-sm disabled:opacity-50"
                title={t('stock.quickCreateItem')}
              >
                <Package className="w-3.5 h-3.5" /> {t('item.new')}
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center bg-card border border-border rounded-xl px-4 py-2.5 gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <input
                type="text"
                placeholder={t('stock.searchPlaceholder')}
                value={search || ''}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-foreground pl-10 pr-4 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
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
                  className="bg-background border border-border rounded-lg text-foreground px-3 py-1.5 text-[10px] uppercase tracking-widest outline-none focus:border-primary transition-colors"
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
                <label htmlFor="lowStockOnly" className="text-[10px] text-muted-foreground uppercase tracking-widest cursor-pointer whitespace-nowrap">
                  {t('stock.lowStockOnly')}
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-4 justify-end">
            <button 
              onClick={handleRecalculateAll}
              disabled={recalculating || loading}
              className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground disabled:opacity-50"
            >
              {recalculating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Activity className="w-3 h-3" />}
              {t('common.recalculate')}
            </button>
            <button className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest hover:text-foreground">
              <Filter className="w-3 h-3" /> {t('common.f12Configure')}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content Section */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <div id="stock-summary-report" className="min-h-full flex flex-col bg-background">
          <div className="p-4 lg:p-6 flex-1 flex flex-col">
          {loading ? (
            <SkeletonLoader type="table" pageKey="inventory" isFullPage={false} />
          ) : (
          <>
          {/* Mobile View: Cards */}
          <div className="block lg:hidden divide-y divide-border/50 bg-card border border-border rounded-xl overflow-hidden">
            {groupsToRender.map(groupName => {
              const groupItems = activeGroupedItems[groupName] || [];
              const groupOpening = groupItems.reduce((sum, i) => sum + (i.opening || 0), 0);
              const groupInward = groupItems.reduce((sum, i) => sum + (i.inward || 0), 0);
              const groupOutward = groupItems.reduce((sum, i) => sum + (i.outward || 0), 0);
              const groupQty = groupItems.reduce((sum, i) => sum + (i.displayStock || 0), 0);
              const groupValue = groupItems.reduce((sum, i) => sum + ((i.displayStock || 0) * (i.avg_cost || i.opening_rate || 0)), 0);
              const isExpanded = expandedGroups.has(groupName) || search.length > 0;

              return (
                <div key={groupName} className="flex flex-col">
                  <div 
                    onClick={() => toggleGroup(groupName)}
                    className="p-4 bg-muted/20 flex justify-between items-center cursor-pointer hover:bg-muted/80 transition-colors border-l-4 border-transparent hover:border-primary"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                      <span className="text-xs font-bold text-foreground uppercase tracking-tight">
                        {highlightText(groupName, search)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase">{t('common.totalValue')}</p>
                      <p className="text-xs font-bold text-foreground tabular-nums">৳ {formatNumber(groupValue)}</p>
                    </div>
                  </div>
                  {isExpanded && groupItems.map(item => {
                    const itemUnit = getItemUnit(item);
                    return (
                    <div 
                      key={item.id} 
                      onClick={() => {
                        navigate(`/reports/stock-item?id=${item.id}&from=${startDate}&to=${endDate}`);
                      }}
                      className="p-4 pl-8 border-t border-border/30 space-y-2 hover:bg-muted/60 transition-colors cursor-pointer border-l-4 border-transparent hover:border-primary/40"
                    >
                      <div className="flex justify-between items-start">
                        <span className="text-xs text-foreground/80 italic">
                          {highlightText(item.name, search)}
                        </span>
                        <span className="text-xs font-bold text-foreground tabular-nums">{formatQuantity(item.displayStock, itemUnit)}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="text-[9px] text-muted-foreground uppercase">
                          Op: <span className="text-foreground font-bold tabular-nums">{formatQuantity(item.opening, itemUnit)}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase text-right">
                          In: <span className="text-foreground font-bold tabular-nums">{formatQuantity(item.inward, itemUnit)}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase">
                          Out: <span className="text-foreground font-bold tabular-nums">{formatQuantity(item.outward, itemUnit)}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground uppercase text-right font-bold text-foreground">
                          Val: <span className="tabular-nums">৳ {formatNumber(item.displayStock * (item.avg_cost || item.opening_rate || 0))}</span>
                        </div>
                      </div>
                    </div>
                    );
                  })}
                </div>
              );
            })}
            {filteredGroups.length === 0 && (
              <div className="p-10 text-center text-muted-foreground uppercase tracking-widest text-[10px]">{t('stock.noItems')}</div>
            )}
            {/* Grand Total Mobile */}
            <div className="p-4 bg-muted/40 flex justify-between items-center font-bold">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('common.grandTotal')}</span>
              <div className="text-right">
                <p className="text-sm text-foreground tabular-nums">৳ {formatNumber(totalStockValue)}</p>
              </div>
            </div>
          </div>

          {/* Desktop View: Table */}
          <div className="hidden lg:block relative flex-1 bg-card border border-border rounded-xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-[11px] min-w-[800px] border-separate border-spacing-0 h-full">
              <thead className="sticky top-0 z-20 bg-muted/95 backdrop-blur-sm shadow-sm ring-1 ring-border">
                <tr className="text-muted-foreground uppercase text-[9px] font-bold tracking-widest">
                  <th className="px-4 py-3 font-medium border-b border-border sticky top-0 bg-inherit align-middle">{t('common.particulars')}</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 bg-inherit border-l align-middle">Opening</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 bg-inherit border-l align-middle">Inward</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 bg-inherit border-l align-middle">Outward</th>
                  <th className="px-4 py-3 font-medium text-right w-24 border-b border-border sticky top-0 border-l bg-amber-600 text-white z-10 shadow-sm align-middle">{t('common.quantity')}</th>
                  <th className="px-4 py-3 font-medium text-right w-28 border-b border-border sticky top-0 bg-inherit border-l align-middle">Rate (Avg)</th>
                  <th className="px-4 py-3 font-medium text-right w-32 border-b border-border sticky top-0 bg-inherit border-l align-middle">{t('common.value')} (৳)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 bg-card">
                {groupsToRender.map(groupName => {
                  const groupItems = activeGroupedItems[groupName] || [];
                  const groupOpening = groupItems.reduce((sum, i) => sum + (i.opening || 0), 0);
                  const groupInward = groupItems.reduce((sum, i) => sum + (i.inward || 0), 0);
                  const groupOutward = groupItems.reduce((sum, i) => sum + (i.outward || 0), 0);
                  const groupQty = groupItems.reduce((sum, i) => sum + (i.displayStock || 0), 0);
                  const groupValue = groupItems.reduce((sum, i) => sum + ((i.displayStock || 0) * (i.avg_cost || i.opening_rate || 0)), 0);
                  const groupAggregateUnit = aggregateUnitForItems(groupItems);
                  const isExpanded = expandedGroups.has(groupName) || search.length > 0;

                  return (
                    <React.Fragment key={groupName}>
                      <tr 
                        onClick={() => toggleGroup(groupName)}
                        className="hover:bg-muted/80 transition-colors cursor-pointer group border-l-4 border-transparent hover:border-primary"
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                            <span className="text-foreground font-bold uppercase tracking-tight">
                              {highlightText(groupName, search)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums font-bold border-l border-border/10 align-middle">
                          {formatQuantity(groupOpening, groupAggregateUnit || undefined)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums font-bold border-l border-border/10 align-middle">
                          {formatQuantity(groupInward, groupAggregateUnit || undefined)}
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums font-bold border-l border-border/10 align-middle">
                          {formatQuantity(groupOutward, groupAggregateUnit || undefined)}
                        </td>
                        <td className="px-4 py-3 text-right text-amber-700 tabular-nums font-bold border-l border-amber-500/10 bg-amber-500/5 align-middle">
                          {formatQuantity(groupQty, groupAggregateUnit || undefined)}
                        </td>
                        <td className="px-4 py-3 text-right text-muted-foreground border-l border-border/10 align-middle">
                          -
                        </td>
                        <td className="px-4 py-3 text-right text-foreground tabular-nums font-bold border-l border-border/10 align-middle">
                          {formatNumber(groupValue)}
                        </td>
                      </tr>
                      {isExpanded && groupItems.map(item => {
                        const itemUnit = getItemUnit(item);
                        return (
                        <tr 
                          key={item.id} 
                          onClick={() => {
                            navigate(`/reports/stock-item?id=${item.id}&from=${startDate}&to=${endDate}`);
                          }}
                          className={cn("bg-muted/5 hover:bg-muted/60 transition-colors group/item cursor-pointer border-l-4 border-transparent hover:border-primary/40", item.isLowStock && "bg-rose-500/5")}
                        >
                        <td className="px-10 py-2.5 text-foreground/60 italic align-middle">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary transition-colors" />
                            {highlightText(item.name, search)}
                            {item.isLowStock && (
                              <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[8px] font-bold uppercase rounded flex items-center gap-1">
                                <AlertTriangle className="w-2 h-2" /> Low
                              </span>
                            )}
                          </div>
                        </td>
                         <td className="px-4 py-2.5 text-right text-foreground/60 tabular-nums border-l border-border/5 align-middle">
                           {formatQuantity(item.opening, itemUnit)}
                         </td>
                         <td className="px-4 py-2.5 text-right text-foreground/60 tabular-nums border-l border-border/5 align-middle">
                           {formatQuantity(item.inward, itemUnit)}
                         </td>
                         <td className="px-4 py-2.5 text-right text-foreground/60 tabular-nums border-l border-border/5 align-middle">
                           {formatQuantity(item.outward, itemUnit)}
                         </td>
                         <td className="px-4 py-2.5 text-right text-amber-700 font-bold tabular-nums border-l border-amber-500/20 bg-amber-500/10 align-middle">
                           {formatQuantity(item.displayStock, itemUnit)}
                         </td>
                           <td className="px-4 py-2.5 text-right text-foreground/80 tabular-nums border-l border-border/5 align-middle">
                             {formatNumber(item.avg_cost || item.opening_rate || 0)}
                           </td>
                           <td className="px-4 py-2.5 text-right text-foreground/80 tabular-nums border-l border-border/5 align-middle">
                             {formatNumber(item.displayStock * (item.avg_cost || item.opening_rate || 0))}
                           </td>
                        </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
                {filteredGroups.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-muted-foreground uppercase tracking-widest align-middle">{t('stock.noItems')}</td>
                  </tr>
                )}
              </tbody>
              <tfoot className="bg-background border-t-2 border-border sticky bottom-0 text-[10px] z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <tr className="font-bold text-foreground bg-background">
                  <td className="px-4 py-3 uppercase text-[9px] text-muted-foreground tracking-widest bg-background align-middle">{t('common.grandTotal')}</td>
                  <td className="px-4 py-3 text-right tabular-nums border-l border-border bg-background align-middle">
                    {formatQuantity(grandOpening, grandAggregateUnit || undefined)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums border-l border-border bg-background align-middle">
                    {formatQuantity(grandInward, grandAggregateUnit || undefined)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums border-l border-border bg-background align-middle">
                    {formatQuantity(grandOutward, grandAggregateUnit || undefined)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums border-l border-amber-600 bg-amber-600 text-white align-middle">
                    {formatQuantity(grandClosing, grandAggregateUnit || undefined)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums border-l border-border bg-background align-middle">
                    -
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums border-l border-border bg-background align-middle">
                    <span>৳ {formatNumber(totalStockValue)}</span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          </>
          )}
        </div>

        {/* Stock Valuation Method Note */}
        <div className="flex justify-between items-center px-4 lg:px-6 pb-3 text-[9px] text-muted-foreground uppercase tracking-[0.2em]">
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

