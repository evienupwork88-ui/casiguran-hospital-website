-- Add a managed cover image for the Hospital History page.
alter table pages
  add column if not exists cover_image_path text;
