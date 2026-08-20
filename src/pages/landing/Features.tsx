import React from 'react';
import { Navbar } from '../../components/landing/Navbar';
import { Footer } from '../../components/landing/Footer';
import { 
  BarChart3, 
  Shield, 
  Zap, 
  Users, 
  CheckCircle2,
  Database,
  Printer,
  Cpu,
  FileText,
  TrendingUp,
  Activity,
  Globe,
  Info,
  Plus,
  Check,
  Play,
  RotateCcw,
  Flame,
  AlertTriangle,
  Sparkles,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useSiteContent } from '../../hooks/useSiteContent';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSettings } from '../../contexts/SettingsContext';

export const Features = () => {
  const { t } = useLanguage();
  const { appFeatures } = useSettings();

  const DEFAULT_CONTENT = {
    title: t('features.title') || "Powerful Features for Modern Enterprises",
    titleColor: "#0f172a",
    subtitle: t('features.subtitle') || "Explore the comprehensive suite of tools designed to help your business operate more efficiently and grow faster.",
    subtitleColor: "#64748b",
    pageBgColor: "#ffffff",
    cardBgColor: "#ffffff",
    cardTitleColor: "#0f172a",
    cardDescColor: "#64748b",
    feature1Title: t('features.feature1Title') || "Financial Management",
    feature1Desc: t('features.feature1Desc') || "Complete control over your finances with real-time reporting, automated bookkeeping, and advanced analytics.",
    feature2Title: t('features.feature2Title') || "Inventory & Warehouse",
    feature2Desc: t('features.feature2Desc') || "Manage your stock levels across multiple locations, optimize reordering, and track every item in your supply chain.",
    feature3Title: t('features.feature3Title') || "Production & Manufacturing",
    feature3Desc: t('features.feature3Desc') || "Streamline your manufacturing process from order to delivery with integrated production planning and machine management.",
    feature4Title: t('features.feature4Title') || "Payroll & HR",
    feature4Desc: t('features.feature4Desc') || "Manage your most valuable asset—your people. Handle payroll, attendance, and employee records in one place.",
    moreTitle: t('features.moreTitle') || "And Much More",
    moreSubtitle: t('features.moreSubtitle') || "Every detail considered for your business success.",
    showMore: true
  };

  const { content: rawContent } = useSiteContent('features', DEFAULT_CONTENT);

  // Normalize to clean, light theme matching Login and Home
  const content = {
    ...rawContent,
    titleColor: "#0f172a",
    subtitleColor: "#64748b",
    pageBgColor: "#ffffff",
    cardBgColor: "#ffffff",
    cardTitleColor: "#0f172a",
    cardDescColor: "#64748b"
  };

  // ==========================================
  // PLAYGROUND STATE ENGINES FOR INTERACTIVITY
  // ==========================================
  
  // Interactive Feature 1: Financial Ledger State
  const [finTab, setFinTab] = React.useState<'ledger' | 'trial' | 'profit'>('ledger');
  const [ledgerEntries, setLedgerEntries] = React.useState<Array<{ desc: string; val: number; type: 'Dr' | 'Cr' }>>([
    { desc: 'Sales Rec: Dhaka Retailers', val: 145000, type: 'Dr' },
    { desc: 'Security Fee: Godown Alpha', val: 18000, type: 'Cr' },
    { desc: 'Export Despatch Advance', val: 62000, type: 'Dr' }
  ]);
  const [newDesc, setNewDesc] = React.useState('');
  const [newVal, setNewVal] = React.useState('35000');
  const [newType, setNewType] = React.useState<'Dr' | 'Cr'>('Dr');

  const addLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesc.trim()) return;
    const value = parseFloat(newVal) || 0;
    setLedgerEntries(prev => [...prev, { desc: newDesc, val: value, type: newType }]);
    setNewDesc('');
  };

  const calculatedProfit = React.useMemo(() => {
    let base = 654200;
    ledgerEntries.forEach(entry => {
      if (entry.type === 'Dr') base += entry.val;
      else base -= entry.val;
    });
    return base;
  }, [ledgerEntries]);

  // Interactive Feature 2: Stock Allocations
  const [selLocation, setSelLocation] = React.useState<'Godown-A' | 'Port Storage'>('Godown-A');
  const [rodStock, setRodStock] = React.useState(85);
  const [cementStock, setCementStock] = React.useState(34);

  const simulateDispatch = (item: 'rod' | 'cement') => {
    if (item === 'rod') {
      setRodStock(prev => Math.max(0, prev - 15));
    } else {
      setCementStock(prev => Math.max(0, prev - 10));
    }
  };

  const simulateRestock = (item: 'rod' | 'cement') => {
    if (item === 'rod') {
      setRodStock(prev => Math.min(100, prev + 20));
    } else {
      setCementStock(prev => Math.min(100, prev + 25));
    }
  };

  // Interactive Feature 3: Production Speed & Jobs
  const [lineSpeed, setLineSpeed] = React.useState<'idle' | 'normal' | 'boost'>('normal');
  const [finishedCount, setFinishedCount] = React.useState(1248);
  const [activeJobPercent, setActiveJobPercent] = React.useState(68);

  React.useEffect(() => {
    if (lineSpeed === 'idle') return;
    const interval = setInterval(() => {
      setActiveJobPercent(prev => {
        const increment = lineSpeed === 'boost' ? 12 : 5;
        if (prev + increment >= 100) {
          setFinishedCount(c => c + 1);
          return 0;
        }
        return prev + increment;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [lineSpeed]);

  // Interactive Feature 4: Payroll authorization
  const [isDisbursed, setIsDisbursed] = React.useState(false);
  const [staffList, setStaffList] = React.useState([
    { name: 'Rafiqul Islam', rank: 'Production Exec', dept: 'Operations', pay: 45000, method: 'Dhaka Bank C21' },
    { name: 'Farzana Akter', rank: 'Accounts Lead', dept: 'Finance & Audit', pay: 72000, method: 'bKash Wallet' },
    { name: 'Tasnim Ahmed', rank: 'Systems Adm.', dept: 'IT Division', pay: 55000, method: 'Prime Bank A10' }
  ]);

  const totalPayrollValue = staffList.reduce((sum, s) => sum + s.pay, 0);

  const features = [
    {
      title: content.feature1Title,
      desc: content.feature1Desc,
      icon: BarChart3,
      color: 'emerald',
      details: [
        t('features.feature1Detail1') || "Real-time ledger entries syncing back to Trial Profit state",
        t('features.feature1Detail2') || "Automated debit-credit double-entry validation system",
        t('features.feature1Detail3') || "Instant multi-format PDF/Excel statement export capabilities",
        t('features.feature1Detail4') || "Automated bank reconciliation via smart API triggers"
      ],
      mockup: (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 text-xs flex flex-col justify-between h-[350px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-700 font-bold">Ledger_Vouchers.xlsx</span>
              </div>
              <div className="w-8 h-1" />
            </div>
            
            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar Tabs */}
              <div className="col-span-4 bg-slate-50/70 p-3 border-r border-slate-200 flex flex-col gap-1.5 h-[290px] overflow-y-auto">
                <span className="font-bold text-slate-400 text-[8.5px] uppercase tracking-widest block mb-1">MODULE OPTIONS</span>
                <button 
                  onClick={() => setFinTab('ledger')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] ${finTab === 'ledger' ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  Ledger Actions
                </button>
                <button 
                  onClick={() => setFinTab('trial')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] ${finTab === 'trial' ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  Trial Balance
                </button>
                <button 
                  onClick={() => setFinTab('profit')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] ${finTab === 'profit' ? 'bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  Profit & Loss Index
                </button>

                {/* Micro Input form for testing */}
                {finTab === 'ledger' && (
                  <form onSubmit={addLedgerEntry} className="mt-3 p-2.5 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-xs">
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider block">Add Test Entry</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Utility Bills" 
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-[9.5px] text-slate-800 focus:outline-none focus:border-emerald-600 font-medium"
                    />
                    <div className="flex gap-1 justify-between items-center text-[9px]">
                      <input 
                        type="number" 
                        value={newVal}
                        onChange={e => setNewVal(e.target.value)}
                        className="w-14 bg-slate-50 border border-slate-200 rounded-lg px-1 py-0.5 text-[9.5px] text-slate-800 text-center focus:outline-none font-mono"
                      />
                      <select 
                        value={newType} 
                        onChange={e => setNewType(e.target.value as 'Dr' | 'Cr')}
                        className="bg-slate-50 border border-slate-200 rounded-lg text-[9px] text-slate-700 py-0.5 px-1 font-semibold"
                      >
                        <option value="Dr">Dr (+)</option>
                        <option value="Cr">Cr (-)</option>
                      </select>
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 p-1.5 rounded-lg text-white cursor-pointer transition-colors shadow-xs">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Main Tab content viewer */}
              <div className="col-span-8 p-3.5 space-y-3.5 h-[290px] overflow-y-auto bg-white">
                <div className="flex justify-between items-center bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 shadow-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Simulated Net Balance State</span>
                    <span className="text-sm font-black text-emerald-700 font-mono">
                      ৳{calculatedProfit.toLocaleString()}
                      <span className="text-[8px] font-normal text-slate-500 font-sans ml-1.5">(Dynamic Calculation)</span>
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                </div>

                {finTab === 'ledger' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Live Ledger Vouchers ({ledgerEntries.length})</span>
                    <div className="space-y-1.5 max-h-[145px] overflow-y-auto pr-1">
                      {ledgerEntries.map((entry, idx) => (
                        <div key={idx} className="p-2 bg-slate-50/60 border border-slate-200/70 rounded-lg flex justify-between items-center select-none shadow-2xs hover:bg-slate-50 transition-colors">
                          <span className="text-slate-700 text-[10px] font-semibold">{entry.desc}</span>
                          <span className={`font-mono text-[9.5px] font-extrabold ${entry.type === 'Dr' ? 'text-emerald-700' : 'text-rose-600'}`}>
                            ৳{entry.val.toLocaleString()} ({entry.type})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {finTab === 'trial' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Dual Column Trial Audit Ledger</span>
                    <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-[9px] space-y-1.5 font-mono">
                      <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-1 font-bold">
                        <span>Account Head</span>
                        <span>Debit (Dr)</span>
                        <span>Credit (Cr)</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Paid-up Capital Cash Flow</span>
                        <span className="text-emerald-700 font-bold">৳2,500,000</span>
                        <span>-</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Machinery Deployments</span>
                        <span>-</span>
                        <span className="text-rose-600 font-bold">৳1,450,000</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Staff Salaries Ledger</span>
                        <span>-</span>
                        <span className="text-rose-600 font-bold">৳940,000</span>
                      </div>
                      <div className="flex justify-between font-black text-slate-900 border-t border-slate-200 pt-1.5 mt-1">
                        <span>Audited Balance Sum</span>
                        <span>৳2,500,000</span>
                        <span>৳2,390,000</span>
                      </div>
                    </div>
                  </div>
                )}

                {finTab === 'profit' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Estimated Profit Index Table</span>
                    <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-[10px] space-y-2">
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Gross Invoiced Sales Receipt</span>
                        <span className="font-mono text-emerald-700 font-bold">+ ৳942,000</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Direct Manufacturing Cost Vouchers</span>
                        <span className="font-mono text-rose-600 font-bold">- ৳218,000</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Staff Human Resource Payroll</span>
                        <span className="font-mono text-rose-600 font-bold">- ৳117,400</span>
                      </div>
                      <div className="h-[1px] bg-slate-200" />
                      <div className="flex justify-between font-black text-slate-900 text-xs">
                        <span>Estimated Yield Return Balance</span>
                        <span className="font-mono text-blue-700 font-bold">৳606,600</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: content.feature2Title,
      desc: content.feature2Desc,
      icon: Database,
      color: 'amber',
      details: [
        t('features.feature2Detail1') || "Manage dynamic stock registries across multiple remote sub-godowns",
        t('features.feature2Detail2') || "Real-time dispatch controls with minimum quantity alerting flags",
        t('features.feature2Detail3') || "Systematic serial, lot, and expiry batch index tracing records",
        t('features.feature2Detail4') || "Instant Inter-Godown transfer voucher routing algorithms"
      ],
      mockup: (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 text-xs flex flex-col justify-between h-[350px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-700 font-bold">inventory_tracker.sh</span>
              </div>
              <div className="w-8 h-1" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-4 bg-slate-50/70 p-3 border-r border-slate-200 flex flex-col gap-1.5 h-[290px]">
                <span className="font-bold text-slate-400 text-[8.5px] uppercase tracking-widest block mb-1">CHOOSE GODOWN</span>
                <button 
                  onClick={() => setSelLocation('Godown-A')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] ${selLocation === 'Godown-A' ? 'bg-amber-50 text-amber-900 border-l-2 border-amber-500 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  Godown-A (Dhaka)
                </button>
                <button 
                  onClick={() => setSelLocation('Port Storage')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] ${selLocation === 'Port Storage' ? 'bg-amber-50 text-amber-900 border-l-2 border-amber-500 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  Port Storage (CTG)
                </button>

                <div className="mt-3 p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-xs">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Interactive Trigger</span>
                  <div className="space-y-1">
                    <button 
                      onClick={() => simulateDispatch('rod')}
                      className="w-full text-center bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 py-1 rounded-md text-[8.5px] cursor-pointer text-slate-700 font-semibold"
                    >
                      Dispatch Rod (-15%)
                    </button>
                    <button 
                      onClick={() => simulateDispatch('cement')}
                      className="w-full text-center bg-slate-50 hover:bg-slate-100 hover:text-slate-900 border border-slate-200 py-1 rounded-md text-[8.5px] cursor-pointer text-slate-700 font-semibold"
                    >
                      Dispatch Cement (-10%)
                    </button>
                    <div className="h-[1px] bg-slate-200 my-1" />
                    <button 
                      onClick={() => { setRodStock(85); setCementStock(34); }}
                      className="w-full text-center bg-amber-500 hover:bg-amber-600 text-white py-1 rounded-md text-[8.5px] font-bold cursor-pointer shadow-xs"
                    >
                      Audit / Reset Stocks
                    </button>
                  </div>
                </div>
              </div>

              {/* Main stock tracker */}
              <div className="col-span-8 p-3.5 space-y-3.5 h-[290px] overflow-y-auto bg-white">
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                  <span className="text-[9px] text-slate-600 uppercase tracking-wider font-extrabold">Active Zone: {selLocation.toUpperCase()}</span>
                  <span className="text-[8.5px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-mono font-bold">SYNC ONLINE</span>
                </div>

                <div className="space-y-3 p-3 bg-slate-50/60 rounded-xl border border-slate-200/80">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800 text-[10px] select-none">
                      <span>Deformed Steel Rods (10mm)</span>
                      <span className={`${rodStock < 30 ? 'text-rose-600 animate-pulse font-black' : 'text-amber-700'} font-mono`}>
                        {rodStock}% Volume ({rodStock < 30 ? 'CRITICAL LOW' : 'Operational'})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${rodStock < 30 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                        style={{ width: `${rodStock}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 pt-0.5 font-medium">
                      <button onClick={() => simulateRestock('rod')} className="hover:text-emerald-700 transition-colors cursor-pointer font-bold text-emerald-600">[+] Restock 20%</button>
                      <span>Est Net: {rodStock * 15} Metric Tons</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-800 text-[10px] select-none">
                      <span>High-Grade Cement (Pcs)</span>
                      <span className={`${cementStock < 30 ? 'text-rose-600 animate-pulse font-black' : 'text-emerald-700'} font-mono`}>
                        {cementStock}% Volume ({cementStock < 30 ? 'REORDER DISPATCH ALERT' : 'Normal'})
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${cementStock < 30 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${cementStock}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 pt-0.5 font-medium">
                      <button onClick={() => simulateRestock('cement')} className="hover:text-emerald-700 transition-colors cursor-pointer font-bold text-emerald-600">[+] Restock 25%</button>
                      <span>Est Net: {cementStock * 45} Bags</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8.5px] font-bold">
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-center">
                    <span className="block text-slate-400 text-[7px] uppercase tracking-wider">Security Access</span>
                    <span>Admin Vouchers Validated</span>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-200 text-center">
                    <span className="block text-slate-400 text-[7px] uppercase tracking-wider">Transit Ledger</span>
                    <span>14 Active Despatches</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: content.feature3Title,
      desc: content.feature3Desc,
      icon: Cpu,
      color: 'purple',
      details: [
        t('features.feature3Detail1') || "Manage dynamic machine pipelines with real-time operations",
        t('features.feature3Detail2') || "Automatic system capacity bottleneck forecasting algorithms",
        t('features.feature3Detail3') || "Automated Bill of Materials (BOM) multi-level tracking reports",
        t('features.feature3Detail4') || "Systematic job prioritization queues to maximize output speed"
      ],
      mockup: (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 text-xs flex flex-col justify-between h-[350px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-700 font-bold">machine_line_v2.bin</span>
              </div>
              <div className="w-8 h-1" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-4 bg-slate-50/70 p-3 border-r border-slate-200 flex flex-col gap-1.5 h-[290px]">
                <span className="font-bold text-slate-400 text-[8.5px] uppercase tracking-widest block mb-1">LINE CONTROLS</span>
                <button 
                  onClick={() => setLineSpeed('boost')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1.5 ${lineSpeed === 'boost' ? 'bg-rose-50 text-rose-800 border-l-2 border-rose-500 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  Boost Pipeline
                </button>
                <button 
                  onClick={() => setLineSpeed('normal')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1.5 ${lineSpeed === 'normal' ? 'bg-purple-50 text-purple-800 border-l-2 border-purple-500 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  <Play className="w-3.5 h-3.5 text-purple-500" />
                  Steady 1x Rate
                </button>
                <button 
                  onClick={() => setLineSpeed('idle')}
                  className={`text-left px-2.5 py-1.5 rounded-lg font-bold transition-all text-[10px] flex items-center gap-1.5 ${lineSpeed === 'idle' ? 'bg-slate-200 text-slate-800 border-l-2 border-slate-400 shadow-xs' : 'text-slate-600 hover:bg-slate-200/50'}`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                  Halt Operations
                </button>

                <div className="mt-3 p-2 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-slate-400 text-[7px] uppercase tracking-wider mb-1 font-bold">MANUAL ACTION</span>
                  <button 
                    onClick={() => { setFinishedCount(c => c + 1); setActiveJobPercent(0); }}
                    className="w-full py-1 text-[8.5px] bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold rounded-md shadow cursor-pointer text-center transition-transform active:scale-[0.99]"
                  >
                    + Finish Job Run
                  </button>
                </div>
              </div>

              {/* Main production console */}
              <div className="col-span-8 p-3.5 space-y-3.5 h-[290px] overflow-y-auto bg-white">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block mb-0.5">Output Capacity</span>
                    <span className={`text-base font-black ${lineSpeed === 'boost' ? 'text-rose-600' : lineSpeed === 'idle' ? 'text-slate-400' : 'text-purple-700'} transition-colors font-mono`}>
                      {lineSpeed === 'boost' ? '120.0%' : lineSpeed === 'idle' ? '0.0%' : '94.2%'}
                    </span>
                  </div>
                  <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block mb-0.5">Finished Runs</span>
                    <span className="text-base font-black text-emerald-700 font-mono">{finishedCount.toLocaleString()} Pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-[10px]">Active Job Batch: Order #3928</span>
                    <span className={`text-[8px] ${lineSpeed === 'boost' ? 'bg-rose-50 text-rose-700 border border-rose-200' : lineSpeed === 'idle' ? 'bg-slate-100 text-slate-600' : 'bg-purple-50 text-purple-700 border border-purple-200'} px-2 py-0.5 rounded-full font-black font-mono`}>
                      {lineSpeed === 'boost' ? 'HYPER DISPATCHING' : lineSpeed === 'idle' ? 'STANDBY PAUSE' : 'TRANSLATING VOUCHER'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${lineSpeed === 'boost' ? 'bg-rose-500' : 'bg-purple-600'}`} 
                      style={{ width: `${activeJobPercent}%` }} 
                    />
                  </div>

                  <div className="flex justify-between text-[8px] text-slate-500 select-none font-medium">
                    <span>{activeJobPercent}% Completed In Progress</span>
                    <span>Speed: {lineSpeed === 'boost' ? '12% / cycle' : lineSpeed === 'idle' ? '0% / paused' : '5% / cycle'}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[9px] text-slate-600 flex items-center justify-between">
                  <span className="font-semibold">BOM (Bill of Materials) Integration:</span>
                  <span className="font-mono text-purple-700 font-bold">14 sub-components allocated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: content.feature4Title,
      desc: content.feature4Desc,
      icon: Users,
      color: 'blue',
      details: [
        t('features.feature4Detail1') || "Manage staff rosters linked to payroll ledger parameters",
        t('features.feature4Detail2') || "Calculate automatically with individual deductions and bonuses",
        t('features.feature4Detail3') || "Approve payout dispatches via secure bKash or Bank transfers",
        t('features.feature4Detail4') || "Systematic automatic taxes and compliance statement reporting"
      ],
      mockup: (
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 text-xs flex flex-col justify-between h-[350px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-md border border-slate-200 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] font-mono text-slate-700 font-bold">payroll_dispatch.exe</span>
              </div>
              <div className="w-8 h-1" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-4 bg-slate-50/70 p-3 border-r border-slate-200 flex flex-col justify-between h-[290px]">
                <div>
                  <span className="font-bold text-slate-400 text-[8.5px] uppercase tracking-widest block mb-1">PAYOUT CONTROL</span>
                  <p className="text-[8.5px] text-slate-500 leading-normal mb-3 font-normal">
                    This module calculates net payouts and transfers funds securely with a single click.
                  </p>
                </div>

                <div className="space-y-1.5 mt-auto pb-2">
                  <button 
                    onClick={() => setIsDisbursed(prev => !prev)}
                    className={`w-full py-2 text-[9px] text-white font-bold rounded-lg cursor-pointer text-center transition-all shadow-xs ${isDisbursed ? 'bg-slate-600 hover:bg-slate-700' : 'bg-[#1e293b] hover:bg-[#0f172a]'}`}
                  >
                    {isDisbursed ? 'Reset Payout States' : 'Approve Disbursal'}
                  </button>
                  <span className="text-[7.5px] block text-center text-slate-400 font-mono">MD5 Signed Registry</span>
                </div>
              </div>

              {/* Main payroll sheet */}
              <div className="col-span-8 p-3.5 space-y-3 h-[290px] overflow-y-auto bg-white">
                <div className="flex items-center justify-between bg-slate-50/80 p-2.5 border border-slate-200 rounded-xl shadow-xs">
                  <div>
                    <span className="text-[7.5px] text-slate-500 uppercase tracking-widest block font-black">Consolidated Payroll Ledger</span>
                    <span className="text-sm font-black text-slate-900 font-mono">৳{totalPayrollValue.toLocaleString()}</span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Staff Allocation Registry</span>
                  <div className="space-y-1.5 bg-slate-50/60 p-2 rounded-xl border border-slate-200">
                    {staffList.map((st, i) => (
                      <div key={i} className="flex justify-between items-center text-[9.5px] py-1 border-b border-slate-200/60 last:border-b-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isDisbursed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <div>
                            <span className="font-bold text-slate-800 block">{st.name}</span>
                            <span className="text-[7.5px] text-slate-500 font-normal">{st.rank} - {st.dept}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-800 block font-mono">৳{st.pay.toLocaleString()}</span>
                          <span className={`text-[8px] font-mono font-bold ${isDisbursed ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {isDisbursed ? '✅ SENT' : '⏳ PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-blue-50/70 border border-blue-100 rounded-xl text-[8.5px] text-blue-900 select-none">
                  {isDisbursed ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> All bank transfers completed successfully.
                    </span>
                  ) : (
                    <span className="font-medium text-slate-600">Authorized staff signatures required to disburse. Click left button to sign.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 selection:bg-blue-100">
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden bg-white">
        {/* Geometric Grid Pattern & Subtle Pastel Glows matching Login & Home */}
        <div 
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `
              radial-gradient(circle at 50% 0%, rgba(241, 245, 249, 0.8) 0%, rgba(255, 255, 255, 1) 75%),
              linear-gradient(to right, #f1f5f9 1px, transparent 1px),
              linear-gradient(to bottom, #f1f5f9 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 88px 88px, 88px 88px'
          }}
        />

        {/* Ambient Pastel Glow Accents */}
        <div className="absolute top-12 left-1/4 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-36 right-1/4 w-[450px] h-[450px] bg-amber-100/40 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-blue-50 text-blue-700 px-3.5 py-1.5 rounded-full border border-blue-100 mb-6 inline-block shadow-2xs">
                ENTERPRISE SYSTEM CAPABILITIES
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 text-slate-900">
                {content.title}
              </h1>
              <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-medium">
                {content.subtitle}
              </p>
            </motion.div>
          </div>

          {/* Interactive Feature Blocks Playground */}
          <div className="space-y-32 mb-36">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={i} 
                  className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 lg:gap-16 items-center`}
                >
                  <div className="flex-1 space-y-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full inline-block">
                      MODULE 0{i + 1}
                    </span>
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-50 border border-blue-100 text-blue-600 shadow-2xs">
                        <Icon className="w-6 h-6" />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{feature.title}</h2>
                    </div>
                    <p className="text-sm md:text-base leading-relaxed text-slate-600 font-normal">
                      {feature.desc}
                    </p>
                    
                    <div className="h-[1px] bg-slate-100" />

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-2">SYSTEM HIGHLIGHTS:</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feature.details.map((detail, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-xs font-semibold text-slate-700 select-none">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex-1 w-full relative">
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      className="relative rounded-2xl"
                    >
                      {feature.mockup}
                    </motion.div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Category Subsystem Directories */}
          {content.showMore && (
            <div className="py-20 border-t border-slate-100">
              <div className="text-center mb-16">
                <span className="text-[11px] font-bold uppercase tracking-[0.25em] bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-full border border-indigo-100 mb-4 inline-block shadow-2xs">
                  COMPLETE MODULE DIRECTORY
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-slate-900">{content.moreTitle}</h2>
                <p className="text-slate-600 text-sm font-medium">{content.moreSubtitle}</p>
              </div>

              <div className="space-y-16">
                {appFeatures.map((category) => (
                  <div key={category.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="h-[1px] flex-1 bg-slate-200/80" />
                      <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 whitespace-nowrap bg-white px-3">
                        {category.label}
                      </h3>
                      <div className="h-[1px] flex-1 bg-slate-200/80" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {category.features.map((feature) => (
                        <div 
                          key={feature.id} 
                          className="group relative p-6 border border-slate-200/80 hover:border-slate-300 rounded-2xl bg-white hover:bg-slate-50/50 transition-all hover:translate-y-[-2px] shadow-xs hover:shadow-md" 
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                              <Zap className="w-4 h-4" />
                            </div>
                            {feature.description && (
                              <div className="relative group/info">
                                <Info className="w-3.5 h-3.5 text-slate-400 cursor-help hover:text-slate-700 transition-colors" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-3 bg-slate-900 text-white text-[10px] font-medium leading-relaxed rounded-xl shadow-xl border border-slate-800 opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all z-50">
                                  {feature.description}
                                </div>
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-bold mb-1 tracking-wide text-slate-900">{feature.label}</h4>
                          <span className="text-[9px] font-mono text-slate-400 uppercase">ID: {feature.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};
