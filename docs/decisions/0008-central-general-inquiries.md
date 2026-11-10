# 0008 - Centralized General Inquiry Email

Date: 2026-11-10
Status: Accepted

## Context

The public Contact form previously stored messages in the website database and
showed them in the Admin inbox. The hospital needs a shared, official channel
for authorized personnel to review inquiries and manually route them.

## Decision

- Send new inquiries as plain-text email from the hospital-owned Gmail account
  to a server-configured central mailbox; do not copy inquiry content into the
  website database or automatically forward it to departments.
- Verify every submission server-side with Cloudflare Turnstile, in addition
  to validation, a honeypot, and the existing progressive rate limit.
- Return success only when Gmail SMTP accepts the configured recipient.
- Remove the Admin inbox and its API; authorized personnel review and route
  inquiries in the shared mailbox.
- Delete legacy database-backed inquiries and drop the unused
  `contact_messages` table through migration 0065.

## Consequences

The backend requires `CONTACT_GMAIL_SMTP_USER`,
`CONTACT_GMAIL_SMTP_APP_PASSWORD`, `CONTACT_INQUIRY_EMAIL_TO`, and
`TURNSTILE_SECRET_KEY`; the frontend build requires
`NEXT_PUBLIC_TURNSTILE_SITE_KEY`. `CORS_ALLOWED_ORIGINS` must contain the
website origin used to validate Turnstile hostnames. Gmail acceptance does not
guarantee delivery to the mailbox, so authorized personnel must monitor the
central account. Migration 0065 is destructive and must be applied to each
Supabase environment; managed backups may retain older snapshots until their
configured retention period expires. The hospital remains responsible for its
privacy contact and approved email retention policy.
