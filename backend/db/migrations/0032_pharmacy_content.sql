create table if not exists pharmacy_content (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'Pharmacy Department',
  cover_image_paths text[] not null default '{}',
  organizational_chart_image_path text,
  general_information text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  clinic_schedule jsonb not null default '[]'::jsonb,
  organizational_structure_description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into pharmacy_content (id)
values (1)
on conflict (id) do nothing;

alter table pharmacy_content enable row level security;

drop trigger if exists set_pharmacy_content_updated_at on pharmacy_content;
create trigger set_pharmacy_content_updated_at
  before update on pharmacy_content
  for each row execute function set_updated_at();
