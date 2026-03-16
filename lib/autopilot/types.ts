/**
 * Vehique Autopilot - Type Definitions
 * 
 * These types define the data structures for the Autopilot feature,
 * which uses Yutori's Scouting API to monitor vehicle listings.
 */

// ============================================================================
// Scout Types
// ============================================================================

export type ScoutStatus = "active" | "paused" | "completed" | "error";
export type ScoutInterval = "hourly" | "daily" | "custom";

export interface Scout {
  id: string;
  query: string;
  displayName: string;
  status: ScoutStatus;
  interval: ScoutInterval;
  intervalSeconds: number;
  nextRunTimestamp: string | null;
  nextOutputTimestamp: string | null;
  createdAt: string;
  completedAt: string | null;
  pausedAt: string | null;
  userTimezone: string;
  isPublic: boolean;
  webhookUrl: string | null;
  // Computed fields
  matchCount: number;
  newMatchCount: number;
  lastChecked: string | null;
}

export interface ScoutCreateInput {
  query: string;
  interval: ScoutInterval;
  customIntervalSeconds?: number;
  userTimezone?: string;
  userLocation?: string;
}

export interface ScoutUpdate {
  id: string;
  scoutId: string;
  vehicles: VehicleMatch[];
  content?: string; // Text summary of the update
  citations?: Array<{
    id: string;
    url: string;
    preview_data?: Record<string, unknown>;
  }>;
  stats?: {
    num_tool_calls?: number;
    num_mcp_tool_calls?: number;
    num_crawler_calls?: number;
    num_navigator_steps?: number;
    num_websites_visited?: number;
    sec_saved?: number;
  };
  createdAt: string;
  isNew: boolean;
}

// ============================================================================
// Vehicle Match Types
// ============================================================================

export interface VehicleMatch {
  id: string;
  title: string;
  price: string;
  priceNumeric?: number;
  miles?: number;
  location?: string;
  dealer?: string;
  phone?: string;
  url: string;
  image?: string;
  bodyType?: string;
  fuelType?: string;
  exteriorColor?: string;
  interiorColor?: string;
  transmission?: string;
  drivetrain?: string;
  engine?: string;
  vin?: string;
  // Match metadata
  discoveredAt: string;
  isNew: boolean;
  matchScore?: number;
  priceChange?: {
    previous: string;
    current: string;
    direction: "up" | "down";
    percentage: number;
  };
}

// ============================================================================
// Yutori API Response Types
// ============================================================================

export interface YutoriScoutResponse {
  id: string;
  query: string;
  display_name: string;
  next_run_timestamp: string | null;
  user_timezone: string;
  next_output_timestamp: string | null;
  created_at: string;
  completed_at: string | null;
  paused_at: string | null;
  query_object: Record<string, unknown> | null;
  is_public: boolean;
  webhook_url: string | null;
}

export interface YutoriScoutListResponse {
  scouts: YutoriScoutResponse[];
  total: number;
}

export interface YutoriCitation {
  id: string;
  url: string;
  preview_data?: Record<string, unknown>;
}

export interface YutoriUpdateStats {
  num_tool_calls?: number;
  num_mcp_tool_calls?: number;
  num_crawler_calls?: number;
  num_navigator_steps?: number;
  num_websites_visited?: number;
  sec_saved?: number;
}

export interface YutoriVehicleOutput {
  title: string;
  price: string;
  miles?: number;
  location?: string;
  dealer?: string;
  phone?: string;
  url: string;
  image?: string;
  body_type?: string;
  fuel_type?: string;
  exterior_color?: string;
  vin?: string;
}

export interface YutoriStructuredResult {
  vehicles?: YutoriVehicleOutput[];
  // Allow other structured data
  [key: string]: unknown;
}

export interface YutoriUpdateResponse {
  id: string;
  timestamp: number; // Unix timestamp
  content: string; // Text summary of the update
  citations: YutoriCitation[];
  stats: YutoriUpdateStats;
  structured_result: YutoriStructuredResult | null;
}

export interface YutoriUpdatesListResponse {
  updates: YutoriUpdateResponse[];
  prev_cursor: string | null;
  next_cursor: string | null;
}

export interface YutoriWebhookPayload {
  event: "scout.update" | "scout.completed" | "scout.error";
  scout_id: string;
  timestamp: string;
  data: {
    update_id?: string;
    vehicles?: VehicleMatch[];
    error?: string;
  };
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface CreateScoutRequest {
  query: string;
  interval: ScoutInterval;
  customIntervalSeconds?: number;
}

export interface CreateScoutResponse {
  success: boolean;
  scout?: Scout;
  error?: string;
}

export interface ListScoutsResponse {
  success: boolean;
  scouts: Scout[];
  total: number;
  error?: string;
}

export interface GetScoutResponse {
  success: boolean;
  scout?: Scout;
  updates?: ScoutUpdate[];
  error?: string;
}

export interface DeleteScoutResponse {
  success: boolean;
  error?: string;
}

export interface PauseScoutResponse {
  success: boolean;
  scout?: Scout;
  error?: string;
}

export interface RestartScoutResponse {
  success: boolean;
  scout?: Scout;
  error?: string;
}

