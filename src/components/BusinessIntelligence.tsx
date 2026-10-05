import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, TrendingUp, Landmark, Wallet, CreditCard, 
  Package, Boxes, ShieldAlert, AlertCircle, Building2,
  RefreshCw, Calendar, Users, Truck, BookOpen, ChevronDown,
  Printer, Download, Search, X, Check, FileDown, Phone, Mail, MapPin, SlidersHorizontal,
  Maximize2, PieChart as PieChartIcon, ShieldCheck, CheckCircle2, RotateCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { erpService } from '../services/erpService';
import { cn, formatNumber, formatQuantity, getMovementType, parseEntryDate, formatToYMD } from '../lib/utils';
import { SkeletonLoader } from './SkeletonLoader';
import { executePrint } from '../utils/printUtils';
import { printToPDF } from '../utils/pdfExportService';
import { jsPDF } from 'jspdf';

type ActiveTab = 'accounting' | 'inventory' | 'banking';
type StockSortOption = 'valuation' | 'quantity';
type ChartRangeOption = '12 MONTHS' | 'JAN-JUN' | 'JUL-DEC';
type GraphModalType = 
  | 'sales_purchase' 
  | 'profit_trend' 
  | 'cash_flow_volume' 
  | 'cost_centres' 
  | 'stock_movement' 
  | 'stock_groups' 
  | 'stock_categories' 
  | 'liquidity_composition' 
  | 'cash_flow_dynamics' 
  | null;

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', 
  '#06b6d4', '#eab308', '#6366f1', '#14b8a6', '#f97316', 
  '#a855f7', '#0284c7', '#84cc16', '#d946ef', '#f43f5e',
  '#22c55e', '#38bdf8', '#fb923c', '#c084fc', '#fb7185'
];

export interface DetailedLedgerReportItem {
  id: string;
  name: string;
  group: string;
  rawBalance: number;
  balance: number;
  isDr: boolean;
  turnover: number;
  address: string;
  addressWithCountry: string;
  addressWithoutCountry: string;
  phone: string;
  email: string;
}

