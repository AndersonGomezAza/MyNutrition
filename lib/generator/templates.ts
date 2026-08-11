import { extractIngredientLabel } from "./ingredientLabels";
import type { SelectedItem } from "./selectProducts";
import { parsePresentation, formatPortion } from "./units";

export type MealSlot = "desayuno" | "almuerzo" | "merienda" | "cena";

export type PlannedMeal = {
  dayNumber: number;
  slot: MealSlot;
  title: string;
  description: string;
  productIds: string[];
};

type Role = "main" | "sauteed" | "side" | "with" | "and" | "protein" | "salad";
type Usage = { item: SelectedItem; role: Role };
type MealDraft = {
  dayNumber: number;
  slot: MealSlot;
  title: string;
  usages: Usage[];
  cookStyle?: string;
};

function byGroup(items: SelectedItem[], group: string) {
  return items.filter((i) => i.food_group === group);
}

function pick<T>(arr: T[], index: number): T | undefined {
  return arr.length === 0 ? undefined : arr[index % arr.length];
}

const COOK_STYLES = ["a la plancha", "al horno", "guisado/a", "salteado/a"];

function usage(item: SelectedItem | undefined, role: Role): Usage[] {
  return item ? [{ item, role }] : [];
}

function findUsage(usages: Usage[], role: Role): Usage | undefined {
  return usages.find((u) => u.role === role);
}

/**
 * Builds the week's meal *structure* — which specific purchased item fills
 * each slot — using exactly the same rotation/fallback rules the old
 * text-building version used. Kept separate from text rendering because the
 * portion shown for a given item can only be computed once we know how many
 * times, across the *whole* week, that item gets used.
 */
function buildWeekDrafts(items: SelectedItem[]): MealDraft[] {
  const proteins = items.filter((i) => i.food_group.startsWith("protein_"));
  const carbs = byGroup(items, "carb");
  const dairy = byGroup(items, "dairy");
  const fruits = byGroup(items, "fruit");
  const vegetables = byGroup(items, "vegetable");

  const drafts: MealDraft[] = [];

  for (let day = 1; day <= 7; day++) {
    const dayIndex = day - 1;

    const egg = proteins.find((p) => p.food_group === "protein_egg");
    if (egg && dayIndex % 2 === 0) {
      const carb = pick(carbs, dayIndex);
      const veg = pick(vegetables, dayIndex);
      drafts.push({
        dayNumber: day,
        slot: "desayuno",
        title: "Huevos",
        usages: [...usage(egg, "main"), ...usage(veg, "sauteed"), ...usage(carb, "side")],
      });
    } else {
      const carb = pick(carbs, dayIndex);
      const dairyItem = pick(dairy, dayIndex);
      const fruit = pick(fruits, dayIndex);
      drafts.push({
        dayNumber: day,
        slot: "desayuno",
        title: "Desayuno",
        usages: [...usage(carb, "main"), ...usage(dairyItem, "with"), ...usage(fruit, "and")],
      });
    }

    const merienda = pick(fruits, dayIndex) ?? pick(dairy, dayIndex);
    drafts.push({
      dayNumber: day,
      slot: "merienda",
      title: "Merienda",
      usages: usage(merienda, "main"),
    });

    const lunchProtein = pick(proteins, dayIndex);
    const lunchCarb = pick(carbs, dayIndex + 1);
    const lunchVeg = pick(vegetables, dayIndex);
    drafts.push({
      dayNumber: day,
      slot: "almuerzo",
      title: "Almuerzo",
      cookStyle: pick(COOK_STYLES, dayIndex),
      usages: [
        ...usage(lunchProtein, "protein"),
        ...usage(lunchCarb, "side"),
        ...usage(lunchVeg, "salad"),
      ],
    });

    const dinnerProtein = proteins.length > 1 ? pick(proteins, dayIndex + 1) : lunchProtein;
    const dinnerVeg = pick(vegetables, dayIndex + 1);
    drafts.push({
      dayNumber: day,
      slot: "cena",
      title: "Cena",
      usages: [...usage(dinnerProtein, "protein"), ...usage(dinnerVeg, "salad")],
    });
  }

  return drafts;
}

