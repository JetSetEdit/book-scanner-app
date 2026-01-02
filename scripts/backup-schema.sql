-- Schema Backup: Before Removing Unused Columns
-- Generated: 2026-01-01
-- This file can be used to restore removed columns if needed

-- Backup classification_rating column definition
-- ALTER TABLE public.books ADD COLUMN IF NOT EXISTS classification_rating TEXT 
--   CHECK (classification_rating IS NULL OR (classification_rating = ANY (ARRAY['G'::text, 'PG'::text, 'M'::text, 'MA15+'::text, 'R18+'::text, 'X18+'::text])));
-- COMMENT ON COLUMN public.books.classification_rating IS 'Australian Classification Board rating (G, PG, M, MA15+, R18+, X18+)';

-- Note: This is a backup of the column definition before removal
-- To restore, uncomment the ALTER TABLE statement above

