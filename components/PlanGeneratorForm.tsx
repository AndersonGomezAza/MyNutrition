"use client";

import { useActionState } from "react";
import Link from "next/link";
import { generatePlanAction, type PlanActionState } from "@/lib/actions/plan";
import { formatCOP } from "@/lib/utils/money";

const initialState: PlanActionState = { status: "idle" };

export function PlanGeneratorForm({
  stores,
}: {
  stores: { id: string; display_name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(generatePlanAction, initialState);

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4">
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-neutral-500">Tienda</span>
            <select
              name="store_id"
              required
              className="rounded-md border border-neutral-300 px-2 py-1.5"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-neutral-500">Presupuesto semanal (COP)</span>
            <input
              type="number"
              name="budget_cop"
              min="10000"
              step="1000"
              defaultValue="100000"
              required
              className="w-32 rounded-md border border-neutral-300 px-2 py-1.5"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-neutral-500">
            No incluir (separado por comas), ej: pepino, brócoli, calabaza
          </span>
          <input
            type="text"
            name="excluded"
            placeholder="pepino, brócoli, calabaza"
            className="rounded-md border border-neutral-300 px-2 py-1.5"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "Generando…" : "Generar plan"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {state.message}
        </p>
      )}

      {state.status === "infeasible" && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Con ese presupuesto no alcanza para incluir proteína.</p>
          {state.minimumBudgetEstimate && (
            <p className="mt-1">
              El presupuesto mínimo con este catálogo y estas exclusiones es de alrededor de{" "}
              {formatCOP(state.minimumBudgetEstimate)}.
            </p>
          )}
          <ul className="mt-2 list-disc pl-5">
            {state.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {state.status === "success" && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">
            Plan generado — total {formatCOP(state.totalCost)}
          </p>
          {state.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-800">
              {state.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex gap-4">
            <Link href={`/plan/${state.listId}`} className="font-medium underline">
              Ver el menú de la semana
            </Link>
            <Link href="/checklist" className="font-medium underline">
              Ir al checklist de compras
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
