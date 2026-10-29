create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references admin_users(id) on delete set null,
  actor_email text,
  event_type text not null check (event_type in ('admin_action', 'auth_event', 'access_denied')),
  action text not null,
  method text not null,
  route text not null,
  status_code integer not null,
  ip_address text,
  user_agent text,
  occurred_at timestamptz not null default now()
);

create index audit_logs_occurred_at_idx on audit_logs (occurred_at desc);
create index audit_logs_actor_id_idx on audit_logs (actor_id);

alter table audit_logs enable row level security;
