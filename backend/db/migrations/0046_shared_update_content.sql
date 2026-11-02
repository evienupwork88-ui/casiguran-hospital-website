alter table announcements
  add column excerpt text,
  add column cover_image_url text,
  add column external_url text;

alter table events
  add column excerpt text;
