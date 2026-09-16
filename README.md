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
├── frontend/           Next.js app (public website + admin CMS UI) — not yet scaffolded
├── backend/             Express API — not yet scaffolded
├── docs/
│   ├── blueprint.md         Full technical blueprint
│   └── decisions/           Architecture decision records (ADRs), as needed
├── .gitignore
└── README.md             this file
```

## Development Status

This project is being built incrementally (Agile increments, one small
reviewable step at a time). Current status:

- [x] **Increment 1 — Project foundation** (this commit): repo structure,
      documentation, `.gitignore`, environment variable references, Git
      initialized.
- [ ] Frontend scaffold (Next.js + TypeScript + Tailwind)
- [ ] Backend scaffold (Express + TypeScript) + health check
- [ ] Database schema
- [ ] Authentication (bcrypt + sessions)
- [ ] Public website (placeholder content)
- [ ] Admin CMS
- [ ] File/document management
- [ ] Security hardening
- [ ] Deployment

No application code, database, or API exists yet. Local setup
instructions for running the frontend and backend will be added here
once each is scaffolded in a later increment.
