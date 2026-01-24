-- Create referral system tables
-- Supports viral sharing with bonus scans for referrers

-- Table: referral_links
-- Stores unique referral codes for each user
CREATE TABLE IF NOT EXISTS public.referral_links (
  code TEXT PRIMARY KEY,
  referrer_user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT referral_links_referrer_user_id_key UNIQUE (referrer_user_id)
);

-- Index for lookups by referrer
CREATE INDEX IF NOT EXISTS referral_links_referrer_user_id_idx 
  ON public.referral_links(referrer_user_id);

-- Table: referral_events
-- Event sourcing table for all referral-related events
CREATE TABLE IF NOT EXISTS public.referral_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('click', 'first_scan', 'bonus_granted')),
  user_id TEXT NOT NULL,
  referrer_code TEXT NOT NULL REFERENCES public.referral_links(code) ON DELETE CASCADE,
  referrer_user_id TEXT NOT NULL,
  parent_referrer_user_id TEXT,
  event_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS referral_events_user_id_idx ON public.referral_events(user_id);
CREATE INDEX IF NOT EXISTS referral_events_referrer_code_idx ON public.referral_events(referrer_code);
CREATE INDEX IF NOT EXISTS referral_events_referrer_user_id_idx ON public.referral_events(referrer_user_id);
CREATE INDEX IF NOT EXISTS referral_events_event_type_idx ON public.referral_events(event_type);
CREATE INDEX IF NOT EXISTS referral_events_event_at_idx ON public.referral_events(event_at DESC);
CREATE INDEX IF NOT EXISTS referral_events_user_code_type_idx ON public.referral_events(user_id, referrer_code, event_type);

-- Table: user_bonus_scans
-- Tracks bonus scans awarded to users from referrals
CREATE TABLE IF NOT EXISTS public.user_bonus_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  bonus_amount INTEGER NOT NULL CHECK (bonus_amount > 0),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  source_event_id UUID REFERENCES public.referral_events(id) ON DELETE SET NULL
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS user_bonus_scans_user_id_idx ON public.user_bonus_scans(user_id);
CREATE INDEX IF NOT EXISTS user_bonus_scans_expires_at_idx ON public.user_bonus_scans(expires_at);
CREATE INDEX IF NOT EXISTS user_bonus_scans_user_expires_idx ON public.user_bonus_scans(user_id, expires_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bonus_scans ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Service role can do anything (for API routes using admin client)
CREATE POLICY "Service role can manage referral_links"
  ON public.referral_links
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage referral_events"
  ON public.referral_events
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can manage user_bonus_scans"
  ON public.user_bonus_scans
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.referral_links IS 'Stores unique referral codes for users. Each user_id gets one code.';
COMMENT ON TABLE public.referral_events IS 'Event sourcing table for referral tracking: clicks, first scans, bonus grants';
COMMENT ON TABLE public.user_bonus_scans IS 'Tracks bonus scans awarded to users. Expires after configured days.';
COMMENT ON COLUMN public.referral_links.referrer_user_id IS 'User identifier: hash of IP+User-Agent fingerprint';
COMMENT ON COLUMN public.referral_events.user_id IS 'User identifier of the person who triggered the event';
COMMENT ON COLUMN public.referral_events.parent_referrer_user_id IS 'For multi-level referrals: the upstream referrer (A in A→B→C chain)';
COMMENT ON COLUMN public.user_bonus_scans.user_id IS 'User identifier: hash of IP+User-Agent fingerprint';
COMMENT ON COLUMN public.user_bonus_scans.expires_at IS 'When this bonus expires. Cleaned up automatically.';
