import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Search, Filter, History, Package, Printer, Download } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, formatNumber, cn } from '../lib/utils';
import { DateInput } from './DateInput';
import { formatDate as formatReportDate } from '../utils/dateUtils';
import { exportToPDF } from '../utils/exportUtils';
import { printElement } from '../utils/printUtils';

export function StockItemReport() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const locationState = location.state as { itemId?: string } | null;
  const { t } = useLanguage();
  const settings = useSettings();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [selectedGodown, setSelectedGodown] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [openingBalance, setOpeningBalance] = useState(0);
  const [openingValue, setOpeningValue] = useState(0);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    // Default to Jan 1st of current year as requested
    return new Date(d.getFullYear(), 0, 1).toLocaleDateString('en-CA');
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toLocaleDateString('en-CA');
  });

  const filteredItems = items.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.part_no || '').toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const [summaryData, setSummaryData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'summary' | 'transactions'>('summary');
  const [viewType, setViewType] = useState<'monthly' | 'daily'>('monthly');

  useEffect(() => {
    async function fetchData() {
      if (!user?.companyId) return;
      try {
        const [stockItems, unitsRes, godownsRes] = await Promise.all([
          erpService.getItems(user.companyId),
          erpService.getCollection('units', user.companyId),
          erpService.getGodowns(user.companyId)
        ]);
        setItems(stockItems);
        setUnits(unitsRes);
        setGodowns(godownsRes || []);
        
        const forceId = searchParams.get('id') || locationState?.itemId;
        if (forceId) {
          const item = stockItems.find(i => String(i.id) === String(forceId));
          if (item) {
            handleItemSelect(item, stockItems, unitsRes, startDate, endDate);
          }
        } else if (stockItems.length > 0) {
          handleItemSelect(stockItems[0], stockItems, unitsRes, startDate, endDate);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user?.companyId]);

  // Handle filter change
  useEffect(() => {
    if (selectedItem) {
      handleItemSelect(selectedItem, items, units, startDate, endDate);
    }
  }, [startDate, endDate, selectedGodown]);

  async function handleItemSelect(item: any, allItems: any[] = items, allUnits: any[] = units, from: string = startDate, to: string = endDate) {
    const itemWithUnit = {
      ...item,
      unitName: allUnits.find(u => u.id === item.unit_id)?.name || item.unit || 'pcs'
    };
    setSelectedItem(itemWithUnit);
    setActiveIndex(-1);
    setLoading(true);
    try {
      const [allInvEntries, allVouchers] = await Promise.all([
        erpService.getCollection('inventory_entries', user!.companyId),
        erpService.getCollection('vouchers', user!.companyId)
      ]);
      
      const voucherMap = allVouchers.reduce((acc: any, v: any) => {
        acc[v.id] = v;
        return acc;
      }, {});
      // Parse dates consistently as local midnight to avoid timezone shifts
      const parseLocal = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, m - 1, d);
      };

      const start = parseLocal(from);
      const end = parseLocal(to);
      end.setHours(23, 59, 59, 999); // Include entire end day
      
      // Calculate Opening Balance (sum of all entries before START date)
      const openingEntries = allInvEntries.filter((e: any) => {
        if (String(e.item_id) !== String(item.id)) return false;
        if (selectedGodown && e.godown_id !== selectedGodown) return false;
        let dateObj: Date;
        if (e.date && typeof e.date === 'string' && e.date.includes('-')) {
          dateObj = parseLocal(e.date);
        } else {
          dateObj = new Date(e.date || e.created_at?.toDate?.() || 0);
        }
        return dateObj < start;
      });

      // Include master opening_qty and opening_qty * opening_rate in the initial opening calculations
      // User specifically requested: (Global Opening + Filtered transactions)
      const initialQty = Number(item.opening_qty) || 0;
      const initialValue = initialQty * (Number(item.opening_rate) || 0);

      const openingBalance = openingEntries.reduce((sum, e) => {
        const total = (e.qty || 0) + (e.free_qty || 0);
        return sum + (e.movement_type === 'Inward' ? total : -total);
      }, initialQty);

      const openingValue = openingEntries.reduce((sum, e) => {
        const val = (e.qty || 0) * (e.rate || 0);
        return sum + (e.movement_type === 'Inward' ? val : -val);
      }, initialValue);

      setOpeningBalance(openingBalance);
      setOpeningValue(openingValue);

      const itemEntries = allInvEntries.filter((e: any) => {
        if (String(e.item_id) !== String(item.id)) return false;
        if (selectedGodown && e.godown_id !== selectedGodown) return false;
        
        // Robust date parsing for YYYY-MM-DD or Timestamp
        let dateObj: Date;
        if (e.date && typeof e.date === 'string' && e.date.includes('-')) {
          dateObj = parseLocal(e.date);
        } else {
          dateObj = new Date(e.date || e.created_at?.toDate?.() || 0);
        }
        
        return dateObj >= start && dateObj <= end;
      });

      // Decide view type: if range < 90 days or specific dates requested, show daily
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays <= 31) {
        setViewType('daily');
        // Daily summary
        const days: any[] = [];
        let curr = new Date(start);
        
        // Helper to get YYYY-MM-DD from Date without timezone shift
        const toYMD = (d: Date) => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        // Add Opening Row
        days.push({
          label: 'Opening Balance',
          isOpening: true,
          inwardQty: 0,
          inwardValue: 0,
          outwardQty: 0,
          outwardValue: 0,
          closingQty: openingBalance,
          closingValue: openingValue
        });

        let runningQty = openingBalance;
        let runningVal = openingValue;

        while (curr <= end) {
          const targetStr = toYMD(curr);
          const dayEntries = itemEntries.filter(e => {
            if (e.date) return e.date === targetStr;
            const ed = new Date(e.created_at?.toDate?.() || 0);
            return toYMD(ed) === targetStr;
          });
          
          const inward = dayEntries.filter((e: any) => (e.movement_type || '').toLowerCase() === 'inward');
          const outward = dayEntries.filter((e: any) => (e.movement_type || '').toLowerCase() === 'outward');

          const inQty = inward.reduce((sum, e) => sum + (e.qty + (e.free_qty || 0)), 0);
          const outQty = outward.reduce((sum, e) => sum + (e.qty + (e.free_qty || 0)), 0);
          const inVal = inward.reduce((sum, e) => sum + (e.qty * (e.rate || 0)), 0);
          const outVal = outward.reduce((sum, e) => sum + (e.qty * (e.rate || 0)), 0);

          runningQty += (inQty - outQty);
          runningVal += (inVal - outVal);

          days.push({
            label: targetStr,
            inwardQty: inQty,
            inwardValue: inVal,
            outwardQty: outQty,
            outwardValue: outVal,
            closingQty: runningQty,
            closingValue: runningVal
          });
          curr.setDate(curr.getDate() + 1);
        }
        setSummaryData(days);
      } else {
        setViewType('monthly');
        // Group by month
        const summary = [];
        let curr = new Date(start);
        curr.setDate(1); // start of month
        
        // Add Opening Row
        summary.push({
          label: 'Opening Balance',
          isOpening: true,
          inwardQty: 0,
          inwardValue: 0,
          outwardQty: 0,
          outwardValue: 0,
          closingQty: openingBalance,
          closingValue: openingValue
        });

        let runningQty = openingBalance;
        let runningVal = openingValue;

        while (curr <= end) {
          const monthIdx = curr.getMonth();
          const year = curr.getFullYear();
          
          const mEntries = itemEntries.filter((e: any) => {
            let dateObj: Date;
            if (e.date && typeof e.date === 'string' && e.date.includes('-')) {
              const [y, m, d] = e.date.split('-').map(Number);
              dateObj = new Date(y, m - 1, d);
            } else {
              dateObj = new Date(e.date || e.created_at?.toDate?.() || 0);
            }
            // Ensure we compare against normalized month/year from local date
            return dateObj.getMonth() === monthIdx && dateObj.getFullYear() === year;
          });

          const inward = mEntries.filter((e: any) => (e.movement_type || '').toLowerCase() === 'inward');
          const outward = mEntries.filter((e: any) => (e.movement_type || '').toLowerCase() === 'outward');

          const inQty = inward.reduce((sum, e) => sum + (e.qty + (e.free_qty || 0)), 0);
          const outQty = outward.reduce((sum, e) => sum + (e.qty + (e.free_qty || 0)), 0);
          const inVal = inward.reduce((sum, e) => sum + (e.qty * (e.rate || 0)), 0);
          const outVal = outward.reduce((sum, e) => sum + (e.qty * (e.rate || 0)), 0);

          runningQty += (inQty - outQty);
          runningVal += (inVal - outVal);

          summary.push({
            label: curr.toLocaleString('default', { month: 'short', year: 'numeric' }),
            inwardQty: inQty,
            inwardValue: inVal,
            outwardQty: outQty,
            outwardValue: outVal,
            closingQty: runningQty,
            closingValue: runningVal
          });
          
          curr.setMonth(curr.getMonth() + 1);
        }
        setSummaryData(summary);
      }

      const openingBalanceRow = {
        date: from,
        v_type: 'Opening',
        v_no: '-',
        party_name: 'Opening Balance',
        qty: openingBalance,
        rate: openingBalance > 0 ? openingValue / openingBalance : 0,
        amount: openingValue,
        movement_type: 'Inward',
        isOpening: true
      };

      // Prepare raw transactions
      const detailedTransactions = [
        openingBalanceRow,
        ...itemEntries.map((e: any) => {
          const v = voucherMap[e.voucher_id] || {};
          return {
            ...e,
            v_no: v.v_no || 'N/A',
            v_type: v.v_type || 'N/A',
            party_name: v.particulars || v.party_ledger_name || 'N/A',
            v_id: v.id
          };
        }).sort((a, b) => {
          const dateA = a.date || (a.created_at?.toDate?.() || 0);
          const dateB = b.date || (b.created_at?.toDate?.() || 0);
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
      ];
      setTransactions(detailedTransactions);

    } catch (err) {
      console.error('Error calculating summary:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatQty = (qty: number) => {
    if (qty === 0) return '-';
    const isPcs = selectedItem?.unitName?.toLowerCase() === 'pcs';
    if (isPcs) return Math.round(qty).toString();
    return formatNumber(qty);
  };

  const handleDownloadPDF = () => {
    if (!selectedItem) return;

    if (viewMode === 'summary') {
      const unit = selectedItem.unitName || 'Qty';
      const label = viewType === 'daily' ? 'Date' : 'Month';
      
      const exportData = [
        {
          [label.toLowerCase()]: 'Opening Balance',
          [`inward_(${unit.toLowerCase()})`]: '',
          'inward_val': '',
          [`outward_(${unit.toLowerCase()})`]: '',
          'outward_val': '',
          [`closing_(${unit.toLowerCase()})`]: formatQty(openingBalance)
        },
        ...summaryData.map(m => {
          const row: any = {};
          row[label.toLowerCase()] = viewType === 'daily' ? formatReportDate(m.label, settings.dateFormat) : m.label;
          row[`inward_(${unit.toLowerCase()})`] = formatQty(m.inwardQty);
          row['inward_val'] = m.inwardValue;
          row[`outward_(${unit.toLowerCase()})`] = formatQty(m.outwardQty);
          row['outward_val'] = m.outwardValue;
          row[`closing_(${unit.toLowerCase()})`] = formatQty(m.closingQty);
          return row;
        })
      ];

      exportToPDF(
        `Stock_Item_${selectedItem.name}_Summary`, 
        `Stock Item ${viewType === 'daily' ? 'Daily' : 'Monthly'} Summary: ${selectedItem.name}`, 
        exportData, 
        [label, `Inward (${unit})`, 'Inward Val', `Outward (${unit})`, 'Outward Val', `Closing (${unit})`], 
        settings
      );
    } else {
      const unit = selectedItem.unitName || 'Qty';
      const exportData = [
        {
          'date': 'Opening Balance',
          'type': '',
          'vch_no': '',
          'particulars': '',
          [`qty_(${unit.toLowerCase()})`]: formatQty(openingBalance),
          'rate': '',
          'amount': formatCurrency(openingValue)
        },
        ...transactions.map(tx => {
          const row: any = {};
          row['date'] = formatReportDate(tx.date || tx.created_at?.toDate?.() || '', settings.dateFormat);
          row['type'] = tx.v_type;
          row['vch_no'] = tx.v_no;
          row['particulars'] = tx.party_name;
          row[`qty_(${unit.toLowerCase()})`] = formatQty(tx.qty + (tx.free_qty || 0));
          row['rate'] = tx.rate;
          row['amount'] = tx.qty * tx.rate;
          return row;
        })
      ];

      exportToPDF(
        `Stock_Item_${selectedItem.name}_Transactions`, 
        `Stock Item Transactions: ${selectedItem.name}`, 
        exportData, 
        ['Date', 'Type', 'Vch No', 'Particulars', `Qty (${unit})`, 'Rate', 'Amount'], 
        settings
      );
    }
  };

  const handlePrint = () => {
    if (!selectedItem) return;
    const title = viewMode === 'summary' 
      ? `STOCK ITEM SUMMARY - ${selectedItem.name.toUpperCase()}`
      : `STOCK ITEM TRANSACTIONS - ${selectedItem.name.toUpperCase()}`;
    printElement('stock-item-report-table', title, settings);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev + 1 >= filteredItems.length ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev - 1 < 0 ? filteredItems.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < filteredItems.length) {
        e.preventDefault();
        handleItemSelect(filteredItems[activeIndex]);
      }
    }
  };

  if (loading && !selectedItem) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold text-gray-900">{t('stockItem.title')}</h1>
            <div className="flex items-center gap-1 mt-1">
              <button 
                onClick={() => setViewMode('summary')}
                className={cn(
                  "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                  viewMode === 'summary' ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                Summary
              </button>
              <button 
                onClick={() => setViewMode('transactions')}
                className={cn(
                  "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all",
                  viewMode === 'transactions' ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                Transactions
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedGodown}
                onChange={(e) => setSelectedGodown(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-gray-900 outline-none focus:ring-0"
              >
                <option value="">All Godowns</option>
                {godowns.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
              <DateInput 
                value={startDate}
                onChange={setStartDate}
                className="w-32 py-1"
              />
              <span className="text-gray-400 font-bold uppercase text-[9px] px-2 italic">To</span>
              <DateInput 
                value={endDate}
                onChange={setEndDate}
                className="w-32 py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handlePrint}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                title="Print"
              >
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                title="Download PDF"
              >
                <Download className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
               <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder={t('stockItem.filterPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setActiveIndex(-1);
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-10 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 font-medium no-scrollbar">
              {filteredItems.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  onMouseEnter={() => setActiveIndex(idx)}
                  className={cn(
                    "w-full px-4 py-3 text-left transition-colors capitalize",
                    (selectedItem?.id === item.id || activeIndex === idx) ? "bg-primary/5 border-l-4 border-primary" : "hover:bg-gray-50"
                  )}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedItem ? (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-bold text-gray-900 capitalize">{selectedItem.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {t('stockItem.currentStock')} <span className="font-bold text-primary">{formatNumber(selectedItem.current_stock)} {selectedItem.unitName}</span>
                </div>
              </div>
              
              <div id="stock-item-report-table" className="overflow-x-auto print:p-8 overflow-y-auto max-h-[600px] no-scrollbar">
                {viewMode === 'summary' ? (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500 sticky top-0 z-10 h-10">
                        <th rowSpan={2} className="px-6 py-0 border-r border-gray-100 bg-gray-100 align-middle">
                          {viewType === 'daily' ? 'Date' : t('stockItem.month')}
                        </th>
                        <th colSpan={2} className="px-6 py-1 text-center border-b border-gray-100 bg-green-100 text-green-700">{t('stockItem.inward')} ({selectedItem.unitName})</th>
                        <th colSpan={2} className="px-6 py-1 text-center border-b border-gray-100 bg-red-100 text-red-700">{t('stockItem.outward')} ({selectedItem.unitName})</th>
                        <th rowSpan={2} className="px-6 py-0 text-right bg-gray-100 align-middle">Closing ({selectedItem.unitName})</th>
                      </tr>
                      <tr className="bg-gray-100 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500 sticky top-[40px] z-10 h-10">
                        <th className="px-6 py-0 text-right bg-green-50 align-middle">{t('stockItem.qty')}</th>
                        <th className="px-6 py-0 text-right border-r border-gray-100 bg-green-50 align-middle">{t('stockItem.val')}</th>
                        <th className="px-6 py-0 text-right bg-red-50 align-middle">{t('stockItem.qty')}</th>
                        <th className="px-6 py-0 text-right bg-red-50 align-middle">{t('stockItem.val')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr className="bg-gray-50/50 italic">
                        <td className="px-6 py-3 font-medium text-gray-500 border-r border-gray-100">
                          Opening Balance
                        </td>
                        <td className="px-6 py-3 text-right">-</td>
                        <td className="px-6 py-3 text-right border-r border-gray-100">-</td>
                        <td className="px-6 py-3 text-right">-</td>
                        <td className="px-6 py-3 text-right">-</td>
                        <td className="px-6 py-3 text-right font-bold text-gray-400">
                          {formatQty(openingBalance)}
                        </td>
                      </tr>
                      {summaryData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-3 font-medium text-gray-900 border-r border-gray-100">
                            {viewType === 'daily' ? formatReportDate(row.label, settings.dateFormat) : row.label}
                          </td>
                          <td className="px-6 py-3 text-right text-green-600">
                            {formatQty(row.inwardQty)}
                          </td>
                          <td className="px-6 py-3 text-right text-green-700 border-r border-gray-100">
                            {row.inwardValue > 0 ? formatCurrency(row.inwardValue) : '-'}
                          </td>
                          <td className="px-6 py-3 text-right text-red-600">
                            {formatQty(row.outwardQty)}
                          </td>
                          <td className="px-6 py-3 text-right text-red-700">
                            {row.outwardValue > 0 ? formatCurrency(row.outwardValue) : '-'}
                          </td>
                          <td className="px-6 py-3 text-right font-bold text-primary">
                            {formatQty(row.closingQty)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200 sticky bottom-0">
                      <tr>
                        <td className="px-6 py-4 border-r border-gray-100 uppercase text-[10px]">{t('common.total')}</td>
                        <td className="px-6 py-4 text-right">
                          {formatQty(summaryData.reduce((sum, m) => sum + m.inwardQty, 0))}
                        </td>
                        <td className="px-6 py-4 text-right border-r border-gray-100">
                          {formatCurrency(summaryData.reduce((sum, m) => sum + m.inwardValue, 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatQty(summaryData.reduce((sum, m) => sum + m.outwardQty, 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(summaryData.reduce((sum, m) => sum + m.outwardValue, 0))}
                        </td>
                        <td className="px-6 py-4 text-right text-primary">
                          {formatQty(summaryData.reduce((sum, m) => sum + (m.inwardQty - m.outwardQty), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-100 border-b border-gray-200 text-[10px] uppercase font-bold tracking-widest text-gray-500 sticky top-0 z-10 h-10">
                        <th className="px-6 py-2">Date</th>
                        <th className="px-6 py-2">Type</th>
                        <th className="px-6 py-2">Vch No</th>
                        <th className="px-6 py-2">Particulars</th>
                        <th className="px-6 py-2 text-right">Qty ({selectedItem.unitName})</th>
                        <th className="px-6 py-2 text-right">Rate</th>
                        <th className="px-6 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.length > 0 ? (
                        <>
                          <tr className="bg-gray-50/50 italic border-b border-gray-100">
                            <td className="px-6 py-3 text-sm text-gray-500 font-medium">Opening Balance</td>
                            <td colSpan={3}></td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-400 italic">
                              {formatQty(openingBalance)}
                            </td>
                            <td></td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-400 italic">
                              {formatCurrency(openingValue)}
                            </td>
                          </tr>
                          {transactions.map((tx, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => tx.v_id && navigate('/vouchers', { state: { editId: tx.v_id } })}
                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-3 text-sm text-gray-900 group-hover:text-primary">
                              {formatReportDate(tx.date || tx.created_at?.toDate?.() || '', settings.dateFormat)}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                              {tx.v_type}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {tx.v_no}
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900 capitalize">
                              {tx.party_name}
                            </td>
                            <td className={cn(
                              "px-6 py-3 text-sm text-right font-bold",
                              tx.movement_type === 'Inward' ? "text-green-600" : "text-red-600"
                            )}>
                              {formatQty(tx.qty + (tx.free_qty || 0))}
                            </td>
                            <td className="px-6 py-3 text-sm text-right text-gray-600">
                              {formatCurrency(tx.rate)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                              {formatCurrency(tx.qty * tx.rate)}
                            </td>
                          </tr>
                          ))}
                        </>
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">
                            No transactions found for this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          ) : (
             <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 italic">
              {t('stockItem.selectPrompt')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
