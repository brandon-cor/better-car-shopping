import { NextRequest, NextResponse } from "next/server";

type StreamEvent =
  | { type: "step"; data: { id: string; label: string; status: "pending" | "active" | "complete" | "error"; description?: string } }
  | { type: "thought"; data: { delta: string } }
  | { type: "sources"; data: { sources: Array<{ title: string; url: string; type: string }> } }
  | { type: "result"; data: { comparison: any } }
  | { type: "error"; data: { message: string } }
  | { type: "done"; data?: any };

interface ListingInput {
  id: string;
  title?: string;
  vdpUrl?: string;
}

interface MarketCheckListing {
  id: string;
  heading?: string;
  price?: number;
  miles?: number;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  body_type?: string;
  fuel_type?: string;
  transmission?: string;
  drivetrain?: string;
  exterior_color?: string;
  interior_color?: string;
  engine?: string;
  dealer?: {
    name?: string;
    city?: string;
    state?: string;
    phone?: string;
  };
  vdp_url?: string;
  media?: {
    photo_links?: string[];
  };
  build?: {
    cylinders?: number;
    horsepower?: number;
    torque?: number;
    mpg_city?: number;
    mpg_highway?: number;
  };
  [key: string]: any;
}

async function fetchWithTimeout(url: string, options: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 10000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchMarketCheckListing(listingId: string, apiKey: string): Promise<MarketCheckListing | null> {
  try {
    const url = `https://api.marketcheck.com/v2/listing/car/${listingId}?api_key=${apiKey}`;
    const res = await fetchWithTimeout(url, { timeoutMs: 8000 });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchVdpHtml(vdpUrl: string): Promise<{ html: string; status: "success" | "blocked" | "error" }> {
  try {
    const res = await fetchWithTimeout(vdpUrl, {
      timeoutMs: 6000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VehiqueBot/1.0)",
        Accept: "text/html",
      },
    });
    if (!res.ok) {
      return { html: "", status: res.status === 403 ? "blocked" : "error" };
    }
    const text = await res.text();
    // Limit to first 50KB to avoid huge pages
    const truncated = text.slice(0, 50000);
    return { html: truncated, status: "success" };
  } catch {
    return { html: "", status: "error" };
  }
}

async function createExaResearchTask(vehicle: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://api.exa.ai/research/v1", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        instructions: `Research the ${vehicle}. Focus on authentic owner feedback from Reddit threads, expert pros/cons from YouTube, and industry reliability reports. Identify specific technical issues or standout features mentioned by the community.`,
        model: "exa-research-fast",
        outputSchema: {
          type: "object",
          properties: {
            communityIntelligence: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source: { type: "string", enum: ["reddit", "youtube", "jdpower", "kbb", "edmunds", "web"] },
                  title: { type: "string", description: "Short catchy title of the finding" },
                  snippet: { type: "string", description: "The actual high-impact excerpt from the research data" },
                  url: { type: "string", description: "The source URL" },
                  importantParts: { type: "array", items: { type: "string" }, description: "1-2 exact phrases from the snippet to highlight" }
                },
                required: ["source", "title", "snippet", "url", "importantParts"]
              },
              minItems: 2,
              maxItems: 5
            },
            keyStrengths: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
            keyWeaknesses: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 3 },
            reliabilityScore: { type: "number", minimum: 0, maximum: 100 }
          },
          required: ["communityIntelligence", "keyStrengths", "keyWeaknesses", "reliabilityScore"]
        }
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) {
      const err = await res.text();
      console.error("Exa task creation error:", err);
      return null;
    }
    const data = await res.json();
    return data.researchId;
  } catch (err) {
    console.error("Exa task creation exception:", err);
    return null;
  }
}

