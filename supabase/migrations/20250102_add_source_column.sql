-- Add source column to content_warnings table
-- This column tracks where the warning came from: 'ai_generated', 'user_submitted', 'author_approved', etc.

ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'ai_generated';

CREATE INDEX IF NOT EXISTS content_warnings_source_idx 
ON public.content_warnings(source);

COMMENT ON COLUMN public.content_warnings.source IS 
'Source of the warning: ai_generated, user_submitted, author_approved, etc.';

-- Set default for existing warnings
UPDATE public.content_warnings
SET source = CASE
  WHEN is_author_verified = true THEN 'author_approved'
  WHEN user_id IS NOT NULL THEN 'user_submitted'
  ELSE 'ai_generated'
END
WHERE source IS NULL;

