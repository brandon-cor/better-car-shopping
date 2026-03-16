/**
 * Unified Cache Interface
 * Tries distributed cache (Vercel KV) first, falls back to memory cache
 * Provides a single interface for all caching operations
 */

import { kvGet, kvSet, kvDelete, isKVConfigured } from './kv-client';
import { memoryCache } from './memory-cache';

export type CacheStatus = 'HIT' | 'MISS' | 'STALE';

interface CacheResult<T> {
  data: T | null;
  status: CacheStatus;
  source: 'kv' | 'memory' | 'none';
}

/**
 * Get a value from cache
 * Tries KV first, then memory cache
 * Also populates memory cache from KV for faster subsequent reads
 */
export async function getCache<T>(key: string): Promise<T | null> {
  // Try KV first if configured
  if (isKVConfigured()) {
    try {
      const kvValue = await kvGet<T>(key);
      if (kvValue !== null) {
        // Also update memory cache for faster subsequent reads
        // Use a short TTL since we don't know the original TTL
        memoryCache.set(key, kvValue, 60);
        return kvValue;
      }
    } catch {
      // KV failed, continue to memory cache
    }
  }

  // Try memory cache
  return memoryCache.get<T>(key);
}

/**
 * Get cache with status information
 * Useful for setting X-Cache headers
 */
export async function getCacheWithStatus<T>(key: string): Promise<CacheResult<T>> {
  // Try KV first if configured
  if (isKVConfigured()) {
    try {
      const kvValue = await kvGet<T>(key);
      if (kvValue !== null) {
        memoryCache.set(key, kvValue, 60);
        return { data: kvValue, status: 'HIT', source: 'kv' };
      }
    } catch {
      // KV failed, continue to memory cache
    }
  }

  // Try memory cache
  const memValue = memoryCache.get<T>(key);
  if (memValue !== null) {
    return { data: memValue, status: 'HIT', source: 'memory' };
  }

  return { data: null, status: 'MISS', source: 'none' };
}

/**
 * Set a value in cache
 * Writes to both KV and memory for redundancy
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  // Always write to memory cache (fast, synchronous)
  memoryCache.set(key, value, ttlSeconds);

  // Also write to KV if configured (async, non-blocking)
  if (isKVConfigured()) {
    // Don't await - let it complete in background
    kvSet(key, value, ttlSeconds).catch((err) => {
      console.warn('[Cache] KV write failed for key:', key, err);
    });
  }
}

/**
 * Set a value in cache and wait for completion
 * Use when you need to ensure the value is persisted
 */
export async function setCacheSync<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  memoryCache.set(key, value, ttlSeconds);

  if (isKVConfigured()) {
    await kvSet(key, value, ttlSeconds);
  }
}

/**
 * Delete a value from cache
 * Removes from both KV and memory
 */
export async function deleteCache(key: string): Promise<void> {
  memoryCache.delete(key);

  if (isKVConfigured()) {
    await kvDelete(key).catch((err) => {
      console.warn('[Cache] KV delete failed for key:', key, err);
    });
  }
}

/**
 * Check if a key exists in cache
 */
export async function hasCache(key: string): Promise<boolean> {
  if (memoryCache.has(key)) {
    return true;
  }

  if (isKVConfigured()) {
    const value = await kvGet(key);
    return value !== null;
  }

  return false;
}

/**
 * Clear memory cache
 * Note: This does not clear KV cache
 */
export function clearMemoryCache(): void {
  memoryCache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): { memorySize: number; kvConfigured: boolean } {
  return {
    memorySize: memoryCache.size(),
    kvConfigured: isKVConfigured(),
  };
}

// Re-export key generation utilities for convenience
export {
  generateListingKey,
  generateSearchKey,
  generateParseQueryKey,
  generateSimilarKey,
  generateMarketAnalyticsKey,
  generateRateLimitKey,
  generateDealerKey,
  generateVinKey,
  generateCacheKey,
  hashPreferences,
} from './keys';

// Re-export memory cache class for direct use if needed
export { LRUCache, memoryCache } from './memory-cache';

// Re-export KV utilities
export { isKVConfigured } from './kv-client';

