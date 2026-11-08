"use client";

import { useCallback, useState } from "react";
import type { DepositIntent } from "@/lib/intents/types";

export interface CreateIntentInput {
  user: string;
  fromChain: string;
  fromAsset: string;
  amount: string;
  toAsset: string;
  recipient: string;
}

export function useDeposit() {
  const [intent, setIntent] = useState<DepositIntent | null>(null);
  const [preview, setPreview] = useState<DepositIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getQuotePreview = useCallback(async (input: CreateIntentInput) => {
    setPreviewLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deposit/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...input, dry: true }),
      });
      const payload = (await res.json()) as DepositIntent & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || `Preview failed (${res.status})`);
      }
      setPreview(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setPreview(null);
      return null;
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const createIntent = useCallback(async (input: CreateIntentInput) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deposit/intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...input, dry: false }),
      });
      const payload = (await res.json()) as DepositIntent & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || `Intent failed (${res.status})`);
      }
      setIntent(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const submitIntent = useCallback(async (intentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/deposit/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ intentId }),
      });
      const payload = (await res.json()) as DepositIntent & { error?: string };
      if (!res.ok) {
        throw new Error(payload.error || `Status check failed (${res.status})`);
      }
      setIntent(payload);
      return payload;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIntent(null);
    setPreview(null);
    setError(null);
  }, []);

  return {
    intent,
    preview,
    loading,
    previewLoading,
    error,
    getQuotePreview,
    createIntent,
    submitIntent,
    reset,
  };
}
