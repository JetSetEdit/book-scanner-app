-- Add reasoning column to content_warnings table
-- This column will store the AI's reasoning for generating each warning

-- Step 1: Add reasoning column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'content_warnings' AND column_name = 'reasoning') THEN
        ALTER TABLE content_warnings 
        ADD COLUMN reasoning TEXT;
    END IF;
END $$;

-- Step 2: Add comment for documentation
COMMENT ON COLUMN content_warnings.reasoning IS 'AI reasoning for why this content warning was generated';

-- Step 3: Show migration results
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_warnings,
    COUNT(CASE WHEN reasoning IS NOT NULL THEN 1 END) as warnings_with_reasoning,
    COUNT(CASE WHEN reasoning IS NULL THEN 1 END) as warnings_without_reasoning
FROM content_warnings;
