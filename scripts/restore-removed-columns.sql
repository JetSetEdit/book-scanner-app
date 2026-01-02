-- Restore Removed Columns
-- Date: 2026-01-01
-- Purpose: Restore columns that were removed in migration 20260101_remove_unused_columns.sql
-- 
-- This script can be used to restore columns if needed in the future

-- Restore classification_rating column
ALTER TABLE public.books 
ADD COLUMN IF NOT EXISTS classification_rating TEXT 
  CHECK (classification_rating IS NULL OR (classification_rating = ANY (ARRAY['G'::text, 'PG'::text, 'M'::text, 'MA15+'::text, 'R18+'::text, 'X18+'::text])));

COMMENT ON COLUMN public.books.classification_rating IS 
'Australian Classification Board rating (G, PG, M, MA15+, R18+, X18+). Restored from backup.';

