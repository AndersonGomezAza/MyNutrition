import type { FoodGroup } from "@/lib/scraper/categorize";

/** Categories excluded from generated plans by default — not groceries. */
export const DEFAULT_EXCLUDED_CATEGORIES = [
  "Aseo del Hogar",
  "Cuidado Personal",
  "Mascotas",
  "Bebés",
  "Licores",
  "Dulces y Pasabocas",
];

export const PROTEIN_SUBTYPES: FoodGroup[] = [
  "protein_red_meat",
  "protein_poultry",
  "protein_fish",
  "protein_egg",
  "protein_legume",
];

export const SIMPLE_FOOD_GROUPS: FoodGroup[] = ["carb", "dairy", "fruit", "vegetable", "fat_oil"];

/** Share of the total budget each food group gets. Must sum to 1. */
export const BUDGET_SHARES: Record<"protein" | FoodGroup, number> = {
  protein: 0.35,
  carb: 0.2,
  dairy: 0.1,
  fruit: 0.15,
  vegetable: 0.15,
  fat_oil: 0.05,
  // unused keys kept so the Record type covers every FoodGroup; protein_*
  // subtypes share the single "protein" pool above instead of having their
  // own fixed slice, since forcing a fixed 7% per subtype would make an
  // expensive subtype (fish) starve a cheap one (eggs) of room it doesn't need.
  protein_red_meat: 0,
  protein_poultry: 0,
  protein_fish: 0,
  protein_egg: 0,
  protein_legume: 0,
  other: 0,
};

// Never let one food group balloon into "the whole week is just rice."
export const MAX_ITEMS_PER_SIMPLE_GROUP = 3;
export const MAX_PROTEIN_ITEMS = 6;
