import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  where,
  orderBy,
  limit,
  Timestamp,
  getDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { Company, UserRole, UserProfile, AppNotification } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Shield, 
  Activity, 
  Database, 
  Lock, 
  Unlock, 
  Calendar, 
  Search,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building2,
  Clock,
  Trash2,
  Mail,
  Phone,
  Globe,
  LayoutGrid,
  ListTree,
  Bell,
  Send,
  Plus,
  ArrowRight,
  FileText,
  BookOpen,
  Package,
  ClipboardList,
  Printer,
  Cpu,
  Settings
} from 'lucide-react';
import { format } from 'date-fns';
import { erpService } from '../services/erpService';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { SiteContentEditor } from './SiteContentEditor';

interface CompanyStats extends Company {
  userCount: number;
  lastActivity?: any;
  voucherCount: number;
  ledgerCount: number;
  itemCount: number;
  creatorEmail?: string;
}

export default function FounderPanel() {
  const { user: currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'Founder' || currentUser?.role === 'Marketing Manager' || currentUser?.email === 'sapientman46@gmail.com';
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [viewMode, setViewMode] = useState<'companies' | 'users' | 'notifications' | 'activity' | 'settings' | 'siteContent'>('companies');
  const [globalActivity, setGlobalActivity] = useState<any[]>([]);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isCreatingNotification, setIsCreatingNotification] = useState(false);
  const [newNotification, setNewNotification] = useState<Partial<AppNotification>>({
    title: '',
    message: '',
    type: 'info',
    targetType: 'all',
    status: 'sent',
    scheduledAt: Timestamp.now()
  });

  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const AVAILABLE_PERMISSIONS = [
    { id: 'Dashboard', label: 'Dashboard', icon: Activity },
    { id: 'Ledgers', label: 'Ledgers', icon: BookOpen },
    { id: 'Vouchers', label: 'Vouchers', icon: FileText },
    { id: 'Items', label: 'Items', icon: Package },
    { id: 'Employees', label: 'Employees', icon: Users },
    { id: 'Salary Sheets', label: 'Salary Sheets', icon: ClipboardList },
    { id: 'Order Management', label: 'Order Management', icon: Printer },
    { id: 'Machine Management', label: 'Machine Management', icon: Cpu },
    { id: 'Settings', label: 'Settings', icon: Settings }
  ];

  const { appVersion, updateSettings, updateSystemSettings, uiStyle, glassBackground, statusOnlineText, statusOfflineText, statusErrorText, systemLogo, notificationDuration, notificationAnimationStyle } = useSettings();
  const [localAppVersion, setLocalAppVersion] = useState(appVersion);
  const [localUIStyle, setLocalUIStyle] = useState(uiStyle);
  const [localGlassBackground, setLocalGlassBackground] = useState(glassBackground);
  const [localStatusOnline, setLocalStatusOnline] = useState(statusOnlineText);
  const [localStatusOffline, setLocalStatusOffline] = useState(statusOfflineText);
  const [localStatusError, setLocalStatusError] = useState(statusErrorText);
  const [localSystemLogo, setLocalSystemLogo] = useState(systemLogo || '');
  const [localNotificationDuration, setLocalNotificationDuration] = useState(notificationDuration);
  const [localNotificationAnimationStyle, setLocalNotificationAnimationStyle] = useState(notificationAnimationStyle);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setLocalAppVersion(appVersion);
  }, [appVersion]);

  useEffect(() => {
    setLocalUIStyle(uiStyle);
  }, [uiStyle]);

  useEffect(() => {
    setLocalStatusOnline(statusOnlineText);
  }, [statusOnlineText]);

  useEffect(() => {
    setLocalStatusOffline(statusOfflineText);
  }, [statusOfflineText]);

  useEffect(() => {
    setLocalStatusError(statusErrorText);
  }, [statusErrorText]);

  useEffect(() => {
    setLocalSystemLogo(systemLogo || '');
  }, [systemLogo]);

  useEffect(() => {
    setLocalNotificationDuration(notificationDuration);
  }, [notificationDuration]);

  useEffect(() => {
    setLocalNotificationAnimationStyle(notificationAnimationStyle);
  }, [notificationAnimationStyle]);

  useEffect(() => {
    setLocalGlassBackground(glassBackground);
  }, [glassBackground]);

  const safeFormat = (date: any, formatStr: string) => {
    try {
      if (!date) return 'N/A';
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return format(d, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [companiesSnap, usersSnap, notificationsData, activitySnap] = await Promise.all([
        getDocs(collection(db, 'companies')),
        erpService.getAllUsers(),
        erpService.getNotifications(currentUser?.uid || '', currentUser?.companyId || '', true),
        getDocs(query(collection(db, 'activity_log'), orderBy('createdAt', 'desc'), limit(50)))
      ]);
      
      setAllUsers(usersSnap);
      setNotifications(notificationsData);
      setGlobalActivity(activitySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      const companyData: CompanyStats[] = [];

      for (const companyDoc of companiesSnap.docs) {
        const data = companyDoc.data() as Company;
        const creatorId = data.createdBy || data.ownerId;
        
        // Fetch Creator Email
        let creatorEmail = 'Unknown';
        if (creatorId) {
          const user = usersSnap.find(u => u.uid === creatorId);
          if (user) {
            creatorEmail = user.email;
          }
        }

        // Fetch User Count (from pre-fetched users)
        const userCount = usersSnap.filter(u => u.companyId === companyDoc.id).length;
        
        // Fetch Voucher Count (as a proxy for DB size/usage)
        const [vouchersSnap, ledgersSnap, itemsSnap, activitySnap] = await Promise.all([
          getDocs(query(collection(db, 'vouchers'), where('companyId', '==', companyDoc.id))),
          getDocs(query(collection(db, 'ledgers'), where('companyId', '==', companyDoc.id))),
          getDocs(query(collection(db, 'items'), where('companyId', '==', companyDoc.id))),
          getDocs(query(
            collection(db, 'activity_log'), 
            where('companyId', '==', companyDoc.id),
            orderBy('createdAt', 'desc'),
            limit(1)
          ))
        ]);
        
        companyData.push({
          ...data,
          userCount,
          voucherCount: vouchersSnap.size,
          ledgerCount: ledgersSnap.size,
          itemCount: itemsSnap.size,
          lastActivity: activitySnap.docs[0]?.data(),
          creatorEmail
        });
      }

      setCompanies(companyData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const toggleAccess = async (company: CompanyStats) => {
    try {
      const companyRef = doc(db, 'companies', company.id);
      await updateDoc(companyRef, {
        isAccessEnabled: !company.isAccessEnabled
      });
      setCompanies(companies.map(c => 
        c.id === company.id ? { ...c, isAccessEnabled: !c.isAccessEnabled } : c
      ));
    } catch (error) {
      console.error('Error toggling access:', error);
    }
  };

  const updateSubscription = async (companyId: string, updates: any) => {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, updates);
      
      const updatedCompanies = companies.map(c => 
        c.id === companyId ? { ...c, ...updates } : c
      );
      setCompanies(updatedCompanies);
      
      if (selectedCompany?.id === companyId) {
        setSelectedCompany({ ...selectedCompany, ...updates });
      }
      
      setIsEditingSubscription(false);
    } catch (error) {
      console.error('Error updating subscription:', error);
    }
  };

  const deleteCompany = async (companyId: string) => {
    try {
      setLoading(true);
      await erpService.deleteCompany(companyId);
      
      const remainingCompanies = companies.filter(c => c.id !== companyId);
      setCompanies(remainingCompanies);
      setSelectedCompany(null);
      setCompanyToDelete(null);

      // If the Founder just deleted the company they were currently in, switch them to another one
      if (currentUser?.companyId === companyId) {
        if (remainingCompanies.length > 0) {
          await erpService.switchCompany(currentUser.uid, remainingCompanies[0].id);
        } else {
          // No companies left, set to placeholder
          await erpService.switchCompany(currentUser.uid, 'placeholder');
        }
      }
    } catch (error) {
      console.error('Error deleting company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSystemLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        showNotification('Logo size should be less than 1MB', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalSystemLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) return;
    
    try {
      setLoading(true);
      const data = {
        ...newNotification,
        createdBy: currentUser?.uid,
        sentAt: newNotification.status === 'sent' ? new Date() : undefined
      };
      await erpService.createNotification(data);
      setIsCreatingNotification(false);
      setNewNotification({
        title: '',
        message: '',
        type: 'info',
        targetType: 'all',
        status: 'sent'
      });
      fetchData();
    } catch (error) {
      console.error('Error creating notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setLoading(true);
      await erpService.deleteNotification(id);
      fetchData();
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchCompany = async (companyId: string) => {
    if (!currentUser?.uid) return;
    try {
      setLoading(true);
      await erpService.switchCompany(currentUser.uid, companyId);
      // The AuthContext will handle the state update and the UI will reflect the new company
      // We don't need to navigate away, but we should show a success indicator
    } catch (error) {
      console.error('Error switching company:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-[100]">
        <Activity className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <Shield className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-foreground uppercase tracking-widest">Access Denied</h2>
          <p className="text-xs text-gray-500 uppercase tracking-widest leading-relaxed">
            The Founder Panel is restricted to system administrators only.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-primary text-white text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-sm rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("p-6 space-y-6", uiStyle === 'UI/UX 2' && "bg-slate-50 min-h-screen")}>
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={cn(
            "text-2xl font-bold flex items-center gap-2",
            uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
          )}>
            <Shield className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-primary")} />
            Founder Dashboard
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <div className={cn(
            "flex items-center gap-2 border p-1.5 rounded-lg w-full sm:w-auto",
            uiStyle === 'UI/UX 2' ? "bg-white border-blue-100 shadow-sm" : "bg-card border-border"
          )}>
            <span className={cn(
              "text-[10px] font-bold uppercase px-2",
              uiStyle === 'UI/UX 2' ? "text-blue-400" : "text-gray-500"
            )}>v</span>
            <input 
              type="text" 
              value={localAppVersion} 
              onChange={(e) => setLocalAppVersion(e.target.value)}
              className={cn(
                "bg-transparent border-none text-[10px] font-mono focus:ring-0 w-16 p-0",
                uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
              )}
            />
            <button 
              onClick={() => {
                updateSystemSettings({ appVersion: localAppVersion });
                showNotification('App version updated');
              }}
              className={cn(
                "px-3 py-1 rounded text-[9px] font-bold uppercase transition-colors",
                uiStyle === 'UI/UX 2' 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              Update
            </button>
          </div>

          <div className={cn(
            "grid grid-cols-2 sm:flex sm:flex-row rounded-lg p-1 w-full sm:w-auto gap-1",
            uiStyle === 'UI/UX 2' ? "bg-blue-50" : "bg-muted"
          )}>
            <button
              onClick={() => setViewMode('companies')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'companies' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Companies
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'users' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ListTree className="w-4 h-4" />
              User Tree
            </button>
            <button
              onClick={() => setViewMode('notifications')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'notifications' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>
            <button
              onClick={() => setViewMode('activity')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'activity' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>
            <button
              onClick={() => setViewMode('siteContent')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'siteContent' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              Site Content
            </button>
            <button
              onClick={() => setViewMode('settings')}
              className={cn(
                "p-2 rounded-md transition-all flex items-center justify-center sm:justify-start gap-2 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap",
                viewMode === 'settings' 
                  ? uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white shadow-md" : "bg-background text-foreground shadow-sm"
                  : uiStyle === 'UI/UX 2' ? "text-blue-400 hover:text-blue-600" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Settings className="w-4 h-4" />
              System
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={viewMode === 'companies' ? "Search companies..." : "Search users..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary outline-none w-64"
            />
          </div>
          <button 
            onClick={fetchData}
            className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
            title="Refresh Data"
          >
            <Activity className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={cn(
          "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
          uiStyle === 'UI/UX 2' ? "bg-blue-600 border-blue-700 text-white shadow-blue-200" : ""
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              uiStyle === 'UI/UX 2' ? "bg-white/20" : "bg-primary/10"
            )}>
              <Users className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-white" : "text-primary")} />
            </div>
            <div>
              <p className={cn(
                "text-sm",
                uiStyle === 'UI/UX 2' ? "text-blue-100" : "text-muted-foreground"
              )}>Total Users</p>
              <p className="text-2xl font-bold">{allUsers.length}</p>
            </div>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
          uiStyle === 'UI/UX 2' ? "bg-emerald-600 border-emerald-700 text-white shadow-emerald-200" : ""
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              uiStyle === 'UI/UX 2' ? "bg-white/20" : "bg-emerald-500/10"
            )}>
              <CheckCircle2 className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-white" : "text-emerald-500")} />
            </div>
            <div>
              <p className={cn(
                "text-sm",
                uiStyle === 'UI/UX 2' ? "text-emerald-100" : "text-muted-foreground"
              )}>Active Subscriptions</p>
              <p className="text-2xl font-bold">
                {companies.filter(c => c.subscriptionStatus?.toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className={cn(
          "bg-card border border-border rounded-xl p-6 shadow-sm transition-all",
          uiStyle === 'UI/UX 2' ? "bg-amber-500 border-amber-600 text-white shadow-amber-200" : ""
        )}>
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-lg",
              uiStyle === 'UI/UX 2' ? "bg-white/20" : "bg-amber-500/10"
            )}>
              <AlertCircle className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-white" : "text-amber-500")} />
            </div>
            <div>
              <p className={cn(
                "text-sm",
                uiStyle === 'UI/UX 2' ? "text-amber-100" : "text-muted-foreground"
              )}>Trial Users</p>
              <p className="text-2xl font-bold">
                {companies.filter(c => c.subscriptionStatus?.toLowerCase() === 'trial').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'companies' ? (
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
        )}>
          <table className="w-full text-left text-sm">
            <thead className={cn(
              "font-medium border-b border-border",
              uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-muted/50 text-muted-foreground"
            )}>
              <tr>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4">Usage</th>
                <th className="px-6 py-4">Last Activity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className={cn(
                  "transition-colors group",
                  uiStyle === 'UI/UX 2' ? "hover:bg-blue-50/50" : "hover:bg-muted/30"
                )}>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{company.name}</span>
                      <span className="text-xs text-muted-foreground">{company.email || 'No email'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full w-fit ${
                        company.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                        company.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-500' :
                        'bg-rose-500/10 text-rose-500'
                      }`}>
                        {company.subscriptionStatus}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Exp: {safeFormat(company.expiryDate, 'dd MMM yyyy')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs flex items-center gap-1">
                        <Users className="w-3 h-3" /> {company.userCount} Users
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {company.voucherCount} Vouchers
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> {company.ledgerCount} Ledgers
                      </span>
                      <span className="text-xs flex items-center gap-1">
                        <Package className="w-3 h-3" /> {company.itemCount} Items
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {company.lastActivity ? (
                      <div className="flex flex-col">
                        <span className="text-xs text-foreground">{company.lastActivity.action}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {company.lastActivity.timestamp?.toDate ? safeFormat(company.lastActivity.timestamp.toDate(), 'dd MMM, HH:mm') : 'N/A'}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">No activity</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                      company.isAccessEnabled ? 'text-emerald-500' : 'text-rose-500'
                    }`}>
                      {company.isAccessEnabled ? (
                        <><CheckCircle2 className="w-4 h-4" /> Enabled</>
                      ) : (
                        <><XCircle className="w-4 h-4" /> Disabled</>
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {currentUser?.companyId !== company.id ? (
                        <button 
                           onClick={() => handleSwitchCompany(company.id)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                          title="Switch to this Company"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="p-2 text-emerald-500" title="Currently Active">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      <button 
                        onClick={() => toggleAccess(company)}
                        className={`p-2 rounded-lg transition-colors ${
                          company.isAccessEnabled 
                            ? 'text-rose-500 hover:bg-rose-500/10' 
                            : 'text-emerald-500 hover:bg-emerald-500/10'
                        }`}
                        title={company.isAccessEnabled ? 'Disable Access' : 'Enable Access'}
                      >
                        {company.isAccessEnabled ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => setCompanyToDelete(company.id)}
                        className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Delete Company"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setSelectedCompany(company)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : viewMode === 'siteContent' ? (
        <SiteContentEditor />
      ) : viewMode === 'users' ? (
        <div className="space-y-4">
          {allUsers
            .filter(u => u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((user) => {
              const userCompanies = companies.filter(c => 
                c.createdBy === user.uid || 
                c.ownerId === user.uid || 
                (c.email && c.email === user.email)
              );
              const isExpanded = expandedUsers.has(user.uid);

              return (
                <div key={user.uid} className={cn(
                  "bg-card border border-border rounded-xl overflow-hidden transition-all",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                )}>
                  <div 
                    onClick={() => toggleUserExpansion(user.uid)}
                    className={cn(
                      "p-4 flex items-center justify-between cursor-pointer transition-colors",
                      uiStyle === 'UI/UX 2' ? "hover:bg-blue-50/50" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-primary/10 text-primary"
                      )}>
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-sm font-bold",
                          uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
                        )}>{user.displayName || 'Unnamed User'}</h3>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPermissionsUser(user);
                          setSelectedPermissions(user.permissions || []);
                        }}
                        className={cn(
                          "p-2 rounded-lg transition-colors flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                          uiStyle === 'UI/UX 2' ? "text-blue-600 hover:bg-blue-50" : "text-primary hover:bg-primary/10"
                        )}
                        title="Manage Permissions"
                      >
                        <Shield className="w-4 h-4" />
                        Permissions
                      </button>
                      <span className={cn(
                        "text-[10px] uppercase font-bold px-2 py-1 rounded",
                        uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "text-gray-500 bg-muted"
                      )}>
                        {userCompanies.length} Companies
                      </span>
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-border bg-muted/10"
                      >
                        {userCompanies.length > 0 ? (
                          <div className="p-4 space-y-4">
                            {userCompanies.map((company) => (
                              <div key={company.id} className="bg-background border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-foreground">{company.name}</h4>
                                    <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                      company.subscriptionStatus === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                      company.subscriptionStatus === 'trial' ? 'bg-amber-500/10 text-amber-500' :
                                      'bg-rose-500/10 text-rose-500'
                                    }`}>
                                      {company.subscriptionStatus}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      <Mail className="w-3 h-3" />
                                      {company.email || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      <Phone className="w-3 h-3" />
                                      {company.phone || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                                      <Globe className="w-3 h-3" />
                                      {company.website || 'N/A'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {currentUser?.companyId !== company.id ? (
                                    <button 
                                      onClick={() => handleSwitchCompany(company.id)}
                                      className="px-3 py-1.5 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded hover:opacity-90 transition-all flex items-center gap-1"
                                    >
                                      <ArrowRight className="w-3 h-3" />
                                      Switch
                                    </button>
                                  ) : (
                                    <div className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded flex items-center gap-1">
                                      <CheckCircle2 className="w-3 h-3" />
                                      Active
                                    </div>
                                  )}
                                  <button 
                                    onClick={() => setSelectedCompany(company)}
                                    className="px-3 py-1.5 bg-muted text-foreground text-[10px] font-bold uppercase tracking-widest rounded hover:bg-muted/80 transition-all"
                                  >
                                    Manage
                                  </button>
                                  <button 
                                    onClick={() => setCompanyToDelete(company.id)}
                                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                                    title="Delete Company"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <p className="text-xs text-muted-foreground italic">This user hasn't created any companies yet.</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      ) : viewMode === 'activity' ? (
        <div className={cn(
          "bg-card border border-border rounded-xl shadow-sm overflow-hidden",
          uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
        )}>
          <div className={cn(
            "p-4 border-b border-border",
            uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-muted/30"
          )}>
            <h2 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
              <Activity className={cn("w-4 h-4", uiStyle === 'UI/UX 2' ? "text-white" : "text-primary")} />
              Global Activity Log (Last 50 Actions)
            </h2>
          </div>
          <div className="divide-y divide-border">
            {globalActivity.length > 0 ? (
              globalActivity.map((log) => {
                const company = companies.find(c => c.id === log.companyId);
                const user = allUsers.find(u => u.uid === log.userId);
                return (
                  <div key={log.id} className={cn(
                    "p-4 transition-colors flex items-center justify-between gap-4",
                    uiStyle === 'UI/UX 2' ? "hover:bg-blue-50/50" : "hover:bg-muted/30"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        uiStyle === 'UI/UX 2' ? "bg-blue-100 text-blue-600" : "bg-muted text-muted-foreground"
                      )}>
                        <Activity className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-sm font-bold",
                            uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
                          )}>{log.action}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
                            {company?.name || 'Unknown Company'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          by <span className={cn(
                            "font-medium",
                            uiStyle === 'UI/UX 2' ? "text-blue-500" : "text-foreground"
                          )}>{user?.displayName || log.userName || 'Unknown User'}</span>
                          {log.details && ` • ${log.details}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                        {log.createdAt?.toDate ? safeFormat(log.createdAt.toDate(), 'dd MMM, HH:mm:ss') : 'N/A'}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : viewMode === 'notifications' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>System Notifications</h2>
            <button
              onClick={() => setIsCreatingNotification(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all shadow-md",
                uiStyle === 'UI/UX 2' 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "bg-primary text-white hover:opacity-90"
              )}
            >
              <Plus className="w-4 h-4" />
              New Notification
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className={cn(
                  "bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4 transition-all",
                  uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
                )}>
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      n.type === 'info' ? 'bg-blue-500/10 text-blue-500' :
                      n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                      n.type === 'system_update' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-rose-500/10 text-rose-500'
                    )}>
                      {n.type === 'system_update' ? <Activity className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className={cn(
                          "font-bold",
                          uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
                        )}>{n.title}</h3>
                        <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                          n.status === 'sent' ? 'bg-emerald-500/10 text-emerald-500' :
                          n.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {n.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{n.message}</p>
                      <div className="flex items-center gap-4 pt-2">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          Target: {n.targetType.toUpperCase()} {n.targetId ? `(${n.targetId})` : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {n.status === 'scheduled' ? `Scheduled: ${safeFormat(n.scheduledAt, 'dd MMM, HH:mm')}` : `Sent: ${safeFormat(n.sentAt || n.createdAt, 'dd MMM, HH:mm')}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-sm text-muted-foreground italic">No notifications sent yet.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className={cn(
              "text-lg font-bold uppercase tracking-widest",
              uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
            )}>System Configuration</h2>
          </div>

          <div className={cn(
            "bg-card border border-border rounded-2xl p-8 max-w-2xl",
            uiStyle === 'UI/UX 2' && "border-blue-100 shadow-xl"
          )}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Online Status Text</label>
                  <input
                    type="text"
                    value={localStatusOnline}
                    onChange={(e) => setLocalStatusOnline(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Offline Status Text</label>
                  <input
                    type="text"
                    value={localStatusOffline}
                    onChange={(e) => setLocalStatusOffline(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Error Status Text</label>
                  <input
                    type="text"
                    value={localStatusError}
                    onChange={(e) => setLocalStatusError(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">App Version</label>
                  <input
                    type="text"
                    value={localAppVersion}
                    onChange={(e) => setLocalAppVersion(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Notification Duration (ms)</label>
                  <input
                    type="number"
                    value={localNotificationDuration}
                    onChange={(e) => setLocalNotificationDuration(Number(e.target.value))}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    step="500"
                    min="1000"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Notification Border Animation Style</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'default', label: 'Default Path', desc: 'Classic border trace' },
                    { id: 'neon', label: 'Neon Glow', desc: 'Pulsating neon border' },
                    { id: 'snake', label: 'Snake Chase', desc: 'Moving segment' },
                    { id: 'liquid', label: 'Liquid Flow', desc: 'Rotating gradient' },
                    { id: 'glitch', label: 'Cyber Glitch', desc: 'Digital distortion' },
                    { id: 'shimmer', label: 'Shimmer Sweep', desc: 'Elegant light sweep' }
                  ].map((style) => (
                    <button
                      key={style.id}
                      onClick={() => setLocalNotificationAnimationStyle(style.id as any)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left gap-1",
                        localNotificationAnimationStyle === style.id
                          ? "border-blue-500 bg-blue-500/5"
                          : "border-border bg-background hover:border-gray-400"
                      )}
                    >
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        localNotificationAnimationStyle === style.id ? "text-blue-500" : "text-foreground"
                      )}>
                        {style.label}
                      </span>
                      <span className="text-[9px] text-muted-foreground leading-tight">
                        {style.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Global UI Style</label>
                  <select 
                    value={localUIStyle}
                    onChange={(e) => setLocalUIStyle(e.target.value as any)}
                    className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="UI/UX 1">UI/UX 1 (Classic)</option>
                    <option value="UI/UX 2">UI/UX 2 (Modern Colorized)</option>
                    <option value="UI/UX 3">UI/UX 3 (Glassmorphism macOS)</option>
                  </select>
                  <p className="text-[9px] text-muted-foreground uppercase">Choose the overall UI/UX style for the application.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Default Glass Gradient Background (UI/UX 3)</label>
                <select 
                  value={localGlassBackground}
                  onChange={(e) => setLocalGlassBackground(e.target.value as any)}
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="default">Default (Dynamic Gradient)</option>
                  <option value="sunset">Sunset Glow (Warm)</option>
                  <option value="ocean">Deep Ocean (Cool)</option>
                  <option value="aurora">Aurora Borealis (Green/Purple)</option>
                  <option value="minimal">Minimal Soft Gray</option>
                </select>
                <p className="text-[9px] text-muted-foreground uppercase">Choose the global default background for Glassmorphism style.</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">System Logo (Global Default)</label>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 border border-dashed border-border flex items-center justify-center bg-foreground/5 overflow-hidden rounded-lg">
                    {localSystemLogo ? (
                      <img src={localSystemLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground opacity-20" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                      <label className="flex-1 cursor-pointer bg-foreground/5 border border-border hover:bg-foreground/10 transition-all p-2 text-center rounded-lg">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Upload System Logo</span>
                        <input type="file" accept="image/*" onChange={handleSystemLogoUpload} className="hidden" />
                      </label>
                      {localSystemLogo && (
                        <button 
                          onClick={() => setLocalSystemLogo('')}
                          className="p-2 border border-border text-rose-500 hover:bg-rose-500/10 transition-all rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Or set via URL</label>
                      <input
                        type="text"
                        placeholder="https://example.com/logo.png"
                        value={localSystemLogo}
                        onChange={(e) => setLocalSystemLogo(e.target.value)}
                        className="w-full bg-background border border-border rounded-lg p-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <p className="text-[9px] text-muted-foreground uppercase">This logo will be used as a default for all companies if they don't have their own logo.</p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={async () => {
                    try {
                      await updateSystemSettings({
                        statusOnlineText: localStatusOnline,
                        statusOfflineText: localStatusOffline,
                        statusErrorText: localStatusError,
                        appVersion: localAppVersion,
                        systemLogo: localSystemLogo,
                        uiStyle: localUIStyle,
                        glassBackground: localGlassBackground,
                        notificationDuration: localNotificationDuration,
                        notificationAnimationStyle: localNotificationAnimationStyle
                      });
                      showNotification('System configuration updated successfully', 'success');
                    } catch (err) {
                      showNotification('Failed to update system configuration', 'error');
                    }
                  }}
                  className={cn(
                    "w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg",
                    uiStyle === 'UI/UX 2' 
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200" 
                      : "bg-primary text-white hover:opacity-90 shadow-primary/20"
                  )}
                >
                  Save Global Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Notification Modal */}
      <AnimatePresence>
        {isCreatingNotification && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">New System Notification</h2>
                <button 
                  onClick={() => setIsCreatingNotification(false)}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Title</label>
                  <input
                    type="text"
                    value={newNotification.title}
                    onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                    placeholder="Notification Title"
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground">Message</label>
                  <textarea
                    value={newNotification.message}
                    onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
                    placeholder="Enter your message here..."
                    rows={4}
                    className="w-full bg-background border border-border rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Type</label>
                    <select
                      value={newNotification.type}
                      onChange={(e) => setNewNotification({ ...newNotification, type: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="info">Information</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="system_update">System Update</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Status</label>
                    <select
                      value={newNotification.status}
                      onChange={(e) => setNewNotification({ ...newNotification, status: e.target.value as any })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="sent">Send Now</option>
                      <option value="scheduled">Schedule for Later</option>
                      <option value="draft">Save as Draft</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Target Type</label>
                    <select
                      value={newNotification.targetType}
                      onChange={(e) => setNewNotification({ ...newNotification, targetType: e.target.value as any, targetId: '' })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    >
                      <option value="all">All Users</option>
                      <option value="company">Specific Company</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>
                  {newNotification.targetType !== 'all' && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-muted-foreground">Target ID</label>
                      {newNotification.targetType === 'company' ? (
                        <select
                          value={newNotification.targetId}
                          onChange={(e) => setNewNotification({ ...newNotification, targetId: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="">Select Company</option>
                          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                      ) : (
                        <select
                          value={newNotification.targetId}
                          onChange={(e) => setNewNotification({ ...newNotification, targetId: e.target.value })}
                          className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                        >
                          <option value="">Select User</option>
                          {allUsers.map(u => <option key={u.uid} value={u.uid}>{u.displayName || u.email}</option>)}
                        </select>
                      )}
                    </div>
                  )}
                </div>

                {newNotification.status === 'scheduled' && (
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground">Schedule Date & Time</label>
                    <input
                      type="datetime-local"
                      onChange={(e) => setNewNotification({ ...newNotification, scheduledAt: Timestamp.fromDate(new Date(e.target.value)) })}
                      className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                    />
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    onClick={() => setIsCreatingNotification(false)}
                    className="flex-1 py-2 border border-border text-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateNotification}
                    disabled={!newNotification.title || !newNotification.message}
                    className="flex-1 py-2 bg-primary text-white rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {newNotification.status === 'sent' ? 'Send Now' : 'Save Notification'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permissions Modal */}
      <AnimatePresence>
        {editingPermissionsUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-widest">User Permissions</h2>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                      Managing access for {editingPermissionsUser.displayName}
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingPermissionsUser(null)} className="p-2 hover:bg-foreground/5 rounded-full transition-colors">
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <p className="text-xs text-muted-foreground italic">
                  Select the features this user should be able to access. If no permissions are selected, the user will have default access based on their role.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {AVAILABLE_PERMISSIONS.map((permission) => {
                    const Icon = permission.icon;
                    const isSelected = selectedPermissions.includes(permission.id);
                    return (
                      <button
                        key={permission.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedPermissions(prev => prev.filter(p => p !== permission.id));
                          } else {
                            setSelectedPermissions(prev => [...prev, permission.id]);
                          }
                        }}
                        className={cn(
                          "flex items-center gap-3 p-3 border transition-all text-left",
                          isSelected 
                            ? "bg-primary/10 border-primary text-primary" 
                            : "bg-background border-border text-muted-foreground hover:border-foreground"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center",
                          isSelected ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">{permission.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={() => setEditingPermissionsUser(null)}
                    className={cn(
                      "flex-1 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all",
                      uiStyle === 'UI/UX 2' ? "border-blue-100 text-blue-600 hover:bg-blue-50" : "border-border text-foreground hover:bg-foreground/5"
                    )}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={async () => {
                      try {
                        await erpService.updateUserPermissions(editingPermissionsUser.uid, selectedPermissions);
                        showNotification('Permissions updated successfully');
                        setEditingPermissionsUser(null);
                        fetchData();
                      } catch (err) {
                        showNotification('Failed to update permissions', 'error');
                      }
                    }}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all",
                      uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200" : "bg-primary text-white hover:opacity-90 shadow-sm rounded-lg"
                    )}
                  >
                    Save Permissions
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Company Details Modal */}
      <AnimatePresence>
        {selectedCompany && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">Company Details: {selectedCompany.name}</h2>
                <button 
                  onClick={() => {
                    setSelectedCompany(null);
                    setIsEditingSubscription(false);
                  }}
                  className="p-2 hover:bg-foreground/5 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Subscription Status</p>
                    {isEditingSubscription ? (
                      <div className="grid grid-cols-3 gap-2">
                        {['active', 'inactive', 'trial'].map(status => (
                          <button
                            key={status}
                            onClick={() => updateSubscription(selectedCompany.id, { subscriptionStatus: status })}
                            className={cn(
                              "py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                              selectedCompany.subscriptionStatus === status 
                                ? status === 'active' ? "bg-emerald-500 border-emerald-600 text-white shadow-lg" :
                                  status === 'trial' ? "bg-amber-500 border-amber-600 text-white shadow-lg" :
                                  "bg-rose-500 border-rose-600 text-white shadow-lg"
                                : "bg-background border-border text-muted-foreground hover:border-foreground"
                            )}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className={cn(
                        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest",
                        selectedCompany.subscriptionStatus === 'active' ? "bg-emerald-500/10 text-emerald-500" :
                        selectedCompany.subscriptionStatus === 'trial' ? "bg-amber-500/10 text-amber-500" :
                        "bg-rose-500/10 text-rose-500"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full animate-pulse",
                          selectedCompany.subscriptionStatus === 'active' ? "bg-emerald-500" :
                          selectedCompany.subscriptionStatus === 'trial' ? "bg-amber-500" :
                          "bg-rose-500"
                        )} />
                        {selectedCompany.subscriptionStatus}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Plan Type</p>
                    {isEditingSubscription ? (
                      <div className="grid grid-cols-3 gap-2">
                        {['free', 'monthly', 'yearly'].map(plan => (
                          <button
                            key={plan}
                            onClick={() => updateSubscription(selectedCompany.id, { planType: plan })}
                            className={cn(
                              "py-2 px-3 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all",
                              selectedCompany.planType === plan 
                                ? "bg-primary border-primary text-white shadow-lg"
                                : "bg-background border-border text-muted-foreground hover:border-foreground"
                            )}
                          >
                            {plan}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-foreground uppercase tracking-widest bg-muted/50 px-3 py-1.5 rounded-lg w-fit">
                        {selectedCompany.planType}
                      </p>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Expiry Date</p>
                    {isEditingSubscription ? (
                      <input 
                        type="date"
                        value={selectedCompany.expiryDate && !isNaN(new Date(selectedCompany.expiryDate).getTime()) ? format(new Date(selectedCompany.expiryDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updateSubscription(selectedCompany.id, { expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full bg-background border border-border rounded-lg p-2.5 text-sm outline-none focus:border-primary"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground bg-muted/50 px-3 py-1.5 rounded-lg w-fit">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {safeFormat(selectedCompany.expiryDate, 'dd MMM yyyy')}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Access Control</p>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full",
                        selectedCompany.isAccessEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                      )}>
                        {selectedCompany.isAccessEnabled ? (
                          <><CheckCircle2 className="w-3 h-3" /> Enabled</>
                        ) : (
                          <><XCircle className="w-3 h-3" /> Disabled</>
                        )}
                      </span>
                      <button 
                        onClick={() => toggleAccess(selectedCompany)}
                        className="text-[10px] font-bold text-primary hover:underline uppercase tracking-widest"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-border flex gap-4">
                  <button 
                    onClick={() => {
                      setSelectedCompany(null);
                      setIsEditingSubscription(false);
                    }}
                    className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest hover:bg-muted transition-all"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => setIsEditingSubscription(!isEditingSubscription)}
                    className={cn(
                      "flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg",
                      isEditingSubscription 
                        ? "bg-emerald-600 text-white hover:bg-emerald-700" 
                        : "bg-primary text-white hover:opacity-90"
                    )}
                  >
                    {isEditingSubscription ? 'Save Changes' : 'Edit Subscription'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {companyToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center gap-3 text-rose-500 mb-4">
                <AlertCircle className="w-6 h-6" />
                <h3 className="text-lg font-bold">Delete Company?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete this company and all its data? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteCompany(companyToDelete)}
                  className="px-4 py-2 bg-rose-500 text-white text-sm font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600 transition-colors"
                >
                  Delete Everything
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
