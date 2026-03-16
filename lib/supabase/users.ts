/**
 * User Management Service
 * Handles syncing users from Clerk and managing user profiles in Supabase
 */

import { getSupabase, isSupabaseConfigured } from "./client";
import type { UserRow, UserProfile } from "./types";

/**
 * Convert database row to UserProfile
 */
function rowToProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    imageUrl: row.image_url,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    lastSignInAt: row.last_sign_in_at ? new Date(row.last_sign_in_at) : null,
    signInCount: row.sign_in_count,
  };
}

/**
 * Upsert a user from Clerk data
 * Creates if not exists, updates if exists
 */
export async function upsertUser(data: {
  id: string;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  imageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  
  const supabase = getSupabase();
  if (!supabase) return null;

  const now = new Date().toISOString();

  // Check if user exists
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.id)
    .single();

  if (existing) {
    // Update existing user
    const { data: updated, error } = await supabase
      .from("users")
      .update({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        image_url: data.imageUrl,
        updated_at: now,
        metadata: data.metadata,
      })
      .eq("id", data.id)
      .select()
      .single();

    if (error) return null;

    return updated ? rowToProfile(updated as UserRow) : null;
  }

  // Create new user
  const { data: created, error } = await supabase
    .from("users")
    .insert({
      id: data.id,
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      image_url: data.imageUrl,
      created_at: now,
      updated_at: now,
      sign_in_count: 0,
      metadata: data.metadata,
    })
    .select()
    .single();

  if (error) return null;

  return created ? rowToProfile(created as UserRow) : null;
}

/**
 * Get user by ID
 */
export async function getUser(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) return null;
  
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return rowToProfile(data as UserRow);
}

/**
 * Record user sign in
 */
export async function recordSignIn(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  
  const supabase = getSupabase();
  if (!supabase) return;

  const now = new Date().toISOString();

  // Get current sign_in_count
  const { data: existing } = await supabase
    .from("users")
    .select("sign_in_count")
    .eq("id", userId)
    .single();

  const currentCount = (existing as { sign_in_count?: number } | null)?.sign_in_count ?? 0;

  await supabase
    .from("users")
    .update({
      last_sign_in_at: now,
      sign_in_count: currentCount + 1,
      updated_at: now,
    })
    .eq("id", userId);
}

/**
 * Delete user
 */
export async function deleteUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) return false;

  return true;
}

/**
 * Ensure user exists in Supabase
 * Creates a minimal record if not exists, used for tracking activities
 */
export async function ensureUser(userId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  
  const supabase = getSupabase();
  if (!supabase) return false;

  // Check if exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .single();

  if (existing) return true;

  // Create minimal user record
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("users")
    .insert({
      id: userId,
      created_at: now,
      updated_at: now,
      sign_in_count: 0,
    });

  if (error) return false;

  return true;
}
