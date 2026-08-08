import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoreRow = {
  id: string;
  slug: string;
  source_path: string;
  display_name: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function listActiveStores(supabase: SupabaseClient<any>): Promise<StoreRow[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("id, slug, source_path, display_name")
    .eq("active", true)
    .order("display_name");

  if (error) throw error;
  return data ?? [];
}
