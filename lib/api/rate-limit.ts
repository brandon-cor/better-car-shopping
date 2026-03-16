import { NextRequest } from "next/server";
import { getCache, setCache, deleteCache, generateRateLimitKey, setCacheSync } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants/cache-ttl";
import { getUsage, incrementUsage as incrementSupabaseUsage } from "@/lib/supabase";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  feature?: string;
}

const RATE_LIMIT_MAX_REQUESTS = 100;

// Rate limits for authenticated users (per day)
export const USER_RATE_LIMITS = {
  SEARCH: { limit: 10, featureKey: "search" },        // 10 per day
  CALL: { limit: 3, featureKey: "call" },             // 3 per day
  SCOUT_CREATE: { limit: 1, featureKey: "scout_create" }, // 1 per day
} as const;

export type RateLimitFeature = keyof typeof USER_RATE_LIMITS;

/**
 * Get the reset time for daily limits (midnight UTC)
 */
function getDailyResetTime(): number {
  const now = new Date();
  const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
  return Math.floor(tomorrow.getTime() / 1000);
}

export async function rateLimit(
  req: NextRequest,
  limit: number = RATE_LIMIT_MAX_REQUESTS,
  windowSeconds: number = CACHE_TTL.RATE_LIMIT_WINDOW
): Promise<RateLimitResult> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || 
             req.headers.get("x-real-ip") || 
             "unknown";
  
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  
  // Use standardized key generation
  const cacheKey = generateRateLimitKey(ip, windowStart);
  
  const current = await getCache<number>(cacheKey) || 0;
  
  if (current >= limit) {
    const reset = windowStart + windowSeconds;
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
    };
  }
  
  const newCount = current + 1;
  await setCacheSync(cacheKey, newCount, windowSeconds);
  
  const reset = windowStart + windowSeconds;
  return {
    success: true,
    limit,
    remaining: limit - newCount,
    reset,
  };
}

/**
 * Rate limit for authenticated users based on feature
 * Uses Supabase for persistent, reliable rate limiting across serverless instances
 */
export async function rateLimitUser(
  userId: string,
  feature: RateLimitFeature
): Promise<RateLimitResult> {
  const config = USER_RATE_LIMITS[feature];
  const { limit, featureKey } = config;
  
  const reset = getDailyResetTime();
  
  // Get current usage from Supabase (persistent across all instances)
  const currentUsage = await getUsage(userId, featureKey, "daily");
  
  if (currentUsage >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
      feature,
    };
  }
  
  // Increment usage in Supabase BEFORE returning success
  // This ensures the count is persisted before the action completes
  const result = await incrementSupabaseUsage(userId, featureKey, "daily");
  
  // If increment failed, still allow but log warning
  if (!result) {
    console.warn(`[RateLimit] Failed to increment usage for ${userId}:${feature}`);
  }
  
  // Check if we exceeded limit during concurrent requests
  if (result && result.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset,
      feature,
    };
  }
  
  return {
    success: true,
    limit,
    remaining: limit - (result?.count || currentUsage + 1),
    reset,
    feature,
  };
}

export async function resetRateLimit(
  req: NextRequest,
  windowSeconds: number = CACHE_TTL.RATE_LIMIT_WINDOW
): Promise<void> {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || 
             req.headers.get("x-real-ip") || 
             "unknown";
  
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  
  const cacheKey = generateRateLimitKey(ip, windowStart);
  await deleteCache(cacheKey);
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}
