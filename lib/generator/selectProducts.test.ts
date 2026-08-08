import { describe, expect, it } from "vitest";
import {
  buildCandidatePool,
  groupByFoodGroup,
  selectProteins,
  selectSimpleGroup,
  type Candidate,
} from "./selectProducts";

const PRODUCTS: Candidate[] = [
  { id: "1", name: "Pechuga de Pollo Ricachón 2 kg", price_cop: 8950, category: "Carnes y Pescados", food_group: "protein_poultry" },
  { id: "2", name: "Carne de Res para Sudar de Ara 0.5 kg", price_cop: 7500, category: "Carnes y Pescados", food_group: "protein_red_meat" },
  { id: "3", name: "Filete de Tilapia El Gran Langostino 500 g", price_cop: 11100, category: "Carnes y Pescados", food_group: "protein_fish" },
  { id: "4", name: "Huevos AA Rojos Del Canasto 12 unidades", price_cop: 3350, category: "Refrigerados", food_group: "protein_egg" },
  { id: "5", name: "Lentejas Del Costal 500 g", price_cop: 1900, category: "Despensa", food_group: "protein_legume" },
  { id: "6", name: "Arroz Blanco Del Costal 1 000 g", price_cop: 3400, category: "Despensa", food_group: "carb" },
  { id: "7", name: "Tomate de Ara 500 g", price_cop: 2400, category: "Frutas y Verduras", food_group: "vegetable" },
  { id: "8", name: "Manzana Gala de Ara 0.5 kg", price_cop: 5200, category: "Frutas y Verduras", food_group: "fruit" },
  { id: "9", name: "Leche Larga Vida 1 100 ml", price_cop: 1950, category: "Refrigerados", food_group: "dairy" },
  { id: "10", name: "Aceite de Soya Olisun 900 ml", price_cop: 4350, category: "Despensa", food_group: "fat_oil" },
  { id: "11", name: "Detergente en Polvo As 500 g", price_cop: 2850, category: "Aseo del Hogar", food_group: "other" },
];

describe("buildCandidatePool", () => {
  it("drops default non-food categories", () => {
    const pool = buildCandidatePool(PRODUCTS, []);
    expect(pool.find((p) => p.category === "Aseo del Hogar")).toBeUndefined();
  });

  it("drops products matching a user exclusion, case-insensitively", () => {
    const pool = buildCandidatePool(PRODUCTS, ["POLLO"]);
    expect(pool.find((p) => p.name.toLowerCase().includes("pollo"))).toBeUndefined();
  });
});

describe("selectProteins — the 'forgot the beef' regression test", () => {
  it("includes red meat when the budget comfortably covers all 5 subtypes", () => {
    const byFoodGroup = groupByFoodGroup(PRODUCTS);
    // sum of the 5 cheapest-per-subtype: 8950+7500+11100+3350+1900 = 32800
    const result = selectProteins(byFoodGroup, 40000);
    expect(result.feasible).toBe(true);
    if (result.feasible) {
      const groups = result.items.map((i) => i.food_group);
      expect(groups).toContain("protein_red_meat");
      expect(groups).toContain("protein_poultry");
      expect(groups).toContain("protein_fish");
      expect(groups).toContain("protein_egg");
      expect(groups).toContain("protein_legume");
    }
  });

  it("drops the priciest subtypes first but keeps at least 2 when budget is tight", () => {
    const byFoodGroup = groupByFoodGroup(PRODUCTS);
    // Only enough for the 2 cheapest subtypes (egg 3350 + legume 1900 = 5250)
    const result = selectProteins(byFoodGroup, 6000);
    expect(result.feasible).toBe(true);
    if (result.feasible) {
      expect(result.items.length).toBeGreaterThanOrEqual(2);
      const groups = result.items.map((i) => i.food_group);
      expect(groups).toContain("protein_egg");
      expect(groups).toContain("protein_legume");
      expect(result.warnings.length).toBeGreaterThan(0);
    }
  });

  it("returns infeasible with a minimum cost when nothing fits", () => {
    const byFoodGroup = groupByFoodGroup(PRODUCTS);
    const result = selectProteins(byFoodGroup, 500);
    expect(result.feasible).toBe(false);
    if (!result.feasible) {
      expect(result.minimumCost).toBe(1900); // cheapest subtype (legume)
    }
  });

  it("respects exclusions: excluding poultry removes it from candidates entirely", () => {
    const pool = buildCandidatePool(PRODUCTS, ["pollo"]);
    const byFoodGroup = groupByFoodGroup(pool);
    const result = selectProteins(byFoodGroup, 40000);
    expect(result.feasible).toBe(true);
    if (result.feasible) {
      expect(result.items.map((i) => i.food_group)).not.toContain("protein_poultry");
    }
  });
});

describe("selectSimpleGroup", () => {
  it("stays within budget", () => {
    const carbs = PRODUCTS.filter((p) => p.food_group === "carb");
    const items = selectSimpleGroup(carbs, 3000);
    const total = items.reduce((s, i) => s + i.price_cop * i.qty, 0);
    expect(total).toBeLessThanOrEqual(3000);
  });

  it("returns nothing when the budget is too small for any candidate", () => {
    const carbs = PRODUCTS.filter((p) => p.food_group === "carb");
    expect(selectSimpleGroup(carbs, 100)).toHaveLength(0);
  });

  it("uses a healthy majority of the budget instead of stopping at 3 cheap items", () => {
    // Regression: a single variety-first pass (3 items, qty 1 each) against
    // a real ~20.000 COP group budget was spending as little as 20% of it.
    const carbs = [
      { id: "c1", name: "Arroz", price_cop: 3400, category: "Despensa", food_group: "carb" as const },
      { id: "c2", name: "Avena", price_cop: 2250, category: "Despensa", food_group: "carb" as const },
      { id: "c3", name: "Pan", price_cop: 4550, category: "Panadería", food_group: "carb" as const },
    ];
    const items = selectSimpleGroup(carbs, 20000);
    const total = items.reduce((s, i) => s + i.price_cop * i.qty, 0);
    expect(total).toBeLessThanOrEqual(20000);
    expect(total).toBeGreaterThan(10000); // >50% of budget actually used
  });
});
