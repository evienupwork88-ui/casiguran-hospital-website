# 0007 - Role-Aware Admin Notifications

Date: 2026-11-09
Status: Accepted

## Context

The Admin notification bell mixed several event types, the proposed-change
preview displayed raw JSON (empty for delete requests), and Editors had no
persistent notification when their submitted change was rejected.

## Decision

- Provide a shared notification center that shows Admins pending editor changes,
  security alerts, and unread contact messages.
- Show Editors rejection notices only for their own change requests.
- Persist each Editor rejection notice's read time on the change-request row.
- Present proposed fields, files, and delete targets in a readable summary.

## Consequences

Migration 0062 is required before deploying the read-state API. The existing
backend role remains authoritative; Editors cannot list or review other
users' requests or access Admin security notifications.
