"use client";

import { useState, useTransition } from "react";
import { deleteBatchAction } from "@/lib/actions/plan";
import { formatCOP } from "@/lib/utils/money";
import type { Batch, BatchWeek } from "@/lib/db/plans";

const WEEK_LABELS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];
const DAY_NAMES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

function DeleteButton({ batchId }: { batchId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  // Stop propagation on every handler here, not just preventDefault — a
  // click on any of these buttons would otherwise also toggle the parent
  // <summary>'s open/closed state, since the click bubbles up to it.
  if (!confirming) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(true);
        }}
        className="text-xs text-app-muted hover:text-red-400"
      >
        Eliminar
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2 text-xs" onClick={(e) => e.stopPropagation()}>
      <span className="text-red-300">¿Seguro?</span>
      <button
        type="button"
        disabled={isPending}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          startTransition(() => deleteBatchAction(batchId));
        }}
        className="font-semibold text-red-400 hover:text-red-300"
      >
        Sí, eliminar
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setConfirming(false);
        }}
        className="text-app-muted hover:text-app-ink"
      >
        Cancelar
      </button>
    </span>
  );
}

function WeekBlock({ week }: { week: BatchWeek }) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      <ul className="divide-y divide-app-line rounded-lg border border-app-line bg-app-surface-2 text-sm">
        {week.items.map((item) => (
          <li key={item.id} className="flex justify-between px-3 py-2">
            <span>
              {item.name}
              {item.quantity > 1 ? ` ×${item.quantity}` : ""}
            </span>
            <span className="tabular-nums text-app-muted">
              {formatCOP(item.price_cop * item.quantity)}
            </span>
          </li>
        ))}
      </ul>
      {week.days.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {week.days.map((day) => (
            <div key={day.dayNumber} className="rounded-lg border border-app-line bg-app-surface-2 p-3">
              <h4 className="text-sm font-semibold text-app-accent-2">
                {DAY_NAMES[day.dayNumber - 1] ?? `Día ${day.dayNumber}`}
              </h4>
              <div className="mt-1 flex flex-col gap-1">
                {day.meals.map((meal, i) => (
                  <p key={i} className="text-xs">
                    <span className="font-medium uppercase tracking-wide text-amber-400">
                      {meal.slot}
                    </span>{" "}
                    <span className="text-app-muted">{meal.description}</span>
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PlanHistory({ batches }: { batches: Batch[] }) {
  if (batches.length === 0) {
    return <p className="text-sm text-app-muted">Todavía no has generado ningún plan.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {batches.map((batch) => (
        <details key={batch.batchId} className="rounded-lg border border-app-line bg-app-surface">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
            <span className="flex items-center gap-2 font-semibold">
              {batch.weeks.length > 1 ? "Plan mensual" : "Plan semanal"} — {batch.storeName}
              {batch.isActive && (
                <span className="rounded-full bg-app-accent/20 px-2 py-0.5 text-[10px] font-semibold text-app-accent-2">
                  ACTIVO
                </span>
              )}
            </span>
            <span className="flex items-center gap-3 text-sm text-app-muted">
              <span>
                {new Date(batch.createdAt).toLocaleDateString("es-CO")} · {formatCOP(batch.totalCost)}
              </span>
              <DeleteButton batchId={batch.batchId} />
            </span>
          </summary>
          <div className="border-t border-app-line pt-3">
            {batch.weeks.length > 1 ? (
              <div className="flex flex-col gap-2 px-4 pb-1">
                {batch.weeks.map((week) => (
                  <details key={week.listId} className="rounded-lg border border-app-line bg-app-surface-2">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-sm marker:content-none">
                      <span className="font-medium">
                        {WEEK_LABELS[week.weekNumber - 1] ?? `Semana ${week.weekNumber}`}
                      </span>
                      <span className="text-app-muted">{formatCOP(week.totalCost ?? 0)}</span>
                    </summary>
                    <WeekBlock week={week} />
                  </details>
                ))}
              </div>
            ) : (
              <WeekBlock week={batch.weeks[0]} />
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
