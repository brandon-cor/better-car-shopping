import useSWR from 'swr';
import { SWR_DEDUPE } from '@/lib/constants/cache-ttl';

interface MarketAnalytics {
  [key: string]: unknown;
}

/**
 * Hook to fetch market analytics for a listing
 * Uses global fetcher from SWR provider
 */
export function useMarketAnalytics(listingId: string | null) {
  const { data, error, isLoading } = useSWR<MarketAnalytics | null>(
    listingId ? `/api/listing/${listingId}/market-analytics` : null,
    {
      dedupingInterval: SWR_DEDUPE.MARKET,
      // Handle 404 gracefully - no market data available
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry on 404
        if (error.status === 404) return;
        // Default retry for other errors
        if (retryCount >= 2) return;
        setTimeout(() => revalidate({ retryCount }), 2000);
      },
    }
  );

  return {
    analytics: data,
    isLoading,
    isError: error,
  };
}
