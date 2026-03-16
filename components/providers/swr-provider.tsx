"use client";

import { SWRConfig } from "swr";
import { SWR_DEDUPE } from "@/lib/constants/cache-ttl";

/**
 * Default SWR fetcher
 * Exported for use by hooks that need to reference it
 */
export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    (error as any).status = res.status;
    (error as any).info = await res.json().catch(() => ({}));
    throw error;
  }
  return res.json();
};

/**
 * Custom retry logic
 * Retries with exponential backoff, stops on 4xx errors
 */
const onErrorRetry = (
  error: any,
  key: string,
  config: any,
  revalidate: any,
  { retryCount }: { retryCount: number }
) => {
  // Don't retry on 4xx errors (client errors)
  if (error.status >= 400 && error.status < 500) return;

  // Don't retry more than 3 times
  if (retryCount >= 3) return;

  // Exponential backoff: 1s, 2s, 4s
  const delay = Math.min(1000 * Math.pow(2, retryCount), 4000);
  setTimeout(() => revalidate({ retryCount }), delay);
};

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: SWR_DEDUPE.LISTING,
        errorRetryCount: 3,
        errorRetryInterval: 1000,
        keepPreviousData: true,
        suspense: false,
        shouldRetryOnError: true,
        onErrorRetry,
      }}
    >
      {children}
    </SWRConfig>
  );
}
