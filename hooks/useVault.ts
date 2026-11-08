"use client";

import { useState, useEffect, useCallback } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";
import { useConnectedWallets } from "./useConnectedWallets";

export interface VaultAccountData {
  exists: boolean;
  pda: string;
  programId: string;
  asset: string;
  owner: string;
  totalDepositedRaw?: string;
  totalDeposited?: number;
  totalWithdrawnRaw?: string;
  totalWithdrawn?: number;
  depositCount?: number;
  withdrawCount?: number;
  savingsGoalRaw?: string;
  savingsGoal?: number;
  firstDepositTime?: number;
  lastDepositTime?: number;
}

export function useVault(asset: string = "USDC") {
  const { primaryWallet } = useConnectedWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [account, setAccount] = useState<VaultAccountData | null>(null);
  const [loading, setLoading] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    if (!primaryWallet?.address) {
      setAccount(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/vault/account?signer=${encodeURIComponent(primaryWallet.address)}&asset=${encodeURIComponent(asset)}`
      );
      if (!res.ok) {
        throw new Error(`Failed to query vault account: ${res.statusText}`);
      }
      const data = (await res.json()) as VaultAccountData;
      setAccount(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load vault state");
    } finally {
      setLoading(false);
    }
  }, [primaryWallet?.address, asset]);

  useEffect(() => {
    void fetchAccount();
  }, [fetchAccount]);

  const depositToVault = async (amountInTokens: number, savingsGoalTokens?: number) => {
    if (!primaryWallet?.address) {
      throw new Error("No connected Solana wallet. Please sign in or connect.");
    }

    setDepositing(true);
    setError(null);
    setTxSignature(null);

    try {
      // Token base units (e.g. 6 decimals for USDC/USDT)
      const baseUnits = BigInt(Math.round(amountInTokens * 1e6)).toString();
      const goalBaseUnits = savingsGoalTokens
        ? BigInt(Math.round(savingsGoalTokens * 1e6)).toString()
        : undefined;

      const res = await fetch("/api/vault/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          signer: primaryWallet.address,
          asset,
          amount: baseUnits,
          savingsGoal: goalBaseUnits,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Vault deposit failed: ${res.statusText}`);
      }

      const { transaction: txBase64 } = (await res.json()) as { transaction: string };
      const txBytes = Uint8Array.from(Buffer.from(txBase64, "base64"));

      // Prompt user to sign and submit via Privy standard wallet
      const sendRes = await signAndSendTransaction({
        transaction: txBytes,
        wallet: primaryWallet as any,
      });

      const signature = getBase58Decoder().decode(sendRes.signature);

      setTxSignature(signature);

      // Refresh on-chain account state after a brief delay for block commitment
      setTimeout(() => {
        void fetchAccount();
      }, 2500);

      return signature;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Deposit failed";
      setError(msg);
      throw err;
    } finally {
      setDepositing(false);
    }
  };

  const withdrawFromVault = async (amountInTokens: number) => {
    if (!primaryWallet?.address) {
      throw new Error("No connected Solana wallet. Please sign in or connect.");
    }

    setWithdrawing(true);
    setError(null);
    setTxSignature(null);

    try {
      const baseUnits = BigInt(Math.round(amountInTokens * 1e6)).toString();

      const res = await fetch("/api/vault/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          signer: primaryWallet.address,
          asset,
          amount: baseUnits,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Vault withdrawal failed: ${res.statusText}`);
      }

      const { transaction: txBase64 } = (await res.json()) as { transaction: string };
      const txBytes = Uint8Array.from(Buffer.from(txBase64, "base64"));

      const sendRes = await signAndSendTransaction({
        transaction: txBytes,
        wallet: primaryWallet as any,
      });

      const signature = getBase58Decoder().decode(sendRes.signature);
      setTxSignature(signature);

      setTimeout(() => {
        void fetchAccount();
      }, 2500);

      return signature;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Withdrawal failed";
      setError(msg);
      throw err;
    } finally {
      setWithdrawing(false);
    }
  };

  return {
    account,
    loading,
    depositing,
    withdrawing,
    error,
    txSignature,
    refetch: fetchAccount,
    depositToVault,
    withdrawFromVault,
  };
}
