import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ShoppingListRow = {
  id: string;
  store_id: string;
  label: string;
  budget_cop: number | null;
  total_cost_cop: number | null;
  created_at: string;
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

/**
 * Only one shopping_lists row can have is_active=true at a time (enforced
 * by a partial unique index). A list is scoped to one store — adding a
 * product from a different store than the current active list deactivates
 * the old list and starts a fresh one, rather than mixing two stores'
 * products under one list.
 */
export async function getOrCreateActiveList(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  label = "Mi lista"
): Promise<ShoppingListRow> {
  const { data: active, error: selectError } = await supabase
    .from("shopping_lists")
    .select("id, store_id, label, budget_cop, total_cost_cop, created_at")
    .eq("is_active", true)
    .maybeSingle();
  if (selectError) throw selectError;

  if (active && active.store_id === storeId) return active;

  if (active) {
    const { error: deactivateError } = await supabase
      .from("shopping_lists")
      .update({ is_active: false })
      .eq("id", active.id);
    if (deactivateError) throw deactivateError;
  }

  const { data: created, error: insertError } = await supabase
    .from("shopping_lists")
    .insert({ store_id: storeId, label, source: "manual", is_active: true })
    .select("id, store_id, label, budget_cop, total_cost_cop, created_at")
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

export async function getActiveListWithItems(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<{ list: ShoppingListRow; items: ChecklistItem[] } | null> {
  const { data: list, error: listError } = await supabase
    .from("shopping_lists")
    .select("id, store_id, label, budget_cop, total_cost_cop, created_at")
    .eq("is_active", true)
    .maybeSingle();
  if (listError) throw listError;
  if (!list) return null;

  const { data: rows, error: itemsError } = await supabase
    .from("shopping_list_items")
    .select("id, product_id, quantity, note, checked, products(name, price_cop)")
    .eq("shopping_list_id", list.id)
    .order("sort_order");
  if (itemsError) throw itemsError;

  const items: ChecklistItem[] = (rows ?? []).map((row) => {
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

  return { list, items };
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
