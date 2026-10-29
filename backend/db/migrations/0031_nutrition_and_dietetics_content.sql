create table if not exists nutrition_and_dietetics_content (
  id smallint primary key default 1 check (id = 1),
  title text not null default 'Nutrition and Dietetics Department',
  cover_image_paths text[] not null default '{}',
  organizational_chart_image_path text,
  general_information text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  clinic_schedule jsonb not null default '[]'::jsonb,
  organizational_structure_description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into nutrition_and_dietetics_content (id)
values (1)
on conflict (id) do nothing;

alter table nutrition_and_dietetics_content enable row level security;

drop trigger if exists set_nutrition_and_dietetics_content_updated_at on nutrition_and_dietetics_content;
create trigger set_nutrition_and_dietetics_content_updated_at
  before update on nutrition_and_dietetics_content
  for each row execute function set_updated_at();
