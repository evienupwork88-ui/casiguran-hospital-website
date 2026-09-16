# Casiguran District Hospital Website — Technical Blueprint (v1)

**Status:** Pre-implementation. No code written yet. This is a living document — we'll revise it as decisions change during development.

**Stack recap:** Next.js + TypeScript + Tailwind (frontend) · Node.js + Express + TypeScript REST API (backend) · Supabase (Postgres + Storage **only** — used server-side only) · Authentication is handled entirely in Express: bcrypt password hashes in `admin_users` + opaque, cookie-based server sessions with CSRF protection and role-based access control (see Section 6).

**Change log:** v1 locked in the following decisions after review — document-based org chart confirmed, `services.department` kept optional/nullable pending hospital input, custom bcrypt/session auth instead of Supabase Auth, new `pages` table added for About/Hospital History/Vision/Mission/Core Values, optional `description` added to `documents`.

---

## 1. Monorepo / Project Structure

Recommendation: **two independent folders, no workspace tooling.**

```
casiguran-hospital-website/
├── frontend/                 # Next.js app — deploys independently
├── backend/                  # Express API — deploys independently
├── docs/
│   ├── blueprint.md          # this document, kept in-repo and updated as we go
│   └── decisions/            # short ADRs for notable choices (e.g. 0001-session-auth.md)
├── .gitignore
└── README.md
```

**Why not npm/pnpm workspaces (a common "monorepo" pattern):** workspaces mainly help when packages share dependencies or get built together. Here, `frontend` and `backend` are genuinely separate deployables going to different hosts (e.g. Vercel for Next.js, Render/Railway for Express) — each platform is happiest pointed at a plain folder with its own `package.json` and lockfile. Adding workspace tooling would be infrastructure for a problem we don't have yet, which goes against "don't introduce tooling without a concrete reason." If the two apps ever need to share code (e.g. TypeScript types), a small `shared/` package is easy to add later — no need to decide that now.

**Why a `docs/` folder:** you asked to avoid "vibe coding" and to keep decisions explained. Keeping this blueprint (and short decision records as they come up) *in the repo* means the reasoning travels with the code, not just in chat history.

Root-level `.env.example` isn't included above because each app has its own env needs — `frontend/.env.local.example` and `backend/.env.example` live inside their respective folders (see Section 9).

---

## 2. Frontend Architecture (Next.js, App Router)

```
frontend/
├── app/
│   ├── (public)/                  # route group — no URL prefix, own layout
│   │   ├── layout.tsx             # public header/footer/nav
│   │   ├── page.tsx                # "/"  (home)
│   │   ├── about/page.tsx
│   │   ├── hospital-history/page.tsx
│   │   ├── vision-mission/page.tsx
│   │   ├── core-values/page.tsx
│   │   ├── services/page.tsx
│   │   ├── news/page.tsx
│   │   ├── news/[slug]/page.tsx
│   │   ├── announcements/page.tsx
│   │   ├── events/page.tsx
│   │   ├── documents/page.tsx
│   │   └── contact/page.tsx
│   └── admin/                      # real folder — URL prefix "/admin/..."
│       ├── layout.tsx              # auth guard + admin shell (sidebar, topbar)
│       ├── login/page.tsx          # the one admin page NOT behind the guard
│       ├── dashboard/page.tsx
│       ├── news/{page.tsx, new/page.tsx, [id]/edit/page.tsx}
│       ├── announcements/...
│       ├── events/...
│       ├── documents/...
│       ├── services/...
│       ├── pages/{page.tsx, [id]/edit/page.tsx}    # About / Hospital History / Vision-Mission / Core Values
│       ├── settings/page.tsx
│       └── users/page.tsx          # role-gated: admin only
├── components/
│   ├── public/                     # Navbar, Footer, Hero, NewsCard, EventCard...
│   ├── admin/                      # Sidebar, DataTable, ContentForm, ConfirmDialog...
│   └── ui/                         # shared primitives (Button, Badge, Input, Modal)
├── lib/
│   ├── api/                        # ALL fetch calls live here — one file per domain
│   │   ├── news.ts, announcements.ts, events.ts, documents.ts, services.ts, pages.ts, auth.ts
│   ├── types/                      # TS types mirroring backend response shapes
│   └── utils/
├── styles/globals.css              # Tailwind + design tokens as CSS variables
└── middleware.ts                   # redirects unauthenticated users away from /admin/*
```

