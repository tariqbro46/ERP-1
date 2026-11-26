import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Copy,
  Database,
  Eye,
  FileWarning,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { errorService } from '../../services/errorService';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';
import { CompanyStats, ProposalFixModalState, safeFormatDate } from './types';

interface FounderObservabilityViewProps {
  globalActivity: any[];
  companies: CompanyStats[];
  allUsers: any[];
  quotaRequests: any[];
  onOpenAuditTrail: () => void;
  onOpenQuotaModal: (company: CompanyStats) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

function deriveRootCauseHypothesis(log: { message?: string; stack?: string; componentName?: string }): {
  category: string;
  hypothesis: string;
  suggestedFiles: string;
} {
  const msg = (log.message || '').toLowerCase();
  const stack = (log.stack || '').toLowerCase();

  if (msg.includes('quota') || msg.includes('resource-exhausted') || msg.includes('429')) {
    return {
      category: 'Firestore Read/Write Quota Exhaustion',
      hypothesis:
        'A component or snapshot listener exceeded project daily read/write limits or attempted an uncached collection sweep.',
      suggestedFiles: 'src/services/erpService.ts, active view snapshot listeners, src/contexts/AuthContext.tsx',
    };
  }
  if (msg.includes('permission') || msg.includes('missing or insufficient') || msg.includes('403')) {
    return {
      category: 'Tenant Isolation / RBAC Rule Mismatch',
      hypothesis:
        'Firestore security rules or API route middleware rejected access due to mismatched companyId, unverified email claim, or insufficient role permissions.',
      suggestedFiles: 'firestore.rules, server.ts, src/contexts/AuthContext.tsx',
    };
  }
  if (msg.includes('cannot read properties') || msg.includes('undefined') || msg.includes('null')) {
    return {
      category: 'Null / Undefined Property Dereference',
      hypothesis: `Optional document or API response field was accessed without null-guarding inside ${log.componentName || 'the active component'}.`,
      suggestedFiles: `${log.componentName || 'Affected component'}, src/lib/utils.ts`,
    };
  }
  if (msg.includes('network') || msg.includes('offline') || msg.includes('failed to fetch')) {
    return {
      category: 'Network / Offline Resilience',
      hypothesis:
        'Client request failed while offline or backend was unreachable without graceful local cache fallback.',
      suggestedFiles: 'src/services/erpService.ts, network error handlers',
    };
  }
  if (stack.includes('date') || msg.includes('invalid time value')) {
    return {
      category: 'Date / Firestore Timestamp Normalization',
      hypothesis:
        'A raw Firestore Timestamp or malformed date string was passed directly to date-fns format() instead of ensureDate().',
      suggestedFiles: 'src/lib/utils.ts, reporting date formatting helper',
    };
  }
  return {
    category: 'Runtime Exception / Component Boundary',
    hypothesis: `Unhandled exception surfaced in ${log.componentName || 'Global'} boundary. Inspect stack trace frames and input payload before modifying handler logic.`,
    suggestedFiles: log.componentName || 'Component referenced in stack trace',
  };
}

export const FounderObservabilityView: React.FC<FounderObservabilityViewProps> = ({
  globalActivity,
  companies,
  allUsers,
  quotaRequests,
  onOpenAuditTrail,
  onOpenQuotaModal,
  showNotification,
}) => {
  const { uiStyle } = useSettings();
  const [subTab, setSubTab] = useState<'activity' | 'telemetry' | 'errorLogs'>('activity');
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logToDelete, setLogToDelete] = useState<any | null>(null);
  const [proposalModal, setProposalModal] = useState<ProposalFixModalState | null>(null);

  // Zero unnecessary reads: subscribe to error_logs ONLY while errorLogs sub-tab is active
  useEffect(() => {
    if (subTab !== 'errorLogs') return;
    setLogsLoading(true);
    const unsubscribe = errorService.subscribeToLogs((logs: any[]) => {
      setErrorLogs(logs);
      setLogsLoading(false);
    });
    return () => unsubscribe();
  }, [subTab]);

