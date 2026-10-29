create table if not exists contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists contact_messages_status_created_at_idx
  on contact_messages(status, created_at desc);

alter table contact_messages enable row level security;
