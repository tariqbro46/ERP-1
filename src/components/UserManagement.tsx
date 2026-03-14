import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth, Profile, UserRole } from '../contexts/AuthContext';
import { Users, Shield, ShieldCheck, ShieldAlert, Mail, Calendar, Loader2, Search } from 'lucide-react';
import { cn } from '../lib/utils';

export const UserManagement: React.FC = () => {
  const { isAdmin } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('email');
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId: string, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setProfiles(profiles.map(p => p.id === userId ? { ...p, role: newRole } : p));
    } catch (err) {
      console.error('Error updating role:', err);
      alert('Failed to update role');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
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
    <div className="p-8 max-w-6xl mx-auto transition-colors">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-500" />
            User Management
          </h1>
          <p className="text-gray-500 text-xs uppercase tracking-widest mt-1">Manage system access and roles</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm || ''}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-lg py-2 pl-10 pr-4 text-foreground text-xs focus:outline-none focus:border-foreground/20 transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-foreground/5">
              <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-mono">User / Email</th>
              <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-mono">Current Role</th>
              <th className="px-6 py-4 text-[10px] text-gray-500 uppercase tracking-widest font-mono text-right">Actions</th>
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
                <tr key={profile.id} className="hover:bg-foreground/[0.02] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-foreground font-bold text-xs">
                        {profile.email?.[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-foreground font-medium">{profile.full_name || profile.email?.split('@')[0]}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{profile.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={cn(
                      "inline-flex items-center gap-1.5 px-2 py-1 rounded text-[9px] uppercase font-bold tracking-wider",
                      profile.role === 'admin' ? "bg-amber-500/10 text-amber-500" :
                      profile.role === 'manager' ? "bg-emerald-500/10 text-emerald-500" :
                      "bg-gray-500/10 text-gray-500"
                    )}>
                      {profile.role === 'admin' ? <ShieldAlert className="w-3 h-3" /> :
                       profile.role === 'manager' ? <ShieldCheck className="w-3 h-3" /> :
                       <Shield className="w-3 h-3" />}
                      {profile.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {updatingId === profile.id ? (
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
                      ) : (
                        <select
                          value={profile.role}
                          onChange={(e) => updateRole(profile.id, e.target.value as UserRole)}
                          className="bg-background border border-border rounded px-2 py-1 text-[10px] text-foreground/60 focus:outline-none focus:border-foreground/20"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Admin</option>
                        </select>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
