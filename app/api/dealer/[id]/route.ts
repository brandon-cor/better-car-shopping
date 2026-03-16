import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache, generateCacheKey } from "@/lib/api/cache";
import { rateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { retryWithBackoff } from "@/lib/api/retry";

async function fetchDealerInfo(dealerId: string, apiKey: string): Promise<any> {
  // MarketCheck API endpoint for dealer information
  // Adjust URL based on actual MarketCheck API structure
  const url = `https://api.marketcheck.com/v2/dealer/${dealerId}?api_key=${apiKey}`;
  
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch dealer info: ${response.statusText}`);
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
      return NextResponse.json({ error: "Dealer ID is required" }, { status: 400 });
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

    // Check cache (15 minute TTL for dealer info)
    const cacheKey = generateCacheKey("dealer", id);
    const cached = await getCache<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          "X-Cache": "HIT",
        },
      });
    }

    const data = await fetchDealerInfo(id, MARKETCHECK_API_KEY);
    
    if (data) {
      // Cache for 15 minutes
      await setCache(cacheKey, data, 900);
    }
    
    return NextResponse.json(data || {}, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error fetching dealer info:", error);
    return NextResponse.json(
      { error: "Failed to fetch dealer information" },
      { status: 500 }
    );
  }
}

