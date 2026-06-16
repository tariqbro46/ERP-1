import React from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { useSettings, SIDEBAR_BG_OPTIONS, SIDEBAR_TEXT_OPTIONS } from './contexts/SettingsContext';
import { useTheme, Theme } from './contexts/ThemeContext';
import * as LucideIcons from 'lucide-react';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Settings as SettingsIcon, 
  StickyNote, 
  Database,
  ChevronRight,
  ChevronLeft,
  LogOut,
  Scale,
  TrendingUp,
  Package,
  ClipboardList,
  UserPlus,
  Activity,
  Plus,
  MapPin,
  Sun,
  Moon,
  Menu,
  X,
  Users,
  Building2,
  Shield,
  Award,
  DollarSign,
  Search,
  AlertCircle,
  Printer,
  Cpu,
  BarChart3
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { VoucherEntry } from './components/VoucherEntry';
import { Notes } from './components/Notes';
import { LedgerCreation } from './components/LedgerCreation';
import { ItemCreation } from './components/ItemCreation';
import { ItemMaster } from './components/ItemMaster';
import { Daybook } from './components/Daybook';
import { StockSummary } from './components/StockSummary';
import { LocationStockReport } from './components/LocationStockReport';
import { StockItemReport } from './components/StockItemReport';
import { BalanceSheet } from './components/BalanceSheet';
import { ProfitAndLoss } from './components/ProfitAndLoss';
import { LedgerStatement } from './components/LedgerStatement';
import { ChartOfAccounts } from './components/ChartOfAccounts';
import { Settings } from './components/Settings';
import { GoToSearch } from './components/GoToSearch';
import { TrialBalance } from './components/TrialBalance';
import { RatioAnalysis } from './components/RatioAnalysis';
import { FinancialInsights } from './components/FinancialInsights';
import { GodownMaster } from './components/GodownMaster';
import { EmployeeMaster } from './components/EmployeeMaster';
import { PayrollManagement } from './components/PayrollManagement';
import { PayrollReports } from './components/PayrollReports';
import { UserManagement } from './components/UserManagement';
import { CompanyManagement } from './components/CompanyManagement';
import { SalespersonReport } from './components/SalespersonReport';
import { OrderManagement } from './components/OrderManagement';
import OrderEntry from './components/OrderEntry';
import { MachineManagement } from './components/MachineManagement';
import OrderReports from './components/OrderReports';
import FounderPanel from './components/FounderPanel';
import SubscriptionRequired from './components/SubscriptionRequired';
import { SubscriptionPage } from './components/SubscriptionPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import NotificationCenter from './components/NotificationCenter';
import FacebookProfileMenu from './components/FacebookProfileMenu';
import NotificationPage from './components/NotificationPage';
import SearchPage from './components/SearchPage';
import HelpPage from './components/HelpPage';
import UserProfile from './components/UserProfile';
import { AlterMaster } from './components/AlterMaster';
import { ReportsMenu } from './components/ReportsMenu';
import { GlobalSearch } from './components/GlobalSearch';
import { NegativeReports } from './components/NegativeReports';
import { CashFlow } from './components/CashFlow';
import { FundsFlow } from './components/FundsFlow';
import { Statistics } from './components/Statistics';
import { AgeingAnalysis } from './components/AgeingAnalysis';
import { StockQuery } from './components/StockQuery';
import { MovementAnalysis } from './components/MovementAnalysis';
import { RegisterReport } from './components/RegisterReport';
import { GroupSummary } from './components/GroupSummary';
import { GroupVoucher } from './components/GroupVoucher';
import { CashBankBooks } from './components/CashBankBooks';
import { UnitMaster } from './components/UnitMaster';
import { InventoryOverview } from './components/InventoryOverview';
import { StockGroupSummary } from './components/StockGroupSummary';
import { StockCategorySummary } from './components/StockCategorySummary';
import { InventoryBooks } from './components/InventoryBooks';
import { AccountBooks } from './components/AccountBooks';
import MaintenancePage from './components/MaintenancePage';
import QuotaExceededPage from './components/QuotaExceededPage';
import { ReportPlaceholder } from './components/ReportPlaceholder';
import { GroupDashboard } from './components/GroupDashboard';
import { VoucherDetail } from './components/VoucherDetail';
import { PageHelp } from './components/PageHelp';
import TaxManagement from './pages/TaxManagement';
import CRM from './pages/CRM';
import PurchaseManagement from './pages/PurchaseManagement';
import InventoryAdvanced from './pages/InventoryAdvanced';
import DataCenter from './pages/DataCenter';
import AIInsights from './pages/AIInsights';
import SystemGuideFloatingButton from './components/SystemGuideFloatingButton';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Login, Register } from './components/Auth';
import { useNavigate } from 'react-router-dom';
import { NAV_ITEMS, PAGE_TITLES, DASHBOARD_ITEM } from './constants/navigation';
import { FeatureGuard } from './components/FeatureGuard';
import { erpService, deduplicateMenuConfig } from './services/erpService';
import { MenuConfig } from './types';
import { useSubscription } from './hooks/useSubscription';
import { SkeletonLoader } from './components/SkeletonLoader';

import { Home } from './pages/landing/Home';
import { Features } from './pages/landing/Features';
import { About } from './pages/landing/About';
import { Contact } from './pages/landing/Contact';
import { Pricing } from './pages/landing/Pricing';

const getColorfulItemStyle = (to: string, active: boolean) => {
  const isDashboard = to === '/dashboard';
  const isMasters = to.includes('/item') || to.includes('/accounts') || to.includes('/godown');
  const isVoucher = to.includes('/voucher') || to.includes('/invoice') || to.includes('/sales') || to.includes('/purchase');
  const isBook = to.includes('/daybook') || to.includes('/trail') || to.includes('/ledger');
  const isReport = to.includes('/balance') || to.includes('/profit') || to.includes('/ratio') || to.includes('/reports');
  const isProduction = to.includes('/manufacturing') || to.includes('/machine') || to.includes('/production');
  const isAdv = to.includes('/tax') || to.includes('/crm') || to.includes('/supply');
  
  if (active) {
    if (isDashboard) return { bg: "bg-sky-500/10 text-sky-400 border-sky-500", icon: "text-sky-500", dot: "bg-sky-400" };
    if (isMasters) return { bg: "bg-pink-500/10 text-pink-400 border-pink-500", icon: "text-pink-500", dot: "bg-pink-400" };
    if (isVoucher) return { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500", icon: "text-emerald-500", dot: "bg-emerald-400" };
    if (isBook) return { bg: "bg-amber-500/10 text-amber-400 border-amber-500", icon: "text-amber-500", dot: "bg-amber-400" };
    if (isReport) return { bg: "bg-teal-500/10 text-teal-400 border-teal-500", icon: "text-teal-500", dot: "bg-teal-400" };
    if (isProduction) return { bg: "bg-orange-500/10 text-orange-400 border-orange-500", icon: "text-orange-500", dot: "bg-orange-400" };
    if (isAdv) return { bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500", icon: "text-indigo-500", dot: "bg-indigo-400" };
    
    return { bg: "bg-blue-500/10 text-blue-400 border-blue-500", icon: "text-blue-500", dot: "bg-blue-400" };
  } else {
    if (isDashboard) return { bg: "hover:bg-sky-500/5 text-slate-400 hover:text-sky-400 border-transparent", icon: "text-sky-500/70 group-hover:text-sky-500", dot: "bg-sky-400/50" };
    if (isMasters) return { bg: "hover:bg-pink-500/5 text-slate-400 hover:text-pink-400 border-transparent", icon: "text-pink-500/70 group-hover:text-pink-500", dot: "bg-pink-400/50" };
    if (isVoucher) return { bg: "hover:bg-emerald-500/5 text-slate-400 hover:text-emerald-400 border-transparent", icon: "text-emerald-500/70 group-hover:text-emerald-500", dot: "bg-emerald-400/50" };
    if (isBook) return { bg: "hover:bg-amber-500/5 text-slate-400 hover:text-amber-400 border-transparent", icon: "text-amber-500/70 group-hover:text-amber-500", dot: "bg-amber-400/50" };
    if (isReport) return { bg: "hover:bg-teal-500/5 text-slate-400 hover:text-teal-400 border-transparent", icon: "text-teal-500/70 group-hover:text-teal-500", dot: "bg-teal-400/50" };
    if (isProduction) return { bg: "hover:bg-orange-500/5 text-slate-400 hover:text-orange-400 border-transparent", icon: "text-orange-500/70 group-hover:text-orange-500", dot: "bg-orange-400/50" };
    if (isAdv) return { bg: "hover:bg-indigo-500/5 text-slate-400 hover:text-indigo-400 border-transparent", icon: "text-indigo-500/70 group-hover:text-indigo-500", dot: "bg-indigo-400/50" };
    
    return { bg: "hover:bg-blue-500/5 text-slate-400 hover:text-blue-400 border-transparent", icon: "text-blue-500/70 group-hover:text-blue-500", dot: "bg-blue-400/50" };
  }
};

const isSidebarReallyDark = (sidebarBgColor: string | undefined, currentTheme: string) => {
  if (sidebarBgColor && sidebarBgColor !== 'default') {
    const bgOpt = SIDEBAR_BG_OPTIONS.find(o => o.id === sidebarBgColor);
    return bgOpt ? bgOpt.isDark : true;
  }
  return currentTheme !== 'classic' && currentTheme !== 'light';
};

const getTextColorOpt = (opt: any, isDark: boolean) => {
  if (!opt) return null;
  if (isDark) {
    return {
      textClass: opt.textClass,
      activeClass: opt.activeClass,
      mutedClass: opt.mutedClass
    };
  } else {
    return {
      textClass: opt.lightTextClass || opt.textClass || 'text-stone-600 hover:text-stone-900',
      activeClass: opt.lightActiveClass || opt.activeClass || 'text-stone-950 bg-stone-100 border-stone-800',
      mutedClass: opt.lightMutedClass || opt.mutedClass || 'text-stone-500'
    };
  }
};

const SidebarItem = ({ to, icon: Icon, label, active, indent }: any) => {
  const { theme } = useTheme();
  const { menuBarStyle, sidebarBgColor, sidebarTextColor } = useSettings();
  const isDark = isSidebarReallyDark(sidebarBgColor, theme);
  const isColorful = menuBarStyle === 'colorful';
  const colorful = isColorful ? getColorfulItemStyle(to, active) : null;
  const baseCustomTextOpt = sidebarTextColor && sidebarTextColor !== 'default'
    ? SIDEBAR_TEXT_OPTIONS.find(o => o.id === sidebarTextColor)
    : null;
  const customTextOpt = getTextColorOpt(baseCustomTextOpt, isDark);

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center justify-between px-4 py-2.5 transition-colors duration-150 group border-l-2 border-transparent",
        isColorful 
          ? colorful.bg 
          : customTextOpt
            ? active
              ? `${customTextOpt.activeClass}`
              : `${customTextOpt.textClass} hover:bg-black/5 hover:dark:bg-white/5`
            : active 
              ? "bg-foreground/5 text-foreground border-foreground" 
              : "text-gray-500 hover:bg-card hover:text-foreground"
      )}
    >
      <div className={cn("flex items-center gap-3", indent && "ml-4")}>
        <Icon className={cn(
          "w-3.5 h-3.5 transition-colors duration-200", 
          isColorful 
            ? colorful.icon 
            : customTextOpt
              ? active ? "text-inherit" : "opacity-75 group-hover:opacity-100"
              : active ? "text-foreground" : "text-gray-600 group-hover:text-gray-400"
        )} />
        <span className={cn(
          "text-[10px] font-mono uppercase tracking-widest transition-colors duration-200",
          isColorful ? "font-semibold tracking-wider font-sans normal-case" : "",
          isColorful && active && "font-black"
        )}>{label}</span>
      </div>
      {active && (
        <div className={cn(
          "w-1.5 h-1.5 rounded-full shadow-sm", 
          isColorful 
            ? colorful.dot 
            : customTextOpt
              ? "bg-current"
              : "bg-foreground"
        )} />
      )}
    </Link>
  );
};

