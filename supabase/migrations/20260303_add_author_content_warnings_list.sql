-- Store author-provided content warnings list (you provide; we don't scrape).
-- When set, displayed in "Author's content warnings" section with source link.

ALTER TABLE public.books
ADD COLUMN IF NOT EXISTS author_content_warnings_list JSONB;

COMMENT ON COLUMN public.books.author_content_warnings_list IS
'Optional array of content warning strings from the author (e.g. from author_content_warnings_url). Manually set; not scraped.';

-- Example: set list for Love on the Brain (run after migration):
-- UPDATE books SET author_content_warnings_list = '[
--   "Parental death in a car accident (in the past)",
--   "Death of a friend in a rock climbing accident (in the past)",
--   "Seizure disorder in children",
--   "Sexism in the workplace",
--   "Mentions of workplace sexual harassment",
--   "Firearms and life-threatening situations (that do NOT result in death)",
--   "Explicit and graphic sexual content",
--   "Cursing and vulgar language"
-- ]'::jsonb WHERE isbn = '9781408725771';
