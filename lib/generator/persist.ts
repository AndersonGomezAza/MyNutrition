import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedPlan } from "./plan";

type FeasiblePlan = Extract<GeneratedPlan, { feasible: true }>;

/**
 * Persists 1 week (weekly mode) or 4 weeks (monthly mode) under one shared
 * batch_id, deactivating every previously-active list first — a monthly
 * batch needs all 4 of its weeks is_active=true at once (see the migration
 * that dropped the old "at most one active list" constraint), so this
 * can't reuse a simple upsert-the-one-active-row approach.
 */
export async function persistGeneratedBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  totalBudgetCop: number,
  excludedTerms: string[],
  weeklyPlans: FeasiblePlan[]
): Promise<{ batchId: string; listIds: string[] }> {
  const batchId = crypto.randomUUID();
  const perWeekBudget = Math.floor(totalBudgetCop / weeklyPlans.length);
  const dateLabel = new Date().toLocaleDateString("es-CO");

  const { error: deactivateError } = await supabase
    .from("shopping_lists")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) throw deactivateError;

  const listIds: string[] = [];
  try {
    for (let i = 0; i < weeklyPlans.length; i++) {
      const plan = weeklyPlans[i];
      const weekNumber = i + 1;
      const label =
        weeklyPlans.length > 1
          ? `Semana ${weekNumber} — ${dateLabel}`
          : `Plan generado — ${dateLabel}`;

      const { data: list, error: listError } = await supabase
        .from("shopping_lists")
        .insert({
          store_id: storeId,
          label,
          budget_cop: perWeekBudget,
          excluded_terms: excludedTerms,
          source: "generated",
          is_active: true,
          total_cost_cop: plan.totalCost,
          batch_id: batchId,
          week_number: weekNumber,
        })
        .select("id")
        .single();
      if (listError || !list) throw listError ?? new Error("No se pudo crear la lista");
      listIds.push(list.id);

      const itemRows = plan.items.map((item, index) => ({
        shopping_list_id: list.id,
        product_id: item.productId,
        quantity: item.qty,
        sort_order: index,
      }));
      const { error: itemsError } = await supabase.from("shopping_list_items").insert(itemRows);
      if (itemsError) throw itemsError;

      // 28 days (7 x 4 slots) inserted one at a time, each followed by its
      // own day_items insert, measured at ~13-15s for a 4-week batch against
      // the live project — the same "one row at a time" mistake the scraper
      // had. Batch both inserts instead: one bulk insert for every day, then
      // look the generated ids back up by (day_number, meal_slot) — that
      // pair is unique per list — to build every day_items row in a single
      // second bulk insert.
      const dayRows = plan.meals.map((meal) => ({
        shopping_list_id: list.id,
        day_number: meal.dayNumber,
        meal_slot: meal.slot,
        title: meal.title,
        description: meal.description,
      }));
      const { data: insertedDays, error: daysError } = await supabase
        .from("meal_plan_days")
        .insert(dayRows)
        .select("id, day_number, meal_slot");
      if (daysError) throw daysError;

      const dayIdByKey = new Map<string, string>();
      for (const d of insertedDays ?? []) {
        dayIdByKey.set(`${d.day_number}|${d.meal_slot}`, d.id);
      }

      const dayItemRows = plan.meals.flatMap((meal) => {
        const dayId = dayIdByKey.get(`${meal.dayNumber}|${meal.slot}`);
        if (!dayId) return [];
        return meal.productIds.map((productId) => ({ meal_plan_day_id: dayId, product_id: productId }));
      });
      if (dayItemRows.length > 0) {
        const { error: dayItemsError } = await supabase
          .from("meal_plan_day_items")
          .insert(dayItemRows);
        if (dayItemsError) throw dayItemsError;
      }
    }
  } catch (err) {
    // Roll back everything inserted for this batch so a mid-way failure
    // never leaves a half-written month behind.
    await supabase.from("shopping_lists").delete().eq("batch_id", batchId);
    throw err;
  }

  return { batchId, listIds };
}
