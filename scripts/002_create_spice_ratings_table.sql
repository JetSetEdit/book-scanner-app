-- Create spice_ratings table to store spice level ratings
create table if not exists public.spice_ratings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  spice_level integer not null check (spice_level >= 0 and spice_level <= 5),
  age_rating text check (age_rating in ('G', 'PG', 'PG-13', 'R', '18+')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(book_id, user_id)
);

-- Enable RLS
alter table public.spice_ratings enable row level security;

-- Anyone can read spice ratings
create policy "spice_ratings_select_all"
  on public.spice_ratings for select
  using (true);

-- Authenticated users can insert their own ratings
create policy "spice_ratings_insert_own"
  on public.spice_ratings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own ratings
create policy "spice_ratings_update_own"
  on public.spice_ratings for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete their own ratings
create policy "spice_ratings_delete_own"
  on public.spice_ratings for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create index for fast lookups
create index if not exists spice_ratings_book_id_idx on public.spice_ratings(book_id);
