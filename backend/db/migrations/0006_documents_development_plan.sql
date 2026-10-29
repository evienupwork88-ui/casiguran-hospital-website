-- Add a dedicated category for the Hospital Development Plan.
alter table documents
  drop constraint if exists documents_category_check;

alter table documents
  add constraint documents_category_check
  check (category in ('report', 'org_chart', 'policy', 'citizens_charter', 'development_plan', 'patient_rights', 'other'));