  // Zero extra reads: compute Quota & Read Telemetry directly from shared Founder state
  const telemetrySummary = useMemo(() => {
    let totalUsed = 0;
    let totalReads = 0;
    let totalWrites = 0;
    let totalDeletes = 0;
    let totalCeiling = 0;
    let unlimitedCount = 0;
    const alertTenants: CompanyStats[] = [];

    companies.forEach((c) => {
      const used = Number(c.quotaUsed || 0);
      const limit = c.quotaLimit !== undefined ? Number(c.quotaLimit) : 10000;
      totalUsed += used;
      totalReads += Number((c as any).quotaReads || 0);
      totalWrites += Number((c as any).quotaWrites || 0);
      totalDeletes += Number((c as any).quotaDeletes || 0);
      if (limit === -1) {
        unlimitedCount += 1;
      } else {
        totalCeiling += limit;
        if (limit > 0 && used / limit >= 0.75) {
          alertTenants.push(c);
        }
      }
    });

    const pendingRequestsCount = quotaRequests.filter((r) => r.status === 'pending').length;

    return {
      totalUsed,
      totalReads,
      totalWrites,
      totalDeletes,
      totalCeiling,
      unlimitedCount,
      pendingRequestsCount,
      alertTenants: alertTenants.sort((a, b) => Number(b.quotaUsed || 0) - Number(a.quotaUsed || 0)),
      sortedCompanies: [...companies].sort((a, b) => Number(b.quotaUsed || 0) - Number(a.quotaUsed || 0)),
    };
  }, [companies, quotaRequests]);

