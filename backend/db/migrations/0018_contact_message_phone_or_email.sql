alter table contact_messages
  alter column email drop not null,
  add column if not exists phone_number text;
