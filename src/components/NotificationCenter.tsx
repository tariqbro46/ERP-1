import React, { useState, useEffect } from 'react';
import { Bell, X, Info, AlertTriangle, CheckCircle, AlertCircle, Clock, Trash2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const isSuperAdmin = user?.role === 'Founder' || user?.email === 'sapientman46@gmail.com';

  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsubscribe = erpService.subscribeToNotifications(
      user.uid, 
      user.companyId, 
      isSuperAdmin,
      (data) => {
        if (data.length > notifications.length && notifications.length > 0) {
          setHasNew(true);
        }
        setNotifications(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, notifications.length]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this notification?')) return;
    try {
      await erpService.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await erpService.getNotifications(
        user.uid, 
        user.companyId, 
        isSuperAdmin
      );
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case 'system_update': return <Activity className="w-4 h-4 text-indigo-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      <motion.button
        onClick={() => {
          setIsOpen(!isOpen);
          setHasNew(false);
        }}
        animate={hasNew ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
        transition={{ duration: 0.5, repeat: hasNew ? Infinity : 0, repeatDelay: 2 }}
        className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-all"
      >
        <Bell className={cn("w-5 h-5", hasNew && "text-primary")} />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute top-1.5 right-1.5 w-2 h-2 rounded-full border-2 border-background",
            hasNew ? "bg-primary animate-pulse" : "bg-rose-500"
          )} />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Notifications</h3>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-foreground/5 rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                {loading ? (
                  <div className="p-8 text-center">
                    <Clock className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Loading...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => (
                    <div key={n.id} className="p-4 hover:bg-muted/30 transition-colors group">
                      <div className="flex gap-3">
                        <div className="mt-0.5">
                          {getIcon(n.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-foreground">{n.title}</h4>
                            {isSuperAdmin && (
                              <button 
                                onClick={(e) => handleDelete(e, n.id)}
                                className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
                          <p className="text-[9px] text-muted-foreground pt-1">
                            {n.sentAt ? format(n.sentAt, 'dd MMM, HH:mm') : format(n.createdAt, 'dd MMM, HH:mm')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">No new notifications</p>
                  </div>
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t border-border bg-muted/10">
                  <button 
                    onClick={fetchNotifications}
                    className="w-full py-2 text-[10px] font-bold text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
