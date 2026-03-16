import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase/client";
import { randomUUID } from "crypto";
import type { FeedbackCategory, FeedbackSentiment, FeedbackInsert } from "@/lib/supabase/types";

const VALID_CATEGORIES: FeedbackCategory[] = ["bug", "feature", "improvement", "praise", "other"];
const VALID_SENTIMENTS: FeedbackSentiment[] = [1, 2, 3, 4, 5];

interface FeedbackPayload {
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  message: string;
  pageUrl?: string | null;
  userId?: string | null;
  email?: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as FeedbackPayload;
    const { category, sentiment, message, pageUrl, userId, email } = body;

    // Validate required fields
    if (!category || !VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: "Invalid or missing category" },
        { status: 400 }
      );
    }

    if (!sentiment || !VALID_SENTIMENTS.includes(sentiment)) {
      return NextResponse.json(
        { error: "Invalid or missing sentiment" },
        { status: 400 }
      );
    }

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: "Message cannot exceed 1000 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    
    if (!supabase) {
      // Log to console for debugging but still return success
      // This allows the feature to work in development without Supabase
      console.log("[Feedback] Supabase not configured, logging feedback:", {
        category,
        sentiment,
        message: message.substring(0, 100),
        userId,
        email,
        pageUrl,
      });
      
      return NextResponse.json({ success: true, id: randomUUID() });
    }

    const userAgent = request.headers.get("user-agent") || null;

    const feedbackData: FeedbackInsert = {
      id: randomUUID(),
      user_id: userId || null,
      email: email || null,
      category,
      sentiment,
      message: message.trim(),
      page_url: pageUrl || null,
      user_agent: userAgent,
      metadata: {
        submitted_at: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from("feedback")
      .insert(feedbackData);

    if (error) {
      console.error("[Feedback] Failed to insert:", error);
      return NextResponse.json(
        { error: "Failed to submit feedback" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: feedbackData.id });
  } catch (err) {
    console.error("[Feedback] Error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


