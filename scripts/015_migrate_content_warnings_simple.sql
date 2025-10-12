-- Simple migration to add source and is_author_approved columns
-- Run this in your Supabase SQL editor

-- Step 1: Add source column
ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'ai_generated';

-- Step 2: Add is_author_approved column  
ALTER TABLE content_warnings ADD COLUMN IF NOT EXISTS is_author_approved BOOLEAN DEFAULT FALSE;

-- Step 3: Update existing warnings to have proper source tracking
UPDATE content_warnings 
SET 
    source = CASE 
        WHEN user_id IS NULL THEN 'ai_generated'
        ELSE 'user_submitted'
    END,
    is_author_approved = FALSE
WHERE source IS NULL OR source = '';

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_content_warnings_source ON content_warnings(source);
CREATE INDEX IF NOT EXISTS idx_content_warnings_author_approved ON content_warnings(is_author_approved);

-- Step 5: Show migration results
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_warnings,
    COUNT(CASE WHEN source = 'ai_generated' THEN 1 END) as ai_generated,
    COUNT(CASE WHEN source = 'user_submitted' THEN 1 END) as user_submitted,
    COUNT(CASE WHEN is_author_approved = true THEN 1 END) as author_approved
FROM content_warnings;
