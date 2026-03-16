/**
 * Cache Key Generation Utilities
 * Centralizes all cache key generation for consistency
 */

/**
 * Simple string hash function for consistent key generation
 * Uses djb2 algorithm - fast and has good distribution
 */
function simpleHash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  // Convert to hex and ensure positive
  return (hash >>> 0).toString(16);
}

/**
 * Generate cache key for listing details
 */
export function generateListingKey(id: string): string {
  return `listing:${id}`;
}

/**
 * Search params interface for key generation
 */
interface SearchParams {
  make?: string;
  model?: string;
  year?: number;
  year_min?: number;
  year_max?: number;
  price_min?: number;
  price_max?: number;
  exterior_color?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  rows?: number;
  start?: number;
  sort_by?: string;
  sort_order?: string;
  miles_min?: number;
  miles_max?: number;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  car_type?: string;
  city?: string;
  [key: string]: string | number | undefined;
}

/**
 * Generate cache key for search results
 * Normalizes and hashes params for consistent keys
 */
export function generateSearchKey(params: SearchParams): string {
  // Get all keys, sort alphabetically
  const keys = Object.keys(params).sort();
  
  // Build normalized params object
  const normalized: Record<string, string | number> = {};
  
  for (const key of keys) {
    const value = params[key];
    
    // Skip undefined/null values
    if (value === undefined || value === null) continue;
    
    // Normalize string values to lowercase
    if (typeof value === 'string') {
      normalized[key] = value.toLowerCase().trim();
    } else {
      normalized[key] = value;
    }
  }
  
  // Convert to JSON and hash
  const jsonStr = JSON.stringify(normalized);
  const hash = simpleHash(jsonStr);
  
  return `search:${hash}`;
}

/**
 * Generate cache key for parsed queries
 * Normalizes the query for consistent caching
 */
export function generateParseQueryKey(query: string): string {
  // Normalize: trim, lowercase, collapse whitespace
  const normalized = query.trim().toLowerCase().replace(/\s+/g, ' ');
  const hash = simpleHash(normalized);
  return `parse:${hash}`;
}

/**
 * Generate cache key for similar vehicles
 */
export function generateSimilarKey(id: string, preferencesHash?: string): string {
  if (preferencesHash) {
    return `similar:${id}:${preferencesHash}`;
  }
  return `similar:${id}`;
}

/**
 * Generate cache key for market analytics
 */
export function generateMarketAnalyticsKey(id: string): string {
  return `market:${id}`;
}

/**
 * Generate cache key for rate limiting
 */
export function generateRateLimitKey(ip: string, windowStart: number): string {
  return `ratelimit:${ip}:${windowStart}`;
}

/**
 * Generate cache key for dealer info
 */
export function generateDealerKey(dealerId: string): string {
  return `dealer:${dealerId}`;
}

/**
 * Generate cache key for VIN decode
 */
export function generateVinKey(vin: string): string {
  return `vin:${vin.toUpperCase()}`;
}

/**
 * Generate a hash from preferences object for cache key inclusion
 */
export function hashPreferences(preferences: Record<string, unknown>): string {
  const jsonStr = JSON.stringify(preferences);
  return simpleHash(jsonStr);
}

/**
 * Legacy function for backward compatibility
 */
export function generateCacheKey(prefix: string, ...parts: (string | number)[]): string {
  return `${prefix}:${parts.join(':')}`;
}

