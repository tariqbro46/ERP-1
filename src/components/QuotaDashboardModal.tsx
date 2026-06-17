import React, { useState, useEffect } from 'react';
import { Database, Clock, Eye, Edit2, Trash2, ShieldCheck, X, HelpCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuotaDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any;
}

export default function QuotaDashboardModal({ isOpen, onClose, company }: QuotaDashboardModalProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Get Dhaka formatted reset time text
  const bstResetLabel = "01:30 PM BST";

  // Calculate most recent 1:30 PM BST
  const getMostRecent130PM = (now: Date): Date => {
    const tz = 'Asia/Dhaka';
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric', month: 'numeric', day: 'numeric'
      });
      const parts = formatter.formatToParts(now);
      const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
      
      const today130PM = new Date(Date.UTC(
        parseInt(map.year),
        parseInt(map.month) - 1,
        parseInt(map.day),
        7, 30, 0, 0
      ));
      
      if (now.getTime() >= today130PM.getTime()) {
        return today130PM;
      } else {
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yParts = formatter.formatToParts(yesterday);
        const yMap = Object.fromEntries(yParts.map(p => [p.type, p.value]));
        return new Date(Date.UTC(
          parseInt(yMap.year),
          parseInt(yMap.month) - 1,
          parseInt(yMap.day),
          7, 30, 0, 0
        ));
      }
    } catch (e) {
      const fallback = new Date(now);
      fallback.setUTCHours(7, 30, 0, 0);
      if (now.getTime() >= fallback.getTime()) {
        return fallback;
      } else {
        return new Date(fallback.getTime() - 24 * 60 * 60 * 1000);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const updateCountdown = () => {
      const now = new Date();
      const mostRecent = getMostRecent130PM(now);
      const nextReset = mostRecent.getTime() + 24 * 60 * 60 * 1000;
      const msLeft = nextReset - now.getTime();

      if (msLeft <= 0) {
        setCountdown({ hours: 24, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(msLeft / (1000 * 60 * 60));
        const minutes = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((msLeft % (1000 * 60)) / 1000);
        setCountdown({ hours, minutes, seconds });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const quotaLimit = company?.quotaLimit || 10000;
  const quotaUsed = company?.quotaUsed || 0;
  const qReads = company?.quotaReads || 0;
  const qWrites = company?.quotaWrites || 0;
  const qDeletes = company?.quotaDeletes || 0;

  const pctUsed = Math.min(100, Math.round((quotaUsed / quotaLimit) * 100));

  // Segment allocations for the split chart
  const totalOps = qReads + qWrites + qDeletes || 1;
  const rPct = Math.round((qReads / totalOps) * 100);
  const wPct = Math.round((qWrites / totalOps) * 100);
  const dPct = Math.max(0, 100 - rPct - wPct);

  return (
    <AnimatePresence>
      <div id="quota-dashboard-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop overlay */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        />

        {/* Modal Card */}
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden font-sans select-none"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
                  Firestore Quota Metrics
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono font-bold tracking-tight normal-case">
                    Live Dashboard
                  </span>
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  {company?.name || 'Company Workspace'}
                </p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-1 px-1.5 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-250 rounded-lg border border-slate-800/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
            {/* Auto Reset Banner */}
            <div className="bg-slate-950/40 border border-indigo-500/10 rounded-xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="space-y-0.5">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Daily Reset Time</p>
                  <p className="text-xs font-semibold text-slate-200">{bstResetLabel} (Dhaka Standard)</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 uppercase font-bold">Auto Resetting In</p>
                <p className="text-xs font-mono font-black text-rose-400 tracking-wider">
                  {String(countdown.hours).padStart(2, '0')}:
                  {String(countdown.minutes).padStart(2, '0')}:
                  {String(countdown.seconds).padStart(2, '0')}
                </p>
              </div>
            </div>

            {/* Total Usage Progress Meter */}
            <div className="space-y-2">
              <div className="flex justify-between items-end">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Current Day Quota</span>
                  <p className="text-xl font-bold font-mono text-white">
                    {quotaUsed.toLocaleString()}{' '}
                    <span className="text-xs text-slate-500 font-normal">/ {quotaLimit.toLocaleString()} Ops</span>
                  </p>
                </div>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                  pctUsed >= 90 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  pctUsed >= 75 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                }`}>
                  {pctUsed}% Exhausted
                </span>
              </div>

              <div className="w-full bg-slate-950 border border-slate-800/50 h-3 rounded-full overflow-hidden p-0.5 relative">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${
                    pctUsed >= 90 ? 'bg-gradient-to-r from-orange-500 to-rose-600' :
                    pctUsed >= 75 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                    'bg-gradient-to-r from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${pctUsed}%` }}
                />
              </div>
            </div>

            {/* Accurate Usage Breakdown Cards */}
            <div className="space-y-2.5">
              <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Accurate Operations Breakdown</p>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Reads operations */}
                <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 border border-blue-500/15 rounded-lg text-blue-400">
                      <Eye className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Document Reads</span>
                      <p className="text-xs text-slate-500 font-medium">Record fetches & index views</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-slate-200">{qReads.toLocaleString()}</p>
                    <p className="text-[8px] font-mono text-slate-500">operations</p>
                  </div>
                </div>

                {/* Writes operations */}
                <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/15 rounded-lg text-emerald-400">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Document Writes</span>
                      <p className="text-xs text-slate-500 font-medium">Add, update, or edit records</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-slate-200">{qWrites.toLocaleString()}</p>
                    <p className="text-[8px] font-mono text-slate-500">operations</p>
                  </div>
                </div>

                {/* Deletes operations */}
                <div className="bg-slate-950/40 border border-slate-800 p-3 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 border border-rose-500/15 rounded-lg text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">Document Deletions</span>
                      <p className="text-xs text-slate-500 font-medium">Profile or voucher deletions</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono text-slate-200">{qDeletes.toLocaleString()}</p>
                    <p className="text-[8px] font-mono text-slate-500">operations</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Split Distribution Visualization Chart */}
            <div className="bg-slate-950/30 border border-slate-850 p-4 rounded-xl space-y-3">
              <p className="text-[9px] uppercase font-bold text-slate-400 text-center tracking-wider">Database Traffic Ratio</p>
              
              {/* Segmented bar */}
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden flex">
                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${rPct}%` }} title={`Reads: ${rPct}%`} />
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${wPct}%` }} title={`Writes: ${wPct}%`} />
                <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${dPct}%` }} title={`Deletes: ${dPct}%`} />
              </div>

              {/* Legends */}
              <div className="flex items-center justify-around pt-1 text-[10px] font-mono text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>Reads: {rPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Writes: {wPct}%</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Deletes: {dPct}%</span>
                </div>
              </div>
            </div>

            {/* Optimization Tips Guide */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4.5 space-y-3">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                Quota Safety & Optimization Guide
              </h3>
              <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>Our UI implements aggressive 10-minute caching policies on ledger reports and vouchers, reducing redundant Firestore reads in normal cycles.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>We batch writes (creates/edits) automatically to maximize operation limits and save system load.</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>To request custom operations increments or reset limits preventivaely, please contact workspace supervisors.</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer controls */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/30 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-755 text-[10px] font-bold text-slate-200 uppercase tracking-wider rounded-lg border border-slate-700/60 cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
