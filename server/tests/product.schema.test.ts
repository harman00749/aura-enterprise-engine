import { describe, expect, it } from "vitest";
import { createProductSchema, inventoryQuerySchema } from "../src/schemas/product.schema.js";

const validProduct = {
  productName: "Enterprise Laptop Dock",
  sku: "AUR-0000001",
  category: "electronics",
  price: 249.99,
  cost: 140,
  stockQuantity: 120,
  reorderLevel: 25,
};

describe("product validation", () => {
  it("accepts a valid product", () => {
    expect(createProductSchema.safeParse(validProduct).success).toBe(true);
  });

  it("rejects price below cost with the business message", () => {
    const result = createProductSchema.safeParse({ ...validProduct, price: 50, cost: 100 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message === "Price cannot be lower than cost.")).toBe(true);
  });

  it("rejects negative stock quantity", () => {
    const result = createProductSchema.safeParse({ ...validProduct, stockQuantity: -1 });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.some((issue) => issue.message === "Stock quantity cannot be negative.")).toBe(true);
  });
});

describe("inventory query validation", () => {
  it("applies safe pagination defaults", () => {
    expect(inventoryQuerySchema.parse({})).toEqual({ page: 1, limit: 50, sort: "productName" });
  });

  it("rejects a limit above 100", () => {
    expect(inventoryQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
  });

  it("normalizes category and numeric query strings", () => {
    expect(inventoryQuerySchema.parse({ page: "2", limit: "5", category: "Electronics", sort: "-price" }))
      .toEqual({ page: 2, limit: 5, category: "Electronics", sort: "-price" });
  });
});
