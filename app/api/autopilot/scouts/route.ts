/**
 * Autopilot Scouts API
 * 
 * POST /api/autopilot/scouts - Create a new scout
 * GET /api/autopilot/scouts - List all scouts for the current user
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  createScout,
  listScouts,
  getScoutUpdates,
  getScout,
  Scout,
  CreateScoutRequest,
  ScoutInterval,
} from "@/lib/autopilot";
import { rateLimitUser } from "@/lib/api/rate-limit";
import { trackScoutCreate, registerScout, getUserScoutIds } from "@/lib/supabase";

/**
 * GET /api/autopilot/scouts
 * List all scouts for the current user (filtered by user ID)
 */
export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get scout IDs that belong to this user from Supabase
    const userScoutIds = await getUserScoutIds(userId);
    console.log(`[Scouts API] User ${userId} has ${userScoutIds.length} scouts:`, userScoutIds);
    
    // If user has no scouts, return empty
    if (userScoutIds.length === 0) {
      console.log(`[Scouts API] Returning empty list for user ${userId}`);
      return NextResponse.json({
        success: true,
        scouts: [],
        total: 0,
      });
    }

    // Fetch each scout from Yutori and filter to only user's scouts
    const scouts: Scout[] = [];
    
    for (const scoutId of userScoutIds) {
      try {
        const scout = await getScout(scoutId);
        scouts.push(scout);
      } catch {
        // Scout may have been deleted in Yutori, skip it
      }
    }
    
    // Enrich scouts with match counts
    const enrichedScouts = await Promise.all(
      scouts.map(async (scout) => {
        try {
          const updates = await getScoutUpdates(scout.id);
          const allVehicles = updates.flatMap((u) => u.vehicles);
          const newVehicles = allVehicles.filter((v) => v.isNew);
          
          return {
            ...scout,
            matchCount: allVehicles.length,
            newMatchCount: newVehicles.length,
            lastChecked: updates[0]?.createdAt || null,
          };
        } catch {
          return scout;
        }
      })
    );

    return NextResponse.json({
      success: true,
      scouts: enrichedScouts,
      total: enrichedScouts.length,
    });
  } catch (error) {
    console.error("Error listing scouts:", error);
    return NextResponse.json({
      success: true,
      scouts: [],
      total: 0,
    });
  }
}

/**
 * POST /api/autopilot/scouts
 * Create a new scout
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    // Rate limit: 1 scout creation per day
    const limitResult = await rateLimitUser(userId, "SCOUT_CREATE");
    if (!limitResult.success) {
      return NextResponse.json(
        { 
          success: false,
          error: "Daily scout creation limit reached", 
          code: "USER_LIMIT_REACHED",
          feature: "SCOUT_CREATE",
          limit: limitResult.limit,
          reset: limitResult.reset,
        },
        { status: 429 }
      );
    }

    const body: CreateScoutRequest = await request.json();
    
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { success: false, error: "Query is required" },
        { status: 400 }
      );
    }

    // Validate interval
    const validIntervals: ScoutInterval[] = ["hourly", "daily", "custom"];
    const interval = validIntervals.includes(body.interval) ? body.interval : "daily";

    // Get user's timezone
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Build webhook URL for this deployment
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vehique.ai";
    const webhookUrl = `${baseUrl}/api/autopilot/webhook`;

    const scout = await createScout(body.query, interval, {
      customIntervalSeconds: body.customIntervalSeconds,
      userTimezone,
      webhookUrl,
    });

    // Register scout to user in Supabase (CRITICAL: This maps scout to user)
    console.log(`[Scouts API] Registering scout ${scout.id} for user ${userId}...`);
    const registered = await registerScout(userId, scout.id, body.query, interval);
    if (!registered) {
      console.error(`[Scouts API] FAILED to register scout ${scout.id} for user ${userId}`);
    } else {
      console.log(`[Scouts API] Successfully registered scout ${scout.id} for user ${userId}`);
    }

    // Track scout creation in Supabase (non-blocking)
    // Note: Usage increment is handled by rateLimitUser
    const ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                      request.headers.get("x-real-ip") || undefined;
    const userAgent = request.headers.get("user-agent") || undefined;
    trackScoutCreate(
      userId,
      { query: body.query, interval, scoutId: scout.id },
      { ipAddress, userAgent }
    );

    return NextResponse.json({
      success: true,
      scout,
    });
  } catch (error) {
    console.error("Error creating scout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create scout" },
      { status: 500 }
    );
  }
}


