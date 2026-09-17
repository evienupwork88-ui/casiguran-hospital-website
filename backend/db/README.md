# Database Setup

Schema source of truth: [`docs/blueprint.md`](../../docs/blueprint.md), Section 4.
No ORM/migration tool in use yet — plain SQL files, applied by hand
through the Supabase dashboard. Simple on purpose at this stage;
revisit only if that becomes a real pain point.

## 1. Create a Supabase project (skip if you already have one)

1. [supabase.com](https://supabase.com) → New project.
2. Note the **Project URL** and the **`service_role` secret key**
   (Project Settings → API) — you'll need both for `backend/.env`.
   The `service_role` key is powerful (bypasses Row Level Security)
   and must never be exposed to the frontend or committed to git.

## 2. Apply the schema

1. In the Supabase dashboard: **SQL Editor → New query**.
2. Paste the entire contents of
   [`migrations/0001_initial_schema.sql`](migrations/0001_initial_schema.sql).
3. Run it.

This creates all 9 tables from the blueprint (everything except
`audit_logs`, which is deferred), enables Row Level Security on each
with no public policies (the backend's `service_role` key bypasses RLS
entirely — RLS is on as a deny-by-default safety net, not because
anything currently relies on a policy), and seeds:
- `site_settings` — one empty row (the app expects exactly one to
  always exist)
- `pages` — four placeholder rows (`about`, `hospital-history`,
  `vision-mission`, `core-values`), each with clearly-labeled
  placeholder text until the hospital provides real content

Re-running the file will error on `CREATE TABLE` (tables already
exist) — that's expected, it's not designed to be idempotent yet.

## 3. Configure your local backend

```
cd backend
cp .env.example .env
```
Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from step 1.

## 4. Seed the admin account

Add to `backend/.env`:
```
ADMIN_SEED_EMAIL=you@example.com
ADMIN_SEED_PASSWORD=choose-a-real-password-12-chars-min
ADMIN_SEED_NAME=Your Name
```

Then:
```
npm run seed:admin
```

This bcrypt-hashes the password (plaintext is never sent to the
database or stored anywhere) and creates/updates the `admin_users` row.
Running it again with the same email safely updates that same account
instead of creating a duplicate.

A successful run also confirms Express can actually reach your
Supabase database — if you see the "Connectivity confirmed" message,
this increment is done.

Editor accounts get created the same way later, once the `/api/admin/users`
endpoint exists (a future increment) — for now this script only ever
creates `role: 'admin'` accounts.
