create table if not exists obstetrics_and_gynecology_content (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'Obstetrics and Gynecology',
  cover_image_paths text[] not null default '{}',
  organizational_chart_image_path text,
  general_information text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  clinic_schedule jsonb not null default '[]'::jsonb,
  organizational_structure_description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into obstetrics_and_gynecology_content (id)
values (1)
on conflict (id) do nothing;

alter table obstetrics_and_gynecology_content enable row level security;

drop trigger if exists set_obstetrics_and_gynecology_content_updated_at on obstetrics_and_gynecology_content;
create trigger set_obstetrics_and_gynecology_content_updated_at
  before update on obstetrics_and_gynecology_content
  for each row execute function set_updated_at();
