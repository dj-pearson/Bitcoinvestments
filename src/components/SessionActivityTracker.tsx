import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionManager } from '../hooks/useSessionManager';

/**
 * Invisible component that tracks user activity and handles session expiration
 */
export function SessionActivityTracker() {
  const navigate = useNavigate();

  const handleSessionExpired = useCallback(() => {
    // Navigate to login when session expires
    navigate('/login', {
      state: { message: 'Your session has expired. Please sign in again.' }
    });
  }, [navigate]);

  // Use the session manager hook to track activity
  useSessionManager({
    onSessionExpired: handleSessionExpired,
    checkInterval: 60000, // Check every minute
  });

  // This component doesn't render anything
  return null;
}
