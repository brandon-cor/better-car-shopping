/**
 * Vehique Autopilot Module
 * 
 * Exports all types, utilities, and API client functions for the Autopilot feature.
 */

// Types
export * from "./types";

// Schema and utilities
export {
  VEHICLE_OUTPUT_SCHEMA,
  buildScoutQuery,
  intervalToSeconds,
  formatInterval,
} from "./schema";

// API Client
export {
  createScout,
  listScouts,
  getScout,
  getScoutUpdates,
  pauseScout,
  restartScout,
  deleteScout,
  completeScout,
} from "./client";

