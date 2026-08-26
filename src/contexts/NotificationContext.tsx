import React, { createContext, useContext, useState } from 'react';
import { 
  CheckCircle2, AlertCircle, Info, X, Bell, Sparkles, Check, 
  Terminal, ShieldCheck, Zap, Layers, Globe, Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { useSettings, NotificationStyle, NotificationPosition } from './SettingsContext';
import { soundService } from '../services/soundService';

interface Notification {
  id: string;
  message: React.ReactNode;
  type: 'success' | 'error' | 'info' | 'warning';
  timestamp: Date;
}

interface NotificationContextType {
  showNotification: (message: React.ReactNode, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {}
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { 
    notificationDuration = 5000, 
    notificationAnimationStyle = 'default',
    notificationStyle = 'default',
    notificationPosition = 'bottom-right'
  } = useSettings();

  const showNotification = (message: React.ReactNode, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = { id, message, type, timestamp: new Date() };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Trigger sound effects for notifications
    if (type === 'success') {
      soundService.play('success');
    } else if (type === 'error') {
      soundService.play('error');
    } else if (type === 'warning') {
      soundService.play('warning');
    } else {
      soundService.play('warning');
    }
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notificationDuration || 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Border animations for Classic / Default style
  const renderClassicBorderAnimation = (n: Notification) => {
    const colorClass = n.type === 'success' ? "text-emerald-500" : n.type === 'error' ? "text-rose-500" : "text-primary";
    const glowColor = n.type === 'success' ? "rgba(16,185,129,0.8)" : n.type === 'error' ? "rgba(244,63,94,0.8)" : "rgba(37,99,235,0.8)";

    switch (notificationAnimationStyle) {
      case 'neon':
        return (
          <div className={cn("absolute inset-0 border-2 rounded-sm animate-neon-glow pointer-events-none", 
            n.type === 'success' ? "border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : 
            n.type === 'error' ? "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.5)]" : 
            "border-primary shadow-[0_0_15px_rgba(37,99,235,0.5)]"
          )} />
        );
      case 'snake':
        return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <path 
              d="M 0 0 L 100 0 L 100 100 L 0 100 Z" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="3" 
              vectorEffect="non-scaling-stroke" 
              className={cn("animate-snake-chase", colorClass)} 
              style={{ filter: `drop-shadow(0 0 5px ${glowColor})` }} 
            />
          </svg>
        );
      case 'liquid':
        return (
          <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
            <div className={cn("absolute inset-[-100%] animate-liquid-rotate opacity-30", 
              n.type === 'success' ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500" : 
              n.type === 'error' ? "bg-gradient-to-r from-rose-500 via-orange-500 to-rose-500" : 
              "bg-gradient-to-r from-primary via-purple-500 to-primary"
            )} />
          </div>
        );
      case 'glitch':
        return (
          <div className="absolute inset-0 pointer-events-none">
            <div className={cn("absolute inset-0 border-2 animate-glitch-1 opacity-50", colorClass)} />
            <div className={cn("absolute inset-0 border-2 animate-glitch-2 opacity-50", colorClass)} />
          </div>
        );
      case 'shimmer':
        return (
          <div className="absolute inset-0 overflow-hidden rounded-sm pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-shimmer-sweep" />
          </div>
        );
      case 'default':
      default:
        return (
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
            <path 
              d="M 50 100 L 0 100 L 0 0 L 100 0 L 100 100 L 50 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              vectorEffect="non-scaling-stroke" 
              pathLength="100" 
              className={cn("animate-progress-path", colorClass)} 
              style={{ 
                animationDuration: `${notificationDuration || 5000}ms`, 
                filter: `drop-shadow(0 0 4px ${glowColor})` 
              }} 
            />
          </svg>
        );
    }
  };

  // Position class mappings
  const getPositionClasses = (position: NotificationPosition) => {
    switch (position) {
      case 'top-right':
        return 'top-5 right-5 items-end';
      case 'top-left':
        return 'top-5 left-5 items-start';
      case 'top-center':
        return 'top-5 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-left':
        return 'bottom-5 left-5 items-start';
      case 'bottom-center':
        return 'bottom-5 left-1/2 -translate-x-1/2 items-center';
      case 'bottom-right':
      default:
        return 'bottom-5 right-5 items-end';
    }
  };

  // Render individual notification based on selected style
  const renderNotificationCard = (n: Notification) => {
    switch (notificationStyle) {
      // 1. Google Material 3 / Android / Gmail Style
      case 'google': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="flex items-center gap-3 bg-[#242526] text-[#e8eaed] border border-[#3c4043] shadow-[0_10px_35px_rgba(0,0,0,0.45)] rounded-full px-4 py-2.5 sm:px-5 sm:py-3 min-w-[280px] max-w-[420px] backdrop-blur-md">
            {/* Google 4-Color Accent Dot / Icon */}
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm",
              isSuccess ? "bg-[#34A853]/20 text-[#34A853]" :
              isError ? "bg-[#EA4335]/20 text-[#EA4335]" :
              "bg-[#4285F4]/20 text-[#4285F4]"
            )}>
              {isSuccess ? <Check className="w-4 h-4 stroke-[3]" /> :
               isError ? <AlertCircle className="w-4 h-4" /> :
               <Info className="w-4 h-4" />}
            </div>
            
            <div className="text-[13px] font-medium text-slate-100 flex-1 leading-snug tracking-tight">
              {n.message}
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-xs font-bold uppercase tracking-wider text-[#8ab4f8] hover:text-white px-2 py-1 rounded hover:bg-white/10 transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        );
      }

      // 2. Facebook / Meta Style
      case 'facebook': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="flex items-start gap-3 bg-white dark:bg-[#242526] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#393a3b] shadow-2xl rounded-2xl p-3.5 min-w-[300px] max-w-[380px] relative">
            {/* Meta Avatar / Badge with Reaction Dot */}
            <div className="relative shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#1877F2] to-[#3b82f6] flex items-center justify-center text-white shadow-md font-bold text-sm">
                TF
              </div>
              <div className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] shadow border-2 border-white dark:border-[#242526]",
                isSuccess ? "bg-[#31A24C]" : isError ? "bg-[#FA383E]" : "bg-[#1877F2]"
              )}>
                {isSuccess ? <Check className="w-3 h-3 stroke-[3]" /> :
                 isError ? <AlertCircle className="w-3 h-3" /> :
                 <Bell className="w-3 h-3" />}
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="font-bold text-xs text-slate-900 dark:text-white">TallyFlow ERP</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">• Just now</span>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                {n.message}
              </div>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="absolute top-3 right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }

      // 3. Figma Canvas Toast Style
      case 'figma': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="flex items-center gap-3 bg-[#2c2c2c] text-white border border-[#444444] shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-xl px-4 py-3 min-w-[290px] max-w-[400px]">
            {/* Figma 4-Color Micro Diamonds */}
            <div className="flex items-center gap-1 shrink-0">
              <div className={cn("w-2.5 h-2.5 rounded-full", isSuccess ? "bg-[#0ACF83] shadow-[0_0_8px_#0ACF83]" : isError ? "bg-[#F24E1E] shadow-[0_0_8px_#F24E1E]" : "bg-[#1ABCFE] shadow-[0_0_8px_#1ABCFE]")} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#A259FF] opacity-60" />
            </div>

            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className={cn(
                "text-[9px] font-mono font-bold px-1.5 py-0.5 rounded tracking-widest uppercase shrink-0",
                isSuccess ? "bg-[#0ACF83]/20 text-[#0ACF83]" :
                isError ? "bg-[#F24E1E]/20 text-[#F24E1E]" :
                "bg-[#1ABCFE]/20 text-[#1ABCFE]"
              )}>
                {isSuccess ? 'Success' : isError ? 'Error' : 'Info'}
              </span>
              <span className="text-xs font-sans text-slate-100 font-medium truncate">
                {n.message}
              </span>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors shrink-0"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }

      // 4. ERPNext / Frappe Desk Style
      case 'erpnext': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className={cn(
            "flex items-start gap-3 bg-white dark:bg-[#1a1d24] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 shadow-xl rounded-lg p-3.5 min-w-[300px] max-w-[390px] relative border-l-4",
            isSuccess ? "border-l-[#28a745]" : isError ? "border-l-[#dc3545]" : "border-l-[#2490ef]"
          )}>
            <div className={cn(
              "w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-white font-bold text-xs shadow-sm",
              isSuccess ? "bg-[#28a745]" : isError ? "bg-[#dc3545]" : "bg-[#2490ef]"
            )}>
              {isSuccess ? <Check className="w-4 h-4 stroke-[3]" /> :
               isError ? <AlertCircle className="w-4 h-4" /> :
               <Layers className="w-4 h-4" />}
            </div>

            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">Desk Notification</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">ERPNext</span>
              </div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                {n.message}
              </div>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }

      // 5. Apple iOS Dynamic Island Style
      case 'apple_ios': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="backdrop-blur-2xl bg-black/85 text-white border border-white/20 shadow-[0_25px_60px_rgba(0,0,0,0.7)] rounded-full px-5 py-3 min-w-[290px] max-w-[420px] flex items-center gap-3.5">
            {/* Glowing Ring Badge */}
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center shrink-0 border relative",
              isSuccess ? "border-emerald-400 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" :
              isError ? "border-rose-400 text-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.6)]" :
              "border-sky-400 text-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.6)]"
            )}>
              <span className={cn(
                "absolute inset-0 rounded-full animate-ping opacity-30",
                isSuccess ? "bg-emerald-400" : isError ? "bg-rose-400" : "bg-sky-400"
              )} />
              {isSuccess ? <Check className="w-3.5 h-3.5 stroke-[3]" /> :
               isError ? <AlertCircle className="w-3.5 h-3.5" /> :
               <Sparkles className="w-3.5 h-3.5" />}
            </div>

            <div className="flex-1 min-w-0 font-sans">
              <div className="text-xs font-semibold text-white tracking-tight">
                {n.message}
              </div>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="w-5 h-5 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors shrink-0"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }

      // 6. Linear / Vercel Developer Style
      case 'linear_dark': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="bg-[#0e1015] border border-white/15 text-slate-100 shadow-2xl rounded-xl p-3.5 min-w-[300px] max-w-[390px] flex items-center gap-3 relative overflow-hidden">
            {/* Ambient Gradient Glow Line */}
            <div className={cn(
              "absolute top-0 left-0 right-0 h-[2px]",
              isSuccess ? "bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500" :
              isError ? "bg-gradient-to-r from-rose-500 via-orange-400 to-rose-500" :
              "bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-500"
            )} />

            {/* Radar Dot */}
            <div className="relative shrink-0">
              <div className={cn(
                "w-2.5 h-2.5 rounded-full",
                isSuccess ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" :
                isError ? "bg-rose-400 shadow-[0_0_8px_#fb7185]" :
                "bg-sky-400 shadow-[0_0_8px_#38bdf8]"
              )} />
              <div className={cn(
                "absolute -inset-1 rounded-full animate-ping opacity-40",
                isSuccess ? "bg-emerald-400" : isError ? "bg-rose-400" : "bg-sky-400"
              )} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mb-0.5">
                SYSTEM // {isSuccess ? '200_OK' : isError ? '500_ERR' : 'INFO'}
              </div>
              <div className="text-xs font-sans font-medium text-slate-100 leading-snug">
                {n.message}
              </div>
            </div>

            <button
              onClick={() => removeNotification(n.id)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      }

      // 7. Stripe / Fintech Style
      case 'stripe': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="bg-white dark:bg-[#1a1f36] border border-slate-200 dark:border-[#2e384d] shadow-[0_15px_35px_rgba(50,50,93,0.1),0_5px_15px_rgba(0,0,0,0.07)] rounded-xl p-4 min-w-[300px] max-w-[380px] flex flex-col gap-2 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                isSuccess ? "bg-[#635bff]/10 text-[#635bff]" :
                isError ? "bg-rose-500/10 text-rose-500" :
                "bg-sky-500/10 text-sky-500"
              )}>
                {isSuccess ? <CheckCircle2 className="w-5 h-5" /> :
                 isError ? <AlertCircle className="w-5 h-5" /> :
                 <Info className="w-5 h-5" />}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#635bff] dark:text-[#a594fd] block mb-0.5">
                  TallyFlow Event
                </span>
                <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  {n.message}
                </p>
              </div>

              <button
                onClick={() => removeNotification(n.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Bottom Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden mt-1">
              <div 
                className={cn(
                  "h-full animate-progress-path",
                  isSuccess ? "bg-[#635bff]" : isError ? "bg-rose-500" : "bg-sky-500"
                )}
                style={{ animationDuration: `${notificationDuration || 5000}ms` }}
              />
            </div>
          </div>
        );
      }

      // 8. Windows 11 Fluent Acrylic Toast Style
      case 'windows11': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className="backdrop-blur-xl bg-slate-50/95 dark:bg-[#202020]/95 border border-slate-200 dark:border-white/10 shadow-2xl rounded-2xl p-3.5 min-w-[300px] max-w-[380px] flex flex-col gap-2 text-slate-900 dark:text-slate-100">
            {/* Header with App Title & Windows Close */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/50 dark:border-white/5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white text-[8px] font-bold">
                  TF
                </div>
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">TallyFlow ERP</span>
                <span className="text-[10px] text-slate-400">• now</span>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="w-5 h-5 rounded hover:bg-slate-200 dark:hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex items-start gap-2.5 pt-0.5">
              <div className="shrink-0 mt-0.5">
                {isSuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                 isError ? <AlertCircle className="w-4 h-4 text-rose-500" /> :
                 <Info className="w-4 h-4 text-blue-500" />}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
                {n.message}
              </p>
            </div>
          </div>
        );
      }

      // 9. Cyberpunk / Neon HUD Hologram Style
      case 'neon_cyber': {
        const isSuccess = n.type === 'success';
        const isError = n.type === 'error';
        return (
          <div className={cn(
            "bg-[#050b14]/95 border-2 shadow-[0_0_25px_rgba(6,182,212,0.4)] px-4 py-3 min-w-[300px] max-w-[400px] font-mono relative overflow-hidden",
            isSuccess ? "border-emerald-400 text-emerald-300" :
            isError ? "border-rose-500 text-rose-300" :
            "border-cyan-400 text-cyan-300"
          )}>
            {/* Corner Bracket Accents */}
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white" />
            <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-white" />
            <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-white" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white" />

            <div className="flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-cyan-500/30">
              <div className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase font-bold">
                <Terminal className="w-3 h-3" />
                <span>// HUD_ALERT [{isSuccess ? '0xOK' : isError ? '0xFAIL' : '0xINFO'}]</span>
              </div>
              <button
                onClick={() => removeNotification(n.id)}
                className="hover:bg-cyan-500/20 p-0.5 transition-colors text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs leading-relaxed tracking-wider font-semibold">
              {n.message}
            </div>
          </div>
        );
      }

      // 10. Classic Tally / Default Style
      case 'default':
      default: {
        return (
          <div 
            className={cn(
              "flex flex-col bg-card border border-border shadow-2xl rounded-sm min-w-[300px] max-w-[400px] overflow-hidden relative",
              n.type === 'success' ? "border-emerald-500/50" : n.type === 'error' ? "border-rose-500/50" : "border-border"
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3 relative z-10">
              {n.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              )}
              <div className="text-[11px] font-mono uppercase tracking-widest text-foreground flex-1 leading-snug">
                {n.message}
              </div>
              <button 
                onClick={() => removeNotification(n.id)}
                className="p-1 hover:bg-foreground/5 rounded transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>

            {renderClassicBorderAnimation(n)}

            {/* Glowing 4-Side Border Frame Effect */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
              <rect
                x="1.5"
                y="1.5"
                width="calc(100% - 3px)"
                height="calc(100% - 3px)"
                rx="4"
                fill="none"
                stroke={
                  n.type === 'success' ? "#10b981" : 
                  n.type === 'error' ? "#f43f5e" : 
                  "#3b82f6"
                }
                strokeWidth="2.5"
                vectorEffect="non-scaling-stroke"
                pathLength="100"
                className="animate-progress-path"
                style={{
                  animationDuration: `${notificationDuration || 5000}ms`,
                  filter: n.type === 'success' ? 'drop-shadow(0 0 8px rgba(16,185,129,0.95)) drop-shadow(0 0 3px rgba(16,185,129,0.7))' :
                          n.type === 'error' ? 'drop-shadow(0 0 8px rgba(244,63,94,0.95)) drop-shadow(0 0 3px rgba(244,63,94,0.7))' :
                          'drop-shadow(0 0 8px rgba(59,130,246,0.95)) drop-shadow(0 0 3px rgba(59,130,246,0.7))'
                }}
              />
            </svg>
          </div>
        );
      }
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className={cn("fixed z-[99999] flex flex-col gap-3 pointer-events-none", getPositionClasses(notificationPosition))}>
        <AnimatePresence mode="popLayout">
          {notifications.map(n => (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, y: notificationPosition.startsWith('top') ? -25 : 25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 450, damping: 30 }}
              className="pointer-events-auto"
            >
              {renderNotificationCard(n)}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
