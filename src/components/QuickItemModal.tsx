import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Package, Plus } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';

interface QuickItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (item: any) => void;
}

export function QuickItemModal({ isOpen, onClose, onSuccess }: QuickItemModalProps) {
  const { user } = useAuth();
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
      const payload = {
        name: formData.name,
        category: showNewCategory ? formData.newCategoryName : formData.category,
        unit_id: formData.unit_id,
        opening_qty: formData.opening_qty,
        opening_rate: formData.opening_rate
      };

      const newItem = await erpService.createItem(user!.companyId, payload);
      onSuccess(newItem);
      onClose();
      // Reset form
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
      alert('Failed to create item.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 my-auto md:my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Quick Item Creation</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Item Name</label>
            <input
              autoFocus
              type="text"
              required
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
              placeholder="e.g. Samsung Galaxy S21"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Category</label>
                <button 
                  type="button" 
                  onClick={() => setShowNewCategory(!showNewCategory)}
                  className="text-[9px] text-amber-600 hover:text-amber-500 font-bold uppercase"
                >
                  {showNewCategory ? 'Select' : 'New'}
                </button>
              </div>
              {showNewCategory ? (
                <input
                  type="text"
                  required
                  value={formData.newCategoryName}
                  onChange={e => setFormData({ ...formData, newCategoryName: e.target.value })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  placeholder="New Category..."
                />
              ) : (
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                >
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  {!categories.includes('General Items') && <option value="General Items">General Items</option>}
                </select>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Unit</label>
              <select
                required
                value={formData.unit_id}
                onChange={e => setFormData({ ...formData, unit_id: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
              >
                {units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Opening Qty</label>
              <input
                type="number"
                value={formData.opening_qty || ''}
                onChange={e => setFormData({ ...formData, opening_qty: Number(e.target.value) })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Opening Rate</label>
              <input
                type="number"
                value={formData.opening_rate || ''}
                onChange={e => setFormData({ ...formData, opening_rate: Number(e.target.value) })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[10px] text-gray-500 hover:text-foreground uppercase tracking-widest transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name || !formData.unit_id}
              className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-amber-700 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Create Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
