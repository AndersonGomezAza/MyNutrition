-- Shopping lists (manual or generated), their items, and the meal plan that
-- accompanies a generated list. Every generator run inserts a new row instead
-- of overwriting the previous one, so past plans stay browsable.

create table shopping_lists (
  id             uuid primary key default gen_random_uuid(),
  store_id       uuid not null references stores(id),
  label          text not null,
  budget_cop     integer,
  excluded_terms text[] not null default '{}',
  source         text not null check (source in ('manual','generated')),
  is_active      boolean not null default false,
  total_cost_cop integer,
  created_at     timestamptz not null default now()
);
alter table shopping_lists enable row level security;
create unique index shopping_lists_one_active_idx on shopping_lists (is_active) where is_active;

create table shopping_list_items (
  id               uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references shopping_lists(id) on delete cascade,
  product_id       uuid not null references products(id),
  quantity         numeric not null default 1,
  note             text,
  checked          boolean not null default false,
  checked_at       timestamptz,
  sort_order       integer not null default 0
);
alter table shopping_list_items enable row level security;
create index shopping_list_items_list_idx on shopping_list_items (shopping_list_id, sort_order);

create table meal_plan_days (
  id               uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references shopping_lists(id) on delete cascade,
  day_number       integer not null check (day_number between 1 and 7),
  meal_slot        text not null check (meal_slot in ('desayuno','almuerzo','cena')),
  title            text not null,
  description      text not null
);
alter table meal_plan_days enable row level security;
create index meal_plan_days_list_idx on meal_plan_days (shopping_list_id, day_number);

create table meal_plan_day_items (
  meal_plan_day_id uuid not null references meal_plan_days(id) on delete cascade,
  product_id       uuid not null references products(id),
  primary key (meal_plan_day_id, product_id)
);
alter table meal_plan_day_items enable row level security;
