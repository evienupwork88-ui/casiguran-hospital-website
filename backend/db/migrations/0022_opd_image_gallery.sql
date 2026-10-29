alter table opd_content
  add column if not exists cover_image_paths text[] not null default '{}';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'opd_content'
      and column_name = 'cover_image_path'
  ) then
    execute $migration$
      update opd_content
      set cover_image_paths = array[cover_image_path]
      where cover_image_path is not null
        and cardinality(cover_image_paths) = 0
    $migration$;
  end if;
end $$;

alter table opd_content
  drop column if exists introduction,
  drop column if exists cover_image_path;
