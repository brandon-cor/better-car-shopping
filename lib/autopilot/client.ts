/**
 * Vehique Autopilot - Yutori API Client
 * 
 * This client wraps the Yutori Scouting API for creating and managing
 * vehicle monitoring scouts.
 */

import {
  Scout,
  ScoutStatus,
  ScoutInterval,
  ScoutUpdate,
  VehicleMatch,
  YutoriScoutResponse,
  YutoriUpdateResponse,
  YutoriUpdatesListResponse,
  YutoriVehicleOutput,
} from "./types";
import { VEHICLE_OUTPUT_SCHEMA, buildScoutQuery, intervalToSeconds } from "./schema";

const YUTORI_API_BASE = "https://api.yutori.com/v1";

/**
 * Get the Yutori API key from environment variables.
 */
function getApiKey(): string {
  const apiKey = process.env.YUTORI_API_KEY;
  if (!apiKey) {
    throw new Error("YUTORI_API_KEY environment variable is not set");
  }
  return apiKey;
}

/**
 * Make a request to the Yutori API.
 */
async function yutoriRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiKey = getApiKey();
  
  const response = await fetch(`${YUTORI_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Yutori API error (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Transform Yutori scout response to our Scout type.
 */
function transformScout(yutori: YutoriScoutResponse): Scout {
  const status: ScoutStatus = yutori.completed_at
    ? "completed"
    : yutori.paused_at
    ? "paused"
    : "active";

  // Determine interval from the next_run_timestamp and created_at
  let interval: ScoutInterval = "daily";
  let intervalSeconds = 86400;
  
  if (yutori.next_run_timestamp && yutori.created_at) {
    const nextRun = new Date(yutori.next_run_timestamp).getTime();
    const created = new Date(yutori.created_at).getTime();
    const diff = nextRun - created;
    intervalSeconds = Math.round(diff / 1000);
    
    if (intervalSeconds <= 3600) {
      interval = "hourly";
    } else if (intervalSeconds <= 86400) {
      interval = "daily";
    } else {
      interval = "custom";
    }
  }

  return {
    id: yutori.id,
    query: yutori.query,
    displayName: yutori.display_name,
    status,
    interval,
    intervalSeconds,
    nextRunTimestamp: yutori.next_run_timestamp,
    nextOutputTimestamp: yutori.next_output_timestamp,
    createdAt: yutori.created_at,
    completedAt: yutori.completed_at,
    pausedAt: yutori.paused_at,
    userTimezone: yutori.user_timezone,
    isPublic: yutori.is_public,
    webhookUrl: yutori.webhook_url,
    // These will be populated when fetching updates
    matchCount: 0,
    newMatchCount: 0,
    lastChecked: null,
  };
}

/**
 * Generate a simple hash from a string for unique IDs.
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Check if a URL is valid (starts with http:// or https://)
 */
function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Transform Yutori update response to our VehicleMatch type.
 */
function transformVehicleMatch(
  vehicle: YutoriVehicleOutput,
  updateTimestamp: number,
  index: number = 0
): VehicleMatch {
  // Generate a unique ID using hash of URL + timestamp + index
  const uniqueString = `${vehicle.url || vehicle.title}-${updateTimestamp}-${index}`;
  const id = `match-${hashString(uniqueString)}-${index}`;

  // Parse price to numeric value
  let priceNumeric: number | undefined;
  if (vehicle.price) {
    const cleaned = vehicle.price.replace(/[^0-9.]/g, "");
    priceNumeric = parseFloat(cleaned) || undefined;
  }

  // Convert unix timestamp to ISO string
  const discoveredAt = new Date(updateTimestamp * 1000).toISOString();

  return {
    id,
    title: vehicle.title,
    price: vehicle.price,
    priceNumeric,
    miles: vehicle.miles,
    location: vehicle.location,
    dealer: vehicle.dealer,
    phone: vehicle.phone,
    url: vehicle.url,
    image: vehicle.image,
    bodyType: vehicle.body_type,
    fuelType: vehicle.fuel_type,
    exteriorColor: vehicle.exterior_color,
    vin: vehicle.vin,
    discoveredAt,
    isNew: true, // Will be computed based on view state
  };
}

// ============================================================================
// Public API Functions
// ============================================================================

/**
 * Create a new scout to monitor vehicle listings.
 */
export async function createScout(
  query: string,
  interval: ScoutInterval = "daily",
  options: {
    customIntervalSeconds?: number;
    userTimezone?: string;
    userLocation?: string;
    webhookUrl?: string;
  } = {}
): Promise<Scout> {
  const intervalSeconds = intervalToSeconds(interval, options.customIntervalSeconds);
  const enhancedQuery = buildScoutQuery(query, options.userLocation);

  const body = {
    query: enhancedQuery,
    output_interval: intervalSeconds,
    user_timezone: options.userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    user_location: options.userLocation,
    task_spec: {
      output_schema: VEHICLE_OUTPUT_SCHEMA,
    },
    skip_email: true, // We handle notifications ourselves
    webhook_url: options.webhookUrl,
    webhook_format: "scout",
    is_public: false,
  };

  const response = await yutoriRequest<YutoriScoutResponse>("/scouting/tasks", {
    method: "POST",
    body: JSON.stringify(body),
  });

  const scout = transformScout(response);
  // Override with our known values
  scout.interval = interval;
  scout.intervalSeconds = intervalSeconds;
  
  return scout;
}

/**
 * List all scouts for the current user.
 */
export async function listScouts(): Promise<Scout[]> {
  const response = await yutoriRequest<{ scouts: YutoriScoutResponse[] }>("/scouting/tasks");
  return response.scouts.map(transformScout);
}

/**
 * Get a specific scout by ID.
 */
export async function getScout(scoutId: string): Promise<Scout> {
  const response = await yutoriRequest<YutoriScoutResponse>(`/scouting/tasks/${scoutId}`);
  return transformScout(response);
}

/**
 * Get updates (discovered vehicles) for a scout.
 */
export async function getScoutUpdates(scoutId: string): Promise<ScoutUpdate[]> {
  const response = await yutoriRequest<YutoriUpdatesListResponse>(
    `/scouting/tasks/${scoutId}/updates?page_size=50`
  );

  return response.updates.map((update) => {
    // Extract vehicles from structured_result
    let vehicles = update.structured_result?.vehicles || [];
    
    // Get all valid citation URLs for fallback
    const validCitationUrls = (update.citations || [])
      .filter(c => isValidUrl(c.url))
      .map(c => c.url);
    
    // Transform vehicles and try to fix missing/invalid URLs from citations
    let citationIndex = 0;
    const transformedVehicles = vehicles
      .map((v, idx) => {
        // If vehicle has invalid URL, try to assign from citations
        let vehicleUrl = v.url;
        if (!isValidUrl(vehicleUrl) && citationIndex < validCitationUrls.length) {
          vehicleUrl = validCitationUrls[citationIndex++];
        }
        
        return transformVehicleMatch(
          { ...v, url: vehicleUrl },
          update.timestamp,
          idx
        );
      })
      // Filter out vehicles that still don't have valid URLs
      .filter(v => isValidUrl(v.url));
    
    // Convert unix timestamp to ISO string
    const createdAt = new Date(update.timestamp * 1000).toISOString();
    
    return {
      id: update.id,
      scoutId: scoutId,
      vehicles: transformedVehicles,
      content: update.content, // Text summary from the update
      citations: update.citations, // Source URLs
      stats: update.stats, // Agent stats (time saved, tool calls, etc.)
      createdAt,
      isNew: true,
    };
  });
}

/**
 * Pause a scout (stop monitoring).
 */
export async function pauseScout(scoutId: string): Promise<Scout> {
  const response = await yutoriRequest<YutoriScoutResponse>(`/scouting/tasks/${scoutId}`, {
    method: "PATCH",
    body: JSON.stringify({ paused: true }),
  });
  return transformScout(response);
}

/**
 * Restart a paused or completed scout.
 */
export async function restartScout(scoutId: string): Promise<Scout> {
  const response = await yutoriRequest<YutoriScoutResponse>(`/scouting/tasks/${scoutId}/restart`, {
    method: "POST",
  });
  return transformScout(response);
}

/**
 * Delete a scout permanently.
 */
export async function deleteScout(scoutId: string): Promise<void> {
  await yutoriRequest(`/scouting/tasks/${scoutId}`, {
    method: "DELETE",
  });
}

/**
 * Mark a scout as done (complete).
 */
export async function completeScout(scoutId: string): Promise<void> {
  await yutoriRequest(`/scouting/tasks/${scoutId}/complete`, {
    method: "POST",
  });
}

