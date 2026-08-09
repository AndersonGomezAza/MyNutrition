"use client";

import { useTransition } from "react";
import { formatCOP } from "@/lib/utils/money";
import { removeChecklistItem, toggleChecklistItem } from "@/lib/actions/checklist";
import type { ChecklistItem } from "@/lib/db/shoppingLists";

export function ChecklistView({
  items,
  hideSummary = false,
}: {
  items: ChecklistItem[];
  hideSummary?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const total = items.reduce((sum, item) => sum + item.price_cop * item.quantity, 0);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="flex flex-col gap-3">
      {!hideSummary && (
        <p className="text-sm text-app-muted">
          {checkedCount} de {items.length} marcados · total {formatCOP(total)}
        </p>
      )}
      <ul className="flex flex-col divide-y divide-app-line rounded-lg border border-app-line bg-app-surface">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-4 py-3">
            <input
              type="checkbox"
              checked={item.checked}
              disabled={isPending}
              onChange={(e) =>
                startTransition(() => {
                  toggleChecklistItem(item.id, e.target.checked);
                })
              }
              className="h-5 w-5 accent-app-accent"
            />
            <div className="flex-1">
              <p className={item.checked ? "text-app-muted line-through" : ""}>
                {item.name}
                {item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </p>
              {item.note && <p className="text-xs text-app-muted">{item.note}</p>}
            </div>
            <span className="tabular-nums text-sm text-app-muted">
              {formatCOP(item.price_cop * item.quantity)}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeChecklistItem(item.id))}
              className="text-xs text-app-muted hover:text-red-400"
              aria-label={`Quitar ${item.name}`}
            >
              Quitar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
