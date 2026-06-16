import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Package, 
  Layers, 
  Tag, 
  ArrowLeftRight, 
  ClipboardCheck,
  FileText,
  ChevronRight,
  SlidersHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';

export function InventoryBooks() {
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
      id: 'location',
      title: t('nav.location'),
      description: t('invBooks.locationDesc') || 'Location-wise stock summary with quantity and value.',
      icon: Layers,
      path: '/reports/location',
      group: 'storage'
    },
    { 
      id: 'stock-summary',
      title: t('nav.stock'),
      description: t('invBooks.stockSummaryDesc') || 'Overview of all stock items with current quantity and value.',
      icon: Package,
      path: '/reports/stock',
      group: 'accounting'
    },
    {
      id: 'stock-item',
      title: t('nav.stockItem'),
      description: t('invBooks.stockItemDesc') || 'Monthly summary of transactions for a specific item.',
      icon: FileText,
      path: '/reports/stock-item',
      group: 'itemized'
    },
    {
      id: 'stock-group',
      title: t('nav.stockGroupSummary'),
      description: t('invBooks.stockGroupDesc') || 'Stock status grouped by categories.',
      icon: Layers,
      path: '/reports/stock-group-summary',
      group: 'grouped'
    },
    {
      id: 'stock-category',
      title: t('nav.stockCategorySummary'),
      description: t('invBooks.stockCategoryDesc') || 'Analysis of stock by defined categories.',
      icon: Tag,
      path: '/reports/stock-category-summary',
      group: 'grouped'
    },
    {
      id: 'stock-transfer',
      title: t('nav.stockTransferRegister'),
      description: t('invBooks.stockTransferDesc') || 'Record of internal stock transfers between godowns.',
      icon: ArrowLeftRight,
      path: '/reports/stock-transfer-register',
      group: 'transfers'
    },
    {
      id: 'physical-stock',
      title: t('nav.physicalStockRegister'),
      description: t('invBooks.physicalStockDesc') || 'History of physical stock adjustments and audits.',
      icon: ClipboardCheck,
      path: '/reports/physical-stock-register',
      group: 'transfers'
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
      {/* Header Sticky Container */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-5 lg:px-6 py-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/reports')}
              className="p-2.5 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 shadow-sm"
              id="inventory-books-back"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-600 uppercase tracking-widest font-sans">
                <span>{t('nav.reports')}</span>
                <span>/</span>
                <span className="text-slate-400">{t('nav.inventoryBooks') || 'Inventory Books'}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                {t('invBooks.title')}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">{t('invBooks.subtitle')}</p>
            </div>
          </div>

          <div className="bg-emerald-50 text-emerald-600 rounded-xl px-4 py-2 border border-emerald-100/50 flex flex-shrink-0 items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide self-start sm:self-auto font-sans">
            <Package className="w-3.5 h-3.5" />
            <span>{menuItems.length} Columns Ready</span>
          </div>
        </div>

        {enableUserSortViewPref && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/60 p-2.5 px-3 rounded-xl shadow-xs" id="inventory-books-preferences-modern font-sans">
            <div className="flex items-center gap-1.5 text-slate-500">
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
          {menuItems.map((item, idx) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              onClick={() => navigate(item.path)}
              className="flex flex-col p-5 bg-white rounded-2xl border border-slate-200/75 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left group relative overflow-hidden"
              id={`inventory-btn-${item.id}`}
            >
              {/* Glowing highlight in background */}
              <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-500 -z-0 opacity-20" />

              <div className="flex items-center justify-between w-full mb-4 z-10">
                <div className="p-3 rounded-xl text-white bg-gradient-to-tr from-emerald-500 to-teal-500 shadow-sm group-hover:scale-110 transition-transform">
                  <item.icon className="w-5 h-5 paint-icon" />
                </div>
                <span className="text-[9px] uppercase font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 tracking-widest">
                  {item.group}
                </span>
              </div>

              <div className="flex-1 z-10">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base group-hover:text-emerald-600 transition-colors mb-1">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-400 font-sans leading-relaxed">{item.description}</p>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 uppercase mt-4 opacity-0 group-hover:opacity-100 transition-all">
                <span>{t('invBooks.viewReport') || 'View Report'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.button>
          ))}
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
              id="inventory-books-classic-back"
            >
              Back
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('invBooks.title')}</h1>
              <p className="text-sm text-gray-550">{t('invBooks.subtitle')}</p>
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
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all text-left group"
              id={`classic-inventory-${item.id}`}
            >
              <div className="p-3 bg-emerald-50 rounded-lg group-hover:bg-emerald-100 transition-colors text-emerald-600">
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
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
