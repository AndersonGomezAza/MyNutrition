"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { listProducts } from "@/lib/db/products";
import { deleteBatch as deleteBatchDb } from "@/lib/db/plans";
import { generateMonthlyPlan, generatePlan, type GeneratedPlan } from "@/lib/generator/plan";
import { persistGeneratedBatch } from "@/lib/generator/persist";
import type { Candidate } from "@/lib/generator/selectProducts";
import type { FoodGroup } from "@/lib/scraper/categorize";

export type PlanActionState =
  | { status: "idle" }
  | { status: "infeasible"; warnings: string[]; minimumBudgetEstimate: number | null }
  | { status: "success"; batchId: string; totalCost: number; weekCount: number; warnings: string[] }
  | { status: "error"; message: string };

export async function generatePlanAction(
  _prev: PlanActionState,
  formData: FormData
): Promise<PlanActionState> {
  const storeId = String(formData.get("store_id") ?? "");
  const mode = String(formData.get("mode") ?? "semana") === "mes" ? "mes" : "semana";
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

    const results: GeneratedPlan[] =
      mode === "mes"
        ? generateMonthlyPlan(candidates, budgetCop, excludedTerms)
        : [generatePlan(candidates, budgetCop, excludedTerms)];

    const firstInfeasible = results.find((r) => !r.feasible) as
      | Extract<GeneratedPlan, { feasible: false }>
      | undefined;
    if (firstInfeasible) {
      return {
        status: "infeasible",
        warnings: firstInfeasible.warnings,
        minimumBudgetEstimate:
          firstInfeasible.minimumBudgetEstimate !== null
            ? firstInfeasible.minimumBudgetEstimate * results.length
            : null,
      };
    }

    const feasiblePlans = results as Extract<GeneratedPlan, { feasible: true }>[];
    const { batchId } = await persistGeneratedBatch(
      supabase,
      storeId,
      budgetCop,
      excludedTerms,
      feasiblePlans
    );
    revalidatePath("/checklist");
    revalidatePath("/plan");

    const totalCost = feasiblePlans.reduce((s, p) => s + p.totalCost, 0);
    const warnings = feasiblePlans.flatMap((p) => p.warnings);
    return { status: "success", batchId, totalCost, weekCount: feasiblePlans.length, warnings };
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : String(err) };
  }
}

export async function deleteBatchAction(batchId: string) {
  const supabase = createServiceClient();
  await deleteBatchDb(supabase, batchId);
  revalidatePath("/plan");
  revalidatePath("/checklist");
}
