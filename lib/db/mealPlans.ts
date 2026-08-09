import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const SLOT_ORDER = ["desayuno", "merienda", "almuerzo", "cena"] as const;

export type MealPlanDay = {
  dayNumber: number;
  meals: { slot: string; title: string; description: string }[];
};

export async function getMealPlanDays(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  listId: string
): Promise<MealPlanDay[]> {
  const { data: rows, error } = await supabase
    .from("meal_plan_days")
    .select("day_number, meal_slot, title, description")
    .eq("shopping_list_id", listId)
    .order("day_number");
  if (error) throw error;

  const byDay = new Map<number, MealPlanDay>();
  for (const row of rows ?? []) {
    const day: MealPlanDay = byDay.get(row.day_number) ?? { dayNumber: row.day_number, meals: [] };
    day.meals.push({ slot: row.meal_slot, title: row.title, description: row.description });
    byDay.set(row.day_number, day);
  }

  return [...byDay.values()]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((d) => ({
      ...d,
      meals: [...d.meals].sort(
        (a, b) => SLOT_ORDER.indexOf(a.slot as never) - SLOT_ORDER.indexOf(b.slot as never)
      ),
    }));
}
