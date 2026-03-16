import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache, generateCacheKey } from "@/lib/api/cache";
import { rateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { retryWithBackoff } from "@/lib/api/retry";

async function decodeVIN(vin: string, apiKey: string): Promise<any> {
  // MarketCheck VIN decoder API
  const url = `https://api.marketcheck.com/v2/decode/${vin}?api_key=${apiKey}`;
  
  return retryWithBackoff(async () => {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to decode VIN: ${response.statusText}`);
    }
    
    return response.json();
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vin: string }> }
) {
  try {
    const { vin } = await params;
    
    if (!vin || vin.length !== 17) {
      return NextResponse.json({ error: "Valid VIN is required (17 characters)" }, { status: 400 });
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

    // Check cache (24 hour TTL for VIN decode - VINs don't change)
    const cacheKey = generateCacheKey("vin-decode", vin);
    const cached = await getCache<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          "X-Cache": "HIT",
        },
      });
    }

    const data = await decodeVIN(vin, MARKETCHECK_API_KEY);
    
    if (data) {
      // Cache for 24 hours
      await setCache(cacheKey, data, 86400);
    }
    
    return NextResponse.json(data || {}, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        "X-Cache": "MISS",
      },
    });
  } catch (error) {
    console.error("Error decoding VIN:", error);
    return NextResponse.json(
      { error: "Failed to decode VIN" },
      { status: 500 }
    );
  }
}

