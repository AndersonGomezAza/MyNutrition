"use server";

import { revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";
import { deleteWeightLog, upsertWeightLog } from "@/lib/db/weightLogs";

export async function logWeight(formData: FormData) {
  const loggedAt = String(formData.get("logged_at") ?? "");
  const weightKg = Number(formData.get("weight_kg"));
  const note = String(formData.get("note") ?? "").trim() || null;

  if (!loggedAt || !Number.isFinite(weightKg) || weightKg <= 0) {
    throw new Error("Fecha o peso inválido");
  }

  const supabase = createServiceClient();
  await upsertWeightLog(supabase, loggedAt, weightKg, note);
  revalidatePath("/progress");
}

export async function removeWeightLog(id: string) {
  const supabase = createServiceClient();
  await deleteWeightLog(supabase, id);
  revalidatePath("/progress");
}
