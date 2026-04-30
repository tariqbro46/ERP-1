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
  CreditCard
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { useNotification } from '../contexts/NotificationContext';
import { Loader2, X } from 'lucide-react';
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

export const AlterMaster: React.FC = () => {
  const { t } = useLanguage();
  const { company } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<MasterCategory | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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
      
      // Use specific getters if available for seeding/special logic
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
        // Update existing item
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
        // Create new item
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

  const filteredItems = items.filter(item => 
    (item.name || item.label || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-[40] bg-background border-b border-border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedCategory && (
              <button 
                onClick={() => setSelectedCategory(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
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
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              {t('common.create')}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {!selectedCategory ? (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {MASTER_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
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
              <div className="p-4 border-b border-gray-200 bg-gray-50 sticky top-[80px] z-10">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${t(selectedCategory.labelKey)}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

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

    {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                {t('common.edit')} {t(selectedCategory?.labelKey || '')}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-900">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">{t('common.name')}</label>
                <input 
                  autoFocus
                  type="text" 
                  required
                  value={editFormData.name || ''}
                  onChange={e => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              {selectedCategory?.id === 'groups' && (
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Nature</label>
                  <select 
                    value={editFormData.nature || ''}
                    onChange={e => setEditFormData({ ...editFormData, nature: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
                  <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Formal Name</label>
                  <input 
                    type="text" 
                    value={editFormData.formal_name || ''}
                    onChange={e => setEditFormData({ ...editFormData, formal_name: e.target.value })}
                    className="w-full bg-white border border-gray-300 rounded-lg p-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={saving || !editFormData.name}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t('common.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
