import { describe, expect, it } from "vitest";
import { generatePlan } from "./plan";
import type { Candidate } from "./selectProducts";

// A slice representative of the real Ara catalog (same items used in the
// hand-built static plan), enough variety per food group to exercise the
// full allocator, not just the protein subsystem.
const PRODUCTS: Candidate[] = [
  { id: "p1", name: "Pechuga de Pollo Ricachón 2 kg", price_cop: 8950, category: "Carnes y Pescados", food_group: "protein_poultry" },
  { id: "p2", name: "Carne de Res para Sudar de Ara 0.5 kg", price_cop: 7500, category: "Carnes y Pescados", food_group: "protein_red_meat" },
  { id: "p3", name: "Filete de Tilapia El Gran Langostino 500 g", price_cop: 11100, category: "Carnes y Pescados", food_group: "protein_fish" },
  { id: "p4", name: "Huevos AA Rojos Del Canasto 12 unidades", price_cop: 3350, category: "Refrigerados", food_group: "protein_egg" },
  { id: "p5", name: "Lentejas Del Costal 500 g", price_cop: 1900, category: "Despensa", food_group: "protein_legume" },
  { id: "p6", name: "Fríjoles Cargamanto Rosados 500 g", price_cop: 2850, category: "Despensa", food_group: "protein_legume" },
  { id: "c1", name: "Arroz Blanco Del Costal 1 000 g", price_cop: 3400, category: "Despensa", food_group: "carb" },
  { id: "c2", name: "Avena en Hojuelas Don Pancho 250 g", price_cop: 2250, category: "Despensa", food_group: "carb" },
  { id: "c3", name: "Pan Integral Tajado Bimbo 460 g", price_cop: 4550, category: "Panadería", food_group: "carb" },
  { id: "d1", name: "Leche Larga Vida 1 100 ml", price_cop: 1950, category: "Refrigerados", food_group: "dairy" },
  { id: "d2", name: "Yogur Griego Natural Alpina 150 g", price_cop: 2550, category: "Refrigerados", food_group: "dairy" },
  { id: "f1", name: "Manzana Gala de Ara 0.5 kg", price_cop: 5200, category: "Frutas y Verduras", food_group: "fruit" },
  { id: "f2", name: "Naranja Valencia de Ara 0.5 kg", price_cop: 1400, category: "Frutas y Verduras", food_group: "fruit" },
  { id: "f3", name: "Papaya de Ara 0.5 kg", price_cop: 2000, category: "Frutas y Verduras", food_group: "fruit" },
  { id: "v1", name: "Tomate de Ara 500 g", price_cop: 2400, category: "Frutas y Verduras", food_group: "vegetable" },
  { id: "v2", name: "Cebolla Blanca de Ara 500 g", price_cop: 2800, category: "Frutas y Verduras", food_group: "vegetable" },
  { id: "v3", name: "Espinaca de Ara 200 g", price_cop: 2000, category: "Frutas y Verduras", food_group: "vegetable" },
  { id: "o1", name: "Aceite de Soya Olisun 900 ml", price_cop: 4350, category: "Despensa", food_group: "fat_oil" },
  // Non-food noise that must never show up in a generated plan.
  { id: "x1", name: "Detergente en Polvo As 500 g", price_cop: 2850, category: "Aseo del Hogar", food_group: "other" },
  { id: "x2", name: "Cerveza Águila 330 ml", price_cop: 2200, category: "Licores", food_group: "other" },
];

describe("generatePlan at a realistic $100.000 weekly budget", () => {
  const result = generatePlan(PRODUCTS, 100000, []);

  it("is feasible", () => {
    expect(result.feasible).toBe(true);
  });

  it("includes red meat — the exact bug the hand-built plan had", () => {
    if (!result.feasible) throw new Error("expected feasible plan");
    expect(result.items.some((i) => i.food_group === "protein_red_meat")).toBe(true);
  });

  it("stays at or under budget", () => {
    if (!result.feasible) throw new Error("expected feasible plan");
    expect(result.totalCost).toBeLessThanOrEqual(100000);
  });

  it("never includes non-food categories", () => {
    if (!result.feasible) throw new Error("expected feasible plan");
    const ids = result.items.map((i) => i.productId);
    expect(ids).not.toContain("x1");
    expect(ids).not.toContain("x2");
  });

  it("produces a full 7-day plan with all 4 meal slots each day", () => {
    if (!result.feasible) throw new Error("expected feasible plan");
    expect(result.meals).toHaveLength(28); // 7 days x 4 slots
    for (let day = 1; day <= 7; day++) {
      const slots = result.meals.filter((m) => m.dayNumber === day).map((m) => m.slot);
      expect(slots.sort()).toEqual(["almuerzo", "cena", "desayuno", "merienda"]);
    }
  });
});

describe("generatePlan respects exclusions end to end", () => {
  it("excludes vegetable by name and still produces a feasible plan", () => {
    const result = generatePlan(PRODUCTS, 100000, ["tomate"]);
    expect(result.feasible).toBe(true);
    if (result.feasible) {
      expect(result.items.some((i) => i.productId === "v1")).toBe(false);
    }
  });
});

describe("generatePlan reports infeasibility honestly", () => {
  it("refuses to generate a protein-free plan when the budget is too low", () => {
    const result = generatePlan(PRODUCTS, 500, []);
    expect(result.feasible).toBe(false);
    if (!result.feasible) {
      expect(result.minimumBudgetEstimate).toBeGreaterThan(500);
    }
  });
});
