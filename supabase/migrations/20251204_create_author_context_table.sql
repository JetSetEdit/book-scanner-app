-- Create author_context table
create table if not exists public.author_context (
  id uuid not null default gen_random_uuid(),
  author_name text not null,
  status text not null default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone not null default now(),
  constraint author_context_pkey primary key (id)
);

-- Add RLS policies
alter table public.author_context enable row level security;

create policy "Enable read access for all users"
on public.author_context for select
using (true);

create policy "Enable insert access for all users"
on public.author_context for insert
with check (true);

create policy "Enable update access for all users"
on public.author_context for update
using (true);
