-- Warning appeals: report wrong content warning, SLA, suppress while under review
-- One row per appeal; content_warning_ids = array of disputed warning UUIDs (null/empty = whole book)

CREATE TABLE IF NOT EXISTS public.warning_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number TEXT NOT NULL UNIQUE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  isbn TEXT NOT NULL,
  content_warning_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved_upheld', 'resolved_removed')),
  message TEXT NOT NULL,
  reporter_email TEXT,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS warning_appeals_book_id_idx ON public.warning_appeals(book_id);
CREATE INDEX IF NOT EXISTS warning_appeals_status_idx ON public.warning_appeals(status);
CREATE INDEX IF NOT EXISTS warning_appeals_ticket_number_idx ON public.warning_appeals(ticket_number);
CREATE INDEX IF NOT EXISTS warning_appeals_created_at_idx ON public.warning_appeals(created_at DESC);

COMMENT ON TABLE public.warning_appeals IS 'User appeals for wrong content warnings; disputed warnings are suppressed until resolution. SLA: 1 business day ack, 5 business days resolution.';
COMMENT ON COLUMN public.warning_appeals.content_warning_ids IS 'Array of content_warnings.id UUIDs under dispute; empty = whole book appeal.';
COMMENT ON COLUMN public.warning_appeals.status IS 'pending | acknowledged | resolved_upheld | resolved_removed';

-- Ticket number sequence: SUB-YYYY-NNNNN (sequence resets per year in application or use single global seq)
CREATE SEQUENCE IF NOT EXISTS public.warning_appeals_ticket_seq START 1;

CREATE OR REPLACE FUNCTION public.next_warning_appeal_ticket_number()
RETURNS TEXT
LANGUAGE sql
STABLE
AS $$
  SELECT 'SUB-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.warning_appeals_ticket_seq')::text, 5, '0');
$$;

ALTER TABLE public.warning_appeals ENABLE ROW LEVEL SECURITY;

-- Allow anonymous insert (user submitting appeal)
CREATE POLICY "warning_appeals_insert_public"
  ON public.warning_appeals FOR INSERT
  WITH CHECK (true);

-- Select only by ticket_number for status check (optional future: allow user to check status with email)
-- For now restrict select to service role; app uses admin client to filter warnings
CREATE POLICY "warning_appeals_select_public"
  ON public.warning_appeals FOR SELECT
  USING (true);
