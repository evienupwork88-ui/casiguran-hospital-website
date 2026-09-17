-- =====================================================================
-- 0001_initial_schema.sql
-- Casiguran District Hospital Website — Initial database schema
--
-- Source of truth: docs/blueprint.md, Section 4 (Database Design).
-- Creates all 9 tables. Does NOT include audit_logs (deferred to a
-- later increment, per the blueprint).
--
-- How to apply: paste this whole file into the Supabase project's
-- SQL Editor (Dashboard → SQL Editor → New query) and run it once.
-- See backend/db/README.md for details.
-- =====================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Reusable trigger: auto-update `updated_at` on every UPDATE.
-- Applied to every table below that has an updated_at column.
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- =====================================================================
-- admin_users
-- CMS staff accounts. Exactly two roles: admin, editor.
-- password_hash is bcrypt — never plaintext, never returned by the API.
-- =====================================================================
create table admin_users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,
  password_hash  text not null,
  full_name      text not null,
  role           text not null check (role in ('admin', 'editor')),
  is_active      boolean not null default true,
  created_at     timestamptz not null default now(),
  last_login_at  timestamptz
);

alter table admin_users enable row level security;
-- No policies defined on purpose: this table is reachable ONLY through
-- the backend's Supabase service-role key, which bypasses RLS entirely.
-- RLS is enabled anyway as a deny-by-default safety net — if the anon
-- key were ever used against this table by mistake, it would see nothing.


-- =====================================================================
-- sessions
-- Server-side opaque session store (not JWT) so logins are revocable.
-- token_hash stores a hash of the session token, never the raw token.
-- =====================================================================
create table sessions (
  id             uuid primary key default gen_random_uuid(),
  token_hash     text not null unique,
  admin_user_id  uuid not null references admin_users(id) on delete cascade,
  user_agent     text,
  ip_address     text,
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null,
  revoked_at     timestamptz
);

create index sessions_admin_user_id_idx on sessions(admin_user_id);

alter table sessions enable row level security;


-- =====================================================================
-- news_posts
-- =====================================================================
create table news_posts (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  excerpt           text,
  body              text not null,
  cover_image_url   text,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  published_at      timestamptz,
  author_id         uuid references admin_users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index news_posts_status_idx on news_posts(status);

alter table news_posts enable row level security;

create trigger set_news_posts_updated_at
  before update on news_posts
  for each row execute function set_updated_at();


-- =====================================================================
-- announcements
-- =====================================================================
create table announcements (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  body         text not null,
  priority     text not null default 'normal' check (priority in ('normal', 'urgent')),
  status       text not null default 'draft' check (status in ('draft', 'published')),
  publish_at   timestamptz,
  expires_at   timestamptz,
  author_id    uuid references admin_users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index announcements_status_idx on announcements(status);

alter table announcements enable row level security;

create trigger set_announcements_updated_at
  before update on announcements
  for each row execute function set_updated_at();


-- =====================================================================
-- events
-- =====================================================================
create table events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text,
  location          text,
  start_at          timestamptz not null,
  end_at            timestamptz,
  cover_image_url   text,
  status            text not null default 'draft' check (status in ('draft', 'published')),
  author_id         uuid references admin_users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index events_status_idx on events(status);
create index events_start_at_idx on events(start_at);

alter table events enable row level security;

create trigger set_events_updated_at
  before update on events
  for each row execute function set_updated_at();


-- =====================================================================
-- documents
-- Reports, policies, and the org chart (category = 'org_chart').
-- file_path is a Supabase Storage key — never exposed to the public API
-- directly; the backend resolves it to a download link (see blueprint
-- Section 8 for the public-bucket vs signed-URL decision).
-- =====================================================================
create table documents (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  category       text not null check (category in ('report', 'org_chart', 'policy', 'other')),
  file_path      text not null,
  file_size      integer,
  mime_type      text,
  status         text not null default 'draft' check (status in ('draft', 'published')),
  published_at   timestamptz,
  uploaded_by    uuid references admin_users(id) on delete set null,
  created_at     timestamptz not null default now()
);

create index documents_status_idx on documents(status);
create index documents_category_idx on documents(category);

alter table documents enable row level security;


-- =====================================================================
-- services
-- department is intentionally nullable — grouping is not yet confirmed
-- by the hospital (see blueprint "Still open").
-- =====================================================================
create table services (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  description          text not null,
  department           text,
  icon_or_image_url    text,
  display_order        integer not null default 0,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index services_is_active_idx on services(is_active);

alter table services enable row level security;

create trigger set_services_updated_at
  before update on services
  for each row execute function set_updated_at();


-- =====================================================================
-- site_settings
-- Single-row table (id is always 1) for global public info.
-- =====================================================================
create table site_settings (
  id              integer primary key default 1 check (id = 1),
  address         text,
  phone           text,
  email           text,
  facebook_url    text,
  office_hours    text,
  map_embed_url   text,
  updated_at      timestamptz not null default now(),
  updated_by      uuid references admin_users(id) on delete set null
);

alter table site_settings enable row level security;

create trigger set_site_settings_updated_at
  before update on site_settings
  for each row execute function set_updated_at();

-- Seed the single row now — the app expects exactly one row to always
-- exist. Values start empty; the hospital provides real content later.
insert into site_settings (id) values (1);


-- =====================================================================
-- pages
-- About, Hospital History, Vision/Mission, Core Values, and any future
-- one-off institutional page. Seeded with 4 placeholder rows — real
-- content must come from the hospital (see blueprint Section 4).
-- =====================================================================
create table pages (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  body          text not null,
  updated_at    timestamptz not null default now(),
  updated_by    uuid references admin_users(id) on delete set null
);

alter table pages enable row level security;

create trigger set_pages_updated_at
  before update on pages
  for each row execute function set_updated_at();

insert into pages (slug, title, body) values
  ('about', 'About Casiguran District Hospital', 'Content pending from Casiguran District Hospital.'),
  ('hospital-history', 'Hospital History / Kasaysayan ng Ospital', 'Content pending from Casiguran District Hospital.'),
  ('vision-mission', 'Vision & Mission', 'Content pending from Casiguran District Hospital.'),
  ('core-values', 'Core Values', 'Content pending from Casiguran District Hospital.');
