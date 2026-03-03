-- Add reusable flag so some codes (e.g. master) never burn on use and never expire.
alter table vip_codes
  add column if not exists reusable boolean not null default false;

-- Ensure master code exists and is reusable (never expire, reusable forever).
insert into vip_codes (code, is_used, reusable)
  values ('wnw40f1hg3ccnyx4fdqw', false, true)
on conflict (code)
  do update set reusable = true;

comment on column vip_codes.reusable is 'When true, code is not marked used on redeem and can be used repeatedly (master code).';
