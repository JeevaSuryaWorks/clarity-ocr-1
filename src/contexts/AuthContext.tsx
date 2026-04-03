import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import {
  onAuthStateChanged,
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '@/firebase';

// Extended User Interface
// Extended User Interface
export interface AuthUser extends User {
  stripeRole?: 'free' | 'pro' | 'business';
  admin?: boolean;
  onboardingCompleted?: boolean;
  termsAccepted?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  acceptTerms: () => Promise<void>;
  logout: () => Promise<void>;
  simulateUserUpgrade?: (role: 'pro' | 'business') => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  console.log("[AuthContext] AuthProvider rendering. Loading state:", true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper: Syncs Firebase User with Firestore Profile
  const syncUserWithFirestore = useCallback(async (firebaseUser: User) => {
    try {
      // 1. Get Auth Token Claims
      const tokenResult = await firebaseUser.getIdTokenResult(true);
      const stripeRole = (tokenResult.claims.stripeRole as 'free' | 'pro' | 'business') || 'free';
      const admin = (tokenResult.claims.admin as boolean) || false;

      // 2. Get User Profile from Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      let onboardingCompleted = false;
      let termsAccepted = false;

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        onboardingCompleted = userData.onboardingCompleted || false;
        termsAccepted = userData.termsAccepted || false;
      } else {
        // Create profile if it doesn't exist
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          createdAt: serverTimestamp(),
          role: 'user',
          onboardingCompleted: false,
          termsAccepted: false, // Default to false for social login
        });
      }

      const userWithDetails: AuthUser = {
        ...firebaseUser,
        displayName: firebaseUser.displayName,
        email: firebaseUser.email,
        uid: firebaseUser.uid,
        photoURL: firebaseUser.photoURL,
        stripeRole,
        admin,
        onboardingCompleted,
        termsAccepted,
      };

      setUser(userWithDetails);
    } catch (error) {
      console.error("Error fetching user details:", error);
      setUser(firebaseUser as AuthUser);
    }
  }, []);

  // 1. Listen for Redirect Results (Fallback flow)
  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          await syncUserWithFirestore(result.user);
        }
      } catch (error) {
        console.error("Redirect Auth Error:", error);
      }
    };
    checkRedirect();
  }, [syncUserWithFirestore]);

  // 2. Listen for Auth State Changes (Main flow)
  useEffect(() => {
    // Safety timeout: If Firebase takes >8s to respond, force load completion
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn("[AuthContext] Auth listener timeout - forcing render");
        setLoading(false);
      }
    }, 8000);

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await syncUserWithFirestore(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("[AuthContext] Auth change error:", err);
      } finally {
        setLoading(false);
        clearTimeout(timeoutId);
      }
    }, (error) => {
      console.error("[AuthContext] Auth state subscription failed:", error);
      setLoading(false);
      clearTimeout(timeoutId);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [syncUserWithFirestore]);

  const refreshUser = useCallback(async () => {
    if (auth.currentUser) {
      await syncUserWithFirestore(auth.currentUser);
    }
  }, [syncUserWithFirestore]);

  // ROBUST GOOGLE LOGIN STRATEGY
  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Popup failed, trying redirect...", error);
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/popup-blocked') {
        await signInWithRedirect(auth, googleProvider);
      } else {
        throw error;
      }
    }
  };

  const completeOnboarding = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { onboardingCompleted: true }, { merge: true });
      await refreshUser();
    } catch (error) {
      console.error("Error completing onboarding:", error);
      throw error;
    }
  };

  const acceptTerms = async () => {
    if (!auth.currentUser) return;
    try {
      const userDocRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDocRef, { termsAccepted: true }, { merge: true });
      await refreshUser();
    } catch (error) {
      console.error("Error accepting terms:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const simulateUserUpgrade = (role: 'pro' | 'business') => {
    if (user) {
      setUser({ ...user, stripeRole: role });
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    refreshUser,
    loginWithGoogle,
    completeOnboarding,
    acceptTerms,
    logout,
    simulateUserUpgrade
  }), [user, loading, refreshUser]);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-500 text-slate-900 dark:text-white">
          <div className="relative">
            <div className="absolute inset-0 bg-sky-500/20 blur-2xl rounded-full animate-pulse" />
            <svg className="animate-spin h-12 w-12 text-sky-500 relative z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="mt-4 font-medium animate-pulse">Initializing Clarity...</p>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}