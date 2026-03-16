/**
 * Supabase Client
 * Handles connection to Supabase for user tracking and activity logging
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;
let lastUrl: string | undefined;
let lastKey: string | undefined;

/**
 * Get or create Supabase client instance
 * Uses singleton pattern to reuse connection
 * Recreates client if env vars have changed
 */
export function getSupabase(): SupabaseClient | null {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  // Recreate client if env vars changed (e.g., hot reload)
  if (supabaseInstance && (lastUrl !== supabaseUrl || lastKey !== supabaseKey)) {
    supabaseInstance = null;
  }

  if (supabaseInstance) {
    return supabaseInstance;
  }

  lastUrl = supabaseUrl;
  lastKey = supabaseKey;

  supabaseInstance = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseInstance;
}

/**
 * Reset the Supabase client instance
 * Call this if you encounter auth errors to force recreation
 */
export function resetSupabase(): void {
  supabaseInstance = null;
  lastUrl = undefined;
  lastKey = undefined;
}

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
