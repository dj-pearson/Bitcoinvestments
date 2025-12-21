import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Json } from '../types/database';
import type { UserRole } from '../types/admin-database';
import { verifyTOTP, useRecoveryCode as useRecoveryCodeService } from './twoFactor';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
  role?: UserRole;
  is_suspended?: boolean;
}

export interface SignInResult {
  user: AuthUser | null;
  error: string | null;
  requires2FA?: boolean;
  userId?: string;
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

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  if (data.user) {
    // Fetch user profile to get role and 2FA status
    const profile = await getUserProfile(data.user.id);

    // Check if user is suspended
    if (profile?.is_suspended) {
      await signOut();
      return {
        user: null,
        error: profile.suspended_reason || 'Your account has been suspended. Please contact support.'
      };
    }

    // Check if 2FA is enabled
    if (profile?.two_factor_enabled) {
      // Don't complete the sign-in yet - require 2FA verification
      // Sign out temporarily until 2FA is verified
      await signOut();
      return {
        user: null,
        error: null,
        requires2FA: true,
        userId: data.user.id,
      };
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', data.user.id);

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

  return { user: null, error: 'Failed to sign in' };
}

/**
 * Complete sign in with 2FA verification
 */
export async function signInWithTwoFactor(
  userId: string,
  code: string,
  isRecoveryCode: boolean = false
): Promise<{ user: AuthUser | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { user: null, error: 'Authentication is not configured' };
  }

  // Get user profile to verify 2FA
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    return { user: null, error: 'User not found' };
  }

  if (!profile.two_factor_enabled || !profile.two_factor_secret) {
    return { user: null, error: '2FA is not enabled for this account' };
  }

  let isValid = false;

  if (isRecoveryCode) {
    // Verify recovery code
    const result = await useRecoveryCodeService(userId, code);
    isValid = result.success;
    if (result.error) {
      return { user: null, error: result.error };
    }
  } else {
    // Verify TOTP code
    isValid = await verifyTOTP(profile.two_factor_secret, code);
  }

  if (!isValid) {
    return { user: null, error: 'Invalid verification code' };
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login_at: new Date().toISOString() })
    .eq('id', userId);

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
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: string | null }> {
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

    return {
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
      role: (profile?.role as UserRole) || 'user',
      is_suspended: profile?.is_suspended || false,
    };
  }

  return null;
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
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null) => void
): { unsubscribe: () => void } {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      if (session?.user) {
        callback({
          id: session.user.id,
          email: session.user.email!,
          created_at: session.user.created_at,
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
