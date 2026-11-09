# 0006 - Progressive Request Cooldowns

Date: 2026-11-09
Status: Accepted

## Context

Fixed lockouts can be too short under repeated abuse and disruptive when applied
to every API request. Login/MFA failures and public abuse-prone routes need
cooldowns that escalate, while normal API traffic should keep its existing cap.

## Decision

- After five failed login/MFA verifications, lock for one minute; each next
  group of five failures raises the cooldown to five minutes, 15 minutes, then
  30 minutes and doubling up to 24 hours.
- Use database-backed progressive throttles for password-reset requests
  (default five per 15 minutes) and contact submissions (one per five minutes).
  The first excess request locks for one minute, then later violations escalate
  to five minutes, 15 minutes, and longer up to 24 hours.
- Store HMAC hashes of account/IP identifiers rather than raw throttle keys.
- Keep the general API limit fixed at 100 requests per minute.

## Consequences

Migration 0060 must be applied after migrations 0056–0059. Successful password
resets clear their account and IP cooldown records. Cooldown state is shared
across API instances through Postgres; no external rate-limit service is
required. Optional migration 0061 clears all stored login/MFA lockout state
once if legacy cooldowns remain active after 0060 is applied; it must not be
rerun after new failures accumulate.
