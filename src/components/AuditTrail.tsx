import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { erpService } from '../services/erpService';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  RefreshCw, 
  Printer, 
  Download, 
  Eye, 
  Plus, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  User, 
  FileText, 
  ChevronRight, 
  X,
  Copy,
  Check,
  Building,
  Info,
  History,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Layers,
  MinusCircle,
  Columns2,
  Rows3,
  Table as TableIcon,
  ArrowDown,
  Code
} from 'lucide-react';
import { cn, formatCurrency, formatNumber } from '../lib/utils';

interface AuditLogEntry {
  id: string;
  companyId: string;
  userId: string;
  userName?: string;
  userRole?: string;
  userEmail?: string;
  action: string;
  details: string;
  entity_type?: string;
  entity_id?: string;
  voucher_no?: string | number;
  old_voucher_no?: string | number;
  new_voucher_no?: string | number;
  v_type?: string;
  old_v_type?: string;
  new_v_type?: string;
  amount?: number;
  before_amount?: number;
  after_amount?: number;
  difference_amount?: number;
  old_amount?: number;
  new_amount?: number;
  old_date?: string;
  new_date?: string;
  party_name?: string;
  old_party_name?: string;
  new_party_name?: string;
  old_narration?: string;
  new_narration?: string;
  status?: string;
  old_status?: string;
  new_status?: string;
  createdAt: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

export type DiffChangeType = 'added' | 'removed' | 'updated' | 'unchanged';

export interface FieldDiffItem {
  id: string;
  label: string;
  labelBn: string;
  beforeValue: any;
  afterValue: any;
  status: DiffChangeType;
  isCurrency?: boolean;
  isDate?: boolean;
}

interface HistoryComparison {
  isUpdate: boolean;
  isCreate: boolean;
  isDelete: boolean;
  hasHistory: boolean;
  beforeAmount?: number;
  afterAmount?: number;
  difference?: number;
  oldDate?: string;
  newDate?: string;
  fields: FieldDiffItem[];
  counts: {
    added: number;
    removed: number;
    updated: number;
    unchanged: number;
    total: number;
  };
}

const getLogHistoryComparison = (log: AuditLogEntry | null, allLogs: AuditLogEntry[]): HistoryComparison => {
  if (!log) {
    return {
      isUpdate: false,
      isCreate: false,
      isDelete: false,
      hasHistory: false,
      fields: [],
      counts: { added: 0, removed: 0, updated: 0, unchanged: 0, total: 0 }
    };
  }

  const actLower = (log.action || '').toLowerCase();
  const detLower = (log.details || '').toLowerCase();

  const isCreate = actLower.includes('creat') || actLower.includes('insert') || actLower.includes('new');
  const isDelete = actLower.includes('delet') || actLower.includes('remov') || actLower.includes('void');
  const isUpdate = actLower.includes('updat') || actLower.includes('modif') || actLower.includes('edit') || detLower.includes('modif');

  // Amount extraction
  let beforeAmount: number | undefined = 
    log.before_amount ?? log.old_amount ?? log.metadata?.before_amount ?? log.metadata?.old_amount;
  let afterAmount: number | undefined = 
    log.after_amount ?? log.new_amount ?? log.amount ?? log.metadata?.after_amount ?? log.metadata?.new_amount;

  const oldDate = log.old_date || log.metadata?.old_date;
  const newDate = log.new_date || log.metadata?.new_date;

  // Extract from details if "Before: X, After: Y"
  if (beforeAmount === undefined && log.details) {
    const beforeMatch = log.details.match(/before:\s*৳?\s*([0-9,.]+)/i);
    const afterMatch = log.details.match(/after:\s*৳?\s*([0-9,.]+)/i);
    if (beforeMatch && afterMatch) {
      beforeAmount = parseFloat(beforeMatch[1].replace(/,/g, ''));
      afterAmount = parseFloat(afterMatch[1].replace(/,/g, ''));
    }
  }

  // Identify entity voucher_no
  const logVNo = log.voucher_no || 
                 log.metadata?.voucher_no || 
                 log.details?.match(/#([a-zA-Z0-9_-]+)/)?.[1] || 
                 log.entity_id;

  // Search candidate prior log if update or delete
  let candidatePriorLog: AuditLogEntry | undefined;
  if ((isUpdate || isDelete) && allLogs && allLogs.length > 0) {
    const logTime = new Date(log.createdAt || log.timestamp || 0).getTime();
    
    const candidatePriorLogs = allLogs.filter(other => {
      if (other.id === log.id) return false;
      const otherTime = new Date(other.createdAt || other.timestamp || 0).getTime();
      if (logTime && otherTime && otherTime > logTime) return false;

      const otherVNo = other.voucher_no || 
                       other.metadata?.voucher_no || 
                       other.details?.match(/#([a-zA-Z0-9_-]+)/)?.[1] || 
                       other.entity_id;

      const matchId = (log.entity_id && other.entity_id && log.entity_id === other.entity_id);
      const matchVNo = (logVNo && otherVNo && String(logVNo) === String(otherVNo));

      return matchId || matchVNo;
    });

    if (candidatePriorLogs.length > 0) {
      candidatePriorLogs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      candidatePriorLog = candidatePriorLogs[0];
      if (beforeAmount === undefined) {
        beforeAmount = candidatePriorLog.after_amount ?? candidatePriorLog.amount;
      }
    }
  }

  // Fallback for afterAmount from details or amount
  if (afterAmount === undefined && log.amount !== undefined) {
    afterAmount = log.amount;
  }
  if (afterAmount === undefined && log.details) {
    const amtMatch = log.details.match(/amount:\s*৳?\s*([0-9,.]+)/i);
    if (amtMatch) {
      afterAmount = parseFloat(amtMatch[1].replace(/,/g, ''));
    }
  }

  if (isCreate) {
    beforeAmount = undefined;
    if (afterAmount === undefined && log.amount !== undefined) {
      afterAmount = log.amount;
    }
  } else if (isDelete) {
    if (beforeAmount === undefined && log.amount !== undefined) {
      beforeAmount = log.amount;
    }
    afterAmount = undefined;
  }

  // Build field diff items
  const fields: FieldDiffItem[] = [];

  const addField = (
    id: string,
    label: string,
    labelBn: string,
    beforeVal: any,
    afterVal: any,
    options: { isCurrency?: boolean; isDate?: boolean; defaultStatus?: DiffChangeType } = {}
  ) => {
    let status: DiffChangeType = options.defaultStatus || 'unchanged';

    const hasBefore = beforeVal !== undefined && beforeVal !== null && beforeVal !== '' && beforeVal !== '—';
    const hasAfter = afterVal !== undefined && afterVal !== null && afterVal !== '' && afterVal !== '—';

    if (!options.defaultStatus) {
      if (isCreate) {
        status = hasAfter ? 'added' : 'unchanged';
      } else if (isDelete) {
        status = hasBefore ? 'removed' : 'unchanged';
      } else if (isUpdate) {
        if (!hasBefore && hasAfter) {
          status = 'added';
        } else if (hasBefore && !hasAfter) {
          status = 'removed';
        } else if (hasBefore && hasAfter) {
          if (options.isCurrency || typeof beforeVal === 'number' || typeof afterVal === 'number') {
            status = Number(beforeVal) !== Number(afterVal) ? 'updated' : 'unchanged';
          } else {
            status = String(beforeVal).trim() !== String(afterVal).trim() ? 'updated' : 'unchanged';
          }
        } else {
          status = 'unchanged';
        }
      } else {
        if (hasBefore && hasAfter && String(beforeVal) !== String(afterVal)) {
          status = 'updated';
        } else if (!hasBefore && hasAfter) {
          status = 'added';
        } else if (hasBefore && !hasAfter) {
          status = 'removed';
        } else {
          status = 'unchanged';
        }
      }
    }

    fields.push({
      id,
      label,
      labelBn,
      beforeValue: beforeVal,
      afterValue: afterVal,
      status,
      isCurrency: options.isCurrency,
      isDate: options.isDate
    });
  };

  // 1. Transaction Amount
  addField(
    'amount',
    'Transaction Amount',
    'লেনদেনের মোট পরিমাণ',
    beforeAmount,
    afterAmount,
    { isCurrency: true }
  );

  // 2. Voucher / Document No
  const beforeVNo = log.old_voucher_no ?? log.metadata?.old_voucher_no ?? candidatePriorLog?.voucher_no ?? (isUpdate ? logVNo : undefined);
  const afterVNo = isDelete ? undefined : (log.new_voucher_no ?? log.voucher_no ?? log.metadata?.voucher_no ?? logVNo);
  addField(
    'voucher_no',
    'Voucher / Document No',
    'ভাউচার / ডকুমেন্ট নং',
    isCreate ? undefined : beforeVNo,
    afterVNo
  );

  // 3. Voucher / Entity Type
  const beforeVType = log.old_v_type ?? log.metadata?.old_v_type ?? candidatePriorLog?.v_type ?? (isUpdate ? (log.v_type || log.entity_type) : undefined);
  const afterVType = isDelete ? undefined : (log.new_v_type ?? log.v_type ?? log.metadata?.v_type ?? log.entity_type);
  addField(
    'v_type',
    'Entry / Voucher Type',
    'এন্ট্রি / ভাউচারের ধরন',
    isCreate ? undefined : beforeVType,
    afterVType
  );

  // 4. Party / Ledger Name
  const beforeParty = log.old_party_name ?? log.metadata?.old_party_name ?? candidatePriorLog?.party_name ?? candidatePriorLog?.metadata?.party_name;
  const afterParty = isDelete ? undefined : (log.new_party_name ?? log.party_name ?? log.metadata?.party_name);
  addField(
    'party_name',
    'Party / Account Ledger',
    'পার্টি / লেজার হিসাব',
    isCreate ? undefined : beforeParty,
    afterParty
  );

  // 5. Transaction Date
  const beforeDateVal = oldDate ?? log.metadata?.old_date ?? candidatePriorLog?.old_date ?? candidatePriorLog?.createdAt?.substring(0, 10);
  const afterDateVal = isDelete ? undefined : (newDate ?? log.metadata?.new_date ?? log.createdAt?.substring(0, 10));
  addField(
    'date',
    'Transaction / Post Date',
    'লেনদেন / রেকর্ডের তারিখ',
    isCreate ? undefined : beforeDateVal,
    afterDateVal,
    { isDate: true }
  );

  // 6. Narration / Note
  const beforeNarration = log.old_narration ?? log.metadata?.old_narration ?? candidatePriorLog?.details;
  const afterNarration = isDelete ? undefined : (log.new_narration ?? log.details ?? log.metadata?.narration);
  addField(
    'narration',
    'Audit Narrative / Note',
    'বিবরণ ও বিবরণী নোট',
    isCreate ? undefined : beforeNarration,
    afterNarration
  );

  // 7. Status / Lifecycle
  const beforeStatus = log.old_status ?? log.metadata?.old_status ?? (candidatePriorLog ? 'Recorded' : undefined);
  const afterStatus = isDelete ? 'Voided / Deleted' : (log.new_status ?? log.metadata?.status ?? (isUpdate ? 'Updated / Active' : 'Posted / Active'));
  addField(
    'status',
    'Record Status',
    'রেকর্ডের স্ট্যাটাস',
    isCreate ? undefined : beforeStatus,
    afterStatus
  );

  const counts = {
    added: fields.filter(f => f.status === 'added').length,
    removed: fields.filter(f => f.status === 'removed').length,
    updated: fields.filter(f => f.status === 'updated').length,
    unchanged: fields.filter(f => f.status === 'unchanged').length,
    total: fields.length
  };

  const hasHistory = isUpdate || isDelete || counts.updated > 0 || (beforeAmount !== undefined && afterAmount !== undefined);
  const difference = (beforeAmount !== undefined && afterAmount !== undefined) ? (afterAmount - beforeAmount) : undefined;

  return {
    isUpdate,
    isCreate,
    isDelete,
    hasHistory,
    beforeAmount,
    afterAmount,
    difference,
    oldDate,
    newDate,
    fields,
    counts
  };
};

export const AuditTrail: React.FC = () => {
  const { user, company: authCompany } = useAuth();
  const { t, language } = useLanguage();

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [company, setCompany] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [datePreset, setDatePreset] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('ALL');

  // Inspection Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [inspectorLayout, setInspectorLayout] = useState<'side-by-side' | 'stacked' | 'diff-table'>('side-by-side');
  const [inspectorFilter, setInspectorFilter] = useState<'all' | 'changed-only'>('all');
  const [showRawPayload, setShowRawPayload] = useState(false);

  // When Audit Record Inspector popup is open, hide all top bars and lock body scroll
  useEffect(() => {
    if (selectedLog) {
      document.body.classList.add('audit-inspector-open');
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setSelectedLog(null);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.classList.remove('audit-inspector-open');
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.classList.remove('audit-inspector-open');
      document.body.style.overflow = '';
    }
  }, [selectedLog]);

  // Manual Audit Note Modal
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [noteCategory, setNoteCategory] = useState('Stock Verification');
  const [submittingNote, setSubmittingNote] = useState(false);

  const isBn = language === 'bn';

  useEffect(() => {
    loadAuditData();
  }, [user?.companyId]);

  const loadAuditData = async (force = false) => {
    if (!user?.companyId) return;
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedLogs, comp] = await Promise.all([
        erpService.getActivityLogs(user.companyId, 150, force),
        typeof erpService.getCompany === 'function'
          ? erpService.getCompany(user.companyId).catch(() => authCompany)
          : Promise.resolve(authCompany)
      ]);

      setCompany(comp || authCompany);

      // If logs are empty, initialize default bootstrap logs for better UX
      if (!fetchedLogs || fetchedLogs.length === 0) {
        const defaultLogs: AuditLogEntry[] = [
          {
            id: 'log_init_01',
            companyId: user.companyId,
            userId: user.uid || 'system',
            userName: user.displayName || 'System Administrator',
            userRole: user.role || 'Admin',
            action: 'System Initialized',
            details: 'Company account created & audit ledger initialized for compliance tracking.',
            entity_type: 'company',
            entity_id: user.companyId,
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
          },
          {
            id: 'log_init_02',
            companyId: user.companyId,
            userId: user.uid || 'system',
            userName: user.displayName || 'Accountant',
            userRole: user.role || 'Admin',
            action: 'Master Synchronized',
            details: 'General ledger chart of accounts and default groups loaded.',
            entity_type: 'ledger',
            createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
          }
        ];
        setLogs(defaultLogs);
      } else {
        setLogs(fetchedLogs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);

    const monthAgo = new Date(now);
    monthAgo.setDate(now.getDate() - 30);

    return logs.filter((log) => {
      // Action Filter
      if (actionFilter !== 'ALL') {
        const act = log.action.toLowerCase();
        if (actionFilter === 'CREATE' && !act.includes('creat') && !act.includes('add')) return false;
        if (actionFilter === 'UPDATE' && !act.includes('updat') && !act.includes('modif')) return false;
        if (actionFilter === 'DELETE' && !act.includes('delet') && !act.includes('cancel') && !act.includes('void')) return false;
        if (actionFilter === 'NOTE' && !act.includes('audit note') && !act.includes('remark')) return false;
      }

      // Entity Filter
      if (entityFilter !== 'ALL') {
        const ent = (log.entity_type || '').toLowerCase();
        if (entityFilter === 'VOUCHER' && ent !== 'voucher') return false;
        if (entityFilter === 'LEDGER' && ent !== 'ledger') return false;
        if (entityFilter === 'ITEM' && ent !== 'item' && ent !== 'inventory') return false;
        if (entityFilter === 'SYSTEM' && ent !== 'company' && ent !== 'system' && ent !== 'security') return false;
      }

      // Date Preset Filter
      if (datePreset !== 'ALL') {
        const logDate = new Date(log.createdAt);
        const logDateStr = log.createdAt ? log.createdAt.split('T')[0] : '';

        if (datePreset === 'TODAY' && logDateStr !== todayStr) return false;
        if (datePreset === 'YESTERDAY' && logDateStr !== yesterdayStr) return false;
        if (datePreset === 'WEEK' && logDate < weekAgo) return false;
        if (datePreset === 'MONTH' && logDate < monthAgo) return false;
      }

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesAction = log.action.toLowerCase().includes(q);
        const matchesDetails = log.details.toLowerCase().includes(q);
        const matchesUser = (log.userName || log.userId || '').toLowerCase().includes(q);
        const matchesVoucher = (log.voucher_no || log.entity_id || '').toString().toLowerCase().includes(q);
        const matchesParty = (log.party_name || '').toLowerCase().includes(q);
        if (!matchesAction && !matchesDetails && !matchesUser && !matchesVoucher && !matchesParty) {
          return false;
        }
      }

      return true;
    });
  }, [logs, actionFilter, entityFilter, datePreset, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    let createdCount = 0;
    let updatedCount = 0;
    let deletedCount = 0;
    let noteCount = 0;
    const userSet = new Set<string>();

    logs.forEach((l) => {
      const act = l.action.toLowerCase();
      if (act.includes('creat') || act.includes('add')) createdCount++;
      else if (act.includes('updat') || act.includes('modif')) updatedCount++;
      else if (act.includes('delet') || act.includes('cancel') || act.includes('void')) deletedCount++;
      else if (act.includes('note') || act.includes('remark')) noteCount++;

      if (l.userId) userSet.add(l.userId);
    });

    return {
      total: logs.length,
      created: createdCount,
      updated: updatedCount,
      deleted: deletedCount,
      notes: noteCount,
      uniqueUsers: userSet.size || 1
    };
  }, [logs]);

  // Submit manual audit note
  const handleSaveAuditNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim() || !user?.companyId) return;

