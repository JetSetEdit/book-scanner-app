-- Migration script to add missing columns and update existing data
-- This script addresses the schema inconsistencies found in the database

-- Step 1: Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add source column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_warnings' 
        AND column_name = 'source'
    ) THEN
        ALTER TABLE content_warnings 
        ADD COLUMN source VARCHAR(50) DEFAULT 'user_submitted';
    END IF;

    -- Add is_author_approved column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'content_warnings' 
        AND column_name = 'is_author_approved'
    ) THEN
        ALTER TABLE content_warnings 
        ADD COLUMN is_author_approved BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Step 2: Update existing warnings to have proper source tracking
-- Mark warnings with user_id as user_submitted (community-submitted)
-- Mark warnings without user_id as ai_generated (system-generated)
UPDATE content_warnings 
SET 
    source = CASE 
        WHEN user_id IS NULL THEN 'ai_generated'
        ELSE 'user_submitted'
    END,
    is_author_approved = FALSE
WHERE source IS NULL OR source = '';

-- Step 3: Create index on source column for better performance
CREATE INDEX IF NOT EXISTS idx_content_warnings_source 
ON content_warnings(source);

-- Step 4: Create index on is_author_approved column
CREATE INDEX IF NOT EXISTS idx_content_warnings_author_approved 
ON content_warnings(is_author_approved);

-- Step 5: Update RLS policies to handle the new columns
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all content warnings" ON content_warnings;
DROP POLICY IF EXISTS "Users can insert content warnings" ON content_warnings;
DROP POLICY IF EXISTS "Users can update their own content warnings" ON content_warnings;

-- Recreate policies with proper column handling
CREATE POLICY "Users can view all content warnings" ON content_warnings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert content warnings" ON content_warnings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own content warnings" ON content_warnings
    FOR UPDATE USING (
        user_id IS NULL OR 
        user_id = auth.uid() OR 
        auth.role() = 'service_role'
    );

-- Step 6: Add comments for documentation
COMMENT ON COLUMN content_warnings.source IS 'Source of the content warning: user_submitted, ai_generated, author_website, publisher';
COMMENT ON COLUMN content_warnings.is_author_approved IS 'Whether the warning has been approved by the author/publisher';

-- Step 7: Show migration results
SELECT 
    'Migration completed successfully' as status,
    COUNT(*) as total_warnings,
    COUNT(CASE WHEN source = 'user_submitted' THEN 1 END) as community_submitted,
    COUNT(CASE WHEN source = 'ai_generated' THEN 1 END) as ai_generated,
    COUNT(CASE WHEN source = 'author_website' THEN 1 END) as author_website,
    COUNT(CASE WHEN source = 'publisher' THEN 1 END) as publisher,
    COUNT(CASE WHEN is_author_approved = true THEN 1 END) as author_approved
FROM content_warnings;