/**
 * Builds a 7-day plan from ONLY the items the budget allocator already
 * selected — the shopping list and the meal descriptions can never disagree
 * about *which* products are used, because there is no separate ingredient
 * source for either.
 *
 * The *portion* shown per meal is derived the same way: for every product,
 * (package size x quantity bought) / (times it's used across the week) /
 * people gives the per-person amount for a single use — so if you follow
 * every printed portion exactly, across the whole week, for `people` people,
 * you use exactly what's in the shopping list, no more and no less (up to
 * the rounding formatPortion applies for a readable number). Ingredient
 * names (not brand names) come from the same keyword lists that classified
 * the product's food group, so nothing here can name a food that isn't a
 * "match" for that food group either.
 */
export function buildWeekPlan(items: SelectedItem[], people: number = 1): PlannedMeal[] {
  const safePeople = Math.max(1, people);
  const drafts = buildWeekDrafts(items);

  const usageCounts = new Map<string, number>();
  for (const d of drafts) {
    for (const u of d.usages) {
      usageCounts.set(u.item.productId, (usageCounts.get(u.item.productId) ?? 0) + 1);
    }
  }

  function portionText(item: SelectedItem): string {
    const label = extractIngredientLabel(item.name, item.food_group);
    const parsed = parsePresentation(item.presentation);
    if (!parsed) return label;
    const uses = usageCounts.get(item.productId) ?? 1;
    const perUsePerPerson = (parsed.value * item.qty) / uses / safePeople;
    return `${formatPortion(perUsePerPerson, parsed.unit)} de ${label}`;
  }

  return drafts.map((d) => {
    const productIds = d.usages.map((u) => u.item.productId);
    let description: string;

    if (d.slot === "almuerzo") {
      const proteinU = findUsage(d.usages, "protein");
      const sideU = findUsage(d.usages, "side");
      const saladU = findUsage(d.usages, "salad");
      description = [
        proteinU ? `${portionText(proteinU.item)} ${d.cookStyle}` : "Plato principal",
        sideU ? portionText(sideU.item) : "",
        saladU ? `y ensalada de ${portionText(saladU.item)}` : "",
      ]
        .filter(Boolean)
        .join(", ");
    } else if (d.slot === "cena") {
      const proteinU = findUsage(d.usages, "protein");
      const saladU = findUsage(d.usages, "salad");
      description = [
        proteinU ? portionText(proteinU.item) : "Plato ligero",
        saladU ? `con ensalada de ${portionText(saladU.item)}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    } else if (d.slot === "merienda") {
      const mainU = findUsage(d.usages, "main");
      description = mainU ? portionText(mainU.item) : "Fruta de temporada";
    } else if (d.title === "Huevos") {
      const mainU = findUsage(d.usages, "main");
      const sauteedU = findUsage(d.usages, "sauteed");
      const sideU = findUsage(d.usages, "side");
      description = [
        mainU ? portionText(mainU.item) : "",
        sauteedU ? `con ${portionText(sauteedU.item)} salteado` : "",
        sideU ? `y ${portionText(sideU.item)}` : "",
      ]
        .filter(Boolean)
        .join(" ");
    } else {
      const mainU = findUsage(d.usages, "main");
      const withU = findUsage(d.usages, "with");
      const andU = findUsage(d.usages, "and");
      description =
        [
          mainU ? portionText(mainU.item) : "",
          withU ? `con ${portionText(withU.item)}` : "",
          andU ? `y ${portionText(andU.item)}` : "",
        ]
          .filter(Boolean)
          .join(" ") || "Fruta y lácteo";
    }

    return { dayNumber: d.dayNumber, slot: d.slot, title: d.title, description, productIds };
  });
}
