/**
 * Supabase Module Exports
 */

// Client
export { getSupabase, isSupabaseConfigured, resetSupabase } from "./client";

// Types
export type {
  UserRow,
  UserProfile,
  ActivityType,
  ActivityRow,
  ActivityRecord,
  UsageRow,
  UsageRecord,
} from "./types";

// User management
export {
  upsertUser,
  getUser,
  recordSignIn,
  deleteUser,
  ensureUser,
} from "./users";

// Activity tracking
export {
  trackActivity,
  trackActivityAsync,
  incrementUsage,
  getUsage,
  getAllUsage,
  getRecentActivities,
  getActivityStats,
  trackSearch,
  trackCall,
  trackScoutCreate,
  trackListingView,
} from "./activity";

// Chat history sync
export {
  syncChatSessions,
  getChatSessions,
  saveChatSession,
  deleteChatSession,
} from "./chat";

export type { ChatSession, ChatMessage, ChatSessionRow } from "./chat";

// Preferences sync
export {
  savePreferences,
  getPreferences,
  deletePreferences,
} from "./preferences";

export type { UserPreferences } from "./preferences";

// Scouts management
export {
  registerScout,
  getUserScoutIds,
  isUserScout,
  deleteUserScout,
  getUserScouts,
} from "./scouts";
