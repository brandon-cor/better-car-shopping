import { NextRequest, NextResponse } from "next/server";
import { searchParamsSchema } from "@/lib/schema";
import { getCache, setCache, generateParseQueryKey } from "@/lib/cache";
import { CACHE_TTL } from "@/lib/constants/cache-ttl";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query text is required" }, { status: 400 });
    }

    // Normalize and check cache
    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = generateParseQueryKey(normalizedQuery);
    const cached = await getCache<{ original_query: string; parsed_params: Record<string, unknown> }>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "X-Cache": "HIT" },
      });
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "x-ai/grok-4.1-fast";
    const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const systemPrompt = `You are a car search query parser. Extract search parameters from natural language queries about car listings.

CRITICAL: You MUST respond with ONLY valid JSON. No explanations, no markdown, no code blocks, just raw JSON.

Output a JSON object with these optional fields:
- make: string - COMMA-SEPARATED if multiple (e.g., "Toyota" or "Toyota,Honda,BMW")
- model: string (e.g., "Camry", "Civic", "3 Series")
- year_min: number (minimum year)
- year_max: number (maximum year)
- price_min: number (minimum price in dollars)
- price_max: number (maximum price in dollars)
- miles_min: number (minimum mileage)
- miles_max: number (maximum mileage)
- exterior_color: string - COMMA-SEPARATED if multiple (e.g., "red" or "black,white,silver")
- body_type: string - COMMA-SEPARATED if multiple (e.g., "SUV" or "SUV,Truck")
  Valid values: Sedan, SUV, Truck, Coupe, Convertible, Hatchback, Wagon, Van, Minivan
- fuel_type: string - COMMA-SEPARATED if multiple (e.g., "Electric" or "Electric,Hybrid")
  Valid values: Gasoline, Diesel, Electric, Hybrid, Plug-in Hybrid, Flex Fuel
- transmission: string (one of: "Automatic", "Manual", "CVT")
- drivetrain: string - COMMA-SEPARATED if multiple (e.g., "AWD" or "AWD,4WD")
  Valid values: FWD, RWD, AWD, 4WD
- car_type: string - COMMA-SEPARATED if multiple (e.g., "Used" or "Used,Certified")
  Valid values: New, Used, Certified
- zip: string (5-digit US ZIP code - can be derived from city/location names)
- radius: number (search radius in miles)
- city: string (city name if mentioned, used for location context)

Rules:
- Only include fields that are explicitly mentioned or clearly implied
- For multi-select fields, use comma-separated values when user mentions multiple options
- Normalize color names to common values (red, blue, black, white, silver, gray, etc.)
- Convert price descriptions like "under 30k" to price_max: 30000
- Convert "2020 or newer" to year_min: 2020
- If a single year is mentioned, set both year_min and year_max to that year
- Convert "low mileage" to miles_max: 50000, "under 100k miles" to miles_max: 100000
- Recognize "EV", "electric car" as fuel_type: "Electric"
- Recognize "hybrid" as fuel_type: "Hybrid"
- Recognize "4x4", "all wheel drive" as drivetrain: "AWD"
- Recognize "crossover" as body_type: "SUV"
- Recognize "pickup" as body_type: "Truck"
- Recognize "sports car" as body_type: "Coupe"
- Extract ZIP codes from phrases like "near 90210", "in 10001", "around 94102"
- For city names, use these approximate ZIP codes: Los Angeles=90001, New York=10001, Chicago=60601, Houston=77001, Phoenix=85001, Philadelphia=19101, San Antonio=78201, San Diego=92101, Dallas=75201, San Jose=95101, Austin=78701, Jacksonville=32099, San Francisco=94102, Seattle=98101, Denver=80201, Boston=02101, Nashville=37201, Miami=33101, Atlanta=30301, Portland=97201, Las Vegas=89101, Detroit=48201, Charlotte=28201
- Extract radius from phrases like "within 50 miles", "50 mile radius", default to 25 if location mentioned without radius
- If ZIP or city is specified, always include radius (default 25)

Examples of multi-select:
- "Toyota or Honda SUV" → make: "Toyota,Honda", body_type: "SUV"
- "black or white Tesla" → make: "Tesla", exterior_color: "black,white"
- "electric or hybrid sedan" → fuel_type: "Electric,Hybrid", body_type: "Sedan"
- "AWD or 4WD truck" → drivetrain: "AWD,4WD", body_type: "Truck"

RESPOND WITH ONLY THE JSON OBJECT, NOTHING ELSE.`;

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: "Failed to parse query", details: errorText }, { status: response.status });
    }

    const data = await response.json();
    const rawParams = JSON.parse(data.choices[0].message.content);
    
    // Validate base params with schema, but keep additional filter params
    const baseParams = searchParamsSchema.partial().safeParse(rawParams);
    const validatedBase = baseParams.success ? baseParams.data : {};
    
    // Include additional filter params that aren't in the base schema
    const additionalParams: Record<string, any> = {};
    const additionalKeys = ['body_type', 'fuel_type', 'transmission', 'drivetrain', 'car_type', 'miles_min', 'miles_max', 'zip', 'radius', 'city'];
    for (const key of additionalKeys) {
      if (rawParams[key] !== undefined) {
        additionalParams[key] = rawParams[key];
      }
    }

    const result = {
      original_query: query,
      parsed_params: { ...validatedBase, ...additionalParams },
    };
    
    // Cache the parsed result
    await setCache(cacheKey, result, CACHE_TTL.PARSE_QUERY);
    
    return NextResponse.json(result, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
