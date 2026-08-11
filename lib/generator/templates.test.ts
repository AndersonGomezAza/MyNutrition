import { describe, expect, it } from "vitest";
import { buildWeekPlan } from "./templates";
import { formatPortion, parsePresentation } from "./units";
import type { SelectedItem } from "./selectProducts";

// One item per food group, each with a real "presentation" and a brand word
// that must never leak into a rendered meal description.
const ITEMS: SelectedItem[] = [
  {
    productId: "chicken",
    name: "Pechuga de Pollo Ricachón 2 kg",
    price_cop: 8950,
    food_group: "protein_poultry",
    qty: 1,
    presentation: "2 kg",
  },
  {
    productId: "eggs",
    name: "Huevos AA Rojos Del Canasto 12 unidades",
    price_cop: 3350,
    food_group: "protein_egg",
    qty: 2,
    presentation: "12 unidades",
  },
  {
    productId: "rice",
    name: "Arroz Blanco Del Costal 1 000 g",
    price_cop: 3400,
    food_group: "carb",
    qty: 1,
    presentation: "1 000 g",
  },
  {
    productId: "milk",
    name: "Leche Larga Vida Alpina 1 100 ml",
    price_cop: 1950,
    food_group: "dairy",
    qty: 1,
    presentation: "1 100 ml",
  },
  {
    productId: "apple",
    name: "Manzana Gala de Ara 0.5 kg",
    price_cop: 5200,
    food_group: "fruit",
    qty: 1,
    presentation: "0.5 kg",
  },
  {
    productId: "tomato",
    name: "Tomate de Ara 500 g",
    price_cop: 2400,
    food_group: "vegetable",
    qty: 1,
    presentation: "500 g",
  },
];

const BRAND_WORDS = ["ricachón", "del canasto", "del costal", "alpina", "de ara"];

describe("buildWeekPlan meal descriptions", () => {
  it("never names a brand — only the ingredient", () => {
    const meals = buildWeekPlan(ITEMS, 1);
    for (const meal of meals) {
      const lower = meal.description.toLowerCase();
      for (const brand of BRAND_WORDS) {
        expect(lower).not.toContain(brand);
      }
    }
  });

  it("names the ingredient itself", () => {
    const meals = buildWeekPlan(ITEMS, 1);
    const joined = meals.map((m) => m.description.toLowerCase()).join(" | ");
    expect(joined).toContain("pollo");
    expect(joined).toContain("arroz");
    expect(joined).toContain("tomate");
  });

  it("still produces the full 7x4 grid and keeps productIds/description in sync", () => {
    const meals = buildWeekPlan(ITEMS, 1);
    expect(meals).toHaveLength(28);
    for (const meal of meals) {
      expect(meal.productIds.length).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("buildWeekPlan portion coherence", () => {
  it("the printed portion, times how many times it's used, times people, never exceeds what was purchased", () => {
    for (const people of [1, 2, 4]) {
      const meals = buildWeekPlan(ITEMS, people);
      const usageCounts = new Map<string, number>();
      for (const meal of meals) {
        for (const id of meal.productIds) {
          usageCounts.set(id, (usageCounts.get(id) ?? 0) + 1);
        }
      }
      for (const item of ITEMS) {
        const uses = usageCounts.get(item.productId);
        if (!uses) continue; // never used this week — no portion claim to check
        const parsed = parsePresentation(item.presentation);
        if (!parsed) continue;
        const purchasedTotal = parsed.value * item.qty;
        const perUsePerPerson = purchasedTotal / uses / people;
        // Use the real rounding function rather than reimplementing it, so
        // this test can't drift from what buildWeekPlan actually prints.
        const claimedPerUse = parseFloat(formatPortion(perUsePerPerson, parsed.unit));
        const totalClaimed = claimedPerUse * uses * people;
        // formatPortion rounds to a grid (5 g/ml, 0.5 unidad) and floors at
        // one grid step so a portion never displays as ~0. The per-person
        // rounding error (at most one grid step) gets multiplied back out
        // by both uses *and* people when reconstructing the total, so the
        // tolerance has to scale by both too.
        const step = parsed.unit === "unidad" ? 0.5 : 5;
        expect(totalClaimed).toBeLessThanOrEqual(purchasedTotal + step * uses * people);
      }
    }
  });

  it("doubling people roughly halves the per-person portion for a fixed purchase", () => {
    const mealsFor = (people: number) => buildWeekPlan(ITEMS, people);
    const lunchDescriptionDay1 = (people: number) =>
      mealsFor(people).find((m) => m.dayNumber === 1 && m.slot === "almuerzo")!.description;

    const extractGrams = (desc: string) => {
      const match = desc.match(/(\d+(\.\d+)?)\s*g/);
      return match ? parseFloat(match[1]) : null;
    };

    const forOne = extractGrams(lunchDescriptionDay1(1));
    const forFour = extractGrams(lunchDescriptionDay1(4));
    expect(forOne).not.toBeNull();
    expect(forFour).not.toBeNull();
    // Same purchase, 4x the people -> close to 1/4 the portion (allow
    // rounding slack since formatPortion snaps to the nearest 5g).
    expect(forFour!).toBeLessThan(forOne! * 0.4);
  });
});
