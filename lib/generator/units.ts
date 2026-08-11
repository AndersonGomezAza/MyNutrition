/**
 * Turns a product's free-text "presentation" ("2 kg", "500 g", "12 unidades",
 * "1 100 ml") into a comparable numeric amount — the base for computing a
 * meal's actual portion from what was actually purchased. Pure/no I/O so it's
 * directly unit-testable.
 */

export type Unit = "g" | "ml" | "unidad";
export type ParsedAmount = { value: number; unit: Unit };

export function parsePresentation(presentation: string | null | undefined): ParsedAmount | null {
  if (!presentation) return null;
  // Some presentations use a space as a thousands separator ("1 100 ml"),
  // which would otherwise parse as just "1".
  const normalized = presentation.trim().replace(/(\d)\s+(\d)/g, "$1$2");
  const match = normalized.match(/^([\d.,]+)\s*(kg|gr|g|ml|lt|l|unidades?|und)\b/i);
  if (!match) return null;

  const value = parseFloat(match[1].replace(",", "."));
  if (!Number.isFinite(value) || value <= 0) return null;

  const unitRaw = match[2].toLowerCase();
  if (unitRaw === "kg") return { value: value * 1000, unit: "g" };
  if (unitRaw === "l" || unitRaw === "lt") return { value: value * 1000, unit: "ml" };
  if (unitRaw === "g" || unitRaw === "gr") return { value, unit: "g" };
  if (unitRaw === "ml") return { value, unit: "ml" };
  return { value, unit: "unidad" };
}

/** Rounds a raw amount to something worth printing in a recipe. */
export function formatPortion(amount: number, unit: Unit): string {
  if (!Number.isFinite(amount) || amount <= 0) return unit === "unidad" ? "1 unidad" : `${unit === "ml" ? 5 : 5} ${unit}`;

  if (unit === "unidad") {
    const rounded = Math.max(0.5, Math.round(amount * 2) / 2);
    return rounded === 1 ? "1 unidad" : `${rounded} unidades`;
  }

  const rounded = Math.max(5, Math.round(amount / 5) * 5);
  return `${rounded} ${unit}`;
}
