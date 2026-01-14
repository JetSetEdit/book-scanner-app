-- Create table for storing RLHF severity overrides
CREATE TABLE IF NOT EXISTS taxonomy_severity_overrides (
  subcategory_id TEXT PRIMARY KEY, -- e.g. "sexual_content.sexual_violence"
  severity_score NUMERIC(3, 1),    -- 0.0 to 10.0
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version TEXT                     -- To track which model version this applies to
);

-- Add RLS policies (optional, but good practice)
ALTER TABLE taxonomy_severity_overrides ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (and anon if needed by client, but likely only server-side)
CREATE POLICY "Allow public read access" ON taxonomy_severity_overrides
  FOR SELECT USING (true);

-- Allow write access only to service role (admin)
CREATE POLICY "Allow service role write access" ON taxonomy_severity_overrides
  FOR ALL USING (auth.role() = 'service_role');
