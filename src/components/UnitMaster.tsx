import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, Ruler, Hash } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSubscription } from '../hooks/useSubscription';
import { EditableHeader } from './EditableHeader';

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
      
      if (editingUnit) {
        setIsModalOpen(false);
      }
      
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
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex justify-between items-start">
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
            className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> Add Unit
          </button>
        </div>

        {loading && units.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {units.map((u) => (
              <div key={u.id} className="bg-card border border-border p-4 flex justify-between items-start hover:border-foreground/30 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-foreground/5 rounded">
                    <Ruler className="w-4 h-4 text-gray-500" />
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md overflow-hidden shadow-2xl my-auto md:my-8">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-foreground/5 sticky top-0 z-10 backdrop-blur-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                {editingUnit ? 'Edit Unit' : 'Add Unit'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-foreground">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Symbol (e.g. Pcs)</label>
                <input 
                  autoFocus
                  type="text" 
                  required
                  value={name || ''}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  placeholder="e.g. Kg"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Formal Name</label>
                <input 
                  type="text" 
                  value={formalName || ''}
                  onChange={e => setFormalName(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  placeholder="e.g. Kilograms"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Number of Decimal Places</label>
                <input 
                  type="number" 
                  min="0"
                  max="4"
                  value={decimalPlaces}
                  onChange={e => setDecimalPlaces(Number(e.target.value))}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading || !name}
                  className="w-full py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (editingUnit ? 'Update Unit' : 'Save Unit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
