# Database Setup

Schema source of truth: [`docs/blueprint.md`](../../docs/blueprint.md), Section 4.
No ORM/migration tool in use yet — plain SQL files, applied by hand
through the Supabase dashboard. Simple on purpose at this stage;
revisit only if that becomes a real pain point.

## 1. Create a Supabase project (skip if you already have one)

1. [supabase.com](https://supabase.com) → New project.
2. Note the **Project URL** and the **`service_role` secret key**
   (Project Settings → API) — you'll need both for `backend/.env`.
   The `service_role` key is powerful (bypasses Row Level Security)
   and must never be exposed to the frontend or committed to git.

## 2. Apply the schema

1. In the Supabase dashboard: **SQL Editor → New query**.
2. Paste the entire contents of
   [`migrations/0001_initial_schema.sql`](migrations/0001_initial_schema.sql).
3. Run it.

This creates the initial 9 tables from the blueprint (later numbered
migrations add the structured Key Officials table), enables Row Level
Security on each with no public policies (the backend's `service_role`
key bypasses RLS entirely — RLS is on as a deny-by-default safety net,
not because anything currently relies on a policy), and seeds:
- `site_settings` — one empty row (the app expects exactly one to
  always exist)
- `pages` — six placeholder rows (`mandate`, `about`, `hospital-history`,
  `vision`, `mission`, `service-pledge`), each with clearly-labeled
  placeholder text until the hospital provides real content.
  `vision` and `mission` are stored as separate records even though
  they render together on the public `/vision-mission` page.
  Key Officials profiles are added by migration 0010.

After the initial schema, apply the numbered migrations required by
the application. Migration 0010 is required for the Key Officials
admin and public pages on both new and existing databases. Run migration
0011 before using the updated staff-user or password-reset features and
before running the updated admin seed script.
Migration 0012 is also required before accessing the Hospital History
editor under Admin → Documents.
Migration 0013 is required before using the Trainings page and manager.
Migration 0014 is required before accepting Contact form submissions and using the Admin inbox.
Migration 0015 is required for separately stored Contact form name fields.
Migration 0016 is required for admin activity and authentication audit history.
Migration 0017 is required to store official positions separately for the three department-head profiles.
Migration 0018 is required to allow either an email address or cellphone number on Contact messages.
Migration 0019 is required for the public Rate and Fees tabs and Admin CMS.
Migration 0020 preloads the fee items and prices shown in the supplied rate-list images. Prices remain editable in the Admin CMS.
Migration 0021 creates the OPD page content and clinic schedule editor.
Migration 0022 converts the OPD cover photo into a multi-image gallery.
Migration 0023 adds a separate OPD organizational chart image, independent of the hospital-wide chart document.
Migration 0024 creates the Radiology page content and slideshow editor.
Migration 0025 adds a separate Radiology organizational chart image and description.
Migration 0026 creates the Emergency Department page, image gallery, content editor, schedule, and separate organizational chart.
Migration 0027 converts the Hospital History cover photo into a multi-image header slideshow.
Migration 0028 creates the Dental Department page, gallery, service schedule, and organizational chart editor.
Migration 0029 creates the Family and Community Medicine page, gallery, service schedule, and organizational chart editor.
Migration 0030 creates the Medical Social Service Department page, gallery, service schedule, and organizational chart editor.
Migration 0031 creates the Nutrition and Dietetics Department page, gallery, service schedule, and organizational chart editor.
Migration 0032 creates the Pharmacy Department page, gallery, service schedule, and organizational chart editor.
Migration 0033 creates the Pathology and Laboratories page, gallery, service schedule, and organizational chart editor.
Migration 0034 creates the Nursing Service page, gallery, service schedule, and organizational chart editor.
Migration 0035 creates separate CMS content, galleries, schedules, and organizational charts for the three Health Information Management Department tabs.
Migration 0036 creates separate CMS content, galleries, schedules, and organizational charts for the Billing and Claims tabs.
Migration 0037 creates the General Medicine page content, gallery, service schedule, and organizational chart editor.
Migration 0038 creates the Obstetrics and Gynecology page content, gallery, service schedule, and organizational chart editor.
Migration 0039 creates the Pediatrics page content, gallery, service schedule, and organizational chart editor.
Migration 0040 permanently deletes the legacy Services records and drops the unused `services` table.
Migration 0041 combines existing HIMD section galleries into one shared slideshow for the entire HIMD page.
Migration 0042 adds contact-message triage/audit fields and the editable FAQ CMS. Apply it before deploying these features.
Migration 0043 adds editor change requests and a private Supabase Storage bucket for staged uploads. Apply it before enabling editor approvals.
Migration 0044 adds optional external links to news previews. Apply it before saving Facebook post URLs in the News CMS.
Org chart image uploads allow up to 25 MB by default; Supabase Storage and the API hosting provider must also allow uploads of that size.

Re-running the file will error on `CREATE TABLE` (tables already
exist) — that's expected, it's not designed to be idempotent yet.

### Updating an existing database

For later schema changes, run only the new numbered migration in the
Supabase SQL Editor. For an existing database, add the structured Key
Officials profiles by running
[`migrations/0010_key_official_profiles.sql`](migrations/0010_key_official_profiles.sql).
For the Hospital History background image field, run
[`migrations/0012_hospital_history_cover_image.sql`](migrations/0012_hospital_history_cover_image.sql).
For the Trainings public page and Admin Console manager, run
[`migrations/0013_trainings.sql`](migrations/0013_trainings.sql).
For Contact form submissions and the private Admin inbox, run
[`migrations/0014_contact_messages.sql`](migrations/0014_contact_messages.sql).
For separate last, first, middle, and extension fields on Contact messages, run
[`migrations/0015_contact_message_name_parts.sql`](migrations/0015_contact_message_name_parts.sql).
For optional email and cellphone contact details on Contact messages, run
[`migrations/0018_contact_message_phone_or_email.sql`](migrations/0018_contact_message_phone_or_email.sql).
For admin activity and authentication audit history, run
[`migrations/0016_audit_logs.sql`](migrations/0016_audit_logs.sql).
For separate official position titles on department-head profiles, run
[`migrations/0017_key_official_positions.sql`](migrations/0017_key_official_positions.sql).
For the editable Rate and Fees CMS, run
[`migrations/0019_rate_fee_items.sql`](migrations/0019_rate_fee_items.sql).
To preload the provided Pharmacy, Dental, HIMD, Laboratory, and Radiology rates, run
[`migrations/0020_seed_rate_fee_items.sql`](migrations/0020_seed_rate_fee_items.sql).
For the editable Out-Patient Department page and clinic schedule, run
[`migrations/0021_opd_content.sql`](migrations/0021_opd_content.sql).
For the OPD image gallery, run
[`migrations/0022_opd_image_gallery.sql`](migrations/0022_opd_image_gallery.sql).
For the separate OPD organizational chart image, run
[`migrations/0023_opd_organizational_chart_image.sql`](migrations/0023_opd_organizational_chart_image.sql).
For the editable Radiology page and image gallery, run
[`migrations/0024_radiology_content.sql`](migrations/0024_radiology_content.sql).
For the separate Radiology organizational chart, run
[`migrations/0025_radiology_organizational_chart.sql`](migrations/0025_radiology_organizational_chart.sql).
For the Dental Department page and CMS, run
[`migrations/0028_dental_content.sql`](migrations/0028_dental_content.sql).
For the Family and Community Medicine page and CMS, run
[`migrations/0029_family_community_medicine_content.sql`](migrations/0029_family_community_medicine_content.sql).
For the Medical Social Service Department page and CMS, run
[`migrations/0030_medical_social_service_content.sql`](migrations/0030_medical_social_service_content.sql).
For the Nutrition and Dietetics Department page and CMS, run
[`migrations/0031_nutrition_and_dietetics_content.sql`](migrations/0031_nutrition_and_dietetics_content.sql).
For the Pharmacy Department page and CMS, run
[`migrations/0032_pharmacy_content.sql`](migrations/0032_pharmacy_content.sql).
For the Pathology and Laboratories page and CMS, run
[`migrations/0033_pathology_laboratories_content.sql`](migrations/0033_pathology_laboratories_content.sql).
For the Nursing Service page and CMS, run
[`migrations/0034_nursing_service_content.sql`](migrations/0034_nursing_service_content.sql).
For the Health Information Management Department tabs and CMS, run
[`migrations/0035_himd_content.sql`](migrations/0035_himd_content.sql).
For the Billing and Claims tabs and CMS, run
[`migrations/0036_billing_claims_content.sql`](migrations/0036_billing_claims_content.sql).
For the General Medicine public page and Admin CMS, run
[`migrations/0037_general_medicine_content.sql`](migrations/0037_general_medicine_content.sql).
For the Obstetrics and Gynecology public page and Admin CMS, run
[`migrations/0038_obstetrics_and_gynecology_content.sql`](migrations/0038_obstetrics_and_gynecology_content.sql).
For the Pediatrics public page and Admin CMS, run
[`migrations/0039_pediatrics_content.sql`](migrations/0039_pediatrics_content.sql).
To permanently remove legacy Services records and drop the Services table, run
[`migrations/0040_drop_services.sql`](migrations/0040_drop_services.sql).
To move existing HIMD slideshow photos into one shared gallery and update the
HIMD CMS/API, run
[`migrations/0041_himd_shared_slideshow.sql`](migrations/0041_himd_shared_slideshow.sql).
For contact-message triage and editable public FAQs, run
[`migrations/0042_contact_triage.sql`](migrations/0042_contact_triage.sql).
For editor change approval requests and their private upload staging bucket, run
[`migrations/0043_admin_change_requests.sql`](migrations/0043_admin_change_requests.sql).
For optional external URLs on News preview cards, run
[`migrations/0044_news_external_url.sql`](migrations/0044_news_external_url.sql).
For the Emergency Department CMS and organizational chart, run
[`migrations/0026_emergency_department_content.sql`](migrations/0026_emergency_department_content.sql).
For the Hospital History image gallery and header slideshow, run
[`migrations/0027_hospital_history_image_gallery.sql`](migrations/0027_hospital_history_image_gallery.sql).
To add the Mandate page to an existing database, run
[`migrations/0008_mandate_page.sql`](migrations/0008_mandate_page.sql).
To rename the Core Values page record to Service Pledge, run
[`migrations/0007_service_pledge_page.sql`](migrations/0007_service_pledge_page.sql).
To add the Hospital Development Plan document category to an existing
database, run
[`migrations/0006_documents_development_plan.sql`](migrations/0006_documents_development_plan.sql).
To add the Patient Rights document category to an existing database,
run
[`migrations/0009_documents_patient_rights.sql`](migrations/0009_documents_patient_rights.sql).
To enable Citizen's Charter PDF uploads, run
[`migrations/0003_documents_citizens_charter.sql`](migrations/0003_documents_citizens_charter.sql).
For separate staff name fields, a single-admin limit, and email OTP password
reset, run
[`migrations/0011_staff_names_single_admin_password_reset.sql`](migrations/0011_staff_names_single_admin_password_reset.sql).
Do not rerun the initial schema on an existing project.

## 3. Configure your local backend

```
cd backend
cp .env.example .env
```
Fill in `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from step 1.

## 4. Seed the admin account

For Gmail password-reset emails, enable 2-Step Verification on the sending
Google account, create an App Password, and add to `backend/.env`:
```
GMAIL_SMTP_USER=your-sending-account@gmail.com
GMAIL_SMTP_APP_PASSWORD=your-16-character-app-password
PASSWORD_RESET_EMAIL_FROM=Casiguran District Hospital <your-sending-account@gmail.com>
```
Never use your normal Gmail password or commit these values.
```
ADMIN_SEED_EMAIL=you@example.com
ADMIN_SEED_PASSWORD=choose-a-real-password-12-chars-min
ADMIN_SEED_FIRST_NAME=Your first name
ADMIN_SEED_MIDDLE_NAME=
ADMIN_SEED_LAST_NAME=Your last name
ADMIN_SEED_NAME_EXTENSION=
```

Then:
```
npm run seed:admin
```

This bcrypt-hashes the password (plaintext is never sent to the
database or stored anywhere) and creates/updates the `admin_users` row.
Running it again with the same email safely updates that same account
instead of creating a duplicate.

A successful run also confirms Express can actually reach your
Supabase database — if you see the "Connectivity confirmed" message,
this increment is done.

Editor accounts are created through the admin Users page; that screen
cannot create or promote another admin.
