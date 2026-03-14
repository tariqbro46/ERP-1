import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Calculator } from 'lucide-react';
import { erpService } from '../services/erpService';
import { supabase } from '../lib/supabase';

interface QuickAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partyLedgerId: string;
  partyName: string;
  currentBalance: number;
}

export function QuickAdjustmentModal({ isOpen, onClose, onSuccess, partyLedgerId, partyName, currentBalance }: QuickAdjustmentModalProps) {
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
    try {
      // Fetch ledgers under Indirect Expenses or Direct Expenses
      const { data: groups } = await supabase
        .from('ledger_groups')
        .select('id')
        .in('name', ['Indirect Expenses', 'Direct Expenses']);
      
      if (groups && groups.length > 0) {
        const groupIds = groups.map(g => g.id);
        const { data: ledgers } = await supabase
          .from('ledgers')
          .select('*')
          .in('group_id', groupIds)
          .order('name');
        
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
    if (!formData.adjustmentLedgerId || formData.amount === 0) return;

    setLoading(true);
    try {
      const v_no = await erpService.getNextVoucherNumber('Journal');
      
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

      await erpService.createVoucher(voucher, entries);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating adjustment:', err);
      alert('Failed to create adjustment entry.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <h2 className="text-xs font-bold text-foreground uppercase tracking-widest">Quick Balance Adjustment</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="p-4 bg-foreground/5 border border-border space-y-1">
            <div className="text-[10px] text-gray-500 uppercase tracking-widest">Party Name</div>
            <div className="text-sm font-bold text-foreground">{partyName}</div>
            <div className="text-[10px] text-gray-500 uppercase tracking-widest mt-2">Current Balance</div>
            <div className="text-sm font-bold text-foreground">
              ৳ {Math.abs(currentBalance).toLocaleString()} {currentBalance >= 0 ? 'Dr' : 'Cr'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Adjustment Date</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Amount to Reduce (৳)</label>
              <input
                autoFocus
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formData.amount || ''}
                onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors text-right font-bold"
                placeholder="e.g., 10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Adjustment Account (Debit)</label>
            <select
              required
              value={formData.adjustmentLedgerId}
              onChange={e => setFormData({ ...formData, adjustmentLedgerId: e.target.value })}
              className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
            >
              <option value="">Select Expense Ledger...</option>
              {adjustmentLedgers.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <p className="text-[9px] text-gray-500 italic">This will be debited as an expense.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Narration</label>
            <textarea
              value={formData.narration}
              onChange={e => setFormData({ ...formData, narration: e.target.value })}
              rows={2}
              className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors resize-none"
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
              disabled={loading || !formData.adjustmentLedgerId || formData.amount <= 0}
              className="flex items-center gap-2 px-6 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Post Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
