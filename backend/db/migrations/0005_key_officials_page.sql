-- Add a separate Key Officials page record to existing databases.
-- Official names and positions must be provided by the hospital.
insert into pages (slug, title, body)
values (
  'key-officials',
  'Key Officials',
  'Official key officials information pending from Casiguran District Hospital.'
)
on conflict (slug) do nothing;
