import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc, getDocs, collection, query, where } from 'firebase/firestore';

export type UserRole = 'Founder' | 'Marketing Manager' | 'Admin' | 'Manager' | 'Staff';

export interface Profile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  target_amount?: number;
  permissions?: string[];
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
  customLimits?: {
    vouchers?: number;
    items?: number;
    ledgers?: number;
    users?: number;
    godowns?: number;
    multiCurrency?: boolean;
    rolePermissions?: boolean;
  };
}

interface AuthContextType {
  user: Profile | null;
  company: CompanyData | null;
  firebaseUser: FirebaseUser | null;
  logout: () => Promise<void>;
  loading: boolean;
  isAdmin: boolean;
  isFounder: boolean;
  isMarketingManager: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<Profile | null>(null);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);

  const isFounder = user?.role === 'Founder' || firebaseUser?.email?.toLowerCase() === 'sapientman46@gmail.com';
  const isMarketingManager = user?.role === 'Marketing Manager';
  const isSuperAdmin = isFounder || isMarketingManager;
  const isAdmin = user?.role === 'Admin' || isSuperAdmin;

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    let unsubCompany: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      
      if (unsubProfile) unsubProfile();
      if (unsubCompany) unsubCompany();

      if (fUser) {
        // Listen to user profile changes
        const userRef = doc(db, 'users', fUser.uid);
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          try {
            // Unsubscribe existing company listener if any before setting up a new one
            if (unsubCompany) {
              unsubCompany();
              unsubCompany = null;
            }

            if (docSnap.exists()) {
              const userData = docSnap.data() as Profile;
              setUser(userData);

              // Listen to company changes
              if (userData.companyId) {
                const companyRef = doc(db, 'companies', userData.companyId);
                unsubCompany = onSnapshot(companyRef, (compSnap) => {
                  if (compSnap.exists()) {
                    setCompany(compSnap.data() as CompanyData);
                  } else {
                    setCompany(null);
                  }
                  setLoading(false);
                }, (err) => {
                  console.error("Company snapshot error:", err);
                  setLoading(false);
                });
              } else {
                console.warn("User profile exists but companyId is missing");
                setCompany(null);
                setLoading(false);
              }

            } else {
              // FOUNDER RECOVERY: If the user is the Founder but their profile is missing, recreate it.
              if (fUser.email?.toLowerCase() === 'sapientman46@gmail.com') {
                console.log("Founder profile missing, attempting recovery for UID:", fUser.uid);
                try {
                  // 1. Try to find a company where this user is the owner
                  const ownerQuery = query(collection(db, 'companies'), where('ownerId', '==', fUser.uid));
                  const ownerSnap = await getDocs(ownerQuery);
                  
                  let companyId = 'placeholder';
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
                    } else {
                      // 3. Fallback to ANY company if no direct ownership found
                      const allCompaniesSnap = await getDocs(collection(db, 'companies'));
                      if (!allCompaniesSnap.empty) {
                        companyId = allCompaniesSnap.docs[0].id;
                        console.log("Found fallback company:", companyId);
                      } else {
                        console.log("No companies found at all. Using placeholder.");
                      }
                    }
                  }

                  const newProfile: Profile = {
                    uid: fUser.uid,
                    email: fUser.email,
                    displayName: fUser.displayName || 'Founder',
                    companyId: companyId,
                    role: 'Founder'
                  };
                  
                  await setDoc(userRef, {
                    ...newProfile,
                    createdAt: new Date().toISOString()
                  });
                  // The snapshot will fire again and set the user.
                } catch (err) {
                  console.error("Founder recovery failed:", err);
                  setUser(null);
                  setCompany(null);
                  setLoading(false);
                }
              } else {
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
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      company,
      firebaseUser, 
      logout, 
      loading, 
      isAdmin,
      isFounder,
      isMarketingManager,
      isSuperAdmin
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
