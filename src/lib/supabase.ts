import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Check if Supabase is properly configured
const isConfigured = Boolean(supabaseUrl && supabaseKey);

// Create Supabase client - uses placeholder when not configured to prevent crashes
// Features should check isSupabaseConfigured() before making database calls
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

// Helper to check if Supabase is configured - use before any database operations
export const isSupabaseConfigured = (): boolean => {
  return isConfigured;
};

// Export project ID for reference
export const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

// Untyped client for tables not in the schema
// Use this when accessing tables that haven't been added to the Database type yet
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = supabase as SupabaseClient<any>;
