/**
 * Clerk Webhook Handler
 * Syncs user data from Clerk to Supabase on user events
 * 
 * Events handled:
 * - user.created: Create user in Supabase
 * - user.updated: Update user profile
 * - user.deleted: Remove user data
 * - session.created: Track sign-in
 */

import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { upsertUser, deleteUser, recordSignIn } from "@/lib/supabase";
import { trackActivityAsync } from "@/lib/supabase/activity";

interface ClerkUserData {
  id: string;
  email_addresses?: Array<{ email_address: string; id: string }>;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  created_at?: number;
  updated_at?: number;
  external_accounts?: Array<{ provider: string }>;
  public_metadata?: Record<string, unknown>;
  private_metadata?: Record<string, unknown>;
}

interface ClerkSessionData {
  user_id: string;
}

interface ClerkWebhookEvent {
  type: string;
  data: ClerkUserData | ClerkSessionData;
}

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get headers for verification
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json(
      { error: "Missing svix headers" },
      { status: 400 }
    );
  }

  // Get body
  const body = await req.text();

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let event: ClerkWebhookEvent;

  try {
    event = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkWebhookEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 401 }
    );
  }

  // Handle events
  const eventType = event.type;

  try {
    switch (eventType) {
      case "user.created": {
        const userData = event.data as ClerkUserData;
        const primaryEmail = userData.email_addresses?.[0]?.email_address || null;
        
        await upsertUser({
          id: userData.id,
          email: primaryEmail,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
          metadata: {
            clerkCreatedAt: userData.created_at,
            externalAccounts: userData.external_accounts?.map((a) => a.provider),
            publicMetadata: userData.public_metadata,
          },
        });

        // Track sign-up activity
        trackActivityAsync(userData.id, "sign_up", {
          email: primaryEmail,
          provider: userData.external_accounts?.[0]?.provider || "email",
        });
        break;
      }

      case "user.updated": {
        const userData = event.data as ClerkUserData;
        const primaryEmail = userData.email_addresses?.[0]?.email_address || null;
        
        await upsertUser({
          id: userData.id,
          email: primaryEmail,
          firstName: userData.first_name,
          lastName: userData.last_name,
          imageUrl: userData.image_url,
          metadata: {
            clerkUpdatedAt: userData.updated_at,
            publicMetadata: userData.public_metadata,
          },
        });
        break;
      }

      case "user.deleted": {
        const userData = event.data as ClerkUserData;
        await deleteUser(userData.id);
        break;
      }

      case "session.created": {
        const sessionData = event.data as ClerkSessionData;
        await recordSignIn(sessionData.user_id);
        
        trackActivityAsync(sessionData.user_id, "sign_in", {
          timestamp: new Date().toISOString(),
        });
        break;
      }

      default:
        // Unhandled event type - silent
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

