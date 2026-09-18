# Casiguran District Hospital Website

## Project Purpose

Official public information website for Casiguran District Hospital
(Casiguran, Aurora, Philippines). The site gives the public access to
hospital information — About, Hospital History, Vision/Mission, Core
Values, Services, News, Announcements, Events, Reports/Documents,
Organizational Chart, and Contact/Location — and includes an
authenticated admin CMS so hospital staff can manage that content
without editing code.

Public content is placeholder until explicitly provided and approved
by the hospital. No patient data is stored by this system.

## Technology Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript (REST API)
- **Database:** Supabase (PostgreSQL) — Postgres + Storage only
- **Authentication:** bcrypt password hashes + Express-managed,
  cookie-based server sessions (not Supabase Auth)

Full architecture, database design, API design, and security decisions
are documented in **[`docs/blueprint.md`](docs/blueprint.md)** — that
document is the baseline architecture for this project and should be
consulted before making any structural changes.

## Project Structure

```
casiguran-hospital-website/
├── frontend/           Next.js app (public website + admin CMS UI)
├── backend/             Express API
├── docs/
│   ├── blueprint.md         Full technical blueprint
│   └── decisions/           Architecture decision records (ADRs), as needed
├── .gitignore
└── README.md             this file
```

## Development Status

This project is being built incrementally (Agile increments, one small
reviewable step at a time). Current status:

- [x] **Increment 1 — Project foundation**: repo structure, documentation,
      `.gitignore`, environment variable references, Git initialized.
- [x] **Increment 2 — Frontend & backend scaffolding**: Next.js
      (TypeScript, Tailwind) frontend and Express (TypeScript) backend
      both scaffolded and runnable independently; backend health check
      live at `GET /api/health`.
- [x] **Increment 3 — Database**: all 9 tables from the blueprint
      created in Supabase (schema verified against a real local
      Postgres before delivery — see `backend/db/`), admin account
      seed script (bcrypt), Express-to-database connectivity confirmed.
- [x] **Increment 4 — Authentication**: `POST /api/auth/login`,
      `POST /api/auth/logout`, `GET /api/auth/me`; bcrypt password
      verification, opaque server-side sessions (hashed, revocable),
      `requireAuth`/`requireRole` RBAC middleware, CSRF protection
      (double-submit cookie), login rate limiting, Zod validation,
      Helmet security headers, centralized error handling. Verified
      with 12 real HTTP test scenarios before delivery (see commit
      message for the full list) — login/logout flow, wrong password,
      unknown email (no enumeration), invalid input, missing/wrong/
      correct CSRF token, session revocation, deactivated account,
      rate-limit exhaustion, and RBAC role checks.
- [ ] Public website (placeholder content)
- [ ] Admin CMS
- [ ] File/document management
- [ ] Security hardening
- [ ] Deployment

No public-facing pages or admin UI exist yet — Increment 4 is API-only,
tested via curl/Postman. The frontend does not have a login page yet;
that's part of Admin CMS.

**New required env var:** `SESSION_SECRET` — the backend will now
refuse to start without it. Generate one with:
```
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running Locally

Frontend and backend are independent Node projects — run each in its
own terminal.

**Backend** (Express API, runs on http://localhost:4000):
```bash
cd backend
npm install
cp .env.example .env      # fill in values as needed; defaults work for now
npm run dev
```
Verify it's up: `curl http://localhost:4000/api/health` should return
`{"status":"ok", ...}`.

**Frontend** (Next.js, runs on http://localhost:3000):
```bash
cd frontend
npm install
cp .env.local.example .env.local   # fill in values as needed
npm run dev
```

The two are not yet wired together — the frontend does not call the
backend yet. That comes in a later increment.
