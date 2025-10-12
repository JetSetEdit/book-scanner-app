-- Cleanup script to remove all legacy books and associated data
-- This will give us a clean slate to test the new system

-- Step 1: Delete all content warnings (they reference books)
DELETE FROM content_warnings;

-- Step 2: Delete all warning validations (they reference content warnings)
DELETE FROM warning_validations;

-- Step 3: Delete all author context (they reference authors)
DELETE FROM author_context;

-- Step 4: Delete all author context audit records
DELETE FROM author_context_audit;

-- Step 5: Delete all authors
DELETE FROM authors;

-- Step 6: Delete all books
DELETE FROM books;

-- Step 7: Reset any sequences if they exist
-- (This ensures new IDs start from 1)
DO $$
BEGIN
    -- Reset book ID sequence if it exists
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'books_id_seq') THEN
        ALTER SEQUENCE books_id_seq RESTART WITH 1;
    END IF;
    
    -- Reset content warnings ID sequence if it exists
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'content_warnings_id_seq') THEN
        ALTER SEQUENCE content_warnings_id_seq RESTART WITH 1;
    END IF;
    
    -- Reset authors ID sequence if it exists
    IF EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'authors_id_seq') THEN
        ALTER SEQUENCE authors_id_seq RESTART WITH 1;
    END IF;
END $$;

-- Step 8: Show cleanup results
SELECT 
    'Cleanup completed successfully' as status,
    (SELECT COUNT(*) FROM books) as remaining_books,
    (SELECT COUNT(*) FROM content_warnings) as remaining_warnings,
    (SELECT COUNT(*) FROM authors) as remaining_authors,
    (SELECT COUNT(*) FROM author_context) as remaining_author_context;
