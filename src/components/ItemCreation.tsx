import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2, Package, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

export function ItemCreation() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { notifications, features = [] } = useSettings();
  const { id } = useParams();

  const isCategoryEnabled = features.find(f => f.id === 'cat')?.enabled ?? true;
  const isBatchEnabled = features.find(f => f.id === 'batch')?.enabled ?? true;
  const isExpiryEnabled = features.find(f => f.id === 'expiry')?.enabled ?? true;
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'General Items',
    part_no: '',
    description: '',
    unit_id: '',
    opening_qty: 0,
    opening_rate: 0,
    has_batches: false,
    has_expiry: false,
    barcode: '',
    low_stock_threshold: 0,
    tax_percent: 0,
    scheme_qty: 0,
    scheme_free_qty: 0
  });

  useEffect(() => {
    async function init() {
      if (!user?.companyId) return;
      try {
        const uData = await erpService.getUnits(user.companyId);
        setUnits(uData || []);

        // Fetch unique categories
        const iDataAll = await erpService.getItems(user.companyId);
        if (iDataAll) {
          const uniqueCats = Array.from(new Set(iDataAll.map(i => i.category).filter(Boolean)));
          setCategories(uniqueCats as string[]);
        }

        if (isEdit) {
          const [iData, hasTx] = await Promise.all([
            erpService.getItemById(id!),
            erpService.checkItemTransactions(id!, user.companyId)
          ]);
          
          if (!iData) {
            showNotification('Item not found. It may have been deleted.');
            setFetching(false);
            return;
          }

          setHasTransactions(hasTx);
          setFormData({
            ...formData,
            ...iData,
            opening_qty: iData.opening_qty || 0,
            opening_rate: iData.opening_rate || 0
          });
        } else if (uData && uData.length > 0) {
          const pcsUnit = uData.find(u => u.name.toLowerCase() === 'pcs');
          setFormData(prev => ({ ...prev, unit_id: pcsUnit?.id || uData[0].id }));
        }
      } catch (err) {
        console.error('Error initializing item form:', err);
      } finally {
        setFetching(false);
      }
    }
    init();
  }, [id, isEdit, user?.companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit_id) return;

    setLoading(true);
    try {
      // Clean data for saving
      const { units: _u, id: _id, created_at: _ca, current_stock: _cs, avg_cost: _ac, ...cleanData } = formData as any;
      
      if (isEdit) {
        await erpService.updateItem(id!, cleanData);
        showNotification(notifications.itemCreated.replace('added', 'updated'));
      } else {
        await erpService.createItem(user!.companyId, cleanData);
        showNotification(notifications.itemCreated);
      }
      navigate('/inventory/items');
    } catch (err) {
      console.error('Error saving item:', err);
      alert('Failed to save item. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await erpService.deleteItem(id, user.companyId);
      navigate('/inventory/items');
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item. It might be in use.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 text-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="bg-card border border-border overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 lg:px-6 py-4 border-b border-border bg-foreground/5 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-1 hover:bg-foreground/10 rounded transition-colors text-gray-500 hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Stock Item {isEdit ? 'Alteration' : 'Creation'}
            </h1>
          </div>
          {isEdit && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all w-full sm:w-auto justify-center"
            >
              <Trash2 className="w-3 h-3" />
              Delete
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 lg:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Item Name</label>
              <input
                autoFocus
                type="text"
                required
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                placeholder="e.g., Item Name"
              />
            </div>

            {isCategoryEnabled && (
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Under (Category)</label>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      autoFocus
                      value={newCategory || ''}
                      onChange={e => setNewCategory(e.target.value)}
                      className="flex-1 bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      placeholder="New Category Name"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newCategory.trim()) {
                          setCategories(prev => Array.from(new Set([...prev, newCategory.trim()])));
                          setFormData({ ...formData, category: newCategory.trim() });
                          setNewCategory('');
                          setShowNewCategoryInput(false);
                        }
                      }}
                      className="px-4 bg-foreground text-background text-[10px] font-bold uppercase"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCategoryInput(false)}
                      className="px-4 border border-border text-[10px] text-gray-500 uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={formData.category}
                      onChange={e => {
                        if (e.target.value === 'ADD_NEW') {
                          setShowNewCategoryInput(true);
                        } else {
                          setFormData({ ...formData, category: e.target.value });
                        }
                      }}
                      className="flex-1 bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    >
                      <option value="General Items">General Items</option>
                      {categories.filter(c => c !== 'General Items').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="ADD_NEW" className="font-bold text-emerald-500">+ Add New Category</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Part No.</label>
              <input
                type="text"
                value={formData.part_no || ''}
                onChange={e => setFormData({ ...formData, part_no: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                placeholder="Manufacturer Part Number"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Unit of Measure</label>
              <select
                required
                value={formData.unit_id}
                onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
              >
                {units.map(unit => (
                  <option key={unit.id} value={unit.id}>{unit.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Opening Qty</label>
                <input
                  type="number"
                  value={formData.opening_qty ?? ''}
                  onChange={e => setFormData({ ...formData, opening_qty: Number(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Opening Rate (৳)</label>
                <input
                  type="number"
                  value={formData.opening_rate ?? ''}
                  onChange={e => setFormData({ ...formData, opening_rate: Number(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Description</label>
              <textarea
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-24 resize-none"
                placeholder="Item technical specifications..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Low Stock Alert at</label>
                <input
                  type="number"
                  value={formData.low_stock_threshold ?? ''}
                  onChange={e => setFormData({ ...formData, low_stock_threshold: Number(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Tax Percent (%)</label>
                <input
                  type="number"
                  value={formData.tax_percent ?? ''}
                  onChange={e => setFormData({ ...formData, tax_percent: Number(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Scheme Qty (Buy)</label>
                <input
                  type="number"
                  value={formData.scheme_qty ?? ''}
                  onChange={e => setFormData({ ...formData, scheme_qty: Number(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Free Qty (Get)</label>
                <input
                  type="number"
                  value={formData.scheme_free_qty ?? ''}
                  onChange={e => setFormData({ ...formData, scheme_free_qty: Number(e.target.value) })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Barcode / SKU</label>
              <input
                type="text"
                value={formData.barcode || ''}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                placeholder="Scan or enter barcode..."
              />
            </div>

            {(isBatchEnabled || isExpiryEnabled) && (
              <div className="space-y-4 pt-4">
                {isBatchEnabled && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_batches"
                      checked={formData.has_batches}
                      onChange={e => setFormData({ ...formData, has_batches: e.target.checked })}
                      className="w-4 h-4 accent-foreground bg-background border-border"
                    />
                    <label htmlFor="has_batches" className="text-[10px] text-gray-400 uppercase tracking-widest cursor-pointer">
                      Maintain in Batches
                    </label>
                  </div>
                )}
                {isExpiryEnabled && (
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="has_expiry"
                      checked={formData.has_expiry}
                      onChange={e => setFormData({ ...formData, has_expiry: e.target.checked })}
                      className="w-4 h-4 accent-foreground bg-background border-border"
                    />
                    <label htmlFor="has_expiry" className="text-[10px] text-gray-400 uppercase tracking-widest cursor-pointer">
                      Track Expiry Dates
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-[10px] text-gray-500 hover:text-foreground uppercase tracking-widest transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 px-12 py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-50 order-1 sm:order-2">
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {isEdit ? 'Update Stock Item' : 'Create Stock Item'}
            </button>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 text-rose-500">
                <div className="p-3 bg-rose-500/10 rounded-full">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest">Confirm Deletion</h3>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">This action cannot be undone</p>
                </div>
              </div>

              {hasTransactions ? (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded space-y-2">
                  <p className="text-[11px] text-rose-500 leading-relaxed">
                    <span className="font-bold uppercase">Warning:</span> This item has existing inventory transactions. 
                    Deleting it will cause inconsistencies in your stock reports and vouchers.
                  </p>
                  <p className="text-[10px] text-rose-500 uppercase tracking-widest font-bold">
                    It is highly recommended to keep this item.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Are you sure you want to delete <span className="text-foreground font-bold">"{formData.name}"</span>? 
                  This item will be permanently removed from your inventory.
                </p>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-[10px] text-gray-500 hover:text-foreground uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
