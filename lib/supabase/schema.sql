-- Supabase Schema for Vehique User Tracking
-- Run this in your Supabase SQL Editor to create the required tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, -- Clerk user ID
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ,
  sign_in_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- User activities table (tracks all user actions)
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('search', 'call', 'scout_create', 'scout_delete', 'chat', 'listing_view', 'sign_in', 'sign_up')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Create indexes for activity queries
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON user_activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_activities_user_type ON user_activities(user_id, type);

-- User usage table (daily/monthly usage counts for rate limiting)
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- e.g., 'search', 'call', 'scout_create'
  period TEXT NOT NULL, -- e.g., '2026-01-21' for daily, '2026-01' for monthly
  count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature, period)
);

-- Create indexes for usage queries
CREATE INDEX IF NOT EXISTS idx_usage_user_id ON user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_feature ON user_usage(feature);
CREATE INDEX IF NOT EXISTS idx_usage_period ON user_usage(period);
CREATE INDEX IF NOT EXISTS idx_usage_user_feature_period ON user_usage(user_id, feature, period);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at on users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to auto-update updated_at on user_usage table
DROP TRIGGER IF EXISTS update_user_usage_updated_at ON user_usage;
CREATE TRIGGER update_user_usage_updated_at
  BEFORE UPDATE ON user_usage
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Allow service role to access all data
CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to activities" ON user_activities
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to usage" ON user_usage
  FOR ALL USING (auth.role() = 'service_role');

-- Useful views for analytics

-- Daily active users
CREATE OR REPLACE VIEW daily_active_users AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(*) as total_activities
FROM user_activities
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Feature usage stats
CREATE OR REPLACE VIEW feature_usage_stats AS
SELECT 
  feature,
  period,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(count) as total_usage
FROM user_usage
WHERE period >= TO_CHAR(NOW() - INTERVAL '30 days', 'YYYY-MM-DD')
GROUP BY feature, period
ORDER BY period DESC, feature;

-- User activity summary
CREATE OR REPLACE VIEW user_activity_summary AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.created_at,
  u.last_sign_in_at,
  u.sign_in_count,
  COUNT(a.id) as total_activities,
  MAX(a.created_at) as last_activity_at
FROM users u
LEFT JOIN user_activities a ON u.id = a.user_id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.created_at, u.last_sign_in_at, u.sign_in_count;

-- Grant access to views for service role
GRANT SELECT ON daily_active_users TO service_role;
GRANT SELECT ON feature_usage_stats TO service_role;
GRANT SELECT ON user_activity_summary TO service_role;

-- ============================================
-- Chat History Table (synced from localStorage)
-- ============================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY, -- session_xxxxx format from client
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at);

-- RLS for chat sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to chat_sessions" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- User Favorites/Showroom Table
-- ============================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  vehicle_id TEXT NOT NULL,
  vehicle_data JSONB NOT NULL, -- Full vehicle data (title, price, image, etc.)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);

-- RLS for user favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to user_favorites" ON user_favorites
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- User Scouts Table (maps Yutori scout IDs to users)
-- ============================================

CREATE TABLE IF NOT EXISTS user_scouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scout_id TEXT NOT NULL UNIQUE, -- Yutori scout ID
  query TEXT NOT NULL,
  interval TEXT NOT NULL DEFAULT 'daily',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ -- Soft delete
);

CREATE INDEX IF NOT EXISTS idx_user_scouts_user_id ON user_scouts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scouts_scout_id ON user_scouts(scout_id);
CREATE INDEX IF NOT EXISTS idx_user_scouts_active ON user_scouts(user_id) WHERE deleted_at IS NULL;

-- RLS for user scouts
ALTER TABLE user_scouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to user_scouts" ON user_scouts
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- ADMIN VIEWS - Easy viewing with user details
-- ============================================

-- Chat Sessions with User Details (for admin dashboard)
-- Each row = one complete conversation with all its messages grouped together
CREATE OR REPLACE VIEW chat_sessions_with_users AS
SELECT 
  cs.id AS session_id,
  cs.title AS chat_title,
  cs.created_at AS started_at,
  cs.updated_at AS last_message_at,
  jsonb_array_length(cs.messages) AS total_messages,
  -- First user message (the query that started the chat)
  (SELECT m->>'content' FROM jsonb_array_elements(cs.messages) AS m WHERE m->>'role' = 'user' LIMIT 1) AS first_query,
  -- Last message preview
  (cs.messages->-1)->>'content' AS last_message_preview,
  (cs.messages->-1)->>'role' AS last_message_role,
  -- All messages in this conversation (JSONB array)
  cs.messages AS full_conversation,
  -- User details
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.image_url AS avatar,
  u.sign_in_count
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
ORDER BY cs.updated_at DESC;

-- Expanded view: Each message as a separate row (for detailed analysis)
-- Shows EVERY user question and AI response with full content
CREATE OR REPLACE VIEW chat_messages_expanded AS
SELECT 
  cs.id AS session_id,
  cs.title AS chat_title,
  msg.ordinality AS message_number,
  msg.value->>'role' AS sender_role,
  msg.value->>'content' AS full_message_content,
  to_timestamp((msg.value->>'timestamp')::bigint / 1000) AS sent_at,
  msg.value->'sources' AS ai_sources,
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
CROSS JOIN LATERAL jsonb_array_elements(cs.messages) WITH ORDINALITY AS msg(value, ordinality)
ORDER BY cs.updated_at DESC, msg.ordinality;

