import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Json } from '../types/database';

export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
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
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ user: AuthUser | null; error: string | null }> {
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
    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        created_at: data.user.created_at,
      },
      error: null,
    };
  }

  return { user: null, error: 'Failed to sign in' };
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
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    return {
      id: user.id,
      email: user.email!,
      created_at: user.created_at,
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
