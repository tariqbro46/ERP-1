import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Ruler, Hash } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSubscription } from '../hooks/useSubscription';
import { EditableHeader } from './EditableHeader';
import { EnterpriseModal } from './ui/EnterpriseModal';
import { SkeletonLoader } from './SkeletonLoader';

export function UnitMaster() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { checkLimit } = useSubscription();
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any>(null);
  const [name, setName] = useState('');
  const [formalName, setFormalName] = useState('');
  const [decimalPlaces, setDecimalPlaces] = useState(0);
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchUnits();
  }, [user?.companyId]);

  async function fetchUnits() {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getUnits(user.companyId);
      setUnits(data);
    } catch (err: any) {
      console.error('Error fetching units:', err);
      showNotification(err.message || 'Failed to load units', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user?.companyId) return;
    
    setLoading(true);
    try {
      if (!editingUnit) {
        const count = await erpService.getCollectionCount('units', user.companyId);
        if (!checkLimit('items', count)) {
          setLoading(false);
          return;
        }
      }

      const unitData = { 
        name, 
        formal_name: formalName, 
        decimal_places: Number(decimalPlaces) 
      };

      if (editingUnit) {
        await erpService.updateUnit(editingUnit.id, unitData);
      } else {
        await erpService.createUnit(user!.companyId, unitData);
      }
      
      showNotification(editingUnit ? 'Unit updated successfully' : 'Unit saved successfully');
      setIsModalOpen(false);
      resetForm();
      fetchUnits();
    } catch (err: any) {
      console.error('Error saving unit:', err);
      showNotification(err.message || 'Failed to save unit', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setFormalName('');
    setDecimalPlaces(0);
    setEditingUnit(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this unit?')) return;
    
    setLoading(true);
    try {
      // Check if unit is in use by any item
      const items = await erpService.getItems(user!.companyId);
      const isInUse = items.some(item => item.unit_id === id);
      
      if (isInUse) {
        throw new Error('Cannot delete unit as it is being used by one or more stock items.');
      }

      await erpService.deleteUnit(id);
      showNotification('Unit deleted successfully');
      fetchUnits();
    } catch (err: any) {
      console.error('Error deleting unit:', err);
      showNotification(err.message || 'Failed to delete unit', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen transition-colors">
      <div className="space-y-6">
        <div className="flex justify-between items-start gap-4">
          <EditableHeader 
            pageId="units_master"
            defaultTitle="Units of Measure" 
            defaultSubtitle="Manage stock units and measurement types"
          />
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Add Unit
          </button>
        </div>

        {loading && units.length === 0 ? (
          <SkeletonLoader type="cards" pageKey="inventory" isFullPage={false} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {units.map((u) => (
              <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start hover:border-primary/40 transition-colors group shadow-[var(--shadow-surface)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <Ruler className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">{u.name}</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">{u.formal_name || 'No formal name'}</p>
                    <div className="flex items-center gap-1 mt-2 text-[9px] text-gray-400">
                      <Hash className="w-2 h-2" /> Decimals: {u.decimal_places || 0}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingUnit(u);
                      setName(u.name);
                      setFormalName(u.formal_name || '');
                      setDecimalPlaces(u.decimal_places || 0);
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(u.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {units.length === 0 && (
              <div className="col-span-full py-20 text-center border border-dashed border-border text-gray-500 uppercase text-[10px] tracking-widest">
                No units found. Add your first unit to get started.
              </div>
            )}
          </div>
        )}
      </div>

      <EnterpriseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'Edit Unit' : 'Add Unit'}
        icon={<Ruler className="w-4 h-4" />}
        size="md"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              form="unit-form"
              disabled={loading || !name}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingUnit ? 'Update Unit' : 'Save Unit'}
            </button>
          </div>
        }
      >
        <form id="unit-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Symbol (e.g. Pcs)</label>
            <input 
              autoFocus
              type="text" 
              required
              value={name || ''}
              onChange={e => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              placeholder="e.g. Kg"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Formal Name</label>
            <input 
              type="text" 
              value={formalName || ''}
              onChange={e => setFormalName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              placeholder="e.g. Kilograms"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Number of Decimal Places</label>
            <input 
              type="number" 
              min="0"
              max="4"
              value={decimalPlaces}
              onChange={e => setDecimalPlaces(Number(e.target.value))}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors tabular-nums"
            />
          </div>
        </form>
      </EnterpriseModal>
    </div>
  );
}
