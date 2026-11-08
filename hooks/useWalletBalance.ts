"use client";

import { useState, useEffect, useCallback } from "react";

export interface WalletBalance {
  sol: number;
  usdc: number;
  usdt: number;
  jlUsdc: number;
  luloProtected?: number;
  luloRegular?: number;
}

export function useWalletBalance(address?: string) {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wallet/balance?address=${encodeURIComponent(address)}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch balance: ${res.statusText}`);
      }
      const data = (await res.json()) as WalletBalance;
      setBalance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load balance");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    void fetchBalance();
    // Auto refresh balances every 20 seconds
    const interval = setInterval(() => {
      void fetchBalance();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refetch: fetchBalance,
  };
}

