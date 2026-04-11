import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Building2, Plus, Check, Loader2, ArrowRight, Trash2, X, Upload } from 'lucide-react';
import { cn } from '../lib/utils';

export function CompanyManagement() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showNotification } = useNotification();
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCompany, setNewCompany] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: ''
  });

  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    logo_url: ''
  });

  useEffect(() => {
    fetchCompanies();
  }, [user?.uid]);

  async function fetchCompanies() {
    if (!user?.uid) return;
    try {
      const data = await erpService.getUserCompanies(user.uid);
      setCompanies(data);
    } catch (err) {
      console.error('Error fetching companies:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany.name || !user?.uid) return;

    setCreating(true);
    try {
      await erpService.createCompany(user.uid, newCompany);
      showNotification(t('company.createSuccess'));
      setNewCompany({ name: '', address: '', phone: '', email: '', logo_url: '' });
      await fetchCompanies();
    } catch (err) {
      console.error('Error creating company:', err);
      alert('Failed to create company.');
    } finally {
      setCreating(false);
    }
  };

  const handleSwitch = async (companyId: string) => {
    if (!user?.uid || companyId === user.companyId) return;

    setSwitching(companyId);
    try {
      await erpService.switchCompany(user.uid, companyId);
      showNotification(t('company.switchSuccess'));
      // The AuthContext listener will pick up the change and update the UI
    } catch (err) {
      console.error('Error switching company:', err);
      alert('Failed to switch company.');
    } finally {
      setSwitching(null);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setSwitching(editingId);
    try {
      await erpService.updateCompany(editingId, editForm);
      showNotification(t('company.updateSuccess'));
      setEditingId(null);
      await fetchCompanies();
    } catch (err) {
      console.error('Error updating company:', err);
      alert('Failed to update company.');
    } finally {
      setSwitching(null);
    }
  };

  const startEditing = (company: any) => {
    setEditingId(company.id);
    setEditForm({
      name: company.name || '',
      address: company.address || '',
      phone: company.phone || '',
      email: company.email || '',
      logo_url: company.logo_url || ''
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) { // 500KB limit for company management
        showNotification('Logo size should be less than 500KB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (isEdit) {
          setEditForm(prev => ({ ...prev, logo_url: base64 }));
        } else {
          setNewCompany(prev => ({ ...prev, logo_url: base64 }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Are you sure you want to delete this company and all its data? This action cannot be undone.')) {
      return;
    }

    setSwitching(companyId);
    try {
      await erpService.deleteCompany(companyId);
      showNotification(t('company.deleteSuccess'));
      await fetchCompanies();
    } catch (err) {
      console.error('Error deleting company:', err);
      alert('Failed to delete company.');
    } finally {
      setSwitching(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono">
      <div className="space-y-8">
        <div className="border-b border-border pb-4 flex items-baseline gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">{t('company.title')}</h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest">{t('company.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Create New Company */}
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-widest">
              <Plus className="w-4 h-4" />
              {t('company.create')}
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('company.name')} *</label>
                <input
                  type="text"
                  required
                  value={newCompany.name}
                  onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.address')}</label>
                <textarea
                  value={newCompany.address}
                  onChange={e => setNewCompany({ ...newCompany, address: e.target.value })}
                  className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground min-h-[80px]"
                  placeholder="Company Address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.phone')}</label>
                  <input
                    type="text"
                    value={newCompany.phone}
                    onChange={e => setNewCompany({ ...newCompany, phone: e.target.value })}
                    className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('auth.email')}</label>
                  <input
                    type="email"
                    value={newCompany.email}
                    onChange={e => setNewCompany({ ...newCompany, email: e.target.value })}
                    className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('company.logo')}</label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 border border-dashed border-border flex items-center justify-center bg-background overflow-hidden">
                    {newCompany.logo_url ? (
                      <img src={newCompany.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 className="w-5 h-5 text-gray-400 opacity-20" />
                    )}
                  </div>
                  <label className="flex-1 cursor-pointer bg-foreground/5 border border-border hover:bg-foreground/10 transition-all p-2 text-center">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">{t('common.upload')} {t('company.logo')}</span>
                    <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, false)} className="hidden" />
                  </label>
                </div>
                <div className="mt-2">
                  <input 
                    type="text"
                    value={newCompany.logo_url.startsWith('data:') ? '' : newCompany.logo_url}
                    onChange={(e) => setNewCompany(prev => ({ ...prev, logo_url: e.target.value }))}
                    placeholder="Or enter Logo URL"
                    className="w-full bg-background border border-border text-foreground p-2 text-[10px] outline-none focus:border-foreground"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full bg-foreground text-background py-3 text-[10px] uppercase font-bold tracking-widest hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
              >
                {creating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {t('company.create')} & {t('company.switch')}
              </button>
            </form>
          </div>

          {/* Switch Company */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-widest px-2">
              <Building2 className="w-4 h-4" />
              {t('company.title')}
            </div>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-foreground animate-spin" />
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map(company => (
                  <div 
                    key={company.id}
                    className={cn(
                      "bg-card border p-4 flex items-center justify-between group transition-all",
                      user?.companyId === company.id ? "border-foreground" : "border-border hover:border-gray-500"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-full border overflow-hidden",
                        user?.companyId === company.id ? "border-foreground" : "border-border hover:border-gray-500"
                      )}>
                        {company.logo_url ? (
                          <img src={company.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          <div className={cn(
                            "w-full h-full flex items-center justify-center",
                            user?.companyId === company.id ? "bg-foreground text-background" : "bg-background text-gray-500"
                          )}>
                            <Building2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">{company.name}</h3>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-gray-500 uppercase tracking-widest">{company.address || 'No address set'}</p>
                          {(company.phone || company.email) && (
                            <p className="text-[8px] text-gray-400 uppercase tracking-widest">
                              {company.phone} {company.phone && company.email && '•'} {company.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.companyId === company.id && (
                        <div className="flex items-center gap-1 text-emerald-500 text-[8px] font-bold uppercase tracking-widest mr-2">
                          <Check className="w-3 h-3" />
                          {t('company.current')}
                        </div>
                      )}
                      {!editingId && (
                        <>
                          <button
                            onClick={() => startEditing(company)}
                            disabled={!!switching}
                            className="opacity-0 group-hover:opacity-100 transition-all text-gray-500 hover:text-foreground p-1"
                            title="Edit Company Details"
                          >
                            <Plus className="w-4 h-4 rotate-45" />
                          </button>
                          {user?.companyId !== company.id && (
                            <>
                              <button
                                onClick={() => handleDeleteCompany(company.id)}
                                disabled={!!switching}
                                className="opacity-0 group-hover:opacity-100 transition-all text-rose-500 hover:text-rose-600 p-1"
                                title="Delete Company"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleSwitch(company.id)}
                                disabled={!!switching}
                                className="opacity-0 group-hover:opacity-100 transition-all text-[9px] uppercase font-bold tracking-widest text-gray-500 hover:text-foreground flex items-center gap-1"
                              >
                                {switching === company.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                                Switch
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                </div>
              ))}

                {/* Edit Modal / Inline Form */}
                {editingId && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-card border border-border p-6 w-full max-w-md space-y-6 animate-in zoom-in-95 duration-200 my-auto md:my-8">
                      <div className="flex items-center justify-between border-b border-border pb-4 sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                        <h2 className="text-xs font-bold uppercase tracking-widest">Edit Company</h2>
                        <button onClick={() => setEditingId(null)} className="text-gray-500 hover:text-foreground">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Company Name</label>
                          <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Address</label>
                          <textarea
                            value={editForm.address}
                            onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                            className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground min-h-[80px]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Phone</label>
                            <input
                              type="text"
                              value={editForm.phone}
                              onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                              className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Email</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                              className="w-full bg-background border border-border text-foreground p-2 text-sm outline-none focus:border-foreground"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Company Logo</label>
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 border border-dashed border-border flex items-center justify-center bg-background overflow-hidden">
                                {editForm.logo_url ? (
                                  <img src={editForm.logo_url} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                ) : (
                                  <Building2 className="w-5 h-5 text-gray-400 opacity-20" />
                                )}
                              </div>
                              <label className="flex-1 cursor-pointer bg-foreground/5 border border-border hover:bg-foreground/10 transition-all p-2 text-center">
                                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground">Change Logo</span>
                                <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, true)} className="hidden" />
                              </label>
                            </div>
                            <div className="mt-2">
                              <input 
                                type="text"
                                value={editForm.logo_url.startsWith('data:') ? '' : editForm.logo_url}
                                onChange={(e) => setEditForm(prev => ({ ...prev, logo_url: e.target.value }))}
                                placeholder="Or enter Logo URL"
                                className="w-full bg-background border border-border text-foreground p-2 text-[10px] outline-none focus:border-foreground"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button
                            type="submit"
                            disabled={!!switching}
                            className="flex-1 bg-foreground text-background py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                          >
                            {switching === editingId ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            Save Changes
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex-1 border border-border text-foreground py-2 text-[10px] uppercase font-bold tracking-widest hover:bg-foreground/5 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
                {companies.length === 0 && (
                  <div className="text-center py-10 border border-dashed border-border text-gray-500 text-[10px] uppercase tracking-widest">
                    No other companies found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
