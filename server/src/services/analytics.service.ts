import { Product } from "../models/product.model.js";

export interface AnalyticsSummary {
  totalProducts: number;
  totalStockQuantity: number;
  lowStockProducts: number;
  inventoryValue: number;
  inventoryCost: number;
  potentialProfit: number;
}

export interface CategoryAnalytics extends AnalyticsSummary {
  category: string;
  averagePrice: number;
}

interface AnalyticsResult {
  summary: AnalyticsSummary;
  categories: CategoryAnalytics[];
}

const summaryProject = {
  _id: 0,
  totalProducts: 1,
  totalStockQuantity: 1,
  lowStockProducts: 1,
  inventoryValue: { $round: ["$inventoryValue", 2] },
  inventoryCost: { $round: ["$inventoryCost", 2] },
  potentialProfit: { $round: [{ $subtract: ["$inventoryValue", "$inventoryCost"] }, 2] },
};

const groupMetrics = {
  totalProducts: { $sum: 1 },
  totalStockQuantity: { $sum: "$stockQuantity" },
  lowStockProducts: { $sum: { $cond: [{ $lte: ["$stockQuantity", "$reorderLevel"] }, 1, 0] } },
  inventoryValue: { $sum: { $multiply: ["$price", "$stockQuantity"] } },
  inventoryCost: { $sum: { $multiply: ["$cost", "$stockQuantity"] } },
};

export async function calculateAnalytics(category?: string): Promise<AnalyticsResult> {
  const matchStage = category ? { category: category.toLowerCase() } : {};
  const emptySummary: AnalyticsSummary = {
    totalProducts: 0,
    totalStockQuantity: 0,
    lowStockProducts: 0,
    inventoryValue: 0,
    inventoryCost: 0,
    potentialProfit: 0,
  };

  const [result] = await Product.aggregate<AnalyticsResult>([
    { $match: matchStage },
    {
      $facet: {
        summary: [
          { $group: { _id: null, ...groupMetrics } },
          { $project: summaryProject },
        ],
        categories: [
          { $group: { _id: "$category", ...groupMetrics, averagePrice: { $avg: "$price" } } },
          {
            $project: {
              ...summaryProject,
              category: "$_id",
              averagePrice: { $round: ["$averagePrice", 2] },
            },
          },
          { $sort: { inventoryValue: -1 } },
        ],
      },
    },
    {
      $project: {
        summary: { $ifNull: [{ $arrayElemAt: ["$summary", 0] }, emptySummary] },
        categories: 1,
      },
    },
  ]).allowDiskUse(true).exec();

  return result ?? { summary: emptySummary, categories: [] };
}
