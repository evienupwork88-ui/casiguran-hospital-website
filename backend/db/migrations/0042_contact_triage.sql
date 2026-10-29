alter table contact_messages
  add column if not exists department_tag text not null default 'Other',
  add column if not exists assigned_to text,
  add column if not exists action_taken text check (
    action_taken is null or action_taken in ('Called', 'FB Messaged', 'Forwarded to GC', 'Done')
  ),
  add column if not exists remarks text not null default '',
  add column if not exists ip_address text,
  add column if not exists user_agent text,
  add column if not exists is_flagged boolean not null default false,
  add column if not exists is_archived boolean not null default false;

alter table contact_messages
  drop constraint if exists contact_messages_status_check;

alter table contact_messages
  add constraint contact_messages_status_check
  check (status in ('new', 'read', 'flagged', 'replied', 'archived'));

create index if not exists contact_messages_triage_idx
  on contact_messages(is_archived, status, created_at desc);

create index if not exists contact_messages_department_idx
  on contact_messages(department_tag, created_at desc);

create table if not exists faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 200),
  answer text not null check (char_length(answer) between 1 and 1000),
  category text not null check (category in ('Patient Care', 'Billing & PhilHealth', 'Documents', 'Emergency', 'General')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users(id) on delete set null
);

create index if not exists faqs_public_order_idx
  on faqs(is_active, display_order, updated_at desc);

alter table faqs enable row level security;

drop trigger if exists set_faqs_updated_at on faqs;
create trigger set_faqs_updated_at
  before update on faqs
  for each row execute function set_updated_at();
