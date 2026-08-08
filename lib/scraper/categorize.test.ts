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
    // Found by actually running the generator: these share a keyword with a
    // real food group but aren't the ingredient it implies.
    ["Pasta para el Tanque del Sanitario Agente X 52 g", "other"],
    ["Crema de Pollo A La Mesa 42 g", "other"],
    ["Papas Fritas de Pollo Margarita 110 g", "other"],
    ["Papas Fritas Naturales Margarita 300 g", "other"],
    ["Néctar de Pera California 215 ml", "other"],
    ["Sopa con Fideos con Sabor a Carne Maruchan 85 g", "other"],
    ["Pechuga de Pollo Ricachón 2 kg", "protein_poultry"],
    ["Lomos de Pechuga de Pollo Adobados Bucanero 0.6 kg", "protein_poultry"],
    ["Mermelada de Mora Glaz 180 g", "other"],
    ["Salsa de Tomate en Doypack Bassi 400 g", "other"],
    ["Jalea de Guayaba Bocaricos 414 g", "other"],
    ["Pastel de Guayaba Las Caseritas 220 g", "other"],
    ["Colada con Sabor a Fresa Maizena 30 g", "other"],
    // The structural fix: a snack whose flavor name matches "queso" (dairy)
    // must not become a dairy pick just because it's cheese-flavored.
    ["Extruidos de Maíz con Queso Chiksis 240 g", "other"],
    ["Papas Fritas de Limón Margarita 110 g", "other"],
    ["Betún de Pasta de Color Rojo Búfalo 36 g", "other"], // shoe polish
  ])("%s -> %s", (name, expected) => {
    expect(categorizeProduct(name).foodGroup).toBe(expected);
  });

  it("a cheese-flavored corn snack does not get pulled into dairy", () => {
    const result = categorizeProduct("Extruidos de Maíz con Queso Cheese Tris 93 g");
    expect(result.category).toBe("Dulces y Pasabocas");
    expect(result.foodGroup).toBe("other");
  });
});
