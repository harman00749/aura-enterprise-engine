export interface Product {
  id: string;
  productName: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stockQuantity: number;
  reorderLevel: number;
  lastUpdated: string;
}

export type ProductInput = Omit<Product, "id" | "lastUpdated">;

export interface Pagination {
  totalRecords: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface InventoryResponse {
  records: Product[];
  pagination: Pagination;
  queryTimeMs: number;
}

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

export interface AnalyticsResponse {
  summary: AnalyticsSummary;
  categories: CategoryAnalytics[];
  queryTimeMs: number;
}

export interface InventoryFilters {
  page: number;
  limit: number;
  search: string;
  category: string;
  sort: string;
}
