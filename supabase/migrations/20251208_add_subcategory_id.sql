-- Migration: Add hierarchical taxonomy and context metadata columns
-- This enables Taxonomy v2.0 with parent-child categories and contextual details
-- Part of comprehensive content warning system upgrade

-- 1. Hierarchy Support: Subcategory ID
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS subcategory_id TEXT;

CREATE INDEX IF NOT EXISTS content_warnings_subcategory_id_idx 
ON public.content_warnings(subcategory_id);

CREATE INDEX IF NOT EXISTS content_warnings_category_subcategory_idx 
ON public.content_warnings(category_id, subcategory_id);

COMMENT ON COLUMN public.content_warnings.subcategory_id IS 
'Subcategory ID for hierarchical taxonomy (v2.0). Must belong to the parent category_id. Nullable for backward compatibility.';

-- 2. "How it happens" - Presence/Context
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS presence TEXT 
  CHECK (presence IN ('on_page', 'off_page', 'flashback', 'referenced', 'implied')) 
  DEFAULT 'on_page';

CREATE INDEX IF NOT EXISTS content_warnings_presence_idx 
ON public.content_warnings(presence);

COMMENT ON COLUMN public.content_warnings.presence IS 
'How the content appears: on_page (real-time), off_page (happens off-screen), flashback, referenced (discussed), implied.';

-- 3. "How bad is it?" - Detail Level
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS detail_level TEXT 
  CHECK (detail_level IN ('graphic', 'moderate', 'vague', 'clinical'));

CREATE INDEX IF NOT EXISTS content_warnings_detail_level_idx 
ON public.content_warnings(detail_level);

COMMENT ON COLUMN public.content_warnings.detail_level IS 
'Level of detail: graphic (explicit), moderate (clear but not overly explicit), vague (minimal), clinical (matter-of-fact).';

-- 4. User Protection - Spoiler Flag
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS is_spoiler BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS content_warnings_is_spoiler_idx 
ON public.content_warnings(is_spoiler);

COMMENT ON COLUMN public.content_warnings.is_spoiler IS 
'Whether this warning reveals a major plot twist or spoiler. Should be blurred in UI if true.';

-- 5. Australian / Educational Context - Mediation Flag
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS requires_mediation BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS content_warnings_requires_mediation_idx 
ON public.content_warnings(requires_mediation);

COMMENT ON COLUMN public.content_warnings.requires_mediation IS 
'True if severity is high or topic is complex, indicating a "Teachable Moment" or requiring parental notification (Australian Dept of Education requirements).';

-- 6. Australian Context - Indigenous Deceased Persons Protocol
-- Note: This is a book-level flag, but we'll add it here for now
-- Consider moving to books table if needed
ALTER TABLE public.content_warnings
ADD COLUMN IF NOT EXISTS has_indigenous_deceased BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.content_warnings.has_indigenous_deceased IS 
'True if this warning relates to Indigenous content that may contain names/images of deceased persons (Australian cultural protocol).';

-- Note: Data integrity for subcategory_id is enforced at the application level
-- using the validateSubcategoryParent() function in lib/config/taxonomy-v2.ts
-- PostgreSQL CHECK constraints cannot reference other tables or perform complex lookups.

