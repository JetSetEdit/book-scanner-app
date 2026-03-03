-- Migration: Add author_content_warnings_url for author-provided content warning pages
-- Example: Ali Hazelwood links to https://alihazelwood.com/love-on-the-brain/lotb-cw/
-- Displayed as "Author's content warnings (may contain spoilers)" with link to open in new tab.

ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS author_content_warnings_url TEXT;

COMMENT ON COLUMN public.books.author_content_warnings_url IS
'Optional URL to the author’s own content warnings/notes page. Shown on the book page when set. May contain spoilers.';
