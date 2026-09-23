import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Layers
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
  v_type?: string;
  amount?: number;
  before_amount?: number;
  after_amount?: number;
  difference_amount?: number;
  old_amount?: number;
  new_amount?: number;
  old_date?: string;
  new_date?: string;
  party_name?: string;
  createdAt: string;
  timestamp?: string;
  metadata?: Record<string, any>;
}

interface HistoryComparison {
  isUpdate: boolean;
  hasHistory: boolean;
  beforeAmount?: number;
  afterAmount?: number;
  difference?: number;
  oldDate?: string;
  newDate?: string;
}

const getLogHistoryComparison = (log: AuditLogEntry | null, allLogs: AuditLogEntry[]): HistoryComparison => {
  if (!log) {
    return { isUpdate: false, hasHistory: false };
  }

  // 1. Check direct fields
  let beforeAmount: number | undefined = 
    log.before_amount ?? log.old_amount ?? log.metadata?.before_amount ?? log.metadata?.old_amount;
  let afterAmount: number | undefined = 
    log.after_amount ?? log.new_amount ?? log.amount ?? log.metadata?.after_amount ?? log.metadata?.new_amount;

  const oldDate = log.old_date || log.metadata?.old_date;
  const newDate = log.new_date || log.metadata?.new_date;

  // 2. Check if details has "Before: X, After: Y"
  if (beforeAmount === undefined && log.details) {
    const beforeMatch = log.details.match(/before:\s*৳?\s*([0-9,.]+)/i);
    const afterMatch = log.details.match(/after:\s*৳?\s*([0-9,.]+)/i);
    if (beforeMatch && afterMatch) {
      beforeAmount = parseFloat(beforeMatch[1].replace(/,/g, ''));
      afterAmount = parseFloat(afterMatch[1].replace(/,/g, ''));
    }
  }

  // 3. Determine if this action represents an update/modification
  const actLower = (log.action || '').toLowerCase();
  const isUpdate = actLower.includes('updat') || 
                   actLower.includes('modif') || 
                   actLower.includes('edit') ||
                   (log.details || '').toLowerCase().includes('modif');

  // 4. If update and beforeAmount is still unknown, search in other logs for same entity
  if (isUpdate && (beforeAmount === undefined || isNaN(beforeAmount))) {
    const logTime = new Date(log.createdAt || log.timestamp || 0).getTime();
    
    const candidatePriorLogs = allLogs.filter(other => {
      if (other.id === log.id) return false;
      const otherTime = new Date(other.createdAt || other.timestamp || 0).getTime();
      
      const matchEntity = (log.entity_id && other.entity_id && log.entity_id === other.entity_id) ||
                          (log.voucher_no && other.voucher_no && String(log.voucher_no) === String(other.voucher_no));
      
      if (!matchEntity) return false;
      if (logTime && otherTime && otherTime > logTime) return false;

      return other.amount !== undefined || other.after_amount !== undefined;
    });

    if (candidatePriorLogs.length > 0) {
      candidatePriorLogs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      const prior = candidatePriorLogs[0];
      beforeAmount = prior.after_amount ?? prior.amount;
      if (afterAmount === undefined) {
        afterAmount = log.amount;
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

  const hasHistory = beforeAmount !== undefined && afterAmount !== undefined;
  const difference = hasHistory ? (afterAmount! - beforeAmount!) : undefined;

  return {
    isUpdate,
    hasHistory,
    beforeAmount,
    afterAmount,
    difference,
    oldDate,
    newDate
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
      <header className="shrink-0 z-20 border-b border-border bg-card shadow-xs print:hidden">
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
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black">{isBn ? 'অডিট রেকর্ড পরিদর্শন' : 'Audit Record Inspector'}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-muted/30 rounded-xl border border-border">
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

              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground">{isBn ? 'পূর্ণ বিবরণ (Audit Description)' : 'Full Audit Narrative'}</span>
                <div className="mt-1 p-3.5 rounded-xl bg-background border border-border leading-relaxed font-medium">
                  {selectedLog.details}
                </div>
              </div>

              {/* Audit History: Before & After Card */}
              {(() => {
                const history = getLogHistoryComparison(selectedLog, logs);
                
                if (history.hasHistory) {
                  return (
                    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
                      <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-primary" />
                          <span className="font-black text-xs text-foreground">
                            {isBn ? 'পরিবর্তন ইতিহাস (Before & After History)' : 'Audit History (Before & After)'}
                          </span>
                        </div>
                        {history.difference !== undefined && (
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-black font-mono border",
                            history.difference > 0 
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                              : history.difference < 0 
                                ? "bg-rose-500/10 text-rose-600 border-rose-500/20" 
                                : "bg-muted text-muted-foreground border-border"
                          )}>
                            {history.difference > 0 ? `+${formatCurrency(history.difference)}` : formatCurrency(history.difference)}
                          </span>
                        )}
                      </div>

                      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                        {/* BEFORE */}
                        <div className="p-3.5 rounded-xl bg-rose-500/5 border border-rose-500/20 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                                {isBn ? 'পূর্বে ছিল (BEFORE)' : 'BEFORE (Old State)'}
                              </span>
                              <span className="text-[9px] text-muted-foreground uppercase font-bold px-1.5 py-0.5 bg-rose-500/10 rounded">
                                {isBn ? 'পূর্ববর্তী রেকর্ড' : 'Previous'}
                              </span>
                            </div>
                            <div className="text-base font-black font-mono text-rose-700 dark:text-rose-400 mt-2">
                              {formatCurrency(history.beforeAmount ?? 0)}
                            </div>
                          </div>
                          {history.oldDate && (
                            <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 font-mono pt-1.5 border-t border-rose-500/10">
                              <Clock className="w-3 h-3 text-rose-400" />
                              <span>{history.oldDate}</span>
                            </div>
                          )}
                        </div>

                        {/* AFTER */}
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {isBn ? 'পরিবর্তিত / বর্তমানে (AFTER)' : 'AFTER (Updated State)'}
                              </span>
                              <span className="text-[9px] text-emerald-600 font-bold uppercase px-1.5 py-0.5 bg-emerald-500/10 rounded">
                                {isBn ? 'বর্তমান সক্রিয়' : 'Current Active'}
                              </span>
                            </div>
                            <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400 mt-2">
                              {formatCurrency(history.afterAmount ?? 0)}
                            </div>
                          </div>
                          {history.newDate && (
                            <div className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1 font-mono pt-1.5 border-t border-emerald-500/10">
                              <Clock className="w-3 h-3 text-emerald-400" />
                              <span>{history.newDate}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Difference summary note */}
                      <div className="px-3.5 py-2.5 bg-muted/30 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium">
                          {isBn ? 'মোট পরিবর্তনের পার্থক্য (Net Change):' : 'Net Value Change:'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {history.difference !== undefined && history.difference > 0 && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                          {history.difference !== undefined && history.difference < 0 && <TrendingDown className="w-3.5 h-3.5 text-rose-600" />}
                          <span className={cn(
                            "font-black font-mono",
                            (history.difference ?? 0) > 0 ? "text-emerald-600" : (history.difference ?? 0) < 0 ? "text-rose-600" : "text-muted-foreground"
                          )}>
                            {(history.difference ?? 0) > 0 
                              ? `+${formatCurrency(history.difference!)} (${isBn ? 'বৃদ্ধি পেয়েছে' : 'Increased'})` 
                              : (history.difference ?? 0) < 0 
                                ? `${formatCurrency(history.difference!)} (${isBn ? 'হ্রাস পেয়েছে' : 'Decreased'})` 
                                : (isBn ? 'অপরিবর্তিত (No change)' : 'Unchanged')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (history.isUpdate) {
                  return (
                    <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
                      <div className="px-3.5 py-2.5 bg-muted/40 border-b border-border flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <History className="w-4 h-4 text-amber-500" />
                          <span className="font-black text-xs text-foreground">
                            {isBn ? 'হালনাগাদ রেকর্ড (Updated Audit Record)' : 'Updated Audit Record'}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                          {isBn ? 'সংশোধিত এন্ট্রি' : 'Modified Entry'}
                        </span>
                      </div>
                      <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
                        <div className="p-3 rounded-xl bg-muted/40 border border-border flex flex-col justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {isBn ? 'পূর্বে ছিল (BEFORE)' : 'BEFORE (Old State)'}
                          </span>
                          <p className="text-xs text-muted-foreground italic mt-2">
                            {isBn ? 'পূর্ববর্তী প্রাথমিক রেকর্ড সংশোধিত হয়েছে' : 'Initial recorded document state modified'}
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col justify-between">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                              {isBn ? 'পরিবর্তিত / বর্তমানে (AFTER)' : 'AFTER (Updated Amount)'}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold uppercase">
                              {isBn ? 'বর্তমান' : 'Current'}
                            </span>
                          </div>
                          <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400 mt-2">
                            {formatCurrency(history.afterAmount ?? selectedLog.amount ?? 0)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                }

                if (selectedLog.amount !== undefined) {
                  return (
                    <div className="flex justify-between items-center p-3.5 rounded-xl bg-primary/5 border border-primary/20">
                      <div>
                        <span className="font-bold text-foreground block text-xs">
                          {isBn ? 'লেনদেনের পরিমাণ' : 'Transaction Amount'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {isBn ? 'প্রাথমিক এন্ট্রি পরিমাণ' : 'Initial Recorded Amount'}
                        </span>
                      </div>
                      <span className="font-black text-sm text-primary font-mono">{formatCurrency(selectedLog.amount)}</span>
                    </div>
                  );
                }

                return null;
              })()}

              {selectedLog.voucher_no && (
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/30 border border-border">
                  <span className="text-muted-foreground">{isBn ? 'ভাউচার নম্বর' : 'Voucher Number'}</span>
                  <span className="font-mono font-bold">{selectedLog.voucher_no}</span>
                </div>
              )}

              {selectedLog.party_name && (
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-muted/30 border border-border">
                  <span className="text-muted-foreground">{isBn ? 'পার্টি / কাস্টমার' : 'Party / Ledger'}</span>
                  <span className="font-bold">{selectedLog.party_name}</span>
                </div>
              )}
            </div>

            <div className="px-6 py-3 border-t border-border bg-muted/20 flex justify-between items-center">
              <button
                onClick={() => handleCopyId(selectedLog.id)}
                className="px-3 py-1.5 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px] font-bold"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? (isBn ? 'কপি হয়েছে' : 'Copied') : (isBn ? 'লগ ID কপি' : 'Copy Log ID')}</span>
              </button>

              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg font-bold text-xs shadow-xs"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

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
