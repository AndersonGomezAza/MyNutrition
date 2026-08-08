import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { GeneratedPlan } from "./plan";

export async function persistGeneratedPlan(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  budgetCop: number,
  excludedTerms: string[],
  plan: Extract<GeneratedPlan, { feasible: true }>
): Promise<string> {
  const { error: deactivateError } = await supabase
    .from("shopping_lists")
    .update({ is_active: false })
    .eq("is_active", true);
  if (deactivateError) throw deactivateError;

  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .insert({
      store_id: storeId,
      label: `Plan generado — ${new Date().toLocaleDateString("es-CO")}`,
      budget_cop: budgetCop,
      excluded_terms: excludedTerms,
      source: "generated",
      is_active: true,
      total_cost_cop: plan.totalCost,
    })
    .select("id")
    .single();
  if (listError || !list) throw listError ?? new Error("No se pudo crear la lista");

  try {
    const itemRows = plan.items.map((item, index) => ({
      shopping_list_id: list.id,
      product_id: item.productId,
      quantity: item.qty,
      sort_order: index,
    }));
    const { error: itemsError } = await supabase.from("shopping_list_items").insert(itemRows);
    if (itemsError) throw itemsError;

    for (const meal of plan.meals) {
      const { data: day, error: dayError } = await supabase
        .from("meal_plan_days")
        .insert({
          shopping_list_id: list.id,
          day_number: meal.dayNumber,
          meal_slot: meal.slot,
          title: meal.title,
          description: meal.description,
        })
        .select("id")
        .single();
      if (dayError || !day) throw dayError ?? new Error("No se pudo crear un día del plan");

      if (meal.productIds.length > 0) {
        const { error: dayItemsError } = await supabase
          .from("meal_plan_day_items")
          .insert(meal.productIds.map((productId) => ({ meal_plan_day_id: day.id, product_id: productId })));
        if (dayItemsError) throw dayItemsError;
      }
    }
  } catch (err) {
    await supabase.from("shopping_lists").delete().eq("id", list.id);
    throw err;
  }

  return list.id;
}
