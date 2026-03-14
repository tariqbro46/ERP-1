import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'manager' | 'staff';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  company_id: string | null;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isManager: boolean;
  isStaff: boolean;
  hasPermission: (action: 'view' | 'create' | 'edit' | 'delete', resource: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email: string | undefined) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Use maybeSingle to avoid error if not found

      if (error) throw error;

      if (!data) {
        // Profile doesn't exist, create a default one
        // We'll skip the count check for now to avoid RLS issues during first signup
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{ 
            id: userId, 
            email: email, 
            role: 'staff' // Default to staff, first user can be changed manually or via logic
          }])
          .select()
          .single();
        
        if (!insertError) setProfile(newProfile);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        
        if (currentUser) {
          await fetchProfile(currentUser.id, currentUser.email);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      
      if (currentUser) {
        await fetchProfile(currentUser.id, currentUser.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const isAdmin = profile?.role === 'admin';
  const isManager = profile?.role === 'manager' || isAdmin;
  const isStaff = profile?.role === 'staff' || isManager;

  const hasPermission = (action: 'view' | 'create' | 'edit' | 'delete', resource: string) => {
    if (isAdmin) return true;

    // Permissions logic
    const permissions: Record<UserRole, Record<string, string[]>> = {
      admin: { '*': ['view', 'create', 'edit', 'delete'] },
      manager: {
        'reports': ['view'],
        'vouchers': ['view', 'create', 'edit'],
        'ledgers': ['view', 'create', 'edit'],
        'items': ['view', 'create', 'edit'],
        'notes': ['view', 'create', 'edit', 'delete'],
      },
      staff: {
        'reports': ['view'], // Limited reports usually, but for now view
        'vouchers': ['view', 'create'],
        'ledgers': ['view'],
        'items': ['view'],
        'notes': ['view', 'create', 'edit'],
      }
    };

    const rolePermissions = permissions[profile?.role || 'staff'];
    const resourcePermissions = rolePermissions[resource] || rolePermissions['*'] || [];
    
    return resourcePermissions.includes(action);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signOut, 
      isAdmin, 
      isManager, 
      isStaff,
      hasPermission 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
