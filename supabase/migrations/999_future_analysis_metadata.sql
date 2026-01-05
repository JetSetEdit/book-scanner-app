-- Future Migration: Analysis Metadata Tracking
-- 
-- This migration is OPTIONAL and for future use.
-- It adds a JSONB column to track how books were analyzed,
-- including whether web search enrichment was used.
--
-- To apply this migration in the future:
-- 1. Review the schema changes
-- 2. Test in a development environment
-- 3. Run: supabase migration up
--
-- DO NOT apply this migration without reviewing first.

-- Add analysis_metadata column to books table
-- This will store information about how the book was analyzed
ALTER TABLE books 
ADD COLUMN IF NOT EXISTS analysis_metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for querying by metadata
CREATE INDEX IF NOT EXISTS idx_books_analysis_metadata 
ON books USING GIN (analysis_metadata);

-- Example of what would be stored:
-- {
--   "source": "web_enriched",
--   "enrichment_version": "1.0",
--   "search_queries": ["Happy Place Emily Henry content warnings"],
--   "enrichment_triggered": true,
--   "warnings_before_enrichment": 2,
--   "warnings_after_enrichment": 5,
--   "enrichment_sources": ["commonsensemedia.org", "goodreads.com"]
-- }

-- Optional: Add comment explaining the column
COMMENT ON COLUMN books.analysis_metadata IS 
'Stores metadata about how the book was analyzed, including whether web search enrichment was used. Useful for debugging and analytics.';

