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
  Users,
  Building2,
  Shield,
  Award,
  DollarSign,
  Printer,
  Cpu,
  BarChart3
} from 'lucide-react';

export interface NavItem {
  to: string;
  icon: any;
  label: string;
  labelKey: string;
  feature?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  permission?: string;
}

export interface NavGroup {
  group: string;
  groupKey: string;
  items: NavItem[];
}

export const DASHBOARD_ITEM: NavItem = { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', labelKey: 'nav.dashboard', permission: 'Dashboard' };

export const NAV_ITEMS: NavGroup[] = [
  {
    group: 'Masters',
    groupKey: 'nav.masters',
    items: [
      { to: '/accounts/ledgers/new', icon: UserPlus, label: 'Create Ledger', labelKey: 'nav.createLedger', permission: 'Ledgers' },
      { to: '/inventory/items/new', icon: Plus, label: 'Create Item', labelKey: 'nav.createItem', feature: 'inv', permission: 'Items' },
      { to: '/inventory/godowns', icon: MapPin, label: 'Godowns', labelKey: 'nav.godowns', feature: 'inv', permission: 'Items' },
      { to: '/employees', icon: Users, label: 'Employee Master', labelKey: 'nav.employeeMaster', permission: 'Employees' },
      { to: '/accounts', icon: Database, label: 'Chart of Accounts', labelKey: 'nav.chartOfAccounts', permission: 'Ledgers' },
      { to: '/inventory/items', icon: Package, label: 'Item Master', labelKey: 'nav.itemMaster', feature: 'inv', permission: 'Items' },
    ]
  },
  {
    group: 'Transactions',
    groupKey: 'nav.transactions',
    items: [
      { to: '/vouchers/new', icon: FileText, label: 'Voucher Entry', labelKey: 'nav.voucherEntry', permission: 'Vouchers' },
    ]
  },
  {
    group: 'Payroll',
    groupKey: 'nav.payroll',
    items: [
      { to: '/payroll', icon: DollarSign, label: 'Payroll Management', labelKey: 'nav.payrollManagement', permission: 'Salary Sheets' },
    ]
  },
  {
    group: 'Production',
    groupKey: 'nav.production',
    items: [
      { to: '/production/orders', icon: Printer, label: 'Order Management', labelKey: 'nav.orderManagement', permission: 'orders' },
      { to: '/production/machines', icon: Cpu, label: 'Machine Management', labelKey: 'nav.machineManagement', permission: 'machines' },
      { to: '/production/reports', icon: BarChart3, label: 'Production Reports', labelKey: 'nav.productionReports', permission: 'orders' },
    ]
  },
  {
    group: 'Reports',
    groupKey: 'nav.reports',
    items: [
      { to: '/reports/daybook', icon: BookOpen, label: 'Daybook', labelKey: 'nav.daybook', permission: 'Vouchers' },
      { to: '/reports/balance-sheet', icon: Scale, label: 'Balance Sheet', labelKey: 'nav.balanceSheet', permission: 'Ledgers' },
      { to: '/reports/trial-balance', icon: ClipboardList, label: 'Trial Balance', labelKey: 'nav.trialBalance', permission: 'Ledgers' },
      { to: '/reports/pl', icon: TrendingUp, label: 'Profit & Loss', labelKey: 'nav.profitAndLoss', permission: 'Ledgers' },
      { to: '/reports/ratios', icon: Activity, label: 'Ratio Analysis', labelKey: 'nav.ratioAnalysis', permission: 'Dashboard' },
      { to: '/reports/financial-insights', icon: TrendingUp, label: 'Financial Insights', labelKey: 'nav.financialInsights', permission: 'Dashboard' },
      { to: '/reports/stock', icon: Package, label: 'Stock Summary', labelKey: 'nav.stockSummary', feature: 'inv', permission: 'Items' },
      { to: '/reports/ledger', icon: ClipboardList, label: 'Ledger Statement', labelKey: 'nav.ledgerStatement', permission: 'Ledgers' },
      { to: '/reports/sales-performance', icon: Award, label: 'Sales Performance', labelKey: 'nav.salesPerformance', permission: 'Employees' },
    ]
  },
  {
    group: 'Settings',
    groupKey: 'nav.settings',
    items: [
      { to: '/settings/company', icon: Building2, label: 'Company Info', labelKey: 'nav.companyInfo' },
      { to: '/settings/ui', icon: Database, label: 'UI Customization', labelKey: 'nav.uiCustomization' },
      { to: '/settings/vouchers', icon: FileText, label: 'Voucher Settings', labelKey: 'nav.voucherSettings' },
      { to: '/settings/print', icon: Printer, label: 'Print Settings', labelKey: 'nav.printSettings' },
      { to: '/settings/features', icon: Database, label: 'F11 Features', labelKey: 'nav.f11Features' },
      { to: '/settings/security', icon: Shield, label: 'Security', labelKey: 'nav.security' },
      { to: '/settings/notifications', icon: BookOpen, label: 'Notifications', labelKey: 'nav.notifications' },
      { to: '/settings/whatsapp', icon: BookOpen, label: 'WhatsApp Templates', labelKey: 'nav.whatsappTemplates' },
    ]
  },
  {
    group: 'Utilities',
    groupKey: 'nav.utilities',
    items: [
      { to: '/companies', icon: Building2, label: 'Company Management', labelKey: 'nav.companyManagement', adminOnly: true },
      { to: '/notes', icon: StickyNote, label: 'Notes / Memo', labelKey: 'nav.notesMemo' },
      { to: '/users', icon: Users, label: 'User Management', labelKey: 'nav.userManagement', adminOnly: true },
      { to: '/founder', icon: Shield, label: 'Founder Panel', labelKey: 'nav.founderPanel', superAdminOnly: true },
    ]
  }
];

export const PAGE_TITLES: Record<string, string> = {
  '/': 'nav.dashboard',
  '/accounts/ledgers/new': 'nav.createLedger',
  '/inventory/items/new': 'nav.createItem',
  '/inventory/godowns': 'nav.godowns',
  '/employees': 'nav.employeeMaster',
  '/accounts': 'nav.chartOfAccounts',
  '/inventory/items': 'nav.itemMaster',
  '/vouchers/new': 'nav.voucherEntry',
  '/payroll': 'nav.payrollManagement',
  '/reports/daybook': 'nav.daybook',
  '/reports/balance-sheet': 'nav.balanceSheet',
  '/reports/trial-balance': 'nav.trialBalance',
  '/reports/pl': 'nav.profitAndLoss',
  '/reports/ratios': 'nav.ratioAnalysis',
  '/reports/financial-insights': 'nav.financialInsights',
  '/reports/stock': 'nav.stockSummary',
  '/reports/ledger': 'nav.ledgerStatement',
  '/reports/sales-performance': 'nav.salesPerformance',
  '/production/orders': 'nav.orderManagement',
  '/production/machines': 'nav.machineManagement',
  '/production/reports': 'nav.productionReports',
  '/notes': 'nav.notesMemo',
  '/companies': 'nav.companyManagement',
  '/users': 'nav.userManagement',
  '/founder': 'nav.founderPanel',
  '/settings': 'nav.settings',
  '/settings/company': 'nav.companyInfo',
  '/settings/ui': 'nav.uiCustomization',
  '/settings/vouchers': 'nav.voucherSettings',
  '/settings/print': 'nav.printSettings',
  '/settings/features': 'nav.f11Features',
  '/settings/security': 'nav.security',
  '/settings/notifications': 'nav.notifications',
  '/settings/whatsapp': 'nav.whatsappTemplates',
};
