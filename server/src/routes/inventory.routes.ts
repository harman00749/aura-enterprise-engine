import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  exportInventory,
  getInventoryCategories,
  getProduct,
  listInventory,
  updateProduct,
} from "../controllers/inventory.controller.js";
import { mutationRateLimiter } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import {
  createProductSchema,
  inventoryExportQuerySchema,
  inventoryQuerySchema,
  objectIdParamsSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";
import { asyncHandler } from "../utils/async-handler.js";

export const inventoryRouter = Router();

inventoryRouter.get("/", validate(inventoryQuerySchema, "query"), asyncHandler(listInventory));
inventoryRouter.get("/categories", asyncHandler(getInventoryCategories));
inventoryRouter.get("/export", validate(inventoryExportQuerySchema, "query"), asyncHandler(exportInventory));
inventoryRouter.get("/:id", validate(objectIdParamsSchema, "params"), asyncHandler(getProduct));
inventoryRouter.post("/", mutationRateLimiter, validate(createProductSchema), asyncHandler(createProduct));
inventoryRouter.put("/:id", mutationRateLimiter, validate(objectIdParamsSchema, "params"), validate(updateProductSchema), asyncHandler(updateProduct));
inventoryRouter.delete("/:id", mutationRateLimiter, validate(objectIdParamsSchema, "params"), asyncHandler(deleteProduct));
