-- Add a separate Mandate page record to existing databases.
-- The hospital must provide the official mandate text.
insert into pages (slug, title, body)
values (
  'mandate',
  'Mandate',
  'Official hospital mandate pending from Casiguran District Hospital.'
)
on conflict (slug) do nothing;
