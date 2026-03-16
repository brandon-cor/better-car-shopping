/**
 * Centralized TTL (Time-To-Live) constants for caching
 * All values are in seconds unless otherwise specified
 */

export const CACHE_TTL = {
  /** Listing detail cache - 5 minutes (inventory can change) */
  LISTING_DETAIL: 300,
  
  /** Search results cache - 1 minute (inventory changes frequently) */
  SEARCH_RESULTS: 60,
  
  /** Parse query cache - 1 hour (same query always parses the same) */
  PARSE_QUERY: 3600,
  
  /** Similar vehicles cache - 10 minutes (recommendations are stable) */
  SIMILAR_VEHICLES: 600,
  
  /** Market analytics cache - 5 minutes (market data updates periodically) */
  MARKET_ANALYTICS: 300,
  
  /** Dealer info cache - 1 hour (dealer info rarely changes) */
  DEALER_INFO: 3600,
  
  /** VIN decode cache - 24 hours (VIN data is static) */
  VIN_DECODE: 86400,
  
  /** Rate limit window - 1 minute sliding window */
  RATE_LIMIT_WINDOW: 60,
  
  /** Empty results cache - 30 seconds (shorter for empty results) */
  EMPTY_RESULTS: 30,
} as const;

/**
 * SWR deduplication intervals (in milliseconds)
 * Controls how long SWR waits before allowing duplicate requests
 */
export const SWR_DEDUPE = {
  /** Listing detail - 5 seconds */
  LISTING: 5000,
  
  /** Search results - 10 seconds */
  SEARCH: 10000,
  
  /** Similar vehicles - 1 minute */
  SIMILAR: 60000,
  
  /** Market analytics - 1 minute */
  MARKET: 60000,
} as const;

/**
 * Cache-Control header presets for edge caching
 */
export const CACHE_CONTROL = {
  /** Search results: short cache with stale-while-revalidate */
  SEARCH: 'public, s-maxage=30, stale-while-revalidate=60',
  
  /** Similar vehicles: medium cache */
  SIMILAR: 'public, s-maxage=600, stale-while-revalidate=1200',
  
  /** Market analytics: medium cache */
  MARKET: 'public, s-maxage=300, stale-while-revalidate=600',
  
  /** Static data: long cache */
  STATIC: 'public, s-maxage=3600, stale-while-revalidate=7200',
  
  /** No cache for dynamic data */
  NO_CACHE: 'no-cache, no-store, must-revalidate',
} as const;

