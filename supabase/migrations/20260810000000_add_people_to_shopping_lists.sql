-- Lets a generated plan record how many people it was sized for, so plan
-- history can show it and the meal portions it persisted stay traceable to
-- the input that produced them.

alter table shopping_lists
  add column people integer not null default 1 check (people >= 1);
