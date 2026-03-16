import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache, generateCacheKey } from "@/lib/api/cache";
import { rateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { retryWithBackoff } from "@/lib/api/retry";
import { CACHE_TTL, CACHE_CONTROL } from "@/lib/constants/cache-ttl";

async function fetchMarketAnalytics(listingId: string, apiKey: string): Promise<any> {
  // MarketCheck API endpoint for market analytics
  // This is a placeholder - adjust based on actual MarketCheck API endpoints
  const url = `https://api.marketcheck.com/v2/listing/car/${listingId}/market?api_key=${apiKey}`;
  
  return retryWithBackoff(async () => {
    const response = await fetch(url, { 
      signal: AbortSignal.timeout(10000) 
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null; // No market data available
      }
      throw new Error(`Failed to fetch market analytics: ${response.statusText}`);
    }
    
    return response.json();
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const rateLimitResult = await rateLimit(req);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
      );
    }

    const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
    if (!MARKETCHECK_API_KEY) {
      return NextResponse.json({ error: "MARKETCHECK_API_KEY not configured" }, { status: 500 });
    }

    // Check cache (10 minute TTL for market data)
    const cacheKey = generateCacheKey("market-analytics", id);
    const cached = await getCache<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          "X-Cache": "HIT",
          "Cache-Control": CACHE_CONTROL.MARKET,
        },
      });
    }

    const data = await fetchMarketAnalytics(id, MARKETCHECK_API_KEY);
    
    // Cache for 5 minutes
    if (data) {
      await setCache(cacheKey, data, CACHE_TTL.MARKET_ANALYTICS);
    }
    
    return NextResponse.json(data || {}, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        "X-Cache": "MISS",
        "Cache-Control": CACHE_CONTROL.MARKET,
      },
    });
  } catch (error) {
    console.error("Error fetching market analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch market analytics" },
      { status: 500 }
    );
  }
}

