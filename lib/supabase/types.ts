/**
 * Supabase Database Types
 * 
 * Tables:
 * - users: Synced from Clerk, stores user profile and preferences
 * - user_activities: Tracks all user actions (searches, calls, scouts, etc.)
 * - user_usage: Daily/monthly usage counts per feature for rate limiting
 */

// Activity types
export type ActivityType = 
  | "search"
  | "call"
  | "scout_create"
  | "scout_delete"
  | "chat"
  | "listing_view"
  | "sign_in"
  | "sign_up";

// Users table
export interface UserRow {
  id: string; // Clerk user ID
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
  sign_in_count: number;
  metadata: Record<string, unknown> | null;
}

export interface UserInsert {
  id: string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  last_sign_in_at?: string | null;
  sign_in_count?: number;
  metadata?: Record<string, unknown> | null;
}

export interface UserUpdate {
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  image_url?: string | null;
  updated_at?: string;
  last_sign_in_at?: string | null;
  sign_in_count?: number;
  metadata?: Record<string, unknown> | null;
}

// User activities table
export interface ActivityRow {
  id: string;
  user_id: string;
  type: ActivityType;
  metadata: Record<string, unknown> | null;
  created_at: string;
  ip_address: string | null;
  user_agent: string | null;
}

export interface ActivityInsert {
  id?: string;
  user_id: string;
  type: ActivityType;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  ip_address?: string | null;
  user_agent?: string | null;
}

export interface ActivityUpdate {
  metadata?: Record<string, unknown> | null;
}

// User usage table (for tracking daily/monthly limits)
export interface UsageRow {
  id: string;
  user_id: string;
  feature: string; // e.g., "search", "call", "scout_create"
  period: string; // e.g., "2026-01-21" for daily, "2026-01" for monthly
  count: number;
  created_at: string;
  updated_at: string;
}

export interface UsageInsert {
  id?: string;
  user_id: string;
  feature: string;
  period: string;
  count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface UsageUpdate {
  count?: number;
  updated_at?: string;
}

// Helper types for the application
export interface UserProfile {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastSignInAt: Date | null;
  signInCount: number;
}

export interface ActivityRecord {
  id: string;
  userId: string;
  type: ActivityType;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface UsageRecord {
  userId: string;
  feature: string;
  period: string;
  count: number;
}

// Feedback types
export type FeedbackCategory = 
  | "bug"
  | "feature"
  | "improvement"
  | "praise"
  | "other";

export type FeedbackSentiment = 1 | 2 | 3 | 4 | 5;

export interface FeedbackRow {
  id: string;
  user_id: string | null;
  email: string | null;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  message: string;
  page_url: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface FeedbackInsert {
  id?: string;
  user_id?: string | null;
  email?: string | null;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  message: string;
  page_url?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
}

export interface FeedbackRecord {
  id: string;
  userId: string | null;
  email: string | null;
  category: FeedbackCategory;
  sentiment: FeedbackSentiment;
  message: string;
  pageUrl: string | null;
  createdAt: Date;
}
