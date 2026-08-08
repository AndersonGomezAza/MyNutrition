import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScrapedProduct } from "../scraper/parseCatalogHtml";
import { categorizeProduct } from "../scraper/categorize";

/**
 * Upserts a whole page's worth of products (~10) in 2-3 DB round trips total
 * instead of one round trip per product. The original per-product version
 * (select-then-upsert-then-maybe-insert-history for each item) measured at
 * ~5.5 minutes for Ara's 677 products against a live Supabase project —
 * uncomfortably close to Vercel's 300s function ceiling, and it left D1's
 * run stuck mid-page when a client disconnect aborted the request. Batching
 * per page keeps the "upsert as soon as parsed" resilience property (a
 * failure only loses at most one page's worth of unwritten rows, not the
 * whole run) while cutting DB round trips by roughly 10x.
 */
export async function upsertProductBatch(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  storeId: string,
  products: ScrapedProduct[]
): Promise<void> {
  if (products.length === 0) return;

  const externalIds = products.map((p) => p.externalId);
  const { data: existingRows, error: selectError } = await supabase
    .from("products")
    .select("external_id, price_cop")
    .eq("store_id", storeId)
    .in("external_id", externalIds);
  if (selectError) throw selectError;

  const oldPriceByExternalId = new Map(
    (existingRows ?? []).map((r) => [r.external_id, r.price_cop])
  );

  const rows = products.map((product) => {
    const { category, foodGroup } = categorizeProduct(product.name);
    return {
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
    };
  });

  const { data: upserted, error: upsertError } = await supabase
    .from("products")
    .upsert(rows, { onConflict: "store_id,external_id" })
    .select("id, external_id, price_cop");
  if (upsertError) throw upsertError;

  const historyRows = (upserted ?? [])
    .filter((row) => {
      const oldPrice = oldPriceByExternalId.get(row.external_id);
      return oldPrice === undefined || oldPrice !== row.price_cop;
    })
    .map((row) => ({ product_id: row.id, price_cop: row.price_cop }));

  if (historyRows.length > 0) {
    const { error: historyError } = await supabase
      .from("product_price_history")
      .insert(historyRows);
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
