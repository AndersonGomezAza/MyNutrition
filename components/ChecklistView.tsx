"use client";

import { useTransition } from "react";
import { formatCOP } from "@/lib/utils/money";
import { removeChecklistItem, toggleChecklistItem } from "@/lib/actions/checklist";
import type { ChecklistItem } from "@/lib/db/shoppingLists";

export function ChecklistView({ items }: { items: ChecklistItem[] }) {
  const [isPending, startTransition] = useTransition();

  const total = items.reduce((sum, item) => sum + item.price_cop * item.quantity, 0);
  const checkedCount = items.filter((i) => i.checked).length;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-neutral-500">
        {checkedCount} de {items.length} marcados · total {formatCOP(total)}
      </p>
      <ul className="flex flex-col divide-y divide-neutral-100 rounded-lg border border-neutral-200 bg-white">
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
              className="h-5 w-5 accent-emerald-600"
            />
            <div className="flex-1">
              <p className={item.checked ? "text-neutral-400 line-through" : ""}>
                {item.name}
                {item.quantity > 1 ? ` ×${item.quantity}` : ""}
              </p>
              {item.note && <p className="text-xs text-neutral-400">{item.note}</p>}
            </div>
            <span className="tabular-nums text-sm text-neutral-600">
              {formatCOP(item.price_cop * item.quantity)}
            </span>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => removeChecklistItem(item.id))}
              className="text-xs text-neutral-400 hover:text-red-600"
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
