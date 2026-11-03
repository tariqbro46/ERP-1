import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  BarChart3, 
  Calculator, 
  CalendarCheck, 
  Layers, 
  Coins, 
  Users, 
  HandCoins, 
  Gift, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  Printer, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  X, 
  ArrowRight, 
  ShieldCheck, 
  RotateCcw, 
  CreditCard, 
  Search, 
  Filter, 
  Download, 
  Sparkles, 
  Percent, 
  Timer,
  Info,
  UserCheck,
  History,
  Eye,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatCurrency, cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, differenceInDays, subMonths } from 'date-fns';

type PayrollTab = 'analytics' | 'processing' | 'attendance' | 'structures' | 'components' | 'groups' | 'advances' | 'bonus' | 'service';

export function PayrollManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const { t } = useLanguage();
  const settings = useSettings();
  const { baseCurrencySymbol = '৳' } = settings;

  const [activeTab, setActiveTab] = useState<PayrollTab>('analytics');
  const [loading, setLoading] = useState(true);

  // Core Data Lists
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeGroups, setEmployeeGroups] = useState<any[]>([]);
  const [payHeads, setPayHeads] = useState<any[]>([]);
  const [salaryStructures, setSalaryStructures] = useState<any[]>([]);
  const [salarySheets, setSalarySheets] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [ledgers, setLedgers] = useState<any[]>([]);

  // Filters & State
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [analyticsMonthsCount, setAnalyticsMonthsCount] = useState<number>(6); // 6 or 12
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('all');
  const [searchEmployeeQuery, setSearchEmployeeQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Pending' | 'Paid'>('all');

  // Attendance Register Matrix state for the selected month
  const [monthlyAttendanceMap, setMonthlyAttendanceMap] = useState<Record<string, { presentDays: number; lwpDays: number; overtimeHours: number }>>({});

  // Modals
  const [isPayComponentModalOpen, setIsPayComponentModalOpen] = useState(false);
  const [editingPayHead, setEditingPayHead] = useState<any>(null);
  const [componentForm, setComponentForm] = useState({
    name: '',
    type: 'Earning' as 'Earning' | 'Deduction',
    calculationType: 'Fixed' as 'Fixed' | 'On Attendance' | 'Percentage' | 'On Overtime',
    basePayHeadId: '',
    percentage: '',
    ratePerHour: '',
    expenseLedgerId: '',
    description: ''
  });

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({ name: '', description: '' });

  const [isStructureModalOpen, setIsStructureModalOpen] = useState(false);
  const [structureTargetType, setStructureTargetType] = useState<'Employee' | 'Group'>('Group');
  const [structureTargetId, setStructureTargetId] = useState('');
  const [structureEntries, setStructureEntries] = useState<{ payHeadId: string; amount: number; percentage?: number }[]>([]);

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({
    employeeId: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    reason: ''
  });

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [loanForm, setLoanForm] = useState({
    employeeId: '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    interestRate: '0',
    emiDuration: '12',
    monthlyEMI: ''
  });

  const [isDisbursementModalOpen, setIsDisbursementModalOpen] = useState(false);
  const [disbursementForm, setDisbursementForm] = useState({
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    paymentLedgerId: ''
  });

  const [payslipData, setPayslipData] = useState<any>(null);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);

  // Bonus Form
  const [bonusType, setBonusType] = useState('Eid-ul-Fitr');
  const [bonusBasis, setBonusBasis] = useState<'Full' | 'Half' | 'Pro-rata'>('Full');
  const [bonusDate, setBonusDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Tooltip state for Analytics Chart
  const [hoveredChartMonth, setHoveredChartMonth] = useState<any>(null);

  // Cleaning duplicates & Service History State
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [isIncrementModalOpen, setIsIncrementModalOpen] = useState(false);
  const [isServiceHistoryModalOpen, setIsServiceHistoryModalOpen] = useState(false);
  const [selectedEmployeeForService, setSelectedEmployeeForService] = useState<any>(null);
  const [incrementForm, setIncrementForm] = useState({
    effectiveDate: format(new Date(), 'yyyy-MM-dd'),
    incrementType: 'Fixed' as 'Fixed' | 'Percentage',
    amount: '',
    notes: ''
  });
  const [serviceStatusForm, setServiceStatusForm] = useState({
    status: 'Active',
    joining_date: format(new Date(), 'yyyy-MM-dd'),
    resignation_date: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      loadInitialData(false);
    }
  }, [user?.companyId]);

  // Sync loan EMI calculation
  useEffect(() => {
    if (loanForm.amount && loanForm.emiDuration) {
      const P = parseFloat(loanForm.amount) || 0;
      const R = (parseFloat(loanForm.interestRate || '0') / 100) / 12;
      const N = parseInt(loanForm.emiDuration) || 12;
      if (P > 0 && N > 0) {
        if (R > 0) {
          const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
          setLoanForm(prev => ({ ...prev, monthlyEMI: emi.toFixed(2) }));
        } else {
          setLoanForm(prev => ({ ...prev, monthlyEMI: (P / N).toFixed(2) }));
        }
      }
    }
  }, [loanForm.amount, loanForm.interestRate, loanForm.emiDuration]);

  // Load and calculate attendance map whenever selectedMonth or attendance changes
  useEffect(() => {
    const monthStart = startOfMonth(new Date(selectedMonth + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const totalMonthDays = monthEnd.getDate();

    const newMap: Record<string, { presentDays: number; lwpDays: number; overtimeHours: number }> = {};
    employees.forEach(emp => {
      const empMonthlyAtt = attendanceRecords.filter(a => a.employeeId === emp.id && a.date?.startsWith(selectedMonth));
      if (empMonthlyAtt.length > 0) {
        const present = empMonthlyAtt.filter(a => a.status === 'Present' || a.status === 'Half Day').length;
        const lwp = empMonthlyAtt.filter(a => a.status === 'Absent').length;
        const overtime = empMonthlyAtt.reduce((sum, a) => sum + (Number(a.overtimeHours) || 0), 0);
        newMap[emp.id] = { presentDays: present, lwpDays: lwp, overtimeHours: overtime };
      } else {
        newMap[emp.id] = {
          presentDays: Math.min(26, totalMonthDays),
          lwpDays: 0,
          overtimeHours: 0
        };
      }
    });
    setMonthlyAttendanceMap(newMap);
  }, [employees, attendanceRecords, selectedMonth]);

  async function loadInitialData(forceRefresh = false) {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const [
        empData,
        groupsData,
        sheetsData,
        advData,
        loansData,
        attData,
        phData,
        structData,
        ledgersData
      ] = await Promise.all([
        erpService.getEmployees(user.companyId),
        erpService.getEmployeeGroups(user.companyId),
        erpService.getSalarySheets(user.companyId, forceRefresh),
        erpService.getAdvances(user.companyId, forceRefresh),
        erpService.getLoans(user.companyId, forceRefresh),
        erpService.getAttendance(user.companyId, undefined, undefined, forceRefresh),
        erpService.getPayHeads(user.companyId, forceRefresh),
        erpService.getSalaryStructures(user.companyId, undefined, forceRefresh),
        erpService.getLedgers(user.companyId)
      ]);

      setEmployees(empData || []);
      setEmployeeGroups(groupsData || []);
      setSalarySheets(sheetsData || []);
      setAdvances(advData || []);
      setLoans(loansData || []);
      setAttendanceRecords(attData || []);
      setPayHeads(phData || []);
      setSalaryStructures(structData || []);
      setLedgers(ledgersData || []);
    } catch (err) {
      console.error('Error loading payroll data:', err);
      showNotification('Failed to load payroll data', 'error');
    } finally {
      setLoading(false);
    }
  }

  // --- ATTENDANCE HELPERS ---
  const handleAutoFillAttendance = (days: number) => {
    const newMap = { ...monthlyAttendanceMap };
    employees.forEach(emp => {
      newMap[emp.id] = {
        presentDays: days,
        lwpDays: 0,
        overtimeHours: newMap[emp.id]?.overtimeHours || 0
      };
    });
    setMonthlyAttendanceMap(newMap);
    showNotification(`Auto-filled ${days} standard working days for all active employees`);
  };

  const handleAttendanceChange = (empId: string, field: 'presentDays' | 'lwpDays' | 'overtimeHours', val: number) => {
    setMonthlyAttendanceMap(prev => ({
      ...prev,
      [empId]: {
        ...prev[empId],
        [field]: Math.max(0, val || 0)
      }
    }));
  };

  const handleSaveAttendanceMatrix = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const recordsToSave: any[] = [];
      const dateSample = `${selectedMonth}-01`;
      
      for (const emp of employees) {
        const att = monthlyAttendanceMap[emp.id] || { presentDays: 26, lwpDays: 0, overtimeHours: 0 };
        recordsToSave.push({
          employeeId: emp.id,
          employeeName: emp.name,
          date: dateSample,
          status: att.lwpDays > 0 ? 'Absent' : 'Present',
          presentDays: att.presentDays,
          lwpDays: att.lwpDays,
          overtimeHours: att.overtimeHours,
          month: selectedMonth
        });
      }

      await erpService.bulkCreateAttendance(user.companyId, recordsToSave);
      
      // Auto-recalculate existing salary sheets for this month if they already exist
      const existingSheets = salarySheets.filter(s => s.month === selectedMonth);
      if (existingSheets.length > 0) {
        for (const sheet of existingSheets) {
          const emp = employees.find(e => e.id === sheet.employeeId);
          if (emp) {
            const calc = calculateEmployeeSalary(emp, selectedMonth);
            await erpService.updateSalarySheet(sheet.id, {
              basicSalary: calc.basicSalary,
              allowances: calc.allowances,
              deductions: calc.deductions,
              advanceDeduction: calc.advanceDeduction,
              loanDeduction: calc.loanDeduction,
              netSalary: calc.netSalary,
              presentDays: calc.presentDays,
              totalDays: calc.totalDays,
              overtimeHours: calc.overtimeHours,
              overtimeAmount: calc.overtimeAmount,
              payBreakdown: calc.payBreakdown
            }, user.companyId);
          }
        }
        showNotification(`Attendance saved & recalculated ${existingSheets.length} employee salary sheets for ${selectedMonth}!`);
      } else {
        showNotification('Attendance register saved successfully');
      }

      await loadInitialData(true);
    } catch (err) {
      console.error('Error saving attendance register:', err);
      showNotification('Failed to save attendance register', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- CLEAN DUPLICATES & ROW ACTIONS ---
  const handleCleanDuplicates = async () => {
    if (!user?.companyId) return;
    setCleaningDuplicates(true);
    try {
      const res = await erpService.cleanDuplicateSalarySheets(user.companyId, selectedMonth);
      if (res.deletedCount > 0) {
        showNotification(`Cleaned ${res.deletedCount} duplicate entries. ${res.remainingCount} unique staff active.`);
      } else {
        showNotification('No duplicate employee records found for this month.', 'info');
      }
      await loadInitialData(true);
    } catch (err) {
      console.error('Error cleaning duplicates:', err);
      showNotification('Failed to clean duplicate salary records', 'error');
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const handleDeleteSalarySheetRow = async (sheetId: string, empName: string) => {
    if (!user?.companyId) return;
    try {
      await erpService.deleteSalarySheet(sheetId, user.companyId);
      setSalarySheets(prev => prev.filter(s => s.id !== sheetId));
      showNotification(`Removed salary row for ${empName}`);
    } catch (err) {
      showNotification('Failed to remove salary row', 'error');
    }
  };

  // --- ADVANCES & LOANS MANAGEMENT ACTIONS ---
  const handleToggleAdvanceStatus = async (advance: any) => {
    if (!user?.companyId) return;
    const nextStatus = advance.status === 'Pending' ? 'Settled' : 'Pending';
    try {
      await erpService.updateAdvance(advance.id, { status: nextStatus }, user.companyId);
      setAdvances(prev => prev.map(a => a.id === advance.id ? { ...a, status: nextStatus } : a));
      showNotification(`Advance marked as ${nextStatus}`);
    } catch (err) {
      showNotification('Failed to update advance status', 'error');
    }
  };

  const handleDeleteAdvance = async (advanceId: string) => {
    if (!user?.companyId) return;
    if (!confirm('Are you sure you want to remove this advance record?')) return;
    try {
      await erpService.deleteAdvance(advanceId, user.companyId);
      setAdvances(prev => prev.filter(a => a.id !== advanceId));
      showNotification('Advance record deleted');
    } catch (err) {
      showNotification('Failed to delete advance', 'error');
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!user?.companyId) return;
    if (!confirm('Are you sure you want to delete this loan record?')) return;
    try {
      await erpService.deleteLoan(loanId, user.companyId);
      setLoans(prev => prev.filter(l => l.id !== loanId));
      showNotification('Loan record deleted');
    } catch (err) {
      showNotification('Failed to delete loan', 'error');
    }
  };

  // --- EMPLOYEE INCREMENTS & SERVICE STATUS ACTIONS ---
  const handleOpenIncrementModal = (emp: any) => {
    setSelectedEmployeeForService(emp);
    setIncrementForm({
      effectiveDate: format(new Date(), 'yyyy-MM-dd'),
      incrementType: 'Fixed',
      amount: '',
      notes: ''
    });
    setIsIncrementModalOpen(true);
  };

  const handleOpenServiceHistoryModal = (emp: any) => {
    setSelectedEmployeeForService(emp);
    setServiceStatusForm({
      status: emp.status || 'Active',
      joining_date: emp.joining_date || emp.joiningDate || format(new Date(), 'yyyy-MM-dd'),
      resignation_date: emp.resignation_date || ''
    });
    setIsServiceHistoryModalOpen(true);
  };

  const handleSaveIncrement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedEmployeeForService) return;
    const oldSalary = Number(selectedEmployeeForService.salary || selectedEmployeeForService.basicSalary || 0);
    const amountVal = parseFloat(incrementForm.amount) || 0;
    if (amountVal <= 0) {
      showNotification('Please enter a valid increment amount', 'warning');
      return;
    }
    const newSalary = incrementForm.incrementType === 'Percentage' 
      ? oldSalary + (oldSalary * amountVal) / 100 
      : oldSalary + amountVal;

    setLoading(true);
    try {
      await erpService.addEmployeeSalaryIncrement(user.companyId, selectedEmployeeForService.id, {
        effectiveDate: incrementForm.effectiveDate,
        previousSalary: oldSalary,
        newSalary,
        incrementAmount: amountVal,
        incrementType: incrementForm.incrementType,
        notes: incrementForm.notes
      });
      showNotification(`Salary increment recorded! New basic: ${formatCurrency(newSalary, baseCurrencySymbol)}`);
      setIsIncrementModalOpen(false);
      setIncrementForm({
        effectiveDate: format(new Date(), 'yyyy-MM-dd'),
        incrementType: 'Fixed',
        amount: '',
        notes: ''
      });
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to save salary increment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveServiceStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !selectedEmployeeForService) return;
    setLoading(true);
    try {
      await erpService.updateEmployeeServiceStatus(user.companyId, selectedEmployeeForService.id, {
        status: serviceStatusForm.status,
        joining_date: serviceStatusForm.joining_date,
        resignation_date: serviceStatusForm.resignation_date || ''
      });
      showNotification('Employee service details updated successfully');
      setIsServiceHistoryModalOpen(false);
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to update service details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATION ENGINE ---
  const calculateEmployeeSalary = (emp: any, month: string) => {
    const monthStart = startOfMonth(new Date(month + '-01'));
    const monthEnd = endOfMonth(monthStart);
    const totalMonthDays = monthEnd.getDate();

    const att = monthlyAttendanceMap[emp.id] || { presentDays: 26, lwpDays: 0, overtimeHours: 0 };
    const paidDays = att.presentDays;

    let structures = salaryStructures.filter(s => s.targetType === 'Employee' && s.employeeId === emp.id);
    if (structures.length === 0 && emp.groupId) {
      structures = salaryStructures.filter(s => s.targetType === 'Group' && s.groupId === emp.groupId);
    }
    if (structures.length === 0) {
      structures = salaryStructures.filter(s => s.employeeId === emp.id);
    }

    const baseSalaryNum = parseFloat(emp.salary || emp.basicSalary || '0');
    let calculatedBasic = baseSalaryNum;
    
    if (totalMonthDays > 0 && paidDays < totalMonthDays) {
      calculatedBasic = (baseSalaryNum / totalMonthDays) * paidDays;
    }

    let allowancesTotal = 0;
    let deductionsTotal = 0;
    const breakdown: any[] = [];

    structures.forEach(st => {
      const ph = payHeads.find(p => p.id === st.payHeadId);
      if (!ph) return;

      let val = Number(st.amount) || 0;
      if (ph.calculationType === 'Percentage' && (st.percentage || ph.percentage)) {
        const pct = Number(st.percentage || ph.percentage) || 0;
        val = (baseSalaryNum * pct) / 100;
      } else if (ph.calculationType === 'On Attendance' && totalMonthDays > 0) {
        val = (val / totalMonthDays) * paidDays;
      }

      if (ph.type === 'Earning') {
        allowancesTotal += val;
      } else {
        deductionsTotal += val;
      }

      breakdown.push({
        payHeadId: ph.id,
        payHeadName: ph.name,
        type: ph.type,
        amount: parseFloat(val.toFixed(2))
      });
    });

    let overtimeAmount = 0;
    if (att.overtimeHours > 0) {
      const otPayHead = payHeads.find(p => p.calculationType === 'On Overtime');
      const ratePerHour = otPayHead?.ratePerHour || (baseSalaryNum > 0 ? (baseSalaryNum / (26 * 8)) * 1.5 : 100);
      overtimeAmount = att.overtimeHours * ratePerHour;
      allowancesTotal += overtimeAmount;
      breakdown.push({
        payHeadId: otPayHead?.id || 'ot_comp',
        payHeadName: 'Overtime Compensation',
        type: 'Earning',
        amount: parseFloat(overtimeAmount.toFixed(2))
      });
    }

    const empPendingAdvances = advances.filter(a => a.employeeId === emp.id && a.status === 'Pending');
    const advanceDeduction = empPendingAdvances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

    const empActiveLoans = loans.filter(l => l.employeeId === emp.id && l.status === 'Active');
    const loanDeduction = empActiveLoans.reduce((sum, l) => sum + (Number(l.monthlyEMI) || 0), 0);

    const netSalary = Math.max(0, calculatedBasic + allowancesTotal - deductionsTotal - advanceDeduction - loanDeduction);

    return {
      basicSalary: parseFloat(calculatedBasic.toFixed(2)),
      allowances: parseFloat(allowancesTotal.toFixed(2)),
      deductions: parseFloat(deductionsTotal.toFixed(2)),
      advanceDeduction,
      loanDeduction,
      overtimeHours: att.overtimeHours,
      overtimeAmount: parseFloat(overtimeAmount.toFixed(2)),
      presentDays: paidDays,
      totalDays: totalMonthDays,
      netSalary: parseFloat(netSalary.toFixed(2)),
      payBreakdown: breakdown
    };
  };

  // --- BATCH PROCESS MONTHLY SALARY (WITH ZERO-DUPLICATE GUARANTEE) ---
  const handleProcessMonthlySalary = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const targetEmployees = selectedGroupFilter === 'all' 
        ? employees 
        : employees.filter(e => e.groupId === selectedGroupFilter || e.department === selectedGroupFilter);

      if (targetEmployees.length === 0) {
        showNotification('No employees found in selected group', 'warning');
        setLoading(false);
        return;
      }

      const existingSheets = salarySheets.filter(s => s.month === selectedMonth);
      const batchToCreate: any[] = [];
      const sheetsToUpdate: any[] = [];
      const redundantDuplicatesToDelete: string[] = [];

      for (const emp of targetEmployees) {
        const calc = calculateEmployeeSalary(emp, selectedMonth);
        const matchingExisting = existingSheets.filter(s => s.employeeId === emp.id);
        const primaryExisting = matchingExisting[0];

        // If duplicate sheets were previously generated for this employee, clean them up
        if (matchingExisting.length > 1) {
          for (let i = 1; i < matchingExisting.length; i++) {
            redundantDuplicatesToDelete.push(matchingExisting[i].id);
          }
        }

        const sheetPayload = {
          companyId: user.companyId,
          employeeId: emp.id,
          employeeName: emp.name,
          month: selectedMonth,
          basicSalary: calc.basicSalary,
          allowances: calc.allowances,
          deductions: calc.deductions,
          advanceDeduction: calc.advanceDeduction,
          loanDeduction: calc.loanDeduction,
          netSalary: calc.netSalary,
          paymentStatus: primaryExisting?.paymentStatus || 'Pending',
          paymentDate: primaryExisting?.paymentDate || '',
          journalVoucherId: primaryExisting?.journalVoucherId || '',
          journalVoucherNo: primaryExisting?.journalVoucherNo || '',
          presentDays: calc.presentDays,
          totalDays: calc.totalDays,
          overtimeHours: calc.overtimeHours,
          overtimeAmount: calc.overtimeAmount,
          payBreakdown: calc.payBreakdown,
          type: 'Salary'
        };

        if (primaryExisting) {
          sheetsToUpdate.push({ id: primaryExisting.id, data: sheetPayload });
        } else {
          batchToCreate.push(sheetPayload);
        }
      }

      for (const dupId of redundantDuplicatesToDelete) {
        await erpService.deleteSalarySheet(dupId, user.companyId);
      }
      for (const item of batchToCreate) {
        await erpService.createSalarySheet(user.companyId, item);
      }
      for (const item of sheetsToUpdate) {
        await erpService.updateSalarySheet(item.id, item.data, user.companyId);
      }

      showNotification(`Processed payroll calculation for ${targetEmployees.length} employees`);
      await loadInitialData(true);
    } catch (err) {
      console.error('Error processing monthly payroll:', err);
      showNotification('Failed to process monthly payroll', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- POST ACCOUNTING JOURNAL VOUCHER ---
  const handlePostJournalVoucher = async () => {
    if (!user?.companyId) return;
    const currentMonthSheets = salarySheets.filter(s => s.month === selectedMonth);
    if (currentMonthSheets.length === 0) {
      showNotification('Please calculate monthly payroll first before posting voucher', 'warning');
      return;
    }

    const alreadyPosted = currentMonthSheets.some(s => s.journalVoucherId);
    if (alreadyPosted) {
      showNotification('Accounting Journal Voucher is already posted for this month', 'info');
      return;
    }

    setLoading(true);
    try {
      const totalGross = currentMonthSheets.reduce((sum, s) => sum + (s.basicSalary + s.allowances), 0);
      const totalNet = currentMonthSheets.reduce((sum, s) => sum + s.netSalary, 0);
      const totalAdvance = currentMonthSheets.reduce((sum, s) => sum + (s.advanceDeduction || 0), 0);
      const totalLoan = currentMonthSheets.reduce((sum, s) => sum + (s.loanDeduction || 0), 0);
      const totalDeductions = currentMonthSheets.reduce((sum, s) => sum + (s.deductions || 0), 0);

      const result = await erpService.postPayrollJournalVoucher(user.companyId, {
        month: selectedMonth,
        date: `${selectedMonth}-28`,
        totalGross,
        totalNet,
        totalAdvanceDeduction: totalAdvance,
        totalLoanDeduction: totalLoan,
        totalOtherDeductions: totalDeductions,
        employeeCount: currentMonthSheets.length,
        sheetIds: currentMonthSheets.map(s => s.id)
      });

      showNotification(`Posted Accounting Journal Voucher #${result?.v_no || result?.serial_no || 'JV'}`);
      await loadInitialData(true);
    } catch (err) {
      console.error('Error posting journal voucher:', err);
      showNotification('Failed to post accounting journal voucher', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- DISBURSEMENT PAYMENT ---
  const handleDisbursementSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !disbursementForm.paymentLedgerId) return;

    const currentMonthSheets = salarySheets.filter(s => s.month === selectedMonth && s.paymentStatus !== 'Paid');
    if (currentMonthSheets.length === 0) {
      showNotification('No pending salary sheets for disbursement', 'warning');
      setIsDisbursementModalOpen(false);
      return;
    }

    setLoading(true);
    try {
      const selectedLedger = ledgers.find(l => l.id === disbursementForm.paymentLedgerId);
      const totalAmount = currentMonthSheets.reduce((sum, s) => sum + s.netSalary, 0);

      await erpService.disbursePayrollPayment(user.companyId, {
        month: selectedMonth,
        paymentDate: disbursementForm.paymentDate,
        bankOrCashLedgerId: selectedLedger?.id || '',
        bankOrCashLedgerName: selectedLedger?.name || 'Cash/Bank',
        totalAmount,
        sheetIds: currentMonthSheets.map(s => s.id)
      });

      showNotification(`Disbursed salary of ${formatCurrency(totalAmount, baseCurrencySymbol)} via ${selectedLedger?.name}`);
      setIsDisbursementModalOpen(false);
      await loadInitialData(true);
    } catch (err) {
      console.error('Error disbursing payroll:', err);
      showNotification('Failed to disburse salary payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD: PAY COMPONENTS ---
  const handleSavePayComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !componentForm.name) return;

    setLoading(true);
    try {
      const payload = {
        name: componentForm.name,
        type: componentForm.type,
        calculationType: componentForm.calculationType,
        basePayHeadId: componentForm.basePayHeadId || null,
        percentage: componentForm.percentage ? parseFloat(componentForm.percentage) : 0,
        ratePerHour: componentForm.ratePerHour ? parseFloat(componentForm.ratePerHour) : 0,
        expenseLedgerId: componentForm.expenseLedgerId || null,
        description: componentForm.description
      };

      if (editingPayHead) {
        await erpService.updatePayHead(editingPayHead.id, payload, user.companyId);
        showNotification('Pay Component updated');
      } else {
        await erpService.createPayHead(user.companyId, payload);
        showNotification('Pay Component created');
      }

      setIsPayComponentModalOpen(false);
      setEditingPayHead(null);
      setComponentForm({
        name: '',
        type: 'Earning',
        calculationType: 'Fixed',
        basePayHeadId: '',
        percentage: '',
        ratePerHour: '',
        expenseLedgerId: '',
        description: ''
      });
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to save pay component', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayHead = async (id: string) => {
    if (!confirm('Are you sure you want to delete this Pay Component?')) return;
    setLoading(true);
    try {
      await erpService.deletePayHead(id, user?.companyId);
      showNotification('Pay Component removed');
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to delete pay component', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD: EMPLOYEE GROUPS ---
  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !groupForm.name) return;

    setLoading(true);
    try {
      await erpService.createEmployeeGroup(user.companyId, {
        name: groupForm.name,
        description: groupForm.description
      });
      showNotification('Employee Group created');
      setIsGroupModalOpen(false);
      setGroupForm({ name: '', description: '' });
      await loadInitialData(true);
    } catch (err: any) {
      showNotification(err.message || 'Failed to create group', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD: SALARY STRUCTURES ---
  const handleOpenStructureModal = (targetType: 'Group' | 'Employee', targetId: string) => {
    setStructureTargetType(targetType);
    setStructureTargetId(targetId);
    
    const existing = salaryStructures.filter(s => 
      targetType === 'Group' 
        ? s.targetType === 'Group' && s.groupId === targetId 
        : (s.targetType === 'Employee' && s.employeeId === targetId) || (s.employeeId === targetId)
    );

    if (existing.length > 0) {
      setStructureEntries(existing.map(s => ({
        payHeadId: s.payHeadId,
        amount: s.amount || 0,
        percentage: s.percentage || 0
      })));
    } else {
      setStructureEntries([]);
    }
    setIsStructureModalOpen(true);
  };

  const handleSaveStructure = async () => {
    if (!user?.companyId || !structureTargetId) return;

    setLoading(true);
    try {
      const oldEntries = salaryStructures.filter(s => 
        structureTargetType === 'Group' 
          ? s.targetType === 'Group' && s.groupId === structureTargetId 
          : (s.targetType === 'Employee' && s.employeeId === structureTargetId) || (s.employeeId === structureTargetId)
      );

      for (const old of oldEntries) {
        await erpService.deleteSalaryStructure(old.id, user.companyId);
      }

      for (const entry of structureEntries) {
        const ph = payHeads.find(p => p.id === entry.payHeadId);
        await erpService.createSalaryStructure(user.companyId, {
          targetType: structureTargetType,
          groupId: structureTargetType === 'Group' ? structureTargetId : null,
          employeeId: structureTargetType === 'Employee' ? structureTargetId : null,
          payHeadId: entry.payHeadId,
          payHeadName: ph?.name || 'Component',
          amount: Number(entry.amount) || 0,
          percentage: Number(entry.percentage) || 0,
          effectiveFrom: format(new Date(), 'yyyy-MM-dd')
        });
      }

      showNotification('Salary structure saved successfully');
      setIsStructureModalOpen(false);
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to save salary structure', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- CRUD: ADVANCES & LOANS ---
  const handleSaveAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !advanceForm.employeeId || !advanceForm.amount) return;

    setLoading(true);
    try {
      const emp = employees.find(e => e.id === advanceForm.employeeId);
      await erpService.createAdvance(user.companyId, {
        employeeId: advanceForm.employeeId,
        employeeName: emp?.name || 'Staff',
        amount: parseFloat(advanceForm.amount),
        date: advanceForm.date,
        reason: advanceForm.reason,
        status: 'Pending'
      });
      showNotification('Staff Advance recorded');
      setIsAdvanceModalOpen(false);
      setAdvanceForm({ employeeId: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), reason: '' });
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to record advance', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.companyId || !loanForm.employeeId || !loanForm.amount) return;

    setLoading(true);
    try {
      const emp = employees.find(e => e.id === loanForm.employeeId);
      const amt = parseFloat(loanForm.amount);
      await erpService.createLoan(user.companyId, {
        employeeId: loanForm.employeeId,
        employeeName: emp?.name || 'Staff',
        amount: amt,
        date: loanForm.date,
        interestRate: parseFloat(loanForm.interestRate || '0'),
        totalRepayable: amt,
        monthlyEMI: parseFloat(loanForm.monthlyEMI || '0'),
        remainingBalance: amt,
        status: 'Active'
      });
      showNotification('Employee Loan recorded');
      setIsLoanModalOpen(false);
      setLoanForm({ employeeId: '', amount: '', date: format(new Date(), 'yyyy-MM-dd'), interestRate: '0', emiDuration: '12', monthlyEMI: '' });
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to record loan', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- GENERATE FESTIVAL BONUSES ---
  const handleGenerateBonuses = async () => {
    if (!user?.companyId) return;
    setLoading(true);
    try {
      const batch = employees.map(emp => {
        const salary = parseFloat(emp.salary || emp.basicSalary || '0');
        const joiningDate = emp.joining_date ? new Date(emp.joining_date) : new Date();
        const targetDate = new Date(bonusDate);
        const daysServed = Math.max(0, differenceInDays(targetDate, joiningDate));

        let baseBonus = salary;
        if (bonusBasis === 'Half') baseBonus = salary / 2;
        if (bonusBasis === 'Pro-rata') {
          baseBonus = daysServed >= 365 ? salary : (salary * (daysServed / 365));
        }

        if (baseBonus <= 0) return null;

        return {
          companyId: user.companyId,
          employeeId: emp.id,
          employeeName: emp.name,
          month: format(new Date(bonusDate), 'yyyy-MM'),
          basicSalary: salary,
          allowances: parseFloat(baseBonus.toFixed(2)),
          deductions: 0,
          advanceDeduction: 0,
          loanDeduction: 0,
          netSalary: parseFloat(baseBonus.toFixed(2)),
          paymentStatus: 'Pending',
          type: 'Bonus',
          bonusType: bonusType,
          paymentDate: bonusDate
        };
      }).filter(Boolean);

      for (const b of batch as any[]) {
        await erpService.createSalarySheet(user.companyId, b);
      }

      showNotification(`${batch.length} Festival bonuses generated successfully`);
      setActiveTab('processing');
      await loadInitialData(true);
    } catch (err) {
      showNotification('Failed to generate festival bonuses', 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED & AGGREGATED EMPLOYEE GROUPS / DEPARTMENTS ---
  const derivedEmployeeGroups = useMemo(() => {
    const list: any[] = [...employeeGroups];
    const groupNames = new Set(list.map(g => (g.name || '').trim().toLowerCase()));

    // Collect departments and roles from employees
    employees.forEach(emp => {
      const dept = (emp.department || '').trim();
      if (dept && !groupNames.has(dept.toLowerCase())) {
        groupNames.add(dept.toLowerCase());
        list.push({
          id: `dept_${dept.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: dept,
          description: `Department assigned in Employee records`,
          isDepartment: true
        });
      }
    });

    if (list.length === 0) {
      list.push({
        id: 'general_dept',
        name: 'General Staff',
        description: 'Standard staff group',
        isDepartment: true
      });
    }

    return list;
  }, [employeeGroups, employees]);

  // --- FILTERED SALARY SHEETS FOR PROCESSING VIEW ---
  const filteredSheets = useMemo(() => {
    return salarySheets.filter(s => {
      const matchMonth = s.month === selectedMonth;
      const matchStatus = statusFilter === 'all' || s.paymentStatus === statusFilter;
      const emp = employees.find(e => e.id === s.employeeId);
      
      let matchGroup = selectedGroupFilter === 'all';
      if (!matchGroup && emp) {
        if (emp.groupId === selectedGroupFilter || emp.department === selectedGroupFilter) {
          matchGroup = true;
        } else {
          const selectedGroupObj = derivedEmployeeGroups.find(g => g.id === selectedGroupFilter);
          if (selectedGroupObj && emp.department && emp.department.toLowerCase() === selectedGroupObj.name.toLowerCase()) {
            matchGroup = true;
          }
        }
      }

      const matchSearch = !searchEmployeeQuery || 
        s.employeeName?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) || 
        emp?.designation?.toLowerCase().includes(searchEmployeeQuery.toLowerCase());
      return matchMonth && matchStatus && matchGroup && matchSearch;
    });
  }, [salarySheets, selectedMonth, statusFilter, selectedGroupFilter, searchEmployeeQuery, employees, derivedEmployeeGroups]);

  // Processing summary metrics
  const totalGross = useMemo(() => filteredSheets.reduce((sum, s) => sum + (s.basicSalary + s.allowances), 0), [filteredSheets]);
  const totalDeductions = useMemo(() => filteredSheets.reduce((sum, s) => sum + (s.deductions + (s.advanceDeduction || 0) + (s.loanDeduction || 0)), 0), [filteredSheets]);
  const totalNet = useMemo(() => filteredSheets.reduce((sum, s) => sum + s.netSalary, 0), [filteredSheets]);
  const isVoucherPosted = useMemo(() => filteredSheets.length > 0 && filteredSheets.every(s => s.journalVoucherId), [filteredSheets]);

  // Bank & Cash ledgers for payment disbursement
  const bankAndCashLedgers = useMemo(() => {
    return ledgers.filter(l => 
      l.group_name?.includes('Bank') || 
      l.group_name?.includes('Cash') ||
      (l.nature === 'Asset' && (l.name.toLowerCase().includes('bank') || l.name.toLowerCase().includes('cash')))
    );
  }, [ledgers]);

  // =========================================================================
  // --- ANALYTICS DASHBOARD DATA COMPUTATION (GENUINE HISTORICAL DATA) ---
  // =========================================================================
  const analyticsMonths = useMemo(() => {
    const list: string[] = [];
    const base = new Date();
    for (let i = analyticsMonthsCount - 1; i >= 0; i--) {
      list.push(format(subMonths(base, i), 'yyyy-MM'));
    }
    return list;
  }, [analyticsMonthsCount]);

  const monthlyAnalyticsData = useMemo(() => {
    return analyticsMonths.map(mStr => {
      const monthSheets = salarySheets.filter(s => s.month === mStr);
      const gross = monthSheets.reduce((sum, s) => sum + (Number(s.basicSalary || 0) + Number(s.allowances || 0)), 0);
      const deductions = monthSheets.reduce((sum, s) => sum + (Number(s.deductions || 0) + Number(s.advanceDeduction || 0) + Number(s.loanDeduction || 0)), 0);
      const net = monthSheets.reduce((sum, s) => sum + Number(s.netSalary || 0), 0);
      const bonus = monthSheets.filter(s => s.type === 'Bonus').reduce((sum, s) => sum + Number(s.netSalary || 0), 0);
      const headcount = new Set(monthSheets.map(s => s.employeeId)).size;

      return {
        month: mStr,
        label: format(new Date(mStr + '-01'), 'MMM yy'),
        gross,
        deductions,
        net,
        bonus,
        headcount
      };
    });
  }, [analyticsMonths, salarySheets]);

  // Analytics KPI aggregates across selected period
  const analyticsKPIs = useMemo(() => {
    const totalGrossAll = monthlyAnalyticsData.reduce((sum, m) => sum + m.gross, 0);
    const totalDeductionsAll = monthlyAnalyticsData.reduce((sum, m) => sum + m.deductions, 0);
    const totalBonusAll = monthlyAnalyticsData.reduce((sum, m) => sum + m.bonus, 0);
    const totalNetAll = monthlyAnalyticsData.reduce((sum, m) => sum + m.net, 0);
    const monthsWithData = monthlyAnalyticsData.filter(m => m.headcount > 0);
    const avgMonthlyCost = monthsWithData.length > 0 ? (totalGrossAll / monthsWithData.length) : 0;
    const avgPerStaff = employees.length > 0 ? (totalNetAll / (employees.length * (monthsWithData.length || 1))) : 0;

    return {
      totalGrossAll,
      totalDeductionsAll,
      totalBonusAll,
      totalNetAll,
      avgMonthlyCost,
      avgPerStaff
    };
  }, [monthlyAnalyticsData, employees]);

  // Department cost breakdown across the analytics window
  const departmentBreakdown = useMemo(() => {
    const periodMonthsSet = new Set(analyticsMonths);
    const filteredPeriodSheets = salarySheets.filter(s => periodMonthsSet.has(s.month));
    const totalCost = filteredPeriodSheets.reduce((sum, s) => sum + Number(s.netSalary || 0), 0);

    const map = new Map<string, { name: string; amount: number; staffCount: Set<string> }>();
    
    // Initialize groups
    employeeGroups.forEach(g => {
      map.set(g.id, { name: g.name, amount: 0, staffCount: new Set() });
    });

    filteredPeriodSheets.forEach(s => {
      const emp = employees.find(e => e.id === s.employeeId);
      const gId = emp?.groupId || 'unassigned';
      const gName = employeeGroups.find(g => g.id === gId)?.name || emp?.department || 'General Staff';
      
      if (!map.has(gId)) {
        map.set(gId, { name: gName, amount: 0, staffCount: new Set() });
      }
      const entry = map.get(gId)!;
      entry.amount += Number(s.netSalary || 0);
      if (s.employeeId) entry.staffCount.add(s.employeeId);
    });

    return Array.from(map.values())
      .filter(item => item.amount > 0 || item.staffCount.size > 0)
      .map(item => ({
        ...item,
        percentage: totalCost > 0 ? ((item.amount / totalCost) * 100) : 0,
        staffSize: item.staffCount.size
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [analyticsMonths, salarySheets, employeeGroups, employees]);

  // Max value for bar chart height scaling
  const maxChartValue = useMemo(() => {
    const maxVal = Math.max(...monthlyAnalyticsData.map(m => Math.max(m.gross, m.net, m.deductions, m.bonus, 1000)));
    return maxVal * 1.15; // 15% headroom
  }, [monthlyAnalyticsData]);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {/* 1. PERMANENT / FIXED PAGE HEADER (Cleaned up, no verbose subtitles, no redundant title) */}
      <div className="shrink-0 bg-card border-b border-border px-6 py-3.5 z-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* High-Contrast, Highlighted, Executive Menu Tabs */}
          <div className="flex items-center gap-1 p-1 bg-muted/80 dark:bg-muted/40 rounded-xl border border-border shadow-xs overflow-x-auto scrollbar-none flex-1 max-w-full">
            <button
              onClick={() => setActiveTab('analytics')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'analytics' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <BarChart3 className="w-3.5 h-3.5 shrink-0" />
              <span>Analytics Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('processing')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'processing' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <Calculator className="w-3.5 h-3.5 shrink-0" />
              <span>Salary Processing</span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'attendance' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Attendance Register</span>
            </button>

            <button
              onClick={() => setActiveTab('structures')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'structures' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span>Salary Structures</span>
            </button>

            <button
              onClick={() => setActiveTab('components')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'components' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <Coins className="w-3.5 h-3.5 shrink-0" />
              <span>Pay Components</span>
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'groups' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Employee Groups</span>
            </button>

            <button
              onClick={() => setActiveTab('advances')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'advances' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <HandCoins className="w-3.5 h-3.5 shrink-0" />
              <span>Advances & Loans</span>
            </button>

            <button
              onClick={() => setActiveTab('bonus')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'bonus' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <Gift className="w-3.5 h-3.5 shrink-0" />
              <span>Festival Bonus</span>
            </button>

            <button
              onClick={() => setActiveTab('service')}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer",
                activeTab === 'service' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              <UserCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Service & Increments</span>
            </button>
          </div>

          {/* Quick Guide & Docs Action Button */}
          <button
            onClick={() => navigate('/help?category=payroll-guide')}
            className="px-3 py-1.5 bg-muted/80 hover:bg-muted text-foreground text-xs font-semibold rounded-lg transition-colors border border-border flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Open TallyFlow Docs & Beginner Payroll Guide"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>📖 User Guide & Help</span>
          </button>
        </div>

        {/* Global Filter Bar (Month / Period Selector) */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border/60">
          <div className="flex flex-wrap items-center gap-2">
            {activeTab === 'analytics' ? (
              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border">
                <button
                  onClick={() => setAnalyticsMonthsCount(6)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                    analyticsMonthsCount === 6 ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Last 6 Months
                </button>
                <button
                  onClick={() => setAnalyticsMonthsCount(12)}
                  className={cn(
                    "px-2.5 py-1 text-xs font-semibold rounded-md transition-colors",
                    analyticsMonthsCount === 12 ? "bg-card text-foreground shadow-xs font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Last 12 Months
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Month:</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={e => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer"
                />
              </div>
            )}

            {(activeTab === 'processing' || activeTab === 'attendance' || activeTab === 'service') && (
              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border">
                <Users className="w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={selectedGroupFilter}
                  onChange={e => setSelectedGroupFilter(e.target.value)}
                  className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">All Groups / Departments</option>
                  {derivedEmployeeGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
            )}

            {(activeTab === 'processing' || activeTab === 'service') && (
              <div className="flex items-center gap-1.5 bg-muted/60 px-2.5 py-1.5 rounded-lg border border-border">
                <Search className="w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff / role..."
                  value={searchEmployeeQuery}
                  onChange={e => setSearchEmployeeQuery(e.target.value)}
                  className="bg-transparent text-xs focus:outline-none w-36"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'analytics' && (
              <button
                onClick={() => loadInitialData(true)}
                disabled={loading}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Refresh Data
              </button>
            )}

            {activeTab === 'processing' && (
              <>
                <button
                  onClick={handleCleanDuplicates}
                  disabled={loading || cleaningDuplicates}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Remove duplicate employee rows for this month"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {cleaningDuplicates ? 'Cleaning...' : 'Clean Duplicates'}
                </button>

                <button
                  onClick={handleProcessMonthlySalary}
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Auto-Calculate Monthly Payroll
                </button>

                <button
                  onClick={handlePostJournalVoucher}
                  disabled={loading || filteredSheets.length === 0 || isVoucherPosted}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer",
                    isVoucherPosted 
                      ? "bg-emerald-600/20 text-emerald-600 border border-emerald-500/30 cursor-default"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isVoucherPosted ? 'Journal Voucher Posted' : 'Post Accounting Journal'}
                </button>

                <button
                  onClick={() => setIsDisbursementModalOpen(true)}
                  disabled={loading || filteredSheets.length === 0}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Disburse Payment
                </button>
              </>
            )}

            {activeTab === 'attendance' && (
              <>
                <button
                  onClick={() => handleAutoFillAttendance(26)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border cursor-pointer"
                >
                  Auto-Fill 26 Days
                </button>
                <button
                  onClick={() => handleAutoFillAttendance(30)}
                  className="px-3 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border cursor-pointer"
                >
                  Auto-Fill 30 Days
                </button>
                <button
                  onClick={handleSaveAttendanceMatrix}
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Recalculate Payroll
                </button>
              </>
            )}

            {activeTab === 'components' && (
              <button
                onClick={() => {
                  setEditingPayHead(null);
                  setComponentForm({
                    name: '',
                    type: 'Earning',
                    calculationType: 'Fixed',
                    basePayHeadId: '',
                    percentage: '',
                    ratePerHour: '',
                    expenseLedgerId: '',
                    description: ''
                  });
                  setIsPayComponentModalOpen(true);
                }}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Pay Component
              </button>
            )}

            {activeTab === 'groups' && (
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Employee Group
              </button>
            )}

            {activeTab === 'advances' && (
              <>
                <button
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Issue Staff Advance
                </button>
                <button
                  onClick={() => setIsLoanModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Issue Employee Loan
                </button>
              </>
            )}
          </div>
        </div>

        {/* Processing Tab Financial KPI Summary */}
        {activeTab === 'processing' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/40">
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Employees Processed</span>
              <div className="text-lg font-bold tabular-nums mt-0.5">{filteredSheets.length} / {employees.length}</div>
            </div>
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Gross Compensation</span>
              <div className="text-lg font-bold tabular-nums text-foreground mt-0.5">{formatCurrency(totalGross, baseCurrencySymbol)}</div>
            </div>
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Total Deductions</span>
              <div className="text-lg font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">{formatCurrency(totalDeductions, baseCurrencySymbol)}</div>
            </div>
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold">Net Salary Payable</span>
              <div className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalNet, baseCurrencySymbol)}</div>
            </div>
          </div>
        )}
      </div>

      {/* 2. SCROLLABLE DATA SECTION WITH STICKY HEADERS */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* ========================================================================= */}
        {/* VIEW 0: PAYROLL ANALYTICS & DATA DASHBOARD (NEW TAB) */}
        {/* ========================================================================= */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Top Executive KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Gross Cost</span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums text-foreground mt-2">
                  {formatCurrency(analyticsKPIs.totalGrossAll, baseCurrencySymbol)}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Last {analyticsMonthsCount} months total gross salary
                </span>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total Deductions</span>
                  <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <TrendingDown className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-2">
                  {formatCurrency(analyticsKPIs.totalDeductionsAll, baseCurrencySymbol)}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Advances, loans & statutory deductions
                </span>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Festival Bonuses</span>
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Gift className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-2">
                  {formatCurrency(analyticsKPIs.totalBonusAll, baseCurrencySymbol)}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Festival & special compensation
                </span>
              </div>

              <div className="bg-card border border-border rounded-xl p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Net Disbursed</span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400 mt-2">
                  {formatCurrency(analyticsKPIs.totalNetAll, baseCurrencySymbol)}
                </div>
                <span className="text-[11px] text-muted-foreground mt-1 block">
                  Avg: {formatCurrency(analyticsKPIs.avgMonthlyCost, baseCurrencySymbol)}/month
                </span>
              </div>
            </div>

            {/* Main Visuals Grid: Multi-Metric Bar Chart + Department Cost Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Monthly Multi-Metric Bar Chart */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h3 className="font-bold text-sm text-foreground">Monthly Payroll Expense & Deduction Trends</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Comparative analysis of Gross Salary, Total Deductions, and Festival Bonuses
                      </p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
                        <span className="text-muted-foreground text-[11px]">Gross Salary</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-xs bg-rose-500" />
                        <span className="text-muted-foreground text-[11px]">Deductions</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
                        <span className="text-muted-foreground text-[11px]">Bonus</span>
                      </div>
                    </div>
                  </div>

                  {/* SVG Multi-Metric Bar Chart */}
                  <div className="relative mt-6 h-64 select-none">
                    <div className="absolute inset-0 flex items-end justify-between gap-2 px-2 pt-6">
                      {monthlyAnalyticsData.map((item, idx) => {
                        const grossHeight = maxChartValue > 0 ? (item.gross / maxChartValue) * 100 : 0;
                        const deductHeight = maxChartValue > 0 ? (item.deductions / maxChartValue) * 100 : 0;
                        const bonusHeight = maxChartValue > 0 ? (item.bonus / maxChartValue) * 100 : 0;

                        return (
                          <div 
                            key={idx} 
                            className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                            onMouseEnter={() => setHoveredChartMonth(item)}
                            onMouseLeave={() => setHoveredChartMonth(null)}
                          >
                            {/* Bar Columns Container */}
                            <div className="w-full flex items-end justify-center gap-1 h-48 pb-1">
                              {/* Gross Salary Bar */}
                              <div 
                                style={{ height: `${Math.max(grossHeight, 3)}%` }} 
                                className="w-2.5 sm:w-3.5 bg-indigo-500 rounded-t-xs transition-all duration-300 group-hover:bg-indigo-400 group-hover:brightness-110" 
                              />
                              {/* Deductions Bar */}
                              <div 
                                style={{ height: `${Math.max(deductHeight, item.deductions > 0 ? 3 : 0)}%` }} 
                                className="w-2.5 sm:w-3.5 bg-rose-500 rounded-t-xs transition-all duration-300 group-hover:bg-rose-400" 
                              />
                              {/* Bonus Bar */}
                              <div 
                                style={{ height: `${Math.max(bonusHeight, item.bonus > 0 ? 3 : 0)}%` }} 
                                className="w-2.5 sm:w-3.5 bg-amber-500 rounded-t-xs transition-all duration-300 group-hover:bg-amber-400" 
                              />
                            </div>

                            {/* Month Label */}
                            <span className="text-[11px] font-semibold text-muted-foreground mt-2 block tracking-tight">
                              {item.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Smooth Tooltip on Hover */}
                    {hoveredChartMonth && (
                      <div className="absolute top-2 right-4 bg-popover/95 border border-border p-3 rounded-lg shadow-lg text-xs z-30 pointer-events-none backdrop-blur-xs min-w-[180px]">
                        <div className="font-bold text-foreground border-b border-border pb-1 mb-1.5 flex justify-between">
                          <span>{hoveredChartMonth.label}</span>
                          <span className="text-[11px] text-muted-foreground">{hoveredChartMonth.headcount} Staff</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-indigo-400">
                            <span>Gross Salary:</span>
                            <span className="font-semibold tabular-nums">{formatCurrency(hoveredChartMonth.gross, baseCurrencySymbol)}</span>
                          </div>
                          <div className="flex justify-between text-rose-400">
                            <span>Deductions:</span>
                            <span className="font-semibold tabular-nums">-{formatCurrency(hoveredChartMonth.deductions, baseCurrencySymbol)}</span>
                          </div>
                          {hoveredChartMonth.bonus > 0 && (
                            <div className="flex justify-between text-amber-400">
                              <span>Festival Bonus:</span>
                              <span className="font-semibold tabular-nums">{formatCurrency(hoveredChartMonth.bonus, baseCurrencySymbol)}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-emerald-400 pt-1 border-t border-border/80">
                            <span>Net Disbursed:</span>
                            <span className="tabular-nums">{formatCurrency(hoveredChartMonth.net, baseCurrencySymbol)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-muted-foreground" />
                    Hover over bars to view detailed monthly breakdown
                  </span>
                  <span className="font-mono text-[11px]">Real Payroll Ledger Data</span>
                </div>
              </div>

              {/* Right Col: Department Cost Distribution */}
              <div className="bg-card border border-border rounded-xl p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-foreground pb-2 border-b border-border">
                    Department Cost Distribution
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">
                    Expense allocation by employee group over the selected window
                  </p>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {departmentBreakdown.length === 0 ? (
                      <div className="text-xs text-muted-foreground text-center py-10 italic">
                        No department expense records available
                      </div>
                    ) : (
                      departmentBreakdown.map((dept, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-foreground truncate max-w-[140px]">{dept.name}</span>
                            <span className="tabular-nums font-bold text-foreground">
                              {formatCurrency(dept.amount, baseCurrencySymbol)}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden flex">
                            <div 
                              style={{ width: `${Math.min(100, Math.max(dept.percentage, 4))}%` }} 
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                idx === 0 ? "bg-indigo-500" : idx === 1 ? "bg-emerald-500" : idx === 2 ? "bg-amber-500" : "bg-primary"
                              )}
                            />
                          </div>
                          <div className="flex justify-between text-[10px] text-muted-foreground">
                            <span>{dept.staffSize} Staff Members</span>
                            <span className="font-semibold">{dept.percentage.toFixed(1)}% of total</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground flex justify-between">
                  <span>Groups Evaluated:</span>
                  <span className="font-bold text-foreground">{departmentBreakdown.length} Active Departments</span>
                </div>
              </div>
            </div>

            {/* Historical Month-by-Month Summary Table */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Monthly Historical Payroll Summary Register</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Aggregated executive record of compensation disbursements across the last {analyticsMonthsCount} months
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-muted/80 backdrop-blur-xs text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Month</th>
                      <th className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>Active Headcount</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Gross Salary</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Total Deductions</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Festival Bonus</th>
                      <th className="py-2.5 px-4 text-right font-bold" style={{ verticalAlign: 'middle' }}>Net Disbursed</th>
                      <th className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {monthlyAnalyticsData.map((m, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="py-2.5 px-4 font-bold text-foreground" style={{ verticalAlign: 'middle' }}>
                          {format(new Date(m.month + '-01'), 'MMMM yyyy')}
                        </td>
                        <td className="py-2.5 px-4 text-center tabular-nums" style={{ verticalAlign: 'middle' }}>
                          <span className="font-semibold text-foreground">{m.headcount}</span> staff
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-foreground font-medium" style={{ verticalAlign: 'middle' }}>
                          {formatCurrency(m.gross, baseCurrencySymbol)}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-rose-500" style={{ verticalAlign: 'middle' }}>
                          {m.deductions > 0 ? `-${formatCurrency(m.deductions, baseCurrencySymbol)}` : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums text-amber-500" style={{ verticalAlign: 'middle' }}>
                          {m.bonus > 0 ? formatCurrency(m.bonus, baseCurrencySymbol) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-sm" style={{ verticalAlign: 'middle' }}>
                          {formatCurrency(m.net, baseCurrencySymbol)}
                        </td>
                        <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                          <button
                            onClick={() => {
                              setSelectedMonth(m.month);
                              setActiveTab('processing');
                            }}
                            className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                          >
                            View Sheets →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 1: SALARY PROCESSING TABLE */}
        {/* ========================================================================= */}
        {activeTab === 'processing' && (
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border z-10">
                  <tr>
                    <th className="py-3 px-4 text-center w-12" style={{ verticalAlign: 'middle' }}>#</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Staff / Employee</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Group / Role</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Days Worked</th>
                    <th className="py-3 px-4 text-right" style={{ verticalAlign: 'middle' }}>Basic Pay</th>
                    <th className="py-3 px-4 text-right" style={{ verticalAlign: 'middle' }}>Allowances & OT</th>
                    <th className="py-3 px-4 text-right" style={{ verticalAlign: 'middle' }}>Deductions</th>
                    <th className="py-3 px-4 text-right" style={{ verticalAlign: 'middle' }}>Adv / Loan</th>
                    <th className="py-3 px-4 text-right font-bold" style={{ verticalAlign: 'middle' }}>Net Payable</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Status</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Journal Link</th>
                    <th className="py-3 px-4 text-center w-28" style={{ verticalAlign: 'middle' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredSheets.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        <p className="font-semibold text-sm">No salary records generated for {selectedMonth}</p>
                        <p className="text-xs text-muted-foreground mt-1">Click "Auto-Calculate Monthly Payroll" to compute compensation for active staff.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredSheets.map((sheet, index) => {
                      const emp = employees.find(e => e.id === sheet.employeeId);
                      const group = employeeGroups.find(g => g.id === emp?.groupId);
                      return (
                        <tr key={sheet.id || index} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 text-center text-muted-foreground tabular-nums" style={{ verticalAlign: 'middle' }}>
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>
                            <div>{sheet.employeeName}</div>
                            <div className="text-[11px] text-muted-foreground font-normal">{emp?.employee_id || emp?.id?.substring(0, 8)}</div>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                            <div>{group?.name || emp?.department || '—'}</div>
                            <div className="text-[11px] text-muted-foreground">{emp?.designation || 'Staff'}</div>
                          </td>
                          <td className="py-2.5 px-4 text-center tabular-nums" style={{ verticalAlign: 'middle' }}>
                            <span className="font-semibold">{sheet.presentDays ?? 26}</span>
                            <span className="text-muted-foreground"> / {sheet.totalDays ?? 30}</span>
                            {sheet.overtimeHours > 0 && (
                              <div className="text-[10px] text-indigo-500 font-medium">+{sheet.overtimeHours}h OT</div>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(sheet.basicSalary, baseCurrencySymbol)}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-foreground font-medium" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(sheet.allowances, baseCurrencySymbol)}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-rose-500" style={{ verticalAlign: 'middle' }}>
                            {sheet.deductions > 0 ? `-${formatCurrency(sheet.deductions, baseCurrencySymbol)}` : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-rose-500" style={{ verticalAlign: 'middle' }}>
                            {(sheet.advanceDeduction + sheet.loanDeduction) > 0 ? (
                              `-${formatCurrency(sheet.advanceDeduction + sheet.loanDeduction, baseCurrencySymbol)}`
                            ) : '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums font-bold text-foreground text-sm" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(sheet.netSalary, baseCurrencySymbol)}
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <span className={cn(
                              "text-[11px] font-semibold px-2 py-0.5 rounded-md inline-block",
                              sheet.paymentStatus === 'Paid' 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            )}>
                              {sheet.paymentStatus || 'Pending'}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center tabular-nums" style={{ verticalAlign: 'middle' }}>
                            {sheet.journalVoucherId ? (
                              <span className="text-[11px] font-mono text-indigo-500 font-semibold">
                                #{sheet.journalVoucherNo || sheet.journalVoucherId.substring(0, 6)}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Unposted</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setPayslipData({ ...sheet, employee: emp });
                                  setIsPayslipModalOpen(true);
                                }}
                                title="Print / View Payslip"
                                className="p-1 text-muted-foreground hover:text-foreground transition-colors hover:bg-muted rounded cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSalarySheetRow(sheet.id, sheet.employeeName)}
                                title="Delete this employee salary row"
                                className="p-1 text-rose-500 hover:text-rose-600 transition-colors hover:bg-rose-500/10 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: ATTENDANCE & OVERTIME REGISTER MATRIX */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm">Monthly Attendance & Production Overtime Matrix</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Record paid attendance, leave without pay (LWP), and overtime production hours for {selectedMonth}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAutoFillAttendance(26)}
                  className="px-2.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border cursor-pointer"
                >
                  Auto-Fill 26 Days
                </button>
                <button
                  onClick={() => handleAutoFillAttendance(30)}
                  className="px-2.5 py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg transition-colors border border-border cursor-pointer"
                >
                  Auto-Fill 30 Days
                </button>
                <button
                  onClick={handleSaveAttendanceMatrix}
                  disabled={loading}
                  className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Save & Recalculate Payroll
                </button>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border z-10">
                  <tr>
                    <th className="py-3 px-4 text-center w-12" style={{ verticalAlign: 'middle' }}>#</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Staff / Employee</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Department</th>
                    <th className="py-3 px-4 text-center w-36" style={{ verticalAlign: 'middle' }}>Present (Days)</th>
                    <th className="py-3 px-4 text-center w-36" style={{ verticalAlign: 'middle' }}>Leave / LWP (Days)</th>
                    <th className="py-3 px-4 text-center w-36" style={{ verticalAlign: 'middle' }}>Overtime (Hours)</th>
                    <th className="py-3 px-4 text-right" style={{ verticalAlign: 'middle' }}>Effective Paid Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No employees found. Please add employees in Master first.
                      </td>
                    </tr>
                  ) : (
                    employees.map((emp, index) => {
                      const att = monthlyAttendanceMap[emp.id] || { presentDays: 26, lwpDays: 0, overtimeHours: 0 };
                      const group = employeeGroups.find(g => g.id === emp.groupId);
                      return (
                        <tr key={emp.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 text-center text-muted-foreground tabular-nums" style={{ verticalAlign: 'middle' }}>
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>
                            <div>{emp.name}</div>
                            <div className="text-[11px] text-muted-foreground font-normal">{emp.designation || 'Staff'}</div>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                            {group?.name || emp.department || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <input
                              type="number"
                              min="0"
                              max="31"
                              value={att.presentDays}
                              onChange={e => handleAttendanceChange(emp.id, 'presentDays', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-center bg-muted/60 border border-border rounded font-bold tabular-nums text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <input
                              type="number"
                              min="0"
                              max="31"
                              value={att.lwpDays}
                              onChange={e => handleAttendanceChange(emp.id, 'lwpDays', parseInt(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-center bg-muted/60 border border-border rounded font-bold tabular-nums text-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <input
                              type="number"
                              min="0"
                              step="0.5"
                              value={att.overtimeHours}
                              onChange={e => handleAttendanceChange(emp.id, 'overtimeHours', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-center bg-muted/60 border border-border rounded font-bold tabular-nums text-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-2.5 px-4 text-right tabular-nums text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                            <span className="font-semibold text-foreground">{att.presentDays}</span> / 30 Days (
                            {((att.presentDays / 30) * 100).toFixed(0)}%)
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: SALARY STRUCTURES & SCALES */}
        {/* ========================================================================= */}
        {activeTab === 'structures' && (
          <div className="space-y-6">
            {/* Group-Level Salary Structures */}
            <div className="bg-card border border-border rounded-xl shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm">Department & Employee Group Default Pay Structures</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Define baseline earning packages and deduction formulas inherited by all members of the group
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employeeGroups.length === 0 ? (
                  <div className="col-span-full py-8 text-center text-muted-foreground text-xs">
                    No Employee Groups created yet. Please create groups in the "Employee Groups" tab.
                  </div>
                ) : (
                  employeeGroups.map(group => {
                    const groupStructures = salaryStructures.filter(s => s.targetType === 'Group' && s.groupId === group.id);
                    const memberCount = employees.filter(e => e.groupId === group.id).length;
                    return (
                      <div key={group.id} className="border border-border rounded-lg p-4 bg-muted/20 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <h4 className="font-bold text-sm text-foreground">{group.name}</h4>
                            <span className="text-[11px] text-muted-foreground">{memberCount} staff</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{group.description || 'Standard department pay scale'}</p>

                          <div className="mt-3 pt-3 border-t border-border/60 space-y-1.5">
                            {groupStructures.length === 0 ? (
                              <div className="text-xs text-muted-foreground italic">No pay components assigned yet</div>
                            ) : (
                              groupStructures.map((st, idx) => (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground truncate">{st.payHeadName}</span>
                                  <span className="font-semibold tabular-nums text-foreground">
                                    {st.percentage ? `${st.percentage}% of Basic` : formatCurrency(st.amount, baseCurrencySymbol)}
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenStructureModal('Group', group.id)}
                          className="mt-4 w-full py-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-md border border-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          Configure Group Structure
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Individual Employee Structure Overrides */}
            <div className="bg-card border border-border rounded-xl shadow-xs p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-sm">Individual Employee Custom Pay Scales</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Override standard department structures for individual staff members with special packages
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Employee</th>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Department</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Base Salary</th>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Configured Components</th>
                      <th className="py-2.5 px-4 text-center w-28" style={{ verticalAlign: 'middle' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {employees.map(emp => {
                      const empStructures = salaryStructures.filter(s => (s.targetType === 'Employee' && s.employeeId === emp.id) || (s.employeeId === emp.id));
                      const group = employeeGroups.find(g => g.id === emp.groupId);
                      return (
                        <tr key={emp.id} className="hover:bg-muted/30">
                          <td className="py-2.5 px-4 font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>
                            <div>{emp.name}</div>
                            <div className="text-[11px] text-muted-foreground font-normal">{emp.designation || 'Staff'}</div>
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                            {group?.name || emp.department || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold tabular-nums text-foreground" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(Number(emp.salary || emp.basicSalary || 0), baseCurrencySymbol)}
                          </td>
                          <td className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>
                            {empStructures.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {empStructures.map((st, i) => (
                                  <span key={i} className="text-[11px] bg-muted px-2 py-0.5 rounded border border-border">
                                    {st.payHeadName}: {st.percentage ? `${st.percentage}%` : formatCurrency(st.amount, baseCurrencySymbol)}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic">Inherits from Group</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <button
                              onClick={() => handleOpenStructureModal('Employee', emp.id)}
                              className="px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/10 rounded transition-colors cursor-pointer"
                            >
                              Edit Scale
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: PAY COMPONENTS MASTER */}
        {/* ========================================================================= */}
        {activeTab === 'components' && (
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Pay Components (Earnings & Deductions Master)</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Configure compensation heads, calculation basis (Fixed, Attendance Pro-rata, Percentage, Overtime), and General Ledger linkage
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-muted/60 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border">
                  <tr>
                    <th className="py-3 px-4 text-center w-12" style={{ verticalAlign: 'middle' }}>#</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Component Name</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Type</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Calculation Method</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Calculation Detail</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Mapped Expense Ledger</th>
                    <th className="py-3 px-4 text-center w-24" style={{ verticalAlign: 'middle' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {payHeads.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-muted-foreground">
                        No pay components created. Click "Add Pay Component" to configure earnings and deductions.
                      </td>
                    </tr>
                  ) : (
                    payHeads.map((ph, index) => {
                      const linkedLedger = ledgers.find(l => l.id === ph.expenseLedgerId);
                      return (
                        <tr key={ph.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 px-4 text-center text-muted-foreground tabular-nums" style={{ verticalAlign: 'middle' }}>
                            {index + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-foreground" style={{ verticalAlign: 'middle' }}>
                            {ph.name}
                            {ph.description && <div className="text-[11px] text-muted-foreground font-normal">{ph.description}</div>}
                          </td>
                          <td className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>
                            <span className={cn(
                              "text-[11px] font-semibold px-2 py-0.5 rounded",
                              ph.type === 'Earning' 
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                                : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                            )}>
                              {ph.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-4 font-medium text-foreground" style={{ verticalAlign: 'middle' }}>
                            {ph.calculationType}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                            {ph.calculationType === 'Percentage' && ph.percentage ? (
                              `${ph.percentage}% of Base`
                            ) : ph.calculationType === 'On Overtime' ? (
                              ph.ratePerHour ? `${formatCurrency(ph.ratePerHour, baseCurrencySymbol)}/hr` : 'Formula standard'
                            ) : (
                              'Fixed / Attendance proportional'
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                            {linkedLedger?.name || 'Salaries & Wages (Default)'}
                          </td>
                          <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingPayHead(ph);
                                  setComponentForm({
                                    name: ph.name || '',
                                    type: ph.type || 'Earning',
                                    calculationType: ph.calculationType || 'Fixed',
                                    basePayHeadId: ph.basePayHeadId || '',
                                    percentage: ph.percentage?.toString() || '',
                                    ratePerHour: ph.ratePerHour?.toString() || '',
                                    expenseLedgerId: ph.expenseLedgerId || '',
                                    description: ph.description || ''
                                  });
                                  setIsPayComponentModalOpen(true);
                                }}
                                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeletePayHead(ph.id)}
                                className="p-1 text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: EMPLOYEE GROUPS & DEPARTMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'groups' && (
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Employee Groups & Departments</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Organize your organization's workforce into functional departments to streamline compensation assignment
                </p>
              </div>
              <button
                onClick={() => setIsGroupModalOpen(true)}
                className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create New Group
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
              {derivedEmployeeGroups.map(group => {
                const members = employees.filter(e => 
                  e.groupId === group.id || 
                  (e.department && e.department.toLowerCase() === group.name.toLowerCase()) ||
                  (!e.department && !e.groupId && group.name.toLowerCase().includes('general'))
                );

                return (
                  <div key={group.id} className="border border-border rounded-lg p-4 bg-muted/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-foreground">{group.name}</h4>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded">
                          {members.length} Staff
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5">{group.description || 'Department unit from Employee records'}</p>
                      
                      {/* Member Names Tags */}
                      {members.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1">
                          {members.slice(0, 4).map(m => (
                            <span key={m.id} className="text-[10px] bg-background border border-border px-2 py-0.5 rounded text-muted-foreground font-medium">
                              {m.name}
                            </span>
                          ))}
                          {members.length > 4 && (
                            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-semibold">
                              +{members.length - 4} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">Department Unit</span>
                      <button
                        onClick={() => handleOpenStructureModal('Group', group.id)}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        Set Pay Scale →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 6: ADVANCES & LOANS */}
        {/* ========================================================================= */}
        {activeTab === 'advances' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Advances Column */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Staff Salary Advances</h3>
                  <p className="text-xs text-muted-foreground">Temporary salary advances to be deducted in monthly payroll</p>
                </div>
                <button
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="px-2.5 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  New Advance
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold text-[11px] uppercase border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Staff</th>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Date</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Amount</th>
                      <th className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>Status</th>
                      <th className="py-2.5 px-4 text-center w-20" style={{ verticalAlign: 'middle' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {advances.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No active advances</td></tr>
                    ) : (
                      advances.map(a => (
                        <tr key={a.id} className="hover:bg-muted/30">
                          <td className="py-2 px-4 font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>{a.employeeName}</td>
                          <td className="py-2 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>{a.date}</td>
                          <td className="py-2 px-4 text-right font-bold tabular-nums text-foreground" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(a.amount, baseCurrencySymbol)}
                          </td>
                          <td className="py-2 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <span className={cn(
                              "text-[10px] font-semibold px-2 py-0.5 rounded",
                              a.status === 'Pending' ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                            )}>
                              {a.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleToggleAdvanceStatus(a)}
                                title={a.status === 'Pending' ? 'Mark as Settled / Recovered' : 'Mark as Pending'}
                                className={cn(
                                  "p-1 rounded cursor-pointer transition-colors",
                                  a.status === 'Pending' 
                                    ? "text-emerald-600 hover:bg-emerald-500/10" 
                                    : "text-amber-600 hover:bg-amber-500/10"
                                )}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAdvance(a.id)}
                                title="Delete advance record"
                                className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Loans Column */}
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm">Long-term Staff Loans & EMI</h3>
                  <p className="text-xs text-muted-foreground">Structured loans automatically amortized across monthly payroll runs</p>
                </div>
                <button
                  onClick={() => setIsLoanModalOpen(true)}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  New Loan
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/60 text-muted-foreground font-semibold text-[11px] uppercase border-b border-border">
                    <tr>
                      <th className="py-2.5 px-4" style={{ verticalAlign: 'middle' }}>Staff</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Total Loan</th>
                      <th className="py-2.5 px-4 text-right" style={{ verticalAlign: 'middle' }}>Monthly EMI</th>
                      <th className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>Status</th>
                      <th className="py-2.5 px-4 text-center w-16" style={{ verticalAlign: 'middle' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loans.length === 0 ? (
                      <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No active employee loans</td></tr>
                    ) : (
                      loans.map(l => (
                        <tr key={l.id} className="hover:bg-muted/30">
                          <td className="py-2 px-4 font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>{l.employeeName}</td>
                          <td className="py-2 px-4 text-right font-bold tabular-nums text-foreground" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(l.amount, baseCurrencySymbol)}
                          </td>
                          <td className="py-2 px-4 text-right tabular-nums text-rose-500 font-semibold" style={{ verticalAlign: 'middle' }}>
                            {formatCurrency(l.monthlyEMI, baseCurrencySymbol)}/mo
                          </td>
                          <td className="py-2 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500">
                              {l.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                            <button
                              onClick={() => handleDeleteLoan(l.id)}
                              title="Delete loan record"
                              className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 7: FESTIVAL BONUS */}
        {/* ========================================================================= */}
        {activeTab === 'bonus' && (
          <div className="max-w-2xl mx-auto bg-card border border-border rounded-xl shadow-xs p-6">
            <h3 className="font-bold text-base text-foreground">Festival Bonus Generation Engine</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Automated disbursement for religious and corporate festivals (e.g. Eid, Puja, New Year) with tenure-based pro-rata computation
            </p>

            <div className="space-y-4 mt-6">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Festival / Occasion Name</label>
                <input
                  type="text"
                  value={bonusType}
                  onChange={e => setBonusType(e.target.value)}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                  placeholder="e.g. Eid-ul-Fitr, Eid-ul-Adha, Durga Puja"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Calculation Basis</label>
                  <select
                    value={bonusBasis}
                    onChange={e => setBonusBasis(e.target.value as any)}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="Full">100% of Basic Salary</option>
                    <option value="Half">50% of Basic Salary</option>
                    <option value="Pro-rata">Pro-rata (Tenure proportional for &lt; 1 yr)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Effective Application Date</label>
                  <input
                    type="date"
                    value={bonusDate}
                    onChange={e => setBonusDate(e.target.value)}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border flex justify-end">
                <button
                  onClick={handleGenerateBonuses}
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate Festival Bonus Batch
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 8: EMPLOYEE SERVICE, SALARY INCREMENTS & HISTORY */}
        {/* ========================================================================= */}
        {activeTab === 'service' && (
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-sm">Employee Service Profiles & Salary Increment Logs</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage employee joining dates, resignation status, and record salary increments with full audit trail
                </p>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-xs text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border z-10">
                  <tr>
                    <th className="py-3 px-4 text-center w-12" style={{ verticalAlign: 'middle' }}>#</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Staff / Employee</th>
                    <th className="py-3 px-4" style={{ verticalAlign: 'middle' }}>Department</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Joining Date</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Resignation Date</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Status</th>
                    <th className="py-3 px-4 text-right" style={{ verticalAlign: 'middle' }}>Current Basic Pay</th>
                    <th className="py-3 px-4 text-center" style={{ verticalAlign: 'middle' }}>Increments</th>
                    <th className="py-3 px-4 text-center w-48" style={{ verticalAlign: 'middle' }}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {employees.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted-foreground">
                        No active employees found.
                      </td>
                    </tr>
                  ) : (
                    employees
                      .filter(emp => {
                        const matchGroup = selectedGroupFilter === 'all' || 
                          emp.groupId === selectedGroupFilter || 
                          emp.department === selectedGroupFilter ||
                          (derivedEmployeeGroups.find(g => g.id === selectedGroupFilter)?.name?.toLowerCase() === emp.department?.toLowerCase());
                        const matchSearch = !searchEmployeeQuery || 
                          emp.name?.toLowerCase().includes(searchEmployeeQuery.toLowerCase()) || 
                          emp.designation?.toLowerCase().includes(searchEmployeeQuery.toLowerCase());
                        return matchGroup && matchSearch;
                      })
                      .map((emp, idx) => {
                        const increments = Array.isArray(emp.salaryIncrements) ? emp.salaryIncrements : [];
                        const group = derivedEmployeeGroups.find(g => g.id === emp.groupId || g.name?.toLowerCase() === emp.department?.toLowerCase());
                        const basicSalaryVal = Number(emp.salary || emp.basicSalary || 0);

                        return (
                          <tr key={emp.id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="py-2.5 px-4 text-center text-muted-foreground tabular-nums" style={{ verticalAlign: 'middle' }}>
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-4 font-semibold text-foreground" style={{ verticalAlign: 'middle' }}>
                              <div>{emp.name}</div>
                              <div className="text-[11px] text-muted-foreground font-normal">{emp.designation || 'Staff'}</div>
                            </td>
                            <td className="py-2.5 px-4 text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                              {group?.name || emp.department || '—'}
                            </td>
                            <td className="py-2.5 px-4 text-center tabular-nums text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                              {emp.joining_date || emp.joiningDate || '—'}
                            </td>
                            <td className="py-2.5 px-4 text-center tabular-nums text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                              {emp.resignation_date ? (
                                <span className="text-rose-500 font-semibold">{emp.resignation_date}</span>
                              ) : (
                                <span className="text-muted-foreground/60">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                              <span className={cn(
                                "text-[10px] font-semibold px-2 py-0.5 rounded",
                                emp.status === 'Resigned' ? "bg-rose-500/10 text-rose-500" :
                                emp.status === 'On Leave' ? "bg-amber-500/10 text-amber-500" :
                                "bg-emerald-500/10 text-emerald-600"
                              )}>
                                {emp.status || 'Active'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold tabular-nums text-foreground" style={{ verticalAlign: 'middle' }}>
                              {formatCurrency(basicSalaryVal, baseCurrencySymbol)}
                            </td>
                            <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                              <span className="text-[11px] font-semibold bg-muted px-2 py-0.5 rounded text-foreground">
                                {increments.length} logged
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-center" style={{ verticalAlign: 'middle' }}>
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => handleOpenIncrementModal(emp)}
                                  className="px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold rounded flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Add Salary Increment"
                                >
                                  <TrendingUp className="w-3 h-3" />
                                  <span>Increment</span>
                                </button>
                                <button
                                  onClick={() => handleOpenServiceHistoryModal(emp)}
                                  className="px-2 py-1 bg-muted hover:bg-muted/80 text-foreground text-[11px] font-semibold rounded flex items-center gap-1 cursor-pointer transition-colors border border-border"
                                  title="View Service Profile & Increment Timeline"
                                >
                                  <History className="w-3 h-3" />
                                  <span>History</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 3. MODALS */}

      {/* MODAL A: PAY COMPONENT CONFIGURATION */}
      {isPayComponentModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base">
                {editingPayHead ? 'Edit Pay Component' : 'Add Pay Component'}
              </h3>
              <button onClick={() => setIsPayComponentModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePayComponent} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Component Name</label>
                <input
                  type="text"
                  required
                  value={componentForm.name}
                  onChange={e => setComponentForm({ ...componentForm, name: e.target.value })}
                  placeholder="e.g. House Rent, Medical Allowance, Provident Fund"
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Component Type</label>
                  <select
                    value={componentForm.type}
                    onChange={e => setComponentForm({ ...componentForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="Earning">Earning (আয়)</option>
                    <option value="Deduction">Deduction (কর্তন)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Calculation Method</label>
                  <select
                    value={componentForm.calculationType}
                    onChange={e => setComponentForm({ ...componentForm, calculationType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="Fixed">Fixed / Flat Amount</option>
                    <option value="On Attendance">On Attendance (Pro-rata)</option>
                    <option value="Percentage">Percentage (% of Basic)</option>
                    <option value="On Overtime">On Overtime (Hourly)</option>
                  </select>
                </div>
              </div>

              {componentForm.calculationType === 'Percentage' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Percentage Rate (%)</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={componentForm.percentage}
                      onChange={e => setComponentForm({ ...componentForm, percentage: e.target.value })}
                      placeholder="e.g. 50 (for 50% of Basic)"
                      className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none font-bold"
                    />
                    <Percent className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-2.5" />
                  </div>
                </div>
              )}

              {componentForm.calculationType === 'On Overtime' && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Hourly Overtime Rate</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      value={componentForm.ratePerHour}
                      onChange={e => setComponentForm({ ...componentForm, ratePerHour: e.target.value })}
                      placeholder="Leave blank for automatic 1.5x basic"
                      className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none font-bold"
                    />
                    <Timer className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-2.5" />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Mapped Accounting Ledger</label>
                <select
                  value={componentForm.expenseLedgerId}
                  onChange={e => setComponentForm({ ...componentForm, expenseLedgerId: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-medium focus:outline-none"
                >
                  <option value="">Salaries & Wages (Default Expense)</option>
                  {ledgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsPayComponentModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                >
                  Save Component
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL B: EMPLOYEE GROUP MODAL */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base">Create Employee Group</h3>
              <button onClick={() => setIsGroupModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveGroup} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Group / Department Name</label>
                <input
                  type="text"
                  required
                  value={groupForm.name}
                  onChange={e => setGroupForm({ ...groupForm, name: e.target.value })}
                  placeholder="e.g. Sales, Production, Accounts"
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={groupForm.description}
                  onChange={e => setGroupForm({ ...groupForm, description: e.target.value })}
                  placeholder="Optional notes or department roles"
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsGroupModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL C: CONFIGURE SALARY STRUCTURE */}
      {isStructureModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <h3 className="font-bold text-base">
                  Configure Salary Structure ({structureTargetType})
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assign pay components and rate formulas to this {structureTargetType.toLowerCase()}
                </p>
              </div>
              <button onClick={() => setIsStructureModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-1">
              {payHeads.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No pay components configured. Please add components in the "Pay Components" tab first.
                </div>
              ) : (
                payHeads.map(ph => {
                  const existingEntry = structureEntries.find(e => e.payHeadId === ph.id);
                  const isChecked = Boolean(existingEntry);

                  return (
                    <div key={ph.id} className="p-3 border border-border rounded-lg bg-muted/20 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={e => {
                            if (e.target.checked) {
                              setStructureEntries([...structureEntries, { payHeadId: ph.id, amount: 0, percentage: ph.percentage || 0 }]);
                            } else {
                              setStructureEntries(structureEntries.filter(entry => entry.payHeadId !== ph.id));
                            }
                          }}
                          className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                        />
                        <div>
                          <span className="font-semibold text-xs text-foreground block">{ph.name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {ph.type} · {ph.calculationType}
                          </span>
                        </div>
                      </div>

                      {isChecked && (
                        <div className="flex items-center gap-2">
                          {ph.calculationType === 'Percentage' ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={existingEntry?.percentage ?? ph.percentage ?? 0}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setStructureEntries(structureEntries.map(entry => 
                                    entry.payHeadId === ph.id ? { ...entry, percentage: val } : entry
                                  ));
                                }}
                                className="w-20 px-2 py-1 text-right bg-background border border-border rounded text-xs font-bold tabular-nums"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground">{baseCurrencySymbol}</span>
                              <input
                                type="number"
                                step="0.01"
                                value={existingEntry?.amount ?? 0}
                                onChange={e => {
                                  const val = parseFloat(e.target.value) || 0;
                                  setStructureEntries(structureEntries.map(entry => 
                                    entry.payHeadId === ph.id ? { ...entry, amount: val } : entry
                                  ));
                                }}
                                placeholder="Amount"
                                className="w-24 px-2 py-1 text-right bg-background border border-border rounded text-xs font-bold tabular-nums"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
              <button
                type="button"
                onClick={() => setIsStructureModalOpen(false)}
                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStructure}
                disabled={loading}
                className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
              >
                Save Structure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL D: DISBURSEMENT PAYMENT */}
      {isDisbursementModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base">Disburse Salary Payment</h3>
              <button onClick={() => setIsDisbursementModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDisbursementSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Disbursement Date</label>
                <input
                  type="date"
                  required
                  value={disbursementForm.paymentDate}
                  onChange={e => setDisbursementForm({ ...disbursementForm, paymentDate: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Pay From (Bank / Cash Account)</label>
                <select
                  required
                  value={disbursementForm.paymentLedgerId}
                  onChange={e => setDisbursementForm({ ...disbursementForm, paymentLedgerId: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="">Select Cash or Bank Account</option>
                  {bankAndCashLedgers.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.group_name})</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Total Net Disbursement:</span>
                  <span className="font-bold text-foreground tabular-nums">{formatCurrency(totalNet, baseCurrencySymbol)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsDisbursementModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Confirm & Post Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL E: PAYSLIP PREVIEW & PRINT */}
      {isPayslipModalOpen && payslipData && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base">Employee Payslip</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Payslip
                </button>
                <button onClick={() => setIsPayslipModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div id="formal-payslip-print" className="mt-6 p-6 border border-border rounded-lg bg-card text-foreground space-y-6">
              <div className="text-center pb-4 border-b border-border">
                <h2 className="text-lg font-bold tracking-tight uppercase">Monthly Salary & Compensation Statement</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Pay Period: {payslipData.month}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-4 rounded-lg border border-border">
                <div>
                  <div className="text-muted-foreground">Employee Name: <span className="font-bold text-foreground">{payslipData.employeeName}</span></div>
                  <div className="text-muted-foreground mt-1">Designation: <span className="font-semibold text-foreground">{payslipData.employee?.designation || 'Staff'}</span></div>
                  <div className="text-muted-foreground mt-1">Department: <span className="font-semibold text-foreground">{payslipData.employee?.department || '—'}</span></div>
                </div>
                <div>
                  <div className="text-muted-foreground">Days Worked: <span className="font-bold text-foreground tabular-nums">{payslipData.presentDays ?? 26} / {payslipData.totalDays ?? 30} Days</span></div>
                  {payslipData.overtimeHours > 0 && (
                    <div className="text-muted-foreground mt-1">Overtime: <span className="font-semibold text-foreground tabular-nums">{payslipData.overtimeHours} Hours</span></div>
                  )}
                  <div className="text-muted-foreground mt-1">Payment Status: <span className="font-bold text-emerald-600">{payslipData.paymentStatus || 'Pending'}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 font-bold text-xs uppercase text-emerald-600 dark:text-emerald-400">
                    Earnings
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Basic Pay</span>
                      <span className="font-semibold tabular-nums">{formatCurrency(payslipData.basicSalary, baseCurrencySymbol)}</span>
                    </div>
                    {payslipData.payBreakdown?.filter((b: any) => b.type === 'Earning').map((b: any, i: number) => (
                      <div key={i} className="flex justify-between">
                        <span className="text-muted-foreground">{b.payHeadName}</span>
                        <span className="font-semibold tabular-nums">{formatCurrency(b.amount, baseCurrencySymbol)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border flex justify-between font-bold">
                      <span>Total Gross</span>
                      <span className="tabular-nums">{formatCurrency(payslipData.basicSalary + payslipData.allowances, baseCurrencySymbol)}</span>
                    </div>
                  </div>
                </div>

                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="bg-muted px-3 py-2 font-bold text-xs uppercase text-rose-600 dark:text-rose-400">
                    Deductions
                  </div>
                  <div className="p-3 space-y-2 text-xs">
                    {payslipData.advanceDeduction > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Staff Advance Recovery</span>
                        <span className="tabular-nums">-{formatCurrency(payslipData.advanceDeduction, baseCurrencySymbol)}</span>
                      </div>
                    )}
                    {payslipData.loanDeduction > 0 && (
                      <div className="flex justify-between text-rose-500">
                        <span>Loan EMI Recovery</span>
                        <span className="tabular-nums">-{formatCurrency(payslipData.loanDeduction, baseCurrencySymbol)}</span>
                      </div>
                    )}
                    {payslipData.payBreakdown?.filter((b: any) => b.type === 'Deduction').map((b: any, i: number) => (
                      <div key={i} className="flex justify-between text-rose-500">
                        <span>{b.payHeadName}</span>
                        <span className="tabular-nums">-{formatCurrency(b.amount, baseCurrencySymbol)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-border flex justify-between font-bold text-rose-600">
                      <span>Total Deductions</span>
                      <span className="tabular-nums">
                        -{formatCurrency(payslipData.deductions + (payslipData.advanceDeduction || 0) + (payslipData.loanDeduction || 0), baseCurrencySymbol)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase text-muted-foreground font-semibold">Net Salary Payable</span>
                  <div className="text-xs text-muted-foreground mt-0.5">Payable in official currency</div>
                </div>
                <div className="text-xl font-bold text-foreground tabular-nums">
                  {formatCurrency(payslipData.netSalary, baseCurrencySymbol)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-8">
                <div className="text-center">
                  <div className="border-t border-border/80 pt-2 text-xs text-muted-foreground">Employee Signature</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-border/80 pt-2 text-xs text-muted-foreground">Authorized Signature & Seal</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL F: STAFF ADVANCE */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base">Issue Staff Advance</h3>
              <button onClick={() => setIsAdvanceModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdvance} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  required
                  value={advanceForm.employeeId}
                  onChange={e => setAdvanceForm({ ...advanceForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="">Choose Staff Member</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Advance Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={advanceForm.amount}
                  onChange={e => setAdvanceForm({ ...advanceForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-bold tabular-nums focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={advanceForm.date}
                  onChange={e => setAdvanceForm({ ...advanceForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Reason / Purpose</label>
                <input
                  type="text"
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  placeholder="e.g. Medical emergency, urgent travel"
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                >
                  Save Advance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL G: EMPLOYEE LOAN */}
      {isLoanModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base">Issue Employee Loan</h3>
              <button onClick={() => setIsLoanModalOpen(false)} className="text-muted-foreground hover:text-foreground cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLoan} className="space-y-4 mt-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Select Employee</label>
                <select
                  required
                  value={loanForm.employeeId}
                  onChange={e => setLoanForm({ ...loanForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                >
                  <option value="">Choose Staff Member</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.designation || 'Staff'})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Principal Loan Amount</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={loanForm.amount}
                  onChange={e => setLoanForm({ ...loanForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-bold tabular-nums focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Duration (Months)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={loanForm.emiDuration}
                    onChange={e => setLoanForm({ ...loanForm, emiDuration: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={loanForm.interestRate}
                    onChange={e => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border">
                <span className="text-xs text-muted-foreground block">Calculated Monthly EMI:</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {loanForm.monthlyEMI ? formatCurrency(parseFloat(loanForm.monthlyEMI), baseCurrencySymbol) : '—'}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsLoanModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                >
                  Save Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL H: EMPLOYEE SALARY INCREMENT */}
      {isIncrementModalOpen && selectedEmployeeForService && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Record Salary Increment</h3>
                  <p className="text-xs text-muted-foreground">Adjust pay scale and maintain revision history</p>
                </div>
              </div>
              <button 
                onClick={() => setIsIncrementModalOpen(false)} 
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Staff info card */}
            <div className="my-4 p-3 bg-muted/40 rounded-lg border border-border flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">{selectedEmployeeForService.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedEmployeeForService.designation || 'Staff'} • {selectedEmployeeForService.department || 'General'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-muted-foreground block">Current Basic</span>
                <span className="text-sm font-bold text-foreground tabular-nums">
                  {formatCurrency(Number(selectedEmployeeForService.salary || selectedEmployeeForService.basicSalary || 0), baseCurrencySymbol)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveIncrement} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Effective Date</label>
                <input
                  type="date"
                  required
                  value={incrementForm.effectiveDate}
                  onChange={e => setIncrementForm({ ...incrementForm, effectiveDate: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">Increment Type</label>
                  <select
                    value={incrementForm.incrementType}
                    onChange={e => setIncrementForm({ ...incrementForm, incrementType: e.target.value as 'Fixed' | 'Percentage' })}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                  >
                    <option value="Fixed">Fixed Amount ({baseCurrencySymbol})</option>
                    <option value="Percentage">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    {incrementForm.incrementType === 'Percentage' ? 'Percentage (%)' : `Amount (${baseCurrencySymbol})`}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={incrementForm.incrementType === 'Percentage' ? 'e.g. 10' : 'e.g. 2000'}
                    value={incrementForm.amount}
                    onChange={e => setIncrementForm({ ...incrementForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-bold tabular-nums focus:outline-none"
                  />
                </div>
              </div>

              {/* Real-time Calculation Preview */}
              {parseFloat(incrementForm.amount) > 0 && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Revised Basic Salary:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm tabular-nums">
                      {formatCurrency(
                        incrementForm.incrementType === 'Percentage'
                          ? Number(selectedEmployeeForService.salary || selectedEmployeeForService.basicSalary || 0) * (1 + parseFloat(incrementForm.amount) / 100)
                          : Number(selectedEmployeeForService.salary || selectedEmployeeForService.basicSalary || 0) + parseFloat(incrementForm.amount),
                        baseCurrencySymbol
                      )}
                    </span>
                  </div>
                  <div className="text-right text-[11px] text-muted-foreground">
                    <span>Increase: </span>
                    <span className="font-semibold text-foreground">
                      {incrementForm.incrementType === 'Percentage'
                        ? `+${incrementForm.amount}%`
                        : `+${formatCurrency(parseFloat(incrementForm.amount), baseCurrencySymbol)}`}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Appraisal Notes / Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Annual appraisal, promotion, merit bonus"
                  value={incrementForm.notes}
                  onChange={e => setIncrementForm({ ...incrementForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsIncrementModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                >
                  Confirm & Update Salary
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL I: EMPLOYEE SERVICE RECORD & INCREMENT AUDIT TIMELINE */}
      {isServiceHistoryModalOpen && selectedEmployeeForService && (
        <div className="fixed inset-0 z-[99999] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Employee Service & Increment Record</h3>
                  <p className="text-xs text-muted-foreground">Joining, resignation, employment status and salary history</p>
                </div>
              </div>
              <button 
                onClick={() => setIsServiceHistoryModalOpen(false)} 
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-6 my-4">
              {/* Employee Summary Banner */}
              <div className="p-4 bg-muted/40 rounded-xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{selectedEmployeeForService.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {selectedEmployeeForService.designation || 'Staff'} • {selectedEmployeeForService.department || 'General'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Current Basic Salary</span>
                  <span className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    {formatCurrency(Number(selectedEmployeeForService.salary || selectedEmployeeForService.basicSalary || 0), baseCurrencySymbol)}
                  </span>
                </div>
              </div>

              {/* Service Details Form */}
              <div className="bg-card border border-border rounded-xl p-4 shadow-2xs">
                <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-primary" /> Service Dates & Employment Status
                </h5>
                <form onSubmit={handleSaveServiceStatus} className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Joining Date</label>
                      <input
                        type="date"
                        required
                        value={serviceStatusForm.joining_date}
                        onChange={e => setServiceStatusForm({ ...serviceStatusForm, joining_date: e.target.value })}
                        className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Employment Status</label>
                      <select
                        value={serviceStatusForm.status}
                        onChange={e => setServiceStatusForm({ ...serviceStatusForm, status: e.target.value })}
                        className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                      >
                        <option value="Active">Active</option>
                        <option value="Resigned">Resigned</option>
                        <option value="On Leave">On Leave</option>
                        <option value="Suspended">Suspended</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1">Resignation / Exit Date</label>
                      <input
                        type="date"
                        value={serviceStatusForm.resignation_date}
                        onChange={e => setServiceStatusForm({ ...serviceStatusForm, resignation_date: e.target.value })}
                        className="w-full px-3 py-2 bg-muted/60 border border-border rounded-lg text-xs font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-1.5 bg-primary text-primary-foreground font-bold text-xs rounded-lg cursor-pointer"
                    >
                      Update Service Record
                    </button>
                  </div>
                </form>
              </div>

              {/* Increment History Log Table */}
              <div className="bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
                <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h5 className="font-bold text-xs">Salary Increment History Audit Log</h5>
                  </div>
                  <button
                    onClick={() => {
                      setIsServiceHistoryModalOpen(false);
                      handleOpenIncrementModal(selectedEmployeeForService);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Increment
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-muted/70 text-muted-foreground font-semibold uppercase tracking-wider text-[10px] border-b border-border">
                      <tr>
                        <th className="py-2 px-3" style={{ verticalAlign: 'middle' }}>Effective Date</th>
                        <th className="py-2 px-3" style={{ verticalAlign: 'middle' }}>Type</th>
                        <th className="py-2 px-3 text-right" style={{ verticalAlign: 'middle' }}>Previous Salary</th>
                        <th className="py-2 px-3 text-right" style={{ verticalAlign: 'middle' }}>Increment</th>
                        <th className="py-2 px-3 text-right font-bold" style={{ verticalAlign: 'middle' }}>New Salary</th>
                        <th className="py-2 px-3" style={{ verticalAlign: 'middle' }}>Reason / Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {(!selectedEmployeeForService.salaryIncrements || selectedEmployeeForService.salaryIncrements.length === 0) ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-muted-foreground italic">
                            No salary increments recorded yet. Initial base salary: {formatCurrency(Number(selectedEmployeeForService.salary || selectedEmployeeForService.basicSalary || 0), baseCurrencySymbol)}
                          </td>
                        </tr>
                      ) : (
                        [...selectedEmployeeForService.salaryIncrements]
                          .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())
                          .map((inc, idx) => (
                            <tr key={inc.id || idx} className="hover:bg-muted/20">
                              <td className="py-2.5 px-3 font-semibold text-foreground whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                                {format(new Date(inc.effectiveDate), 'dd MMM yyyy')}
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap" style={{ verticalAlign: 'middle' }}>
                                <span className={cn(
                                  "px-2 py-0.5 rounded text-[10px] font-bold",
                                  inc.incrementType === 'Percentage' ? "bg-purple-500/10 text-purple-600 dark:text-purple-400" : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                                )}>
                                  {inc.incrementType}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground" style={{ verticalAlign: 'middle' }}>
                                {formatCurrency(inc.previousSalary, baseCurrencySymbol)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400" style={{ verticalAlign: 'middle' }}>
                                +{inc.incrementType === 'Percentage' ? `${inc.incrementAmount}%` : formatCurrency(inc.incrementAmount, baseCurrencySymbol)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums font-bold text-foreground" style={{ verticalAlign: 'middle' }}>
                                {formatCurrency(inc.newSalary, baseCurrencySymbol)}
                              </td>
                              <td className="py-2.5 px-3 text-muted-foreground max-w-[180px] truncate" style={{ verticalAlign: 'middle' }}>
                                {inc.notes || '—'}
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsServiceHistoryModalOpen(false)}
                className="px-4 py-1.5 bg-muted text-foreground hover:bg-muted/80 font-bold text-xs rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
