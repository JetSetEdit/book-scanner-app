-- Create table for RLHF (Reinforcement Learning from Human Feedback) comparisons
CREATE TABLE IF NOT EXISTS public.rlhf_comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_a_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  book_b_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_choice TEXT NOT NULL CHECK (user_choice IN ('A', 'B', 'equal')),
  system_prediction TEXT NOT NULL CHECK (system_prediction IN ('A', 'B', 'equal')),
  book_a_score FLOAT NOT NULL,
  book_b_score FLOAT NOT NULL,
  match BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate comparisons (same user, same books)
  CONSTRAINT no_duplicate_comparisons UNIQUE (book_a_id, book_b_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS rlhf_comparisons_book_a_id_idx ON public.rlhf_comparisons(book_a_id);
CREATE INDEX IF NOT EXISTS rlhf_comparisons_book_b_id_idx ON public.rlhf_comparisons(book_b_id);
CREATE INDEX IF NOT EXISTS rlhf_comparisons_created_at_idx ON public.rlhf_comparisons(created_at);
CREATE INDEX IF NOT EXISTS rlhf_comparisons_match_idx ON public.rlhf_comparisons(match);

-- Enable RLS
ALTER TABLE public.rlhf_comparisons ENABLE ROW LEVEL SECURITY;

-- Anyone can read comparisons (for analysis)
CREATE POLICY "rlhf_comparisons_select_all"
  ON public.rlhf_comparisons FOR SELECT
  USING (true);

-- Anyone can insert comparisons (no auth required for now)
CREATE POLICY "rlhf_comparisons_insert_all"
  ON public.rlhf_comparisons FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.rlhf_comparisons IS 'Stores human feedback comparisons for RLHF training to improve severity scoring';

