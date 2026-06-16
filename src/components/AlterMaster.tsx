import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  UserPlus, 
  Package, 
  MapPin, 
  Settings, 
  FileText, 
  Layers, 
  Database,
  ChevronRight,
  Search,
  Plus,
  ArrowLeft,
  CreditCard,
  Sparkles,
  LayoutGrid,
  TrendingUp,
  UserCheck
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { Loader2, X, SlidersHorizontal } from 'lucide-react';
import { EditableHeader } from './EditableHeader';

interface MasterCategory {
  id: string;
  label: string;
  labelKey: string;
  icon: any;
  collection: string;
  route?: string;
}

const MASTER_CATEGORIES: MasterCategory[] = [
  { id: 'groups', label: 'Group', labelKey: 'alter.groups', icon: Layers, collection: 'ledger_groups' },
  { id: 'ledgers', label: 'Ledger', labelKey: 'alter.ledgers', icon: UserPlus, collection: 'ledgers' },
  { id: 'voucher_types', label: 'Voucher Type', labelKey: 'alter.voucherTypes', icon: FileText, collection: 'voucher_types' },
  { id: 'stock_categories', label: 'Category', labelKey: 'alter.stockCategories', icon: Layers, collection: 'stock_categories' },
  { id: 'stock_items', label: 'Stock Items', labelKey: 'alter.stockItems', icon: Package, collection: 'items' },
  { id: 'units', label: 'Unit', labelKey: 'alter.units', icon: Settings, collection: 'units' },
  { id: 'locations', label: 'Godowns', labelKey: 'alter.locations', icon: MapPin, collection: 'godowns' },
  { id: 'employee_groups', label: 'Designation', labelKey: 'alter.employeeGroups', icon: Users, collection: 'employee_groups' },
  { id: 'employees', label: 'Employee', labelKey: 'alter.employees', icon: Users, collection: 'employees' },
  { id: 'credit_limit', label: 'Credit Limit', labelKey: 'alter.creditLimit', icon: CreditCard, collection: 'ledgers' },
];

const getCategoryGroup = (id: string): 'accounting' | 'inventory' | 'payroll' => {
  if (['groups', 'ledgers', 'voucher_types', 'credit_limit'].includes(id)) return 'accounting';
  if (['stock_categories', 'stock_items', 'units', 'locations'].includes(id)) return 'inventory';
  return 'payroll';
};

