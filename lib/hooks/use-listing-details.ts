import useSWR from 'swr';
import { SWR_DEDUPE } from '@/lib/constants/cache-ttl';
import type { DetailedListing } from '@/lib/schema';

interface UseListingDetailsOptions {
  /** Initial data to show immediately while fetching */
  initialData?: DetailedListing;
}

interface UseListingDetailsResult {
  listing: DetailedListing | undefined;
  isLoading: boolean;
  isError: Error | undefined;
  isStale: boolean;
  mutate: () => void;
}

/**
 * Hook to fetch listing details with SWR
 * Uses global fetcher from SWR provider
 */
export function useListingDetails(
  listingId: string | null,
  options?: UseListingDetailsOptions
): UseListingDetailsResult {
  const { data, error, isLoading, isValidating, mutate } = useSWR<DetailedListing>(
    listingId ? `/api/listing/${listingId}` : null,
    {
      dedupingInterval: SWR_DEDUPE.LISTING,
      fallbackData: options?.initialData,
      // Don't keep previous data when key changes - prevents stale data flash
      keepPreviousData: false,
    }
  );

  // Data is stale if we're revalidating and have old data
  const isStale = isValidating && !!data && !options?.initialData;

  return {
    listing: data,
    isLoading: isLoading && !options?.initialData,
    isError: error,
    isStale,
    mutate: () => mutate(),
  };
}
