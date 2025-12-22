import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Session configuration
export const SESSION_CONFIG = {
  // Session timeout in milliseconds (30 minutes of inactivity)
  TIMEOUT_MS: 30 * 60 * 1000,
  // Maximum concurrent sessions per user
  MAX_SESSIONS: 5,
  // Activity update throttle (update activity every 5 minutes)
  ACTIVITY_THROTTLE_MS: 5 * 60 * 1000,
  // Session storage key
  STORAGE_KEY: 'bi_session_id',
  // Last activity storage key
  LAST_ACTIVITY_KEY: 'bi_last_activity',
};

export interface Session {
  id: string;
  user_id: string;
  device_info: string;
  ip_address: string | null;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface SessionInfo {
  deviceInfo: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Generate a unique session ID
 */
function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get device info from the browser
 */
export function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  let device = 'Unknown Device';

  // Detect OS
  let os = 'Unknown OS';
  if (ua.includes('Windows NT 10')) os = 'Windows 10';
  else if (ua.includes('Windows NT 11') || (ua.includes('Windows NT 10') && ua.includes('Win64'))) os = 'Windows 11';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS X')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  // Detect browser
  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  device = `${browser} on ${os}`;

  // Add mobile indicator
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    device += ' (Mobile)';
  }

  return device;
}

/**
 * Create a new session for a user
 */
export async function createSession(userId: string): Promise<{ sessionId: string | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { sessionId: null, error: 'Database not configured' };
  }

  try {
    const sessionId = generateSessionId();
    const deviceInfo = getDeviceInfo();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_CONFIG.TIMEOUT_MS);

    // Check current session count and enforce limit
    const { data: existingSessions, error: countError } = await supabase
      .from('user_sessions')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: true });

    if (countError && countError.code !== 'PGRST116') {
      console.error('Error checking sessions:', countError);
    }

    // If user has max sessions, remove the oldest one
    if (existingSessions && existingSessions.length >= SESSION_CONFIG.MAX_SESSIONS) {
      const sessionsToRemove = existingSessions.slice(0, existingSessions.length - SESSION_CONFIG.MAX_SESSIONS + 1);
      for (const session of sessionsToRemove) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('id', session.id);
      }
    }

    // Create new session
    const { error: insertError } = await supabase
      .from('user_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        device_info: deviceInfo,
        created_at: now.toISOString(),
        last_activity_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      // If table doesn't exist, store session locally only
      // PGRST116 = relation not found (Supabase REST API)
      // 42P01 = relation does not exist (PostgreSQL)
      if (insertError.code === '42P01' || insertError.code === 'PGRST116' || insertError.code === '404' || insertError.message?.includes('not found')) {
        console.warn('user_sessions table not found, using local session only');
        storeLocalSession(sessionId);
        return { sessionId, error: null };
      }
      console.error('Error creating session:', insertError);
      return { sessionId: null, error: insertError.message };
    }

    // Store session ID locally
    storeLocalSession(sessionId);

    return { sessionId, error: null };
  } catch (error) {
    console.error('Session creation error:', error);
    return { sessionId: null, error: 'Failed to create session' };
  }
}

/**
 * Store session ID in local storage
 */
function storeLocalSession(sessionId: string): void {
  try {
    localStorage.setItem(SESSION_CONFIG.STORAGE_KEY, sessionId);
    localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Could not store session in localStorage:', e);
  }
}

/**
 * Get current session ID from local storage
 */
