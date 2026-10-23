import { useCallback, useEffect, useState } from "react";
import { getInventory } from "../services/api";
import type { InventoryFilters, InventoryResponse } from "../types/inventory";

export function useInventory(filters: InventoryFilters) {
  const [result, setResult] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getInventory(filters, controller.signal)
      .then(setResult)
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Inventory could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [filters, revision]);

  return { result, loading, error, refresh };
}
