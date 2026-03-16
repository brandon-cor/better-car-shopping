-- ============================================
-- FIX CHAT VIEWS - Run this standalone
-- Fixes type casting issues with JSONB
-- ============================================

-- Drop existing views first to avoid conflicts
DROP VIEW IF EXISTS chat_full_log CASCADE;
DROP VIEW IF EXISTS chat_conversations_formatted CASCADE;
DROP VIEW IF EXISTS chat_messages_expanded CASCADE;
DROP VIEW IF EXISTS chat_sessions_with_users CASCADE;

-- ============================================
-- VIEW 1: chat_sessions_with_users
-- Each row = one complete conversation
-- ============================================
CREATE VIEW chat_sessions_with_users AS
SELECT 
  cs.id AS session_id,
  cs.title AS chat_title,
  cs.created_at AS started_at,
  cs.updated_at AS last_message_at,
  jsonb_array_length(cs.messages) AS total_messages,
  cs.messages AS full_conversation,
  u.id AS user_id,
  u.email,
  CONCAT(u.first_name, ' ', u.last_name) AS full_name,
  u.image_url AS avatar,
  u.sign_in_count
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
ORDER BY cs.updated_at DESC;

-- ============================================
-- VIEW 2: chat_messages_expanded
-- Each row = one message with user details
-- ============================================
CREATE VIEW chat_messages_expanded AS
SELECT 
  cs.id AS session_id,
  cs.title AS chat_title,
  msg_idx AS message_number,
  (cs.messages->msg_idx)->>'role' AS message_role,
  CASE 
    WHEN (cs.messages->msg_idx)->>'role' = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
    ELSE 'Vehique AI'
  END AS speaker_name,
  CASE 
    WHEN (cs.messages->msg_idx)->>'role' = 'user' THEN u.email
    ELSE 'system@vehique.ai'
  END AS speaker_email,
  (cs.messages->msg_idx)->>'content' AS message_content,
  (cs.messages->msg_idx)->'sources' AS sources,
  u.id AS user_id,
  u.email AS conversation_owner_email,
  CONCAT(u.first_name, ' ', u.last_name) AS conversation_owner_name,
  u.image_url AS user_avatar
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
CROSS JOIN LATERAL generate_series(0, jsonb_array_length(cs.messages) - 1) AS msg_idx
ORDER BY cs.updated_at DESC, cs.id, msg_idx;

-- ============================================
-- VIEW 3: chat_full_log
-- Complete conversation log with speaker details
-- ============================================
CREATE VIEW chat_full_log AS
SELECT 
  cs.id AS conversation_id,
  cs.title AS conversation_title,
  cs.created_at AS conversation_started,
  cs.updated_at AS last_activity,
  msg_idx + 1 AS turn_number,
  (cs.messages->msg_idx)->>'role' AS message_role,
  CASE 
    WHEN (cs.messages->msg_idx)->>'role' = 'user' THEN CONCAT(u.first_name, ' ', u.last_name)
    ELSE 'Vehique AI'
  END AS speaker_name,
  CASE 
    WHEN (cs.messages->msg_idx)->>'role' = 'user' THEN u.email
    ELSE 'system@vehique.ai'
  END AS speaker_email,
  (cs.messages->msg_idx)->>'content' AS message_text,
  (cs.messages->msg_idx)->'sources' AS sources_data,
  u.id AS user_id,
  u.email AS conversation_owner_email,
  CONCAT(u.first_name, ' ', u.last_name) AS conversation_owner_name,
  u.image_url AS user_avatar
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
CROSS JOIN LATERAL generate_series(0, jsonb_array_length(cs.messages) - 1) AS msg_idx
WHERE jsonb_array_length(cs.messages) > 0
ORDER BY cs.updated_at DESC, cs.id, msg_idx;

-- ============================================
-- VIEW 4: chat_conversations_formatted
-- Summary with all messages in JSON
-- ============================================
CREATE VIEW chat_conversations_formatted AS
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
  cs.messages AS all_messages_json
FROM chat_sessions cs
JOIN users u ON cs.user_id = u.id
ORDER BY cs.updated_at DESC;

-- ============================================
-- Grant access to service role
-- ============================================
GRANT SELECT ON chat_sessions_with_users TO service_role;
GRANT SELECT ON chat_messages_expanded TO service_role;
GRANT SELECT ON chat_full_log TO service_role;
GRANT SELECT ON chat_conversations_formatted TO service_role;

-- ============================================
-- Success message
-- ============================================
-- All chat views created successfully!
-- 
-- Available views:
-- 1. chat_sessions_with_users - Grouped conversations
-- 2. chat_messages_expanded - Each message as a row with speaker details
-- 3. chat_full_log - Full conversation log with user name/email
-- 4. chat_conversations_formatted - Summary with JSON messages

