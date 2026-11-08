"use client";

import { useCallback, useEffect, useState } from "react";
import type { AggregatedAPY } from "@/lib/protocols/types";

export function useYield(asset: string) {
  const [data, setData] = useState<AggregatedAPY | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/apy?asset=${encodeURIComponent(asset)}`, {
        cache: "no-store",
      });
      const payload = (await res.json()) as AggregatedAPY & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || `APY request failed (${res.status})`);
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [asset]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
