"use client";

import useSWR from 'swr';
import { SWR_DEDUPE } from '@/lib/constants/cache-ttl';
import { usePreferences, getPreferencesHash } from '@/components/providers/preferences-provider';

interface SimilarVehicle {
  id: string;
  [key: string]: unknown;
}

interface SimilarVehiclesResponse {
  similar: SimilarVehicle[];
  total: number;
  isAiRanked?: boolean;
}

/**
 * Hook to fetch similar vehicles with preferences-based caching
 * Uses reactive preferences from context instead of direct localStorage read
 */
export function useSimilarVehicles(listingId: string | null) {
  const { preferences, isLoaded } = usePreferences();
  
  // Generate preferences hash for cache key
  const preferencesHash = isLoaded ? getPreferencesHash(preferences) : null;
  
  // Build URL with preferences
  const url = listingId && isLoaded
    ? `/api/listing/${listingId}/similar${
        Object.keys(preferences).length > 0 
          ? `?preferences=${encodeURIComponent(JSON.stringify(preferences))}`
          : ''
      }`
    : null;

  const { data, error, isLoading } = useSWR<SimilarVehiclesResponse>(
    url,
    {
      dedupingInterval: SWR_DEDUPE.SIMILAR,
      // Handle 404 gracefully
      onError: (err) => {
        if (err.status === 404) {
          return { similar: [], total: 0 };
        }
      },
    }
  );

  return {
    similarVehicles: data?.similar || [],
    total: data?.total || 0,
    isAiRanked: data?.isAiRanked || false,
    isLoading: isLoading || !isLoaded,
    isError: error,
  };
}
