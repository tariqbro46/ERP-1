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
  LayoutGrid,
  Check,
  X,
  Settings as SettingsIcon,
  Fingerprint,
  Gift,
  RotateCcw
} from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, differenceInDays } from 'date-fns';

type Tab = 'salary' | 'advance' | 'loan' | 'bulk' | 'attendance' | 'payheads' | 'bonus';

export function PayrollManagement() {
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const settings = useSettings();
  const { baseCurrencySymbol = '৳' } = settings;
  const [activeTab, setActiveTab] = useState<Tab>('salary');
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salarySheets, setSalarySheets] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [payHeads, setPayHeads] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);
  
  const [bonusType, setBonusType] = useState('Eid-ul-Fitr');
  const [bonusCalculationBasis, setBonusCalculationBasis] = useState<'Full' | 'Half' | 'Pro-rata'>('Full');
  const [bonusAppliedDate, setBonusAppliedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const [editingItem, setEditingItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDate, setActiveDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Form states
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'));
  
  // Pay Head form
  const [payHeadName, setPayHeadName] = useState('');
  const [payHeadType, setPayHeadType] = useState<'Earning' | 'Deduction'>('Earning');
  const [payHeadCalc, setPayHeadCalc] = useState<'Fixed' | 'On Attendance' | 'Percentage'>('Fixed');
  
  // Salary Structure form
  const [structureAmount, setStructureAmount] = useState('');
  const [selectedPayHeadId, setSelectedPayHeadId] = useState('');

  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState('Pending');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [interestRate, setInterestRate] = useState('0');
  const [emiDuration, setEmiDuration] = useState('12');
  const [applicationDate, setApplicationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [approvalDate, setApprovalDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  // Salary specific
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');
  const [advanceDeduction, setAdvanceDeduction] = useState(0);
  const [loanDeduction, setLoanDeduction] = useState(0);

  useEffect(() => {
    if (selectedEmployeeId && (activeTab === 'salary' || activeTab === 'bulk')) {
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
      const [empData, salaryData, advanceData, loanData, attendanceData, payHeadsData, structureData] = await Promise.all([
        erpService.getEmployees(user!.companyId),
        erpService.getSalarySheets(user!.companyId),
        erpService.getAdvances(user!.companyId),
        erpService.getLoans(user!.companyId),
        erpService.getAttendance(user!.companyId),
        erpService.getPayHeads(user!.companyId),
        erpService.getSalaryStructures(user!.companyId)
      ]);
      setEmployees(empData);
      setSalarySheets(salaryData);
      setAdvances(advanceData);
      setLoans(loanData);
      setAttendance(attendanceData);
      setPayHeads(payHeadsData);
      setSalaryStructures(structureData);
    } catch (err: any) {
      console.error('Error fetching payroll data:', err);
      showNotification('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }

  const handleAttendanceSubmit = async (employeeId: string, status: any) => {
    setLoading(true);
    try {
      const existing = attendance.find(a => a.employeeId === employeeId && a.date === activeDate);
      
      if (status === 'Clear' && existing) {
        await erpService.deleteAttendance(existing.id);
        showNotification('Attendance cleared');
      } else if (status !== 'Clear') {
        const employee = employees.find(e => e.id === employeeId);
        const data = {
          employeeId,
          employeeName: employee?.name || 'Unknown',
          date: activeDate,
          status,
          overtimeHours: 0
        };

        if (existing) {
          await erpService.updateAttendance(existing.id, data);
        } else {
          await erpService.createAttendance(user!.companyId, data);
        }
      }
      fetchData();
    } catch (err) {
      showNotification('Failed to update attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateBonus = (emp: any, festivalDate: string, basis: string) => {
    const salary = parseFloat(emp.salary || emp.basicSalary || '0');
    const joiningDate = new Date(emp.joiningDate);
    const targetDate = new Date(festivalDate);
    
    // Total days served up to festival
    const daysServed = differenceInDays(targetDate, joiningDate);
    
    let baseBonus = salary; // Default is full salary
    if (basis === 'Half') baseBonus = salary / 2;

    if (daysServed >= 365) {
      return baseBonus;
    } else if (daysServed > 0) {
      // Pro-rata: (Bonus/2) * (Tenure/365) as per user's specific request
      // Note: User mentioned (total bonus/2 eid * tenure) - assuming they mean half of yearly bonus pool
      const proRataAmount = (baseBonus) * (daysServed / 365);
      return parseFloat(proRataAmount.toFixed(2));
    }
    return 0;
  };

  const generateBonuses = async () => {
    setLoading(true);
    try {
      const batch = employees.map(emp => {
        const bonusAmount = calculateBonus(emp, bonusAppliedDate, bonusCalculationBasis);
        if (bonusAmount <= 0) return null;

        return {
          companyId: user!.companyId,
          employeeId: emp.id,
          employeeName: emp.name,
          month: format(new Date(bonusAppliedDate), 'yyyy-MM'),
          basicSalary: parseFloat(emp.salary || 0),
          allowances: bonusAmount,
          deductions: 0,
          advanceDeduction: 0,
          loanDeduction: 0,
          netSalary: bonusAmount,
          paymentStatus: 'Pending',
          type: 'Bonus',
          bonusType: bonusType,
          paymentDate: bonusAppliedDate,
          createdAt: new Date()
        };
      }).filter(Boolean);

      for (const b of batch as any[]) {
        await erpService.createSalarySheet(user!.companyId, b);
      }
      
      showNotification(`${batch.length} Bonuses generated successfully`);
      setActiveTab('salary');
      fetchData();
    } catch (err) {
      showNotification('Failed to generate bonuses', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePayHeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = {
        name: payHeadName,
        type: payHeadType,
        calculationType: payHeadCalc
      };

      if (editingItem) {
        await erpService.updatePayHead(editingItem.id, data);
      } else {
        await erpService.createPayHead(user!.companyId, data);
      }
      showNotification('Pay Head saved');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification('Failed to save Pay Head', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStructureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payHead = payHeads.find(p => p.id === selectedPayHeadId);
      const data = {
        employeeId: selectedEmployeeId,
        payHeadId: selectedPayHeadId,
        payHeadName: payHead?.name || '',
        amount: parseFloat(structureAmount)
      };

      await erpService.createSalaryStructure(user!.companyId, data);
      showNotification('Salary Structure updated');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      showNotification('Failed to update structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateEmployeeSalaryForMonth = (empId: string, targetMonth: string) => {
    const structures = salaryStructures.filter(s => s.employeeId === empId);
    const empAttendance = attendance.filter(a => {
      return a.employeeId === empId && a.date.startsWith(targetMonth);
    });

    const monthStart = startOfMonth(new Date(targetMonth + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const totalDaysInMonth = monthEnd.getDate();

    const presentDays = empAttendance.filter(a => a.status === 'Present').length;
    const leaveDays = empAttendance.filter(a => a.status === 'Leave').length;
    const holidayDays = empAttendance.filter(a => a.status === 'Holiday').length;
    
    // Effective days for calculation (Paid days)
    const paidDays = presentDays + leaveDays + holidayDays;

    let earnings = 0;
    let deductionsVal = 0;

    structures.forEach(s => {
      const payHead = payHeads.find(p => p.id === s.payHeadId);
      if (!payHead) return;

      let calculatedAmount = s.amount;
      if (payHead.calculationType === 'On Attendance') {
        calculatedAmount = (s.amount / totalDaysInMonth) * paidDays;
      }

      if (payHead.type === 'Earning') {
        earnings += calculatedAmount;
      } else {
        deductionsVal += calculatedAmount;
      }
    });

    return {
      earnings: parseFloat(earnings.toFixed(2)),
      deductions: parseFloat(deductionsVal.toFixed(2)),
      paidDays,
      totalDays: totalDaysInMonth
    };
  };

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
        applicationDate,
        approvalDate,
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
      await fetchData();
      // Sync existing pending salary sheets for this employee
      await syncSalarySheet(selectedEmployeeId);
    } catch (err: any) {
      showNotification('Failed to save advance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const syncSalarySheet = async (employeeId: string) => {
    // Find ALL pending sheets for this employee to ensure "realtime" sync
    const pendingSheets = salarySheets.filter(s => s.employeeId === employeeId && s.paymentStatus === 'Pending');
    for (const existingSheet of pendingSheets) {
      const empAdvances = advances.filter(a => a.employeeId === employeeId && a.status === 'Pending');
      const totalAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
      
      const empLoans = loans.filter(l => l.employeeId === employeeId && l.status === 'Active');
      const totalLoanEMI = empLoans.reduce((sum, l) => {
        let emi = l.monthlyEMI || 0;
        if (emi === 0 && l.amount > 0) {
          const P = l.amount;
          const R = (l.interestRate || 0) / 100 / 12;
          const N = l.emiDuration || 12;
          emi = R > 0 ? (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1) : P / N;
        }
        return sum + emi;
      }, 0);
      
      const basic = parseFloat(existingSheet.basicSalary) || 0;
      const allow = parseFloat(existingSheet.allowances) || 0;
      const deduct = parseFloat(existingSheet.deductions) || 0;
      const net = basic + allow - deduct - totalAdvance - totalLoanEMI;

      await erpService.updateSalarySheet(existingSheet.id, {
        advanceDeduction: totalAdvance,
        loanDeduction: totalLoanEMI,
        netSalary: net
      });
    }
    await fetchData();
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
      await fetchData();
      // Sync existing pending salary sheets for this employee
      await syncSalarySheet(selectedEmployeeId);
    } catch (err: any) {
      showNotification('Failed to save loan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, type: Tab) => {
    setLoading(true);
    try {
      let employeeId = '';
      if (type === 'advance') employeeId = advances.find(a => a.id === id)?.employeeId || '';
      if (type === 'loan') employeeId = loans.find(l => l.id === id)?.employeeId || '';

      if (type === 'salary') await erpService.deleteSalarySheet(id);
      if (type === 'advance') await erpService.deleteAdvance(id);
      if (type === 'loan') await erpService.deleteLoan(id);
      
      showNotification('Entry deleted successfully');
      await fetchData();
      
      if (employeeId) {
        await syncSalarySheet(employeeId);
      }
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
      setApplicationDate(item.applicationDate || format(new Date(), 'yyyy-MM-dd'));
      setApprovalDate(item.approvalDate || format(new Date(), 'yyyy-MM-dd'));
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
    const text = `Salary Slip for ${s.month}\nEmployee: ${s.employeeName}\nNet Payable: ${baseCurrencySymbol}${s.netSalary}\nStatus: ${s.paymentStatus}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleEmail = (s: any) => {
    const subject = `Salary Slip - ${s.month}`;
    const body = `Employee: ${s.employeeName}\nNet Payable: ${baseCurrencySymbol}${s.netSalary}\nStatus: ${s.paymentStatus}`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-border pb-4 gap-4">
          <h1 className="text-xl lg:text-2xl font-mono text-foreground uppercase tracking-tighter">Payroll Management</h1>
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
                setApplicationDate(format(new Date(), 'yyyy-MM-dd'));
                setApprovalDate(format(new Date(), 'yyyy-MM-dd'));
                setStatus('Pending');
                setIsModalOpen(true);
              }}
              className="px-4 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-3 h-3" />
              Add {activeTab === 'salary' ? 'Salary Sheet' : activeTab === 'advance' ? 'Advance' : 'Loan'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex flex-col md:flex-row justify-between items-center border-b border-border gap-4">
          <div className="flex overflow-x-auto no-scrollbar w-full md:w-auto">
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
            <button 
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                activeTab === 'attendance' ? "border-foreground text-foreground" : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              Attendance
            </button>
            <button 
              onClick={() => setActiveTab('payheads')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                activeTab === 'payheads' ? "border-foreground text-foreground" : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              Pay Heads & Structure
            </button>
            <button 
              onClick={() => setActiveTab('bonus')}
              className={cn(
                "px-6 py-3 text-[10px] font-bold uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
                activeTab === 'bonus' ? "border-foreground text-foreground" : "border-transparent text-gray-500 hover:text-foreground"
              )}
            >
              Festival Bonus
            </button>
          </div>
          
          <div className="flex flex-col items-end gap-2 pb-2 md:pb-0">
            {activeTab === 'attendance' ? (
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Select Date</label>
                <input 
                  type="date" 
                  value={activeDate}
                  onChange={e => setActiveDate(e.target.value)}
                  className="bg-background border border-border text-foreground p-1.5 text-xs outline-none focus:border-foreground"
                />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Select Month</label>
                <input 
                  type="month" 
                  value={month}
                  onChange={e => setMonth(e.target.value)}
                  className="bg-background border border-border text-foreground p-1.5 text-xs outline-none focus:border-foreground"
                />
              </div>
            )}
            <button 
              onClick={() => setActiveTab(activeTab === 'bulk' ? 'salary' : 'bulk')}
              className={cn(
                "w-full sm:w-auto px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-border",
                activeTab === 'bulk' ? "bg-foreground text-background" : "bg-card text-foreground hover:bg-foreground/5",
                (activeTab === 'attendance' || activeTab === 'payheads' || activeTab === 'bonus') && "hidden"
              )}
            >
              {activeTab === 'bulk' ? <LayoutGrid className="w-3 h-3" /> : <TableIcon className="w-3 h-3" />}
              {activeTab === 'bulk' ? 'Card View' : 'Bulk View'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : activeTab === 'attendance' ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {employees.map(emp => {
                const record = attendance.find(a => a.employeeId === emp.id && a.date === activeDate);
                return (
                  <div key={emp.id} className="bg-card border border-border p-4 flex justify-between items-center group">
                    <div>
                      <h4 className="text-sm font-bold uppercase tracking-tight">{emp.name}</h4>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">{emp.designation}</p>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleAttendanceSubmit(emp.id, 'Present')}
                        className={cn(
                          "p-2 border transition-all",
                          record?.status === 'Present' ? "bg-emerald-500 border-emerald-500 text-white" : "border-border text-gray-400 hover:border-emerald-500 hover:text-emerald-500"
                        )}
                        title="Mark Present"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAttendanceSubmit(emp.id, 'Absent')}
                        className={cn(
                          "p-2 border transition-all",
                          record?.status === 'Absent' ? "bg-rose-500 border-rose-500 text-white" : "border-border text-gray-400 hover:border-rose-500 hover:text-rose-500"
                        )}
                        title="Mark Absent"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleAttendanceSubmit(emp.id, 'Leave')}
                        className={cn(
                          "p-2 border transition-all",
                          record?.status === 'Leave' ? "bg-amber-500 border-amber-500 text-white" : "border-border text-gray-400 hover:border-amber-500 hover:text-amber-500"
                        )}
                        title="Mark Leave"
                      >
                        <Clock className="w-4 h-4" />
                      </button>
                      {record && (
                        <button 
                          onClick={() => handleAttendanceSubmit(emp.id, 'Clear')}
                          className="p-2 border border-border text-gray-400 hover:border-foreground hover:text-foreground transition-all"
                          title="Reset"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'bonus' ? (
          <div className="max-w-4xl mx-auto space-y-8 bg-card border border-border p-8">
            <div className="flex items-center gap-4 border-b border-border pb-6">
              <div className="p-3 bg-primary/10 text-primary rounded-full">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold uppercase tracking-tight">Festival Bonus Generator</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Calculate and generate bonuses based on tenure and festival dates.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Bonus Type</label>
                <select 
                  value={bonusType}
                  onChange={e => setBonusType(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                >
                  <option value="Eid-ul-Fitr">Eid-ul-Fitr</option>
                  <option value="Eid-ul-Adha">Eid-ul-Adha</option>
                  <option value="Pohela Boishak">Pohela Boishak</option>
                  <option value="Special Bonus">Special Bonus</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Festival Date</label>
                <input 
                  type="date" 
                  value={bonusAppliedDate}
                  onChange={e => setBonusAppliedDate(e.target.value)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Calculation Basis</label>
                <select 
                  value={bonusCalculationBasis}
                  onChange={e => setBonusCalculationBasis(e.target.value as any)}
                  className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground"
                >
                  <option value="Full">Full Salary</option>
                  <option value="Half">Half Salary</option>
                </select>
              </div>
            </div>

            <div className="bg-foreground/5 p-4 space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest border-b border-border/50 pb-2">Calculation Rules</h4>
              <ul className="space-y-2">
                <li className="text-[10px] text-gray-600 flex items-center gap-2">
                  <Check className="w-3 h-3 text-emerald-500" /> Employees with 1+ year tenure receive the full basis amount.
                </li>
                <li className="text-[10px] text-gray-600 flex items-center gap-2">
                  <Check className="w-3 h-3 text-emerald-500" /> Employees with less than 1 year receive a pro-rated amount based on days served.
                </li>
                <li className="text-[10px] text-gray-600 flex items-center gap-2">
                  <Clock className="w-3 h-3 text-amber-500" /> Pro-rata formula: Basis × (Tenure in Days / 365).
                </li>
              </ul>
            </div>

            <div className="overflow-x-auto border border-border">
              <table className="w-full text-left text-xs uppercase tracking-tight">
                <thead className="bg-foreground/5 border-b border-border">
                  <tr>
                    <th className="p-3 font-bold">Employee</th>
                    <th className="p-3 font-bold">Joining Date</th>
                    <th className="p-3 font-bold">Tenure (Days)</th>
                    <th className="p-3 font-bold text-right">Estimated Bonus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map(emp => {
                    const bonus = calculateBonus(emp, bonusAppliedDate, bonusCalculationBasis);
                    const tenureDays = differenceInDays(new Date(bonusAppliedDate), new Date(emp.joiningDate));
                    return (
                      <tr key={emp.id} className="hover:bg-foreground/5 transition-colors">
                        <td className="p-3">
                          <span className="font-bold block">{emp.name}</span>
                          <span className="text-[9px] text-gray-500">{emp.designation}</span>
                        </td>
                        <td className="p-3 font-mono">{emp.joiningDate}</td>
                        <td className="p-3 font-mono">
                          <span className={cn(tenureDays < 365 ? "text-amber-500" : "text-emerald-500")}>
                            {tenureDays} Days
                          </span>
                        </td>
                        <td className="p-3 text-right font-bold">৳{bonus}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-6 border-t border-border flex justify-between items-center">
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                Total Employees: {employees.length}
              </p>
              <button 
                onClick={generateBonuses}
                disabled={loading}
                className="px-8 py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Gift className="w-3 h-3" />}
                Generate & Post Bonuses
              </button>
            </div>
          </div>
        ) : activeTab === 'payheads' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <SettingsIcon className="w-3 h-3" /> Pay Heads
                </h3>
                <button 
                  onClick={() => {
                    setEditingItem(null);
                    setSelectedEmployeeId(''); // Fixed: Reset selected employee
                    setPayHeadName('');
                    setPayHeadType('Earning');
                    setPayHeadCalc('Fixed');
                    setIsModalOpen(true);
                  }}
                  className="text-[9px] font-bold uppercase tracking-widest text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Head
                </button>
              </div>
              <div className="space-y-2">
                {payHeads.map(ph => (
                  <div key={ph.id} className="bg-card border border-border p-3 flex justify-between items-center group">
                    <div>
                      <p className="text-xs font-bold uppercase">{ph.name}</p>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">{ph.type} | {ph.calculationType}</p>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => {
                          setEditingItem(ph);
                          setPayHeadName(ph.name);
                          setPayHeadType(ph.type);
                          setPayHeadCalc(ph.calculationType);
                          setIsModalOpen(true);
                        }}
                        className="p-1 hover:bg-foreground/10 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
                  <Fingerprint className="w-3 h-3" /> Employee Salary Structure
                </h3>
              </div>
              <div className="bg-card border border-border divide-y divide-border">
                {employees.map(emp => (
                  <div key={emp.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold uppercase truncate">{emp.name}</h4>
                      <p className="text-[9px] text-gray-500 uppercase tracking-widest">{emp.designation}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {salaryStructures.filter(s => s.employeeId === emp.id).map(struct => (
                        <div key={struct.id} className="bg-foreground/5 border border-border px-2 py-1 rounded flex items-center gap-2 group/struct">
                          <span className="text-[9px] font-bold uppercase text-gray-500">{struct.payHeadName}:</span>
                          <span className="text-[9px] font-bold tracking-tight">৳{struct.amount}</span>
                          <button 
                            onClick={async () => {
                              if (confirm('Remove this pay head?')) {
                                await erpService.deleteDocCustom('salary_structures', struct.id);
                                fetchData();
                              }
                            }}
                            className="text-rose-500 opacity-0 group-hover/struct:opacity-100 transition-opacity"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => {
                          setSelectedEmployeeId(emp.id);
                          setSelectedPayHeadId('');
                          setStructureAmount('');
                          setEditingItem(null);
                          setIsModalOpen(true);
                        }}
                        className="px-2 py-1 border border-dashed border-gray-400 text-[9px] font-bold uppercase text-gray-400 hover:text-foreground hover:border-foreground transition-all"
                      >
                        + Add Component
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeTab === 'bulk' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button 
                onClick={async () => {
                  setLoading(true);
                  try {
                    const pendingEmployees = employees.filter(emp => !salarySheets.find(s => s.employeeId === emp.id && s.month === month));
                    for (const emp of pendingEmployees) {
                      const empAdvances = advances.filter(a => a.employeeId === emp.id && a.status === 'Pending');
                      const totalAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
                      const empLoans = loans.filter(l => l.employeeId === emp.id && l.status === 'Active');
                      const totalLoanEMI = empLoans.reduce((sum, l) => sum + (l.monthlyEMI || 0), 0);
                      
                      const basic = parseFloat(emp.salary) || 0;
                      const net = basic - totalAdvance - totalLoanEMI;

                      await erpService.createSalarySheet(user!.companyId, {
                        employeeId: emp.id,
                        employeeName: emp.name,
                        month,
                        basicSalary: basic,
                        allowances: 0,
                        deductions: 0,
                        advanceDeduction: totalAdvance,
                        loanDeduction: totalLoanEMI,
                        netSalary: net,
                        paymentStatus: 'Pending'
                      });
                    }
                    showNotification(`Generated ${pendingEmployees.length} salary sheets`);
                    fetchData();
                  } catch (err) {
                    showNotification('Failed to generate bulk salary sheets', 'error');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <CheckCircle className="w-3 h-3" />
                Generate All Pending
              </button>
            </div>
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
                    
                    // Calculate current deductions for preview if sheet doesn't exist or is pending
                    const empAdvances = advances.filter(a => a.employeeId === emp.id && a.status === 'Pending');
                    const totalAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
                    const empLoans = loans.filter(l => l.employeeId === emp.id && l.status === 'Active');
                    const totalLoanEMI = empLoans.reduce((sum, l) => sum + (l.monthlyEMI || 0), 0);
                    
                    const basic = parseFloat(emp.salary) || 0;
                    const advLoan = sheet && sheet.paymentStatus === 'Paid' 
                      ? (sheet.advanceDeduction || 0) + (sheet.loanDeduction || 0)
                      : totalAdvance + totalLoanEMI;
                    
                    const net = sheet && sheet.paymentStatus === 'Paid'
                      ? sheet.netSalary
                      : basic + (parseFloat(sheet?.allowances || '0')) - (parseFloat(sheet?.deductions || '0')) - totalAdvance - totalLoanEMI;

                    return (
                      <tr key={emp.id} className="hover:bg-foreground/5 transition-colors group">
                        <td className="p-4">
                          <p className="text-xs font-bold uppercase">{emp.name}</p>
                          <p className="text-[9px] text-gray-500 uppercase">{emp.designation}</p>
                        </td>
                        <td className="p-4 text-xs">৳{emp.salary || 0}</td>
                        <td className="p-4 text-xs">৳{sheet?.allowances || 0}</td>
                        <td className="p-4 text-xs">৳{sheet?.deductions || 0}</td>
                        <td className="p-4 text-xs text-rose-500">-৳{advLoan}</td>
                        <td className="p-4 text-xs font-bold text-emerald-500">৳{net}</td>
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
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {activeTab === 'salary' && salarySheets.map((s) => {
              // Recalculate if pending to show "realtime" data as requested
              let currentAdvance = s.advanceDeduction || 0;
              let currentLoan = s.loanDeduction || 0;
              let currentNet = s.netSalary;

              if (s.paymentStatus === 'Pending') {
                const empAdvances = advances.filter(a => a.employeeId === s.employeeId && a.status === 'Pending');
                currentAdvance = empAdvances.reduce((sum, a) => sum + a.amount, 0);
                const empLoans = loans.filter(l => l.employeeId === s.employeeId && l.status === 'Active');
                currentLoan = empLoans.reduce((sum, l) => {
                  let emi = l.monthlyEMI || 0;
                  if (emi === 0 && l.amount > 0) {
                    const P = l.amount;
                    const R = (l.interestRate || 0) / 100 / 12;
                    const N = l.emiDuration || 12;
                    emi = R > 0 ? (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1) : P / N;
                  }
                  return sum + emi;
                }, 0);
                currentNet = s.basicSalary + (s.allowances || 0) - (s.deductions || 0) - currentAdvance - currentLoan;
              }

              return (
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
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2 border-t border-border">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">Basic Salary</p>
                      <p className="text-xs font-bold">৳{s.basicSalary}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">Advance Ded.</p>
                      <p className="text-xs font-bold text-rose-500">৳{currentAdvance.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">Loan EMI</p>
                      <p className="text-xs font-bold text-rose-500">৳{currentLoan.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">Net Payable</p>
                      <p className="text-xs font-bold text-emerald-500">৳{currentNet.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button onClick={() => handlePrint(s)} className="flex-1 py-1.5 bg-foreground/5 hover:bg-foreground/10 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><Printer className="w-3 h-3" /> Print</button>
                    <button onClick={() => handleWhatsApp(s)} className="flex-1 py-1.5 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-500 text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"><MessageSquare className="w-3 h-3" /> WA</button>
                  </div>
                </div>
              );
            })}

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
                <div className="pt-2 border-t border-border space-y-2">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">Amount</p>
                      <p className="text-lg font-bold text-rose-500">৳{a.amount}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">App Date</p>
                      <p className="text-[10px] font-medium">{a.applicationDate || a.date}</p>
                    </div>
                  </div>
                  {a.approvalDate && (
                    <div className="flex justify-between items-center bg-foreground/5 p-1.5 rounded">
                      <p className="text-[8px] text-gray-500 uppercase tracking-widest">Approved On</p>
                      <p className="text-[10px] font-bold text-emerald-500">{a.approvalDate}</p>
                    </div>
                  )}
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
                {activeTab === 'payheads' 
                  ? (editingItem ? 'Edit Pay Head' : (selectedEmployeeId ? 'Add Salary Component' : 'Create Pay Head'))
                  : `Create New ${activeTab === 'salary' || activeTab === 'bulk' ? 'Salary Sheet' : activeTab === 'advance' ? 'Advance' : activeTab === 'loan' ? 'Loan' : 'Entry'}`
                }
              </h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedEmployeeId('');
                  setEditingItem(null);
                }} 
                className="text-gray-500 hover:text-foreground"
              >
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <form 
              onSubmit={
                activeTab === 'payheads' 
                  ? (selectedEmployeeId ? handleStructureSubmit : handlePayHeadSubmit) // Simplified logic
                  : activeTab === 'salary' || activeTab === 'bulk' 
                    ? handleSalarySubmit 
                    : activeTab === 'advance' 
                      ? handleAdvanceSubmit 
                      : handleLoanSubmit
              } 
              className="p-6 space-y-4"
            >
              {activeTab === 'payheads' && !selectedEmployeeId && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Pay Head Name</label>
                    <input 
                      type="text" 
                      value={payHeadName}
                      onChange={e => setPayHeadName(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      placeholder="e.g. Basic Salary, HRA, Medical"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Type</label>
                      <select 
                        value={payHeadType}
                        onChange={e => setPayHeadType(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      >
                        <option value="Earning">Earning</option>
                        <option value="Deduction">Deduction</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Calculation</label>
                      <select 
                        value={payHeadCalc}
                        onChange={e => setPayHeadCalc(e.target.value as any)}
                        className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      >
                        <option value="Fixed">Fixed Amount</option>
                        <option value="On Attendance">Based on Attendance</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'payheads' && selectedEmployeeId && (
                <>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Select Pay Head</label>
                    <select 
                      value={selectedPayHeadId}
                      onChange={e => setSelectedPayHeadId(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      required
                    >
                      <option value="">Select component</option>
                      {payHeads.map(ph => (
                        <option key={ph.id} value={ph.id}>{ph.name} ({ph.type})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Amount (৳)</label>
                    <input 
                      type="number" 
                      value={structureAmount}
                      onChange={e => setStructureAmount(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      placeholder="Enter monthly amount"
                      required
                    />
                  </div>
                </>
              )}

              {activeTab !== 'payheads' && (
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
              )}

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
                        onFocus={e => e.target.value === '0' && e.target.select()}
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
                        onFocus={e => e.target.value === '0' && e.target.select()}
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
                    onFocus={e => e.target.value === '0' && e.target.select()}
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
                      onFocus={e => e.target.value === '0' && e.target.select()}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Application Date</label>
                    <input 
                      type="date" 
                      value={applicationDate}
                      onChange={e => setApplicationDate(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">Approval Date</label>
                    <input 
                      type="date" 
                      value={approvalDate}
                      onChange={e => setApprovalDate(e.target.value)}
                      className="w-full bg-background border border-border text-foreground p-3 text-sm outline-none focus:border-foreground transition-colors"
                    />
                  </div>
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
                  disabled={loading || (activeTab !== 'payheads' && !selectedEmployeeId)}
                  className="w-full py-3 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  ) : activeTab === 'payheads' ? (
                    selectedEmployeeId ? 'Save Salary Structure' : 'Save Pay Head'
                  ) : activeTab === 'salary' || activeTab === 'bulk' ? (
                    'Save Salary Sheet'
                  ) : activeTab === 'advance' ? (
                    'Save Advance'
                  ) : (
                    'Save Loan'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
