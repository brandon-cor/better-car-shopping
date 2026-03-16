import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackActivityAsync, incrementUsage } from "@/lib/supabase";

type ToolCall = {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
};

type ToolTraceItem = {
  name: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  args: unknown;
  output: unknown;
};

type StreamEvent =
  | { type: "step"; data: { id: string; label: string; description: string; status: "pending" | "active" | "complete" | "error"; urls?: string[]; timestamp: number } }
  | { type: "content"; data: { delta: string } }
  | { type: "thought"; data: { delta: string } }
  | { type: "status"; data: { status: string } }
  | { type: "sources"; data: { sources: Array<{ title: string; url: string; excerpt?: string }> } }
  | { type: "done"; data: { meta: any } }
  | { type: "error"; data: { message: string } };

type ChatCompletionMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | null;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

function clampInt(value: unknown, { min, max, fallback }: { min: number; max: number; fallback: number }) {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(max, Math.max(min, n));
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit & { timeoutMs?: number }) {
  const controller = new AbortController();
  const timeoutMs = init.timeoutMs ?? 12000;
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(t);
  }
}

async function parallelSearch(args: unknown) {
  const PARALLEL_API_KEY = process.env.PARALLEL_API_KEY || process.env.PARALLEL_AI_API_KEY;
  // Hardcode base URL to ensure correctness, ignoring potentially malformed env var
  const PARALLEL_BASE_URL = "https://api.parallel.ai";

  if (!PARALLEL_API_KEY) {
    return { error: "Parallel API key not configured" };
  }

  const obj = (args ?? {}) as any;
  const objective = typeof obj.objective === "string" ? obj.objective : "";
  const search_queries = Array.isArray(obj.search_queries) ? obj.search_queries.filter((q: any) => typeof q === "string") : [];

  if (!objective && search_queries.length === 0) {
    return { error: "Missing objective or search queries" };
  }

  const max_results = clampInt(obj.max_results, { min: 1, max: 8, fallback: 5 });
  const max_chars_per_result = clampInt(obj.max_chars_per_result, { min: 500, max: 12000, fallback: 4000 });

  const res = await fetchWithTimeout(`${PARALLEL_BASE_URL}/v1beta/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PARALLEL_API_KEY.trim(),
      "parallel-beta": "search-extract-2025-10-10",
    },
    body: JSON.stringify({
      objective,
      search_queries,
      max_results,
      excerpts: { max_chars_per_result },
      processor: "base",
    }),
    timeoutMs: 15000,
  });

  const text = await res.text();
  if (!res.ok) {
    return { error: "Parallel search failed", status: res.status, details: text };
  }

  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    return { error: "Parallel search returned non-JSON", details: text };
  }

  const rawResults = Array.isArray(data?.results) ? data.results : Array.isArray(data?.data) ? data.data : [];
  const results = rawResults
    .map((r: any) => ({
      title: typeof r?.title === "string" ? r.title : typeof r?.document?.title === "string" ? r.document.title : null,
      url: typeof r?.url === "string" ? r.url : typeof r?.document?.url === "string" ? r.document.url : null,
      excerpt:
        typeof r?.excerpt === "string"
          ? r.excerpt
          : typeof r?.excerpts?.[0] === "string"
            ? r.excerpts[0]
            : typeof r?.document?.excerpt === "string"
              ? r.document.excerpt
              : null,
    }))
    .filter((r: any) => r.url || r.title || r.excerpt)
    .slice(0, max_results);

  return {
    provider: "parallel",
    fetchedAt: new Date().toISOString(),
    objective,
    search_queries,
    results,
  };
}

async function openRouterChat({
  baseUrl,
  apiKey,
  model,
  messages,
  tools,
}: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatCompletionMessage[];
  tools?: any[];
}) {
  const res = await fetchWithTimeout(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://vehique.com",
      "X-Title": "Vehique Autopilot",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
      tools,
      tool_choice: tools?.length ? "auto" : undefined,
    }),
    timeoutMs: 30000,
  });

  const text = await res.text();
  if (!res.ok) {
    return { ok: false as const, status: res.status, text };
  }
  try {
    return { ok: true as const, data: JSON.parse(text) };
  } catch {
    return { ok: false as const, status: 502, text };
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestStartedAt = Date.now();
    const { userId } = await auth();
    const body = await req.json();
    const { messages, stream } = body ?? {};

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // Track chat activity (non-blocking)
    if (userId) {
      const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === "user");
      const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                        req.headers.get("x-real-ip") || undefined;
      trackActivityAsync(userId, "chat", {
        messageCount: messages.length,
        query: lastUserMessage?.content?.slice(0, 200),
      }, { ipAddress });
      incrementUsage(userId, "chat", "daily").catch(() => {});
    }

    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
    const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "x-ai/grok-4.1-fast";
    const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ error: "AI service not configured" }, { status: 503 });
    }

    const systemPrompt = `You are Vehique Autopilot, a professional AI car buying assistant.

Core requirements:
- Be concise, helpful, and professional.
- Default to a conversational answer. Only use tables when the user explicitly asks for a table or when comparing 3+ items.
- Use the available web search tool when answering requires up-to-date external facts, sources, or verification.
- CRITICAL: If a search tool returns a 401 error or technical failure, explicitly tell the user that your "realtime search capability is currently unavailable due to a technical error" and answer based on your internal knowledge instead. DO NOT hallucinate sources.
- When you use web results, include a short "Sources" section with markdown links to the exact URLs used.`;

    const tools = (process.env.PARALLEL_API_KEY || process.env.PARALLEL_AI_API_KEY)
      ? [
          {
            type: "function",
            function: {
              name: "parallel_search",
              description:
                "Search the web in realtime and return ranked excerpts with URLs. Use for up-to-date facts, pricing, recalls, model-year changes, and anything time-sensitive.",
              parameters: {
                type: "object",
                additionalProperties: false,
                properties: {
                  objective: { type: "string", description: "What you are trying to find out." },
                  search_queries: {
                    type: "array",
                    items: { type: "string" },
                    description: "2-6 short web queries to run for the objective.",
                  },
                  max_results: { type: "integer", description: "Number of results to return (1-8).", default: 5 },
                  max_chars_per_result: { type: "integer", description: "Excerpt size per result (500-12000).", default: 4000 },
                },
                required: ["objective", "search_queries"],
              },
            },
          },
        ]
      : [];

    const conversation: ChatCompletionMessage[] = [
      { role: "system", content: systemPrompt },
      ...(messages as ChatCompletionMessage[]),
    ];

    const toolTrace: ToolTraceItem[] = [];
    const isStream = stream === true;

    if (isStream) {
      const encoder = new TextEncoder();
      const send = (controller: ReadableStreamDefaultController, event: StreamEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      const streamBody = new ReadableStream({
        start: async (controller) => {
          try {
            const MAX_TOOL_ROUNDS = 3;
            for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
              const modelStepId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
              
              const openRouterRes = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
                  "Content-Type": "application/json",
                  "HTTP-Referer": "https://vehique.com",
                  "X-Title": "Vehique Autopilot",
                },
                body: JSON.stringify({
                  model: OPENROUTER_MODEL,
                  messages: conversation,
                  temperature: 0.4,
                  tools,
                  tool_choice: tools?.length ? "auto" : undefined,
                  stream: true,
                }),
              });

              if (!openRouterRes.ok) {
                const errorText = await openRouterRes.text();
                send(controller, { type: "error", data: { message: `AI Error: ${errorText}` } });
                controller.close();
                return;
              }

              const reader = openRouterRes.body?.getReader();
              if (!reader) throw new Error("No reader available");

              let fullContent = "";
              let currentToolCalls: any[] = [];
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

                    const thought = delta.reasoning || delta.thought || delta.reasoning_content;
                    if (thought) {
                      send(controller, { type: "thought", data: { delta: thought } });
                    }

                    if (delta.content) {
                      fullContent += delta.content;
                      send(controller, { type: "content", data: { delta: delta.content } });
                    }

                    if (delta.tool_calls) {
                      for (const tc of delta.tool_calls) {
                        if (tc.index === undefined) continue;
                        if (!currentToolCalls[tc.index]) {
                          currentToolCalls[tc.index] = {
                            id: tc.id,
                            type: "function",
                            function: { name: "", arguments: "" },
                          };
                        }
                        if (tc.function?.name) {
                          currentToolCalls[tc.index].function.name += tc.function.name;
                        }
                        if (tc.function?.arguments) {
                          currentToolCalls[tc.index].function.arguments += tc.function.arguments;
                        }
                      }
                    }
                  } catch (e) {
                    // ignore parse errors
                  }
                }
              }

              const toolCalls = currentToolCalls.filter(Boolean);
              if (toolCalls.length > 0) {
                const assistantMsg: ChatCompletionMessage = {
                  role: "assistant",
                  content: fullContent || null,
                  tool_calls: toolCalls,
                };
                conversation.push(assistantMsg);

                const toolOutputs = await Promise.all(
                  toolCalls.map(async (tc) => {
                    let parsedArgs: any = {};
                    try {
                      parsedArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
                    } catch {
                      parsedArgs = {};
                    }

                    if (tc.function.name === "parallel_search") {
                      const startedAtMs = Date.now();
                      const result = await parallelSearch(parsedArgs);
                      const endedAtMs = Date.now();
                      
                      const results = Array.isArray((result as any)?.results) ? (result as any).results : [];

                      if (!(result as any)?.error && results.length > 0) {
                        const sources = results.slice(0, 6).map((r: any) => ({
                          title: r?.title || (r.url ? new URL(r.url).hostname : "Source"),
                          url: r.url,
                          excerpt: (r?.excerpt || "").slice(0, 220),
                        }));
                        send(controller, { type: "sources", data: { sources } });
                      }

                      toolTrace.push({
                        name: "parallel_search",
                        startedAt: new Date(startedAtMs).toISOString(),
                        endedAt: new Date(endedAtMs).toISOString(),
                        durationMs: endedAtMs - startedAtMs,
                        args: parsedArgs,
                        output: result,
                      });

                      return { tool_call_id: tc.id, content: JSON.stringify(result) };
                    }

                    const unknown = { error: `Unknown tool: ${tc.function.name}` };
                    return { tool_call_id: tc.id, content: JSON.stringify(unknown) };
                  })
                );

                for (const out of toolOutputs) {
                  conversation.push({ role: "tool", tool_call_id: out.tool_call_id, content: out.content });
                }
                continue;
              }

              const thoughtMs = Date.now() - requestStartedAt;
              const usedTools = toolTrace.length > 0;
              const sources = toolTrace.flatMap(t => {
                const out: any = t.output;
                const results = Array.isArray(out?.results) ? out.results : [];
                return results.map((r: any) => ({
                  title: typeof r?.title === "string" ? r.title : null,
                  url: typeof r?.url === "string" ? r.url : null,
                  excerpt: typeof r?.excerpt === "string" ? r.excerpt : null,
                })).filter((r: any) => r.url);
              }).slice(0, 8);

              const meta = { thoughtMs, usedTools, toolTrace, sources };
              send(controller, { type: "done", data: { meta } });
              controller.close();
              return;
            }

            send(controller, { type: "error", data: { message: "Tool loop exceeded" } });
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
    }

    // Fallback for non-streaming
    const MAX_TOOL_ROUNDS = 3;
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const resp = await openRouterChat({
        baseUrl: OPENROUTER_BASE_URL,
        apiKey: OPENROUTER_API_KEY,
        model: OPENROUTER_MODEL,
        messages: conversation,
        tools,
      });

      if (!resp.ok) {
        return NextResponse.json({ error: "Failed to get AI response", details: resp.text }, { status: resp.status });
      }

      const msg: ChatCompletionMessage | undefined = resp.data?.choices?.[0]?.message;
      if (!msg) {
        return NextResponse.json({ error: "Malformed AI response" }, { status: 502 });
      }

      const toolCalls = msg.tool_calls;
      if (toolCalls && toolCalls.length > 0) {
        conversation.push(msg);

        const toolOutputs = await Promise.all(
          toolCalls.map(async (tc) => {
            let parsedArgs: any = {};
            try {
              parsedArgs = tc.function?.arguments ? JSON.parse(tc.function.arguments) : {};
            } catch {
              parsedArgs = {};
            }

            if (tc.function.name === "parallel_search") {
              const startedAtMs = Date.now();
              const result = await parallelSearch(parsedArgs);
              const endedAtMs = Date.now();
              toolTrace.push({
                name: "parallel_search",
                startedAt: new Date(startedAtMs).toISOString(),
                endedAt: new Date(endedAtMs).toISOString(),
                durationMs: endedAtMs - startedAtMs,
                args: parsedArgs,
                output: result,
              });
              return { tool_call_id: tc.id, content: JSON.stringify(result) };
            }
            return { tool_call_id: tc.id, content: JSON.stringify({ error: `Unknown tool: ${tc.function.name}` }) };
          })
        );

        for (const out of toolOutputs) {
          conversation.push({ role: "tool", tool_call_id: out.tool_call_id, content: out.content });
        }
        continue;
      }

      const thoughtMs = Date.now() - requestStartedAt;
      const usedTools = toolTrace.length > 0;
      const sources = toolTrace.flatMap(t => {
        const out: any = t.output;
        const results = Array.isArray(out?.results) ? out.results : [];
        return results.map((r: any) => ({
          title: typeof r?.title === "string" ? r.title : null,
          url: typeof r?.url === "string" ? r.url : null,
          excerpt: typeof r?.excerpt === "string" ? r.excerpt : null,
        })).filter((r: any) => r.url);
      }).slice(0, 8);

      return NextResponse.json({
        message: msg,
        meta: { thoughtMs, usedTools, toolTrace, sources },
      });
    }

    return NextResponse.json({ error: "Tool loop exceeded" }, { status: 500 });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
