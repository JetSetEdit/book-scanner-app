-- Create books table to store book metadata
create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  isbn text unique not null,
  title text not null,
  author text,
  cover_url text,
  description text,
  publisher text,
  published_date text,
  page_count integer,
  categories text[],
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.books enable row level security;

-- Anyone can read books
create policy "books_select_all"
  on public.books for select
  using (true);

-- Only authenticated users can insert books (when scanning new ISBNs)
create policy "books_insert_authenticated"
  on public.books for insert
  to authenticated
  with check (true);

-- Create index on ISBN for fast lookups
create index if not exists books_isbn_idx on public.books(isbn);
