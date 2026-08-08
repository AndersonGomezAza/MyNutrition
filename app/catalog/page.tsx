import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { listActiveStores } from "@/lib/db/stores";
import { listProducts } from "@/lib/db/products";
import { CatalogTable } from "@/components/CatalogTable";
import { SetupNotice } from "@/components/SetupNotice";

type Props = {
  searchParams: Promise<{ store?: string }>;
};

export default async function CatalogPage({ searchParams }: Props) {
  const { store: storeSlug } = await searchParams;

  let stores;
  try {
    const supabase = createServiceClient();
    stores = await listActiveStores(supabase);
  } catch (err) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <SetupNotice error={err instanceof Error ? err.message : String(err)} />
      </div>
    );
  }

  if (stores.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Catálogo</h1>
        <SetupNotice error="Conectado a Supabase, pero la tabla stores está vacía. Corre `npx supabase db push` (aplica también seed.sql) o insertá las tiendas manualmente." />
      </div>
    );
  }

  const activeStore = stores.find((s) => s.slug === storeSlug) ?? stores[0];
  const supabase = createServiceClient();
  const products = await listProducts(supabase, activeStore.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Catálogo — {activeStore.display_name}</h1>
        <div className="flex gap-2">
          {stores.map((s) => (
            <Link
              key={s.slug}
              href={`/catalog?store=${s.slug}`}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                s.id === activeStore.id
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-neutral-300 text-neutral-700"
              }`}
            >
              {s.display_name}
            </Link>
          ))}
        </div>
      </div>
      {products.length === 0 ? (
        <SetupNotice error={`Aún no hay productos de ${activeStore.display_name} en la base de datos. Corre el scraper manualmente (GET /api/cron/scrape con el header Authorization: Bearer <CRON_SECRET>) para poblarla.`} />
      ) : (
        <CatalogTable products={products} />
      )}
    </div>
  );
}
