/**
 * User Preferences Service
 * Syncs user preferences to Supabase
 */

import { getSupabase, isSupabaseConfigured } from "./client";
import { ensureUser } from "./users";

export interface UserPreferences {
  zipCode?: string;
  radius?: number;
  preferredMakes?: string;
  preferredBodyTypes?: string[];
  maxPrice?: number;
  minYear?: number;
  preferredFuelTypes?: string[];
  lastLocation?: {
    latitude: number;
    longitude: number;
    city?: string;
  };
}

interface PreferencesRow {
  user_id: string;
  zip_code: string | null;
  radius: number | null;
  preferred_makes: string | null;
  preferred_body_types: string[] | null;
  max_price: number | null;
  min_year: number | null;
  preferred_fuel_types: string[] | null;
  last_location: { latitude: number; longitude: number; city?: string } | null;
  updated_at: string;
}

/**
 * Save user preferences to Supabase
 */
export async function savePreferences(
  userId: string,
  preferences: UserPreferences
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  await ensureUser(userId);

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: userId,
      zip_code: preferences.zipCode || null,
      radius: preferences.radius || null,
      preferred_makes: preferences.preferredMakes || null,
      preferred_body_types: preferences.preferredBodyTypes || null,
      max_price: preferences.maxPrice || null,
      min_year: preferences.minYear || null,
      preferred_fuel_types: preferences.preferredFuelTypes || null,
      last_location: preferences.lastLocation || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) return false;

  return true;
}

/**
 * Get user preferences from Supabase
 */
export async function getPreferences(
  userId: string
): Promise<UserPreferences | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;

  const row = data as PreferencesRow;
  return {
    zipCode: row.zip_code || undefined,
    radius: row.radius || undefined,
    preferredMakes: row.preferred_makes || undefined,
    preferredBodyTypes: row.preferred_body_types || undefined,
    maxPrice: row.max_price || undefined,
    minYear: row.min_year || undefined,
    preferredFuelTypes: row.preferred_fuel_types || undefined,
    lastLocation: row.last_location || undefined,
  };
}

/**
 * Delete user preferences
 */
export async function deletePreferences(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from("user_preferences")
    .delete()
    .eq("user_id", userId);

  return !error;
}

