import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

const SLOT_ORDER = ["desayuno", "merienda", "almuerzo", "cena"] as const;

export type MealPlanDay = {
  dayNumber: number;
  meals: { slot: string; title: string; description: string }[];
};

export type MealPlanResult = {
  list: {
    id: string;
    label: string;
    budget_cop: number | null;
    total_cost_cop: number | null;
    created_at: string;
  };
  days: MealPlanDay[];
} | null;

export async function getMealPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  listId: string
): Promise<MealPlanResult> {
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("id, label, budget_cop, total_cost_cop, created_at")
    .eq("id", listId)
    .maybeSingle();
  if (listError) throw listError;
  if (!list) return null;

  const { data: rows, error: daysError } = await supabase
    .from("meal_plan_days")
    .select("day_number, meal_slot, title, description")
    .eq("shopping_list_id", listId)
    .order("day_number");
  if (daysError) throw daysError;

  const byDay = new Map<number, MealPlanDay>();
  for (const row of rows ?? []) {
    const day: MealPlanDay = byDay.get(row.day_number) ?? { dayNumber: row.day_number, meals: [] };
    day.meals.push({ slot: row.meal_slot, title: row.title, description: row.description });
    byDay.set(row.day_number, day);
  }

  const days = [...byDay.values()]
    .sort((a, b) => a.dayNumber - b.dayNumber)
    .map((d) => ({
      ...d,
      meals: [...d.meals].sort(
        (a, b) => SLOT_ORDER.indexOf(a.slot as never) - SLOT_ORDER.indexOf(b.slot as never)
      ),
    }));

  return { list, days };
}
