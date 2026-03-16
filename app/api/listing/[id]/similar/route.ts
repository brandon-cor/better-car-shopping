import { NextRequest, NextResponse } from "next/server";
import { getCache, setCache, generateCacheKey } from "@/lib/api/cache";
import { rateLimit, getRateLimitHeaders } from "@/lib/api/rate-limit";
import { retryWithBackoff } from "@/lib/api/retry";
import { CACHE_TTL, CACHE_CONTROL } from "@/lib/constants/cache-ttl";

async function fetchSimilarVehicles(listingId: string, apiKey: string): Promise<any> {
  // First get the listing to find similar vehicles
  const listingUrl = `https://api.marketcheck.com/v2/listing/car/${listingId}?api_key=${apiKey}`;
  
  return retryWithBackoff(async () => {
    const listingRes = await fetch(listingUrl, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!listingRes.ok) {
      // If we can't find the specific listing details, try to get basic info from search
      const searchFallbackUrl = `https://api.marketcheck.com/v2/search/car/active?api_key=${apiKey}&listing_id=${listingId}`;
      const fallbackRes = await fetch(searchFallbackUrl);
      const fallbackData = await fallbackRes.json();
      const listing = fallbackData.listings?.[0];
      
      if (!listing) throw new Error("Failed to fetch listing");
      return performSearch(listing, listingId, apiKey);
    }
    
    const listing = await listingRes.json();
    return performSearch(listing, listingId, apiKey);
  });
}

async function performSearch(listing: any, listingId: string, apiKey: string) {
  // Get attributes from top level or build object
  const make = listing.make || listing.build?.make || "";
  const model = listing.model || listing.build?.model || "";
  const year = listing.year || listing.build?.year || "";

  // Search for similar vehicles based on make, model, year
  // Try with year, make, model first
  const searchParams = new URLSearchParams({
    api_key: apiKey,
    make: make,
    model: model,
    year: year.toString(),
    rows: "12",
    start: "0",
  });
  
  const searchUrl = `https://api.marketcheck.com/v2/search/car/active?${searchParams.toString()}`;
  const searchRes = await fetch(searchUrl, {
    signal: AbortSignal.timeout(10000)
  });
  
  if (!searchRes.ok) {
    throw new Error("Failed to fetch similar vehicles");
  }
  
  let searchData = await searchRes.json();
  let similar = (searchData.listings || []).filter((l: any) => l.id.toString() !== listingId.toString());

  // If we have very few results, try broader search (just make and model)
  if (similar.length < 3 && (make || model)) {
    const broaderParams = new URLSearchParams({
      api_key: apiKey,
      make: make,
      model: model,
      rows: "12",
    });
    const broaderRes = await fetch(`https://api.marketcheck.com/v2/search/car/active?${broaderParams.toString()}`);
    if (broaderRes.ok) {
      const broaderData = await broaderRes.json();
      const broaderSimilar = (broaderData.listings || []).filter((l: any) => l.id.toString() !== listingId.toString());
      // Merge and deduplicate
      const existingIds = new Set(similar.map((s: any) => s.id.toString()));
      broaderSimilar.forEach((l: any) => {
        if (!existingIds.has(l.id.toString())) {
          similar.push(l);
        }
      });
    }
  }

  // If still empty, try even broader (just make)
  if (similar.length < 3 && make) {
    const broadestParams = new URLSearchParams({
      api_key: apiKey,
      make: make,
      rows: "12",
    });
    const broadestRes = await fetch(`https://api.marketcheck.com/v2/search/car/active?${broadestParams.toString()}`);
    if (broadestRes.ok) {
      const broadestData = await broadestRes.json();
      const broadestSimilar = (broadestData.listings || []).filter((l: any) => l.id.toString() !== listingId.toString());
      const existingIds = new Set(similar.map((s: any) => s.id.toString()));
      broadestSimilar.forEach((l: any) => {
        if (!existingIds.has(l.id.toString())) {
          similar.push(l);
        }
      });
    }
  }
  
  return {
    similar: similar.slice(0, 10),
    total: similar.length,
  };
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

    // Get user preferences from query params
    const searchParams = req.nextUrl.searchParams;
    const preferencesJson = searchParams.get("preferences");
    let preferences = null;
    if (preferencesJson) {
      try {
        preferences = JSON.parse(preferencesJson);
      } catch (e) {
        console.error("Failed to parse preferences:", e);
      }
    }

    // Check cache (10 minute TTL)
    const cacheKey = generateCacheKey("similar-vehicles", id, preferencesJson || "");
    const cached = await getCache<any>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...getRateLimitHeaders(rateLimitResult),
          "X-Cache": "HIT",
          "Cache-Control": CACHE_CONTROL.SIMILAR,
        },
      });
    }

    const data = await fetchSimilarVehicles(id, MARKETCHECK_API_KEY);
    
    // AI Ranking Logic if preferences or listing data is available
    if (data.similar && data.similar.length > 0 && (preferences || data.similar.length > 3)) {
      try {
        const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
        if (OPENROUTER_API_KEY) {
          const listingUrl = `https://api.marketcheck.com/v2/listing/car/${id}?api_key=${MARKETCHECK_API_KEY}`;
          const currentListingRes = await fetch(listingUrl);
          const currentListing = await currentListingRes.json();

          const rankingPrompt = `You are an expert car recommendation engine. 
          Given a target car and a list of similar cars, rank the top 3 best recommendations for the user.
          
          Target Car: ${currentListing.year} ${currentListing.make} ${currentListing.model} - ${currentListing.price}
          User Preferences: ${JSON.stringify(preferences || "General search")}
          
          Cars to rank:
          ${data.similar.map((l: any, i: number) => `${i}: ${l.year} ${l.make} ${l.model} - ${l.price} (Miles: ${l.miles}, Features: ${l.extra?.high_value_features?.join(", ") || "N/A"})`).join("\n")}
          
          Return ONLY a JSON array of indices for the top 3 cars in order of relevance. Example: [2, 0, 5]`;

          const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.0-flash-001",
              messages: [{ role: "user", content: rankingPrompt }],
              response_format: { type: "json_object" },
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices?.[0]?.message?.content;
            const rankedIndices = JSON.parse(content);
            if (Array.isArray(rankedIndices)) {
              data.similar = rankedIndices.map(idx => data.similar[idx]).filter(Boolean);
              data.isAiRanked = true;
            }
          }
        }
      } catch (e) {
        console.error("AI Ranking failed, falling back to default:", e);
      }
    }
    
    // Ensure we only return 3 if it's for the small row, or let the frontend decide.
    // The user asked for "3 listing in row", so we'll prioritize the top 3.
    
    // Cache for 10 minutes
    await setCache(cacheKey, data, CACHE_TTL.SIMILAR_VEHICLES);
    
    return NextResponse.json(data, {
      headers: {
        ...getRateLimitHeaders(rateLimitResult),
        "X-Cache": "MISS",
        "Cache-Control": CACHE_CONTROL.SIMILAR,
      },
    });
  } catch (error) {
    console.error("Error fetching similar vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch similar vehicles" },
      { status: 500 }
    );
  }
}

