-- Add is_author_verified and source columns to content_warnings table
ALTER TABLE public.content_warnings 
ADD COLUMN IF NOT EXISTS is_author_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS source_url TEXT;

-- Update existing warnings (optional, but good for consistency)
UPDATE public.content_warnings 
SET is_author_verified = FALSE 
WHERE is_author_verified IS NULL;

COMMENT ON COLUMN public.content_warnings.is_author_verified IS 'True if the warning comes from an official author/publisher source';
COMMENT ON COLUMN public.content_warnings.source_url IS 'URL where the warning was verified from (e.g. author website)';

