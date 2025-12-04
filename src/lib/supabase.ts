import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Debug logging (will be removed in production builds by Vite)
if (import.meta.env.DEV) {
  console.log('🔍 Supabase Environment Check:');
  console.log('  VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('  VITE_SUPABASE_PUBLISHABLE_KEY:', supabaseKey ? '✓ Set' : '✗ Missing');
}

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase configuration error:');
  console.error('  Missing required environment variables:');
  if (!supabaseUrl) console.error('    - VITE_SUPABASE_URL');
  if (!supabaseKey) console.error('    - VITE_SUPABASE_PUBLISHABLE_KEY');
  console.error('  Please set these in Cloudflare Dashboard > Settings > Environment Variables');
  console.error('  See docs/CLOUDFLARE_ENV_SETUP.md for instructions');
}

// Create Supabase client with fallback values to prevent crashes
// Note: Features requiring Supabase will check isSupabaseConfigured() before using
export const supabase = createClient<Database>(
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

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseKey && supabaseUrl !== 'https://placeholder.supabase.co');
};

// Export project ID for reference
export const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
