-- One weight entry per day; writes upsert on conflict(logged_at).

create table weight_logs (
  id         uuid primary key default gen_random_uuid(),
  logged_at  date not null unique,
  weight_kg  numeric(5,2) not null,
  note       text,
  created_at timestamptz not null default now()
);
alter table weight_logs enable row level security;
