import { z } from "zod";

const emptyToUndefined = (value: unknown) => value === "" ? undefined : value;

const productFields = {
  productName: z.string().trim().min(2, "Product name must contain at least 2 characters.").max(160),
  sku: z.string().trim().toUpperCase().min(3).max(48).regex(/^[A-Z0-9][A-Z0-9-]*$/, "SKU may contain letters, numbers, and hyphens only."),
  category: z.string().trim().toLowerCase().min(2).max(80),
  price: z.coerce.number().finite().nonnegative("Price cannot be negative.").max(10_000_000),
  cost: z.coerce.number().finite().nonnegative("Cost cannot be negative.").max(10_000_000),
  stockQuantity: z.coerce.number().int().nonnegative("Stock quantity cannot be negative.").max(10_000_000),
  reorderLevel: z.coerce.number().int().nonnegative("Reorder level cannot be negative.").max(10_000_000),
  lastUpdated: z.coerce.date().optional(),
};

function enforcePriceRule(value: { price: number; cost: number }, context: z.RefinementCtx): void {
  if (value.price < value.cost) {
    context.addIssue({
      code: "custom",
      path: ["price"],
      message: "Price cannot be lower than cost.",
    });
  }
}

export const createProductSchema = z.object(productFields).strict().superRefine(enforcePriceRule);

export const updateProductSchema = z.object(productFields)
  .partial()
  .strict()
  .refine((value) => Object.keys(value).length > 0, "At least one product field must be provided.")
  .superRefine((value, context) => {
    if (value.price !== undefined && value.cost !== undefined) enforcePriceRule(value as { price: number; cost: number }, context);
  });

export const inventoryQuerySchema = z.object({
  page: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100_000).default(1)),
  limit: z.preprocess(emptyToUndefined, z.coerce.number().int().min(1).max(100).default(50)),
  search: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(100).optional()),
  category: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(80).optional()),
  sort: z.preprocess(
    emptyToUndefined,
    z.string().regex(/^-?(price|cost|stockQuantity|reorderLevel|lastUpdated|productName|category|sku)$/).default("productName"),
  ),
}).strict();

export const inventoryExportQuerySchema = inventoryQuerySchema.omit({ page: true, limit: true });

export const analyticsQuerySchema = z.object({
  category: z.preprocess(emptyToUndefined, z.string().trim().min(1).max(80).optional()),
}).strict();

export const objectIdParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "A valid product identifier is required."),
});

export type ProductInput = z.infer<typeof createProductSchema>;
export type ProductUpdateInput = z.infer<typeof updateProductSchema>;
export type InventoryQuery = z.infer<typeof inventoryQuerySchema>;
export type InventoryExportQuery = z.infer<typeof inventoryExportQuerySchema>;
export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
