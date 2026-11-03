create table if not exists homepage_gallery (
  id smallint primary key default 1 check (id = 1),
  image_paths text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into homepage_gallery (id, image_paths)
values (1, '{}')
on conflict (id) do nothing;

alter table homepage_gallery enable row level security;

drop trigger if exists set_homepage_gallery_updated_at on homepage_gallery;
create trigger set_homepage_gallery_updated_at
  before update on homepage_gallery
  for each row execute function set_updated_at();
