import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getItemsForList, type ChecklistItem } from "./shoppingLists";
import { getMealPlanDays, type MealPlanDay } from "./mealPlans";

export type BatchWeek = {
  listId: string;
  weekNumber: number;
  label: string;
  totalCost: number | null;
  items: ChecklistItem[];
  days: MealPlanDay[];
};

export type Batch = {
  batchId: string;
  storeName: string;
  source: string;
  createdAt: string;
  isActive: boolean;
  people: number;
  weeks: BatchWeek[];
  totalCost: number;
};

/**
 * One row per generation (weekly = 1 row, monthly = 4 rows sharing a
 * batch_id) grouped back into batches for the history view. Fetches items
 * and meal plan days per list rather than one giant join — dozens of past
 * plans at most for a single-user app, not worth a more complex query.
 */
export async function listBatches(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<Batch[]> {
  const { data: lists, error } = await supabase
    .from("shopping_lists")
    .select(
      "id, label, total_cost_cop, batch_id, week_number, source, created_at, is_active, people, stores(display_name)"
    )
    .order("created_at", { ascending: false });
  if (error) throw error;
  if (!lists || lists.length === 0) return [];

  const byBatch = new Map<string, (typeof lists)[number][]>();
  for (const row of lists) {
    const arr = byBatch.get(row.batch_id) ?? [];
    arr.push(row);
    byBatch.set(row.batch_id, arr);
  }

  const batches: Batch[] = [];
  for (const [batchId, rows] of byBatch) {
    rows.sort((a, b) => a.week_number - b.week_number);
    const weeks: BatchWeek[] = [];
    for (const row of rows) {
      const [items, days] = await Promise.all([
        getItemsForList(supabase, row.id),
        getMealPlanDays(supabase, row.id),
      ]);
      weeks.push({
        listId: row.id,
        weekNumber: row.week_number,
        label: row.label,
        totalCost: row.total_cost_cop,
        items,
        days,
      });
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storeInfo = rows[0].stores as any;
    batches.push({
      batchId,
      storeName: storeInfo?.display_name ?? "?",
      source: rows[0].source,
      createdAt: rows[0].created_at,
      isActive: rows[0].is_active,
      people: rows[0].people,
      weeks,
      totalCost: weeks.reduce((s, w) => s + (w.totalCost ?? 0), 0),
    });
  }

  return batches;
}

export async function deleteBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  batchId: string
): Promise<void> {
  const { error } = await supabase.from("shopping_lists").delete().eq("batch_id", batchId);
  if (error) throw error;
}
