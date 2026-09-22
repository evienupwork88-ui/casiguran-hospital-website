-- =====================================================================
-- 0002_settings_structured_schedule.sql
-- Adds a structured administrative schedule and a separate emergency flag
-- without discarding the legacy `office_hours` text field.
-- =====================================================================

alter table site_settings
  add column if not exists administrative_office_hours jsonb not null default '[]'::jsonb,
  add column if not exists emergency_services_24_7 boolean not null default false;

-- Preserve legacy text intentionally for backward compatibility. If the old
-- value explicitly describes a 24/7 emergency service, carry that forward.
update site_settings
set emergency_services_24_7 = true
where id = 1
  and lower(coalesce(office_hours, '')) ~ '24[ /-]?7|24 hours|24x7';

-- Do not attempt to guess or rewrite ambiguous legacy office-hour text into a
-- structured schedule. That data is not reliable enough to convert safely.
-- The admin UI will let staff enter the precise schedule after deployment.
