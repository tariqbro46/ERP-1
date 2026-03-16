export type VoucherType = 'Sales' | 'Purchase' | 'Payment' | 'Receipt' | 'Contra' | 'Journal' | 'Credit Note' | 'Debit Note';
export type UserRole = 'Admin' | 'Manager' | 'Staff';

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
  entries: VoucherEntry[];
  inventory?: InventoryEntry[];
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
  current_stock: number;
  avg_cost: number;
  opening_qty?: number;
  opening_rate?: number;
  barcode?: string;
  category?: string;
  low_stock_threshold?: number;
  tax_percent?: number;
}
