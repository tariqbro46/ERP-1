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
  ArrowLeft
} from 'lucide-react';
import { EditableHeader } from './EditableHeader';
const LucideIcons: any = { BookOpen, ClipboardList, Scale, TrendingUp, Package, Activity, DollarSign, AlertCircle, BarChart3, FileText, Users };
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

  const reportsGroup = menuConfig?.groups.find(g => g.id === 'group-reports' || g.group.toLowerCase() === 'reports');

  const defaultItems = [
    { id: 'rep-trial-balance', label: 'Trial Balance', labelKey: 'reports.trialBalance', to: '/reports/trial-balance', icon: 'Scale' },
    { id: 'rep-daybook', label: 'Daybook', labelKey: 'daybook.title', to: '/reports/daybook', icon: 'ClipboardList' },
    { id: 'rep-cash-flow', label: 'Cash Flow', labelKey: 'reports.cashFlow', to: '/reports/cash-flow', icon: 'DollarSign' },
    { id: 'rep-funds-flow', label: 'Funds Flow', labelKey: 'reports.fundsFlow', to: '/reports/funds-flow', icon: 'Activity' },
    { id: 'rep-pl', label: 'Profit & Loss', labelKey: 'reports.profitAndLoss', to: '/reports/pl', icon: 'TrendingUp' },
    { id: 'rep-balance-sheet', label: 'Balance Sheet', labelKey: 'reports.balanceSheet', to: '/reports/balance-sheet', icon: 'Scale' },
    { id: 'rep-ratios', label: 'Ratio Analysis', labelKey: 'reports.ratioAnalysis', to: '/reports/ratios', icon: 'Activity' },
    { id: 'rep-stock-summary', label: 'Stock Summary', labelKey: 'reports.stockSummary', to: '/reports/stock', icon: 'Package' },
    { id: 'rep-group-summary', label: 'Group Summary', labelKey: 'reports.groupSummary', to: '/reports/group-summary', icon: 'ClipboardList' },
    { id: 'rep-group-voucher', label: 'Group Vouchers', labelKey: 'reports.groupVoucher', to: '/reports/group-voucher', icon: 'BookOpen' },
    { id: 'rep-ledger-statement', label: 'Ledger Statement', labelKey: 'reports.ledgerStatement', to: '/reports/ledger', icon: 'FileText' },
    { id: 'rep-sales-register', label: 'Sales Register', labelKey: 'reports.salesRegister', to: '/reports/sales-register', icon: 'FileText' },
    { id: 'rep-purchase-register', label: 'Purchase Register', labelKey: 'reports.purchaseRegister', to: '/reports/purchase-register', icon: 'FileText' },
    { id: 'rep-cash-bank', label: 'Cash/Bank Books', labelKey: 'reports.cashBankBooks', to: '/reports/cash-bank', icon: 'BookOpen', hidden: false }
  ];

  const itemsToUse = reportsGroup?.items || defaultItems;

  // Categorize items
  const categories = [
    {
      id: 'accounting',
      titleKey: 'nav.accounting',
      icon: Scale,
      itemIds: [
        'rep-trial-balance', 
        'rep-daybook', 
        'rep-cash-flow', 
        'rep-funds-flow', 
        'rep-account-books',
        'rep-statement-of-account'
      ]
    },
    {
      id: 'inventory',
      titleKey: 'nav.inventory',
      icon: Package,
      itemIds: [
        'rep-inventory-books',
        'rep-statement-of-inventory',
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
        'rep-payroll'
      ]
    },
    {
      id: 'exception',
      titleKey: 'nav.exceptionReports',
      icon: AlertCircle,
      itemIds: [
        'rep-exception-reports'
      ]
    }
  ];

  const groupedReports = categories.reduce((acc, cat) => {
    acc[cat.id] = itemsToUse.filter(item => cat.itemIds.includes(item.id));
    return acc;
  }, {} as Record<string, typeof itemsToUse>);

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen transition-colors">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <EditableHeader 
            pageId="reports_menu"
            defaultTitle={t('nav.reports')}
            defaultSubtitle="Comprehensive business insights and financial statements."
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat, idx) => {
          const items = groupedReports[cat.id] || [];
          if (items.length === 0) return null;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <cat.icon className="w-5 h-5 text-gray-600" />
                </div>
                <h2 className="font-bold text-gray-800 uppercase tracking-wider text-sm">
                  {t(cat.titleKey)}
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-y divide-gray-100">
                {items.map((item) => {
                  const Icon = (LucideIcons as any)[item.icon] || FileText;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate(item.to)}
                      className="flex items-center gap-4 p-5 hover:bg-blue-50 transition-all text-left group"
                    >
                      <div className="p-3 rounded-xl bg-white shadow-sm group-hover:scale-110 transition-transform text-primary">
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                        </h3>
                        {item.hidden && isSuperAdmin && (
                          <span className="text-[8px] uppercase font-bold text-gray-400 tracking-widest">Hidden from sidebar</span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
