const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * A plain UA header was enough for isolated manual testing (no JS
 * rendering, no auth needed), but scraping ~70 pages back-to-back with no
 * delay between requests got a 429 from losprecios.co once the DB side got
 * fast enough to stop naturally throttling us — see PAGE_DELAY_MS in
 * run.ts. Treat 429 as a "slow down and try again" signal (longer backoff,
 * more attempts) rather than the same transient-network-blip retry used
 * for everything else.
 */
export async function fetchCatalogPage(
  sourcePath: string,
  page: number,
  attempts = 5
): Promise<string> {
  const url = `https://losprecios.co/${sourcePath}?p=${page}`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          "Accept-Language": "es-CO,es;q=0.9",
        },
        cache: "no-store",
      });

      if (res.status === 429) {
        const retryAfterHeader = res.headers.get("retry-after");
        const retryAfterMs = retryAfterHeader
          ? Number(retryAfterHeader) * 1000
          : 2000 * attempt;
        throw Object.assign(new Error(`HTTP 429 fetching ${url}`), {
          retryAfterMs,
        });
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        const backoff =
          err && typeof err === "object" && "retryAfterMs" in err
            ? (err as { retryAfterMs: number }).retryAfterMs
            : 500 * attempt;
        await sleep(backoff);
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${url}`);
}
