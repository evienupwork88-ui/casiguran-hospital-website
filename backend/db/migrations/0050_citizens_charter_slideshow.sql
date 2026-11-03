create table if not exists citizens_charter_slideshow (
  id smallint primary key default 1 check (id = 1),
  cover_image_paths text[] not null default '{}',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into citizens_charter_slideshow (id, cover_image_paths)
values (1, '{}')
on conflict (id) do nothing;

alter table citizens_charter_slideshow enable row level security;

drop trigger if exists set_citizens_charter_slideshow_updated_at on citizens_charter_slideshow;
create trigger set_citizens_charter_slideshow_updated_at
  before update on citizens_charter_slideshow
  for each row execute function set_updated_at();
