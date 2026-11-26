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
import { EnterpriseModal } from './ui/EnterpriseModal';
import { SkeletonLoader } from './SkeletonLoader';

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
    <div className="flex flex-col min-h-full bg-background transition-colors">
      <div className="sticky top-0 z-[40] bg-background p-4 lg:p-8 border-b border-border shadow-sm">
        <div className="flex items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary mb-1">
              <Cpu className="w-5 h-5" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Hardware Assets</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-foreground uppercase">Machine Management</h1>
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
            className="px-4 md:px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Machine
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 lg:p-8">
        {loading ? (
        <SkeletonLoader type="cards" pageKey="payroll" isFullPage={false} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {machines.map(machine => (
            <div key={machine.id} className="bg-card border border-border rounded-xl p-4 md:p-6 space-y-4 md:space-y-5 relative overflow-hidden group shadow-[var(--shadow-surface)]">
              <div className={cn(
                "absolute top-0 left-0 w-full h-1",
                machine.status === 'Idle' ? "bg-emerald-500" : machine.status === 'Busy' ? "bg-blue-500" : "bg-rose-500"
              )} />
              
              <div className="flex justify-between items-start">
                <div className="space-y-0.5 md:space-y-1">
                  <h3 className="text-sm md:text-lg font-bold text-foreground uppercase tracking-tight truncate max-w-[160px] md:max-w-none">{machine.name}</h3>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground uppercase tracking-wider truncate">
                    <MapPin className="w-3 h-3" />
                    {machine.location || 'N/A'}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => { setEditingMachine(machine); setFormData(machine); setIsModalOpen(true); }} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDelete(machine.id)} className="p-1.5 rounded hover:bg-rose-500/10 text-muted-foreground hover:text-rose-500 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>

              <div className="space-y-2 md:space-y-4">
                <div className="flex items-center justify-between p-2 md:p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Activity className={cn("w-3 h-3", machine.status === 'Busy' ? "text-blue-500" : "text-muted-foreground")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Status</span>
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
      <EnterpriseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMachine ? 'Edit Machine' : 'Add New Machine'}
        icon={<Cpu className="w-4 h-4" />}
        size="xl"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <button 
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2 rounded-lg border border-border text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              form="machine-form"
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer"
            >
              {editingMachine ? 'Update' : 'Register'}
            </button>
          </div>
        }
      >
        <form id="machine-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Machine Name *</label>
              <input 
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="E.G. MACHINE-01"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Location (Room/Godown/Factory)</label>
              <input 
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                placeholder="E.G. ROOM 01, FACTORY A"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Machine Type</label>
              <select 
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="Analog">ANALOG ONLY</option>
                <option value="Digital">DIGITAL ONLY</option>
                <option value="Both">HYBRID / BOTH</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Initial Status</label>
              <select 
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs uppercase tracking-wider outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              >
                <option value="Idle">IDLE</option>
                <option value="Maintenance">MAINTENANCE</option>
              </select>
            </div>

            {/* Personnel Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">In-Charge</label>
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

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Operator</label>
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

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Assistant Operator</label>
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

            <div className="space-y-1.5">
              <label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Last Maintenance Date</label>
              <input 
                type="date"
                value={formData.lastMaintenance}
                onChange={(e) => setFormData({ ...formData, lastMaintenance: e.target.value })}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 tabular-nums"
              />
            </div>
          </div>
        </form>
      </EnterpriseModal>

      {/* Employee Profile Modal */}
      <EnterpriseModal
        isOpen={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployee(null)}
        title={selectedEmployee?.name || 'Employee Profile'}
        subtitle={selectedEmployee?.designation}
        icon={<User className="w-4 h-4" />}
        size="md"
        footer={
          <div className="flex justify-end w-full">
            <button 
              type="button"
              onClick={() => setSelectedEmployee(null)}
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:bg-primary/90 transition-all cursor-pointer"
            >
              Close Profile
            </button>
          </div>
        }
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center border-2 border-primary/20">
                <User className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold uppercase tracking-tight">{selectedEmployee.name}</h2>
                <p className="text-xs text-primary font-bold uppercase tracking-wider">{selectedEmployee.designation}</p>
              </div>
            </div>

            <div className="space-y-4 border-t border-border pt-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Employee ID</p>
                  <p className="text-xs font-bold uppercase tabular-nums">{selectedEmployee.employeeId || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Department</p>
                  <p className="text-xs font-bold uppercase">{selectedEmployee.department || 'PRODUCTION'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Contact</p>
                  <p className="text-xs font-bold tabular-nums">{selectedEmployee.phone || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold">Email</p>
                  <p className="text-xs font-bold truncate">{selectedEmployee.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </EnterpriseModal>
      </div>
    </div>
  );
}
