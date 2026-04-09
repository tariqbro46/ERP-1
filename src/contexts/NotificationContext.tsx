import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useSettings } from './SettingsContext';

interface Notification {
  id: string;
  message: React.ReactNode;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  showNotification: (message: React.ReactNode, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {}
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { notificationDuration, notificationAnimationStyle } = useSettings();

  const showNotification = (message: React.ReactNode, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, notificationDuration || 5000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const renderAnimation = (n: Notification) => {
    const colorClass = n.type === 'success' ? "text-emerald-500" : n.type === 'error' ? "text-rose-500" : "text-primary";
    const glowColor = n.type === 'success' ? "rgba(16,185,129,0.8)" : n.type === 'error' ? "rgba(244,63,94,0.8)" : "rgba(37,99,235,0.8)";

    switch (notificationAnimationStyle) {
      case 'neon':
        return (
          <div className={cn("absolute inset-0 border-2 rounded-sm animate-neon-glow", 
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
          <div className="absolute inset-0 overflow-hidden rounded-sm">
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
          <div className="absolute inset-0 overflow-hidden rounded-sm">
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

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none items-center">
        {notifications.map(n => (
          <div 
            key={n.id}
            className={cn(
              "pointer-events-auto flex flex-col bg-card border border-border shadow-2xl rounded-sm min-w-[300px] animate-in slide-in-from-top-full duration-300 overflow-hidden relative",
              n.type === 'success' ? "border-emerald-500/50" : n.type === 'error' ? "border-rose-500/50" : "border-border"
            )}
          >
            <div className="flex items-center gap-3 px-4 py-3 relative z-10">
              {n.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-500" />
              )}
              <div className="text-[11px] font-mono uppercase tracking-widest text-foreground flex-1">
                {n.message}
              </div>
              <button 
                onClick={() => removeNotification(n.id)}
                className="p-1 hover:bg-foreground/5 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5 text-gray-500" />
              </button>
            </div>
            {renderAnimation(n)}
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
