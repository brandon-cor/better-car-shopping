/**
 * User Stats API
 * Returns user activity stats and usage data from Supabase
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getUser,
  getAllUsage,
  getRecentActivities,
  getActivityStats,
  isSupabaseConfigured,
} from "@/lib/supabase";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 503 }
      );
    }

    // Fetch user data in parallel
    const [user, dailyUsage, monthlyUsage, recentActivities, activityStats] = await Promise.all([
      getUser(userId),
      getAllUsage(userId, "daily"),
      getAllUsage(userId, "monthly"),
      getRecentActivities(userId, 20),
      getActivityStats(userId),
    ]);

    return NextResponse.json({
      success: true,
      user: user || { id: userId },
      usage: {
        daily: dailyUsage,
        monthly: monthlyUsage,
      },
      recentActivities: recentActivities.map((a) => ({
        id: a.id,
        type: a.type,
        metadata: a.metadata,
        createdAt: a.created_at,
      })),
      stats: activityStats,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch user stats" },
      { status: 500 }
    );
  }
}

