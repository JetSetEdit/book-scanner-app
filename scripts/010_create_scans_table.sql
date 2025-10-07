-- Create scans table to track ISBN scanning activity
-- This table records every time a book is scanned, regardless of whether it exists in the books table

CREATE TABLE IF NOT EXISTS public.scans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    isbn TEXT NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL, -- Can be NULL if book doesn't exist yet
    user_id UUID, -- Optional - for tracking who scanned (future user system)
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT, -- Optional free-form text about the scan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scans_isbn ON public.scans(isbn);
CREATE INDEX IF NOT EXISTS idx_scans_book_id ON public.scans(book_id);
CREATE INDEX IF NOT EXISTS idx_scans_scanned_at ON public.scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);

-- Enable RLS on scans table
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read scans (for tracking purposes)
CREATE POLICY "Allow anonymous read access to scans" ON public.scans
    FOR SELECT USING (true);

-- Allow anonymous users to insert scans
CREATE POLICY "Allow anonymous insert access to scans" ON public.scans
    FOR INSERT WITH CHECK (true);

-- Allow anonymous users to update scans (for adding notes, etc.)
CREATE POLICY "Allow anonymous update access to scans" ON public.scans
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- Create a function to record a scan
CREATE OR REPLACE FUNCTION public.record_scan(
    scan_isbn TEXT,
    scan_notes TEXT DEFAULT NULL,
    scan_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    scan_id UUID;
    existing_book_id UUID;
BEGIN
    -- Check if book exists
    SELECT id INTO existing_book_id FROM public.books WHERE isbn = scan_isbn;
    
    -- Insert scan record
    INSERT INTO public.scans (isbn, book_id, notes, user_id)
    VALUES (scan_isbn, existing_book_id, scan_notes, scan_user_id)
    RETURNING id INTO scan_id;
    
    RETURN scan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.record_scan(TEXT, TEXT, UUID) TO anon;

-- Create a function to get scan statistics
CREATE OR REPLACE FUNCTION public.get_scan_statistics()
RETURNS TABLE (
    total_scans BIGINT,
    unique_isbns BIGINT,
    books_with_scans BIGINT,
    pending_reviews BIGINT,
    completed_reviews BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.scans) as total_scans,
        (SELECT COUNT(DISTINCT isbn) FROM public.scans) as unique_isbns,
        (SELECT COUNT(DISTINCT book_id) FROM public.scans WHERE book_id IS NOT NULL) as books_with_scans,
        (SELECT COUNT(*) FROM public.books WHERE review_status = 'pending') as pending_reviews,
        (SELECT COUNT(*) FROM public.books WHERE review_status = 'complete') as completed_reviews;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION public.get_scan_statistics() TO anon;