-- Complete Chat Log View - Shows the full conversation flow
-- Each row = one message with complete content and actual user details
CREATE OR REPLACE VIEW chat_full_log AS
SELECT 
  cs.id AS conversation_id,
  cs.title AS conversation_title,
  cs.created_at AS conversation_started,
  cs.updated_at AS last_activity,
  msg.ordinality AS turn_number,
  msg.value->>'role' AS message_role,
  -- Show actual user name or Vehique AI
  CASE 
    WHEN msg.value->>'role' = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
    ELSE 'Vehique AI'
  END AS speaker_name,
  -- Show actual user email or system
  CASE 
    WHEN msg.value->>'role' = 'user' THEN u.email
    ELSE 'system@vehique.ai'
  END AS speaker_email,
  msg.value->>'content' AS message_text,
  CASE 
    WHEN msg.value->'sources' IS NOT NULL AND jsonb_array_length(msg.value->'sources') > 0 
    THEN jsonb_array_length(msg.value->'sources')
    ELSE 0
  END AS sources_count,
  msg.value->'sources' AS sources_data,
  -- Always include user info for context
  u.id AS user_id,
  u.email AS conversation_owner_email,
  CONCAT(u.first_name, ' ', u.last_name) AS conversation_owner_name,
  u.image_url AS user_avatar
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
CROSS JOIN LATERAL jsonb_array_elements(cs.messages) WITH ORDINALITY AS msg(value, ordinality)
ORDER BY cs.updated_at DESC, cs.id, msg.ordinality;

-- Conversation Summary with all messages as formatted text
-- Shows actual user name in the transcript
CREATE OR REPLACE VIEW chat_conversations_formatted AS
SELECT 
  cs.id AS conversation_id,
  cs.title,
  u.id AS user_id,
  u.email AS user_email,
  CONCAT(u.first_name, ' ', u.last_name) AS user_name,
  u.image_url AS user_avatar,
  cs.created_at AS started_at,
  cs.updated_at AS last_message_at,
  jsonb_array_length(cs.messages) AS total_turns,
  -- Full messages array (contains ALL user questions and AI responses)
  cs.messages AS all_messages_json,
  -- Formatted readable log with actual user name
  (
    SELECT string_agg(
      CASE 
        WHEN m->>'role' = 'user' THEN E'\n[' || CONCAT(u.first_name, ' ', u.last_name) || ']: ' || (m->>'content')
        ELSE E'\n[Vehique AI]: ' || LEFT(m->>'content', 500) || CASE WHEN LENGTH(m->>'content') > 500 THEN '...' ELSE '' END
      END,
      E'\n---'
      ORDER BY ordinality
    )
    FROM jsonb_array_elements(cs.messages) WITH ORDINALITY AS m(value, ordinality)
  ) AS conversation_transcript
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
ORDER BY cs.updated_at DESC;

-- User Activities with User Details (for admin dashboard)
CREATE OR REPLACE VIEW activities_with_users AS
SELECT 
  a.id AS activity_id,
  a.type AS activity_type,
  a.metadata,
  a.created_at,
  a.ip_address,
  a.user_agent,
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.image_url AS avatar
FROM user_activities a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC;

-- User Favorites with User Details
CREATE OR REPLACE VIEW favorites_with_users AS
SELECT 
  f.id AS favorite_id,
  f.vehicle_id,
  f.vehicle_data->>'title' AS vehicle_title,
  f.vehicle_data->>'price' AS vehicle_price,
  f.created_at,
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name
FROM user_favorites f
JOIN users u ON f.user_id = u.id
ORDER BY f.created_at DESC;

-- User Scouts with User Details
CREATE OR REPLACE VIEW scouts_with_users AS
SELECT 
  s.id,
  s.scout_id,
  s.query,
  s.interval,
  s.created_at,
  s.deleted_at,
  CASE WHEN s.deleted_at IS NULL THEN 'active' ELSE 'deleted' END AS status,
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name
FROM user_scouts s
JOIN users u ON s.user_id = u.id
ORDER BY s.created_at DESC;

-- User Usage with User Details (rate limiting)
CREATE OR REPLACE VIEW usage_with_users AS
SELECT 
  uu.id,
  uu.feature,
  uu.period,
  uu.count,
  uu.created_at,
  uu.updated_at,
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name
FROM user_usage uu
JOIN users u ON uu.user_id = u.id
ORDER BY uu.updated_at DESC;

-- Complete User Dashboard View (all user data in one place)
CREATE OR REPLACE VIEW user_dashboard AS
SELECT 
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.image_url AS avatar,
  u.created_at AS joined_at,
  u.last_sign_in_at,
  u.sign_in_count,
  (SELECT COUNT(*) FROM chat_sessions WHERE user_id = u.id) AS total_chats,
  (SELECT COUNT(*) FROM user_favorites WHERE user_id = u.id) AS total_favorites,
  (SELECT COUNT(*) FROM user_scouts WHERE user_id = u.id AND deleted_at IS NULL) AS active_scouts,
  (SELECT COUNT(*) FROM user_activities WHERE user_id = u.id) AS total_activities,
  (SELECT type FROM user_activities WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_activity_type,
  (SELECT created_at FROM user_activities WHERE user_id = u.id ORDER BY created_at DESC LIMIT 1) AS last_activity_at
FROM users u
ORDER BY u.last_sign_in_at DESC NULLS LAST;

-- Grant access to all views
GRANT SELECT ON chat_sessions_with_users TO service_role;
GRANT SELECT ON chat_messages_expanded TO service_role;
GRANT SELECT ON chat_full_log TO service_role;
GRANT SELECT ON chat_conversations_formatted TO service_role;
GRANT SELECT ON activities_with_users TO service_role;
GRANT SELECT ON favorites_with_users TO service_role;
GRANT SELECT ON scouts_with_users TO service_role;
GRANT SELECT ON usage_with_users TO service_role;
GRANT SELECT ON user_dashboard TO service_role;

