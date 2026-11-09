# 0005 - MFA Step-Up for Staff Account Updates

Date: 2026-11-09
Status: Accepted

## Context

A verified Admin session is required for all protected routes, but sensitive
staff account edits should additionally confirm that the Admin has their
authenticator available at the time of the change.

## Decision

- Require a fresh 6-digit TOTP code on every staff account update, including
  status changes.
- Verify the code on the backend, then atomically advance the account's
  `mfa_last_counter` in Postgres to prevent replay.
- Apply the existing progressive login cooldown to invalid step-up attempts.

## Consequences

Migration 0059 must be applied after 0056. Admins enter a new authenticator
code for each user update; the status toggle also requires a fresh code.
The session must still pass the normal MFA authentication middleware.
