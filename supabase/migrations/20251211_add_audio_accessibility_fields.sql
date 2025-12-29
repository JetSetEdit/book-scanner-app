-- Migration: Add audio accessibility fields to books table
-- This enables text-to-speech content briefings for screen readers and audio navigation
-- Part of Subtext + ElevenLabs accessibility feature implementation

-- Add audio-related columns to books table
ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS content_briefing TEXT,
ADD COLUMN IF NOT EXISTS audio_url TEXT,
ADD COLUMN IF NOT EXISTS audio_duration INTEGER, -- Duration in seconds
ADD COLUMN IF NOT EXISTS audio_transcript TEXT,
ADD COLUMN IF NOT EXISTS audio_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS audio_voice_id TEXT DEFAULT '21m00Tcm4TlvDq8ikWAM'; -- ElevenLabs default voice

-- Add index for audio generation status queries
CREATE INDEX IF NOT EXISTS books_audio_url_idx ON public.books(audio_url) WHERE audio_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS books_audio_generated_at_idx ON public.books(audio_generated_at) WHERE audio_generated_at IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.books.content_briefing IS 
'Concise, screen-reader-friendly text (20-60 words) summarizing content warnings. Generated from warnings, tags, and book metadata. Suitable for TTS.';

COMMENT ON COLUMN public.books.audio_url IS 
'URL to the generated audio file (MP3) containing the content briefing. Stored in public/audio/subtext/ or object storage.';

COMMENT ON COLUMN public.books.audio_duration IS 
'Duration of the audio file in seconds. Used for progress indicators and accessibility announcements.';

COMMENT ON COLUMN public.books.audio_transcript IS 
'Full transcript of the audio content. Ensures accessibility compliance (WCAG 2.1 Level AA) by providing text alternative.';

COMMENT ON COLUMN public.books.audio_generated_at IS 
'Timestamp when the audio was last generated. Used to determine if regeneration is needed after warning updates.';

COMMENT ON COLUMN public.books.audio_voice_id IS 
'ElevenLabs voice ID used for TTS generation. Defaults to clear, neutral voice suitable for accessibility.';
