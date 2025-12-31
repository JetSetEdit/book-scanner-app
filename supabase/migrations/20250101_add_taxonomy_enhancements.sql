-- Migration: Taxonomy v2.5.0 Enhancements
-- Adds context modifiers, evidence storage, and other_note tracking
-- Part of comprehensive taxonomy system upgrade

-- 1. Context Modifiers (JSONB array for flexibility)
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS context_modifiers JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS content_warnings_context_modifiers_idx 
ON public.content_warnings USING GIN (context_modifiers);

COMMENT ON COLUMN public.content_warnings.context_modifiers IS 
'Array of context modifiers: historical_context, quoted_or_discussed, character_held_bias, condemned_by_narrative, endorsed_by_narrative, educational_or_analytical, satire_or_parody';

-- 2. Evidence Storage (JSONB for structured data)
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS evidence JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS content_warnings_evidence_idx 
ON public.content_warnings USING GIN (evidence);

COMMENT ON COLUMN public.content_warnings.evidence IS 
'Array of evidence spans: {source: text|community|author_note, location: {chapter, page, span_start, span_end}, excerpt: string, confidence: 0-1}';

-- 3. Severity Signals (JSONB for computed signals)
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS severity_signals JSONB;

CREATE INDEX IF NOT EXISTS content_warnings_severity_signals_idx 
ON public.content_warnings USING GIN (severity_signals);

COMMENT ON COLUMN public.content_warnings.severity_signals IS 
'Computed severity signals: {frequency: 0-1, explicitness: 0-1, proximity: 0-1, centrality: 0-1, intensity_markers: string[]}';

-- 4. Other Note (required for other_* subcategories)
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS other_note TEXT;

COMMENT ON COLUMN public.content_warnings.other_note IS 
'Required note when subcategory_id starts with "other_". Used for taxonomy refinement.';

-- 5. Taxonomy Version Tracking (already exists in some tables, ensure it's here)
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS taxonomy_version TEXT DEFAULT '2.5.0';

CREATE INDEX IF NOT EXISTS content_warnings_taxonomy_version_idx 
ON public.content_warnings(taxonomy_version);

COMMENT ON COLUMN public.content_warnings.taxonomy_version IS 
'Taxonomy version used when creating this warning. Enables migration and historical tracking.';

-- 6. Constraint: Require other_note for other_* subcategories
CREATE OR REPLACE FUNCTION check_other_note_required()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.subcategory_id LIKE 'other_%' AND (NEW.other_note IS NULL OR TRIM(NEW.other_note) = '') THEN
    RAISE EXCEPTION 'other_note is required when subcategory_id starts with "other_"';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS content_warnings_other_note_check ON public.content_warnings;
CREATE TRIGGER content_warnings_other_note_check
  BEFORE INSERT OR UPDATE ON public.content_warnings
  FOR EACH ROW
  EXECUTE FUNCTION check_other_note_required();

-- 7. Index for other_note queries (for taxonomy refinement)
CREATE INDEX IF NOT EXISTS content_warnings_other_note_idx 
ON public.content_warnings(other_note) 
WHERE other_note IS NOT NULL;

COMMENT ON INDEX content_warnings_other_note_idx IS 
'Index for querying other_note values to feed taxonomy refinement';


