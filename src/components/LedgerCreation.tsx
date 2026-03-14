import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { cn } from '../lib/utils';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';

export function LedgerCreation() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { notifications, companyName, features = [] } = useSettings();
  const { id } = useParams();

  const isBillWiseEnabled = features.find(f => f.id === 'bill')?.enabled ?? true;
  const isCostCenterEnabled = features.find(f => f.id === 'cost')?.enabled ?? false;
  const isInterestEnabled = features.find(f => f.id === 'int')?.enabled ?? true;
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [groups, setGroups] = useState<any[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [hasTransactions, setHasTransactions] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    alias: '',
    group_id: '',
    opening_balance: 0,
    // Mailing Details
    mailing_name: '',
    address: '',
    division: '',
    country: 'Bangladesh',
    postal_code: '',
    primary_mobile: '',
    email: '',
    website: '',
    // Contact Details
    provide_contact_details: false,
    contact_name: '',
    contact_phone: '',
    contact_email: '',
    // Banking Details
    provide_bank_details: false,
    bank_transaction_type: 'Cheque',
    bank_account_no: '',
    bank_code: '',
    bank_name: '',
    // Additional
    is_bill_wise: false,
    vat_no: '',
  });

  useEffect(() => {
    async function init() {
      try {
        const gData = await erpService.getLedgerGroups();
        setGroups(gData);

        if (isEdit) {
          const [lData, hasTx] = await Promise.all([
            erpService.getLedgerById(id),
            erpService.checkLedgerTransactions(id)
          ]);
          setHasTransactions(hasTx);
          setFormData({
            ...formData,
            ...lData,
            opening_balance: lData.opening_balance || 0,
            provide_contact_details: !!(lData.contact_name || lData.contact_phone || lData.contact_email),
            provide_bank_details: !!(lData.bank_account_no || lData.bank_name)
          });
        } else if (gData.length > 0) {
          const sundryDebtors = gData.find(g => g.name === 'Sundry Debtors');
          setFormData(prev => ({ ...prev, group_id: sundryDebtors?.id || gData[0].id }));
        }
      } catch (err) {
        console.error('Error initializing ledger form:', err);
      } finally {
        setFetching(false);
      }
    }
    init();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.group_id) return;

    setLoading(true);
    try {
      // Clean the data: Remove joined objects and internal fields that are not columns
      const { 
        ledger_groups, 
        id: _id, 
        created_at: _ca, 
        provide_contact_details, 
        provide_bank_details, 
        ...cleanData 
      } = formData as any;

      if (isEdit) {
        await erpService.updateLedger(id, cleanData);
        showNotification(notifications.ledgerCreated.replace('created', 'updated'));
      } else {
        await erpService.createLedger(cleanData);
        showNotification(notifications.ledgerCreated);
      }
      navigate('/accounts');
    } catch (err) {
      console.error('Error saving ledger:', err);
      alert('Failed to save ledger. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await erpService.deleteLedger(id);
      navigate('/accounts');
    } catch (err) {
      console.error('Error deleting ledger:', err);
      alert('Failed to delete ledger. It might be in use.');
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
      <div className="max-w-6xl mx-auto bg-card border border-border overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-4 lg:px-6 py-4 border-b border-border bg-foreground/5 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-foreground/10 rounded transition-colors text-gray-500 hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-bold text-foreground uppercase tracking-widest">
              Ledger {isEdit ? 'Alteration' : 'Creation'}
            </h1>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto">
            {isEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
            <div className="text-[10px] text-gray-500 uppercase tracking-widest hidden sm:block">
              Company: {companyName}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 lg:p-8 space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left Column: Primary Details */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[11px] text-foreground font-bold uppercase tracking-[0.2em] border-b border-border pb-2">General Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Name</label>
                    <input
                      autoFocus
                      type="text"
                      required
                      value={formData.name || ''}
                      onChange={e => setFormData({ ...formData, name: e.target.value, mailing_name: formData.mailing_name || e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      placeholder="e.g., Company Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block">(alias)</label>
                    <input
                      type="text"
                      value={formData.alias || ''}
                      onChange={e => setFormData({ ...formData, alias: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
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
                      {groups.map(group => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {isBillWiseEnabled && (
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="is_bill_wise"
                        checked={formData.is_bill_wise}
                        onChange={e => setFormData({ ...formData, is_bill_wise: e.target.checked })}
                        className="w-4 h-4 accent-foreground bg-background border-border"
                      />
                      <label htmlFor="is_bill_wise" className="text-[10px] text-gray-400 uppercase tracking-widest cursor-pointer">
                        Maintain balances bill-by-bill
                      </label>
                    </div>
                  )}
                  {isCostCenterEnabled && (
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="is_cost_center"
                        checked={(formData as any).is_cost_center || false}
                        onChange={e => setFormData({ ...formData, is_cost_center: e.target.checked } as any)}
                        className="w-4 h-4 accent-foreground bg-background border-border"
                      />
                      <label htmlFor="is_cost_center" className="text-[10px] text-gray-400 uppercase tracking-widest cursor-pointer">
                        Cost Centers are applicable
                      </label>
                    </div>
                  )}
                  {isInterestEnabled && (
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="is_interest"
                        checked={(formData as any).is_interest || false}
                        onChange={e => setFormData({ ...formData, is_interest: e.target.checked } as any)}
                        className="w-4 h-4 accent-foreground bg-background border-border"
                      />
                      <label htmlFor="is_interest" className="text-[10px] text-gray-400 uppercase tracking-widest cursor-pointer">
                        Activate interest calculation
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Details Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-[11px] text-foreground font-bold uppercase tracking-[0.2em]">Contact Details</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="provide_contact_details"
                      checked={formData.provide_contact_details}
                      onChange={e => setFormData({ ...formData, provide_contact_details: e.target.checked })}
                      className="w-3 h-3 accent-foreground bg-background border-border"
                    />
                    <label htmlFor="provide_contact_details" className="text-[9px] text-gray-500 uppercase cursor-pointer">Provide Contact Details</label>
                  </div>
                </div>
                {formData.provide_contact_details && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Contact Person Name</label>
                      <input
                        type="text"
                        value={formData.contact_name || ''}
                        onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Phone No.</label>
                        <input
                          type="text"
                          value={formData.contact_phone || ''}
                          onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                          className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Email</label>
                        <input
                          type="email"
                          value={formData.contact_email || ''}
                          onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                          className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Mailing & Banking Details */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[11px] text-foreground font-bold uppercase tracking-[0.2em] border-b border-border pb-2">Mailing Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Name</label>
                    <input
                      type="text"
                      value={formData.mailing_name || ''}
                      onChange={e => setFormData({ ...formData, mailing_name: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Address</label>
                    <textarea
                      value={formData.address || ''}
                      onChange={e => setFormData({ ...formData, address: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-20 resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Division / State</label>
                      <input
                        type="text"
                        value={formData.division || ''}
                        onChange={e => setFormData({ ...formData, division: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Country</label>
                      <input
                        type="text"
                        value={formData.country || ''}
                        onChange={e => setFormData({ ...formData, country: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Postal Code</label>
                      <input
                        type="text"
                        value={formData.postal_code || ''}
                        onChange={e => setFormData({ ...formData, postal_code: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Primary Mobile No.</label>
                      <input
                        type="text"
                        value={formData.primary_mobile || ''}
                        onChange={e => setFormData({ ...formData, primary_mobile: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Email</label>
                      <input
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Website</label>
                      <input
                        type="text"
                        value={formData.website || ''}
                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banking Details Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-[11px] text-foreground font-bold uppercase tracking-[0.2em]">Banking Details</h3>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="provide_bank_details"
                      checked={formData.provide_bank_details}
                      onChange={e => setFormData({ ...formData, provide_bank_details: e.target.checked })}
                      className="w-3 h-3 accent-foreground bg-background border-border"
                    />
                    <label htmlFor="provide_bank_details" className="text-[9px] text-gray-500 uppercase cursor-pointer">Provide Bank Details</label>
                  </div>
                </div>
                {formData.provide_bank_details && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Transaction Type</label>
                      <select
                        value={formData.bank_transaction_type}
                        onChange={e => setFormData({ ...formData, bank_transaction_type: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      >
                        <option>Cheque</option>
                        <option>e-fund Transfer</option>
                        <option>Other</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block">A/c No.</label>
                        <input
                          type="text"
                          value={formData.bank_account_no || ''}
                          onChange={e => setFormData({ ...formData, bank_account_no: e.target.value })}
                          className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Bank Code (IFSC/Swift)</label>
                        <input
                          type="text"
                          value={formData.bank_code || ''}
                          onChange={e => setFormData({ ...formData, bank_code: e.target.value })}
                          className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-gray-500 uppercase tracking-widest block">Bank Name</label>
                      <input
                        type="text"
                        value={formData.bank_name || ''}
                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opening Balance Section */}
          <div className="pt-8 border-t border-border flex flex-col items-end">
            <div className="w-full md:w-1/2 space-y-2">
              <label className="text-[10px] text-gray-500 uppercase tracking-widest block text-right">Opening Balance (৳)</label>
              <input
                type="number"
                value={formData.opening_balance ?? ''}
                onChange={e => setFormData({ ...formData, opening_balance: Number(e.target.value) })}
                className="w-full bg-background border border-border text-foreground p-4 text-lg font-bold outline-none focus:border-foreground transition-colors text-right"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t border-border">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-2 text-[10px] text-gray-500 hover:text-foreground uppercase tracking-widest transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 px-12 py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,0,0,0.1)] order-1 sm:order-2"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {isEdit ? 'Update Ledger' : 'Create Ledger'}
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
                    <span className="font-bold uppercase">Warning:</span> This ledger has existing transactions in the system. 
                    Deleting it will cause inconsistencies in your financial reports.
                  </p>
                  <p className="text-[10px] text-rose-500 uppercase tracking-widest font-bold">
                    It is highly recommended to keep this ledger.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Are you sure you want to delete <span className="text-foreground font-bold">"{formData.name}"</span>? 
                  This ledger will be permanently removed from your chart of accounts.
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

      {/* Keyboard Shortcuts Help */}
      <div className="max-w-6xl mx-auto mt-6 hidden sm:flex gap-6 text-[9px] text-gray-600 uppercase font-mono">
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-card border border-border rounded">Enter</kbd>
          <span>Next Field</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-card border border-border rounded">Ctrl + S</kbd>
          <span>Save Ledger</span>
        </div>
        <div className="flex items-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-card border border-border rounded">Esc</kbd>
          <span>Cancel</span>
        </div>
      </div>
    </div>
  );
}

