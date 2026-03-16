"use client";

import { useCallback, useRef } from 'react';
import { preload } from 'swr';
import { fetcher } from '@/components/providers/swr-provider';

/**
 * Prefetch hook for warming SWR cache
 * Provides debounced prefetch to prevent excessive requests
 */
export function usePrefetch() {
  const prefetchedUrls = useRef<Set<string>>(new Set());
  const pendingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const isPrefetchingRef = useRef(false);

  /**
   * Prefetch a URL with debouncing
   * @param url - The URL to prefetch
   * @param delay - Debounce delay in ms (default: 150ms)
   */
  const prefetch = useCallback((url: string, delay: number = 150) => {
    // Skip if already prefetched
    if (prefetchedUrls.current.has(url)) {
      return;
    }

    // Clear existing timeout for this URL
    const existingTimeout = pendingTimeouts.current.get(url);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Schedule prefetch
    const timeoutId = setTimeout(() => {
      if (prefetchedUrls.current.has(url)) {
        pendingTimeouts.current.delete(url);
        return;
      }

      isPrefetchingRef.current = true;
      prefetchedUrls.current.add(url);
      pendingTimeouts.current.delete(url);

      // Use SWR preload to warm the cache
      preload(url, fetcher).finally(() => {
        isPrefetchingRef.current = false;
      });
    }, delay);

    pendingTimeouts.current.set(url, timeoutId);
  }, []);

  /**
   * Cancel a pending prefetch
   */
  const cancelPrefetch = useCallback((url: string) => {
    const timeout = pendingTimeouts.current.get(url);
    if (timeout) {
      clearTimeout(timeout);
      pendingTimeouts.current.delete(url);
    }
  }, []);

  /**
   * Cancel all pending prefetches
   */
  const cancelAllPrefetches = useCallback(() => {
    pendingTimeouts.current.forEach((timeout) => {
      clearTimeout(timeout);
    });
    pendingTimeouts.current.clear();
  }, []);

  /**
   * Check if a URL has been prefetched
   */
  const hasPrefetched = useCallback((url: string) => {
    return prefetchedUrls.current.has(url);
  }, []);

  /**
   * Clear the prefetch cache (allows re-prefetching)
   */
  const clearPrefetchCache = useCallback(() => {
    cancelAllPrefetches();
    prefetchedUrls.current.clear();
  }, [cancelAllPrefetches]);

  return {
    prefetch,
    cancelPrefetch,
    cancelAllPrefetches,
    hasPrefetched,
    clearPrefetchCache,
    isPrefetching: isPrefetchingRef.current,
  };
}

/**
 * Prefetch multiple URLs in parallel
 */
export function prefetchUrls(urls: string[]): void {
  urls.forEach(url => {
    preload(url, fetcher);
  });
}

