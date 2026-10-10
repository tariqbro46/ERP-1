import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Printer, 
  Download, 
  MessageSquare, 
  Phone, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Share2, 
  FileText, 
  Settings2, 
  ExternalLink,
  Copy,
  Check,
  Send,
  UserCheck,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { erpService } from '../services/erpService';
import { EditableHeader } from './EditableHeader';
import { SkeletonLoader } from './SkeletonLoader';
import { formatCurrency, cn, ensureDate } from '../lib/utils';
import { printUtils } from '../utils/printUtils';
import { exportToCSV } from '../utils/exportUtils';

interface DueCustomer {
  id: string;
  name: string;
  group_name: string;
  phone: string;
  email: string;
  address?: string;
  due_amount: number;
  credit_limit?: number;
  last_invoice_date?: string;
  days_overdue: number;
  urgency: 'low' | 'medium' | 'critical';
  followed_up_today?: boolean;
}

interface MessageTemplates {
  whatsapp: string;
  sms: string;
  emailSubject: string;
  emailBody: string;
}

const DEFAULT_TEMPLATES: MessageTemplates = {
  whatsapp: `সুপ্রিয় {{customerName}},\n{{companyName}} থেকে বিনীতভাবে জানানো যাচ্ছে যে, আপনার পূর্বের বিল বাবদ মোট বকেয়া পাওনা ৳{{dueAmount}} টাকা।\n\nঅনুগ্রহ করে দ্রুততম সময়ের মধ্যে বকেয়া পরিশোধ করার জন্য অনুরোধ করা হলো।\n\nযেকোনো সহযোগিতার জন্য যোগাযোগ করুন: {{contactPhone}}\nধন্যবাদান্তে,\n{{companyName}}`,
  sms: `Priyo {{customerName}}, {{companyName}} er bokeya paona ৳{{dueAmount}} tk druto porishodh korar onurodh roilo. Helpline: {{contactPhone}}`,
  emailSubject: `বকেয়া পরিশোধের তাগাদাপত্র / Payment Due Reminder - {{companyName}}`,
  emailBody: `সম্মানিত {{customerName}},\n\nশুভেচ্ছা গ্রহণ করবেন। {{companyName}}-এর সাথে ব্যবসায়িক সম্পর্ক বজায় রাখার জন্য আপনাকে ধন্যবাদ।\n\nআপনার অবগতির জন্য জানানো যাচ্ছে যে, আপনার হিসাব বিবরণী অনুযায়ী বর্তমান বকেয়া পাওনা মোট ৳{{dueAmount}} টাকা (গত {{daysOverdue}} দিন যাবৎ বকেয়া)।\n\nউক্ত বকেয়া অর্থ দ্রুত পরিশোধ করে ব্যবসায়িক লেনদেন সচল রাখতে আপনার আন্তরিক সহযোগিতা কামনা করছি।\n\nবকেয়া বিবরণ:\n- কাস্টমার নাম: {{customerName}}\n- বকেয়ার পরিমাণ: ৳{{dueAmount}}\n- যোগাযোগের নম্বর: {{contactPhone}}\n\nধন্যবাদান্তে,\n{{companyName}}`
};

