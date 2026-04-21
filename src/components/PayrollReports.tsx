import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Loader2, 
  Calendar, 
  User, 
  FileText, 
  DollarSign, 
  Printer, 
  Download, 
  Search, 
  Filter, 
  Users, 
  UserCheck, 
  UserMinus, 
  CreditCard 
} from 'lucide-react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSettings } from '../contexts/SettingsContext';
import { formatCurrency, cn } from '../lib/utils';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

type PayrollReportType = 
  | 'payslip' 
  | 'paysheet' 
  | 'attendance_sheet' 
  | 'payment_advice' 
  | 'payroll_statement' 
  | 'payroll_register' 
  | 'attendance_register' 
  | 'employee_profile' 
  | 'headcount';

interface PayrollReportsProps {
  type?: PayrollReportType;
}

export function PayrollReports({ type: propType }: PayrollReportsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const settings = useSettings();
  const { baseCurrencySymbol = '৳' } = settings;
  const [searchParams] = useSearchParams();
  
  const reportType = propType || (searchParams.get('type') as PayrollReportType) || 'paysheet';
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [salarySheets, setSalarySheets] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

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
      // Attendance data would come from another collection, assuming it's empty for now
      setAttendance([]);
    } catch (err) {
      console.error('Error fetching payroll reports data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.includes(searchTerm)
  );

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);
  const monthSheets = salarySheets.filter(s => s.month === selectedMonth);

  const renderReportHeader = () => (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border pb-6 mb-6 no-print">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-foreground/5 rounded-full transition-all">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tighter text-foreground">
            {reportType.replace(/_/g, ' ')}
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
            Payroll & Personnel Information System
          </p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {(reportType !== 'employee_profile' && reportType !== 'headcount') && (
          <div className="flex items-center gap-2 bg-card border border-border p-1 pl-3 rounded shadow-sm flex-1 md:flex-initial">
            <Calendar className="w-3 h-3 text-gray-400" />
            <input 
              type="month" 
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent border-none text-xs outline-none text-foreground uppercase font-bold pr-2"
            />
          </div>
        )}
        
        {reportType === 'employee_profile' && (
          <div className="flex-1 md:w-64">
            <select
              value={selectedEmployeeId}
              onChange={e => setSelectedEmployeeId(e.target.value)}
              className="w-full bg-card border border-border text-foreground p-2 text-xs outline-none focus:border-foreground"
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 w-full md:w-auto border-l border-border md:pl-3">
          <button onClick={handlePrint} className="p-2.5 bg-foreground text-background hover:opacity-90 rounded transition-all shadow-sm">
            <Printer className="w-4 h-4" />
          </button>
          <button className="p-2.5 bg-card border border-border text-foreground hover:bg-foreground/5 rounded transition-all shadow-sm">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderOfficialHeader = () => (
    <div className="hidden print:block text-center mb-8 border-b-2 border-foreground pb-4">
      <h1 className="text-2xl font-bold uppercase tracking-tight">{settings?.companyName || 'ERP SYSTEM'}</h1>
      <p className="text-[10px] uppercase tracking-widest mt-1">{settings?.companyAddress || 'Company Address Address Address'}</p>
      <div className="flex justify-center gap-4 mt-2 text-[10px] uppercase font-bold">
        <span>Phone: {settings?.printPhone || 'N/A'}</span>
        <span>Email: {settings?.printEmail || 'N/A'}</span>
      </div>
      <h2 className="text-lg font-bold uppercase mt-6 tracking-[0.2em] bg-foreground text-background inline-block px-6 py-1">
        {reportType.replace(/_/g, ' ')}
      </h2>
      <p className="text-xs mt-2 uppercase tracking-widest font-bold">
        {reportType !== 'employee_profile' && reportType !== 'headcount' ? `Month: ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}` : ''}
      </p>
    </div>
  );

  const renderContent = () => {
    switch (reportType) {
      case 'payslip':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {monthSheets.length > 0 ? monthSheets.map(s => (
              <div key={s.id} className="bg-card border border-border p-8 space-y-6 shadow-sm print:shadow-none print:m-0 print:border-2 print:border-foreground">
                <div className="border-b border-border pb-4 flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-tighter">Pay Slip - {s.month}</h3>
                    <p className="text-[10px] text-gray-500 uppercase mt-1">Electronic Copy</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold uppercase">{s.employeeName}</p>
                    <p className="text-[9px] text-gray-400 uppercase">ID: {s.employeeId}</p>
                  </div>
                </div>
                
                <table className="w-full text-xs font-mono">
                  <tbody className="divide-y divide-border/50">
                    <tr className="py-2"><td className="py-3 text-gray-500 uppercase tracking-widest text-[9px]">Basic Salary</td><td className="text-right font-bold">{formatCurrency(s.basicSalary, baseCurrencySymbol)}</td></tr>
                    <tr className="py-2"><td className="py-3 text-gray-500 uppercase tracking-widest text-[9px]">Allowances</td><td className="text-right">{formatCurrency(s.allowances, baseCurrencySymbol)}</td></tr>
                    <tr className="py-2"><td className="py-3 text-rose-500 uppercase tracking-widest text-[9px]">Deductions</td><td className="text-right text-rose-500">-{formatCurrency(s.deductions, baseCurrencySymbol)}</td></tr>
                    <tr className="py-2"><td className="py-3 text-rose-500 uppercase tracking-widest text-[9px]">Advance Recovery</td><td className="text-right text-rose-500">-{formatCurrency(s.advanceDeduction, baseCurrencySymbol)}</td></tr>
                    <tr className="py-2"><td className="py-3 text-rose-500 uppercase tracking-widest text-[9px]">Loan EMI</td><td className="text-right text-rose-500">-{formatCurrency(s.loanDeduction, baseCurrencySymbol)}</td></tr>
                    <tr className="bg-foreground/5 font-bold">
                      <td className="py-4 px-2 uppercase tracking-widest">Net Payable</td>
                      <td className="text-right py-4 px-2 text-emerald-600 text-sm">{formatCurrency(s.netSalary, baseCurrencySymbol)}</td>
                    </tr>
                  </tbody>
                </table>

                <div className="pt-12 flex justify-between text-[10px] uppercase font-bold tracking-widest text-gray-400">
                  <div className="border-t border-gray-300 w-32 text-center pt-2">Authorized Sign</div>
                  <div className="border-t border-gray-300 w-32 text-center pt-2">Receiver Sign</div>
                </div>
              </div>
            )) : (
              <div className="col-span-full py-20 text-center border border-dashed border-border uppercase text-[10px] tracking-widest text-gray-400">
                No salary sheets generated for {selectedMonth}
              </div>
            )}
          </div>
        );

      case 'paysheet':
      case 'payroll_register':
      case 'payroll_statement':
      case 'attendance_sheet':
      case 'attendance_register':
        const isAttendance = reportType.includes('attendance');
        return (
          <div className="bg-card border border-border overflow-x-auto shadow-sm print:border-2 print:border-foreground">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-foreground/5 border-b border-border">
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Employee</th>
                  {isAttendance ? (
                    // 31 days for attendance
                    Array.from({ length: 31 }, (_, i) => (
                      <th key={i} className="p-1 text-[8px] font-bold uppercase text-center border-l border-border/50 text-gray-400 w-6">{i + 1}</th>
                    ))
                  ) : (
                    <>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Basic</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Allowances</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Deductions</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Advance/Loan</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right">Net Payable</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500">Status</th>
                    </>
                  )}
                  <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 print:hidden text-right">Signature</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-xs">
                {employees.length > 0 ? (isAttendance ? employees : monthSheets).map((item, idx) => {
                  const s = isAttendance ? null : item;
                  const emp = isAttendance ? item : null;
                  
                  return (
                    <tr key={idx} className="hover:bg-foreground/5">
                      <td className="p-4">
                        <p className="font-bold uppercase tracking-tight">{isAttendance ? emp?.name : s.employeeName}</p>
                        <p className="text-[9px] text-gray-400 mt-0.5 uppercase tracking-widest">{isAttendance ? emp?.id : s.employeeId}</p>
                      </td>
                      {isAttendance ? (
                        Array.from({ length: 31 }, (_, i) => (
                          <td key={i} className="p-1 border-l border-border/30 text-center font-bold text-gray-300">P</td>
                        ))
                      ) : (
                        <>
                          <td className="p-4 text-right font-mono">{formatCurrency(s.basicSalary, baseCurrencySymbol)}</td>
                          <td className="p-4 text-right font-mono">{formatCurrency(s.allowances, baseCurrencySymbol)}</td>
                          <td className="p-4 text-right font-mono text-rose-500">{formatCurrency(s.deductions, baseCurrencySymbol)}</td>
                          <td className="p-4 text-right font-mono text-rose-500">{formatCurrency((s.advanceDeduction || 0) + (s.loanDeduction || 0), baseCurrencySymbol)}</td>
                          <td className="p-4 text-right font-mono font-bold text-emerald-600">{formatCurrency(s.netSalary, baseCurrencySymbol)}</td>
                          <td className="p-4">
                            <span className={cn(
                              "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full",
                              s.paymentStatus === 'Paid' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                            )}>
                              {s.paymentStatus}
                            </span>
                          </td>
                        </>
                      )}
                      <td className="p-4 font-bold text-gray-300 print:hidden text-[9px] uppercase tracking-widest text-right">________________</td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={isAttendance ? 33 : 8} className="p-12 text-center text-gray-400 uppercase tracking-widest text-[10px]">No Records Found</td></tr>
                )}
              </tbody>
              {!isAttendance && monthSheets.length > 0 && (
                <tfoot className="bg-foreground/5 font-bold border-t border-border">
                  <tr>
                    <td className="p-4 uppercase tracking-widest text-[10px]">Total</td>
                    <td className="p-4 text-right font-mono">{formatCurrency(monthSheets.reduce((sum, s) => sum + (s.basicSalary || 0), 0), baseCurrencySymbol)}</td>
                    <td className="p-4 text-right font-mono">{formatCurrency(monthSheets.reduce((sum, s) => sum + (s.allowances || 0), 0), baseCurrencySymbol)}</td>
                    <td className="p-4 text-right font-mono text-rose-500">{formatCurrency(monthSheets.reduce((sum, s) => sum + (s.deductions || 0), 0), baseCurrencySymbol)}</td>
                    <td className="p-4 text-right font-mono text-rose-500">{formatCurrency(monthSheets.reduce((sum, s) => sum + (s.advanceDeduction || 0) + (s.loanDeduction || 0), 0), baseCurrencySymbol)}</td>
                    <td className="p-4 text-right font-mono text-emerald-600 text-sm">{formatCurrency(monthSheets.reduce((sum, s) => sum + (s.netSalary || 0), 0), baseCurrencySymbol)}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        );

      case 'payment_advice':
        return (
          <div className="space-y-8">
            <div className="bg-card border border-border p-8 shadow-sm">
              <div className="max-w-3xl mx-auto space-y-6">
                <div className="flex justify-between border-b border-border pb-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Ref No:</p>
                    <p className="text-xs font-bold font-mono">PA/{format(new Date(), 'yyyy/MM/dd')}/001</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Date:</p>
                    <p className="text-xs font-bold font-mono">{format(new Date(), 'dd-MM-yyyy')}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">To,</p>
                    <p className="text-sm font-bold uppercase">The Branch Manager</p>
                    <p className="text-xs text-gray-500 font-bold uppercase">Corporate Bank Bangladesh</p>
                  </div>
                  
                  <p className="text-sm font-bold uppercase mt-6 mb-4">Subject: DISBURSEMENT OF MONTHLY SALARIES FOR {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}</p>
                  
                  <div className="text-sm space-y-4 leading-relaxed text-gray-700">
                    <p>Dear Sir,</p>
                    <p>We kindly request you to debit our Corporate Current Account No. <span className="font-bold text-foreground">XXXX-XXXX-XXXX-XX</span> and credit the respective bank accounts of our employees as per the list attached below for their monthly salary of {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}.</p>
                  </div>
                </div>

                <div className="overflow-hidden border border-border mt-8">
                  <table className="w-full text-[10px] border-collapse">
                    <thead>
                      <tr className="bg-foreground/5 border-b border-border">
                        <th className="p-3 text-left font-bold uppercase tracking-widest">Employee Name</th>
                        <th className="p-3 text-left font-bold uppercase tracking-widest">Account Number</th>
                        <th className="p-3 text-right font-bold uppercase tracking-widest">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {monthSheets.filter(s => s.paymentStatus === 'Paid' || s.paymentStatus === 'Pending').map(s => (
                        <tr key={s.id}>
                          <td className="p-3 uppercase font-bold">{s.employeeName}</td>
                          <td className="p-3 font-mono">XXXX-XXXX-XXXX-XX</td>
                          <td className="p-3 text-right font-mono font-bold">{formatCurrency(s.netSalary, baseCurrencySymbol)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-foreground/5 border-t border-border font-bold">
                      <tr>
                        <td colSpan={2} className="p-3 uppercase tracking-widest text-[11px]">Total Disbursement</td>
                        <td className="p-3 text-right font-mono text-[11px]">{formatCurrency(monthSheets.reduce((sum, s) => sum + (s.netSalary || 0), 0), baseCurrencySymbol)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="pt-20 grid grid-cols-2 gap-20 text-[10px] font-bold uppercase tracking-widest text-center">
                  <div className="border-t border-black pt-2">Manager Finance</div>
                  <div className="border-t border-black pt-2">Authorized Director</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'employee_profile':
        if (!selectedEmployee) return (
          <div className="py-20 text-center border border-dashed border-border uppercase text-[10px] tracking-widest text-gray-400">
            Select an employee to view profile
          </div>
        );

        return (
          <div className="bg-card border border-border p-8 space-y-10 shadow-sm print:border-2 print:border-foreground">
            {/* Header with Background */}
            <div className="relative group">
              <div className="aspect-[21/9] bg-foreground/5 border border-border rounded-lg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-24 h-24 bg-foreground/10 rounded-full flex items-center justify-center border-4 border-background overflow-hidden">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-bold uppercase tracking-tight">{selectedEmployee.name}</h2>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">{selectedEmployee.designation}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-border pb-2">Employment Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Employee ID</p><p className="text-xs font-bold uppercase">{selectedEmployee.id}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Department</p><p className="text-xs font-bold uppercase">{selectedEmployee.department}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Joining Date</p><p className="text-xs font-bold uppercase">{selectedEmployee.joining_date}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Status</p><p className="text-xs font-bold text-emerald-500 uppercase">{selectedEmployee.status}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Basic Salary</p><p className="text-xs font-bold uppercase">{formatCurrency(selectedEmployee.salary, baseCurrencySymbol)}</p></div>
                </div>

                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-border pb-2 mt-12">Contact Information</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Phone</p><p className="text-xs font-bold uppercase">{selectedEmployee.phone}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Email</p><p className="text-xs font-bold">{selectedEmployee.email || 'N/A'}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Present Address</p><p className="text-xs text-gray-600 uppercase leading-relaxed">{selectedEmployee.presentAddress || 'N/A'}</p></div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-border pb-2">Identification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">NID Number</p><p className="text-xs font-bold uppercase">{selectedEmployee.nidNumber || 'N/A'}</p></div>
                  <div><p className="text-[9px] text-gray-500 uppercase tracking-widest">Blood Group</p><p className="text-xs font-bold uppercase">{selectedEmployee.bloodGroup || 'N/A'}</p></div>
                  <div className="col-span-2"><p className="text-[9px] text-gray-500 uppercase tracking-widest">Passport No</p><p className="text-xs font-bold uppercase">{selectedEmployee.passportNo || 'N/A'}</p></div>
                </div>

                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 border-b border-border pb-2 mt-12">Emerency Contact</h3>
                <div className="p-4 bg-foreground/5 border border-border rounded-lg space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-gray-500">Contact Person:</span>
                    <span>{selectedEmployee.emergencyContactName || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-gray-500">Relationship:</span>
                    <span>{selectedEmployee.emergencyContactRelation || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase">
                    <span className="text-gray-500">Phone:</span>
                    <span className="text-emerald-500">{selectedEmployee.emergencyContactPhone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-20 pb-4 flex justify-end gap-10 text-[10px] uppercase font-bold tracking-widest print:hidden">
              <button onClick={() => navigate('/payroll')} className="px-6 py-2 bg-foreground/5 hover:bg-foreground/10 text-foreground transition-all">Back to List</button>
              <button onClick={handlePrint} className="px-6 py-2 bg-foreground text-background hover:opacity-90 transition-all">Download PDF</button>
            </div>
          </div>
        );

      case 'headcount':
        const activeCount = employees.filter(e => e.status === 'Active').length;
        const leaveCount = employees.filter(e => e.status === 'On Leave').length;
        const totalSalary = employees.reduce((sum, e) => sum + (parseFloat(e.salary) || 0), 0);

        return (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Total Employees', value: employees.length, icon: Users, color: 'text-blue-500' },
                { label: 'Active Staff', value: activeCount, icon: UserCheck, color: 'text-emerald-500' },
                { label: 'On Leave', value: leaveCount, icon: UserMinus, color: 'text-amber-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-card border border-border p-6 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold tracking-tighter">{stat.value}</p>
                  </div>
                  <div className={cn("p-4 bg-foreground/5 rounded-full", stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border shadow-sm">
              <div className="p-4 border-b border-border bg-foreground/5">
                <h3 className="text-xs font-bold uppercase tracking-widest">Employee Roster</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-foreground/5 border-b border-border">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">#</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Name</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Designation</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 text-right">Base Salary</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Joined</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border text-xs">
                    {employees.map((emp, idx) => (
                      <tr key={emp.id} className="hover:bg-foreground/5 transition-colors">
                        <td className="p-4 text-gray-400">{idx + 1}</td>
                        <td className="p-4 uppercase font-bold tracking-tight">{emp.name}</td>
                        <td className="p-4 uppercase text-[10px] text-gray-500 font-bold">{emp.designation}</td>
                        <td className="p-4 text-right font-mono">{formatCurrency(emp.salary, baseCurrencySymbol)}</td>
                        <td className="p-4 font-mono text-[10px]">{emp.joining_date}</td>
                        <td className="p-4">
                          <span className={cn(
                            "text-[8px] font-bold uppercase px-2 py-0.5 rounded-full",
                            emp.status === 'Active' ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                          )}>
                            {emp.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-foreground/5 font-bold border-t border-border">
                    <tr>
                      <td colSpan={3} className="p-4 uppercase tracking-widest text-[10px]">Grand Total Payroll Liability</td>
                      <td className="p-4 text-right font-mono text-sm">{formatCurrency(totalSalary, baseCurrencySymbol)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-40 text-center border-2 border-dashed border-border rounded-2xl">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-gray-300 mb-4" />
            <h2 className="text-xl font-bold uppercase tracking-tighter text-gray-400">Report Under Construction</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-2 px-10">We are currently processing the requested data structure for this specific view.</p>
          </div>
        );
    }
  };

  if (loading) return (
    <div className="flex h-[80vh] items-center justify-center uppercase font-bold text-gray-400 text-xs tracking-widest animate-pulse">
      Initialising Payroll Engine...
    </div>
  );

  return (
    <div className="p-4 lg:p-6 bg-background min-h-screen font-mono transition-colors">
      <div className="max-w-[1400px] mx-auto">
        {renderReportHeader()}
        {renderOfficialHeader()}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
