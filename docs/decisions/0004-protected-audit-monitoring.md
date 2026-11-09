# 0004 - Protected Audit Monitoring and Archive

Date: 2026-11-09
Status: Accepted

## Context

Request and database audit records need protection from ordinary application
roles, an off-database copy, alerting on repeated authentication/access failures,
and reporting that distinguishes security events from routine HTTP errors.

## Decision

- Make request and database audit tables append-only for application roles;
  remove the staff foreign-key action that could otherwise rewrite historical
  actor IDs when an account is deleted.
- Enqueue request and database audit events transactionally in an archive
  outbox. Deliver one checksummed JSON object per event to a private R2 bucket
  using conditional create and exponential retry.
- Alert Admins in-app and by email after five failed login/MFA events or ten
  denied admin API requests from the same IP in a rolling 15-minute window.
  These are review signals, not proof of malicious activity.
- Report authentication failures, HTTP 401, HTTP 403, other 4xx, and 5xx
  separately.

## Consequences

Migration 0058 must be applied before these protections and notifications are
active. Configure `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
and `R2_BUCKET_NAME`; SMTP uses the existing Gmail settings and active Admin
email addresses. Failed archive/email delivery remains queued for retry.

Cloudflare R2's documented S3 compatibility does not support Object Lock.
Conditional writes prevent accidental replacement through this worker, but
they do not prevent deletion by a credential holder. The archive is not WORM;
use a dedicated private bucket and tightly restrict credential access.
