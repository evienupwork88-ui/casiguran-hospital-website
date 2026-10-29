create table if not exists radiology_content (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'Radiology',
  cover_image_paths text[] not null default '{}',
  general_information text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  clinic_schedule jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into radiology_content (id)
values (1)
on conflict (id) do nothing;

alter table radiology_content enable row level security;

drop trigger if exists set_radiology_content_updated_at on radiology_content;
create trigger set_radiology_content_updated_at
  before update on radiology_content
  for each row execute function set_updated_at();
