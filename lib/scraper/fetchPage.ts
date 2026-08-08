const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Plain UA header is enough — confirmed against losprecios.co manually
 * (no JS rendering, no auth, no rate limiting observed over ~70 sequential
 * requests). Retries handle transient network blips, not bot-detection.
 */
export async function fetchCatalogPage(
  sourcePath: string,
  page: number,
  attempts = 3
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
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} fetching ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      if (attempt < attempts) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to fetch ${url}`);
}
