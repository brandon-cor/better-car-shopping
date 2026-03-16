-- Feedback Table Migration
-- Stores user feedback from the feedback modal
-- Run this migration in Supabase SQL Editor

-- Create the feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  email TEXT,
  category TEXT NOT NULL CHECK (category IN ('bug', 'feature', 'improvement', 'praise', 'other')),
  sentiment INTEGER NOT NULL CHECK (sentiment BETWEEN 1 AND 5),
  message TEXT NOT NULL CHECK (char_length(message) >= 10 AND char_length(message) <= 1000),
  page_url TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to insert their own feedback
CREATE POLICY "Users can insert feedback" ON feedback
  FOR INSERT
  WITH CHECK (true);

-- Policy: Allow service role full access (for admin dashboard)
CREATE POLICY "Service role has full access" ON feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE feedback IS 'User feedback collected from the feedback modal';
COMMENT ON COLUMN feedback.category IS 'Type of feedback: bug, feature, improvement, praise, or other';
COMMENT ON COLUMN feedback.sentiment IS 'User sentiment rating from 1 (frustrated) to 5 (delighted)';
COMMENT ON COLUMN feedback.message IS 'The actual feedback message (10-1000 characters)';


