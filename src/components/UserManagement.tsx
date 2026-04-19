import React, { useEffect, useState } from 'react';
import { useAuth, Profile, UserRole } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Users, Shield, ShieldCheck, ShieldAlert, Mail, Calendar, Loader2, Search, UserPlus, Trash2, Key, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { erpService } from '../services/erpService';

import { useSubscription } from '../hooks/useSubscription';

export const UserManagement: React.FC = () => {
  const { isAdmin, isSuperAdmin, user } = useAuth();
  const { uiStyle } = useSettings();
  const { checkLimit } = useSubscription();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Add User Form
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    displayName: '',
    role: 'Staff' as UserRole,
    target_amount: 0
  });
  const [addLoading, setAddLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.companyId) {
      fetchProfiles();
    }
  }, [user?.companyId]);

  const fetchProfiles = async () => {
    try {
      const data = await erpService.getUsers(user!.companyId);
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (uid: string, newRole: UserRole) => {
    if (uid === user?.uid) {
      alert("You cannot change your own role.");
      return;
    }

    if (!checkLimit('rolePermissions')) {
      return;
    }

    setUpdatingId(uid);
    try {
      await erpService.updateUserRole(uid, newRole);
      setProfiles(profiles.map(p => p.uid === uid ? { ...p, role: newRole } : p));
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    if (!user?.companyId) return;

    if (newUser.password.length < 6) {
      setAddError('Password must be at least 6 characters long.');
      return;
    }

    setAddLoading(true);
    try {
      const count = await erpService.getCollectionCount('users', user.companyId);
      if (!checkLimit('users', count)) {
        setAddLoading(false);
        return;
      }

      await erpService.adminAddUser({
        ...newUser,
        companyId: user!.companyId
      });
      setShowAddModal(false);
      setNewUser({ email: '', password: '', displayName: '', role: 'Staff', target_amount: 0 });
      fetchProfiles();
    } catch (err: any) {
      setAddError(err.message || 'Failed to add user');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (uid === user?.uid) {
      alert("You cannot delete yourself.");
      return;
    }
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    
    setUpdatingId(uid);
    try {
      await erpService.adminDeleteUser(uid);
      setProfiles(profiles.filter(p => p.uid !== uid));
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleResetPassword = async (uid: string, email: string) => {
    if (!window.confirm(`Send a password reset email to ${email}?`)) return;
    setResetLoading(true);
    try {
      await erpService.adminResetPassword(uid, email);
      alert('Password reset email sent successfully');
    } catch (err: any) {
      alert(err.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="p-10 text-foreground font-mono">
        <h2 className="text-xl mb-4">Access Denied</h2>
        <p className="text-gray-500">Only administrators can manage users.</p>
      </div>
    );
  }

  return (
    <div className={cn("p-4 lg:p-8 transition-colors", uiStyle === 'UI/UX 2' && "bg-slate-50 min-h-screen")}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <h1 className={cn(
            "text-2xl font-bold tracking-tight flex items-center gap-3",
            uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-foreground"
          )}>
            <Users className={cn("w-6 h-6", uiStyle === 'UI/UX 2' ? "text-blue-600" : "text-amber-500")} />
            User Management
          </h1>
          
          <button
            onClick={() => setShowAddModal(true)}
            className={cn(
              "md:hidden flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-semibold transition-all shadow-md whitespace-nowrap",
              uiStyle === 'UI/UX 2' 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            )}
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className={cn(
            "relative w-full md:w-64",
            uiStyle === 'UI/UX 2' ? "bg-white shadow-sm border-blue-100" : ""
          )}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                "w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-foreground text-xs focus:outline-none transition-colors",
                uiStyle === 'UI/UX 2' ? "focus:border-blue-600" : "focus:border-foreground/20"
              )}
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={cn(
              "hidden md:flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-md",
              uiStyle === 'UI/UX 2' 
                ? "bg-blue-600 text-white hover:bg-blue-700" 
                : "bg-indigo-600 hover:bg-indigo-700 text-white"
            )}
          >
            <UserPlus className="w-4 h-4" />
            Add New User
          </button>
        </div>
      </div>

      <div className={cn(
        "bg-card border border-border rounded-xl overflow-hidden shadow-sm",
        uiStyle === 'UI/UX 2' && "border-blue-100 shadow-md"
      )}>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={cn(
              "border-b border-border",
              uiStyle === 'UI/UX 2' ? "bg-blue-600 text-white" : "bg-foreground/5"
            )}>
              <th className={cn(
                "px-6 py-4 text-[10px] uppercase tracking-widest font-mono",
                uiStyle === 'UI/UX 2' ? "text-white" : "text-gray-500"
              )}>User / Email</th>
              <th className={cn(
                "px-6 py-4 text-[10px] uppercase tracking-widest font-mono",
                uiStyle === 'UI/UX 2' ? "text-white" : "text-gray-500"
              )}>Current Role</th>
              <th className={cn(
                "px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-right",
                uiStyle === 'UI/UX 2' ? "text-white" : "text-gray-500"
              )}>Sales Target</th>
              <th className={cn(
                "px-6 py-4 text-[10px] uppercase tracking-widest font-mono text-right",
                uiStyle === 'UI/UX 2' ? "text-white" : "text-gray-500"
              )}>Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center">
                  <Loader2 className="w-6 h-6 text-gray-500 animate-spin mx-auto" />
                </td>
              </tr>
            ) : filteredProfiles.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-6 py-12 text-center text-gray-500 text-xs font-mono">
                  No users found matching your search.
                </td>
              </tr>
            ) : (
              filteredProfiles.map((profile) => (
                <tr key={profile.uid} className="hover:bg-foreground/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-foreground font-bold text-xs">
                        {profile.displayName?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">{profile.displayName || 'No Name'}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{profile.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wider",
                      profile.role === 'Admin' ? "bg-amber-500/10 text-amber-500" :
                      profile.role === 'Manager' ? "bg-emerald-500/10 text-emerald-500" :
                      profile.role === 'Founder' ? "bg-primary/10 text-primary" :
                      profile.role === 'Marketing Manager' ? "bg-indigo-500/10 text-indigo-500" :
                      "bg-gray-500/10 text-gray-500"
                    )}>
                      {profile.role === 'Admin' ? <ShieldAlert className="w-3 h-3" /> :
                       profile.role === 'Manager' ? <ShieldCheck className="w-3 h-3" /> :
                       profile.role === 'Founder' ? <ShieldCheck className="w-3 h-3" /> :
                       <Shield className="w-3 h-3" />}
                      {profile.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <input
                      type="number"
                      defaultValue={profile.target_amount || 0}
                      onFocus={e => e.target.value === '0' && e.target.select()}
                      onBlur={async (e) => {
                        const val = Number(e.target.value);
                        if (val !== profile.target_amount) {
                          try {
                            await erpService.updateTargetAmount(profile.uid, val);
                            setProfiles(profiles.map(p => p.uid === profile.uid ? { ...p, target_amount: val } : p));
                          } catch (err) {
                            console.error('Error updating target:', err);
                          }
                        }
                      }}
                      className="w-24 bg-background border border-border rounded px-2 py-1 text-xs text-foreground focus:outline-none focus:border-indigo-500 text-right"
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {updatingId === profile.uid ? (
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                      ) : (
                        <>
                          <select
                            value={profile.role}
                            onChange={(e) => updateRole(profile.uid, e.target.value as UserRole)}
                            disabled={profile.uid === user?.uid}
                            className="bg-background border border-border rounded px-2 py-1 text-[10px] text-foreground/60 focus:outline-none focus:border-foreground/20 disabled:opacity-50"
                          >
                            <option value="Staff">Staff</option>
                            <option value="Manager">Manager</option>
                            <option value="Admin">Admin</option>
                            {isSuperAdmin && (
                              <>
                                <option value="Marketing Manager">Marketing Manager</option>
                                <option value="Founder">Founder</option>
                              </>
                            )}
                          </select>
                          
                          <button
                            onClick={() => handleResetPassword(profile.uid, profile.email)}
                            disabled={resetLoading}
                            title="Send Reset Email"
                            className="p-1.5 text-gray-400 hover:text-indigo-500 transition-colors disabled:opacity-30"
                          >
                            {resetLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(profile.uid)}
                            disabled={profile.uid === user?.uid}
                            title="Delete User"
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start md:items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto md:my-8">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
              <h3 className="text-lg font-bold text-foreground">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-500 hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {addError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-[11px] font-medium flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4" />
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newUser.displayName}
                  onChange={(e) => setNewUser({ ...newUser, displayName: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className={cn(
                    "w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500",
                    newUser.password.length > 0 && newUser.password.length < 6 && "border-red-500/50 focus:border-red-500"
                  )}
                  placeholder="••••••••"
                />
                {newUser.password.length > 0 && newUser.password.length < 6 && (
                  <p className="text-[10px] text-red-500 mt-1">Password must be at least 6 characters</p>
                )}
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Initial Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                >
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Admin">Admin</option>
                  {isSuperAdmin && (
                    <>
                      <option value="Marketing Manager">Marketing Manager</option>
                      <option value="Founder">Founder</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1">Monthly Sales Target</label>
                <input
                  type="number"
                  value={newUser.target_amount}
                  onFocus={e => e.target.value === '0' && e.target.select()}
                  onChange={(e) => setNewUser({ ...newUser, target_amount: Number(e.target.value) })}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                  placeholder="0"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg text-sm font-semibold text-foreground hover:bg-foreground/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-8 bg-amber-500/5 border border-amber-500/10 rounded-lg p-4">
        <div className="flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">Security Note</h4>
            <p className="text-[11px] text-amber-500/70 leading-relaxed">
              Changing a user's role takes effect immediately. Administrators have full control over the system, including deleting data and managing other users. Assign the "Admin" role with caution.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
