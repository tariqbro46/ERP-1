import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';

interface QuickLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ledger: any) => void;
  initialGroup?: string; // Optional filter for groups
}

export function QuickLedgerModal({ isOpen, onClose, onSuccess, initialGroup }: QuickLedgerModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    group_id: '',
    opening_balance: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchGroups();
    }
  }, [isOpen]);

  async function fetchGroups() {
    if (!user?.companyId) return;
    try {
      const data = await erpService.getLedgerGroups(user.companyId);
      setGroups(data);
      
      // Try to find a matching group based on initialGroup hint
      if (initialGroup) {
        const matchingGroup = data.find(g => g.name.toLowerCase().includes(initialGroup.toLowerCase()));
        if (matchingGroup) {
          setFormData(prev => ({ ...prev, group_id: matchingGroup.id }));
          return;
        }
      }
      
      if (data.length > 0 && !formData.group_id) {
        setFormData(prev => ({ ...prev, group_id: data[0].id }));
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.group_id) return;

    setLoading(true);
    try {
      const newLedger = await erpService.createLedger(user!.companyId, formData);
      onSuccess(newLedger);
      onClose();
      setFormData({ name: '', group_id: '', opening_balance: 0 });
    } catch (err) {
      console.error('Error creating ledger:', err);
      alert('Failed to create ledger.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-card border border-border w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 my-auto md:my-8">
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-border bg-card/95 backdrop-blur-sm">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Quick Ledger Creation</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Ledger Name</label>
            <input
              autoFocus
              type="text"
              required
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
              placeholder="e.g., Office Rent"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Under (Group)</label>
            <select
              required
              value={formData.group_id}
              onChange={e => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
            >
              <option value="">Select Group...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Opening Balance (৳)</label>
            <input
              type="number"
              value={formData.opening_balance ?? ''}
              onFocus={e => e.target.value === '0' && e.target.select()}
              onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
              className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right"
            />
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
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