**Why `(public)` uses parentheses but `admin` doesn't:** a parenthesized folder is a Next.js *route group* — it organizes files and lets us apply a distinct layout without adding a URL segment, so `(public)/news/page.tsx` is served at `/news`, not `/public/news`. `admin/` is a normal folder on purpose, because we *want* `/admin/...` to appear in the URL.

**Where API calls live:** exclusively in `lib/api/*`. No component or page ever calls `fetch()` directly. Each file wraps the calls for one backend domain (base URL, `credentials: 'include'` for cookies, consistent error shape). This is the single place that would change if the API's base URL or response format ever shifts.

**A deliberate non-decision:** Next.js supports its own `app/api/*` route handlers. We will **not** use them for business logic — doing so would quietly recreate a second backend and blur the clean frontend/backend separation you asked for. The only thing `middleware.ts` does is a cheap, UX-level redirect (no valid-looking session cookie → bounce to `/admin/login`). It is *not* a security boundary — the real authorization check happens on every request inside Express, because middleware running at the edge can't be trusted as the sole gatekeeper.

**Loading / error / empty states:** every data-driven view needs three explicit states, not just a happy path:
- **Loading** — a skeleton or spinner (Next.js `loading.tsx` per route segment for server-rendered public pages; local `status` state for client-rendered admin forms/tables).
- **Empty** — an explicit message ("No announcements yet") rather than a blank space, since a hospital page with placeholder content will hit this constantly during development.
- **Error** — a visible, human message with a retry action (`error.tsx` per route segment on the public side; inline error banners in admin forms), never a silent failure.

---

## 3. Backend Architecture (Express)

```
backend/
├── src/
│   ├── server.ts                   # creates the app, starts listening
│   ├── app.ts                      # wires middleware + mounts routers
│   ├── config/
│   │   ├── env.ts                  # loads & validates env vars at startup — fails fast
│   │   └── supabase.ts             # Supabase client (service role) — server-only
│   ├── routes/
│   │   ├── index.ts
│   │   ├── auth.routes.ts
│   │   ├── public/  (news, announcements, events, documents, services, settings).routes.ts
│   │   └── admin/   (news, announcements, events, documents, services, settings, users, media).routes.ts
│   ├── controllers/                # parse request, call service, shape response — no business logic
│   ├── services/                   # actual business logic + queries live here
│   ├── middleware/
│   │   ├── requireAuth.ts          # cookie → session lookup → req.user, else 401
│   │   ├── requireRole.ts          # e.g. requireRole('admin')
│   │   ├── csrf.ts
│   │   ├── rateLimit.ts
│   │   ├── validate.ts             # wraps Zod schema validation
│   │   └── errorHandler.ts         # last middleware in the chain
│   ├── validation/                 # Zod schemas, one per resource
│   ├── db/client.ts                # query helper
│   └── utils/{logger.ts, asyncHandler.ts}
└── package.json
```

**Flow:** `route → middleware (auth/role/validation) → controller → service → database`. Controllers stay thin (HTTP concerns only); services hold the actual logic, which makes them independently testable without spinning up Express.

**Error handling:** services/controllers throw a typed `AppError(statusCode, message, code)`. `asyncHandler` wraps every async route so thrown errors reach `errorHandler` instead of crashing the process. `errorHandler` returns a consistent `{ error: { message, code } }` shape, logs full details server-side, and — critically — never leaks a stack trace or raw database error to the client in production.

---

## 4. Database Design (conceptual — no SQL yet)

