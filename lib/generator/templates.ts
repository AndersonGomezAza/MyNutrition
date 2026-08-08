import type { SelectedItem } from "./selectProducts";

export type MealSlot = "desayuno" | "almuerzo" | "merienda" | "cena";

export type PlannedMeal = {
  dayNumber: number;
  slot: MealSlot;
  title: string;
  description: string;
  productIds: string[];
};

function byGroup(items: SelectedItem[], group: string) {
  return items.filter((i) => i.food_group === group);
}

function pick<T>(arr: T[], index: number): T | undefined {
  return arr.length === 0 ? undefined : arr[index % arr.length];
}

const COOK_STYLES = ["a la plancha", "al horno", "guisado/a", "salteado/a"];

/**
 * Builds a 7-day plan from ONLY the items the budget allocator already
 * selected — the shopping list and the meal descriptions can never
 * disagree, because there is no separate ingredient source for either.
 */
export function buildWeekPlan(items: SelectedItem[]): PlannedMeal[] {
  const proteins = items.filter((i) => i.food_group.startsWith("protein_"));
  const carbs = byGroup(items, "carb");
  const dairy = byGroup(items, "dairy");
  const fruits = byGroup(items, "fruit");
  const vegetables = byGroup(items, "vegetable");

  const meals: PlannedMeal[] = [];

  for (let day = 1; day <= 7; day++) {
    const dayIndex = day - 1;

    // Desayuno: rotate between egg-based and dairy+carb+fruit style.
    const egg = proteins.find((p) => p.food_group === "protein_egg");
    if (egg && dayIndex % 2 === 0) {
      const carb = pick(carbs, dayIndex);
      const veg = pick(vegetables, dayIndex);
      meals.push({
        dayNumber: day,
        slot: "desayuno",
        title: "Huevos",
        description: [
          egg.name,
          veg ? `con ${veg.name.toLowerCase()} salteado` : "",
          carb ? `y ${carb.name.toLowerCase()}` : "",
        ]
          .filter(Boolean)
          .join(" "),
        productIds: [egg.productId, veg?.productId, carb?.productId].filter(Boolean) as string[],
      });
    } else {
      const carb = pick(carbs, dayIndex);
      const dairyItem = pick(dairy, dayIndex);
      const fruit = pick(fruits, dayIndex);
      meals.push({
        dayNumber: day,
        slot: "desayuno",
        title: "Desayuno",
        description: [carb?.name, dairyItem ? `con ${dairyItem.name.toLowerCase()}` : "", fruit ? `y ${fruit.name.toLowerCase()}` : ""]
          .filter(Boolean)
          .join(" ") || "Fruta y lácteo",
        productIds: [carb?.productId, dairyItem?.productId, fruit?.productId].filter(Boolean) as string[],
      });
    }

    // Merienda: fruit, or dairy if no fruit left.
    const merienda = pick(fruits, dayIndex) ?? pick(dairy, dayIndex);
    meals.push({
      dayNumber: day,
      slot: "merienda",
      title: "Merienda",
      description: merienda ? merienda.name : "Fruta de temporada",
      productIds: merienda ? [merienda.productId] : [],
    });

    // Almuerzo: main protein of the day + carb + vegetable.
    const lunchProtein = pick(proteins, dayIndex);
    const lunchCarb = pick(carbs, dayIndex + 1);
    const lunchVeg = pick(vegetables, dayIndex);
    const cookStyle = pick(COOK_STYLES, dayIndex);
    meals.push({
      dayNumber: day,
      slot: "almuerzo",
      title: "Almuerzo",
      description: [
        lunchProtein ? `${lunchProtein.name} ${cookStyle}` : "Plato principal",
        lunchCarb?.name,
        lunchVeg ? `y ensalada de ${lunchVeg.name.toLowerCase()}` : "",
      ]
        .filter(Boolean)
        .join(", "),
      productIds: [lunchProtein?.productId, lunchCarb?.productId, lunchVeg?.productId].filter(
        Boolean
      ) as string[],
    });

    // Cena: a different protein than lunch when there's more than one option.
    const dinnerProtein =
      proteins.length > 1 ? pick(proteins, dayIndex + 1) : lunchProtein;
    const dinnerVeg = pick(vegetables, dayIndex + 1);
    meals.push({
      dayNumber: day,
      slot: "cena",
      title: "Cena",
      description: [
        dinnerProtein ? dinnerProtein.name : "Plato ligero",
        dinnerVeg ? `con ensalada de ${dinnerVeg.name.toLowerCase()}` : "",
      ]
        .filter(Boolean)
        .join(" "),
      productIds: [dinnerProtein?.productId, dinnerVeg?.productId].filter(Boolean) as string[],
    });
  }

  return meals;
}
