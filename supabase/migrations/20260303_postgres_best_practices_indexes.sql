-- Migration: Postgres best-practices indexes (query-missing-indexes, schema-foreign-key-indexes)
-- Aligns with Supabase Postgres Best Practices skill: index WHERE/JOIN columns and FK columns.
-- Run after 20260303_vip_codes_reusable_master.sql.

-- 1. books: lookup by ISBN (scan-service, check-book, etc.)
CREATE INDEX IF NOT EXISTS books_isbn_idx ON public.books(isbn);

-- 2. books: duplicate check by title+author (scan-service.ts existingBookByTitle)
CREATE INDEX IF NOT EXISTS books_title_author_idx ON public.books(title, author);

-- 3. scans: FK index (JOINs and ON DELETE SET NULL on books)
CREATE INDEX IF NOT EXISTS scans_book_id_idx ON public.scans(book_id);

-- 4. scans: lookup by ISBN (recent scans, analytics)
CREATE INDEX IF NOT EXISTS scans_isbn_idx ON public.scans(isbn);

-- 5. content_warnings: FK + primary filter (all warning fetches by book_id)
CREATE INDEX IF NOT EXISTS content_warnings_book_id_idx ON public.content_warnings(book_id);

COMMENT ON INDEX public.books_isbn_idx IS 'Lookup by ISBN (query-missing-indexes)';
COMMENT ON INDEX public.books_title_author_idx IS 'Duplicate book check by title+author';
COMMENT ON INDEX public.scans_book_id_idx IS 'FK index for JOINs/cascade (schema-foreign-key-indexes)';
COMMENT ON INDEX public.scans_isbn_idx IS 'Lookup by ISBN';
COMMENT ON INDEX public.content_warnings_book_id_idx IS 'FK + filter by book (schema-foreign-key-indexes)';
