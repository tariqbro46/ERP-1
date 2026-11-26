import React, { useState, useEffect } from 'react';
import { Save, Loader2, BookOpen } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { EnterpriseModal } from './ui/EnterpriseModal';

interface QuickLedgerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ledger: any) => void;
  initialGroup?: string;
}

export function QuickLedgerModal({ isOpen, onClose, onSuccess, initialGroup }: QuickLedgerModalProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
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
      const unique = Array.from(new Map<string, any>(data.map((g: any) => [g.name.trim().toLowerCase(), g])).values());
      setGroups(unique);

      if (initialGroup) {
        const matchingGroup = unique.find(g => g.name.toLowerCase().includes(initialGroup.toLowerCase()));
        if (matchingGroup) {
          setFormData(prev => ({
            ...prev,
            group_id: matchingGroup.id,
            group_name: matchingGroup.name,
            parent_group_id: matchingGroup.parent_id || matchingGroup.parent_group_id || matchingGroup.id
          }));
          return;
        }
      }

      if (unique.length > 0 && !formData.group_id) {
        setFormData(prev => ({
          ...prev,
          group_id: unique[0].id,
          group_name: unique[0].name,
          parent_group_id: unique[0].parent_id || unique[0].parent_group_id || unique[0].id
        }));
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
      const selectedGroup = groups.find(g => g.id === formData.group_id);
      const newLedger = await erpService.createLedger(user!.companyId, {
        ...formData,
        group_name: selectedGroup?.name || (formData as any).group_name || '',
        parent_group_id: selectedGroup?.parent_id || selectedGroup?.parent_group_id || formData.group_id
      });
      onSuccess(newLedger);
      showNotification('Ledger created successfully!', 'success');
      onClose();
      setFormData({ name: '', group_id: '', opening_balance: 0 });
    } catch (err) {
      console.error('Error creating ledger:', err);
      showNotification('Failed to create ledger.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={<BookOpen className="w-4 h-4" />}
      title="Quick Ledger Creation"
      subtitle="Create a new ledger account and immediately attach it to your active entry."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
            Ledger Name
          </label>
          <input
            autoFocus
            type="text"
            required
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            placeholder="e.g., Office Rent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Under (Group)
            </label>
            <select
              required
              value={formData.group_id}
              onChange={e => setFormData({ ...formData, group_id: e.target.value })}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3.5 py-2.5 text-sm outline-none focus:border-primary transition-colors"
            >
              <option value="">Select Group...</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>{group.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
              Opening Balance (৳)
            </label>
            <input
              type="number"
              value={formData.opening_balance ?? ''}
              onFocus={e => e.target.value === '0' && e.target.select()}
              onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
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
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Create Ledger
          </button>
        </div>
      </form>
    </EnterpriseModal>
  );
}

