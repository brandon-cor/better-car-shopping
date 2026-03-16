/**
 * Activity Tracking Service
 * Tracks user activities and usage for analytics and rate limiting
 */

import { getSupabase, isSupabaseConfigured } from "./client";
import { ensureUser } from "./users";
import type { ActivityType, ActivityRow, UsageRow } from "./types";

/**
 * Track a user activity
 * Non-blocking - fires and forgets to avoid slowing down requests
 */
export async function trackActivity(
  userId: string,
  type: ActivityType,
  metadata?: Record<string, unknown> | null,
  options?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const supabase = getSupabase();
  if (!supabase) return;

  // Ensure user exists before tracking activity
  await ensureUser(userId);

  const { error } = await supabase.from("user_activities").insert({
    user_id: userId,
    type,
    metadata: metadata || null,
    created_at: new Date().toISOString(),
    ip_address: options?.ipAddress || null,
    user_agent: options?.userAgent || null,
  });

  // Silent fail - don't expose tracking
}

/**
 * Track activity without blocking the request
 * Use this in API routes to avoid adding latency
 */
export function trackActivityAsync(
  userId: string,
  type: ActivityType,
  metadata?: Record<string, unknown> | null,
  options?: {
    ipAddress?: string | null;
    userAgent?: string | null;
  }
): void {
  // Fire and forget - silent
  trackActivity(userId, type, metadata, options).catch(() => {});
}

/**
 * Get current period string for daily tracking
 */
function getDailyPeriod(): string {
  return new Date().toISOString().split("T")[0]; // "2026-01-21"
}

/**
 * Get current period string for monthly tracking
 */
function getMonthlyPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`; // "2026-01"
}

/**
 * Increment usage count for a feature
 * Used for tracking rate limits
 */
export async function incrementUsage(
  userId: string,
  feature: string,
  periodType: "daily" | "monthly" = "daily"
): Promise<{ count: number; period: string } | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = getSupabase();
  if (!supabase) return null;

  // Ensure user exists before tracking usage
  await ensureUser(userId);

  const period = periodType === "daily" ? getDailyPeriod() : getMonthlyPeriod();

  // Try to get existing usage record
  const { data: existing } = await supabase
    .from("user_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("period", period)
    .single();

  if (existing) {
    // Update existing
    const existingRow = existing as UsageRow;
    const newCount = existingRow.count + 1;
    const { error } = await supabase
      .from("user_usage")
      .update({
        count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingRow.id);

    if (error) return null;

    return { count: newCount, period };
  }

  // Create new usage record
  const now = new Date().toISOString();
  const { error } = await supabase.from("user_usage").insert({
    user_id: userId,
    feature,
    period,
    count: 1,
    created_at: now,
    updated_at: now,
  });

  if (error) return null;

  return { count: 1, period };
}

/**
 * Get current usage for a feature
 */
export async function getUsage(
  userId: string,
  feature: string,
  periodType: "daily" | "monthly" = "daily"
): Promise<number> {
  if (!isSupabaseConfigured()) return 0;

  const supabase = getSupabase();
  if (!supabase) return 0;

  const period = periodType === "daily" ? getDailyPeriod() : getMonthlyPeriod();

  const { data } = await supabase
    .from("user_usage")
    .select("count")
    .eq("user_id", userId)
    .eq("feature", feature)
    .eq("period", period)
    .single();

  return (data as { count: number } | null)?.count ?? 0;
}

/**
 * Get all usage for a user in current period
 */
export async function getAllUsage(
  userId: string,
  periodType: "daily" | "monthly" = "daily"
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured()) return {};

  const supabase = getSupabase();
  if (!supabase) return {};

  const period = periodType === "daily" ? getDailyPeriod() : getMonthlyPeriod();

  const { data } = await supabase
    .from("user_usage")
    .select("feature, count")
    .eq("user_id", userId)
    .eq("period", period);

  if (!data) return {};

  return (data as Array<{ feature: string; count: number }>).reduce(
    (acc, row) => {
      acc[row.feature] = row.count;
      return acc;
    },
    {} as Record<string, number>
  );
}

/**
 * Get recent activities for a user
 */
export async function getRecentActivities(
  userId: string,
  limit: number = 50
): Promise<ActivityRow[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const { data } = await supabase
    .from("user_activities")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data as ActivityRow[]) ?? [];
}

/**
 * Get activity count by type for a user
 */
export async function getActivityStats(
  userId: string
): Promise<Record<ActivityType, number>> {
  if (!isSupabaseConfigured()) {
    return {} as Record<ActivityType, number>;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {} as Record<ActivityType, number>;
  }

  // Get all activities and count by type
  const { data } = await supabase
    .from("user_activities")
    .select("type")
    .eq("user_id", userId);

  if (!data) return {} as Record<ActivityType, number>;

  return (data as Array<{ type: ActivityType }>).reduce(
    (acc, row) => {
      const type = row.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<ActivityType, number>
  );
}

/**
 * Track a search activity with search parameters
 */
export function trackSearch(
  userId: string,
  searchParams: Record<string, unknown>,
  options?: { ipAddress?: string; userAgent?: string }
): void {
  trackActivityAsync(userId, "search", { searchParams }, options);
}

/**
 * Track a call activity
 */
export function trackCall(
  userId: string,
  callData: { listingId?: string; dealerPhone?: string; callId?: string },
  options?: { ipAddress?: string; userAgent?: string }
): void {
  trackActivityAsync(userId, "call", callData, options);
}

/**
 * Track scout creation
 */
export function trackScoutCreate(
  userId: string,
  scoutData: { query?: string; interval?: string; scoutId?: string },
  options?: { ipAddress?: string; userAgent?: string }
): void {
  trackActivityAsync(userId, "scout_create", scoutData, options);
}

/**
 * Track listing view
 */
export function trackListingView(
  userId: string,
  listingData: { listingId?: string; make?: string; model?: string; year?: number },
  options?: { ipAddress?: string; userAgent?: string }
): void {
  trackActivityAsync(userId, "listing_view", listingData, options);
}
