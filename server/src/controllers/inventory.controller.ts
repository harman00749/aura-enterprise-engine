import type { Request, Response } from "express";
import { Product } from "../models/product.model.js";
import {
  createProductSchema,
  type InventoryExportQuery,
  type InventoryQuery,
  type ProductInput,
  type ProductUpdateInput,
} from "../schemas/product.schema.js";
import { createInventoryExportCursor, findInventory } from "../services/inventory.service.js";
import { AppError } from "../utils/app-error.js";
import { escapeCsv } from "../utils/csv.js";
import { sendSuccess } from "../utils/responses.js";

export async function listInventory(request: Request, response: Response): Promise<void> {
  const startedAt = performance.now();
  const result = await findInventory(response.locals.validated.query as InventoryQuery);
  sendSuccess(response, 200, {
    records: result.records,
    pagination: result.pagination,
    queryTimeMs: Math.round((performance.now() - startedAt) * 100) / 100,
  });
}

export async function getInventoryCategories(_request: Request, response: Response): Promise<void> {
  const categories = await Product.distinct("category").exec();
  sendSuccess(response, 200, { categories: categories.sort() });
}

export async function getProduct(request: Request, response: Response): Promise<void> {
  const product = await Product.findById(request.params.id).lean().exec();
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
  sendSuccess(response, 200, { product: { ...product, id: String(product._id), _id: undefined } });
}

export async function createProduct(request: Request, response: Response): Promise<void> {
  const input = request.body as ProductInput;
  const product = await Product.create({ ...input, lastUpdated: input.lastUpdated ?? new Date() });
  sendSuccess(response, 201, { product: product.toJSON() }, "Product created successfully.");
}

export async function updateProduct(request: Request, response: Response): Promise<void> {
  const existing = await Product.findById(request.params.id).lean().exec();
  if (!existing) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");

  const updates = request.body as ProductUpdateInput;
  const merged = createProductSchema.safeParse({
    productName: updates.productName ?? existing.productName,
    sku: updates.sku ?? existing.sku,
    category: updates.category ?? existing.category,
    price: updates.price ?? existing.price,
    cost: updates.cost ?? existing.cost,
    stockQuantity: updates.stockQuantity ?? existing.stockQuantity,
    reorderLevel: updates.reorderLevel ?? existing.reorderLevel,
    lastUpdated: new Date(),
  });

  if (!merged.success) {
    throw new AppError(400, "BUSINESS_RULE_VIOLATION", "Product update violates inventory rules.", merged.error.flatten());
  }

  const product = await Product.findByIdAndUpdate(request.params.id, merged.data, { new: true, runValidators: true }).exec();
  sendSuccess(response, 200, { product: product?.toJSON() }, "Product updated successfully.");
}

export async function deleteProduct(request: Request, response: Response): Promise<void> {
  const product = await Product.findByIdAndDelete(request.params.id).exec();
  if (!product) throw new AppError(404, "PRODUCT_NOT_FOUND", "Product was not found.");
  sendSuccess(response, 200, { deletedProductId: request.params.id }, "Product deleted successfully.");
}

export async function exportInventory(request: Request, response: Response): Promise<void> {
  const query = response.locals.validated.query as InventoryExportQuery;
  const cursor = createInventoryExportCursor(query);
  const fileName = `aura-inventory-${new Date().toISOString().slice(0, 10)}.csv`;

  response.status(200);
  response.setHeader("Content-Type", "text/csv; charset=utf-8");
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  response.write("Product Name,SKU,Category,Price,Cost,Stock Quantity,Reorder Level,Last Updated\r\n");

  for await (const product of cursor) {
    const row = [
      product.productName,
      product.sku,
      product.category,
      product.price,
      product.cost,
      product.stockQuantity,
      product.reorderLevel,
      product.lastUpdated,
    ].map(escapeCsv).join(",");
    if (!response.write(`${row}\r\n`)) await new Promise<void>((resolve) => response.once("drain", resolve));
  }

  response.end();
}
