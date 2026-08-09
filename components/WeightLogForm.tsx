"use client";

import { useRef, useState, useTransition } from "react";
import { logWeight } from "@/lib/actions/weight";

function todayISO() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function WeightLogForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={(formData) =>
        startTransition(async () => {
          setError(null);
          try {
            await logWeight(formData);
            formRef.current?.reset();
          } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
          }
        })
      }
      className="flex flex-wrap items-end gap-3 rounded-lg border border-app-line bg-app-surface p-4"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs text-app-muted">Fecha</span>
        <input
          type="date"
          name="logged_at"
          defaultValue={todayISO()}
          required
          className="rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-xs text-app-muted">Peso (kg)</span>
        <input
          type="number"
          name="weight_kg"
          step="0.1"
          min="1"
          required
          placeholder="70.5"
          className="w-24 rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5"
        />
      </label>
      <label className="flex flex-1 min-w-[160px] flex-col gap-1 text-sm">
        <span className="text-xs text-app-muted">Nota (opcional)</span>
        <input
          type="text"
          name="note"
          placeholder="ej. después de entrenar"
          className="rounded-md border border-app-line bg-app-surface-2 px-2 py-1.5 placeholder:text-app-muted"
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-app-accent px-4 py-1.5 text-sm font-medium text-app-accent-ink hover:bg-app-accent-2 disabled:opacity-50"
      >
        {isPending ? "Guardando…" : "Guardar"}
      </button>
      {error && <p className="w-full text-sm text-red-400">{error}</p>}
    </form>
  );
}
