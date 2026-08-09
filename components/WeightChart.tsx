"use client";

import { useMemo, useState } from "react";
import { removeWeightLog } from "@/lib/actions/weight";
import type { WeightLogRow } from "@/lib/db/weightLogs";

const ACCENT = "#9333ea"; // matches --color-app-accent in globals.css
const WIDTH = 640;
const HEIGHT = 260;
const PAD = { top: 20, right: 24, bottom: 28, left: 40 };

function formatShortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

export function WeightChart({ logs }: { logs: WeightLogRow[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const chart = useMemo(() => {
    if (logs.length === 0) return null;

    const times = logs.map((l) => new Date(l.logged_at + "T00:00:00").getTime());
    const weights = logs.map((l) => l.weight_kg);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    const weightPad = Math.max((maxWeight - minWeight) * 0.15, 0.5);
    const yMin = minWeight - weightPad;
    const yMax = maxWeight + weightPad;

    const innerW = WIDTH - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;

    const x = (t: number) =>
      maxTime === minTime
        ? PAD.left + innerW / 2
        : PAD.left + ((t - minTime) / (maxTime - minTime)) * innerW;
    const y = (w: number) => PAD.top + innerH - ((w - yMin) / (yMax - yMin)) * innerH;

    const points = logs.map((l, i) => ({
      x: x(times[i]),
      y: y(l.weight_kg),
      log: l,
    }));

    const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaPath =
      `${linePath} L ${points[points.length - 1].x} ${PAD.top + innerH} ` +
      `L ${points[0].x} ${PAD.top + innerH} Z`;

    const gridSteps = 4;
    const gridLines = Array.from({ length: gridSteps + 1 }, (_, i) => {
      const value = yMin + ((yMax - yMin) * i) / gridSteps;
      return { value, y: y(value) };
    });

    return { points, linePath, areaPath, gridLines, innerW };
  }, [logs]);

  if (logs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-app-line bg-app-surface p-4 text-sm text-app-muted">
        Todavía no has registrado ningún peso.
      </p>
    );
  }

  const first = logs[0].weight_kg;
  const last = logs[logs.length - 1].weight_kg;
  const delta = last - first;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-app-muted">
          {logs.length} registro{logs.length !== 1 ? "s" : ""} ·{" "}
          <span className={delta <= 0 ? "text-emerald-400" : "text-amber-400"}>
            {delta > 0 ? "+" : ""}
            {delta.toFixed(1)} kg desde el primer registro
          </span>
        </p>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-medium text-app-muted underline hover:text-app-ink"
        >
          {showTable ? "Ver gráfica" : "Ver como tabla"}
        </button>
      </div>

      {showTable || !chart ? (
        <div className="overflow-auto rounded-lg border border-app-line bg-app-surface">
          <table className="w-full text-sm">
            <thead className="bg-app-surface-2 text-left text-xs uppercase text-app-muted">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2 text-right">Peso (kg)</th>
                <th className="px-3 py-2">Nota</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {[...logs].reverse().map((l) => (
                <tr key={l.id} className="border-t border-app-line">
                  <td className="px-3 py-2">{formatShortDate(l.logged_at)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{l.weight_kg.toFixed(1)}</td>
                  <td className="px-3 py-2 text-app-muted">{l.note}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeWeightLog(l.id)}
                      className="text-xs text-app-muted hover:text-red-400"
                    >
                      Quitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative rounded-lg border border-app-line bg-app-surface p-2">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            className="w-full"
            role="img"
            aria-label={`Peso a lo largo del tiempo, de ${first.toFixed(1)} a ${last.toFixed(1)} kg`}
            onMouseLeave={() => setHoverIndex(null)}
          >
            {chart.gridLines.map((g, i) => (
              <g key={i}>
                <line
                  x1={PAD.left}
                  x2={WIDTH - PAD.right}
                  y1={g.y}
                  y2={g.y}
                  className="stroke-app-line"
                  strokeWidth={1}
                />
                <text x={PAD.left - 8} y={g.y + 3} textAnchor="end" className="fill-app-muted text-[9px]">
                  {g.value.toFixed(0)}
                </text>
              </g>
            ))}

            <path d={chart.areaPath} fill={ACCENT} fillOpacity={0.1} stroke="none" />
            <path
              d={chart.linePath}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {chart.points.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r={i === chart.points.length - 1 ? 5 : 3}
                fill={ACCENT}
                className="stroke-app-surface"
                strokeWidth={2}
              />
            ))}

            {/* transparent hit strips, one per point, wider than the visible mark */}
            {chart.points.map((p, i) => (
              <rect
                key={i}
                x={p.x - chart.innerW / logs.length / 2}
                y={PAD.top}
                width={Math.max(chart.innerW / logs.length, 16)}
                height={HEIGHT - PAD.top - PAD.bottom}
                fill="transparent"
                onMouseEnter={() => setHoverIndex(i)}
              />
            ))}

            {hoverIndex !== null && (
              <line
                x1={chart.points[hoverIndex].x}
                x2={chart.points[hoverIndex].x}
                y1={PAD.top}
                y2={HEIGHT - PAD.bottom}
                className="stroke-app-muted"
                strokeWidth={1}
              />
            )}

            <text
              x={chart.points[chart.points.length - 1].x}
              y={chart.points[chart.points.length - 1].y - 10}
              textAnchor="end"
              className="fill-app-ink text-[11px] font-semibold"
            >
              {last.toFixed(1)} kg
            </text>
          </svg>

          {hoverIndex !== null && (
            <div
              className="pointer-events-none absolute rounded-md border border-app-line bg-app-surface px-2 py-1 text-xs shadow-md"
              style={{
                left: `${(chart.points[hoverIndex].x / WIDTH) * 100}%`,
                top: 4,
                transform: "translateX(-50%)",
              }}
            >
              <span className="font-semibold tabular-nums">
                {logs[hoverIndex].weight_kg.toFixed(1)} kg
              </span>{" "}
              <span className="text-app-muted">{formatShortDate(logs[hoverIndex].logged_at)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
