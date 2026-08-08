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
  excludedTerms: string[]
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
  const meals = buildWeekPlan(items);

  return { feasible: true, items, meals, warnings: proteinResult.warnings, totalCost };
}
