import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { ChevronRight, ArrowLeft, Search, X, Layers } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { erpService } from '../services/erpService';
import { MenuConfig } from '../types';
import { EditableHeader } from './EditableHeader';

// Helper for dynamic descriptions of report items and cards on group sub-sections
const getReportDescription = (id: string, label: string): string => {
  const descMap: Record<string, string> = {
    'rep-trial-balance': 'Consolidated balances checklist of all active billing accounts.',
    'rep-daybook': 'Chronological timeline ledger of standard voucher transactions and bills.',
    'rep-cash-flow': 'Projections of dynamic liquid cash movements across operating heads.',
    'rep-funds-flow': 'Examines net working capital allocation cycles between fiscal quarters.',
    'rep-group-summary': 'Consolidated accounting status grouped under primary classification heads.',
    'rep-group-voucher': 'Voucher transactions index belonging to specific ledger categories.',
    'rep-ledger-statement': 'Detailed historical ledger statements of selected active accounts.',
    'rep-sales-register': 'Chronological records of commercial trade and customer billing invoices.',
    'rep-purchase-register': 'Procurement logs compiling vendor credit bills and supply receipts.',
    'rep-cash-bank': 'Sub-ledger listing everyday receipts and liquid asset banking payments.',
    'rep-statement-of-account': 'Ledger account statements index and sub-group statement reports.',
    'rep-stock-summary': 'Corporate physical stock summary detailing quantities, rates, and values.',
    'rep-account-books': 'Statements of account, ledger books, and registers list index.',
    'rep-statistics': 'Browse comprehensive counts of active ledgers, vouchers, and transactions.',
    'statistics': 'Browse comprehensive counts of active ledgers, vouchers, and transactions.'
  };

  if (descMap[id]) return descMap[id];
  if (descMap[id.toLowerCase()]) return descMap[id.toLowerCase()];
  
  const labelClean = label.toLowerCase();
  if (labelClean.includes('trial')) return 'Consolidated trial balance ledger tracking credits and debits.';
  if (labelClean.includes('daybook')) return 'Daily transaction logs compiled from active accounting journals.';
  if (labelClean.includes('cash flow')) return 'Flow statement charting liquid fund changes across operational periods.';
  if (labelClean.includes('funds flow')) return 'Compares resources inflows and outflows across working capital lines.';
  if (labelClean.includes('group summary')) return 'Child ledger balances summary categorized under major parent groups.';
  if (labelClean.includes('ledger')) return 'Browse and extract transaction lists for any selected active ledger.';
  if (labelClean.includes('sales')) return 'Chronological overview of corporate sales vouchers and bills.';
  if (labelClean.includes('purchase')) return 'Procurement database tracking supply bills and trade vouchers.';
  if (labelClean.includes('stock')) return 'Inventory tracking statement detailing physical quantities and values.';
  if (labelClean.includes('statistics')) return 'Exposes core transaction statistics, ledger indices, and activity counts.';

  return `Analytical interactive views profiling ${label.toLowerCase()} entries.`;
};

