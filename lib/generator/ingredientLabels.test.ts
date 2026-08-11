import { describe, expect, it } from "vitest";
import { extractIngredientLabel } from "./ingredientLabels";

describe("extractIngredientLabel", () => {
  it("strips the brand, keeping only the matched ingredient keyword", () => {
    expect(extractIngredientLabel("Pechuga de Pollo Ricachón 2 kg", "protein_poultry")).toBe(
      "Pechuga de pollo"
    );
    expect(extractIngredientLabel("Arroz Blanco Del Costal 1 000 g", "carb")).toBe("Arroz");
    expect(extractIngredientLabel("Manzana Gala de Ara 0.5 kg", "fruit")).toBe("Manzana");
    expect(extractIngredientLabel("Filete de Tilapia El Gran Langostino 500 g", "protein_fish")).toBe(
      "Tilapia"
    );
  });

  it("never returns text containing the brand", () => {
    const label = extractIngredientLabel("Leche Larga Vida Alpina 1 100 ml", "dairy");
    expect(label.toLowerCase()).not.toContain("alpina");
  });

  it("falls back to a generic label when no keyword matches", () => {
    expect(extractIngredientLabel("Producto sin palabras clave", "protein_poultry")).toBe("Pollo");
  });
});
