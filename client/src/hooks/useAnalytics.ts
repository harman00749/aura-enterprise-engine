import { useCallback, useEffect, useState } from "react";
import { getAnalytics } from "../services/api";
import type { AnalyticsResponse } from "../types/inventory";

export function useAnalytics(category: string) {
  const [result, setResult] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getAnalytics(category, controller.signal)
      .then(setResult)
      .catch((caught: unknown) => {
        if (caught instanceof DOMException && caught.name === "AbortError") return;
        setError(caught instanceof Error ? caught.message : "Analytics could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [category, revision]);

  return { result, loading, error, refresh };
}
