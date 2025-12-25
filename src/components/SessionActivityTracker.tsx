import { useSessionManager } from '../hooks/useSessionManager';

/**
 * Invisible component that tracks user activity and handles session expiration
 *
 * Note: Session expiration UI is now handled by the AuthContext's sessionExpired state
 * and the SessionExpiredModal component. This component only handles the activity
 * tracking and triggering the expiration check.
 */
export function SessionActivityTracker() {
  // Use the session manager hook to track activity
  // Session expiration is handled by the AuthContext (sessionExpired state)
  // which triggers the SessionExpiredModal for better UX
  useSessionManager({
    checkInterval: 60000, // Check every minute
  });

  // This component doesn't render anything
  return null;
}
