import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedProduct } from "../scraper/parseCatalogHtml";
import { categorizeProduct } from "../scraper/categorize";

/**
 * Upserts one product and appends to price history only when the price
 * actually changed — keeps history cheap on unchanged weekly re-scrapes.
 * Runs one row at a time (not batched) so a mid-run failure never loses
 * already-committed rows; see run.ts for the resilience rationale.
 */
export async function upsertScrapedProduct(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  product: ScrapedProduct
): Promise<void> {
  const { category, foodGroup } = categorizeProduct(product.name);

  const { data: existing } = await supabase
    .from("products")
    .select("id, price_cop")
    .eq("store_id", storeId)
    .eq("external_id", product.externalId)
    .maybeSingle();

  const { data: upserted, error } = await supabase
    .from("products")
    .upsert(
      {
        store_id: storeId,
        external_id: product.externalId,
        name: product.name,
        brand: product.brand,
        presentation: product.presentation,
        price_cop: product.priceCop,
        category,
        food_group: foodGroup,
        in_stock: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "store_id,external_id" }
    )
    .select("id")
    .single();

  if (error) throw error;

  const priceChanged = !existing || existing.price_cop !== product.priceCop;
  if (priceChanged && upserted) {
    const { error: historyError } = await supabase
      .from("product_price_history")
      .insert({ product_id: upserted.id, price_cop: product.priceCop });
    if (historyError) throw historyError;
  }
}

export type ProductRow = {
  id: string;
  name: string;
  brand: string | null;
  presentation: string | null;
  price_cop: number;
  category: string;
  food_group: string;
};

export async function listProducts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string
): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name, brand, presentation, price_cop, category, food_group")
    .eq("store_id", storeId)
    .eq("in_stock", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
