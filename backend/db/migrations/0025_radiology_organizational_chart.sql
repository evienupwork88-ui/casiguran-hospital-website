alter table radiology_content
  add column if not exists organizational_chart_image_path text,
  add column if not exists organizational_structure_description text not null default '';
