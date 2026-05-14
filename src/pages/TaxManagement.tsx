import React, { useState, useEffect } from 'react';
import { Percent, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { TaxRate } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export default function TaxManagement() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTax, setNewTax] = useState<Partial<TaxRate>>({
    name: '',
    rate: 0,
    type: 'VAT',
    isActive: true
  });

  useEffect(() => {
    loadTaxRates();
  }, [user?.companyId]);

  const loadTaxRates = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getTaxRates(user.companyId);
      setTaxRates(data);
    } catch (error) {
      console.error('Error loading tax rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTax = async () => {
    if (!user?.companyId || !newTax.name) return;
    try {
      await erpService.createTaxRate({
        ...newTax,
        companyId: user.companyId
      } as TaxRate);
      showNotification('Tax rate created successfully');
      setShowAddForm(false);
      setNewTax({ name: '', rate: 0, type: 'VAT', isActive: true });
      loadTaxRates();
    } catch (error) {
      showNotification('Failed to create tax rate', 'error');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-background font-mono">
      {/* Sticky Header */}
      <div className="sticky top-0 bg-background border-b border-border shadow-sm px-4 lg:px-6 py-4 z-30">
        <div className="flex justify-between items-center">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Tax & VAT Management</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block">Configuration and Compliance</p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add Tax Rate
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {showAddForm && (
          <div className="bg-card border border-border p-6 shadow-xl max-w-2xl mx-auto">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-6 pb-2 border-b border-border">Create New Tax Definition</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tax Name</label>
                <input 
                  type="text"
                  value={newTax.name}
                  onChange={e => setNewTax({...newTax, name: e.target.value})}
                  placeholder="e.g. Standard VAT"
                  className="w-full bg-background border border-border p-3 text-xs focus:ring-1 focus:ring-foreground outline-none uppercase"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tax Percentage (%)</label>
                <input 
                  type="number"
                  value={newTax.rate}
                  onChange={e => setNewTax({...newTax, rate: parseFloat(e.target.value) || 0})}
                  placeholder="0.00"
                  className="w-full bg-background border border-border p-3 text-xs focus:ring-1 focus:ring-foreground outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Tax Type</label>
                <select 
                  value={newTax.type}
                  onChange={e => setNewTax({...newTax, type: e.target.value as any})}
                  className="w-full bg-background border border-border p-3 text-xs focus:ring-1 focus:ring-foreground outline-none"
                >
                  <option value="VAT">VAT</option>
                  <option value="GST">GST</option>
                  <option value="Service Tax">Service Tax</option>
                  <option value="Sales Tax">Sales Tax</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button 
                onClick={handleCreateTax}
                className="flex-1 py-3 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all"
              >
                Create Tax Rate
              </button>
              <button 
                onClick={() => setShowAddForm(false)}
                className="px-6 py-3 border border-border text-[11px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-muted/95 backdrop-blur-sm z-20 shadow-sm border-b border-border">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Tax Name</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Rate (%)</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {taxRates.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-xs text-gray-500 uppercase tracking-widest">
                      {loading ? 'Scanning Compliance Database...' : 'No tax rates defined'}
                    </td>
                  </tr>
                ) : (
                  taxRates.map(tax => (
                    <tr key={tax.id} className="hover:bg-foreground/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-foreground/10 flex items-center justify-center">
                            <Percent className="w-4 h-4 text-emerald-500" />
                          </div>
                          <span className="text-xs font-bold text-foreground uppercase tracking-wider">{tax.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-medium text-gray-500 uppercase px-2 py-1 bg-muted rounded">{tax.type}</span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-foreground">{tax.rate}%</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded ${tax.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                          {tax.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-gray-400 hover:text-red-500 p-2 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-emerald-500/5 border border-emerald-500/20 rounded-lg space-y-2">
            <h4 className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Automatic Calculation</h4>
            <p className="text-[11px] text-gray-500">Tax is automatically applied to Sales and Purchase vouchers based on line item percentages.</p>
          </div>
          <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-lg space-y-2">
            <h4 className="text-[10px] text-blue-600 font-bold uppercase tracking-widest">Tax Reports</h4>
            <p className="text-[11px] text-gray-500">Generate VAT-6.3 and GST summaries automatically from your transaction history.</p>
          </div>
          <div className="p-6 bg-purple-500/5 border border-purple-500/20 rounded-lg space-y-2">
            <h4 className="text-[10px] text-purple-600 font-bold uppercase tracking-widest">Cloud Sync</h4>
            <p className="text-[11px] text-gray-500">All tax data is encrypted and synced with your company records for audit compliance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
