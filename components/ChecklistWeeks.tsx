import { formatCOP } from "@/lib/utils/money";
import { ChecklistView } from "@/components/ChecklistView";
import type { ActiveWeek } from "@/lib/db/shoppingLists";

const WEEK_LABELS = ["Semana 1", "Semana 2", "Semana 3", "Semana 4"];

export function ChecklistWeeks({ weeks }: { weeks: ActiveWeek[] }) {
  if (weeks.length === 1) {
    // A plain weekly plan doesn't need a dropdown around itself.
    return <ChecklistView items={weeks[0].items} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {weeks.map(({ list, items }, index) => {
        const total = items.reduce((s, i) => s + i.price_cop * i.quantity, 0);
        const checkedCount = items.filter((i) => i.checked).length;
        return (
          <details
            key={list.id}
            className="rounded-lg border border-app-line bg-app-surface open:pb-4"
            open={index === 0}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 marker:content-none">
              <span className="font-semibold">
                {WEEK_LABELS[list.week_number - 1] ?? `Semana ${list.week_number}`}
              </span>
              <span className="text-sm text-app-muted">
                {checkedCount}/{items.length} · {formatCOP(total)}
              </span>
            </summary>
            <div className="px-4">
              <ChecklistView items={items} hideSummary />
            </div>
          </details>
        );
      })}
    </div>
  );
}
