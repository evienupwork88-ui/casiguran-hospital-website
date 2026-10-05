-- Split the legacy combined `vision-mission` page into separate `vision` and `mission` rows.
-- This keeps any existing content while making the records independent in the database.

with legacy as (
  select body
  from pages
  where slug = 'vision-mission'
  limit 1
)
insert into pages (slug, title, body)
select * from (
  select 'vision', 'Vision', coalesce((select body from legacy), 'Content pending from Casiguran District Hospital.')
  union all
  select 'mission', 'Mission', coalesce((select body from legacy), 'Content pending from Casiguran District Hospital.')
) as rows
on conflict (slug) do nothing;

delete from pages where slug = 'vision-mission';
