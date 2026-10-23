import { Router } from "express";
import { getAnalytics } from "../controllers/analytics.controller.js";
import { validate } from "../middleware/validate.js";
import { analyticsQuerySchema } from "../schemas/product.schema.js";
import { asyncHandler } from "../utils/async-handler.js";

export const analyticsRouter = Router();
analyticsRouter.get("/", validate(analyticsQuerySchema, "query"), asyncHandler(getAnalytics));
