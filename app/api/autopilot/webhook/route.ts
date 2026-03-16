/**
 * Autopilot Webhook Handler
 * 
 * POST /api/autopilot/webhook - Receive webhook notifications from Yutori
 * 
 * This endpoint receives real-time updates when scouts discover new vehicles.
 * In a production environment, this would trigger notifications to users.
 */

import { NextRequest, NextResponse } from "next/server";
import { YutoriWebhookPayload } from "@/lib/autopilot";

// Store recent webhook events in memory for debugging (in production, use a database)
const recentWebhooks: Array<{
  id: string;
  event: string;
  scoutId: string;
  timestamp: string;
  vehicleCount: number;
}> = [];

const MAX_STORED_WEBHOOKS = 100;

/**
 * POST /api/autopilot/webhook
 * Receive webhook notifications from Yutori
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if secret is configured
    const webhookSecret = process.env.YUTORI_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = request.headers.get("x-yutori-signature");
      // In production, verify the signature using HMAC
      // For now, we'll skip verification if secret is set but signature is present
      if (!signature) {
        console.warn("Webhook received without signature");
      }
    }

    const payload: YutoriWebhookPayload = await request.json();
    
    console.log(`[Autopilot Webhook] Received ${payload.event} for scout ${payload.scout_id}`);

    // Store webhook event
    const webhookEvent = {
      id: `webhook-${Date.now()}`,
      event: payload.event,
      scoutId: payload.scout_id,
      timestamp: payload.timestamp,
      vehicleCount: payload.data.vehicles?.length || 0,
    };
    
    recentWebhooks.unshift(webhookEvent);
    if (recentWebhooks.length > MAX_STORED_WEBHOOKS) {
      recentWebhooks.pop();
    }

    // Handle different event types
    switch (payload.event) {
      case "scout.update":
        await handleScoutUpdate(payload);
        break;
      
      case "scout.completed":
        await handleScoutCompleted(payload);
        break;
      
      case "scout.error":
        await handleScoutError(payload);
        break;
      
      default:
        console.log(`Unknown webhook event: ${payload.event}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { success: false, error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/autopilot/webhook
 * Get recent webhook events (for debugging)
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    webhooks: recentWebhooks,
    total: recentWebhooks.length,
  });
}

// ============================================================================
// Webhook Handlers
// ============================================================================

async function handleScoutUpdate(payload: YutoriWebhookPayload) {
  const { scout_id, data } = payload;
  const vehicleCount = data.vehicles?.length || 0;
  
  console.log(`[Scout Update] Scout ${scout_id} found ${vehicleCount} vehicles`);
  
  if (vehicleCount > 0) {
    // In production, this would:
    // 1. Store the new vehicles in a database
    // 2. Look up the user who owns this scout
    // 3. Send a push notification / email / SMS
    // 4. Update the scout's match count in the database
    
    // For now, just log the vehicle titles
    data.vehicles?.forEach((vehicle, index) => {
      console.log(`  ${index + 1}. ${vehicle.title} - ${vehicle.price}`);
    });
  }
  
  // TODO: Implement notification system
  // await sendNotification(scoutOwner, {
  //   title: `${vehicleCount} new vehicles found!`,
  //   body: `Your scout "${scoutDisplayName}" discovered new matches.`,
  //   data: { scoutId: scout_id, updateId: data.update_id },
  // });
}

async function handleScoutCompleted(payload: YutoriWebhookPayload) {
  const { scout_id } = payload;
  
  console.log(`[Scout Completed] Scout ${scout_id} has finished monitoring`);
  
  // TODO: Mark scout as completed in database
  // TODO: Optionally notify user
}

async function handleScoutError(payload: YutoriWebhookPayload) {
  const { scout_id, data } = payload;
  
  console.error(`[Scout Error] Scout ${scout_id} encountered an error: ${data.error}`);
  
  // TODO: Log error to monitoring system
  // TODO: Optionally notify user of the issue
  // TODO: Consider auto-retry logic
}

