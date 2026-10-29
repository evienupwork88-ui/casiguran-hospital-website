create table if not exists billing_claims_content (
  section text primary key check (section in ('billing', 'claims')),
  title text not null,
  cover_image_paths text[] not null default '{}',
  organizational_chart_image_path text,
  general_information text not null default '',
  highlights jsonb not null default '[]'::jsonb,
  clinic_schedule jsonb not null default '[]'::jsonb,
  organizational_structure_description text not null default '',
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

insert into billing_claims_content (section, title)
values
  ('billing', 'Billing'),
  ('claims', 'Claims')
on conflict (section) do nothing;

alter table billing_claims_content enable row level security;

drop trigger if exists set_billing_claims_content_updated_at on billing_claims_content;
create trigger set_billing_claims_content_updated_at
  before update on billing_claims_content
  for each row execute function set_updated_at();
