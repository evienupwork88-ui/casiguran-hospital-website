<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Custom Agent Instructions

## Project Layout
- `frontend/`: Next.js 16 (App Router), React 19, TypeScript, Tailwind 4, lucide-react. Run npm/next commands from here.
  - Verify with `npm run lint` and `npm run build`. No test runner yet.
- `backend/`: Express 5 + TypeScript API, Supabase DB, zod validation, multer uploads, cookie-based admin auth.
  - Run from `backend/`: `npm run dev`, verify with `npm run type-check`. `npm run seed:admin` creates the admin user.
  - No test runner yet.
- `docs/blueprint.md`: project blueprint. Read before feature work or design specs.
- `docs/decisions/`: past decisions. Check before changing architecture; add a note when making a new one.
- Next.js docs: `frontend/node_modules/next/dist/docs/` (not root).

## Project Context
- Custom CMS: admin UI in `frontend/` manages content (news, events, announcements, trainings) via the `backend/` API; public pages render it. Don't hardcode content that belongs in the CMS.
- Validate all backend input with zod. Never commit secrets or `.env` files.
- Agile: one small vertical slice per task (backend + admin + public page when needed). Define acceptance criteria before coding.

## 1. Workflow & Methodology (Superpowers)
- Wayfinder: for unclear or greenfield tasks, check `docs/blueprint.md` and `docs/decisions/` first, then list assumptions and open questions and ask before coding. Skip for small, clear tasks.
- Always brainstorm and present a brief design spec (max 5 lines) before modifying code.
- Break down tasks into small, verifiable steps.
- Follow Test-Driven Development (TDD) principles where a test setup exists. Otherwise verify with `npm run lint`, `npm run build` (frontend) or `npm run type-check` (backend), and state what was checked manually.
- Read Next.js bundled docs only when touching routing, data fetching, caching, config, or APIs. Skip for styling/text changes.

## 2. Testing
- E2E: Playwright (in `frontend/`). One test per critical flow, e.g. admin creates/edits content, then it appears on the public page. Not per component.
- New feature touching a user flow: add or update its e2e test in the same change.
- Run affected tests before reporting done. Report pass/fail.
- No e2e setup yet: ask before installing Playwright (needs frontend + backend running and a test database/admin).

## 3. Code Quality & Style (Ponytail)
- Keep implementation as concise as possible; strictly avoid over-engineering.
- Prefer native browser/language APIs over adding unnecessary NPM packages. Ask first before adding one.
- Write minimal, readable, and highly efficient code.

## 4. Response & Chat Style (Caveman)
- Keep chat output extremely brief, direct, and concise.
- Skip greetings, polite intros, long summaries, and filler words.
- State facts, test status, and code changes directly.
- Always warn before destructive actions (delete files, DB migrations, force push).