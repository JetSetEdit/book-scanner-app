-- Migration: Remove Unused Columns
-- Date: 2026-01-01
-- Purpose: Clean up unused columns from books table
-- 
-- BACKUP: This migration removes columns that are not used in the codebase.
-- To restore, see: scripts/restore-removed-columns.sql

-- Remove classification_rating column (not used in scan-service.ts, only in unused book-service.ts)
-- This column was intended for Australian Classification Board ratings but is never set or read
ALTER TABLE public.books 
DROP COLUMN IF EXISTS classification_rating;

-- Add comment documenting the removal
COMMENT ON TABLE public.books IS 
'Books table. Removed classification_rating column on 2026-01-01 (unused). See restore-removed-columns.sql to restore.';

