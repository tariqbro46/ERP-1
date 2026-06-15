import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  ClipboardList, 
  Scale, 
  TrendingUp, 
  Package, 
  Activity, 
  DollarSign, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  FileText,
  Users,
  User,
  ArrowLeft,
  Sparkles,
  Search,
  LayoutGrid,
  TrendingDown,
  Percent,
  Calculator,
  X,
  SlidersHorizontal
} from 'lucide-react';
import { EditableHeader } from './EditableHeader';
const LucideIcons: any = { BookOpen, ClipboardList, Scale, TrendingUp, Package, Activity, DollarSign, AlertCircle, BarChart3, FileText, Users, User };

const getReportDescription = (id: string, label: string): string => {
  const descMap: Record<string, string> = {
    'rep-trial-balance': 'Consolidated balances checklist of all active billing accounts.',
    'rep-daybook': 'Chronological timeline ledger of standard voucher transactions and bills.',
    'rep-cash-flow': 'Projections of dynamic liquid cash movements across operating heads.',
    'rep-funds-flow': 'Examines net working capital allocation cycles between fiscal quarters.',
    'rep-group-summary': 'Consolidated accounting status grouped under primary classification heads.',
    'rep-group-voucher': 'Voucher transactions index belonging to specific ledger categories.',
    'rep-ledger-statement': 'Detailed historical ledger statements of selected active accounts.',
    'rep-sales-register': 'Chronological records of commercial trade and customer billing invoices.',
    'rep-purchase-register': 'Procurement logs compiling vendor credit bills and supply receipts.',
    'rep-cash-bank': 'Sub-ledger listing everyday receipts and liquid asset banking payments.',
    'rep-pay-slip': 'Configured salary and allowance allocation sheets for active employees.',
    'rep-pay-sheet': 'Comprehensive payroll ledger summarizing corporate employee salaries.',
    'rep-attendance-sheet': 'Consolidated report tracking employee working days, leaves, and overtimes.',
    'rep-payment-advice': 'Official bank transfer instructions for payroll settlement operations.',
    'rep-payroll-statement': 'Complete accounting statement logs tracking payroll expenses.',
    'rep-payroll-register': 'Chronological register compiles internal employee salary vouchers.',
    'rep-attendance-register': 'Comprehensive logs tracking daily clock-in records and audit metrics.',
    'rep-employee-profile': 'Detailed masters profiling active personnel, contracts, and grades.',
    'rep-headcount': 'Corporate organizational statistics tracking personnel allocations.',
    'rep-inventory-books': 'Inventory audit books detailing items, godowns, and registers.',
    'rep-stock-query': 'Deep analytical view of pricing, batches, and location balances for a stock item.',
    'rep-movement': 'In-depth movement patterns analyzing stock item sales and purchases.',
    'rep-ageing-analysis': 'Aged inventory balance analysis tracking holding periods and speed.',
    'rep-negative-stock': 'Risk alert registry tracking items with negative balance audit warnings.',
    'rep-negative-ledger': 'Overdraft analysis highlighting credit ledgers with negative cash balances.',
    'rep-statement-of-account': 'Ledger account statements index and sub-group statement reports.',
    'rep-stock-summary': 'Corporate physical stock summary detailing quantities, rates, and values.',
    'rep-account-books': 'Statements of account, ledger books, and registers list index.'
  };

  if (descMap[id]) return descMap[id];
  
  const labelClean = label.toLowerCase();
  if (labelClean.includes('trial')) return 'Consolidated trial balance ledger tracking credits and debits.';
  if (labelClean.includes('daybook')) return 'Daily transaction logs compiled from active accounting journals.';
  if (labelClean.includes('cash flow')) return 'Flow statement charting liquid fund changes across operational periods.';
  if (labelClean.includes('funds flow')) return 'Compares resources inflows and outflows across working capital lines.';
  if (labelClean.includes('group summary')) return 'Child ledger balances summary categorized under major parent groups.';
  if (labelClean.includes('ledger')) return 'Browse and extract transaction lists for any selected active ledger.';
  if (labelClean.includes('sales')) return 'Chronological overview of corporate sales vouchers and bills.';
  if (labelClean.includes('purchase')) return 'Procurement database tracking supply bills and trade vouchers.';
  if (labelClean.includes('payroll') || labelClean.includes('pay-')) return 'Corporate payroll statements and employee compensation registers.';
  if (labelClean.includes('stock')) return 'Inventory tracking statement detailing physical quantities and values.';
  if (labelClean.includes('statistics')) return 'Exposes core transaction statistics, ledger indices, and activity counts.';

  return `Analytical interactive statements profiling ${label.toLowerCase()} entries.`;
};
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { erpService } from '../services/erpService';
import { MenuConfig } from '../types';

