import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Settings, HelpCircle, LogOut, ChevronRight, ChevronLeft, 
  Camera, Bell, User, Shield, Building2, BookOpen, 
  Moon, Sun, ArrowLeft, Check, Trash2, Clock, Loader2, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useNotification } from '../contexts/NotificationContext';
import { erpService } from '../services/erpService';
import { AppNotification } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface FacebookProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  uiStyle?: string;
  onNotificationsUpdated?: () => void;
}

type MenuSection = 'main' | 'help' | 'notifications' | 'theme';

export default function FacebookProfileMenu({ isOpen, onClose, uiStyle, onNotificationsUpdated }: FacebookProfileMenuProps) {
  const { user, logout, isAdmin, isSuperAdmin, company } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  const [activeMenu, setActiveMenu] = useState<MenuSection>('main');
  const [profilePic, setProfilePic] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const { showNotification } = useNotification();
  const [isClearingCache, setIsClearingCache] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsClearingCache(true);
      erpService.clearAllCaches();
      showNotification('Local caches cleared successfully! Reloading to apply...', 'success');
      
      setTimeout(() => {
        setIsClearingCache(false);
        onClose();
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Failed clearing local caches:', err);
      showNotification('Failed to clear local cache. Please try reloading manually.', 'error');
      setIsClearingCache(false);
    }
  };

  useEffect(() => {
    if (user?.photoURL) {
      setProfilePic(user.photoURL);
    } else {
      setProfilePic(`https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`);
    }
  }, [user?.photoURL, user?.email]);

  // Load Notifications in Background when Menu is Open
  useEffect(() => {
    if (!isOpen || !user) return;

    const loadNotifications = async () => {
      setLoadingNotifications(true);
      try {
        const list = await erpService.getNotifications(
          user.uid,
          user.companyId,
          isSuperAdmin
        );
        setNotifications(list);
      } catch (err) {
        console.error('Error loading menu notifications:', err);
      } finally {
        setLoadingNotifications(false);
      }
    };

    loadNotifications();
  }, [isOpen, user, isSuperAdmin]);

  const unreadCount = notifications.filter(n => !n.readBy?.includes(user?.uid || '')).length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        // High quality client-side canvas compressor to avoid fat base64 payloads
        const canvas = document.createElement('canvas');
        const max_size = 180;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > max_size) {
            height *= max_size / width;
            width = max_size;
          }
        } else {
          if (height > max_size) {
            width *= max_size / height;
            height = max_size;
          }
        }
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

        try {
          setIsUploading(true);
          const userRef = doc(db, 'users', user.uid);
          await updateDoc(userRef, { photoURL: compressedBase64 });
          setProfilePic(compressedBase64);
        } catch (err) {
          console.error("Failed uploading profile picture:", err);
          alert("Could not save profile picture. Please try another image.");
        } finally {
          setIsUploading(false);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleMarkAsRead = async (id: string) => {
    if (!user) return;
    try {
      await erpService.markNotificationAsRead(id, user.uid);
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, readBy: [...(n.readBy || []), user.uid] } : n)
      );
      onNotificationsUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await erpService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      onNotificationsUpdated?.();
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-[calc(100%+8px)] right-0 w-[360px] max-w-[calc(100vw-24px)] bg-card border border-border shadow-[0_12px_40px_rgba(0,0,0,0.15)] rounded-2xl z-[9000] overflow-hidden leading-normal text-foreground">
      
      {/* File Upload Selector (invisible trigger) */}
      <input 
        type="file" 
        id="fb-profile-photo-upload" 
        accept="image/*" 
        onChange={handleImageChange} 
        className="hidden" 
      />

      <AnimatePresence mode="wait">
        
        {/* MAIN PANEL */}
        {activeMenu === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.15 }}
            className="p-4 space-y-4"
          >
            {/* User Meta Card (Facebook-style Profile Card) */}
            <div 
              onClick={() => {
                navigate('/profile');
                onClose();
              }}
              className="group/card bg-background border border-border hover:bg-muted/50 rounded-xl p-3.5 shadow-sm transition-colors cursor-pointer relative"
              title="View or Edit your profile"
            >
              <div className="flex items-center gap-3.5">
                
                {/* Photo Container */}
                <div className="relative shrink-0 select-none">
                  <div className="w-14 h-14 rounded-full border border-border overflow-hidden bg-muted flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <img 
                        src={profilePic || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user?.email || 'default'}`} 
                        alt="Profile avatar" 
                        className="w-full h-full object-cover transition-transform group-hover/card:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-foreground truncate flex items-center gap-1.5 leading-tight">
                    <span>{user?.displayName || 'User'}</span>
                    {isSuperAdmin && (
                      <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold bg-blue-500 text-white select-none">
                        PRO
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-medium truncate mt-0.5">
                    {user?.email}
                  </p>
                  <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 mt-1 font-mono uppercase tracking-wider">
                    <span>{user?.role || 'Staff'}</span>
                    <span className="text-[9px] font-sans text-muted-foreground lowercase tracking-normal italic ml-1">(Click to open profile page)</span>
                  </p>
                </div>
              </div>

              {/* Direct Picture Trigger Link */}
              <div className="border-t border-border mt-3 pt-2.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                  <span>View and edit profile details</span>
                </span>
                <span className="text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60 rounded px-2.5 py-0.5 select-none font-mono">
                  Active Session
                </span>
              </div>
            </div>

            <div className="h-[1px] bg-border" />

            {/* Core Action List */}
            <div className="space-y-1">
              
              {/* Notification Slide Button */}
              <button 
                onClick={() => setActiveMenu('notifications')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <Bell className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Notifications</span>
                    <span className="text-[10px] text-muted-foreground">Live system updates, inbox requests</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="bg-red-500 text-white rounded-full text-[9px] font-black font-mono px-1.5 h-4.5 flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Help & Support slide button */}
              <button 
                onClick={() => setActiveMenu('help')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <HelpCircle className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Help & Support</span>
                    <span className="text-[10px] text-muted-foreground">System Guide, user manual, branch assist</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Display & Dark Mode customization slide button */}
              <button 
                onClick={() => setActiveMenu('theme')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Moon className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Display Options</span>
                    <span className="text-[10px] text-muted-foreground">Themes, dark modes, layout scale</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Clear App Cache Button */}
              <button 
                onClick={handleClearCache}
                disabled={isClearingCache}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted disabled:opacity-60 transition-colors text-left group"
                title="Clears local cache database and refreshes the application safely"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    {isClearingCache ? (
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-4.5 h-4.5" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-xs block text-foreground">Clear App Cache</span>
                    <span className="text-[10px] text-muted-foreground">Fixes stale report sorting, N/As, and wrong dates</span>
                  </div>
                </div>
                {isClearingCache ? (
                  <span className="text-[10px] font-bold text-muted-foreground animate-pulse">Clearing...</span>
                ) : (
                  <span className="text-[9px] font-mono font-extrabold uppercase bg-muted px-2 py-0.5 rounded text-muted-foreground border border-border">Clear</span>
                )}
              </button>

              {/* Founder/Admin tools quick-access shortcuts */}
              {isSuperAdmin && (
                <Link 
                  to="/founder" 
                  onClick={onClose}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                      <Shield className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-foreground">Founder Control</span>
                      <span className="text-[10px] text-muted-foreground">Licenses, company limits, features</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

              {isAdmin && (
                <Link 
                  to="/users" 
                  onClick={onClose}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-muted transition-colors text-left group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <span className="font-bold text-xs block text-foreground">User Management</span>
                      <span className="text-[10px] text-muted-foreground">Access rights, custom roles, permissions</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              )}

            </div>

            <div className="h-[1px] bg-border" />

            {/* Logout Row */}
            <button
              onClick={async () => {
                onClose();
                await logout();
              }}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-950/30 transition-all text-left font-bold text-xs uppercase tracking-wider"
            >
              <div className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                <LogOut className="w-4.5 h-4.5" />
              </div>
              <span>Sign Out Account</span>
            </button>
          </motion.div>
        )}

        {/* NESTED HELP & SUPPORT PANEL */}
        {activeMenu === 'help' && (
          <motion.div
            key="help"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.15 }}
            className="p-4 space-y-4"
          >
            {/* Slide Header */}
            <div className="flex items-center gap-2 pb-1.5 border-b border-border">
              <button 
                onClick={() => setActiveMenu('main')}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
                title="Back to menu"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-slate-500" />
              </button>
              <h3 className="font-bold text-sm text-foreground">Help & Support</h3>
            </div>

            <div className="space-y-1">
              {/* SYSTEM GUIDE - REQUESTED BY USER */}
              <button
                onClick={() => {
                  onClose();
                  navigate('/instructions');
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-muted text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">System Guide</h4>
                  <p className="text-[10px] text-muted-foreground">Read ledgers, accounting rules, keyboard keys</p>
                </div>
              </button>

              {/* BRANCH SETTINGS */}
              <button
                onClick={() => {
                  onClose();
                  navigate('/settings');
                }}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-muted text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-muted text-foreground flex items-center justify-center shrink-0">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-foreground">Branch Settings</h4>
                  <p className="text-[10px] text-muted-foreground">Change currency, print outlays, templates</p>
                </div>
              </button>

              {/* SYSTEM GUIDE BUTTON TOGGLE - USER REQUEST */}
              <div className="border-t border-border/60 my-2 pt-2" />
              <div className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/80">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-foreground leading-tight">System Guide Button</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Show button on Dashboard</p>
                  </div>
                </div>
                <button
                  type="button"
                  id="system-guide-toggle-btn"
                  onClick={async () => {
                    if (!user) return;
                    try {
                      const userRef = doc(db, 'users', user.uid);
                      const currentVal = user.showSystemGuide ?? true;
                      await updateDoc(userRef, {
                        showSystemGuide: !currentVal
                      });
                    } catch (e) {
                      console.error("Failed to update system guide visibility:", e);
                    }
                  }}
                  className={cn(
                    "relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-slate-200 dark:bg-slate-800",
                    (user?.showSystemGuide ?? true) ? "bg-emerald-500 dark:bg-emerald-600" : "bg-slate-300 dark:bg-slate-700"
                  )}
                  title="Toggle System Guide Button on Dashboard"
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out",
                      (user?.showSystemGuide ?? true) ? "translate-x-4.5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* NESTED DISPLAY & APPEARANCE (THEME OPTIONS) */}
        {activeMenu === 'theme' && (
          <motion.div
            key="theme"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.15 }}
            className="p-4 space-y-4"
          >
            {/* Slide Header */}
            <div className="flex items-center gap-2 pb-1.5 border-b border-border">
              <button 
                onClick={() => setActiveMenu('main')}
                className="p-1.5 hover:bg-muted rounded-full transition-colors"
                title="Back to menu"
              >
                <ArrowLeft className="w-4.5 h-4.5 text-slate-500" />
              </button>
              <h3 className="font-bold text-sm text-foreground">Display & Theme</h3>
            </div>

            {/* Accent Preset Colors */}
            <div className="space-y-3">
              <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Choose Accent Color Theme</p>
              <div className="grid grid-cols-4 gap-2">
                {(['light', 'dark', 'emerald', 'amber', 'rose', 'slate', 'classic'] as const).map((t) => {
                  const isCur = theme === t;
                  return (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "p-2.5 rounded-xl border-2 transition-all flex flex-col items-center gap-1.5",
                        isCur 
                          ? "border-blue-500 bg-blue-50/20 text-blue-600 dark:border-blue-400 dark:bg-blue-950/20 dark:text-blue-400 font-bold" 
                          : "border-border hover:border-muted-foreground bg-transparent"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded-full shadow-sm shrink-0",
                        t === 'light' ? "bg-white border border-slate-200" : 
                        t === 'dark' ? "bg-zinc-900 border border-zinc-800" : 
                        t === 'emerald' ? "bg-emerald-500" : 
                        t === 'amber' ? "bg-amber-500" : 
                        t === 'rose' ? "bg-rose-500" : 
                        t === 'slate' ? "bg-slate-500" : 
                        "bg-teal-600"
                      )} />
                      <span className="text-[8px] font-bold uppercase truncate max-w-full tracking-wider">{t}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* NESTED NOTIFICATION PANEL (MOVED HERE AS REQUESTED) */}
        {activeMenu === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 15 }}
            transition={{ duration: 0.15 }}
            className="p-4 space-y-3 flex flex-col h-[480px] max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-border shrink-0">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setActiveMenu('main')}
                  className="p-1.5 hover:bg-muted rounded-full transition-colors"
                  title="Back to menu"
                >
                  <ArrowLeft className="w-4.5 h-4.5 text-slate-500" />
                </button>
                <h3 className="font-bold text-sm text-foreground">Recent Notifications</h3>
              </div>
              
              <Link 
                to="/notifications" 
                onClick={onClose}
                className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 hover:underline"
              >
                See All
              </Link>
            </div>

            {/* List container */}
            <div className="flex-1 overflow-y-auto space-y-2.5 no-scrollbar pr-0.5">
              {loadingNotifications ? (
                <div className="py-24 text-center space-y-3">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest leading-none">Fetching notifications...</p>
                </div>
              ) : notifications.length > 0 ? (
                notifications.slice(0, 10).map((n) => {
                  const isRead = n.readBy?.includes(user?.uid || '');
                  return (
                    <div 
                      key={n.id}
                      onClick={() => handleMarkAsRead(n.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all relative group cursor-pointer",
                        isRead 
                          ? "bg-[var(--card)] hover:bg-muted border border-border opacity-85" 
                          : "bg-primary/5 hover:bg-primary/10 border-primary/20"
                      )}
                    >
                      {/* Unread circle badge */}
                      {!isRead && (
                        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-600" />
                      )}

                      <div className="space-y-1 pr-4">
                        <h4 className={cn("text-[11px] font-bold truncate leading-tight", isRead ? "text-foreground/90" : "text-foreground")}>
                          {n.title}
                        </h4>
                        <p className="text-[10px] text-muted-foreground leading-normal line-clamp-2">
                          {n.message}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1 font-mono pt-1">
                          <Clock className="w-3 h-3" />
                          <span>{n.sentAt ? format(n.sentAt, 'dd MMM, HH:mm') : format(n.createdAt, 'dd MMM, HH:mm')}</span>
                        </p>
                      </div>

                      {/* Hover action bar */}
                      <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 flex items-center gap-1.5 transition-opacity">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteNotification(n.id);
                          }}
                          className="p-1 hover:bg-rose-550 dark:hover:bg-rose-950/40 rounded text-rose-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-24 text-center space-y-3 bg-muted/25 rounded-2xl border border-dashed border-border">
                  <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground mx-auto flex items-center justify-center">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">All caught up!</h5>
                    <p className="text-[9px] text-muted-foreground/80 mt-0.5">No unread alerts or notifications found.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Row */}
            <div className="pt-2 border-t border-border shrink-0">
              <button
                onClick={() => {
                  onClose();
                  navigate('/notifications');
                }}
                className="w-full h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg transition-colors font-mono"
              >
                Go to Notification Center
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
