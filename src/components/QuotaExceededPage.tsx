import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw, LogOut, Database, HelpCircle, ArrowUpRight, Mail } from 'lucide-react';
import { cn } from '../lib/utils';

export default function QuotaExceededPage({ company }: { company: any }) {
  const { logout, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const quotaLimit = company?.quotaLimit || 10000;
  const quotaUsed = company?.quotaUsed || 0;
  const percentUsed = Math.round((quotaUsed / quotaLimit) * 100);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      window.location.reload();
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-6 relative overflow-hidden font-sans select-none">
      {/* Visual Ambient Globs */}
      <div className="absolute top-[-15%] left-[-15%] w-[45%] h-[45%] rounded-full bg-rose-500/10 blur-[130px] pointer-events-none animate-pulse [animation-duration:8s]" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[45%] h-[45%] rounded-full bg-orange-500/10 blur-[130px] pointer-events-none animate-pulse [animation-duration:10s]" />
      <div className="absolute top-[35%] left-[25%] w-[35%] h-[35%] rounded-full bg-indigo-500/5 blur-[160px] pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />

      <div className="max-w-xl w-full relative z-10 space-y-6">
        
        {/* Header Alert Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-mono tracking-wider uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            Quota Maintenance Break
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {company?.name || 'Your Company'}
          </h1>
          <p className="text-xs text-rose-400 max-w-sm uppercase tracking-widest font-mono">
            Database Quota Threshold Exceeded
          </p>
        </div>

        {/* Real-time Usage Analytics Panel */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Firestore Usage Statistics
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">
              {percentUsed}% Exhausted
            </span>
          </div>

          <div className="space-y-4">
            {/* Real Progress Bar */}
            <div className="space-y-1.5Packed">
              <div className="w-full bg-slate-950/80 border border-slate-800/40 h-3 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-600 transition-all duration-1000"
                  style={{ width: `${Math.min(100, percentUsed)}%` }}
                />
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>0 Ops (Start)</span>
                <span>Limit Threshold: {quotaLimit.toLocaleString()} Ops</span>
              </div>
            </div>

            {/* Quota Details Boxes */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3 flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">Total Ops Read/Write</span>
                <span className="text-lg font-bold font-mono text-white mt-1">
                  {quotaUsed.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3 flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">Plan Assigned Limit</span>
                <span className="text-lg font-bold font-mono text-slate-300 mt-1">
                  {quotaLimit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Explanation Context */}
        <div className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-md rounded-xl p-5 space-y-3 text-left">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            Quota Limitation Details
          </h3>
          <div className="text-xs text-slate-300 space-y-3 font-light leading-relaxed">
            <p>
              To ensure pristine performance and enforce strict server cost bounds, our system mandates Firebase Firestore transaction limits (operations) on a per-company basis.
            </p>
            <p className="p-2 border-l-2 border-rose-500/40 bg-rose-500/5 rounded text-rose-300">
              <strong>Your company "{company?.name}" has exhausted its quota.</strong> Submitting transactions, fetching ledger reports, exporting files, and other real-time sync capabilities have been put on safety brake preventatively.
            </p>
            <p>
              To restore standard workflows:
            </p>
            <ul className="list-disc pl-4 space-y-1.5 text-slate-400">
              <li>Contact your company owner to upgrade or increase limits.</li>
              <li>Reach out to the system founder or administrator to request a custom boundary increase.</li>
              <li>Wait for the administrator to manually reset or clear your transactions log.</li>
            </ul>
          </div>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-650 hover:to-rose-700 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-white shadow-lg"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing State..." : "Reload & Check Status"}
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/60 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-300"
          >
            <LogOut className="w-4 h-4 text-amber-500" />
            Logout (Switch Account)
          </button>
        </div>

        {/* Footnote Metadata */}
        <div className="text-center text-[10px] text-slate-600 font-mono space-y-1">
          <div>Logged in UID: <span className="text-slate-400 font-bold">{user?.uid || 'N/A'}</span></div>
          <div className="flex items-center justify-center gap-1">
            <Mail className="w-3 h-3 text-slate-600" />
            <span>Support Email: <span className="text-slate-400">sapientman46@gmail.com</span></span>
          </div>
        </div>

      </div>
    </div>
  );
}
