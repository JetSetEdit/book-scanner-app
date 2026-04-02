-- Optional label for vip_codes (e.g. "TAM", "AYLA", "MEG") so you can track who each code is for.
alter table vip_codes
  add column if not exists label text;

comment on column vip_codes.label is 'Optional human-readable label (e.g. person or team name) for tracking who the code is for.';
