create table if not exists opd_content (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'Out-Patient Department',
  cover_image_paths text[] not null default '{}',
  general_information text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  clinic_schedule jsonb not null default '[]'::jsonb,
  organizational_structure_description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into opd_content (id)
values (1)
on conflict (id) do nothing;

alter table opd_content enable row level security;

drop trigger if exists set_opd_content_updated_at on opd_content;
create trigger set_opd_content_updated_at
  before update on opd_content
  for each row execute function set_updated_at();
