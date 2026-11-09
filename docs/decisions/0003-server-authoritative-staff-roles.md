# 0003 - Server-Authoritative Staff Roles

Date: 2026-11-09
Status: Accepted

## Context

The CMS uses its own cookie sessions and stores staff roles in
`public.admin_users`. The browser must not be able to promote an Editor by
changing a request body, local state, or route.

## Decision

- Resolve the active user's role from `admin_users` on every authenticated API
  request; never authorize using a browser-supplied role.
- Keep Admin-only API areas (staff management, site settings, audit history,
  and change approvals) behind explicit backend role middleware.
- Create staff accounts as Editors only. Reject unknown role fields in staff
  create/update requests.
- Make role changes immutable through application database writes and prevent
  inserting an additional Admin. Provision the initial Admin only through the
  operator-controlled seed process.
- Use the role in the frontend only to hide or redirect away from Admin-only
  UI. Backend authorization remains the security boundary.

## Consequences

An Editor cannot promote their own account or another account through the API.
Changing an existing staff role requires a separately reviewed operator
database action. Supabase sees application database calls as `service_role`;
the custom staff role is enforced by the Express API and is stored in
`admin_users`, not as a Supabase Auth identity.
