import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, signInWithGoogle, logout as firebaseLogout } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  isDemoMode,
  getDemoUser,
  enterDemoMode,
  exitDemoMode,
  DEMO_ADMIN,
  type DemoUser,
} from './lib/demoStore';

// Minimal user shape shared by both Firebase and demo mode
export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AppUser | null;
  userRole: string | null;
  loading: boolean;
  isDemo: boolean;
  login: () => Promise<void>;
  loginDemo: (asDemoUser?: DemoUser) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // If already in demo mode on mount, restore state
    if (isDemoMode()) {
      const demoUser = getDemoUser();
      if (demoUser) {
        setUser(demoUser);
        setUserRole(demoUser.role);
        setIsDemo(true);
        setLoading(false);
        return;
      }
    }

    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (isDemoMode()) return;

        if (currentUser) {
          setUser({
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
          });
          try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              setUserRole(userDoc.data().role);
            } else {
              // Auto-assign admin role for new Firebase users
              await setDoc(userDocRef, {
                uid: currentUser.uid,
                name: currentUser.displayName || 'Unknown User',
                email: currentUser.email || '',
                role: 'admin',
                createdAt: new Date().toISOString()
              });
              setUserRole('admin');
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
            setUserRole('admin'); // Default to admin
          }
        } else {
          setUser(null);
          setUserRole(null);
        }
        setLoading(false);
      });
    } catch (error) {
      console.warn('Firebase auth not available — use Demo Mode to test.', error);
      setLoading(false);
    }

    return () => unsubscribe?.();
  }, []);

  // Firebase Google Login
  const login = async () => {
    await signInWithGoogle();
  };

  // Demo Login — optionally as specific user (default: Admin)
  const loginDemo = (asDemoUser?: DemoUser) => {
    const demoUser: DemoUser = asDemoUser ?? DEMO_ADMIN;
    enterDemoMode(demoUser);
    setUser(demoUser);
    setUserRole(demoUser.role);
    setIsDemo(true);
    setLoading(false);
  };

  // Logout (handles both modes)
  const logout = async () => {
    if (isDemo) {
      exitDemoMode();
      setUser(null);
      setUserRole(null);
      setIsDemo(false);
      return;
    }
    await firebaseLogout();
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, isDemo, login, loginDemo, logout }}>
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
