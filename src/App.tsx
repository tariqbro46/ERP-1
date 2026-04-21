import React from 'react';
import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from './firebase';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
import NotificationPage from './components/NotificationPage';
import { AlterMaster } from './components/AlterMaster';
import { ReportsMenu } from './components/ReportsMenu';
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
import { ReportPlaceholder } from './components/ReportPlaceholder';
import { GroupDashboard } from './components/GroupDashboard';
import { VoucherDetail } from './components/VoucherDetail';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { Login, Register } from './components/Auth';
import { useNavigate } from 'react-router-dom';
import { NAV_ITEMS, PAGE_TITLES, DASHBOARD_ITEM } from './constants/navigation';
import { erpService } from './services/erpService';
import { MenuConfig } from './types';

import { Home } from './pages/landing/Home';
import { Features } from './pages/landing/Features';
import { About } from './pages/landing/About';
import { Contact } from './pages/landing/Contact';
import { Pricing } from './pages/landing/Pricing';

const SidebarItem = ({ to, icon: Icon, label, active, indent }: any) => (
  <Link
    to={to}
    className={cn(
      "flex items-center justify-between px-4 py-2.5 transition-all group border-l-2",
      active 
        ? "bg-foreground/5 text-foreground border-foreground" 
        : "text-gray-500 border-transparent hover:bg-card hover:text-foreground"
    )}
  >
    <div className={cn("flex items-center gap-3", indent && "ml-4")}>
      <Icon className={cn("w-3.5 h-3.5", active ? "text-foreground" : "text-gray-600 group-hover:text-gray-400")} />
      <span className="text-[10px] font-mono uppercase tracking-widest">{label}</span>
    </div>
    {active && <div className="w-1 h-1 rounded-full bg-foreground" />}
  </Link>
);