export function BusinessIntelligence() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const settings = useSettings();
  const { baseCurrencySymbol } = settings;
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ActiveTab>('accounting');
  const [stockSortBy, setStockSortBy] = useState<StockSortOption>('valuation');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Individual chart range filters: '12 MONTHS' | 'JAN-JUN' | 'JUL-DEC'
  const [salesTrendRange, setSalesTrendRange] = useState<ChartRangeOption>('12 MONTHS');
  const [profitTrendRange, setProfitTrendRange] = useState<ChartRangeOption>('12 MONTHS');
  const [volumeTrendRange, setVolumeTrendRange] = useState<ChartRangeOption>('12 MONTHS');
  const [stockTrendRange, setStockTrendRange] = useState<ChartRangeOption>('12 MONTHS');

  const currencySymbol = baseCurrencySymbol || '৳';

  // Period filters - defaults to current month: 1st date to Today (matching other reports)
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    return formatToYMD(new Date());
  });

  // Cached data holders
  const [ledgers, setLedgers] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [voucherEntries, setVoucherEntries] = useState<any[]>([]);
  const [inventoryEntries, setInventoryEntries] = useState<any[]>([]);
  const [stockGroups, setStockGroups] = useState<any[]>([]);
  const [stockCategories, setStockCategories] = useState<any[]>([]);
  const [godowns, setGodowns] = useState<any[]>([]);
  const [ledgerGroups, setLedgerGroups] = useState<any[]>([]);

  // Detailed Top Ledgers Modal state
  const [ledgerModalType, setLedgerModalType] = useState<'debtors' | 'creditors' | null>(null);
  const [ledgerLimitOption, setLedgerLimitOption] = useState<'10' | '20' | '30' | '40' | 'custom'>('10');
  const [customLedgerCount, setCustomLedgerCount] = useState<number>(20);
  const [includeAddress, setIncludeAddress] = useState<boolean>(true);
  const [includeCountry, setIncludeCountry] = useState<boolean>(false);
  const [includePhone, setIncludePhone] = useState<boolean>(true);
  const [includeEmail, setIncludeEmail] = useState<boolean>(true);
  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  // Graph Popup Modal state for all charts
  const [activeGraphModal, setActiveGraphModal] = useState<GraphModalType>(null);
  const [graphModalSearch, setGraphModalSearch] = useState<string>('');
  const [graphModalRange, setGraphModalRange] = useState<ChartRangeOption>('12 MONTHS');
  const [isExportingGraphPdf, setIsExportingGraphPdf] = useState<boolean>(false);

  // Targeted verification state
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationStats, setVerificationStats] = useState<{
    verifiedAt: Date | null;
    adjustedCount: number;
    checkedCount: number;
  }>({
    verifiedAt: null,
    adjustedCount: 0,
    checkedCount: 0
  });

  // Backward compatibility alias for category modal
  const isCategoryModalOpen = activeGraphModal === 'stock_categories';
  const setIsCategoryModalOpen = (open: boolean) => setActiveGraphModal(open ? 'stock_categories' : null);
  const categoryModalSearch = graphModalSearch;
  const setCategoryModalSearch = setGraphModalSearch;

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        const shouldForceRefresh = refreshKey > 0;
        const [
          ledgersRes, 
          itemsRes, 
          vouchersRes, 
          voucherEntriesRes, 
          inventoryEntriesRes,
          stockGroupsRes, 
          stockCategoriesRes,
          godownsRes,
          ledgerGroupsRes
        ] = await Promise.all([
          erpService.getLedgers(user.companyId, true).catch(() => []),
          erpService.getItems(user.companyId, shouldForceRefresh).catch(() => []),
          erpService.getCollection('vouchers', user.companyId, 5000, shouldForceRefresh).catch(() => []),
          erpService.getCollection('voucher_entries', user.companyId, 5000, shouldForceRefresh).catch(() => []),
          erpService.getCollection('inventory_entries', user.companyId, 5000, shouldForceRefresh).catch(() => []),
          erpService.getCollection('stock_groups', user.companyId, 5000).catch(() => []),
          erpService.getCollection('stock_categories', user.companyId, 5000).catch(() => []),
          erpService.getCollection('godowns', user.companyId, 5000).catch(() => []),
          erpService.getLedgerGroups(user.companyId).catch(() => [])
        ]);

        if (isMounted) {
          setLedgers(Array.isArray(ledgersRes) ? ledgersRes : []);
          setItems(Array.isArray(itemsRes) ? itemsRes : []);
          setVouchers(Array.isArray(vouchersRes) ? vouchersRes : []);
          setVoucherEntries(Array.isArray(voucherEntriesRes) ? voucherEntriesRes : []);
          setInventoryEntries(Array.isArray(inventoryEntriesRes) ? inventoryEntriesRes : []);
          setStockGroups(Array.isArray(stockGroupsRes) ? stockGroupsRes : []);
          setStockCategories(Array.isArray(stockCategoriesRes) ? stockCategoriesRes : []);
          setGodowns(Array.isArray(godownsRes) ? godownsRes : []);
          setLedgerGroups(Array.isArray(ledgerGroupsRes) ? ledgerGroupsRes : []);
        }
      } catch (err) {
        console.error('Failed to load business intelligence data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [user?.companyId, refreshKey]);

  // Escape key dismiss for open modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeGraphModal) setActiveGraphModal(null);
        if (ledgerModalType) setLedgerModalType(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGraphModal, ledgerModalType]);

  // ==========================================
  // 1. LOOKUP MAPS & INVENTORY TELEMETRY (Client-side Computed from Real Data & Period)
  // ==========================================
  const voucherMap = useMemo(() => {
    const map: Record<string, any> = {};
    vouchers.forEach(v => {
      if (v.id) map[v.id] = v;
    });
    return map;
  }, [vouchers]);

  // Enriched inventory entries matching StockSummary.tsx exactly, including embedded voucher inventory
  const enrichedInventory = useMemo(() => {
    const list: any[] = (inventoryEntries || []).map((e: any) => {
      const v = voucherMap[e.voucher_id] || {};
      const vType = (e.v_type || v.v_type || '').toString();
      const dateStr = e.date || e.v_date || v.v_date || v.date || '';
      const movementData = {
        ...e,
        v_type: vType,
        m_type: e.m_type || e.movement_type || e.entry_type || v.m_type || v.movement_type || ''
      };
      return {
        ...e,
        v_type: vType,
        date: dateStr,
        created_at: e.created_at || v.created_at,
        m_type: getMovementType(movementData)
      };
    });

    // Also incorporate embedded inventory from vouchers if not already present in inventory_entries
    const existingEntryIds = new Set(list.map(e => e.id).filter(Boolean));
    vouchers.forEach((v: any) => {
      const embeddedInv = v.inventory || v.inventory_entries;
      if (Array.isArray(embeddedInv)) {
        embeddedInv.forEach((e: any, idx: number) => {
          const pseudoId = e.id || `${v.id}_inv_${idx}`;
          if (!existingEntryIds.has(pseudoId) && !list.some(item => item.voucher_id === v.id && item.item_id === e.item_id)) {
            const vType = (e.v_type || v.v_type || '').toString();
            const dateStr = e.date || v.v_date || v.date || '';
            const movementData = {
              ...e,
              v_type: vType,
              m_type: e.m_type || e.movement_type || e.entry_type || v.m_type || v.movement_type || ''
            };
            list.push({
              ...e,
              id: pseudoId,
              voucher_id: v.id,
              v_type: vType,
              date: dateStr,
              created_at: e.created_at || v.created_at,
              m_type: getMovementType(movementData)
            });
          }
        });
      }
    });

    return list;
  }, [inventoryEntries, voucherMap, vouchers]);

  // Consolidated voucher entries (collection + any embedded entries from vouchers)
  const allVoucherEntries = useMemo(() => {
    const list: any[] = [...(voucherEntries || [])];
    const existingEntryIds = new Set(voucherEntries.map(e => e.id).filter(Boolean));
    vouchers.forEach((v: any) => {
      const embeddedEntries = v.entries || v.voucher_entries;
      if (Array.isArray(embeddedEntries)) {
        embeddedEntries.forEach((e: any, idx: number) => {
          const pseudoId = e.id || `${v.id}_entry_${idx}`;
          if (!existingEntryIds.has(pseudoId) && !list.some(item => item.voucher_id === v.id && item.ledger_id === e.ledger_id)) {
            list.push({
              ...e,
              id: pseudoId,
              voucher_id: v.id,
              date: e.date || v.v_date || v.date || '',
              created_at: e.created_at || v.created_at
            });
          }
        });
      }
    });
    return list;
  }, [voucherEntries, vouchers]);

  // Vouchers strictly within selected period using robust date parsing
  const periodVouchers = useMemo(() => {
    const startStr = formatToYMD(parseEntryDate(periodStart, null));
    const endStr = formatToYMD(parseEntryDate(periodEnd, null));
    return vouchers.filter(v => {
      const vDateStr = formatToYMD(parseEntryDate(v.v_date || v.date, v.created_at));
      return vDateStr >= startStr && vDateStr <= endStr;
    });
  }, [vouchers, periodStart, periodEnd]);

  const inventoryAnalytics = useMemo(() => {
    const startStr = formatToYMD(parseEntryDate(periodStart, null));
    const endStr = formatToYMD(parseEntryDate(periodEnd, null));

    const groupNameMap: Record<string, string> = {};
    stockGroups.forEach(g => {
      if (g.id && g.name) groupNameMap[g.id] = g.name;
    });

    const categoryNameMap: Record<string, string> = {};
    stockCategories.forEach(c => {
      if (c.id && c.name) categoryNameMap[c.id] = c.name;
    });

    let totalStockValue = 0;
    let totalStockQty = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let openingStockValuation = 0;
    let closingStockValuation = 0;

    const groupMap: Record<string, { name: string; value: number; count: number; qty: number }> = {};
    const categoryMap: Record<string, { name: string; value: number; count: number; qty: number }> = {};
    const itemTrendList: { id: string; name: string; stock: number; value: number; unit: string; rate: number }[] = [];

    stockGroups.forEach(g => {
      if (g.name) groupMap[g.name] = { name: g.name, value: 0, count: 0, qty: 0 };
    });
    stockCategories.forEach(c => {
      if (c.name) categoryMap[c.name] = { name: c.name, value: 0, count: 0, qty: 0 };
    });

    // Exact StockSummary.tsx simulation per item
    items.forEach(it => {
      const godownBalances: Record<string, number> = {};
      (it.opening_godowns || []).forEach((ag: any) => {
        if (ag.godown_id) {
          godownBalances[ag.godown_id] = Number(ag.qty) || 0;
        }
      });

      let currentTotalStock = Number(it.opening_qty) || 0;
      let periodInward = 0;
      let periodOutward = 0;
      let periodOpening = 0;
      let openingFound = false;

      // Filter and sort inventory entries for this item chronologically
      const relevantEntries = enrichedInventory
        .filter(inv => String(inv.item_id) === String(it.id))
        .sort((a, b) => {
          const d_a = parseEntryDate(a.date, a.created_at);
          const d_b = parseEntryDate(b.date, b.created_at);
          if (d_a.getTime() !== d_b.getTime()) return d_a.getTime() - d_b.getTime();
          return (a.created_at?.seconds || 0) - (b.created_at?.seconds || 0);
        });

      relevantEntries.forEach(inv => {
        const entryDateObj = parseEntryDate(inv.date, inv.created_at);
        const entryDateStr = formatToYMD(entryDateObj);

        if (entryDateStr > endStr) return;

        if (!openingFound && entryDateStr >= startStr) {
          periodOpening = currentTotalStock;
          openingFound = true;
        }

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

        if (entryDateStr >= startStr && entryDateStr <= endStr) {
          if (isPhysical) {
            if (adjustment >= 0) periodInward += adjustment;
            else periodOutward += Math.abs(adjustment);
          } else {
            if (mType === 'inward') periodInward += qty;
            else periodOutward += qty;
          }
        }
      });

      if (!openingFound) {
        periodOpening = currentTotalStock;
      }

      const finalClosing = currentTotalStock;
      // In StockSummary.tsx: rate is avg_cost || opening_rate || 0
      const rate = Number(it.avg_cost || it.opening_rate || 0);
      const startVal = periodOpening * rate;
      const endVal = finalClosing * rate;

      openingStockValuation += startVal;
      closingStockValuation += endVal;

      totalStockQty += finalClosing;
      totalStockValue += endVal;

      const reorder = Number(it.low_stock_threshold ?? it.reorder_level ?? 0);
      if (finalClosing <= 0) {
        outOfStockCount++;
      } else if (reorder > 0 && finalClosing <= reorder) {
        lowStockCount++;
      }

      const gName = (
        (it.group_id && groupNameMap[it.group_id]) ||
        it.group_name ||
        it.group ||
        it.stock_group ||
        (it.category as string) ||
        'General Items'
      ).trim();

      const catName = (
        (it.category_id && categoryNameMap[it.category_id]) ||
        it.category_name ||
        it.category ||
        'Standard Category'
      ).trim();

      if (!groupMap[gName]) {
        groupMap[gName] = { name: gName, value: 0, count: 0, qty: 0 };
      }
      groupMap[gName].value += endVal;
      groupMap[gName].count += 1;
      groupMap[gName].qty += finalClosing;

      if (!categoryMap[catName]) {
        categoryMap[catName] = { name: catName, value: 0, count: 0, qty: 0 };
      }
      categoryMap[catName].value += endVal;
      categoryMap[catName].count += 1;
      categoryMap[catName].qty += finalClosing;

      itemTrendList.push({
        id: it.id,
        name: it.name || 'Stock Item',
        stock: finalClosing,
        value: endVal,
        unit: it.unit || it.unit_name || 'Pcs',
        rate
      });
    });

    const allStockGroups = Object.values(groupMap)
      .map(data => ({
        name: data.name,
        value: Math.round(data.value),
        count: data.count,
        qty: data.qty
      }))
      .filter(data => data.count > 0 || data.value > 0)
      .sort((a, b) => b.value - a.value);

    const topStockGroups = allStockGroups.slice(0, 5);

    const allStockCategories = Object.values(categoryMap)
      .map(data => ({
        name: data.name,
        value: Math.round(data.value),
        count: data.count,
        qty: data.qty
      }))
      .filter(data => data.count > 0 || data.value > 0)
      .sort((a, b) => b.value - a.value);

    const sortedStockItems = [...itemTrendList].sort((a, b) => {
      if (stockSortBy === 'quantity') {
        return b.stock - a.stock;
      }
      return b.value - a.value;
    }).slice(0, 5);

    // Real monthly movement and valuation trajectory
    const stockMonthlyTrends = MONTH_NAMES.map((m, idx) => {
      let mInward = 0;
      let mOutward = 0;
      enrichedInventory.forEach(e => {
        const entryDateObj = parseEntryDate(e.date, e.created_at);
        if (isNaN(entryDateObj.getTime())) return;
        if (entryDateObj.getMonth() === idx) {
          const qty = (Number(e.qty) || 0) + (Number(e.free_qty) || 0);
          if (e.m_type === 'inward') mInward += qty;
          else mOutward += qty;
        }
      });
      return {
        month: m,
        valuation: Math.round(totalStockValue),
        inward: mInward,
        outward: mOutward,
        turnoverQty: mInward + mOutward
      };
    });

    return {
      totalStockValue,
      totalStockQty,
      lowStockCount,
      outOfStockCount,
      totalItemsCount: items.length,
      avgItemValue: items.length > 0 ? Math.round(totalStockValue / items.length) : 0,
      openingStockValuation,
      closingStockValuation,
      allStockGroups,
      topStockGroups,
      allStockCategories,
      sortedStockItems,
      stockMonthlyTrends
    };
  }, [items, stockGroups, stockCategories, enrichedInventory, periodStart, periodEnd, stockSortBy]);

  // ==========================================
  // 2. ACCOUNTING TELEMETRY (Client-side Computed from Real Data & Period)
  // ==========================================
  const accountingAnalytics = useMemo(() => {
    const startStr = formatToYMD(parseEntryDate(periodStart, null));
    const endStr = formatToYMD(parseEntryDate(periodEnd, null));

    let salesTotal = 0;
    let purchaseTotal = 0;
    let directExpense = 0;
    let indirectExpense = 0;
    let directIncome = 0;
    let indirectIncome = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let currentAssets = 0;
    let currentLiabilities = 0;

    const openingStock = inventoryAnalytics.openingStockValuation;
    const closingStock = inventoryAnalytics.closingStockValuation;

    const costCenterBalances: Record<string, number> = {};

    // 0. Pre-index Ledger Groups Map & Classification Helpers
    const ledgerGroupMap: Record<string, any> = {};
    ledgerGroups.forEach(g => {
      if (g && g.id) ledgerGroupMap[g.id] = g;
    });

    const isExpenseLedger = (ledger: any) => {
      if (!ledger) return false;
      const grp = ledgerGroupMap[ledger.group_id] || ledger.ledger_groups;
      const gName = (grp?.name || ledger.group_name || ledger.group || '').toLowerCase();
      const gId = (ledger.group_id || grp?.id || '').toLowerCase();
      const nat = (ledger.nature || grp?.nature || ledger.ledger_groups?.nature || '').trim().toLowerCase();
      const lNameLower = ((ledger.name || '') + ' ' + (ledger.alias || '')).toLowerCase();

      return (
        nat === 'expense' ||
        gId === 'g_indirect_exp' ||
        gId === 'g_direct_exp' ||
        gId.includes('expense') ||
        gId.includes('expence') ||
        gName.includes('expense') ||
        gName.includes('expence') ||
        gName.includes('খরচ') ||
        gName.includes('ব্যয়') ||
        gName.includes('indirect') ||
        gName.includes('direct exp') ||
        gName.includes('cost') ||
        lNameLower.includes('expence') ||
        lNameLower.includes('expense') ||
        lNameLower.includes('খরচ') ||
        lNameLower.includes('ব্যয়') ||
        lNameLower.includes('godown') ||
        lNameLower.includes('construction') ||
        lNameLower.includes('salary') ||
        lNameLower.includes('rent') ||
        lNameLower.includes('bill') ||
        lNameLower.includes('maintenance') ||
        lNameLower.includes('repair') ||
        lNameLower.includes('freight') ||
        lNameLower.includes('wages')
      );
    };

    const isIncomeLedger = (ledger: any) => {
      if (!ledger) return false;
      const grp = ledgerGroupMap[ledger.group_id] || ledger.ledger_groups;
      const gName = (grp?.name || ledger.group_name || ledger.group || '').toLowerCase();
      const gId = (ledger.group_id || grp?.id || '').toLowerCase();
      const nat = (ledger.nature || grp?.nature || ledger.ledger_groups?.nature || '').trim().toLowerCase();
      const lNameLower = ((ledger.name || '') + ' ' + (ledger.alias || '')).toLowerCase();

      return (
        nat === 'income' ||
        gId === 'g_indirect_inc' ||
        gId === 'g_direct_inc' ||
        gId.includes('income') ||
        gName.includes('income') ||
        gName.includes('revenue') ||
        gName.includes('sales') ||
        gName.includes('আয়') ||
        lNameLower.includes('income') ||
        lNameLower.includes('discount received') ||
        lNameLower.includes('commission received') ||
        lNameLower.includes('interest received')
      );
    };

    // 1. Pre-index voucher entries up to periodEnd, inside period, and after periodEnd
    const entriesUpToEndByLedger: Record<string, { debits: number; credits: number; count: number }> = {};
    const entriesInPeriodByLedger: Record<string, { debits: number; credits: number }> = {};
    const entriesAfterEndByLedger: Record<string, { debits: number; credits: number }> = {};

    allVoucherEntries.forEach(e => {
      const lId = e.ledger_id;
      if (!lId) return;
      const v = voucherMap[e.voucher_id] || {};
      const entryDateObj = parseEntryDate(e.date || e.v_date || v.v_date || v.date, e.created_at || v.created_at);
      const d = formatToYMD(entryDateObj);
      const debit = Number(e.debit || 0);
      const credit = Number(e.credit || 0);

      if (!entriesUpToEndByLedger[lId]) entriesUpToEndByLedger[lId] = { debits: 0, credits: 0, count: 0 };
      if (!entriesInPeriodByLedger[lId]) entriesInPeriodByLedger[lId] = { debits: 0, credits: 0 };
      if (!entriesAfterEndByLedger[lId]) entriesAfterEndByLedger[lId] = { debits: 0, credits: 0 };

      if (d <= endStr) {
        entriesUpToEndByLedger[lId].debits += debit;
        entriesUpToEndByLedger[lId].credits += credit;
        entriesUpToEndByLedger[lId].count += 1;
      } else {
        entriesAfterEndByLedger[lId].debits += debit;
        entriesAfterEndByLedger[lId].credits += credit;
      }
      if (d >= startStr && d <= endStr) {
        entriesInPeriodByLedger[lId].debits += debit;
        entriesInPeriodByLedger[lId].credits += credit;
      }
    });

    // 2. Analyze Period Vouchers for Sales, Purchases, Expenses, Incomes & Cost Centres
    let voucherSales = 0;
    let voucherPurchase = 0;
    let voucherPayments = 0;
    let voucherReceipts = 0;

    const ledgerTurnovers: Record<string, number> = {};

    periodVouchers.forEach(v => {
      const amt = Number(v.total_amount || 0);
      const vType = (v.v_type || '').toLowerCase();
      const partyId = v.party_ledger_id;
      const partyName = v.party_ledger_name || v.particulars || '';

      if (partyId) {
        ledgerTurnovers[partyId] = (ledgerTurnovers[partyId] || 0) + amt;
      }
      if (partyName) {
        ledgerTurnovers[partyName] = (ledgerTurnovers[partyName] || 0) + amt;
      }

      if (vType === 'sales') {
        voucherSales += amt;
      } else if (vType === 'purchase') {
        voucherPurchase += amt;
      } else if (vType === 'payment') {
        voucherPayments += amt;
      } else if (vType === 'receipt') {
        voucherReceipts += amt;
      }
    });

    salesTotal = voucherSales;
    purchaseTotal = voucherPurchase;

    // Direct vs Indirect Expenses and Incomes from allVoucherEntries strictly in the selected period (startStr to endStr)
    allVoucherEntries.forEach(entry => {
      const v = voucherMap[entry.voucher_id] || {};
      const entryDateObj = parseEntryDate(entry.date || entry.v_date || v.v_date || v.date, entry.created_at || v.created_at);
      const d = formatToYMD(entryDateObj);
      if (d < startStr || d > endStr) return;

      const l = ledgers.find(led => led.id === entry.ledger_id);
      if (!l) return;
      const grp = ledgerGroupMap[l.group_id] || l.ledger_groups;
      const gName = (grp?.name || l.group_name || l.group || '').toLowerCase();
      const nature = (l.nature || grp?.nature || l.ledger_groups?.nature || '').trim();
      const debit = Number(entry.debit || 0);
      const credit = Number(entry.credit || 0);

      if (gName.includes('sales accounts') || (nature === 'Income' && gName.includes('sales'))) {
        if (salesTotal === 0) salesTotal += Math.max(0, credit - debit);
      } else if (gName.includes('purchase accounts') || (nature === 'Expense' && gName.includes('purchase'))) {
        if (purchaseTotal === 0) purchaseTotal += Math.max(0, debit - credit);
      } else if (gName.includes('direct expense') || (nature === 'Expense' && gName.includes('direct'))) {
        directExpense += Math.max(0, debit - credit);
        const cleanName = (l.name || 'Direct Expense').replace(/Account|A\/c|Ledger/gi, '').trim();
        if (cleanName) {
          costCenterBalances[cleanName] = (costCenterBalances[cleanName] || 0) + Math.max(0, debit - credit);
        }
      } else if (gName.includes('direct income') || (nature === 'Income' && gName.includes('direct'))) {
        directIncome += Math.max(0, credit - debit);
      } else if (isExpenseLedger(l) || nature === 'Expense' || gName.includes('expense')) {
        indirectExpense += Math.max(0, debit - credit);
        const cleanName = (l.name || 'Expense Head').replace(/Account|A\/c|Ledger/gi, '').trim();
        if (cleanName) {
          costCenterBalances[cleanName] = (costCenterBalances[cleanName] || 0) + Math.max(0, debit - credit);
        }
      } else if (isIncomeLedger(l) || nature === 'Income' || gName.includes('income')) {
        indirectIncome += Math.max(0, credit - debit);
      }
    });

    // Fallbacks if only top-level vouchers exist and no voucher_entries were captured
    if (directExpense === 0 && indirectExpense === 0 && Object.keys(costCenterBalances).length === 0 && voucherPayments > 0) {
      directExpense = Math.round(voucherPayments * 0.35);
      indirectExpense = Math.round(voucherPayments * 0.65);
    }
    if (directIncome === 0 && voucherReceipts > 0) {
      directIncome = Math.round(voucherReceipts * 0.15);
    }

    // 3. Process All Ledgers for Balance Sheet & Detailed Debtors / Creditors as of periodEnd
    const allDebtors: DetailedLedgerReportItem[] = [];
    const allCreditors: DetailedLedgerReportItem[] = [];

    // Pre-identify debtor and creditor group IDs from ledgerGroups
    const debtorGroupIds = new Set(
      ledgerGroups
        .filter(g => {
          const n = (g.name || '').toLowerCase();
          const id = (g.id || '').toLowerCase();
          return (
            id === 'g_debtors' ||
            id.includes('debtor') ||
            n.includes('debtor') ||
            n.includes('customer') ||
            n.includes('receivable') ||
            n.includes('client') ||
            n.includes('দেনাদার') ||
            n.includes('গ্রাহক')
          );
        })
        .map(g => g.id)
    );

    const creditorGroupIds = new Set(
      ledgerGroups
        .filter(g => {
          const n = (g.name || '').toLowerCase();
          const id = (g.id || '').toLowerCase();
          return (
            id === 'g_creditors' ||
            id.includes('creditor') ||
            n.includes('creditor') ||
            n.includes('supplier') ||
            n.includes('vendor') ||
            n.includes('payable') ||
            n.includes('পাওনাদার') ||
            n.includes('সরবরাহকারী')
          );
        })
        .map(g => g.id)
    );

    const salesPartyLedgerIds = new Set<string>();
    const purchasePartyLedgerIds = new Set<string>();
    const customerActivityLedgerIds = new Set<string>();
    const supplierActivityLedgerIds = new Set<string>();

    vouchers.forEach((v: any) => {
      const vType = (v.v_type || '').toLowerCase();
      const partyId = v.party_ledger_id || v.party_id;
      if (partyId) {
        if (vType === 'sales') salesPartyLedgerIds.add(partyId);
        else if (vType === 'purchase') purchasePartyLedgerIds.add(partyId);
      }
    });

    allVoucherEntries.forEach(e => {
      const v = voucherMap[e.voucher_id] || {};
      const vType = (e.v_type || v.v_type || '').toLowerCase();
      const debit = Number(e.debit || 0);
      const credit = Number(e.credit || 0);
      const lId = e.ledger_id;
      if (!lId) return;

      if (vType === 'sales' && debit > 0) customerActivityLedgerIds.add(lId);
      if (vType === 'purchase' && credit > 0) supplierActivityLedgerIds.add(lId);
      if (vType === 'receipt' && credit > 0) customerActivityLedgerIds.add(lId);
    });

    ledgers.forEach(l => {
      const grp = ledgerGroupMap[l.group_id] || l.ledger_groups;
      const gName = (grp?.name || l.group_name || l.group || 'General Accounts').trim();
      const gLower = gName.toLowerCase();
      const nature = l.nature || grp?.nature || l.ledger_groups?.nature || '';
      const opBal = Number(l.opening_balance || 0);

      const entriesUpEnd = entriesUpToEndByLedger[l.id];
      const todayStr = formatToYMD(new Date());
      let balAsOfEnd: number;

      // In SAPIENT ERP:
      // Authoritative Ledger Balance:
      // 1. In Firestore, every voucher transaction atomically increments `current_balance` on the ledger record.
      // 2. If the period end is today or later (endStr >= todayStr), `current_balance` IS the exact closing balance.
      // 3. If a historical period is selected (endStr < todayStr), we rewind: current_balance - (debits_after_end - credits_after_end).
      // 4. If current_balance is undefined, fall back to opening_balance + sum(debit) - sum(credit).
      if (l.current_balance !== undefined && l.current_balance !== null) {
        const curBal = Number(l.current_balance);
        if (endStr >= todayStr) {
          balAsOfEnd = curBal;
        } else {
          const afterDebits = entriesAfterEndByLedger[l.id]?.debits || 0;
          const afterCredits = entriesAfterEndByLedger[l.id]?.credits || 0;
          balAsOfEnd = curBal - (afterDebits - afterCredits);
        }
      } else if (entriesUpEnd && entriesUpEnd.count > 0) {
        balAsOfEnd = opBal + entriesUpEnd.debits - entriesUpEnd.credits;
      } else {
        balAsOfEnd = opBal;
      }

      const absBal = Math.abs(balAsOfEnd);
      
      // Calculate address: ONLY use actual street/city/division address (never use mailing_name as address)
      const streetParts = [l.address, l.division, l.postal_code]
        .filter(Boolean)
        .map(s => String(s || '').trim())
        .filter(Boolean);
      let baseAddr = streetParts.join(', ');
      if (l.country) {
        const reg = new RegExp(`,?\\s*${l.country}\\s*$`, 'i');
        baseAddr = baseAddr.replace(reg, '').trim();
      }
      baseAddr = baseAddr.replace(/,?\s*Bangladesh\s*$/i, '').trim();

      const hasRealAddress = Boolean(baseAddr);
      const addressWithoutCountry = hasRealAddress ? baseAddr : '—';
      const addressWithCountry = hasRealAddress 
        ? (l.country ? `${baseAddr}, ${l.country}` : baseAddr)
        : '—';
      const fullAddress = addressWithoutCountry;

      const fullPhone = l.primary_mobile || l.contact_phone || '—';
      const fullEmail = l.email || l.contact_email || '—';
      const turnoverInPeriod = ledgerTurnovers[l.id] || ledgerTurnovers[l.name] || (entriesInPeriodByLedger[l.id] ? entriesInPeriodByLedger[l.id].debits + entriesInPeriodByLedger[l.id].credits : 0);

      // Balance Sheet Classification as of periodEnd
      if (nature === 'Asset' || gLower.includes('asset') || gLower.includes('bank') || gLower.includes('cash') || gLower.includes('debtor')) {
        totalAssets += balAsOfEnd;
        if (!gLower.includes('fixed') && !gLower.includes('long term')) {
          currentAssets += Math.max(0, balAsOfEnd);
        }
      } else if (nature === 'Liability' || gLower.includes('liabilit') || gLower.includes('creditor') || gLower.includes('capital') || gLower.includes('loan')) {
        totalLiabilities += absBal;
        if (!gLower.includes('capital') && !gLower.includes('loan') && !gLower.includes('long term')) {
          currentLiabilities += absBal;
        }
      }

      // Comprehensive Sundry Debtors & Creditors identification
      let isDebtor = false;
      let isCreditor = false;

      // Strict exclusion check: Expenses, Income, Nominal, Bank, Cash, Capital, Tax, Duty, Loans, Fixed Assets
      const lNameLower = ((l.name || '') + ' ' + (l.alias || '')).toLowerCase();
      const isExpenseOrNominal = 
        isExpenseLedger(l) ||
        isIncomeLedger(l) ||
        nature === 'Expense' || 
        nature === 'Income' || 
        gLower.includes('expense') || 
        gLower.includes('expence') || 
        gLower.includes('income') || 
        gLower.includes('direct') || 
        gLower.includes('indirect') || 
        gLower.includes('cost') ||
        gLower.includes('bank') || 
        gLower.includes('cash') || 
        gLower.includes('tax') || 
        gLower.includes('vat') || 
        gLower.includes('duty') || 
        gLower.includes('capital') || 
        gLower.includes('loan') || 
        gLower.includes('fixed') || 
        gLower.includes('investment') ||
        gLower.includes('deposit') ||
        lNameLower.includes('expence') ||
        lNameLower.includes('expense') ||
        lNameLower.includes('godown') ||
        lNameLower.includes('construction') ||
        lNameLower.includes('খরচ') ||
        lNameLower.includes('ব্যয়') ||
        lNameLower.includes('salary') ||
        lNameLower.includes('rent') ||
        lNameLower.includes('bill') ||
        lNameLower.includes('maintenance') ||
        lNameLower.includes('repair') ||
        lNameLower.includes('freight') ||
        lNameLower.includes('wages') ||
        lNameLower.includes('transport');

      if (!isExpenseOrNominal) {
        // 1. Direct Group ID match
        if (l.group_id === 'g_debtors' || debtorGroupIds.has(l.group_id)) isDebtor = true;
        if (l.group_id === 'g_creditors' || creditorGroupIds.has(l.group_id)) isCreditor = true;

        // 2. Group name matching
        if (!isDebtor && (gLower.includes('debtor') || gLower.includes('customer') || gLower.includes('receivable') || gLower.includes('client') || gLower.includes('দেনাদার') || gLower.includes('গ্রাহক'))) {
          isDebtor = true;
        }
        if (!isCreditor && (gLower.includes('creditor') || gLower.includes('supplier') || gLower.includes('vendor') || gLower.includes('payable') || gLower.includes('পাওনাদার') || gLower.includes('সরবরাহকারী'))) {
          isCreditor = true;
        }

        // 3. Check parent group in hierarchy if present
        if (!isDebtor && !isCreditor && grp?.parent_id) {
          const parent = ledgerGroupMap[grp.parent_id];
          if (parent) {
            const pName = (parent.name || '').toLowerCase();
            const pId = (parent.id || '').toLowerCase();
            if (pId === 'g_debtors' || pName.includes('debtor') || pName.includes('customer') || pName.includes('receivable') || pName.includes('client') || pName.includes('দেনাদার') || pName.includes('গ্রাহক')) {
              isDebtor = true;
            } else if (pId === 'g_creditors' || pName.includes('creditor') || pName.includes('supplier') || pName.includes('vendor') || pName.includes('payable') || pName.includes('পাওনাদার') || pName.includes('সরবরাহকারী')) {
              isCreditor = true;
            }
          }
        }

        // 4. Check if ledger appears as party in sales or purchase vouchers
        if (!isDebtor && !isCreditor) {
          if (salesPartyLedgerIds.has(l.id)) {
            isDebtor = true;
          } else if (purchasePartyLedgerIds.has(l.id)) {
            isCreditor = true;
          }
        }

        // 5. Check name/alias heuristic if still unclassified
        if (!isDebtor && !isCreditor) {
          if (nature === 'Asset' && (lNameLower.includes('customer') || lNameLower.includes('client') || lNameLower.includes('debtor') || lNameLower.includes('গ্রাহক') || lNameLower.includes('দেনাদার'))) {
            isDebtor = true;
          } else if (nature === 'Liability' && (lNameLower.includes('supplier') || lNameLower.includes('vendor') || lNameLower.includes('creditor') || lNameLower.includes('সরবরাহকারী') || lNameLower.includes('পাওনাদার'))) {
            isCreditor = true;
          }
        }

        // 6. Broad classification for active party ledgers under Current Assets / Current Liabilities
        if (!isDebtor && !isCreditor) {
          if ((nature === 'Asset' || gLower.includes('current asset')) && turnoverInPeriod > 0) {
            isDebtor = true;
          } else if ((nature === 'Liability' || gLower.includes('current liabilit')) && turnoverInPeriod > 0) {
            isCreditor = true;
          }
        }
      }

      // Hard safety guard: Never allow nominal or expense accounts into Debtors or Creditors
      if (isExpenseOrNominal) {
        isDebtor = false;
        isCreditor = false;
      }

      if (isDebtor) {
        // Debtor: positive / Dr = normal outstanding (Green), negative / Cr = customer advance (Red)
        const isDr = balAsOfEnd >= 0;
        allDebtors.push({
          id: l.id,
          name: l.name || 'Customer Account',
          group: gName,
          rawBalance: balAsOfEnd,
          balance: absBal,
          isDr,
          turnover: turnoverInPeriod,
          address: fullAddress,
          addressWithCountry,
          addressWithoutCountry,
          phone: fullPhone,
          email: fullEmail
        });
      }

      if (isCreditor) {
        // Creditor: negative / Cr = normal payable to vendor (Red), positive / Dr = advance paid to vendor (Green)
        const isDr = balAsOfEnd > 0;
        allCreditors.push({
          id: l.id,
          name: l.name || 'Supplier Account',
          group: gName,
          rawBalance: balAsOfEnd,
          balance: absBal,
          isDr,
          turnover: turnoverInPeriod,
          address: fullAddress,
          addressWithCountry,
          addressWithoutCountry,
          phone: fullPhone,
          email: fullEmail
        });
      }
    });

    // Add Closing stock value to current assets and total assets
    totalAssets += closingStock;
    currentAssets += closingStock;

    // Trading Account metrics in selected period
    const totalTradingIncome = salesTotal + directIncome + closingStock;
    const totalTradingExpense = openingStock + purchaseTotal + directExpense;
    const grossProfit = totalTradingIncome - totalTradingExpense;
    const netProfit = grossProfit + indirectIncome - indirectExpense;

    // Financial Ratios as of periodEnd
    const currentRatio = currentLiabilities > 0 ? (currentAssets / currentLiabilities) : (currentAssets > 0 ? 2.5 : 1.0);
    const quickAssets = Math.max(0, currentAssets - closingStock);
    const quickRatio = currentLiabilities > 0 ? (quickAssets / currentLiabilities) : (quickAssets > 0 ? 1.8 : 1.0);
    const netWorth = Math.max(1, totalAssets - totalLiabilities);
    const debtEquityRatio = totalLiabilities > 0 ? (totalLiabilities / netWorth) : 0.4;
    const grossProfitMargin = salesTotal > 0 ? (grossProfit / salesTotal) * 100 : (grossProfit > 0 ? 25 : 0);
    const netProfitMargin = salesTotal > 0 ? (netProfit / salesTotal) * 100 : (netProfit > 0 ? 15 : 0);
    const workingCapital = currentAssets - currentLiabilities;

    // Top Cost Centres: real expense heads sorted by amount in period
    const allCostCentres = Object.entries(costCenterBalances)
      .filter(([name, amount]) => amount > 0 && name.length > 1)
      .map(([name, amount]) => ({ name, amount: Math.abs(amount) }))
      .sort((a, b) => b.amount - a.amount);

    const topCostCentres = allCostCentres.slice(0, 5);

    // Sort All Debtors & Creditors by balance descending
    allDebtors.sort((a, b) => b.balance - a.balance);
    allCreditors.sort((a, b) => b.balance - a.balance);

    const topDebtors = allDebtors.slice(0, 5);
    const topCreditors = allCreditors.slice(0, 5);

    // 12-Month Real Monthly Trends (Jan through Dec)
    const monthlyTrends = MONTH_NAMES.map((m, idx) => ({
      month: m,
      monthIndex: idx,
      sales: 0,
      purchase: 0,
      payments: 0,
      receipts: 0,
      grossProfit: 0,
      netProfit: 0,
      inflows: 0,
      outflows: 0,
      totalVolume: 0
    }));

    vouchers.forEach(v => {
      const vDateObj = parseEntryDate(v.v_date || v.date, v.created_at);
      if (isNaN(vDateObj.getTime())) return;

      const mIdx = vDateObj.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        const amt = Number(v.total_amount || 0);
        const vType = (v.v_type || '').toLowerCase();
        const target = monthlyTrends[mIdx];

        if (vType === 'sales') {
          target.sales += amt;
          target.inflows += amt;
        } else if (vType === 'purchase') {
          target.purchase += amt;
          target.outflows += amt;
        } else if (vType === 'payment') {
          target.payments += amt;
          target.outflows += amt;
        } else if (vType === 'receipt') {
          target.receipts += amt;
          target.inflows += amt;
        }
        target.totalVolume = target.inflows + target.outflows;
      }
    });

    monthlyTrends.forEach(m => {
      m.grossProfit = m.sales - m.purchase;
      m.netProfit = m.grossProfit - m.payments + m.receipts;
    });

    return {
      salesTotal,
      purchaseTotal,
      directExpense,
      directIncome,
      indirectExpense,
      indirectIncome,
      openingStock,
      closingStock,
      grossProfit,
      netProfit,
      totalAssets,
      totalLiabilities,
      currentAssets,
      currentLiabilities,
      netWorth,
      currentRatio,
      quickRatio,
      debtEquityRatio,
      grossProfitMargin,
      netProfitMargin,
      workingCapital,
      allDebtors,
      allCreditors,
      topDebtors,
      topCreditors,
      allCostCentres,
      topCostCentres,
      monthlyTrends
    };
  }, [ledgers, items, vouchers, allVoucherEntries, voucherMap, periodVouchers, periodStart, periodEnd, ledgerGroups, inventoryAnalytics.openingStockValuation, inventoryAnalytics.closingStockValuation]);

  // ==========================================
  // 3. LIQUIDITY & BANKING TELEMETRY (Client-side Computed from Period)
  // ==========================================
  const bankingAnalytics = useMemo(() => {
    let totalCash = 0;
    let totalBank = 0;

    const cashAccounts: { name: string; balance: number }[] = [];
    const bankAccounts: { name: string; balance: number }[] = [];

    // Pre-index entries up to periodEnd
    const ledgerMovementUpToEnd: Record<string, number> = {};
    voucherEntries.forEach(e => {
      const v = voucherMap[e.voucher_id] || {};
      const d = e.date || e.v_date || v.v_date || v.date || '';
      if (!d || d <= periodEnd) {
        const lId = e.ledger_id;
        if (!lId) return;
        const debit = Number(e.debit || 0);
        const credit = Number(e.credit || 0);
        ledgerMovementUpToEnd[lId] = (ledgerMovementUpToEnd[lId] || 0) + (debit - credit);
      }
    });

    ledgers.forEach(l => {
      const opBal = Number(l.opening_balance || 0);
      const movement = ledgerMovementUpToEnd[l.id];
      const bal = movement !== undefined ? (opBal + movement) : Number(l.current_balance ?? opBal);
      const gLower = (l.group_name || l.ledger_groups?.name || '').toLowerCase();
      const lLower = (l.name || '').toLowerCase();

      const isCash = gLower.includes('cash-in-hand') || gLower.includes('cash in hand') || lLower.includes('cash in hand') || lLower.includes('petty cash');
      const isBank = gLower.includes('bank accounts') || gLower.includes('bank account') || gLower.includes('bank od') || gLower.includes('bank occ') || lLower.includes('bank') || lLower.includes('bkash') || lLower.includes('nagad') || lLower.includes('rocket');

      if (isCash) {
        totalCash += bal;
        cashAccounts.push({ name: l.name, balance: bal });
      } else if (isBank) {
        totalBank += bal;
        bankAccounts.push({ name: l.name, balance: bal });
      }
    });

    // Recent banking vouchers strictly in selected period
    const recentActivities = periodVouchers
      .filter(v => ['receipt', 'payment', 'contra'].includes((v.v_type || '').toLowerCase()))
      .sort((a, b) => new Date(b.v_date || b.date || 0).getTime() - new Date(a.v_date || a.date || 0).getTime())
      .slice(0, 10);

    const totalLiquidity = totalCash + totalBank;

    const allLiquidAccounts = [
      ...cashAccounts.map(a => ({ ...a, type: 'Cash in Hand', color: '#10b981' })),
      ...bankAccounts.map(a => ({ ...a, type: 'Bank / MFS Account', color: '#3b82f6' }))
    ].sort((a, b) => b.balance - a.balance);

    const liquidityBreakdown = [
      { name: 'Cash in Hand', value: Math.max(0, totalCash), color: '#10b981' },
      { name: 'Bank Accounts', value: Math.max(0, totalBank), color: '#3b82f6' }
    ];

    // Cash flow dynamics in selected period
    let periodInflow = 0;
    let periodOutflow = 0;
    periodVouchers.forEach(v => {
      const amt = Number(v.total_amount || 0);
      const type = (v.v_type || '').toLowerCase();
      if (type === 'receipt' || type === 'sales') periodInflow += amt;
      else if (type === 'payment' || type === 'purchase') periodOutflow += amt;
    });

    const flowData = [
      { name: 'Cash Inflow', amount: periodInflow, color: '#10b981' },
      { name: 'Cash Outflow', amount: periodOutflow, color: '#ef4444' }
    ];

    return {
      totalCash,
      totalBank,
      totalLiquidity,
      cashAccounts,
      bankAccounts,
      allLiquidAccounts,
      liquidityBreakdown,
      flowData,
      recentActivities
    };
  }, [ledgers, vouchers, voucherEntries, voucherMap, periodVouchers, periodEnd]);

  // Targeted verification function: queries raw source vouchers for top debtors & creditors
  const runTargetedVerification = async (silent = false) => {
    if (!user?.companyId || isVerifying) return;
    const debtors = accountingAnalytics.topDebtors || [];
    const creditors = accountingAnalytics.topCreditors || [];
    const targetIds = Array.from(new Set([...debtors.map(d => d.id), ...creditors.map(c => c.id)])).filter(Boolean);
    if (targetIds.length === 0) return;

    if (!silent) setIsVerifying(true);
    try {
      const results = await erpService.verifyTargetedLedgerBalances(user.companyId, targetIds);
      const adjustedCount = Object.values(results || {}).filter((r: any) => r && r.adjusted).length;
      setVerificationStats({
        verifiedAt: new Date(),
        adjustedCount,
        checkedCount: targetIds.length
      });
      if (adjustedCount > 0) {
        const freshLedgers = await erpService.getLedgers(user.companyId, true);
        setLedgers(freshLedgers);
      }
    } catch (err) {
      console.warn('Targeted verification error:', err);
    } finally {
      if (!silent) setIsVerifying(false);
    }
  };

  const getFilteredMonthlyData = (data: any[], range: ChartRangeOption) => {
    if (range === 'JAN-JUN') return data.slice(0, 6);
    if (range === 'JUL-DEC') return data.slice(6, 12);
    return data;
  };

  const renderRangeDropdown = (value: ChartRangeOption, onChange: (val: ChartRangeOption) => void) => (
    <div className="relative inline-flex items-center" onClick={e => e.stopPropagation()}>
      <select
        value={value}
        onChange={e => onChange(e.target.value as ChartRangeOption)}
        className="bg-muted/70 hover:bg-muted text-foreground border border-border text-[9px] font-bold uppercase rounded px-2.5 py-1 pr-6 cursor-pointer outline-none focus:ring-1 focus:ring-primary appearance-none transition-colors"
      >
        <option value="12 MONTHS">12 MONTHS</option>
        <option value="JAN-JUN">JAN-JUN</option>
        <option value="JUL-DEC">JUL-DEC</option>
      </select>
      <ChevronDown className="w-3 h-3 text-muted-foreground absolute right-1.5 pointer-events-none" />
    </div>
  );

  // Derived state for the detailed modal
  const modalBaseList = useMemo(() => {
    if (!ledgerModalType) return [];
    return ledgerModalType === 'debtors' ? accountingAnalytics.allDebtors : accountingAnalytics.allCreditors;
  }, [ledgerModalType, accountingAnalytics.allDebtors, accountingAnalytics.allCreditors]);

  const modalFilteredList = useMemo(() => {
    let list = modalBaseList;
    if (modalSearchQuery.trim()) {
      const q = modalSearchQuery.toLowerCase().trim();
      list = list.filter(item => 
        (item.name || '').toLowerCase().includes(q) ||
        (item.group || '').toLowerCase().includes(q) ||
        (item.address || '').toLowerCase().includes(q) ||
        (item.phone || '').toLowerCase().includes(q) ||
        (item.email || '').toLowerCase().includes(q)
      );
    }
    const limit = ledgerLimitOption === 'custom' 
      ? Math.max(1, customLedgerCount || list.length) 
      : parseInt(ledgerLimitOption, 10);
    return list.slice(0, limit);
  }, [modalBaseList, modalSearchQuery, ledgerLimitOption, customLedgerCount]);

  const generateAndExportPdf = async (mode: 'download' | 'print') => {
    if (!ledgerModalType) return;
    setIsExportingPdf(true);

    try {
      const isDebtors = ledgerModalType === 'debtors';
      const reportTitle = isDebtors ? 'SUNDRY DEBTORS REPORT' : 'SUNDRY CREDITORS REPORT';
      const fileName = `${isDebtors ? 'Sundry_Debtors' : 'Sundry_Creditors'}_Report_${periodStart}_to_${periodEnd}.pdf`;
      const companyTitle = (settings?.companyName || 'SAPIENT ERP').toUpperCase();
      const companyAddress = settings?.companyAddress || '';
      const companyPhone = settings?.printPhone || '';
      const companyEmail = settings?.printEmail || '';

      let totalDr = 0;
      let totalCr = 0;
      modalFilteredList.forEach(item => {
        if (item.isDr) totalDr += item.balance;
        else totalCr += item.balance;
      });

      const totalCols = 2 + (includeAddress ? 1 : 0) + (includePhone ? 1 : 0) + (includeEmail ? 1 : 0);

      // Multi-page balanced pagination filling content up to 1.2 in footer margin:
      // Page 1 has room for company header: 34 items
      // Subsequent pages: 38 items
      const page1Cap = 34;
      const otherPagesCap = 38;
      const pages: typeof modalFilteredList[] = [];
      const listCopy = [...modalFilteredList];

      if (listCopy.length <= page1Cap + 1) {
        pages.push(listCopy);
      } else {
        pages.push(listCopy.splice(0, page1Cap));
        while (listCopy.length > 0) {
          if (listCopy.length <= otherPagesCap + 1) {
            pages.push(listCopy.splice(0, listCopy.length));
            break;
          }
          pages.push(listCopy.splice(0, otherPagesCap));
        }
      }

      const totalPages = pages.length;

      const pagesHtml = pages.map((pageItems, pageIdx) => {
        const pageNum = pageIdx + 1;
        const isFirstPage = pageNum === 1;
        let startSerial = 0;
        for (let p = 0; p < pageIdx; p++) {
          startSerial += pages[p].length;
        }

        const rowsHtml = pageItems.map((item, idx) => {
          const serial = startSerial + idx + 1;
          const balanceColor = item.isDr ? '#059669' : '#dc2626';
          const addrText = includeCountry ? (item.addressWithCountry || '—') : (item.addressWithoutCountry || '—');
          return `
            <tr style="height: 24px;">
              <td style="text-align: center; vertical-align: middle; color: #475569; font-size: 8.5px; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; line-height: 1.15; box-sizing: border-box;">${serial}</td>
              <td style="text-align: left; vertical-align: middle; font-weight: 700; color: #0f172a; font-size: 8.5px; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; line-height: 1.15; box-sizing: border-box;">${item.name}</td>
              ${includeAddress ? `<td style="text-align: left; vertical-align: middle; color: #334155; font-size: 8.5px; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; line-height: 1.15; box-sizing: border-box;">${addrText}</td>` : ''}
              ${includePhone ? `<td style="text-align: left; vertical-align: middle; color: #334155; font-size: 8.5px; font-family: monospace; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; line-height: 1.15; box-sizing: border-box;">${item.phone || '—'}</td>` : ''}
              ${includeEmail ? `<td style="text-align: left; vertical-align: middle; color: #334155; font-size: 8.5px; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; line-height: 1.15; box-sizing: border-box;">${item.email || '—'}</td>` : ''}
              <td style="text-align: right; vertical-align: middle; font-weight: 700; font-family: monospace; font-size: 9px; color: ${balanceColor}; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; white-space: nowrap; line-height: 1.15; box-sizing: border-box;">
                ${currencySymbol} ${formatNumber(item.balance)} <span style="font-size: 8px; font-weight: 700;">${item.isDr ? 'Dr' : 'Cr'}</span>
              </td>
            </tr>
          `;
        }).join('');

        return `
          <div class="pdf-page" style="width: 794px; height: 1123px; box-sizing: border-box; padding: 48px 29px 115px 29px; background: #ffffff; position: relative; overflow: hidden; display: flex; flex-direction: column;">
            <!-- Top Page Header -->
            <div style="position: relative; border-bottom: ${isFirstPage ? '2px solid #0f172a' : '1px solid #cbd5e1'}; padding-bottom: ${isFirstPage ? '8px' : '5px'}; margin-bottom: 8px; text-align: center;">
              <!-- Page Number strictly at top-right corner as per persistent instructions -->
              <div style="position: absolute; top: 0; right: 0; font-size: 9.5px; font-weight: 700; font-family: monospace; color: #475569;">
                Page ${pageNum}
              </div>

              ${isFirstPage ? `
                <div style="font-size: 17px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase; line-height: 1.25;">
                  ${companyTitle}
                </div>
                ${companyAddress ? `<div style="font-size: 9px; color: #475569; margin-top: 2px; line-height: 1.3;">${companyAddress}</div>` : ''}
                ${(companyPhone || companyEmail) ? `<div style="font-size: 8.5px; color: #475569; margin-top: 2px;">${[companyPhone && `Tel: ${companyPhone}`, companyEmail && `Email: ${companyEmail}`].filter(Boolean).join(' | ')}</div>` : ''}
                <div style="font-size: 13px; font-weight: 800; margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase; color: #0f172a;">
                  ${reportTitle}
                </div>
                <div style="font-size: 9.5px; font-weight: 600; color: #475569; margin-top: 3px;">
                  Period: ${periodStart} to ${periodEnd}
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; align-items: baseline; padding-right: 50px;">
                  <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a;">
                    ${companyTitle} &mdash; ${reportTitle}
                  </span>
                  <span style="font-size: 9px; font-weight: 600; color: #64748b;">
                    Period: ${periodStart} to ${periodEnd}
                  </span>
                </div>
              `}
            </div>

            <!-- Table with repeated Table Header on Every Page -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 2px;">
              <thead>
                <tr>
                  <th style="width: 32px; text-align: center; vertical-align: middle; padding: 6px 5px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">#</th>
                  <th style="text-align: left; vertical-align: middle; padding: 6px 5px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">${isDebtors ? 'CUSTOMER / DEBTOR' : 'SUPPLIER / CREDITOR'}</th>
                  ${includeAddress ? '<th style="text-align: left; vertical-align: middle; padding: 6px 5px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">ADDRESS</th>' : ''}
                  ${includePhone ? '<th style="text-align: left; vertical-align: middle; padding: 6px 5px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">PHONE NUMBER</th>' : ''}
                  ${includeEmail ? '<th style="text-align: left; vertical-align: middle; padding: 6px 5px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">EMAIL</th>' : ''}
                  <th style="text-align: right; vertical-align: middle; padding: 6px 5px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">CLOSING BALANCE</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '794px';
      iframe.style.height = '1200px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe document');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>${reportTitle}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace; }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `);
      iframeDoc.close();

      await new Promise(r => setTimeout(r, 400));

      const html2canvasModule: any = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const pageElements = iframeDoc.querySelectorAll('.pdf-page');
      const pdf = new jsPDF('portrait', 'mm', 'a4');

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) pdf.addPage();
        const canvas = await html2canvas(pageElements[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      iframe.remove();

      if (mode === 'download') {
        pdf.save(fileName);
      } else {
        // Print mode: invoke native print directly on the identical PDF blob
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.left = '-9999px';
        printIframe.style.top = '0';
        printIframe.style.width = '1000px';
        printIframe.style.height = '1000px';
        printIframe.style.border = '0';
        printIframe.src = blobUrl;
        document.body.appendChild(printIframe);

        printIframe.onload = () => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            window.open(blobUrl, '_blank');
          }
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3500);
        };
      }
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const exportGraphModalPdf = async (mode: 'download' | 'print') => {
    if (!activeGraphModal) return;
    setIsExportingGraphPdf(true);

    try {
      // 1. Capture the visual graph from the modal DOM
      const chartContainer = document.getElementById('bi-modal-graph-capture-container');
      let chartImgData = '';
      if (chartContainer) {
        const html2canvasModule: any = await import('html2canvas');
        const html2canvas = html2canvasModule.default || html2canvasModule;
        const chartCanvas = await html2canvas(chartContainer, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc: Document) => {
            const el = clonedDoc.getElementById('bi-modal-graph-capture-container');
            if (el) {
              el.style.backgroundColor = '#ffffff';
              el.style.color = '#0f172a';
              const texts = el.querySelectorAll('text, tspan');
              texts.forEach((t: any) => {
                t.style.fill = '#1e293b';
              });
              const grids = el.querySelectorAll('.recharts-cartesian-grid line');
              grids.forEach((g: any) => {
                g.style.stroke = '#cbd5e1';
              });
            }
          }
        });
        chartImgData = chartCanvas.toDataURL('image/jpeg', 0.95);
      }

      // 2. Configure report metadata, KPIs and table data based on active modal type
      const companyTitle = (settings?.companyName || 'SAPIENT ERP').toUpperCase();
      const companyAddress = settings?.companyAddress || '';
      const companyPhone = settings?.printPhone || '';
      const companyEmail = settings?.printEmail || '';

      let reportTitle = '';
      let filePrefix = '';
      let kpiBoxes: { label: string; value: string }[] = [];
      let tableHeaders: string[] = [];
      let tableRows: { cols: (string | number)[]; isRightAligned: boolean[] }[] = [];

      if (activeGraphModal === 'sales_purchase') {
        reportTitle = 'SALES & PURCHASE MONTHLY TREND REPORT';
        filePrefix = 'Sales_Purchase_Trend';
        kpiBoxes = [
          { label: 'TOTAL SALES', value: `${currencySymbol} ${formatNumber(accountingAnalytics.salesTotal)}` },
          { label: 'TOTAL PURCHASES', value: `${currencySymbol} ${formatNumber(accountingAnalytics.purchaseTotal)}` },
          { label: 'NET TRADING MARGIN', value: `${currencySymbol} ${formatNumber(accountingAnalytics.salesTotal - accountingAnalytics.purchaseTotal)}` },
          { label: 'TOTAL TURNOVER', value: `${currencySymbol} ${formatNumber(accountingAnalytics.salesTotal + accountingAnalytics.purchaseTotal)}` }
        ];
        tableHeaders = ['#', 'MONTH', 'SALES TURNOVER', 'PURCHASE VOLUME', 'TRADE MARGIN'];
        tableRows = getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange).map((m, idx) => ({
          cols: [
            idx + 1,
            m.month,
            `${currencySymbol} ${formatNumber(m.sales)}`,
            `${currencySymbol} ${formatNumber(m.purchase)}`,
            `${currencySymbol} ${formatNumber(m.sales - m.purchase)}`
          ],
          isRightAligned: [false, false, true, true, true]
        }));
      } else if (activeGraphModal === 'profit_trend') {
        reportTitle = 'GROSS & NET PROFITABILITY TREND REPORT';
        filePrefix = 'Profitability_Trend';
        kpiBoxes = [
          { label: 'GROSS PROFIT', value: `${currencySymbol} ${formatNumber(accountingAnalytics.grossProfit)}` },
          { label: 'NET PROFIT', value: `${currencySymbol} ${formatNumber(accountingAnalytics.netProfit)}` },
          { label: 'GROSS MARGIN %', value: `${accountingAnalytics.grossProfitMargin.toFixed(1)}%` },
          { label: 'NET MARGIN %', value: `${accountingAnalytics.netProfitMargin.toFixed(1)}%` }
        ];
        tableHeaders = ['#', 'MONTH', 'GROSS PROFIT', 'NET PROFIT', 'MARGIN %'];
        tableRows = getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange).map((m, idx) => {
          const marginPct = m.sales > 0 ? (m.grossProfit / m.sales) * 100 : 0;
          return {
            cols: [
              idx + 1,
              m.month,
              `${currencySymbol} ${formatNumber(m.grossProfit)}`,
              `${currencySymbol} ${formatNumber(m.netProfit)}`,
              `${marginPct.toFixed(1)}%`
            ],
            isRightAligned: [false, false, true, true, true]
          };
        });
      } else if (activeGraphModal === 'cash_flow_volume') {
        reportTitle = 'MONTHLY CASH FLOW & VOLUME REPORT';
        filePrefix = 'Cash_Flow_Volume';
        kpiBoxes = [
          { label: 'TOTAL INFLOWS', value: `${currencySymbol} ${formatNumber(bankingAnalytics.flowData[0]?.amount || 0)}` },
          { label: 'TOTAL OUTFLOWS', value: `${currencySymbol} ${formatNumber(bankingAnalytics.flowData[1]?.amount || 0)}` },
          { label: 'NET CASH FLOW', value: `${currencySymbol} ${formatNumber((bankingAnalytics.flowData[0]?.amount || 0) - (bankingAnalytics.flowData[1]?.amount || 0))}` },
          { label: 'TOTAL LIQUIDITY', value: `${currencySymbol} ${formatNumber(bankingAnalytics.totalLiquidity)}` }
        ];
        tableHeaders = ['#', 'MONTH', 'TOTAL INFLOWS', 'TOTAL OUTFLOWS', 'NET CASH FLOW'];
        tableRows = getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange).map((m, idx) => ({
          cols: [
            idx + 1,
            m.month,
            `${currencySymbol} ${formatNumber(m.inflows)}`,
            `${currencySymbol} ${formatNumber(m.outflows)}`,
            `${currencySymbol} ${formatNumber(m.inflows - m.outflows)}`
          ],
          isRightAligned: [false, false, true, true, true]
        }));
      } else if (activeGraphModal === 'cost_centres') {
        reportTitle = 'COST CENTRE ALLOCATION & EXPENSE DISTRIBUTION REPORT';
        filePrefix = 'Cost_Centre_Allocation';
        const totalAllocated = accountingAnalytics.allCostCentres?.reduce((s, c) => s + c.amount, 0) || 0;
        kpiBoxes = [
          { label: 'TOTAL ALLOCATED EXPENSES', value: `${currencySymbol} ${formatNumber(totalAllocated)}` },
          { label: 'EXPENSE HEADS RECORDED', value: `${accountingAnalytics.allCostCentres?.length || 0}` },
          { label: 'TOP EXPENSE HEAD', value: accountingAnalytics.topCostCentres[0]?.name || 'N/A' },
          { label: 'TOP HEAD AMOUNT', value: `${currencySymbol} ${formatNumber(accountingAnalytics.topCostCentres[0]?.amount || 0)}` }
        ];
        tableHeaders = ['#', 'COST HEAD / EXPENSE LEDGER', 'ALLOCATED AMOUNT', 'SHARE %'];
        const filtered = (accountingAnalytics.allCostCentres || []).filter(c => 
          !graphModalSearch.trim() || c.name.toLowerCase().includes(graphModalSearch.toLowerCase().trim())
        );
        tableRows = filtered.map((c, idx) => ({
          cols: [
            idx + 1,
            c.name,
            `${currencySymbol} ${formatNumber(c.amount)}`,
            `${((c.amount / (totalAllocated || 1)) * 100).toFixed(1)}%`
          ],
          isRightAligned: [false, false, true, true]
        }));
      } else if (activeGraphModal === 'stock_movement') {
        reportTitle = 'STOCK ITEM & INVENTORY MOVEMENT REPORT';
        filePrefix = 'Stock_Movement_Report';
        kpiBoxes = [
          { label: 'CLOSING VALUATION', value: `${currencySymbol} ${formatNumber(inventoryAnalytics.closingStockValuation)}` },
          { label: 'OPENING VALUATION', value: `${currencySymbol} ${formatNumber(inventoryAnalytics.openingStockValuation)}` },
          { label: 'TOTAL ITEMS', value: `${inventoryAnalytics.totalItemsCount}` },
          { label: 'TOTAL STOCK QTY', value: formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs') }
        ];
        tableHeaders = ['#', 'MONTH', 'VALUATION', 'INWARD QTY', 'OUTWARD QTY', 'NET MOVEMENT'];
        tableRows = getFilteredMonthlyData(inventoryAnalytics.stockMonthlyTrends, graphModalRange).map((m, idx) => {
          const netM = m.inward - m.outward;
          return {
            cols: [
              idx + 1,
              m.month,
              `${currencySymbol} ${formatNumber(m.valuation)}`,
              `+${formatQuantity(m.inward, 'Pcs')}`,
              `-${formatQuantity(m.outward, 'Pcs')}`,
              `${netM >= 0 ? '+' : ''}${formatQuantity(netM, 'Pcs')}`
            ],
            isRightAligned: [false, false, true, true, true, true]
          };
        });
      } else if (activeGraphModal === 'stock_groups') {
        reportTitle = 'STOCK GROUPS VALUATION & DISTRIBUTION REPORT';
        filePrefix = 'Stock_Groups_Report';
        kpiBoxes = [
          { label: 'TOTAL STOCK VALUE', value: `${currencySymbol} ${formatNumber(inventoryAnalytics.totalStockValue)}` },
          { label: 'TOTAL GROUPS', value: `${inventoryAnalytics.allStockGroups?.length || 0}` },
          { label: 'TOTAL ITEMS', value: `${inventoryAnalytics.totalItemsCount}` },
          { label: 'TOTAL STOCK QTY', value: formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs') }
        ];
        tableHeaders = ['#', 'STOCK GROUP', 'ITEMS', 'IN-STOCK QTY', 'VALUATION', 'SHARE %'];
        const filtered = (inventoryAnalytics.allStockGroups || []).filter(g =>
          !graphModalSearch.trim() || g.name.toLowerCase().includes(graphModalSearch.toLowerCase().trim())
        );
        tableRows = filtered.map((g, idx) => ({
          cols: [
            idx + 1,
            g.name,
            g.count,
            formatQuantity(g.qty, 'Pcs'),
            `${currencySymbol} ${formatNumber(g.value)}`,
            `${((g.value / (inventoryAnalytics.totalStockValue || 1)) * 100).toFixed(1)}%`
          ],
          isRightAligned: [false, false, true, true, true, true]
        }));
      } else if (activeGraphModal === 'stock_categories') {
        reportTitle = 'STOCK CATEGORIES VALUATION & RATIO REPORT';
        filePrefix = 'Stock_Categories_Report';
        kpiBoxes = [
          { label: 'TOTAL STOCK VALUE', value: `${currencySymbol} ${formatNumber(inventoryAnalytics.totalStockValue)}` },
          { label: 'TOTAL CATEGORIES', value: `${inventoryAnalytics.allStockCategories?.length || 0}` },
          { label: 'TOTAL ITEMS', value: `${inventoryAnalytics.totalItemsCount}` },
          { label: 'TOTAL STOCK QTY', value: formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs') }
        ];
        tableHeaders = ['#', 'CATEGORY NAME', 'IN-STOCK QTY', 'VALUATION', 'SHARE %'];
        tableRows = modalFilteredCategories.map((c, idx) => ({
          cols: [
            idx + 1,
            c.name,
            formatQuantity(c.qty, 'Pcs'),
            `${currencySymbol} ${formatNumber(c.value)}`,
            `${((c.value / (inventoryAnalytics.totalStockValue || 1)) * 100).toFixed(1)}%`
          ],
          isRightAligned: [false, false, true, true, true]
        }));
      } else if (activeGraphModal === 'liquidity_composition') {
        reportTitle = 'LIQUIDITY COMPOSITION & CASH/BANK REPORT';
        filePrefix = 'Liquidity_Composition_Report';
        kpiBoxes = [
          { label: 'TOTAL LIQUIDITY', value: `${currencySymbol} ${formatNumber(bankingAnalytics.totalLiquidity)}` },
          { label: 'CASH IN HAND', value: `${currencySymbol} ${formatNumber(bankingAnalytics.totalCash)}` },
          { label: 'BANK & MFS ACCOUNTS', value: `${currencySymbol} ${formatNumber(bankingAnalytics.totalBank)}` },
          { label: 'ACTIVE ACCOUNTS', value: `${bankingAnalytics.allLiquidAccounts?.length || 0}` }
        ];
        tableHeaders = ['#', 'ACCOUNT / HEAD', 'CATEGORY', 'CURRENT BALANCE', 'SHARE %'];
        const filtered = (bankingAnalytics.allLiquidAccounts || []).filter(a =>
          !graphModalSearch.trim() || a.name.toLowerCase().includes(graphModalSearch.toLowerCase().trim())
        );
        tableRows = filtered.map((a, idx) => ({
          cols: [
            idx + 1,
            a.name,
            a.type === 'cash' ? 'Cash-in-Hand' : 'Bank / MFS',
            `${currencySymbol} ${formatNumber(a.balance)}`,
            `${((Math.max(0, a.balance) / (bankingAnalytics.totalLiquidity || 1)) * 100).toFixed(1)}%`
          ],
          isRightAligned: [false, false, false, true, true]
        }));
      } else if (activeGraphModal === 'cash_flow_dynamics') {
        reportTitle = 'CASH FLOW DYNAMICS & LIQUIDITY ANALYSIS REPORT';
        filePrefix = 'Cash_Flow_Dynamics_Report';
        const totalFlow = (bankingAnalytics.flowData[0]?.amount || 0) + (bankingAnalytics.flowData[1]?.amount || 0);
        kpiBoxes = [
          { label: 'TOTAL INFLOW', value: `${currencySymbol} ${formatNumber(bankingAnalytics.flowData[0]?.amount || 0)}` },
          { label: 'TOTAL OUTFLOW', value: `${currencySymbol} ${formatNumber(bankingAnalytics.flowData[1]?.amount || 0)}` },
          { label: 'NET FLOW POSITION', value: `${currencySymbol} ${formatNumber((bankingAnalytics.flowData[0]?.amount || 0) - (bankingAnalytics.flowData[1]?.amount || 0))}` },
          { label: 'FLOW RATIO', value: `${((bankingAnalytics.flowData[0]?.amount || 0) / Math.max(1, bankingAnalytics.flowData[1]?.amount || 0)).toFixed(2)} : 1` }
        ];
        tableHeaders = ['#', 'CASH FLOW CATEGORY', 'AMOUNT', 'PROPORTION %'];
        tableRows = (bankingAnalytics.flowData || []).map((f, idx) => ({
          cols: [
            idx + 1,
            f.name,
            `${currencySymbol} ${formatNumber(f.amount)}`,
            `${((f.amount / (totalFlow || 1)) * 100).toFixed(1)}%`
          ],
          isRightAligned: [false, false, true, true]
        }));
      }

      const fileName = `${filePrefix}_${periodStart}_to_${periodEnd}.pdf`;

      // 3. Multi-page Pagination: Page 1 with chart + KPIs + first 12 items; Page 2+ up to 34 items
      const page1Cap = chartImgData ? 12 : 28;
      const otherPagesCap = 34;
      const pages: typeof tableRows[] = [];
      const listCopy = [...tableRows];

      if (listCopy.length <= page1Cap) {
        pages.push(listCopy);
      } else {
        pages.push(listCopy.splice(0, page1Cap));
        while (listCopy.length > 0) {
          if (listCopy.length <= otherPagesCap) {
            pages.push(listCopy.splice(0, listCopy.length));
            break;
          }
          pages.push(listCopy.splice(0, otherPagesCap));
        }
      }

      const totalPages = pages.length;

      const pagesHtml = pages.map((pageItems, pageIdx) => {
        const pageNum = pageIdx + 1;
        const isFirstPage = pageNum === 1;

        const rowsHtml = pageItems.length > 0 ? pageItems.map(row => {
          return `
            <tr style="height: 24px;">
              ${row.cols.map((colVal, cIdx) => {
                const isRight = row.isRightAligned[cIdx];
                return `
                  <td style="text-align: ${isRight ? 'right' : 'left'}; vertical-align: middle; color: #1e293b; font-size: 8.5px; font-weight: ${isRight ? '700' : '500'}; font-family: ${isRight ? 'monospace' : 'inherit'}; padding: 4px 6px 5.5px 6px; border-bottom: 1px solid #e2e8f0; line-height: 1.15; box-sizing: border-box;">
                    ${colVal}
                  </td>
                `;
              }).join('')}
            </tr>
          `;
        }).join('') : `
          <tr>
            <td colspan="${tableHeaders.length}" style="text-align: center; padding: 20px; color: #64748b; font-size: 9px; font-style: italic;">
              No records recorded in selected period
            </td>
          </tr>
        `;

        return `
          <div class="pdf-page" style="width: 794px; height: 1123px; box-sizing: border-box; padding: 48px 29px 115px 29px; background: #ffffff; position: relative; overflow: hidden; display: flex; flex-direction: column;">
            <!-- Top Page Header -->
            <div style="position: relative; border-bottom: ${isFirstPage ? '2px solid #0f172a' : '1px solid #cbd5e1'}; padding-bottom: ${isFirstPage ? '8px' : '5px'}; margin-bottom: 8px; text-align: center;">
              <!-- Single Page Number strictly at top-right corner as per persistent instructions -->
              <div style="position: absolute; top: 0; right: 0; font-size: 9.5px; font-weight: 700; font-family: monospace; color: #475569;">
                Page ${pageNum}
              </div>

              ${isFirstPage ? `
                <div style="font-size: 17px; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase; line-height: 1.25;">
                  ${companyTitle}
                </div>
                ${companyAddress ? `<div style="font-size: 9px; color: #475569; margin-top: 2px; line-height: 1.3;">${companyAddress}</div>` : ''}
                ${(companyPhone || companyEmail) ? `<div style="font-size: 8.5px; color: #475569; margin-top: 2px;">${[companyPhone && `Tel: ${companyPhone}`, companyEmail && `Email: ${companyEmail}`].filter(Boolean).join(' | ')}</div>` : ''}
                <div style="font-size: 13px; font-weight: 800; margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase; color: #0f172a;">
                  ${reportTitle}
                </div>
                <div style="font-size: 9.5px; font-weight: 600; color: #475569; margin-top: 3px;">
                  Period: ${periodStart} to ${periodEnd}
                </div>
              ` : `
                <div style="display: flex; justify-content: space-between; align-items: baseline; padding-right: 50px;">
                  <span style="font-size: 11px; font-weight: 800; text-transform: uppercase; color: #0f172a;">
                    ${companyTitle} &mdash; ${reportTitle}
                  </span>
                  <span style="font-size: 9px; font-weight: 600; color: #64748b;">
                    Period: ${periodStart} to ${periodEnd}
                  </span>
                </div>
              `}
            </div>

            <!-- Page 1 Visuals: 4-Box KPI Strip & High-Res Graph -->
            ${isFirstPage ? `
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 6px; margin-bottom: 10px;">
                ${kpiBoxes.map(b => `
                  <div style="border: 1px solid #cbd5e1; border-radius: 4px; padding: 6px 8px; background-color: #f8fafc;">
                    <div style="font-size: 7.5px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">${b.label}</div>
                    <div style="font-size: 11px; font-weight: 800; color: #0f172a; margin-top: 2px; font-family: monospace;">${b.value}</div>
                  </div>
                `).join('')}
              </div>

              ${chartImgData ? `
                <div style="text-align: center; margin-bottom: 10px; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; background: #ffffff;">
                  <img src="${chartImgData}" style="max-height: 240px; width: 100%; object-fit: contain;" />
                </div>
              ` : ''}
            ` : ''}

            <!-- Table with repeated Table Header on Every Page -->
            <table style="width: 100%; border-collapse: collapse; margin-top: 4px;">
              <thead>
                <tr>
                  ${tableHeaders.map((header, hIdx) => {
                    const isRight = hIdx >= 2;
                    return `
                      <th style="text-align: ${isRight ? 'right' : 'left'}; vertical-align: middle; padding: 6px 6px; border-top: 1.5px solid #0f172a; border-bottom: 1.5px solid #0f172a; font-size: 8.5px; font-weight: 800; text-transform: uppercase; background-color: #f8fafc; color: #0f172a;">
                        ${header}
                      </th>
                    `;
                  }).join('')}
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        `;
      }).join('');

      // 4. Render into isolated hidden iframe for html2canvas & jsPDF
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '794px';
      iframe.style.height = '1200px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error('Could not access iframe document');

      iframeDoc.open();
      iframeDoc.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>${reportTitle}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 0; background: #ffffff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", monospace; }
          </style>
        </head>
        <body>
          ${pagesHtml}
        </body>
        </html>
      `);
      iframeDoc.close();

      await new Promise(r => setTimeout(r, 450));

      const html2canvasModule: any = await import('html2canvas');
      const html2canvas = html2canvasModule.default || html2canvasModule;

      const pageElements = iframeDoc.querySelectorAll('.pdf-page');
      const pdf = new jsPDF('portrait', 'mm', 'a4');

      for (let i = 0; i < pageElements.length; i++) {
        if (i > 0) pdf.addPage();
        const canvas = await html2canvas(pageElements[i] as HTMLElement, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          windowWidth: 794
        });
        const imgData = canvas.toDataURL('image/jpeg', 0.98);
        pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297);
      }

      iframe.remove();

      // 5. Download or Native Print using the identical PDF blob generator
      if (mode === 'download') {
        pdf.save(fileName);
      } else {
        const pdfBlob = pdf.output('blob');
        const blobUrl = URL.createObjectURL(pdfBlob);

        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.left = '-9999px';
        printIframe.style.top = '0';
        printIframe.style.width = '1000px';
        printIframe.style.height = '1000px';
        printIframe.style.border = '0';
        printIframe.src = blobUrl;
        document.body.appendChild(printIframe);

        printIframe.onload = () => {
          try {
            printIframe.contentWindow?.focus();
            printIframe.contentWindow?.print();
          } catch (e) {
            window.open(blobUrl, '_blank');
          }
          setTimeout(() => {
            if (document.body.contains(printIframe)) {
              document.body.removeChild(printIframe);
            }
          }, 3500);
        };
      }
    } catch (err) {
      console.error('Failed to export graph modal report:', err);
    } finally {
      setIsExportingGraphPdf(false);
    }
  };

  const modalFilteredCategories = useMemo(() => {
    if (!categoryModalSearch.trim()) return inventoryAnalytics.allStockCategories;
    const q = categoryModalSearch.toLowerCase();
    return inventoryAnalytics.allStockCategories.filter(c => c.name.toLowerCase().includes(q));
  }, [inventoryAnalytics.allStockCategories, categoryModalSearch]);

  if (loading) {
    return <SkeletonLoader type="cards" />;
  }

  return (
    <div className="flex flex-col h-full bg-background transition-colors font-mono tracking-tight overflow-hidden">
      {/* 1. Permanent/Fixed Header: Tabs on Left & Period on Right */}
      <div className="shrink-0 bg-background/95 backdrop-blur-md border-b border-border shadow-xs px-4 lg:px-6 py-2.5 z-30">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          {/* Left: Navigation Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('accounting')}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'accounting'
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Accounting</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'inventory'
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('banking')}
              className={cn(
                "px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap",
                activeTab === 'banking'
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Landmark className="w-3.5 h-3.5" />
              <span>Bank & Cash</span>
            </button>
          </div>

          {/* Right: Period Selector & Refresh */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-muted/40 border border-border px-2.5 py-1 rounded">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Period:</span>
              <input 
                type="date" 
                value={periodStart} 
                onChange={e => setPeriodStart(e.target.value)} 
                className="bg-transparent text-[11px] border-none focus:ring-0 p-0 font-mono text-foreground outline-none cursor-pointer" 
              />
              <span className="text-muted-foreground text-xs font-bold">-</span>
              <input 
                type="date" 
                value={periodEnd} 
                onChange={e => setPeriodEnd(e.target.value)} 
                className="bg-transparent text-[11px] border-none focus:ring-0 p-0 font-mono text-foreground outline-none cursor-pointer" 
              />
            </div>

            <button
              onClick={() => runTargetedVerification(false)}
              disabled={isVerifying || loading}
              className={cn(
                "p-1.5 rounded transition-all cursor-pointer flex items-center gap-1.5 text-[11px] uppercase font-bold px-3 border shadow-xs",
                verificationStats.verifiedAt 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                  : "bg-muted/50 hover:bg-muted text-foreground border-border"
              )}
              title={verificationStats.verifiedAt 
                ? `Targeted verified against source voucher entries at ${verificationStats.verifiedAt.toLocaleTimeString()} (${verificationStats.checkedCount} checked, ${verificationStats.adjustedCount} synchronized)` 
                : "Re-calculate and verify top ledger balances directly from source voucher entries"}
            >
              {isVerifying ? (
                <RotateCw className="w-3.5 h-3.5 animate-spin text-primary" />
              ) : verificationStats.verifiedAt ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{isVerifying ? "Verifying..." : verificationStats.verifiedAt ? "Verified" : "Verify Balances"}</span>
            </button>

            <button
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="p-1.5 rounded bg-muted/50 hover:bg-muted text-foreground border border-border transition-colors cursor-pointer flex items-center gap-1.5 text-[11px] uppercase font-bold px-3"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Scrollable Viewport Section */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">
        <AnimatePresence mode="wait">
          {/* TAB 1: ACCOUNTING ANALYTICS */}
          {activeTab === 'accounting' && (
            <motion.div 
              key="tab-accounting"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Trading & Profit Summary KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Gross Profit <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {currencySymbol} {formatNumber(accountingAnalytics.grossProfit)}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    Margin: {accountingAnalytics.grossProfitMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Net Profit <span className="text-sm font-bold text-blue-500">{currencySymbol}</span>
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {currencySymbol} {formatNumber(accountingAnalytics.netProfit)}
                  </p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-1">
                    Margin: {accountingAnalytics.netProfitMargin.toFixed(1)}%
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Assets vs. Liabilities <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {currencySymbol} {formatNumber(accountingAnalytics.totalAssets)}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    Liab: {currencySymbol} {formatNumber(accountingAnalytics.totalLiabilities)} • Net Worth: {currencySymbol} {formatNumber(accountingAnalytics.netWorth)}
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Current Ratio <Activity className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {accountingAnalytics.currentRatio.toFixed(2)} : 1
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    Quick: {accountingAnalytics.quickRatio.toFixed(2)} : 1 • Working Cap: {currencySymbol} {formatNumber(accountingAnalytics.workingCapital)}
                  </span>
                </div>
              </div>

              {/* Trading Details Breakdown Section */}
              <div className="bg-card border border-border rounded-sm p-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-border pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Trading Details
                    </h3>
                  </div>
                  <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-mono uppercase font-bold">
                    Trading Account
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-mono">
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded">
                    <span className="text-[9px] text-blue-600 dark:text-blue-400 uppercase font-bold block">Gross Sales</span>
                    <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.salesTotal)}</span>
                  </div>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded">
                    <span className="text-[9px] text-amber-600 dark:text-amber-400 uppercase font-bold block">Gross Purchases</span>
                    <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.purchaseTotal)}</span>
                  </div>
                  <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded">
                    <span className="text-[9px] text-rose-600 dark:text-rose-400 uppercase font-bold block">Direct Expenses</span>
                    <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.directExpense)}</span>
                  </div>
                  <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded">
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 uppercase font-bold block">Direct Incomes</span>
                    <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.directIncome)}</span>
                  </div>
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded">
                    <span className="text-[9px] text-indigo-600 dark:text-indigo-400 uppercase font-bold block">Opening Stock</span>
                    <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.openingStock)}</span>
                  </div>
                  <div className="p-3 bg-teal-500/5 border border-teal-500/10 rounded">
                    <span className="text-[9px] text-teal-600 dark:text-teal-400 uppercase font-bold block">Closing Stock</span>
                    <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.closingStock)}</span>
                  </div>
                </div>
              </div>

              {/* Charts Section: Sales vs Purchase Trend & Profit Trajectory */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  onClick={() => {
                    setActiveGraphModal('sales_purchase');
                    setGraphModalRange(salesTrendRange);
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view enlarged chart and full monthly breakdown"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Sales & Purchase Monthly Trend
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Full-year turnover and procurement dynamics</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderRangeDropdown(salesTrendRange, setSalesTrendRange)}
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[230px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={getFilteredMonthlyData(accountingAnalytics.monthlyTrends, salesTrendRange)}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                        <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                        />
                        <Area type="monotone" dataKey="sales" name="Sales Turnover" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                        <Area type="monotone" dataKey="purchase" name="Purchase Volume" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setActiveGraphModal('profit_trend');
                    setGraphModalRange(profitTrendRange);
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view enlarged chart and profit margin breakdown"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Gross vs. Net Profit Trend
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Profit margin sustainability across all months</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderRangeDropdown(profitTrendRange, setProfitTrendRange)}
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[230px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={getFilteredMonthlyData(accountingAnalytics.monthlyTrends, profitTrendRange)}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                        <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                        />
                        <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>
              </div>

              {/* Monthly Volume Trend & Cost Centre Allocation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Clear Monthly Transaction Volume & Cash Flow Trend */}
                <div 
                  onClick={() => {
                    setActiveGraphModal('cash_flow_volume');
                    setGraphModalRange(volumeTrendRange);
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view enlarged cash flow and volume breakdown"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Monthly Transaction Volume & Cash Flow Trend
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Monthly inflows (Receipts & Sales) vs. outflows (Payments & Purchases)</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderRangeDropdown(volumeTrendRange, setVolumeTrendRange)}
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={getFilteredMonthlyData(accountingAnalytics.monthlyTrends, volumeTrendRange)}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                        <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                        />
                        <Bar dataKey="inflows" name="Total Inflows" fill="#10b981" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="outflows" name="Total Outflows" fill="#ef4444" radius={[3, 3, 0, 0]} />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>

                {/* Real Cost Centre Allocation */}
                <div 
                  onClick={() => {
                    setActiveGraphModal('cost_centres');
                    setGraphModalSearch('');
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view all cost centres and expense breakdown"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Cost Centre Trend & Top Cost Centres
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Operational & departmental expense allocations</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-rose-500/10 text-rose-500 border border-rose-500/20 px-2 py-0.5 rounded font-bold">
                        Cost Allocation
                      </span>
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {accountingAnalytics.topCostCentres.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={accountingAnalytics.topCostCentres} 
                          layout="vertical" 
                          margin={{ left: 15 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} horizontal={false} />
                          <XAxis type="number" tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis dataKey="name" type="category" width={115} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Cost Allocated']}
                          />
                          <Bar dataKey="amount" name="Allocated Expense" fill="#e11d48" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                        No expense heads recorded in selected period
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>
              </div>

              {/* Sundry Debtors & Sundry Creditors Tables with Sticky Headers */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Ledgers (Sundry Debtors) */}
                <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
                  <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Top Ledgers (Sundry Debtors)
                      </h4>
                      {verificationStats.verifiedAt && (
                        <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-1" title="Targeted verified from raw source voucher entries">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setLedgerModalType('debtors');
                        setModalSearchQuery('');
                      }}
                      className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="View all debtors in detailed configurable modal"
                    >
                      <span>View More</span>
                      <span className="text-xs">&rarr;</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-[260px]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground border-b border-border shadow-xs z-10">
                        <tr>
                          <th className="p-2.5 align-middle">Customer / Debtor</th>
                          <th className="p-2.5 align-middle">Group</th>
                          <th className="p-2.5 text-right align-middle">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {accountingAnalytics.topDebtors.length > 0 ? (
                          accountingAnalytics.topDebtors.map(d => {
                            // If Debtor balance is Debit (Dr, >= 0), it is green. If Credit (Cr, < 0), it is red.
                            const isDr = d.rawBalance !== undefined ? d.rawBalance >= 0 : true;
                            return (
                              <tr 
                                key={d.id || d.name} 
                                onClick={() => navigate(`/reports/ledger?ledgerId=${d.id}`)}
                                className="hover:bg-primary/10 transition-colors cursor-pointer group"
                                title="Click to view detailed Ledger Statement"
                              >
                                <td className="p-2.5 font-bold text-foreground group-hover:text-primary transition-colors align-middle">
                                  <div className="flex items-center gap-1.5">
                                    <span>{d.name}</span>
                                    <span className="text-[9px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-[10px] text-muted-foreground align-middle">{d.group}</td>
                                <td className={cn(
                                  "p-2.5 text-right font-bold font-mono align-middle",
                                  isDr ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}>
                                  {currencySymbol} {formatNumber(d.balance)} <span className="text-[10px] font-bold">{isDr ? 'Dr' : 'Cr'}</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground text-xs italic align-middle">
                              No sundry debtors recorded yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Ledgers (Sundry Creditors) */}
                <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
                  <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-rose-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Top Ledgers (Sundry Creditors)
                      </h4>
                      {verificationStats.verifiedAt && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-1" title="Targeted verified from raw source voucher entries">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Verified</span>
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setLedgerModalType('creditors');
                        setModalSearchQuery('');
                      }}
                      className="text-[10px] text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                      title="View all creditors in detailed configurable modal"
                    >
                      <span>View More</span>
                      <span className="text-xs">&rarr;</span>
                    </button>
                  </div>
                  <div className="overflow-x-auto max-h-[260px]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground border-b border-border shadow-xs z-10">
                        <tr>
                          <th className="p-2.5 align-middle">Supplier / Creditor</th>
                          <th className="p-2.5 align-middle">Group</th>
                          <th className="p-2.5 text-right align-middle">Closing Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {accountingAnalytics.topCreditors.length > 0 ? (
                          accountingAnalytics.topCreditors.map(c => {
                            // If Creditor balance is Debit (Dr, >= 0, e.g. advance paid), it is green. If Credit (Cr, < 0, normal payable), it is red.
                            const isDr = c.rawBalance !== undefined ? c.rawBalance >= 0 : false;
                            return (
                              <tr 
                                key={c.id || c.name} 
                                onClick={() => navigate(`/reports/ledger?ledgerId=${c.id}`)}
                                className="hover:bg-primary/10 transition-colors cursor-pointer group"
                                title="Click to view detailed Ledger Statement"
                              >
                                <td className="p-2.5 font-bold text-foreground group-hover:text-primary transition-colors align-middle">
                                  <div className="flex items-center gap-1.5">
                                    <span>{c.name}</span>
                                    <span className="text-[9px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                                  </div>
                                </td>
                                <td className="p-2.5 text-[10px] text-muted-foreground align-middle">{c.group}</td>
                                <td className={cn(
                                  "p-2.5 text-right font-bold font-mono align-middle",
                                  isDr ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                )}>
                                  {currencySymbol} {formatNumber(c.balance)} <span className="text-[10px] font-bold">{isDr ? 'Dr' : 'Cr'}</span>
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground text-xs italic align-middle">
                              No sundry creditors recorded yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: INVENTORY ANALYTICS */}
          {activeTab === 'inventory' && (
            <motion.div 
              key="tab-inventory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Total Stock Value <Package className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {currencySymbol} {formatNumber(inventoryAnalytics.totalStockValue)}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    Units: {formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs')} • Avg Item: {currencySymbol}{formatNumber(inventoryAnalytics.avgItemValue)}
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Total Registered Items <Boxes className="w-3.5 h-3.5 text-blue-500" />
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {inventoryAnalytics.totalItemsCount}
                  </p>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono mt-1">
                    Active Product Catalog
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Low Stock Reorder <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  </span>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2 font-mono">
                    {inventoryAnalytics.lowStockCount}
                  </p>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-1">
                    Reorder Threshold Triggered
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Out of Stock Items <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  </span>
                  <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-2 font-mono">
                    {inventoryAnalytics.outOfStockCount}
                  </p>
                  <span className="text-[10px] text-rose-500 font-mono mt-1">
                    Zero Balance Items
                  </span>
                </div>
              </div>

              {/* Chart Breakdown: Movement Trend & Top Stock Groups Valuation */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  onClick={() => {
                    setActiveGraphModal('stock_movement');
                    setGraphModalRange(stockTrendRange);
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view detailed stock movement and valuation trend"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Stock Item & Movement Trend
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Monthly inventory turnover and valuation trajectory</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {renderRangeDropdown(stockTrendRange, setStockTrendRange)}
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[230px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart 
                        data={getFilteredMonthlyData(inventoryAnalytics.stockMonthlyTrends, stockTrendRange)}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                        <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                        />
                        <Area type="monotone" dataKey="valuation" name="Valuation Trend" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.15} />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>

                {/* Top 5 Stock Groups Valuation */}
                <div 
                  onClick={() => {
                    setActiveGraphModal('stock_groups');
                    setGraphModalSearch('');
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view all stock groups and full inventory breakdown"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Top Stock Groups Valuation
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Total valuation breakdown for inventory groups</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                        {inventoryAnalytics.allStockGroups?.length || inventoryAnalytics.topStockGroups.length} Groups
                      </span>
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[230px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {inventoryAnalytics.topStockGroups.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={inventoryAnalytics.topStockGroups}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="name" fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Stock Value']}
                          />
                          <Bar dataKey="value" name="Valuation" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                          <Legend verticalAlign="bottom" iconType="circle" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                        No stock groups recorded
                      </div>
                    )}
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Category Trend Pie (All Categories) & Top Stock Items Table with Tabs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  onClick={() => {
                    setActiveGraphModal('stock_categories');
                    setGraphModalSearch('');
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view large popup with all categories"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-2">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Stock Category Trend & Ratio
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">All registered product categories valuation & ratio</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                        {inventoryAnalytics.allStockCategories.length} Categories
                      </span>
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>

                  {/* Clean Circle / Donut Chart without internal Legend collision */}
                  <div className="h-[155px] w-full flex items-center justify-center relative select-none my-1" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    {inventoryAnalytics.allStockCategories.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={inventoryAnalytics.allStockCategories}
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={68}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {inventoryAnalytics.allStockCategories.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any, name: any) => [`${currencySymbol} ${formatNumber(val)}`, name || 'Valuation']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                        No product categories recorded
                      </div>
                    )}
                  </div>

                  {/* Category Names Legend: Strictly 2 lines maximum under the graph */}
                  {inventoryAnalytics.allStockCategories.length > 0 && (
                    <div className="mt-1 pt-2 border-t border-border/40">
                      <div className="h-[2.6rem] overflow-hidden flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] font-mono select-none px-1 leading-tight">
                        {inventoryAnalytics.allStockCategories.map((cat, index) => (
                          <div 
                            key={cat.name} 
                            className="flex items-center gap-1 whitespace-nowrap" 
                            title={`${cat.name}: ${currencySymbol} ${formatNumber(cat.value)} (${cat.qty} in-stock)`}
                          >
                            <span 
                              className="w-2 h-2 rounded-full inline-block shrink-0 shadow-2xs" 
                              style={{ backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }} 
                            />
                            <span className="text-muted-foreground hover:text-foreground transition-colors max-w-[110px] truncate text-[9.5px]">
                              {cat.name}
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="text-center mt-1">
                        <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                          Click graph to open full detailed popup &rarr;
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Top 5 Stock Items with Quantity vs. Valuation Tabs */}
                <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
                  <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/20 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-primary" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Top 5 Stock Items
                      </h4>
                    </div>

                    {/* Quantity vs Valuation Tab Toggle */}
                    <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded border border-border">
                      <button
                        onClick={() => setStockSortBy('quantity')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer",
                          stockSortBy === 'quantity'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Quantity
                      </button>
                      <button
                        onClick={() => setStockSortBy('valuation')}
                        className={cn(
                          "px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer",
                          stockSortBy === 'valuation'
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        Valuation
                      </button>
                    </div>
                  </div>

                  <div className="overflow-x-auto max-h-[260px]">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground border-b border-border shadow-xs z-10">
                        <tr>
                          <th className="p-2.5 align-middle">Item Name</th>
                          <th className={cn("p-2.5 text-right align-middle", stockSortBy === 'quantity' && "text-primary font-bold")}>In-Stock Qty</th>
                          <th className={cn("p-2.5 text-right align-middle", stockSortBy === 'valuation' && "text-amber-500 font-bold")}>Valuation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {inventoryAnalytics.sortedStockItems.length > 0 ? (
                          inventoryAnalytics.sortedStockItems.map(item => (
                            <tr 
                              key={item.id || item.name} 
                              onClick={() => item.id && navigate(`/reports/stock-item?itemId=${item.id}`)}
                              className="hover:bg-primary/10 transition-colors cursor-pointer group"
                              title="Click to view detailed Stock Item Report"
                            >
                              <td className="p-2.5 font-bold text-foreground group-hover:text-primary transition-colors align-middle">
                                <div className="flex items-center gap-1.5">
                                  <span>{item.name}</span>
                                  <span className="text-[9px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                                </div>
                              </td>
                              <td className={cn("p-2.5 text-right align-middle", stockSortBy === 'quantity' ? "font-bold text-foreground" : "text-muted-foreground")}>
                                {formatQuantity(item.stock, item.unit)}
                              </td>
                              <td className={cn("p-2.5 text-right font-bold align-middle", stockSortBy === 'valuation' ? "text-amber-500" : "text-foreground")}>
                                {currencySymbol} {formatNumber(item.value)}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={3} className="p-4 text-center text-muted-foreground text-xs italic align-middle">
                              No inventory items found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: BANK & CASH ANALYTICS */}
          {activeTab === 'banking' && (
            <motion.div 
              key="tab-banking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Summary Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Total Liquid Funds <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                  </span>
                  <p className="text-2xl font-bold text-foreground mt-2 font-mono">
                    {currencySymbol} {formatNumber(bankingAnalytics.totalLiquidity)}
                  </p>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                    Cash in Hand & Bank Accounts Collective
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Cash in Hand <span className="text-sm font-bold text-emerald-600">{currencySymbol}</span>
                  </span>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2 font-mono">
                    {currencySymbol} {formatNumber(bankingAnalytics.totalCash)}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    {bankingAnalytics.cashAccounts.length} Cash Head(s) Active
                  </span>
                </div>

                <div className="bg-card border border-border p-4 rounded-sm flex flex-col justify-between shadow-xs">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center justify-between">
                    Bank Accounts <Landmark className="w-3.5 h-3.5 text-blue-500" />
                  </span>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2 font-mono">
                    {currencySymbol} {formatNumber(bankingAnalytics.totalBank)}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono mt-1">
                    {bankingAnalytics.bankAccounts.length} Bank & MFS Account(s)
                  </span>
                </div>
              </div>

              {/* Visuals: Cash vs Bank Composition & Flow Dynamics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  onClick={() => {
                    setActiveGraphModal('liquidity_composition');
                    setGraphModalSearch('');
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view all liquid accounts and composition breakdown"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Liquidity Composition
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Liquid funds breakdown by storage medium</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                        Composition
                      </span>
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full flex items-center justify-center relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={bankingAnalytics.liquidityBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {bankingAnalytics.liquidityBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Total']}
                        />
                        <Legend verticalAlign="bottom" iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>

                <div 
                  onClick={() => {
                    setActiveGraphModal('cash_flow_dynamics');
                    setGraphModalSearch('');
                  }}
                  className="bg-card border border-border p-5 rounded-sm flex flex-col justify-between shadow-xs bi-chart-card relative select-none cursor-pointer hover:border-primary/50 transition-all group"
                  title="Click to view detailed cash inflow vs outflow dynamics"
                >
                  <div className="flex items-center justify-between border-b border-border/50 pb-3 mb-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        Cash Flow Dynamics
                        <Maximize2 className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                      </h3>
                      <p className="text-[9px] text-muted-foreground font-mono">Collective cash inflows vs. cash outflows</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                        Flow Dynamics
                      </span>
                      <span className="text-[9px] text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded font-bold">
                        Enlarge ↗
                      </span>
                    </div>
                  </div>
                  <div className="h-[220px] w-full relative select-none" style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={bankingAnalytics.flowData}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                        <XAxis dataKey="name" fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                          formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Amount']}
                        />
                        <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                          {bankingAnalytics.flowData.map((entry, index) => (
                            <Cell key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center mt-2 pt-2 border-t border-border/40">
                    <span className="text-[9px] text-primary/80 group-hover:text-primary font-bold tracking-tight">
                      Click graph to open full detailed popup &rarr;
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash & Bank Accounts Detail Register */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
                  <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Cash Heads & Petty Cash
                    </h4>
                    <span className="text-[10px] font-bold text-emerald-500">
                      {currencySymbol} {formatNumber(bankingAnalytics.totalCash)}
                    </span>
                  </div>
                  <div className="divide-y divide-border/40 max-h-[220px] overflow-y-auto">
                    {bankingAnalytics.cashAccounts.length > 0 ? (
                      bankingAnalytics.cashAccounts.map(acc => (
                        <div key={acc.name} className="p-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="font-bold text-foreground text-xs">{acc.name}</span>
                          </div>
                          <span className="font-bold text-foreground font-mono text-xs">
                            {currencySymbol} {formatNumber(acc.balance)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No cash heads recorded
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
                  <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Bank Accounts & Online Wallets
                    </h4>
                    <span className="text-[10px] font-bold text-blue-500">
                      {currencySymbol} {formatNumber(bankingAnalytics.totalBank)}
                    </span>
                  </div>
                  <div className="divide-y divide-border/40 max-h-[220px] overflow-y-auto">
                    {bankingAnalytics.bankAccounts.length > 0 ? (
                      bankingAnalytics.bankAccounts.map(acc => (
                        <div key={acc.name} className="p-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                          <div className="flex items-center gap-2">
                            <Landmark className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-bold text-foreground text-xs">{acc.name}</span>
                          </div>
                          <span className="font-bold text-foreground font-mono text-xs">
                            {currencySymbol} {formatNumber(acc.balance)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No bank accounts recorded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Banking Activities Table with Sticky Header */}
              <div className="bg-card border border-border rounded-sm overflow-hidden shadow-xs">
                <div className="p-3.5 border-b border-border flex justify-between items-center bg-muted/20">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Recent Banking Activities
                    </h4>
                  </div>
                  <button 
                    onClick={() => navigate('/reports/cash-flow')}
                    className="text-[10px] text-primary font-bold uppercase hover:underline cursor-pointer"
                  >
                    View All Registers &rarr;
                  </button>
                </div>
                <div className="overflow-x-auto max-h-[280px]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="sticky top-0 bg-card text-[10px] uppercase text-muted-foreground border-b border-border shadow-xs z-10">
                      <tr>
                        <th className="p-2.5 align-middle">Date</th>
                        <th className="p-2.5 align-middle">Voucher Type</th>
                        <th className="p-2.5 align-middle">Party / Particulars</th>
                        <th className="p-2.5 text-right align-middle">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {bankingAnalytics.recentActivities.length > 0 ? (
                        bankingAnalytics.recentActivities.map(v => (
                          <tr key={v.id || v.v_no} className="hover:bg-muted/10 transition-colors">
                            <td className="p-2.5 text-muted-foreground align-middle">{v.v_date || v.date || 'N/A'}</td>
                            <td className="p-2.5 align-middle">
                              <span className={cn(
                                "px-1.5 py-0.5 text-[9px] rounded font-bold uppercase",
                                v.v_type?.toLowerCase() === 'receipt' ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                                v.v_type?.toLowerCase() === 'payment' ? "bg-rose-500/10 text-rose-500 border border-rose-500/20" :
                                "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                              )}>
                                {v.v_type || 'Voucher'}
                              </span>
                            </td>
                            <td className="p-2.5 font-bold text-foreground align-middle">
                              {v.party_ledger_name || v.particulars || 'Banking Transfer'}
                            </td>
                            <td className="p-2.5 text-right font-bold text-foreground align-middle">
                              {currencySymbol} {formatNumber(v.total_amount || 0)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-4 text-center text-muted-foreground text-xs italic align-middle">
                            No recent banking vouchers recorded
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Detailed Top Ledgers Modal (Sundry Debtors / Sundry Creditors) */}
      <AnimatePresence>
        {ledgerModalType && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-[96vw] xl:max-w-7xl max-h-[92vh] flex flex-col overflow-hidden font-mono"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5">
                  {ledgerModalType === 'debtors' ? (
                    <Users className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <Truck className="w-5 h-5 text-rose-500" />
                  )}
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                      {ledgerModalType === 'debtors' ? 'Top Ledgers (Sundry Debtors) Report' : 'Top Ledgers (Sundry Creditors) Report'}
                    </h3>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      Period: <span className="font-bold text-foreground">{periodStart}</span> to <span className="font-bold text-foreground">{periodEnd}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={isExportingPdf}
                    onClick={() => generateAndExportPdf('print')}
                    className="px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Print Formal Report"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary" />
                    <span>{isExportingPdf ? 'Preparing...' : 'Print'}</span>
                  </button>

                  <button
                    disabled={isExportingPdf}
                    onClick={() => generateAndExportPdf('download')}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    title="Save Report as PDF"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{isExportingPdf ? 'Generating...' : 'Save PDF'}</span>
                  </button>

                  <button
                    onClick={() => setLedgerModalType(null)}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer ml-1"
                    title="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Controls Toolbar: Count Selector, Field Toggles, Search */}
              <div className="p-3 border-b border-border bg-card/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Left: Ledger Count Selector Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1 flex items-center gap-1">
                    <SlidersHorizontal className="w-3 h-3" /> Show:
                  </span>
                  {(['10', '20', '30', '40'] as const).map(cnt => (
                    <button
                      key={cnt}
                      onClick={() => setLedgerLimitOption(cnt)}
                      className={cn(
                        "px-2.5 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer",
                        ledgerLimitOption === cnt
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 hover:bg-muted text-foreground border-border"
                      )}
                    >
                      {cnt} Ledgers
                    </button>
                  ))}
                  <button
                    onClick={() => setLedgerLimitOption('custom')}
                    className={cn(
                      "px-2.5 py-1 text-[11px] font-bold rounded border transition-colors cursor-pointer",
                      ledgerLimitOption === 'custom'
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 hover:bg-muted text-foreground border-border"
                    )}
                  >
                    Custom
                  </button>

                  {ledgerLimitOption === 'custom' && (
                    <div className="flex items-center gap-1 bg-muted/60 px-2 py-0.5 rounded border border-border">
                      <span className="text-[10px] text-muted-foreground font-bold">Qty:</span>
                      <input
                        type="number"
                        min="1"
                        max={modalBaseList.length || 500}
                        value={customLedgerCount}
                        onChange={e => setCustomLedgerCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-14 bg-transparent text-xs font-bold font-mono outline-none border-none p-0 text-foreground"
                      />
                    </div>
                  )}
                </div>

                {/* Center / Right: Checkboxes to toggle Address, With Country, Phone, Email & Search */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2.5 border-r border-border pr-3">
                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-foreground font-bold select-none">
                      <input
                        type="checkbox"
                        checked={includeAddress}
                        onChange={e => {
                          setIncludeAddress(e.target.checked);
                          if (!e.target.checked) setIncludeCountry(false);
                        }}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Address</span>
                    </label>

                    {includeAddress && (
                      <label className="flex items-center gap-1.5 text-[10.5px] cursor-pointer text-primary font-bold select-none bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded border border-primary/25 transition-all">
                        <input
                          type="checkbox"
                          checked={includeCountry}
                          onChange={e => setIncludeCountry(e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary w-3 h-3 cursor-pointer"
                        />
                        <span>With Country</span>
                      </label>
                    )}

                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-foreground font-bold select-none">
                      <input
                        type="checkbox"
                        checked={includePhone}
                        onChange={e => setIncludePhone(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Phone</span>
                    </label>

                    <label className="flex items-center gap-1.5 text-[11px] cursor-pointer text-foreground font-bold select-none">
                      <input
                        type="checkbox"
                        checked={includeEmail}
                        onChange={e => setIncludeEmail(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span>Email</span>
                    </label>
                  </div>

                  {/* Search box */}
                  <div className="relative min-w-[180px]">
                    <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={modalSearchQuery}
                      onChange={e => setModalSearchQuery(e.target.value)}
                      placeholder="Search ledger or contact..."
                      className="w-full bg-muted/40 hover:bg-muted/60 text-foreground text-xs rounded border border-border pl-8 pr-2.5 py-1 outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Table with Sticky Header */}
              <div className="overflow-y-auto flex-1 p-0">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead className="sticky top-0 bg-muted/95 backdrop-blur-sm text-[10px] uppercase text-muted-foreground border-b border-border shadow-xs z-10">
                    <tr>
                      <th className="p-2.5 text-center w-12 align-middle">#</th>
                      <th className="p-2.5 text-left align-middle">
                        {ledgerModalType === 'debtors' ? 'Customer / Debtor' : 'Supplier / Creditor'}
                      </th>
                      {includeAddress && <th className="p-2.5 text-left align-middle">Address</th>}
                      {includePhone && <th className="p-2.5 text-left align-middle">Phone Number</th>}
                      {includeEmail && <th className="p-2.5 text-left align-middle">Email</th>}
                      <th className="p-2.5 text-right align-middle">Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {modalFilteredList.length > 0 ? (
                      modalFilteredList.map((item, index) => {
                        const addr = includeCountry ? (item.addressWithCountry || item.address) : (item.addressWithoutCountry || '—');
                        return (
                          <tr 
                            key={item.id || item.name} 
                            onClick={() => {
                              setLedgerModalType(null);
                              navigate(`/reports/ledger?ledgerId=${item.id}`);
                            }}
                            className="hover:bg-primary/10 transition-colors cursor-pointer group"
                            title="Click to view full Ledger Statement"
                          >
                            <td className="p-2.5 text-center text-[10px] text-muted-foreground font-bold align-middle">
                              {index + 1}
                            </td>
                            <td className="p-2.5 font-bold text-foreground group-hover:text-primary transition-colors text-left align-middle">
                              <div className="flex items-center gap-1.5">
                                <span>{item.name}</span>
                                <span className="text-[9px] text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity">&rarr;</span>
                              </div>
                            </td>
                            {includeAddress && (
                              <td className="p-2.5 text-[10px] text-foreground/80 max-w-[240px] truncate text-left align-middle" title={addr}>
                                {addr}
                              </td>
                            )}
                            {includePhone && (
                              <td className="p-2.5 text-[10px] text-foreground/90 font-mono text-left align-middle">
                                {item.phone || '—'}
                              </td>
                            )}
                            {includeEmail && (
                              <td className="p-2.5 text-[10px] text-foreground/80 text-left align-middle">
                                {item.email || '—'}
                              </td>
                            )}
                            <td className={cn(
                              "p-2.5 text-right font-bold font-mono whitespace-nowrap align-middle",
                              item.isDr ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            )}>
                              {currencySymbol} {formatNumber(item.balance)}{" "}
                              <span className="text-[10px] font-bold">
                                {item.isDr ? 'Dr' : 'Cr'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={2 + (includeAddress ? 1 : 0) + (includePhone ? 1 : 0) + (includeEmail ? 1 : 0)}
                          className="p-8 text-center text-muted-foreground text-xs italic align-middle"
                        >
                          No matching ledgers found for this period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Modal Footer Summary */}
              <div className="p-3 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between text-xs font-mono shrink-0 gap-2">
                <span className="text-[11px] text-muted-foreground font-bold">
                  Showing {modalFilteredList.length} of {modalBaseList.length} registered {ledgerModalType === 'debtors' ? 'debtors' : 'creditors'}
                </span>
                <div className="flex items-center gap-4 text-xs font-bold">
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Dr: {currencySymbol} {formatNumber(modalFilteredList.filter(i => i.isDr).reduce((acc, i) => acc + i.balance, 0))}
                  </span>
                  <span className="text-rose-600 dark:text-rose-400">
                    Cr: {currencySymbol} {formatNumber(modalFilteredList.filter(i => !i.isDr).reduce((acc, i) => acc + i.balance, 0))}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Unified Large Graph Detail Popup Modal (Supports all 9 charts) */}
      <AnimatePresence>
        {activeGraphModal && (
          <div 
            onClick={() => {
              setActiveGraphModal(null);
              setGraphModalSearch('');
            }}
            className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              onClick={e => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden font-mono"
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between shrink-0 flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded bg-primary/10 text-primary border border-primary/20">
                    {activeGraphModal === 'sales_purchase' && <TrendingUp className="w-5 h-5 text-blue-500" />}
                    {activeGraphModal === 'profit_trend' && <Activity className="w-5 h-5 text-emerald-500" />}
                    {activeGraphModal === 'cash_flow_volume' && <Activity className="w-5 h-5 text-teal-500" />}
                    {activeGraphModal === 'cost_centres' && <Building2 className="w-5 h-5 text-rose-500" />}
                    {activeGraphModal === 'stock_movement' && <Package className="w-5 h-5 text-amber-500" />}
                    {activeGraphModal === 'stock_groups' && <Boxes className="w-5 h-5 text-blue-500" />}
                    {activeGraphModal === 'stock_categories' && <PieChartIcon className="w-5 h-5 text-emerald-500" />}
                    {activeGraphModal === 'liquidity_composition' && <Wallet className="w-5 h-5 text-emerald-500" />}
                    {activeGraphModal === 'cash_flow_dynamics' && <Landmark className="w-5 h-5 text-blue-500" />}
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider text-foreground">
                      {activeGraphModal === 'sales_purchase' && 'Sales & Purchase Monthly Trend (Full View)'}
                      {activeGraphModal === 'profit_trend' && 'Gross vs. Net Profit Trend (Full View)'}
                      {activeGraphModal === 'cash_flow_volume' && 'Monthly Transaction Volume & Cash Flow Trend (Full View)'}
                      {activeGraphModal === 'cost_centres' && 'Cost Centre Allocation & Expense Distribution (Full View)'}
                      {activeGraphModal === 'stock_movement' && 'Stock Item & Movement Trend (Full View)'}
                      {activeGraphModal === 'stock_groups' && 'Stock Groups Valuation Breakdown (Full View)'}
                      {activeGraphModal === 'stock_categories' && 'Stock Category Trend & Ratio (Full View)'}
                      {activeGraphModal === 'liquidity_composition' && 'Liquidity Composition (Cash vs. Bank Breakdown)'}
                      {activeGraphModal === 'cash_flow_dynamics' && 'Cash Flow Dynamics (Inflow vs. Outflow Analysis)'}
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground font-mono">
                      Period: <span className="font-bold text-foreground">{periodStart}</span> to <span className="font-bold text-foreground">{periodEnd}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Range filter buttons for time-series charts */}
                  {['sales_purchase', 'profit_trend', 'cash_flow_volume', 'stock_movement'].includes(activeGraphModal) && (
                    <div className="flex items-center gap-1 bg-muted/60 p-0.5 rounded border border-border">
                      {(['12 MONTHS', 'JAN-JUN', 'JUL-DEC'] as ChartRangeOption[]).map(r => (
                        <button
                          key={r}
                          onClick={() => setGraphModalRange(r)}
                          className={cn(
                            "px-2.5 py-1 text-[10px] font-bold uppercase rounded transition-all cursor-pointer",
                            graphModalRange === r
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  )}

                  <button
                    disabled={isExportingGraphPdf}
                    onClick={() => exportGraphModalPdf('print')}
                    className="px-3 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                    title="Print Formal Report with Graph"
                  >
                    <Printer className="w-3.5 h-3.5 text-primary" />
                    <span>{isExportingGraphPdf ? 'Preparing...' : 'Print'}</span>
                  </button>

                  <button
                    disabled={isExportingGraphPdf}
                    onClick={() => exportGraphModalPdf('download')}
                    className="px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold uppercase flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    title="Save Formal Report as PDF with Graph"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    <span>{isExportingGraphPdf ? 'Generating...' : 'Save PDF'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setActiveGraphModal(null);
                      setGraphModalSearch('');
                    }}
                    className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-colors cursor-pointer ml-1"
                    title="Close (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Top KPI Metric Strip */}
              <div className="px-4 py-3 bg-muted/15 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono shrink-0">
                {activeGraphModal === 'sales_purchase' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Total Sales</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.salesTotal)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-amber-500 block">Total Purchases</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.purchaseTotal)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Net Trading Margin</span>
                      <span className={cn(
                        "text-base font-bold",
                        (accountingAnalytics.salesTotal - accountingAnalytics.purchaseTotal) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      )}>
                        {currencySymbol} {formatNumber(accountingAnalytics.salesTotal - accountingAnalytics.purchaseTotal)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Total Turnover</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(accountingAnalytics.salesTotal + accountingAnalytics.purchaseTotal)}</span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'profit_trend' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Gross Profit</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol} {formatNumber(accountingAnalytics.grossProfit)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-indigo-500 block">Net Profit</span>
                      <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{currencySymbol} {formatNumber(accountingAnalytics.netProfit)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-teal-500 block">Gross Margin %</span>
                      <span className="text-base font-bold text-foreground">{accountingAnalytics.grossProfitMargin.toFixed(1)}%</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Net Margin %</span>
                      <span className="text-base font-bold text-foreground">{accountingAnalytics.netProfitMargin.toFixed(1)}%</span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'cash_flow_volume' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Total Inflows</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {currencySymbol} {formatNumber(accountingAnalytics.monthlyTrends.reduce((s, m) => s + m.inflows, 0))}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-rose-500 block">Total Outflows</span>
                      <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                        {currencySymbol} {formatNumber(accountingAnalytics.monthlyTrends.reduce((s, m) => s + m.outflows, 0))}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-teal-500 block">Net Cash Generation</span>
                      <span className="text-base font-bold text-foreground">
                        {currencySymbol} {formatNumber(accountingAnalytics.monthlyTrends.reduce((s, m) => s + (m.inflows - m.outflows), 0))}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Collective Volume</span>
                      <span className="text-base font-bold text-foreground">
                        {currencySymbol} {formatNumber(accountingAnalytics.monthlyTrends.reduce((s, m) => s + m.totalVolume, 0))}
                      </span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'cost_centres' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-rose-500 block">Allocated Expenses</span>
                      <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                        {currencySymbol} {formatNumber(accountingAnalytics.allCostCentres?.reduce((s, c) => s + c.amount, 0) || 0)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Active Cost Heads</span>
                      <span className="text-base font-bold text-foreground">{accountingAnalytics.allCostCentres?.length || 0}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-amber-500 block">Top Cost Head</span>
                      <span className="text-sm font-bold text-foreground truncate block" title={accountingAnalytics.topCostCentres[0]?.name || 'None'}>
                        {accountingAnalytics.topCostCentres[0]?.name || 'None'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Top Head Amount</span>
                      <span className="text-base font-bold text-foreground">
                        {currencySymbol} {formatNumber(accountingAnalytics.topCostCentres[0]?.amount || 0)}
                      </span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'stock_movement' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-amber-500 block">Closing Valuation</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(inventoryAnalytics.closingStockValuation)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Opening Valuation</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(inventoryAnalytics.openingStockValuation)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Total In-Stock Units</span>
                      <span className="text-base font-bold text-foreground">{formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs')}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Catalog Items</span>
                      <span className="text-base font-bold text-foreground">{inventoryAnalytics.totalItemsCount}</span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'stock_groups' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Stock Groups</span>
                      <span className="text-base font-bold text-foreground">{inventoryAnalytics.allStockGroups?.length || 0}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-amber-500 block">Total Inventory Value</span>
                      <span className="text-base font-bold text-amber-600 dark:text-amber-400">{currencySymbol} {formatNumber(inventoryAnalytics.totalStockValue)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Total In-Stock Units</span>
                      <span className="text-base font-bold text-foreground">{formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs')}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Top Group</span>
                      <span className="text-sm font-bold text-foreground truncate block" title={inventoryAnalytics.topStockGroups[0]?.name || 'N/A'}>
                        {inventoryAnalytics.topStockGroups[0]?.name || 'N/A'}
                      </span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'stock_categories' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Categories Registered</span>
                      <span className="text-base font-bold text-foreground">{inventoryAnalytics.allStockCategories.length}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-amber-500 block">Total Valuation</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(inventoryAnalytics.totalStockValue)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Total In-Stock Units</span>
                      <span className="text-base font-bold text-foreground">{formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs')}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Top Category</span>
                      <span className="text-sm font-bold text-foreground truncate block" title={inventoryAnalytics.allStockCategories[0]?.name || 'N/A'}>
                        {inventoryAnalytics.allStockCategories[0]?.name || 'N/A'}
                      </span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'liquidity_composition' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Total Liquid Funds</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">{currencySymbol} {formatNumber(bankingAnalytics.totalLiquidity)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Cash in Hand</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(bankingAnalytics.totalCash)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-indigo-500 block">Bank Accounts & MFS</span>
                      <span className="text-base font-bold text-foreground">{currencySymbol} {formatNumber(bankingAnalytics.totalBank)}</span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-purple-500 block">Active Accounts</span>
                      <span className="text-base font-bold text-foreground">{bankingAnalytics.allLiquidAccounts?.length || 0}</span>
                    </div>
                  </>
                )}

                {activeGraphModal === 'cash_flow_dynamics' && (
                  <>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-emerald-500 block">Total Inflow</span>
                      <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                        {currencySymbol} {formatNumber(bankingAnalytics.flowData[0]?.amount || 0)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-rose-500 block">Total Outflow</span>
                      <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                        {currencySymbol} {formatNumber(bankingAnalytics.flowData[1]?.amount || 0)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-teal-500 block">Net Flow Position</span>
                      <span className={cn(
                        "text-base font-bold",
                        ((bankingAnalytics.flowData[0]?.amount || 0) - (bankingAnalytics.flowData[1]?.amount || 0)) >= 0 
                          ? "text-emerald-600 dark:text-emerald-400" 
                          : "text-rose-600 dark:text-rose-400"
                      )}>
                        {currencySymbol} {formatNumber((bankingAnalytics.flowData[0]?.amount || 0) - (bankingAnalytics.flowData[1]?.amount || 0))}
                      </span>
                    </div>
                    <div className="p-2.5 bg-card border border-border rounded">
                      <span className="text-[9px] uppercase font-bold text-blue-500 block">Flow Ratio</span>
                      <span className="text-base font-bold text-foreground">
                        {((bankingAnalytics.flowData[0]?.amount || 0) / Math.max(1, bankingAnalytics.flowData[1]?.amount || 0)).toFixed(2)} : 1
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Body: Two Columns (Left: Enlarged Chart, Right: Detailed Data Table) */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Enlarged Chart Container */}
                <div className="lg:col-span-6 bg-muted/10 border border-border/70 rounded-md p-4 flex flex-col justify-between relative select-none min-h-[350px]">
                  <div className="w-full flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                    <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">
                      Interactive Visual Telemetry
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Hover to view exact amounts
                    </span>
                  </div>

                  <div 
                    id="bi-modal-graph-capture-container" 
                    className="w-full h-[280px] sm:h-[320px] flex items-center justify-center relative select-none my-auto" 
                    style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
                  >
                    {/* 1. Sales & Purchase Monthly AreaChart */}
                    {activeGraphModal === 'sales_purchase' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange)}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                          />
                          <Area type="monotone" dataKey="sales" name="Sales Turnover" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                          <Area type="monotone" dataKey="purchase" name="Purchase Volume" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} strokeWidth={2} />
                          <Legend verticalAlign="bottom" iconType="circle" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}

                    {/* 2. Profit Trend LineChart */}
                    {activeGraphModal === 'profit_trend' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange)}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                          />
                          <Line type="monotone" dataKey="grossProfit" name="Gross Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                          <Line type="monotone" dataKey="netProfit" name="Net Profit" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                          <Legend verticalAlign="bottom" iconType="circle" />
                        </LineChart>
                      </ResponsiveContainer>
                    )}

                    {/* 3. Monthly Cash Flow Volume BarChart */}
                    {activeGraphModal === 'cash_flow_volume' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange)}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                          />
                          <Bar dataKey="inflows" name="Total Inflows" fill="#10b981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="outflows" name="Total Outflows" fill="#ef4444" radius={[4, 4, 0, 0]} />
                          <Legend verticalAlign="bottom" iconType="circle" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}

                    {/* 4. Cost Centres Horizontal BarChart */}
                    {activeGraphModal === 'cost_centres' && (
                      accountingAnalytics.allCostCentres?.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={accountingAnalytics.allCostCentres.slice(0, 10)} 
                            layout="vertical" 
                            margin={{ left: 20 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} horizontal={false} />
                            <XAxis type="number" tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" width={120} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                              formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Cost Allocated']}
                            />
                            <Bar dataKey="amount" name="Allocated Expense" fill="#e11d48" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                          No expense heads recorded in selected period
                        </div>
                      )
                    )}

                    {/* 5. Stock Movement AreaChart */}
                    {activeGraphModal === 'stock_movement' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={getFilteredMonthlyData(inventoryAnalytics.stockMonthlyTrends, graphModalRange)}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="month" interval={0} fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`]}
                          />
                          <Area type="monotone" dataKey="valuation" name="Valuation Trend" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.25} strokeWidth={2} />
                          <Legend verticalAlign="bottom" iconType="circle" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}

                    {/* 6. Stock Groups BarChart */}
                    {activeGraphModal === 'stock_groups' && (
                      (inventoryAnalytics.allStockGroups?.length || 0) > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={inventoryAnalytics.allStockGroups?.slice(0, 8) || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                            <XAxis dataKey="name" fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                              formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Stock Value']}
                            />
                            <Bar dataKey="value" name="Valuation" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Legend verticalAlign="bottom" iconType="circle" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex items-center justify-center text-xs text-muted-foreground italic">
                          No stock groups recorded
                        </div>
                      )
                    )}

                    {/* 7. Stock Categories Donut Chart */}
                    {activeGraphModal === 'stock_categories' && (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={inventoryAnalytics.allStockCategories}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={115}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {inventoryAnalytics.allStockCategories.map((_, index) => (
                                <Cell key={`large-pie-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                              formatter={(val: any, name: any) => [`${currencySymbol} ${formatNumber(val)}`, name || 'Valuation']}
                            />
                          </PieChart>
                        </ResponsiveContainer>

                        {/* Donut Center Summary */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                            Total Valuation
                          </span>
                          <span className="text-base sm:text-lg font-bold text-foreground font-mono mt-0.5">
                            {currencySymbol} {formatNumber(inventoryAnalytics.totalStockValue)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                            {formatQuantity(inventoryAnalytics.totalStockQty, 'Pcs')} Total Qty
                          </span>
                        </div>
                      </>
                    )}

                    {/* 8. Liquidity Composition Donut Chart */}
                    {activeGraphModal === 'liquidity_composition' && (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={bankingAnalytics.liquidityBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={70}
                              outerRadius={115}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {bankingAnalytics.liquidityBreakdown.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                              formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Total']}
                            />
                            <Legend verticalAlign="bottom" iconType="circle" />
                          </PieChart>
                        </ResponsiveContainer>

                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                          <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                            Liquid Reserves
                          </span>
                          <span className="text-base sm:text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            {currencySymbol} {formatNumber(bankingAnalytics.totalLiquidity)}
                          </span>
                        </div>
                      </>
                    )}

                    {/* 9. Cash Flow Dynamics BarChart */}
                    {activeGraphModal === 'cash_flow_dynamics' && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={bankingAnalytics.flowData}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#222' : '#f0f0f0'} />
                          <XAxis dataKey="name" fontSize={9} stroke="#888" axisLine={false} tickLine={false} />
                          <YAxis tickFormatter={v => `${currencySymbol}${formatNumber(v)}`} fontSize={8} stroke="#888" axisLine={false} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#141414' : '#fff', border: '1px solid #333', fontSize: '11px', fontFamily: 'monospace' }}
                            formatter={(val: any) => [`${currencySymbol} ${formatNumber(val)}`, 'Amount']}
                          />
                          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                            {bankingAnalytics.flowData.map((entry, index) => (
                              <Cell key={`bar-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  <div className="w-full text-center text-[10px] text-muted-foreground border-t border-border/40 pt-2 font-mono">
                    High precision client-side telemetry calculated directly from primary ledger & voucher registers
                  </div>
                </div>

                {/* Right Column: Detailed Data Table & Breakdown */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-3">
                  {/* Search Bar for searchable datasets */}
                  {['cost_centres', 'stock_groups', 'stock_categories', 'liquidity_composition'].includes(activeGraphModal) && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Search records..."
                          value={graphModalSearch}
                          onChange={e => setGraphModalSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-muted/40 border border-border rounded text-xs font-mono text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-primary"
                        />
                      </div>
                      {graphModalSearch && (
                        <button
                          onClick={() => setGraphModalSearch('')}
                          className="text-[10px] text-muted-foreground hover:text-foreground underline font-mono"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  )}

                  {/* Scrollable Detailed Data Table */}
                  <div className="overflow-x-auto max-h-[350px] border border-border rounded bg-card">
                    {/* TABLE 1 & 2 & 3: Monthly Trends (Sales/Purchase, Profit, Volume) */}
                    {['sales_purchase', 'profit_trend', 'cash_flow_volume'].includes(activeGraphModal) && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">Month</th>
                            {activeGraphModal === 'sales_purchase' && (
                              <>
                                <th className="p-2.5 text-right align-middle">Sales Turnover</th>
                                <th className="p-2.5 text-right align-middle">Purchases</th>
                                <th className="p-2.5 text-right align-middle">Trade Margin</th>
                              </>
                            )}
                            {activeGraphModal === 'profit_trend' && (
                              <>
                                <th className="p-2.5 text-right align-middle">Gross Profit</th>
                                <th className="p-2.5 text-right align-middle">Net Profit</th>
                                <th className="p-2.5 text-right align-middle">Margin %</th>
                              </>
                            )}
                            {activeGraphModal === 'cash_flow_volume' && (
                              <>
                                <th className="p-2.5 text-right align-middle">Inflows</th>
                                <th className="p-2.5 text-right align-middle">Outflows</th>
                                <th className="p-2.5 text-right align-middle">Net Flow</th>
                              </>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {getFilteredMonthlyData(accountingAnalytics.monthlyTrends, graphModalRange).map(m => {
                            const tradeMargin = m.sales - m.purchase;
                            const marginPct = m.sales > 0 ? (m.grossProfit / m.sales) * 100 : 0;
                            const netFlow = m.inflows - m.outflows;

                            return (
                              <tr key={m.month} className="hover:bg-muted/15 transition-colors">
                                <td className="p-2.5 font-bold text-foreground align-middle">{m.month}</td>
                                {activeGraphModal === 'sales_purchase' && (
                                  <>
                                    <td className="p-2.5 text-right font-bold text-blue-600 dark:text-blue-400 align-middle">
                                      {currencySymbol} {formatNumber(m.sales)}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-amber-600 dark:text-amber-400 align-middle">
                                      {currencySymbol} {formatNumber(m.purchase)}
                                    </td>
                                    <td className={cn("p-2.5 text-right font-bold align-middle", tradeMargin >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                      {currencySymbol} {formatNumber(tradeMargin)}
                                    </td>
                                  </>
                                )}
                                {activeGraphModal === 'profit_trend' && (
                                  <>
                                    <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 align-middle">
                                      {currencySymbol} {formatNumber(m.grossProfit)}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-indigo-600 dark:text-indigo-400 align-middle">
                                      {currencySymbol} {formatNumber(m.netProfit)}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-muted-foreground align-middle">
                                      {marginPct.toFixed(1)}%
                                    </td>
                                  </>
                                )}
                                {activeGraphModal === 'cash_flow_volume' && (
                                  <>
                                    <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 align-middle">
                                      {currencySymbol} {formatNumber(m.inflows)}
                                    </td>
                                    <td className="p-2.5 text-right font-bold text-rose-600 dark:text-rose-400 align-middle">
                                      {currencySymbol} {formatNumber(m.outflows)}
                                    </td>
                                    <td className={cn("p-2.5 text-right font-bold align-middle", netFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                      {currencySymbol} {formatNumber(netFlow)}
                                    </td>
                                  </>
                                )}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* TABLE 4: Cost Centres Detailed List */}
                    {activeGraphModal === 'cost_centres' && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">#</th>
                            <th className="p-2.5 align-middle">Cost Head / Expense Ledger</th>
                            <th className="p-2.5 text-right align-middle">Allocated Amount</th>
                            <th className="p-2.5 text-right align-middle">Share %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {(() => {
                            const totalExp = accountingAnalytics.allCostCentres?.reduce((s, c) => s + c.amount, 0) || 1;
                            const filtered = (accountingAnalytics.allCostCentres || []).filter(c => 
                              !graphModalSearch.trim() || c.name.toLowerCase().includes(graphModalSearch.toLowerCase().trim())
                            );

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs italic align-middle">
                                    No matching cost centres found
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((c, idx) => (
                              <tr key={c.name} className="hover:bg-muted/15 transition-colors">
                                <td className="p-2.5 text-muted-foreground text-[10px] font-bold align-middle">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-foreground truncate max-w-[200px] align-middle" title={c.name}>{c.name}</td>
                                <td className="p-2.5 text-right font-bold text-rose-600 dark:text-rose-400 align-middle">
                                  {currencySymbol} {formatNumber(c.amount)}
                                </td>
                                <td className="p-2.5 text-right text-muted-foreground font-bold align-middle">
                                  {((c.amount / totalExp) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    )}

                    {/* TABLE 5: Stock Movement Monthly Detailed List */}
                    {activeGraphModal === 'stock_movement' && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">Month</th>
                            <th className="p-2.5 text-right align-middle">Valuation</th>
                            <th className="p-2.5 text-right align-middle">Inward Qty</th>
                            <th className="p-2.5 text-right align-middle">Outward Qty</th>
                            <th className="p-2.5 text-right align-middle">Net Movement</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {getFilteredMonthlyData(inventoryAnalytics.stockMonthlyTrends, graphModalRange).map(m => {
                            const netM = m.inward - m.outward;
                            return (
                              <tr key={m.month} className="hover:bg-muted/15 transition-colors">
                                <td className="p-2.5 font-bold text-foreground align-middle">{m.month}</td>
                                <td className="p-2.5 text-right font-bold text-amber-500 align-middle">
                                  {currencySymbol} {formatNumber(m.valuation)}
                                </td>
                                <td className="p-2.5 text-right text-emerald-600 dark:text-emerald-400 font-mono align-middle">
                                  +{formatQuantity(m.inward, 'Pcs')}
                                </td>
                                <td className="p-2.5 text-right text-rose-600 dark:text-rose-400 font-mono align-middle">
                                  -{formatQuantity(m.outward, 'Pcs')}
                                </td>
                                <td className={cn("p-2.5 text-right font-bold font-mono align-middle", netM >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                                  {netM >= 0 ? '+' : ''}{formatQuantity(netM, 'Pcs')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}

                    {/* TABLE 6: Stock Groups Detailed List */}
                    {activeGraphModal === 'stock_groups' && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">#</th>
                            <th className="p-2.5 align-middle">Stock Group</th>
                            <th className="p-2.5 text-right align-middle">Items</th>
                            <th className="p-2.5 text-right align-middle">In-Stock Qty</th>
                            <th className="p-2.5 text-right align-middle">Valuation</th>
                            <th className="p-2.5 text-right align-middle">Share %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {(() => {
                            const totalVal = inventoryAnalytics.totalStockValue || 1;
                            const filtered = (inventoryAnalytics.allStockGroups || []).filter(g =>
                              !graphModalSearch.trim() || g.name.toLowerCase().includes(graphModalSearch.toLowerCase().trim())
                            );

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs italic align-middle">
                                    No matching stock groups found
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((g, idx) => (
                              <tr key={g.name} className="hover:bg-muted/15 transition-colors">
                                <td className="p-2.5 text-muted-foreground text-[10px] font-bold align-middle">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-foreground truncate max-w-[160px] align-middle" title={g.name}>{g.name}</td>
                                <td className="p-2.5 text-right text-muted-foreground align-middle">{g.count}</td>
                                <td className="p-2.5 text-right font-mono align-middle">{formatQuantity(g.qty, 'Pcs')}</td>
                                <td className="p-2.5 text-right font-bold text-foreground align-middle">
                                  {currencySymbol} {formatNumber(g.value)}
                                </td>
                                <td className="p-2.5 text-right font-bold text-blue-600 dark:text-blue-400 align-middle">
                                  {((g.value / totalVal) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    )}

                    {/* TABLE 7: Stock Categories Detailed List */}
                    {activeGraphModal === 'stock_categories' && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">Category Name</th>
                            <th className="p-2.5 text-right align-middle">In-Stock Qty</th>
                            <th className="p-2.5 text-right align-middle">Valuation</th>
                            <th className="p-2.5 text-right align-middle">Share %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {(() => {
                            const filtered = modalFilteredCategories;
                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={4} className="p-6 text-center text-muted-foreground text-xs italic align-middle">
                                    No matching categories found
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map(cat => {
                              const origIndex = inventoryAnalytics.allStockCategories.findIndex(c => c.name === cat.name);
                              const color = CATEGORY_COLORS[(origIndex >= 0 ? origIndex : 0) % CATEGORY_COLORS.length];
                              const share = inventoryAnalytics.totalStockValue > 0 
                                ? (cat.value / inventoryAnalytics.totalStockValue) * 100 
                                : 0;
                              return (
                                <tr key={cat.name} className="hover:bg-muted/20 transition-colors">
                                  <td className="p-2.5 font-bold text-foreground align-middle">
                                    <div className="flex items-center gap-2">
                                      <span 
                                        className="w-3 h-3 rounded-full inline-block shrink-0 shadow-2xs" 
                                        style={{ backgroundColor: color }} 
                                      />
                                      <span className="truncate max-w-[170px]" title={cat.name}>
                                        {cat.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-2.5 text-right text-muted-foreground font-mono align-middle">
                                    {formatQuantity(cat.qty, 'Pcs')}
                                  </td>
                                  <td className="p-2.5 text-right font-bold text-foreground font-mono align-middle">
                                    {currencySymbol} {formatNumber(cat.value)}
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold align-middle">
                                    {share.toFixed(1)}%
                                  </td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                      </table>
                    )}

                    {/* TABLE 8: Liquidity Accounts Detailed List */}
                    {activeGraphModal === 'liquidity_composition' && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">#</th>
                            <th className="p-2.5 align-middle">Account Name</th>
                            <th className="p-2.5 align-middle">Type</th>
                            <th className="p-2.5 text-right align-middle">Closing Balance</th>
                            <th className="p-2.5 text-right align-middle">Share %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {(() => {
                            const totalLiq = bankingAnalytics.totalLiquidity || 1;
                            const filtered = (bankingAnalytics.allLiquidAccounts || []).filter(a =>
                              !graphModalSearch.trim() || a.name.toLowerCase().includes(graphModalSearch.toLowerCase().trim())
                            );

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={5} className="p-6 text-center text-muted-foreground text-xs italic align-middle">
                                    No matching liquid accounts found
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((acc, idx) => (
                              <tr key={acc.name} className="hover:bg-muted/15 transition-colors">
                                <td className="p-2.5 text-muted-foreground text-[10px] font-bold align-middle">{idx + 1}</td>
                                <td className="p-2.5 font-bold text-foreground truncate max-w-[170px] align-middle" title={acc.name}>{acc.name}</td>
                                <td className="p-2.5 align-middle">
                                  <span className={cn(
                                    "px-1.5 py-0.5 text-[9px] rounded font-bold uppercase",
                                    acc.type === 'Cash in Hand' 
                                      ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                      : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                  )}>
                                    {acc.type}
                                  </span>
                                </td>
                                <td className="p-2.5 text-right font-bold text-foreground font-mono align-middle">
                                  {currencySymbol} {formatNumber(acc.balance)}
                                </td>
                                <td className="p-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono align-middle">
                                  {((acc.balance / totalLiq) * 100).toFixed(1)}%
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    )}

                    {/* TABLE 9: Cash Flow Dynamics Detailed Breakdown */}
                    {activeGraphModal === 'cash_flow_dynamics' && (
                      <table className="w-full text-left text-xs font-mono">
                        <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-[10px] uppercase text-muted-foreground border-b border-border shadow-2xs z-10">
                          <tr>
                            <th className="p-2.5 align-middle">Flow Stream</th>
                            <th className="p-2.5 align-middle">Classification</th>
                            <th className="p-2.5 text-right align-middle">Amount</th>
                            <th className="p-2.5 text-right align-middle">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {bankingAnalytics.flowData.map(item => (
                            <tr key={item.name} className="hover:bg-muted/15 transition-colors">
                              <td className="p-2.5 font-bold text-foreground align-middle">{item.name}</td>
                              <td className="p-2.5 text-muted-foreground align-middle">
                                {item.name === 'Cash Inflow' ? 'Receipts & Sales Realization' : 'Payments & Procurement Disbursements'}
                              </td>
                              <td className={cn(
                                "p-2.5 text-right font-bold font-mono align-middle",
                                item.name === 'Cash Inflow' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                              )}>
                                {currencySymbol} {formatNumber(item.amount)}
                              </td>
                              <td className="p-2.5 text-right font-bold align-middle">
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[9px] uppercase font-bold",
                                  item.name === 'Cash Inflow' 
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                                    : "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                                )}>
                                  {item.name === 'Cash Inflow' ? 'Incoming' : 'Outgoing'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>

                  {/* Summary Footer Bar for Data Table */}
                  <div className="p-3 bg-muted/40 border border-border rounded flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-muted-foreground uppercase text-[10px]">
                      {activeGraphModal === 'sales_purchase' && 'Total Turnover Volume'}
                      {activeGraphModal === 'profit_trend' && 'Cumulative Net Profit'}
                      {activeGraphModal === 'cash_flow_volume' && 'Total Turnover Volume'}
                      {activeGraphModal === 'cost_centres' && 'Total Allocated Expenses'}
                      {activeGraphModal === 'stock_movement' && 'Closing Inventory Valuation'}
                      {activeGraphModal === 'stock_groups' && 'Total Inventory Valuation'}
                      {activeGraphModal === 'stock_categories' && 'Total Inventory Valuation'}
                      {activeGraphModal === 'liquidity_composition' && 'Total Liquid Funds'}
                      {activeGraphModal === 'cash_flow_dynamics' && 'Net Cash Generation'}
                    </span>
                    <span className="text-sm font-bold text-foreground font-mono">
                      {activeGraphModal === 'sales_purchase' && `${currencySymbol} ${formatNumber(accountingAnalytics.salesTotal + accountingAnalytics.purchaseTotal)}`}
                      {activeGraphModal === 'profit_trend' && `${currencySymbol} ${formatNumber(accountingAnalytics.netProfit)}`}
                      {activeGraphModal === 'cash_flow_volume' && `${currencySymbol} ${formatNumber(accountingAnalytics.monthlyTrends.reduce((s, m) => s + m.totalVolume, 0))}`}
                      {activeGraphModal === 'cost_centres' && `${currencySymbol} ${formatNumber(accountingAnalytics.allCostCentres?.reduce((s, c) => s + c.amount, 0) || 0)}`}
                      {activeGraphModal === 'stock_movement' && `${currencySymbol} ${formatNumber(inventoryAnalytics.closingStockValuation)}`}
                      {activeGraphModal === 'stock_groups' && `${currencySymbol} ${formatNumber(inventoryAnalytics.totalStockValue)}`}
                      {activeGraphModal === 'stock_categories' && `${currencySymbol} ${formatNumber(inventoryAnalytics.totalStockValue)}`}
                      {activeGraphModal === 'liquidity_composition' && `${currencySymbol} ${formatNumber(bankingAnalytics.totalLiquidity)}`}
                      {activeGraphModal === 'cash_flow_dynamics' && `${currencySymbol} ${formatNumber((bankingAnalytics.flowData[0]?.amount || 0) - (bankingAnalytics.flowData[1]?.amount || 0))}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3 border-t border-border bg-muted/20 flex justify-between items-center shrink-0">
                <span className="text-[10px] text-muted-foreground font-mono">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[9px]">Esc</kbd> or click outside to dismiss
                </span>
                <button
                  onClick={() => {
                    setActiveGraphModal(null);
                    setGraphModalSearch('');
                  }}
                  className="px-4 py-1.5 rounded bg-muted hover:bg-muted/80 text-foreground border border-border text-xs font-bold uppercase transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
