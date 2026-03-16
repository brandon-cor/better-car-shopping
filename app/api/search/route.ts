import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchParamsSchema, searchResponseSchema, CarListing } from "@/lib/schema";
import { z } from "zod";
import { getCache, setCache, generateSearchKey } from "@/lib/cache";
import { CACHE_TTL, CACHE_CONTROL } from "@/lib/constants/cache-ttl";
import { rateLimit, rateLimitUser } from "@/lib/api/rate-limit";
import { trackSearch } from "@/lib/supabase";

// Best Match scoring weights
const WEIGHTS = {
  price: 0.30,      // Price competitiveness within budget
  distance: 0.25,   // Proximity to user
  mileage: 0.20,    // Lower mileage preferred
  year: 0.15,       // Newer preferred
  photos: 0.10,     // Listing quality signal
};

// Score a single listing (0-100 scale, higher = better)
function scoreListing(
  listing: CarListing,
  context: { priceMax?: number; priceMin?: number; currentYear: number }
): number {
  let score = 50; // Base score
  
  // Price score: favor mid-range of budget, penalize extremes
  if (listing.price && context.priceMax) {
    const priceRatio = listing.price / context.priceMax;
    // Sweet spot: 60-80% of budget gets highest score
    if (priceRatio >= 0.5 && priceRatio <= 0.85) {
      score += WEIGHTS.price * 100;
    } else if (priceRatio < 0.5) {
      score += WEIGHTS.price * 70; // Suspiciously cheap
    } else {
      score += WEIGHTS.price * (1 - priceRatio) * 100; // Closer to max = lower score
    }
  } else if (listing.price) {
    score += WEIGHTS.price * 50; // No budget context, neutral
  }
  
  // Distance score: closer is better (exponential decay)
  if (listing.dist !== undefined) {
    const distScore = Math.max(0, 100 - listing.dist * 2); // 0 mi = 100, 50 mi = 0
    score += WEIGHTS.distance * distScore;
  } else {
    score += WEIGHTS.distance * 40; // No distance = neutral
  }
  
  // Mileage score: lower is better
  if (listing.miles !== undefined) {
    const mileScore = Math.max(0, 100 - (listing.miles / 1500)); // 0 mi = 100, 150k = 0
    score += WEIGHTS.mileage * mileScore;
  } else {
    score += WEIGHTS.mileage * 40;
  }
  
  // Year score: newer is better
  if (listing.year) {
    const age = context.currentYear - listing.year;
    const yearScore = Math.max(0, 100 - age * 8); // 0 years = 100, 12+ years = 0
    score += WEIGHTS.year * yearScore;
  } else {
    score += WEIGHTS.year * 40;
  }
  
  // Photo score: more photos = better listing quality
  const photoCount = listing.media?.photo_links?.length || 0;
  const photoScore = Math.min(100, photoCount * 10); // 10+ photos = max
  score += WEIGHTS.photos * photoScore;
  
  return score;
}

// Apply diversity with backfill to ensure we always return enough results
function applyDiversity(
  listings: CarListing[], 
  maxPerGroup: number, 
  groupBy: "make" | "model",
  targetCount: number
): CarListing[] {
  const groupCount: Record<string, number> = {};
  const result: CarListing[] = [];
  const overflow: CarListing[] = [];
  
  for (const listing of listings) {
    const key = groupBy === "make" 
      ? (listing.make || "unknown").toLowerCase()
      : `${(listing.make || "unknown").toLowerCase()}-${(listing.model || "unknown").toLowerCase()}`;
    const count = groupCount[key] || 0;
    
    if (count < maxPerGroup) {
      result.push(listing);
      groupCount[key] = count + 1;
    } else {
      overflow.push(listing); // Save for backfill
    }
  }
  
  // If diversity filtering left us short, backfill from overflow (by score order)
  if (result.length < targetCount && overflow.length > 0) {
    const needed = targetCount - result.length;
    result.push(...overflow.slice(0, needed));
  }
  
  return result.slice(0, targetCount);
}

