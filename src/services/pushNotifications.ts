import { isSupabaseConfigured, db } from '../lib/supabase';

/**
 * Push Notifications Service
 *
 * Features:
 * - Web Push API integration
 * - VAPID key management
 * - Subscription management
 * - Notification preferences
 * - Price alert notifications
 * - Portfolio update notifications
 */

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  device_name?: string;
  created_at: string;
  last_used_at: string;
  is_active: boolean;
}

export interface NotificationPreferences {
  price_alerts: boolean;
  portfolio_updates: boolean;
  security_alerts: boolean;
  newsletter: boolean;
  promotional: boolean;
}

export type NotificationType =
  | 'price_alert'
  | 'portfolio_update'
  | 'security_alert'
  | 'transaction'
  | 'news'
  | 'system';

// Default VAPID public key (should be configured in environment)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray.buffer.slice(outputArray.byteOffset, outputArray.byteOffset + outputArray.byteLength);
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(
  userId: string
): Promise<{ success: boolean; subscription?: PushSubscriptionJSON; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  if (!VAPID_PUBLIC_KEY) {
    return { success: false, error: 'VAPID key not configured' };
  }

  try {
    // Request permission if not granted
    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      return { success: false, error: 'Notification permission denied' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    // Subscribe if no existing subscription
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to database
    const subscriptionJson = subscription.toJSON();

    if (isSupabaseConfigured()) {
      const { error } = await db.from('push_subscriptions').upsert({
        user_id: userId,
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        device_name: getDeviceName(),
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint',
      });

      if (error) {
        console.error('Error saving push subscription:', error);
      }
    }

    return { success: true, subscription: subscriptionJson };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Subscription failed',
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: 'Push notifications not supported' };
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from database
      if (isSupabaseConfigured()) {
        await db
          .from('push_subscriptions')
          .delete()
          .eq('endpoint', subscription.endpoint);
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe();
    }

    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unsubscribe failed',
    };
  }
}

/**
 * Get device name for subscription
 */
function getDeviceName(): string {
  const ua = navigator.userAgent;

  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Mac/i.test(ua)) return 'Mac';
  if (/Linux/i.test(ua)) return 'Linux';

  return 'Unknown Device';
}

/**
 * Get user's push subscriptions
 */
export async function getUserSubscriptions(
  userId: string
): Promise<{ subscriptions: PushSubscription[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { subscriptions: [], error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      if (error.code === '42P01') {
        return { subscriptions: [], error: null };
      }
      throw error;
    }

    return { subscriptions: (data as PushSubscription[]) || [], error: null };
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return {
      subscriptions: [],
      error: error instanceof Error ? error.message : 'Failed to fetch subscriptions',
    };
  }
}

/**
 * Get user's notification preferences
 */
export async function getNotificationPreferences(
  userId: string
): Promise<{ preferences: NotificationPreferences | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { preferences: null, error: 'Database not configured' };
  }

  try {
    const { data, error } = await db
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116' || error.code === '42P01') {
        // No preferences found, return defaults
        return {
          preferences: {
            price_alerts: true,
            portfolio_updates: true,
            security_alerts: true,
            newsletter: true,
            promotional: false,
          },
          error: null,
        };
      }
      throw error;
    }

    return { preferences: data as NotificationPreferences, error: null };
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return {
      preferences: null,
      error: error instanceof Error ? error.message : 'Failed to fetch preferences',
    };
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Database not configured' };
  }

  try {
    const { error } = await db
      .from('notification_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id',
      });

    if (error && error.code !== '42P01') {
      throw error;
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating preferences:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update preferences',
    };
  }
}

/**
 * Show a local notification (for testing or immediate notifications)
 */
export async function showLocalNotification(
  title: string,
  options: NotificationOptions = {}
): Promise<void> {
  if (getNotificationPermission() !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    await registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    } as NotificationOptions);
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

/**
 * Send a test notification
 */
export async function sendTestNotification(): Promise<void> {
  await showLocalNotification('Test Notification', {
    body: 'Push notifications are working correctly!',
    tag: 'test',
    data: { url: '/profile' },
  });
}

/**
 * Create notification payload for different types
 */
export function createNotificationPayload(
  type: NotificationType,
  data: Record<string, unknown>
): { title: string; body: string; icon: string; tag: string; data: Record<string, unknown> } {
  const payloads: Record<NotificationType, () => ReturnType<typeof createNotificationPayload>> = {
    price_alert: () => ({
      title: 'Price Alert Triggered!',
      body: `${data.coin} has ${data.condition === 'above' ? 'risen above' : 'fallen below'} $${data.price}`,
      icon: '/icons/icon-192x192.png',
      tag: `price-alert-${data.alertId}`,
      data: { url: '/dashboard', ...data },
    }),

    portfolio_update: () => ({
      title: 'Portfolio Update',
      body: data.message as string || 'Your portfolio has been updated',
      icon: '/icons/icon-192x192.png',
      tag: 'portfolio-update',
      data: { url: '/dashboard', ...data },
    }),

    security_alert: () => ({
      title: 'Security Alert',
      body: data.message as string || 'Important security notification',
      icon: '/icons/icon-192x192.png',
      tag: 'security-alert',
      data: { url: '/profile', ...data },
    }),

    transaction: () => ({
      title: 'Transaction Complete',
      body: data.message as string || 'Your transaction has been processed',
      icon: '/icons/icon-192x192.png',
      tag: `transaction-${data.txId}`,
      data: { url: '/dashboard', ...data },
    }),

    news: () => ({
      title: data.headline as string || 'Crypto News',
      body: data.summary as string || 'New crypto news available',
      icon: '/icons/icon-192x192.png',
      tag: `news-${data.articleId}`,
      data: { url: '/learn', ...data },
    }),

    system: () => ({
      title: data.title as string || 'System Notification',
      body: data.message as string || 'You have a new notification',
      icon: '/icons/icon-192x192.png',
      tag: 'system',
      data: { url: '/', ...data },
    }),
  };

  return payloads[type]();
}

/**
 * Check if current subscription is still valid
 */
export async function checkSubscriptionValidity(): Promise<boolean> {
  if (!isPushSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription !== null;
  } catch {
    return false;
  }
}
