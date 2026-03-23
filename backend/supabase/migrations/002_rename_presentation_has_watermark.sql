do $$
begin
  if exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'presentations'
       and column_name = 'has_watermark'
  ) and not exists (
    select 1
      from information_schema.columns
     where table_schema = 'public'
       and table_name = 'presentations'
       and column_name = 'watermark_applied'
  ) then
    alter table public.presentations
      rename column has_watermark to watermark_applied;
  end if;
end $$;

alter table public.presentations
  alter column watermark_applied set default true;

update public.presentations
   set watermark_applied = coalesce(watermark_applied, true)
 where watermark_applied is null;

alter table public.presentations
  alter column watermark_applied set not null;
