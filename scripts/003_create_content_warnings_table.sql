-- Create content_warnings table to store user-submitted warnings
create table if not exists public.content_warnings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  category text not null check (category in (
    'violence',
    'sexual_content',
    'substance_abuse',
    'mental_health',
    'death',
    'abuse',
    'discrimination',
    'other'
  )),
  description text not null,
  severity text not null check (severity in ('mild', 'moderate', 'severe')),
  helpful_count integer default 0,
  not_helpful_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.content_warnings enable row level security;

-- Anyone can read content warnings
create policy "content_warnings_select_all"
  on public.content_warnings for select
  using (true);

-- Authenticated users can insert warnings
create policy "content_warnings_insert_authenticated"
  on public.content_warnings for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own warnings
create policy "content_warnings_update_own"
  on public.content_warnings for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete their own warnings
create policy "content_warnings_delete_own"
  on public.content_warnings for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create indexes for fast lookups
create index if not exists content_warnings_book_id_idx on public.content_warnings(book_id);
create index if not exists content_warnings_category_idx on public.content_warnings(category);
