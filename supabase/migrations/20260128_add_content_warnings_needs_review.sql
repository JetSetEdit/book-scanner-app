-- Add content_warnings_needs_review flag for enrichment-used-but-zero-warnings safety net.
-- When true, UI can show "Needs review" instead of treating S1_GENTLE as authoritative.

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS content_warnings_needs_review BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN books.content_warnings_needs_review IS 'True when enrichment was used but analysis returned 0 warnings; signals that result may need manual review';