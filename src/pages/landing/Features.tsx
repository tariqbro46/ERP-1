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
import { useLandingTheme } from '../../hooks/useLandingTheme';
import { cn } from '../../lib/utils';

export const Features = () => {
  const { t } = useLanguage();
  const { appFeatures } = useSettings();

  const DEFAULT_CONTENT = {
    title: t('features.title') || "Powerful Features for Modern Enterprises",
    titleColor: "#ffffff",
    subtitle: t('features.subtitle') || "Explore the comprehensive suite of tools designed to help your business operate more efficiently and grow faster.",
    subtitleColor: "#94a3b8",
    pageBgColor: "#020617",
    cardBgColor: "#0f172a",
    cardTitleColor: "#ffffff",
    cardDescColor: "#94a3b8",
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

  const { content } = useSiteContent('features', DEFAULT_CONTENT);

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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-xs flex flex-col justify-between h-[340px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
              <div className="flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-300 font-bold">Ledger Ledger.xlsx</span>
              </div>
              <div className="w-8 h-1" />
            </div>
            
            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar Tabs */}
              <div className="col-span-4 bg-slate-950/40 p-2.5 border-r border-slate-850 flex flex-col gap-1.5 h-[282px] overflow-y-auto">
                <span className="font-bold text-slate-500 text-[8px] uppercase tracking-widest block mb-1">MODULE OPTIONS</span>
                <button 
                  onClick={() => setFinTab('ledger')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] ${finTab === 'ledger' ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  Ledger Actions
                </button>
                <button 
                  onClick={() => setFinTab('trial')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] ${finTab === 'trial' ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  Trial Balance
                </button>
                <button 
                  onClick={() => setFinTab('profit')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] ${finTab === 'profit' ? 'bg-emerald-500/15 text-emerald-400 border-l-2 border-emerald-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  Profit & Loss Index
                </button>

                {/* Micro Input form for testing */}
                {finTab === 'ledger' && (
                  <form onSubmit={addLedgerEntry} className="mt-4 p-2 bg-slate-950/60 border border-slate-800 rounded-lg space-y-1.5">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Add Test Entry</span>
                    <input 
                      type="text" 
                      placeholder="e.g. Utility Bills" 
                      value={newDesc}
                      onChange={e => setNewDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-white focus:outline-none focus:border-emerald-500"
                    />
                    <div className="flex gap-1 justify-between items-center text-[9px]">
                      <input 
                        type="number" 
                        value={newVal}
                        onChange={e => setNewVal(e.target.value)}
                        className="w-12 bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[9px] text-white text-center focus:outline-none"
                      />
                      <select 
                        value={newType} 
                        onChange={e => setNewType(e.target.value as 'Dr' | 'Cr')}
                        className="bg-slate-900 border border-slate-800 rounded text-[9px] text-slate-300 py-0.5"
                      >
                        <option value="Dr">Dr (+)</option>
                        <option value="Cr">Cr (-)</option>
                      </select>
                      <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 p-1 rounded text-white cursor-pointer transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Main Tab content viewer */}
              <div className="col-span-8 p-3.5 space-y-3.5 h-[282px] overflow-y-auto">
                <div className="flex justify-between items-center bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 shadow-inner">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-widest font-black block">Simulated Net Balance State</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">
                      ৳{calculatedProfit.toLocaleString()}
                      <span className="text-[8px] font-normal text-slate-400 font-sans ml-1.5">(Dynamic Calculation)</span>
                    </span>
                  </div>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>

                {finTab === 'ledger' && (
                  <div className="space-y-1.5">
                    <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Live Ledger Ledger Vouchers ({ledgerEntries.length})</span>
                    <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                      {ledgerEntries.map((entry, idx) => (
                        <div key={idx} className="p-2 bg-slate-900/60 border border-slate-850 rounded-lg flex justify-between items-center select-none shadow-sm">
                          <span className="text-slate-300 text-[10px] font-semibold">{entry.desc}</span>
                          <span className={`font-mono text-[9px] font-extrabold ${entry.type === 'Dr' ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                    <div className="bg-slate-950/55 p-2 rounded-lg border border-slate-850 text-[9px] space-y-1 font-mono">
                      <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
                        <span>Account Head</span>
                        <span>Debit (Dr)</span>
                        <span>Credit (Cr)</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Paid-up Capital Cash Flow</span>
                        <span className="text-emerald-400">৳2,500,000</span>
                        <span>-</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Machinery Deployments</span>
                        <span>-</span>
                        <span className="text-rose-400 font-bold">৳1,450,000</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Staff Salaries Ledger</span>
                        <span>-</span>
                        <span className="text-rose-400 font-bold">৳940,000</span>
                      </div>
                      <div className="flex justify-between font-black text-white border-t border-slate-800 pt-1 mt-1">
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
                    <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850 text-[10px] space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>Gross Invoiced Sales Receipt</span>
                        <span className="font-mono text-emerald-400 font-bold">+ ৳942,000</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Direct Manufacturing Cost Vouchers</span>
                        <span className="font-mono text-rose-400 font-bold">- ৳218,000</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Staff Human Resource Payroll</span>
                        <span className="font-mono text-rose-400 font-bold">- ৳117,400</span>
                      </div>
                      <div className="h-[1px] bg-slate-800" />
                      <div className="flex justify-between font-black text-white text-xs">
                        <span>Estimated Yield Return Balance</span>
                        <span className="font-mono text-blue-400">৳606,600</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-xs flex flex-col justify-between h-[340px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-300 font-bold">inventory_tracker.sh</span>
              </div>
              <div className="w-8 h-1" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-4 bg-slate-950/40 p-2.5 border-r border-slate-850 flex flex-col gap-1.5 h-[282px]">
                <span className="font-bold text-slate-500 text-[8px] uppercase tracking-widest block mb-1">CHOOSE GODOWN</span>
                <button 
                  onClick={() => setSelLocation('Godown-A')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] ${selLocation === 'Godown-A' ? 'bg-amber-500/15 text-amber-400 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  Godown-A (Dhaka)
                </button>
                <button 
                  onClick={() => setSelLocation('Port Storage')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] ${selLocation === 'Port Storage' ? 'bg-amber-500/15 text-amber-400 border-l-2 border-amber-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  Port Storage (CTG)
                </button>

                <div className="mt-4 p-2 bg-slate-950/60 rounded-lg border border-slate-800 space-y-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Interactive Trigger</span>
                  <div className="space-y-1">
                    <button 
                      onClick={() => simulateDispatch('rod')}
                      className="w-full text-center bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 py-1 rounded text-[8.5px] cursor-pointer text-slate-300"
                    >
                      Dispatch Rod (-15%)
                    </button>
                    <button 
                      onClick={() => simulateDispatch('cement')}
                      className="w-full text-center bg-slate-900 hover:bg-slate-850 hover:text-white border border-slate-800 py-1 rounded text-[8.5px] cursor-pointer text-slate-300"
                    >
                      Dispatch Cement (-10%)
                    </button>
                    <div className="h-[1px] bg-slate-800 my-1" />
                    <button 
                      onClick={() => { setRodStock(85); setCementStock(34); }}
                      className="w-full text-center bg-amber-600 hover:bg-amber-500 text-white py-1 rounded text-[8.5px] font-bold cursor-pointer"
                    >
                      Audit / Reset Stocks
                    </button>
                  </div>
                </div>
              </div>

              {/* Main stock tracker */}
              <div className="col-span-8 p-3.5 space-y-3.5 h-[282px] overflow-y-auto">
                <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-850 flex items-center justify-between">
                  <span className="text-[8.5px] text-slate-400 uppercase tracking-wider font-extrabold">Active Zone: {selLocation.toUpperCase()}</span>
                  <span className="text-[8.5px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded font-mono font-bold">SYNC ONLINE</span>
                </div>

                <div className="space-y-3 p-3 bg-slate-950/60 rounded-xl border border-slate-850">
                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-300 text-[10px] select-none">
                      <span>Deformed Steel Rods (10mm)</span>
                      <span className={`${rodStock < 30 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} font-mono`}>
                        {rodStock}% Volume ({rodStock < 30 ? 'CRITICAL LOW' : 'Operational'})
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${rodStock < 30 ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-amber-500'}`} 
                        style={{ width: `${rodStock}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 pt-0.5">
                      <button onClick={() => simulateRestock('rod')} className="hover:text-emerald-400 transition-colors cursor-pointer">[+] Restock 20%</button>
                      <span>Est Net: {rodStock * 15} Metric Tons</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between font-bold text-slate-300 text-[10px] select-none">
                      <span>High-Grade Cement (Pcs)</span>
                      <span className={`${cementStock < 30 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'} font-mono`}>
                        {cementStock}% Volume ({cementStock < 30 ? 'REORDER DISPATCH ALERT' : 'Normal'})
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${cementStock < 30 ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500'}`} 
                        style={{ width: `${cementStock}%` }} 
                      />
                    </div>
                    <div className="flex justify-between text-[8px] text-slate-500 pt-0.5">
                      <button onClick={() => simulateRestock('cement')} className="hover:text-emerald-400 transition-colors cursor-pointer">[+] Restock 25%</button>
                      <span>Est Net: {cementStock * 45} Bags</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[8px] font-bold">
                  <div className="p-2 rounded bg-slate-950/65 text-slate-400 border border-slate-850 text-center">
                    <span className="block text-slate-500 text-[6.5px] uppercase tracking-wider">Security Access</span>
                    <span>Admin Vouchers Validated</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950/65 text-slate-400 border border-slate-850 text-center">
                    <span className="block text-slate-500 text-[6.5px] uppercase tracking-wider">Transit Ledger</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-xs flex flex-col justify-between h-[340px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-300 font-bold">machine_line_v2.bin</span>
              </div>
              <div className="w-8 h-1" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-4 bg-slate-950/40 p-2.5 border-r border-slate-850 flex flex-col gap-1.5 h-[282px]">
                <span className="font-bold text-slate-500 text-[8px] uppercase tracking-widest block mb-1">LINE CONTROLS</span>
                <button 
                  onClick={() => setLineSpeed('boost')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] flex items-center gap-1.5 ${lineSpeed === 'boost' ? 'bg-red-500/15 text-red-400 border-l-2 border-red-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  Boost Pipeline
                </button>
                <button 
                  onClick={() => setLineSpeed('normal')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] flex items-center gap-1.5 ${lineSpeed === 'normal' ? 'bg-purple-500/15 text-purple-400 border-l-2 border-purple-500' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  <Play className="w-3.5 h-3.5" />
                  Steady 1x Rate
                </button>
                <button 
                  onClick={() => setLineSpeed('idle')}
                  className={`text-left px-2 py-1.5 rounded font-bold transition-all text-[10px] flex items-center gap-1.5 ${lineSpeed === 'idle' ? 'bg-slate-800 text-slate-300 border-l-2 border-slate-400' : 'text-slate-400 hover:bg-slate-900/40'}`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Halt Operations
                </button>

                <div className="mt-4 p-2 bg-slate-950/60 rounded-lg border border-slate-805 text-center">
                  <span className="block text-slate-500 text-[7px] uppercase tracking-wider mb-1 font-bold">MANUAL ACTION</span>
                  <button 
                    onClick={() => { setFinishedCount(c => c + 1); setActiveJobPercent(0); }}
                    className="w-full py-1 text-[8px] bg-gradient-to-r from-purple-600 to-pink-600 text-white font-extrabold rounded shadow cursor-pointer text-center hover:scale-[1.02] transition-transform"
                  >
                    + Finish Job Run
                  </button>
                </div>
              </div>

              {/* Main production console */}
              <div className="col-span-8 p-3.5 space-y-3.5 h-[282px] overflow-y-auto">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-center shadow-lg">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block mb-0.5">Output Capacity</span>
                    <span className={`text-base font-black ${lineSpeed === 'boost' ? 'text-red-400' : lineSpeed === 'idle' ? 'text-slate-500' : 'text-purple-400'} transition-colors font-mono`}>
                      {lineSpeed === 'boost' ? '120.0%' : lineSpeed === 'idle' ? '0.0%' : '94.2%'}
                    </span>
                  </div>
                  <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850 text-center shadow-lg">
                    <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold block mb-0.5">Finished Runs</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{finishedCount.toLocaleString()} Pcs</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950/65 border border-slate-850 rounded-xl space-y-2 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-[10px]">Active Job Batch: Order #3928</span>
                    <span className={`animate-pulse text-[8px] ${lineSpeed === 'boost' ? 'bg-red-500/25 text-red-400 border border-red-500/20' : lineSpeed === 'idle' ? 'bg-slate-800 text-slate-400' : 'bg-purple-500/25 text-purple-400 border border-purple-500/20'} px-2 py-0.5 rounded font-black font-mono`}>
                      {lineSpeed === 'boost' ? 'HYPER DISPATCHING' : lineSpeed === 'idle' ? 'STANDBY PAUSE' : 'TRANSLATING VOUCHER'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${lineSpeed === 'boost' ? 'bg-gradient-to-r from-red-500 to-pink-500' : 'bg-gradient-to-r from-purple-500 to-blue-500'}`} 
                      style={{ width: `${activeJobPercent}%` }} 
                    />
                  </div>

                  <div className="flex justify-between text-[8px] text-slate-500 select-none">
                    <span>{activeJobPercent}% Completed In Progress</span>
                    <span>Speed: {lineSpeed === 'boost' ? '12% / cycle' : lineSpeed === 'idle' ? '0% / paused' : '5% / cycle'}</span>
                  </div>
                </div>

                <div className="p-2 bg-slate-950/40 border border-slate-850 rounded-lg text-[8.5px] text-slate-400 flex items-center justify-between">
                  <span className="font-semibold">BOM (Bill of Materials) Integration:</span>
                  <span className="font-mono text-purple-400 font-bold">14 sub-components allocated</span>
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
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-xs flex flex-col justify-between h-[340px]">
          <div>
            {/* macOS title bar */}
            <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
              <div className="flex gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 block" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1 rounded-md border border-slate-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                <span className="text-[9px] font-mono text-slate-300 font-bold">payroll_dispatch.exe</span>
              </div>
              <div className="w-8 h-1" />
            </div>

            {/* Mock layout columns */}
            <div className="grid grid-cols-12">
              {/* Sidebar */}
              <div className="col-span-4 bg-slate-950/40 p-2.5 border-r border-slate-850 flex flex-col justify-between h-[282px]">
                <div>
                  <span className="font-bold text-slate-500 text-[8px] uppercase tracking-widest block mb-2">PAYOUT CONTROL</span>
                  <p className="text-[8px] text-slate-400 leading-normal mb-3 font-normal">
                    This module calculates net payouts and transfers funds securely with a single click.
                  </p>
                </div>

                <div className="space-y-1 mt-auto pb-2">
                  <button 
                    onClick={() => setIsDisbursed(prev => !prev)}
                    className={`w-full py-2 text-[9px] text-white font-bold rounded-lg cursor-pointer text-center transition-all shadow ${isDisbursed ? 'bg-slate-850 hover:bg-slate-800 border border-slate-700' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90'}`}
                  >
                    {isDisbursed ? 'Reset Payout States' : 'Approve Disbursal'}
                  </button>
                  <span className="text-[7.5px] block text-center text-slate-500 font-mono">MD5 Signed Registry</span>
                </div>
              </div>

              {/* Main payroll sheet */}
              <div className="col-span-8 p-3.5 space-y-3 h-[282px] overflow-y-auto">
                <div className="flex items-center justify-between bg-slate-950/40 p-2.5 border border-slate-850 rounded-xl">
                  <div>
                    <span className="text-[7.5px] text-slate-500 uppercase tracking-widest block font-black">Consolidated Payroll Ledger</span>
                    <span className="text-sm font-black text-white font-mono">৳{totalPayrollValue.toLocaleString()}</span>
                  </div>
                  <Briefcase className="w-4 h-4 text-blue-400" />
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Staff Allocation Registry</span>
                  <div className="space-y-1.5 bg-slate-950/65 p-2 rounded-xl border border-slate-850">
                    {staffList.map((st, i) => (
                      <div key={i} className="flex justify-between items-center text-[9.5px] py-1 border-b border-slate-850/60 last:border-b-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${isDisbursed ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                          <div>
                            <span className="font-bold text-slate-200 block">{st.name}</span>
                            <span className="text-[7.5px] text-slate-500 font-normal">{st.rank} - {st.dept}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-slate-300 block font-mono">৳{st.pay.toLocaleString()}</span>
                          <span className={`text-[8px] font-mono font-bold ${isDisbursed ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {isDisbursed ? '✅ SENT' : '⏳ PENDING'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-2 bg-blue-950/25 border border-blue-500/20 rounded-xl text-[8px] text-slate-300 select-none">
                  {isDisbursed ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> All bank transfers completed successfully.
                    </span>
                  ) : (
                    <span>Authorized staff signatures required to disburse. Click left button to sign.</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const landingTheme = useLandingTheme();
  const isDark = landingTheme === 'dark';

  return (
    <div className="min-h-screen flex flex-col selection:bg-blue-500/30 transition-colors duration-300" style={{ backgroundColor: isDark ? '#020617' : '#f8fafc', color: isDark ? '#ffffff' : '#0f172a' }}>
      <Navbar />
      
      <main className="flex-1 pt-32 pb-24 relative overflow-hidden transition-colors duration-300" style={{ backgroundColor: isDark ? '#020617' : '#f8fafc' }}>
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] -z-10 pointer-events-none">
          <div className={cn(
            "absolute top-12 left-1/4 w-[600px] h-[600px] rounded-full blur-[140px] opacity-80 animate-pulse",
            isDark ? "bg-blue-600/10" : "bg-blue-400/5"
          )} />
          <div className={cn(
            "absolute top-36 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-60",
            isDark ? "bg-emerald-500/5" : "bg-emerald-400/5"
          )} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-xs font-black uppercase tracking-[0.3em] bg-blue-500/10 text-blue-500 px-3 py-1.5 rounded-full border border-blue-500/20 mb-6 inline-block">EXPERIMENT PLATFORM</span>
              <h1 className={cn(
                "text-4xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-b bg-clip-text text-transparent",
                isDark ? "from-white via-slate-100 to-slate-400" : "from-slate-950 via-slate-800 to-slate-750"
              )}>
                {content.title}
              </h1>
              <p className={cn("text-base max-w-2xl mx-auto leading-relaxed font-semibold", isDark ? "text-slate-400" : "text-slate-600")}>
                {content.subtitle}
              </p>
            </motion.div>
          </div>

          {/* Interactive Feature Blocks Playground */}
          <div className="space-y-36 mb-36">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={i} 
                  className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-16 items-center animate-fade-in`}
                >
                  <div className="flex-1 space-y-6">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-600 bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 rounded-full inline-block">
                      MODULE 0{i + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center border",
                        isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50 border-blue-200"
                      )}>
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h2 className={cn("text-2xl md:text-4xl font-extrabold tracking-tight", isDark ? "text-white" : "text-slate-905")}>{feature.title}</h2>
                    </div>
                    <p className={cn("text-sm md:text-base leading-relaxed font-semibold", isDark ? "text-slate-400" : "text-slate-650")}>
                      {feature.desc}
                    </p>
                    
                    <div className={cn("h-[1px]", isDark ? "bg-slate-900" : "bg-slate-200")} />

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block mb-2">SYSTEM PARAMEDICS:</span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {feature.details.map((detail, j) => (
                          <li key={j} className={cn("flex items-start gap-2.5 text-xs font-semibold select-none", isDark ? "text-slate-300" : "text-slate-700")}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex-1 w-full text-white relative">
                    <div className={cn("absolute -inset-1 rounded-2xl blur-md opacity-70", isDark ? "bg-gradient-to-tr from-blue-500/10 to-transparent" : "bg-gradient-to-tr from-blue-100 to-transparent")} />
                    <motion.div
                      whileHover={{ scale: 1.005 }}
                      className="relative rounded-2xl overflow-hidden"
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
            <div className={cn("py-24 border-t transition-colors", isDark ? "border-slate-900" : "border-slate-200")}>
              <div className="text-center mb-16">
                <span className="text-xs font-black uppercase tracking-[0.3em] bg-indigo-500/10 text-indigo-500 px-3 py-1.5 rounded-full border border-indigo-500/20 mb-6 inline-block">FULL DIRECTORY</span>
                <h2 className={cn("text-3xl md:text-4xl font-extrabold mb-4", isDark ? "text-white" : "text-slate-900")}>{content.moreTitle}</h2>
                <p className={cn("text-sm font-semibold", isDark ? "text-slate-400" : "text-slate-600")}>{content.moreSubtitle}</p>
              </div>

              <div className="space-y-16">
                {appFeatures.map((category) => (
                  <div key={category.id} className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className={cn("h-[1px] flex-1", isDark ? "bg-slate-900" : "bg-slate-200")} />
                      <h3 className={cn("text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap", isDark ? "text-indigo-400/80" : "text-indigo-600")}>
                        {category.label}
                      </h3>
                      <div className={cn("h-[1px] flex-1", isDark ? "bg-slate-900" : "bg-slate-200")} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {category.features.map((feature) => (
                        <div 
                          key={feature.id} 
                          className={cn(
                            "group relative p-6 border rounded-2xl transition-all hover:translate-y-[-4px]",
                            isDark 
                              ? "border-slate-900 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-800" 
                              : "border-slate-200 bg-white hover:border-slate-350 shadow-sm"
                          )} 
                        >
                          <div className="flex items-center justify-between mb-4">
                            <Zap className="w-5 h-5 text-indigo-650" />
                            {feature.description && (
                              <div className="relative group/info">
                                <Info className="w-3.5 h-3.5 text-slate-500 cursor-help hover:text-indigo-500 transition-colors" />
                                <div className={cn(
                                  "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 text-[10px] font-semibold leading-relaxed rounded-xl shadow-2xl border opacity-0 group-hover/info:opacity-100 pointer-events-none transition-all z-50",
                                  isDark ? "bg-slate-950 text-slate-300 border-slate-850" : "bg-white text-slate-700 border-slate-200"
                                )}>
                                  {feature.description}
                                </div>
                              </div>
                            )}
                          </div>
                          <h4 className={cn("text-sm font-bold mb-1 uppercase tracking-wider", isDark ? "text-slate-200" : "text-slate-850")}>{feature.label}</h4>
                          <span className={cn("text-[8px] font-mono uppercase opacity-70", isDark ? "text-slate-600" : "text-slate-500")}>ID: {feature.id}</span>
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
