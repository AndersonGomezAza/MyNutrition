import Link from "next/link";

const CARDS = [
  {
    href: "/catalog",
    title: "Catálogo",
    description: "Precios en vivo de Ara y D1, siempre actualizados por el scraper semanal.",
  },
  {
    href: "/checklist",
    title: "Checklist",
    description: "Tu lista de compras activa. Márcala mientras haces mercado.",
  },
  {
    href: "/plan",
    title: "Generar plan",
    description: "Pon tu presupuesto y lo que no te gusta, y arma la lista y el menú de la semana.",
  },
  {
    href: "/progress",
    title: "Progreso",
    description: "Registra tu peso y mira la tendencia semana a semana.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">MyNutrition</h1>
        <p className="mt-1 text-app-muted">
          Catálogo, lista de compras y plan de comidas para bajar grasa corporal comiendo rico.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="rounded-lg border border-app-line bg-app-surface p-4 transition hover:border-app-accent-2 hover:shadow-sm"
          >
            <h2 className="font-semibold text-app-accent-2">{card.title}</h2>
            <p className="mt-1 text-sm text-app-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
