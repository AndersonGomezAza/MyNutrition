import { createServiceClient } from "@/lib/supabase/server";
import { scrapeAllActiveStores } from "@/lib/scraper/run";

// External trigger (Vercel Cron) hitting the app, not a UI-initiated
// mutation — this is the one legitimate Route Handler in the app; every
// user-triggered mutation elsewhere uses Server Actions instead.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const results = await scrapeAllActiveStores(supabase);

  const anyFailed = results.some((r) => r.status === "failed");
  return Response.json({ results }, { status: anyFailed ? 207 : 200 });
}
