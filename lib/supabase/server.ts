import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role client. Bypasses RLS entirely — every table is deny-by-default
 * for anon/authenticated, so this is the ONLY way the app talks to Supabase.
 * Never import this file (or the service role key) into a Client Component.
 */
export function createServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill in your project's values."
    );
  }

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
