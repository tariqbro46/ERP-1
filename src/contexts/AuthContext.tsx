import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, getDocs, collection, query, where, limit } from 'firebase/firestore';
import { erpService } from '../services/erpService';

export type UserRole = 'Founder' | 'Marketing Manager' | 'Admin' | 'Manager' | 'Staff';

export interface Profile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  target_amount?: number;
  permissions?: string[];
  photoURL?: string;
  showSystemGuide?: boolean;
}

export interface CompanyData {
  id: string;
  name: string;
  subscriptionStatus: 'active' | 'inactive' | 'trial';
  planType: 'monthly' | 'yearly' | 'free';
  planId?: string;
  expiryDate: string;
  isAccessEnabled: boolean;
  extraFeatures?: string[];
  quotaLimit?: number;
  quotaUsed?: number;
  quotaReads?: number;
  quotaWrites?: number;
  quotaDeletes?: number;
  quotaLastReset?: number;
  quotaLastResetDateStr?: string;
  quotaDisplayRule?: 'always' | 'exceed_50';
  quotaExceededMsg?: string;
  customLimits?: {
    vouchers?: number;
    items?: number;
    ledgers?: number;
    users?: number;
    godowns?: number;
    multiCurrency?: boolean;
    rolePermissions?: boolean;
  };
  search_config?: {
    placeholder?: string;
    showShortcut?: boolean;
    helpText?: string;
    iconColor?: string;
  };
}

interface AuthContextType {
  user: Profile | null;
  company: CompanyData | null;
  rolePermissions: Record<string, string[]> | null;
  firebaseUser: FirebaseUser | null;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isFounder: boolean;
  isMarketingManager: boolean;
  isSuperAdmin: boolean;
  hasPermission: (featureId: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]> | null>(null);
  const [loading, setLoading] = useState(true);

  const isFounder = user?.role === 'Founder' || firebaseUser?.email?.toLowerCase() === 'sapientman46@gmail.com';
  const isMarketingManager = user?.role === 'Marketing Manager';
  const isSuperAdmin = isFounder || isMarketingManager;
  const isAdmin = user?.role === 'Admin' || isSuperAdmin;

  const hasPermission = (featureId: string) => {
    if (isSuperAdmin || isAdmin) return true;
    if (!user) return false;
    
    // Check if role has permission in the company settings
    if (rolePermissions && rolePermissions[user.role]) {
      if (rolePermissions[user.role].includes(featureId)) return true;
    }
    
    // Fallback to explicit user permissions if any
    return user.permissions?.includes(featureId) || false;
  };

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubCompany: (() => void) | null = null;
    let unsubPermissions: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      
      if (unsubProfile) unsubProfile();
      if (unsubCompany) unsubCompany();
      if (unsubPermissions) unsubPermissions();

      if (fUser) {
        // Listen to user profile changes
        const userRef = doc(db, 'users', fUser.uid);
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          try {
            // Unsubscribe existing listeners if any before setting up new ones
            if (unsubCompany) { unsubCompany(); unsubCompany = null; }
            if (unsubPermissions) { unsubPermissions(); unsubPermissions = null; }

            if (docSnap.exists()) {
              const userData = docSnap.data() as Profile;
              setUser(userData);

              // Listen to company changes
              if (userData.companyId) {
                const companyRef = doc(db, 'companies', userData.companyId);
                unsubCompany = onSnapshot(companyRef, (compSnap) => {
                  if (compSnap.exists()) {
                    const compData = compSnap.data() as CompanyData;
                    const mostRecentResetTime = erpService.getMostRecent130PM(new Date()).getTime();
                    const lastReset = compData.quotaLastReset || 0;
                    if (lastReset < mostRecentResetTime) {
                      erpService.resetCompanyQuota(userData.companyId, mostRecentResetTime);
                    } else {
                      setCompany(compData);
                    }
                  } else {
                    setCompany(null);
                  }
                  setLoading(false);
                }, (err) => {
                  console.error("Company snapshot error:", err);
                  setLoading(false);
                });

                // Listen to role permissions
                const permsRef = doc(db, 'settings', userData.companyId, 'config', 'role_permissions');
                unsubPermissions = onSnapshot(permsRef, (permsSnap) => {
                  if (permsSnap.exists()) {
                    setRolePermissions(permsSnap.data() as Record<string, string[]>);
                  } else {
                    setRolePermissions(null);
                  }
                }, (error) => {
                  console.error("Permissions snapshot error:", error);
                  // We don't necessarily want to block the whole app if permissions fail to load,
                  // but we should log it.
                });
              } else {
                console.warn("User profile exists but companyId is missing");
                setCompany(null);
                setRolePermissions(null);
                setLoading(false);
              }

            } else {
              // PROFILE RECOVERY: If the user profile is missing, attempt to find their company.
              console.log("Profile missing, attempting recovery for UID:", fUser.uid);
              try {
                // 1. Try to find a company where this user is the owner
                const ownerQuery = query(collection(db, 'companies'), where('ownerId', '==', fUser.uid));
                const ownerSnap = await getDocs(ownerQuery);
                
                let companyId = '';
                let role: UserRole = 'Admin';
                
                if (!ownerSnap.empty) {
                  companyId = ownerSnap.docs[0].id;
                  console.log("Found company by ownerId:", companyId);
                } else {
                  // 2. Try by createdBy
                  const creatorQuery = query(collection(db, 'companies'), where('createdBy', '==', fUser.uid));
                  const creatorSnap = await getDocs(creatorQuery);
                  if (!creatorSnap.empty) {
                    companyId = creatorSnap.docs[0].id;
                    console.log("Found company by createdBy:", companyId);
                  }
                }

                // Special handling for Founder
                const isFounderEmail = fUser.email?.toLowerCase() === 'sapientman46@gmail.com' || fUser.email?.toLowerCase() === 'arifulislamoffice35@gmail.com';
                if (isFounderEmail) {
                  role = 'Founder';
                  // Use a specific query or limit if searching for a company
                  if (!companyId) {
                    const companyQuery = query(collection(db, 'companies'), limit(1));
                    const companySnap = await getDocs(companyQuery);
                    if (!companySnap.empty) {
                      companyId = companySnap.docs[0].id;
                      console.log("Found fallback company for founder:", companyId);
                    } else {
                      companyId = 'placeholder';
                    }
                  }
                }

                if (companyId) {
                  const newProfile: Profile = {
                    uid: fUser.uid,
                    email: fUser.email || '',
                    displayName: fUser.displayName || (isFounderEmail ? 'Founder' : 'Admin'),
                    companyId: companyId,
                    role: role
                  };
                  
                  await setDoc(userRef, {
                    ...newProfile,
                    createdAt: new Date().toISOString()
                  });
                  console.log("Profile recovered and saved for UID:", fUser.uid);
                } else {
                  console.log("No company found for user, recovery skipped.");
                  setUser(null);
                  setCompany(null);
                  setLoading(false);
                }
              } catch (err) {
                console.error("Profile recovery failed:", err);
                setUser(null);
                setCompany(null);
                setLoading(false);
              }
            }
          } catch (err) {
            console.error("Profile snapshot processing error:", err);
            setLoading(false);
          }
        }, (error) => {
          console.error("Auth profile snapshot error:", error);
          setLoading(false);
        });
      } else {
        setUser(null);
        setCompany(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
      if (unsubCompany) unsubCompany();
      if (unsubPermissions) unsubPermissions();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      company,
      rolePermissions,
      firebaseUser, 
      logout, 
      loading, 
      isAdmin,
      isFounder,
      isMarketingManager,
      isSuperAdmin,
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
