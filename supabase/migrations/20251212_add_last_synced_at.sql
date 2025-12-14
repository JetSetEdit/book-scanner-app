-- Migration: Add last_synced_at field for TOS-compliant cache expiration
-- This enables the "temporary cache" strategy: data is refreshed every 30 days
-- to comply with Google Books API TOS Section 5.e.1

ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient staleness queries
CREATE INDEX IF NOT EXISTS books_last_synced_at_idx 
ON public.books(last_synced_at) 
WHERE last_synced_at IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.books.last_synced_at IS 
'Timestamp when book metadata was last synced from external APIs. Used to determine cache staleness for TOS compliance. Data older than 30 days is considered stale and should be refreshed.';




