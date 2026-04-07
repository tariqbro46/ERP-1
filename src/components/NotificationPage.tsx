import React, { useState, useEffect } from 'react';
import { Bell, Info, AlertTriangle, CheckCircle, AlertCircle, Clock, Trash2, Activity, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification } from '../types';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function NotificationPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
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
        setNotifications(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await erpService.deleteNotification(id);
      if (selectedNotification?.id === id) setSelectedNotification(null);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await erpService.markNotificationAsRead(id, user.uid);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    if (!user) return;
    try {
      await erpService.markNotificationAsUnread(id, user.uid);
    } catch (error) {
      console.error('Error marking as unread:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'system_update': return <Activity className="w-5 h-5 text-indigo-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?.uid || '')).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">Stay updated with system announcements and alerts.</p>
        </div>
        {unreadCount > 0 && (
          <div className="px-4 py-2 bg-rose-500/10 text-rose-500 rounded-lg text-xs font-bold uppercase tracking-widest border border-rose-500/20">
            {unreadCount} Unread Notifications
          </div>
        )}
      </header>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-border">
          {loading ? (
            <div className="p-20 text-center">
              <Clock className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Loading Notifications...</p>
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => {
              const isRead = n.readBy?.includes(user?.uid || '');
              return (
                <div 
                  key={n.id} 
                  className={cn(
                    "p-6 hover:bg-muted/30 transition-all group relative cursor-pointer",
                    !isRead && "bg-primary/5"
                  )}
                  onClick={() => setSelectedNotification(n)}
                >
                  {!isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                  )}
                  <div className="flex gap-6">
                    <div className="mt-1 p-2 bg-muted rounded-xl">
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className={cn(
                            "text-base font-bold text-foreground",
                            !isRead && "text-primary"
                          )}>
                            {n.title}
                          </h3>
                          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                            {n.sentAt ? format(n.sentAt, 'PPPP p') : format(n.createdAt, 'PPPP p')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              isRead ? handleMarkAsUnread(n.id) : handleMarkAsRead(n.id);
                            }}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              isRead ? "text-muted-foreground hover:bg-foreground/5" : "text-primary bg-primary/10 hover:bg-primary/20"
                            )}
                            title={isRead ? "Mark as unread" : "Mark as read"}
                          >
                            {isRead ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                          </button>
                          {isSuperAdmin && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(n.id);
                              }}
                              className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                              title="Delete Notification"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-24 text-center">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-6 opacity-10" />
              <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">No notifications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Full Notification Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
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

              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                <div className="space-y-3">
                  <h4 className="text-2xl font-bold text-foreground leading-tight">
                    {selectedNotification.title}
                  </h4>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedNotification.sentAt 
                        ? format(selectedNotification.sentAt, 'PPPP p') 
                        : format(selectedNotification.createdAt, 'PPPP p')}
                    </span>
                    <span className="px-2 py-0.5 bg-muted rounded text-[10px] font-bold uppercase tracking-widest">
                      {selectedNotification.type}
                    </span>
                  </div>
                </div>

                <div className="p-8 bg-muted/30 rounded-2xl border border-border/50">
                  <p className="text-base text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-border bg-muted/10 flex items-center justify-between flex-shrink-0">
                <div className="flex gap-3">
                  {selectedNotification.readBy?.includes(user?.uid || '') ? (
                    <button
                      onClick={() => {
                        handleMarkAsUnread(selectedNotification.id);
                        setSelectedNotification({
                          ...selectedNotification,
                          readBy: selectedNotification.readBy?.filter(id => id !== user?.uid)
                        });
                      }}
                      className="px-6 py-3 text-xs font-bold text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors"
                    >
                      Mark as unread
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleMarkAsRead(selectedNotification.id);
                        setSelectedNotification({
                          ...selectedNotification,
                          readBy: [...(selectedNotification.readBy || []), user?.uid || '']
                        });
                      }}
                      className="px-6 py-3 text-xs font-bold bg-primary text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
                
                {isSuperAdmin && (
                  <button
                    onClick={() => handleDelete(selectedNotification.id)}
                    className="px-6 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    Delete Notification
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