// Best Match ranking: score, sort, diversify
function rankBestMatch(
  listings: CarListing[],
  context: { priceMax?: number; priceMin?: number; hasMakeFilter: boolean },
  targetCount: number
): CarListing[] {
  if (listings.length === 0) return listings;
  
  const currentYear = new Date().getFullYear();
  
  // Score all listings
  const scored = listings.map(l => ({
    listing: l,
    score: scoreListing(l, { ...context, currentYear }),
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);
  
  const sortedListings = scored.map(s => s.listing);
  
  // Apply diversity based on filter context:
  // - If user filtered by make, diversify by model (e.g., different Porsche models)
  // - If no make filter, diversify by make (variety of brands)
  const diversified = applyDiversity(
    sortedListings,
    context.hasMakeFilter ? 4 : 3, // Allow more per model than per make
    context.hasMakeFilter ? "model" : "make",
    targetCount
  );
  
  return diversified;
}

async function zipToLatLon(zip: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(`http://api.zippopotam.us/us/${zip}`);
    if (!response.ok) return null;
    const data = await response.json();
    if (data.places && data.places.length > 0) {
      return {
        latitude: parseFloat(data.places[0].latitude),
        longitude: parseFloat(data.places[0].longitude),
      };
    }
    return null;
  } catch {
    return null;
  }
}

async function cityToLatLon(city: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)},USA&limit=1`,
      { headers: { 'User-Agent': 'Vehique-App' } }
    );
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Server-side Rate Limit
    if (!userId) {
      // Anonymous users: 3 requests per 30 days (trial limit)
      const limitResult = await rateLimit(req, 3, 30 * 24 * 60 * 60);
      if (!limitResult.success) {
        return NextResponse.json(
          { error: "Free search limit reached", code: "LIMIT_REACHED" },
          { status: 429 }
        );
      }
    } else {
      // Logged-in users: 10 searches per day
      // Note: Usage increment is handled by rateLimitUser
      const limitResult = await rateLimitUser(userId, "SEARCH");
      if (!limitResult.success) {
        return NextResponse.json(
          { 
            error: "Daily search limit reached", 
            code: "USER_LIMIT_REACHED",
            feature: "SEARCH",
            limit: limitResult.limit,
            reset: limitResult.reset,
          },
          { status: 429 }
        );
      }
    }

    const url = new URL(req.url);
    
    // Build params object from URL search params
    // Schema uses z.coerce to handle string-to-number conversion automatically
    const rawParams: Record<string, string | undefined> = {};
    for (const key of ['make', 'model', 'year', 'year_min', 'year_max', 'price_min', 'price_max', 
                       'exterior_color', 'zip', 'latitude', 'longitude', 'radius', 'rows', 'start', 
                       'sort_by', 'sort_order']) {
      const value = url.searchParams.get(key);
      if (value !== null && value !== '') {
        rawParams[key] = value;
      }
    }
    
    const params = searchParamsSchema.parse(rawParams);

    // Track search activity in Supabase (non-blocking)
    if (userId) {
      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                        req.headers.get("x-real-ip") || undefined;
      const userAgent = req.headers.get("user-agent") || undefined;
      trackSearch(userId, rawParams, { ipAddress, userAgent });
    }

    // Additional filter params (not in schema but passed to MarketCheck)
    const miles_min = url.searchParams.get("miles_min") ? parseInt(url.searchParams.get("miles_min")!) : undefined;
    const miles_max = url.searchParams.get("miles_max") ? parseInt(url.searchParams.get("miles_max")!) : undefined;
    const body_type = url.searchParams.get("body_type") || undefined;
    const fuel_type = url.searchParams.get("fuel_type") || undefined;
    const transmission = url.searchParams.get("transmission") || undefined;
    const drivetrain = url.searchParams.get("drivetrain") || undefined;
    const car_type = url.searchParams.get("car_type") || undefined;
    const city = url.searchParams.get("city") || undefined;

    const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
    if (!MARKETCHECK_API_KEY) {
      return NextResponse.json({ error: "MARKETCHECK_API_KEY not configured" }, { status: 500 });
    }

    let latitude = params.latitude;
    let longitude = params.longitude;

    // Try zip first, then city for location
    if (!latitude && !longitude) {
      if (params.zip) {
        const coords = await zipToLatLon(params.zip);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      } else if (city) {
        const coords = await cityToLatLon(city);
        if (coords) {
          latitude = coords.latitude;
          longitude = coords.longitude;
        }
      }
    }

    // Check if we have at least one search parameter (after location resolution)
    const hasSearchParams = !!(
      params.make || 
      params.model || 
      params.year || 
      params.year_min || 
      params.year_max ||
      params.price_min ||
      params.price_max ||
      params.zip ||
      latitude ||
      longitude ||
      body_type ||
      fuel_type ||
      transmission ||
      drivetrain ||
      car_type ||
      city ||
      miles_min ||
      miles_max
    );

    // If no search parameters, return empty results
    // This prevents calling MarketCheck API with no filters
    if (!hasSearchParams) {
      return NextResponse.json({
        num_found: 0,
        listings: [],
      });
    }

    // Best Match mode: no sort_by specified, only apply on initial load (start = 0)
    // For "load more" requests (start > 0), skip diversity to ensure we get full page of results
    const isBestMatch = !params.sort_by && params.start === 0;
    
    // For Best Match initial load, fetch extra rows to have a pool for ranking/diversity
    const fetchRows = isBestMatch ? Math.min(params.rows * 3, 60) : params.rows;
    
    // Generate cache key and check cache
    const cacheParams = {
      ...params,
      latitude,
      longitude,
      miles_min,
      miles_max,
      body_type,
      fuel_type,
      transmission,
      drivetrain,
      car_type,
      city,
    };
    const cacheKey = generateSearchKey(cacheParams);
    const cached = await getCache<{ num_found: number; listings: CarListing[] }>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": CACHE_CONTROL.SEARCH,
        },
      });
    }
    
    const queryParams = new URLSearchParams({
      api_key: MARKETCHECK_API_KEY,
      rows: fetchRows.toString(),
      start: params.start.toString(),
    });

    if (params.make) queryParams.append("make", params.make);
    if (params.model) queryParams.append("model", params.model);
    if (params.year) {
      queryParams.append("year", params.year.toString());
    } else if (params.year_min || params.year_max) {
      const minYear = params.year_min || 1900;
      const maxYear = params.year_max || new Date().getFullYear() + 1;
      queryParams.append("year_range", `${minYear}-${maxYear}`);
    }
    if (params.price_min || params.price_max) {
      const minPrice = params.price_min || 0;
      const maxPrice = params.price_max || 999999999;
      queryParams.append("price_range", `${minPrice}-${maxPrice}`);
    }
    if (params.exterior_color) queryParams.append("exterior_color", params.exterior_color);
    if (latitude) queryParams.append("latitude", latitude.toString());
    if (longitude) queryParams.append("longitude", longitude.toString());
    if (latitude || longitude) {
      // Use provided radius or default to 25 miles
      const radius = params.radius || 25;
      queryParams.append("radius", radius.toString());
    }
    if (params.sort_by) {
      queryParams.append("sort_by", params.sort_by);
      queryParams.append("sort_order", params.sort_order || "desc");
    }
    
    // Additional MarketCheck filters
    if (miles_min || miles_max) {
      const minMiles = miles_min || 0;
      const maxMiles = miles_max || 999999;
      queryParams.append("miles_range", `${minMiles}-${maxMiles}`);
    }
    if (body_type) queryParams.append("body_type", body_type);
    if (fuel_type) queryParams.append("fuel_type", fuel_type);
    if (transmission) queryParams.append("transmission", transmission);
    if (drivetrain) queryParams.append("drivetrain", drivetrain);
    if (car_type) queryParams.append("car_type", car_type.toLowerCase());

    const apiUrl = `https://api.marketcheck.com/v2/search/car/active?${queryParams.toString()}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: "Failed to fetch listings", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const validated = searchResponseSchema.parse(data);
    
    // Apply Best Match ranking if no explicit sort requested
    if (isBestMatch && validated.listings.length > 0) {
      const ranked = rankBestMatch(
        validated.listings,
        { 
          priceMax: params.price_max, 
          priceMin: params.price_min,
          hasMakeFilter: !!params.make 
        },
        params.rows
      );
      const result = {
        num_found: validated.num_found,
        listings: ranked,
      };
      
      // Cache results
      const ttl = result.listings.length === 0 ? CACHE_TTL.EMPTY_RESULTS : CACHE_TTL.SEARCH_RESULTS;
      await setCache(cacheKey, result, ttl);
      
      return NextResponse.json(result, {
        headers: {
          "X-Cache": "MISS",
          "Cache-Control": CACHE_CONTROL.SEARCH,
        },
      });
    }
    
    // Cache and return
    const ttl = validated.listings.length === 0 ? CACHE_TTL.EMPTY_RESULTS : CACHE_TTL.SEARCH_RESULTS;
    await setCache(cacheKey, validated, ttl);
    
    return NextResponse.json(validated, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": CACHE_CONTROL.SEARCH,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("Search API validation error:", error.issues);
      return NextResponse.json({ 
        error: "Invalid parameters", 
        details: error.issues,
        message: error.message 
      }, { status: 400 });
    }
    console.error("Search API error:", error);
    return NextResponse.json({ 
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
