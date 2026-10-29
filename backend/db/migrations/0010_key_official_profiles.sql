-- Store the four Key Officials profiles separately from editable page copy.
create table if not exists key_officials (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug in ('chief-of-hospital', 'medical-service', 'nursing-services', 'out-patient-service')),
  name text not null default '',
  position text not null,
  photo_path text,
  display_order smallint not null unique,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

alter table key_officials enable row level security;

drop trigger if exists set_key_officials_updated_at on key_officials;
create trigger set_key_officials_updated_at
  before update on key_officials
  for each row execute function set_updated_at();

insert into key_officials (slug, name, position, display_order) values
  ('chief-of-hospital', '', 'Chief of Hospital', 1),
  ('medical-service', '', 'Head of Medical Service', 2),
  ('nursing-services', '', 'Head of Nursing Services', 3),
  ('out-patient-service', '', 'Head of Out-Patient Service', 4)
on conflict (slug) do nothing;
