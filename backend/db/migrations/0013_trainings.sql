create table if not exists trainings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  external_url text,
  image_path text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  author_id uuid references admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trainings_status_created_at_idx
  on trainings(status, created_at desc);

alter table trainings enable row level security;

drop trigger if exists set_trainings_updated_at on trainings;
create trigger set_trainings_updated_at
  before update on trainings
  for each row execute function set_updated_at();
