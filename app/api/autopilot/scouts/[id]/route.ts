/**
 * Individual Scout API
 * 
 * GET /api/autopilot/scouts/[id] - Get scout details and updates
 * PATCH /api/autopilot/scouts/[id] - Update scout (pause/resume)
 * DELETE /api/autopilot/scouts/[id] - Delete scout
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getScout,
  getScoutUpdates,
  pauseScout,
  restartScout,
  deleteScout,
} from "@/lib/autopilot";
import { isUserScout, deleteUserScout } from "@/lib/supabase";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/autopilot/scouts/[id]
 * Get scout details and all updates (discovered vehicles)
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify scout belongs to this user
    const ownsScout = await isUserScout(userId, id);
    if (!ownsScout) {
      return NextResponse.json(
        { success: false, error: "Scout not found" },
        { status: 404 }
      );
    }

    let scout;
    let updates: any[] = [];
    
    try {
      scout = await getScout(id);
    } catch (err) {
      console.error("Error fetching scout:", err);
      return NextResponse.json(
        { success: false, error: "Scout not found" },
        { status: 404 }
      );
    }
    
    try {
      updates = await getScoutUpdates(id);
    } catch (err) {
      // Updates might not exist yet for new scouts
      console.log("No updates for scout:", err);
      updates = [];
    }
    
    // Calculate match counts
    const allVehicles = updates.flatMap((u: any) => u.vehicles || []);
    const enrichedScout = {
      ...scout,
      matchCount: allVehicles.length,
      newMatchCount: allVehicles.filter((v: any) => v.isNew).length,
      lastChecked: updates[0]?.createdAt || null,
    };

    return NextResponse.json({
      success: true,
      scout: enrichedScout,
      updates,
    });
  } catch (error) {
    console.error("Error getting scout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get scout" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/autopilot/scouts/[id]
 * Update scout (pause/resume)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify scout belongs to this user
    const ownsScout = await isUserScout(userId, id);
    if (!ownsScout) {
      return NextResponse.json(
        { success: false, error: "Scout not found" },
        { status: 404 }
      );
    }

    const body = await request.json();

    let scout;
    
    if (body.action === "pause") {
      scout = await pauseScout(id);
    } else if (body.action === "resume" || body.action === "restart") {
      scout = await restartScout(id);
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      scout,
    });
  } catch (error) {
    console.error("Error updating scout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update scout" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/autopilot/scouts/[id]
 * Delete a scout
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    // Verify scout belongs to this user
    const ownsScout = await isUserScout(userId, id);
    if (!ownsScout) {
      return NextResponse.json(
        { success: false, error: "Scout not found" },
        { status: 404 }
      );
    }

    // Delete from Yutori
    await deleteScout(id);
    
    // Soft delete from our database
    await deleteUserScout(userId, id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting scout:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete scout" },
      { status: 500 }
    );
  }
}