  const openProposalModal = (log: any) => {
    const diag = deriveRootCauseHypothesis(log);
    const assembledPrompt = `Please review and propose a verified fix for the following system error log:

### Error Details:
- **Message:** ${log.message}
- **Component:** ${log.componentName || 'Global'}
- **Source Path:** ${log.path || 'N/A'}
- **Severity:** ${log.severity || 'error'}
- **Static Classification:** ${diag.category}
- **Suggested Scope:** ${diag.suggestedFiles}
${log.stack ? `\n### Stack Trace:\n\`\`\`\n${log.stack}\n\`\`\`` : ''}
${log.metadata ? `\n### Metadata:\n\`\`\`json\n${JSON.stringify(log.metadata, null, 2)}\n\`\`\`` : ''}

### Invariants Guardrail:
- Preserve double-entry debit/credit math (+debit, -credit), FIFO inventory valuation, formatQuantity integer rules, voucher numbering, and strict Company Legal Identity isolation.`;

    setProposalModal({
      isOpen: true,
      logId: log.id,
      logMessage: log.message || 'Unknown Error',
      componentName: log.componentName || 'Global',
      path: log.path || 'N/A',
      severity: log.severity || 'error',
      stack: log.stack,
      metadata: log.metadata,
      assembledPrompt,
    });
  };

  const copyProposalPromptOnly = async () => {
    if (!proposalModal) return;
    try {
      await navigator.clipboard.writeText(proposalModal.assembledPrompt);
      showNotification('Diagnostic proposal prompt copied to clipboard.', 'success');
    } catch {
      showNotification('Clipboard unavailable. Select and copy prompt manually.', 'warning');
    }
  };

  const copyAndRegisterInvestigation = async () => {
    if (!proposalModal) return;
    try {
      await navigator.clipboard.writeText(proposalModal.assembledPrompt).catch(() => {});
      await errorService.updateLogAiStatus(proposalModal.logId, 'requested', 'investigating');
      showNotification('Diagnostic prompt copied & log marked Investigating.', 'success');
    } catch {
      showNotification('Failed to update error log status.', 'error');
    }
  };

  const markLogResolved = async () => {
    if (!proposalModal) return;
    try {
      await errorService.updateLogStatus(proposalModal.logId, 'resolved');
      showNotification('Error log marked as Resolved.', 'success');
      setProposalModal(null);
    } catch {
      showNotification('Failed to update log status.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border w-fit flex-wrap">
          <button
            type="button"
            onClick={() => setSubTab('activity')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'activity'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Activity className="w-3.5 h-3.5" />
            Activity & Audit ({globalActivity.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('telemetry')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'telemetry'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Database className="w-3.5 h-3.5" />
            Quota & Read Telemetry
            {telemetrySummary.alertTenants.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-mono">
                {telemetrySummary.alertTenants.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('errorLogs')}
            className={cn(
              'px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2',
              subTab === 'errorLogs'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <FileWarning className="w-3.5 h-3.5" />
            Error Logs & 1-CLICK AI FIX
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenAuditTrail}
          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all w-fit"
        >
          <Eye className="w-3.5 h-3.5" />
          Launch Audit Trail Detail View
        </button>
      </div>

      {/* Sub-tab 1: Global Activity & Audit Trail */}
      {subTab === 'activity' && (
        <div
          className={cn(
            'bg-card border border-border rounded-xl shadow-sm overflow-x-auto',
            uiStyle === 'UI/UX 2' && 'border-blue-100 shadow-md'
          )}
        >
          <div className="min-w-[680px] lg:min-w-0">
            <div
              className={cn(
                'p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                uiStyle === 'UI/UX 2' ? 'bg-blue-600 text-white' : 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className={cn('w-5 h-5', uiStyle === 'UI/UX 2' ? 'text-white' : 'text-indigo-500')} />
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest">Global Activity &amp; System Audit Trail</h2>
                  <p className={cn('text-[11px]', uiStyle === 'UI/UX 2' ? 'text-blue-100' : 'text-muted-foreground')}>
                    Granular IP tracking, User-Agent forensics, and database change history.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider opacity-80">
                {globalActivity.length} Recent Events
              </span>
            </div>

            <div className="divide-y divide-border">
              {globalActivity && globalActivity.length > 0 ? (
                globalActivity.map((log) => {
                  const company = companies.find((c) => c.id === log.companyId);
                  const user = allUsers.find((u) => u.uid === log.userId);
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        'p-4 transition-colors flex items-center justify-between gap-4',
                        uiStyle === 'UI/UX 2' ? 'hover:bg-blue-50/50' : 'hover:bg-muted/30'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                            uiStyle === 'UI/UX 2' ? 'bg-blue-100 text-blue-600' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-sm font-bold',
                                uiStyle === 'UI/UX 2' ? 'text-blue-600' : 'text-foreground'
                              )}
                            >
                              {log.action}
                            </span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                              {company?.name || log.companyName || 'System'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            by{' '}
                            <span
                              className={cn(
                                'font-medium',
                                uiStyle === 'UI/UX 2' ? 'text-blue-500' : 'text-foreground'
                              )}
                            >
                              {user?.displayName || log.userName || 'Unknown User'}
                            </span>
                            {log.details && ` • ${log.details}`}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                          {safeFormatDate(log.createdAt, 'dd MMM, HH:mm:ss')}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-12 text-center">
                  <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                  <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Zero-Read Quota & Read Telemetry */}
      {subTab === 'telemetry' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total Ops Recorded Today
              </p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {telemetrySummary.totalUsed.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                Reads: {telemetrySummary.totalReads.toLocaleString()} • Writes: {telemetrySummary.totalWrites.toLocaleString()} • Del: {telemetrySummary.totalDeletes.toLocaleString()}
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Combined Metered Ceiling
              </p>
              <p className="text-2xl font-bold font-mono text-foreground">
                {telemetrySummary.totalCeiling.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                +{telemetrySummary.unlimitedCount} Unlimited tenant(s)
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                High-Usage Tenants (&ge;75%)
              </p>
              <p className={cn('text-2xl font-bold font-mono', telemetrySummary.alertTenants.length > 0 ? 'text-amber-500' : 'text-emerald-500')}>
                {telemetrySummary.alertTenants.length}
              </p>
              <p className="text-[10px] text-muted-foreground">Derived locally (0 extra Firestore reads)</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Pending Quota Requests
              </p>
              <p className={cn('text-2xl font-bold font-mono', telemetrySummary.pendingRequestsCount > 0 ? 'text-rose-500' : 'text-foreground')}>
                {telemetrySummary.pendingRequestsCount}
              </p>
              <p className="text-[10px] text-muted-foreground">Approve directly from table below</p>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 bg-muted/30 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-foreground">
                  Tenant Firestore Quota Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-muted-foreground uppercase">
                Zero-Read Cached Directory Snapshot
              </span>
            </div>
            <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b border-border">
                  <tr>
                    <th className="p-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Company
                    </th>
                    <th className="p-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Plan
                    </th>
                    <th className="p-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Usage / Limit
                    </th>
                    <th className="p-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      R / W / D Breakdown
                    </th>
                    <th className="p-3.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {telemetrySummary.sortedCompanies.map((comp) => {
                    const qLimit = comp.quotaLimit !== undefined ? Number(comp.quotaLimit) : 10000;
                    const qUsed = Number(comp.quotaUsed || 0);
                    const isUnlimited = qLimit === -1;
                    const pct = isUnlimited ? 0 : Math.min(100, Math.round((qUsed / Math.max(1, qLimit)) * 100));
                    const isOver = !isUnlimited && qUsed >= qLimit;

                    return (
                      <tr key={comp.id} className="hover:bg-muted/20 transition-colors">
                        <td className="p-3.5 align-middle">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-foreground">{comp.name}</span>
                            <span className="text-[10px] font-mono text-muted-foreground">{comp.id}</span>
                          </div>
                        </td>
                        <td className="p-3.5 align-middle">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-foreground">
                            {comp.planType || 'free'}
                          </span>
                        </td>
                        <td className="p-3.5 align-middle">
                          <div className="space-y-1 min-w-[160px]">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className={cn('font-bold', isOver ? 'text-rose-500' : pct >= 75 ? 'text-amber-500' : 'text-emerald-600')}>
                                {qUsed.toLocaleString()} / {isUnlimited ? '∞' : qLimit.toLocaleString()}
                              </span>
                              {!isUnlimited && <span className="text-[10px] text-muted-foreground">{pct}%</span>}
                            </div>
                            {!isUnlimited && (
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    isOver ? 'bg-rose-500' : pct >= 75 ? 'bg-amber-500' : 'bg-emerald-500'
                                  )}
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 align-middle font-mono text-[11px] text-muted-foreground">
                          {Number((comp as any).quotaReads || 0).toLocaleString()} R /{' '}
                          {Number((comp as any).quotaWrites || 0).toLocaleString()} W /{' '}
                          {Number((comp as any).quotaDeletes || 0).toLocaleString()} D
                        </td>
                        <td className="p-3.5 align-middle text-right">
                          <button
                            type="button"
                            onClick={() => onOpenQuotaModal(comp)}
                            className="px-3 py-1.5 bg-primary/10 hover:bg-primary hover:text-white text-primary rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all inline-flex items-center gap-1.5"
                          >
                            <Sliders className="w-3 h-3" />
                            Adjust / Approve
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 3: System Error Logs & Proposal-First 6-Step 1-CLICK AI FIX */}
      {subTab === 'errorLogs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2
                className={cn(
                  'text-lg font-bold uppercase tracking-widest',
                  uiStyle === 'UI/UX 2' ? 'text-blue-600' : 'text-foreground'
                )}
              >
                System Error Logs
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Proposal-First diagnostic workflow (non-autonomous; review before applying any code or DB change).
              </p>
            </div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              Total Logs: {errorLogs.length}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b border-border">
                  <tr>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Error Details
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      User / Location
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Severity
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Status
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground align-middle">
                      Time
                    </th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right px-6 align-middle">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground italic align-middle">
                        Loading error logs...
                      </td>
                    </tr>
                  ) : errorLogs.length > 0 ? (
                    errorLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/30 transition-colors group">
                        <td className="p-4 max-w-md align-middle">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-foreground break-words">{log.message}</p>
                            <p className="text-[10px] text-muted-foreground font-mono truncate cursor-help" title={log.stack}>
                              {log.componentName || 'Global'} • {log.path}
                            </p>
                            {log.stack && (
                              <details className="mt-2 text-[9px] font-mono bg-muted p-2 rounded max-h-40 overflow-auto">
                                <summary className="cursor-pointer hover:text-primary list-none flex items-center gap-1 font-bold uppercase">
                                  <ChevronDown className="w-3 h-3 text-current" /> View Stack Trace
                                </summary>
                                <pre className="mt-2 whitespace-pre-wrap leading-relaxed opacity-80 border-l border-primary/20 pl-2">
                                  {log.stack}
                                </pre>
                              </details>
                            )}
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <div className="space-y-1 text-xs">
                            <p className="font-bold text-foreground">{log.userEmail || 'Anonymous'}</p>
                            <p className="text-[9px] text-muted-foreground truncate max-w-[150px]" title={log.browserInfo}>
                              {log.browserInfo}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 align-middle">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest',
                              log.severity === 'critical'
                                ? 'bg-rose-500 text-white'
                                : log.severity === 'error'
                                ? 'bg-rose-500/10 text-rose-500 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.2)]'
                                : log.severity === 'warning'
                                ? 'bg-amber-500/10 text-amber-500'
                                : 'bg-blue-500/10 text-blue-500'
                            )}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="p-4 align-middle">
                          <select
                            value={log.status}
                            onChange={async (e) => {
                              try {
                                await errorService.updateLogStatus(log.id, e.target.value as any);
                              } catch {
                                showNotification('Failed to update log status', 'error');
                              }
                            }}
                            className={cn(
                              'bg-transparent text-[10px] font-bold uppercase tracking-wider border border-border p-1 rounded focus:ring-0 cursor-pointer outline-none',
                              log.status === 'new'
                                ? 'text-rose-500 border-rose-500/20'
                                : log.status === 'investigating'
                                ? 'text-amber-500 border-amber-500/20'
                                : log.status === 'resolved'
                                ? 'text-emerald-500 border-emerald-500/20'
                                : 'text-muted-foreground border-border'
                            )}
                          >
                            <option value="new">New</option>
                            <option value="investigating">Investigating</option>
                            <option value="resolved">Resolved</option>
                            <option value="ignored">Ignored</option>
                          </select>
                        </td>
                        <td className="p-4 align-middle">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                            {safeFormatDate(log.timestamp, 'dd MMM, HH:mm:ss')}
                          </p>
                        </td>
                        <td className="p-4 text-right px-6 align-middle">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openProposalModal(log)}
                              className={cn(
                                'px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest rounded-lg inline-flex items-center gap-1 shadow-sm transition-all border',
                                log.aiStatus === 'requested'
                                  ? 'bg-purple-950/20 text-purple-400 border-purple-500/30 font-mono'
                                  : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500/20'
                              )}
                              title="Open Proposal-First 6-Step Diagnostic Review"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              {log.aiStatus === 'requested' ? 'PROPOSAL OPEN' : '1-CLICK AI FIX'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setLogToDelete(log)}
                              className="p-2 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              title="Delete Log"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-muted-foreground italic align-middle">
                        No error logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Proposal-First 6-Step 1-CLICK AI FIX Modal (Strictly Non-Autonomous per Decision #8) */}
      <AnimatePresence>
        {proposalModal && proposalModal.isOpen && (() => {
          const diag = deriveRootCauseHypothesis(proposalModal);
          return (
            <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                className="bg-card border border-purple-500/30 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
              >
                <div className="p-5 border-b border-border flex items-center justify-between bg-purple-950/20 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-600/15 border border-purple-500/30 rounded-xl text-purple-500">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
                        Proposal-First 6-Step Diagnostic Fix Review
                      </h3>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        Non-autonomous review only • No automated code or database mutation
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setProposalModal(null)}
                    className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-5 overflow-y-auto space-y-4 text-xs">
                  {/* Step 1: Signal Capture */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                      Step 1 · Captured Signal
                    </p>
                    <p className="font-bold text-foreground break-words">{proposalModal.logMessage}</p>
                    <p className="text-[11px] font-mono text-muted-foreground">
                      Component: {proposalModal.componentName} · Path: {proposalModal.path} · Severity: {proposalModal.severity}
                    </p>
                  </div>

                  {/* Step 2: Static Root-Cause Hypothesis */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                      Step 2 · Static Root-Cause Hypothesis ({diag.category})
                    </p>
                    <p className="text-muted-foreground leading-relaxed">{diag.hypothesis}</p>
                    <p className="text-[10px] font-mono text-foreground">Candidate Scope: {diag.suggestedFiles}</p>
                  </div>

                  {/* Step 3: Proposed Fix Plan & Core Accounting Invariants Guardrail */}
                  <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400">
                      Step 3 · Proposed Fix Plan & Invariants Guardrail
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-foreground">
                      <li>Verify null/undefined boundary handling and quota/permission fallback before editing logic.</li>
                      <li>Preserve Double-Entry Dr/Cr signs (+debit, -credit), FIFO inventory logic, and formatQuantity integer rules.</li>
                      <li>Preserve voucher numbering counters and strict App Identity vs. Company Legal Identity isolation.</li>
                    </ul>
                  </div>

                  {/* Step 4: Review Diagnostic Prompt Package */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                        Step 4 · Review Diagnostic Prompt Package
                      </p>
                      <button
                        type="button"
                        onClick={copyProposalPromptOnly}
                        className="px-2.5 py-1 rounded-md border border-border bg-background hover:bg-muted text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Only
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={proposalModal.assembledPrompt}
                      rows={6}
                      className="w-full bg-background border border-border rounded-lg p-3 font-mono text-[11px] text-foreground outline-none resize-y"
                    />
                  </div>

                  {/* Step 5: Manual Action Controls */}
                  <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                      Step 5 · Explicit Manual Action Controls
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={copyProposalPromptOnly}
                        className="px-3.5 py-2 rounded-lg border border-border bg-background hover:bg-muted text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Proposal Prompt
                      </button>
                      <button
                        type="button"
                        onClick={copyAndRegisterInvestigation}
                        className="px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Copy & Mark Investigating
                      </button>
                    </div>
                  </div>

                  {/* Step 6: Verification Sign-Off Checklist */}
                  <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <ClipboardCheck className="w-4 h-4" />
                        Step 6 · Verification Sign-Off Checklist
                      </p>
                      <button
                        type="button"
                        onClick={markLogResolved}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Mark Resolved
                      </button>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Before closing: confirm type-check (tsc --noEmit), production build (vite build), and manual verification on the affected module.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Delete Error Log Confirmation Modal */}
      <AnimatePresence>
        {logToDelete && (
          <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Error Log?</h3>
              </div>
              <p className="text-xs text-muted-foreground break-words">
                Remove log entry: <span className="font-semibold text-foreground">{logToDelete.message}</span>?
              </p>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLogToDelete(null)}
                  className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await errorService.deleteLog(logToDelete.id);
                      showNotification('Error log deleted.', 'success');
                      setLogToDelete(null);
                    } catch {
                      showNotification('Failed to delete log.', 'error');
                    }
                  }}
                  className="px-4 py-2 bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600"
                >
                  Delete Log
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
