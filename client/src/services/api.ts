import type { AnalyticsResponse, InventoryFilters, InventoryResponse, Product, ProductInput } from "../types/inventory";

export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

interface ApiEnvelope<T> {
  success: true;
  message?: string;
  data: T;
}

interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

function queryString<T extends object>(values: T): string {
  const parameters = new URLSearchParams();
  Object.entries(values as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== "") parameters.set(key, String(value));
  });
  return parameters.toString();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const payload = await response.json() as ApiEnvelope<T> | ApiErrorEnvelope;
  if (!response.ok || !payload.success) {
    const error = !payload.success ? payload.error : { message: "The API request failed." };
    throw new Error(error.message);
  }
  return payload.data;
}

export function getInventory(filters: InventoryFilters, signal?: AbortSignal): Promise<InventoryResponse> {
  return request<InventoryResponse>(`/inventory?${queryString(filters)}`, { signal });
}

export function getAnalytics(category = "", signal?: AbortSignal): Promise<AnalyticsResponse> {
  return request<AnalyticsResponse>(`/analytics?${queryString({ category })}`, { signal });
}

export async function getCategories(signal?: AbortSignal): Promise<string[]> {
  const result = await request<{ categories: string[] }>("/inventory/categories", { signal });
  return result.categories;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const result = await request<{ product: Product }>("/inventory", { method: "POST", body: JSON.stringify(input) });
  return result.product;
}

export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const result = await request<{ product: Product }>(`/inventory/${id}`, { method: "PUT", body: JSON.stringify(input) });
  return result.product;
}

export async function deleteProduct(id: string): Promise<void> {
  await request<{ deletedId: string }>(`/inventory/${id}`, { method: "DELETE" });
}

export function getExportUrl(filters: Pick<InventoryFilters, "search" | "category" | "sort">): string {
  return `${API_URL}/inventory/export?${queryString(filters)}`;
}
