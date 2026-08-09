import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/server";
import { getActiveWeeksWithItems } from "@/lib/db/shoppingLists";
import { ChecklistWeeks } from "@/components/ChecklistWeeks";
import { SetupNotice } from "@/components/SetupNotice";
import { formatCOP } from "@/lib/utils/money";

// Without this, Next statically prerenders the page at build time (no
// searchParams/cookies here to force dynamic rendering the way /catalog
// gets it for free) and bakes in whatever the checklist looked like during
// `next build` — checked state and item counts would never update after
// deploy without a full rebuild.
export const dynamic = "force-dynamic";

export default async function ChecklistPage() {
  let weeks;
  try {
    const supabase = createServiceClient();
    weeks = await getActiveWeeksWithItems(supabase);
  } catch (err) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Checklist</h1>
        <SetupNotice error={err instanceof Error ? err.message : String(err)} />
      </div>
    );
  }

  if (weeks.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Checklist</h1>
        <p className="rounded-lg border border-dashed border-app-line bg-app-surface p-4 text-sm text-app-muted">
          Todavía no tienes una lista activa.{" "}
          <Link href="/catalog" className="text-app-accent-2 underline">
            Ve al catálogo
          </Link>{" "}
          y agrega productos, o{" "}
          <Link href="/plan" className="text-app-accent-2 underline">
            genera un plan
          </Link>
          .
        </p>
      </div>
    );
  }

  const grandTotal = weeks.reduce(
    (sum, w) => sum + w.items.reduce((s, i) => s + i.price_cop * i.quantity, 0),
    0
  );
  const allEmpty = weeks.every((w) => w.items.length === 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">
          {weeks.length > 1 ? "Checklist del mes" : weeks[0].list.label}
        </h1>
        {weeks.length > 1 && (
          <span className="text-sm text-app-muted">Total {formatCOP(grandTotal)}</span>
        )}
      </div>
      {allEmpty ? (
        <p className="rounded-lg border border-dashed border-app-line bg-app-surface p-4 text-sm text-app-muted">
          Tu lista está vacía. Agrega productos desde el catálogo.
        </p>
      ) : (
        <ChecklistWeeks weeks={weeks} />
      )}
    </div>
  );
}
