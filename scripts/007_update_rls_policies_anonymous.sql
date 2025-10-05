-- Update RLS policies to allow anonymous access
-- This removes the authentication requirement

-- Books table: Allow anonymous inserts
drop policy if exists "books_insert_authenticated" on public.books;
create policy "books_insert_anonymous"
  on public.books for insert
  to anon
  with check (true);

-- Spice ratings: Allow anonymous inserts and reads
drop policy if exists "spice_ratings_insert_authenticated" on public.spice_ratings;
create policy "spice_ratings_insert_anonymous"
  on public.spice_ratings for insert
  to anon
  with check (true);

-- Content warnings: Allow anonymous inserts and reads
drop policy if exists "content_warnings_insert_authenticated" on public.content_warnings;
create policy "content_warnings_insert_anonymous"
  on public.content_warnings for insert
  to anon
  with check (true);

-- Warning validations: Allow anonymous inserts
drop policy if exists "warning_validations_insert_authenticated" on public.warning_validations;
drop policy if exists "warning_validations_update_own" on public.warning_validations;

create policy "warning_validations_insert_anonymous"
  on public.warning_validations for insert
  to anon
  with check (true);

create policy "warning_validations_update_anonymous"
  on public.warning_validations for update
  to anon
  using (true)
  with check (true);