const SidebarGroup = ({ title, children, isOpen, onToggle, to }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void, to?: string }) => (
  <div className="mb-2">
    <div className="flex items-center group transition-colors">
      {to ? (
        <Link 
          to={to}
          className={cn(
            "flex-1 px-4 py-3 flex items-center justify-between transition-colors",
            isOpen ? "bg-foreground/5" : "hover:bg-card"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn("h-[1px] w-2 transition-all", isOpen ? "bg-foreground" : "bg-border")} />
            <p className={cn(
              "text-[9px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-colors",
              isOpen ? "text-foreground" : "text-gray-600 group-hover:text-gray-400"
            )}>{title}</p>
          </div>
        </Link>
      ) : (
        <button 
          onClick={onToggle}
          className={cn(
            "flex-1 px-4 py-3 flex items-center justify-between transition-colors",
            isOpen ? "bg-foreground/5" : "hover:bg-card"
          )}
        >
          <div className="flex items-center gap-2">
            <div className={cn("h-[1px] w-2 transition-all", isOpen ? "bg-foreground" : "bg-border")} />
            <p className={cn(
              "text-[9px] uppercase tracking-[0.2em] font-bold whitespace-nowrap transition-colors",
              isOpen ? "text-foreground" : "text-gray-600 group-hover:text-gray-400"
            )}>{title}</p>
          </div>
        </button>
      )}
      <button 
        onClick={onToggle}
        className={cn(
          "px-3 py-3 transition-colors",
          isOpen ? "bg-foreground/5" : "hover:bg-card"
        )}
      >
        <ChevronRight className={cn(
          "w-3 h-3 transition-transform duration-300",
          isOpen ? "rotate-90 text-foreground" : "text-gray-600"
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

import { useTheme, Theme } from './contexts/ThemeContext';
import { useSettings } from './contexts/SettingsContext';

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, company, logout, isAdmin, isSuperAdmin } = useAuth();
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
    glassBackground = 'default',
    englishFont = 'Inter',
    banglaFont = 'Hind Siliguri',
    appVersion = 'v1.0.1',
    statusOnlineText = 'Status: Online',
    showGoToShortcut = true,
    subscriptionPlans = [],
    updateSettings
  } = useSettings();

  const activePlan = subscriptionPlans.find(p => p.id === company?.planId);

  const navigate = useNavigate();

  const [dynamicMenu, setDynamicMenu] = React.useState<MenuConfig | null>(null);

  React.useEffect(() => {
    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
      if (config) {
        setDynamicMenu(config);
      }
    });
    return () => unsubscribe();
  }, []);

  const getIcon = (name: string) => {
    const Icon = (LucideIcons as any)[name];
    return Icon || LucideIcons.Package;
  };

  const menuGroups = React.useMemo(() => {
    if (!dynamicMenu) {
      return NAV_ITEMS.map((group) => ({
        ...group,
        items: group.items.map((item) => ({
          ...item,
          icon: item.icon // Static items already have the component
        }))
      }));
    }
    return dynamicMenu.groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        icon: getIcon(item.icon)
      }))
    }));
  }, [dynamicMenu]);

  const currentPageTitleKey = PAGE_TITLES[location.pathname] || (location.pathname.includes('/edit/') ? 'Edit Record' : 'ERP System');
  const currentPageTitle = currentPageTitleKey.startsWith('nav.') ? t(currentPageTitleKey) : currentPageTitleKey;

  // If access is disabled and user is not a super admin, show subscription required page
  // We only block if isAccessEnabled is explicitly false
  if (company && company.isAccessEnabled === false && !isSuperAdmin) {
    return <SubscriptionRequired />;
  }

  const isInventoryEnabled = features.find(f => f.id === 'inv')?.enabled ?? true;
  const [expandedGroups, setExpandedGroups] = React.useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = React.useState(false);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const renderClassicSidebar = () => (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-50 border-r border-border flex flex-col bg-background transition-all duration-300",
      menuBarStyle === 'classic' ? "lg:relative lg:translate-x-0" : "lg:fixed lg:z-[60]",
      isSidebarOpen ? "translate-x-0" : "-translate-x-full",
      "w-64"
    )}>
      <div className={cn(
        "p-6 border-b border-border flex items-center justify-between"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-sm flex-shrink-0 flex items-center justify-center overflow-hidden">
            {companyLogo || systemLogo ? (
              <img src={companyLogo || systemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-foreground flex items-center justify-center">
                <span className="text-background font-bold text-lg">{companyName.charAt(0)}</span>
              </div>
            )}
          </div>
          <div className="transition-opacity duration-300 relative group/logo">
            <h1 className="text-sm font-bold text-foreground tracking-tighter truncate max-w-[120px]">{companyName}</h1>
            <div className="flex items-center gap-2">
              <p className="text-[9px] text-gray-500 uppercase tracking-widest truncate max-w-[120px]">{slogan}</p>
              {activePlan && (
                <span className="text-[7px] font-bold text-primary uppercase tracking-tighter bg-primary/5 px-1 rounded">
                  {activePlan.name}
                </span>
              )}
            </div>
            {isAdmin && (
              <Link 
                to="/settings/company" 
                className="absolute -right-6 top-1/2 -translate-y-1/2 opacity-0 group-hover/logo:opacity-100 transition-opacity p-1 hover:bg-foreground/5 rounded"
                title="Edit Company Logo & Info"
              >
                <SettingsIcon className="w-3 h-3 text-gray-400" />
              </Link>
            )}
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-1 hover:bg-foreground/5 rounded lg:hidden"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <nav className="flex-1 py-2 overflow-y-auto no-scrollbar overflow-x-hidden">
        <div className="px-3 mb-2">
            <SidebarItem 
              to={DASHBOARD_ITEM.to} 
              icon={DASHBOARD_ITEM.icon} 
              label={isSidebarCollapsed ? "" : (DASHBOARD_ITEM.labelKey && t(DASHBOARD_ITEM.labelKey) !== DASHBOARD_ITEM.labelKey ? t(DASHBOARD_ITEM.labelKey) : DASHBOARD_ITEM.label)} 
              active={location.pathname === DASHBOARD_ITEM.to} 
            />
        </div>

        {menuGroups.map((group) => {
          if (group.hidden) return null;
          const isEnabled = group.items.some(item => !item.feature || features.find(f => f.id === item.feature)?.enabled !== false);
          if (!isEnabled) return null;

          return (
            <SidebarGroup 
              key={group.id}
              title={isSidebarCollapsed ? (group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey).charAt(0) : group.group.charAt(0)) : (group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey) : group.group)} 
              isOpen={expandedGroups.has(group.group)} 
              onToggle={() => toggleGroup(group.group)}
              to={group.to}
            >
              {group.items.map((item: any) => {
                if (item.hidden) return null;
                if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return null;
                if (item.adminOnly && !isAdmin) return null;
                if (item.superAdminOnly && !isSuperAdmin) return null;
                if (item.permission && (!user?.permissions || !user.permissions.includes(item.permission)) && !isAdmin && !isSuperAdmin) return null;
                return (
                  <SidebarItem 
                    key={item.id}
                    to={item.to} 
                    icon={item.icon} 
                    label={isSidebarCollapsed ? "" : (item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label)} 
                    active={location.pathname === item.to} 
                  />
                );
              })}
            </SidebarGroup>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-border flex flex-col gap-2", isSidebarCollapsed && "p-2")}>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse")} />
            <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">{statusOnlineText}</span>
          </div>
          <span className="text-[9px] text-gray-400 font-mono uppercase tracking-widest">{appVersion}</span>
        </div>
      </div>
    </aside>
  );

  const renderRibbonMenu = () => {
    return (
      <div className="bg-card border-b border-border hidden lg:block">
        <div className="flex border-b border-border px-4">
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
              if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return null;
              if (item.adminOnly && !isAdmin) return null;
              if (item.superAdminOnly && !isSuperAdmin) return null;
              if (item.permission && (!user?.permissions || !user.permissions.includes(item.permission)) && !isAdmin && !isSuperAdmin) return null;
              
              return (
                <Link
                  key={item.id}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-1 min-w-[70px] p-1.5 rounded hover:bg-foreground/5 transition-all group",
                    location.pathname === item.to ? "bg-foreground/5" : ""
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
        <NotificationCenter />
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 hover:bg-foreground/5 px-2 py-1 rounded transition-colors"
          >
            <div className="w-5 h-5 rounded-full border border-border overflow-hidden bg-card">
              <img 
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                alt="Profile"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{user?.displayName || 'User'}</span>
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute top-full right-0 mt-1 w-56 bg-card border border-border shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-border mb-2">
                <p className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate">{user?.displayName || 'User'}</p>
                <p className="text-[9px] text-gray-500 truncate">{user?.email}</p>
              </div>
              
              {isSuperAdmin && (
                <Link to="/founder" className="flex items-center gap-3 px-4 py-2 text-[10px] text-primary hover:bg-primary/5 uppercase tracking-widest transition-colors font-bold">
                  <Shield className="w-3.5 h-3.5" /> {t('nav.founderPanel')}
                </Link>
              )}
              
              {isAdmin && (
                <Link to="/users" className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors">
                  <Users className="w-3.5 h-3.5" /> {t('nav.userManagement')}
                </Link>
              )}

              <Link to="/companies" className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors">
                <Building2 className="w-3.5 h-3.5" /> {t('nav.companyManagement')}
              </Link>

              <div className="h-[1px] bg-border my-2" />

              <div className="px-4 py-2">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('settings.language')}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLanguage('en')}
                    className={cn(
                      "flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all",
                      language === 'en' ? "bg-primary text-white border-primary" : "text-gray-500 border-border hover:bg-foreground/5"
                    )}
                  >
                    English
                  </button>
                  <button
                    onClick={() => setLanguage('bn')}
                    className={cn(
                      "flex-1 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded border transition-all",
                      language === 'bn' ? "bg-primary text-white border-primary" : "text-gray-500 border-border hover:bg-foreground/5"
                    )}
                  >
                    বাংলা
                  </button>
                </div>
              </div>

              <div className="h-[1px] bg-border my-2" />

              <div className="px-4 py-2">
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">{t('common.selectTheme')}</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['light', 'dark', 'emerald', 'amber', 'rose', 'slate', 'classic'] as Theme[]).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "w-full aspect-square rounded-md border-2 transition-all flex items-center justify-center",
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

              <div className="h-[1px] bg-border my-2" />

              <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2 text-[10px] text-red-500 hover:bg-red-500/5 uppercase tracking-widest transition-colors">
                <LogOut className="w-3.5 h-3.5" /> {t('nav.logout')}
              </button>
            </div>
          )}
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
          <NotificationCenter />
          <div className="w-[1px] h-6 bg-border mx-2" />
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
      className="flex h-screen h-[100dvh] bg-background text-foreground overflow-hidden transition-colors duration-300 relative"
      data-ui-style={uiStyle}
      data-glass-bg={glassBackground}
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
      {(menuBarStyle === 'classic' || isSidebarOpen) && renderClassicSidebar()}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden w-full">
        {menuBarStyle !== 'macos' && (
          <header className={cn(
            "h-14 border-b border-border bg-background flex items-center px-4 lg:px-6 relative transition-colors",
            uiStyle === 'UI/UX 2' && "bg-blue-600 border-blue-700 text-white"
          )}>
            <div className="flex items-center gap-3 lg:gap-4 z-10">
              {/* Desktop/Classic Menu Bar Style */}
              {menuBarStyle !== 'classic' && (
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
                    <h1 className={cn(
                      "text-[10px] font-bold tracking-tighter truncate max-w-[80px]",
                      uiStyle === 'UI/UX 2' ? "text-white" : "text-foreground"
                    )}>
                      {companyName}
                    </h1>
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

            {/* Center Title */}
            <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
              <h2 className={cn(
                "text-[10px] sm:text-sm font-bold uppercase tracking-widest text-center truncate max-w-[120px] sm:max-w-none",
                uiStyle === 'UI/UX 2' ? "text-white" : "text-primary"
              )}>
                {currentPageTitle}
              </h2>
            </div>

            <div className="ml-auto flex items-center gap-3 lg:gap-6 z-10">
              <NotificationCenter />
              
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
              <div className={cn(
                "flex items-center gap-3 border-l pl-4 lg:pl-6 relative",
                uiStyle === 'UI/UX 2' ? "border-white/20" : "border-border"
              )} ref={dropdownRef}>
                <div className="text-right hidden sm:block">
                  <p className={cn(
                    "text-[10px] font-mono",
                    uiStyle === 'UI/UX 2' ? "text-white" : "text-foreground"
                  )}>{user?.displayName || user?.email || t('common.user')}</p>
                  <p className={cn(
                    "text-[9px] uppercase font-mono",
                    uiStyle === 'UI/UX 2' ? "text-blue-100" : "text-gray-500"
                  )}>{user?.role || t('common.staff')}</p>
                </div>
                <button 
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="relative group"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full border overflow-hidden bg-card transition-all",
                    uiStyle === 'UI/UX 2' ? "border-white/40 hover:border-white" : "border-border hover:border-foreground"
                  )}>
                    <img 
                      src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                      alt="Profile"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {isSuperAdmin && <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full border-2 border-background" title="Founder/Marketing Manager" />}
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-background rounded-full" />
                </button>

                {isProfileDropdownOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border shadow-2xl z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-3 border-b border-border mb-2">
                      <p className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate">{user?.displayName || t('common.user')}</p>
                      <p className="text-[9px] text-gray-500 truncate">{user?.email}</p>
                      <div className="mt-2 inline-block px-2 py-0.5 bg-foreground/5 rounded text-[8px] font-bold text-foreground uppercase tracking-widest">
                        {user?.role || t('common.staff')}
                      </div>
                    </div>
                    
                    {isSuperAdmin && (
                      <Link 
                        to="/founder" 
                        className="flex items-center gap-3 px-4 py-2 text-[10px] text-primary hover:bg-primary/5 uppercase tracking-widest transition-colors font-bold"
                      >
                        <Shield className="w-3.5 h-3.5" />
                        {t('nav.founderPanel')}
                      </Link>
                    )}
                    
                    {isAdmin && (
                      <Link 
                        to="/users" 
                        className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        {t('nav.userManagement')}
                      </Link>
                    )}

                    <Link 
                      to="/companies" 
                      className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {t('nav.companyManagement')}
                    </Link>

                    <div className="h-[1px] bg-border my-2" />
                    
                    {uiStyle === 'UI/UX 1' && (
                      <div className="px-4 py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-2">Select Theme</p>
                        <div className="grid grid-cols-4 gap-2">
                          {(['light', 'dark', 'emerald', 'amber', 'rose', 'slate', 'classic'] as Theme[]).map((t) => (
                            <button
                              key={t}
                              onClick={() => {
                                setTheme(t);
                                if (uiStyle !== 'UI/UX 1') {
                                  updateSettings({ uiStyle: 'UI/UX 1' });
                                }
                              }}
                              className={cn(
                                "w-full aspect-square rounded-md border-2 transition-all flex items-center justify-center",
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
                    )}

                    <div className="h-[1px] bg-border my-2" />

                    <button 
                      onClick={logout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[10px] text-red-500 hover:bg-red-500/5 uppercase tracking-widest transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Conditional Top Menu rendering */}
        {menuBarStyle === 'ribbon' && renderRibbonMenu()}
        {menuBarStyle === 'macos' && renderMacOSMenu()}

        <div ref={scrollRef} className={cn(
          "flex-1 overflow-y-auto overflow-x-auto no-scrollbar pb-16 lg:pb-0",
          menuBarStyle === 'macos' && "pt-10"
        )}>
          <div className={cn(
            "w-full mx-auto",
            layoutWidth === 'constrained' ? "max-w-7xl" : "max-w-full"
          )}>
            {children}
          </div>
        </div>

        {/* Windows 11 Style Taskbar */}
        {menuBarStyle === 'windows11' && renderWindows11Menu()}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-2 z-40">
          <Link 
            to="/dashboard" 
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
              location.pathname === '/dashboard' ? "text-foreground" : "text-gray-500"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t('nav.dashboard')}</span>
          </Link>

          {menuGroups.flatMap(g => g.items).filter(item => {
            return mobileBottomNavItems.includes(item.label) && item.label !== 'Dashboard';
          }).map(item => (
            <Link 
              key={item.id}
              to={item.to} 
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                location.pathname === item.to ? "text-foreground" : "text-gray-500"
              )}
            >
              <item.icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase tracking-tighter truncate max-w-[60px]">
                        {t(item.labelKey).split(' ')[0]}
                      </span>
            </Link>
          ))}

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
              isSidebarOpen ? "text-foreground" : "text-gray-500"
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">{t('nav.menu')}</span>
          </button>
        </nav>
      </main>
      
      <GoToSearch />
    </div>
  );
}

function AppContent() {
  const { user, loading, isSuperAdmin, logout, firebaseUser } = useAuth();
  const { language } = useLanguage();
  const { englishFont = 'Inter', banglaFont = 'Hind Siliguri' } = useSettings();

  // Apply fonts globally
  React.useEffect(() => {
    const font = language === 'en' ? englishFont : banglaFont;
    document.documentElement.style.setProperty('--app-font', `"${font}", sans-serif`);
  }, [language, englishFont, banglaFont]);
  
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
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
  const { user, isSuperAdmin, logout, firebaseUser, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (loading) return null;

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
          <button onClick={() => logout()} className="text-[10px] uppercase font-bold tracking-widest text-rose-500 hover:text-rose-600">
            {t('common.logout')}
          </button>
        </header>
        <div className="flex-1 overflow-y-auto">
          <CompanyManagement />
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/vouchers/new" element={<VoucherEntry />} />
          <Route path="/vouchers/edit/:id" element={<VoucherEntry />} />
          <Route path="/vouchers/view/:id" element={<VoucherDetail />} />
          <Route path="/accounts/ledgers/new" element={<LedgerCreation />} />
          <Route path="/accounts/ledgers/edit/:id" element={<LedgerCreation />} />
          <Route path="/inventory/items" element={<ItemMaster />} />
          <Route path="/inventory/items/new" element={<ItemCreation />} />
          <Route path="/inventory/items/edit/:id" element={<ItemCreation />} />
          <Route path="/inventory/godowns" element={<GodownMaster />} />
          <Route path="/inventory/units" element={<UnitMaster />} />
          <Route path="/inventory/overview" element={<InventoryOverview />} />
          <Route path="/employees" element={<EmployeeMaster />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/subscription" element={<SubscriptionPage />} />
          <Route path="/alter" element={<AlterMaster />} />
          <Route path="/group/:groupId" element={<GroupDashboard />} />
          <Route path="/reports" element={<ReportsMenu />} />
          <Route path="/reports/account-books" element={<ReportPlaceholder title="Account Books" />} />
          <Route path="/reports/inventory-books" element={<InventoryBooks />} />
          <Route path="/reports/location" element={<LocationStockReport />} />
          <Route path="/reports/stock-group-summary" element={<StockGroupSummary />} />
          <Route path="/reports/stock-category-summary" element={<StockCategorySummary />} />
          <Route path="/reports/stock-transfer-register" element={<RegisterReport type="Stock Transfer" title="Stock Transfer Register" />} />
          <Route path="/reports/physical-stock-register" element={<RegisterReport type="Physical Stock" title="Physical Stock Register" />} />
          <Route path="/reports/stock-item" element={<StockItemReport />} />
          <Route path="/reports/daybook" element={<Daybook />} />
          <Route path="/reports/stock" element={<StockSummary />} />
          <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="/reports/trial-balance" element={<TrialBalance />} />
          <Route path="/reports/pl" element={<ProfitAndLoss />} />
          <Route path="/reports/ratios" element={<RatioAnalysis />} />
          <Route path="/reports/financial-insights" element={<FinancialInsights />} />
          <Route path="/reports/ledger" element={<LedgerStatement />} />
          <Route path="/reports/sales-performance" element={<SalespersonReport />} />
          <Route path="/reports/cash-flow" element={<CashFlow />} />
          <Route path="/reports/funds-flow" element={<FundsFlow />} />
          <Route path="/reports/statistics" element={<Statistics />} />
          <Route path="/reports/ageing-analysis" element={<AgeingAnalysis />} />
          <Route path="/reports/movement" element={<MovementAnalysis />} />
          <Route path="/reports/stock-query" element={<StockQuery />} />
          <Route path="/reports/group-summary" element={<GroupSummary />} />
          <Route path="/reports/group-voucher" element={<GroupVoucher />} />
          <Route path="/reports/contra-register" element={<RegisterReport type="Contra" title="Contra Register" />} />
          <Route path="/reports/payment-register" element={<RegisterReport type="Payment" title="Payment Register" />} />
          <Route path="/reports/receipt-register" element={<RegisterReport type="Receipt" title="Receipt Register" />} />
          <Route path="/reports/sales-register" element={<RegisterReport type="Sales" title="Sales Register" />} />
          <Route path="/reports/purchase-register" element={<RegisterReport type="Purchase" title="Purchase Register" />} />
          <Route path="/reports/journal-register" element={<RegisterReport type="Journal" title="Journal Register" />} />
          <Route path="/reports/negative-ledger" element={<NegativeReports type="ledger" />} />
          <Route path="/reports/negative-stock" element={<NegativeReports type="stock" />} />
          <Route path="/reports/pay-slip" element={<PayrollReports type="payslip" />} />
          <Route path="/reports/pay-sheet" element={<PayrollReports type="paysheet" />} />
          <Route path="/reports/attendance-sheet" element={<PayrollReports type="attendance_sheet" />} />
          <Route path="/reports/payment-advice" element={<PayrollReports type="payment_advice" />} />
          <Route path="/reports/payroll-statement" element={<PayrollReports type="payroll_statement" />} />
          <Route path="/reports/payroll-register" element={<PayrollReports type="payroll_register" />} />
          <Route path="/reports/attendance-register" element={<PayrollReports type="attendance_register" />} />
          <Route path="/reports/employee-profile" element={<PayrollReports type="employee_profile" />} />
          <Route path="/reports/employee-head-count" element={<PayrollReports type="headcount" />} />
          <Route path="/reports/cash-bank" element={<CashBankBooks />} />
          <Route path="/reports/stock-item" element={<StockItemReport />} />
          <Route path="/production/orders" element={<OrderManagement />} />
          <Route path="/production/orders/new" element={<OrderEntry />} />
          <Route path="/production/orders/edit/:id" element={<OrderEntry />} />
          <Route path="/production/machines" element={<MachineManagement />} />
          <Route path="/production/reports" element={<OrderReports />} />
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
    </Layout>
  );
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system', 'connection_test'));
    console.log("Firestore connection check: SUCCESS");
  } catch (error) {
    if (error instanceof Error && (error.message.includes('the client is offline') || error.message.includes('unavailable'))) {
      console.error("Please check your Firebase configuration or internet connection.");
    } else {
      console.error("Firestore connection test error:", error);
    }
  }
}

testConnection();

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
