import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, symbol: string = '৳'): string {
  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `${symbol}${formatted}`;
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatQuantity(amount: number, unit?: string): string {
  const isPcs = unit?.toLowerCase() === 'pcs' || unit?.toLowerCase() === 'pc' || unit?.toLowerCase() === 'nos';
  return new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 0,
    maximumFractionDigits: isPcs ? 0 : 2,
  }).format(amount || 0);
}

/**
 * Formats a voucher number for display.
 * If empty or matches auto-generated placeholder format (e.g. VCH-JsnR5, VCH-kZtKM),
 * cleanly returns '-' as requested.
 */
export function formatVoucherNo(vNo?: string | null): string {
  if (!vNo) return '-';
  const trimmed = String(vNo).trim();
  if (!trimmed || trimmed === '-' || trimmed.toLowerCase() === 'n/a' || trimmed.toLowerCase() === 'undefined' || trimmed.toLowerCase() === 'null') {
    return '-';
  }
  // Filter out any auto-generated random ID prefixes like VCH-JsnR5 or VCH-kZtKM
  if (/^vch[-_][a-z0-9]{4,10}$/i.test(trimmed)) {
    return '-';
  }
  return trimmed;
}

export function ensureDate(date: any): Date {
  if (!date) return new Date();
  
  // Handle Firestore Timestamp
  if (date && typeof date.toDate === 'function') {
    const d = date.toDate();
    if (d instanceof Date && !isNaN(d.getTime())) return d;
    return new Date();
  }
  
  // Handle Firestore-like object { seconds, nanoseconds }
  if (date && typeof date.seconds === 'number') {
    const d = new Date(date.seconds * 1000);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  }

  if (date instanceof Date) {
    if (!isNaN(date.getTime())) return date;
    return new Date();
  }

  if (typeof date === 'number') {
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d;
    return new Date();
  }

  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return new Date();

    // 1. Strict YYYY-MM-DD (with optional delimiters - / .) to avoid UTC shift
    const ymdMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
    if (ymdMatch) {
      const year = Number(ymdMatch[1]);
      const month = Number(ymdMatch[2]) - 1;
      const day = Number(ymdMatch[3]);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // 2. Strict DD-MM-YYYY or DD-MM-YY
    const dmyMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/.exec(trimmed);
    if (dmyMatch) {
      const day = Number(dmyMatch[1]);
      const month = Number(dmyMatch[2]) - 1;
      let rawYear = Number(dmyMatch[3]);
      let year = rawYear;
      if (rawYear < 50) year = 2000 + rawYear;
      else if (rawYear < 100) year = 1900 + rawYear;
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d;
    }

    // 3. Full ISO timestamp (e.g. 2026-05-15T14:30:00Z) or standard date string
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) return d;

    // Fallback for invalid string
    return new Date();
  }
  
  return new Date();
}

