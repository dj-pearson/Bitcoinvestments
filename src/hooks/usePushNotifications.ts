import { useState, useEffect, useCallback } from 'react';
import {
  isPushSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
  checkSubscriptionValidity,
  getNotificationPreferences,
  updateNotificationPreferences,
  sendTestNotification,
  type NotificationPreferences,
} from '../services/pushNotifications';
import { useAuth } from '../contexts/AuthContext';

interface UsePushNotificationsResult {
  // Status
  isSupported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isLoading: boolean;
  error: string | null;

  // Preferences
  preferences: NotificationPreferences | null;

  // Actions
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<boolean>;
  sendTest: () => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing push notifications
 */
export function usePushNotifications(): UsePushNotificationsResult {
  const { user } = useAuth();
  const [isSupported] = useState(isPushSupported());
  const [permission, setPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  // Check subscription status on mount
  useEffect(() => {
    const checkStatus = async () => {
      if (!isSupported) {
        setIsLoading(false);
        return;
      }

      try {
        setPermission(getNotificationPermission());
        const isValid = await checkSubscriptionValidity();
        setIsSubscribed(isValid);

        // Load preferences if user is logged in
        if (user) {
          const { preferences: prefs } = await getNotificationPreferences(user.id);
          setPreferences(prefs);
        }
      } catch (err) {
        console.error('Error checking push status:', err);
      } finally {
        setIsLoading(false);
      }
    };

    checkStatus();
  }, [isSupported, user]);

  // Request permission
  const requestPermissionHandler = useCallback(async () => {
    setError(null);
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async () => {
    if (!user) {
      setError('Please log in to enable notifications');
      return false;
    }

    if (!isSupported) {
      setError('Push notifications not supported on this device');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Request permission if needed
      if (permission !== 'granted') {
        const newPermission = await requestNotificationPermission();
        setPermission(newPermission);

        if (newPermission !== 'granted') {
          setError('Notification permission was denied');
          return false;
        }
      }

      const result = await subscribeToPush(user.id);

      if (result.success) {
        setIsSubscribed(true);
        return true;
      } else {
        setError(result.error || 'Failed to subscribe');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, isSupported, permission]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await unsubscribeFromPush();

      if (result.success) {
        setIsSubscribed(false);
        return true;
      } else {
        setError(result.error || 'Failed to unsubscribe');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unsubscribe failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update preferences
  const updatePreferencesHandler = useCallback(
    async (prefs: Partial<NotificationPreferences>) => {
      if (!user) {
        setError('Please log in to update preferences');
        return false;
      }

      setError(null);

      try {
        const result = await updateNotificationPreferences(user.id, prefs);

        if (result.success) {
          setPreferences((prev) => (prev ? { ...prev, ...prefs } : null));
          return true;
        } else {
          setError(result.error || 'Failed to update preferences');
          return false;
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
        return false;
      }
    },
    [user]
  );

  // Send test notification
  const sendTest = useCallback(async () => {
    if (!isSubscribed) {
      setError('Please enable notifications first');
      return;
    }

    await sendTestNotification();
  }, [isSubscribed]);

  // Refresh status
  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setPermission(getNotificationPermission());
      const isValid = await checkSubscriptionValidity();
      setIsSubscribed(isValid);

      if (user) {
        const { preferences: prefs } = await getNotificationPreferences(user.id);
        setPreferences(prefs);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Refresh failed');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    error,
    preferences,
    subscribe,
    unsubscribe,
    requestPermission: requestPermissionHandler,
    updatePreferences: updatePreferencesHandler,
    sendTest,
    refresh,
  };
}