// Generates cohesive modern gradient/accent styles based on the item category/ID
const getGroupConfig = (id: string, groupName: string) => {
  const cleanId = id.toLowerCase();
  const cleanGroup = groupName.toLowerCase();
  
  const isAccounting = cleanId.includes('account') || cleanId.includes('ledger') || cleanId.includes('financial') || cleanId.includes('accounting') || cleanGroup.includes('account');
  const isInventory = cleanId.includes('stock') || cleanId.includes('item') || cleanId.includes('inventory') || cleanId.includes('godown') || cleanId.includes('location') || cleanGroup.includes('inventory');
  const isPayroll = cleanId.includes('pay') || cleanId.includes('employee') || cleanId.includes('attendance') || cleanId.includes('hr') || cleanGroup.includes('payroll');
  
  if (isAccounting) {
    return { bg: 'bg-blue-50 text-blue-600 border border-blue-100', text: 'text-blue-600', border: 'hover:border-blue-500/50', iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-500' };
  }
  if (isInventory) {
    return { bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', text: 'text-emerald-600', border: 'hover:border-emerald-500/50', iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500' };
  }
  if (isPayroll) {
    return { bg: 'bg-violet-50 text-violet-600 border border-violet-100', text: 'text-violet-600', border: 'hover:border-violet-500/50', iconBg: 'bg-gradient-to-tr from-violet-500 to-fuchsia-500' };
  }
  
  // Default dynamic indigo aesthetic
  return { bg: 'bg-indigo-50 text-indigo-600 border border-indigo-100', text: 'text-indigo-600', border: 'hover:border-indigo-500/50', iconBg: 'bg-gradient-to-tr from-indigo-500 to-purple-500' };
};

export const GroupDashboard: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isSuperAdmin } = useAuth();
  const [menuConfig, setMenuConfig] = React.useState<MenuConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const group = menuConfig?.groups.find(g => g.id === groupId || g.group.toLowerCase() === groupId?.toLowerCase());

  if (!group) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center h-[60vh]">
        <span className="p-4 bg-slate-100 rounded-full border border-slate-200 text-slate-400 mb-4">
          <Layers className="w-8 h-8" />
        </span>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Group Section Not Found</h2>
        <p className="text-sm text-slate-400 max-w-sm">The menu group you are trying to view cannot be loaded or is unavailable.</p>
        <button 
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl text-xs uppercase tracking-wider hover:bg-blue-700 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>
    );
  }

  const groupTitle = group.groupKey && t(group.groupKey) !== group.groupKey ? t(group.groupKey) : group.group;

  // Filter items in group list
  const filteredItems = group.items.filter(item => {
    // Hide specific items from Reports group dashboard
    if (group.id === 'group-reports' || group.group.toLowerCase() === 'reports') {
      const itemsToHide = ['Balance Sheet', 'Profit & Loss', 'Stock Summary', 'Ratio Analysis', 'Display More Reports'];
      if (itemsToHide.includes(item.label)) return false;
    }

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const matchesLabel = item.label.toLowerCase().includes(q);
    const matchesLocalized = item.labelKey ? t(item.labelKey).toLowerCase().includes(q) : false;
    const matchesId = item.id.toLowerCase().includes(q);
    return matchesLabel || matchesLocalized || matchesId;
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-50/50 transition-colors">
      {/* Dynamic Sticky Header & Filter Row -- Keeping layout fixed as per rules */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-5 lg:px-6 py-4.5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="p-2.5 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            
            <div>
              <EditableHeader 
                pageId={`group_${groupId}`}
                defaultTitle={groupTitle}
                defaultSubtitle="Quick access to all items in this segment."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider bg-slate-100/80 px-2.5 py-1 rounded-full border border-slate-200">
                Hidden from sidebar
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Inner Section Search Box */}
        <div className="relative animate-in fade-in duration-200">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={`Search sections inside ${groupTitle}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-5 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs text-slate-800 font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Body content area (Only scrollable element below the header) */}
      <div className="flex-1 p-5 lg:p-6 pb-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${groupId}-${searchQuery}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-5"
          >
            {filteredItems.map((item, index) => {
              const Icon = (LucideIcons as any)[item.icon] || LucideIcons.Package;
              const groupConfig = getGroupConfig(item.id, group.group);
              const customDesc = getReportDescription(item.id, item.label);

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  whileHover={{ y: -3 }}
                >
                  <Link
                    to={item.to}
                    className={`flex flex-col p-5 bg-white border border-slate-200/75 hover:shadow-xl hover:shadow-slate-200/50 rounded-2xl transition-all text-left relative overflow-hidden group/card ${groupConfig.border}`}
                  >
                    {/* Glowing highlight in background */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full group-hover/card:scale-150 transition-all duration-500 -z-0 opacity-20" />
                    
                    {/* Top Row: Icon and Title on its right side */}
                    <div className="flex items-center gap-3 w-full mb-3 z-10">
                      {/* Icon Container */}
                      <div className={`p-3 rounded-xl text-white ${groupConfig.iconBg} shadow-sm group-hover/card:scale-110 transition-transform flex-shrink-0`}>
                        <Icon className="w-5 h-5 paint-icon" />
                      </div>
                      
                      {/* Title & Badge */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 group-hover/card:text-blue-600 transition-colors text-sm sm:text-base md:text-lg tracking-tight leading-snug">
                          {item.labelKey && t(item.labelKey) !== item.labelKey ? t(item.labelKey) : item.label}
                        </h3>
                      </div>
                    </div>
                    
                    {/* Bottom container: Paragraph starts directly underneath the icon container, left-aligned */}
                    <div className="w-full z-10">
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        {customDesc}
                      </p>
                      
                      {/* Footnote space */}
                      {item.hidden && isSuperAdmin && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className="text-[8px] uppercase font-extrabold text-slate-400 tracking-wider bg-slate-100 py-0.5 px-1.5 rounded">Hidden</span>
                        </div>
                      )}
                    </div>

                    {/* Micro right arrow on hover on top right */}
                    <div className="absolute right-4 bottom-4 text-blue-600 opacity-0 group-hover/card:opacity-100 transition-all transform translate-x-2 group-hover/card:translate-x-0 z-10">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </Link>
                </motion.div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 p-6 text-center text-slate-500 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-200/80 shadow-sm">
                <Layers className="w-12 h-12 text-slate-300 mb-4 animate-bounce" />
                <p className="font-bold text-slate-700">No Sub-sections Match Search Query</p>
                <p className="text-xs text-slate-400 max-w-sm mt-1.5">No reports list entries were found inside "{groupTitle}" matching "{searchQuery}". Clear the search to view all items.</p>
                <button 
                  onClick={() => setSearchQuery('')}
                  className="mt-5 px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all border border-slate-200"
                >
                  Clear Search
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
