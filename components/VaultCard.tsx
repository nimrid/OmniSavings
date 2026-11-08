"use client";

import { useState } from "react";
import {
  ShieldCheck,
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Lock,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { useVault } from "@/hooks/useVault";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { formatPct, shortenAddress } from "@/lib/utils/format";

interface VaultCardProps {
  asset?: string;
  apyNet?: number;
}

export function VaultCard({ asset = "USDC", apyNet = 0.0479 }: VaultCardProps) {
  const { primaryWallet } = useConnectedWallets();
  const {
    account,
    loading,
    depositing,
    withdrawing,
    error,
    txSignature,
    depositToVault,
    withdrawFromVault,
  } = useVault(asset);

  const [amount, setAmount] = useState("10");
  const [savingsGoal, setSavingsGoal] = useState("1000");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"deposit" | "withdraw">("deposit");
  const [actionError, setActionError] = useState<string | null>(null);
  const [copiedProgram, setCopiedProgram] = useState(false);

  const totalDeposited = account?.totalDeposited ?? 0;
  const totalWithdrawn = account?.totalWithdrawn ?? 0;
  const goal = account?.savingsGoal ?? Number(savingsGoal);
  const progressPct = goal > 0 ? Math.min(100, Math.round((totalDeposited / goal) * 100)) : 0;

  const handleDeposit = async () => {
    setActionError(null);
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setActionError("Please enter a valid positive deposit amount.");
      return;
    }

    try {
      await depositToVault(num, Number(savingsGoal) || undefined);
      setModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Deposit failed");
    }
  };

  const handleWithdraw = async () => {
    setActionError(null);
    const num = Number(amount);
    if (isNaN(num) || num <= 0) {
      setActionError("Please enter a valid positive withdrawal amount.");
      return;
    }

    try {
      await withdrawFromVault(num);
      setModalOpen(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Withdrawal failed");
    }
  };

  const openDepositModal = () => {
    setModalMode("deposit");
    setActionError(null);
    setModalOpen(true);
  };

  const openWithdrawModal = () => {
    setModalMode("withdraw");
    setActionError(null);
    setModalOpen(true);
  };

  const copyProgramId = async () => {
    try {
      await navigator.clipboard.writeText("AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT");
      setCopiedProgram(true);
      setTimeout(() => setCopiedProgram(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div
      id="vault-card-section"
      className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden"
    >
      {/* Vault Card Header */}
      <div className="border-b border-slate-200 bg-slate-50/70 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-900 text-white shadow-sm">
              <ShieldCheck className="h-4 w-4 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight">
                  Anchor Jupiter Lend CPI Vault
                </h3>
                <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-mono font-semibold text-indigo-700">
                  On-Chain Solana SBF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Atomic Cross-Program Invocation into Jupiter Lend Earn (jlUSDC liquidity pool)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-mono font-bold text-emerald-800 shadow-2xs">
              {formatPct(apyNet)} APY
            </div>
            <button
              onClick={openDepositModal}
              disabled={!primaryWallet || depositing || withdrawing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors font-mono"
            >
              <ArrowDownLeft className="h-3.5 w-3.5" />
              <span>{depositing ? "Confirming…" : "Deposit (CPI)"}</span>
            </button>
            <button
              onClick={openWithdrawModal}
              disabled={!primaryWallet || depositing || withdrawing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors font-mono"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{withdrawing ? "Confirming…" : "Withdraw"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* On-Chain Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4 font-mono">
          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase">
              Program ID
            </span>
            <div className="mt-1 flex items-center justify-between">
              <a
                href="https://solscan.io/account/AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-indigo-600 hover:text-indigo-800"
                title="AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT"
              >
                AhYUb1…ktTT ↗
              </a>
              <button
                onClick={copyProgramId}
                className="text-slate-400 hover:text-slate-600 p-0.5"
                title="Copy Program ID"
              >
                {copiedProgram ? (
                  <Check className="h-3 w-3 text-emerald-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase">
              CPI Routing Target
            </span>
            <span className="font-bold text-slate-800 mt-1 block">
              Jupiter Lend Earn (jlUSDC)
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase">
              Total Deposited
            </span>
            <span className="font-bold text-slate-900 mt-1 block tabular-nums">
              {loading ? "…" : `${totalDeposited.toLocaleString()} ${asset}`}
            </span>
          </div>

          <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
            <span className="text-slate-400 block text-[10px] uppercase">
              Total Withdrawn
            </span>
            <span className="font-bold text-slate-900 mt-1 block tabular-nums">
              {loading ? "…" : `${totalWithdrawn.toLocaleString()} ${asset}`}
            </span>
          </div>
        </div>

        {/* Goal Progress Section */}
        {goal > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 text-xs space-y-2">
            <div className="flex justify-between items-center font-mono">
              <span className="text-slate-600 text-[11px]">
                Savings Goal Target:{" "}
                <strong className="text-slate-900">{goal.toLocaleString()} {asset}</strong>
              </span>
              <span className="rounded bg-indigo-100 text-indigo-800 px-1.5 py-0.2 text-[10px] font-bold">
                {progressPct}% Reached
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Transaction Alerts */}
        {txSignature && (
          <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="font-semibold">CPI Transaction successfully confirmed on Solana!</span>
            </div>
            <a
              href={`https://solscan.io/tx/${txSignature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-mono text-emerald-700 underline font-bold text-[11px]"
            >
              <span>View on Solscan</span>
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

      {/* Action Modal (Deposit or Withdraw) */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-900 text-white">
                  <ShieldCheck className="h-4 w-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {modalMode === "deposit"
                      ? "Deposit into Jupiter CPI Vault"
                      : "Withdraw from Jupiter CPI Vault"}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Anchor SBF Contract: AhYUb1…ktTT
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-mono p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Tab Switcher */}
            <div className="mt-4 flex border-b border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setModalMode("deposit");
                  setActionError(null);
                }}
                className={`pb-2 px-3 text-xs font-semibold font-mono transition-colors border-b-2 ${
                  modalMode === "deposit"
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Deposit (CPI)
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalMode("withdraw");
                  setActionError(null);
                }}
                className={`pb-2 px-3 text-xs font-semibold font-mono transition-colors border-b-2 ${
                  modalMode === "withdraw"
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                Withdraw (CPI)
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 font-mono">
                  {modalMode === "deposit" ? "Deposit" : "Withdraw"} Amount ({asset})
                </label>
                <div className="mt-1 relative rounded-lg shadow-sm">
                  <input
                    type="number"
                    min="0.1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono font-semibold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    placeholder="e.g. 10"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="font-mono text-xs font-semibold text-slate-500">{asset}</span>
                  </div>
                </div>

                {/* Preset Chips */}
                <div className="mt-2 flex gap-1.5 font-mono text-xs">
                  {["5", "10", "25", "50", "100"].map((val) => (
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

              {modalMode === "deposit" ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 font-mono">
                      Target Savings Goal ({asset})
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      value={savingsGoal}
                      onChange={(e) => setSavingsGoal(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-900 focus:border-indigo-600 focus:outline-none"
                      placeholder="e.g. 1000"
                    />
                    <p className="mt-1 text-[11px] text-slate-500">
                      Saved in on-chain UserSavings PDA for goal progress tracking.
                    </p>
                  </div>

                  <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-3 text-xs text-indigo-950 space-y-1 font-mono text-[11px]">
                    <p className="font-bold">On-Chain CPI Execution Plan:</p>
                    <p>1. Invokes onchain::deposit_to_jupiter</p>
                    <p>2. Mutates UserSavings account PDA metrics</p>
                    <p>3. CPI into Jupiter Lend (jup3YeL...)</p>
                    <p>4. Mints jlToken yield shares to your wallet</p>
                  </div>
                </>
              ) : (
                <div className="rounded-lg bg-indigo-50/80 border border-indigo-200 p-3 text-xs text-indigo-950 space-y-1 font-mono text-[11px]">
                  <p className="font-bold">On-Chain CPI Withdrawal Plan:</p>
                  <p>1. Invokes onchain::withdraw_from_jupiter</p>
                  <p>2. Burns jlToken yield shares via Jupiter CPI</p>
                  <p>3. Jupiter transfers underlying {asset} back to your wallet</p>
                  <p>4. Program updates on-chain total withdrawn metrics</p>
                </div>
              )}

              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2 font-mono text-xs">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={modalMode === "deposit" ? handleDeposit : handleWithdraw}
                disabled={depositing || withdrawing}
                className="rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                {depositing || withdrawing
                  ? "Executing CPI…"
                  : modalMode === "deposit"
                  ? `Deposit ${amount} ${asset}`
                  : `Withdraw ${amount} ${asset}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
