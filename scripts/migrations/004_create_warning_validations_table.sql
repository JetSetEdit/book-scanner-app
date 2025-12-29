-- Create warning_validations table to track user validations
create table if not exists public.warning_validations (
  id uuid primary key default gen_random_uuid(),
  warning_id uuid not null references public.content_warnings(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_helpful boolean not null,
  created_at timestamp with time zone default now(),
  unique(warning_id, user_id)
);

-- Enable RLS
alter table public.warning_validations enable row level security;

-- Anyone can read validations
create policy "warning_validations_select_all"
  on public.warning_validations for select
  using (true);

-- Authenticated users can insert validations
create policy "warning_validations_insert_own"
  on public.warning_validations for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own validations
create policy "warning_validations_update_own"
  on public.warning_validations for update
  to authenticated
  using (auth.uid() = user_id);

-- Users can delete their own validations
create policy "warning_validations_delete_own"
  on public.warning_validations for delete
  to authenticated
  using (auth.uid() = user_id);

-- Create index for fast lookups
create index if not exists warning_validations_warning_id_idx on public.warning_validations(warning_id);
