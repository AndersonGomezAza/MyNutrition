-- A monthly generation produces 4 simultaneously-active weekly lists, so
-- "at most one active list" no longer holds — drop that constraint and add
-- the columns needed to group and order the weeks of one generation.
-- Existing rows backfill as their own independent single-week batch
-- (volatile defaults like gen_random_uuid() are evaluated per row).

alter table shopping_lists
  add column week_number integer not null default 1 check (week_number between 1 and 4),
  add column batch_id uuid not null default gen_random_uuid();

drop index shopping_lists_one_active_idx;

create index shopping_lists_batch_idx on shopping_lists (batch_id, week_number);
create index shopping_lists_active_idx on shopping_lists (is_active);