export function DuePaymentAlerts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const settings = useSettings();

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [customers, setCustomers] = useState<DueCustomer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [ageFilter, setAgeFilter] = useState<'all' | 'critical' | 'medium' | 'low'>('all');
  const [contactFilter, setContactFilter] = useState<'all' | 'has_phone' | 'has_email'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'done'>('all');

  // Modal states
  const [activeNoticeCustomer, setActiveNoticeCustomer] = useState<DueCustomer | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isSmsDialogCustomer, setIsSmsDialogCustomer] = useState<DueCustomer | null>(null);
  const [smsCopied, setSmsCopied] = useState(false);

  // Template state backed by LocalStorage
  const templateStorageKey = `due_payment_templates_${user?.companyId || 'default'}`;
  const [templates, setTemplates] = useState<MessageTemplates>(() => {
    try {
      const stored = localStorage.getItem(templateStorageKey);
      return stored ? { ...DEFAULT_TEMPLATES, ...JSON.parse(stored) } : DEFAULT_TEMPLATES;
    } catch {
      return DEFAULT_TEMPLATES;
    }
  });

  // Follow-up tracking in LocalStorage (Zero Firestore writes)
  const todayDateStr = new Date().toISOString().slice(0, 10);
  const followUpStorageKey = `due_followups_${user?.companyId || 'default'}_${todayDateStr}`;
  const [followedUpIds, setFollowedUpIds] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem(followUpStorageKey);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const toggleFollowUp = (id: string) => {
    setFollowedUpIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(followUpStorageKey, JSON.stringify(next));
      } catch (e) {
        console.error('LocalStorage write error:', e);
      }
      return next;
    });
  };

  const saveTemplates = (newTemplates: MessageTemplates) => {
    setTemplates(newTemplates);
    try {
      localStorage.setItem(templateStorageKey, JSON.stringify(newTemplates));
    } catch (e) {
      console.error('LocalStorage template save error:', e);
    }
    setIsTemplateModalOpen(false);
  };

  // Fetch ledgers and determine overdue payments
  useEffect(() => {
    async function loadDueData() {
      if (!user?.companyId) return;
      setLoading(true);
      try {
        // Uses existing in-memory cache to strictly prevent Firestore read quota consumption
        const [ledgers, vouchers] = await Promise.all([
          erpService.getLedgers(user.companyId),
          erpService.getRecentVouchers(user.companyId, 100).catch(() => [])
        ]);

        const now = new Date();

        // Filter ledgers where customer owes money (Asset head, current_balance > 0, or Sundry Debtors / Customers)
        const dueList: DueCustomer[] = [];

        ledgers.forEach((ledger: any) => {
          const balance = Number(ledger.current_balance ?? ledger.opening_balance ?? 0);
          const groupName = (ledger.group_name || ledger.ledger_groups?.name || '').toLowerCase();
          const nature = ledger.nature;

          // Customer owes us if balance is positive and group is debtor/customer or asset
          const isDebtorGroup = groupName.includes('debtor') || groupName.includes('customer') || groupName.includes('client') || groupName.includes('receivable');
          const isReceivable = (nature === 'Asset' && balance > 0) || (isDebtorGroup && balance > 0);

          if (isReceivable && balance > 0) {
            // Find recent sales vouchers for this customer to calculate approximate overdue days
            const customerVouchers = (vouchers || [])
              .filter((v: any) => (v.party_ledger_id === ledger.id || v.ledger_id === ledger.id || v.party_name === ledger.name) && v.v_type === 'Sales')
              .sort((a: any, b: any) => (b.v_date || '').localeCompare(a.v_date || ''));

            const lastVoucher = customerVouchers[0];
            let daysOverdue = 30; // default estimated period

            if (lastVoucher && lastVoucher.v_date) {
              const vDate = ensureDate(lastVoucher.v_date);
              const diffMs = now.getTime() - vDate.getTime();
              daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
            }

            // Determine urgency
            let urgency: 'low' | 'medium' | 'critical' = 'low';
            if (daysOverdue > 30) {
              urgency = 'critical';
            } else if (daysOverdue >= 15) {
              urgency = 'medium';
            }

            dueList.push({
              id: ledger.id,
              name: ledger.name,
              group_name: ledger.group_name || ledger.ledger_groups?.name || 'Sundry Debtors',
              phone: ledger.primary_mobile || ledger.contact_phone || '',
              email: ledger.email || ledger.contact_email || '',
              address: ledger.address || '',
              due_amount: balance,
              credit_limit: ledger.credit_limit,
              last_invoice_date: lastVoucher?.v_date,
              days_overdue: daysOverdue,
              urgency
            });
          }
        });

        // Sort by due amount descending
        dueList.sort((a, b) => b.due_amount - a.due_amount);
        setCustomers(dueList);
      } catch (err) {
        console.error('Error calculating due payment data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDueData();
  }, [user?.companyId, refreshKey]);

  // Clean phone number for WhatsApp and SMS protocols
  const cleanPhoneNumber = (rawPhone: string) => {
    let clean = (rawPhone || '').replace(/[^0-9]/g, '');
    if (!clean) return '';
    // If local Bangladeshi number starting with 01
    if (clean.startsWith('01') && clean.length === 11) {
      clean = '880' + clean.slice(1);
    }
    return clean;
  };

  // Compile formatted message with dynamic tags
  const compileMessage = (template: string, customer: DueCustomer) => {
    const compName = (settings as any).companyName || 'TallyFlow ERP';
    const compPhone = (settings as any).companyPhone || user?.email || '';
    return template
      .replace(/{{customerName}}/g, customer.name)
      .replace(/{{companyName}}/g, compName)
      .replace(/{{dueAmount}}/g, customer.due_amount.toLocaleString())
      .replace(/{{daysOverdue}}/g, customer.days_overdue.toString())
      .replace(/{{contactPhone}}/g, compPhone);
  };

  // 1-Click WhatsApp Trigger
  const sendWhatsApp = (customer: DueCustomer) => {
    const phone = cleanPhoneNumber(customer.phone);
    const msg = compileMessage(templates.whatsapp, customer);
    const url = phone 
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
    toggleFollowUp(customer.id);
  };

  // 1-Click Phone SMS Trigger
  const openSmsDialog = (customer: DueCustomer) => {
    setIsSmsDialogCustomer(customer);
    setSmsCopied(false);
  };

  const launchNativeSms = (customer: DueCustomer) => {
    const phone = cleanPhoneNumber(customer.phone);
    const msg = compileMessage(templates.sms, customer);
    const smsUrl = `sms:${phone}?body=${encodeURIComponent(msg)}`;
    window.location.href = smsUrl;
    toggleFollowUp(customer.id);
  };

  // 1-Click Email Trigger
  const sendEmail = (customer: DueCustomer) => {
    const subject = compileMessage(templates.emailSubject, customer);
    const body = compileMessage(templates.emailBody, customer);
    const mailto = `mailto:${customer.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    toggleFollowUp(customer.id);
  };

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      // Search
      const search = searchTerm.toLowerCase();
      const matchSearch = !searchTerm || 
        c.name.toLowerCase().includes(search) || 
        c.phone.includes(search) || 
        c.email.toLowerCase().includes(search) ||
        c.group_name.toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Age filter
      if (ageFilter === 'critical' && c.days_overdue <= 30) return false;
      if (ageFilter === 'medium' && (c.days_overdue < 15 || c.days_overdue > 30)) return false;
      if (ageFilter === 'low' && c.days_overdue >= 15) return false;

      // Contact filter
      if (contactFilter === 'has_phone' && !c.phone) return false;
      if (contactFilter === 'has_email' && !c.email) return false;

      // Follow-up status filter
      const isDone = !!followedUpIds[c.id];
      if (statusFilter === 'pending' && isDone) return false;
      if (statusFilter === 'done' && !isDone) return false;

      return true;
    });
  }, [customers, searchTerm, ageFilter, contactFilter, statusFilter, followedUpIds]);

  // Aggregate stats
  const totalReceivable = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.due_amount, 0);
  }, [customers]);

  const criticalDueCount = useMemo(() => {
    return customers.filter(c => c.days_overdue > 30).length;
  }, [customers]);

  const completedFollowUps = useMemo(() => {
    return customers.filter(c => !!followedUpIds[c.id]).length;
  }, [customers, followedUpIds]);

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredCustomers.map((c, idx) => ({
      'SL': idx + 1,
      'Customer Name': c.name,
      'Account Group': c.group_name,
      'Phone / Mobile': c.phone || 'N/A',
      'Email': c.email || 'N/A',
      'Due Amount': c.due_amount,
      'Days Overdue': c.days_overdue,
      'Urgency Status': c.urgency.toUpperCase(),
      'Followed Up Today': followedUpIds[c.id] ? 'YES' : 'NO'
    }));
    exportToCSV(`Due_Payment_Alerts_${todayDateStr}`, 'Due Payment Alerts', exportData, ['Customer Name', 'Phone / Mobile', 'Email', 'Due Amount', 'Days Overdue', 'Urgency Status', 'Followed Up Today'], settings);
  };

  // Print Due Report using printUtils
  const handlePrint = () => {
    printUtils.printElement('due-payment-statement-table', 'Due Payment Statement Report', settings);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background text-foreground select-none overflow-hidden">
      {/* 
        ========================================================================
        FIXED HEADER SECTION (Per User Instructions: Never scrolls, stays fixed)
        ========================================================================
      */}
      <div className="shrink-0 border-b border-border bg-card shadow-xs sticky top-0 z-30 p-4 lg:p-5 space-y-4">
        {/* Top bar: Back, Title, Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <EditableHeader
                  pageId="due_payment_alerts"
                  defaultTitle="Due Payment Alerts & Reminders"
                  className="text-base lg:text-lg font-black tracking-tight"
                />
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
                  বকেয়া রিমাইন্ডার
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Track overdue receivables and dispatch payment alerts via WhatsApp, Phone SMS, and Email.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Customize Reminder Messages"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Template Config</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Print Customer Due Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setRefreshKey(k => k + 1)}
              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Aggregate Stat Pills Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-xl border border-border bg-background flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Total Receivable (মোট বকেয়া)</span>
            <span className="text-base lg:text-lg font-black text-rose-600 mt-1">
              {formatCurrency(totalReceivable)}
            </span>
          </div>

          <div className="p-3 rounded-xl border border-border bg-background flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Due Debtors (দেনাদার গ্রাহক)</span>
            <span className="text-base lg:text-lg font-black text-foreground mt-1">
              {customers.length} Accounts
            </span>
          </div>

          <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-500/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Critical Overdue (&gt;30 Days)</span>
            <span className="text-base lg:text-lg font-black text-rose-600 mt-1">
              {criticalDueCount} Overdue
            </span>
          </div>

          <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 flex flex-col justify-between">
            <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider">Reminders Sent Today (আজকের তাগাদা)</span>
            <span className="text-base lg:text-lg font-black text-emerald-600 mt-1">
              {completedFollowUps} / {customers.length}
            </span>
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search customer by name, mobile, email, or group..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {/* Age Filter */}
            <select
              value={ageFilter}
              onChange={e => setAgeFilter(e.target.value as any)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-hidden font-medium shrink-0"
            >
              <option value="all">All Overdue Ages</option>
              <option value="critical">Critical (&gt;30 Days)</option>
              <option value="medium">Moderate (15-30 Days)</option>
              <option value="low">Recent (1-15 Days)</option>
            </select>

            {/* Contact Channel Filter */}
            <select
              value={contactFilter}
              onChange={e => setContactFilter(e.target.value as any)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-hidden font-medium shrink-0"
            >
              <option value="all">All Contacts</option>
              <option value="has_phone">Phone / WhatsApp Ready</option>
              <option value="has_email">Email Ready</option>
            </select>

            {/* Follow-up Status Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 focus:outline-hidden font-medium shrink-0"
            >
              <option value="all">All Follow-ups</option>
              <option value="pending">Pending Today</option>
              <option value="done">Sent Today</option>
            </select>
          </div>
        </div>
      </div>

      {/* 
        ========================================================================
        SCROLLABLE DATA AREA WITH STICKY TABLE HEADER (Per User Instructions)
        ========================================================================
      */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6" id="due-payment-statement-table">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <SkeletonLoader rows={8} />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-border rounded-xl space-y-3 bg-card/40">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500/60" />
            <p className="text-sm font-bold text-foreground">No Overdue Due Payments Found</p>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              All accounts receivable are settled or no customer matches the selected filter criteria.
            </p>
          </div>
        ) : (
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                {/* STICKY TABLE HEADER */}
                <thead className="sticky top-0 bg-muted/80 backdrop-blur-md z-10 border-b border-border uppercase font-black tracking-wider text-[10px] text-muted-foreground shadow-xs">
                  <tr>
                    <th className="p-3 text-center w-12">#</th>
                    <th className="p-3">Customer / Debtor</th>
                    <th className="p-3">Contact Details</th>
                    <th className="p-3 text-right">Due Amount (বকেয়া)</th>
                    <th className="p-3 text-center">Overdue Age</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center w-48">Dispatch Reminder</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {filteredCustomers.map((cust, idx) => {
                    const isFollowedUp = !!followedUpIds[cust.id];

                    return (
                      <tr 
                        key={cust.id}
                        className={cn(
                          "transition-colors hover:bg-muted/40",
                          isFollowedUp && "bg-emerald-500/5 opacity-80"
                        )}
                      >
                        {/* Sl */}
                        <td className="p-3 text-center font-mono text-muted-foreground text-[11px]">
                          {idx + 1}
                        </td>

                        {/* Customer */}
                        <td className="p-3">
                          <div className="font-bold text-foreground flex items-center gap-1.5">
                            <span>{cust.name}</span>
                            {cust.days_overdue > 30 && (
                              <span className="p-0.5 rounded bg-rose-500/10 text-rose-600" title="Critical Overdue">
                                <AlertTriangle className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {cust.group_name} {cust.address ? `• ${cust.address}` : ''}
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            {cust.phone ? (
                              <div className="flex items-center gap-1 text-[11px] font-mono text-foreground">
                                <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{cust.phone}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">No phone recorded</span>
                            )}
                            {cust.email && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground truncate max-w-[180px]">
                                <Mail className="w-2.5 h-2.5 shrink-0" />
                                <span>{cust.email}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Due Amount */}
                        <td className="p-3 text-right">
                          <div className="font-black text-rose-600 font-mono text-sm">
                            {formatCurrency(cust.due_amount)}
                          </div>
                          {cust.last_invoice_date && (
                            <div className="text-[10px] text-muted-foreground">
                              Inv: {cust.last_invoice_date}
                            </div>
                          )}
                        </td>

                        {/* Overdue Age */}
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border">
                            {cust.urgency === 'critical' ? (
                              <span className="bg-rose-500/10 text-rose-600 border-rose-500/20 px-1.5 py-0.5 rounded-full">
                                {cust.days_overdue} Days (জরুরি)
                              </span>
                            ) : cust.urgency === 'medium' ? (
                              <span className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-1.5 py-0.5 rounded-full">
                                {cust.days_overdue} Days
                              </span>
                            ) : (
                              <span className="bg-slate-500/10 text-muted-foreground border-border px-1.5 py-0.5 rounded-full">
                                {cust.days_overdue} Days
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status Checkbox */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => toggleFollowUp(cust.id)}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold transition-all",
                              isFollowedUp 
                                ? "bg-emerald-600 text-white shadow-xs" 
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                            title={isFollowedUp ? "Marked as Followed Up Today" : "Click to mark as Followed Up Today"}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{isFollowedUp ? 'Sent' : 'Pending'}</span>
                          </button>
                        </td>

                        {/* Action Triggers */}
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* WhatsApp Trigger */}
                            <button
                              onClick={() => sendWhatsApp(cust)}
                              className="p-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* SMS Trigger */}
                            <button
                              onClick={() => openSmsDialog(cust)}
                              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs"
                              title="Send Phone SMS Reminder"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </button>

                            {/* Email Trigger */}
                            <button
                              onClick={() => sendEmail(cust)}
                              disabled={!cust.email}
                              className={cn(
                                "p-1.5 rounded-lg transition-colors shadow-xs",
                                cust.email 
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                                  : "bg-muted text-muted-foreground/40 cursor-not-allowed"
                              )}
                              title={cust.email ? "Send Email Reminder Letter" : "No Email Address on File"}
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>

                            {/* Formal Notice / Share modal */}
                            <button
                              onClick={() => setActiveNoticeCustomer(cust)}
                              className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shadow-xs"
                              title="View & Print Formal Due Demand Notice"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 
        ========================================================================
        SMS PROTOCOL & COPY DIALOG MODAL (Ensures 100% desktop/mobile SMS support)
        ========================================================================
      */}
      {isSmsDialogCustomer && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-600 text-white">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Phone SMS Payment Reminder</h3>
                  <p className="text-[11px] text-muted-foreground">{isSmsDialogCustomer.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSmsDialogCustomer(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Recipient Mobile Number</label>
                <div className="font-mono text-sm font-bold text-foreground p-2 rounded-lg bg-muted/40 border border-border">
                  {isSmsDialogCustomer.phone || 'No phone number provided'}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">SMS Message Content</label>
                <div className="p-3 rounded-lg bg-muted/30 border border-border text-xs leading-relaxed font-mono whitespace-pre-wrap">
                  {compileMessage(templates.sms, isSmsDialogCustomer)}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(compileMessage(templates.sms, isSmsDialogCustomer));
                    setSmsCopied(true);
                    setTimeout(() => setSmsCopied(false), 2000);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg border border-border bg-background hover:bg-muted font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  {smsCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{smsCopied ? 'Copied to Clipboard' : 'Copy SMS Text'}</span>
                </button>

                <button
                  onClick={() => launchNativeSms(isSmsDialogCustomer)}
                  className="flex-1 py-2 px-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch SMS App</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        FORMAL DUE DEMAND NOTICE & STATEMENT MODAL
        ========================================================================
      */}
      {activeNoticeCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="text-sm font-black text-foreground">Formal Due Demand Notice (তাগাদাপত্র)</h3>
                  <p className="text-[11px] text-muted-foreground">{activeNoticeCustomer.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printUtils.printElement('formal-demand-notice-printable', 'Payment Demand Notice', settings)}
                  className="px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-bold flex items-center gap-1.5 hover:opacity-90"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Notice</span>
                </button>
                <button
                  onClick={() => setActiveNoticeCustomer(null)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Area Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-foreground" id="formal-demand-notice-printable">
              {/* Formal Letterhead */}
              <div className="border-b border-border pb-4 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-black text-foreground uppercase tracking-tight">
                    {settings.companyName || 'TallyFlow ERP'}
                  </h2>
                  <p className="text-xs text-muted-foreground">{settings.companyAddress || 'Corporate Office'}</p>
                  <p className="text-xs text-muted-foreground">Phone: {(settings as any).companyPhone || 'N/A'}</p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded bg-rose-500/10 text-rose-600 font-bold text-xs border border-rose-500/20">
                    PAYMENT DEMAND NOTICE
                  </span>
                  <p className="text-[11px] text-muted-foreground mt-1">Date: {todayDateStr}</p>
                </div>
              </div>

              {/* Customer Box */}
              <div className="p-4 rounded-xl bg-muted/30 border border-border space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground">To:</p>
                <p className="text-sm font-bold text-foreground">{activeNoticeCustomer.name}</p>
                {activeNoticeCustomer.address && <p className="text-xs text-muted-foreground">{activeNoticeCustomer.address}</p>}
                {activeNoticeCustomer.phone && <p className="text-xs text-muted-foreground">Mobile: {activeNoticeCustomer.phone}</p>}
                {activeNoticeCustomer.email && <p className="text-xs text-muted-foreground">Email: {activeNoticeCustomer.email}</p>}
              </div>

              {/* Subject & Letter Body */}
              <div className="space-y-3 text-xs leading-relaxed">
                <p className="font-bold text-sm text-foreground">
                  বিষয়: বকেয়া পাওনা ৳{activeNoticeCustomer.due_amount.toLocaleString()} টাকা পরিশোধ প্রসঙ্গে তাগাদাপত্র।
                </p>
                <p>
                  জনাব / মহোদয়,<br />
                  সালাম ও শুভেচ্ছা রইল। আপনার সদয় অবগতির জন্য জানানো যাচ্ছে যে, আমাদের হিসাব বিবরণী অনুযায়ী আপনার হিসাবের বিপরীতে সর্বমোট বকেয়া পাওনা রয়েছে <strong>৳{activeNoticeCustomer.due_amount.toLocaleString()}</strong> টাকা, যা বিগত {activeNoticeCustomer.days_overdue} দিন যাবত অপরিশোধিত রয়েছে।
                </p>
                <p>
                  উক্ত বকেয়া অর্থ অবিলম্বে আমাদের ক্যাশ শাখায় অথবা ব্যাংক অ্যাকাউন্টে জমা দিয়ে মানি রিসিট গ্রহণ করার জন্য বিনীত অনুরোধ জানানো যাচ্ছে।
                </p>
              </div>

              {/* Due Summary Table */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted text-muted-foreground uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Account Head</th>
                      <th className="p-2.5 text-center">Overdue Days</th>
                      <th className="p-2.5 text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border font-bold">
                      <td className="p-2.5">{activeNoticeCustomer.name} ({activeNoticeCustomer.group_name})</td>
                      <td className="p-2.5 text-center font-mono">{activeNoticeCustomer.days_overdue} Days</td>
                      <td className="p-2.5 text-right font-mono text-rose-600 text-sm">
                        {formatCurrency(activeNoticeCustomer.due_amount)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Formal Signatures */}
              <div className="pt-10 flex justify-between items-end text-xs text-muted-foreground">
                <div className="border-t border-border pt-1 w-36 text-center">
                  Prepared By
                </div>
                <div className="border-t border-border pt-1 w-36 text-center font-bold text-foreground">
                  Authorized Signature
                </div>
              </div>
            </div>

            {/* Modal Footer actions */}
            <div className="p-4 border-t border-border bg-muted/40 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => sendWhatsApp(activeNoticeCustomer)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Send WhatsApp</span>
                </button>
                <button
                  onClick={() => openSmsDialog(activeNoticeCustomer)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Send SMS</span>
                </button>
                <button
                  onClick={() => sendEmail(activeNoticeCustomer)}
                  disabled={!activeNoticeCustomer.email}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Email</span>
                </button>
              </div>

              <button
                onClick={() => setActiveNoticeCustomer(null)}
                className="px-4 py-1.5 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 
        ========================================================================
        MESSAGE TEMPLATES CONFIGURATION MODAL
        ========================================================================
      */}
      {isTemplateModalOpen && (
        <TemplateConfigModal
          initialTemplates={templates}
          onSave={saveTemplates}
          onClose={() => setIsTemplateModalOpen(false)}
        />
      )}
    </div>
  );
}

// Subcomponent for Template Editing
function TemplateConfigModal({
  initialTemplates,
  onSave,
  onClose
}: {
  initialTemplates: MessageTemplates;
  onSave: (t: MessageTemplates) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<MessageTemplates>(initialTemplates);
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'sms' | 'email'>('whatsapp');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-sm font-bold text-foreground">Customize Reminder Templates</h3>
              <p className="text-[11px] text-muted-foreground">Modify SMS, WhatsApp, and Email reminder wording</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Tags Guide */}
        <div className="px-5 py-2.5 bg-muted/20 border-b border-border text-[11px] text-muted-foreground flex flex-wrap gap-2 items-center">
          <span className="font-bold">Tags:</span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">&#123;&#123;customerName&#125;&#125;</span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">&#123;&#123;dueAmount&#125;&#125;</span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">&#123;&#123;companyName&#125;&#125;</span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">&#123;&#123;daysOverdue&#125;&#125;</span>
          <span className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">&#123;&#123;contactPhone&#125;&#125;</span>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-muted/30 px-5 pt-2 gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold border-b-2 transition-colors",
              activeTab === 'whatsapp' ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            WhatsApp Template
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold border-b-2 transition-colors",
              activeTab === 'sms' ? "border-blue-600 text-blue-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            SMS Template
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={cn(
              "px-3 py-1.5 text-xs font-bold border-b-2 transition-colors",
              activeTab === 'email' ? "border-indigo-600 text-indigo-600" : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Email Template
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {activeTab === 'whatsapp' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground">WhatsApp Message Body</label>
              <textarea
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                rows={8}
                className="w-full p-3 bg-background border border-border rounded-lg text-xs leading-relaxed font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
            </div>
          )}

          {activeTab === 'sms' && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-foreground">Mobile Phone SMS Body</label>
              <textarea
                value={form.sms}
                onChange={e => setForm({ ...form, sms: e.target.value })}
                rows={5}
                className="w-full p-3 bg-background border border-border rounded-lg text-xs leading-relaxed font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
              />
              <p className="text-[10px] text-muted-foreground">Keep short for standard 160-character mobile carriers.</p>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Email Subject</label>
                <input
                  type="text"
                  value={form.emailSubject}
                  onChange={e => setForm({ ...form, emailSubject: e.target.value })}
                  className="w-full p-2.5 bg-background border border-border rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground">Email Letter Body</label>
                <textarea
                  value={form.emailBody}
                  onChange={e => setForm({ ...form, emailBody: e.target.value })}
                  rows={8}
                  className="w-full p-3 bg-background border border-border rounded-lg text-xs leading-relaxed font-mono focus:outline-hidden focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center shrink-0">
          <button
            onClick={() => setForm(DEFAULT_TEMPLATES)}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reset to Defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={() => onSave(form)}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 shadow-xs"
            >
              Save Templates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
