-- Subtext Sparks: Gamification system for user engagement
-- This migration creates the tables for badges, sparks, and user progress tracking

-- User Sparks Profile (tracks total sparks and stats per user)
CREATE TABLE IF NOT EXISTS user_sparks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_sparks INTEGER NOT NULL DEFAULT 0,
  scans_count INTEGER NOT NULL DEFAULT 0,
  pivots_count INTEGER NOT NULL DEFAULT 0,
  validations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Badges Definition Table (master list of available badges)
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'pivot_prodigy', 'scan_savant'
  name VARCHAR(100) NOT NULL, -- e.g., 'Pivot Prodigy'
  description TEXT NOT NULL, -- e.g., 'Made 3+ smart pivots away from risky content'
  icon_name VARCHAR(50), -- Icon identifier for UI (e.g., 'shield-check', 'sparkles')
  requirement_type VARCHAR(50) NOT NULL, -- 'pivot_count', 'scan_count', 'validation_count', 'sparks_total'
  requirement_value INTEGER NOT NULL, -- e.g., 3 for pivot_count
  sparks_reward INTEGER NOT NULL DEFAULT 0, -- Sparks awarded when badge is earned
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(code)
);

-- User Badges (junction table: which users have which badges)
CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Sparks History (audit trail of all spark awards)
CREATE TABLE IF NOT EXISTS sparks_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sparks_amount INTEGER NOT NULL,
  action_type VARCHAR(50) NOT NULL, -- 'scan', 'pivot', 'validation', 'badge_earned'
  action_metadata JSONB, -- Additional context (e.g., { "isbn": "...", "book_title": "..." })
  badge_id UUID REFERENCES badges(id) ON DELETE SET NULL, -- If sparks came from badge
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Pivots Tracking (tracks when users decide not to read a book)
CREATE TABLE IF NOT EXISTS user_pivots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  isbn VARCHAR(20) NOT NULL,
  pivot_reason VARCHAR(100), -- Optional: why they pivoted (e.g., 'too_many_severe_warnings')
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, book_id) -- One pivot per user per book
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sparks_user_id ON user_sparks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_sparks_history_user_id ON sparks_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sparks_history_created_at ON sparks_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_pivots_user_id ON user_pivots(user_id);
CREATE INDEX IF NOT EXISTS idx_user_pivots_book_id ON user_pivots(book_id);
CREATE INDEX IF NOT EXISTS idx_badges_code ON badges(code);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_sparks updated_at
CREATE TRIGGER update_user_sparks_updated_at
  BEFORE UPDATE ON user_sparks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user_sparks entry when user signs up
CREATE OR REPLACE FUNCTION create_user_sparks_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_sparks (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create sparks profile on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_sparks_profile();

-- Insert initial badges
INSERT INTO badges (code, name, description, icon_name, requirement_type, requirement_value, sparks_reward) VALUES
  ('pivot_prodigy', 'Pivot Prodigy', 'Made 3+ smart pivots away from risky content', 'shield-check', 'pivot_count', 3, 50),
  ('scan_savant', 'Scan Savant', 'Scanned 10+ books', 'book-open', 'scan_count', 10, 100),
  ('first_scan', 'First Spark', 'Completed your first book scan', 'sparkles', 'scan_count', 1, 10),
  ('safety_advocate', 'Safety Advocate', 'Validated 20+ content warnings', 'thumbs-up', 'validation_count', 20, 75),
  ('spark_collector', 'Spark Collector', 'Earned 500+ total sparks', 'zap', 'sparks_total', 500, 0) -- Meta badge, no additional sparks
ON CONFLICT (code) DO NOTHING;

-- RLS Policies
ALTER TABLE user_sparks ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sparks_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_pivots ENABLE ROW LEVEL SECURITY;

-- Users can read their own sparks data
CREATE POLICY "Users can view their own sparks"
  ON user_sparks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own sparks history"
  ON sparks_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own pivots"
  ON user_pivots FOR SELECT
  USING (auth.uid() = user_id);

-- Badges are public (read-only)
CREATE POLICY "Anyone can view badges"
  ON badges FOR SELECT
  USING (true);

-- Users can insert their own pivots
CREATE POLICY "Users can create their own pivots"
  ON user_pivots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service role can manage all sparks data (for API routes)
-- Note: These policies rely on service role key, not user auth

COMMENT ON TABLE user_sparks IS 'Tracks total sparks and activity counts per user';
COMMENT ON TABLE badges IS 'Master list of available badges users can earn';
COMMENT ON TABLE user_badges IS 'Tracks which badges each user has earned';
COMMENT ON TABLE sparks_history IS 'Audit trail of all spark awards for transparency';
COMMENT ON TABLE user_pivots IS 'Tracks when users decide not to read a book based on warnings';

