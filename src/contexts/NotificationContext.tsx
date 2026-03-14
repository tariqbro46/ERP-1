import React, { createContext, useContext, useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface NotificationContextType {
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const NotificationContext = createContext<NotificationContextType>({
  showNotification: () => {}
});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 pointer-events-none items-center">
        {notifications.map(n => (
          <div 
            key={n.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 px-4 py-3 bg-card border border-border shadow-2xl rounded-sm min-w-[300px] animate-in slide-in-from-top-full duration-300",
              n.type === 'success' ? "border-emerald-500/50" : n.type === 'error' ? "border-rose-500/50" : "border-border"
            )}
          >
            {n.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500" />
            )}
            <p className="text-[11px] font-mono uppercase tracking-widest text-foreground flex-1">
              {n.message}
            </p>
            <button 
              onClick={() => removeNotification(n.id)}
              className="p-1 hover:bg-foreground/5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}

export const useNotification = () => useContext(NotificationContext);
