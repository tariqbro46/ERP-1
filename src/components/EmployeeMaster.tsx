import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Loader2, User, Phone, Mail, MapPin, Briefcase, Calendar } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';

export function EmployeeMaster() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const { showNotification } = useNotification();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      resetForm();
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    name: '',
    designation: '',
    department: '',
    phone: '',
    email: '',
    bloodGroup: '',
    presentAddress: '',
    permanentAddress: '',
    nidNumber: '',
    drivingLicense: '',
    passportNo: '',
    bankName: '',
    bankBranch: '',
    bankAccountNumber: '',
    bankRoutingNumber: '',
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactPhone: '',
    emergencyContact2Name: '',
    emergencyContact2Relation: '',
    emergencyContact2Phone: '',
    emergencyContact3Name: '',
    emergencyContact3Relation: '',
    emergencyContact3Phone: '',
    joining_date: new Date().toISOString().split('T')[0],
    salary: '',
    status: 'Active'
  });

  useEffect(() => {
    fetchEmployees();
  }, [user?.companyId]);

  async function fetchEmployees() {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const data = await erpService.getEmployees(user.companyId);
      setEmployees(data);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      showNotification(err.message || 'Failed to load employees', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    setLoading(true);
    try {
      if (editingEmployee) {
        await erpService.updateEmployee(editingEmployee.id, formData);
      } else {
        await erpService.createEmployee(user!.companyId, formData);
      }
      showNotification(editingEmployee ? t('employee.updateSuccess') : t('employee.createSuccess'));
      setIsModalOpen(false);
      resetForm();
      fetchEmployees();
    } catch (err: any) {
      console.error('Error saving employee:', err);
      showNotification(err.message || 'Failed to save employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      designation: '',
      department: '',
      phone: '',
      email: '',
      bloodGroup: '',
      presentAddress: '',
      permanentAddress: '',
      nidNumber: '',
      drivingLicense: '',
      passportNo: '',
      bankName: '',
      bankBranch: '',
      bankAccountNumber: '',
      bankRoutingNumber: '',
      emergencyContactName: '',
      emergencyContactRelation: '',
      emergencyContactPhone: '',
      emergencyContact2Name: '',
      emergencyContact2Relation: '',
      emergencyContact2Phone: '',
      emergencyContact3Name: '',
      emergencyContact3Relation: '',
      emergencyContact3Phone: '',
      joining_date: new Date().toISOString().split('T')[0],
      salary: '',
      status: 'Active'
    });
    setEditingEmployee(null);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('employee.deleteConfirm'))) return;
    
    setLoading(true);
    try {
      await erpService.deleteEmployee(id);
      showNotification(t('employee.deleteSuccess'));
      fetchEmployees();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      showNotification(err.message || 'Failed to delete employee', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">{t('employee.title')}</h1>
          <button 
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
          >
            <Plus className="w-3 h-3" /> {t('employee.add')}
          </button>
        </div>

        {loading && employees.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-card border border-border p-4 space-y-4 hover:border-foreground/30 transition-colors group relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-1 h-full ${emp.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-foreground/5 rounded">
                      <User className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground uppercase tracking-tight">{emp.name}</h3>
                      <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{emp.designation}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setEditingEmployee(emp);
                        setFormData({
                          name: emp.name || '',
                          designation: emp.designation || '',
                          department: emp.department || '',
                          phone: emp.phone || '',
                          email: emp.email || '',
                          bloodGroup: emp.bloodGroup || '',
                          presentAddress: emp.presentAddress || '',
                          permanentAddress: emp.permanentAddress || '',
                          nidNumber: emp.nidNumber || '',
                          drivingLicense: emp.drivingLicense || '',
                          passportNo: emp.passportNo || '',
                          bankName: emp.bankName || '',
                          bankBranch: emp.bankBranch || '',
                          bankAccountNumber: emp.bankAccountNumber || '',
                          bankRoutingNumber: emp.bankRoutingNumber || '',
                          emergencyContactName: emp.emergencyContactName || '',
                          emergencyContactRelation: emp.emergencyContactRelation || '',
                          emergencyContactPhone: emp.emergencyContactPhone || '',
                          emergencyContact2Name: emp.emergencyContact2Name || '',
                          emergencyContact2Relation: emp.emergencyContact2Relation || '',
                          emergencyContact2Phone: emp.emergencyContact2Phone || '',
                          emergencyContact3Name: emp.emergencyContact3Name || '',
                          emergencyContact3Relation: emp.emergencyContact3Relation || '',
                          emergencyContact3Phone: emp.emergencyContact3Phone || '',
                          joining_date: emp.joining_date || '',
                          salary: emp.salary || '',
                          status: emp.status || 'Active'
                        });
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-gray-400 hover:text-foreground transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Briefcase className="w-3 h-3" />
                    <span>{emp.department}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Phone className="w-3 h-3" />
                    <span>{emp.phone}</span>
                  </div>
                  {emp.email && (
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{t('employee.joiningDate')}: {emp.joining_date}</span>
                  </div>
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="col-span-full py-20 text-center border border-dashed border-border text-gray-500 uppercase text-[10px] tracking-widest">
                {t('employee.noEmployees')}
              </div>
            )}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-2xl overflow-hidden shadow-2xl my-auto md:my-8">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-foreground/5 sticky top-0 z-10 backdrop-blur-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                {editingEmployee ? t('employee.edit') : t('employee.add')}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-foreground">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('common.basicInfo')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.name')}</label>
                      <input 
                        autoFocus
                        type="text" 
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.designation')}</label>
                      <input 
                        type="text" 
                        value={formData.designation}
                        onChange={e => setFormData({ ...formData, designation: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="e.g. Senior Accountant"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.department')}</label>
                      <input 
                        type="text" 
                        value={formData.department}
                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="e.g. Finance"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.bloodGroup')}</label>
                      <select 
                        value={formData.bloodGroup}
                        onChange={e => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      >
                        <option value="">{t('employee.selectGroup')}</option>
                        {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.phone')}</label>
                      <input 
                        type="text" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="e.g. +880 1XXX XXXXXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('common.email')}</label>
                      <input 
                        type="email" 
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="e.g. john@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.joiningDate')}</label>
                      <input 
                        type="date" 
                        value={formData.joining_date}
                        onChange={e => setFormData({ ...formData, joining_date: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.status')}</label>
                      <select 
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      >
                        <option value="Active">{t('employee.active')}</option>
                        <option value="Inactive">{t('employee.inactive')}</option>
                        <option value="On Leave">{t('employee.onLeave')}</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('employee.identification')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.nidNumber')}</label>
                    <input 
                      type="text" 
                      value={formData.nidNumber}
                      onChange={e => setFormData({ ...formData, nidNumber: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.drivingLicense')}</label>
                    <input 
                      type="text" 
                      value={formData.drivingLicense}
                      onChange={e => setFormData({ ...formData, drivingLicense: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.passportNo')}</label>
                    <input 
                      type="text" 
                      value={formData.passportNo}
                      onChange={e => setFormData({ ...formData, passportNo: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Address Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('employee.addressDetails')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.presentAddress')}</label>
                    <textarea 
                      value={formData.presentAddress}
                      onChange={e => setFormData({ ...formData, presentAddress: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-20 resize-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.permanentAddress')}</label>
                    <textarea 
                      value={formData.permanentAddress}
                      onChange={e => setFormData({ ...formData, permanentAddress: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('employee.bankDetails')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.bankName')}</label>
                    <input 
                      type="text" 
                      value={formData.bankName}
                      onChange={e => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.branchName')}</label>
                    <input 
                      type="text" 
                      value={formData.bankBranch}
                      onChange={e => setFormData({ ...formData, bankBranch: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.bankAccount')}</label>
                    <input 
                      type="text" 
                      value={formData.bankAccountNumber}
                      onChange={e => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.bankRouting')}</label>
                    <input 
                      type="text" 
                      value={formData.bankRoutingNumber}
                      onChange={e => setFormData({ ...formData, bankRoutingNumber: e.target.value })}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('employee.emergencyContact')} 1</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.contactName')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContactName}
                        onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.emergencyRelation')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContactRelation}
                        onChange={e => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.emergencyPhone')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContactPhone}
                        onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('employee.emergencyContact')} 2</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.contactName')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact2Name}
                        onChange={e => setFormData({ ...formData, emergencyContact2Name: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.emergencyRelation')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact2Relation}
                        onChange={e => setFormData({ ...formData, emergencyContact2Relation: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.emergencyPhone')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact2Phone}
                        onChange={e => setFormData({ ...formData, emergencyContact2Phone: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 border-b border-emerald-500/20 pb-1">{t('employee.emergencyContact')} 3</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.contactName')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact3Name}
                        onChange={e => setFormData({ ...formData, emergencyContact3Name: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.emergencyRelation')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact3Relation}
                        onChange={e => setFormData({ ...formData, emergencyContact3Relation: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.emergencyPhone')}</label>
                      <input 
                        type="text" 
                        value={formData.emergencyContact3Phone}
                        onChange={e => setFormData({ ...formData, emergencyContact3Phone: e.target.value })}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{t('employee.salary')}</label>
                <input 
                  type="number" 
                  value={formData.salary}
                  onFocus={e => e.target.value === '0' && e.target.select()}
                  onChange={e => setFormData({ ...formData, salary: e.target.value })}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  placeholder="0.00"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading || !formData.name}
                  className="w-full py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('employee.saveData')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
