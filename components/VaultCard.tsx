"use client";

import { useState } from "react";
import { useVault } from "@/hooks/useVault";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { formatPct } from "@/lib/utils/format";

interface VaultCardProps {
  asset?: string;
  apyNet?: number;
}

export function VaultCard({ asset = "USDC", apyNet }: VaultCardProps) {
  const { primaryWallet } = useConnectedWallets();
  const { account, loading, depositing, error, txSignature, depositToVault, refetch } =
    useVault(asset);

  const [amount, setAmount] = useState("10");
  const [savingsGoal, setSavingsGoal] = useState("1000");
  const [modalOpen, setModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const totalDeposited = account?.totalDeposited ?? 0;
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

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs shadow">
            CPI
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                On-Chain Savings Vault
              </h3>
              <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                Solana Program
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Powered by Anchor + Jupiter Lend Earn CPI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {apyNet !== undefined && (
            <div className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
              {formatPct(apyNet)} APY
            </div>
          )}
          <button
            onClick={() => setModalOpen(true)}
            disabled={!primaryWallet || depositing}
            className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {depositing ? "Confirming…" : "Deposit into Vault"}
          </button>
        </div>
      </div>

      {/* Program Details */}
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
        <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/80">
          <p className="text-slate-500">Program ID</p>
          <a
            href="https://solscan.io/account/AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono font-medium text-indigo-600 hover:underline"
            title="AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT"
          >
            AhYUb1…ktTT ↗
          </a>
        </div>
        <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/80">
          <p className="text-slate-500">CPI Target</p>
          <span className="font-medium text-slate-800">Jupiter Lend</span>
        </div>
        <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/80">
          <p className="text-slate-500">Vault Balance</p>
          <span className="font-semibold text-slate-900">
            {loading ? "…" : `${totalDeposited.toLocaleString()} ${asset}`}
          </span>
        </div>
        <div className="rounded-lg bg-white/80 p-2.5 border border-slate-200/80">
          <p className="text-slate-500">Goal Progress</p>
          <span className="font-semibold text-slate-900">{progressPct}%</span>
        </div>
      </div>

      {/* Goal Progress Bar */}
      {goal > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>
              Savings Progress ({totalDeposited} / {goal} {asset})
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Notification */}
      {txSignature && (
        <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 flex items-center justify-between">
          <span>Deposit confirmed on Solana via Jupiter CPI!</span>
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

      {/* Error Notification */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Deposit Modal */}
      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Deposit into On-Chain Vault
                </h3>
                <p className="text-xs text-slate-500">
                  Executes Solana Anchor CPI $\to$ Jupiter Lend Earn
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
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
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 10"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700">
                  Target Savings Goal ({asset})
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={savingsGoal}
                  onChange={(e) => setSavingsGoal(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. 1000"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Recorded in your on-chain UserSavings PDA for goal tracking.
                </p>
              </div>

              <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-3 text-xs text-indigo-900 space-y-1">
                <p className="font-semibold">CPI Execution Flow:</p>
                <p>1. User invokes `onchain::deposit_to_jupiter`</p>
                <p>2. Program updates UserSavings state PDA</p>
                <p>3. Program executes CPI into `jup3YeL8QhtSx...`</p>
                <p>4. Jupiter mints jlToken shares directly to your wallet</p>
              </div>

              {actionError && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
                  {actionError}
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeposit}
                disabled={depositing}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
              >
                {depositing ? "Executing CPI…" : `Deposit ${amount} ${asset}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

