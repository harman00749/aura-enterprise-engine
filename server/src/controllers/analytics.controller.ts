import type { Request, Response } from "express";
import type { AnalyticsQuery } from "../schemas/product.schema.js";
import { calculateAnalytics } from "../services/analytics.service.js";
import { sendSuccess } from "../utils/responses.js";

export async function getAnalytics(request: Request, response: Response): Promise<void> {
  const startedAt = performance.now();
  const { category } = response.locals.validated.query as AnalyticsQuery;
  const analytics = await calculateAnalytics(category);
  sendSuccess(response, 200, {
    ...analytics,
    queryTimeMs: Math.round((performance.now() - startedAt) * 100) / 100,
  });
}