async function pollExaResearchTask(researchId: string, apiKey: string): Promise<any | null> {
  const maxAttempts = 40;
  const interval = 2000; // 2 seconds
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`https://api.exa.ai/research/v1/${researchId}`, {
        headers: { "x-api-key": apiKey },
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data.status === "completed") return data;
      if (data.status === "failed") return null;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listings, stream } = body ?? {};

    if (!listings || !Array.isArray(listings) || listings.length < 2 || listings.length > 4) {
      return NextResponse.json({ error: "2-4 listings required" }, { status: 400 });
    }

    const MARKETCHECK_API_KEY = process.env.MARKETCHECK_API_KEY;
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "x-ai/grok-4.1-fast";
    const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

    if (!MARKETCHECK_API_KEY) {
      return NextResponse.json({ error: "MARKETCHECK_API_KEY not configured" }, { status: 500 });
    }
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "OPENROUTER_API_KEY not configured" }, { status: 500 });
    }

    const encoder = new TextEncoder();
    const send = (controller: ReadableStreamDefaultController, event: StreamEvent) => {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
    };

    const streamBody = new ReadableStream({
      start: async (controller) => {
        const collectedSources: Array<{ title: string; url: string; type: string }> = [];
        const marketCheckData: Array<{ listing: ListingInput; data: MarketCheckListing | null; vdpHtml: string; vdpStatus: string }> = [];

        try {
          // Step 1: Fetch MarketCheck details for each listing
          send(controller, {
            type: "step",
            data: { id: "fetch-marketcheck", label: "Fetching vehicle details from MarketCheck", status: "active" },
          });

          const fetchPromises = (listings as ListingInput[]).map(async (listing) => {
            const data = await fetchMarketCheckListing(listing.id, MARKETCHECK_API_KEY);
            if (data) {
              collectedSources.push({
                title: `${data.make || ""} ${data.model || ""} Details`.trim() || listing.title || "Vehicle",
                url: `https://api.marketcheck.com/v2/listing/car/${listing.id}`,
                type: "marketcheck",
              });
            }
            return { listing, data, vdpHtml: "", vdpStatus: "pending" };
          });

          const results = await Promise.all(fetchPromises);
          marketCheckData.push(...results);

          send(controller, {
            type: "step",
            data: {
              id: "fetch-marketcheck",
              label: "Fetching vehicle details from MarketCheck",
              status: "complete",
              description: `Retrieved ${marketCheckData.filter((m) => m.data).length}/${listings.length} listings`,
            },
          });

          // Step 2: Fetch VDP HTML (best effort)
          send(controller, {
            type: "step",
            data: { id: "fetch-vdp", label: "Checking original dealer listings", status: "active" },
          });

          const vdpPromises = marketCheckData.map(async (item) => {
            const vdpUrl = item.data?.vdp_url || item.listing.vdpUrl;
            if (vdpUrl) {
              const { html, status } = await fetchVdpHtml(vdpUrl);
              item.vdpHtml = html;
              item.vdpStatus = status;
              if (status === "success") {
                collectedSources.push({
                  title: `${item.data?.make || ""} ${item.data?.model || ""} Dealer Page`.trim() || "Dealer Listing",
                  url: vdpUrl,
                  type: "dealer",
                });
              }
            } else {
              item.vdpStatus = "no_url";
            }
          });

          await Promise.all(vdpPromises);

          const successfulVdps = marketCheckData.filter((m) => m.vdpStatus === "success").length;
          send(controller, {
            type: "step",
            data: {
              id: "fetch-vdp",
              label: "Checking original dealer listings",
              status: "complete",
              description: successfulVdps > 0 ? `Accessed ${successfulVdps} dealer page(s)` : "Dealer pages not accessible",
            },
          });

          // Step 3: Web Research (if Exa API key available)
          const EXA_API_KEY = process.env.EXA_API_KEY;
          if (EXA_API_KEY) {
            send(controller, {
              type: "step",
              data: { 
                id: "web-research", 
                label: "Agentic Deep Research (Exa AI)", 
                status: "active",
                description: "Deploying AI research agents to browse Reddit, YouTube, and expert forums..."
              },
            });

            const exaResearchPromises = marketCheckData.map(async (item) => {
              const d = item.data;
              if (!d || !d.make || !d.model || !d.year) return;
              
              const vehicle = `${d.year} ${d.make} ${d.model}`;
              const researchId = await createExaResearchTask(vehicle, EXA_API_KEY);
              
              if (researchId) {
                const researchResult = await pollExaResearchTask(researchId, EXA_API_KEY);
                if (researchResult && researchResult.output) {
                  // Add citations to collected sources
                  if (researchResult.citations) {
                    researchResult.citations.forEach((cit: any) => {
                      if (cit.url && !collectedSources.find(s => s.url === cit.url)) {
                        collectedSources.push({
                          title: cit.title || "Research Source",
                          url: cit.url,
                          type: "web",
                        });
                      }
                    });
                  }
                  
                  // Store structured intelligence for LLM context
                  (item as any).exaIntelligence = researchResult.output;
                }
              }
            });

            await Promise.all(exaResearchPromises);

            send(controller, {
              type: "step",
              data: {
                id: "web-research",
                label: "Agentic Deep Research (Exa AI)",
                status: "complete",
                description: `Synthesized community intelligence for all vehicles.`,
              },
            });
          }

          // Send sources so far
          if (collectedSources.length > 0) {
            send(controller, { type: "sources", data: { sources: collectedSources } });
          }

          // Step 4: LLM Analysis
          send(controller, {
            type: "step",
            data: { id: "llm-analysis", label: "AI analyzing and comparing vehicles", status: "active" },
          });

          // Build context for LLM
          const vehicleContexts = marketCheckData.map((item, idx) => {
            const d = item.data;
            if (!d) {
              return `Vehicle ${idx + 1} (${item.listing.title || item.listing.id}): No data retrieved from MarketCheck.`;
            }
            let ctx = `
Vehicle ${idx + 1}: ${d.heading || `${d.year} ${d.make} ${d.model}`}
- ID: ${d.id}
- Price: ${d.price ? `$${d.price.toLocaleString()}` : "Not listed"}
- Mileage: ${d.miles ? `${d.miles.toLocaleString()} miles` : "Not listed"}
- Year: ${d.year || "Unknown"}
- Make: ${d.make || "Unknown"}
- Model: ${d.model || "Unknown"}
- Trim: ${d.trim || "Not specified"}
- Body Type: ${d.body_type || "Unknown"}
- Fuel Type: ${d.fuel_type || "Unknown"}
- Transmission: ${d.transmission || "Unknown"}
- Drivetrain: ${d.drivetrain || "Unknown"}
- Exterior Color: ${d.exterior_color || "Unknown"}
- Interior Color: ${d.interior_color || "Unknown"}
- Engine: ${d.engine || "Not specified"}
- Dealer: ${d.dealer?.name || "Unknown"} (${d.dealer?.city || ""}, ${d.dealer?.state || ""})
- VDP URL: ${d.vdp_url || "Not available"}`;

            if (d.build) {
              ctx += `
- Horsepower: ${d.build.horsepower || "N/A"}
- Torque: ${d.build.torque || "N/A"} lb-ft
- MPG City/Highway: ${d.build.mpg_city || "N/A"}/${d.build.mpg_highway || "N/A"}`;
            }

            if (item.vdpStatus === "success" && item.vdpHtml) {
              // Extract text content hints from HTML (simplified)
              const textSnippet = item.vdpHtml
                .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
                .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
                .replace(/<[^>]+>/g, " ")
                .replace(/\s+/g, " ")
                .trim()
                .slice(0, 3000);
              ctx += `
- Dealer Page Content Excerpt: "${textSnippet}"`;
            } else if (item.vdpStatus === "blocked") {
              ctx += `
- Dealer Page: Blocked (403)`;
            } else if (item.vdpStatus === "error") {
              ctx += `
- Dealer Page: Failed to fetch`;
            }

            if ((item as any).webResearch) {
              ctx += `
- Web Research (Reliability & Reviews): ${(item as any).webResearch}`;
            }

            return ctx;
          });

          const systemPrompt = `You are an expert automotive analyst for Vehique, an AI car buying assistant. You will analyze and compare vehicles based on the provided data.

CRITICAL: Your final output MUST be valid JSON matching this exact schema. Think through your analysis step by step, then output the JSON.

Output Schema:
{
  "vehicles": [
    {
      "id": "string",
      "title": "string",
      "price": number | null,
      "miles": number | null,
      "year": number | null,
      "make": "string | null",
      "model": "string | null",
      "bodyType": "string | null",
      "fuelType": "string | null",
      "transmission": "string | null",
      "drivetrain": "string | null",
      "exteriorColor": "string | null",
      "interiorColor": "string | null",
      "engine": "string | null",
      "horsepower": number | null,
      "torque": number | null,
      "mpgCity": number | null,
      "mpgHighway": number | null,
      "dealer": "string | null",
      "location": "string | null",
      "vdpUrl": "string | null",
      "keyStrengths": ["string array of 2-4 key positive points"],
      "keyWeaknesses": ["string array of 1-3 concerns or tradeoffs"],
      "researchSnippets": [
        {
          "source": "reddit | youtube | jdpower | kbb | edmunds | web",
          "title": "string: short catchy title of the finding",
          "snippet": "string: the actual high-impact excerpt from the research data",
          "url": "string: the source URL",
          "importantParts": ["string array: 1-2 exact phrases from the snippet to highlight"]
        }
      ],
      "scores": {
        "reliability": "number (0-100)",
        "value": "number (0-100)",
        "satisfaction": "number (0-100)",
        "roadTest": "number (0-100)"
      }
    }
  ],
  "comparison": {
    "keyDifferences": ["string array of 3-5 key differences between the vehicles"],
    "valueAnalysis": "string: which offers better value for money and why",
    "reliabilityNotes": "string: any reliability considerations based on make/model/year"
  },
  "recommendation": {
    "bestPick": "string: the vehicle title that is recommended",
    "rationale": "string: 2-3 sentences explaining why",
    "confidence": "high" | "medium" | "low",
    "matchScore": "number: 0-100 composite score based on: Value (25%), Condition (25%), Reliability (20%), Features (15%), Data Quality (15%)",
    "scoreBreakdown": {
      "value": "number: 0-100 score for price vs market value",
      "condition": "number: 0-100 score for mileage relative to age",
      "reliability": "number: 0-100 score for brand/model reputation",
      "features": "number: 0-100 score for trim/drivetrain/fuel desirability",
      "dataQuality": "number: 0-100 score for information completeness"
    }
  },
  "verificationNotes": ["string array: what was confirmed vs uncertain from the data"]
}

Guidelines:
- Be objective and data-driven
- Extract all technical specifications provided in the input data (Horsepower, Torque, MPG, Engine, Colors).
- If specific numbers like HP or Torque are in the dealer page text but not in MarketCheck, extract them.
- CRITICAL: From the Web Research excerpts, extract 2-4 high-impact snippets for each vehicle that reflect community sentiment (Reddit), expert reviews (YouTube/Edmunds), or industry metrics (J.D. Power/KBB).
- DO NOT SKIP this section. If there is owner feedback or common issues mentioned in the context, extract them into the researchSnippets array.
- For each snippet, identify "importantParts" which are the exact technical or emotional high-water marks in the text to highlight.
- Consider price, mileage, condition, features, and reliability
- Note any missing or unverified information
- If dealer page content was accessed, use it to verify or supplement the listing data
- Confidence should be "high" if all key data is present, "medium" if some data missing, "low" if critical data missing

Match Score Calculation (0-100):
- Value (25%): Price vs. typical market value for this make/model/year/miles
- Condition (25%): Mileage relative to age (lower miles = higher score)
- Reliability (20%): Brand/model reputation and any known issues from web research
- Features (15%): Trim level, drivetrain, fuel type desirability
- Data Quality (15%): Completeness of listing information`;

          const userPrompt = `Compare these ${marketCheckData.length} vehicles and provide your analysis:

${vehicleContexts.join("\n\n")}

Think through your analysis carefully, considering value, condition, reliability, and buyer fit. Then output your comparison as JSON.`;

          // Stream from OpenRouter
          const openRouterRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://vehique.com",
              "X-Title": "Vehique Research Compare",
            },
            body: JSON.stringify({
              model: OPENROUTER_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
              ],
              temperature: 0.3,
              stream: true,
            }),
          });

          if (!openRouterRes.ok) {
            const errText = await openRouterRes.text();
            send(controller, { type: "error", data: { message: `AI Error: ${errText}` } });
            controller.close();
            return;
          }

          const reader = openRouterRes.body?.getReader();
          if (!reader) throw new Error("No reader");

          let fullContent = "";
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            let lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const cleaned = line.trim();
              if (!cleaned || !cleaned.startsWith("data: ")) continue;
              const data = cleaned.slice(6);
              if (data === "[DONE]") break;

              try {
                const json = JSON.parse(data);
                const delta = json.choices?.[0]?.delta;
                if (!delta) continue;

                // Stream reasoning/thinking if available
                const thought = delta.reasoning || delta.thought || delta.reasoning_content;
                if (thought) {
                  send(controller, { type: "thought", data: { delta: thought } });
                }

                // Collect content
                if (delta.content) {
                  fullContent += delta.content;
                }
              } catch {
                // ignore parse errors
              }
            }
          }

          send(controller, {
            type: "step",
            data: { id: "llm-analysis", label: "AI analyzing and comparing vehicles", status: "complete" },
          });

          // Parse the JSON result
          let comparison: any = null;
          try {
            // Try to extract JSON from the content
            const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              comparison = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            // If parsing fails, create a minimal error response
            comparison = {
              vehicles: marketCheckData.map((m) => ({
                id: m.listing.id,
                title: m.data?.heading || m.listing.title || "Unknown",
                price: m.data?.price || null,
                miles: m.data?.miles || null,
                year: m.data?.year || null,
                make: m.data?.make || null,
                model: m.data?.model || null,
                bodyType: m.data?.body_type || null,
                fuelType: m.data?.fuel_type || null,
                transmission: m.data?.transmission || null,
                drivetrain: m.data?.drivetrain || null,
                exteriorColor: m.data?.exterior_color || null,
                dealer: m.data?.dealer?.name || null,
                location: m.data?.dealer ? `${m.data.dealer.city}, ${m.data.dealer.state}` : null,
                vdpUrl: m.data?.vdp_url || m.listing.vdpUrl || null,
                keyStrengths: [],
                keyWeaknesses: [],
              })),
              comparison: {
                keyDifferences: ["Unable to parse AI analysis - showing raw data only"],
                valueAnalysis: "Analysis unavailable",
                reliabilityNotes: "Analysis unavailable",
              },
              recommendation: {
                bestPick: "Unable to determine",
                rationale: "The AI analysis could not be parsed. Please review the vehicle specifications above.",
                confidence: "low",
              },
              verificationNotes: ["AI response parsing failed"],
            };
          }

          // Add sources to comparison
          comparison.sources = collectedSources;

          send(controller, { type: "result", data: { comparison } });
          send(controller, { type: "done", data: {} });
          controller.close();
        } catch (e: any) {
          send(controller, { type: "error", data: { message: e?.message || "Stream error" } });
          controller.close();
        }
      },
    });

    return new Response(streamBody, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Research compare error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
