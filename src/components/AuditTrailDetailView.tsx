import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  ExternalLink, 
  Terminal, 
  Database, 
  Globe, 
  User, 
  Clock, 
  Laptop, 
  ArrowRight, 
  Lock, 
  Eye, 
  FileJson, 
  Layers,
  ChevronRight,
  Activity,
  AlertOctagon,
  Ban
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { SystemAuditLog, AuditEventType, AuditSeverity, AuditStatus } from '../types';
import { securityAuditService } from '../services/securityAuditService';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface AuditTrailDetailViewProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedLogId?: string | null;
}

export const AuditTrailDetailView: React.FC<AuditTrailDetailViewProps> = ({
  isOpen,
  onClose,
  initialSelectedLogId
}) => {
  const { user } = useAuth();
  const { showNotification } = useNotification();

  // Strict Founder-Only Gate Check
  const isFounder = useMemo(() => {
    if (!user) return false;
    const email = user.email?.toLowerCase();
    const role = user.role;
    return role === 'Founder' || email === 'sapientman46@gmail.com';
  }, [user]);

  // State
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | 'all'>('all');
  const [selectedLog, setSelectedLog] = useState<SystemAuditLog | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'diff' | 'raw' | 'threat'>('diff');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fetch logs on mount / open
  const fetchAuditLogs = async (force: boolean = false) => {
    if (!isFounder) return;
    setLoading(true);
    try {
      const data = await securityAuditService.getAuditLogs({ forceRefresh: force, limitCount: 150 });
      setLogs(data);
      if (initialSelectedLogId) {
        const found = data.find(l => l.id === initialSelectedLogId);
        if (found) setSelectedLog(found);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
      showNotification('Failed to load audit logs from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAuditLogs();
    }
  }, [isOpen, isFounder]);

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          log.action.toLowerCase().includes(term) ||
          log.actor.email.toLowerCase().includes(term) ||
          log.actor.displayName.toLowerCase().includes(term) ||
          log.network.ipAddress.toLowerCase().includes(term) ||
          log.databaseTarget.collectionName.toLowerCase().includes(term) ||
          log.databaseTarget.documentId.toLowerCase().includes(term) ||
          (log.threatDetails?.reason && log.threatDetails.reason.toLowerCase().includes(term));
        if (!matchesSearch) return false;
      }

      // Event Type
      if (selectedEventType !== 'ALL' && log.eventType !== selectedEventType) {
        return false;
      }

      // Severity
      if (selectedSeverity !== 'ALL' && log.severity !== selectedSeverity) {
        return false;
      }

      // Status
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) {
        return false;
      }

      // Time Range
      if (timeRange !== 'all') {
        const logDate = new Date(log.timestamp).getTime();
        const now = Date.now();
        const diffHours = (now - logDate) / (1000 * 60 * 60);
        if (timeRange === '24h' && diffHours > 24) return false;
        if (timeRange === '7d' && diffHours > 24 * 7) return false;
        if (timeRange === '30d' && diffHours > 24 * 30) return false;
      }

      return true;
    });
  }, [logs, searchTerm, selectedEventType, selectedSeverity, selectedStatus, timeRange]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const blocked = logs.filter(l => l.status === 'blocked').length;
    const suspicious = logs.filter(l => l.status === 'suspicious' || l.severity === 'critical').length;
    const mutations = logs.filter(l => l.changeHistory?.hasDiff).length;
    const uniqueIps = new Set(logs.map(l => l.network.ipAddress)).size;
    return { total, blocked, suspicious, mutations, uniqueIps };
  }, [logs]);

  // Copy to clipboard helper
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showNotification(`Copied ${label} to clipboard`, 'success');
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Export to CSV
  const handleExportCsv = () => {
    try {
      const headers = ['Timestamp', 'Severity', 'Status', 'Event Type', 'Action', 'Actor Email', 'Actor Role', 'Company', 'IP Address', 'Browser', 'OS', 'Target Collection', 'Target Doc ID'];
      const rows = filteredLogs.map(l => [
        `"${l.timestamp}"`,
        `"${l.severity}"`,
        `"${l.status}"`,
        `"${l.eventType}"`,
        `"${l.action.replace(/"/g, '""')}"`,
        `"${l.actor.email}"`,
        `"${l.actor.role}"`,
        `"${l.actor.companyName || ''}"`,
        `"${l.network.ipAddress}"`,
        `"${l.network.browser || ''}"`,
        `"${l.network.os || ''}"`,
        `"${l.databaseTarget.collectionName}"`,
        `"${l.databaseTarget.documentId}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `system_audit_trail_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Audit log CSV exported successfully', 'success');
    } catch {
      showNotification('Failed to export CSV', 'error');
    }
  };

  // Export to JSON
  const handleExportJson = () => {
    try {
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
      const link = document.createElement('a');
      link.setAttribute('href', dataStr);
      link.setAttribute('download', `system_audit_trail_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showNotification('Audit log JSON exported successfully', 'success');
    } catch {
      showNotification('Failed to export JSON', 'error');
    }
  };

  if (!isOpen) return null;

  // Non-Founder Access Denied Protection Screen
  if (!isFounder) {
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
        <div className="bg-card border border-rose-500/40 max-w-lg w-full rounded-2xl p-6 text-center shadow-2xl space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold uppercase tracking-wider text-rose-500">
              Access Denied: Founder Only Console
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Granular system-level event logs (including user IP addresses, browser user-agents, and raw database change histories) are strictly restricted to the Sovereign System Founder.
            </p>
          </div>
          <div className="p-3 bg-muted/40 rounded-xl text-left border border-border text-[11px] font-mono text-muted-foreground space-y-1">
            <div className="text-rose-400 font-bold uppercase text-[10px]">Security Invariant Enforced:</div>
            <div>User: {user?.email || 'Anonymous'}</div>
            <div>Role: {user?.role || 'Guest'}</div>
            <div>Status: BLOCKED &amp; LOGGED (ABAC Invariant)</div>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-secondary hover:bg-secondary/80 text-foreground font-bold rounded-xl uppercase tracking-wider text-xs transition-colors"
          >
            Close Security Warning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 backdrop-blur-sm p-2 sm:p-4 md:p-6 overflow-hidden">
      <div className="bg-background border border-border w-full max-w-7xl h-[94vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-foreground">
        
        {/* Sticky Top Header */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-md border-b border-border px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-500 shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold uppercase tracking-wider text-foreground">
                  System Audit Trail &amp; Security Intelligence
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Founder Sovereign Access
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Granular hardware &amp; IP fingerprints, before/after database mutation diffs, and intrusion monitoring.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAuditLogs(true)}
              disabled={loading}
              className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
              title="Refresh Audit Logs"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
              title="Export Filtered Logs as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border"
              title="Export Filtered Logs as JSON"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors ml-1"
              title="Close Audit Trail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Security Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-4 bg-muted/20 border-b border-border">
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500" /> Total Events
            </div>
            <div className="text-lg font-bold text-foreground mt-1">{stats.total}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5 text-rose-500" /> Blocked Attempts
            </div>
            <div className="text-lg font-bold text-rose-500 mt-1 flex items-center gap-2">
              {stats.blocked}
              {stats.blocked > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 bg-rose-500/10 text-rose-500 rounded font-bold uppercase animate-pulse">
                  Alert
                </span>
              )}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Suspicious Actions
            </div>
            <div className="text-lg font-bold text-amber-500 mt-1">{stats.suspicious}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" /> DB Mutations
            </div>
            <div className="text-lg font-bold text-emerald-500 mt-1">{stats.mutations}</div>
          </div>

          <div className="bg-card border border-border rounded-xl p-3 shadow-sm col-span-2 sm:col-span-1">
            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-500" /> Monitored IPs
            </div>
            <div className="text-lg font-bold text-foreground mt-1">{stats.uniqueIps}</div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-border bg-card/60 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter by IP, email, document ID, collection name, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Event Type Filter */}
            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="ALL">All Event Types</option>
              <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Unauthorized Access Attempts</option>
              <option value="PERMISSION_DENIED">Permission Denied Events</option>
              <option value="ROLE_PRIVILEGE_CHANGE">Privilege Escalation Attempts</option>
              <option value="QUOTA_OVERRIDE">Quota Limit Modifications</option>
              <option value="DATA_MUTATION">Database Mutations</option>
              <option value="DATA_DELETION">Database Deletions</option>
              <option value="LOGIN">User Logins</option>
              <option value="SECURITY_ALERT">Security Alerts</option>
            </select>

            {/* Severity Filter */}
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="ALL">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-background border border-border rounded-lg px-2.5 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-medium"
            >
              <option value="ALL">All Statuses</option>
              <option value="blocked">Blocked</option>
              <option value="allowed">Allowed</option>
              <option value="suspicious">Suspicious</option>
            </select>

            {/* Time Filter */}
            <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs font-semibold">
              <button
                onClick={() => setTimeRange('24h')}
                className={cn("px-2 py-1 rounded text-[11px]", timeRange === '24h' ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground")}
              >
                24h
              </button>
              <button
                onClick={() => setTimeRange('7d')}
                className={cn("px-2 py-1 rounded text-[11px]", timeRange === '7d' ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground")}
              >
                7d
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={cn("px-2 py-1 rounded text-[11px]", timeRange === '30d' ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground")}
              >
                30d
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={cn("px-2 py-1 rounded text-[11px]", timeRange === 'all' ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground hover:text-foreground")}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Content Area: Table + Side Detail Drawer */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* Main Table Section (Scrollable with Sticky Header) */}
          <div className={cn(
            "flex-1 overflow-y-auto border-r border-border",
            selectedLog ? "lg:max-w-[60%]" : "w-full"
          )}>
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur border-b border-border shadow-sm">
                <tr>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center" style={{ verticalAlign: 'middle' }}>
                    #
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    Time
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    Status &amp; Severity
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    Action / Event
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    Actor
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    IP &amp; Device
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                    Database Target
                  </th>
                  <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right" style={{ verticalAlign: 'middle' }}>
                    Inspect
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => {
                    const isSelected = selectedLog?.id === log.id;
                    const isBlocked = log.status === 'blocked';
                    const isCritical = log.severity === 'critical';

                    return (
                      <tr 
                        key={log.id} 
                        onClick={() => setSelectedLog(log)}
                        className={cn(
                          "transition-colors cursor-pointer group",
                          isSelected ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/40",
                          isBlocked && !isSelected && "bg-rose-500/[0.03]"
                        )}
                      >
                        <td className="p-3 text-center text-[11px] font-mono text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                          {index + 1}
                        </td>
                        <td className="p-3 whitespace-nowrap text-xs" style={{ verticalAlign: 'middle' }}>
                          <div className="font-semibold text-foreground">
                            {format(new Date(log.timestamp), 'dd MMM yyyy')}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {format(new Date(log.timestamp), 'HH:mm:ss')} BST
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                          <div className="flex flex-col gap-1 items-start">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1",
                              log.status === 'blocked' ? "bg-rose-500/15 text-rose-500 border border-rose-500/30" :
                              log.status === 'suspicious' ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" :
                              "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                            )}>
                              {log.status === 'blocked' ? <Ban className="w-2.5 h-2.5" /> : <ShieldCheck className="w-2.5 h-2.5" />}
                              {log.status}
                            </span>
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-wider px-1.5 rounded",
                              log.severity === 'critical' ? "bg-rose-500 text-white animate-pulse" :
                              log.severity === 'high' ? "bg-orange-500/10 text-orange-500" :
                              log.severity === 'medium' ? "bg-amber-500/10 text-amber-500" :
                              "bg-slate-500/10 text-slate-400"
                            )}>
                              {log.severity}
                            </span>
                          </div>
                        </td>
                        <td className="p-3" style={{ verticalAlign: 'middle' }}>
                          <div className="max-w-[260px]">
                            <p className={cn(
                              "text-xs font-bold truncate",
                              isBlocked ? "text-rose-500" : "text-foreground"
                            )}>
                              {log.action}
                            </p>
                            {log.threatDetails?.reason && (
                              <p className="text-[10px] text-muted-foreground truncate italic">
                                {log.threatDetails.reason}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                          <div className="text-xs">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span className="truncate max-w-[130px]">{log.actor.displayName || 'System'}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px]">
                              {log.actor.email}
                            </div>
                            <span className="inline-block text-[9px] px-1 bg-muted rounded font-bold uppercase text-muted-foreground mt-0.5">
                              {log.actor.role}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                          <div className="text-xs">
                            <div className="font-mono font-bold text-foreground flex items-center gap-1">
                              <Globe className="w-3 h-3 text-primary" />
                              <span>{log.network.ipAddress}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Laptop className="w-3 h-3" />
                              <span>{log.network.browser || 'Browser'} / {log.network.os || 'OS'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                          <div className="text-xs">
                            <div className="font-bold text-primary font-mono flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              <span>{log.databaseTarget.collectionName}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                              {log.databaseTarget.documentId}
                            </div>
                            {log.changeHistory?.hasDiff && (
                              <span className="text-[9px] text-emerald-500 font-bold">
                                {log.changeHistory.changedFields?.length || 0} fields altered
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right" style={{ verticalAlign: 'middle' }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className={cn(
                              "px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border transition-all flex items-center gap-1 ml-auto",
                              isSelected 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "bg-muted/60 hover:bg-muted text-foreground border-border"
                            )}
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      <Shield className="w-10 h-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-sm font-semibold">No audit events match your filter criteria.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedEventType('ALL');
                          setSelectedSeverity('ALL');
                          setSelectedStatus('ALL');
                          setTimeRange('all');
                        }}
                        className="mt-2 text-xs text-primary font-bold hover:underline"
                      >
                        Reset All Filters
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Side Drawer: Detailed Event Inspector */}
          {selectedLog ? (
            <div className="flex-1 lg:max-w-[40%] bg-card flex flex-col overflow-y-auto border-t lg:border-t-0 border-border">
              
              {/* Drawer Header */}
              <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between sticky top-0 z-10 backdrop-blur">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "p-1.5 rounded-lg",
                    selectedLog.status === 'blocked' ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
                  )}>
                    <Terminal className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Event Forensic Inspector
                    </h3>
                    <p className="text-[10px] font-mono text-muted-foreground">{selectedLog.id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(JSON.stringify(selectedLog, null, 2), 'Full Event JSON')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Copy Full Event JSON"
                  >
                    {copiedField === 'Full Event JSON' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                    title="Close Inspector Drawer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Drawer Body */}
              <div className="p-4 space-y-5 flex-1">
                
                {/* Threat Banner (If blocked or suspicious) */}
                {selectedLog.threatDetails && (
                  <div className={cn(
                    "p-3 rounded-xl border text-xs space-y-1.5",
                    selectedLog.status === 'blocked'
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                      : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  )}>
                    <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
                      <AlertOctagon className="w-3.5 h-3.5" />
                      Security Threat Assessment
                    </div>
                    <div className="font-semibold text-foreground text-xs">
                      {selectedLog.threatDetails.reason}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                      <div>
                        <span className="text-muted-foreground">Attack Vector: </span>
                        <span className="font-mono font-bold text-foreground">{selectedLog.threatDetails.attackVector || 'Direct Request'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Enforcement: </span>
                        <span className="font-mono font-bold text-foreground">{selectedLog.threatDetails.mitigationTaken}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actor & Identity Card */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-primary" /> Actor Identity</span>
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-bold uppercase">{selectedLog.actor.role}</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-foreground">{selectedLog.actor.displayName || 'Anonymous Actor'}</div>
                    <div className="text-muted-foreground font-mono flex items-center justify-between">
                      <span>{selectedLog.actor.email}</span>
                      <button 
                        onClick={() => handleCopy(selectedLog.actor.email, 'Email')} 
                        className="text-[10px] hover:text-foreground text-muted-foreground"
                      >
                        Copy
                      </button>
                    </div>
                    {selectedLog.actor.companyName && (
                      <div className="text-[11px] text-muted-foreground pt-1">
                        Company: <span className="font-semibold text-foreground">{selectedLog.actor.companyName}</span> ({selectedLog.actor.companyId})
                      </div>
                    )}
                    <div className="text-[10px] text-muted-foreground font-mono">
                      UID: {selectedLog.actor.uid}
                    </div>
                  </div>
                </div>

                {/* Network & Client Hardware Card */}
                <div className="bg-muted/30 border border-border rounded-xl p-3 space-y-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 text-indigo-500" /> Client Hardware &amp; IP</span>
                    <button
                      onClick={() => handleCopy(selectedLog.network.ipAddress, 'IP Address')}
                      className="text-primary hover:underline flex items-center gap-1 text-[10px]"
                    >
                      <Copy className="w-3 h-3" /> Copy IP
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">IP Address</span>
                      <span className="font-mono font-bold text-foreground">{selectedLog.network.ipAddress}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Geo / Location</span>
                      <span className="font-medium text-foreground">{selectedLog.network.location || 'Dhaka, Bangladesh'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Browser</span>
                      <span className="font-medium text-foreground">{selectedLog.network.browser || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Operating System</span>
                      <span className="font-medium text-foreground">{selectedLog.network.os || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Raw User Agent block */}
                  <div className="pt-2">
                    <span className="text-[10px] text-muted-foreground block mb-1">Raw User-Agent Header</span>
                    <div className="p-2 bg-background border border-border rounded-lg text-[10px] font-mono text-muted-foreground break-all select-all">
                      {selectedLog.network.userAgent}
                    </div>
                  </div>
                </div>

                {/* Database Change History / Diff Inspector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Database Change History
                      </h4>
                    </div>

                    {/* Inspector Tabs */}
                    <div className="flex rounded-lg border border-border bg-background p-0.5 text-xs">
                      <button
                        onClick={() => setActiveDetailTab('diff')}
                        className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider", activeDetailTab === 'diff' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                      >
                        Diff View
                      </button>
                      <button
                        onClick={() => setActiveDetailTab('raw')}
                        className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider", activeDetailTab === 'raw' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
                      >
                        Raw JSON
                      </button>
                    </div>
                  </div>

                  {/* Target details */}
                  <div className="text-xs flex items-center justify-between bg-muted/40 p-2.5 rounded-lg border border-border font-mono">
                    <div>
                      <span className="text-muted-foreground">Collection: </span>
                      <span className="font-bold text-primary">{selectedLog.databaseTarget.collectionName}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Doc: </span>
                      <span className="font-bold text-foreground">{selectedLog.databaseTarget.documentId}</span>
                    </div>
                    <div>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase",
                        selectedLog.databaseTarget.operation === 'DELETE' ? "bg-rose-500/10 text-rose-500" :
                        selectedLog.databaseTarget.operation === 'CREATE' ? "bg-emerald-500/10 text-emerald-500" :
                        "bg-blue-500/10 text-blue-500"
                      )}>
                        {selectedLog.databaseTarget.operation}
                      </span>
                    </div>
                  </div>

                  {/* Tab 1: Diff View */}
                  {activeDetailTab === 'diff' && (
                    <div className="space-y-2">
                      {selectedLog.changeHistory?.changedFields && selectedLog.changeHistory.changedFields.length > 0 ? (
                        <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
                          {selectedLog.changeHistory.changedFields.map((fieldDiff, i) => (
                            <div key={i} className="p-3 bg-card space-y-1.5 text-xs">
                              <div className="font-mono font-bold text-primary text-[11px] flex items-center gap-1.5">
                                <Layers className="w-3 h-3 text-muted-foreground" />
                                <span>{fieldDiff.field}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                                <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400">
                                  <div className="text-[9px] uppercase font-bold text-rose-500 mb-0.5">Previous Value</div>
                                  <div className="break-all">{JSON.stringify(fieldDiff.oldValue)}</div>
                                </div>
                                <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
                                  <div className="text-[9px] uppercase font-bold text-emerald-500 mb-0.5">New Value</div>
                                  <div className="break-all">{JSON.stringify(fieldDiff.newValue)}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-6 text-center text-muted-foreground bg-muted/20 rounded-xl border border-border text-xs italic">
                          No scalar field mutation diff recorded (e.g. read operation or non-diff mutation).
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: Raw JSON */}
                  {activeDetailTab === 'raw' && (
                    <div className="relative">
                      <pre className="p-3 bg-black/80 text-emerald-400 rounded-xl border border-border text-[11px] font-mono overflow-x-auto max-h-[300px] select-all">
                        {JSON.stringify(selectedLog, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Action footer inside drawer */}
                <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                  <div className="text-[10px] text-muted-foreground">
                    Logged at: {format(new Date(selectedLog.timestamp), 'dd MMM yyyy, HH:mm:ss')}
                  </div>
                  <button
                    onClick={() => {
                      showNotification(`Security flag placed on actor ${selectedLog.actor.email}`, 'info');
                    }}
                    className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Flag Account
                  </button>
                </div>

              </div>
            </div>
          ) : (
            <div className="hidden lg:flex flex-1 lg:max-w-[40%] bg-card/40 items-center justify-center p-8 text-center text-muted-foreground">
              <div className="space-y-2 max-w-xs">
                <Shield className="w-12 h-12 mx-auto text-muted-foreground/30" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Select an Event to Inspect</h3>
                <p className="text-xs leading-relaxed">
                  Click on any log row to review granular network forensic data, User-Agent parameters, and before/after database mutation history.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Bottom Status Bar */}
        <div className="bg-card border-t border-border px-5 py-3 text-[11px] text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              SAPIENT Security Kernel: Active
            </span>
            <span>•</span>
            <span>Zero-Trust ABAC Guarding Enabled</span>
            <span>•</span>
            <span>Showing {filteredLogs.length} of {logs.length} logged system operations</span>
          </div>

          <div className="text-[10px] font-mono text-muted-foreground">
            Strict Access Control: Founder Only
          </div>
        </div>

      </div>
    </div>
  );
};
