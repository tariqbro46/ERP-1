import React, { useState, useEffect, useMemo } from 'react';
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
import { format } from 'date-fns';

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
      const [empData, salaryData] = await Promise.all([
        erpService.getEmployees(user!.companyId),
        erpService.getSalarySheets(user!.companyId)
      ]);
      setEmployees(empData);
      setSalarySheets(salaryData);
    } catch (err) {
      console.error('Error fetching payroll reports data:', err);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const filteredEmployees = useMemo(() => employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.id.includes(searchTerm)
  ), [employees, searchTerm]);

  const totalSalary = useMemo(() => employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0), [employees]);
  const selectedEmployee = useMemo(() => employees.find(e => e.id === selectedEmployeeId), [employees, selectedEmployeeId]);
  const monthSheets = useMemo(() => salarySheets.filter(s => s.month === selectedMonth), [salarySheets, selectedMonth]);

  const renderReportHeader = () => (
    <div className="flex-none bg-background border-b border-border shadow-sm no-print px-4 lg:px-6 py-4 z-40">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
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
            <button 
              onClick={handlePrint} 
              className="p-2.5 bg-foreground text-background hover:opacity-90 rounded transition-all shadow-sm"
              title="Print Report"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button 
              onClick={handlePrint}
              className="p-2.5 bg-card border border-border text-foreground hover:bg-foreground/5 rounded transition-all shadow-sm"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOfficialHeader = () => (
    <div className="hidden print:block text-center mb-8 border-b-2 border-foreground pb-4">
      <h1 className="text-2xl font-bold uppercase tracking-tight">{settings?.companyName || 'ERP SYSTEM'}</h1>
      <p className="text-[10px] uppercase tracking-widest mt-1">{settings?.companyAddress || 'Company Address'}</p>
      <div className="flex justify-center gap-4 mt-2 text-[10px] uppercase font-bold">
        <span>Phone: {settings?.printPhone || 'N/A'}</span>
        <span>Email: {settings?.printEmail || 'N/A'}</span>
      </div>
      <h2 className="text-lg font-bold uppercase mt-6 tracking-[0.2em] bg-foreground text-background inline-block px-6 py-1">
        {reportType.replace(/_/g, ' ')}
      </h2>
      <p className="text-xs mt-2 uppercase tracking-widest font-bold">
        {reportType !== 'employee_profile' && reportType !== 'headcount' && selectedMonth ? `Month: ${format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}` : ''}
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
          <div className="overflow-x-auto shadow-sm print:border-2 print:border-foreground">
            <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
              <thead className="sticky top-0 z-30">
                <tr className="shadow-sm">
                  <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border">Employee</th>
                  {isAttendance ? (
                    Array.from({ length: 31 }, (_, i) => (
                      <th key={i} className="bg-card p-1 text-[8px] font-bold uppercase text-center border-l border-border/50 text-gray-400 w-6 border-b border-border">{i + 1}</th>
                    ))
                  ) : (
                    <>
                      <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right border-b border-border">Basic</th>
                      <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right border-b border-border">Allowances</th>
                      <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right border-b border-border">Deductions</th>
                      <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right border-b border-border">Advance/Loan</th>
                      <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 text-right border-b border-border">Net Payable</th>
                      <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border">Status</th>
                    </>
                  )}
                  <th className="bg-card p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 print:hidden text-right border-b border-border">Signature</th>
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

      case 'employee_profile':
        if (!selectedEmployee) return (
          <div className="py-20 text-center uppercase text-[10px] tracking-widest text-gray-400">
            Select an employee to view profile
          </div>
        );

        const renderInfoField = (label: string, value: any, icon?: React.ReactNode) => (
          <div className="flex flex-col gap-1 p-3 bg-card border border-border/50 rounded-lg shadow-sm">
            <div className="flex items-center gap-2">
              {icon && <div className="text-primary">{icon}</div>}
              <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{label}</p>
            </div>
            <p className="text-xs font-bold uppercase text-foreground truncate">
              {value !== undefined && value !== null && value.toString().trim() !== '' ? value : 'N/A'}
            </p>
          </div>
        );

        return (
          <div className="min-h-screen bg-background print:bg-white">
            {/* Header / Cover Area */}
            <div className="relative h-48 lg:h-64 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 overflow-hidden print:hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row items-center md:items-end gap-6 translate-y-12">
                <div className="w-32 h-32 lg:w-40 lg:h-40 bg-card rounded-full border-4 border-background overflow-hidden shadow-2xl relative z-10 shrink-0">
                  {selectedEmployee.photo ? (
                    <img src={selectedEmployee.photo} alt={selectedEmployee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-foreground flex items-center justify-center">
                      <User className="w-16 h-16 lg:w-20 lg:h-20 text-background opacity-20" />
                    </div>
                  )}
                </div>
                <div className="flex-1 text-center md:text-left mb-4 z-10">
                  <h2 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter drop-shadow-lg">{selectedEmployee.name || 'N/A'}</h2>
                  <p className="text-[10px] lg:text-xs font-bold text-primary-foreground/80 uppercase tracking-[0.3em] mt-1">{selectedEmployee.designation || 'N/A'}</p>
                </div>
                <div className="mb-4 z-10 flex gap-2">
                   <div className={cn(
                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg",
                    selectedEmployee.status === 'Active' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {selectedEmployee.status || 'Active'}
                  </div>
                </div>
              </div>
            </div>

            {/* Print Only Header */}
            <div className="hidden print:flex items-center gap-8 mb-10 border-b-2 border-foreground pb-8">
              <div className="w-32 h-32 bg-gray-100 rounded-2xl flex items-center justify-center border-2 border-foreground overflow-hidden">
                {selectedEmployee.photo ? (
                  <img src={selectedEmployee.photo} alt={selectedEmployee.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-16 h-16 text-gray-300" />
                )}
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-black uppercase tracking-tight">{selectedEmployee.name || 'N/A'}</h2>
                <p className="text-sm font-bold uppercase tracking-widest text-gray-600">{selectedEmployee.designation || 'N/A'}</p>
                <p className="text-xs uppercase font-bold tracking-widest">ID: {selectedEmployee.id}</p>
              </div>
            </div>

            <div className="pt-20 lg:pt-24 px-4 lg:px-8 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Essential Stats */}
              <div className="space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-4 border-primary pl-3">Personnel Summary</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {renderInfoField('Employee ID', selectedEmployee.id, <FileText className="w-3 h-3" />)}
                    {renderInfoField('Joining Date', selectedEmployee.joining_date, <Calendar className="w-3 h-3" />)}
                    {renderInfoField('Department', selectedEmployee.department, <Users className="w-3 h-3" />)}
                    {renderInfoField('Base Salary', selectedEmployee.salary ? `${baseCurrencySymbol}${selectedEmployee.salary}` : 'N/A', <DollarSign className="w-3 h-3" />)}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-4 border-primary pl-3">Identifiers</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {renderInfoField('NID Number', selectedEmployee.nidNumber)}
                    {renderInfoField('Blood Group', selectedEmployee.bloodGroup)}
                    {renderInfoField('Driving License', selectedEmployee.drivingLicense)}
                    {renderInfoField('Passport Number', selectedEmployee.passportNo)}
                  </div>
                </section>
              </div>

              {/* Middle Column: Details */}
              <div className="lg:col-span-2 space-y-8">
                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-4 border-primary pl-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInfoField('Primary Phone', selectedEmployee.phone)}
                    {renderInfoField('Email Address', selectedEmployee.email)}
                    <div className="md:col-span-2">
                       {renderInfoField('Present Address', selectedEmployee.presentAddress)}
                    </div>
                    <div className="md:col-span-2">
                       {renderInfoField('Permanent Address', selectedEmployee.permanentAddress)}
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-4 border-primary pl-3">Banking Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-foreground/5 p-6 border border-border/50 rounded-2xl">
                    {renderInfoField('Bank Name', selectedEmployee.bankName)}
                    {renderInfoField('Branch Name', selectedEmployee.bankBranch)}
                    {renderInfoField('Account Number', selectedEmployee.bankAccountNumber)}
                    {renderInfoField('Routing Number', selectedEmployee.bankRoutingNumber)}
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border-l-4 border-primary pl-3">Emergency & Family</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderInfoField('Father\'s Name', selectedEmployee.fatherName)}
                    {renderInfoField('Mother\'s Name', selectedEmployee.motherName)}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
                      <p className="text-[8px] text-primary uppercase font-black tracking-widest border-b border-primary/20 pb-1">Emergency 1</p>
                      {renderInfoField('Name', selectedEmployee.emergencyContactName)}
                      {renderInfoField('Relation', selectedEmployee.emergencyContactRelation)}
                      {renderInfoField('Phone', selectedEmployee.emergencyContactPhone)}
                    </div>
                    <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
                      <p className="text-[8px] text-primary uppercase font-black tracking-widest border-b border-primary/20 pb-1">Emergency 2</p>
                      {renderInfoField('Name', selectedEmployee.emergencyContact2Name)}
                      {renderInfoField('Relation', selectedEmployee.emergencyContact2Relation)}
                      {renderInfoField('Phone', selectedEmployee.emergencyContact2Phone)}
                    </div>
                    <div className="p-4 bg-card border border-border rounded-xl space-y-3 shadow-sm">
                      <p className="text-[8px] text-primary uppercase font-black tracking-widest border-b border-primary/20 pb-1">Emergency 3</p>
                      {renderInfoField('Name', selectedEmployee.emergencyContact3Name)}
                      {renderInfoField('Relation', selectedEmployee.emergencyContact3Relation)}
                      {renderInfoField('Phone', selectedEmployee.emergencyContact3Phone)}
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        );

      case 'headcount':
        const activeCount = employees.filter(e => e.status === 'Active').length;
        const leaveCount = employees.filter(e => e.status === 'On Leave').length;

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

            <div className="bg-card border border-border shadow-sm overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-card shadow-sm">
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border bg-card">#</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border bg-card">Name</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border bg-card">Designation</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border bg-card text-right">Base Salary</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border bg-card">Joined</th>
                    <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 border-b border-border bg-card">Status</th>
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
    <div className="flex flex-col h-full bg-background font-mono transition-colors overflow-hidden">
      {renderReportHeader()}

      <div className="flex-1 overflow-y-auto no-scrollbar no-print">
        <div className="px-4 lg:px-6 py-4 lg:py-6">
          <div className="space-y-6">
            {renderOfficialHeader()}
            <div className="bg-card border border-border">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="hidden print:block h-full overflow-visible">
        <div className="p-8">
          {renderOfficialHeader()}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
