import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveListWithItems } from "@/lib/db/shoppingLists";
import { ChecklistView } from "@/components/ChecklistView";
import { SetupNotice } from "@/components/SetupNotice";

// Without this, Next statically prerenders the page at build time (no
// searchParams/cookies here to force dynamic rendering the way /catalog
// gets it for free) and bakes in whatever the checklist looked like during
// `next build` — checked state and item counts would never update after
// deploy without a full rebuild.
export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  let result;
  try {
    const supabase = createServiceClient();
    result = await getActiveListWithItems(supabase);
  } catch (err) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Checklist</h1>
        <SetupNotice error={err instanceof Error ? err.message : String(err)} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Checklist</h1>
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">
          Todavía no tienes una lista activa.{" "}
          <Link href="/catalog" className="text-emerald-700 underline">
            Ve al catálogo
          </Link>{" "}
          y agrega productos para empezar una.
        </p>
      </div>
    );
  }

  const { list, items } = result;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">{list.label}</h1>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 bg-white p-4 text-sm text-neutral-500">
          Tu lista está vacía. Agrega productos desde el catálogo.
        </p>
      ) : (
        <ChecklistView items={items} />
      )}
    </div>
  );
}
