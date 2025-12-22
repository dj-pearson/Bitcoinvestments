import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  updateActivity,
  isSessionValid,
  SESSION_CONFIG,
  getCurrentSessionId,
  invalidateSession,
} from '../services/sessionManager';

interface UseSessionManagerOptions {
  onSessionExpired?: () => void;
  checkInterval?: number;
}

/**
 * Hook to manage user session with activity tracking and timeout
 */
export function useSessionManager(options: UseSessionManagerOptions = {}) {
  const { user, signOut } = useAuth();
  const { onSessionExpired, checkInterval = 60000 } = options; // Check every minute
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityListenersAttached = useRef(false);

  // Handle session expiration
  const handleSessionExpired = useCallback(async () => {
    const sessionId = getCurrentSessionId();
    if (sessionId && user) {
      await invalidateSession(sessionId, user.id);
    }
    await signOut();
    onSessionExpired?.();
  }, [signOut, user, onSessionExpired]);

  // Check session validity
  const checkSession = useCallback(async () => {
    if (!user) return;

    const valid = await isSessionValid(user.id);
    if (!valid) {
      handleSessionExpired();
    }
  }, [user, handleSessionExpired]);

  // Update activity on user interaction
  const handleActivity = useCallback(() => {
    if (user) {
      updateActivity(user.id);
    }
  }, [user]);

  // Set up activity tracking
  useEffect(() => {
    if (!user || activityListenersAttached.current) return;

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];

    // Throttle event listener
    let lastEventTime = 0;
    const throttledHandler = () => {
      const now = Date.now();
      if (now - lastEventTime > 10000) { // Throttle to every 10 seconds
        lastEventTime = now;
        handleActivity();
      }
    };

    // Attach event listeners
    events.forEach((event) => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        handleActivity();
        checkSession();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    activityListenersAttached.current = true;

    // Initial activity update
    handleActivity();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, throttledHandler);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      activityListenersAttached.current = false;
    };
  }, [user, handleActivity, checkSession]);

  // Set up periodic session check
  useEffect(() => {
    if (!user) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Check immediately
    checkSession();

    // Set up interval
    checkIntervalRef.current = setInterval(checkSession, checkInterval);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [user, checkSession, checkInterval]);

  return {
    sessionTimeout: SESSION_CONFIG.TIMEOUT_MS,
    checkSession,
    updateActivity: handleActivity,
  };
}

/**
 * Hook to get remaining session time
 */
export function useSessionTimeRemaining(): number {
  const { user } = useAuth();

  if (!user) return 0;

  const lastActivityStr = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  if (!lastActivityStr) return SESSION_CONFIG.TIMEOUT_MS;

  const lastActivity = parseInt(lastActivityStr, 10);
  const elapsed = Date.now() - lastActivity;
  const remaining = SESSION_CONFIG.TIMEOUT_MS - elapsed;

  return Math.max(0, remaining);
}
