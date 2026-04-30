import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  BookOpen, 
  ClipboardList, 
  Scale, 
  TrendingUp, 
  Package, 
  Activity, 
  DollarSign, 
  AlertCircle,
  ChevronRight,
  BarChart3,
  FileText,
  Users,
  User,
  ArrowLeft
} from 'lucide-react';
import { EditableHeader } from './EditableHeader';
const LucideIcons: any = { BookOpen, ClipboardList, Scale, TrendingUp, Package, Activity, DollarSign, AlertCircle, BarChart3, FileText, Users, User };
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { erpService } from '../services/erpService';
import { MenuConfig } from '../types';

export const ReportsMenu: React.FC = () => {
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [menuConfig, setMenuConfig] = React.useState<MenuConfig | null>(null);
  const [loading, setLoading] = React.useState(true);

  const defaultItems = React.useMemo(() => [
    { id: 'rep-trial-balance', label: 'Trial Balance', labelKey: 'reports.trialBalance', to: '/reports/trial-balance', icon: 'Scale' },
    { id: 'rep-daybook', label: 'Daybook', labelKey: 'daybook.title', to: '/reports/daybook', icon: 'ClipboardList' },
    { id: 'rep-cash-flow', label: 'Cash Flow', labelKey: 'reports.cashFlow', to: '/reports/cash-flow', icon: 'DollarSign' },
    { id: 'rep-funds-flow', label: 'Funds Flow', labelKey: 'reports.fundsFlow', to: '/reports/funds-flow', icon: 'Activity' },
    { id: 'rep-group-summary', label: 'Group Summary', labelKey: 'reports.groupSummary', to: '/reports/group-summary', icon: 'ClipboardList' },
    { id: 'rep-group-voucher', label: 'Group Vouchers', labelKey: 'reports.groupVoucher', to: '/reports/group-voucher', icon: 'BookOpen' },
    { id: 'rep-ledger-statement', label: 'Ledger Statement', labelKey: 'reports.ledgerStatement', to: '/reports/ledger', icon: 'FileText' },
    { id: 'rep-sales-register', label: 'Sales Register', labelKey: 'reports.salesRegister', to: '/reports/sales-register', icon: 'FileText' },
    { id: 'rep-purchase-register', label: 'Purchase Register', labelKey: 'reports.purchaseRegister', to: '/reports/purchase-register', icon: 'FileText' },
    { id: 'rep-cash-bank', label: 'Cash/Bank Books', labelKey: 'reports.cashBankBooks', to: '/reports/cash-bank', icon: 'BookOpen', hidden: false },
    { id: 'rep-pay-slip', label: 'Pay Slip', labelKey: 'reports.paySlip', to: '/reports/pay-slip', icon: 'FileText' },
    { id: 'rep-pay-sheet', label: 'Pay Sheet', labelKey: 'reports.paySheet', to: '/reports/pay-sheet', icon: 'FileText' },
    { id: 'rep-attendance-sheet', label: 'Attendance Sheet', labelKey: 'reports.attendanceSheet', to: '/reports/attendance-sheet', icon: 'FileText' },
    { id: 'rep-payment-advice', label: 'Payment Advice', labelKey: 'reports.paymentAdvice', to: '/reports/payment-advice', icon: 'FileText' },
    { id: 'rep-payroll-statement', label: 'Payroll Statement', labelKey: 'reports.payrollStatement', to: '/reports/payroll-statement', icon: 'FileText' },
    { id: 'rep-payroll-register', label: 'Payroll Register', labelKey: 'reports.payrollRegister', to: '/reports/payroll-register', icon: 'FileText' },
    { id: 'rep-attendance-register', label: 'Attendance Register', labelKey: 'reports.attendanceRegister', to: '/reports/attendance-register', icon: 'FileText' },
    { id: 'rep-employee-profile', label: 'Employee Profile', labelKey: 'reports.employeeProfile', to: '/reports/employee-profile', icon: 'User' },
    { id: 'rep-headcount', label: 'Employee Head Count', labelKey: 'reports.employeeHeadCount', to: '/reports/employee-head-count', icon: 'Users' },
    { id: 'rep-inventory-books', label: 'Inventory Books', labelKey: 'nav.inventoryBooks', to: '/reports/inventory-books', icon: 'BookOpen' },
    { id: 'rep-stock-query', label: 'Stock Query', labelKey: 'reports.stockQuery', to: '/reports/stock-query', icon: 'Package' },
    { id: 'rep-movement', label: 'Movement Analysis', labelKey: 'reports.movementAnalysis', to: '/reports/movement', icon: 'Activity' },
    { id: 'rep-ageing-analysis', label: 'Ageing Analysis', labelKey: 'nav.ageingAnalysis', to: '/reports/ageing-analysis', icon: 'Activity' },
    { id: 'rep-negative-stock', label: 'Negative Stock', labelKey: 'nav.negativeStock', to: '/reports/negative-stock', icon: 'AlertCircle' },
    { id: 'rep-negative-ledger', label: 'Negative Ledger', labelKey: 'nav.negativeLedger', to: '/reports/negative-ledger', icon: 'AlertCircle' },
    { id: 'rep-statement-of-account', label: 'Statement of Account', labelKey: 'nav.statementOfAccount', to: '/reports/account-books', icon: 'BookOpen' },
    { id: 'rep-stock-summary', label: 'Stock Summary', labelKey: 'reports.stockSummary', to: '/reports/stock', icon: 'Package' },
    { id: 'rep-account-books', label: 'Account Books', labelKey: 'nav.accountBooks', to: '/reports/account-books', icon: 'BookOpen' }
  ], []);

  const reportsGroup = menuConfig?.groups.find(g => g.id === 'group-reports' || g.group.toLowerCase() === 'reports');

  // Merge default items with potentially missing remote items
  const itemsToUse = React.useMemo(() => {
    if (!reportsGroup?.items) return defaultItems;
    const remoteItems = reportsGroup.items;
    const remoteIds = new Set(remoteItems.map(i => i.id));
    const missingDefaults = defaultItems.filter(i => !remoteIds.has(i.id));
    return [...remoteItems, ...missingDefaults];
  }, [reportsGroup, defaultItems]);

  React.useEffect(() => {
    const unsubscribe = erpService.subscribeToMenuConfig((config) => {
      setMenuConfig(config);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Categorize items
  const categories = [
    {
      id: 'accounting',
      titleKey: 'nav.accounting',
      icon: Scale,
      itemIds: [
        'rep-statement-of-account',
        'rep-account-books',
        'rep-trial-balance', 
        'rep-cash-flow', 
        'rep-funds-flow'
      ]
    },
    {
      id: 'inventory',
      titleKey: 'nav.inventory',
      icon: Package,
      itemIds: [
        'rep-inventory-books',
        'rep-stock-summary',
        'rep-stock-query',
        'rep-movement',
        'rep-ageing-analysis'
      ]
    },
    {
      id: 'payroll',
      titleKey: 'nav.payroll',
      icon: Users,
      itemIds: [
        'rep-pay-slip',
        'rep-pay-sheet',
        'rep-attendance-sheet',
        'rep-payment-advice',
        'rep-payroll-statement',
        'rep-payroll-register',
        'rep-attendance-register',
        'rep-employee-profile',
        'rep-headcount'
      ]
    },
    {
      id: 'exception',
      titleKey: 'nav.exceptionReports',
      icon: AlertCircle,
      itemIds: [
        'rep-negative-stock',
        'rep-negative-ledger'
      ]
    }
  ];

  const groupedReports = categories.reduce((acc, cat) => {
    // Preserving the order defined in itemIds
    acc[cat.id] = cat.itemIds
      .map(id => itemsToUse.find(item => item.id === id))
      .filter((item): item is typeof itemsToUse[number] => !!item);
    return acc;
  }, {} as Record<string, typeof itemsToUse>);

  return (
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <EditableHeader 
            pageId="reports_menu"
            defaultTitle={t('nav.reports')}
            defaultSubtitle="Detailed business reports and financial analytical tools."
          />
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {categories.map((cat, idx) => {
            const items = groupedReports[cat.id] || [];
            if (items.length === 0) return null;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-4 bg-foreground/5 border-b border-border flex items-center gap-3">
                  <div className="p-2 bg-background rounded-lg shadow-sm">
                    <cat.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <h2 className="font-bold text-foreground uppercase tracking-wider text-sm">
                    {t(cat.titleKey)}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-border/30">
                  {items.map((item) => {
                    const Icon = (LucideIcons as any)[item.icon] || FileText;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.to)}
                        className="flex items-center gap-4 p-5 hover:bg-foreground/5 transition-all text-left group min-h-[72px]"
                      >
                        <div className="flex-shrink-0 w-12 h-12 p-3 rounded-xl bg-background border border-border/50 shadow-sm group-hover:scale-110 group-hover:border-primary/30 transition-all text-primary flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm sm:text-base line-clamp-2">
                            {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                          </h3>
                          {item.hidden && isSuperAdmin && (
                            <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest block mt-1">Hidden from sidebar</span>
                          )}
                        </div>
                        <ChevronRight className="flex-shrink-0 w-5 h-5 text-gray-300 group-hover:text-primary transition-all group-hover:translate-x-1" />
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
