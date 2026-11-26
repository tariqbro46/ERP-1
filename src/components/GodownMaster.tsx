import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, MapPin, User, Phone } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useNotification } from '../contexts/NotificationContext';
import { EnterpriseModal } from './ui/EnterpriseModal';
import { SkeletonLoader } from './SkeletonLoader';

import { useSubscription } from '../hooks/useSubscription';

export function GodownMaster() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { checkLimit } = useSubscription();
  const [godowns, setGodowns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGodown, setEditingGodown] = useState<any>(null);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [description, setDescription] = useState('');
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setEditingGodown(null);
      setName('');
      setLocation('');
      setContactPerson('');
      setPhoneNumber('');
      setDescription('');
      setIsModalOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchGodowns();
  }, [user?.companyId]);

  async function fetchGodowns() {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getGodowns(user.companyId);
      setGodowns(data);
    } catch (err: any) {
      console.error('Error fetching godowns:', err);
      showNotification(err.message || 'Failed to load godowns', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !user?.companyId) return;
    
    setLoading(true);
    try {
      if (!editingGodown) {
        const count = await erpService.getCollectionCount('godowns', user.companyId);
        if (!checkLimit('godowns', count)) {
          setLoading(false);
          return;
        }
      }

      if (editingGodown) {
        await erpService.updateGodown(editingGodown.id, { 
          name, 
          location, 
          contact_person: contactPerson, 
          phone_number: phoneNumber, 
          description 
        });
      } else {
        await erpService.createGodown(user!.companyId, { 
          name, 
          location, 
          contact_person: contactPerson, 
          phone_number: phoneNumber, 
          description 
        });
      }
      showNotification(editingGodown ? t('godown.updateSuccess') : t('godown.saveSuccess'));
      setIsModalOpen(false);
      setName('');
      setLocation('');
      setContactPerson('');
      setPhoneNumber('');
      setDescription('');
      setEditingGodown(null);
      fetchGodowns();
    } catch (err: any) {
      console.error('Error saving godown:', err);
      showNotification(err.message || 'Failed to save godown', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('godown.deleteConfirm'))) return;
    
    setLoading(true);
    try {
      await erpService.deleteGodown(id);
      showNotification(t('godown.deleteSuccess'));
      fetchGodowns();
    } catch (err: any) {
      console.error('Error deleting godown:', err);
      showNotification(err.message || 'Failed to delete godown', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-4 gap-4">
          <h1 className="text-xl lg:text-2xl font-bold text-foreground uppercase tracking-tight">{t('godown.title')}</h1>
          <button 
            onClick={() => {
              setEditingGodown(null);
              setName('');
              setLocation('');
              setContactPerson('');
              setPhoneNumber('');
              setDescription('');
              setIsModalOpen(true);
            }}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> {t('godown.add')}
          </button>
        </div>

        {loading && godowns.length === 0 ? (
          <SkeletonLoader type="cards" pageKey="inventory" isFullPage={false} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {godowns.map((g) => (
              <div key={g.id} className="bg-card border border-border rounded-xl p-4 flex justify-between items-start hover:border-primary/40 transition-colors group shadow-[var(--shadow-surface)]">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">{g.name}</h3>
                    {g.location && (
                      <p className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-2 h-2" /> {g.location}
                      </p>
                    )}
                    <div className="flex gap-3 mt-2">
                      {g.contact_person && (
                        <p className="text-[9px] text-gray-400 flex items-center gap-1">
                          <User className="w-2 h-2" /> {g.contact_person}
                        </p>
                      )}
                      {g.phone_number && (
                        <p className="text-[9px] text-gray-400 flex items-center gap-1">
                          <Phone className="w-2 h-2" /> {g.phone_number}
                        </p>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 italic">{g.description || 'No description provided'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setEditingGodown(g);
                      setName(g.name);
                      setLocation(g.location || '');
                      setContactPerson(g.contact_person || '');
                      setPhoneNumber(g.phone_number || '');
                      setDescription(g.description || '');
                      setIsModalOpen(true);
                    }}
                    className="p-1.5 text-gray-400 hover:text-foreground transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button 
                    onClick={() => handleDelete(g.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {godowns.length === 0 && (
              <div className="col-span-full py-20 text-center border border-dashed border-border text-gray-500 uppercase text-[10px] tracking-widest">
                {t('godown.noGodowns')}
              </div>
            )}
          </div>
        )}
      </div>

      <EnterpriseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingGodown ? t('godown.edit') : t('godown.add')}
        icon={<MapPin className="w-4 h-4" />}
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
              form="godown-form"
              disabled={loading || !name}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editingGodown ? t('common.update') : t('common.save')}
            </button>
          </div>
        }
      >
        <form id="godown-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('godown.name')}</label>
            <input 
              autoFocus
              type="text" 
              value={name || ''}
              onChange={e => setName(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              placeholder="e.g. Main Warehouse"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('godown.location')}</label>
            <input 
              type="text" 
              value={location || ''}
              onChange={e => setLocation(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
              placeholder="e.g. Industrial Area, Block A"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('godown.contactPerson')}</label>
              <input 
                type="text" 
                value={contactPerson || ''}
                onChange={e => setContactPerson(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"
                placeholder="Name"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('godown.phoneNumber')}</label>
              <input 
                type="text" 
                value={phoneNumber || ''}
                onChange={e => setPhoneNumber(e.target.value)}
                className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors tabular-nums"
                placeholder="Phone"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">{t('godown.description')}</label>
            <textarea 
              value={description || ''}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-background border border-border rounded-lg text-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors h-24 resize-none"
              placeholder="Enter godown details..."
            />
          </div>
        </form>
      </EnterpriseModal>
    </div>
  );
}
