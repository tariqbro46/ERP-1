export interface Feature {
  id: string;
  label: string;
  description?: string;
  subscriptionFeatureId?: string; // The feature ID in the subscription plan (e.g., 'inv', 'pay', 'ord')
}

export interface FeatureCategory {
  id: string;
  label: string;
  features: Feature[];
}

export const APP_FEATURES: FeatureCategory[] = [
  {
    id: 'accounts',
    label: 'Accounts & Finance',
    features: [
      { id: 'acc_masters_create', label: 'Create Masters (Ledger/Group)', description: 'Allow creating new ledgers and groups' },
      { id: 'acc_masters_alter', label: 'Alter/Delete Masters', description: 'Allow modifying or deleting existing ledgers and groups' },
      { id: 'acc_vouchers_create', label: 'Create Vouchers', description: 'Allow entry of Payment, Receipt, Journal, etc.' },
      { id: 'acc_vouchers_alter', label: 'Alter/Delete Vouchers', description: 'Allow modifying or deleting existing vouchers' },
      { id: 'acc_reports_view', label: 'View Reports', description: 'Daybook, Trial Balance, Ledger Statements' },
      { id: 'acc_reports_financial', label: 'Financial Statements', description: 'Balance Sheet, Profit & Loss' },
    ]
  },
  {
    id: 'inventory',
    label: 'Inventory Management',
    features: [
      { id: 'inv_masters_create', label: 'Create Inventory Masters', description: 'Stock Items, Units, Godowns', subscriptionFeatureId: 'inv' },
      { id: 'inv_masters_alter', label: 'Alter Inventory Masters', description: 'Modify Stock Items, Godowns', subscriptionFeatureId: 'inv' },
      { id: 'inv_vouchers_create', label: 'Inventory Transactions', description: 'Stock Journal, Physical Stock', subscriptionFeatureId: 'inv' },
      { id: 'inv_reports_view', label: 'Inventory Reports', description: 'Stock Summary, Item Reports, Movement Analysis', subscriptionFeatureId: 'inv' },
    ]
  },
  {
    id: 'payroll',
    label: 'Payroll & HRM',
    features: [
      { id: 'pay_masters', label: 'Employee & Payhead Management', description: 'Manage Employees, Pay Heads, Salary Structures', subscriptionFeatureId: 'pay' },
      { id: 'pay_transactions', label: 'Attendance & Salary Processing', description: 'Process Monthly Salaries and Attendance', subscriptionFeatureId: 'pay' },
      { id: 'pay_reports', label: 'Payroll Reports', description: 'Salary Sheets, Pay Slips', subscriptionFeatureId: 'pay' },
    ]
  },
  {
    id: 'orders',
    label: 'Order Management',
    features: [
      { id: 'ord_create', label: 'Create Orders', description: 'Receive new printing/sales orders', subscriptionFeatureId: 'ord' },
      { id: 'ord_process', label: 'Process Orders', description: 'Status updates and order tracking', subscriptionFeatureId: 'ord' },
      { id: 'ord_reports', label: 'Order Reports', description: 'Order books and register', subscriptionFeatureId: 'ord' },
    ]
  },
  {
    id: 'production',
    label: 'Manufacturing & Machines',
    features: [
      { id: 'mac_manage', label: 'Machine Management', description: 'Manage printing machines and status', subscriptionFeatureId: 'mac' },
      { id: 'mac_production', label: 'Production Entry', description: 'Convert orders to finished goods', subscriptionFeatureId: 'mac' },
    ]
  },
  {
    id: 'adv_analytics',
    label: 'Advanced Analytics',
    features: [
      { id: 'ana_ratio', label: 'Ratio Analysis', description: 'Financial performance ratios', subscriptionFeatureId: 'adv_reports' },
      { id: 'ana_cashflow', label: 'Cash & Funds Flow', description: 'View flow statements', subscriptionFeatureId: 'adv_reports' },
      { id: 'ana_ageing', label: 'Ageing Analysis', description: 'Stock ageing reports', subscriptionFeatureId: 'adv_reports' },
      { id: 'ana_insights', label: 'AI Financial Insights', description: 'Generate AI-driven business insights', subscriptionFeatureId: 'insights' },
    ]
  }
];

export const AVAILABLE_FEATURES = APP_FEATURES.flatMap(cat => cat.features);