Kept intentionally minimal: **9 tables**. No separate org-chart table — the org chart is a `documents` row with `category = 'org_chart'` (the hospital supplies the official PDF/image; nothing about departments, positions, or personnel is modeled or invented — see the note under `documents` below). No separate table for About/Vision/Mission either — those live in the new `pages` table.

### `admin_users`
- **Purpose:** hospital staff/admin accounts that can log into the CMS.
- **Key fields:** `id`, `email` (unique), `password_hash` (bcrypt), `full_name`, `role` (`admin` \| `editor`), `is_active`, `created_at`, `last_login_at`.
- **Relationships:** referenced by `sessions.admin_user_id` and by `author_id`/`uploaded_by` columns on content tables.
- **Required:** `email`, `password_hash`, `full_name`, `role`.
- **Publicly visible:** none by default (optionally just `full_name` as a news byline — a call we can make later).
- **Admin-only:** everything, `password_hash` above all — it's never returned in any API response, including to the account's own owner.
- **Note:** at launch this table will hold exactly one row (you, as `admin`). `editor` rows get added later through the Users endpoints once hospital staff are ready to help manage content.

### `sessions`
- **Purpose:** server-side session store so logins are revocable, not just stateless tokens.
- **Key fields:** `id` (random token, stored hashed), `admin_user_id`, `user_agent`, `ip_address`, `created_at`, `expires_at`, `revoked_at`.
- **Relationships:** belongs to `admin_users`.
- **Required:** `admin_user_id`, `expires_at`.
- **Publicly visible / admin-only:** entirely internal; not exposed via any CRUD UI (a future "log out all devices" feature could read it).

### `news_posts`
- **Purpose:** news articles for the public News section.
- **Key fields:** `id`, `title`, `slug` (unique), `excerpt`, `body`, `cover_image_url`, `status` (`draft`\|`published`), `published_at`, `author_id`, `created_at`, `updated_at`.
- **Relationships:** `author_id → admin_users`.
- **Required:** `title`, `slug`, `body`, `status`.
- **Publicly visible:** `title`, `slug`, `excerpt`, `body`, `cover_image_url`, `published_at` — **only where `status = published`**.
- **Admin-only:** `status`, `author_id`, anything still in `draft`.

### `announcements`
- **Purpose:** short, often time-sensitive notices.
- **Key fields:** `id`, `title`, `body`, `priority` (`normal`\|`urgent`), `status`, `publish_at`, `expires_at`, `author_id`, `created_at`, `updated_at`.
- **Relationships:** `author_id → admin_users`.
- **Required:** `title`, `body`, `status`.
- **Publicly visible:** `title`, `body`, `priority`, `publish_at`, `expires_at` — published and not-yet-expired only.
- **Admin-only:** `status`, `author_id`, drafts.

### `events`
- **Purpose:** hospital events/activities for a public calendar.
- **Key fields:** `id`, `title`, `description`, `location`, `start_at`, `end_at`, `cover_image_url`, `status`, `author_id`, `created_at`, `updated_at`.
- **Relationships:** `author_id → admin_users`.
- **Required:** `title`, `start_at`, `status`.
- **Publicly visible:** `title`, `description`, `location`, `start_at`, `end_at`, `cover_image_url` — published only.
- **Admin-only:** `status`, `author_id`.

### `documents`
- **Purpose:** downloadable public files — reports, citizen's charter, procurement notices, **and the org chart** (as `category = 'org_chart'`).
- **Key fields:** `id`, `title`, `description` (optional), `category` (`report`\|`org_chart`\|`policy`\|`other`), `file_path` (Storage key, not a raw public URL), `file_size`, `mime_type`, `status`, `published_at`, `uploaded_by`, `created_at`.
- **Relationships:** `uploaded_by → admin_users`.
- **Required:** `title`, `category`, `file_path`, `status`. `description` is nullable — a plain filename-style title is enough to publish.
- **Publicly visible:** `title`, `description`, `category`, `published_at`, and a generated download link — published only. The raw `file_path` itself is never handed to the client directly (see Section 8).
- **Admin-only:** `file_path`, `uploaded_by`, `status`, `file_size`/`mime_type`.
- **Org chart specifics:** the hospital provides the official file as-is — no departments, positions, hierarchy, or names are modeled or entered by hand. "Replacing" the chart later just means an admin/editor uploads a new file against the same `category = 'org_chart'` entry; whether that updates the existing row's `file_path` or archives the old row and inserts a new one is a small implementation detail for Phase 7, not a schema question.

