import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  BookOpen, 
  ClipboardCheck, 
  Scale, 
  ChevronRight,
  SlidersHorizontal,
  DollarSign,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

export function AccountBooks() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { 
    reportsPageUiStyle = 'modern', 
    enableUserSortViewPref = false, 
    reportsColumnsPerRow = 3,
    userSettings = {},
    updateUserSettings 
  } = useSettings();

  const menuItems = [
    {
      id: 'ledger',
      title: 'Ledger Statement',
      description: 'Detailed analysis of transactional entries for selected ledger accounts.',
      icon: FileText,
      path: '/reports/ledger',
      group: 'ledger',
      color: 'blue'
    },
    {
      id: 'cash-bank',
      title: 'Cash/Bank Books',
      description: 'Sub-ledger detailing everyday receipts and payments under liquid asset heads.',
      icon: BookOpen,
      path: '/reports/cash-bank',
      group: 'cash-bank',
      color: 'indigo'
    },
    {
      id: 'group-summary',
      title: 'Group Summary',
      description: 'Consolidated balances of child ledger accounts grouped under primary accounting heads.',
      icon: ClipboardCheck,
      path: '/reports/group-summary',
      group: 'group',
      color: 'violet'
    },
    {
      id: 'group-voucher',
      title: 'Group Vouchers',
      description: 'List of ledger voucher records belonging directly to specific account groups.',
      icon: BookOpen,
      path: '/reports/group-voucher',
      group: 'group',
      color: 'fuchsia'
    },
    {
      id: 'sales-register',
      title: 'Sales Register',
      description: 'Chronological record of commercial sales invoices and billing transactions.',
      icon: FileText,
      path: '/reports/sales-register',
      group: 'registers',
      color: 'emerald'
    },
    {
      id: 'purchase-register',
      title: 'Purchase Register',
      description: 'Inventory/expense ledger compiling procurement bills and incoming supply invoices.',
      icon: FileText,
      path: '/reports/purchase-register',
      group: 'registers',
      color: 'teal'
    },
    {
      id: 'cash-flow',
      title: 'Cash Flow',
      description: 'Dynamic projections of currency inflows and outflows across operating, investing, and financing heads.',
      icon: DollarSign,
      path: '/reports/cash-flow',
      group: 'flow',
      color: 'amber'
    },
    {
      id: 'funds-flow',
      title: 'Funds Flow',
      description: 'Examines working capital variance sources and allocation records between financial years.',
      icon: Activity,
      path: '/reports/funds-flow',
      group: 'flow',
      color: 'rose'
    }
  ];

  const getGridColsClass = (cols: number) => {
    switch (cols) {
      case 1: return 'grid-cols-1';
      case 2: return 'grid-cols-1 md:grid-cols-2';
      case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 5: return 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
    }
  };

  const activeColumns = enableUserSortViewPref && userSettings.reportsColumns 
    ? Number(userSettings.reportsColumns) 
    : Number(reportsColumnsPerRow);

  const renderModern = () => (
    <div className="flex flex-col min-h-full bg-slate-50/50 transition-colors">
      {/* Sticky Header Box */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-5 lg:px-6 py-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reports')}
              className="p-2.5 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 shadow-sm"
              id="account-books-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                <span>{t('nav.reports')}</span>
                <span>/</span>
                <span className="text-slate-400">Account Books</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Account Books & Statements
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Explore ledgers, transaction records, registers, and liquid flow journals.</p>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-600 rounded-xl px-4 py-2 border border-blue-100/50 flex flex-shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide self-start sm:self-auto">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{menuItems.length} Booklets Available</span>
          </div>
        </div>

        {enableUserSortViewPref && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/60 p-2.5 px-3 rounded-xl shadow-xs" id="account-books-preferences-modern">
            <div className="flex items-center gap-1.5 text-slate-500 font-sans">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Preferences:</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">View Columns:</span>
              <select
                value={userSettings.reportsColumns || activeColumns}
                onChange={(e) => updateUserSettings({ reportsColumns: Number(e.target.value) })}
                className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all font-sans"
              >
                <option value={1}>1 Column List</option>
                <option value={2}>2 Columns Grid</option>
                <option value={3}>3 Columns Grid</option>
                <option value={4}>4 Columns Grid</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 p-5 lg:p-6 pb-24">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid ${getGridColsClass(activeColumns)} gap-5`}
        >
          {menuItems.map((item, idx) => {
            const colorConfig = {
              blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-500/50', iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-500' },
              indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'hover:border-indigo-500/50', iconBg: 'bg-gradient-to-tr from-indigo-500 to-purple-500' },
              violet: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'hover:border-violet-500/50', iconBg: 'bg-gradient-to-tr from-violet-500 to-fuchsia-500' },
              fuchsia: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'hover:border-fuchsia-500/50', iconBg: 'bg-gradient-to-tr from-fuchsia-500 to-pink-500' },
              emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-500/50', iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500' },
              teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'hover:border-teal-500/50', iconBg: 'bg-gradient-to-tr from-teal-500 to-cyan-500' },
              amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-500/50', iconBg: 'bg-gradient-to-tr from-amber-500 to-orange-500' },
              rose: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'hover:border-rose-500/50', iconBg: 'bg-gradient-to-tr from-rose-500 to-red-500' }
            }[item.color as any] || { bg: 'bg-slate-50', text: 'text-slate-600', border: 'hover:border-slate-500/50', iconBg: 'bg-gradient-to-tr from-slate-500 to-slate-600' };

            return (
              <motion.button
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => navigate(item.path)}
                className={`flex flex-col p-5 bg-white rounded-2xl border border-slate-200/75 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left group relative overflow-hidden ${colorConfig.border}`}
                id={`account-btn-${item.id}`}
              >
                {/* Glowing highlight in background */}
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-500 -z-0 opacity-20" />

                <div className="flex items-center justify-between w-full mb-4 z-10">
                  <div className={`p-3 rounded-xl text-white ${colorConfig.iconBg} shadow-sm group-hover:scale-110 transition-transform`}>
                    <item.icon className="w-5 h-5 paint-icon" />
                  </div>
                  <span className={`text-[9px] uppercase font-bold px-2.5 py-1 rounded-full ${colorConfig.bg} ${colorConfig.text} tracking-widest`}>
                    {item.group}
                  </span>
                </div>

                <div className="flex-1 z-10">
                  <h3 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-blue-600 transition-colors mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-sans leading-relaxed">{item.description}</p>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 uppercase mt-4 opacity-0 group-hover:opacity-100 transition-all">
                  <span>Open Book</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </div>
  );

  const renderClassic = () => (
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm px-4 lg:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/reports')}
              className="p-1 px-2.5 rounded-lg border border-border hover:bg-muted text-foreground/80 transition-colors text-xs font-bold uppercase tracking-wider"
              id="account-books-classic-back"
            >
              Back
            </button>
            <div>
              <h1 className="text-lg font-bold text-foreground">Account Books</h1>
              <p className="text-xs text-muted-foreground">Statements and books list indices</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className={`grid ${getGridColsClass(activeColumns)} gap-4`}>
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"
              id={`classic-account-${item.id}`}
            >
              <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors text-blue-600">
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      {reportsPageUiStyle === 'classic' ? renderClassic() : renderModern()}
    </div>
  );
}
