/**
 * Placeholder until the real schema is linked. Once `supabase link` has run,
 * regenerate this file with:
 *
 *   npx supabase gen types typescript --linked > lib/supabase/types.ts
 *
 * Everything below is loosely typed on purpose so the app compiles before
 * that step — replace this whole file, don't hand-edit it afterwards.
 */
export type Database = {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
  };
};
