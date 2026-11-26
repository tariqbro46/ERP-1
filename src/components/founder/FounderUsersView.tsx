import React, { useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Cpu,
  FileText,
  Globe,
  KeyRound,
  Mail,
  Package,
  Phone,
  Plus,
  Printer,
  Search,
  Settings,
  Shield,
  Trash2,
  UserPlus,
  Users,
  ClipboardList,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { erpService } from '../../services/erpService';
import { useSettings } from '../../contexts/SettingsContext';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { CompanyStats } from './types';

const AVAILABLE_PERMISSIONS = [
  { id: 'Dashboard', label: 'Dashboard', icon: Activity },
  { id: 'Ledgers', label: 'Ledgers', icon: BookOpen },
  { id: 'Vouchers', label: 'Vouchers', icon: FileText },
  { id: 'Items', label: 'Items', icon: Package },
  { id: 'Employees', label: 'Employees', icon: Users },
  { id: 'Salary Sheets', label: 'Salary Sheets', icon: ClipboardList },
  { id: 'Order Management', label: 'Order Management', icon: Printer },
  { id: 'Machine Management', label: 'Machine Management', icon: Cpu },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

const ROLE_OPTIONS = ['ALL', 'Founder', 'Marketing Manager', 'Admin', 'Manager', 'Staff'] as const;

interface FounderUsersViewProps {
  allUsers: any[];
  setAllUsers: React.Dispatch<React.SetStateAction<any[]>>;
  companies: CompanyStats[];
  currentUser: UserProfile | null;
  onSwitchCompany: (companyId: string) => Promise<void>;
  onSelectCompany: (company: CompanyStats) => void;
  onDeleteCompany: (companyId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  showNotification: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

export const FounderUsersView: React.FC<FounderUsersViewProps> = ({
  allUsers,
  setAllUsers,
  companies,
  currentUser,
  onSwitchCompany,
  onSelectCompany,
  onDeleteCompany,
  onRefresh,
  showNotification,
}) => {
  const { uiStyle } = useSettings();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [tenantFilter, setTenantFilter] = useState<string>('ALL');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const [editingPermissionsUser, setEditingPermissionsUser] = useState<UserProfile | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    displayName: '',
    email: '',
    password: '',
    role: 'Admin',
    companyId: '',
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  const [resetPwdUser, setResetPwdUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return allUsers.filter((u) => {
      const matchesQuery =
        !q ||
        u.displayName?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.uid?.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || (u.role || 'Staff') === roleFilter;
      const matchesTenant = tenantFilter === 'ALL' || (u.companyId || '') === tenantFilter;
      return matchesQuery && matchesRole && matchesTenant;
    });
  }, [allUsers, searchTerm, roleFilter, tenantFilter]);

  const toggleUserExpansion = (userId: string) => {
    const next = new Set(expandedUsers);
    if (next.has(userId)) next.delete(userId);
    else next.add(userId);
    setExpandedUsers(next);
  };

  const getBearerHeaders = async () => {
    const token = await auth.currentUser?.getIdToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.email.trim() || !newUserForm.displayName.trim() || newUserForm.password.length < 6) {
      showNotification('Provide valid name, email, and password (min 6 chars).', 'error');
      return;
    }
    setIsSubmittingUser(true);
    try {
      const headers = await getBearerHeaders();
      const resp = await fetch('/api/admin/users', {
        method: 'POST',
        headers,
        body: JSON.stringify(newUserForm),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        throw new Error(data.error || `Request failed (${resp.status})`);
      }
      showNotification(`User "${newUserForm.displayName}" created successfully`, 'success');
      setCreateUserOpen(false);
      setNewUserForm({ displayName: '', email: '', password: '', role: 'Admin', companyId: '' });
      await onRefresh();
    } catch (err: any) {
      showNotification(err.message || 'Failed to create user', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPwdUser || newPassword.length < 6) {
      showNotification('Password must be at least 6 characters.', 'error');
      return;
    }
    setIsSubmittingUser(true);
    try {
      const headers = await getBearerHeaders();
      const resp = await fetch(`/api/admin/users/${encodeURIComponent(resetPwdUser.uid)}/reset-password`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ newPassword }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status})`);
      showNotification(`Password reset for ${resetPwdUser.email}`, 'success');
      setResetPwdUser(null);
      setNewPassword('');
    } catch (err: any) {
      showNotification(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsSubmittingUser(true);
    try {
      const headers = await getBearerHeaders();
      const resp = await fetch(`/api/admin/users/${encodeURIComponent(userToDelete.uid)}`, {
        method: 'DELETE',
        headers,
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data.error || `Request failed (${resp.status})`);
      setAllUsers((prev) => prev.filter((u) => u.uid !== userToDelete.uid));
      showNotification(`Deleted user ${userToDelete.email}`, 'success');
      setUserToDelete(null);
    } catch (err: any) {
      showNotification(err.message || 'Failed to delete user', 'error');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleToggleUserStatus = async (user: any) => {
    if (user.uid === currentUser?.uid || user.role === 'Founder') {
      showNotification('Founder and self accounts cannot be disabled here.', 'warning');
      return;
    }
    const nextStatus = user.status === 'disabled' ? 'active' : 'disabled';
    try {
      await updateDoc(doc(db, 'users', user.uid), { status: nextStatus });
      setAllUsers((prev) => prev.map((u) => (u.uid === user.uid ? { ...u, status: nextStatus } : u)));
      showNotification(`User ${user.email} marked ${nextStatus}`, 'info');
    } catch (err: any) {
      showNotification(err.message || 'Failed to update user status', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Toolbar */}
      <div className="bg-card border border-border rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users by name, email, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-lg text-xs focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r} value={r}>
                {r === 'ALL' ? 'All Roles' : r}
              </option>
            ))}
          </select>

          <select
            value={tenantFilter}
            onChange={(e) => setTenantFilter(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-primary max-w-[220px]"
          >
            <option value="ALL">All Tenants ({companies.length})</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setCreateUserOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 hover:opacity-90 transition-all shadow-sm shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* User Directory Tree */}
      <div className="overflow-x-auto pb-4">
        <div className="min-w-[600px] lg:min-w-0 space-y-4">
          {filteredUsers.map((user) => {
            const userCompanies = companies.filter(
              (c) =>
                c.createdBy === user.uid ||
                c.ownerId === user.uid ||
                (c.email && c.email === user.email)
            );
            const assignedCompany = companies.find((c) => c.id === user.companyId);
            const isExpanded = expandedUsers.has(user.uid);
            const isSelfOrFounder = user.uid === currentUser?.uid || user.role === 'Founder';

            return (
              <div
                key={user.uid}
                className={cn(
                  'bg-card border border-border rounded-xl overflow-hidden transition-all',
                  uiStyle === 'UI/UX 2' && 'border-blue-100 shadow-md'
                )}
              >
                <div
                  onClick={() => toggleUserExpansion(user.uid)}
                  className={cn(
                    'p-4 flex items-center justify-between cursor-pointer transition-colors gap-4',
                    uiStyle === 'UI/UX 2' ? 'hover:bg-blue-50/50' : 'hover:bg-muted/30'
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
                        uiStyle === 'UI/UX 2' ? 'bg-blue-600 text-white' : 'bg-primary/10 text-primary'
                      )}
                    >
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={cn(
                            'text-sm font-bold truncate',
                            uiStyle === 'UI/UX 2' ? 'text-blue-600' : 'text-foreground'
                          )}
                        >
                          {user.displayName || 'Unnamed User'}
                        </h3>
                        <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {user.role || 'Staff'}
                        </span>
                        {user.status === 'disabled' && (
                          <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-500">
                            Disabled
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {user.email}
                        {assignedCompany ? ` · Tenant: ${assignedCompany.name}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPermissionsUser(user);
                        setSelectedPermissions(user.permissions || []);
                      }}
                      className={cn(
                        'p-2 rounded-lg transition-colors flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest',
                        uiStyle === 'UI/UX 2'
                          ? 'text-blue-600 hover:bg-blue-50'
                          : 'text-primary hover:bg-primary/10'
                      )}
                      title="Manage Permissions"
                    >
                      <Shield className="w-4 h-4" />
                      Permissions
                    </button>

                    {!isSelfOrFounder && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setResetPwdUser(user);
                            setNewPassword('');
                          }}
                          className="p-2 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleUserStatus(user);
                          }}
                          className={cn(
                            'px-2.5 py-1 rounded text-[9px] font-bold uppercase tracking-wider border transition-colors',
                            user.status === 'disabled'
                              ? 'border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10'
                              : 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
                          )}
                        >
                          {user.status === 'disabled' ? 'Enable' : 'Disable'}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setUserToDelete(user);
                          }}
                          className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <span
                      className={cn(
                        'text-[10px] uppercase font-bold px-2 py-1 rounded',
                        uiStyle === 'UI/UX 2' ? 'bg-blue-600 text-white' : 'text-muted-foreground bg-muted'
                      )}
                    >
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
                      <div className="border-b border-border bg-muted/20 p-4">
                        <div className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-5">
                          <div className="flex items-center md:items-start gap-4">
                            <img
                              src={
                                user.photoURL ||
                                `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user.email || 'default'}`
                              }
                              alt={user.displayName}
                              className="w-16 h-16 rounded-full border border-border object-cover bg-background shrink-0 shadow-sm"
                              referrerPolicy="no-referrer"
                            />
                            <div className="space-y-1 min-w-0">
                              <h4 className="text-sm font-bold text-foreground">User Profile Information</h4>
                              <p className="text-[11px] font-medium text-muted-foreground truncate">
                                <span className="font-semibold text-foreground">Designation:</span>{' '}
                                {user.designation || 'Not specified'}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground truncate">
                                <span className="font-semibold text-foreground">Department:</span>{' '}
                                {user.department || 'Not specified'}
                              </p>
                              <p className="text-[11px] font-medium text-muted-foreground truncate">
                                <span className="font-semibold text-foreground">Phone:</span>{' '}
                                {user.phone || 'Not specified'}
                              </p>
                            </div>
                          </div>

                          <div className="flex-1 space-y-1.5 md:border-l md:border-border md:pl-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <p className="text-muted-foreground">
                                <span className="font-semibold text-foreground">City:</span> {user.city || 'N/A'}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-semibold text-foreground">State:</span> {user.state || 'N/A'}
                              </p>
                              <p className="text-muted-foreground">
                                <span className="font-semibold text-foreground">Country:</span>{' '}
                                {user.country || 'N/A'}
                              </p>
                            </div>
                            {user.address && (
                              <p className="text-[11px] text-muted-foreground leading-normal italic pl-2 border-l-2 border-primary/40 mt-1">
                                {user.address}
                              </p>
                            )}
                            <div className="pt-1.5 border-t border-border mt-2">
                              <p className="text-[11px] text-muted-foreground leading-relaxed">
                                <span className="font-semibold text-foreground block mb-0.5">Bio / Summary:</span>
                                <span className="italic">{user.bio || 'No bio provided.'}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {userCompanies.length > 0 ? (
                        <div className="p-4 space-y-4">
                          {userCompanies.map((company) => (
                            <div
                              key={company.id}
                              className="bg-background border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-foreground">{company.name}</h4>
                                  <span
                                    className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                      company.subscriptionStatus === 'active'
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : company.subscriptionStatus === 'trial'
                                        ? 'bg-amber-500/10 text-amber-500'
                                        : 'bg-rose-500/10 text-rose-500'
                                    }`}
                                  >
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
                                    onClick={() => onSwitchCompany(company.id)}
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
                                  onClick={() => onSelectCompany(company)}
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
                          <p className="text-xs text-muted-foreground italic">
                            This user hasn&apos;t created any companies yet.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permissions Modal */}
      <AnimatePresence>
        {editingPermissionsUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-lg shadow-2xl overflow-hidden rounded-xl"
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
                <button
                  onClick={() => setEditingPermissionsUser(null)}
                  className="p-2 hover:bg-foreground/5 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <p className="text-xs text-muted-foreground italic">
                  Select the features this user should be able to access. If no permissions are selected, the
                  user will have default access based on their role.
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
                            setSelectedPermissions((prev) => prev.filter((p) => p !== permission.id));
                          } else {
                            setSelectedPermissions((prev) => [...prev, permission.id]);
                          }
                        }}
                        className={cn(
                          'flex items-center gap-3 p-3 border transition-all text-left rounded-lg',
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-background border-border text-muted-foreground hover:border-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {permission.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setEditingPermissionsUser(null)}
                    className="flex-1 py-3 border border-border text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await erpService.updateUserPermissions(
                          editingPermissionsUser.uid,
                          selectedPermissions
                        );
                        showNotification('Permissions updated successfully');
                        setEditingPermissionsUser(null);
                        onRefresh();
                      } catch {
                        showNotification('Failed to update permissions', 'error');
                      }
                    }}
                    className="flex-1 py-3 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:opacity-90 shadow-sm transition-all"
                  >
                    Save Permissions
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create User Modal */}
      <AnimatePresence>
        {createUserOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-base font-bold text-foreground">Create ERP User</h3>
                <button
                  onClick={() => setCreateUserOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateUser} className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Display Name
                  </label>
                  <input
                    required
                    type="text"
                    value={newUserForm.displayName}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, displayName: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    value={newUserForm.email}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, email: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    Initial Password
                  </label>
                  <input
                    required
                    minLength={6}
                    type="password"
                    value={newUserForm.password}
                    onChange={(e) => setNewUserForm((p) => ({ ...p, password: e.target.value }))}
                    className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Role
                    </label>
                    <select
                      value={newUserForm.role}
                      onChange={(e) => setNewUserForm((p) => ({ ...p, role: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Admin">Admin</option>
                      <option value="Marketing Manager">Marketing Manager</option>
                      <option value="Manager">Manager</option>
                      <option value="Staff">Staff</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      Company
                    </label>
                    <select
                      required
                      value={newUserForm.companyId}
                      onChange={(e) => setNewUserForm((p) => ({ ...p, companyId: e.target.value }))}
                      className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Tenant</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCreateUserOpen(false)}
                    className="flex-1 py-2.5 border border-border rounded-lg text-[10px] font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmittingUser ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {resetPwdUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Reset User Password</h3>
                <button onClick={() => setResetPwdUser(null)} className="p-1.5 rounded-lg hover:bg-muted">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleResetPassword} className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Setting a new password for <span className="font-bold text-foreground">{resetPwdUser.email}</span>
                </p>
                <input
                  required
                  minLength={6}
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg p-2.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setResetPwdUser(null)}
                    className="flex-1 py-2 border border-border rounded-lg text-[10px] font-bold uppercase tracking-widest"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingUser}
                    className="flex-1 py-2 bg-amber-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {isSubmittingUser ? 'Saving...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4"
            >
              <h3 className="text-base font-bold text-rose-500">Delete User Account?</h3>
              <p className="text-xs text-muted-foreground">
                Remove <span className="font-bold text-foreground">{userToDelete.email}</span> from Firebase
                Auth and Firestore?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setUserToDelete(null)}
                  className="flex-1 py-2 border border-border rounded-lg text-[10px] font-bold uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  disabled={isSubmittingUser}
                  onClick={handleDeleteUser}
                  className="flex-1 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest disabled:opacity-50"
                >
                  Delete User
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Company Confirmation Modal */}
      <AnimatePresence>
        {companyToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <h3 className="text-lg font-bold text-rose-500">Delete Company?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete this company and all its data? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setCompanyToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    const id = companyToDelete;
                    setCompanyToDelete(null);
                    await onDeleteCompany(id);
                  }}
                  className="px-4 py-2 bg-rose-500 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-rose-600"
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
};
