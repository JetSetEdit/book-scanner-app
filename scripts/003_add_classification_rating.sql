-- Add Australian Classification Board rating field to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS classification_rating TEXT;

-- Add comment to explain the field
COMMENT ON COLUMN public.books.classification_rating IS 'Australian Classification Board rating (G, PG, M, MA15+, R18+, X18+)';

-- Add check constraint to ensure valid ratings
ALTER TABLE public.books ADD CONSTRAINT valid_classification_rating 
CHECK (classification_rating IS NULL OR classification_rating IN ('G', 'PG', 'M', 'MA15+', 'R18+', 'X18+'));
