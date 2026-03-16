import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.VAPI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    const res = await fetch("https://api.vapi.ai/call?limit=50", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch calls" },
        { status: res.status }
      );
    }

    const data = await res.json();
    let calls = [];
    
    if (Array.isArray(data)) {
      calls = data;
    } else if (data.calls && Array.isArray(data.calls)) {
      calls = data.calls;
    } else if (data.data && Array.isArray(data.data)) {
      calls = data.data;
    }
    
    return NextResponse.json({ calls });
  } catch (err) {
    console.error("Error fetching calls:", err);
    return NextResponse.json(
      { error: "Failed to fetch calls", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

