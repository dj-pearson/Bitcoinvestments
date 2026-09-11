import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Json } from '../types/database';
import type { UserRole } from '../types/admin-database';
import { verifyTOTP, redeemRecoveryCode } from './twoFactor';

export interface AuthUser {
  id: string;
  email: string | null; // Made optional for wallet-only accounts
  wallet_address?: string | null; // Ethereum wallet address
  created_at: string;
  role: UserRole;
  is_suspended: boolean;
}

export interface SignInResult {
  user: AuthUser | null;
  error: string | null;
  requires2FA?: boolean;
  userId?: string;
  email?: string; // Store email for 2FA re-authentication
}

// Rate limiting configuration
const LOGIN_RATE_LIMIT = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 30 * 60 * 1000, // 30 minutes lockout after max attempts
};

// In-memory rate limiting store (per session)
const loginAttempts: Map<string, { count: number; firstAttempt: number; lockedUntil?: number }> = new Map();

/**
 * Marks a Supabase session that exists only to let the second factor be checked.
 *
 * Password sign-in creates a real session before 2FA is verified, which is what
 * makes the secret readable under the owner's own RLS policy. Until the code is
 * accepted that session must not count as being signed in, so the pending state
 * is recorded next to it - in localStorage, the same place and lifetime as the
 * Supabase session itself, so that closing the tab at the prompt and returning
 * later still lands on "pending" rather than on a logged-in application.
 */
const TWO_FACTOR_PENDING_KEY = 'auth.2fa_pending_user';

function safeLocalStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null;
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
    return null;
  }
}

export function markTwoFactorPending(userId: string): void {
  safeLocalStorage()?.setItem(TWO_FACTOR_PENDING_KEY, userId);
}

export function clearTwoFactorPending(): void {
  safeLocalStorage()?.removeItem(TWO_FACTOR_PENDING_KEY);
}

export function getTwoFactorPendingUserId(): string | null {
  return safeLocalStorage()?.getItem(TWO_FACTOR_PENDING_KEY) ?? null;
}

export function isTwoFactorPending(): boolean {
  return getTwoFactorPendingUserId() !== null;
}

/**
 * Check if login is rate limited for an email
 */
function checkRateLimit(email: string): { allowed: boolean; retryAfter?: number } {
  const normalizedEmail = email.toLowerCase();
  const now = Date.now();
  const attempts = loginAttempts.get(normalizedEmail);

  if (!attempts) {
    return { allowed: true };
  }

  // Check if currently locked out
  if (attempts.lockedUntil && now < attempts.lockedUntil) {
    return {
      allowed: false,
      retryAfter: Math.ceil((attempts.lockedUntil - now) / 1000)
    };
  }

  // Reset if window has passed
  if (now - attempts.firstAttempt > LOGIN_RATE_LIMIT.windowMs) {
    loginAttempts.delete(normalizedEmail);
    return { allowed: true };
  }

  // Check if at max attempts
  if (attempts.count >= LOGIN_RATE_LIMIT.maxAttempts) {
    attempts.lockedUntil = now + LOGIN_RATE_LIMIT.lockoutMs;
    return {
      allowed: false,
      retryAfter: Math.ceil(LOGIN_RATE_LIMIT.lockoutMs / 1000)
    };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt
 */
function recordFailedAttempt(email: string): void {
  const normalizedEmail = email.toLowerCase();
  const now = Date.now();
  const attempts = loginAttempts.get(normalizedEmail);

  if (!attempts || now - attempts.firstAttempt > LOGIN_RATE_LIMIT.windowMs) {
    loginAttempts.set(normalizedEmail, { count: 1, firstAttempt: now });
  } else {
    attempts.count++;
  }
}

/**
 * Clear rate limiting after successful login
 */
function clearRateLimit(email: string): void {
  loginAttempts.delete(email.toLowerCase());
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Authentication is not configured' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    // Create user profile in our users table
    await supabase.from('users').insert({
      id: data.user.id,
      email: data.user.email!,
      subscription_status: 'free',
      preferences: {
        experience_level: 'beginner',
        risk_tolerance: 'medium',
        favorite_cryptocurrencies: [],
        notification_settings: {
          price_alerts: true,
          news_alerts: true,
          weekly_summary: true,
          marketing_emails: false,
        },
        theme: 'dark',
      },
    });

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        role: 'user', // New users are always regular users
        is_suspended: false,
      },
      error: null,
    };
  }

  return { user: null, error: 'Failed to create user' };
}

/**
 * Sign in with email and password
 * Returns requires2FA: true if user has 2FA enabled
 */
