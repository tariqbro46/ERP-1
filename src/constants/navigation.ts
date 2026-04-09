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
  feature?: string;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  permission?: string;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV_ITEMS: NavGroup[] = [
  {
    group: 'Home',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', permission: 'Dashboard' },
    ]
  },
  {
    group: 'Masters',
    items: [
      { to: '/accounts/ledgers/new', icon: UserPlus, label: 'Create Ledger', permission: 'Ledgers' },
      { to: '/inventory/items/new', icon: Plus, label: 'Create Item', feature: 'inv', permission: 'Items' },
      { to: '/inventory/godowns', icon: MapPin, label: 'Godowns', feature: 'inv', permission: 'Items' },
      { to: '/employees', icon: Users, label: 'Employee Master', permission: 'Employees' },
      { to: '/accounts', icon: Database, label: 'Chart of Accounts', permission: 'Ledgers' },
      { to: '/inventory/items', icon: Package, label: 'Item Master', feature: 'inv', permission: 'Items' },
    ]
  },
  {
    group: 'Transactions',
    items: [
      { to: '/vouchers/new', icon: FileText, label: 'Voucher Entry', permission: 'Vouchers' },
    ]
  },
  {
    group: 'Payroll',
    items: [
      { to: '/payroll', icon: DollarSign, label: 'Payroll Management', permission: 'Salary Sheets' },
    ]
  },
  {
    group: 'Production',
    items: [
      { to: '/production/orders', icon: Printer, label: 'Order Management', permission: 'orders' },
      { to: '/production/machines', icon: Cpu, label: 'Machine Management', permission: 'machines' },
      { to: '/production/reports', icon: BarChart3, label: 'Production Reports', permission: 'orders' },
    ]
  },
  {
    group: 'Reports',
    items: [
      { to: '/reports/daybook', icon: BookOpen, label: 'Daybook', permission: 'Vouchers' },
      { to: '/reports/balance-sheet', icon: Scale, label: 'Balance Sheet', permission: 'Ledgers' },
      { to: '/reports/trial-balance', icon: ClipboardList, label: 'Trial Balance', permission: 'Ledgers' },
      { to: '/reports/pl', icon: TrendingUp, label: 'Profit & Loss', permission: 'Ledgers' },
      { to: '/reports/ratios', icon: Activity, label: 'Ratio Analysis', permission: 'Dashboard' },
      { to: '/reports/financial-insights', icon: TrendingUp, label: 'Financial Insights', permission: 'Dashboard' },
      { to: '/reports/stock', icon: Package, label: 'Stock Summary', feature: 'inv', permission: 'Items' },
      { to: '/reports/ledger', icon: ClipboardList, label: 'Ledger Statement', permission: 'Ledgers' },
      { to: '/reports/sales-performance', icon: Award, label: 'Sales Performance', permission: 'Employees' },
    ]
  },
  {
    group: 'Settings',
    items: [
      { to: '/settings/company', icon: Building2, label: 'Company Info' },
      { to: '/settings/ui', icon: Database, label: 'UI Customization' },
      { to: '/settings/vouchers', icon: FileText, label: 'Voucher Settings' },
      { to: '/settings/print', icon: Printer, label: 'Print Settings' },
      { to: '/settings/features', icon: Database, label: 'F11 Features' },
      { to: '/settings/security', icon: Shield, label: 'Security' },
      { to: '/settings/notifications', icon: BookOpen, label: 'Notifications' },
      { to: '/settings/whatsapp', icon: BookOpen, label: 'WhatsApp Templates' },
    ]
  },
  {
    group: 'Utilities',
    items: [
      { to: '/companies', icon: Building2, label: 'Company Management', adminOnly: true },
      { to: '/notes', icon: StickyNote, label: 'Notes / Memo' },
      { to: '/users', icon: Users, label: 'User Management', adminOnly: true },
      { to: '/founder', icon: Shield, label: 'Founder Panel', superAdminOnly: true },
    ]
  }
];

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Dashboard',
  '/accounts/ledgers/new': 'Create Ledger',
  '/inventory/items/new': 'Create Item',
  '/inventory/godowns': 'Godown Master',
  '/employees': 'Employee Master',
  '/accounts': 'Chart of Accounts',
  '/inventory/items': 'Item Master',
  '/vouchers/new': 'Voucher Entry',
  '/payroll': 'Payroll Management',
  '/reports/daybook': 'Daybook',
  '/reports/balance-sheet': 'Balance Sheet',
  '/reports/trial-balance': 'Trial Balance',
  '/reports/pl': 'Profit & Loss',
  '/reports/ratios': 'Ratio Analysis',
  '/reports/financial-insights': 'Financial Insights',
  '/reports/stock': 'Stock Summary',
  '/reports/ledger': 'Ledger Statement',
  '/reports/sales-performance': 'Sales Performance',
  '/production/orders': 'Order Management',
  '/production/machines': 'Machine Management',
  '/production/reports': 'Production Reports',
  '/notes': 'Notes / Memo',
  '/companies': 'Company Management',
  '/users': 'User Management',
  '/founder': 'Founder Panel',
  '/settings': 'Settings',
  '/settings/company': 'Company Information',
  '/settings/ui': 'UI Customization',
  '/settings/vouchers': 'Voucher Settings',
  '/settings/print': 'Print Settings',
  '/settings/features': 'F11 Features',
  '/settings/security': 'Security Settings',
  '/settings/notifications': 'Notification Settings',
  '/settings/whatsapp': 'WhatsApp Templates',
};
