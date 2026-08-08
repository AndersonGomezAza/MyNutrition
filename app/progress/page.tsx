import { createServiceClient } from "@/lib/supabase/server";
import { listWeightLogs } from "@/lib/db/weightLogs";
import { WeightChart } from "@/components/WeightChart";
import { WeightLogForm } from "@/components/WeightLogForm";
import { SetupNotice } from "@/components/SetupNotice";

// Same reasoning as /checklist: no searchParams/cookies here to force
// dynamic rendering automatically, and this page must never serve a
// build-time snapshot of your weight history.
export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  let logs;
  try {
    const supabase = createServiceClient();
    logs = await listWeightLogs(supabase);
  } catch (err) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Progreso</h1>
        <SetupNotice error={err instanceof Error ? err.message : String(err)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Progreso</h1>
      <WeightLogForm />
      <WeightChart logs={logs} />
    </div>
  );
}
