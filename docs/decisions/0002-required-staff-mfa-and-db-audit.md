# 0002 - Required Staff MFA and Database Audit

Date: 2026-11-09
Status: Accepted

## Context

Admin and Editor accounts need stronger protection than password-only login,
and request-level audit events do not show which database rows changed.

## Decision

- Require authenticator-app TOTP after password verification for every staff
  account; require first-time enrollment at next login.
- Store TOTP secrets encrypted with AES-256-GCM using a key derived from the
  stable `SESSION_SECRET`; store ten single-use recovery codes as HMAC hashes.
- Keep pre-authentication sessions restricted and short-lived. Reject replayed
  TOTP time steps, and rotate the session token when MFA succeeds.
- Persist progressive failed-login cooldowns for HMAC-hashed account and IP
  identifiers. Start at 15 minutes after five failures, increase after each
  additional five failures, cap at 24 hours, and reset failure history after
  24 hours without a failure.
- Record database operation, primary-key identity, database role, and changed
  column names only. Keep human actor attribution in the existing API audit
  events; do not copy row values or private message bodies into database logs.
- Require manual operator recovery after identity verification if both an
  authenticator and all recovery codes are unavailable.

## Consequences

Staff must save recovery codes during enrollment. Rotating `SESSION_SECRET`
without a coordinated MFA re-enrollment makes existing TOTP secrets
undecryptable. New public tables must attach the row-audit trigger in their
migration.
