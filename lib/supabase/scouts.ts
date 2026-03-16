/**
 * User Scouts Service
 * Maps Yutori scout IDs to users for proper isolation
 */

import { getSupabase, isSupabaseConfigured, resetSupabase } from "./client";
import { ensureUser } from "./users";

/**
 * Check if error is an auth/API key error and reset client if so
 */
function handleSupabaseError(error: unknown): void {
  if (error && typeof error === "object" && "message" in error) {
    const msg = (error as { message: string }).message;
    if (msg.includes("Invalid API key") || msg.includes("JWT")) {
      console.error("[Scouts] Auth error detected, resetting Supabase client");
      resetSupabase();
    }
  }
}

interface UserScout {
  id: string;
  user_id: string;
  scout_id: string;
  query: string;
  interval: string;
  created_at: string;
  deleted_at: string | null;
}

/**
 * Register a scout for a user
 * Call this after creating a scout in Yutori
 */
export async function registerScout(
  userId: string,
  scoutId: string,
  query: string,
  interval: string = "daily"
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  await ensureUser(userId);

  const { error } = await supabase.from("user_scouts").insert({
    user_id: userId,
    scout_id: scoutId,
    query,
    interval,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[Scouts] Failed to register scout:", error);
    handleSupabaseError(error);
    return false;
  }

  return true;
}

/**
 * Get all scout IDs for a user
 * Returns only active (non-deleted) scouts
 */
export async function getUserScoutIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_scouts")
    .select("scout_id")
    .eq("user_id", userId)
    .is("deleted_at", null);

  if (error) {
    console.error("[Scouts] Failed to get user scouts:", error);
    handleSupabaseError(error);
    return [];
  }

  return (data as { scout_id: string }[]).map((s) => s.scout_id);
}

/**
 * Check if a scout belongs to a user
 */
export async function isUserScout(userId: string, scoutId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { data, error } = await supabase
    .from("user_scouts")
    .select("id")
    .eq("user_id", userId)
    .eq("scout_id", scoutId)
    .is("deleted_at", null)
    .single();

  if (error) return false;
  return !!data;
}

/**
 * Soft delete a scout for a user
 */
export async function deleteUserScout(userId: string, scoutId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from("user_scouts")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("scout_id", scoutId);

  if (error) {
    console.error("[Scouts] Failed to delete scout:", error);
    return false;
  }

  return true;
}

/**
 * Get all scouts for a user with metadata
 */
export async function getUserScouts(userId: string): Promise<UserScout[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("user_scouts")
    .select("*")
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Scouts] Failed to get user scouts:", error);
    return [];
  }

  return data as UserScout[];
}

