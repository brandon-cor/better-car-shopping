/**
 * Cache API Module
 * Re-exports from the new cache infrastructure for backward compatibility
 */

// Re-export all cache functions from the new unified cache module
export {
  getCache,
  getCacheWithStatus,
  setCache,
  setCacheSync,
  deleteCache,
  hasCache,
  clearMemoryCache,
  getCacheStats,
  generateCacheKey,
  generateListingKey,
  generateSearchKey,
  generateParseQueryKey,
  generateSimilarKey,
  generateMarketAnalyticsKey,
  generateRateLimitKey,
  generateDealerKey,
  generateVinKey,
  hashPreferences,
  isKVConfigured,
  LRUCache,
  memoryCache,
} from '@/lib/cache';

// Re-export cache status type
export type { CacheStatus } from '@/lib/cache';
