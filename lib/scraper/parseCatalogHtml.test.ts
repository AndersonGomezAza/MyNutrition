import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isLastPage, parseCatalogPage } from "./parseCatalogHtml";

function fixture(name: string): string {
  return readFileSync(join(__dirname, "__fixtures__", name), "utf-8");
}

describe("parseCatalogPage", () => {
  it("parses 10 products from a full Ara page", () => {
    const products = parseCatalogPage(fixture("ara-page-1.html"));
    expect(products).toHaveLength(10);
    expect(products[0]).toMatchObject({
      externalId: expect.any(String),
      name: expect.stringContaining("Aceite de Girasol"),
      priceCop: 17000,
    });
  });

  it("parses a partial last page (Ara page 68, 7 products)", () => {
    const products = parseCatalogPage(fixture("ara-page-68-partial.html"));
    expect(products).toHaveLength(7);
    expect(products.every((p) => p.priceCop > 0)).toBe(true);
  });

  it("parses 10 products from a D1 page using the same parser", () => {
    const products = parseCatalogPage(fixture("d1-page-1.html"));
    expect(products).toHaveLength(10);
  });

  it("never produces a product with a missing/zero price", () => {
    const products = parseCatalogPage(fixture("ara-page-1.html"));
    for (const p of products) {
      expect(p.priceCop).toBeGreaterThan(0);
    }
  });
});

describe("isLastPage", () => {
  it("is false on a page full of products", () => {
    expect(isLastPage(fixture("ara-page-1.html"))).toBe(false);
  });

  it("detects the HTML-entity-encoded stop marker (&#225;s, not literal 'ás')", () => {
    expect(isLastPage(fixture("ara-page-last-marker.html"))).toBe(true);
  });
});
