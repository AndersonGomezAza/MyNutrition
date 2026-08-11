"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { generatePlanAction, type PlanActionState } from "@/lib/actions/plan";
import { formatCOP } from "@/lib/utils/money";

const initialState: PlanActionState = { status: "idle" };
const DEFAULT_BUDGET: Record<"semana" | "mes", number> = { semana: 100000, mes: 400000 };

export function PlanGeneratorForm({
  stores,
}: {
  stores: { id: string; display_name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(generatePlanAction, initialState);
  const [mode, setMode] = useState<"semana" | "mes">("semana");
  const [people, setPeople] = useState(1);
  const [budget, setBudget] = useState(DEFAULT_BUDGET.semana);
  const [budgetTouched, setBudgetTouched] = useState(false);

  function handleModeChange(next: "semana" | "mes") {
    setMode(next);
    if (!budgetTouched) setBudget(DEFAULT_BUDGET[next] * people);
  }

  function handlePeopleChange(next: number) {
    const clamped = Math.max(1, Math.floor(next) || 1);
    if (!budgetTouched) setBudget(DEFAULT_BUDGET[mode] * clamped);
    setPeople(clamped);
  }

  return (
    <div className="flex flex-col gap-4">
      <form action={formAction} className="flex flex-col gap-3 rounded-lg border border-app-line bg-app-surface p-4">
        <div className="flex gap-2">
          {(["semana", "mes"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleModeChange(m)}
              aria-pressed={mode === m}
              className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
                mode === m
                  ? "border-app-accent bg-app-accent text-app-accent-ink"
                  : "border-app-line text-app-muted"
              }`}
            >
              {m === "semana" ? "Por semana" : "Por mes (4 semanas)"}
            </button>
          ))}
          <input type="hidden" name="mode" value={mode} />
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-app-muted">Tienda</span>
            <select
              name="store_id"
              required
              className="rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5"
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.display_name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-app-muted">
              Presupuesto {mode === "semana" ? "semanal" : "mensual"} (COP)
            </span>
            <input
              type="number"
              name="budget_cop"
              min="10000"
              step="1000"
              value={budget}
              onChange={(e) => {
                setBudgetTouched(true);
                setBudget(Number(e.target.value));
              }}
              required
              className="w-36 rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs text-app-muted">Personas</span>
            <input
              type="number"
              name="people"
              min="1"
              step="1"
              value={people}
              onChange={(e) => handlePeopleChange(Number(e.target.value))}
              required
              className="w-20 rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5"
            />
          </label>
        </div>
        <p className="text-xs text-app-muted">
          Las porciones de cada comida se calculan a partir de lo que realmente compras esta
          {mode === "semana" ? " semana" : " cada semana del mes"}, repartido entre estas personas —
          si el presupuesto queda corto para el número de personas, vas a ver porciones más
          chiquitas en vez de un plan que no concuerde con lo comprado.
        </p>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-xs text-app-muted">
            No incluir (separado por comas), ej: pepino, brócoli, calabaza
          </span>
          <input
            type="text"
            name="excluded"
            placeholder="pepino, brócoli, calabaza"
            className="rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5 placeholder:text-app-muted"
          />
        </label>
        <button
          type="submit"
          disabled={isPending}
          className="self-start rounded-md bg-app-accent px-4 py-2 text-sm font-medium text-app-accent-ink hover:bg-app-accent-2 disabled:opacity-50"
        >
          {isPending
            ? "Generando…"
            : mode === "semana"
              ? "Generar plan de la semana"
              : "Generar plan del mes (4 semanas)"}
        </button>
      </form>

      {state.status === "error" && (
        <p className="rounded-lg border border-red-800/50 bg-red-500/10 p-4 text-sm text-red-300">
          {state.message}
        </p>
      )}

      {state.status === "infeasible" && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-500/10 p-4 text-sm text-amber-200">
          <p className="font-semibold text-amber-100">Con ese presupuesto no alcanza para incluir proteína.</p>
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
        <div className="rounded-lg border border-emerald-800/50 bg-emerald-500/10 p-4 text-sm text-emerald-100">
          <p className="font-semibold">
            {state.weekCount > 1 ? `Plan mensual generado (${state.weekCount} semanas)` : "Plan generado"} — total{" "}
            {formatCOP(state.totalCost)}
          </p>
          {state.warnings.length > 0 && (
            <ul className="mt-2 list-disc pl-5 text-amber-300">
              {state.warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          )}
          <p className="mt-3">
            <Link href="/checklist" className="font-medium underline">
              Ir al checklist de compras
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
