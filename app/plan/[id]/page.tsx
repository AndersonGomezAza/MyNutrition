import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import { getMealPlan } from "@/lib/db/mealPlans";
import { formatCOP } from "@/lib/utils/money";

export const dynamic = "force-dynamic";

const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type Props = { params: Promise<{ id: string }> };

export default async function PlanDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = createServiceClient();
  const result = await getMealPlan(supabase, id);

  if (!result) notFound();
  const { list, days } = result;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">{list.label}</h1>
          {list.total_cost_cop && (
            <p className="text-sm text-neutral-500">Total: {formatCOP(list.total_cost_cop)}</p>
          )}
        </div>
        <Link href="/checklist" className="text-sm font-medium text-emerald-700 underline">
          Ver lista de compras
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {days.map((day) => (
          <article key={day.dayNumber} className="rounded-lg border border-neutral-200 bg-white p-4">
            <h3 className="font-semibold text-emerald-700">
              {DAY_NAMES[day.dayNumber - 1] ?? `Día ${day.dayNumber}`}
            </h3>
            <div className="mt-2 flex flex-col gap-2">
              {day.meals.map((meal, i) => (
                <div key={i} className="border-t border-neutral-100 pt-2 first:border-t-0 first:pt-0">
                  <span className="block text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                    {meal.slot}
                  </span>
                  <p className="text-sm">{meal.description}</p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
