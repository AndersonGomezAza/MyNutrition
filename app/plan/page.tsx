import { createServiceClient } from "@/lib/supabase/server";
import { listActiveStores } from "@/lib/db/stores";
import { listBatches } from "@/lib/db/plans";
import { PlanGeneratorForm } from "@/components/PlanGeneratorForm";
import { PlanHistory } from "@/components/PlanHistory";
import { SetupNotice } from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  let stores;
  let batches;
  try {
    const supabase = createServiceClient();
    [stores, batches] = await Promise.all([listActiveStores(supabase), listBatches(supabase)]);
  } catch (err) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Generar plan</h1>
        <SetupNotice error={err instanceof Error ? err.message : String(err)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Generar plan</h1>
        <p className="mt-1 text-sm text-app-muted">
          Pon tu presupuesto y lo que no quieres que aparezca. Por semana o de una vez por mes
          (4 semanas con variedad). Garantizamos al menos 2 tipos de proteína distinta (carne,
          pollo, pescado, huevo o legumbres) siempre que el presupuesto y tus exclusiones lo
          permitan.
        </p>
        <p className="mt-1 text-xs text-app-muted">
          Los ingredientes se identifican por palabras clave en el nombre del producto, igual
          que en el catálogo — de vez en cuando puede colarse algo raro (una salsa, un dulce
          con nombre de fruta). Si ves algo así, quítalo del checklist sin problema.
        </p>
      </div>
      {stores.length === 0 ? (
        <SetupNotice error="No hay tiendas activas todavía. Corre el scraper primero." />
      ) : (
        <PlanGeneratorForm stores={stores} />
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Planes generados</h2>
        <PlanHistory batches={batches} />
      </div>
    </div>
  );
}
