import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { authService, GuestFormData, SessionData } from '../services/auth';
import { GoogleOAuthUser } from '../services/googleAuth';
import {
  loginWithGoogleFirebase,
  logoutFirebase,
  subscribeToFirebaseAuth
} from '../services/firebaseAuth';

interface AuthContextType {
  user: User | null;
  session: SessionData | null;
  isAdmin: boolean;
  isGuest: boolean;
  isLoading: boolean;
  authNotice: string | null;
  setAuthNotice: (msg: string | null) => void;
  clearAuthNotice: () => void;
  loginWithGoogle: (oauthUserOrEmail?: GoogleOAuthUser | string | User, name?: string) => Promise<User>;
  loginAsGuest: (data: GuestFormData) => Promise<User>;
  logout: () => void;
  checkSession: () => SessionData | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // Synchronize session state from storage/service
  const syncSession = useCallback(() => {
    const activeSession = authService.getSession();
    if (activeSession) {
      setSession(activeSession);
      setUser(activeSession.user);
    } else {
      setSession(null);
      setUser(null);
      const expiredNotice = authService.consumeSessionExpiredNotice();
      if (expiredNotice) {
        setAuthNotice(expiredNotice);
      }
    }
    return activeSession;
  }, []);

  // Initial session verification & cross-tab sync
  useEffect(() => {
    syncSession();
    setIsLoading(false);

    // Subscribe to Firebase Auth state for automatic session restore across refreshes
    const unsubscribeFirebase = subscribeToFirebaseAuth((fbAppUser) => {
      if (fbAppUser) {
        const activeSession = authService.saveFirebaseSession(fbAppUser);
        setSession(activeSession);
        setUser(fbAppUser);
      } else {
        const cur = authService.getSession();
        if (cur && cur.loginType === 'google') {
          setSession(null);
          setUser(null);
        }
      }
    });

    // Cross-tab synchronization
    const unsubscribe = authService.onAuthChange(event => {
      if (event.type === 'LOGOUT') {
        setSession(null);
        setUser(null);
        setAuthNotice('You have been signed out in another window');
      } else if (event.type === 'LOGIN' && event.user) {
        syncSession();
      }
    });

    // Handle 401 unauthorized and 403 forbidden events
    const handleUnauthorized = () => {
      authService.logout();
      setSession(null);
      setUser(null);
      setAuthNotice('Your session has expired. Please sign in again.');
      window.dispatchEvent(new CustomEvent('c2a:navigate-login'));
    };

    window.addEventListener('c2a:unauthorized', handleUnauthorized);

    // Handle browser bfcache navigation (Back button cache invalidation)
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        syncSession();
      }
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      unsubscribeFirebase();
      unsubscribe();
      window.removeEventListener('c2a:unauthorized', handleUnauthorized);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [syncSession]);

  const loginWithGoogle = async (
    oauthUserOrEmail?: GoogleOAuthUser | string | User,
    name?: string
  ): Promise<User> => {
    setIsLoading(true);
    try {
      let loggedInUser: User;
      if (oauthUserOrEmail) {
        loggedInUser = await authService.loginWithGoogle(oauthUserOrEmail, name);
      } else {
        // Real Firebase Authentication with Google Sign-In Popup
        const result = await loginWithGoogleFirebase();
        const idToken = await result.credential.user.getIdToken();
        authService.saveFirebaseSession(result.user, idToken);
        loggedInUser = result.user;
      }
      const currentSession = authService.getSession();
      setSession(currentSession);
      setUser(loggedInUser);
      setAuthNotice(null);
      return loggedInUser;
    } finally {
      setIsLoading(false);
    }
  };

  const loginAsGuest = async (data: GuestFormData): Promise<User> => {
    setIsLoading(true);
    try {
      const result = await authService.loginAsGuest(data);
      const currentSession = authService.getSession();
      setSession(currentSession);
      setUser(result.user);
      setAuthNotice(null);
      return result.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutFirebase();
    } catch {
      // ignore
    }
    authService.logout(true);
    setSession(null);
    setUser(null);
    setAuthNotice('You have been signed out');
  };

  const clearAuthNotice = () => {
    setAuthNotice(null);
  };

  const checkSession = () => {
    return syncSession();
  };

  const isAdmin = user?.role === 'Admin';
  const isGuest = user?.role === 'Guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isGuest,
        isLoading,
        authNotice,
        setAuthNotice,
        clearAuthNotice,
        loginWithGoogle,
        loginAsGuest,
        logout,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
