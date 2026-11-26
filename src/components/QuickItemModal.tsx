import React, { useState, useEffect } from 'react';
import { Save, Loader2, Package } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { EnterpriseModal } from './ui/EnterpriseModal';

interface QuickItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: any) => void;
}

export function QuickItemModal({ isOpen, onClose, onSuccess }: QuickItemModalProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [units, setUnits] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'General Items',
    unit_id: '',
    opening_qty: 0,
    opening_rate: 0,
    newCategoryName: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  async function fetchData() {
    if (!user?.companyId) return;
    try {
      const uData = await erpService.getUnits(user.companyId);
      if (uData) {
        setUnits(uData);
        const pcs = uData.find((u: any) => u.name.toLowerCase() === 'pcs');
        setFormData(prev => ({ ...prev, unit_id: pcs?.id || uData[0].id }));
      }

      const iData = await erpService.getItems(user.companyId);
      if (iData) {
        const cats = Array.from(new Set(iData.map((i: any) => i.category).filter(Boolean)));
        setCategories(cats as string[]);
      }
    } catch (err) {
      console.error('Error fetching quick item data:', err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.unit_id) return;

    setLoading(true);
    try {
      const selectedUnit = units.find(u => u.id === formData.unit_id);
      const payload = {
        name: formData.name,
        category: showNewCategory ? formData.newCategoryName : formData.category,
        unit_id: formData.unit_id,
        unit_name: selectedUnit?.name || 'pcs',
        opening_qty: formData.opening_qty,
        opening_rate: formData.opening_rate
      };

      const newItem = await erpService.createItem(user!.companyId, payload);
      onSuccess(newItem);
      showNotification('Item created successfully!', 'success');
      onClose();
      setFormData({
        name: '',
        category: 'General Items',
        unit_id: units[0]?.id || '',
        opening_qty: 0,
        opening_rate: 0,
        newCategoryName: ''
      });
      setShowNewCategory(false);
    } catch (err) {
      console.error('Error creating quick item:', err);
      showNotification('Failed to create item.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<Package className="w-4 h-4" />}
      title="Quick Item Creation"
      subtitle="Add a stock item directly without leaving your current voucher or workflow."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Item Name
          </label>
          <input
            autoFocus
            type="text"
            required
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            placeholder="e.g. Samsung Galaxy S21"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Category
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory(!showNewCategory)}
                className="text-[10px] text-primary hover:underline font-bold uppercase cursor-pointer"
              >
                {showNewCategory ? 'Select Existing' : '+ New Category'}
              </button>
            </div>
            {showNewCategory ? (
              <input
                type="text"
                required
                value={formData.newCategoryName}
                onChange={e => setFormData({ ...formData, newCategoryName: e.target.value })}
                className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
                placeholder="New Category..."
              />
            ) : (
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
              >
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                {!categories.includes('General Items') && <option value="General Items">General Items</option>}
              </select>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Unit
            </label>
            <select
              required
              value={formData.unit_id}
              onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            >
              {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Opening Qty
            </label>
            <input
              type="number"
              value={formData.opening_qty || ''}
              onFocus={e => e.target.value === '0' && e.target.select()}
              onChange={e => setFormData({ ...formData, opening_qty: Number(e.target.value) })}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors text-right tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Opening Rate
            </label>
            <input
              type="number"
              value={formData.opening_rate || ''}
              onFocus={e => e.target.value === '0' && e.target.select()}
              onChange={e => setFormData({ ...formData, opening_rate: Number(e.target.value) })}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors text-right tabular-nums"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !formData.name || !formData.unit_id}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Create Item
          </button>
        </div>
      </form>
    </EnterpriseModal>
  );
}

