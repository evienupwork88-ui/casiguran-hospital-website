create table if not exists key_officials_slideshow (
  id smallint primary key default 1 check (id = 1),
  cover_image_paths text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into key_officials_slideshow (id, cover_image_paths)
values (1, '{}')
on conflict (id) do nothing;

alter table key_officials_slideshow enable row level security;

drop trigger if exists set_key_officials_slideshow_updated_at on key_officials_slideshow;
create trigger set_key_officials_slideshow_updated_at
  before update on key_officials_slideshow
  for each row execute function set_updated_at();
