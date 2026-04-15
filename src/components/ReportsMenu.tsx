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
import * as LucideIcons from 'lucide-react';
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

  if (!reportsGroup) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-foreground mb-2">Reports Group Not Found</h2>
        <p className="text-muted-foreground">Please configure the Reports group in the Founder Panel.</p>
      </div>
    );
  }

  // Categorize items based on user request
  const categories = [
    {
      id: 'accounting',
      title: 'Accounting',
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
      title: 'Inventory',
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
      title: 'Payroll',
      titleKey: 'nav.payroll',
      icon: Users,
      itemIds: [
        'rep-payroll'
      ]
    },
    {
      id: 'exception',
      title: 'Exception Reports',
      titleKey: 'nav.exceptionReports',
      icon: AlertCircle,
      itemIds: [
        'rep-exception-reports'
      ]
    }
  ];

  const groupedReports = categories.reduce((acc, cat) => {
    acc[cat.id] = reportsGroup.items.filter(item => cat.itemIds.includes(item.id));
    return acc;
  }, {} as Record<string, typeof reportsGroup.items>);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('nav.reports')}</h1>
          {isSuperAdmin && (
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-[0.2em] mt-1">Hidden from sidebar</p>
          )}
          <p className="text-gray-500 mt-2">Comprehensive business insights and financial statements.</p>
        </div>
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
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