export function getCurrentSessionId(): string | null {
  try {
    return localStorage.getItem(SESSION_CONFIG.STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Get last activity timestamp
 */
export function getLastActivity(): number {
  try {
    const timestamp = localStorage.getItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch {
    return 0;
  }
}

/**
 * Update last activity timestamp (throttled)
 */
let lastActivityUpdate = 0;
export async function updateActivity(userId: string): Promise<void> {
  const now = Date.now();

  // Throttle activity updates
  if (now - lastActivityUpdate < SESSION_CONFIG.ACTIVITY_THROTTLE_MS) {
    return;
  }

  lastActivityUpdate = now;

  // Update local storage
  try {
    localStorage.setItem(SESSION_CONFIG.LAST_ACTIVITY_KEY, now.toString());
  } catch (e) {
    console.warn('Could not update local activity:', e);
  }

  // Update database
  const sessionId = getCurrentSessionId();
  if (!sessionId || !isSupabaseConfigured()) {
    return;
  }

  const expiresAt = new Date(now + SESSION_CONFIG.TIMEOUT_MS);

  try {
    await supabase
      .from('user_sessions')
      .update({
        last_activity_at: new Date(now).toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', sessionId)
      .eq('user_id', userId);
  } catch (error) {
    // Silently fail for activity updates
    console.warn('Could not update session activity:', error);
  }
}

/**
 * Check if the current session is still valid
 */
export async function isSessionValid(userId: string): Promise<boolean> {
  const sessionId = getCurrentSessionId();

  if (!sessionId) {
    return false;
  }

  // Check local timeout first
  const lastActivity = getLastActivity();
  const now = Date.now();

  if (now - lastActivity > SESSION_CONFIG.TIMEOUT_MS) {
    // Session has timed out locally
    await invalidateSession(sessionId, userId);
    return false;
  }

  // Verify session in database if configured
  if (!isSupabaseConfigured()) {
    return true; // Trust local session if no database
  }

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('expires_at')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      // If table doesn't exist, trust local session
      if (error.code === 'PGRST116' || error.code === '42P01' || error.code === '404') {
        console.warn('user_sessions table not found, trusting local session');
        return true;
      }
      // Session not found in database
      return false;
    }

    if (!data) {
      // Session not found in database
      return false;
    }

    // Check if session has expired
    const expiresAt = new Date(data.expires_at).getTime();
    if (now > expiresAt) {
      await invalidateSession(sessionId, userId);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Session validation error:', error);
    // Trust local session on database error
    return true;
  }
}

/**
 * Invalidate a specific session
 */
export async function invalidateSession(sessionId: string, userId: string): Promise<void> {
  // Clear local storage
  try {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    localStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  } catch (e) {
    console.warn('Could not clear local session:', e);
  }

  // Remove from database
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('user_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);
    } catch (error) {
      console.warn('Could not delete session from database:', error);
    }
  }
}

/**
 * Invalidate all sessions for a user (logout everywhere)
 */
export async function invalidateAllSessions(userId: string): Promise<{ error: string | null }> {
  // Clear local storage
  try {
    localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
    localStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
  } catch (e) {
    console.warn('Could not clear local session:', e);
  }

  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error invalidating all sessions:', error);
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error invalidating all sessions:', error);
    return { error: 'Failed to invalidate all sessions' };
  }
}

/**
 * Get all active sessions for a user
 */
export async function getUserSessions(userId: string): Promise<{ sessions: Session[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { sessions: [], error: 'Database not configured' };
  }

  const currentSessionId = getCurrentSessionId();

  try {
    const { data, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_activity_at', { ascending: false });

    if (error) {
      if (error.code === '42P01') {
        // Table doesn't exist
        return { sessions: [], error: null };
      }
      return { sessions: [], error: error.message };
    }

    const sessions: Session[] = (data || []).map((s) => ({
      id: s.id,
      user_id: s.user_id,
      device_info: s.device_info,
      ip_address: s.ip_address,
      created_at: s.created_at,
      last_activity_at: s.last_activity_at,
      expires_at: s.expires_at,
      is_current: s.id === currentSessionId,
    }));

    return { sessions, error: null };
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return { sessions: [], error: 'Failed to fetch sessions' };
  }
}

/**
 * Terminate a specific session (for session management UI)
 */
export async function terminateSession(sessionId: string, userId: string): Promise<{ error: string | null }> {
  const currentSessionId = getCurrentSessionId();

  // If terminating current session, clear local storage
  if (sessionId === currentSessionId) {
    try {
      localStorage.removeItem(SESSION_CONFIG.STORAGE_KEY);
      localStorage.removeItem(SESSION_CONFIG.LAST_ACTIVITY_KEY);
    } catch (e) {
      console.warn('Could not clear local session:', e);
    }
  }

  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  try {
    const { error } = await supabase
      .from('user_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) {
      return { error: error.message };
    }

    return { error: null };
  } catch (error) {
    console.error('Error terminating session:', error);
    return { error: 'Failed to terminate session' };
  }
}

/**
 * Clean up expired sessions (called periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  if (!isSupabaseConfigured()) {
    return;
  }

  try {
    await supabase
      .from('user_sessions')
      .delete()
      .lt('expires_at', new Date().toISOString());
  } catch (error) {
    console.warn('Could not cleanup expired sessions:', error);
  }
}

/**
 * Create an activity tracker hook helper
 */
export function createActivityTracker(userId: string): () => void {
  return () => {
    updateActivity(userId);
  };
}