export const AlterMaster: React.FC = () => {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { showNotification } = useNotification();
  const { 
    alterPageUiStyle, 
    enableUserSortViewPref = false, 
    alterColumnsPerRow = 3,
    userSettings = {}, 
    updateUserSettings 
  } = useSettings();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<MasterCategory | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Tabs for Modern UI
  const [activeTab, setActiveTab] = useState<'all' | 'accounting' | 'inventory' | 'payroll'>('all');

  // Inline editing state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedCategory && company) {
      fetchItems();
    }
  }, [selectedCategory, company]);

  const fetchItems = async () => {
    if (!selectedCategory || !company) return;
    setLoading(true);
    try {
      let data: any[] = [];
      console.log('Fetching items for category:', selectedCategory.id);
      
      switch (selectedCategory.id) {
        case 'voucher_types':
          data = await erpService.getVoucherTypes(company.id);
          break;
        case 'groups':
          data = await erpService.getLedgerGroups(company.id);
          break;
        case 'stock_categories':
          data = await erpService.getStockCategories(company.id);
          break;
        case 'employee_groups':
          data = await erpService.getEmployeeGroups(company.id);
          break;
        case 'ledgers':
        case 'credit_limit':
          data = await erpService.getLedgers(company.id);
          console.log('Ledgers fetched:', data.length);
          break;
        case 'stock_items':
          data = await erpService.getItems(company.id);
          break;
        case 'units':
          data = await erpService.getUnits(company.id);
          break;
        case 'locations':
          data = await erpService.getGodowns(company.id);
          break;
        case 'employees':
          data = await erpService.getEmployees(company.id);
          break;
        default:
          data = await erpService.getCollection(selectedCategory.collection, company.id);
      }
      
      console.log('Items set:', data.length);
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: any) => {
    if (!selectedCategory) return;

    switch (selectedCategory.id) {
      case 'ledgers':
      case 'credit_limit':
        navigate(`/accounts/ledgers/edit/${item.id}`);
        break;
      case 'stock_items':
        navigate(`/inventory/items/edit/${item.id}`);
        break;
      case 'locations':
        navigate('/inventory/godowns?new=true');
        break;
      case 'employees':
        navigate('/employees?new=true');
        break;
      case 'groups':
      case 'voucher_types':
      case 'stock_categories':
      case 'employee_groups':
      case 'units':
        setEditingItem(item);
        setEditFormData({ ...item });
        setIsEditModalOpen(true);
        break;
      default:
        console.log('Edit', selectedCategory.id, item);
    }
  };

  const handleCreateNew = () => {
    if (!selectedCategory) return;

    switch (selectedCategory.id) {
      case 'ledgers':
      case 'credit_limit':
        navigate('/accounts/ledgers/new');
        break;
      case 'stock_items':
        navigate('/inventory/items/new');
        break;
      case 'locations':
        navigate('/inventory/godowns?new=true');
        break;
      case 'employees':
        navigate('/employees?new=true');
        break;
      case 'groups':
      case 'voucher_types':
      case 'stock_categories':
      case 'employee_groups':
      case 'units':
        setEditingItem(null);
        setEditFormData({ name: '' });
        setIsEditModalOpen(true);
        break;
      default:
        console.log('Create New', selectedCategory.id);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !company) return;

    setSaving(true);
    try {
      if (editingItem) {
        switch (selectedCategory.id) {
          case 'groups':
            await erpService.updateLedgerGroup(editingItem.id, editFormData);
            break;
          case 'voucher_types':
            await erpService.updateVoucherType(editingItem.id, editFormData);
            break;
          case 'stock_categories':
            await erpService.updateStockCategory(editingItem.id, editFormData);
            break;
          case 'employee_groups':
            await erpService.updateEmployeeGroup(editingItem.id, editFormData);
            break;
          case 'units':
            await erpService.updateUnit(editingItem.id, editFormData);
            break;
        }
        showNotification(t('common.updateSuccess'));
      } else {
        switch (selectedCategory.id) {
          case 'groups':
            await erpService.createLedgerGroup(company.id, editFormData);
            break;
          case 'voucher_types':
            await erpService.createVoucherType(company.id, editFormData);
            break;
          case 'stock_categories':
            await erpService.createStockCategory(company.id, editFormData);
            break;
          case 'employee_groups':
            await erpService.createEmployeeGroup(company.id, editFormData);
            break;
          case 'units':
            await erpService.createUnit(company.id, editFormData);
            break;
        }
        showNotification(t('common.createSuccess'));
      }
      setIsEditModalOpen(false);
      fetchItems();
    } catch (error: any) {
      console.error('Error saving item:', error);
      showNotification(error.message || 'Failed to save item', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getAlterGridColsClass = (cols: number) => {
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

  const activeAlterColumns = enableUserSortViewPref && userSettings.alterColumns 
    ? Number(userSettings.alterColumns) 
    : Number(alterColumnsPerRow);

  const filteredItems = React.useMemo(() => {
    const rawFiltered = items.filter(item => 
      (item.name || item.label || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!enableUserSortViewPref) return rawFiltered;

    const alterSortBy = userSettings.alterSortBy || 'default';
    if (alterSortBy === 'default') return rawFiltered;

    return [...rawFiltered].sort((a, b) => {
      const nameA = (a.name || a.label || a.id || '').toLowerCase();
      const nameB = (b.name || b.label || b.id || '').toLowerCase();

      if (alterSortBy === 'az') {
        return nameA.localeCompare(nameB);
      }
      if (alterSortBy === 'za') {
        return nameB.localeCompare(nameA);
      }
      return 0;
    });
  }, [items, searchQuery, enableUserSortViewPref, userSettings.alterSortBy]);

  const filteredCategories = React.useMemo(() => {
    const rawFiltered = MASTER_CATEGORIES.filter(cat => {
      const belongsToGroup = activeTab === 'all' || getCategoryGroup(cat.id) === activeTab;
      const matchesSearch = searchQuery === '' || 
        t(cat.labelKey).toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.label.toLowerCase().includes(searchQuery.toLowerCase());
      return belongsToGroup && matchesSearch;
    });

    if (!enableUserSortViewPref) return rawFiltered;

    const alterSortBy = userSettings.alterSortBy || 'default';
    if (alterSortBy === 'default') return rawFiltered;

    return [...rawFiltered].sort((a, b) => {
      const labelA = (a.labelKey && t(a.labelKey) !== a.labelKey ? t(a.labelKey) : a.label || '').toLowerCase();
      const labelB = (b.labelKey && t(b.labelKey) !== b.labelKey ? t(b.labelKey) : b.label || '').toLowerCase();

      if (alterSortBy === 'az') {
        return labelA.localeCompare(labelB);
      }
      if (alterSortBy === 'za') {
        return labelB.localeCompare(labelA);
      }
      return 0;
    });
  }, [activeTab, searchQuery, t, enableUserSortViewPref, userSettings.alterSortBy]);

  // Render original classic configuration
  const renderClassic = () => (
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-[40] bg-background border-b border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                id="classic-back-btn"
              >
                <ArrowLeft className="w-6 h-6 animate-pulse" />
              </button>
            )}
            {selectedCategory ? (
              <h1 className="text-2xl font-bold text-gray-900">
                {t(selectedCategory.labelKey)}
              </h1>
            ) : (
              <EditableHeader 
                pageId="alter_master"
                defaultTitle={t('common.alteration')}
                defaultSubtitle="Modify your master data records"
              />
            )}
          </div>
          {selectedCategory && (
            <button
              onClick={handleCreateNew}
              id="classic-create-btn"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('common.create')}
            </button>
          )}
        </div>

        {selectedCategory && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${t(selectedCategory.labelKey)}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-xs"
            />
          </div>
        )}

        {enableUserSortViewPref && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/60 p-2.5 px-3 rounded-xl shadow-xs" id="alter-user-preferences-classic">
            <div className="flex items-center gap-1.5 text-slate-500 font-sans">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Preferences:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Sort by:</span>
              <select
                value={userSettings.alterSortBy || 'default'}
                onChange={(e) => updateUserSettings({ alterSortBy: e.target.value })}
                className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
              >
                <option value="default">Default Order</option>
                <option value="az">Alphabetical (A-Z)</option>
                <option value="za">Alphabetical (Z-A)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">View Columns:</span>
              <select
                value={userSettings.alterColumns || alterColumnsPerRow}
                onChange={(e) => updateUserSettings({ alterColumns: Number(e.target.value) })}
                className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
              >
                <option value={1}>1 Column List</option>
                <option value={2}>2 Columns Grid</option>
                <option value={3}>3 Columns Grid</option>
                <option value={4}>4 Columns Grid</option>
                <option value={5}>5 Columns (Quad Grid Layout - Standard Auto)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`grid ${getAlterGridColsClass(activeAlterColumns)} gap-4`}
            >
              {MASTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  id={`classic-cat-${cat.id}`}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex items-center gap-4 p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-500 hover:shadow-md transition-all text-left group"
                >
                  <div className="p-3 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                    <cat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{t(cat.labelKey)}</h3>
                    <p className="text-sm text-gray-500">Alter {cat.label} details</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="items"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="min-h-0">
                {loading ? (
                  <div className="p-8 text-center text-gray-500">{t('common.loading')}</div>
                ) : filteredItems.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center justify-between p-4 hover:bg-blue-50 transition-colors text-left group"
                      >
                        <div>
                          <div className="font-medium text-gray-900 group-hover:text-blue-700">
                            {item.name || item.label || item.id}
                          </div>
                          {item.alias && (
                            <div className="text-sm text-gray-500">({item.alias})</div>
                          )}
                          {selectedCategory.id === 'credit_limit' && (
                            <div className="text-sm text-blue-600 font-medium">
                              Limit: {item.credit_limit || 0}
                            </div>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No items found. 
                    <button 
                      onClick={handleCreateNew}
                      className="ml-2 text-blue-600 hover:underline font-medium"
                    >
                      Create New
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  // Render upgraded custom modern layout
  const renderModern = () => (
    <div className="flex flex-col min-h-full bg-slate-50/50 transition-colors">
      {/* Sticky Header Section */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm px-5 lg:px-6 py-4 space-y-4">
        {selectedCategory ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedCategory(null);
                  setSearchQuery('');
                }}
                id="modern-back-btn"
                className="p-2.5 bg-slate-50 border border-slate-200/60 hover:bg-slate-100 rounded-xl transition-colors text-slate-600 shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
              <div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-widest">
                    <span>{t('common.alteration')}</span>
                    <span>/</span>
                    <span className="text-slate-400 capitalize">{getCategoryGroup(selectedCategory.id)}</span>
                  </div>
                  <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                    {t(selectedCategory.labelKey)}
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                id="modern-create-btn"
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/10 transition-colors text-xs font-bold uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                {t('common.create')}
              </motion.button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full">
            {/* Group Menu */}
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl self-start md:self-auto overflow-x-auto max-w-full shrink-0">
              {(['all', 'accounting', 'inventory', 'payroll'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab === 'all' ? 'All Masters' : tab === 'accounting' ? 'Accounts' : tab === 'inventory' ? 'Inventory' : 'HR & Payroll'}
                </button>
              ))}
            </div>

            {/* Search box */}
            <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Quick search master categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs text-slate-800 font-medium"
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

            {/* Total Modules badge */}
            <div className="bg-blue-50 text-blue-600 rounded-xl px-4 py-2 border border-blue-100 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide shrink-0">
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Total: {MASTER_CATEGORIES.length} Modules</span>
            </div>
          </div>
        )}

        {/* Selected Category view search row fallback */}
        {selectedCategory && (
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Search ${t(selectedCategory.labelKey)}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-xs text-slate-800 font-medium"
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
        )}

        {enableUserSortViewPref && (
          <div className="flex flex-wrap items-center gap-4 bg-slate-50 border border-slate-200/60 mt-3 p-2 px-3 rounded-xl shadow-xs" id="alter-user-preferences-modern">
            <div className="flex items-center gap-1.5 text-slate-500 font-sans">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-500">Preferences:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">Sort by:</span>
              <select
                value={userSettings.alterSortBy || 'default'}
                onChange={(e) => updateUserSettings({ alterSortBy: e.target.value })}
                className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
              >
                <option value="default">Default Order</option>
                <option value="az">Alphabetical (A-Z)</option>
                <option value="za">Alphabetical (Z-A)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">View Columns:</span>
              <select
                value={userSettings.alterColumns || alterColumnsPerRow}
                onChange={(e) => updateUserSettings({ alterColumns: Number(e.target.value) })}
                className="bg-white border border-slate-200/85 hover:border-slate-300 text-slate-700 text-[11px] font-bold rounded-lg px-2.5 py-1 outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/10 transition-all"
              >
                <option value={1}>1 Column List</option>
                <option value={2}>2 Columns Grid</option>
                <option value={3}>3 Columns Grid</option>
                <option value={4}>4 Columns Grid</option>
                <option value={5}>5 Columns (Quad Grid Layout - Standard Auto)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Body Grid */}
      <div className="flex-1 p-5 lg:p-6 pb-24">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div 
              key="modern-categories"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className={`grid ${getAlterGridColsClass(activeAlterColumns)} gap-5`}
            >
              {filteredCategories.map((cat, idx) => {
                const group = getCategoryGroup(cat.id);
                // Custom color configurations based on group
                const groupConfig = {
                  accounting: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-500/50', iconBg: 'bg-gradient-to-tr from-blue-500 to-indigo-500' },
                  inventory: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-500/50', iconBg: 'bg-gradient-to-tr from-emerald-500 to-teal-500' },
                  payroll: { bg: 'bg-violet-50', text: 'text-violet-600', border: 'hover:border-violet-500/50', iconBg: 'bg-gradient-to-tr from-violet-500 to-fuchsia-500' },
                }[group];

                return (
                  <motion.button
                    key={cat.id}
                    id={`modern-cat-${cat.id}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSearchQuery('');
                    }}
                    className={`flex flex-col p-5 bg-white rounded-2xl border border-slate-200/75 hover:shadow-xl hover:shadow-slate-200/50 transition-all text-left group relative overflow-hidden ${groupConfig.border}`}
                  >
                    {/* Glowing highlight in background */}
                    <div className="absolute -right-8 -top-8 w-24 h-24 bg-slate-50 rounded-full group-hover:scale-150 transition-all duration-500 -z-0 opacity-20" />

                    {/* Top Row: Icon and Title on its right side */}
                    <div className="flex items-center gap-3 w-full mb-3 z-10">
                      {/* Icon Container */}
                      <div className={`p-3 rounded-xl text-white ${groupConfig.iconBg} shadow-sm group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <cat.icon className="w-5 h-5 paint-icon" />
                      </div>
                      
                      {/* Title & Badge */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 text-sm sm:text-base md:text-lg group-hover:text-blue-600 transition-colors tracking-tight leading-snug">
                          {t(cat.labelKey)}
                        </h3>
                      </div>
                    </div>

                    {/* Bottom container: Paragraph starts directly underneath the icon container, left-aligned */}
                    <div className="w-full z-10">
                      <p className="text-xs text-slate-400 font-sans leading-relaxed">
                        Configure corporate {cat.label.toLowerCase()} classifications and options.
                      </p>
                    </div>

                    {/* Dynamic corner pointer arrow */}
                    <div className="absolute right-4 bottom-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </motion.button>
                );
              })}

              {filteredCategories.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 flex flex-col items-center justify-center p-6">
                  <Database className="w-12 h-12 text-slate-300 mb-3" />
                  <p className="font-semibold text-slate-700">No Master Categories Found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try altering your search or selecting a different tab.</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="modern-items"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden"
            >
              <div className="min-h-0">
                {loading ? (
                  <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">{t('common.loading')}</span>
                  </div>
                ) : filteredItems.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {filteredItems.map((item, idx) => (
                      <motion.button
                        key={item.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                        onClick={() => handleItemClick(item)}
                        className="w-full flex items-center justify-between p-4.5 xs:p-5 hover:bg-slate-50/70 transition-all text-left group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            {idx + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                              {item.name || item.label || item.id}
                            </div>
                            {item.alias && (
                              <div className="text-xs text-slate-400 mt-0.5">Alias: {item.alias}</div>
                            )}
                            
                            {/* Metadata badges for modern mode */}
                            <div className="flex items-center gap-1.5 mt-1">
                              {selectedCategory.id === 'credit_limit' && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">
                                  Limit: ৳{Number(item.credit_limit || 0).toLocaleString()}
                                </span>
                              )}
                              {item.nature && (
                                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                  {item.nature}
                                </span>
                              )}
                              {item.formal_name && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                                  {item.formal_name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-all group-hover:translate-x-1" />
                      </motion.button>
                    ))}
                  </div>
                ) : (
                  <div className="p-16 text-center text-slate-500 flex flex-col items-center justify-center">
                    <Database className="w-12 h-12 text-slate-300 mb-4" />
                    <p className="font-semibold text-slate-700">No Records Configured</p>
                    <p className="text-xs text-slate-400 max-w-xs mt-1">There are currently no items under this category. Feel free to create one right away.</p>
                    
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCreateNew}
                      className="mt-5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/15"
                    >
                      Create First Record
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="min-h-full">
      {alterPageUiStyle === 'modern' ? renderModern() : renderClassic()}

      {/* Edit Form Modal (Shared beautifully between modes) */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl border border-slate-200/60 w-full max-w-md overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-800">
                {editingItem ? t('common.edit') : 'Create'} {t(selectedCategory?.labelKey || '')}
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('common.name')}</label>
                <input 
                  autoFocus
                  type="text" 
                  required
                  value={editFormData.name || ''}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 font-medium"
                />
              </div>

              {selectedCategory?.id === 'groups' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Nature</label>
                  <select 
                    value={editFormData.nature || ''}
                    onChange={e => setEditFormData({ ...editFormData, nature: e.target.value })}
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 font-medium"
                  >
                    <option value="Asset">Asset</option>
                    <option value="Liability">Liability</option>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
              )}

              {selectedCategory?.id === 'units' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Formal Name</label>
                  <input 
                    type="text" 
                    value={editFormData.formal_name || ''}
                    onChange={e => setEditFormData({ ...editFormData, formal_name: e.target.value })}
                    className="w-full bg-white border border-slate-250 focus:border-blue-500 rounded-xl p-3 text-xs outline-none focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800 font-medium"
                  />
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={saving || !editFormData.name}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-widest hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/15"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
