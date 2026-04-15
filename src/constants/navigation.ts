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
  children?: NavItem[];
}

export interface NavGroup {
  id: string;
  group: string;
  groupKey: string;
  items: NavItem[];
  to?: string;
  hidden?: boolean;
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
      { id: 'rep-account-books', to: '/group/group-account-books', icon: BookOpen, iconName: 'BookOpen', label: 'Account Books', labelKey: 'nav.accountBooks', permission: 'Ledgers', hidden: true },
      { id: 'rep-inventory-books', to: '/group/group-inventory-books', icon: Package, iconName: 'Package', label: 'Inventory Books', labelKey: 'nav.inventoryBooks', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-statement-of-inventory', to: '/group/group-statement-of-inventory', icon: Package, iconName: 'Package', label: 'Statement of Inventory', labelKey: 'nav.statementOfInventory', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-statement-of-account', to: '/group/group-statement-of-account', icon: Activity, iconName: 'Activity', label: 'Statement of Account', labelKey: 'nav.statementOfAccount', permission: 'Dashboard', hidden: true },
      { id: 'rep-payroll', to: '/group/group-payroll-reports', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Reports', labelKey: 'nav.payrollReports', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-exception-reports', to: '/group/group-exception-reports', icon: AlertCircle, iconName: 'AlertCircle', label: 'Exception Reports', labelKey: 'nav.exceptionReports', permission: 'Ledgers', hidden: true },
      { id: 'rep-ratios', to: '/reports/ratios', icon: Activity, iconName: 'Activity', label: 'Ratio Analysis', labelKey: 'nav.ratioAnalysis', permission: 'Dashboard', hidden: true },
      { id: 'rep-financial-insights', to: '/reports/financial-insights', icon: TrendingUp, iconName: 'TrendingUp', label: 'Financial Insights', labelKey: 'nav.financialInsights', permission: 'Dashboard', hidden: true },
      { id: 'rep-sales-performance', to: '/reports/sales-performance', icon: Award, iconName: 'Award', label: 'Sales Performance', labelKey: 'nav.salesPerformance', permission: 'Employees', hidden: true },
      { id: 'rep-cash-flow', to: '/reports/cash-flow', icon: Activity, iconName: 'Activity', label: 'Cash Flow', labelKey: 'nav.cashFlow', permission: 'Ledgers', hidden: true },
      { id: 'rep-funds-flow', to: '/reports/funds-flow', icon: Activity, iconName: 'Activity', label: 'Funds Flow', labelKey: 'nav.fundsFlow', permission: 'Ledgers', hidden: true },
      { id: 'rep-group-voucher', to: '/reports/group-voucher', icon: BookOpen, iconName: 'BookOpen', label: 'Group Voucher', labelKey: 'nav.groupVoucher', permission: 'Vouchers', hidden: true },
      { id: 'rep-contra-register', to: '/reports/contra-register', icon: BookOpen, iconName: 'BookOpen', label: 'Contra Register', labelKey: 'nav.contraRegister', permission: 'Vouchers', hidden: true },
      { id: 'rep-payment-register', to: '/reports/payment-register', icon: BookOpen, iconName: 'BookOpen', label: 'Payment Register', labelKey: 'nav.paymentRegister', permission: 'Vouchers', hidden: true },
      { id: 'rep-receipt-register', to: '/reports/receipt-register', icon: BookOpen, iconName: 'BookOpen', label: 'Receipt Register', labelKey: 'nav.receiptRegister', permission: 'Vouchers', hidden: true },
      { id: 'rep-sales-register', to: '/reports/sales-register', icon: BookOpen, iconName: 'BookOpen', label: 'Sales Register', labelKey: 'nav.salesRegister', permission: 'Vouchers', hidden: true },
      { id: 'rep-purchase-register', to: '/reports/purchase-register', icon: BookOpen, iconName: 'BookOpen', label: 'Purchase Register', labelKey: 'nav.purchaseRegister', permission: 'Vouchers', hidden: true },
      { id: 'rep-journal-register', to: '/reports/journal-register', icon: BookOpen, iconName: 'BookOpen', label: 'Journal Register', labelKey: 'nav.journalRegister', permission: 'Vouchers', hidden: true },
      { id: 'rep-statistics', to: '/reports/statistics', icon: Activity, iconName: 'Activity', label: 'Statistics', labelKey: 'nav.statistics', permission: 'Dashboard', hidden: true },
      { id: 'rep-location', to: '/reports/location', icon: Package, iconName: 'Package', label: 'Location', labelKey: 'nav.location', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-stock-group-summary', to: '/reports/stock-group-summary', icon: Package, iconName: 'Package', label: 'Stock Group Summary', labelKey: 'nav.stockGroupSummary', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-stock-category-summary', to: '/reports/stock-category-summary', icon: Package, iconName: 'Package', label: 'Stock Category Summary', labelKey: 'nav.stockCategorySummary', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-stock-transfer-register', to: '/reports/stock-transfer-register', icon: Package, iconName: 'Package', label: 'Stock Transfer Register', labelKey: 'nav.stockTransferRegister', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-physical-stock-register', to: '/reports/physical-stock-register', icon: Package, iconName: 'Package', label: 'Physical Stock Register', labelKey: 'nav.physicalStockRegister', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-ageing-analysis', to: '/reports/ageing-analysis', icon: Activity, iconName: 'Activity', label: 'Ageing Analysis', labelKey: 'nav.ageingAnalysis', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-pay-slip', to: '/reports/pay-slip', icon: DollarSign, iconName: 'DollarSign', label: 'Pay Slip', labelKey: 'nav.paySlip', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-pay-sheet', to: '/reports/pay-sheet', icon: DollarSign, iconName: 'DollarSign', label: 'Pay Sheet', labelKey: 'nav.paySheet', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-attendance-sheet', to: '/reports/attendance-sheet', icon: ClipboardList, iconName: 'ClipboardList', label: 'Attendance Sheet', labelKey: 'nav.attendanceSheet', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-payment-advice', to: '/reports/payment-advice', icon: DollarSign, iconName: 'DollarSign', label: 'Payment Advice', labelKey: 'nav.paymentAdvice', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-payroll-statement', to: '/reports/payroll-statement', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Statement', labelKey: 'nav.payrollStatement', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-payroll-register', to: '/reports/payroll-register', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Register', labelKey: 'nav.payrollRegister', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-attendance-register', to: '/reports/attendance-register', icon: ClipboardList, iconName: 'ClipboardList', label: 'Attendance Register', labelKey: 'nav.attendanceRegister', permission: 'Salary Sheets', hidden: true },
      { id: 'rep-employee-profile', to: '/reports/employee-profile', icon: Users, iconName: 'Users', label: 'Employee Profile', labelKey: 'nav.employeeProfile', permission: 'Employees', hidden: true },
      { id: 'rep-employee-head-count', to: '/reports/employee-head-count', icon: Users, iconName: 'Users', label: 'Employee Head Count', labelKey: 'nav.employeeHeadCount', permission: 'Employees', hidden: true },
      { id: 'rep-group-summary', to: '/reports/group-summary', icon: BookOpen, iconName: 'BookOpen', label: 'Group Summary', labelKey: 'nav.groupSummary', permission: 'Ledgers', hidden: true },
      { id: 'rep-stock-query', to: '/reports/stock-query', icon: Package, iconName: 'Package', label: 'Stock Query', labelKey: 'nav.stockQuery', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-movement', to: '/reports/movement', icon: Package, iconName: 'Package', label: 'Movement Analysis', labelKey: 'nav.movementAnalysis', feature: 'inv', permission: 'Items', hidden: true },
      { id: 'rep-cash-bank', to: '/reports/cash-bank', icon: BookOpen, iconName: 'BookOpen', label: 'Cash/Bank Books', labelKey: 'nav.cashBankBooks', permission: 'Ledgers', hidden: true },
      { id: 'rep-stock-item', to: '/reports/stock-item', icon: Package, iconName: 'Package', label: 'Stock Item', labelKey: 'nav.stockItem', feature: 'inv', permission: 'Items', hidden: true },
    ]
  },
  {
    id: 'group-account-books',
    group: 'Account Books',
    groupKey: 'nav.accountBooks',
    hidden: true,
    items: [
      { id: 'rep-cash-bank-sub', to: '/reports/cash-bank', icon: BookOpen, iconName: 'BookOpen', label: 'Cash/Bank Books', labelKey: 'nav.cashBankBooks', permission: 'Ledgers' },
      { id: 'rep-ledger-sub', to: '/reports/ledger', icon: ClipboardList, iconName: 'ClipboardList', label: 'Ledger', labelKey: 'nav.ledger', permission: 'Ledgers' },
      { id: 'rep-group-summary-sub', to: '/reports/group-summary', icon: BookOpen, iconName: 'BookOpen', label: 'Group Summary', labelKey: 'nav.groupSummary', permission: 'Ledgers' },
      { id: 'rep-group-voucher-sub', to: '/reports/group-voucher', icon: BookOpen, iconName: 'BookOpen', label: 'Group Voucher', labelKey: 'nav.groupVoucher', permission: 'Vouchers' },
      { id: 'rep-contra-register-sub', to: '/reports/contra-register', icon: BookOpen, iconName: 'BookOpen', label: 'Contra Register', labelKey: 'nav.contraRegister', permission: 'Vouchers' },
      { id: 'rep-payment-register-sub', to: '/reports/payment-register', icon: BookOpen, iconName: 'BookOpen', label: 'Payment Register', labelKey: 'nav.paymentRegister', permission: 'Vouchers' },
      { id: 'rep-receipt-register-sub', to: '/reports/receipt-register', icon: BookOpen, iconName: 'BookOpen', label: 'Receipt Register', labelKey: 'nav.receiptRegister', permission: 'Vouchers' },
      { id: 'rep-sales-register-sub', to: '/reports/sales-register', icon: BookOpen, iconName: 'BookOpen', label: 'Sales Register', labelKey: 'nav.salesRegister', permission: 'Vouchers' },
      { id: 'rep-purchase-register-sub', to: '/reports/purchase-register', icon: BookOpen, iconName: 'BookOpen', label: 'Purchase Register', labelKey: 'nav.purchaseRegister', permission: 'Vouchers' },
      { id: 'rep-journal-register-sub', to: '/reports/journal-register', icon: BookOpen, iconName: 'BookOpen', label: 'Journal Register', labelKey: 'nav.journalRegister', permission: 'Vouchers' },
    ]
  },
  {
    id: 'group-statement-of-inventory',
    group: 'Statement of Inventory',
    groupKey: 'nav.statementOfInventory',
    hidden: true,
    items: [
      { id: 'rep-stock-query-sub', to: '/reports/stock-query', icon: Package, iconName: 'Package', label: 'Stock Query', labelKey: 'nav.stockQuery', feature: 'inv', permission: 'Items' },
      { id: 'rep-movement-sub', to: '/reports/movement', icon: Package, iconName: 'Package', label: 'Movement Analysis', labelKey: 'nav.movementAnalysis', feature: 'inv', permission: 'Items' },
      { id: 'rep-ageing-analysis-sub', to: '/reports/ageing-analysis', icon: Activity, iconName: 'Activity', label: 'Ageing Analysis', labelKey: 'nav.ageingAnalysis', feature: 'inv', permission: 'Items' },
    ]
  },
  {
    id: 'group-statement-of-account',
    group: 'Statement of Account',
    groupKey: 'nav.statementOfAccount',
    hidden: true,
    items: [
      { id: 'rep-statistics-sub', to: '/reports/statistics', icon: Activity, iconName: 'Activity', label: 'Statistics', labelKey: 'nav.statistics', permission: 'Dashboard' },
    ]
  },
  {
    id: 'group-inventory-books',
    group: 'Inventory Books',
    groupKey: 'nav.inventoryBooks',
    hidden: true,
    items: [
      { id: 'rep-stock-item-sub', to: '/reports/stock-item', icon: Package, iconName: 'Package', label: 'Stock Item', labelKey: 'nav.stockItem', feature: 'inv', permission: 'Items' },
      { id: 'rep-location-sub', to: '/reports/location', icon: MapPin, iconName: 'MapPin', label: 'Location', labelKey: 'nav.location', feature: 'inv', permission: 'Items' },
      { id: 'rep-stock-group-summary-sub', to: '/reports/stock-group-summary', icon: Package, iconName: 'Package', label: 'Stock Group Summary', labelKey: 'nav.stockGroupSummary', feature: 'inv', permission: 'Items' },
      { id: 'rep-stock-category-summary-sub', to: '/reports/stock-category-summary', icon: Package, iconName: 'Package', label: 'Stock Category Summary', labelKey: 'nav.stockCategorySummary', feature: 'inv', permission: 'Items' },
      { id: 'rep-stock-transfer-register-sub', to: '/reports/stock-transfer-register', icon: Package, iconName: 'Package', label: 'Stock Transfer & Journal Register', labelKey: 'nav.stockTransferRegister', feature: 'inv', permission: 'Items' },
      { id: 'rep-physical-stock-register-sub', to: '/reports/physical-stock-register', icon: Package, iconName: 'Package', label: 'Physical Stock Register', labelKey: 'nav.physicalStockRegister', feature: 'inv', permission: 'Items' },
    ]
  },
  {
    id: 'group-payroll-reports',
    group: 'Payroll Reports',
    groupKey: 'nav.payrollReports',
    hidden: true,
    items: [
      { id: 'rep-pay-slip-sub', to: '/reports/pay-slip', icon: DollarSign, iconName: 'DollarSign', label: 'Pay Slip', labelKey: 'nav.paySlip', permission: 'Salary Sheets' },
      { id: 'rep-pay-sheet-sub', to: '/reports/pay-sheet', icon: DollarSign, iconName: 'DollarSign', label: 'Pay Sheet', labelKey: 'nav.paySheet', permission: 'Salary Sheets' },
      { id: 'rep-attendance-sheet-sub', to: '/reports/attendance-sheet', icon: ClipboardList, iconName: 'ClipboardList', label: 'Attendance Sheet', labelKey: 'nav.attendanceSheet', permission: 'Salary Sheets' },
      { id: 'rep-payment-advice-sub', to: '/reports/payment-advice', icon: DollarSign, iconName: 'DollarSign', label: 'Payment Advice', labelKey: 'nav.paymentAdvice', permission: 'Salary Sheets' },
      { id: 'rep-payroll-statement-sub', to: '/reports/payroll-statement', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Statement', labelKey: 'nav.payrollStatement', permission: 'Salary Sheets' },
      { id: 'rep-payroll-register-sub', to: '/reports/payroll-register', icon: DollarSign, iconName: 'DollarSign', label: 'Payroll Register', labelKey: 'nav.payrollRegister', permission: 'Salary Sheets' },
      { id: 'rep-attendance-register-sub', to: '/reports/attendance-register', icon: ClipboardList, iconName: 'ClipboardList', label: 'Attendance Register', labelKey: 'nav.attendanceRegister', permission: 'Salary Sheets' },
      { id: 'rep-employee-profile-sub', to: '/reports/employee-profile', icon: Users, iconName: 'Users', label: 'Employee Profile', labelKey: 'nav.employeeProfile', permission: 'Employees' },
      { id: 'rep-employee-head-count-sub', to: '/reports/employee-head-count', icon: Users, iconName: 'Users', label: 'Employee Head Count', labelKey: 'nav.employeeHeadCount', permission: 'Employees' },
    ]
  },
  {
    id: 'group-exception-reports',
    group: 'Exception Reports',
    groupKey: 'nav.exceptionReports',
    hidden: true,
    items: [
      { id: 'rep-negative-ledger-sub', to: '/reports/negative-ledger', icon: AlertCircle, iconName: 'AlertCircle', label: 'Negative Ledger', labelKey: 'nav.negativeLedger', permission: 'Ledgers' },
      { id: 'rep-negative-stock-sub', to: '/reports/negative-stock', icon: AlertCircle, iconName: 'AlertCircle', label: 'Negative Stock', labelKey: 'nav.negativeStock', feature: 'inv', permission: 'Items' },
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
