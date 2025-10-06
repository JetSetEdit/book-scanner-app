-- Add StoryGraph rating field to books table
ALTER TABLE public.books ADD COLUMN IF NOT EXISTS storygraph_rating DECIMAL(3,2);

-- Add comment to explain the field
COMMENT ON COLUMN public.books.storygraph_rating IS 'Average rating from StoryGraph (0.0 to 5.0)';
