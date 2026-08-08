import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type WeightLogRow = {
  id: string;
  logged_at: string;
  weight_kg: number;
  note: string | null;
};

export async function listWeightLogs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
): Promise<WeightLogRow[]> {
  const { data, error } = await supabase
    .from("weight_logs")
    .select("id, logged_at, weight_kg, note")
    .order("logged_at");
  if (error) throw error;
  return data ?? [];
}

/** One entry per day: writing the same date again overwrites it. */
export async function upsertWeightLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  loggedAt: string,
  weightKg: number,
  note: string | null
): Promise<void> {
  const { error } = await supabase
    .from("weight_logs")
    .upsert({ logged_at: loggedAt, weight_kg: weightKg, note }, { onConflict: "logged_at" });
  if (error) throw error;
}

export async function deleteWeightLog(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>,
  id: string
): Promise<void> {
  const { error } = await supabase.from("weight_logs").delete().eq("id", id);
  if (error) throw error;
}
