import type { QueryFilter, SortOrder } from "mongoose";
import { Product, type ProductRecord } from "../models/product.model.js";
import type { InventoryExportQuery, InventoryQuery } from "../schemas/product.schema.js";

export type InventoryFilter = QueryFilter<ProductRecord>;

export function buildInventoryFilter(search?: string, category?: string): InventoryFilter {
  const filter: InventoryFilter = {};
  if (category) filter.category = category.toLowerCase();

  if (search) {
    const normalized = search.trim();
    if (/^AUR-\d+$/i.test(normalized)) {
      filter.sku = normalized.toUpperCase();
    } else {
      filter.$text = { $search: normalized };
    }
  }

  return filter;
}

export function parseSort(sort: string): Record<string, SortOrder> {
  const descending = sort.startsWith("-");
  const field = descending ? sort.slice(1) : sort;
  return { [field]: descending ? -1 : 1, _id: 1 };
}

export async function findInventory(query: InventoryQuery) {
  const filter = buildInventoryFilter(query.search, query.category);
  const sort = parseSort(query.sort);
  const skip = (query.page - 1) * query.limit;

  const [records, totalRecords] = await Promise.all([
    Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(query.limit)
      .select("productName sku category price cost stockQuantity reorderLevel lastUpdated")
      .lean()
      .exec(),
    Product.countDocuments(filter).exec(),
  ]);

  const totalPages = totalRecords === 0 ? 0 : Math.ceil(totalRecords / query.limit);
  return {
    records: records.map((record) => ({ ...record, id: String(record._id), _id: undefined })),
    pagination: {
      totalRecords,
      totalPages,
      currentPage: query.page,
      pageSize: query.limit,
      hasNextPage: query.page < totalPages,
      hasPreviousPage: query.page > 1,
    },
  };
}

export function createInventoryExportCursor(query: InventoryExportQuery) {
  const filter = buildInventoryFilter(query.search, query.category);
  return Product.find(filter)
    .sort(parseSort(query.sort))
    .select("productName sku category price cost stockQuantity reorderLevel lastUpdated")
    .lean()
    .cursor();
}
