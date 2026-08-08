-- Stores, products, price history, and scrape run tracking.
-- RLS is enabled with NO policies defined: default-deny for anon/authenticated.
-- All reads/writes happen server-side via the service_role key, which bypasses RLS.
-- This is deliberate: the app has no auth, so the anon key is effectively public
-- and must never be granted table access.

create table stores (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,        -- 'ara', 'd1'
  source_path   text unique not null,        -- 'ara_t2', 'd1_t1' (losprecios.co URL segment)
  display_name  text not null,               -- 'Ara', 'D1'
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);
alter table stores enable row level security;

create table products (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id) on delete cascade,
  external_id    text not null,              -- the data-krv id from losprecios.co
  name           text not null,
  brand          text,
  presentation   text,                       -- size/weight, e.g. "1 000 ml"
  price_cop      integer not null,
  category       text not null,              -- Despensa, Frutas y Verduras, ...
  food_group     text not null,              -- protein_red_meat | protein_poultry | protein_fish |
                                              -- protein_egg | protein_legume | carb | dairy | fruit |
                                              -- vegetable | fat_oil | other
  in_stock       boolean not null default true,
  first_seen_at  timestamptz not null default now(),
  last_seen_at   timestamptz not null default now(),
  unique (store_id, external_id)
);
alter table products enable row level security;
create index products_store_food_group_idx on products (store_id, food_group);
create index products_store_category_idx on products (store_id, category);

create table product_price_history (
  id           uuid primary key default gen_random_uuid(),
  product_id   uuid not null references products(id) on delete cascade,
  price_cop    integer not null,
  recorded_at  timestamptz not null default now()
);
alter table product_price_history enable row level security;
create index product_price_history_product_idx on product_price_history (product_id, recorded_at desc);

create table scrape_runs (
  id                uuid primary key default gen_random_uuid(),
  store_id          uuid not null references stores(id),
  started_at        timestamptz not null default now(),
  finished_at       timestamptz,
  status            text not null default 'running' check (status in ('running','success','partial','failed')),
  pages_fetched     integer not null default 0,
  products_upserted integer not null default 0,
  error_message     text
);
alter table scrape_runs enable row level security;
