-- Run this in Supabase SQL Editor to add the user_preferences table

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

CREATE POLICY "Service role has full access to user_preferences" ON user_preferences
  FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS update_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

