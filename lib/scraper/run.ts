import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCatalogPage } from "./fetchPage";
import { isLastPage, parseCatalogPage } from "./parseCatalogHtml";
import { upsertProductBatch } from "../db/products";
import { listActiveStores, type StoreRow } from "../db/stores";

const MAX_PAGES = 150; // safety ceiling; the real stop condition is isLastPage()
const MAX_CONSECUTIVE_ANOMALIES = 2;
// Batched DB upserts made the loop fast enough to get a 429 from
// losprecios.co with no delay at all between pages. This is comfortably
// inside the 300s function budget even at ~150 pages across both stores.
const PAGE_DELAY_MS = 400;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type StoreScrapeResult = {
  storeSlug: string;
  status: "success" | "failed";
  pagesFetched: number;
  productsUpserted: number;
  errorMessage?: string;
};

/**
 * Scrapes one store to completion. Upserts each product as soon as it's
 * parsed (not batched at the end): if the network dies partway through,
 * everything fetched so far is already committed and only the unfetched
 * tail stays stale until next week's run. No rollback/staging table — not
 * worth the complexity for a weekly, single-user job.
 */
async function scrapeStore(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  store: StoreRow
): Promise<StoreScrapeResult> {
  const { data: run, error: runError } = await supabase
    .from("scrape_runs")
    .insert({ store_id: store.id })
    .select("id")
    .single();
  if (runError || !run) {
    return {
      storeSlug: store.slug,
      status: "failed",
      pagesFetched: 0,
      productsUpserted: 0,
      errorMessage: runError?.message ?? "could not create scrape_runs row",
    };
  }

  let page = 1;
  let consecutiveAnomalies = 0;
  let upserted = 0;

  while (page <= MAX_PAGES) {
    if (page > 1) await sleep(PAGE_DELAY_MS);

    let html: string;
    try {
      html = await fetchCatalogPage(store.source_path, page);
    } catch (err) {
      await finishRun(supabase, run.id, "failed", page - 1, upserted, String(err));
      return {
        storeSlug: store.slug,
        status: "failed",
        pagesFetched: page - 1,
        productsUpserted: upserted,
        errorMessage: String(err),
      };
    }

    if (isLastPage(html)) break;

    const products = parseCatalogPage(html);
    if (products.length === 0) {
      consecutiveAnomalies++;
      if (consecutiveAnomalies >= MAX_CONSECUTIVE_ANOMALIES) {
        const message = `0 products parsed at page ${page} with no stop-marker found — likely a markup change on losprecios.co`;
        await finishRun(supabase, run.id, "failed", page - 1, upserted, message);
        return {
          storeSlug: store.slug,
          status: "failed",
          pagesFetched: page - 1,
          productsUpserted: upserted,
          errorMessage: message,
        };
      }
    } else {
      consecutiveAnomalies = 0;
      await upsertProductBatch(supabase, store.id, products);
      upserted += products.length;
    }

    page++;
  }

  await finishRun(supabase, run.id, "success", page - 1, upserted);
  return {
    storeSlug: store.slug,
    status: "success",
    pagesFetched: page - 1,
    productsUpserted: upserted,
  };
}

async function finishRun(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  runId: string,
  status: "success" | "failed",
  pagesFetched: number,
  productsUpserted: number,
  errorMessage?: string
) {
  await supabase
    .from("scrape_runs")
    .update({
      status,
      finished_at: new Date().toISOString(),
      pages_fetched: pagesFetched,
      products_upserted: productsUpserted,
      error_message: errorMessage ?? null,
    })
    .eq("id", runId);
}

/**
 * Entry point for the cron route. Loops every active store in one
 * invocation on purpose — Vercel Cron scheduling is per-path, so this keeps
 * adding a 3rd/4th/5th store to a data-only change (new `stores` row)
 * instead of needing another cron job.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function scrapeAllActiveStores(supabase: SupabaseClient<any>) {
  const stores = await listActiveStores(supabase);
  const results: StoreScrapeResult[] = [];
  for (const [index, store] of stores.entries()) {
    if (index > 0) await sleep(PAGE_DELAY_MS);
    results.push(await scrapeStore(supabase, store));
  }
  return results;
}
