-- Add metadata_issues field to ai_audit_logs to track missing covers, descriptions, etc.
ALTER TABLE public.ai_audit_logs 
ADD COLUMN IF NOT EXISTS metadata_issues JSONB DEFAULT NULL;

COMMENT ON COLUMN public.ai_audit_logs.metadata_issues IS 'JSON object tracking metadata issues: missing cover, missing description, etc. Format: {"missing_cover": true, "missing_description": true, "cover_reason": "...", "description_reason": "..."}';

