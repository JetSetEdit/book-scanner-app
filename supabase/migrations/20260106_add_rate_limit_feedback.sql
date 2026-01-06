-- Migration: Add rate_limit_feedback reason to manual_handling_scans
-- Allows users to provide feedback or request access when hitting rate limits

-- Drop the old constraint
ALTER TABLE public.manual_handling_scans
DROP CONSTRAINT IF EXISTS manual_handling_scans_reason_check;

-- Add new constraint with rate_limit_feedback
ALTER TABLE public.manual_handling_scans
ADD CONSTRAINT manual_handling_scans_reason_check 
CHECK (reason IN ('not_found', 'ambiguous', 'analysis_failed', 'description_too_minimal', 'rate_limit_feedback'));

-- Update comment
COMMENT ON COLUMN public.manual_handling_scans.reason IS 'Why manual handling is needed: not_found, ambiguous, analysis_failed, description_too_minimal, rate_limit_feedback';

