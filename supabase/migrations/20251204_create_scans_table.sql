-- Create scans table
create table if not exists public.scans (
  id uuid not null default gen_random_uuid(),
  isbn text not null,
  book_id uuid references public.books(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  constraint scans_pkey primary key (id)
);

-- Add RLS policies (optional but good practice)
alter table public.scans enable row level security;

create policy "Enable read access for all users"
on public.scans for select
using (true);

create policy "Enable insert access for all users"
on public.scans for insert
with check (true);
