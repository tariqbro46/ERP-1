import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, MapPin, User, Phone } from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';

export function GodownMaster() {
  const { user } = useAuth();
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
    if (!name) return;
    
    setLoading(true);
    try {
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
      showNotification(editingGodown ? 'Godown updated successfully' : 'Godown saved successfully');
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
    if (!window.confirm('Are you sure you want to delete this godown?')) return;
    
    setLoading(true);
    try {
      await erpService.deleteGodown(id);
      showNotification('Godown deleted successfully');
      fetchGodowns();
    } catch (err: any) {
      console.error('Error deleting godown:', err);
      showNotification(err.message || 'Failed to delete godown', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex justify-between items-end border-b border-border pb-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Godown / Location Master</h1>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Manage storage locations</p>
          </div>
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
            className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> Create Godown
          </button>
        </div>

        {loading && godowns.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {godowns.map((g) => (
              <div key={g.id} className="bg-card border border-border p-4 flex justify-between items-start hover:border-foreground/30 transition-colors group">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-foreground/5 rounded">
                    <MapPin className="w-4 h-4 text-gray-500" />
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
                No godowns found. Create your first storage location.
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
                {editingGodown ? 'Edit Godown' : 'Create New Godown'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-foreground">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Godown Name</label>
                <input 
                  autoFocus
                  type="text" 
                  value={name || ''}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  placeholder="e.g. Main Warehouse"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Location</label>
                <input 
                  type="text" 
                  value={location || ''}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  placeholder="e.g. Industrial Area, Block A"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Contact Person</label>
                  <input 
                    type="text" 
                    value={contactPerson || ''}
                    onChange={e => setContactPerson(e.target.value)}
                    className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    placeholder="Name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Phone Number</label>
                  <input 
                    type="text" 
                    value={phoneNumber || ''}
                    onChange={e => setPhoneNumber(e.target.value)}
                    className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    placeholder="Phone"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Description</label>
                <textarea 
                  value={description || ''}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-24 resize-none"
                  placeholder="Enter godown details..."
                />
              </div>
              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading || !name}
                  className="w-full py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Save Godown'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
