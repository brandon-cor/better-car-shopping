import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache, generateCacheKey } from "@/lib/api/cache";
import { rateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { retryWithBackoff, isRetryableError } from "@/lib/api/retry";

// Request deduplication map
const pendingRequests = new Map<string, Promise<any>>();

async function fetchWithTimeout(url: string, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Normalize the API response to flatten build data and organize features
function normalizeListingData(data: any): any {
  if (!data) return data;
  
  const normalized = { ...data };
  
  // Flatten key fields from build to root level for easier component access
  if (data.build) {
    // Only set if not already present at root level
    if (!normalized.transmission && data.build.transmission) {
      normalized.transmission = data.build.transmission;
    }
    if (!normalized.drivetrain && data.build.drivetrain) {
      normalized.drivetrain = data.build.drivetrain;
    }
    if (!normalized.engine && data.build.engine) {
      normalized.engine = data.build.engine;
    }
    if (!normalized.fuel_type && data.build.fuel_type) {
      normalized.fuel_type = data.build.fuel_type;
    }
    if (!normalized.body_type && data.build.body_type) {
      normalized.body_type = data.build.body_type;
    }
    if (!normalized.year && data.build.year) {
      normalized.year = data.build.year;
    }
    if (!normalized.make && data.build.make) {
      normalized.make = data.build.make;
    }
    if (!normalized.model && data.build.model) {
      normalized.model = data.build.model;
    }
    if (!normalized.trim && data.build.trim) {
      normalized.trim = data.build.trim;
    }
  }
  
  // Organize high_value_features from extra into categorized features
  if (data.extra?.high_value_features && Array.isArray(data.extra.high_value_features)) {
    const features = data.extra.high_value_features;
    
    // Group by category
    const grouped: Record<string, string[]> = {};
    for (const feature of features) {
      const category = feature.category || 'Other';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      if (feature.description) {
        grouped[category].push(feature.description);
      }
    }
    
    // Map to our features structure
    if (!normalized.features) {
      normalized.features = {};
    }
    
    if (grouped['Safety & Driver Assist']) {
      normalized.features.safety_features = [...new Set([
        ...(normalized.features.safety_features || []),
        ...grouped['Safety & Driver Assist']
      ])];
    }
    if (grouped['Infotainment']) {
      normalized.features.tech_features = [...new Set([
        ...(normalized.features.tech_features || []),
        ...grouped['Infotainment']
      ])];
    }
    if (grouped['Comfort & Convenience']) {
      normalized.features.comfort_features = [...new Set([
        ...(normalized.features.comfort_features || []),
        ...grouped['Comfort & Convenience']
      ])];
    }
    if (grouped['Interior']) {
      normalized.features.comfort_features = [...new Set([
        ...(normalized.features.comfort_features || []),
        ...grouped['Interior']
      ])];
    }
    if (grouped['Exterior']) {
      normalized.features.options = [...new Set([
        ...(normalized.features.options || []),
        ...grouped['Exterior']
      ])];
    }
    if (grouped['Transmission']) {
      normalized.features.options = [...new Set([
        ...(normalized.features.options || []),
        ...grouped['Transmission']
      ])];
    }
    if (grouped['Vehicle Segment']) {
      normalized.features.options = [...new Set([
        ...(normalized.features.options || []),
        ...grouped['Vehicle Segment']
      ])];
    }
  }
  
  // Ensure daysonmarket is set from dom if not present
  if (!normalized.daysonmarket && normalized.dom) {
    normalized.daysonmarket = normalized.dom;
  }
  
  return normalized;
}

async function fetchListingFromAPI(id: string, apiKey: string): Promise<any> {
  const url = `https://api.marketcheck.com/v2/listing/car/${id}?api_key=${apiKey}`;
  
  return retryWithBackoff(async () => {
    const response = await fetchWithTimeout(url, 10000);
    
    if (!response.ok) {
      if (response.status === 404) {
        const error = new Error("Listing not found");
        (error as any).status = 404;
        throw error;
      }
      const errorText = await response.text();
      const error = new Error(`Failed to fetch listing: ${errorText}`);
      (error as any).status = response.status;
      throw error;
    }
    
    const data = await response.json();
    return normalizeListingData(data);
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Extract id early so it's available in catch block
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
  }

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(req);
    const rateLimitHeaders = getRateLimitHeaders(rateLimitResult);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "Rate limit exceeded", retryAfter: rateLimitResult.reset },
        { 
          status: 429,
          headers: rateLimitHeaders
        }
      );
    }

    const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
    if (!MARKETCHECK_API_KEY) {
      return NextResponse.json({ error: "MARKETCHECK_API_KEY not configured" }, { status: 500 });
    }

    // Check cache first
    const cacheKey = generateCacheKey("listing", id);
    const cached = await getCache<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...rateLimitHeaders,
          "X-Cache": "HIT",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }

    // Request deduplication
    let fetchPromise = pendingRequests.get(cacheKey);
    
    if (!fetchPromise) {
      fetchPromise = fetchListingFromAPI(id, MARKETCHECK_API_KEY)
        .then(async (data) => {
          // Cache for 5 minutes
          await setCache(cacheKey, data, 300);
          pendingRequests.delete(cacheKey);
          return data;
        })
        .catch((error) => {
          pendingRequests.delete(cacheKey);
          throw error;
        });
      
      pendingRequests.set(cacheKey, fetchPromise);
    }

    const data = await fetchPromise;
    
    return NextResponse.json(data, {
      headers: {
        ...rateLimitHeaders,
        "X-Cache": "MISS",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return NextResponse.json({ error: "Request timeout" }, { status: 504 });
      }
      
      const status = (error as any).status || 500;
      const isRetryable = isRetryableError(error);
      
      // Try to return cached data if available and error is retryable
      if (isRetryable && id) {
        const cacheKey = generateCacheKey("listing", id);
        const cached = await getCache<any>(cacheKey);
        if (cached) {
          return NextResponse.json(cached, {
            headers: {
              "X-Cache": "STALE",
              "X-Error": "Using cached data due to API error",
            },
          });
        }
      }
      
      console.error("Error fetching listing details:", error);
      return NextResponse.json(
        { 
          error: status === 404 ? "Listing not found" : "Internal server error",
          details: process.env.NODE_ENV === "development" ? error.message : undefined
        },
        { status }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

