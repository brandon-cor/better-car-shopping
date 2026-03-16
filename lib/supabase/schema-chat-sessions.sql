-- Run this in Supabase SQL Editor to add the chat_sessions table
-- (Only needed if you already ran the original schema)

-- Chat History Table (synced from localStorage)
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

-- Drop policy if exists before creating (to avoid duplicate error)
DO $$ BEGIN
  DROP POLICY IF EXISTS "Service role has full access to chat_sessions" ON chat_sessions;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE POLICY "Service role has full access to chat_sessions" ON chat_sessions
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_chat_sessions_updated_at ON chat_sessions;
CREATE TRIGGER update_chat_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

