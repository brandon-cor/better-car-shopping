-- Ensure User Favorites Table Exists
-- Run this in your Supabase SQL Editor

-- First ensure the extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create user_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  vehicle_id TEXT NOT NULL,
  vehicle_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vehicle_id)
);

-- Add foreign key if users table exists (might already exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_favorites_user_id_fkey'
  ) THEN
    BEGIN
      ALTER TABLE user_favorites 
      ADD CONSTRAINT user_favorites_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not add foreign key constraint, users table may not exist';
    END;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON user_favorites(created_at);
CREATE INDEX IF NOT EXISTS idx_user_favorites_vehicle_id ON user_favorites(vehicle_id);

-- Enable RLS
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "Service role has full access to user_favorites" ON user_favorites;
CREATE POLICY "Service role has full access to user_favorites" ON user_favorites
  FOR ALL USING (auth.role() = 'service_role');

-- Grant access
GRANT ALL ON user_favorites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_favorites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_favorites TO anon;

-- Verify the table exists
SELECT 'user_favorites table ready' AS status, 
       (SELECT COUNT(*) FROM user_favorites) AS current_rows;

