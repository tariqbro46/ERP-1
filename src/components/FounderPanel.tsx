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
import { Company, UserRole } from '../types';
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
  Clock,
  Trash2,
  Mail,
  Phone,
  Globe,
  LayoutGrid,
  ListTree,
  Bell,
  Send,
  Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { erpService } from '../services/erpService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { AppNotification } from '../types';

interface CompanyStats extends Company {
  userCount: number;
  lastActivity?: any;
  voucherCount: number;
  creatorEmail?: string;
}

export default function FounderPanel() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = currentUser?.role === 'Founder' || currentUser?.role === 'Marketing Manager' || currentUser?.email === 'sapientman46@gmail.com';
  const [companies, setCompanies] = useState<CompanyStats[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CompanyStats | null>(null);
  const [isEditingSubscription, setIsEditingSubscription] = useState(false);
  const [viewMode, setViewMode] = useState<'companies' | 'users' | 'notifications'>('companies');
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

  useEffect(() => {
    fetchData();
  }, []);

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
      const [companiesSnap, usersSnap, notificationsData] = await Promise.all([
        getDocs(collection(db, 'companies')),
        erpService.getAllUsers(),
        erpService.getNotifications(currentUser?.uid || '', currentUser?.companyId || '', true)
      ]);
      
      setAllUsers(usersSnap);
      setNotifications(notificationsData);
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
        const vouchersSnap = await getDocs(query(collection(db, 'vouchers'), where('companyId', '==', companyDoc.id)));
        
        // Fetch Last Activity
        const activitySnap = await getDocs(query(
          collection(db, 'activity_log'), 
          where('companyId', '==', companyDoc.id),
          orderBy('createdAt', 'desc'),
          limit(1)
        ));

        companyData.push({
          ...data,
          userCount,
          voucherCount: vouchersSnap.size,
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
            className="px-6 py-2 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-foreground/90 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Founder Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">Manage platform users, subscriptions, and system health.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('companies')}
              className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                viewMode === 'companies' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Companies
            </button>
            <button
              onClick={() => setViewMode('users')}
              className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                viewMode === 'users' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTree className="w-4 h-4" />
              User Tree
            </button>
            <button
              onClick={() => setViewMode('notifications')}
              className={`p-2 rounded-md transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${
                viewMode === 'notifications' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bell className="w-4 h-4" />
              Notifications
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
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{allUsers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-2xl font-bold">
                {companies.filter(c => c.subscriptionStatus?.toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500/10 rounded-lg">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trial Users</p>
              <p className="text-2xl font-bold">
                {companies.filter(c => c.subscriptionStatus?.toLowerCase() === 'trial').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'companies' ? (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
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
                <tr key={company.id} className="hover:bg-muted/30 transition-colors group">
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
                        <Database className="w-3 h-3" /> {company.voucherCount} Vouchers
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
                <div key={user.uid} className="bg-card border border-border rounded-xl overflow-hidden">
                  <div 
                    onClick={() => toggleUserExpansion(user.uid)}
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{user.displayName || 'Unnamed User'}</h3>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] uppercase font-bold text-gray-500 bg-muted px-2 py-1 rounded">
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
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-foreground uppercase tracking-widest">System Notifications</h2>
            <button
              onClick={() => setIsCreatingNotification(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded-lg hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              New Notification
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${
                      n.type === 'info' ? 'bg-blue-500/10 text-blue-500' :
                      n.type === 'warning' ? 'bg-amber-500/10 text-amber-500' :
                      n.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                      n.type === 'system_update' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-rose-500/10 text-rose-500'
                    }`}>
                      {n.type === 'system_update' ? <Activity className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-foreground">{n.title}</h3>
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
                    className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-bold uppercase tracking-widest text-[10px] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Subscription Status</p>
                    {isEditingSubscription ? (
                      <select 
                        value={selectedCompany.subscriptionStatus}
                        onChange={(e) => updateSubscription(selectedCompany.id, { subscriptionStatus: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="trial">Trial</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium">{selectedCompany.subscriptionStatus}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Plan Type</p>
                    {isEditingSubscription ? (
                      <select 
                        value={selectedCompany.planType}
                        onChange={(e) => updateSubscription(selectedCompany.id, { planType: e.target.value })}
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                      >
                        <option value="free">Free</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    ) : (
                      <p className="text-sm font-medium">{selectedCompany.planType}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Expiry Date</p>
                    {isEditingSubscription ? (
                      <input 
                        type="date"
                        value={selectedCompany.expiryDate && !isNaN(new Date(selectedCompany.expiryDate).getTime()) ? format(new Date(selectedCompany.expiryDate), 'yyyy-MM-dd') : ''}
                        onChange={(e) => updateSubscription(selectedCompany.id, { expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                        className="w-full bg-background border border-border rounded-lg p-2 text-sm"
                      />
                    ) : (
                      <p className="text-sm font-medium">
                        {safeFormat(selectedCompany.expiryDate, 'dd MMM yyyy')}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase font-bold">Access Control</p>
                    <p className="text-sm font-medium flex items-center gap-2">
                      {selectedCompany.isAccessEnabled ? 'Enabled' : 'Disabled'}
                      <button 
                        onClick={() => toggleAccess(selectedCompany)}
                        className="text-[10px] text-primary hover:underline"
                      >
                        Toggle
                      </button>
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-border">
                  <button 
                    onClick={() => setIsEditingSubscription(!isEditingSubscription)}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    {isEditingSubscription ? 'Finish Editing' : 'Edit Subscription'}
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
