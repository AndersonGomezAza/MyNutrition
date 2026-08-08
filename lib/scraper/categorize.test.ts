import { describe, expect, it } from "vitest";
import { categorizeProduct } from "./categorize";

describe("categorizeProduct food_group", () => {
  it.each([
    ["Carne de Res para Sudar de Ara 0.5 kg", "protein_red_meat"],
    ["Carne de Cerdo Molida de Ara 0.5 kg", "protein_red_meat"],
    ["Costilla de Res de Ara 0.5 kg", "protein_red_meat"],
    ["Pechuga de Pollo Ricachón 2 kg", "protein_poultry"],
    ["Filete de Tilapia El Gran Langostino 500 g", "protein_fish"],
    ["Atún en Lomitos en Agua Costa Blanca 170 g", "protein_fish"],
    ["Huevos AA Rojos Del Canasto 12 unidades", "protein_egg"],
    ["Lentejas Del Costal 500 g", "protein_legume"],
    ["Fríjoles Cargamanto Rosados Del Costal 500 g", "protein_legume"],
    ["Arroz Blanco Del Costal 1 000 g", "carb"],
    ["Avena en Hojuelas Don Pancho 250 g", "carb"],
    ["Leche Larga Vida Semidescremada Deslactosada en Bolsa 1 100 ml", "dairy"],
    ["Yogur Griego con Sabor Natural Alpina 150 g", "dairy"],
    ["Manzana Gala de Ara 0.5 kg", "fruit"],
    ["Tomate de Árbol de Ara 500 g", "fruit"],
    ["Tomate de Ara 500 g", "vegetable"],
    ["Cebolla Blanca de Ara 500 g", "vegetable"],
    ["Aceite de Soya Olisun 900 ml", "fat_oil"],
    // Processed/deli meats stay out of protein_red_meat on purpose so the
    // generator's protein picks stay whole-food, not ultra-processed.
    ["Chorizos de Res y Cerdo Ranchera 560 g", "other"],
    ["Jamón de Pollo Bajo en Grasa Pietrán 230 g", "other"],
  ])("%s -> %s", (name, expected) => {
    expect(categorizeProduct(name).foodGroup).toBe(expected);
  });
});
