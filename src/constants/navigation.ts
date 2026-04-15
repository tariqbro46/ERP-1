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
  BarChart3,
  AlertCircle
} from 'lucide-react';

export interface NavItem {
  id: string;
  to: string;
  icon: any;
  iconName: string;
  label: string;
  labelKey: string;
  feature?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  permission?: string;
  hidden?: boolean;
}

export interface NavGroup {
  id: string;
  group: string;
  groupKey: string;
  items: NavItem[];
  to?: string;
}

export const DASHBOARD_ITEM: NavItem = { 
  id: 'dashboard', 
  to: '/dashboard', 
  icon: LayoutDashboard, 
  iconName: 'LayoutDashboard',
  label: 'Dashboard', 
  labelKey: 'nav.dashboard', 
  permission: 'Dashboard' 
};

export const NAV_ITEMS: NavGroup[] = [
  {
    id: 'group-masters',
    group: 'Masters',
    groupKey: 'nav.masters',
    items: [
      { id: 'ledger-new', to: '/accounts/ledgers/new', icon: UserPlus, iconName: 'UserPlus', label: 'Create Ledger', labelKey: 'nav.createLedger', permission: 'Ledgers' },
      { id: 'item-new', to: '/inventory/items/new', icon: Plus, iconName: 'Plus', label: 'Create Item', labelKey: 'nav.createItem', feature: 'inv', permission: 'Items' },
      { id: 'godowns', to: '/inventory/godowns', icon: MapPin, iconName: 'MapPin', label: 'Godowns', labelKey: 'nav.godowns', feature: 'inv', permission: 'Items' },
      { id: 'employees', to: '/employees', icon: Users, iconName: 'Users', label: 'Employee Master', labelKey: 'nav.employeeMaster', permission: 'Employees' },
      { id: 'accounts', to: '/accounts', icon: Database, iconName: 'Database', label: 'Chart of Accounts', labelKey: 'nav.chartOfAccounts', permission: 'Ledgers' },
      { id: 'items', to: '/inventory/items', icon: Package, iconName: 'Package', label: 'Item Master', labelKey: 'nav.itemMaster', feature: 'inv', permission: 'Items' },
      { id: 'alter', to: '/alter', icon: SettingsIcon, iconName: 'Settings', label: 'Alter', labelKey: 'nav.alter', permission: 'Ledgers' },
    ]
  },
  {
    id: 'group-transactions',
    group: 'Transactions',
    groupKey: 'nav.transactions',
    items: [
      { id: 'voucher-new', to: '/vouchers/new', icon: FileText, iconName: 'FileText', label: 'Voucher Entry', labelKey: 'nav.voucherEntry', permission: 'Vouchers' },
    ]
  },
  {
    id: 'group-payroll',
    group: 'Payroll',
    groupKey: 'nav.payroll',
    items: [
      { id: 'payroll-mgmt', to: '/payroll', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Management', labelKey: 'nav.payrollManagement', permission: 'Salary Sheets' },
    ]
  },
  {
    id: 'group-production',
    group: 'Production',
    groupKey: 'nav.production',
    items: [
      { id: 'prod-orders', to: '/production/orders', icon: Printer, iconName: 'Printer', label: 'Order Management', labelKey: 'nav.orderManagement', permission: 'orders' },
      { id: 'prod-machines', to: '/production/machines', icon: Cpu, iconName: 'Cpu', label: 'Machine Management', labelKey: 'nav.machineManagement', permission: 'machines' },
      { id: 'prod-reports', to: '/production/reports', icon: BarChart3, iconName: 'BarChart3', label: 'Production Reports', labelKey: 'nav.productionReports', permission: 'orders' },
    ]
  },
  {
    id: 'group-reports',
    group: 'Reports',
    groupKey: 'nav.reports',
    to: '/reports',
    items: [
      { id: 'rep-balance-sheet', to: '/reports/balance-sheet', icon: Scale, iconName: 'Scale', label: 'Balance Sheet', labelKey: 'nav.balanceSheet', permission: 'Ledgers' },
      { id: 'rep-pl', to: '/reports/pl', icon: TrendingUp, iconName: 'TrendingUp', label: 'Profit & Loss', labelKey: 'nav.profitAndLoss', permission: 'Ledgers' },
      { id: 'rep-daybook', to: '/reports/daybook', icon: BookOpen, iconName: 'BookOpen', label: 'Daybook', labelKey: 'nav.daybook', permission: 'Vouchers', hidden: true },
      { id: 'rep-trial-balance', to: '/reports/trial-balance', icon: ClipboardList, iconName: 'ClipboardList', label: 'Trial Balance', labelKey: 'nav.trialBalance', permission: 'Ledgers', hidden: true },
      { id: 'rep-stock', to: '/reports/stock', icon: Package, iconName: 'Package', label: 'Stock Summary', labelKey: 'nav.stockSummary', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-ledger', to: '/reports/ledger', icon: ClipboardList, iconName: 'ClipboardList', label: 'Ledger Statement', labelKey: 'nav.ledgerStatement', permission: 'Ledgers', hidden: true },
      { id: 'rep-account-books', to: '/reports/account-books', icon: BookOpen, iconName: 'BookOpen', label: 'Account Books', labelKey: 'nav.accountBooks', permission: 'Ledgers', hidden: true },
      { id: 'rep-inventory-books', to: '/reports/inventory-books', icon: Package, iconName: 'Package', label: 'Inventory Books', labelKey: 'nav.inventoryBooks', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-statement-inventory', to: '/reports/statement-of-inventory', icon: Activity, iconName: 'Activity', label: 'Statement of Inventory', labelKey: 'nav.statementOfInventory', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-payroll', to: '/reports/payroll', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Reports', labelKey: 'nav.payrollReports', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-negative-ledger', to: '/reports/negative-ledger', icon: AlertCircle, iconName: 'AlertCircle', label: 'Negative Ledger', labelKey: 'nav.negativeLedger', permission: 'Ledgers', hidden: true },
      { id: 'rep-negative-stock', to: '/reports/negative-stock', icon: AlertCircle, iconName: 'AlertCircle', label: 'Negative Stock', labelKey: 'nav.negativeStock', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-ratios', to: '/reports/ratios', icon: Activity, iconName: 'Activity', label: 'Ratio Analysis', labelKey: 'nav.ratioAnalysis', permission: 'Dashboard', hidden: true },
      { id: 'rep-financial-insights', to: '/reports/financial-insights', icon: TrendingUp, iconName: 'TrendingUp', label: 'Financial Insights', labelKey: 'nav.financialInsights', permission: 'Dashboard', hidden: true },
      { id: 'rep-sales-performance', to: '/reports/sales-performance', icon: Award, iconName: 'Award', label: 'Sales Performance', labelKey: 'nav.salesPerformance', permission: 'Employees', hidden: true },
    ]
  },
  {
    id: 'group-settings',
    group: 'Settings',
    groupKey: 'nav.settings',
    items: [
      { id: 'set-company', to: '/settings/company', icon: Building2, iconName: 'Building2', label: 'Company Info', labelKey: 'nav.companyInfo' },
      { id: 'set-ui', to: '/settings/ui', icon: Database, iconName: 'Database', label: 'UI Customization', labelKey: 'nav.uiCustomization' },
      { id: 'set-vouchers', to: '/settings/vouchers', icon: FileText, iconName: 'FileText', label: 'Voucher Settings', labelKey: 'nav.voucherSettings' },
      { id: 'set-print', to: '/settings/print', icon: Printer, iconName: 'Printer', label: 'Print Settings', labelKey: 'nav.printSettings' },
      { id: 'set-features', to: '/settings/features', icon: Database, iconName: 'Database', label: 'F11 Features', labelKey: 'nav.f11Features' },
      { id: 'set-security', to: '/settings/security', icon: Shield, iconName: 'Shield', label: 'Security', labelKey: 'nav.security' },
      { id: 'set-notifications', to: '/settings/notifications', icon: BookOpen, iconName: 'BookOpen', label: 'Notifications', labelKey: 'nav.notifications' },
      { id: 'set-whatsapp', to: '/settings/whatsapp', icon: BookOpen, iconName: 'BookOpen', label: 'WhatsApp Templates', labelKey: 'nav.whatsappTemplates' },
    ]
  },
  {
    id: 'group-utilities',
    group: 'Utilities',
    groupKey: 'nav.utilities',
    items: [
      { id: 'util-companies', to: '/companies', icon: Building2, iconName: 'Building2', label: 'Company Management', labelKey: 'nav.companyManagement', adminOnly: true },
      { id: 'util-notes', to: '/notes', icon: StickyNote, iconName: 'StickyNote', label: 'Notes / Memo', labelKey: 'nav.notesMemo' },
      { id: 'util-users', to: '/users', icon: Users, iconName: 'Users', label: 'User Management', labelKey: 'nav.userManagement', adminOnly: true },
      { id: 'util-founder', to: '/founder', icon: Shield, iconName: 'Shield', label: 'Founder Panel', labelKey: 'nav.founderPanel', superAdminOnly: true },
      { id: 'util-subscription', to: '/subscription', icon: Award, iconName: 'Award', label: 'Subscription', labelKey: 'nav.subscription' },
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
  '/alter': 'nav.alter',
  '/reports/daybook': 'nav.daybook',
  '/reports/balance-sheet': 'nav.balanceSheet',
  '/reports/trial-balance': 'nav.trialBalance',
  '/reports/pl': 'nav.profitAndLoss',
  '/reports/ratios': 'nav.ratioAnalysis',
  '/reports/financial-insights': 'nav.financialInsights',
  '/reports/stock': 'nav.stockSummary',
  '/reports/ledger': 'nav.ledgerStatement',
  '/reports/account-books': 'nav.accountBooks',
  '/reports/inventory-books': 'nav.inventoryBooks',
  '/reports/statement-of-inventory': 'nav.statementOfInventory',
  '/reports/payroll': 'nav.payrollReports',
  '/reports/negative-ledger': 'nav.negativeLedger',
  '/reports/negative-stock': 'nav.negativeStock',
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
