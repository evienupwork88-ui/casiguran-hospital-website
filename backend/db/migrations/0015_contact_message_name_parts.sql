alter table contact_messages
  add column if not exists last_name text,
  add column if not exists first_name text,
  add column if not exists middle_name text,
  add column if not exists name_extension text;
