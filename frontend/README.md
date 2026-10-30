# CDH Website — Frontend

Next.js (TypeScript, Tailwind CSS, App Router) frontend for the
Casiguran District Hospital website.

This is one half of the project — see the repository root
[`README.md`](../README.md) and [`docs/blueprint.md`](../docs/blueprint.md)
for the full picture (backend, database, architecture).

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in values as needed
npm run dev
```

Runs at http://localhost:3000.

The admin sign-in URL is configured with `ADMIN_PATH` in `.env.local`.
Keep the same value in the production frontend environment. The default is
`/admin`; use your configured path followed by `/login` to sign in. Admin
pages remain protected by authentication regardless of the path.

For Vercel deployments, set `NEXT_PUBLIC_API_BASE_URL` to `/backend-api` and
`BACKEND_API_URL` to the backend service URL. Next.js proxies API requests
through the frontend domain so browser session cookies remain first-party.
