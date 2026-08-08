"use client";

import { useMemo, useState } from "react";
import { formatCOP } from "@/lib/utils/money";
import type { ProductRow } from "@/lib/db/products";

const CATEGORIES = [
  "Todas",
  "Despensa",
  "Bebidas",
  "Frutas y Verduras",
  "Carnes y Pescados",
  "Panadería",
  "Refrigerados",
  "Dulces y Pasabocas",
  "Cuidado Personal",
  "Aseo del Hogar",
  "Licores",
  "Bebés",
  "Mascotas",
  "Varios",
];

type SortDir = "asc" | "desc" | null;

export function CatalogTable({ products }: { products: ProductRow[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [sortDir, setSortDir] = useState<SortDir>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows = products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q);
      const matchesCategory = category === "Todas" || p.category === category;
      return matchesQuery && matchesCategory;
    });
    if (sortDir) {
      rows = [...rows].sort((a, b) =>
        sortDir === "asc" ? a.price_cop - b.price_cop : b.price_cop - a.price_cop
      );
    }
    return rows;
  }, [products, query, category, sortDir]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder="Buscar producto, ej. leche, pollo, avena…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 min-w-[220px] rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "asc" ? null : "asc"))}
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            sortDir === "asc"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-neutral-300"
          }`}
        >
          Precio ↑
        </button>
        <button
          type="button"
          onClick={() => setSortDir((d) => (d === "desc" ? null : "desc"))}
          className={`rounded-md border px-3 py-2 text-sm font-medium ${
            sortDir === "desc"
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-neutral-300"
          }`}
        >
          Precio ↓
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        {filtered.length} de {products.length} productos
      </p>
      <div className="max-h-[560px] overflow-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-neutral-50 text-left text-xs uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2">Producto</th>
              <th className="px-3 py-2">Categoría</th>
              <th className="px-3 py-2 text-right">Precio</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">{p.name}</td>
                <td className="px-3 py-2">
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600">
                    {p.category}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {formatCOP(p.price_cop)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
