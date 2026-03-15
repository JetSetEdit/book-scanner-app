-- Drop Subtext Suitability Scale (SSS) columns from books.
-- Backup: run SELECT id, isbn, sss_level, sss_notes FROM books WHERE sss_level IS NOT NULL OR sss_notes IS NOT NULL; before applying.
-- See docs/archive/SSS_REMOVAL.md.

ALTER TABLE books
  DROP CONSTRAINT IF EXISTS books_sss_level_check,
  DROP COLUMN IF EXISTS sss_level,
  DROP COLUMN IF EXISTS sss_notes;
