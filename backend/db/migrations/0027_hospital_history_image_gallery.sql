alter table pages
  add column if not exists cover_image_paths text[] not null default '{}';

update pages
set cover_image_paths = array[cover_image_path]
where slug = 'hospital-history'
  and cover_image_path is not null
  and cardinality(cover_image_paths) = 0;