const SidebarGroup = ({ title, children, isOpen, onToggle, to }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void, to?: string }) => {
  const { theme } = useTheme();
  const { menuBarStyle, sidebarBgColor, sidebarTextColor } = useSettings();
  const isDark = isSidebarReallyDark(sidebarBgColor, theme);
  const isColorful = menuBarStyle === 'colorful';
  const baseCustomTextOpt = sidebarTextColor && sidebarTextColor !== 'default'
    ? SIDEBAR_TEXT_OPTIONS.find(o => o.id === sidebarTextColor)
    : null;
  const customTextOpt = getTextColorOpt(baseCustomTextOpt, isDark);

  const buttonBgClass = customTextOpt 
    ? isOpen 
      ? isDark ? "bg-white/5" : "bg-black/5" 
      : isDark ? "hover:bg-white/5" : "hover:bg-black/5"
    : isOpen 
      ? "bg-foreground/5" 
      : "hover:bg-card";

  return (
    <div className="mb-2">
      <div className="flex items-center group transition-colors select-none">
        {to ? (
          <Link 
            to={to}
            className={cn(
              "flex-1 px-4 py-3 flex items-center justify-between transition-colors",
              buttonBgClass
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-[1.5px] w-3 transition-all", 
                isOpen 
                  ? isColorful 
                    ? "bg-indigo-500" 
                    : customTextOpt 
                      ? "bg-current" 
                      : "bg-foreground" 
                  : "bg-border/40"
              )} />
              <p className={cn(
                "text-[9px] uppercase tracking-[0.2em] font-extrabold whitespace-nowrap transition-colors",
                isOpen 
                  ? isColorful 
                    ? "text-indigo-400" 
                    : customTextOpt 
                      ? "text-inherit" 
                      : "text-foreground" 
                  : customTextOpt 
                    ? customTextOpt.mutedClass || "opacity-75"
                    : "text-gray-500 group-hover:text-gray-300"
              )}>{title}</p>
            </div>
          </Link>
        ) : (
          <button 
            onClick={onToggle}
            className={cn(
              "flex-1 px-4 py-3 flex items-center justify-between transition-colors",
              buttonBgClass
            )}
          >
            <div className="flex items-center gap-2">
              <div className={cn(
                "h-[1.5px] w-3 transition-all", 
                isOpen 
                  ? isColorful 
                    ? "bg-indigo-500" 
                    : customTextOpt 
                      ? "bg-current" 
                      : "bg-foreground" 
                  : "bg-border/40"
              )} />
              <p className={cn(
                "text-[9px] uppercase tracking-[0.2em] font-extrabold whitespace-nowrap transition-colors",
                isOpen 
                  ? isColorful 
                    ? "text-indigo-400" 
                    : customTextOpt 
                      ? "text-inherit" 
                      : "text-foreground" 
                  : customTextOpt 
                    ? customTextOpt.mutedClass || "opacity-75"
                    : "text-gray-500 group-hover:text-gray-300"
              )}>{title}</p>
            </div>
          </button>
        )}
        <button 
          onClick={onToggle}
          className={cn(
            "px-3 py-3 transition-colors",
            buttonBgClass
          )}
        >
          <ChevronRight className={cn(
            "w-3 h-3 transition-transform duration-300",
            isOpen 
              ? isColorful 
                ? "rotate-90 text-indigo-400" 
                : customTextOpt 
                  ? "rotate-90 text-inherit" 
                  : "rotate-90 text-foreground" 
              : customTextOpt 
                ? "opacity-60" 
                : "text-gray-500 group-hover:text-gray-300"
          )} />
        </button>
      </div>
      <div className={cn(
        "overflow-hidden transition-all duration-300 ease-in-out",
        isOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
      )}>
        <div className="py-1 space-y-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};


function Layout({ children, onOpenSearch }: { children: React.ReactNode, onOpenSearch: () => void }) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, company, logout, isAdmin, isSuperAdmin, hasPermission } = useAuth();
  const searchIconColor = company?.search_config?.iconColor;
  const { isFeatureEnabled } = useSubscription();
  const { 
    companyName, 
    companyLogo,
    systemLogo,
    slogan, 
    features = [], 
    menuBarStyle = 'classic', 
    layoutWidth = 'constrained', 
    sidebarDefaultExpanded = true,
    showMobileNav = false,
    mobileBottomNavItems = [],
    uiStyle = 'UI/UX 1',
    reportsPageUiStyle = 'modern',
    glassBackground = 'default',
    englishFont = 'Inter',
    banglaFont = 'Hind Siliguri',
    appVersion = 'v1.0.1',
    statusOnlineText = 'Status: Online',
    showGoToShortcut = true,
    showTopbarSearch = true,
    showTopbarNotifications = true,
    showTopbarInstructions = true,
    showScrollingBar = false,
    subscriptionPlans = [],
    sidebarBgColor = 'default',
    sidebarTextColor = 'default',
    updateSettings
  } = useSettings();

  const activePlan = subscriptionPlans.find(p => p.id === company?.planId);

  const navigate = useNavigate();

  const [dynamicMenu, setDynamicMenu] = React.useState<MenuConfig | null>(() => {
    try {
      const persisted = localStorage.getItem('swr_system_menu');
      return persisted ? JSON.parse(persisted) : null;
    } catch (e) {
      return null;
    }
  });

  const [menuLoading, setMenuLoading] = React.useState(() => {
    try {
      const persisted = localStorage.getItem('swr_system_menu');
      return !persisted;
    } catch (e) {
      return true;
    }
  });

  React.useEffect(() => {
    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
      if (config) {
        setDynamicMenu(config);
        setMenuLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const getIcon = React.useCallback((name: string) => {
    const Icon = (LucideIcons as any)[name];
    return Icon || LucideIcons.Package;
  }, []);

  const menuGroups = React.useMemo(() => {
    let finalGroups = [];
    
    if (!dynamicMenu) {
      finalGroups = NAV_ITEMS;
    } else {
      const cleanedMenu = deduplicateMenuConfig(dynamicMenu);
      finalGroups = cleanedMenu ? cleanedMenu.groups : [];
    }

    // Merges groups with the same group name to avoid duplicate sections and resolve React key warnings
    const mergedGroupsMap = new Map<string, any>();
    finalGroups.forEach(g => {
      const existing = mergedGroupsMap.get(g.group);
      if (existing) {
        const existingItemIds = new Set(existing.items.map((i: any) => i.id || i.to));
        g.items.forEach((item: any) => {
          const key = item.id || item.to;
          if (!existingItemIds.has(key)) {
            existing.items.push(item);
            existingItemIds.add(key);
          }
        });
      } else {
        mergedGroupsMap.set(g.group, { ...g, items: [...g.items] });
      }
    });
    finalGroups = Array.from(mergedGroupsMap.values());

    return finalGroups
      .filter(group => !group.hidden)
      .map((group) => ({
      ...group,
      items: group.items.map((item) => ({
        ...item,
        icon: typeof item.icon === 'string' ? getIcon(item.icon) : item.icon
      }))
    }));
  }, [dynamicMenu, getIcon]);

  const getPageTitle = (): string => {
    // 1. Exact match for reports page Create / Alter
    if (location.pathname === '/reports') {
      return t('nav.reports') || 'Reports';
    }

    // 1b. Exact match for alter page
    if (location.pathname === '/alter') {
      return t('nav.createAlter') || 'Create / Alter';
    }

    // 1c. Match for voucher details route
    if (location.pathname.startsWith('/vouchers/view/')) {
      return 'Voucher Details';
    }

    // 2. Exact match for search page
    if (location.pathname === '/search') {
      return 'Search';
    }

    // 3. Exact match for instructions page
    if (location.pathname === '/instructions') {
      return 'System Guide';
    }

    // 4. Exact match for notifications page
    if (location.pathname === '/notifications') {
      return 'Notifications';
    }

    // 5. Direct match in PAGE_TITLES
    if (PAGE_TITLES[location.pathname]) {
      const key = PAGE_TITLES[location.pathname];
      return key.startsWith('nav.') ? t(key) : key;
    }

    // 6. Dynamic group route: /group/:groupId
    if (location.pathname.startsWith('/group/')) {
      const gId = location.pathname.slice(7); // "/group/" has length 7
      const foundGroup = menuGroups.find(g => g.id === gId);
      if (foundGroup) {
        return foundGroup.groupKey && t(foundGroup.groupKey) !== foundGroup.groupKey 
          ? t(foundGroup.groupKey) 
          : foundGroup.group;
      }
    }

    // 7. Edit routes
    if (location.pathname.includes('/edit/')) {
      return t('nav.editRecord') || 'Edit Record';
    }

    // 8. Try scanning for matching navigate route inside NAV_ITEMS or menuGroups
    for (const group of menuGroups) {
      if (group.id === 'group-' + location.pathname.split('/').filter(Boolean).pop()) {
        return group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey) : group.group;
      }
      for (const item of group.items) {
        if (item.to === location.pathname || item.to === '/' + location.pathname.split('/').filter(Boolean).join('/')) {
          return item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label;
        }
      }
    }

    // 9. General nested reports or secondary routes mapping
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      const subRouteMap: Record<string, string> = {
        'cash-bank': 'Cash/Bank Books',
        'stock-item': 'Stock Item Report',
        'location': 'Location Stock Report',
        'stock-group-summary': 'Stock Group Summary',
        'stock-category-summary': 'Stock Category Summary',
        'stock-transfer-register': 'Stock Transfer Register',
        'physical-stock-register': 'Physical Stock Register',
        'contra-register': 'Contra Register',
        'payment-register': 'Payment Register',
        'receipt-register': 'Receipt Register',
        'sales-register': 'Sales Register',
        'purchase-register': 'Purchase Register',
        'journal-register': 'Journal Register',
        'pay-slip': 'Pay Slip',
        'pay-sheet': 'Pay Sheet',
        'attendance-sheet': 'Attendance Sheet',
        'payment-advice': 'Payment Advice',
        'payroll-statement': 'Payroll Statement',
        'payroll-register': 'Payroll Register',
        'attendance-register': 'Attendance Register',
        'employee-profile': 'Employee Profile',
        'employee-head-count': 'Employee Head Count',
        'cash-flow': 'Cash Flow',
        'funds-flow': 'Funds Flow',
        'ageing-analysis': 'Ageing Analysis',
        'movement': 'Movement Analysis',
        'stock-query': 'Stock Query',
        'group-summary': 'Group Summary',
        'group-voucher': 'Group Voucher',
        'statistics': 'Statistics',
        'notifications': 'Notifications',
      };
      
      const lastSegment = segments[segments.length - 1];
      if (subRouteMap[lastSegment]) {
        return subRouteMap[lastSegment];
      }

      // Fallback: Capitalize and space separate
      const readable = lastSegment
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      return readable;
    }

    return 'Dashboard';
  };

  const currentPageTitle = getPageTitle();

  // If access is disabled and user is not a super admin, show subscription required page
  // We only block if isAccessEnabled is explicitly false
  if (company && company.isAccessEnabled === false && !isSuperAdmin) {
    return <SubscriptionRequired />;
  }

  // Quota Exceeded Block
  const isQuotaExceeded = company && company.quotaLimit && company.quotaUsed !== undefined && company.quotaUsed >= company.quotaLimit;
  if (isQuotaExceeded && !isSuperAdmin) {
    return <QuotaExceededPage company={company} />;
  }

  const isInventoryEnabled = features.find(f => f.id === 'inv')?.enabled ?? true;
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = React.useState(0);

  React.useEffect(() => {
    if (!user) {
      setUnreadNotificationCount(0);
      return;
    }
    const fetchUnreadCount = async () => {
      try {
        const list = await erpService.getNotifications(user.uid, user.companyId, isSuperAdmin);
        const unreadList = list.filter(n => !n.readBy?.includes(user.uid));
        setUnreadNotificationCount(unreadList.length);
      } catch (err) {
        console.error('Error fetching unread count in App layout:', err);
      }
    };
    fetchUnreadCount();
    // Refresh every 2 minutes
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, [user?.uid, user?.companyId, isSuperAdmin]);

  const refreshUnreadNotificationCount = React.useCallback(async () => {
    if (!user) return;
    try {
      const list = await erpService.getNotifications(user.uid, user.companyId, isSuperAdmin);
      const unreadList = list.filter(n => !n.readBy?.includes(user.uid));
      setUnreadNotificationCount(unreadList.length);
    } catch (err) {
      console.error('Error refreshing unread count:', err);
    }
  }, [user?.uid, user?.companyId, isSuperAdmin]);

  const [activeRibbonTab, setActiveRibbonTab] = React.useState('Dashboard');
  const [hoveredMacGroup, setHoveredMacGroup] = React.useState<string | null>(null);
  const [isWinStartOpen, setIsWinStartOpen] = React.useState(false);
  const [winSearchQuery, setWinSearchQuery] = React.useState('');
  const macMenuTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const scrollRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  
  // Close sidebar and scroll to top on navigation
  React.useEffect(() => {
    setIsSidebarOpen(false);
    setIsProfileDropdownOpen(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
  }, [location.pathname]);

  // Handle click outside for profile dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    
    const handleGlobalShortcut = (e: KeyboardEvent) => {
      // ALT SHORTCUTS FOR FAST ACTION NAVIGATION
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === 'd') {
          e.preventDefault();
          navigate('/dashboard');
        } else if (key === 'v') {
          e.preventDefault();
          navigate('/vouchers/new');
        } else if (key === 'l') {
          e.preventDefault();
          navigate('/accounts/ledgers/new');
        } else if (key === 'i') {
          e.preventDefault();
          navigate('/inventory/items');
        } else if (key === 's') {
          e.preventDefault();
          navigate('/settings');
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenSearch();
      } else if (e.key === '/') {
        // Only trigger if not already typing in an input/textarea
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault();
          onOpenSearch();
        }
      }
    };
    document.addEventListener('keydown', handleGlobalShortcut);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener('keydown', handleGlobalShortcut);
    };
  }, [navigate, onOpenSearch]);

  // Initialize expandedGroups based on sidebarDefaultExpanded
  React.useEffect(() => {
    if (sidebarDefaultExpanded) {
      setExpandedGroups(new Set(menuGroups.map(item => item.group)));
    } else {
      setExpandedGroups(new Set());
    }
  }, [sidebarDefaultExpanded, menuGroups]);

  // Auto-expand group based on current path
  React.useEffect(() => {
    let groupToExpand: string | null = null;
    if (location.pathname.startsWith('/accounts') || location.pathname.startsWith('/inventory')) {
      groupToExpand = 'Masters';
    } else if (location.pathname.startsWith('/vouchers')) {
      groupToExpand = 'Transactions';
    } else if (location.pathname.startsWith('/payroll')) {
      groupToExpand = 'Payroll';
    } else if (location.pathname.startsWith('/reports')) {
      groupToExpand = 'Reports';
    } else if (location.pathname === '/notes' || location.pathname === '/settings') {
      groupToExpand = 'Utilities';
    }

    if (groupToExpand) {
      setExpandedGroups(prev => {
        if (prev.has(groupToExpand!)) return prev;
        const next = new Set(prev);
        next.add(groupToExpand!);
        return next;
      });
    }
  }, [location.pathname]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const renderClassicSidebar = () => {
    const isColorful = menuBarStyle === 'colorful';
    const customBgOpt = sidebarBgColor && sidebarBgColor !== 'default'
      ? SIDEBAR_BG_OPTIONS.find(o => o.id === sidebarBgColor)
      : null;
    const customTextOpt = sidebarTextColor && sidebarTextColor !== 'default'
      ? SIDEBAR_TEXT_OPTIONS.find(o => o.id === sidebarTextColor)
      : null;

    return (
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col transition-transform duration-300",
        customBgOpt
          ? customBgOpt.className
          : isColorful 
            ? "bg-slate-900 border-r border-[#1e1b4b]/40 text-slate-100 shadow-[4px_0_24px_rgba(8,10,30,0.3)]" 
            : "bg-background border-r border-border text-foreground",
        customTextOpt && !customBgOpt ? "text-foreground" : "",
        menuBarStyle === 'classic' || menuBarStyle === 'colorful' ? "lg:relative lg:translate-x-0" : "lg:fixed lg:z-[60]",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full",
        "w-64"
      )}>
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          customBgOpt ? "border-border/10" : isColorful ? "border-[#1e1b4b]/40" : "border-border"
        )}>
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
              {companyLogo || systemLogo ? (
                <img src={companyLogo || systemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              ) : (
                <div className={cn("w-full h-full flex items-center justify-center", customBgOpt ? "bg-white/10" : isColorful ? "bg-indigo-600" : "bg-foreground")}>
                  <span className={cn("font-bold text-lg", customBgOpt ? "text-inherit" : isColorful ? "text-white" : "text-background")}>{companyName.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="transition-opacity duration-300 relative group/logo">
              <h1 className={cn(
                "text-xs font-black tracking-tight truncate max-w-[120px]", 
                customBgOpt ? (customBgOpt.isDark ? "text-slate-100" : "text-stone-900") : isColorful ? "text-slate-100" : "text-foreground"
              )}>{companyName}</h1>
              <div className="flex items-center gap-2">
                <p className={cn(
                  "text-[9px] uppercase tracking-widest truncate max-w-[120px]", 
                  customBgOpt ? (customBgOpt.isDark ? "text-slate-400" : "text-stone-500") : isColorful ? "text-slate-400" : "text-gray-500"
                )}>{slogan}</p>
                {activePlan && (
                  <span className={cn(
                    "text-[7px] font-bold uppercase tracking-tighter px-1 rounded",
                    customBgOpt ? "text-indigo-400 bg-white/10" : isColorful ? "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20" : "text-primary bg-primary/5"
                  )}>
                    {activePlan.name}
                  </span>
                )}
              </div>
              {isAdmin && (
                <Link 
                  to="/settings/company" 
                  className={cn(
                    "absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/logo:opacity-100 transition-opacity p-1 rounded",
                    customBgOpt ? "hover:bg-white/10" : isColorful ? "hover:bg-slate-800" : "hover:bg-foreground/5"
                  )}
                  title="Edit Company Logo & Info"
                >
                  <SettingsIcon className={cn("w-3 h-3", customBgOpt ? "text-inherit" : isColorful ? "text-slate-400" : "text-gray-400")} />
                </Link>
              )}
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className={cn("p-1 rounded lg:hidden", customBgOpt ? "hover:bg-white/10" : isColorful ? "hover:bg-slate-800" : "hover:bg-foreground/5")}
          >
            <X className={cn("w-5 h-5", customBgOpt ? "text-inherit" : isColorful ? "text-slate-400" : "text-gray-500")} />
          </button>
        </div>

        <nav className="flex-1 py-2 overflow-y-auto no-scrollbar overflow-x-hidden">
          {menuLoading ? (
            <div className="px-4 py-3 space-y-6 animate-pulse">
              {/* Dashboard item skeleton */}
              <div className="flex items-center gap-3 py-2 px-2">
                <div className="h-5 w-5 bg-muted/20 rounded-md"></div>
                <div className="h-4 bg-muted/15 rounded-md w-28"></div>
              </div>
              
              {/* Group 1 */}
              <div className="space-y-3">
                <div className="h-3 bg-muted/20 rounded-md w-16 px-2 mb-1"></div>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-3">
                    <div className="h-4 w-4 bg-muted/10 rounded"></div>
                    <div className="h-3.5 bg-muted/10 rounded-md w-24"></div>
                  </div>
                ))}
              </div>

              {/* Group 2 */}
              <div className="space-y-3">
                <div className="h-3 bg-muted/20 rounded-md w-20 px-2 mb-1"></div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-1.5 px-3">
                    <div className="h-4 w-4 bg-muted/10 rounded"></div>
                    <div className="h-3.5 bg-muted/10 rounded-md w-32"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="px-3 mb-2 space-y-1">
                  <SidebarItem 
                    to={DASHBOARD_ITEM.to} 
                    icon={DASHBOARD_ITEM.icon} 
                    label={isSidebarCollapsed ? "" : (DASHBOARD_ITEM.labelKey && t(DASHBOARD_ITEM.labelKey) !== DASHBOARD_ITEM.labelKey ? t(DASHBOARD_ITEM.labelKey) : DASHBOARD_ITEM.label)} 
                    active={location.pathname === DASHBOARD_ITEM.to} 
                  />
                  <SidebarItem 
                    to="/search" 
                    icon={LucideIcons.Search} 
                    label={isSidebarCollapsed ? "" : t('common.search') || "Search"} 
                    active={location.pathname === '/search'} 
                  />
              </div>

              {menuGroups.map((group) => {
                if (group.hidden) return null;
                
                // Check if at least one item in the group is visible to the user
                const visibleItems = group.items.filter((item: any) => {
                  if (item.hidden) return false;
                  if (item.adminOnly && !isAdmin) return false;
                  if (item.superAdminOnly && !isSuperAdmin) return false;
                  if (item.permission && !hasPermission(item.permission)) return false;
                  return true;
                });

                if (visibleItems.length === 0) return null;

                return (
                  <SidebarGroup 
                    key={group.id}
                    title={isSidebarCollapsed ? (group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey).charAt(0) : group.group.charAt(0)) : (group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey) : group.group)} 
                    isOpen={expandedGroups.has(group.group)} 
                    onToggle={() => toggleGroup(group.group)}
                    to={group.to}
                  >
                    {visibleItems.map((item: any) => {
                      const isSubscribed = !item.feature || isFeatureEnabled(item.feature);
                      
                      return (
                        <div key={item.id} className={cn(!isSubscribed && "opacity-50 grayscale-[0.5]")}>
                          <SidebarItem 
                            to={item.to} 
                            icon={item.icon} 
                            label={isSidebarCollapsed ? "" : (item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label)} 
                            active={location.pathname === item.to} 
                          />
                        </div>
                      );
                    })}
                  </SidebarGroup>
                );
              })}
            </>
          )}
        </nav>

        <div className={cn(
          "px-3 py-1.5 border-t flex flex-col gap-1", 
          isSidebarCollapsed && "p-2",
          customBgOpt ? "border-border/10 bg-black/10" : isColorful ? "border-slate-800 bg-slate-950/40" : "border-border"
        )}>
          {company && !isSidebarCollapsed && (() => {
            const used = company.quotaUsed || 0;
            const limitVal = company.quotaLimit || 10000;
            const pct = Math.round((used / limitVal) * 100);
            const displayRule = company.quotaDisplayRule || 'exceed_50';
            const shouldShow = displayRule === 'always' || pct >= 50;

            if (!shouldShow) return null;

            return (
              <div className="pt-0 pb-0.5 font-mono space-y-1 bg-transparent border-none">
                <div className="flex items-center justify-between text-[10px] tracking-wider text-white uppercase p-0 m-0 font-bold">
                  <span className="select-none text-white">
                    Usage (Today):
                  </span>
                  <span className={cn(
                    "font-extrabold",
                    pct >= 90 ? "text-rose-400 animate-pulse" : 
                    pct >= 75 ? "text-amber-400" : "text-emerald-400"
                  )}>
                    {pct}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      pct >= 90 ? "bg-rose-500" :
                      pct >= 75 ? "bg-amber-500" :
                      "bg-emerald-500"
                    )}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="text-[8px] text-white/90 text-right p-0 m-0 font-bold tracking-tight">
                  {used.toLocaleString()} / {limitVal.toLocaleString()}
                </div>
              </div>
            );
          })()}
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className={cn(
                "text-[8px] font-mono uppercase tracking-widest", 
                customBgOpt ? (customBgOpt.isDark ? "text-slate-400" : "text-stone-500") : isColorful ? "text-slate-400" : "text-gray-400"
              )}>{statusOnlineText}</span>
            </div>
            <span className={cn(
              "text-[8px] font-mono uppercase tracking-widest", 
              customBgOpt ? (customBgOpt.isDark ? "text-slate-400" : "text-stone-500") : isColorful ? "text-slate-400" : "text-gray-400"
            )}>{appVersion}</span>
          </div>
        </div>
      </aside>
    );
  };

  const renderRibbonMenu = () => {
    return (
      <div className="bg-card border-b border-border hidden lg:block">
        <div className="flex border-b border-border px-4 items-center justify-between">
          <div className="flex">
            <button
              onClick={() => setActiveRibbonTab('Dashboard')}
              className={cn(
                "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all border-b-2",
                activeRibbonTab === 'Dashboard' 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              {t('nav.dashboard')}
            </button>
            {menuGroups.map(group => (
              <button
                key={group.group}
                onClick={() => setActiveRibbonTab(group.group)}
                className={cn(
                  "px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all border-b-2",
                  activeRibbonTab === group.group 
                    ? "border-primary text-primary" 
                    : "border-transparent text-gray-500 hover:text-foreground"
                )}
              >
                {t(group.groupKey)}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3 pr-4">
            <PageHelp />
          </div>
        </div>
        <div className="p-2 flex items-center gap-6 overflow-x-auto no-scrollbar">
          {activeRibbonTab === 'Dashboard' ? (
            <Link
              to={DASHBOARD_ITEM.to}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[70px] p-1.5 rounded hover:bg-foreground/5 transition-all group",
                location.pathname === DASHBOARD_ITEM.to ? "bg-foreground/5" : ""
              )}
            >
              <DASHBOARD_ITEM.icon className={cn(
                "w-5 h-5 transition-transform group-hover:scale-110",
                location.pathname === DASHBOARD_ITEM.to ? "text-primary" : "text-gray-500"
              )} />
              <span className={cn(
                "text-[8px] font-bold uppercase tracking-tighter text-center",
                location.pathname === DASHBOARD_ITEM.to ? "text-primary" : "text-gray-500"
              )}>
                {t(DASHBOARD_ITEM.labelKey)}
              </span>
            </Link>
          ) : (
            menuGroups.find(g => g.group === activeRibbonTab)?.items.map((item: any) => {
              if (item.hidden) return null;
              if (item.adminOnly && !isAdmin) return null;
              if (item.superAdminOnly && !isSuperAdmin) return null;
              if (item.permission && !hasPermission(item.permission)) return null;

              const isSubscribed = !item.feature || isFeatureEnabled(item.feature);
              
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[70px] p-1.5 rounded hover:bg-foreground/5 transition-all group",
                    location.pathname === item.to ? "bg-foreground/5" : "",
                    !isSubscribed && "opacity-40 grayscale-[0.5]"
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    location.pathname === item.to ? "text-primary" : "text-gray-500"
                  )} />
                    <span className={cn(
                      "text-[8px] font-bold uppercase tracking-tighter text-center",
                      location.pathname === item.to ? "text-primary" : "text-gray-500"
                    )}>
                      {t(item.labelKey)}
                    </span>
                </Link>
              );
            })
          )}
        </div>
      </div>
    );
  };

  const renderMacOSMenu = () => (
    <div className="bg-background/80 backdrop-blur-md border-b border-border h-10 px-4 flex items-center justify-between hidden lg:flex fixed top-0 left-0 right-0 z-[60]">
      <div className="flex items-center gap-6">
        {location.pathname !== '/dashboard' && (
          <button 
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/dashboard');
              }
            }}
            className="p-1 hover:bg-foreground/5 rounded-full transition-colors group flex items-center gap-1"
            title={t('common.back')}
          >
            <LucideIcons.ArrowLeft className="w-4 h-4 text-gray-500 group-hover:text-foreground" />
          </button>
        )}
        <div className="flex items-center gap-2 mr-4">
          <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden">
            {companyLogo || systemLogo ? (
              <img src={companyLogo || systemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-[10px]">{companyName.charAt(0)}</span>
              </div>
            )}
          </div>
          <span className="text-xs font-bold">{companyName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Link
            to={DASHBOARD_ITEM.to}
            className={cn(
              "text-[11px] font-medium px-2 py-1 rounded transition-colors",
              location.pathname === DASHBOARD_ITEM.to ? "bg-foreground/5 text-primary" : "text-gray-500 hover:text-foreground"
            )}
          >
            {t('nav.dashboard')}
          </Link>
          {menuGroups.map(group => (
            <div 
              key={group.group} 
              className="relative"
              onMouseEnter={() => {
                if (macMenuTimeoutRef.current) clearTimeout(macMenuTimeoutRef.current);
                setHoveredMacGroup(group.group);
              }}
              onMouseLeave={() => {
                macMenuTimeoutRef.current = setTimeout(() => {
                  setHoveredMacGroup(null);
                }, 300);
              }}
            >
              <button className={cn(
                "text-[11px] font-medium px-2 py-1 rounded transition-colors",
                hoveredMacGroup === group.group ? "bg-foreground/5 text-foreground" : "text-gray-500 hover:text-foreground"
              )}>
                {t(group.groupKey)}
              </button>
              {hoveredMacGroup === group.group && (
                <div 
                  className="absolute top-full left-0 mt-0 w-48 bg-card border border-border shadow-2xl py-1 z-50 rounded-b-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                  onMouseEnter={() => {
                    if (macMenuTimeoutRef.current) clearTimeout(macMenuTimeoutRef.current);
                  }}
                  onMouseLeave={() => {
                    macMenuTimeoutRef.current = setTimeout(() => {
                      setHoveredMacGroup(null);
                    }, 300);
                  }}
                >
                  {group.items.map((item: any) => {
                    if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return null;
                    if (item.adminOnly && !isAdmin) return null;
                    if (item.superAdminOnly && !isSuperAdmin) return null;
                    
                    return (
                      <Link
                        key={item.id}
                        to={item.to}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2 text-[11px] transition-colors",
                          location.pathname === item.to 
                            ? "bg-primary text-white" 
                            : "text-gray-500 hover:text-foreground hover:bg-foreground/5"
                        )}
                      >
                        <item.icon className="w-3.5 h-3.5" />
                        {t(item.labelKey)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Center Title for macOS */}
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
        <span className="text-[11px] font-bold text-primary uppercase tracking-widest">
          {currentPageTitle}
        </span>
      </div>

      {/* Right side controls for macOS */}
      <div className="flex items-center gap-4">
        {showTopbarSearch && (
          <button 
            onClick={onOpenSearch}
            className="p-2 hover:bg-foreground/5 rounded-full transition-colors group flex items-center gap-2"
            title="Search (Cmd+K or /)"
            style={searchIconColor ? { color: searchIconColor } : {}}
          >
            <Search className="w-5 h-5 text-gray-500 group-hover:text-foreground" />
            <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              /
            </kbd>
          </button>
        )}
        {showTopbarInstructions && <PageHelp />}
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center hover:bg-foreground/5 p-1 rounded-full transition-colors relative"
          >
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-card">
                <img 
                  src={user?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              {showTopbarNotifications && unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black font-mono w-4 h-4 flex items-center justify-center border border-background shadow-sm animate-pulse z-20">
                  {unreadNotificationCount}
                </span>
              )}
            </div>
          </button>

          <FacebookProfileMenu 
            isOpen={isProfileDropdownOpen} 
            onClose={() => setIsProfileDropdownOpen(false)} 
            uiStyle={uiStyle} 
            onNotificationsUpdated={refreshUnreadNotificationCount}
          />
        </div>
      </div>
    </div>
  );

  const renderWindows11Menu = () => {
    const allItems = [DASHBOARD_ITEM, ...menuGroups.flatMap(g => g.items)].filter((item: any) => {
      if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return false;
      if (item.adminOnly && !isAdmin) return false;
      if (item.superAdminOnly && !isSuperAdmin) return false;
      if (winSearchQuery && !item.label.toLowerCase().includes(winSearchQuery.toLowerCase())) return false;
      return true;
    });

    return (
      <>
        {isWinStartOpen && (
          <div 
            className="fixed inset-0 z-[60]"
            onClick={() => setIsWinStartOpen(false)}
          >
            <div 
              className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[600px] max-w-[95vw] bg-background/90 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl p-8 animate-in slide-in-from-bottom-10 duration-300"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input 
                    type="text"
                    placeholder={t('common.searchAppsPlaceholder')}
                    value={winSearchQuery}
                    onChange={(e) => setWinSearchQuery(e.target.value)}
                    className="w-full bg-foreground/5 border border-border/50 rounded-xl py-3 pl-12 pr-4 text-xs font-mono outline-none focus:border-primary transition-colors"
                    autoFocus
                  />
                </div>
              </div>

              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {winSearchQuery ? t('common.searchResults') : t('common.pinnedApps')}
                  </h3>
                  {!winSearchQuery && (
                    <button className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline">
                      {t('common.allApps')}
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-6 gap-2 max-h-[320px] overflow-y-auto no-scrollbar">
                  {allItems.map(item => (
                    <Link
                      key={item.id}
                      to={item.to}
                      onClick={() => {
                        setIsWinStartOpen(false);
                        setWinSearchQuery('');
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-foreground/5 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                        <item.icon className="w-5 h-5 text-foreground/70" />
                      </div>
                      <span className="text-[9px] text-center font-medium truncate w-full">{item.label}</span>
                    </Link>
                  ))}
                  {allItems.length === 0 && (
                    <div className="col-span-6 py-10 text-center text-gray-500 text-[10px] uppercase tracking-widest">
                      {t('common.noResultsFound')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="pt-6 border-t border-border flex flex-col gap-4">
                <div className="px-2">
                  <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('common.selectTheme')}</p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {(['light', 'dark', 'emerald', 'amber', 'rose', 'slate', 'classic'] as Theme[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setTheme(t)}
                        className={cn(
                          "min-w-[32px] h-8 rounded-md border-2 transition-all flex items-center justify-center",
                          theme === t ? "border-primary scale-110 shadow-lg" : "border-transparent hover:border-border"
                        )}
                        title={t.charAt(0).toUpperCase() + t.slice(1)}
                      >
                        <div className={cn(
                          "w-full h-full rounded-sm",
                          t === 'light' ? "bg-white border border-gray-200" : 
                          t === 'dark' ? "bg-zinc-900" : 
                          t === 'emerald' ? "bg-emerald-500" : 
                          t === 'amber' ? "bg-amber-500" : 
                          t === 'rose' ? "bg-rose-500" : 
                          t === 'slate' ? "bg-slate-500" : 
                          "bg-zinc-800"
                        )} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-card">
                      <img 
                        src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">{user?.displayName || t('common.user')}</span>
                  </div>
                  <button 
                    onClick={logout}
                    className="p-2 hover:bg-rose-500/10 rounded-lg text-rose-500 transition-colors"
                    title={t('common.logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-xl border border-border/50 h-14 px-2 rounded-2xl flex items-center gap-1 shadow-2xl z-50 hidden lg:flex">
          {showTopbarSearch && (
            <button 
              onClick={onOpenSearch}
              className="p-2.5 rounded-xl transition-all hover:bg-foreground/10 group text-gray-500 hover:text-foreground"
              title="Search (Cmd+K or /)"
              style={searchIconColor ? { color: searchIconColor } : {}}
            >
              <Search className="w-6 h-6" />
            </button>
          )}
          {showTopbarSearch && showTopbarInstructions && <div className="w-[1px] h-6 bg-border mx-2" />}
          {showTopbarInstructions && <PageHelp />}
          {showTopbarInstructions && <div className="w-[1px] h-6 bg-border mx-2" />}
          <button 
            onClick={() => setIsWinStartOpen(!isWinStartOpen)}
            className={cn(
              "p-2.5 rounded-xl transition-all hover:bg-foreground/10 group relative",
              isWinStartOpen ? "bg-foreground/5" : ""
            )}
          >
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
              <div className="bg-blue-500 rounded-sm" />
              <div className="bg-emerald-500 rounded-sm" />
              <div className="bg-amber-500 rounded-sm" />
              <div className="bg-rose-500 rounded-sm" />
            </div>
          </button>

          <div className="w-[1px] h-6 bg-border mx-2" />

          <Link 
            to="/dashboard" 
            className={cn(
              "p-2.5 rounded-xl transition-all hover:bg-foreground/10 group relative",
              location.pathname === '/dashboard' ? "bg-foreground/5" : ""
            )}
          >
            <LayoutDashboard className={cn("w-6 h-6", location.pathname === '/dashboard' ? "text-primary" : "text-gray-500")} />
            {location.pathname === '/dashboard' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
          </Link>
          
          {menuGroups.flatMap(g => g.items).filter(item => {
            return mobileBottomNavItems.includes(item.label);
          }).map(item => (
            <Link 
              key={item.id}
              to={item.to} 
              className={cn(
                "p-2.5 rounded-xl transition-all hover:bg-foreground/10 group relative",
                location.pathname === item.to ? "bg-foreground/5" : ""
              )}
              title={item.label}
            >
              <item.icon className={cn("w-6 h-6", location.pathname === item.to ? "text-primary" : "text-gray-500")} />
              {location.pathname === item.to && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
            </Link>
          ))}
        </div>
      </>
    );
  };

  return (
    <div 
      className="flex h-screen h-[100dvh] bg-background text-foreground overflow-hidden relative"
      data-ui-style={uiStyle}
      data-glass-bg={glassBackground}
      data-reports-style={reportsPageUiStyle}
    >
      {/* Placeholder Warning Banner */}
      {user?.companyId === 'placeholder' && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest py-1 px-4 flex justify-between items-center shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-3 h-3" />
            <span>{t('common.placeholderWarning')}</span>
          </div>
          <Link to="/companies" className="underline hover:text-white/80">{t('common.switchCompany')}</Link>
        </div>
      )}
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Conditional Sidebar rendering */}
      {(menuBarStyle === 'classic' || menuBarStyle === 'colorful' || isSidebarOpen) && renderClassicSidebar()}

      {/* Main Content */}
      <main className="flex-1 flex flex-col w-full overflow-hidden h-full">
        {menuBarStyle !== 'macos' && (
          <header className={cn(
            "h-14 flex-none border-b border-border bg-background flex items-center px-4 lg:px-6 z-[500] transition-colors relative",
            uiStyle === 'UI/UX 2' && "bg-blue-600 border-blue-700 text-white"
          )}>
            <div className="flex-1 flex items-center justify-start gap-3 lg:gap-4 z-10 min-w-0">
              {/* Desktop/Classic Menu Bar Style */}
              {menuBarStyle !== 'classic' && menuBarStyle !== 'colorful' && (
                <div className="flex items-center gap-3 hidden lg:flex">
                  <div className={cn(
                    "w-8 h-8 rounded-sm flex items-center justify-center overflow-hidden",
                    uiStyle === 'UI/UX 2' ? "bg-white" : "bg-foreground"
                  )}>
                    {companyLogo || systemLogo ? (
                      <img src={companyLogo || systemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className={cn(
                        "font-bold text-lg",
                        uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-background"
                      )}>{companyName.charAt(0)}</span>
                    )}
                  </div>
                  <h1 className={cn(
                    "text-sm font-bold tracking-tighter truncate",
                    uiStyle === 'UI/UX 2' ? "text-white" : "text-foreground"
                  )}>
                    {companyName}
                  </h1>
                  {activePlan && (
                    <div className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest flex items-center gap-1",
                      uiStyle === 'UI/UX 2' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                    )}>
                      <Award className="w-2.5 h-2.5" />
                      {activePlan.name}
                    </div>
                  )}
                </div>
              )}

              {/* Navigation / Menu Toggle */}
              {location.pathname !== '/dashboard' ? (
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => {
                      if (window.history.length > 2) {
                        navigate(-1);
                      } else {
                        navigate('/dashboard');
                      }
                    }}
                    className="p-2 hover:bg-foreground/5 rounded-full transition-colors group flex items-center gap-1"
                    title={t('common.back')}
                  >
                    <LucideIcons.ArrowLeft className={cn("w-5 h-5", uiStyle === 'UI/UX 2' ? "text-white" : "text-foreground")} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 lg:hidden">
                  <div className="flex items-center gap-2">
                    <Link 
                      to={isAdmin ? "/settings/company" : "#"}
                      className={cn(
                        "w-6 h-6 rounded-sm flex items-center justify-center overflow-hidden transition-transform",
                        isAdmin && "active:scale-90"
                      )}
                    >
                      {companyLogo || systemLogo ? (
                        <img src={companyLogo || systemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                      ) : (
                        <div className={cn(
                          "w-full h-full flex items-center justify-center",
                          uiStyle === 'UI/UX 2' ? "bg-white" : "bg-foreground"
                        )}>
                          <span className={cn(
                            "font-bold text-xs",
                            uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-background"
                          )}>{companyName.charAt(0)}</span>
                        </div>
                      )}
                    </Link>
                    {activePlan && (
                      <div className={cn(
                        "px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-tighter flex items-center gap-0.5",
                        uiStyle === 'UI/UX 2' ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                      )}>
                        <Award className="w-2 h-2" />
                        {activePlan.name}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Center Title - Perfectly centered excluding sidebar by taking the absolute center of the header bar */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-0">
              <h2 className={cn(
                "text-xs sm:text-sm font-bold uppercase tracking-widest text-center truncate max-w-[150px] sm:max-w-md",
                uiStyle === 'UI/UX 2' ? "text-white" : "text-primary"
              )}>
                {currentPageTitle}
              </h2>
            </div>

            <div className="flex-1 flex items-center justify-end gap-3 lg:gap-6 z-[510] min-w-0">
              {showTopbarSearch && (
                <button 
                  onClick={onOpenSearch}
                  className={cn(
                    "hidden md:flex p-2 rounded-full transition-colors group items-center gap-2",
                    uiStyle === 'UI/UX 2' ? "hover:bg-white/10" : "hover:bg-foreground/5"
                  )}
                  title="Search (Cmd+K or /)"
                  style={searchIconColor ? { color: searchIconColor } : {}}
                >
                  <Search className={cn("w-5 h-5", uiStyle === 'UI/UX 2' ? "text-white" : "text-gray-500 group-hover:text-foreground")} />
                  <kbd className={cn(
                    "hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium transition-colors",
                    uiStyle === 'UI/UX 2' ? "bg-white/20 border-white/20 text-white" : "border-border bg-muted text-muted-foreground"
                  )}>
                    /
                  </kbd>
                </button>
              )}
              
              {showTopbarInstructions && (
                <div className="hidden md:block">
                  <PageHelp />
                </div>
              )}
              
              {showGoToShortcut && (
                <div className={cn(
                  "hidden md:flex items-center gap-2 text-[10px] font-mono",
                  uiStyle === 'UI/UX 2' ? "text-blue-100" : "text-gray-500"
                )}>
                  <kbd className={cn(
                    "px-1.5 py-0.5 border rounded",
                    uiStyle === 'UI/UX 2' ? "bg-white/10 border-white/20 text-white" : "bg-card border-border text-gray-400"
                  )}>Alt</kbd>
                  <span>+</span>
                  <kbd className={cn(
                    "px-1.5 py-0.5 border rounded",
                    uiStyle === 'UI/UX 2' ? "bg-white/10 border-white/20 text-white" : "bg-card border-border text-gray-400"
                  )}>G</kbd>
                  <span className="ml-1 uppercase tracking-widest">{t('common.goTo')}</span>
                </div>
              )}
              <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="relative group"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border overflow-hidden bg-card transition-all relative",
                    uiStyle === 'UI/UX 2' ? "border-white/40 hover:border-white" : "border-border hover:border-foreground relative"
                  )}>
                    <img 
                      src={user?.photoURL || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {showTopbarNotifications && unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full text-[9px] font-black font-mono w-4 h-4 flex items-center justify-center border border-background shadow-sm animate-pulse z-20">
                      {unreadNotificationCount}
                    </span>
                  )}
                  {isSuperAdmin && <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" title="Founder/Marketing Manager" />}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                </button>

                <FacebookProfileMenu 
                  isOpen={isProfileDropdownOpen} 
                  onClose={() => setIsProfileDropdownOpen(false)} 
                  uiStyle={uiStyle} 
                  onNotificationsUpdated={refreshUnreadNotificationCount}
                />
              </div>
            </div>
          </header>
        )}

        {/* Conditional Top Menu rendering */}
        {menuBarStyle === 'ribbon' && renderRibbonMenu()}
        {menuBarStyle === 'macos' && renderMacOSMenu()}

        <div ref={scrollRef} 
        data-scrolling-tables={showScrollingBar}
        className={cn(
          "flex-1 pb-16 lg:pb-0 flex flex-col min-h-0 overflow-y-auto scroll-smooth",
          !showScrollingBar && "no-scrollbar",
          menuBarStyle === 'macos' && "pt-10"
        )}>
          <div className={cn(
            "w-full mx-auto flex-1 flex flex-col min-h-0",
            (layoutWidth === 'constrained' && !location.pathname.startsWith('/vouchers/')) ? "max-w-7xl" : "max-w-full",
            (location.pathname === '/dashboard' || location.pathname.startsWith('/reports/') || location.pathname === '/daybook' || location.pathname.startsWith('/inventory/') || location.pathname.startsWith('/vouchers/')) && "min-h-full"
          )}>
            {children}
            {location.pathname === '/dashboard' && (user?.showSystemGuide ?? true) && (
              <SystemGuideFloatingButton />
            )}
          </div>
        </div>

        {/* Windows 11 Style Taskbar */}
        {menuBarStyle === 'windows11' && renderWindows11Menu()}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-2 z-40">
          <Link 
            to="/dashboard" 
            className={cn(
              "flex flex-col items-center gap-1 px-2.5 py-1 transition-colors flex-1 min-w-0",
              location.pathname === '/dashboard' ? "text-primary font-extrabold" : "text-gray-500"
            )}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">Dashboard</span>
          </Link>

          {(() => {
            const seenLabels = new Set<string>();
            const mobileNavLinks = menuGroups
              .flatMap(g => g.items)
              .filter(item => {
                if (!item) return false;
                if (!mobileBottomNavItems.includes(item.label) || item.label === 'Dashboard') return false;
                if (seenLabels.has(item.label)) return false;
                seenLabels.add(item.label);
                return true;
              })
              .slice(0, 4);

            if (mobileNavLinks.length > 0) {
              return mobileNavLinks.map(item => {
                const IconComponent = item.icon || LucideIcons.Package;
                const isActive = location.pathname === item.to;
                return (
                  <Link 
                    key={item.id || item.to}
                    to={item.to} 
                    className={cn(
                      "flex flex-col items-center gap-1 px-2.5 py-1 transition-colors flex-1 min-w-0",
                      isActive ? "text-primary font-extrabold" : "text-gray-500"
                    )}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">
                      {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                    </span>
                  </Link>
                );
              });
            } else {
              return (
                <>
                  <Link 
                    to="/search" 
                    className={cn(
                      "flex flex-col items-center gap-1 px-2.5 py-1 transition-colors flex-1 min-w-0",
                      location.pathname === '/search' ? "text-primary font-extrabold" : "text-gray-500"
                    )}
                  >
                    <Search className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">Search</span>
                  </Link>

                  <Link 
                    to="/instructions" 
                    className={cn(
                      "flex flex-col items-center gap-1 px-2.5 py-1 transition-colors flex-1 min-w-0",
                      location.pathname === '/instructions' ? "text-primary font-extrabold" : "text-gray-500"
                    )}
                  >
                    <BookOpen className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">Guide</span>
                  </Link>

                  <Link 
                    to="/notifications" 
                    className={cn(
                      "flex flex-col items-center gap-1 px-2.5 py-1 transition-colors flex-1 min-w-0",
                      location.pathname === '/notifications' ? "text-primary font-extrabold" : "text-gray-500"
                    )}
                  >
                    <LucideIcons.Bell className="w-5 h-5 flex-shrink-0" />
                    <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">Alerts</span>
                  </Link>
                </>
              );
            }
          })()}

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "flex flex-col items-center gap-1 px-2.5 py-1 transition-colors flex-1 min-w-0",
              isSidebarOpen ? "text-primary font-extrabold" : "text-gray-500"
            )}
          >
            <Menu className="w-5 h-5 flex-shrink-0" />
            <span className="text-[9px] font-black uppercase tracking-tighter truncate w-full text-center">{t('nav.menu')}</span>
          </button>
        </nav>
      </main>
      
      <GoToSearch />
    </div>
  );
}

function AppContent() {
  const { user, loading, isSuperAdmin, isFounder, logout, firebaseUser } = useAuth();
  const { language } = useLanguage();
  const { 
    englishFont = 'Inter', 
    banglaFont = 'Hind Siliguri',
    loaderBlurStyle = 'md',
    loaderIconStyle = 'spinner',
    loaderPhrases,
    loaderTheme = 'glass',
    adaptiveLoaderEnabled = true,
    maintenanceEnabled = false,
    loading: settingsLoading
  } = useSettings();

  // Apply fonts globally
  React.useEffect(() => {
    const font = language === 'en' ? englishFont : banglaFont;
    document.documentElement.style.setProperty('--app-font', `"${font}", sans-serif`);
  }, [language, englishFont, banglaFont]);
  
  if (loading || settingsLoading) {
    const defaultPhrases = [
      'Connecting to server...',
      'Requesting to server...',
      'Waiting for response...',
      'Almost Done...',
      'Here We go!'
    ];
    const phrases = loaderPhrases ? loaderPhrases.split(',').map(p => p.trim()).filter(Boolean) : defaultPhrases;
    
    // Choose icon based on user settings
    const renderLoaderIcon = () => {
      switch (loaderIconStyle) {
        case 'dots':
          return (
            <div className="flex items-center gap-1.5 h-10">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-bounce" />
            </div>
          );
        case 'circle-bar':
          return (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <LucideIcons.RefreshCw className="w-8 h-8 animate-spin text-primary/80 stroke-[2]" />
              <LucideIcons.CircleDot className="absolute w-4 h-4 text-primary animate-pulse" />
            </div>
          );
        case 'quantum':
          return (
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-t-primary rounded-full animate-spin" />
              <div className="absolute inset-2 border-2 border-dashed border-primary/40 rounded-full animate-spin [animation-duration:3s]" />
              <LucideIcons.Cpu className="w-4 h-4 text-primary animate-pulse" />
            </div>
          );
        case 'spinner':
        default:
          return <LucideIcons.Loader2 className="w-10 h-10 animate-spin text-primary stroke-[1.5]" />;
      }
    };

    return (
      <div className="h-screen flex items-center justify-center bg-background relative overflow-hidden">
        {/* Animated ambient backdrop halo */}
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-muted/20 opacity-40 animate-pulse [animation-duration:4s]" />
        
        <div className="flex flex-col items-center gap-3 relative z-10 animate-pulse [animation-duration:2.5s]">
          {renderLoaderIcon()}
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground uppercase mt-2">Loading Core Engine...</span>
        </div>

        {/* Floating status block on the bottom right corner */}
        {adaptiveLoaderEnabled && (
          <div 
            className="absolute bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl border border-border/50 font-mono text-[11px] uppercase tracking-widest shadow-lg bg-background/40 backdrop-blur-md text-foreground"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-muted-foreground font-black tracking-tighter">BOOTING PIPELINE</span>
              <span className="text-foreground font-bold">{phrases[0]}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (maintenanceEnabled && !isFounder && user) {
    return <MaintenancePage />;
  }

  return (
    <Router>
      <Routes>
        {/* Public Landing Pages */}
        <Route path="/" element={<Home />} />
        <Route path="/features" element={<Features />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        
        {/* Auth Pages */}
        <Route path="/login" element={
          user ? <Navigate to="/dashboard" /> : <LoginWrapper />
        } />
        <Route path="/register" element={
          user ? <Navigate to="/dashboard" /> : <RegisterWrapper />
        } />

        {/* Protected App Routes */}
        <Route path="/*" element={<ProtectedRoute />} />
      </Routes>
    </Router>
  );
}

function LoginWrapper() {
  const navigate = useNavigate();
  return <Login onToggle={() => navigate('/register')} />;
}

function RegisterWrapper() {
  const navigate = useNavigate();
  return <Register onToggle={() => navigate('/login')} />;
}

function ProtectedRoute() {
  const { user, isFounder, isSuperAdmin, logout, firebaseUser, loading, company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);

  if (loading) return null;

  const searchIconColor = company?.search_config?.iconColor;

  if (firebaseUser && !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('common.profileNotFound')}</h2>
          <p className="text-gray-600 mb-8">
            {t('common.profileNotFoundDesc')}
          </p>
          <div className="space-y-4">
            <button 
              onClick={() => logout()}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              {t('common.signOutTryAgain')}
            </button>
            <p className="text-sm text-gray-500">
              {t('common.loggedInAs')} <span className="font-medium text-gray-700">{firebaseUser.email}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!user.companyId && !isSuperAdmin) {
    return (
      <div className="h-screen bg-background flex flex-col">
        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
              <span className="text-background font-bold">E</span>
            </div>
            <span className="text-sm font-bold uppercase tracking-tighter">{t('common.erpSystem')}</span>
          </div>
          <div className="flex items-center gap-4">
            <PageHelp />
            <button onClick={() => logout()} className="text-[10px] uppercase font-bold tracking-widest text-rose-500 hover:text-rose-600">
              {t('common.logout')}
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <CompanyManagement />
        </div>
      </div>
    );
  }

  return (
    <Layout onOpenSearch={() => setIsSearchOpen(true)}>
      <ErrorBoundary>
        <Routes>
          <Route path="/dashboard" element={<FeatureGuard permission="ana_dashboard"><Dashboard /></FeatureGuard>} />
          <Route path="/tax-management" element={<FeatureGuard feature="enableTax"><TaxManagement /></FeatureGuard>} />
          <Route path="/crm" element={<FeatureGuard feature="enableCRM"><CRM /></FeatureGuard>} />
          <Route path="/supply-chain" element={<FeatureGuard feature="enableSupplyChain"><PurchaseManagement /></FeatureGuard>} />
          <Route path="/inventory-advanced" element={<FeatureGuard feature="enableInventory"><InventoryAdvanced /></FeatureGuard>} />
          <Route path="/data-center" element={<FeatureGuard feature="enableDataExport"><DataCenter /></FeatureGuard>} />
          <Route path="/ai-insights" element={<FeatureGuard feature="enableAI"><AIInsights /></FeatureGuard>} />
          <Route path="/vouchers/new" element={<FeatureGuard permission="acc_vouchers_create"><VoucherEntry /></FeatureGuard>} />
          <Route path="/vouchers/edit/:id" element={<FeatureGuard permission="acc_vouchers_alter"><VoucherEntry /></FeatureGuard>} />
          <Route path="/vouchers/view/:id" element={<FeatureGuard permission="acc_reports_view"><VoucherDetail /></FeatureGuard>} />
          <Route path="/accounts/ledgers/new" element={<FeatureGuard permission="acc_masters_create"><LedgerCreation /></FeatureGuard>} />
          <Route path="/accounts/ledgers/edit/:id" element={<FeatureGuard permission="acc_masters_alter"><LedgerCreation /></FeatureGuard>} />
          <Route path="/inventory/items" element={<FeatureGuard feature="inv" permission="inv_masters_view"><ItemMaster /></FeatureGuard>} />
          <Route path="/inventory/items/new" element={<FeatureGuard feature="inv" permission="inv_masters_create"><ItemCreation /></FeatureGuard>} />
          <Route path="/inventory/items/edit/:id" element={<FeatureGuard feature="inv" permission="inv_masters_alter"><ItemCreation /></FeatureGuard>} />
          <Route path="/inventory/godowns" element={<FeatureGuard feature="inv" permission="inv_masters_view"><GodownMaster /></FeatureGuard>} />
          <Route path="/inventory/units" element={<FeatureGuard feature="inv" permission="inv_masters_view"><UnitMaster /></FeatureGuard>} />
          <Route path="/employees" element={<FeatureGuard permission="pay_masters"><EmployeeMaster /></FeatureGuard>} />
          <Route path="/payroll" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollManagement /></FeatureGuard>} />
          <Route path="/reports/daybook" element={<FeatureGuard permission="acc_reports_view"><Daybook /></FeatureGuard>} />
          <Route path="/reports/stock" element={<FeatureGuard feature="inv" permission="inv_reports_view"><StockSummary /></FeatureGuard>} />
          <Route path="/reports/balance-sheet" element={<FeatureGuard permission="acc_reports_financial"><BalanceSheet /></FeatureGuard>} />
          <Route path="/reports/pl" element={<FeatureGuard permission="acc_reports_financial"><ProfitAndLoss /></FeatureGuard>} />
          <Route path="/reports/ratios" element={<FeatureGuard feature="adv_reports" permission="ana_ratio"><RatioAnalysis /></FeatureGuard>} />
          <Route path="/reports/financial-insights" element={<FeatureGuard feature="insights" permission="ana_insights"><FinancialInsights /></FeatureGuard>} />
          <Route path="/production/orders" element={<FeatureGuard feature="ord" permission="ord_view"><OrderManagement /></FeatureGuard>} />
          <Route path="/production/machines" element={<FeatureGuard feature="mac" permission="mac_manage"><MachineManagement /></FeatureGuard>} />
          <Route path="/production/orders/new" element={<FeatureGuard feature="ord" permission="ord_create"><OrderEntry /></FeatureGuard>} />
          <Route path="/production/orders/edit/:id" element={<FeatureGuard feature="ord" permission="ord_alter"><OrderEntry /></FeatureGuard>} />
          <Route path="/production/reports" element={<FeatureGuard feature="ord" permission="ord_reports"><OrderReports /></FeatureGuard>} />
          <Route path="/reports/ledger" element={<FeatureGuard permission="acc_reports_view"><LedgerStatement /></FeatureGuard>} />
          <Route path="/reports/cash-bank" element={<FeatureGuard permission="acc_reports_view"><CashBankBooks /></FeatureGuard>} />
          <Route path="/reports/trial-balance" element={<FeatureGuard permission="acc_reports_view"><TrialBalance /></FeatureGuard>} />
          <Route path="/reports/stock-item" element={<FeatureGuard feature="inv" permission="inv_reports_view"><StockItemReport /></FeatureGuard>} />
          <Route path="/reports/location" element={<FeatureGuard feature="inv" permission="inv_reports_view"><LocationStockReport /></FeatureGuard>} />
          <Route path="/reports/stock-group-summary" element={<FeatureGuard feature="inv" permission="inv_reports_view"><StockGroupSummary /></FeatureGuard>} />
          <Route path="/reports/stock-category-summary" element={<FeatureGuard feature="inv" permission="inv_reports_view"><StockCategorySummary /></FeatureGuard>} />
          <Route path="/reports/stock-transfer-register" element={<FeatureGuard feature="inv" permission="inv_reports_view"><RegisterReport type="Stock Transfer" title="Stock Transfer Register" /></FeatureGuard>} />
          <Route path="/reports/physical-stock-register" element={<FeatureGuard feature="inv" permission="inv_reports_view"><RegisterReport type="Physical Stock" title="Physical Stock Register" /></FeatureGuard>} />
          <Route path="/reports/contra-register" element={<FeatureGuard permission="acc_reports_view"><RegisterReport type="Contra" title="Contra Register" /></FeatureGuard>} />
          <Route path="/reports/payment-register" element={<FeatureGuard permission="acc_reports_view"><RegisterReport type="Payment" title="Payment Register" /></FeatureGuard>} />
          <Route path="/reports/receipt-register" element={<FeatureGuard permission="acc_reports_view"><RegisterReport type="Receipt" title="Receipt Register" /></FeatureGuard>} />
          <Route path="/reports/sales-register" element={<FeatureGuard permission="acc_reports_view"><RegisterReport type="Sales" title="Sales Register" /></FeatureGuard>} />
          <Route path="/reports/purchase-register" element={<FeatureGuard permission="acc_reports_view"><RegisterReport type="Purchase" title="Purchase Register" /></FeatureGuard>} />
          <Route path="/reports/journal-register" element={<FeatureGuard permission="acc_reports_view"><RegisterReport type="Journal" title="Journal Register" /></FeatureGuard>} />
          <Route path="/reports/negative-ledger" element={<FeatureGuard permission="acc_reports_view"><NegativeReports type="ledger" /></FeatureGuard>} />
          <Route path="/reports/negative-stock" element={<FeatureGuard feature="inv" permission="inv_reports_view"><NegativeReports type="stock" /></FeatureGuard>} />
          <Route path="/reports/pay-slip" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="payslip" /></FeatureGuard>} />
          <Route path="/reports/pay-sheet" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="paysheet" /></FeatureGuard>} />
          <Route path="/reports/attendance-sheet" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="attendance_sheet" /></FeatureGuard>} />
          <Route path="/reports/payment-advice" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="payment_advice" /></FeatureGuard>} />
          <Route path="/reports/payroll-statement" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="payroll_statement" /></FeatureGuard>} />
          <Route path="/reports/payroll-register" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="payroll_register" /></FeatureGuard>} />
          <Route path="/reports/attendance-register" element={<FeatureGuard feature="pay" permission="pay_transactions"><PayrollReports type="attendance_register" /></FeatureGuard>} />
          <Route path="/reports/employee-profile" element={<FeatureGuard feature="pay" permission="pay_masters"><PayrollReports type="employee_profile" /></FeatureGuard>} />
          <Route path="/reports/employee-head-count" element={<FeatureGuard feature="pay" permission="pay_masters"><PayrollReports type="headcount" /></FeatureGuard>} />
          <Route path="/reports/cash-flow" element={<FeatureGuard feature="adv_reports" permission="ana_cashflow"><CashFlow /></FeatureGuard>} />
          <Route path="/reports/funds-flow" element={<FeatureGuard feature="adv_reports" permission="ana_cashflow"><FundsFlow /></FeatureGuard>} />
          <Route path="/reports/ageing-analysis" element={<FeatureGuard feature="inv" permission="ana_ageing"><AgeingAnalysis /></FeatureGuard>} />
          <Route path="/reports/movement" element={<FeatureGuard feature="inv" permission="inv_reports_view"><MovementAnalysis /></FeatureGuard>} />
          <Route path="/reports/stock-query" element={<FeatureGuard feature="inv" permission="inv_reports_view"><StockQuery /></FeatureGuard>} />
          <Route path="/reports/group-summary" element={<FeatureGuard permission="acc_reports_view"><GroupSummary /></FeatureGuard>} />
          <Route path="/reports/group-voucher" element={<FeatureGuard permission="acc_reports_view"><GroupVoucher /></FeatureGuard>} />
          <Route path="/reports/sales-performance" element={<FeatureGuard permission="pay_masters"><SalespersonReport /></FeatureGuard>} />
          <Route path="/reports/statistics" element={<FeatureGuard permission="ana_dashboard"><Statistics /></FeatureGuard>} />
          <Route path="/reports" element={<ReportsMenu />} />
          <Route path="/reports/inventory-books" element={<FeatureGuard feature="inv"><InventoryBooks /></FeatureGuard>} />
          <Route path="/reports/account-books" element={<FeatureGuard permission="acc_reports_view"><AccountBooks /></FeatureGuard>} />
          <Route path="/alter" element={<FeatureGuard permission="acc_masters_alter"><AlterMaster /></FeatureGuard>} />
          <Route path="/group/:groupId" element={<GroupDashboard />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/accounts" element={<ChartOfAccounts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/settings/company" element={<Settings activeTab="company" />} />
          <Route path="/settings/ui" element={<Settings activeTab="ui" />} />
          <Route path="/settings/vouchers" element={<Settings activeTab="voucher" />} />
          <Route path="/settings/print" element={<Settings activeTab="print" />} />
          <Route path="/settings/features" element={<Settings activeTab="features" />} />
          <Route path="/settings/security" element={<Settings activeTab="security" />} />
          <Route path="/settings/notifications" element={<Settings activeTab="notifications" />} />
          <Route path="/settings/whatsapp" element={<Settings activeTab="whatsapp" />} />
          <Route path="/companies" element={<CompanyManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/founder" element={<FounderPanel />} />
           <Route path="/notifications" element={<NotificationPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/instructions" element={<HelpPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
              <div className="w-24 h-24 bg-rose-500/10 rounded-3xl flex items-center justify-center mb-8">
                <AlertCircle className="w-12 h-12 text-rose-500" />
              </div>
              <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4">404 - Not Found</h1>
              <p className="text-muted-foreground max-w-md mb-8 italic">
                Path: <code className="bg-muted px-2 py-1 rounded">{window.location.pathname}</code>
              </p>
              <button 
                onClick={() => window.location.href = '/'}
                className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
              >
                Back to Home
              </button>
            </div>
          } />
        </Routes>
      </ErrorBoundary>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </Layout>
  );
}

// async function testConnection() {
//   try {
//     await getDocFromServer(doc(db, 'system', 'connection_test'));
//     console.log("Firestore connection check: SUCCESS");
//   } catch (error) {
//     if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
//       console.error("Please check your Firebase configuration or internet connection.");
//     } else {
//       console.error("Firestore connection test error:", error);
//     }
//   }
// }

// testConnection();

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
