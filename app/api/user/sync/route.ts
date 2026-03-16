/**
 * User Data Sync API
 * Syncs localStorage data (chat history, preferences, favorites) to Supabase
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { syncChatSessions, ChatSession } from "@/lib/supabase/chat";
import { savePreferences, getPreferences, UserPreferences } from "@/lib/supabase/preferences";
import { syncFavorites, getFavorites, SavedVehicle } from "@/lib/supabase/favorites";
import { getChatSessions } from "@/lib/supabase/chat";
import { isSupabaseConfigured } from "@/lib/supabase";

interface SyncRequest {
  chatSessions?: ChatSession[];
  preferences?: UserPreferences;
  favorites?: SavedVehicle[];
}

export async function POST(req: NextRequest) {
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

    const body: SyncRequest = await req.json();
    const results: Record<string, unknown> = {};

    // Sync chat sessions
    if (body.chatSessions && Array.isArray(body.chatSessions)) {
      const chatResult = await syncChatSessions(userId, body.chatSessions);
      results.chatSessions = chatResult;
    }

    // Sync preferences
    if (body.preferences && typeof body.preferences === "object") {
      const saved = await savePreferences(userId, body.preferences);
      results.preferences = { saved };
    }

    // Sync favorites/showroom
    if (body.favorites && Array.isArray(body.favorites)) {
      const favResult = await syncFavorites(userId, body.favorites);
      results.favorites = favResult;
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to sync data" },
      { status: 500 }
    );
  }
}

/**
 * GET - Fetch user's synced data from Supabase
 */
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

    const [chatSessions, preferences, favorites] = await Promise.all([
      getChatSessions(userId),
      getPreferences(userId),
      getFavorites(userId),
    ]);

    return NextResponse.json({
      success: true,
      chatSessions,
      preferences,
      favorites,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}

