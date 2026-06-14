import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Search, Filter, History, Package, Printer, Download } from 'lucide-react';
import { SkeletonLoader } from './SkeletonLoader';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, formatNumber, formatQuantity, cn, ensureDate, parseEntryDate, getMovementType } from '../lib/utils';
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
      
      // Calculate Auto Serial Numbers
      const sortedVouchers = [...allVouchers].sort((a, b) => {
        const dateComp = (a.v_date || '').localeCompare(b.v_date || '');
        if (dateComp !== 0) return dateComp;

        // Try numeric sort for Ref No (v_no)
        const numA = parseInt(a.v_no?.toString().replace(/\D/g, '') || '0') || 0;
        const numB = parseInt(b.v_no?.toString().replace(/\D/g, '') || '0') || 0;
        if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

        // Fallback to saved serial_no
        const sA = Number(a.serial_no || a.auto_serial_no) || 0;
        const sB = Number(b.serial_no || b.auto_serial_no) || 0;
        if (sA !== sB) return sA - sB;

        // Lexicographical fallback
        const vNoComp = (a.v_no || '').toString().localeCompare((b.v_no || '').toString());
        if (vNoComp !== 0) return vNoComp;

        // Time fallback
        const timeA = ensureDate(a.createdAt || a.created_at).getTime();
        const timeB = ensureDate(b.createdAt || b.created_at).getTime();
        if (timeA !== timeB) return timeA - timeB;

        return a.id.localeCompare(b.id);
      });

      const typeCounters: Record<string, number> = {};
      const serialMap: Record<string, number> = {};
      sortedVouchers.forEach(v => {
        typeCounters[v.v_type] = (typeCounters[v.v_type] || 0) + 1;
        serialMap[v.id] = typeCounters[v.v_type];
      });

      const voucherMap = allVouchers.reduce((acc: any, v: any) => {
        acc[v.id] = { ...v, serial_no: serialMap[v.id] || v.serial_no || v.auto_serial_no };
        return acc;
      }, {});

      const compareRecordSequence = (a: any, b: any) => {
        // 1. Midnight local date comparison (for dates themselves)
        const d_a = parseEntryDate(a.date, a.v_createdAt || a.created_at);
        const d_b = parseEntryDate(b.date, b.v_createdAt || b.created_at);
        if (d_a.getTime() !== d_b.getTime()) return d_a.getTime() - d_b.getTime();
        
        // 2. Movement type (Inward viz. Purchase/Inward first, outward viz. Sales/Outward later)
        const mTypeA = a.m_type || getMovementType(a);
        const mTypeB = b.m_type || getMovementType(b);
        if (mTypeA !== mTypeB) {
          return mTypeA === 'inward' ? -1 : 1;
        }

        // 3. Try numeric sort for Ref No (v_no)
        const vNoA = String(a.v_no || '');
        const vNoB = String(b.v_no || '');
        const numA = parseInt(vNoA.replace(/\D/g, '') || '0') || 0;
        const numB = parseInt(vNoB.replace(/\D/g, '') || '0') || 0;
        if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

        // 4. Try auto-serial numbers
        const seqA = a.v_serial_no || a.serial_no || 0;
        const seqB = b.v_serial_no || b.serial_no || 0;
        if (seqA !== seqB) return seqA - seqB;

        // 5. Lexicographical fallback of v_no
        const vNoComp = vNoA.localeCompare(vNoB);
        if (vNoComp !== 0) return vNoComp;

        // 6. Time fallback
        const tsA = ensureDate(a.v_createdAt || a.created_at).getTime();
        const tsB = ensureDate(b.v_createdAt || b.created_at).getTime();
        if (tsA !== tsB) return tsA - tsB;

        // 7. Hard ID fallback
        return (a.id || '').localeCompare(b.id || '');
      };

      // Enrich entries with voucher data for more robust reporting
      const enrichedInvEntries = allInvEntries.map((e: any) => {
        const v = voucherMap[e.voucher_id] || {};
        const vType = (e.v_type || v.v_type || '').toString();
        
        const movementData = {
          ...e,
          v_type: vType,
          m_type: e.m_type || e.movement_type || e.entry_type || v.m_type || v.movement_type || ''
        };
        
        return {
          ...e,
          v_type: vType,
          date: e.date || v.v_date || '',
          m_type: getMovementType(movementData),
          v_no: v.v_no || 'N/A',
          v_serial_no: v.serial_no || e.serial_no || 0,
          v_createdAt: v.createdAt || v.created_at || null
        };
      });

        const start = parseEntryDate(from, null);
        const end = parseEntryDate(to, null);
        end.setHours(23, 59, 59, 999); 
      
      // Tracking godown balances for accurate simulation
      const godownBalances: Record<string, number> = {};
      (item.opening_godowns || []).forEach((ag: any) => {
        if (ag.godown_id) godownBalances[ag.godown_id] = Number(ag.qty) || 0;
      });
      let runningTotal = Number(item.opening_qty) || 0;

      // Filter and sort ALL entries for this item to correctly simulate history
      const sortedHistory = enrichedInvEntries
        .filter((e: any) => String(e.item_id) === String(item.id))
        .sort(compareRecordSequence);

      let openingBalance = selectedGodown ? (godownBalances[selectedGodown] || 0) : runningTotal;
      let openingValue = openingBalance * (Number(item.opening_rate) || 0);

      sortedHistory.forEach(e => {
        const dateObj = parseEntryDate(e.date, e.created_at);

        const qty = (Number(e.qty) || 0) + (Number(e.free_qty) || 0);
        const mType = getMovementType(e);
        const isPhysical = e.is_physical_snapshot === true || (e.v_type && e.v_type.toString().toLowerCase() === 'physical stock');
        const eGodownId = e.godown_id;

        let adj = 0;
        if (isPhysical) {
           if (eGodownId) {
             adj = qty - (Number(godownBalances[eGodownId]) || 0);
             godownBalances[eGodownId] = qty;
           } else {
             adj = qty - Number(runningTotal);
             runningTotal = qty;
             // Reset all godown records for this item when a global reset happens
             Object.keys(godownBalances).forEach(k => {
               godownBalances[k] = 0;
             });
           }
        } else {
           adj = mType === 'inward' ? qty : -qty;
           if (eGodownId) godownBalances[eGodownId] = (Number(godownBalances[eGodownId]) || 0) + adj;
        }
        
        if (!isPhysical || eGodownId) runningTotal = (Number(runningTotal) || 0) + adj;

        if (dateObj < start) {
           openingBalance = selectedGodown ? (godownBalances[selectedGodown] || 0) : runningTotal;
           // Value approximation
           if (mType === 'inward') openingValue += (qty * (e.rate || 0));
           else if (mType === 'outward') openingValue -= (qty * (e.rate || 0));
        }
      });

      setOpeningBalance(openingBalance);
      setOpeningValue(openingValue);

      const itemEntries = sortedHistory.filter((e: any) => {
        const dateObj = parseEntryDate(e.date, e.created_at);
        return dateObj >= start && dateObj <= end && (!selectedGodown || e.godown_id === selectedGodown);
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
          const targetDateObj = new Date(curr);
          const targetStr = toYMD(targetDateObj);
          const dayEntries = itemEntries.filter(e => {
            const eDate = parseEntryDate(e.date, e.created_at);
            return eDate.getFullYear() === targetDateObj.getFullYear() && 
                   eDate.getMonth() === targetDateObj.getMonth() && 
                   eDate.getDate() === targetDateObj.getDate();
          }); // Removed re-sort
          
          let dayInQty = 0;
          let dayInVal = 0;
          let dayOutQty = 0;
          let dayOutVal = 0;

          for (const e of dayEntries) {
            const qty_val = Number(e.qty) || 0;
            const free_qty_val = Number(e.free_qty) || 0;
            const total = qty_val + free_qty_val;
            const isPhysical = e.is_physical_snapshot === true || (e.v_type && e.v_type.toString().toLowerCase() === 'physical stock');
            const rate = Number(e.rate) || 0;
            const value = (total - free_qty_val) * rate;
            const mType = getMovementType(e);

            if (isPhysical) {
              let adj = total - runningQty;
              const curRate = Number(e.rate) || 0;
              if (adj >= 0) {
                dayInQty += adj;
                dayInVal += (adj * curRate);
              } else {
                dayOutQty += Math.abs(adj);
                dayOutVal += (Math.abs(adj) * curRate);
              }
              runningQty = total;
              if (curRate > 0) {
                runningVal = runningQty * curRate;
              } else {
                const prevTQ = runningQty - adj;
                runningVal = prevTQ > 0 ? (runningVal / prevTQ) * runningQty : 0;
              }
            } else if (mType === 'inward') {
              dayInQty += total;
              dayInVal += value;
              runningQty += total;
              runningVal += value;
            } else {
              dayOutQty += total;
              dayOutVal += value;
              runningQty -= total;
              runningVal -= value;
            }
          }

          days.push({
            label: targetStr,
            inwardQty: dayInQty,
            inwardValue: dayInVal,
            outwardQty: dayOutQty,
            outwardValue: dayOutVal,
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
            const dateObj = parseEntryDate(e.date, e.created_at);
            return dateObj.getMonth() === monthIdx && dateObj.getFullYear() === year;
          }); // Removed re-sort as itemEntries is already sorted by date+time

          let mInQty = 0;
          let mInVal = 0;
          let mOutQty = 0;
          let mOutVal = 0;

          for (const e of mEntries) {
            const qty_val = Number(e.qty) || 0;
            const free_qty_val = Number(e.free_qty) || 0;
            const total = qty_val + free_qty_val;
            const isPhysical = e.is_physical_snapshot === true || (e.v_type && e.v_type.toString().toLowerCase() === 'physical stock');
            const rate = Number(e.rate) || 0;
            const value = (total - free_qty_val) * rate;
            const mType = getMovementType(e);

            if (isPhysical) {
              let adj = total - runningQty;
              const curRate = Number(e.rate) || 0;
              if (adj >= 0) {
                mInQty += adj;
                mInVal += (adj * curRate);
              } else {
                mOutQty += Math.abs(adj);
                mOutVal += (Math.abs(adj) * curRate);
              }
              runningQty = total;
              if (curRate > 0) {
                runningVal = runningQty * curRate;
              } else {
                const prevTQ = runningQty - adj;
                runningVal = prevTQ > 0 ? (runningVal / prevTQ) * runningQty : 0;
              }
            } else if (mType === 'inward') {
              mInQty += total;
              mInVal += value;
              runningQty += total;
              runningVal += value;
            } else {
              mOutQty += total;
              mOutVal += value;
              runningQty -= total;
              runningVal -= value;
            }
          }

          summary.push({
            label: curr.toLocaleString('default', { month: 'short', year: 'numeric' }),
            inwardQty: mInQty,
            inwardValue: mInVal,
            outwardQty: mOutQty,
            outwardValue: mOutVal,
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

      // Prepare raw transactions with running balance
      let currentRunningBalance = openingBalance;
      const sortedEntries = itemEntries.map((e: any) => {
          const v = voucherMap[e.voucher_id] || {};
          return {
            ...e,
            date: e.date || v.v_date || '', // Prioritize entry date, fallback to voucher date
            v_no: v.v_no || 'N/A',
            v_type: v.v_type || 'N/A',
            party_name: v.particulars || v.party_ledger_name || 'N/A',
            v_id: v.id,
            created_at_time: e.created_at?.seconds || 0
          };
        }).sort(compareRecordSequence);

      const transactionsWithBalance = sortedEntries.map(tx => {
        const total = (tx.qty || 0) + (tx.free_qty || 0);
        const isPhysical = tx.is_physical_snapshot === true || (tx.v_type && tx.v_type.toString().toLowerCase() === 'physical stock');
        const mType = getMovementType(tx);

        if (isPhysical) {
          currentRunningBalance = total;
        } else {
          currentRunningBalance += (mType === 'inward' ? total : -total);
        }
        return { ...tx, closing_balance: currentRunningBalance };
      });

      setTransactions(transactionsWithBalance); // Remove .reverse() to show earliest first

    } catch (err) {
      console.error('Error calculating summary:', err);
    } finally {
      setLoading(false);
    }
  }

  const formatQty = (qty: number) => {
    if (qty === 0) return '-';
    return formatQuantity(qty, selectedItem?.unitName || '');
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
          row['vch_no'] = `${tx.v_no}${(tx.serial_no || tx.auto_serial_no) ? ` / SN:${tx.serial_no || tx.auto_serial_no}` : ''}`;
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
    return <SkeletonLoader type="table" />;
  }

  return (
    <div className="flex flex-col h-screen bg-background font-mono transition-colors overflow-hidden">
      {/* Fixed Header Section */}
      <div className="flex-none bg-background border-b border-border shadow-sm px-6 py-4 space-y-4 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-foreground uppercase tracking-tighter">{t('stockItem.title')}</h1>
              <div className="flex items-center gap-1 mt-1 font-bold">
                <button 
                  onClick={() => setViewMode('summary')}
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-all border border-transparent",
                    viewMode === 'summary' ? "bg-primary text-white border-primary" : "text-gray-500 hover:bg-muted border-border"
                  )}
                >
                  Summary
                </button>
                <button 
                  onClick={() => setViewMode('transactions')}
                  className={cn(
                    "px-3 py-1 text-[10px] uppercase tracking-wider rounded-sm transition-all border border-transparent",
                    viewMode === 'transactions' ? "bg-primary text-white border-primary" : "text-gray-500 hover:bg-muted border-border"
                  )}
                >
                  Transactions
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-sm px-3 py-1.5 focus-within:border-foreground transition-colors">
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
              <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-sm px-3 py-1.5 focus-within:border-foreground transition-colors">
                <DateInput 
                  value={startDate}
                  onChange={setStartDate}
                  className="w-28 py-0.5 text-[10px] border-0 bg-transparent shadow-none"
                />
                <span className="text-gray-400 font-bold uppercase text-[9px] px-1 italic">To</span>
                <DateInput 
                  value={endDate}
                  onChange={setEndDate}
                  className="w-28 py-0.5 text-[10px] border-0 bg-transparent shadow-none"
                />
              </div>
              <div className="flex items-center gap-2 border-l border-border pl-3 font-bold">
                <button 
                  onClick={handlePrint}
                  className="p-2 text-gray-500 hover:text-foreground hover:bg-muted rounded-sm transition-all"
                  title="Print"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleDownloadPDF}
                  className="p-2 text-gray-500 hover:text-foreground hover:bg-muted rounded-sm transition-all"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full p-6 grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col flex-1 overflow-hidden">
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

        <div className="lg:col-span-3 flex flex-col min-h-0">
          {selectedItem ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between flex-none">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-primary" />
                  <span className="font-bold text-gray-900 capitalize">{selectedItem.name}</span>
                </div>
                <div className="text-sm text-gray-500">
                  {t('stockItem.currentStock')} <span className="font-bold text-primary">{formatQty(selectedItem.current_stock)} {selectedItem.unitName}</span>
                </div>
              </div>
              
              <div id="stock-item-report-table" className="flex-1 overflow-x-auto print:p-8 overflow-y-auto no-scrollbar">
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
                        <tr 
                          key={idx} 
                          className="hover:bg-primary/5 transition-colors cursor-pointer group"
                          onClick={() => {
                            if (row.isOpening) return;
                            if (viewType === 'monthly') {
                              // Find start and end dates for this month
                              const dateParts = row.label.split(' ');
                              if (dateParts.length === 2) {
                                const monthName = dateParts[0];
                                const year = parseInt(dateParts[1]);
                                const monthIdx = new Date(Date.parse(monthName + " 1, 2012")).getMonth();
                                const firstDay = new Date(year, monthIdx, 1).toLocaleDateString('en-CA');
                                const lastDay = new Date(year, monthIdx + 1, 0).toLocaleDateString('en-CA');
                                setStartDate(firstDay);
                                setEndDate(lastDay);
                              }
                            } else if (viewType === 'daily') {
                              setStartDate(row.label);
                              setEndDate(row.label);
                            }
                            setViewMode('transactions');
                          }}
                        >
                          <td className="px-6 py-3 font-medium text-gray-900 border-r border-gray-100 group-hover:text-primary transition-colors">
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
                          {formatQty(summaryData.filter(m => !m.isOpening).reduce((sum, m) => sum + m.inwardQty, 0))}
                        </td>
                        <td className="px-6 py-4 text-right border-r border-gray-100">
                          {formatCurrency(summaryData.filter(m => !m.isOpening).reduce((sum, m) => sum + m.inwardValue, 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatQty(summaryData.filter(m => !m.isOpening).reduce((sum, m) => sum + m.outwardQty, 0))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatCurrency(summaryData.filter(m => !m.isOpening).reduce((sum, m) => sum + m.outwardValue, 0))}
                        </td>
                        <td className="px-6 py-4 text-right text-primary">
                          {formatQty(summaryData.length > 0 ? summaryData[summaryData.length - 1].closingQty : 0)}
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
                        <th className="px-6 py-2 text-right border-l border-gray-100">Closing</th>
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
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-400 italic border-l border-gray-100">
                              {formatQty(openingBalance)}
                            </td>
                          </tr>
                          {transactions.map((tx, idx) => (
                          <tr 
                            key={idx} 
                            onClick={() => tx.v_id && navigate(`/vouchers/view/${tx.v_id}`)}
                            className="hover:bg-primary/5 transition-colors cursor-pointer group"
                          >
                            <td className="px-6 py-3 text-sm text-gray-900 group-hover:text-primary">
                              {formatReportDate(tx.date || tx.created_at?.toDate?.() || '', settings.dateFormat)}
                            </td>
                            <td className="px-6 py-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                              {tx.v_type}
                            </td>
                            <td className="px-6 py-3 text-sm text-gray-600">
                              {tx.v_no}{(tx.serial_no || tx.auto_serial_no) ? ` / SN:${tx.serial_no || tx.auto_serial_no}` : ''}
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-gray-900 capitalize">
                              {tx.party_name}
                            </td>
          <td className={cn(
            "px-6 py-3 text-sm text-right font-bold",
            (tx.v_type?.toLowerCase() === 'physical stock' || tx.is_physical_snapshot)
              ? (tx.adjustment_qty >= 0 ? "text-green-600" : "text-red-600")
              : (getMovementType(tx) === 'inward' ? "text-green-600" : "text-red-600")
          )}>
            {(tx.v_type?.toLowerCase() === 'physical stock' || tx.is_physical_snapshot) ? (
              <div className="flex flex-col items-end">
                <span>{formatQty(tx.qty)}</span>
                <span className="text-[10px] opacity-70 font-medium italic">
                  ({tx.adjustment_qty >= 0 ? '+' : ''}{formatQty(tx.adjustment_qty)})
                </span>
              </div>
            ) : (
              formatQty(tx.qty + (tx.free_qty || 0))
            )}
          </td>
                            <td className="px-6 py-3 text-sm text-right text-gray-600">
                              {formatCurrency(tx.rate)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">
                              {formatCurrency(tx.qty * tx.rate)}
                            </td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-primary border-l border-gray-100">
                              {formatQty(tx.closing_balance)}
                            </td>
                          </tr>
                          ))}
                        </>
                      ) : (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-gray-400 italic">
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
  </div>
);
}
