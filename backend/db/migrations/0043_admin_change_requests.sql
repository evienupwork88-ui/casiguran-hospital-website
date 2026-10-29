create table if not exists admin_change_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references admin_users(id) on delete restrict,
  requester_name text not null,
  resource text not null,
  action text not null,
  method text not null check (method in ('POST', 'PUT', 'PATCH', 'DELETE')),
  request_path text not null,
  content_type text,
  request_body jsonb not null default '{}'::jsonb,
  files jsonb not null default '[]'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'applying', 'applied')),
  reviewer_id uuid references admin_users(id) on delete set null,
  rejection_reason text,
  application_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  decided_at timestamptz,
  applied_at timestamptz
);

create index if not exists admin_change_requests_pending_idx
  on admin_change_requests(status, created_at desc);

create index if not exists admin_change_requests_requester_idx
  on admin_change_requests(requester_id, created_at desc);

alter table admin_change_requests enable row level security;

drop trigger if exists set_admin_change_requests_updated_at on admin_change_requests;
create trigger set_admin_change_requests_updated_at
  before update on admin_change_requests
  for each row execute function set_updated_at();

insert into storage.buckets (id, name, public)
values ('cdh-approval-staging', 'cdh-approval-staging', false)
on conflict (id) do update set public = false;