export async function signIn(
  email: string,
  password: string
): Promise<SignInResult> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Authentication is not configured' };
  }

  // Check rate limiting
  const rateCheck = checkRateLimit(email);
  if (!rateCheck.allowed) {
    const minutes = Math.ceil((rateCheck.retryAfter || 0) / 60);
    return {
      user: null,
      error: `Too many login attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    recordFailedAttempt(email);
    return { user: null, error: error.message };
  }

  if (data.user) {
    // Fetch user profile to get role and 2FA status
    const profile = await getUserProfile(data.user.id);

    // Check if user is suspended
    if (profile?.is_suspended) {
      await signOut();
      clearRateLimit(email);
      return {
        user: null,
        error: profile.suspended_reason || 'Your account has been suspended. Please contact support.'
      };
    }

    // Check if 2FA is enabled
    if (profile?.two_factor_enabled) {
      // The session is deliberately left in place until the second factor is
      // checked. Verification has to read the caller's own row from public.users
      // to get the TOTP secret, and that row is only reachable under RLS while
      // they are authenticated - signing out here made the lookup run as `anon`,
      // which every correct policy denies. Callers MUST finish with
      // signInWithTwoFactor or cancelTwoFactorSignIn; the AuthContext gate keeps
      // the half-authenticated session out of the application until they do.
      markTwoFactorPending(data.user.id);
      return {
        user: null,
        error: null,
        requires2FA: true,
        userId: data.user.id,
        email: email,
      };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

    // Clear rate limiting on successful login
    clearRateLimit(email);

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
        role: (profile?.role as UserRole) || 'user',
        is_suspended: profile?.is_suspended || false,
      },
      error: null,
    };
  }

  recordFailedAttempt(email);
  return { user: null, error: 'Failed to sign in' };
}

/**
 * Complete sign in with 2FA verification.
 *
 * Runs against the session that signIn established and left pending, so the
 * secret lookup is an ordinary owner-scoped read rather than an anonymous query
 * for somebody else's row. A failed check tears the pending session down.
 */
export async function signInWithTwoFactor(
  userId: string,
  code: string,
  isRecoveryCode: boolean = false,
  email?: string
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Authentication is not configured' };
  }

  // Check rate limiting for 2FA attempts
  if (email) {
    const rateCheck = checkRateLimit(email);
    if (!rateCheck.allowed) {
      const minutes = Math.ceil((rateCheck.retryAfter || 0) / 60);
      return {
        user: null,
        error: `Too many attempts. Please try again in ${minutes} minute${minutes > 1 ? 's' : ''}.`
      };
    }
  }

  // The pending session must belong to the account being verified. Without this
  // the userId is just a caller-supplied string.
  const { data: { user: sessionUser } } = await supabase.auth.getUser();
  if (!sessionUser || sessionUser.id !== userId) {
    await cancelTwoFactorSignIn();
    return { user: null, error: 'Your sign-in attempt expired. Please start again.' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    if (email) recordFailedAttempt(email);
    await cancelTwoFactorSignIn();
    return { user: null, error: 'User not found' };
  }

  if (!profile.two_factor_enabled || !profile.two_factor_secret) {
    await cancelTwoFactorSignIn();
    return { user: null, error: '2FA is not enabled for this account' };
  }

  let isValid = false;

  if (isRecoveryCode) {
    // Verify recovery code
    const result = await redeemRecoveryCode(userId, code);
    isValid = result.success;
    if (result.error) {
      if (email) recordFailedAttempt(email);
      return { user: null, error: result.error };
    }
  } else {
    // Verify TOTP code
    isValid = await verifyTOTP(profile.two_factor_secret, code);
  }

  if (!isValid) {
    if (email) recordFailedAttempt(email);
    return { user: null, error: 'Invalid verification code' };
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

  // Clear rate limiting on successful 2FA
  if (email) clearRateLimit(email);
  clearTwoFactorPending();

  return {
    user: {
      id: userId,
      email: profile.email,
      created_at: profile.created_at,
      role: (profile.role as UserRole) || 'user',
      is_suspended: profile.is_suspended || false,
    },
    error: null,
  };
}

/**
 * Abandon a sign-in that stopped at the 2FA prompt, discarding the pending
 * session rather than leaving it usable.
 */
export async function cancelTwoFactorSignIn(): Promise<void> {
  clearTwoFactorPending();
  await signOut();
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
  clearTwoFactorPending();

  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Get the current authenticated user with role
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Fetch user profile to get role
    const profile = await getUserProfile(user.id);

    // Ensure role is properly typed
    const role: UserRole = isValidUserRole(profile?.role) ? profile.role : 'user';

    return {
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
      role,
      is_suspended: profile?.is_suspended ?? false,
    };
  }

  return null;
}

/**
 * Type guard for UserRole
 */
function isValidUserRole(role: unknown): role is UserRole {
  return role === 'user' || role === 'admin' || role === 'super_admin';
}

/**
 * Send password reset email
 */
export async function resetPassword(
  email: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Authentication is not configured' };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Update user password
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Authentication is not configured' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}

/**
 * Subscribe to auth state changes
 * Note: This now fetches the user profile to include role information
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): { unsubscribe: () => void } {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      if (session?.user) {
        // Fetch user profile to get role - this prevents race conditions
        const profile = await getUserProfile(session.user.id);
        const role: UserRole = isValidUserRole(profile?.role) ? profile.role : 'user';

        callback({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
          role,
          is_suspended: profile?.is_suspended ?? false,
        });
      } else {
        callback(null);
      }
    }
  );

  return { unsubscribe: () => subscription.unsubscribe() };
}

/**
 * Get user profile from database
 */
export async function getUserProfile(userId: string) {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    preferences?: Json;
    subscription_status?: 'free' | 'premium';
  }
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Database is not configured' };
  }

  const { error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
