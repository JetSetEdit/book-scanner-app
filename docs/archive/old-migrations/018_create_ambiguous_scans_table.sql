-- Create ambiguous_scans table to track when an ISBN returns multiple/ambiguous results
CREATE TABLE IF NOT EXISTS public.ambiguous_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  isbn TEXT NOT NULL,
  original_scan_id UUID, -- Link to the scan that triggered this
  
  -- The candidates found
  candidates JSONB NOT NULL, -- Array of objects: { title, authors, provider, provider_id, cover_url }
  
  -- User selection (if resolved)
  selected_candidate_index INTEGER,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS ambiguous_scans_isbn_idx ON public.ambiguous_scans(isbn);
CREATE INDEX IF NOT EXISTS ambiguous_scans_created_at_idx ON public.ambiguous_scans(created_at DESC);

-- RLS
ALTER TABLE public.ambiguous_scans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read/create (for public scanning)
CREATE POLICY "ambiguous_scans_insert_public"
  ON public.ambiguous_scans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ambiguous_scans_select_public"
  ON public.ambiguous_scans FOR SELECT
  USING (true);

CREATE POLICY "ambiguous_scans_update_public"
  ON public.ambiguous_scans FOR UPDATE
  USING (true);

COMMENT ON TABLE public.ambiguous_scans IS 'Tracks ISBN scans that returned ambiguous or multiple results for user resolution';