export function formatToYMD(date: any): string {
  const d = ensureDate(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseEntryDate(dateStr: any, fallback: any): Date {
  if (!dateStr) return ensureDate(fallback);
  
  const d = ensureDate(dateStr);
  // Reset time to midnight local to ensure consistent comparison
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getMovementType(item: any): 'inward' | 'outward' {
  if (!item) return 'inward';
  
  const vType = (item.v_type || '').toString().toLowerCase().trim();
  
  // Specific overrides for movement type field names
  const movement = (
    item.movement_type || 
    item.m_type || 
    item.entry_type ||
    item.type || 
    ''
  ).toString().toLowerCase().trim();

  // 1. Stock Journal consumption & production take top precedence
  if (movement === 'consumption') return 'outward';
  if (movement === 'production') return 'inward';

  // 2. Standard voucher types take top precedence over generic entry strings
  if (['sales', 'delivery note', 'rejection out', 'purchase return', 'material out', 'debit note'].includes(vType)) return 'outward';
  if (['purchase', 'receipt note', 'sales return', 'rejection in', 'material in', 'credit note'].includes(vType)) return 'inward';

  // 3. Explicit movement direction on entry when voucher type is generic/empty
  if (movement === 'outward' || movement === 'out') return 'outward';
  if (movement === 'inward' || movement === 'in') return 'inward';

  // 4. Fallback matching on movement string
  if (['sale', 'sales', 'delivery note', 'rejection out', 'purchase return', 'material out', 'debit note'].includes(movement)) return 'outward';
  if (['purchase', 'receipt note', 'sales return', 'rejection in', 'material in', 'credit note'].includes(movement)) return 'inward';

  // 5. Physical stock adjustment check
  if (vType === 'physical stock' || item.is_physical_snapshot) {
    if (typeof item.adjustment_qty === 'number') {
      return item.adjustment_qty >= 0 ? 'inward' : 'outward';
    }
  }

  // Default fallback
  return 'inward';
}

export function compareInventorySequence(a: any, b: any): number {
  // 1. Midnight local date comparison (for dates themselves)
  const d_a = parseEntryDate(a.date, a.v_createdAt || a.created_at);
  const d_b = parseEntryDate(b.date, b.v_createdAt || b.created_at);
  if (d_a.getTime() !== d_b.getTime()) return d_a.getTime() - d_b.getTime();
  
  // 2. Movement type (Inward viz. Purchase/Inward first, outward viz. Sales/Outward later)
  const mTypeA = a.m_type || getMovementType(a);
  const mTypeB = b.m_type || getMovementType(b);
  if (mTypeA !== mTypeB) {
    return mTypeA === 'inward' ? -1 : 1;
  }

  // 3. Try numeric sort for Ref No (v_no)
  const vNoA = String(a.v_no || '');
  const vNoB = String(b.v_no || '');
  const numA = parseInt(vNoA.replace(/\D/g, '') || '0', 10) || 0;
  const numB = parseInt(vNoB.replace(/\D/g, '') || '0', 10) || 0;
  if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

  // 4. Try auto-serial numbers
  const seqA = a.v_serial_no || a.serial_no || 0;
  const seqB = b.v_serial_no || b.serial_no || 0;
  if (seqA !== seqB) return seqA - seqB;

  // 5. Lexicographical fallback of v_no
  const vNoComp = vNoA.localeCompare(vNoB);
  if (vNoComp !== 0) return vNoComp;

  // 6. Time fallback
  const tsA = ensureDate(a.v_createdAt || a.created_at).getTime();
  const tsB = ensureDate(b.v_createdAt || b.created_at).getTime();
  if (tsA !== tsB) return tsA - tsB;

  // 7. Hard ID fallback
  return (a.id || '').localeCompare(b.id || '');
}

/**
 * Priority for sorting vouchers on the same date in Ledger Reports:
 * 1. Sales & Purchase vouchers come first (invoice creation / primary transactions)
 * 2. Credit Note & Debit Note (adjustments / returns)
 * 3. Receipt & Payment vouchers come next (cash/bank collections & settlements)
 * 4. Contra & Journal
 * 5. Other vouchers
 */
export function getVoucherTypeSortPriority(vType?: string): number {
  if (!vType) return 99;
  const t = vType.trim().toLowerCase();
  if (t === 'sales') return 10;
  if (t === 'purchase') return 11;
  if (t === 'credit note') return 20;
  if (t === 'debit note') return 21;
  if (t === 'receipt') return 30;
  if (t === 'payment') return 31;
  if (t === 'contra') return 40;
  if (t === 'journal') return 50;
  return 60;
}

export function compareLedgerVouchers(a: any, b: any): number {
  const vA = a?.vouchers || a || {};
  const vB = b?.vouchers || b || {};

  const dateA = (vA.v_date || a?.v_date || '').toString();
  const dateB = (vB.v_date || b?.v_date || '').toString();
  const dateComp = dateA.localeCompare(dateB);
  if (dateComp !== 0) return dateComp;

  // Same date: Sales/Purchase first, then Receipt/Payment
  const prioA = getVoucherTypeSortPriority(vA.v_type || a?.v_type);
  const prioB = getVoucherTypeSortPriority(vB.v_type || b?.v_type);
  if (prioA !== prioB) return prioA - prioB;

  // Secondary: Voucher Number numeric comparison
  const noA = (vA.v_no || a?.v_no || '').toString();
  const noB = (vB.v_no || b?.v_no || '').toString();
  const numA = parseInt(noA.replace(/\D/g, '') || '0', 10) || 0;
  const numB = parseInt(noB.replace(/\D/g, '') || '0', 10) || 0;
  if (numA !== numB && numA !== 0 && numB !== 0) return numA - numB;

  const vNoComp = noA.localeCompare(noB, undefined, { numeric: true });
  if (vNoComp !== 0) return vNoComp;

  // Tertiary: Serial number
  const serialA = Number(vA.serial_no || vA.auto_serial_no || a?.serial_no || 0);
  const serialB = Number(vB.serial_no || vB.auto_serial_no || b?.serial_no || 0);
  if (serialA !== serialB) return serialA - serialB;

  // Quaternary: Timestamp if available
  const timeA = vA.createdAt?.seconds || a?.createdAt?.seconds || 0;
  const timeB = vB.createdAt?.seconds || b?.createdAt?.seconds || 0;
  if (timeA !== timeB) return timeA - timeB;

  return (vA.id || a?.id || '').toString().localeCompare((vB.id || b?.id || '').toString());
}

/**
 * Calculates Bangladesh Standard Time (UTC+6) hourly quota slot (0 to 11).
 * Daily quota reset starts at 1:00 PM BST (13:00 BST).
 * 
 * Boundary mappings:
 * - 12:59 PM BST -> slot_11
 * - 1:00 PM BST  -> slot_0
 * - 2:59 PM BST  -> slot_0
 * - 3:00 PM BST  -> slot_1
 * - 12:00 AM BST -> slot_5
 */
export function calculateBstQuotaSlot(dateInput?: Date | number | string): {
  slotKey: string;
  slotIdx: number;
  label: string;
  bstHour: number;
} {
  try {
    const d = dateInput !== undefined ? new Date(dateInput) : new Date();
    const utcMs = d.getTime();
    if (isNaN(utcMs)) {
      return { slotKey: 'slot_0', slotIdx: 0, label: '1 PM', bstHour: 13 };
    }
    const bstMs = utcMs + 6 * 60 * 60 * 1000;
    const bstDate = new Date(bstMs);
    const bstHour = bstDate.getUTCHours();
    
    // Quota reset happens at 13:00 (1 PM BST)
    // slot = floor(((bstHour - 13 + 24) % 24) / 2)
    const slotIdx = Math.floor(((bstHour - 13 + 24) % 24) / 2);
    const slotLabels = ['1 PM', '3 PM', '5 PM', '7 PM', '9 PM', '11 PM', '1 AM', '3 AM', '5 AM', '7 AM', '9 AM', '11 AM'];
    return {
      slotKey: `slot_${slotIdx}`,
      slotIdx,
      label: slotLabels[slotIdx] || `slot_${slotIdx}`,
      bstHour
    };
  } catch (e) {
    return { slotKey: 'slot_0', slotIdx: 0, label: '1 PM', bstHour: 13 };
  }
}

