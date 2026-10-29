-- Store staff names as separate parts while retaining full_name for
-- compatibility with existing data and API consumers.
alter table admin_users
  add column if not exists first_name text not null default '',
  add column if not exists middle_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists name_extension text not null default '';

update admin_users
set email = lower(trim(email));

-- Enforce the single-admin policy while preserving the admin with the
-- most recent successful login; all other admin accounts become editors.
with ranked_admins as (
  select id, row_number() over (
    order by last_login_at desc nulls last, created_at asc, id asc
  ) as admin_rank
  from admin_users
  where role = 'admin'
)
update admin_users
set role = 'editor'
where id in (select id from ranked_admins where admin_rank > 1);

create unique index if not exists admin_users_single_admin_idx
  on admin_users (role)
  where role = 'admin';

-- Key Officials names are structured the same way as staff account names.
alter table key_officials
  add column if not exists first_name text not null default '',
  add column if not exists middle_name text not null default '',
  add column if not exists last_name text not null default '',
  add column if not exists name_extension text not null default '';

-- One active OTP challenge per account email. Codes are stored as keyed
-- hashes and are consumed atomically by the completion function below.
create table if not exists password_reset_otps (
  email text primary key references admin_users(email) on delete cascade,
  otp_hash text not null,
  expires_at timestamptz not null,
  attempts smallint not null default 0 check (attempts between 0 and 5),
  created_at timestamptz not null default now()
);

alter table password_reset_otps enable row level security;

create or replace function complete_password_reset(
  p_email text,
  p_otp_hash text,
  p_password_hash text
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  reset_record password_reset_otps%rowtype;
  target_user_id uuid;
begin
  select * into reset_record
  from password_reset_otps
  where email = lower(trim(p_email))
  for update;

  if not found or reset_record.expires_at <= now() or reset_record.attempts >= 5 then
    return false;
  end if;

  if reset_record.otp_hash <> p_otp_hash then
    update password_reset_otps
      set attempts = attempts + 1
      where email = reset_record.email;
    return false;
  end if;

  update admin_users
    set password_hash = p_password_hash
    where email = reset_record.email and is_active = true
    returning id into target_user_id;

  if target_user_id is null then
    delete from password_reset_otps where email = reset_record.email;
    return false;
  end if;

  update sessions
    set revoked_at = now()
    where admin_user_id = target_user_id and revoked_at is null;

  delete from password_reset_otps where email = reset_record.email;
  return true;
end;
$$;

revoke all on function complete_password_reset(text, text, text) from public, anon, authenticated;
grant execute on function complete_password_reset(text, text, text) to service_role;