    setSubmittingNote(true);
    try {
      await erpService.logActivity(
        user.companyId,
        user.uid || 'user',
        'Audit Remark Logged',
        `[${noteCategory}] ${noteText.trim()}`,
        'audit_note',
        'note_' + Date.now(),
        {
          category: noteCategory,
          auditor_name: user.displayName || user.email || 'Auditor',
          auditor_role: user.role || 'Admin'
        }
      );

      setNoteText('');
      setIsNoteModalOpen(false);
      await loadAuditData(true);
    } catch (err) {
      console.error('Failed to log audit note:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  // Copy Log ID
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (!filteredLogs.length) return;
    const headers = ['Log ID', 'Timestamp', 'User Name', 'Role', 'Action', 'Module', 'Voucher/Entity No', 'Details', 'Amount'];
    const rows = filteredLogs.map((l) => [
      l.id,
      new Date(l.createdAt).toLocaleString(),
      `"${(l.userName || l.userId || '').replace(/"/g, '""')}"`,
      `"${(l.userRole || 'User').replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${(l.entity_type || 'system').replace(/"/g, '""')}"`,
      `"${(l.voucher_no || l.entity_id || '').toString().replace(/"/g, '""')}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      l.amount || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Trail_${company?.name || 'Company'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // Action Badge Helper
  const getActionBadge = (action: string) => {
    const act = action.toLowerCase();
    if (act.includes('delet') || act.includes('cancel') || act.includes('void')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <Trash2 className="w-3 h-3 shrink-0" />
          {action}
        </span>
      );
    }
    if (act.includes('creat') || act.includes('add')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <PlusCircle className="w-3 h-3 shrink-0" />
          {action}
        </span>
      );
    }
    if (act.includes('updat') || act.includes('modif')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          <Edit3 className="w-3 h-3 shrink-0" />
          {action}
        </span>
      );
    }
    if (act.includes('note') || act.includes('remark')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <ShieldCheck className="w-3 h-3 shrink-0" />
          {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
        <Info className="w-3 h-3 shrink-0" />
        {action}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background text-foreground font-sans">
      {/* ========================================================================= */}
      {/* 1. FIXED PERMANENT HEADER (Strict User Rule: Header never scrolls) */}
      {/* ========================================================================= */}
      <header className={cn(
        "shrink-0 z-20 border-b border-border bg-card shadow-xs print:hidden transition-all duration-150",
        selectedLog && "hidden"
      )}>
        {/* Top bar: Title & Actions */}
        <div className="px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight">
                  {isBn ? 'অডিট ট্রেইল ও হিস্ট্রি ট্র্যাকিং' : 'Audit Trail & Activity Logs'}
                </h1>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  Compliance ISO/Tally
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isBn 
                  ? 'প্রতিটি ভাউচার তৈরি, পরিবর্তন, ডিলিট এবং ব্যবহারকারীর কাজের সম্পূর্ণ কালানুক্রমিক অডিট রেকর্ড।'
                  : 'Immutable chronological activity tracking, voucher alterations, deletion records, and compliance oversight.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsNoteModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>{isBn ? 'অডিট মন্তব্য যোগ' : 'Add Audit Remark'}</span>
            </button>

            <button
              onClick={() => loadAuditData(true)}
              disabled={refreshing}
              className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              title={isBn ? 'রিফ্রেশ করুন' : 'Refresh Logs'}
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin text-primary")} />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="px-3.5 py-2 border border-border bg-card hover:bg-muted/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>{isBn ? 'CSV এক্সপোর্ট' : 'Export CSV'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 border border-border bg-card hover:bg-muted/50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-primary" />
              <span>{isBn ? 'প্রিন্ট রিপোর্ট' : 'Print Certified'}</span>
            </button>
          </div>
        </div>

        {/* Metric Summary Bar */}
        <div className="px-6 py-2.5 bg-muted/30 border-t border-border grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'মোট কার্যক্রম' : 'Total Activities'}</p>
              <p className="text-sm font-black">{formatNumber(stats.total)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <PlusCircle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'তৈরি রেকর্ড' : 'Entries Created'}</p>
              <p className="text-sm font-black text-emerald-600">{formatNumber(stats.created)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'সংশোধিত রেকর্ড' : 'Modified Entries'}</p>
              <p className="text-sm font-black text-blue-600">{formatNumber(stats.updated)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'মুছে ফেলা (Critical)' : 'Deleted Records'}</p>
              <p className="text-sm font-black text-rose-600">{formatNumber(stats.deleted)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'অডিট মন্তব্য' : 'Audit Remarks'}</p>
              <p className="text-sm font-black text-purple-600">{formatNumber(stats.notes)}</p>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="px-6 py-3 border-t border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={isBn ? 'ভাউচার নং, অ্যাকশন, ইউজার বা বিবরণ অনুসন্ধান...' : 'Search by voucher #, user, action, remarks...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Selects & Date Presets */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Action Filter */}
            <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">
                {isBn ? 'অ্যাকশন:' : 'Action:'}
              </span>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none pr-2 py-0.5 cursor-pointer"
              >
                <option value="ALL">{isBn ? 'সব অ্যাকশন' : 'All Actions'}</option>
                <option value="CREATE">{isBn ? 'তৈরি (Created)' : 'Created'}</option>
                <option value="UPDATE">{isBn ? 'আপডেট (Updated)' : 'Updated'}</option>
                <option value="DELETE">{isBn ? 'ডিলিট (Deleted)' : 'Deleted / Void'}</option>
                <option value="NOTE">{isBn ? 'অডিট মন্তব্য (Remarks)' : 'Audit Remarks'}</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div className="flex items-center gap-1 bg-background border border-border rounded-xl p-1 text-xs">
              <span className="text-[10px] font-bold uppercase text-muted-foreground px-2">
                {isBn ? 'মডিউল:' : 'Module:'}
              </span>
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none pr-2 py-0.5 cursor-pointer"
              >
                <option value="ALL">{isBn ? 'সব মডিউল' : 'All Modules'}</option>
                <option value="VOUCHER">{isBn ? 'ভাউচার' : 'Vouchers'}</option>
                <option value="LEDGER">{isBn ? 'লেজার' : 'Ledgers'}</option>
                <option value="ITEM">{isBn ? 'ইনভেন্টরি' : 'Inventory Items'}</option>
                <option value="SYSTEM">{isBn ? 'সিস্টেম / কোম্পানি' : 'System / Settings'}</option>
              </select>
            </div>

            {/* Date Preset */}
            <div className="flex items-center bg-background border border-border rounded-xl p-0.5 text-xs">
              {(['ALL', 'TODAY', 'YESTERDAY', 'WEEK', 'MONTH'] as const).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all",
                    datePreset === preset
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {preset === 'ALL' && (isBn ? 'সব' : 'All')}
                  {preset === 'TODAY' && (isBn ? 'আজ' : 'Today')}
                  {preset === 'YESTERDAY' && (isBn ? 'গতকাল' : 'Yesterday')}
                  {preset === 'WEEK' && (isBn ? '৭ দিন' : '7 Days')}
                  {preset === 'MONTH' && (isBn ? '৩০ দিন' : '30 Days')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. SCROLLABLE DATA SECTION (Only data scrolls, Table Header is STICKY) */}
      {/* ========================================================================= */}
      <main className="flex-1 overflow-auto bg-muted/10 p-6 print:p-0 print:overflow-visible">
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs font-medium text-muted-foreground">
              {isBn ? 'অডিট ট্রেইল ডেটা লোড হচ্ছে...' : 'Loading audit trail logs...'}
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="h-64 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-card">
            <div className="p-3 rounded-full bg-muted text-muted-foreground mb-3">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold">{isBn ? 'কোনো অডিট রেকর্ড পাওয়া যায়নি' : 'No Audit Records Found'}</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1">
              {isBn 
                ? 'বর্তমান ফিল্টার শর্তে কোনো কার্যক্রম নেই। ফিল্টার পরিবর্তন করুন অথবা নতুন ট্রানজ্যাকশন সম্পন্ন করুন।'
                : 'No audit trail activities matched your filters. Adjust filter criteria or execute transactions.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              {/* STICKY TABLE HEADER (Strict User Rule) */}
              <thead className="sticky top-0 z-10 bg-muted/80 backdrop-blur-md border-b border-border shadow-xs">
                <tr>
                  <th className="py-3 px-4 font-black text-muted-foreground uppercase tracking-wider text-[10px]">
                    {isBn ? 'তারিখ ও সময়' : 'Date & Time'}
                  </th>
                  <th className="py-3 px-4 font-black text-muted-foreground uppercase tracking-wider text-[10px]">
                    {isBn ? 'অ্যাকশন' : 'Action Type'}
                  </th>
                  <th className="py-3 px-4 font-black text-muted-foreground uppercase tracking-wider text-[10px]">
                    {isBn ? 'মডিউল / ভাউচার' : 'Module / Voucher #'}
                  </th>
                  <th className="py-3 px-4 font-black text-muted-foreground uppercase tracking-wider text-[10px]">
                    {isBn ? 'ব্যবহারকারী (User)' : 'Performed By'}
                  </th>
                  <th className="py-3 px-4 font-black text-muted-foreground uppercase tracking-wider text-[10px]">
                    {isBn ? 'বিস্তারিত বিবরণ' : 'Audit Details'}
                  </th>
                  <th className="py-3 px-4 font-black text-muted-foreground uppercase tracking-wider text-[10px] text-right print:hidden">
                    {isBn ? 'পদক্ষেপ' : 'Inspect'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.createdAt);
                  const isRecent = Date.now() - dateObj.getTime() < 3600000;

                  return (
                    <tr 
                      key={log.id} 
                      className="hover:bg-muted/40 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Timestamp */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-foreground">
                          {dateObj.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: '2-digit'
                          })}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <span>{dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isRecent && (
                            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-cyan-500/10 text-cyan-600">
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(log.action)}
                      </td>

                      {/* Module / Voucher */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-foreground bg-muted/60 px-2 py-0.5 rounded-md text-[11px] border border-border">
                          {log.voucher_no || log.entity_id || (log.entity_type ? log.entity_type.toUpperCase() : 'SYSTEM')}
                        </span>
                        {log.v_type && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                            {log.v_type}
                          </div>
                        )}
                      </td>

                      {/* User */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[10px]">
                            {(log.userName || log.userId || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold leading-tight text-foreground">
                              {log.userName || log.userId || 'System'}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {log.userRole || 'Operator'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Details */}
                      <td className="py-3 px-4">
                        <p className="text-foreground leading-relaxed font-medium line-clamp-2 max-w-xl">
                          {log.details}
                        </p>
                        {(() => {
                          const itemHistory = getLogHistoryComparison(log, logs);
                          if (itemHistory.hasHistory) {
                            return (
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">
                                  <span>{isBn ? 'পূর্বে:' : 'Before:'}</span>
                                  <span className="font-mono">{formatCurrency(itemHistory.beforeAmount ?? 0)}</span>
                                </span>
                                <span className="text-muted-foreground text-[10px]">➔</span>
                                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                                  <span>{isBn ? 'পরে:' : 'After:'}</span>
                                  <span className="font-mono">{formatCurrency(itemHistory.afterAmount ?? 0)}</span>
                                </span>
                                {itemHistory.difference !== undefined && (
                                  <span className={cn(
                                    "text-[10px] px-1.5 py-0.5 rounded font-mono font-bold",
                                    itemHistory.difference > 0 ? "text-emerald-600 bg-emerald-500/10" : itemHistory.difference < 0 ? "text-rose-600 bg-rose-500/10" : "text-muted-foreground"
                                  )}>
                                    ({itemHistory.difference > 0 ? `+${formatCurrency(itemHistory.difference)}` : formatCurrency(itemHistory.difference)})
                                  </span>
                                )}
                              </div>
                            );
                          }
                          if (log.amount !== undefined && log.amount > 0) {
                            return (
                              <span className="inline-block mt-1 text-[11px] font-black text-primary font-mono">
                                {isBn ? 'টাকার পরিমাণ:' : 'Amount:'} {formatCurrency(log.amount)}
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-4 text-right whitespace-nowrap print:hidden">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                          title={isBn ? 'বিস্তারিত দেখুন' : 'Inspect Audit Log'}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. AUDIT INSPECTION MODAL (Detailed Audit Record) */}
      {/* ========================================================================= */}
      {selectedLog && createPortal((() => {
        const history = getLogHistoryComparison(selectedLog, logs);
        const displayedFields = history.fields.filter(f => 
          inspectorFilter === 'changed-only' ? f.status !== 'unchanged' : true
        );

        const renderDiffBadge = (status: DiffChangeType) => {
          switch (status) {
            case 'updated':
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                  <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>{isBn ? '~ পরিবর্তিত' : '~ Updated'}</span>
                </span>
              );
            case 'added':
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  <PlusCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{isBn ? '+ যুক্ত' : '+ Added'}</span>
                </span>
              );
            case 'removed':
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30">
                  <MinusCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                  <span>{isBn ? '- অপসারিত' : '- Removed'}</span>
                </span>
              );
            case 'unchanged':
            default:
              return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-muted text-muted-foreground border border-border">
                  <span>{isBn ? '= অপরিবর্তিত' : '= Unchanged'}</span>
                </span>
              );
          }
        };

        const renderFieldValue = (val: any, isCurrency?: boolean, isDate?: boolean, fallback = '—') => {
          if (val === undefined || val === null || val === '') {
            return <span className="text-muted-foreground italic font-normal text-xs">{fallback}</span>;
          }
          if (isCurrency && typeof val === 'number') {
            return <span className="font-mono font-bold">{formatCurrency(val)}</span>;
          }
          if (isDate && val) {
            return <span className="font-mono">{String(val)}</span>;
          }
          if (typeof val === 'number') {
            return <span className="font-mono font-bold">{formatNumber(val)}</span>;
          }
          return <span>{String(val)}</span>;
        };

        return (
          <div 
            id="audit-record-inspector-modal"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedLog(null);
            }}
            className="fixed inset-0 z-[999999] w-screen h-screen flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in"
          >
            <div 
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl lg:max-w-5xl overflow-hidden flex flex-col max-h-[92vh]"
            >
              {/* Modal Header */}
              <div className="px-5 py-3.5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-muted/40">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-foreground">
                        {isBn ? 'অডিট রেকর্ড পরিদর্শন ও তুলনা' : 'Audit Record Inspector'}
                      </h3>
                      <div className="scale-90 origin-left">
                        {getActionBadge(selectedLog.action)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-[10px] font-mono text-muted-foreground">ID: {selectedLog.id}</p>
                      <button
                        onClick={() => handleCopyId(selectedLog.id)}
                        className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono"
                        title={isBn ? 'লগ ID কপি করুন' : 'Copy Log ID'}
                      >
                        {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedId ? (isBn ? 'কপি হয়েছে' : 'Copied') : ''}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* View Layout Switcher & Close Button */}
                <div className="flex items-center gap-2">
                  {/* Layout Mode Segmented Control */}
                  <div className="inline-flex items-center p-1 rounded-xl bg-muted border border-border text-xs">
                    <button
                      type="button"
                      onClick={() => setInspectorLayout('side-by-side')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all",
                        inspectorLayout === 'side-by-side'
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={isBn ? 'পাশাপাশি তুলনা (Side-by-Side)' : 'Side-by-Side Grid'}
                    >
                      <Columns2 className="w-3.5 h-3.5 text-primary" />
                      <span>{isBn ? 'পাশাপাশি' : 'Side-by-Side'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorLayout('stacked')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all",
                        inspectorLayout === 'stacked'
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={isBn ? 'উপরে-নিচে তুলনা (Stacked)' : 'Stacked Grid'}
                    >
                      <Rows3 className="w-3.5 h-3.5 text-primary" />
                      <span>{isBn ? 'স্ট্যাকড' : 'Stacked'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorLayout('diff-table')}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all",
                        inspectorLayout === 'diff-table'
                          ? "bg-card text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={isBn ? 'তুলনামূলক টেবিল (Diff Table)' : 'Diff Table'}
                    >
                      <TableIcon className="w-3.5 h-3.5 text-primary" />
                      <span>{isBn ? 'টেবিল' : 'Diff Table'}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors border border-transparent hover:border-border ml-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
                {/* 1. Executive Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-muted/30 rounded-xl border border-border">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'অ্যাকশন' : 'Action'}</span>
                    <div className="mt-0.5">{getActionBadge(selectedLog.action)}</div>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'মডিউল' : 'Entity Type'}</span>
                    <p className="font-bold mt-0.5 capitalize">{selectedLog.entity_type || 'System'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'ব্যবহারকারী' : 'User'}</span>
                    <p className="font-bold mt-0.5">{selectedLog.userName || selectedLog.userId || 'System'}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'তারিখ ও সময়' : 'Recorded At'}</span>
                    <p className="font-bold mt-0.5">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Narrative Statement */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'পূর্ণ বিবরণ (Audit Narrative)' : 'Full Audit Narrative'}</span>
                  <div className="mt-1 p-3 rounded-xl bg-background border border-border leading-relaxed font-medium text-foreground">
                    {selectedLog.details}
                  </div>
                </div>

                {/* 2. Visual Diff Summary Toolbar */}
                <div className="rounded-xl border border-border bg-card p-3 shadow-xs flex flex-wrap items-center justify-between gap-3">
                  {/* Status Indicator Chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold text-muted-foreground mr-1">
                      {isBn ? 'পার্থক্য পরিসংখ্যান:' : 'Diff Summary:'}
                    </span>
                    {/* Yellow for Updated */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black font-mono border flex items-center gap-1",
                      history.counts.updated > 0
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                        : "bg-muted text-muted-foreground border-border opacity-60"
                    )}>
                      <Edit3 className="w-3 h-3 text-amber-500" />
                      <span>{history.counts.updated} {isBn ? 'পরিবর্তিত' : 'Updated'}</span>
                    </span>

                    {/* Green for Added */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black font-mono border flex items-center gap-1",
                      history.counts.added > 0
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-muted text-muted-foreground border-border opacity-60"
                    )}>
                      <PlusCircle className="w-3 h-3 text-emerald-500" />
                      <span>{history.counts.added} {isBn ? 'যুক্ত' : 'Added'}</span>
                    </span>

                    {/* Red for Removed */}
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-black font-mono border flex items-center gap-1",
                      history.counts.removed > 0
                        ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                        : "bg-muted text-muted-foreground border-border opacity-60"
                    )}>
                      <MinusCircle className="w-3 h-3 text-rose-500" />
                      <span>{history.counts.removed} {isBn ? 'অপসারিত' : 'Removed'}</span>
                    </span>

                    {/* Gray for Unchanged */}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono border bg-muted text-muted-foreground border-border">
                      <span>{history.counts.unchanged} {isBn ? 'অপরিবর্তিত' : 'Unchanged'}</span>
                    </span>
                  </div>

                  {/* Filter & Net Financial Change */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Financial Difference Pill */}
                    {history.difference !== undefined && (
                      <div className="flex items-center gap-1 text-[11px] font-black font-mono">
                        {history.difference > 0 && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                        {history.difference < 0 && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                        <span className={cn(
                          "px-2 py-0.5 rounded-full border",
                          history.difference > 0 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                          history.difference < 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                          "bg-muted text-muted-foreground border-border"
                        )}>
                          {history.difference > 0 ? `+${formatCurrency(history.difference)} Net` : `${formatCurrency(history.difference)} Net`}
                        </span>
                      </div>
                    )}

                    {/* Filter Toggle: All vs Changed Only */}
                    <div className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-border">
                      <button
                        type="button"
                        onClick={() => setInspectorFilter('all')}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold transition-colors",
                          inspectorFilter === 'all'
                            ? "bg-card text-foreground shadow-2xs font-black"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {isBn ? `সব ফিল্ড (${history.counts.total})` : `All Fields (${history.counts.total})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setInspectorFilter('changed-only')}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold transition-colors flex items-center gap-1",
                          inspectorFilter === 'changed-only'
                            ? "bg-amber-500/20 text-amber-700 dark:text-amber-300 font-black"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <span>{isBn ? 'শুধু পরিবর্তন' : 'Changed Only'}</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. COMPARISON GRID LAYOUTS */}
                {displayedFields.length === 0 ? (
                  <div className="p-8 text-center bg-muted/20 border border-dashed border-border rounded-xl">
                    <p className="text-muted-foreground font-medium">
                      {isBn ? 'ফিল্টারের সাথে মিলে এমন কোনো পরিবর্তিত ফিল্ড পাওয়া যায়নি।' : 'No changed fields match the current filter.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => setInspectorFilter('all')}
                      className="mt-2 text-xs font-bold text-primary hover:underline"
                    >
                      {isBn ? 'সব ফিল্ড দেখুন' : 'Show All Fields'}
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Mode A: Side-by-Side Comparison Grid */}
                    {inspectorLayout === 'side-by-side' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                        {/* LEFT COLUMN: BEFORE (Old State) */}
                        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.02] dark:bg-rose-950/[0.05] overflow-hidden flex flex-col shadow-xs">
                          <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                              <span className="font-black text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                {isBn ? 'পূর্বে ছিল (BEFORE - Old State)' : 'BEFORE (Old State)'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/15">
                              {isBn ? 'সংশোধনের পূর্ববর্তী মান' : 'Previous Revision'}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-2.5 flex-1">
                            {displayedFields.map(field => {
                              const isUpd = field.status === 'updated';
                              const isRem = field.status === 'removed';
                              const isAdd = field.status === 'added';
                              return (
                                <div
                                  key={`before-${field.id}`}
                                  className={cn(
                                    "p-2.5 rounded-xl border transition-colors flex flex-col justify-between min-h-[62px]",
                                    isUpd ? "bg-amber-500/10 border-amber-500/30" :
                                    isRem ? "bg-rose-500/10 border-rose-500/30" :
                                    isAdd ? "bg-muted/20 border-dashed border-border opacity-70" :
                                    "bg-muted/30 border-border"
                                  )}
                                >
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-bold text-muted-foreground">{isBn ? field.labelBn : field.label}</span>
                                    {renderDiffBadge(field.status)}
                                  </div>
                                  <div className={cn(
                                    "text-xs",
                                    isUpd ? "line-through text-muted-foreground font-mono" :
                                    isRem ? "text-rose-600 dark:text-rose-400 font-bold" :
                                    isAdd ? "text-muted-foreground italic text-[11px]" :
                                    "font-medium text-foreground"
                                  )}>
                                    {isAdd ? (isBn ? '— (পূর্বে বিদ্যমান ছিল না)' : '— (Not present in prior state)') : renderFieldValue(field.beforeValue, field.isCurrency, field.isDate)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: AFTER (Updated State) */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.05] overflow-hidden flex flex-col shadow-xs">
                          <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                              <span className="font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                {isBn ? 'পরিবর্তিত / বর্তমানে (AFTER - Updated State)' : 'AFTER (Updated State)'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15">
                              {isBn ? 'বর্তমান সক্রিয় মান' : 'Active Record'}
                            </span>
                          </div>

                          <div className="p-3.5 space-y-2.5 flex-1">
                            {displayedFields.map(field => {
                              const isUpd = field.status === 'updated';
                              const isRem = field.status === 'removed';
                              const isAdd = field.status === 'added';
                              return (
                                <div
                                  key={`after-${field.id}`}
                                  className={cn(
                                    "p-2.5 rounded-xl border transition-colors flex flex-col justify-between min-h-[62px]",
                                    isUpd ? "bg-amber-500/15 border-amber-500/40 shadow-xs ring-1 ring-amber-500/20" :
                                    isAdd ? "bg-emerald-500/15 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20" :
                                    isRem ? "bg-muted/20 border-dashed border-border opacity-70" :
                                    "bg-muted/30 border-border"
                                  )}
                                >
                                  <div className="flex items-center justify-between text-[11px] mb-1">
                                    <span className="font-bold text-muted-foreground">{isBn ? field.labelBn : field.label}</span>
                                    {renderDiffBadge(field.status)}
                                  </div>
                                  <div className={cn(
                                    "text-xs",
                                    isUpd ? "font-bold text-amber-800 dark:text-amber-300" :
                                    isAdd ? "font-bold text-emerald-800 dark:text-emerald-300" :
                                    isRem ? "text-muted-foreground italic text-[11px]" :
                                    "font-medium text-foreground"
                                  )}>
                                    {isRem ? (isBn ? '— (অপসারিত)' : '— (Removed in this revision)') : renderFieldValue(field.afterValue, field.isCurrency, field.isDate)}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mode B: Stacked Grid Comparison */}
                    {inspectorLayout === 'stacked' && (
                      <div className="space-y-3">
                        {/* BEFORE CARD */}
                        <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.02] dark:bg-rose-950/[0.05] overflow-hidden shadow-xs">
                          <div className="px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                              <span className="font-black text-xs uppercase tracking-wider text-rose-700 dark:text-rose-400">
                                {isBn ? '১. পূর্বে ছিল (BEFORE - Old State)' : '1. BEFORE (Old State)'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded bg-rose-500/15">
                              {isBn ? 'সংশোধনের আগের মান' : 'Prior Revision'}
                            </span>
                          </div>
                          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {displayedFields.map(field => (
                              <div
                                key={`stacked-before-${field.id}`}
                                className={cn(
                                  "p-2.5 rounded-lg border",
                                  field.status === 'updated' ? "bg-amber-500/10 border-amber-500/30" :
                                  field.status === 'removed' ? "bg-rose-500/10 border-rose-500/30" :
                                  field.status === 'added' ? "bg-muted/20 border-dashed border-border opacity-70" :
                                  "bg-muted/30 border-border"
                                )}
                              >
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-bold text-muted-foreground">{isBn ? field.labelBn : field.label}</span>
                                  {renderDiffBadge(field.status)}
                                </div>
                                <div className={cn(
                                  "text-xs",
                                  field.status === 'updated' ? "line-through text-muted-foreground font-mono" :
                                  field.status === 'removed' ? "text-rose-600 font-bold" :
                                  field.status === 'added' ? "text-muted-foreground italic text-[11px]" :
                                  "font-medium text-foreground"
                                )}>
                                  {field.status === 'added' ? '—' : renderFieldValue(field.beforeValue, field.isCurrency, field.isDate)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Middle Direction Divider */}
                        <div className="flex items-center justify-center py-1">
                          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted border border-border text-[11px] font-bold text-muted-foreground shadow-2xs">
                            <ArrowDown className="w-3.5 h-3.5 text-primary" />
                            <span>{isBn ? 'সংশোধিত হয়ে পরিবর্তিত হয়েছে' : 'Transformed / Modified'}</span>
                            {history.difference !== undefined && (
                              <span className={cn(
                                "font-mono font-black ml-1",
                                history.difference > 0 ? "text-emerald-600" : history.difference < 0 ? "text-rose-600" : "text-muted-foreground"
                              )}>
                                ({history.difference > 0 ? `+${formatCurrency(history.difference)}` : formatCurrency(history.difference)})
                              </span>
                            )}
                          </div>
                        </div>

                        {/* AFTER CARD */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.02] dark:bg-emerald-950/[0.05] overflow-hidden shadow-xs">
                          <div className="px-4 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                              <span className="font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                {isBn ? '২. পরিবর্তিত / বর্তমানে (AFTER - Updated State)' : '2. AFTER (Updated State)'}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15">
                              {isBn ? 'বর্তমান সক্রিয় মান' : 'Active Record'}
                            </span>
                          </div>
                          <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                            {displayedFields.map(field => (
                              <div
                                key={`stacked-after-${field.id}`}
                                className={cn(
                                  "p-2.5 rounded-lg border",
                                  field.status === 'updated' ? "bg-amber-500/15 border-amber-500/40 shadow-xs ring-1 ring-amber-500/20" :
                                  field.status === 'added' ? "bg-emerald-500/15 border-emerald-500/40 shadow-xs ring-1 ring-emerald-500/20" :
                                  field.status === 'removed' ? "bg-muted/20 border-dashed border-border opacity-70" :
                                  "bg-muted/30 border-border"
                                )}
                              >
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-bold text-muted-foreground">{isBn ? field.labelBn : field.label}</span>
                                  {renderDiffBadge(field.status)}
                                </div>
                                <div className={cn(
                                  "text-xs",
                                  field.status === 'updated' ? "font-bold text-amber-800 dark:text-amber-300" :
                                  field.status === 'added' ? "font-bold text-emerald-800 dark:text-emerald-300" :
                                  field.status === 'removed' ? "text-muted-foreground italic text-[11px]" :
                                  "font-medium text-foreground"
                                )}>
                                  {field.status === 'removed' ? '—' : renderFieldValue(field.afterValue, field.isCurrency, field.isDate)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mode C: Structured Diff Table */}
                    {inspectorLayout === 'diff-table' && (
                      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-muted/60 border-b border-border text-[11px] font-black uppercase text-muted-foreground">
                              <th className="py-2.5 px-3.5">{isBn ? 'ফিল্ডের নাম' : 'Field Attribute'}</th>
                              <th className="py-2.5 px-3.5 bg-rose-500/5 text-rose-700 dark:text-rose-400">
                                {isBn ? 'পূর্বে ছিল (BEFORE)' : 'BEFORE (Old)'}
                              </th>
                              <th className="py-2.5 px-3.5 text-center">{isBn ? 'পরিবর্তন (Diff)' : 'Diff Status'}</th>
                              <th className="py-2.5 px-3.5 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                                {isBn ? 'বর্তমানে / পরে (AFTER)' : 'AFTER (New)'}
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {displayedFields.map(field => {
                              const isUpd = field.status === 'updated';
                              const isRem = field.status === 'removed';
                              const isAdd = field.status === 'added';
                              return (
                                <tr
                                  key={`table-${field.id}`}
                                  className={cn(
                                    "transition-colors",
                                    isUpd ? "bg-amber-500/[0.04]" :
                                    isAdd ? "bg-emerald-500/[0.04]" :
                                    isRem ? "bg-rose-500/[0.04]" :
                                    "hover:bg-muted/30"
                                  )}
                                >
                                  <td className="py-2.5 px-3.5 font-bold text-foreground">
                                    <span>{isBn ? field.labelBn : field.label}</span>
                                    <span className="block text-[10px] font-mono text-muted-foreground font-normal">{field.id}</span>
                                  </td>
                                  <td className={cn(
                                    "py-2.5 px-3.5 bg-rose-500/[0.02]",
                                    isUpd ? "line-through text-muted-foreground font-mono" :
                                    isRem ? "text-rose-600 font-bold" :
                                    isAdd ? "text-muted-foreground italic text-[11px]" :
                                    "text-foreground font-medium"
                                  )}>
                                    {isAdd ? '—' : renderFieldValue(field.beforeValue, field.isCurrency, field.isDate)}
                                  </td>
                                  <td className="py-2.5 px-3.5 text-center whitespace-nowrap">
                                    {renderDiffBadge(field.status)}
                                  </td>
                                  <td className={cn(
                                    "py-2.5 px-3.5 bg-emerald-500/[0.02]",
                                    isUpd ? "font-bold text-amber-800 dark:text-amber-300" :
                                    isAdd ? "font-bold text-emerald-800 dark:text-emerald-300" :
                                    isRem ? "text-muted-foreground italic text-[11px]" :
                                    "text-foreground font-medium"
                                  )}>
                                    {isRem ? '—' : renderFieldValue(field.afterValue, field.isCurrency, field.isDate)}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}

                {/* 4. Collapsible Raw Audit Metadata Payload */}
                <details className="group rounded-xl border border-border bg-muted/20 overflow-hidden text-xs">
                  <summary className="px-4 py-2.5 flex items-center justify-between cursor-pointer font-bold text-muted-foreground hover:text-foreground transition-colors select-none">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-primary" />
                      <span>{isBn ? 'র\' অডিট মেটাডাটা ও পে-লোড (Raw JSON Payload)' : 'Raw Audit Payload (JSON Metadata)'}</span>
                    </div>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-muted border border-border">
                      {isBn ? 'ক্লিক করে দেখুন' : 'Expand / Collapse'}
                    </span>
                  </summary>
                  <div className="p-3.5 bg-card border-t border-border">
                    <pre className="p-3 rounded-lg bg-muted/60 font-mono text-[11px] leading-relaxed overflow-x-auto text-foreground border border-border">
                      {JSON.stringify({
                        id: selectedLog.id,
                        action: selectedLog.action,
                        entity_type: selectedLog.entity_type,
                        entity_id: selectedLog.entity_id,
                        voucher_no: selectedLog.voucher_no,
                        amount: selectedLog.amount,
                        before_amount: selectedLog.before_amount,
                        after_amount: selectedLog.after_amount,
                        party_name: selectedLog.party_name,
                        createdAt: selectedLog.createdAt,
                        details: selectedLog.details,
                        metadata: selectedLog.metadata
                      }, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>

              {/* Modal Footer */}
              <div className="px-5 py-3 border-t border-border bg-muted/20 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleCopyId(selectedLog.id)}
                  className="px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-[11px] font-bold shadow-2xs transition-colors"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId ? (isBn ? 'আইডি কপি হয়েছে' : 'Copied!') : (isBn ? 'লগ ID কপি' : 'Copy Log ID')}</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-xs hover:bg-primary/90 transition-all"
                  >
                    {isBn ? 'বন্ধ করুন' : 'Close Inspector'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })(), document.body)}

      {/* ========================================================================= */}
      {/* 4. MANUAL AUDIT REMARK MODAL */}
      {/* ========================================================================= */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-black">{isBn ? 'অফিশিয়াল অডিট মন্তব্য সংরক্ষণ' : 'Log Formal Audit Remark'}</h3>
              </div>
              <button
                onClick={() => setIsNoteModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAuditNote} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1.5">
                  {isBn ? 'অডিট ক্যাটাগরি' : 'Audit Category'}
                </label>
                <select
                  value={noteCategory}
                  onChange={(e) => setNoteCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border font-medium outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Stock Verification">Stock Verification (ফিজিক্যাল স্টক যাচাই)</option>
                  <option value="Bank Reconciliation">Bank Reconciliation (ব্যাংক স্টেটমেন্ট রিকনসিলিয়েশন)</option>
                  <option value="Cash Count">Cash In Hand Count (ক্যাশ গণনা)</option>
                  <option value="Voucher Review">Voucher Audit & Compliance (ভাউচার অডিট)</option>
                  <option value="Tax & VAT Filing">Tax & VAT Filing (ট্যাক্স ও ভ্যাট দাখিল)</option>
                  <option value="General Remark">General Audit Remark (সাধারণ অডিট নোট)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-muted-foreground mb-1.5">
                  {isBn ? 'অডিট পর্যবেক্ষণ ও মন্তব্য' : 'Audit Observation & Notes'}
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder={isBn ? 'অডিট সংক্রান্ত আনুষ্ঠানিক পর্যবেক্ষণ লিপিবদ্ধ করুন...' : 'Enter formal audit observation or compliance note...'}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-background border border-border font-medium outline-none focus:ring-2 focus:ring-primary/20 resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20 text-[11px] text-purple-700 dark:text-purple-300">
                {isBn 
                  ? 'এই মন্তব্যটি কোম্পানির অডিট ট্রেইলে অপরিবর্তনীয় রেকর্ড হিসেবে সংরক্ষিত থাকবে এবং অডিট রিপোর্টে দৃশ্যমান হবে।'
                  : 'This remark will be permanently logged into company compliance audit trail with your timestamp.'}
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNoteModalOpen(false)}
                  className="px-4 py-2 border border-border rounded-xl font-bold hover:bg-muted"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={submittingNote || !noteText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {submittingNote && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isBn ? 'সংরক্ষণ করুন' : 'Log Audit Remark'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FORMAL CERTIFIED PRINT / PDF LAYOUT */}
      {/* Strict User Rule: Page numbers MUST ONLY appear at top right corner */}
      {/* ========================================================================= */}
      <div className="hidden print:block p-8 bg-white text-black font-sans text-xs">
        {/* Top Header with Strict Top-Right Page Number */}
        <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-wider">{company?.name || 'Company Name'}</h1>
            <p className="text-xs text-gray-700">{company?.address || 'Official Business Address'}</p>
            <p className="text-xs text-gray-700">Phone: {company?.phone || 'N/A'} | Email: {company?.email || 'N/A'}</p>
            <h2 className="text-sm font-bold uppercase mt-2 text-black underline">
              Certified Audit Trail & Activity Register
            </h2>
          </div>
          {/* Top-Right Page Numbering ONLY */}
          <div className="text-right">
            <p className="text-xs font-bold font-mono">Page 1 of 1</p>
            <p className="text-[10px] text-gray-600">Generated: {new Date().toLocaleString()}</p>
            <p className="text-[10px] text-gray-600">Auditor: {user?.displayName || user?.email || 'Authorized Auditor'}</p>
          </div>
        </div>

        {/* Audit Metrics Table */}
        <div className="grid grid-cols-4 gap-2 border border-black p-2 mb-4 text-[10px]">
          <div><strong>Total Logs:</strong> {stats.total}</div>
          <div><strong>Created:</strong> {stats.created}</div>
          <div><strong>Modified:</strong> {stats.updated}</div>
          <div><strong>Deleted / Void:</strong> {stats.deleted}</div>
        </div>

        {/* Print Table */}
        <table className="w-full text-left border-collapse text-[10px] mb-8">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100">
              <th className="py-2 px-1 font-bold">Date & Time</th>
              <th className="py-2 px-1 font-bold">Action</th>
              <th className="py-2 px-1 font-bold">Module/Ref</th>
              <th className="py-2 px-1 font-bold">User</th>
              <th className="py-2 px-1 font-bold">Details</th>
              <th className="py-2 px-1 font-bold text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-300">
            {filteredLogs.map((l) => (
              <tr key={l.id}>
                <td className="py-1 px-1 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="py-1 px-1 font-bold whitespace-nowrap">{l.action}</td>
                <td className="py-1 px-1 font-mono">{l.voucher_no || l.entity_id || l.entity_type}</td>
                <td className="py-1 px-1">{l.userName || l.userId}</td>
                <td className="py-1 px-1">{l.details}</td>
                <td className="py-1 px-1 text-right font-mono">{l.amount ? formatNumber(l.amount) : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-12 text-center text-xs">
          <div className="border-t border-black pt-1">
            <p className="font-bold">Prepared By</p>
            <p className="text-[10px] text-gray-600">Accountant / Data Operator</p>
          </div>
          <div className="border-t border-black pt-1">
            <p className="font-bold">Verified By</p>
            <p className="text-[10px] text-gray-600">Internal Auditor</p>
          </div>
          <div className="border-t border-black pt-1">
            <p className="font-bold">Authorized Signatory</p>
            <p className="text-[10px] text-gray-600">Managing Director / Partner</p>
          </div>
        </div>
      </div>
    </div>
  );
};
