-- Add Subtext Suitability Scale (SSS) rating fields to books table
-- SSS is a reader-focused emotional intensity scale, independent of ACB classification

ALTER TABLE books
  ADD COLUMN IF NOT EXISTS sss_level TEXT CHECK (sss_level IN ('S1_GENTLE', 'S2_MILD', 'S3_MODERATE', 'S4_INTENSE')),
  ADD COLUMN IF NOT EXISTS sss_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN books.sss_level IS 'Subtext Suitability Scale: S1_GENTLE (low intensity), S2_MILD (some upsetting moments), S3_MODERATE (recurring difficult content), S4_INTENSE (sustained distressing content)';
COMMENT ON COLUMN books.sss_notes IS 'Internal notes justifying the SSS level assignment';
