import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
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
          const newOnes = data.filter(n => !notifications.find(old => old.id === n.id));
          if (newOnes.some(n => !n.readBy?.includes(user.uid))) {
            setHasNew(true);
          }
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
      if (selectedNotification?.id === id) setSelectedNotification(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAsRead = async (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      await erpService.markNotificationAsRead(id, user.uid);
      // Update local state for immediate feedback if needed, 
      // but subscribeToNotifications will handle it
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAsUnread = async (e: React.MouseEvent | null, id: string) => {
    if (e) e.stopPropagation();
    if (!user) return;
    try {
      await erpService.markNotificationAsUnread(id, user.uid);
    } catch (error) {
      console.error('Error marking as unread:', error);
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

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?.uid || '')).length;

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
              className="fixed sm:absolute top-16 sm:top-auto right-4 sm:right-0 mt-2 w-[calc(100vw-32px)] sm:w-96 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-rose-500 text-white rounded-full font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    to="/notifications" 
                    onClick={() => setIsOpen(false)}
                    className="text-[10px] font-bold text-primary uppercase tracking-widest hover:underline"
                  >
                    View All
                  </Link>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-foreground/5 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
                {loading ? (
                  <div className="p-8 text-center">
                    <Clock className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Loading...</p>
                  </div>
                ) : notifications.length > 0 ? (
                  notifications.map((n) => {
                    const isRead = n.readBy?.includes(user?.uid || '');
                    return (
                      <div 
                        key={n.id} 
                        onClick={() => setSelectedNotification(n)}
                        className={cn(
                          "p-4 hover:bg-muted/30 transition-colors group cursor-pointer relative",
                          !isRead && "bg-primary/5"
                        )}
                      >
                        {!isRead && (
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                        )}
                        <div className="flex gap-3">
                          <div className="mt-0.5">
                            {getIcon(n.type)}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={cn("text-xs font-bold text-foreground", !isRead && "text-primary")}>{n.title}</h4>
                              <div className="flex items-center gap-1">
                                {isSuperAdmin && (
                                  <button 
                                    onClick={(e) => handleDelete(e, n.id)}
                                    className="p-1 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-500/10 rounded transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                              {n.message}
                            </p>
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-[9px] text-muted-foreground">
                                {n.sentAt ? format(n.sentAt, 'dd MMM, HH:mm') : format(n.createdAt, 'dd MMM, HH:mm')}
                              </p>
                              <button
                                onClick={(e) => isRead ? handleMarkAsUnread(e, n.id) : handleMarkAsRead(e, n.id)}
                                className="text-[9px] font-bold text-primary hover:underline"
                              >
                                {isRead ? 'Mark as unread' : 'Mark as read'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
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

      {/* Full Notification Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {getIcon(selectedNotification.type)}
                  <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">
                    Notification Details
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-foreground leading-tight">
                    {selectedNotification.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {selectedNotification.sentAt 
                      ? format(selectedNotification.sentAt, 'PPPP p') 
                      : format(selectedNotification.createdAt, 'PPPP p')}
                  </p>
                </div>

                <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
                <div className="flex gap-2">
                  {selectedNotification.readBy?.includes(user?.uid || '') ? (
                    <button
                      onClick={() => {
                        handleMarkAsUnread(null, selectedNotification.id);
                        setSelectedNotification({
                          ...selectedNotification,
                          readBy: selectedNotification.readBy?.filter(id => id !== user?.uid)
                        });
                      }}
                      className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
                    >
                      Mark as unread
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleMarkAsRead(null, selectedNotification.id);
                        setSelectedNotification({
                          ...selectedNotification,
                          readBy: [...(selectedNotification.readBy || []), user?.uid || '']
                        });
                      }}
                      className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                
                {isSuperAdmin && (
                  <button
                    onClick={(e) => handleDelete(e, selectedNotification.id)}
                    className="px-4 py-2 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
