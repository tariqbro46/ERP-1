import React, { useState, useEffect } from 'react';
import { Save, Loader2, Calculator } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { EnterpriseModal } from './ui/EnterpriseModal';

interface QuickAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partyLedgerId: string;
  partyName: string;
  currentBalance: number;
}

export function QuickAdjustmentModal({ isOpen, onClose, onSuccess, partyLedgerId, partyName, currentBalance }: QuickAdjustmentModalProps) {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [adjustmentLedgers, setAdjustmentLedgers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    amount: 0,
    adjustmentLedgerId: '',
    narration: `Adjustment to match party balance for ${partyName}`,
    date: new Date().toLocaleDateString('en-CA')
  });


  useEffect(() => {
    if (isOpen) {
      fetchAdjustmentLedgers();
    }
  }, [isOpen]);

  async function fetchAdjustmentLedgers() {
    if (!user?.companyId) return;
    try {
      // Fetch ledgers under Indirect Expenses or Direct Expenses
      const groups = await erpService.getLedgerGroups(user.companyId);
      const targetGroups = groups.filter(g => ['Indirect Expenses', 'Direct Expenses'].includes(g.name));
      
      if (targetGroups.length > 0) {
        const groupIds = targetGroups.map(g => g.id);
        const allLedgers = await erpService.getLedgers(user.companyId);
        const ledgers = allLedgers.filter(l => groupIds.includes(l.group_id));
        
        if (ledgers) {
          setAdjustmentLedgers(ledgers);
          
          // Try to find "Discount Allowed" or "Adjustment"
          const defaultLedger = ledgers.find(l => 
            l.name.toLowerCase().includes('discount') || 
            l.name.toLowerCase().includes('adjustment')
          );
          
          if (defaultLedger) {
            setFormData(prev => ({ ...prev, adjustmentLedgerId: defaultLedger.id }));
          } else if (ledgers.length > 0) {
            setFormData(prev => ({ ...prev, adjustmentLedgerId: ledgers[0].id }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching adjustment ledgers:', err);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.adjustmentLedgerId || formData.amount === 0 || !user?.companyId) return;

    setLoading(true);
    try {
      const v_no = await erpService.getNextVoucherNumber(user.companyId, 'Journal');
      
      // Journal Entry:
      // If we want to REDUCE a Debit balance (Asset/Debtor), we CREDIT the party.
      // If we want to REDUCE a Credit balance (Liability/Creditor), we DEBIT the party.
      
      // In this specific case: Party owes 110 (Debit), we want to make it 100.
      // So we CREDIT the party 10, and DEBIT Discount Allowed 10.
      
      const entries = [
        {
          ledger_id: formData.adjustmentLedgerId,
          debit: formData.amount,
          credit: 0
        },
        {
          ledger_id: partyLedgerId,
          debit: 0,
          credit: formData.amount
        }
      ];

      const voucher = {
        v_type: 'Journal',
        v_no,
        v_date: formData.date,
        narration: formData.narration,
        total_amount: formData.amount
      };

      await erpService.createVoucher(user.companyId, user.uid, voucher, entries);
      showNotification('Adjustment entry created successfully!', 'success');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating adjustment:', err);
      showNotification('Failed to create adjustment entry.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="Quick Balance Adjustment"
      icon={<Calculator className="w-4 h-4 text-emerald-500" />}
      bodyClassName="p-6"
      footer={
        <div className="flex justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="quick-adjustment-form"
            disabled={loading || !formData.adjustmentLedgerId || formData.amount <= 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Post Adjustment
          </button>
        </div>
      }
    >
      <form id="quick-adjustment-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-1">
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Party Name</div>
          <div className="text-sm font-bold text-foreground">{partyName}</div>
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider pt-2">Current Balance</div>
          <div className="text-sm font-bold text-foreground tabular-nums">
            ৳ {Math.abs(currentBalance).toLocaleString()} {currentBalance >= 0 ? 'Dr' : 'Cr'}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground block">Adjustment Date</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground block">Amount to Reduce (৳)</label>
            <input
              autoFocus
              type="number"
              required
              min="0.01"
              step="0.01"
              value={formData.amount || ''}
              onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
              className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all text-right font-bold tabular-nums"
              placeholder="e.g., 10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground block">Adjustment Account (Debit)</label>
          <select
            required
            value={formData.adjustmentLedgerId}
            onChange={e => setFormData({ ...formData, adjustmentLedgerId: e.target.value })}
            className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
          >
            <option value="">Select Expense Ledger...</option>
            {adjustmentLedgers.map(l => (
              <option key={l.id} value={l.id}>{l.name}</option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">This will be debited as an expense.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground block">Narration</label>
          <textarea
            value={formData.narration}
            onChange={e => setFormData({ ...formData, narration: e.target.value })}
            rows={2}
            className="w-full rounded-lg bg-background border border-border text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all resize-none"
          />
        </div>
      </form>
    </EnterpriseModal>
  );
}