### `services`
- **Purpose:** hospital departments/services listing (OPD, ER, Laboratory, etc.).
- **Key fields:** `id`, `name`, `description`, `department` (optional), `icon_or_image_url` (optional), `display_order`, `is_active`, `created_at`, `updated_at`.
- **Required:** `name`, `description`.
- **Publicly visible:** `name`, `description`, `department` (if set), `icon_or_image_url` (if set), `display_order` — active only.
- **Admin-only:** `is_active`, timestamps.
- **Note on `department`:** nullable for v1 — how the hospital actually groups its services hasn't been confirmed, so the field exists in the schema but isn't required or assumed. If the hospital later confirms real groupings, the Services page can switch from a flat list to grouped sections without a schema change — just start populating the column.

### `site_settings`
- **Purpose:** single-row table for global public info (address, phone, email, Facebook link, office hours, map embed).
- **Key fields:** fixed single row — `address`, `phone`, `email`, `facebook_url`, `office_hours`, `map_embed_url`, `updated_at`, `updated_by`.
- **Relationships:** `updated_by → admin_users`.
- **Publicly visible:** everything except `updated_by`/`updated_at`.
- **Admin-only:** `updated_by`, `updated_at`.

### `pages`
- **Purpose:** long-form institutional content — About, Hospital History, Vision/Mission, Core Values, and any future one-off page the hospital asks for — without needing a new table each time.
- **Key fields:** `id`, `slug` (unique — `about`, `hospital-history`, `vision-mission`, `core-values`), `title`, `body`, `updated_at`, `updated_by`.
- **Relationships:** `updated_by → admin_users`.
- **Required:** `slug`, `title`, `body`.
- **Publicly visible:** `slug`, `title`, `body`.
- **Admin-only:** `updated_at`, `updated_by`.
- **Why this instead of `site_settings`:** `site_settings` is structured, single-value config (a phone number, an address) rendered into fixed UI slots. About/Hospital History/Vision/Mission is editorial prose that changes shape and grows over time — letting `site_settings` absorb it would mean adding a new text column every time the hospital wants one more page, which is the kind of accretion this review was meant to catch. `pages` absorbs all of that with zero future schema changes: a new page is just a new row.
- **Content provenance (applies to `hospital-history` specifically, same principle as the org chart):** the body text must come from the hospital, not be drafted or inferred. Until the hospital provides and approves the actual history, the seeded row ships with clearly-labeled placeholder text (e.g. "Content pending from Casiguran District Hospital") — never invented dates, founders, or milestones.
- **One naming note, not a decision made for you:** you referred to this page as "Hospital History / Kasaysayan ng Ospital." The current `pages` schema holds one `title` and one `body` per row — fine if the Filipino name is just a subtitle/label on an otherwise single-language page, but a genuine bilingual version (separate English and Filipino body text) would need either two rows (`hospital-history-en` / `hospital-history-fil`) or per-locale columns — a small but real schema choice, not something to assume silently. Flagged in "Still open" below rather than decided here.

