import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { getCurrentUser, onAuthStateChange, signOut as authSignOut, type AuthUser } from '../services/auth';
import {
  createSession,
  invalidateAllSessions,
  getCurrentSessionId,
  isSessionValid,
} from '../services/sessionManager';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signOutAllDevices: () => Promise<void>;
  refreshUser: () => Promise<void>;
  initializeSession: (userId: string) => Promise<void>;
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Check if existing session is still valid
  const validateExistingSession = useCallback(async (authUser: AuthUser): Promise<boolean> => {
    const sessionId = getCurrentSessionId();

    if (!sessionId) {
      // No local session, create one
      await createSession(authUser.id);
      return true;
    }

    // Validate the session
    const valid = await isSessionValid(authUser.id);
    if (!valid) {
      setSessionExpired(true);
      return false;
    }

    return true;
  }, []);

  useEffect(() => {
    // Check for existing session
    async function checkAuth() {
      try {
        const currentUser = await getCurrentUser();

        if (currentUser) {
          // Validate session
          const sessionValid = await validateExistingSession(currentUser);
          if (sessionValid) {
            setUser(currentUser);
          } else {
            // Session expired, sign out
            await authSignOut();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();

    // Subscribe to auth state changes
    const { unsubscribe } = onAuthStateChange(async (authUser) => {
      if (authUser) {
        // Validate or create session for new auth
        const sessionValid = await validateExistingSession(authUser);
        if (sessionValid) {
          setUser(authUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [validateExistingSession]);

  // Initialize a new session (called after login)
  const initializeSession = useCallback(async (userId: string) => {
    const { error } = await createSession(userId);
    if (error) {
      console.warn('Could not create session:', error);
    }
    setSessionExpired(false);
  }, []);

  // Sign out from current device
  const signOut = useCallback(async () => {
    const sessionId = getCurrentSessionId();
    if (sessionId && user) {
      // Clear the session from database
      const { invalidateSession } = await import('../services/sessionManager');
      await invalidateSession(sessionId, user.id);
    }
    await authSignOut();
    setUser(null);
    setSessionExpired(false);
  }, [user]);

  // Sign out from all devices
  const signOutAllDevices = useCallback(async () => {
    if (user) {
      await invalidateAllSessions(user.id);
    }
    await authSignOut();
    setUser(null);
    setSessionExpired(false);
  }, [user]);

  const refreshUser = useCallback(async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  }, []);

  const clearSessionExpired = useCallback(() => {
    setSessionExpired(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signOut,
        signOutAllDevices,
        refreshUser,
        initializeSession,
        sessionExpired,
        clearSessionExpired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
