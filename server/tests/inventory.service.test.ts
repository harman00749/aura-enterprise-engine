import { describe, expect, it } from "vitest";
import { buildInventoryFilter, parseSort } from "../src/services/inventory.service.js";

describe("inventory query builder", () => {
  it("uses the SKU index for an exact Aura SKU", () => {
    expect(buildInventoryFilter("aur-0000123", "electronics")).toEqual({
      category: "electronics",
      sku: "AUR-0000123",
    });
  });

  it("uses the product-name text index for natural-language search", () => {
    expect(buildInventoryFilter("audio", undefined)).toEqual({ $text: { $search: "audio" } });
  });

  it("whitelists and translates descending sort", () => {
    expect(parseSort("-price")).toEqual({ price: -1, _id: 1 });
    expect(parseSort("productName")).toEqual({ productName: 1, _id: 1 });
  });
});
