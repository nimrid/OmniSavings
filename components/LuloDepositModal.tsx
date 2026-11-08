"use client";

import { useState, useEffect, useCallback } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";
import {
  ShieldCheck,
  Zap,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Wallet,
} from "lucide-react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { formatPct, shortenAddress } from "@/lib/utils/format";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

interface LuloAccountData {
  totalUsdValue: number;
  lusdUsdBalance: number;
  pusdUsdBalance: number;
  maxWithdrawable: {
    protected: Record<string, number>;
    regular: Record<string, number>;
  };
  totalInterestEarned: number;
  protectedInterestEarned: number;
  regularInterestEarned: number;
}

export interface LuloDepositModalProps {
  open: boolean;
  onClose: () => void;
  asset?: string;
  mode: "regular" | "protected";
  initialTab?: "deposit" | "withdraw";
  apy?: number;
}

export function LuloDepositModal({
  open,
  onClose,
  asset = "USDC",
  mode,
  initialTab = "deposit",
  apy,
}: LuloDepositModalProps) {
  const { primaryWallet } = useConnectedWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [activeTab, setActiveTab] = useState<"deposit" | "withdraw">(initialTab);
  const [amount, setAmount] = useState("10");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Lulo Account state
  const [luloAccount, setLuloAccount] = useState<LuloAccountData | null>(null);
  const [loadingAccount, setLoadingAccount] = useState(false);

  const isProtected = mode === "protected";
  const marketName = isProtected ? "Lulo Protected" : "Lulo Regular";

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setError(null);
      setTxSignature(null);
      setAmount("10");
    }
  }, [open, initialTab, mode]);

  const fetchLuloAccount = useCallback(async () => {
    if (!primaryWallet?.address) return;
    setLoadingAccount(true);
    try {
      const res = await fetch(`/api/lulo/account?owner=${primaryWallet.address}`);
      if (res.ok) {
        const data = (await res.json()) as LuloAccountData;
        setLuloAccount(data);
      }
    } catch {
      // ignore
    } finally {
      setLoadingAccount(false);
    }
  }, [primaryWallet?.address]);

  useEffect(() => {
    if (open && primaryWallet?.address) {
      void fetchLuloAccount();
    }
  }, [open, primaryWallet?.address, fetchLuloAccount]);

  if (!open) return null;

  const currentBalance = isProtected
    ? luloAccount?.pusdUsdBalance ?? 0
    : luloAccount?.lusdUsdBalance ?? 0;

  const maxWithdrawable = isProtected
    ? luloAccount?.maxWithdrawable?.protected?.[USDC_MINT] ?? currentBalance
    : luloAccount?.maxWithdrawable?.regular?.[USDC_MINT] ?? currentBalance;

  const accruedInterest = isProtected
    ? luloAccount?.protectedInterestEarned ?? 0
    : luloAccount?.regularInterestEarned ?? 0;

  const handleDeposit = async () => {
    if (!primaryWallet?.address) {
      setError("Please connect a Solana wallet first.");
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive deposit amount.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const res = await fetch("/api/lulo/deposit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: primaryWallet.address,
          asset,
          amount: numAmount,
          mode,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Deposit failed: ${res.statusText}`);
      }

      const { transaction: txBase64 } = (await res.json()) as { transaction: string };
      const txBytes = Uint8Array.from(Buffer.from(txBase64, "base64"));

      // Sign and submit V0 transaction via Privy
      const sendRes = await signAndSendTransaction({
        transaction: txBytes,
        wallet: primaryWallet as any,
      });

      const signature = getBase58Decoder().decode(sendRes.signature);
      setTxSignature(signature);
      void fetchLuloAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute deposit.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!primaryWallet?.address) {
      setError("Please connect a Solana wallet first.");
      return;
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive withdrawal amount.");
      return;
    }

    if (maxWithdrawable > 0 && numAmount > maxWithdrawable) {
      setError(
        `Cannot withdraw more than your available balance (${maxWithdrawable.toFixed(2)} ${asset}).`
      );
      return;
    }

    setSubmitting(true);
    setError(null);
    setTxSignature(null);

    try {
      const res = await fetch("/api/lulo/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          owner: primaryWallet.address,
          asset,
          amount: numAmount,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Withdrawal failed: ${res.statusText}`);
      }

      const { transaction: txBase64 } = (await res.json()) as { transaction: string };
      const txBytes = Uint8Array.from(Buffer.from(txBase64, "base64"));

      // Sign and submit V0 transaction via Privy
      const sendRes = await signAndSendTransaction({
        transaction: txBytes,
        wallet: primaryWallet as any,
      });

      const signature = getBase58Decoder().decode(sendRes.signature);
      setTxSignature(signature);
      void fetchLuloAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute withdrawal.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white">
              {isProtected ? (
                <ShieldCheck className="h-4 w-4 text-emerald-300" />
              ) : (
                <Zap className="h-4 w-4 text-emerald-300" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-sans">
                {activeTab === "deposit"
                  ? `Deposit into ${marketName}`
                  : `Withdraw from ${marketName}`}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                {isProtected
                  ? "Principal Protection Pool (PUSD)"
                  : "Dynamic Yield Optimization (LUSD)"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-mono text-sm p-1"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher for this market */}
        <div className="mt-4 flex border-b border-slate-200 font-mono text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("deposit");
              setError(null);
              setTxSignature(null);
              setAmount("10");
            }}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              activeTab === "deposit"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Deposit
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("withdraw");
              setError(null);
              setTxSignature(null);
              if (maxWithdrawable > 0) {
                setAmount(maxWithdrawable.toString());
              }
            }}
            className={`pb-2 px-3 font-semibold transition-colors border-b-2 ${
              activeTab === "withdraw"
                ? "border-emerald-600 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Withdraw
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          {/* Individual Market Info Card */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-900 block font-sans">
                  {marketName}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {isProtected
                    ? "Principal coverage protection enabled"
                    : "Automated routing across Kamino, Marginfi & Save"}
                </span>
              </div>
              {apy !== undefined && (
                <div className="rounded border border-emerald-300 bg-white px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
                  {formatPct(apy)} APY
                </div>
              )}
            </div>
          </div>

          {activeTab === "deposit" ? (
            /* Deposit Flow */
            <div>
              <label className="block text-xs font-medium text-slate-700 font-mono">
                Deposit Amount ({asset})
              </label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                  placeholder="e.g. 10"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="font-mono text-xs font-semibold text-slate-500">{asset}</span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="mt-2 flex gap-1.5 font-mono text-xs">
                {["10", "25", "50", "100", "250"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700 hover:bg-slate-100"
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Withdraw Flow */
            <>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-bold text-slate-900 tabular-nums">
                    {loadingAccount ? "…" : `$${currentBalance.toFixed(2)} ${asset}`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-500">Max Withdrawable:</span>
                  <span className="font-semibold text-emerald-700 tabular-nums">
                    {loadingAccount ? "…" : `$${maxWithdrawable.toFixed(2)} ${asset}`}
                  </span>
                </div>
                {accruedInterest > 0 && (
                  <div className="flex justify-between items-center text-[11px] text-emerald-800 pt-1 border-t border-slate-200/70">
                    <span>Accrued Yield:</span>
                    <span>+${accruedInterest.toFixed(4)} {asset}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-medium text-slate-700 font-mono">
                    Withdraw Amount ({asset})
                  </label>
                  {maxWithdrawable > 0 && (
                    <button
                      type="button"
                      onClick={() => setAmount(maxWithdrawable.toString())}
                      className="text-[11px] font-mono font-bold text-emerald-700 hover:text-emerald-900"
                    >
                      Use Max
                    </button>
                  )}
                </div>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g. 10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="font-mono text-xs font-semibold text-slate-500">{asset}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600 font-mono">
            <span className="text-slate-400">Target Wallet: </span>
            <span className="text-slate-800 select-all">
              {primaryWallet ? shortenAddress(primaryWallet.address, 6) : "No wallet connected"}
            </span>
          </div>

          {txSignature && (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-semibold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  {activeTab === "deposit"
                    ? "Deposit confirmed on Solana!"
                    : "Withdrawal confirmed on Solana!"}
                </span>
              </div>
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono font-bold text-emerald-700 underline text-[11px] flex items-center gap-1"
              >
                <span>Solscan</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 font-mono text-xs">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
          >
            {txSignature ? "Close" : "Cancel"}
          </button>
          {!txSignature && (
            <button
              onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
              disabled={submitting || !primaryWallet}
              className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 shadow-sm transition-colors"
            >
              {submitting
                ? "Signing & Submitting…"
                : activeTab === "deposit"
                ? `Deposit ${amount} ${asset}`
                : `Withdraw ${amount} ${asset}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
