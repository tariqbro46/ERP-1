import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  Settings as SettingsIcon, 
  StickyNote, 
  Database,
  ChevronRight,
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
  DollarSign
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { VoucherEntry } from './components/VoucherEntry';
import { Notes } from './components/Notes';
import { LedgerCreation } from './components/LedgerCreation';
import { ItemCreation } from './components/ItemCreation';
import { ItemMaster } from './components/ItemMaster';
import { Daybook } from './components/Daybook';
import { StockSummary } from './components/StockSummary';
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
import { UserManagement } from './components/UserManagement';
import { CompanyManagement } from './components/CompanyManagement';
import { SalespersonReport } from './components/SalespersonReport';
import FounderPanel from './components/FounderPanel';
import SubscriptionRequired from './components/SubscriptionRequired';
import { ErrorBoundary } from './components/ErrorBoundary';
import { cn } from './lib/utils';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login, Register } from './components/Auth';

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

const SidebarGroup = ({ title, children, isOpen, onToggle }: { title: string, children: React.ReactNode, isOpen: boolean, onToggle: () => void }) => (
  <div className="mb-2">
    <button 
      onClick={onToggle}
      className={cn(
        "w-full px-4 py-3 flex items-center justify-between group transition-colors",
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
      <ChevronRight className={cn(
        "w-3 h-3 transition-transform duration-300",
        isOpen ? "rotate-90 text-foreground" : "text-gray-600"
      )} />
    </button>
    <div className={cn(
      "overflow-hidden transition-all duration-300 ease-in-out",
      isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
    )}>
      <div className="py-1 space-y-0.5">
        {children}
      </div>
    </div>
  </div>
);

import { useTheme } from './contexts/ThemeContext';
import { useSettings } from './contexts/SettingsContext';

const NAV_ITEMS = [
  {
    group: 'Masters',
    items: [
      { to: '/accounts/ledgers/new', icon: UserPlus, label: 'Create Ledger' },
      { to: '/inventory/items/new', icon: Plus, label: 'Create Item', feature: 'inv' },
      { to: '/inventory/godowns', icon: MapPin, label: 'Godowns', feature: 'inv' },
      { to: '/employees', icon: Users, label: 'Employee Master' },
      { to: '/accounts', icon: Database, label: 'Chart of Accounts' },
      { to: '/inventory/items', icon: Package, label: 'Item Master', feature: 'inv' },
    ]
  },
  {
    group: 'Transactions',
    items: [
      { to: '/vouchers/new', icon: FileText, label: 'Voucher Entry' },
    ]
  },
  {
    group: 'Payroll',
    items: [
      { to: '/payroll', icon: DollarSign, label: 'Payroll Management' },
    ]
  },
  {
    group: 'Reports',
    items: [
      { to: '/reports/daybook', icon: BookOpen, label: 'Daybook' },
      { to: '/reports/balance-sheet', icon: Scale, label: 'Balance Sheet' },
      { to: '/reports/trial-balance', icon: ClipboardList, label: 'Trial Balance' },
      { to: '/reports/pl', icon: TrendingUp, label: 'Profit & Loss' },
      { to: '/reports/ratios', icon: Activity, label: 'Ratio Analysis' },
      { to: '/reports/financial-insights', icon: TrendingUp, label: 'Financial Insights' },
      { to: '/reports/stock', icon: Package, label: 'Stock Summary', feature: 'inv' },
      { to: '/reports/ledger', icon: ClipboardList, label: 'Ledger Statement' },
      { to: '/reports/sales-performance', icon: Award, label: 'Sales Performance' },
    ]
  },
  {
    group: 'Utilities',
    items: [
      { to: '/notes', icon: StickyNote, label: 'Notes / Memo' },
      { to: '/companies', icon: Building2, label: 'Companies' },
      { to: '/users', icon: Users, label: 'User Management', adminOnly: true },
      { to: '/founder', icon: Shield, label: 'Founder Panel', superAdminOnly: true },
      { to: '/settings', icon: SettingsIcon, label: 'Settings (F11)' },
    ]
  }
];

function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, company, logout, isAdmin, isSuperAdmin } = useAuth();
  const { companyName, slogan, features = [], menuBarStyle = 'classic', sidebarDefaultExpanded = true } = useSettings();

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
  const [activeRibbonTab, setActiveRibbonTab] = React.useState('Masters');

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
      setExpandedGroups(new Set(NAV_ITEMS.map(item => item.group)));
    } else {
      setExpandedGroups(new Set());
    }
  }, [sidebarDefaultExpanded]);

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
      isSidebarCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "p-6 border-b border-border flex items-center justify-between",
        isSidebarCollapsed && "px-4"
      )}>
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-foreground rounded-sm flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <span className="text-background font-bold text-lg">{companyName.charAt(0)}</span>
          </div>
          {!isSidebarCollapsed && (
            <div className="transition-opacity duration-300">
              <h1 className="text-sm font-bold text-foreground tracking-tighter truncate max-w-[120px]">{companyName}</h1>
              <p className="text-[9px] text-gray-500 uppercase tracking-widest truncate max-w-[120px]">{slogan}</p>
            </div>
          )}
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="p-1 hover:bg-foreground/5 rounded lg:hidden"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        {!isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="p-1 hover:bg-foreground/5 rounded hidden lg:block text-gray-400 hover:text-foreground"
          >
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        )}
        {isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(false)}
            className="p-1 hover:bg-foreground/5 rounded hidden lg:block text-gray-400 hover:text-foreground absolute -right-3 top-8 bg-background border border-border rounded-full"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 py-6 overflow-y-auto no-scrollbar overflow-x-hidden">
        <div className={cn("px-4 mb-6", isSidebarCollapsed && "px-2")}>
          <SidebarItem to="/" icon={LayoutDashboard} label={isSidebarCollapsed ? "" : "Dashboard"} active={location.pathname === '/'} />
        </div>

        {NAV_ITEMS.map((group) => {
          const isEnabled = group.items.some(item => !item.feature || features.find(f => f.id === item.feature)?.enabled !== false);
          if (!isEnabled) return null;

          return (
            <SidebarGroup 
              key={group.group}
              title={isSidebarCollapsed ? group.group.charAt(0) : group.group} 
              isOpen={expandedGroups.has(group.group)} 
              onToggle={() => toggleGroup(group.group)}
            >
              {group.items.map((item) => {
                if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return null;
                if (item.adminOnly && !isAdmin) return null;
                if (item.superAdminOnly && !isSuperAdmin) return null;
                return (
                  <SidebarItem 
                    key={item.to}
                    to={item.to} 
                    icon={item.icon} 
                    label={isSidebarCollapsed ? "" : item.label} 
                    active={location.pathname === item.to} 
                  />
                );
              })}
            </SidebarGroup>
          );
        })}
      </nav>

      <div className={cn("p-4 border-t border-border", isSidebarCollapsed && "p-2")}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="flex items-center gap-3 px-4 py-2 w-full text-gray-500 hover:text-foreground transition-colors group"
        >
          <ChevronRight className={cn(
            "w-4 h-4 transition-transform duration-300",
            isSidebarCollapsed ? "" : "rotate-180"
          )} />
          {!isSidebarCollapsed && <span className="text-[10px] font-mono uppercase tracking-widest">Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );

  const renderRibbonMenu = () => {
    return (
      <div className="bg-card border-b border-border hidden lg:block">
        <div className="flex border-b border-border px-4">
          {NAV_ITEMS.map(group => (
            <button
              key={group.group}
              onClick={() => setActiveRibbonTab(group.group)}
              className={cn(
                "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2",
                activeRibbonTab === group.group 
                  ? "border-primary text-primary" 
                  : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              {group.group}
            </button>
          ))}
        </div>
        <div className="p-4 flex items-center gap-8 overflow-x-auto no-scrollbar">
          {NAV_ITEMS.find(g => g.group === activeRibbonTab)?.items.map(item => {
            if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return null;
            if (item.adminOnly && !isAdmin) return null;
            if (item.superAdminOnly && !isSuperAdmin) return null;
            
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-2 min-w-[80px] p-2 rounded hover:bg-foreground/5 transition-all group",
                  location.pathname === item.to ? "bg-foreground/5" : ""
                )}
              >
                <item.icon className={cn(
                  "w-6 h-6 transition-transform group-hover:scale-110",
                  location.pathname === item.to ? "text-primary" : "text-gray-500"
                )} />
                <span className={cn(
                  "text-[9px] font-bold uppercase tracking-tighter text-center",
                  location.pathname === item.to ? "text-primary" : "text-gray-500"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMacOSMenu = () => (
    <div className="bg-background/80 backdrop-blur-md border-b border-border h-10 px-4 items-center gap-6 hidden lg:flex">
      <div className="flex items-center gap-2 mr-4">
        <div className="w-5 h-5 bg-foreground rounded-full flex items-center justify-center">
          <span className="text-background font-bold text-[10px]">{companyName.charAt(0)}</span>
        </div>
        <span className="text-xs font-bold">{companyName}</span>
      </div>
      
      {NAV_ITEMS.map(group => (
        <div key={group.group} className="relative group/mac">
          <button className="text-[11px] font-medium text-gray-500 hover:text-foreground px-2 py-1 rounded hover:bg-foreground/5 transition-colors">
            {group.group}
          </button>
          <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border shadow-2xl py-1 hidden group-hover/mac:block z-50 rounded-md overflow-hidden">
            {group.items.map(item => {
              if (item.feature && features.find(f => f.id === item.feature)?.enabled === false) return null;
              if (item.adminOnly && !isAdmin) return null;
              if (item.superAdminOnly && !isSuperAdmin) return null;
              
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-[11px] transition-colors",
                    location.pathname === item.to 
                      ? "bg-primary text-white" 
                      : "text-gray-500 hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const renderWindows11Menu = () => (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-xl border border-border/50 h-14 px-2 rounded-2xl flex items-center gap-1 shadow-2xl z-50 hidden lg:flex">
      <Link 
        to="/" 
        className={cn(
          "p-2.5 rounded-xl transition-all hover:bg-foreground/10 group relative",
          location.pathname === '/' ? "bg-foreground/5" : ""
        )}
      >
        <LayoutDashboard className={cn("w-6 h-6", location.pathname === '/' ? "text-primary" : "text-gray-500")} />
        {location.pathname === '/' && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />}
      </Link>
      
      <div className="w-[1px] h-6 bg-border mx-2" />
      
      {NAV_ITEMS.flatMap(g => g.items).filter(item => {
        // Show only a few key items in the taskbar style
        const taskbarItems = ['Voucher Entry', 'Daybook', 'Balance Sheet', 'Settings (F11)'];
        return taskbarItems.includes(item.label);
      }).map(item => (
        <Link 
          key={item.to}
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
  );

  return (
    <div className="flex h-screen h-[100dvh] bg-background text-foreground overflow-hidden transition-colors duration-300 relative">
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
        {/* Conditional Top Menu rendering */}
        {menuBarStyle === 'ribbon' && renderRibbonMenu()}
        {menuBarStyle === 'macos' && renderMacOSMenu()}

        <header className="h-14 border-b border-border bg-background flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3 lg:gap-4">
            {(menuBarStyle !== 'classic') && (
              <div className="flex items-center gap-3 mr-4 hidden lg:flex">
                <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
                  <span className="text-background font-bold text-lg">{companyName.charAt(0)}</span>
                </div>
                <div>
                  <h1 className="text-sm font-bold text-foreground tracking-tighter truncate max-w-[120px]">{companyName}</h1>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest truncate max-w-[120px]">{slogan}</p>
                </div>
              </div>
            )}
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={cn(
                "p-1.5 hover:bg-foreground/5 rounded",
                menuBarStyle === 'classic' ? "lg:hidden" : ""
              )}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </button>
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-[10px] text-gray-600 font-mono uppercase">
                Status: Online
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
          <div className="flex items-center gap-3 lg:gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-card transition-colors text-gray-500 hover:text-foreground"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-[10px] text-gray-500 font-mono">
              <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-gray-400">Alt</kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-card border border-border rounded text-gray-400">G</kbd>
              <span className="ml-1 uppercase tracking-widest">Go To</span>
            </div>
            <div className="flex items-center gap-3 border-l border-border pl-4 lg:pl-6 relative" ref={dropdownRef}>
              <div className="text-right hidden sm:block">
                <p className="text-[10px] text-foreground font-mono">{user?.displayName || user?.email || 'User'}</p>
                <p className="text-[9px] text-gray-500 uppercase font-mono">{user?.role || 'Staff'}</p>
              </div>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative group"
              >
                <div className="w-8 h-8 rounded-full border border-border overflow-hidden bg-card hover:border-foreground transition-all">
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
                    <p className="text-[10px] font-bold text-foreground uppercase tracking-widest truncate">{user?.displayName || 'User'}</p>
                    <p className="text-[9px] text-gray-500 truncate">{user?.email}</p>
                    <div className="mt-2 inline-block px-2 py-0.5 bg-foreground/5 rounded text-[8px] font-bold text-foreground uppercase tracking-widest">
                      {user?.role || 'Staff'}
                    </div>
                  </div>
                  
                  {isSuperAdmin && (
                    <Link 
                      to="/founder" 
                      className="flex items-center gap-3 px-4 py-2 text-[10px] text-primary hover:bg-primary/5 uppercase tracking-widest transition-colors font-bold"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      Founder Panel
                    </Link>
                  )}
                  
                  {isAdmin && (
                    <Link 
                      to="/users" 
                      className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      User Management
                    </Link>
                  )}

                  <Link 
                    to="/companies" 
                    className="flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Company Info
                  </Link>

                  <div className="h-[1px] bg-border my-2" />

                  <button 
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[10px] text-gray-500 hover:text-foreground hover:bg-foreground/5 uppercase tracking-widest transition-colors"
                  >
                    {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </button>

                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-[10px] text-red-500 hover:bg-red-500/5 uppercase tracking-widest transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Logout Session
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-16 lg:pb-0">
          {children}
        </div>

        {/* Windows 11 Style Taskbar */}
        {menuBarStyle === 'windows11' && renderWindows11Menu()}

        {/* Mobile Bottom Navigation */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border h-16 flex items-center justify-around px-2 z-40">
          <Link 
            to="/" 
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
              location.pathname === '/' ? "text-foreground" : "text-gray-500"
            )}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Home</span>
          </Link>
          <Link 
            to="/vouchers/new" 
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
              location.pathname === '/vouchers/new' ? "text-foreground" : "text-gray-500"
            )}
          >
            <FileText className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Voucher</span>
          </Link>
          <Link 
            to="/reports/daybook" 
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
              location.pathname === '/reports/daybook' ? "text-foreground" : "text-gray-500"
            )}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Daybook</span>
          </Link>
          <Link 
            to="/reports/stock" 
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
              location.pathname === '/reports/stock' ? "text-foreground" : "text-gray-500"
            )}
          >
            <Package className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Stock</span>
          </Link>
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 text-gray-500"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-bold uppercase tracking-tighter">Menu</span>
          </button>
        </nav>
      </main>
      
      <GoToSearch />
    </div>
  );
}

function AppContent() {
  const { user, loading, isSuperAdmin, logout } = useAuth();
  const [isRegister, setIsRegister] = React.useState(false);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen h-[100dvh] flex items-start md:items-center justify-center bg-gray-50 p-4 overflow-y-auto">
        <div className="my-auto w-full flex justify-center py-8">
          {isRegister ? (
            <Register onToggle={() => setIsRegister(false)} />
          ) : (
            <Login onToggle={() => setIsRegister(true)} />
          )}
        </div>
      </div>
    );
  }

  // Force company setup if not present and not super admin
  if (!user.companyId && !isSuperAdmin) {
    return (
      <Router>
        <div className="h-screen bg-background flex flex-col">
          <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-foreground rounded-sm flex items-center justify-center">
                <span className="text-background font-bold">E</span>
              </div>
              <span className="text-sm font-bold uppercase tracking-tighter">ERP System</span>
            </div>
            <button onClick={() => logout()} className="text-[10px] uppercase font-bold tracking-widest text-rose-500 hover:text-rose-600">
              Logout
            </button>
          </header>
          <div className="flex-1 overflow-y-auto">
            <CompanyManagement />
          </div>
        </div>
      </Router>
    );
  }

  return (
    <Router>
      <Layout>
        <ErrorBoundary>
          <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/vouchers/new" element={<VoucherEntry />} />
          <Route path="/vouchers/edit/:id" element={<VoucherEntry />} />
          <Route path="/accounts/ledgers/new" element={<LedgerCreation />} />
          <Route path="/accounts/ledgers/edit/:id" element={<LedgerCreation />} />
          <Route path="/inventory/items" element={<ItemMaster />} />
          <Route path="/inventory/items/new" element={<ItemCreation />} />
          <Route path="/inventory/items/edit/:id" element={<ItemCreation />} />
          <Route path="/inventory/godowns" element={<GodownMaster />} />
          <Route path="/employees" element={<EmployeeMaster />} />
          <Route path="/payroll" element={<PayrollManagement />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/reports/daybook" element={<Daybook />} />
          <Route path="/reports/stock" element={<StockSummary />} />
          <Route path="/reports/balance-sheet" element={<BalanceSheet />} />
          <Route path="/reports/trial-balance" element={<TrialBalance />} />
          <Route path="/reports/pl" element={<ProfitAndLoss />} />
          <Route path="/reports/ratios" element={<RatioAnalysis />} />
          <Route path="/reports/financial-insights" element={<FinancialInsights />} />
          <Route path="/reports/ledger" element={<LedgerStatement />} />
          <Route path="/reports/sales-performance" element={<SalespersonReport />} />
          <Route path="/accounts" element={<ChartOfAccounts />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/companies" element={<CompanyManagement />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/founder" element={<FounderPanel />} />
          <Route path="*" element={<div className="p-10 text-foreground font-mono">404 - Feature Not Implemented</div>} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
