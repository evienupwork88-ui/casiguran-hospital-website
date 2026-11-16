# 0009 - Secure Password Reset Links

Date: 2026-11-11
Status: Accepted

## Context

The staff login uses bcrypt hashes, server-side opaque sessions, MFA, and
immutable application-managed roles. Existing password recovery used emailed
codes rather than the requested one-time reset links.

## Decision

- Keep bcrypt with 12 rounds and preserve comparison of existing password
  hashes. Passwords longer than bcrypt's 72-byte input limit are SHA-256
  prehashed before bcrypt and marked in the stored value so authentication
  can verify the full password; existing hashes are unchanged.
- Issue 256-bit random reset tokens, store only their SHA-256 hashes, invalidate
  the prior token for that account, and expire tokens after 10 minutes.
- Keep token issuance and reset completion in service-role-only database
  functions. Completion atomically changes the password, consumes the token,
  revokes all active sessions, and writes an attributable authentication audit
  event without changing the account's role.
- Use a URL fragment for the emailed token and submit it only in the reset
  request body. Check candidate passwords against the Pwned Passwords
  k-anonymity range API; only the first five SHA-1 hash characters leave the
  backend. Fail closed if that check is unavailable.
- If an account holder loses access to the registered mailbox, do not bypass
  email recovery or issue a temporary/master password. An authorized operator
  must verify the staff member's identity in person or through a separately
  verified institutional channel, then have a second authorized person
  approve an email-address correction through a controlled database operation.
  Preserve the account role and password, record the reason, approvers, and
  time in the protected audit history, and then use the normal reset email.

## Consequences

Apply migration 0066 and set `FRONTEND_URL` to the public HTTPS frontend
origin in production. Reset completion requires outbound HTTPS access to
`api.pwnedpasswords.com`. No recovery secret or Super Admin credential is
exposed to the frontend.
