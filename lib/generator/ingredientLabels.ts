// Relative import (not the "@/" alias) — vitest here has no path-alias
// resolution configured, and this is a value import (FOOD_GROUP_RULES),
// unlike the type-only "@/" imports elsewhere in the generator that get
// erased before bundling and so never actually need resolving.
import { FOOD_GROUP_RULES, type FoodGroup } from "../scraper/categorize";

// Only used when a product name doesn't contain any of its own food group's
// keywords — shouldn't happen in practice, since the product was classified
// into that food group via one of those same keywords in the first place.
const GENERIC_FALLBACK: Record<FoodGroup, string> = {
  protein_red_meat: "carne de res o cerdo",
  protein_poultry: "pollo",
  protein_fish: "pescado",
  protein_egg: "huevo",
  protein_legume: "legumbres",
  carb: "carbohidrato",
  dairy: "lácteo",
  fruit: "fruta",
  vegetable: "vegetal",
  fat_oil: "aceite",
  other: "ingrediente",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Derives a clean, brand-free ingredient name from a product's full catalog
 * name ("Pechuga de Pollo Ricachón 2 kg" -> "Pechuga de pollo") by reusing
 * the same keyword list that classified it into this food group in the first
 * place, instead of trying to strip brand/pack-size text heuristically.
 */
export function extractIngredientLabel(name: string, foodGroup: FoodGroup): string {
  const lower = name.toLowerCase();
  const rule = FOOD_GROUP_RULES.find(([group]) => group === foodGroup);
  const match = rule?.[1].find((keyword) => lower.includes(keyword));
  return capitalize((match ?? GENERIC_FALLBACK[foodGroup]).trim());
}
