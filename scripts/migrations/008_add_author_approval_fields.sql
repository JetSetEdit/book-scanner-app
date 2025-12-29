-- Add author approval fields to content_warnings table
-- This allows us to mark warnings as author-approved vs user-submitted

-- Add is_author_approved column
ALTER TABLE public.content_warnings 
ADD COLUMN IF NOT EXISTS is_author_approved BOOLEAN DEFAULT FALSE;

-- Add source column to track where the warning came from
ALTER TABLE public.content_warnings 
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'user_submitted';

-- Add comment to explain the new fields
COMMENT ON COLUMN public.content_warnings.is_author_approved IS 'Whether this warning was provided by the author/publisher (true) or submitted by a user (false)';
COMMENT ON COLUMN public.content_warnings.source IS 'Source of the warning: author_website, publisher, user_submitted, etc.';

-- Update RLS policies to allow author-approved warnings to be inserted without user_id
-- (since they don't have a user_id, they're system-generated)

-- Drop the existing insert policy
DROP POLICY IF EXISTS "content_warnings_insert_anonymous" ON public.content_warnings;

-- Create new policy that allows both user submissions and author-approved warnings
CREATE POLICY "content_warnings_insert_all"
  ON public.content_warnings FOR INSERT
  TO anon
  WITH CHECK (
    -- Allow user submissions (with user_id)
    (user_id IS NOT NULL) OR
    -- Allow author-approved warnings (without user_id but with is_author_approved = true)
    (user_id IS NULL AND is_author_approved = true)
  );

-- Create index for author-approved warnings
CREATE INDEX IF NOT EXISTS content_warnings_author_approved_idx 
ON public.content_warnings(is_author_approved);

-- Create index for source
CREATE INDEX IF NOT EXISTS content_warnings_source_idx 
ON public.content_warnings(source);


