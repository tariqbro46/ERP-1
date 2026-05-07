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
