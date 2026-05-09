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

export function ensureDate(date: any): Date {
  if (!date) return new Date();
  
  // Handle Firestore Timestamp
  if (date && typeof date.toDate === 'function') {
    return date.toDate();
  }
  
  // Handle Firestore-like object { seconds, nanoseconds }
  if (date && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000);
  }

  if (date instanceof Date) {
    return date;
  }

  if (typeof date === 'number') {
    return new Date(date);
  }

  if (typeof date === 'string') {
    // Attempt local parse first if YYYY-MM-DD to avoid UTC shift
    const parts = date.split(/[-/]/);
    if (parts.length === 3) {
      const p0 = Number(parts[0]);
      const p1 = Number(parts[1]);
      const p2 = Number(parts[2]);
      if (parts[0].length === 4) return new Date(p0, p1 - 1, p2); // YYYY-MM-DD
      if (parts[2].length === 4) return new Date(p2, p1 - 1, p0); // DD-MM-YYYY
    }
    const d = new Date(date);
    if (!isNaN(d.getTime())) return d;
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
  const mType = (
    item.movement_type || 
    item.m_type || 
    item.type || 
    (item.v_type?.toLowerCase() === 'sales' ? 'outward' : 
     ['purchase', 'receipt note', 'delivery note'].includes(item.v_type?.toLowerCase()) ? 
       (item.v_type.toLowerCase().includes('delivery') ? 'outward' : 'inward') : 
     'inward')
  ).toString().toLowerCase();

  return (mType === 'out' || mType === 'outward') ? 'outward' : 'inward';
}
