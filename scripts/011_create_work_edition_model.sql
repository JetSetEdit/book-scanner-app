-- Work → Edition → Identifier model
-- Based on FRBR/BIBFRAME principles

-- Works table (intellectual content)
CREATE TABLE works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_title TEXT NOT NULL,
  title_norm TEXT NOT NULL, -- normalized for search
  language_work TEXT DEFAULT 'en',
  primary_contributors JSONB NOT NULL DEFAULT '[]', -- [{role:'author', viaf:'', name:'...'}]
  original_pub_year INTEGER,
  external_ids JSONB DEFAULT '{}', -- {openlibrary_work:'', oclc_work:''}
  work_fp TEXT UNIQUE NOT NULL, -- normalized fingerprint
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Editions table (specific publish/format)
CREATE TABLE editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  publisher TEXT,
  imprint TEXT,
  pub_year INTEGER,
  binding TEXT CHECK (binding IN ('paperback', 'hardcover', 'ebook', 'audiobook', 'other')),
  language_edition TEXT DEFAULT 'en',
  edition_stmt TEXT, -- "50th Anniversary", "Rev. ed."
  page_count INTEGER,
  cover_url TEXT,
  description TEXT,
  categories TEXT[],
  external_ids JSONB DEFAULT '{}',
  edition_fp TEXT, -- dedupe aid
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (work_id, edition_fp) DEFERRABLE INITIALLY DEFERRED
);

-- Identifiers table (ISBNs, EANs, etc.)
CREATE TABLE identifiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id UUID NOT NULL REFERENCES editions(id) ON DELETE CASCADE,
  id_type TEXT NOT NULL CHECK (id_type IN ('isbn13','isbn10','ean','asin','ol_ed','oclc')),
  value TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  source TEXT, -- openlibrary, google_books, ai_agent, manual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (id_type, value)
);

-- Indexes for performance
CREATE INDEX idx_works_fp ON works(work_fp);
CREATE INDEX idx_works_title_norm ON works(title_norm);
CREATE INDEX idx_works_contributors ON works USING GIN(primary_contributors);
CREATE INDEX idx_editions_work_id ON editions(work_id);
CREATE INDEX idx_editions_fp ON editions(edition_fp);
CREATE INDEX idx_identifiers_edition_id ON identifiers(edition_id);
CREATE INDEX idx_identifiers_value ON identifiers(value);
CREATE INDEX idx_identifiers_type_value ON identifiers(id_type, value);

-- Full-text search indexes
CREATE INDEX idx_works_title_fts ON works USING GIN(to_tsvector('english', canonical_title));
CREATE INDEX idx_editions_publisher_fts ON editions USING GIN(to_tsvector('english', publisher));

-- Functions for fingerprinting
CREATE OR REPLACE FUNCTION normalize_text(input_text TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(input_text, '[^\w\s]', '', 'g'),
        '\s+', ' ', 'g'
      ),
      '^(the|a|an)\s+', '', 'gi'
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION create_work_fingerprint(
  title TEXT,
  contributors JSONB,
  language TEXT DEFAULT 'en'
) RETURNS TEXT AS $$
DECLARE
  norm_title TEXT;
  norm_contributors TEXT;
  contributor_names TEXT[] := '{}';
  contributor JSONB;
BEGIN
  -- Normalize title
  norm_title := normalize_text(title);
  
  -- Extract and normalize contributor names
  FOR contributor IN SELECT * FROM jsonb_array_elements(contributors)
  LOOP
    IF contributor->>'role' = 'author' THEN
      contributor_names := array_append(contributor_names, normalize_text(contributor->>'name'));
    END IF;
  END LOOP;
  
  -- Sort contributors for consistency
  SELECT array_to_string(array_agg(name ORDER BY name), '|') 
  INTO norm_contributors
  FROM unnest(contributor_names) AS name;
  
  RETURN norm_title || '|' || COALESCE(norm_contributors, '') || '|' || language;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION create_edition_fingerprint(
  publisher TEXT,
  pub_year INTEGER,
  binding TEXT,
  language TEXT DEFAULT 'en',
  edition_stmt TEXT DEFAULT NULL
) RETURNS TEXT AS $$
BEGIN
  RETURN normalize_text(COALESCE(publisher, '')) || '|' ||
         COALESCE(pub_year::TEXT, '') || '|' ||
         COALESCE(binding, '') || '|' ||
         language || '|' ||
         normalize_text(COALESCE(edition_stmt, ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Triggers to auto-update fingerprints
CREATE OR REPLACE FUNCTION update_work_fingerprint() RETURNS TRIGGER AS $$
BEGIN
  NEW.work_fp := create_work_fingerprint(NEW.canonical_title, NEW.primary_contributors, NEW.language_work);
  NEW.title_norm := normalize_text(NEW.canonical_title);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_edition_fingerprint() RETURNS TRIGGER AS $$
BEGIN
  NEW.edition_fp := create_edition_fingerprint(NEW.publisher, NEW.pub_year, NEW.binding, NEW.language_edition, NEW.edition_stmt);
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_work_fingerprint
  BEFORE INSERT OR UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION update_work_fingerprint();

CREATE TRIGGER trigger_edition_fingerprint
  BEFORE INSERT OR UPDATE ON editions
  FOR EACH ROW EXECUTE FUNCTION update_edition_fingerprint();

-- Views for easier querying
CREATE VIEW book_details AS
SELECT 
  w.id as work_id,
  w.canonical_title,
  w.primary_contributors,
  w.original_pub_year,
  e.id as edition_id,
  e.publisher,
  e.pub_year,
  e.binding,
  e.cover_url,
  e.description,
  e.categories,
  array_agg(
    jsonb_build_object(
      'type', i.id_type,
      'value', i.value,
      'is_primary', i.is_primary
    ) ORDER BY i.is_primary DESC, i.created_at
  ) as identifiers
FROM works w
JOIN editions e ON w.id = e.work_id
LEFT JOIN identifiers i ON e.id = i.edition_id
GROUP BY w.id, w.canonical_title, w.primary_contributors, w.original_pub_year,
         e.id, e.publisher, e.pub_year, e.binding, e.cover_url, e.description, e.categories;

-- RLS policies
ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE editions ENABLE ROW LEVEL SECURITY;
ALTER TABLE identifiers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read
CREATE POLICY "Allow anonymous read access to works" ON works FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous read access to editions" ON editions FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous read access to identifiers" ON identifiers FOR SELECT TO anon USING (true);

-- Allow authenticated users to insert/update
CREATE POLICY "Allow authenticated users to manage works" ON works FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage editions" ON editions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to manage identifiers" ON identifiers FOR ALL TO authenticated USING (true);

