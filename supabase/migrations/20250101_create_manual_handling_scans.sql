-- Create table to track scans that require manual handling
CREATE TABLE IF NOT EXISTS public.manual_handling_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn TEXT NOT NULL,
  scan_id UUID, -- Link to scans table if available
  reason TEXT NOT NULL CHECK (reason IN ('not_found', 'ambiguous', 'analysis_failed', 'description_too_minimal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'dismissed')),
  
  -- Context data
  error_message TEXT,
  candidates JSONB, -- For ambiguous scans
  metadata JSONB, -- Additional context (title, author if available, etc.)
  
  -- Resolution
  resolved_by TEXT, -- GitHub username or identifier
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS manual_handling_scans_status_idx ON public.manual_handling_scans(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS manual_handling_scans_isbn_idx ON public.manual_handling_scans(isbn);
CREATE INDEX IF NOT EXISTS manual_handling_scans_created_at_idx ON public.manual_handling_scans(created_at DESC);
CREATE INDEX IF NOT EXISTS manual_handling_scans_reason_idx ON public.manual_handling_scans(reason);

-- RLS
ALTER TABLE public.manual_handling_scans ENABLE ROW LEVEL SECURITY;

-- Allow service role to insert/update (via admin client)
-- Public read access for transparency
CREATE POLICY "manual_handling_scans_select_public"
  ON public.manual_handling_scans FOR SELECT
  USING (true);

COMMENT ON TABLE public.manual_handling_scans IS 'Tracks scans that require manual developer intervention';
COMMENT ON COLUMN public.manual_handling_scans.reason IS 'Why manual handling is needed: not_found, ambiguous, analysis_failed, description_too_minimal';
COMMENT ON COLUMN public.manual_handling_scans.status IS 'pending, in_progress, resolved, dismissed';

