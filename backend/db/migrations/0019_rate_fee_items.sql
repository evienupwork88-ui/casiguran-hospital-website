create table if not exists rate_fee_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('pharmacy', 'dental', 'himd', 'laboratory', 'radiology')),
  section text,
  item_name text not null,
  price_1 text not null default '',
  price_2 text not null default '',
  price_3 text not null default '',
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rate_fee_items_category_active_order_idx
  on rate_fee_items(category, is_active, display_order);

alter table rate_fee_items enable row level security;

drop trigger if exists set_rate_fee_items_updated_at on rate_fee_items;
create trigger set_rate_fee_items_updated_at
  before update on rate_fee_items
  for each row execute function set_updated_at();
