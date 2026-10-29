create table if not exists himd_slideshow (
  id smallint primary key default 1 check (id = 1),
  cover_image_paths text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into himd_slideshow (id, cover_image_paths)
values (
  1,
  coalesce(
    (
      select array_agg(images.image_path order by images.section_order, images.image_order)
      from (
        select
          case content.section
            when 'admitting' then 1
            when 'opd' then 2
            else 3
          end as section_order,
          image.ordinality as image_order,
          image.path as image_path
        from himd_content as content
        cross join lateral unnest(content.cover_image_paths) with ordinality as image(path, ordinality)
      ) as images
    ),
    '{}'::text[]
  )
)
on conflict (id) do nothing;

alter table himd_slideshow enable row level security;

drop trigger if exists set_himd_slideshow_updated_at on himd_slideshow;
create trigger set_himd_slideshow_updated_at
  before update on himd_slideshow
  for each row execute function set_updated_at();

alter table himd_content drop column cover_image_paths;
