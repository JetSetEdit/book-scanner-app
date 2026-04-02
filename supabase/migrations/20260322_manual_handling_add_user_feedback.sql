-- Ensure user_feedback is allowed in manual_handling_scans (used by /api/feedback)
ALTER TABLE public.manual_handling_scans
DROP CONSTRAINT IF EXISTS manual_handling_scans_reason_check;

ALTER TABLE public.manual_handling_scans
ADD CONSTRAINT manual_handling_scans_reason_check
CHECK (reason IN (
  'not_found',
  'ambiguous',
  'analysis_failed',
  'description_too_minimal',
  'rate_limit_feedback',
  'user_feedback'
));

COMMENT ON COLUMN public.manual_handling_scans.reason IS 'Why manual handling is needed: not_found, ambiguous, analysis_failed, description_too_minimal, rate_limit_feedback, user_feedback';
