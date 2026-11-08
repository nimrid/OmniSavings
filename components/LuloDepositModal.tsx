"use client";

import { useState } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { formatPct } from "@/lib/utils/format";

interface LuloDepositModalProps {
  open: boolean;
  onClose: () => void;
  asset?: string;
  defaultMode?: "regular" | "protected";
  regularApy?: number;
  protectedApy?: number;
}

export function LuloDepositModal({
  open,
  onClose,
  asset = "USDC",
  defaultMode = "regular",
  regularApy,
  protectedApy,
}: LuloDepositModalProps) {
  const { primaryWallet } = useConnectedWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();

  const [amount, setAmount] = useState("10");
  const [mode, setMode] = useState<"regular" | "protected">(defaultMode);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  if (!open) return null;

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute deposit.");
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
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-xs">
              L
            </span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Deposit into Lulo
              </h3>
              <p className="text-xs text-slate-500">
                Automated Solana lending yield aggregator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {/* Mode Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Deposit Strategy
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode("regular")}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  mode === "regular"
                    ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">
                  Lulo Regular
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {formatPct(regularApy)} APY
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Flexible rate, max yield
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("protected")}
                className={`rounded-lg border p-2.5 text-left transition-colors ${
                  mode === "protected"
                    ? "border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-semibold text-xs text-slate-900">
                  Lulo Protected
                </div>
                <div className="text-[11px] text-emerald-700 font-medium mt-0.5">
                  {formatPct(protectedApy)} APY
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Principal coverage protection
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700">
              Deposit Amount ({asset})
            </label>
            <input
              type="number"
              min="0.1"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. 10"
            />
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-[11px] text-slate-600">
            <span className="font-medium text-slate-700">Recipient Address: </span>
            <span className="font-mono text-slate-800 break-all select-all">
              {primaryWallet?.address || "No wallet connected"}
            </span>
          </div>

          {txSignature && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 flex items-center justify-between">
              <span>Deposit confirmed on Solana!</span>
              <a
                href={`https://solscan.io/tx/${txSignature}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-700 underline ml-2"
              >
                View on Solscan ↗
              </a>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              {error}
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {txSignature ? "Close" : "Cancel"}
          </button>
          {!txSignature && (
            <button
              onClick={handleDeposit}
              disabled={submitting || !primaryWallet}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 shadow-sm transition-colors"
            >
              {submitting ? "Signing & Submitting…" : `Deposit ${amount} ${asset}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

