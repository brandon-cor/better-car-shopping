import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { rateLimitUser } from "@/lib/api/rate-limit";
import { trackCall } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Require authentication for calls
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required", code: "AUTH_REQUIRED" },
        { status: 401 }
      );
    }
    
    // Rate limit: 3 calls per day
    const limitResult = await rateLimitUser(userId, "CALL");
    if (!limitResult.success) {
      return NextResponse.json(
        { 
          error: "Daily call limit reached", 
          code: "USER_LIMIT_REACHED",
          feature: "CALL",
          limit: limitResult.limit,
          reset: limitResult.reset,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { listing, dealerPhone, testMode } = body;

    if (!listing) {
      return NextResponse.json(
        { error: "Missing listing", received: body },
        { status: 400 }
      );
    }

    const apiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    const testNumber = process.env.MY_PHONE_NUMBER;

    if (!apiKey || !assistantId || !phoneNumberId) {
      return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
    }

    const targetPhone = testMode ? testNumber : dealerPhone;
    if (!targetPhone) {
      return NextResponse.json({ error: testMode ? "MY_PHONE_NUMBER not set" : "Missing dealer phone" }, { status: 400 });
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(phoneNumberId)) {
      return NextResponse.json(
        {
          error: "VAPI_PHONE_NUMBER_ID must be a valid UUID. Get it from your Vapi dashboard.",
        },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        assistantId,
        phoneNumberId,
        customer: { number: targetPhone },
        metadata: { listing },
      }),
    });

    if (!res.ok) {
      let errorMessage = "Vapi API error";
      try {
        const errorData = await res.json();
        if (errorData.message) {
          errorMessage = Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        const text = await res.text();
        errorMessage = text || `HTTP ${res.status}`;
      }
      return NextResponse.json({ error: errorMessage }, { status: res.status });
    }

    const callData = await res.json();
    
    // Track call in Supabase (non-blocking)
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || 
                      req.headers.get("x-real-ip") || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;
    // Note: Usage increment is handled by rateLimitUser
    trackCall(
      userId,
      { 
        listingId: listing?.id,
        dealerPhone: targetPhone,
        callId: callData.id,
      },
      { ipAddress, userAgent }
    );
    
    return NextResponse.json({ ok: true, callId: callData.id });
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}

