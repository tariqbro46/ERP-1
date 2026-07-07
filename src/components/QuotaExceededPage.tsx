import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ShieldAlert, RefreshCw, LogOut, Database, Clock, Mail, Phone } from 'lucide-react';
import { cn } from '../lib/utils';

export default function QuotaExceededPage({ company }: { company: any }) {
  const { logout, user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  const quotaLimit = company?.quotaLimit || 10000;
  const quotaUsed = company?.quotaUsed || 0;
  const percentUsed = Math.round((quotaUsed / quotaLimit) * 100);

  // Helper to calculate exact next 1:30 PM Bangladesh Time (Asia/Dhaka)
  const getNextResetTime = (): Date => {
    const now = new Date();
    const tz = "Asia/Dhaka";
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
      });
      const parts = formatter.formatToParts(now);
      const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));

      // 1:30 PM BST is 7:30 AM UTC
      const today130PM = new Date(
        Date.UTC(
          parseInt(map.year),
          parseInt(map.month) - 1,
          parseInt(map.day),
          7,
          30,
          0,
          0
        )
      );

      if (now.getTime() < today130PM.getTime()) {
        return today130PM;
      } else {
        const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const tParts = formatter.formatToParts(tomorrow);
        const tMap = Object.fromEntries(tParts.map((p) => [p.type, p.value]));
        return new Date(
          Date.UTC(
            parseInt(tMap.year),
            parseInt(tMap.month) - 1,
            parseInt(tMap.day),
            7,
            30,
            0,
            0
          )
        );
      }
    } catch (e) {
      const fallback = new Date();
      fallback.setUTCHours(7, 30, 0, 0);
      if (now.getTime() < fallback.getTime()) {
        return fallback;
      } else {
        return new Date(fallback.getTime() + 24 * 60 * 60 * 1000);
      }
    }
  };

  const nextResetDate = getNextResetTime();

  // Live countdown to next reset
  useEffect(() => {
    const updateCountdown = () => {
      const diff = nextResetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const hrs = Math.floor(diff / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (num: number) => String(num).padStart(2, '0');
      setTimeLeft(`${pad(hrs)}h ${pad(mins)}m ${pad(secs)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextResetDate]);

  // Format date/time nicely
  const getFormattedResetTime = () => {
    const tz = "Asia/Dhaka";
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: tz,
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      const en = new Intl.DateTimeFormat("en-US", options).format(nextResetDate);
      const bn = new Intl.DateTimeFormat("bn-BD", options).format(nextResetDate);
      return { en, bn };
    } catch (e) {
      return {
        en: "Today/Tomorrow at 1:30 PM (BST)",
        bn: "আজ/আগামীকাল দুপুর ১:৩০ মিনিটে"
      };
    }
  };

  const formattedTimes = getFormattedResetTime();

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
        
        {/* Header Alert */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-full text-[10px] font-mono tracking-wider uppercase">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
            Daily Quota Exceeded / দৈনিক ব্যবহারের সীমা অতিক্রম
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            {company?.name || 'Your Company'}
          </h1>
          <p className="text-xs text-rose-400 max-w-sm uppercase tracking-widest font-mono">
            Database Limits Safety Active
          </p>
        </div>

        {/* Real-time Usage Analytics Panel */}
        <div className="bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-rose-400" />
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Quota Usage Statistics
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">
              {percentUsed}% Exhausted
            </span>
          </div>

          <div className="space-y-4">
            {/* Real Progress Bar */}
            <div className="space-y-1.5">
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
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">Used Operations</span>
                <span className="text-lg font-bold font-mono text-white mt-1">
                  {quotaUsed.toLocaleString()}
                </span>
              </div>
              <div className="bg-slate-950/60 border border-slate-800/50 rounded-xl p-3 flex flex-col">
                <span className="text-[9px] uppercase tracking-wider font-mono text-slate-500">Allowed Limit</span>
                <span className="text-lg font-bold font-mono text-slate-300 mt-1">
                  {quotaLimit.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown & Auto-Reset Clock Card */}
        <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-5 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20">
              <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">Automatic Reset Schedule</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Resets daily at 1:30 PM Bangladesh Time (BST)</p>
              <p className="text-[10px] text-slate-400">প্রতিদিন দুপুর ০১:৩০ মিনিটে স্বয়ংক্রিয়ভাবে রিসেট হবে।</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-[10px] text-slate-500 uppercase font-mono font-bold tracking-wider">Time Remaining / বাকি আছে</p>
            <p className="text-lg font-black font-mono text-blue-400 mt-0.5 tracking-tight">{timeLeft || '--h --m --s'}</p>
          </div>
        </div>

        {/* Detailed Explanation Context (Bangla + English) */}
        <div className="bg-slate-900/40 border border-slate-800/50 backdrop-blur-md rounded-xl p-5 space-y-4 text-left">
          {/* Bengali Alert Text */}
          <div className="space-y-2 border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
              <span>⚠️ দুঃখিত, আপনার কোম্পানির দৈনিক ডেটা ব্যবহারের লিমিট শেষ হয়েছে!</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-light">
              আপনার কোম্পানি <strong className="text-white font-semibold">"{company?.name}"</strong> এর দৈনিক বরাদ্দকৃত ডেটাবেজ অপারেশন কোটা (<span className="text-rose-400 font-mono font-bold">{quotaLimit.toLocaleString()} Ops</span>) সম্পূর্ণরূপে ব্যবহৃত হয়েছে। নিরাপদ ডেটা সুরক্ষার স্বার্থে ডেটাবেজে অতিরিক্ত রিড, রাইট এবং ডিলিট কার্যক্রম সাময়িকভাবে স্থগিত করা হয়েছে।
            </p>
            <p className="text-[11px] text-slate-400">
              পরবর্তী কোটা রিসেট সময়: <strong className="text-blue-400 font-mono">{formattedTimes.bn}</strong>
            </p>
          </div>

          {/* English Alert Text */}
          <div className="space-y-1 text-xs text-slate-400 font-light leading-relaxed">
            <p>
              Your company has exhausted its allocated daily operations quota. Real-time synchronizations, reports, and transactional operations are preventatively paused to guard server boundaries.
            </p>
            <p>
              Next Scheduled Reset: <strong className="text-slate-300 font-mono">{formattedTimes.en}</strong>
            </p>
          </div>
        </div>

        {/* Developer Contact Card */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 space-y-3.5 text-left">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-amber-500" />
            Contact Developer & Administrator / যোগাযোগ করুন
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Phone Support */}
            <a 
              href="tel:+8801742058246"
              className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 hover:border-amber-500/30 rounded-xl p-3 flex items-center gap-3 transition-all group"
            >
              <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 group-hover:bg-amber-500/20">
                <Phone className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Call Support</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5 group-hover:text-amber-400 transition-colors">+880 1742 058246</p>
                <p className="text-[9px] text-slate-400">Developer Direct</p>
              </div>
            </a>

            {/* Email Support */}
            <a 
              href="mailto:sapientman46@gmail.com?subject=TallyFlow ERP Daily Quota Limit Reset Request"
              className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-800/60 hover:border-indigo-500/30 rounded-xl p-3 flex items-center gap-3 transition-all group"
            >
              <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-500/20">
                <Mail className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Developer</p>
                <p className="text-xs font-bold text-slate-200 mt-0.5 truncate group-hover:text-indigo-400 transition-colors">sapientman46@gmail.com</p>
                <p className="text-[9px] text-slate-400">Instant Support Response</p>
              </div>
            </a>
          </div>

          <p className="text-[10px] text-slate-500 leading-relaxed text-center sm:text-left">
            💡 For urgent limit upgrades, custom integrations, or backup recovery, feel free to call or mail the developer directly.
            <br />
            লিমিট বাড়ানোর জন্য, কাস্টম ইন্টিগ্রেশন বা ব্যাকআপের জন্য সরাসরি ফোন অথবা মেইল করতে পারেন।
          </p>
        </div>

        {/* Actions bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRefresh}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-white shadow-lg"
          >
            <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing State..." : "Reload & Check Status / রিলোড করুন"}
          </button>

          <button
            onClick={() => logout()}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-slate-300"
          >
            <LogOut className="w-4 h-4 text-amber-500" />
            Logout (Switch Account) / লগআউট করুন
          </button>
        </div>

        {/* Footnote Metadata */}
        <div className="text-center text-[10px] text-slate-600 font-mono space-y-1">
          <div>Logged-in UID: <span className="text-slate-500 font-bold">{user?.uid || 'N/A'}</span></div>
          <div>System Engine version: 2.1.0-quota-guard</div>
        </div>

      </div>
    </div>
  );
}
