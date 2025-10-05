-- Create function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add triggers to update updated_at on all tables
drop trigger if exists update_books_updated_at on public.books;
create trigger update_books_updated_at
  before update on public.books
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_spice_ratings_updated_at on public.spice_ratings;
create trigger update_spice_ratings_updated_at
  before update on public.spice_ratings
  for each row
  execute function public.update_updated_at_column();

drop trigger if exists update_content_warnings_updated_at on public.content_warnings;
create trigger update_content_warnings_updated_at
  before update on public.content_warnings
  for each row
  execute function public.update_updated_at_column();
