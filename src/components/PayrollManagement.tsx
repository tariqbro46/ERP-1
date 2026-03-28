import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Loader2, 
  DollarSign, 
  Calendar, 
  User, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  CheckCircle,
  Clock,
  ArrowRight,
  Printer,
  MessageSquare,
  Mail,
  Table as TableIcon,
  LayoutGrid
} from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

type Tab = 'salary' | 'advance' | 'loan' | 'bulk';

export function PayrollManagement() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const settings = useSettings();
  const [activeTab, setActiveTab] = useState<Tab>('salary');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salarySheets, setSalarySheets] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('Pending');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [emiDuration, setEmiDuration] = useState('12');
  
  // Salary specific
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [loanDeduction, setLoanDeduction] = useState(0);

  useEffect(() => {
    if (selectedEmployeeId && activeTab === 'salary') {
      const empAdvances = advances.filter(a => a.employeeId === selectedEmployeeId && a.status === 'Pending');
      const totalAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
      setAdvanceDeduction(totalAdvance);

      const empLoans = loans.filter(l => l.employeeId === selectedEmployeeId && l.status === 'Active');
      const totalLoanEMI = empLoans.reduce((sum, l) => sum + (l.monthlyEMI || 0), 0);
      setLoanDeduction(totalLoanEMI);
    }
  }, [selectedEmployeeId, activeTab, advances, loans]);

  useEffect(() => {
    if (activeTab === 'loan' && amount && interestRate && emiDuration) {
      const P = parseFloat(amount);
      const R = (parseFloat(interestRate) / 100) / 12; // Monthly interest rate
      const N = parseInt(emiDuration);
      
      if (P > 0 && N > 0) {
        if (R > 0) {
          // Standard EMI formula: [P * R * (1+R)^N] / [(1+R)^N - 1]
          const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
          setMonthlyEMI(emi.toFixed(2));
        } else {
          // Zero interest
          setMonthlyEMI((P / N).toFixed(2));
        }
      }
    }
  }, [amount, interestRate, emiDuration, activeTab]);

  useEffect(() => {
    if (user?.companyId) {
      fetchData();
    }
  }, [user?.companyId]);

  async function fetchData() {
    setLoading(true);
    try {
      const [empData, salaryData, advanceData, loanData] = await Promise.all([
        erpService.getEmployees(user!.companyId),
        erpService.getSalarySheets(user!.companyId),
        erpService.getAdvances(user!.companyId),
        erpService.getLoans(user!.companyId)
      ]);
      setEmployees(empData);
      setSalarySheets(salaryData);
      setAdvances(advanceData);
      setLoans(loanData);
    } catch (err: any) {
      console.error('Error fetching payroll data:', err);
      showNotification('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    setLoading(true);
    try {
      const basic = parseFloat(employee.salary) || 0;
      const allow = parseFloat(allowances) || 0;
      const deduct = parseFloat(deductions) || 0;
      const net = basic + allow - deduct - advanceDeduction - loanDeduction;

      const data = {
        employeeId: selectedEmployeeId,
        employeeName: employee.name,
        month,
        basicSalary: basic,
        allowances: allow,
        deductions: deduct,
        advanceDeduction,
        loanDeduction,
        netSalary: net,
        paymentStatus: status
      };

      if (editingItem) {
        await erpService.updateSalarySheet(editingItem.id, data);
      } else {
        await erpService.createSalarySheet(user!.companyId, data);
      }
      
      showNotification('Salary sheet saved successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification('Failed to save salary sheet', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    setLoading(true);
    try {
      const data = {
        employeeId: selectedEmployeeId,
        employeeName: employee.name,
        amount: parseFloat(amount) || 0,
        date: format(new Date(), 'yyyy-MM-dd'),
        reason,
        status: status
      };

      if (editingItem) {
        await erpService.updateAdvance(editingItem.id, data);
      } else {
        await erpService.createAdvance(user!.companyId, data);
      }
      
      showNotification('Advance saved successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification('Failed to save advance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    setLoading(true);
    try {
      const loanAmount = parseFloat(amount) || 0;
      const emiAmount = parseFloat(monthlyEMI) || 0;
      const rate = parseFloat(interestRate) || 0;
      const duration = parseInt(emiDuration) || 12;
      const data = {
        employeeId: selectedEmployeeId,
        employeeName: employee.name,
        amount: loanAmount,
        monthlyEMI: emiAmount,
        interestRate: rate,
        emiDuration: duration,
        date: format(new Date(), 'yyyy-MM-dd'),
        remainingBalance: editingItem ? editingItem.remainingBalance : loanAmount,
        status: status
      };

      if (editingItem) {
        await erpService.updateLoan(editingItem.id, data);
      } else {
        await erpService.createLoan(user!.companyId, data);
      }
      
      showNotification('Loan saved successfully');
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      showNotification('Failed to save loan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: Tab) => {
    setLoading(true);
    try {
      if (type === 'salary') await erpService.deleteSalarySheet(id);
      if (type === 'advance') await erpService.deleteAdvance(id);
      if (type === 'loan') await erpService.deleteLoan(id);
      showNotification('Entry deleted successfully');
      fetchData();
    } catch (err: any) {
      showNotification('Failed to delete entry', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: any, type: Tab) => {
    setEditingItem(item);
    setSelectedEmployeeId(item.employeeId);
    if (type === 'salary') {
      setMonth(item.month || format(new Date(), 'yyyy-MM'));
      setAllowances(item.allowances?.toString() || '0');
      setDeductions(item.deductions?.toString() || '0');
      setStatus(item.paymentStatus || 'Pending');
    } else if (type === 'advance') {
      setAmount(item.amount?.toString() || '0');
      setReason(item.reason || '');
      setStatus(item.status || 'Pending');
    } else if (type === 'loan') {
      setAmount(item.amount?.toString() || '0');
      setMonthlyEMI(item.monthlyEMI?.toString() || '0');
      setInterestRate(item.interestRate?.toString() || '0');
      setEmiDuration(item.emiDuration?.toString() || '12');
      setStatus(item.status || 'Active');
    }
    setIsModalOpen(true);
  };

  const handlePrint = (s: any) => {
    const printContent = `
      <div style="font-family: monospace; padding: 20px; border: 1px solid #000;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; text-transform: uppercase;">${settings?.companyName || 'COMPANY NAME'}</h1>
          <p style="margin: 5px 0; font-size: 12px;">${settings?.companyAddress || 'Company Address'}</p>
          <p style="margin: 5px 0; font-size: 12px;">Phone: ${settings?.printPhone || ''} | Email: ${settings?.printEmail || ''}</p>
        </div>
        <h2 style="text-align: center; text-transform: uppercase; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 10px 0;">Salary Slip - ${s.month}</h2>
        <div style="margin: 20px 0;">
          <p><strong>Employee:</strong> ${s.employeeName}</p>
          <p><strong>Employee ID:</strong> ${s.employeeId}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr style="border-bottom: 1px dashed #ccc;"><td style="padding: 8px 0;">Basic Salary:</td><td style="text-align: right; padding: 8px 0;">৳${s.basicSalary}</td></tr>
          <tr style="border-bottom: 1px dashed #ccc;"><td style="padding: 8px 0;">Allowances:</td><td style="text-align: right; padding: 8px 0;">৳${s.allowances}</td></tr>
          <tr style="border-bottom: 1px dashed #ccc;"><td style="padding: 8px 0;">Deductions:</td><td style="text-align: right; padding: 8px 0;">-৳${s.deductions}</td></tr>
          <tr style="border-bottom: 1px dashed #ccc;"><td style="padding: 8px 0;">Advance Deduction:</td><td style="text-align: right; padding: 8px 0;">-৳${s.advanceDeduction}</td></tr>
          <tr style="border-bottom: 1px dashed #ccc;"><td style="padding: 8px 0;">Loan EMI:</td><td style="text-align: right; padding: 8px 0;">-৳${s.loanDeduction}</td></tr>
          <tr style="border-top: 2px solid #000; font-weight: bold;">
            <td style="padding: 12px 0;">Net Payable:</td><td style="text-align: right; padding: 12px 0;">৳${s.netSalary}</td>
          </tr>
        </table>
        <div style="margin-top: 40px; display: flex; justify-content: space-between;">
          <div style="border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 10px;">Employee Signature</div>
          <div style="border-top: 1px solid #000; width: 150px; text-align: center; padding-top: 5px; font-size: 10px;">Authorized Signature</div>
        </div>
        <p style="text-align: center; font-size: 10px; margin-top: 30px; color: #666;">Status: ${s.paymentStatus} | Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    `;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(`<html><head><title>Salary Slip</title></head><body>${printContent}</body></html>`);
      win.document.close();
      win.print();
    }
  };

  const handleWhatsApp = (s: any) => {
    const text = `Salary Slip for ${s.month}\nEmployee: ${s.employeeName}\nNet Payable: ৳${s.netSalary}\nStatus: ${s.paymentStatus}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmail = (s: any) => {
    const subject = `Salary Slip - ${s.month}`;
    const body = `Employee: ${s.employeeName}\nNet Payable: ৳${s.netSalary}\nStatus: ${s.paymentStatus}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Payroll Management</h1>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">Manage Salaries, Advances, and Loans</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab(activeTab === 'bulk' ? 'salary' : 'bulk')}
              className={cn(
                "px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 border border-border",
                activeTab === 'bulk' ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-foreground/5"
              )}
            >
              {activeTab === 'bulk' ? <LayoutGrid className="w-3 h-3" /> : <TableIcon className="w-3 h-3" />}
              {activeTab === 'bulk' ? 'Card View' : 'Bulk View'}
            </button>
            {activeTab !== 'bulk' && (
              <button 
                onClick={() => {
                  setEditingItem(null);
                  setSelectedEmployeeId('');
                  setAmount('');
                  setReason('');
                  setMonthlyEMI('');
                  setInterestRate('0');
                  setEmiDuration('12');
                  setStatus('Pending');
                  setIsModalOpen(true);
                }}
                className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Plus className="w-3 h-3" />
                Add {activeTab === 'salary' ? 'Salary Sheet' : activeTab === 'advance' ? 'Advance' : 'Loan'}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        {activeTab !== 'bulk' && (
          <div className="flex border-b border-border overflow-x-auto no-scrollbar">
            <button 
              onClick={() => setActiveTab('salary')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                activeTab === 'salary' ? "border-foreground text-foreground" : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              Salary Sheets
            </button>
            <button 
              onClick={() => setActiveTab('advance')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                activeTab === 'advance' ? "border-foreground text-foreground" : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              Advances
            </button>
            <button 
              onClick={() => setActiveTab('loan')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                activeTab === 'loan' ? "border-foreground text-foreground" : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              Loans
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : activeTab === 'bulk' ? (
          <div className="bg-card border border-border overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-foreground/5 border-b border-border">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Employee</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Basic</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Allowances</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Deductions</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Adv/Loan</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Net Payable</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</th>
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {employees.map(emp => {
                  const sheet = salarySheets.find(s => s.employeeId === emp.id && s.month === month);
                  return (
                    <tr key={emp.id} className="hover:bg-foreground/5 transition-colors group">
                      <td className="p-4">
                        <p className="text-xs font-bold uppercase">{emp.name}</p>
                        <p className="text-[9px] text-gray-500 uppercase">{emp.designation}</p>
                      </td>
                      <td className="p-4 text-xs">৳{emp.salary || 0}</td>
                      <td className="p-4 text-xs">৳{sheet?.allowances || 0}</td>
                      <td className="p-4 text-xs">৳{sheet?.deductions || 0}</td>
                      <td className="p-4 text-xs text-rose-500">-৳{(sheet?.advanceDeduction || 0) + (sheet?.loanDeduction || 0)}</td>
                      <td className="p-4 text-xs font-bold text-emerald-500">৳{sheet?.netSalary || 0}</td>
                      <td className="p-4">
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-widest",
                          sheet?.paymentStatus === 'Paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        )}>
                          {sheet?.paymentStatus || 'Not Generated'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {sheet ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handlePrint(sheet)} className="p-1.5 hover:bg-foreground/10 rounded transition-colors" title="Print PDF"><Printer className="w-3 h-3" /></button>
                            <button onClick={() => handleWhatsApp(sheet)} className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-emerald-500" title="WhatsApp"><MessageSquare className="w-3 h-3" /></button>
                            <button onClick={() => handleEmail(sheet)} className="p-1.5 hover:bg-foreground/10 rounded transition-colors text-blue-500" title="Email"><Mail className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => {
                              setSelectedEmployeeId(emp.id);
                              setEditingItem(null);
                              setIsModalOpen(true);
                            }}
                            className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline"
                          >
                            Generate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeTab === 'salary' && salarySheets.map((s) => (
              <div key={s.id} className="bg-card border border-border p-4 space-y-3 hover:border-foreground transition-colors group relative">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{s.employeeName}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{s.month}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-widest",
                      s.paymentStatus === 'Paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {s.paymentStatus}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(s, 'salary')} className="p-1 hover:bg-foreground/10 rounded"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(s.id, 'salary')} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Basic</p>
                    <p className="text-xs font-bold">৳{s.basicSalary}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Net Salary</p>
                    <p className="text-xs font-bold text-emerald-500">৳{s.netSalary}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-border">
                  <button onClick={() => handlePrint(s)} className="flex-1 py-1.5 bg-foreground/5 hover:bg-foreground/10 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Printer className="w-3 h-3" /> Print</button>
                  <button onClick={() => handleWhatsApp(s)} className="flex-1 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><MessageSquare className="w-3 h-3" /> WA</button>
                </div>
              </div>
            ))}

            {activeTab === 'advance' && advances.map((a) => (
              <div key={a.id} className="bg-card border border-border p-4 space-y-3 hover:border-foreground transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{a.employeeName}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">{a.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-widest",
                      a.status === 'Deducted' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {a.status}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(a, 'advance')} className="p-1 hover:bg-foreground/10 rounded"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(a.id, 'advance')} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-border">
                  <p className="text-[8px] text-gray-500 uppercase tracking-widest">Amount</p>
                  <p className="text-lg font-bold text-rose-500">৳{a.amount}</p>
                  {a.reason && <p className="text-[10px] text-gray-400 mt-1 italic">"{a.reason}"</p>}
                </div>
              </div>
            ))}

            {activeTab === 'loan' && loans.map((l) => (
              <div key={l.id} className="bg-card border border-border p-4 space-y-3 hover:border-foreground transition-colors group">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tight text-foreground">{l.employeeName}</h3>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Started: {l.date}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={cn(
                      "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full tracking-widest",
                      l.status === 'Closed' ? "bg-emerald-500/10 text-emerald-500" : "bg-blue-500/10 text-blue-500"
                    )}>
                      {l.status}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleEdit(l, 'loan')} className="p-1 hover:bg-foreground/10 rounded"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => handleDelete(l.id, 'loan')} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Amount</p>
                    <p className="text-xs font-bold">৳{l.amount}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">EMI</p>
                    <p className="text-xs font-bold text-rose-500">৳{l.monthlyEMI}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Duration</p>
                    <p className="text-xs font-bold">{l.emiDuration || 0} Mo</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Interest Rate</p>
                    <p className="text-xs font-bold">{l.interestRate || 0}%</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase tracking-widest">Balance</p>
                    <p className="text-xs font-bold text-rose-500">৳{l.remainingBalance}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-start md:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border w-full max-w-md overflow-hidden shadow-2xl my-auto md:my-8">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-foreground/5 sticky top-0 z-10 backdrop-blur-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
                {editingItem ? 'Edit' : 'Create New'} {activeTab === 'salary' || activeTab === 'bulk' ? 'Salary Sheet' : activeTab === 'advance' ? 'Advance' : 'Loan'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-foreground">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={activeTab === 'salary' || activeTab === 'bulk' ? handleSalarySubmit : activeTab === 'advance' ? handleAdvanceSubmit : handleLoanSubmit} 
              className="p-6 space-y-4"
            >
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Select Employee</label>
                <select 
                  value={selectedEmployeeId}
                  onChange={e => setSelectedEmployeeId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.designation})</option>
                  ))}
                </select>
              </div>

              {(activeTab === 'salary' || activeTab === 'bulk') && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Month</label>
                    <input 
                      type="month" 
                      value={month}
                      onChange={e => setMonth(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Allowances (৳)</label>
                      <input 
                        type="number" 
                        value={allowances}
                        onChange={e => setAllowances(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Deductions (৳)</label>
                      <input 
                        type="number" 
                        value={deductions}
                        onChange={e => setDeductions(e.target.value)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Payment Status</label>
                    <select 
                      value={status}
                      onChange={e => setStatus(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                  {selectedEmployeeId && (
                    <div className="bg-foreground/5 p-4 space-y-2 border border-border">
                      <div className="flex justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-gray-500">Basic Salary</span>
                        <span className="font-bold">৳{employees.find(e => e.id === selectedEmployeeId)?.salary || 0}</span>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-gray-500">Advance Deduction</span>
                        <span className="font-bold text-rose-500">-৳{advanceDeduction}</span>
                      </div>
                      <div className="flex justify-between text-[10px] uppercase tracking-widest">
                        <span className="text-gray-500">Loan EMI</span>
                        <span className="font-bold text-rose-500">-৳{loanDeduction}</span>
                      </div>
                      <div className="pt-2 border-t border-border flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span>Net Payable</span>
                        <span className="text-emerald-500">
                          ৳{(parseFloat(employees.find(e => e.id === selectedEmployeeId)?.salary || '0')) + (parseFloat(allowances) || 0) - (parseFloat(deductions) || 0) - advanceDeduction - loanDeduction}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(activeTab === 'advance' || activeTab === 'loan') && (
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Amount (৳)</label>
                  <input 
                    type="number" 
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    placeholder="0.00"
                    required
                  />
                </div>
              )}

              {activeTab === 'loan' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">EMI Duration (Months)</label>
                    <select 
                      value={emiDuration}
                      onChange={e => setEmiDuration(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      required
                    >
                      <option value="6">6 Months</option>
                      <option value="12">12 Months</option>
                      <option value="18">18 Months</option>
                      <option value="24">24 Months</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Interest Rate (%)</label>
                    <input 
                      type="number" 
                      value={interestRate}
                      onChange={e => setInterestRate(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      placeholder="0"
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Monthly EMI (৳) - Auto Calculated</label>
                    <input 
                      type="number" 
                      value={monthlyEMI}
                      readOnly
                      className="w-full bg-foreground/5 border border-border text-foreground p-3 text-sm outline-none cursor-not-allowed"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}

              {(activeTab === 'advance' || activeTab === 'loan') && (
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Status</label>
                  <select 
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                  >
                    {activeTab === 'advance' ? (
                      <>
                        <option value="Pending">Pending</option>
                        <option value="Deducted">Deducted</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    ) : (
                      <>
                        <option value="Active">Active</option>
                        <option value="Closed">Closed</option>
                        <option value="Cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {activeTab === 'advance' && (
                <div className="space-y-2">
                  <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Reason</label>
                  <textarea 
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors h-20 resize-none"
                    placeholder="Enter reason for advance..."
                  />
                </div>
              )}

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={loading || !selectedEmployeeId}
                  className="w-full py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Save ${activeTab === 'salary' || activeTab === 'bulk' ? 'Salary Sheet' : activeTab === 'advance' ? 'Advance' : 'Loan'}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
