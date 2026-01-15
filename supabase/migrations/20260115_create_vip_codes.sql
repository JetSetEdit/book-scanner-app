create table if not exists vip_codes (
  code text primary key,
  is_used boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS but only allow service role access for now
alter table vip_codes enable row level security;

create policy "Service role can do anything with vip_codes"
  on vip_codes
  using (true)
  with check (true);
