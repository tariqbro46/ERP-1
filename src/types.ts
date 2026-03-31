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
  companyId: string;
  name: string;
  designation: string;
  department?: string;
  joiningDate: string;
  basicSalary: number;
  allowances?: number;
  deductions?: number;
  contactNumber?: string;
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
