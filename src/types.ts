export type VoucherType = 'Sales' | 'Purchase' | 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note';
export type UserRole = 'Founder' | 'Marketing Manager' | 'Admin' | 'Manager' | 'Staff';

export interface Company {
  id: string;
  name: string;
  logo_url?: string;
  vat_no?: string;
  base_currency: string;
  financial_year_start: string;
  financial_year_end: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  planType: 'monthly' | 'yearly' | 'free';
  expiryDate: string;
  isAccessEnabled: boolean;
  createdBy?: string;
  ownerId?: string;
}

export interface Ledger {
  id: string;
  name: string;
  group_id: string;
  group_name: string;
  nature: 'Asset' | 'Liability' | 'Income' | 'Expense';
  opening_balance: number;
  current_balance: number;
  vat_no?: string;
  currency?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  bank_account_no?: string;
  bank_name?: string;
}

export interface Voucher {
  id: string;
  v_type: VoucherType;
  v_no: string;
  v_date: string;
  narration: string;
  total_amount: number;
  tax_amount?: number;
  discount_amount?: number;
  currency?: string;
  exchange_rate?: number;
  salesperson_id?: string;
  entries: VoucherEntry[];
  inventory?: InventoryEntry[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  target_amount?: number;
  permissions?: string[]; // List of feature labels or route paths
}

export interface VoucherEntry {
  ledger_id: string;
  ledger_name: string;
  debit: number;
  credit: number;
}

export interface InventoryEntry {
  item_id: string;
  item_name?: string;
  qty: number;
  free_qty?: number;
  rate: number;
  amount: number;
  discount_percent?: number;
  tax_percent?: number;
  batch_no?: string;
  expiry_date?: string;
  godown_id?: string;
}

export interface Item {
  id: string;
  name: string;
  unit_name: string;
  unit_id?: string;
  part_no?: string;
  current_stock: number;
  avg_cost: number;
  opening_qty?: number;
  opening_rate?: number;
  barcode?: string;
  category?: string;
  low_stock_threshold?: number;
  tax_percent?: number;
  scheme_qty?: number;
  scheme_free_qty?: number;
}

export interface Employee {
  id: string;
  employeeId?: string; // Custom ID like EMP001
  companyId: string;
  name: string;
  designation: string;
  department?: string;
  joiningDate: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  contactNumber?: string;
  phone?: string; // Alias for contactNumber if needed
  email?: string;
  address?: string;
  status: 'Active' | 'Inactive';
  createdAt: any;
  updatedAt?: any;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system_update' | 'announcement';
  targetType: 'all' | 'company' | 'user';
  targetId?: string; // companyId or userId
  scheduledAt?: any; // timestamp
  sentAt?: any; // timestamp
  status: 'draft' | 'scheduled' | 'sent';
  readBy?: string[]; // Array of user IDs who have read this notification
  createdBy: string;
  createdAt: any;
}

export interface SalarySheet {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  month: string; // YYYY-MM
  basicSalary: number;
  allowances: number;
  deductions: number;
  advanceDeduction: number;
  loanDeduction: number;
  netSalary: number;
  paymentStatus: 'Pending' | 'Paid';
  paymentDate?: string;
  paymentMethod?: string;
  voucherId?: string; // Reference to the payment voucher
  createdAt: any;
}

export interface Advance {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  reason?: string;
  status: 'Pending' | 'Deducted' | 'Cancelled';
  deductedInMonth?: string; // YYYY-MM
  voucherId?: string;
  createdAt: any;
}

export interface Loan {
  id: string;
  companyId: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  date: string;
  interestRate?: number;
  totalRepayable: number;
  monthlyEMI: number;
  remainingBalance: number;
  status: 'Active' | 'Closed' | 'Cancelled';
  voucherId?: string;
  createdAt: any;
}

export type OrderStatus = 'Pending' | 'Printing' | 'Completed' | 'Delivered' | 'Cancelled';
export type PrintType = 'Analog' | 'Digital';
export type OrderType = 'Production' | 'Sales';

export interface OrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  price: number; // Negotiated Price
  printDesign?: string;
  printType?: PrintType;
  isDoubleSided?: boolean;
  machineId?: string;
  machineName?: string;
}

export interface PrintingOrder {
  id: string;
  companyId: string;
  clientId: string;
  clientName: string;
  orderType: OrderType;
  items: OrderItem[];
  // Legacy fields for backward compatibility during migration
  itemId?: string;
  itemName?: string;
  printDesign?: string;
  quantity?: number;
  price?: number;
  printType?: PrintType;
  isDoubleSided?: boolean;
  machineId?: string;
  machineName?: string;
  
  deliveryDate: string;
  deliveryTime?: string;
  deliveryLocation: string;
  receivedBy?: string;
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  isConvertedToFinishGoods?: boolean;
  isConvertedToSalesVoucher?: boolean;
  createdAt: any;
  updatedAt?: any;
}

export interface ReportConfig {
  showNarration: boolean;
  format: 'Condensed' | 'Detailed';
  showInventoryDetails: boolean;
  showStockDescriptions: boolean;
  showPaymentMode: boolean;
  showBankDetails: boolean;
  showCostCentre: boolean;
  showEnteredBy: boolean;
  ledgerDisplayName: 'Alias (Name)' | 'Alias Only' | 'Name (Alias)' | 'Name Only';
  sortingMethod: 'Alphabetical (A to Z)' | 'Alphabetical (Z to A)' | 'Amount (Decreasing)' | 'Amount (Increasing)' | 'Default' | 'In Sequence of entry' | 'Voucher Number (Ascending)' | 'Voucher Number (Descending)' | 'Voucher Number (Sequence of A - Z)' | 'Voucher Number (Sequence of Z - A)';
  enableStripeView: boolean;
}

export interface CompanySettings {
  companyId: string;
  companyName?: string;
  companyAddress?: string;
  printPhone?: string;
  printEmail?: string;
  printWebsite?: string;
  daybookConfig?: ReportConfig;
  ledgerConfig?: ReportConfig;
}

export interface PrintingMachine {
  id: string;
  companyId: string;
  name: string;
  type: 'Analog' | 'Digital' | 'Both';
  status: 'Idle' | 'Busy' | 'Maintenance';
  location?: string; // room/godown/factory
  inChargeId?: string;
  inChargeName?: string;
  operatorId?: string;
  operatorName?: string;
  assistantOperatorId?: string;
  assistantOperatorName?: string;
  laborerIds?: string[];
  laborerNames?: string[];
  currentOrderId?: string;
  currentOrderName?: string;
  lastMaintenance?: string;
  createdAt: any;
}
