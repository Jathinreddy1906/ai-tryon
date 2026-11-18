import { describe, expect, it } from "vitest";
import { catalogProducts, filterCatalog } from "./catalog";

describe("filterCatalog", () => {
  it("matches search terms without case sensitivity", () => {
    const results = filterCatalog(catalogProducts, { query: "COTTON" });

    expect(results.map((product) => product.slug)).toEqual(["everyday-cotton-shirt"]);
  });

  it("applies category, color, and price filters together", () => {
    const results = filterCatalog(catalogProducts, {
      category: "shirts",
      color: "Sage",
      maxPrice: 120,
    });

    expect(results.map((product) => product.slug)).toEqual(["everyday-utility-shirt"]);
  });

  it("searches catalogue tags and applies the maximum price in dollars", () => {
    const results = filterCatalog(catalogProducts, {
      query: "layering",
      maxPrice: 175,
    });

    expect(results.map((product) => product.slug)).toEqual([
      "soft-structure-knit",
      "weekend-denim-jacket",
      "everyday-utility-shirt",
    ]);
  });

  it("sorts the filtered results by price", () => {
    const results = filterCatalog(catalogProducts, { sort: "price-low" });

    expect(results[0].priceCents).toBeLessThan(results[1].priceCents);
  });

  it("keeps price comparisons within the selected currency", () => {
    const euroProduct = {
      ...catalogProducts[0],
      slug: "sample-euro-piece",
      priceCents: 9000,
      currencyCode: "EUR",
    };
    const results = filterCatalog([...catalogProducts, euroProduct], {
      currencyCode: "EUR",
      maxPrice: 100,
    });

    expect(results.map((product) => product.slug)).toEqual(["sample-euro-piece"]);
  });
});
