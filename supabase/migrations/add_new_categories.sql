-- Add 'relationships' and 'language' to the content_warnings category enum

-- First, we need to drop the existing check constraint
ALTER TABLE content_warnings DROP CONSTRAINT IF EXISTS content_warnings_category_check;

-- Add the new check constraint with the additional categories
ALTER TABLE content_warnings ADD CONSTRAINT content_warnings_category_check 
  CHECK (category IN ('violence', 'sexual_content', 'substance_abuse', 'mental_health', 'death', 'abuse', 'discrimination', 'relationships', 'language', 'other'));