export const ReportsMenu: React.FC = () => {
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const { 
    reportsPageUiStyle, 
    reportsColumnsPerRow = 4, 
    enableUserSortViewPref = false, 
    userSettings = {}, 
    updateUserSettings 
  } = useSettings();
  const navigate = useNavigate();
  const [menuConfig, setMenuConfig] = React.useState<MenuConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [activeCategoryTab, setActiveCategoryTab] = React.useState<'all' | 'accounting' | 'inventory' | 'payroll' | 'exception'>('all');
  const [selectedCategory, setSelectedCategory] = React.useState<any | null>(null);

  const defaultItems = React.useMemo(() => [
    { id: 'rep-trial-balance', label: 'Trial Balance', labelKey: 'reports.trialBalance', to: '/reports/trial-balance', icon: 'Scale' },
    { id: 'rep-daybook', label: 'Daybook', labelKey: 'daybook.title', to: '/reports/daybook', icon: 'ClipboardList' },
    { id: 'rep-cash-flow', label: 'Cash Flow', labelKey: 'reports.cashFlow', to: '/reports/cash-flow', icon: 'DollarSign' },
    { id: 'rep-funds-flow', label: 'Funds Flow', labelKey: 'reports.fundsFlow', to: '/reports/funds-flow', icon: 'Activity' },
    { id: 'rep-group-summary', label: 'Group Summary', labelKey: 'reports.groupSummary', to: '/reports/group-summary', icon: 'ClipboardList' },
    { id: 'rep-group-voucher', label: 'Group Vouchers', labelKey: 'reports.groupVoucher', to: '/reports/group-voucher', icon: 'BookOpen' },
    { id: 'rep-ledger-statement', label: 'Ledger Statement', labelKey: 'reports.ledgerStatement', to: '/reports/ledger', icon: 'FileText' },
    { id: 'rep-sales-register', label: 'Sales Register', labelKey: 'reports.salesRegister', to: '/reports/sales-register', icon: 'FileText' },
    { id: 'rep-purchase-register', label: 'Purchase Register', labelKey: 'reports.purchaseRegister', to: '/reports/purchase-register', icon: 'FileText' },
    { id: 'rep-cash-bank', label: 'Cash/Bank Books', labelKey: 'reports.cashBankBooks', to: '/reports/cash-bank', icon: 'BookOpen', hidden: false },
    { id: 'rep-pay-slip', label: 'Pay Slip', labelKey: 'reports.paySlip', to: '/reports/pay-slip', icon: 'FileText' },
    { id: 'rep-pay-sheet', label: 'Pay Sheet', labelKey: 'reports.paySheet', to: '/reports/pay-sheet', icon: 'FileText' },
    { id: 'rep-attendance-sheet', label: 'Attendance Sheet', labelKey: 'reports.attendanceSheet', to: '/reports/attendance-sheet', icon: 'FileText' },
    { id: 'rep-payment-advice', label: 'Payment Advice', labelKey: 'reports.paymentAdvice', to: '/reports/payment-advice', icon: 'FileText' },
    { id: 'rep-payroll-statement', label: 'Payroll Statement', labelKey: 'reports.payrollStatement', to: '/reports/payroll-statement', icon: 'FileText' },
    { id: 'rep-payroll-register', label: 'Payroll Register', labelKey: 'reports.payrollRegister', to: '/reports/payroll-register', icon: 'FileText' },
    { id: 'rep-attendance-register', label: 'Attendance Register', labelKey: 'reports.attendanceRegister', to: '/reports/attendance-register', icon: 'FileText' },
    { id: 'rep-employee-profile', label: 'Employee Profile', labelKey: 'reports.employeeProfile', to: '/reports/employee-profile', icon: 'User' },
    { id: 'rep-headcount', label: 'Employee Head Count', labelKey: 'reports.employeeHeadCount', to: '/reports/employee-head-count', icon: 'Users' },
    { id: 'rep-inventory-books', label: 'Inventory Books', labelKey: 'nav.inventoryBooks', to: '/reports/inventory-books', icon: 'BookOpen' },
    { id: 'rep-stock-query', label: 'Stock Query', labelKey: 'reports.stockQuery', to: '/reports/stock-query', icon: 'Package' },
    { id: 'rep-movement', label: 'Movement Analysis', labelKey: 'reports.movementAnalysis', to: '/reports/movement', icon: 'Activity' },
    { id: 'rep-ageing-analysis', label: 'Ageing Analysis', labelKey: 'nav.ageingAnalysis', to: '/reports/ageing-analysis', icon: 'Activity' },
    { id: 'rep-negative-stock', label: 'Negative Stock', labelKey: 'nav.negativeStock', to: '/reports/negative-stock', icon: 'AlertCircle' },
    { id: 'rep-negative-ledger', label: 'Negative Ledger', labelKey: 'nav.negativeLedger', to: '/reports/negative-ledger', icon: 'AlertCircle' },
    { id: 'rep-statement-of-account', label: 'Statement of Account', labelKey: 'nav.statementOfAccount', to: '/reports/account-books', icon: 'BookOpen' },
    { id: 'rep-stock-summary', label: 'Stock Summary', labelKey: 'reports.stockSummary', to: '/reports/stock', icon: 'Package' },
    { id: 'rep-account-books', label: 'Account Books', labelKey: 'nav.accountBooks', to: '/reports/account-books', icon: 'BookOpen' }
  ], []);

  const reportsGroup = menuConfig?.groups.find(g => g.id === 'group-reports' || g.group.toLowerCase() === 'reports');

  // Merge default items with potentially missing remote items
  const itemsToUse = React.useMemo(() => {
    if (!reportsGroup?.items) return defaultItems;
    const remoteItems = reportsGroup.items;
    const remoteIds = new Set(remoteItems.map(i => i.id));
    const missingDefaults = defaultItems.filter(i => !remoteIds.has(i.id));
    return [...remoteItems, ...missingDefaults];
  }, [reportsGroup, defaultItems]);

  React.useEffect(() => {
    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
      setMenuConfig(config);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Categorize items definitions
  const categories = React.useMemo(() => [
    {
      id: 'accounting',
      titleKey: 'nav.accounting',
      description: 'Trial details, cash/funds projections, flow books, sales registry tables, general ledger statement journals, and cash/bank books.',
      icon: Scale,
      color: 'blue',
      gradient: 'from-blue-500 to-indigo-500',
      itemIds: [
        'rep-trial-balance', 
        'rep-daybook', 
        'rep-cash-flow', 
        'rep-funds-flow',
        'rep-group-summary',
        'rep-group-voucher',
        'rep-ledger-statement',
        'rep-cash-bank',
        'rep-sales-register',
        'rep-purchase-register',
        'rep-account-books',
        'rep-statement-of-account'
      ]
    },
    {
      id: 'inventory',
      titleKey: 'nav.inventory',
      description: 'Real-time stocks registers, inventory books, aged stock analysis, movement patterns, and category summaries.',
      icon: Package,
      color: 'emerald',
      gradient: 'from-emerald-500 to-teal-500',
      itemIds: [
        'rep-inventory-books',
        'rep-stock-summary',
        'rep-stock-query',
        'rep-movement',
        'rep-ageing-analysis'
      ]
    },
    {
      id: 'payroll',
      titleKey: 'nav.payroll',
      description: 'Employee designation profile logs, payslip vouchers, attendance logs, payroll registers, and paysheets structure summaries.',
      icon: Users,
      color: 'violet',
      gradient: 'from-violet-500 to-fuchsia-500',
      itemIds: [
        'rep-pay-slip',
        'rep-pay-sheet',
        'rep-attendance-sheet',
        'rep-payment-advice',
        'rep-payroll-statement',
        'rep-payroll-register',
        'rep-attendance-register',
        'rep-employee-profile',
        'rep-headcount'
      ]
    },
    {
      id: 'exception',
      titleKey: 'nav.exceptionReports',
      description: 'Anomalies tracking, critical negative stock warnings, negative ledger balances, and compliance audit indices.',
      icon: AlertCircle,
      color: 'amber',
      gradient: 'from-amber-500 to-orange-500',
      itemIds: [
        'rep-negative-stock',
        'rep-negative-ledger'
      ]
    }
  ], []);

  const groupedReports = React.useMemo(() => {
    const rawGrouped = categories.reduce((acc, cat) => {
      acc[cat.id] = cat.itemIds
        .map(id => itemsToUse.find(item => item.id === id))
        .filter((item): item is typeof itemsToUse[number] => !!item);
      return acc;
    }, {} as Record<string, typeof itemsToUse>);

    if (!enableUserSortViewPref) return rawGrouped;

    const reportsSortBy = userSettings.reportsSortBy || 'default';
    if (reportsSortBy === 'default') return rawGrouped;

    const sorted = { ...rawGrouped };
    Object.keys(sorted).forEach((catId) => {
      sorted[catId] = [...sorted[catId]].sort((a, b) => {
        if (reportsSortBy === 'az') {
          const la = (a.labelKey && t(a.labelKey) !== a.labelKey ? t(a.labelKey) : a.label || '').toLowerCase();
          const lb = (b.labelKey && t(b.labelKey) !== b.labelKey ? t(b.labelKey) : b.label || '').toLowerCase();
          return la.localeCompare(lb);
        }
        if (reportsSortBy === 'za') {
          const la = (a.labelKey && t(a.labelKey) !== a.labelKey ? t(a.labelKey) : a.label || '').toLowerCase();
          const lb = (b.labelKey && t(b.labelKey) !== b.labelKey ? t(b.labelKey) : b.label || '').toLowerCase();
          return lb.localeCompare(la);
        }
        if (reportsSortBy === 'code_az') {
          const codeA = a.id.replace('rep-', '').toLowerCase();
          const codeB = b.id.replace('rep-', '').toLowerCase();
          return codeA.localeCompare(codeB);
        }
        return 0;
      });
    });

    return sorted;
  }, [categories, itemsToUse, enableUserSortViewPref, userSettings.reportsSortBy, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render original classic configuration
  const renderClassic = () => (
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <EditableHeader 
            pageId="reports_menu"
            defaultTitle={t('nav.reports')}
            defaultSubtitle="Detailed business reports and financial analytical tools."
          />
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((cat, idx) => {
            const items = groupedReports[cat.id] || [];
            if (items.length === 0) return null;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col self-start"
              >
                <div className="p-4 bg-foreground/5 border-b border-border flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg shadow-sm">
                    <cat.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <h2 className="font-bold text-foreground uppercase tracking-wider text-sm">
                    {t(cat.titleKey)}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-border/30">
                  {items.map((item) => {
                    const Icon = (LucideIcons as any)[item.icon] || FileText;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.to)}
                        className="flex items-center gap-4 p-5 hover:bg-foreground/5 transition-all text-left group min-h-[72px]"
                      >
                        <div className="flex-shrink-0 w-12 h-12 p-3 rounded-xl bg-background border border-border/50 shadow-sm group-hover:scale-110 group-hover:border-primary/30 transition-all text-primary flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base line-clamp-2">
                            {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                          </h3>
                          {item.hidden && isSuperAdmin && (
                            <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest block mt-1">Hidden from sidebar</span>
                          )}
                        </div>
                        <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Render upgraded premium modern layout with category drill-down
  const renderModern = () => {
    // Determine the list of filtered report items inside the selected category (drill-down mode)
    const activeCategoryItems = selectedCategory ? (groupedReports[selectedCategory.id] || []) : [];
    
    // Filter report items if we are in drill-down mode
    const filteredReports = activeCategoryItems.filter(item => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const label = item.label.toLowerCase();
      const localizedLabel = item.labelKey ? t(item.labelKey).toLowerCase() : '';
      const idStr = item.id.replace('rep-', '').toLowerCase();
      return label.includes(q) || localizedLabel.includes(q) || idStr.includes(q);
    });

    // Check if any report matches worldwide search if we search from categories view
    const filteredCategories = categories.filter(cat => {
      const matchesTab = activeCategoryTab === 'all' || activeCategoryTab === cat.id;
      if (!matchesTab) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const titleLower = t(cat.titleKey).toLowerCase();
      const descLower = cat.description.toLowerCase();
      
      if (titleLower.includes(q) || descLower.includes(q)) return true;

      const items = groupedReports[cat.id] || [];
      return items.some(item => {
        const label = item.label.toLowerCase();
        const localizedLabel = item.labelKey ? t(item.labelKey).toLowerCase() : '';
        return label.includes(q) || localizedLabel.includes(q);
      });
    });

    return (
      <div className="flex flex-col min-h-full bg-slate-50/50 transition-colors">
        {/* Dynamic Sticky Header & Filter Area */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-5 lg:px-6 py-4.5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {selectedCategory && (
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery('');
                  }}
                  id="modern-back-btn"
                  className="p-2.5 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 shadow-sm"
                >
                  <ArrowLeft className="w-5 h-5" />
                </motion.button>
              )}
              
              <div>
                {selectedCategory ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                      <span>{t('nav.reports')}</span>
                      <span>/</span>
                      <span className="text-slate-400 capitalize">{t(selectedCategory.titleKey)}</span>
                    </div>
                    <h1 className="text-xl font-bold text-slate-800">
                      {t(selectedCategory.titleKey)}
                    </h1>
                  </div>
                ) : (
                  <EditableHeader 
                    pageId="reports_menu_modern"
                    defaultTitle={t('nav.reports')}
                    defaultSubtitle="Interactive executive reporting dashboard and audit ledger indices."
                  />
                )}
              </div>
            </div>

            {/* Metrics Quick Indicator */}
            <div className="flex items-center gap-3 self-start sm:self-auto">
              <div className="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100 hidden md:flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] font-bold text-slate-500 tracking-wide uppercase">All Engines Active</span>
              </div>
              
              <div className="bg-blue-50 text-blue-600 rounded-xl px-4 py-2 border border-blue-100/50 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide">
                <Calculator className="w-3.5 h-3.5" />
                <span>
                  {selectedCategory ? filteredReports.length : itemsToUse.length} Reports
                </span>
              </div>
            </div>
          </div>

          {/* Filters/Tabs and Global/Local Reports Search */}
          <div className="flex flex-col xl:flex-row gap-3.5 items-stretch xl:items-center pt-1 animate-in fade-in duration-200">
            {!selectedCategory ? (
              <div className="flex items-center bg-slate-100/80 p-1 rounded-xl overflow-x-auto self-start xl:self-auto max-w-full">
                {(['all', 'accounting', 'inventory', 'payroll', 'exception'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCategoryTab(tab)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                      activeCategoryTab === tab
                        ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab === 'all' ? 'All Areas' : t(`nav.${tab}`)}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={
                  selectedCategory 
                    ? `Search ${t(selectedCategory.titleKey)} reports by name, tag or code...`
                    : "Search all business reports by classification, name or code..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs text-slate-800 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {enableUserSortViewPref && (
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/60 p-2 px-3 rounded-xl shadow-xs" id="reports-user-preferences-modern">
              <div className="flex items-center gap-1.5 text-slate-500 font-sans">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Preferences:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">Sort by:</span>
                <select
                  value={userSettings.reportsSortBy || 'default'}
                  onChange={(e) => updateUserSettings({ reportsSortBy: e.target.value })}
                  className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value="default">Default Order</option>
                  <option value="az">Alphabetical (A-Z)</option>
                  <option value="za">Alphabetical (Z-A)</option>
                  <option value="code_az">Report Code (A-Z)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">View Grid Columns:</span>
                <select
                  value={userSettings.reportsColumns || 4}
                  onChange={(e) => updateUserSettings({ reportsColumns: Number(e.target.value) })}
                  className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value={1}>1 Column List</option>
                  <option value={2}>2 Columns Grid</option>
                  <option value={3}>3 Columns Grid</option>
                  <option value={4}>4 Columns Grid</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Section */}
        <div className="flex-1 p-5 lg:p-6 pb-28">
          <AnimatePresence mode="wait">
            {!selectedCategory ? (
              /* Drill-down Home: Category Cards Grid */
              <motion.div
                key="modern-categories"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-7"
              >
                {filteredCategories.map((cat, idx) => {
                  const items = groupedReports[cat.id] || [];
                  const groupConfig = {
                    accounting: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-500/50', iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-500' },
                    inventory: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-500/50', iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500' },
                    payroll: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'hover:border-violet-500/50', iconBg: 'bg-gradient-to-tr from-violet-500 to-fuchsia-500' },
                    exception: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-500/50', iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500' }
                  }[cat.id] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'hover:border-slate-500/50', iconBg: 'bg-gradient-to-tr from-slate-500 to-slate-600' };

                  return (
                    <motion.button
                      key={cat.id}
                      id={`modern-cat-${cat.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSearchQuery('');
                      }}
                      className={`flex flex-col p-5 bg-white rounded-2xl border border-slate-200/75 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left group relative overflow-hidden ${groupConfig.border}`}
                    >
                      {/* Glowing highlight in background */}
                      <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-500 -z-0 opacity-20" />

                      {/* Top Row: Icon and Title on its right side */}
                      <div className="flex items-center gap-3 w-full mb-3 z-10">
                        {/* Icon Container */}
                        <div className={`p-3 rounded-xl text-white ${groupConfig.iconBg} shadow-sm group-hover:scale-110 transition-transform flex-shrink-0`}>
                          <cat.icon className="w-5 h-5 paint-icon" />
                        </div>
                        
                        {/* Title & Badge */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg group-hover:text-blue-600 transition-colors tracking-tight leading-snug">
                            {t(cat.titleKey)}
                          </h3>
                        </div>
                      </div>

                      {/* Bottom container: Paragraph starts directly underneath the icon container, left-aligned */}
                      <div className="w-full z-10">
                        <p className="text-xs text-slate-400 font-sans leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      {/* Dynamic corner pointer arrow */}
                      <div className="absolute right-4 bottom-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </motion.button>
                  );
                })}
              </motion.div>
            ) : (
              /* Category Explorer: Sub-report Items List (Identical to Alter list style) */
              <motion.div
                key="modern-reports-list"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="px-5.5 py-4.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-400 tracking-wider">
                    Reports List Index
                  </span>
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 border border-blue-100/50 px-3 py-1 rounded-full uppercase tracking-wider">
                    {filteredReports.length} {filteredReports.length === 1 ? 'Report' : 'Reports'}
                  </span>
                </div>
                
                {filteredReports.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredReports.map((item, idx) => {
                      const Icon = (LucideIcons as any)[item.icon] || FileText;
                      return (
                        <motion.button
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(idx * 0.025, 0.45) }}
                          onClick={() => navigate(item.to)}
                          className="w-full flex items-center justify-between p-5 hover:bg-slate-50/70 transition-all text-left group"
                        >
                          <div className="flex items-center gap-4.5">
                            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-200/60 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all text-slate-500 flex items-center justify-center font-mono text-[11px] font-bold shadow-sm">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800 group-hover:text-blue-600 transition-colors text-xs sm:text-sm">
                                {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono tracking-wider mt-0.5 uppercase flex items-center gap-1">
                                <span>Report Code:</span>
                                <span className="font-bold text-slate-500 bg-slate-100 py-0.5 px-1.5 rounded text-[9px]">{item.id.replace('rep-', '')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {item.hidden && isSuperAdmin && (
                              <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest bg-slate-100 py-0.5 px-2 rounded">Hidden</span>
                            )}
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 p-6 text-center text-slate-500 flex flex-col items-center justify-center">
                    <FileText className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="font-bold text-slate-700">No Reports Match Search Query</p>
                    <p className="text-xs text-slate-400 max-w-sm mt-1.5">No reports were found matching "{searchQuery}" under {t(selectedCategory.titleKey)}. Clear the search or write a different term.</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-5 px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-200"
                    >
                      Clear Search Term
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  // Render upgraded premium modern layout with dynamic grid column configuration
  const renderGrid = () => {
    // Sequence order: Accounting, Exception, Inventory, Payroll
    const orderedCategoryIds: ('accounting' | 'exception' | 'inventory' | 'payroll')[] = [
      'accounting',
      'exception',
      'inventory',
      'payroll'
    ];

    // Filter items based on searchQuery
    const filterItem = (item: any) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const label = item.label.toLowerCase();
      const localizedLabel = item.labelKey ? t(item.labelKey).toLowerCase() : '';
      const idStr = item.id.replace('rep-', '').toLowerCase();
      return label.includes(q) || localizedLabel.includes(q) || idStr.includes(q);
    };

    // Columns CSS class generator (1 to 4)
    const getGridColsClass = (cols: number) => {
      switch (cols) {
        case 1: return 'grid-cols-1';
        case 2: return 'grid-cols-1 md:grid-cols-2';
        case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        case 4: 
        default:
          return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4';
      }
    };

    const activeReportsColumns = enableUserSortViewPref && userSettings.reportsColumns 
      ? Number(userSettings.reportsColumns) 
      : Number(reportsColumnsPerRow);

    const gridColsClass = getGridColsClass(activeReportsColumns);

    // Filtered categories and their items
    const categoryFilterList = activeCategoryTab === 'all' 
      ? orderedCategoryIds 
      : orderedCategoryIds.filter(id => id === activeCategoryTab);

    const renderedSections = categoryFilterList.map((catId) => {
      const cat = categories.find(c => c.id === catId);
      if (!cat) return null;

      const rawItems = groupedReports[catId] || [];
      const matchedItems = rawItems.filter(filterItem);
      
      if (matchedItems.length === 0) return null;

      return (
        <div key={catId} className="space-y-4">
          {/* Section Header */}
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-lg text-white bg-gradient-to-br ${cat.gradient} shadow-sm`}>
                <cat.icon className="w-4.5 h-4.5 paint-icon" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">
                  {t(cat.titleKey)}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium hidden sm:block">{cat.description}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 font-mono">
              {matchedItems.length} Reports
            </span>
          </div>

          {/* Dynamic Grid list */}
          <div className={`grid gap-5 ${gridColsClass}`}>
            {matchedItems.map((item, index) => {
              const Icon = (LucideIcons as any)[item.icon] || FileText;
              
              const groupConfig = {
                accounting: { bg: 'bg-blue-50 text-blue-600 border border-blue-100', text: 'text-blue-600', border: 'hover:border-blue-500/50', iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-500' },
                inventory: { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', text: 'text-emerald-600', border: 'hover:border-emerald-500/50', iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500' },
                payroll: { bg: 'bg-violet-50 text-violet-600 border border-violet-100', text: 'text-violet-600', border: 'hover:border-violet-500/50', iconBg: 'bg-gradient-to-tr from-violet-500 to-fuchsia-500' },
                exception: { bg: 'bg-amber-50 text-amber-600 border border-amber-100', text: 'text-amber-600', border: 'hover:border-amber-500/50', iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500' }
              }[catId] || { bg: 'bg-slate-50 text-slate-600 border border-slate-100', text: 'text-slate-600', border: 'hover:border-slate-500/50', iconBg: 'bg-gradient-to-tr from-slate-500 to-slate-600' };

              const reportDesc = getReportDescription(item.id, item.label);

              return (
                <motion.button
                  key={item.id}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(item.to)}
                  className={`flex flex-col p-5 bg-white rounded-2xl border border-slate-200/75 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left relative overflow-hidden group/btn ${groupConfig.border}`}
                >
                  {/* Glowing highlight in background */}
                  <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full group-hover/btn:scale-150 transition-all duration-500 -z-0 opacity-20" />

                  {/* Top Row: Icon and Title on its right side */}
                  <div className="flex items-center gap-3 w-full mb-3 z-10">
                    {/* Icon Container */}
                    <div className={`p-3 rounded-xl text-white ${groupConfig.iconBg} shadow-sm group-hover/btn:scale-110 transition-transform flex-shrink-0`}>
                      <Icon className="w-5 h-5 paint-icon" />
                    </div>
                    
                    {/* Title & Badge */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 group-hover/btn:text-blue-600 transition-colors text-sm sm:text-base md:text-lg font-sans tracking-tight leading-snug">
                        {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                      </h4>
                    </div>
                  </div>

                  {/* Bottom container: Paragraph starts directly underneath the icon container, left-aligned */}
                  <div className="w-full z-10">
                    <p className="text-xs text-slate-400 font-sans leading-relaxed">
                      {reportDesc}
                    </p>
                    
                    {/* Footnote details (e.g., ID code or hidden state) */}
                    {item.hidden && isSuperAdmin && (
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider bg-slate-100 py-0.5 px-1.5 rounded">Hidden</span>
                      </div>
                    )}
                  </div>

                  {/* Micro right arrow on hover on top right */}
                  <div className="absolute right-4 bottom-4 text-blue-600 opacity-0 group-hover/btn:opacity-100 transition-all transform translate-x-2 group-hover/btn:translate-x-0 z-10">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>
      );
    });

    return (
      <div className="flex flex-col min-h-full bg-slate-50/50 transition-colors">
        {/* Sticky Header Row */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-5 lg:px-6 py-4 space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {/* Group Menu */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl overflow-x-auto self-start md:self-auto max-w-full shrink-0">
              {(['all', 'accounting', 'inventory', 'payroll', 'exception'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveCategoryTab(tab);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeCategoryTab === tab
                      ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'all' ? 'All Areas' : t(`nav.${tab}`)}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports by classification, name, index, key or code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-2.5 bg-slate-50 hover:bg-slate-105 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs text-slate-800 font-medium"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Metrics Quick Indicator */}
            <div className="bg-blue-50 text-blue-600 rounded-xl px-4 py-2 border border-blue-100 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide shrink-0">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Total: {categories.length} Modules</span>
            </div>
          </div>

          {enableUserSortViewPref && (
            <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/60 p-2 px-3 rounded-xl shadow-xs" id="reports-user-preferences-grid">
              <div className="flex items-center gap-1.5 text-slate-500 font-sans">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Preferences:</span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">Sort by:</span>
                <select
                  value={userSettings.reportsSortBy || 'default'}
                  onChange={(e) => updateUserSettings({ reportsSortBy: e.target.value })}
                  className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value="default">Default Order</option>
                  <option value="az">Alphabetical (A-Z)</option>
                  <option value="za">Alphabetical (Z-A)</option>
                  <option value="code_az">Report Code (A-Z)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">View:</span>
                <select
                  value={userSettings.reportsColumns || 4}
                  onChange={(e) => updateUserSettings({ reportsColumns: Number(e.target.value) })}
                  className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
                >
                  <option value={1}>1 Column List</option>
                  <option value={2}>2 Columns Grid</option>
                  <option value={3}>3 Columns Grid</option>
                  <option value={4}>4 Columns Grid</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Main Grid Content Area */}
        <div className="flex-1 p-5 lg:p-6 pb-28 space-y-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${activeCategoryTab}-${searchQuery}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-10"
            >
              {renderedSections.some(sec => sec !== null) ? (
                renderedSections
              ) : (
                <div className="py-20 p-6 text-center text-slate-500 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                  <FileText className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
                  <p className="font-bold text-slate-700">No Reports Match Search Query</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1.5">We couldn't find any reports for "{searchQuery}". Check the search query or select another category tab.</p>
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="mt-5 px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-200/80"
                  >
                    Clear Search
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full">
      {reportsPageUiStyle === 'grid' ? renderGrid() : (reportsPageUiStyle === 'modern' ? renderModern() : renderClassic())}
    </div>
  );
};
