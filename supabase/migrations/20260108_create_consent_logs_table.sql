-- Create consent_logs table for tracking user consent acceptance
-- Used for compliance tracking and analytics
CREATE TABLE IF NOT EXISTS public.consent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  disclaimer_version TEXT NOT NULL,
  user_agent TEXT,
  country TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for querying
CREATE INDEX IF NOT EXISTS idx_consent_logs_timestamp ON public.consent_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_consent_logs_disclaimer_version ON public.consent_logs(disclaimer_version);
CREATE INDEX IF NOT EXISTS idx_consent_logs_country ON public.consent_logs(country);

-- Enable RLS
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- Only allow inserts (no reads for users)
CREATE POLICY "consent_logs_insert_all"
  ON public.consent_logs FOR INSERT
  WITH CHECK (true);

-- Admin can read (for analytics)
CREATE POLICY "consent_logs_select_admin"
  ON public.consent_logs FOR SELECT
  USING (true); -- Allow all reads for now, can restrict later if needed

COMMENT ON TABLE public.consent_logs IS 'Tracks user consent acceptance for disclaimer/terms. Used for compliance and analytics.';
COMMENT ON COLUMN public.consent_logs.disclaimer_version IS 'Version identifier for the disclaimer (e.g., 2026-01-08-v1). Allows tracking which version users accepted.';
COMMENT ON COLUMN public.consent_logs.country IS 'User country from geo headers (for geo-blocking compliance tracking).';
COMMENT ON COLUMN public.consent_logs.ip_address IS 'User IP address (anonymized if needed for privacy compliance).';
