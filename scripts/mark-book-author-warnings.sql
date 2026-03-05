-- Mark a book's content warnings as including author input so the bookshelf shows the "Author + AI" chip.
-- Run in Supabase SQL Editor (or psql). Replace the title pattern or use the ISBN.

-- Option A: By title (e.g. Love on the Brain)
UPDATE content_warnings
SET
  is_author_verified = true,
  source = CASE WHEN source = 'ai_generated' THEN 'author_approved' ELSE source END
WHERE book_id IN (
  SELECT id FROM books WHERE title ILIKE '%Love on the Brain%' LIMIT 1
);

-- Option B: By ISBN (e.g. Love on the Brain = 9781408725771)
-- UPDATE content_warnings
-- SET
--   is_author_verified = true,
--   source = CASE WHEN source = 'ai_generated' THEN 'author_approved' ELSE source END
-- WHERE book_id IN (
--   SELECT id FROM books WHERE isbn = '9781408725771'
-- );

-- Check how many rows were updated:
-- SELECT cw.id, cw.description, cw.severity, cw.source, cw.is_author_verified
-- FROM content_warnings cw
-- JOIN books b ON b.id = cw.book_id
-- WHERE b.title ILIKE '%Love on the Brain%';
