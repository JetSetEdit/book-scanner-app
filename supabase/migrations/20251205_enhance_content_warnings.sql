-- Add new columns to content_warnings table
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS category_id TEXT,
ADD COLUMN IF NOT EXISTS confidence_score FLOAT;

-- Add new columns to ai_audit_logs table
ALTER TABLE public.ai_audit_logs
ADD COLUMN IF NOT EXISTS model_version TEXT,
ADD COLUMN IF NOT EXISTS taxonomy_version TEXT,
ADD COLUMN IF NOT EXISTS pipeline_path TEXT;

-- Create an index on category_id for faster lookups
CREATE INDEX IF NOT EXISTS content_warnings_category_id_idx ON public.content_warnings(category_id);
