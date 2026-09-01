import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  updateActivity,
  isSessionValid,
  SESSION_CONFIG,
} from '../services/sessionManager';

interface UseSessionManagerOptions {
  onSessionExpired?: () => void;
  checkInterval?: number;
}

/**
 * Hook to manage user session with activity tracking and timeout
 */
export function useSessionManager(options: UseSessionManagerOptions = {}) {
  const { user, markSessionExpired } = useAuth();
  const { onSessionExpired, checkInterval = 60000 } = options; // Check every minute
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityListenersAttached = useRef(false);

  // Handle session expiration - now uses context's markSessionExpired
  // which shows the modal and properly cleans up the session
  const handleSessionExpired = useCallback(async () => {
    await markSessionExpired();
    onSessionExpired?.();
  }, [markSessionExpired, onSessionExpired]);

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

  // Use useMemo to avoid recalculating on every render while still being lint-compliant
   
  return useMemo(() => {
    if (!user) return 0;

    const lastActivityStr = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    if (!lastActivityStr) return SESSION_CONFIG.TIMEOUT_MS;

    const lastActivity = parseInt(lastActivityStr, 10);
    const now = Date.now();
    const elapsed = now - lastActivity;
    const remaining = SESSION_CONFIG.TIMEOUT_MS - elapsed;

    return Math.max(0, remaining);
  }, [user]);
}
