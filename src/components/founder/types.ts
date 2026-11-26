import { Company } from '../../types';
import { format } from 'date-fns';
import { ensureDate } from '../../lib/utils';

export type FounderMainView =
  | 'tenants'
  | 'users'
  | 'billing'
  | 'observability'
  | 'heroCms'
  | 'system'
  | 'appBranding';

export interface CompanyStats extends Company {
  userCount: number;
  lastActivity?: any;
  voucherCount: number;
  ledgerCount: number;
  itemCount: number;
  creatorEmail?: string;
  quotaResetRequested?: boolean;
  quotaResetRequestedBy?: string;
}

export interface QuotaModalData {
  isOpen: boolean;
  requestId?: string;
  companyId: string;
  companyName: string;
  requestedBy?: string;
  requestedByEmail?: string;
  createdAtStr?: string;
  currentLimit: number;
  currentUsed: number;
  newLimit: number;
  resetUsage: boolean;
}

export interface ProposalFixModalState {
  isOpen: boolean;
  logId: string;
  logMessage: string;
  componentName?: string;
  path?: string;
  severity?: string;
  stack?: string;
  metadata?: any;
  assembledPrompt: string;
}

export function safeFormatDate(date: any, formatStr: string): string {
  try {
    if (!date) return 'N/A';
    const d = ensureDate(date);
    if (isNaN(d.getTime())) return 'N/A';
    return format(d, formatStr);
  } catch {
    return 'N/A';
  }
}
