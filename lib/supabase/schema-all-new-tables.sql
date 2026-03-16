-- ============================================
-- Run this in Supabase SQL Editor
-- Creates: chat_sessions + user_preferences tables
-- ============================================

-- Chat Sessions Table (synced from localStorage)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role has full access to chat_sessions" ON chat_sessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Service role has full access to chat_sessions" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- User Preferences Table
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  zip_code TEXT,
  radius INTEGER,
  preferred_makes TEXT,
  preferred_body_types JSONB,
  max_price INTEGER,
  min_year INTEGER,
  preferred_fuel_types JSONB,
  last_location JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role has full access to user_preferences" ON user_preferences;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Service role has full access to user_preferences" ON user_preferences
  FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

