-- Manually create ai_audit_logs table if it doesn't exist (Force run)
CREATE TABLE IF NOT EXISTS public.ai_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  scan_id UUID, 
  isbn TEXT NOT NULL,
  
  -- AI Decision Details
  decision_type TEXT NOT NULL CHECK (decision_type IN ('warnings_generated', 'no_warnings', 'search_performed', 'metadata_thin')),
  warnings_count INTEGER DEFAULT 0,
  
  -- AI Reasoning
  ai_reasoning TEXT NOT NULL, 
  confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
  
  -- Context
  book_title TEXT,
  book_author TEXT,
  description_length INTEGER, 
  had_thin_metadata BOOLEAN DEFAULT FALSE,
  used_web_search BOOLEAN DEFAULT FALSE,
  
  -- Raw AI Response
  raw_ai_response JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes 
CREATE INDEX IF NOT EXISTS ai_audit_logs_book_id_idx ON public.ai_audit_logs(book_id);
CREATE INDEX IF NOT EXISTS ai_audit_logs_isbn_idx ON public.ai_audit_logs(isbn);
CREATE INDEX IF NOT EXISTS ai_audit_logs_created_at_idx ON public.ai_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_audit_logs_decision_type_idx ON public.ai_audit_logs(decision_type);

-- Enable RLS
ALTER TABLE public.ai_audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can read audit logs
CREATE POLICY "ai_audit_logs_select_all"
  ON public.ai_audit_logs FOR SELECT
  USING (true);

-- Force reload schema cache
NOTIFY pgrst, 'reload config';

