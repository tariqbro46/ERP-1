import React, { useState, useEffect } from 'react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { 
  Cpu, 
  Plus, 
  Settings, 
  Trash2, 
  Edit2, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  Wrench,
  Activity,
  MapPin,
  User,
  Users,
  ChevronRight
} from 'lucide-react';
import { PrintingMachine, Employee } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { SearchableSelect } from './SearchableSelect';

export function MachineManagement() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const [machines, setMachines] = useState<PrintingMachine[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<PrintingMachine | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  
  const [formData, setFormData] = useState<Partial<PrintingMachine>>({
    name: '',
    type: 'Both',
    status: 'Idle',
    location: '',
    inChargeId: '',
    inChargeName: '',
    operatorId: '',
    operatorName: '',
    assistantOperatorId: '',
    assistantOperatorName: '',
    laborerIds: [],
    laborerNames: [],
    lastMaintenance: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchData();
    }
  }, [user?.companyId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [machinesData, employeesData] = await Promise.all([
        erpService.getMachines(user!.companyId),
        erpService.getEmployees(user!.companyId)
      ]);
      setMachines(machinesData);
      setEmployees(employeesData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId) return;

    try {
      if (editingMachine) {
        await erpService.updateMachine(editingMachine.id, formData);
        showNotification('Machine updated successfully');
      } else {
        await erpService.createMachine({
          ...formData,
          companyId: user.companyId
        });
        showNotification('Machine added successfully');
      }
      setIsModalOpen(false);
      setEditingMachine(null);
      setFormData({
        name: '',
        type: 'Both',
        status: 'Idle',
        location: '',
        inChargeId: '',
        inChargeName: '',
        operatorId: '',
        operatorName: '',
        assistantOperatorId: '',
        assistantOperatorName: '',
        laborerIds: [],
        laborerNames: [],
        lastMaintenance: new Date().toISOString().split('T')[0]
      });
      fetchData();
    } catch (err) {
      showNotification('Failed to save machine', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    try {
      await erpService.deleteMachine(id);
      showNotification('Machine removed');
      fetchData();
    } catch (err) {
      showNotification('Failed to remove machine', 'error');
    }
  };

  const handleEmployeeClick = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setSelectedEmployee(emp);
    }
  };

  return (
    <div className="p-4 lg:p-8 bg-background min-h-screen font-mono">
      <div className="flex items-center justify-between gap-6 mb-12 border-b border-border pb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary mb-1">
            <Cpu className="w-5 h-5" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Hardware Assets</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-tighter text-foreground uppercase">Machine Management</h1>
        </div>
        
        <button 
          onClick={() => {
            setEditingMachine(null);
            setFormData({ 
              name: '', 
              type: 'Both', 
              status: 'Idle', 
              location: '',
              inChargeId: '',
              inChargeName: '',
              operatorId: '',
              operatorName: '',
              assistantOperatorId: '',
              assistantOperatorName: '',
              laborerIds: [],
              laborerNames: [],
              lastMaintenance: new Date().toISOString().split('T')[0] 
            });
            setIsModalOpen(true);
          }}
          className="px-4 md:px-6 py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Machine
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Cpu className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
          {machines.map(machine => (
            <div key={machine.id} className="bg-card border border-border p-3 md:p-6 space-y-3 md:space-y-6 relative overflow-hidden group">
              <div className={cn(
                "absolute top-0 left-0 w-full h-1",
                machine.status === 'Idle' ? "bg-emerald-500" : machine.status === 'Busy' ? "bg-blue-500" : "bg-rose-500"
              )} />
              
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 md:space-y-1">
                  <h3 className="text-sm md:text-lg font-bold text-foreground uppercase tracking-tight truncate max-w-[100px] md:max-w-none">{machine.name}</h3>
                  <div className="flex items-center gap-1 md:gap-2 text-[8px] md:text-[10px] text-muted-foreground uppercase tracking-widest truncate">
                    <MapPin className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    {machine.location || 'N/A'}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingMachine(machine); setFormData(machine); setIsModalOpen(true); }} className="p-1 hover:bg-foreground/5 text-muted-foreground hover:text-foreground"><Edit2 className="w-3 h-3" /></button>
                  <button onClick={() => handleDelete(machine.id)} className="p-1 hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-4">
                <div className="flex items-center justify-between p-1.5 md:p-3 bg-muted/30 border border-border">
                  <div className="flex items-center gap-1 md:gap-2">
                    <Activity className={cn("w-2.5 h-2.5 md:w-3 md:h-3", machine.status === 'Busy' ? "text-blue-500 animate-pulse" : "text-muted-foreground")} />
                    <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Status</span>
                  </div>
                  <span className={cn(
                    "text-[8px] md:text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                    machine.status === 'Idle' ? "text-emerald-500 bg-emerald-500/10" : 
                    machine.status === 'Busy' ? "text-blue-500 bg-blue-500/10" : 
                    "text-rose-500 bg-rose-500/10"
                  )}>
                    {machine.status}
                  </span>
                </div>

                {/* Personnel Info */}
                <div className="space-y-2 p-3 border border-border bg-muted/10">
                  <div className="flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border pb-1 mb-2">
                    <span>Personnel</span>
                    <Users className="w-3 h-3" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <p className="text-[8px] text-muted-foreground uppercase">In-Charge</p>
                      <button 
                        onClick={() => machine.inChargeId && handleEmployeeClick(machine.inChargeId)}
                        className="text-[10px] font-bold text-foreground hover:text-primary transition-colors text-left truncate w-full"
                      >
                        {machine.inChargeName || 'N/A'}
                      </button>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[8px] text-muted-foreground uppercase">Operator</p>
                      <button 
                        onClick={() => machine.operatorId && handleEmployeeClick(machine.operatorId)}
                        className="text-[10px] font-bold text-foreground hover:text-primary transition-colors text-left truncate w-full"
                      >
                        {machine.operatorName || 'N/A'}
                      </button>
                    </div>
                  </div>
                </div>

                {machine.status === 'Busy' && (
                  <div className="p-3 border border-blue-500/20 bg-blue-500/5 space-y-1">
                    <p className="text-[8px] text-blue-500 uppercase font-bold tracking-widest">Current Job</p>
                    <p className="text-[10px] font-bold text-foreground uppercase truncate">{machine.currentOrderName || 'Processing...'}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Wrench className="w-3 h-3" />
                  <span>LAST MAINTENANCE: {machine.lastMaintenance || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
          {machines.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-border bg-muted/10">
              <Cpu className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">No machines registered in the system.</p>
            </div>
          )}
        </div>
      )}

      {/* Machine Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <h2 className="text-sm font-bold uppercase tracking-widest">
                  {editingMachine ? 'Edit Machine' : 'Add New Machine'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Machine Name *</label>
                    <input 
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-background border border-border p-2 text-xs uppercase tracking-widest outline-none focus:border-primary"
                      placeholder="E.G. MACHINE-01"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Location (Room/Godown/Factory)</label>
                    <input 
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full bg-background border border-border p-2 text-xs uppercase tracking-widest outline-none focus:border-primary"
                      placeholder="E.G. ROOM 01, FACTORY A"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Machine Type</label>
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-background border border-border p-2 text-xs uppercase tracking-widest outline-none focus:border-primary"
                    >
                      <option value="Analog">ANALOG ONLY</option>
                      <option value="Digital">DIGITAL ONLY</option>
                      <option value="Both">HYBRID / BOTH</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Initial Status</label>
                    <select 
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-background border border-border p-2 text-xs uppercase tracking-widest outline-none focus:border-primary"
                    >
                      <option value="Idle">IDLE</option>
                      <option value="Maintenance">MAINTENANCE</option>
                    </select>
                  </div>

                  {/* Personnel Selection */}
                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">In-Charge</label>
                    <SearchableSelect
                      options={employees.map(e => ({ id: e.id, name: e.name }))}
                      value={formData.inChargeId || ''}
                      onChange={(val) => {
                        const emp = employees.find(e => e.id === val);
                        setFormData({ ...formData, inChargeId: val, inChargeName: emp?.name || '' });
                      }}
                      placeholder="SELECT IN-CHARGE..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Operator</label>
                    <SearchableSelect
                      options={employees.map(e => ({ id: e.id, name: e.name }))}
                      value={formData.operatorId || ''}
                      onChange={(val) => {
                        const emp = employees.find(e => e.id === val);
                        setFormData({ ...formData, operatorId: val, operatorName: emp?.name || '' });
                      }}
                      placeholder="SELECT OPERATOR..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Assistant Operator</label>
                    <SearchableSelect
                      options={employees.map(e => ({ id: e.id, name: e.name }))}
                      value={formData.assistantOperatorId || ''}
                      onChange={(val) => {
                        const emp = employees.find(e => e.id === val);
                        setFormData({ ...formData, assistantOperatorId: val, assistantOperatorName: emp?.name || '' });
                      }}
                      placeholder="SELECT ASSISTANT..."
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">Last Maintenance Date</label>
                    <input 
                      type="date"
                      value={formData.lastMaintenance}
                      onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                      className="w-full bg-background border border-border p-2 text-xs outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/5 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
                  >
                    {editingMachine ? 'Update' : 'Register'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Employee Profile Modal */}
      <AnimatePresence>
        {selectedEmployee && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-card border border-border w-full max-w-md p-8 space-y-6 relative"
            >
              <button 
                onClick={() => setSelectedEmployee(null)}
                className="absolute top-4 right-4 p-2 hover:bg-foreground/5 rounded-full"
              >
                <Plus className="w-5 h-5 rotate-45" />
              </button>

              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tighter">{selectedEmployee.name}</h2>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{selectedEmployee.designation}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Employee ID</p>
                    <p className="text-xs font-bold uppercase">{selectedEmployee.employeeId || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Department</p>
                    <p className="text-xs font-bold uppercase">{selectedEmployee.department || 'PRODUCTION'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Contact</p>
                    <p className="text-xs font-bold">{selectedEmployee.phone || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[8px] text-muted-foreground uppercase font-bold">Email</p>
                    <p className="text-xs font-bold truncate">{selectedEmployee.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setSelectedEmployee(null)}
                className="w-full py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
              >
                Close Profile
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
