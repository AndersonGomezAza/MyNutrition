import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ShoppingListRow = {
  id: string;
  store_id: string;
  label: string;
  budget_cop: number | null;
  total_cost_cop: number | null;
  created_at: string;
  week_number: number;
  batch_id: string;
};

export type ChecklistItem = {
  id: string;
  product_id: string;
  quantity: number;
  note: string | null;
  checked: boolean;
  name: string;
  price_cop: number;
};

export async function getItemsForList(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  listId: string
): Promise<ChecklistItem[]> {
  const { data: rows, error } = await supabase
    .from("shopping_list_items")
    .select("id, product_id, quantity, note, checked, products(name, price_cop)")
    .eq("shopping_list_id", listId)
    .order("sort_order");
  if (error) throw error;

  return (rows ?? []).map((row) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const product = row.products as any;
    return {
      id: row.id,
      product_id: row.product_id,
      quantity: row.quantity,
      note: row.note,
      checked: row.checked,
      name: product?.name ?? "(producto eliminado)",
      price_cop: product?.price_cop ?? 0,
    };
  });
}

/**
 * A monthly generation activates 4 lists at once (one per week_number), so
 * "the active list" is no longer singular — a manual "add to cart" from the
 * catalog targets the lowest week_number among whichever lists are active
 * for that store, creating a fresh single-week batch if none exist yet.
 */
export async function getOrCreateActiveList(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  label = "Mi lista"
): Promise<ShoppingListRow> {
  const { data: active, error: selectError } = await supabase
    .from("shopping_lists")
    .select("id, store_id, label, budget_cop, total_cost_cop, created_at, week_number, batch_id")
    .eq("is_active", true)
    .order("week_number");
  if (selectError) throw selectError;

  const sameStore = (active ?? []).find((l) => l.store_id === storeId);
  if (sameStore) return sameStore;

  if ((active ?? []).length > 0) {
    const { error: deactivateError } = await supabase
      .from("shopping_lists")
      .update({ is_active: false })
      .eq("is_active", true);
    if (deactivateError) throw deactivateError;
  }

  const { data: created, error: insertError } = await supabase
    .from("shopping_lists")
    .insert({
      store_id: storeId,
      label,
      source: "manual",
      is_active: true,
      batch_id: crypto.randomUUID(),
      week_number: 1,
    })
    .select("id, store_id, label, budget_cop, total_cost_cop, created_at, week_number, batch_id")
    .single();
  if (insertError) throw insertError;
  return created;
}

export async function addItemToActiveList(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  productId: string
): Promise<void> {
  const list = await getOrCreateActiveList(supabase, storeId);
  const { error } = await supabase.from("shopping_list_items").upsert(
    { shopping_list_id: list.id, product_id: productId },
    { onConflict: "shopping_list_id,product_id", ignoreDuplicates: true }
  );
  if (error) throw error;
}

export type ActiveWeek = { list: ShoppingListRow; items: ChecklistItem[] };

/** All currently-active lists (1 for a weekly plan, up to 4 for a monthly one), sorted by week. */
export async function getActiveWeeksWithItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<ActiveWeek[]> {
  const { data: lists, error: listError } = await supabase
    .from("shopping_lists")
    .select("id, store_id, label, budget_cop, total_cost_cop, created_at, week_number, batch_id")
    .eq("is_active", true)
    .order("week_number");
  if (listError) throw listError;
  if (!lists || lists.length === 0) return [];

  const weeks: ActiveWeek[] = [];
  for (const list of lists) {
    weeks.push({ list, items: await getItemsForList(supabase, list.id) });
  }
  return weeks;
}

export async function setItemChecked(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  itemId: string,
  checked: boolean
): Promise<void> {
  const { error } = await supabase
    .from("shopping_list_items")
    .update({ checked, checked_at: checked ? new Date().toISOString() : null })
    .eq("id", itemId);
  if (error) throw error;
}

export async function removeItem(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  itemId: string
): Promise<void> {
  const { error } = await supabase.from("shopping_list_items").delete().eq("id", itemId);
  if (error) throw error;
}