### `audit_logs` *(recommended, but deferrable to Phase 8 — not needed to start building)*
- **Purpose:** accountability trail — who published, edited, or deleted what.
- **Key fields:** `id`, `admin_user_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb), `created_at`.
- **Publicly visible:** none. **Admin-only**, and arguably visible only to the `admin` role, not `editor`.

---

## 5. API Design

Split by prefix so auth/rate-limit/CORS policy is easy to reason about per zone: `/api/public/*` (no auth) and `/api/admin/*` (auth + role required).

### Auth
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/api/auth/login` | Verify credentials, start a session | none | — |
| POST | `/api/auth/logout` | End the current session | required | any |
| GET | `/api/auth/me` | Return current user (id, name, role) | required | any |

### News
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/api/public/news` | List published news (paginated) | none | — |
| GET | `/api/public/news/:slug` | Single published article | none | — |
| GET | `/api/admin/news` | List all news, any status | required | editor, admin |
| POST | `/api/admin/news` | Create | required | editor, admin |
| GET | `/api/admin/news/:id` | Get one, any status | required | editor, admin |
| PUT | `/api/admin/news/:id` | Update | required | editor, admin |
| DELETE | `/api/admin/news/:id` | Delete | required | admin |

### Announcements / Events
Same shape as News (list/detail public + full admin CRUD), same role pattern: **editor + admin** can create/update, **admin only** deletes.

### Documents / Reports (org chart included via `category`)
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/api/public/documents` | List published docs, optional `?category=` | none | — |
| GET | `/api/public/documents/:id/download` | Resolve a short-lived download link | none | — |
| GET | `/api/admin/documents` | List all | required | editor, admin |
| POST | `/api/admin/documents` | Upload + create metadata | required | editor, admin |
| PUT | `/api/admin/documents/:id` | Edit metadata | required | editor, admin |
| DELETE | `/api/admin/documents/:id` | Delete file + row | required | admin |

*No separate "organizational information" endpoint exists — it's `/api/public/documents?category=org_chart`, consistent with the minimal-tables decision in Section 4.*

### Services
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/api/public/services` | List active services | none | — |
| GET | `/api/admin/services` | List all | required | editor, admin |
| POST | `/api/admin/services` | Create | required | editor, admin |
| PUT | `/api/admin/services/:id` | Update | required | editor, admin |
| DELETE | `/api/admin/services/:id` | Delete | required | admin |

### Pages (About / Vision / Mission / Core Values)
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/api/public/pages/:slug` | Fetch one published page by slug | none | — |
| GET | `/api/admin/pages` | List all pages | required | editor, admin |
| GET | `/api/admin/pages/:id` | Get one for editing | required | editor, admin |
| PUT | `/api/admin/pages/:id` | Update title/body | required | editor, admin |

*No `POST`/`DELETE` for v1 — the initial set of pages (`about`, `hospital-history`, `vision-mission`, `core-values`) is seeded once during setup and only ever edited, not created or removed through the CMS. This keeps the feature to exactly what's needed rather than building general-purpose page management nobody asked for.*

### Site Settings
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/api/public/settings` | Public subset (contact/address/etc.) | none | — |
| GET | `/api/admin/settings` | Full record | required | admin |
| PUT | `/api/admin/settings` | Update | required | admin |

*Settings are admin-only to edit (not editor) since it's site-wide identity info, not routine content — open to revisiting if that feels too restrictive once real staff use it.*

### Users (staff account management)
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| GET | `/api/admin/users` | List staff accounts | required | admin |
| POST | `/api/admin/users` | Create a staff account | required | admin |
| PUT | `/api/admin/users/:id` | Update role/status | required | admin |
| DELETE | `/api/admin/users/:id` | Deactivate (soft-delete preferred) | required | admin |

### Media
| Method | Endpoint | Purpose | Auth | Role |
|---|---|---|---|---|
| POST | `/api/admin/media` | Upload a file to Storage | required | editor, admin |
| DELETE | `/api/admin/media/:id` | Remove a file | required | admin |

---

## 6. Authentication & RBAC

**Roles: exactly two — `admin` and `editor`. No `viewer`.**

Reasoning: the public site is already fully readable without an account, so there's no scenario here that needs "logged-in but read-only" access — that's what a `viewer` role is normally for. Adding one now would be a role with nothing to do. Two roles map cleanly onto real hospital structure: **editor** = day-to-day content staff (creates/edits news, announcements, events, services, documents, pages), **admin** = full system and content-management access, including staff accounts and admin-level settings. At launch there is exactly one account — you, as `admin`. `editor` accounts get created through the Users endpoints once hospital staff are ready to help manage content; the role isn't hypothetical, it's just unused until then.

**Authentication provider: none — handled directly in Express.** Supabase is used only for Postgres and Storage. Credentials are verified in-house with bcrypt rather than through Supabase Auth, because for a handful of total staff accounts, adding a second, external account system on top of our own `admin_users`/`sessions` tables would be more moving parts for the same result — one account store instead of two, with no loss of security (bcrypt is the same algorithm Supabase Auth uses internally).

**Login flow:**
1. `POST /api/auth/login` with email/password.
2. Express looks up the account by email in `admin_users`, then compares the submitted password against the stored `password_hash` using bcrypt — no external service involved, and the comparison is timing-safe by virtue of bcrypt's own design.
3. On success, Express creates a row in `sessions` (random opaque token, stored hashed, tied to the user, with an expiry — e.g. 8–12 hours).
4. Express sets **one cookie**: the session token, `HttpOnly`, `Secure` (production), `SameSite=Lax`.
5. The response body returns only non-sensitive user info (name, role) for the UI — never the raw token, and never the password hash.

**Session maintenance:** every protected request, `requireAuth` reads the cookie, hashes it, looks it up in `sessions`, confirms it's not expired/revoked, confirms the linked `admin_users.is_active`, and attaches `req.user = { id, role }`.

**Enforcing protected routes:** each admin route declares its own requirements explicitly — `requireAuth` first (401 if missing/invalid), then `requireRole('admin')` or `requireRole('editor','admin')` (403 if wrong role) — rather than a hidden global rule, so it's obvious from reading `routes/admin/*.ts` exactly what a route needs.

**Authorization beyond the route gate:** the main defense is correct route wiring (an editor-safe controller function is never mounted under an admin-only route by mistake) — this is a concrete thing to double-check in code review during Phase 4, since it's a realistic real-world bug class, not a theoretical one.

---

## 7. Security Architecture

Each mechanism below is tied to *where* it actually applies — not included just because it's a recognizable security buzzword.

- **HttpOnly cookies** — applies to the session cookie specifically, because that's the one piece of state that must never be readable by JavaScript (the core defense against token theft via XSS). Not a blanket rule for every cookie we might ever set.
- **Secure flag** — cookie only transmitted over HTTPS. Applies in production; local HTTP development needs this conditionally relaxed, or a local HTTPS proxy — a concrete environment difference to configure, not an afterthought.
- **SameSite=Lax (not Strict)** — Strict would break an admin clicking a link from outside the site straight into a logged-in `/admin` page, which is a real workflow. Lax still blocks the classic cross-site form-POST CSRF vector, but — as you noted — it does **not** cover every cross-site request path, which is exactly why CSRF tokens are still required below.
- **CSRF protection** — applies only to state-changing admin requests (POST/PUT/DELETE) that rely on the cookie for auth; public GET endpoints need none. Mechanism: double-submit cookie — a non-HttpOnly `csrf_token` cookie is readable by our own frontend JS and echoed back as a custom header on mutating requests; the server checks the header against the expected value. A cross-site attacker can make the browser attach cookies, but can't read the CSRF cookie's value to forge the header (blocked by same-origin policy).
- **CORS** — allowlist exactly the deployed frontend origin (and localhost during dev), `credentials: true`, never a wildcard. This only matters for the admin API surface in practice, since public GET endpoints don't carry credentials anyway.
- **Rate limiting** — strictest on `/api/auth/login` (e.g. ~5–10 attempts per IP per 15 minutes) to blunt brute-force attempts; a lighter general limit on the rest of `/api/*` mainly guards against basic scraping/abuse, since most of that traffic is public and read-only anyway.
- **Input validation** — Zod schemas on every endpoint accepting a body or query params that affect a query, enforced server-side in middleware before the controller runs. Frontend form validation is UX only; it stops nothing malicious on its own.
- **Security headers** — Helmet globally, for sane defaults (`X-Content-Type-Options`, `Referrer-Policy`, HSTS in production, frame-ancestors). The Content-Security-Policy needs specific thought once we pick how to embed the Facebook page and the map — those third-party embeds will need explicit `frame-src`/`connect-src` allowances, which we should decide concretely rather than leaving CSP overly permissive "just in case."
- **File upload security** — see Section 8.
- **Environment variables** — no secret is ever hardcoded; all required vars are validated at process startup so a missing key fails immediately and obviously, not confusingly mid-request.
- **Logging** — request method/path/status/duration and errors are logged server-side; passwords, tokens, and full session IDs are **never** logged, even partially during debugging — an explicit rule, since "just log the request body while debugging" is exactly how secrets end up in log files.
- **Error handling** — production error responses are generic for 5xx errors (full detail goes to server logs only); 4xx validation errors can safely return specific field-level messages, since that's just helping a legitimate user fix their input, not leaking anything sensitive.

---

## 8. File / Document Uploads

**In Supabase Storage:** the actual binary files — PDFs (reports, citizen's charter, procurement notices) and images (news covers, event photos, service icons).

**In Postgres:** metadata only — title, category, storage path/key, file size, mime type, status, uploader, timestamps (see the `documents` table above). A cover image on a `news_posts` row is just a stored path/URL, not a duplicate file record.

**Allowed types (starting point):**
- Images: `.jpg`, `.png`, `.webp`
- Documents: `.pdf` only, initially — the standard public-facing report format. If the hospital later needs to publish an editable Office file, we can extend this deliberately rather than defaulting to it.

**Size limits (starting point, adjustable once we see real report sizes):** images ≈5MB, PDFs ≈20MB — enforced server-side (the only place it actually matters); client-side limits are just for a nicer upload experience.

**Access model — a decision to make together:**
- **Option A (simpler):** published files live in a public Storage bucket with a stable public URL. Fewest moving parts, fine given there's no sensitive/patient data involved.
- **Option B (more control, recommended default):** files stay in a private bucket; the backend always mediates access by generating a short-lived signed URL on request, even for published files. Slightly more backend work, but means if the hospital ever asks to take a report down, access is cut off immediately — with Option A, a previously public URL may already be cached or indexed elsewhere.

I'd lean toward **Option B** as the more production-appropriate default, but it's a reasonable trade-off to revisit if it adds friction later.

**Safe upload/delete flow:**
- **Upload:** admin selects a file in the CMS → backend validates the actual file content (checking file signature/magic bytes, not just the extension or client-supplied Content-Type, both of which can be spoofed) → file is stored under a server-generated path/filename (never the user's original filename, to avoid path traversal or overwrite collisions) → a `documents` row is created pointing at that path.
- **Delete:** removes the Storage object and its Postgres row together, restricted to `admin` (see API table in Section 5).

---

## 9. Environment Configuration

No real values — names and purpose only.

**`backend/.env`**
| Variable | Purpose |
|---|---|
| `NODE_ENV` | `development` \| `production` |
| `PORT` | Express listen port |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key — never sent to the frontend |
| `DATABASE_URL` | Direct Postgres connection, if used alongside the Supabase client |
| `SESSION_COOKIE_NAME` | Name of the session cookie |
| `SESSION_SECRET` | Used to hash/sign session and CSRF tokens |
| `SESSION_TTL_HOURS` | Session lifetime |
| `CORS_ALLOWED_ORIGINS` | Comma-separated allowlist |
| `RATE_LIMIT_LOGIN_MAX` / `RATE_LIMIT_LOGIN_WINDOW_MINUTES` | Login throttle config |
| `MAX_UPLOAD_IMAGE_MB` / `MAX_UPLOAD_DOC_MB` | Upload size caps |
| `STORAGE_BUCKET_NAME` | Supabase Storage bucket |
| `LOG_LEVEL` | Logger verbosity |

**`frontend/.env.local`**
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Where the frontend sends API requests |
| `NEXT_PUBLIC_SITE_NAME` | Display-only config |

Note: things like the Facebook page URL, address, and map embed are **content**, not config — they come from `site_settings` via the API, not from environment variables, so the hospital can update them without a redeploy.

---

## 10. Development Phases

Your suggested progression holds up well; I've added one sub-phase (4.5) worth calling out on its own.

1. **Project setup** — repo structure, both app scaffolds, ESLint/Prettier, Supabase project created, env files scaffolded, a working health-check endpoint reachable from the frontend.
2. **Database** — create all 9 tables from Section 4 (including `pages`), seed one `admin_users` row (with a bcrypt-hashed password) for testing, confirm connectivity from Express.
3. **Backend foundation** — Express skeleton (routes/controllers/services/middleware folders), centralized error handler, logger, env validation — no real business logic yet beyond the health check.
4. **Authentication / RBAC** — login/logout/me built on bcrypt + the `sessions` table, cookie handling, `requireAuth`/`requireRole`, CSRF middleware, login rate limiting — fully verified end-to-end with the seeded admin before moving on.
   - **4.5 — First full CRUD domain(s).** Build **Announcements** first (fullest shape — status, priority, expiry — makes the best template): routes → validation → controller → service → public + admin endpoints, tested by hand (Postman/Thunder Client). Then build **Pages** right after — it's simpler than the domain it's copying (no status/publish workflow, just fetch-and-edit), so it's a fast second rep of the same pattern before moving on to the rest.
5. **Public website** — Next.js public routes, shared layout/nav/footer, wired to the public API, loading/error/empty states, placeholder content throughout.
6. **Admin CMS** — Next.js admin shell, login screen, dashboard, CRUD forms per domain, following the Phase 4.5 pattern on the backend as each domain is added.
7. **File/document management** — Storage integration, upload/download flow, wiring into news/event cover images and the reports/documents page.
8. **Testing / security hardening** — OWASP checklist pass, CSP tuning for the map/Facebook embeds, rate-limit tuning, a manual "try to break my own auth/CSRF" pass, add `audit_logs` if not already in place.
9. **Deployment** — resolve the hosting question, configure production env vars, HTTPS, DNS, backups — then a **hospital review of the fully placeholder-populated site** before any real content goes in.

---

## Resolved this session
- Org chart: document-based (`documents`, `category = 'org_chart'`), no invented structure — confirmed.
- `services.department`: kept optional/nullable pending hospital input on how services are actually grouped.
- Roles: `admin` + `editor` confirmed, one `admin` account at launch.
- Authentication: bcrypt + `admin_users.password_hash` + Express sessions — Supabase Auth dropped from the design.
- Added `pages` table for About/Vision/Mission/Core Values.
- Added optional `description` to `documents`.
- Security measures (CSRF, CORS, rate limiting, validation, headers, upload hardening) reconfirmed as-is.
- **Added `hospital-history` as a fourth seeded row in `pages`** (slugs now: `about`, `hospital-history`, `vision-mission`, `core-values`). No new table — reuses the existing `pages` design exactly as-is (same fields, same API shape, same admin-editable pattern). Content must come from the hospital; nothing historical is invented.

## Still open
- Hosting target for `frontend`/`backend`
- Draft → published only, or an approval step before publishing
- Public contact form (needs outbound email) — yes or no for v1
- Storage access model — Option A (public bucket) vs Option B (private + signed URLs)
- Whether services should be grouped by department, once the hospital confirms how they actually organize services
- The hospital's actual logo file, for eventual production use
- Actual Hospital History text — page ships with placeholder content until the hospital provides and approves it
- Whether "Hospital History / Kasaysayan ng Ospital" needs true bilingual content (separate EN/FIL text) or is just a bilingual page title over single-language body text
