import { BUDGET_SHARES, SIMPLE_FOOD_GROUPS } from "./config";
import {
  buildCandidatePool,
  cheapestOverall,
  groupByFoodGroup,
  selectAllSimpleGroups,
  selectProteins,
  type Candidate,
  type SelectedItem,
} from "./selectProducts";
import { buildWeekPlan, type PlannedMeal } from "./templates";

// Pure — no I/O, no `server-only` — so it can be unit-tested directly.
// Persistence lives in persist.ts.

export type GeneratedPlan =
  | {
      feasible: true;
      items: SelectedItem[];
      meals: PlannedMeal[];
      warnings: string[];
      totalCost: number;
    }
  | { feasible: false; warnings: string[]; minimumBudgetEstimate: number | null };

function estimateMinimumBudget(byFoodGroup: Map<string, Candidate[]>): number | null {
  const proteinPool = [...byFoodGroup.entries()]
    .filter(([g]) => g.startsWith("protein_"))
    .flatMap(([, list]) => list);
  const proteinMin = cheapestOverall(proteinPool);
  if (proteinMin === null) return null;

  const otherMins = SIMPLE_FOOD_GROUPS.map((g) => cheapestOverall(byFoodGroup.get(g) ?? []) ?? 0);
  return proteinMin + otherMins.reduce((s, v) => s + v, 0);
}

export function generatePlan(
  products: Candidate[],
  budgetCop: number,
  excludedTerms: string[],
  people: number = 1
): GeneratedPlan {
  const pool = buildCandidatePool(products, excludedTerms);
  const byFoodGroup = groupByFoodGroup(pool);

  const proteinBudget = budgetCop * BUDGET_SHARES.protein;
  const proteinResult = selectProteins(byFoodGroup, proteinBudget);

  if (!proteinResult.feasible) {
    return {
      feasible: false,
      warnings: proteinResult.warnings,
      minimumBudgetEstimate: estimateMinimumBudget(byFoodGroup),
    };
  }

  const simpleItems = selectAllSimpleGroups(byFoodGroup, budgetCop);
  const items = [...proteinResult.items, ...simpleItems];
  const totalCost = items.reduce((sum, i) => sum + i.price_cop * i.qty, 0);
  const meals = buildWeekPlan(items, people);

  return { feasible: true, items, meals, warnings: proteinResult.warnings, totalCost };
}

/**
 * Splits a monthly budget evenly across 4 independent weekly generations.
 * Each call to generatePlan already randomizes the specific protein pick
 * (within budget) and shuffles which cheaper-half item wins in the other
 * food groups, so four calls in a row read as four different weeks rather
 * than the same shopping list repeated — no separate "week theme" rotation
 * needed on top of that.
 */
export function generateMonthlyPlan(
  products: Candidate[],
  monthlyBudgetCop: number,
  excludedTerms: string[],
  people: number = 1
): GeneratedPlan[] {
  const perWeekBudget = Math.floor(monthlyBudgetCop / 4);
  return Array.from({ length: 4 }, () => generatePlan(products, perWeekBudget, excludedTerms, people));
}
