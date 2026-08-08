/**
 * Parses losprecios.co catalog pages (confirmed identical template across
 * stores: ara_t2, d1_t1). Pure functions, no I/O — keep them that way so
 * they stay trivially unit-testable against saved fixture HTML.
 */

export type ScrapedProduct = {
  externalId: string;
  name: string;
  brand: string | null;
  presentation: string | null;
  priceCop: number;
};

const PRODUCT_BLOCK_SPLIT = 'class="bq-cn-r"';

// The product-name link class and the presentation <span> class below look
// like site-generated tokens, not stable semantic names. If losprecios.co
// regenerates them, this regex silently matches nothing — that's exactly
// why parseCatalogPage returning [] is treated as an anomaly in run.ts
// rather than "this page just has no products".
const NAME_RE = /data-krv="([^"]+)"[^>]*>([^<]+)</;
const BRAND_RE = /<a href="\/[^"]+_m">([^<]+)<\/a>/;
const PRESENTATION_RE = /class="no-lín">([^<]*)<\/span>/;
const PRICE_RE = /class="t-ed-pr"[^>]*>([^<]+)<\/span>/;

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .trim();
}

export function isLastPage(html: string): boolean {
  return decodeEntities(html).includes("No se encontraron más productos");
}

export function parseCatalogPage(html: string): ScrapedProduct[] {
  const blocks = html.split(PRODUCT_BLOCK_SPLIT).slice(1);
  const products: ScrapedProduct[] = [];

  for (const block of blocks) {
    const nameMatch = block.match(NAME_RE);
    const priceMatch = block.match(PRICE_RE);
    if (!nameMatch || !priceMatch) continue; // malformed block, skip rather than throw

    const externalId = nameMatch[1];
    const baseName = decodeEntities(nameMatch[2]);
    const brandMatch = block.match(BRAND_RE);
    const presentationMatch = block.match(PRESENTATION_RE);
    const brand = brandMatch ? decodeEntities(brandMatch[1]) : null;
    const presentation = presentationMatch
      ? decodeEntities(presentationMatch[1]) || null
      : null;

    const priceDigits = priceMatch[1].replace(/[^\d]/g, "");
    if (!priceDigits) continue;

    const name = [baseName, brand, presentation]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    products.push({
      externalId,
      name,
      brand,
      presentation,
      priceCop: Number(priceDigits),
    });
  }

  return products;
}
