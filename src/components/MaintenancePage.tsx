import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Wrench, Clock, RefreshCw, LogOut, ShieldAlert, Rocket, ChevronRight, HelpCircle } from 'lucide-react';

export default function MaintenancePage() {
  const { logout, user } = useAuth();
  const { 
    maintenanceEndTime, 
    maintenanceReason, 
    maintenanceUpdates,
    companyName = 'TallyFlow ERP'
  } = useSettings();

  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  useEffect(() => {
    if (!maintenanceEndTime) {
      setTimeLeft(prev => ({ ...prev, isExpired: true }));
      return;
    }

    const calculateTimeLeft = () => {
      const difference = new Date(maintenanceEndTime).getTime() - Date.now();
      
      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    // Calculate once immediately
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [maintenanceEndTime]);

  // Handle manual reload to let users check if system is up
  const handleCheckStatus = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-radial from-slate-900 via-slate-950 to-black text-slate-100 p-6 relative overflow-hidden font-sans select-none">
      {/* Visual Ambient Globs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full bg-indigo-500/5 blur-[150px] pointer-events-none" />

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      <div className="max-w-2xl w-full relative z-10 space-y-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/15 border border-amber-500/20 text-amber-400 rounded-full text-[10px] font-mono tracking-wider uppercase animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5" />
            System Maintenance Break
          </div>
          
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {companyName}
          </h1>
          <p className="text-xs text-slate-400 max-w-sm uppercase tracking-widest font-mono">
            Optimizing Infrastructure for You
          </p>
        </div>

        {/* Live Countdown Clock */}
        {!timeLeft.isExpired && (
          <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
            
            <div className="text-center mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                Downtime Remaining Counter
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3 max-w-md mx-auto">
              {/* Days */}
              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/50 rounded-xl p-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
                  {String(timeLeft.days).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 mt-1">Days</span>
              </div>
              
              {/* Hours */}
              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/50 rounded-xl p-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {String(timeLeft.hours).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 mt-1">Hours</span>
              </div>

              {/* Minutes */}
              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/50 rounded-xl p-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400 tracking-tight">
                  {String(timeLeft.minutes).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 mt-1">Mins</span>
              </div>

              {/* Seconds */}
              <div className="flex flex-col items-center bg-slate-950/80 border border-slate-800/50 rounded-xl p-3">
                <span className="text-2xl sm:text-3xl font-black font-mono text-amber-500/80 tracking-tight">
                  {String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-[9px] uppercase tracking-widest font-semibold text-slate-500 mt-1">Secs</span>
              </div>
            </div>
          </div>
        )}

        {/* Details & Information Accordion Section */}
        <div className="space-y-4">
          
          {/* Reason Box */}
          {maintenanceReason && (
            <div className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-md rounded-xl p-5 space-y-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Wrench className="w-3.5 h-3.5 text-blue-400" />
                Upholding Quality & Maintenance Scope
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-light whitespace-pre-wrap">
                {maintenanceReason}
              </p>
            </div>
          )}

          {/* Upgrades Box */}
          {maintenanceUpdates && (
            <div className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-md rounded-xl p-5 space-y-2">
              <h3 className="text-[10px] font-mono uppercase tracking-widest text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Rocket className="w-3.5 h-3.5 text-emerald-400" />
                Expected Future System Upgrades
              </h3>
              <div className="text-xs text-slate-300 space-y-2 font-light whitespace-pre-wrap leading-relaxed">
                {maintenanceUpdates}
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-900">
          <button
            onClick={handleCheckStatus}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-black"
          >
            <RefreshCw className="w-4 h-4 text-black animate-spin [animation-duration:8s]" />
            Check Connection & Reload
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800/60 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-300"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            Switch Account (Logout)
          </button>
        </div>

        {/* Footnote Metadata */}
        <div className="text-center text-[10px] text-slate-600 font-mono">
          Logged in as: <span className="text-slate-400">{user?.email || 'N/A'}</span>
          <br />
          Core Operations Platform Control Panel
        </div>

      </div>
    </div>
  );
}
