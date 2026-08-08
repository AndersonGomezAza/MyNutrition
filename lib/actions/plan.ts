"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/db/products";
import { generatePlan } from "@/lib/generator/plan";
import { persistGeneratedPlan } from "@/lib/generator/persist";
import type { Candidate } from "@/lib/generator/selectProducts";
import type { FoodGroup } from "@/lib/scraper/categorize";

export type PlanActionState =
  | { status: "idle" }
  | { status: "infeasible"; warnings: string[]; minimumBudgetEstimate: number | null }
  | { status: "success"; listId: string; totalCost: number; warnings: string[] }
  | { status: "error"; message: string };

export async function generatePlanAction(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const storeId = String(formData.get("store_id") ?? "");
  const budgetCop = Number(formData.get("budget_cop"));
  const excludedRaw = String(formData.get("excluded") ?? "");
  const excludedTerms = excludedRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!storeId || !Number.isFinite(budgetCop) || budgetCop <= 0) {
    return { status: "error", message: "Elige una tienda y un presupuesto válido." };
  }

  try {
    const supabase = createServiceClient();
    const products = await listProducts(supabase, storeId);
    const candidates: Candidate[] = products.map((p) => ({
      id: p.id,
      name: p.name,
      price_cop: p.price_cop,
      category: p.category,
      food_group: p.food_group as FoodGroup,
    }));

    const result = generatePlan(candidates, budgetCop, excludedTerms);

    if (!result.feasible) {
      return {
        status: "infeasible",
        warnings: result.warnings,
        minimumBudgetEstimate: result.minimumBudgetEstimate,
      };
    }

    const listId = await persistGeneratedPlan(supabase, storeId, budgetCop, excludedTerms, result);
    revalidatePath("/checklist");
    revalidatePath("/plan");
    return { status: "success", listId, totalCost: result.totalCost, warnings: result.warnings };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
