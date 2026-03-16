import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { resetRateLimit } from "@/lib/api/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset the 30-day window limit used in search
    // Must match the window used in app/api/search/route.ts
    await resetRateLimit(req, 30 * 24 * 60 * 60);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to reset rate limit:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

