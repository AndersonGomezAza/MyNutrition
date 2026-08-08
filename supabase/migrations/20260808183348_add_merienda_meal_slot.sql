-- The generator needs a snack slot for fruit/dairy between meals, matching
-- the hand-built static plan's structure (desayuno/almuerzo/merienda/cena).
alter table meal_plan_days drop constraint meal_plan_days_meal_slot_check;
alter table meal_plan_days
  add constraint meal_plan_days_meal_slot_check
  check (meal_slot in ('desayuno', 'almuerzo', 'merienda', 'cena'));
