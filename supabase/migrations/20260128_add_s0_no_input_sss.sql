-- Allow S0_NO_INPUT in books.sss_level (no input / not yet assessed).
-- Drop existing CHECK and re-add to include S0_NO_INPUT.

ALTER TABLE books DROP CONSTRAINT IF EXISTS books_sss_level_check;

ALTER TABLE books ADD CONSTRAINT books_sss_level_check CHECK (
  sss_level IS NULL OR sss_level IN (
    'S0_NO_INPUT',
    'S1_GENTLE',
    'S2_MILD',
    'S3_MODERATE',
    'S4_INTENSE'
  )
);

COMMENT ON COLUMN books.sss_level IS 'Subtext Suitability Scale: S0_NO_INPUT (no info to assess), S1_GENTLE (low intensity), S2_MILD (some upsetting moments), S3_MODERATE (recurring difficult content), S4_INTENSE (sustained distressing content)';
