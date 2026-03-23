alter table public.presentations
  add column if not exists metadata jsonb not null default '{}'::jsonb;

do $$
begin
  if not exists (
    select 1
      from pg_constraint
     where conname = 'presentations_metadata_is_json_object'
  ) then
    alter table public.presentations
      add constraint presentations_metadata_is_json_object
      check (jsonb_typeof(metadata) = 'object');
  end if;
end $$;

create index if not exists idx_presentations_metadata_gin
  on public.presentations using gin (metadata jsonb_path_ops);
