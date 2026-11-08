"use client";

import { useState, useEffect } from "react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import type { YieldToEquityRule } from "@/lib/backpack/types";
import { formatUsd } from "@/lib/utils/format";

interface Props {
  vaultBalanceUsd?: number;
  averageApy?: number;
}

export function YieldToEquityCard({ vaultBalanceUsd = 2500, averageApy = 6.0 }: Props) {
  const { primaryWallet } = useConnectedWallets();

  const [enabled, setEnabled] = useState(false);
  const [frequency, setFrequency] = useState<"weekly" | "monthly">("weekly");
  const [spyPercent, setSpyPercent] = useState(50);
  const [nvdaPercent, setNvdaPercent] = useState(50);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load existing user rule
  useEffect(() => {
    if (!primaryWallet?.address) return;
    fetch(`/api/stocks/yield-to-equity?user=${primaryWallet.address}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: YieldToEquityRule | null) => {
        if (data) {
          setEnabled(data.enabled);
          const spyAlloc = data.allocations?.find((a) => a.symbol === "SPY")?.percent ?? 50;
          const nvdaAlloc = data.allocations?.find((a) => a.symbol === "NVDA")?.percent ?? 50;
          setSpyPercent(spyAlloc);
          setNvdaPercent(nvdaAlloc);
          if (data.frequency === "monthly" || data.frequency === "weekly") {
            setFrequency(data.frequency);
          }
        }
      })
      .catch(() => {});
  }, [primaryWallet?.address]);

  // Projected annual yield based on vault balance & APY
  const projectedAnnualYieldUsd = (vaultBalanceUsd * averageApy) / 100;
  const projectedWeeklyYieldUsd = projectedAnnualYieldUsd / 52;
  const spyAllocationUsd = (projectedAnnualYieldUsd * spyPercent) / 100;
  const nvdaAllocationUsd = (projectedAnnualYieldUsd * nvdaPercent) / 100;

  const handleSave = async () => {
    if (!primaryWallet?.address) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/stocks/yield-to-equity", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user: primaryWallet.address,
          enabled,
          sourceVault: "both",
          frequency,
          allocations: [
            { symbol: "SPY", percent: spyPercent },
            { symbol: "NVDA", percent: nvdaPercent },
          ],
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 text-white shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500 text-white font-extrabold text-lg shadow-md">
            📈
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Yield-to-Equity Auto-Invest
              </h2>
              <span className="rounded-full bg-indigo-400/20 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-300 border border-indigo-400/30">
                Backpack × Jupiter CPI
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Never risk your principal. Automatically accumulate stocks using accrued DeFi yield.
            </p>
          </div>
        </div>

        {/* Enable / Disable Toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <span className="text-xs font-semibold text-indigo-200">
            {enabled ? "Auto-DCA Active" : "Auto-DCA Paused"}
          </span>
          <div
            onClick={() => setEnabled(!enabled)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              enabled ? "bg-emerald-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                enabled ? "translate-x-5" : ""
              }`}
            />
          </div>
        </label>
      </div>

      {/* Projection Banner */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl bg-white/5 p-4 border border-white/10 text-xs">
        <div>
          <span className="text-indigo-300/70 block text-[11px]">Savings Principal (CPI Vault)</span>
          <span className="font-bold text-white text-base">
            {formatUsd(vaultBalanceUsd)}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            Earning ~{averageApy.toFixed(1)}% APY
          </span>
        </div>

        <div>
          <span className="text-indigo-300/70 block text-[11px]">Annual Yield Stream</span>
          <span className="font-bold text-emerald-400 text-base">
            +{formatUsd(projectedAnnualYieldUsd)} / yr
          </span>
          <span className="text-[10px] text-indigo-200 block mt-0.5">
            (~${projectedWeeklyYieldUsd.toFixed(2)} weekly DCA budget)
          </span>
        </div>

        <div>
          <span className="text-indigo-300/70 block text-[11px]">Target Portfolio Assets</span>
          <span className="font-bold text-white text-base">
            SPY ({spyPercent}%) · NVDA ({nvdaPercent}%)
          </span>
          <span className="text-[10px] text-indigo-300 block mt-0.5">
            Backpack 24/7 Stock RWAs
          </span>
        </div>
      </div>

      {/* Customization Sliders */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-4">
        {/* SPY Slider */}
        <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-xs text-white">
              S&P 500 ETF (SPY)
            </span>
            <span className="font-mono font-bold text-xs text-indigo-300">
              {spyPercent}% (${spyAllocationUsd.toFixed(0)}/yr)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={spyPercent}
            onChange={(e) => {
              const val = Number(e.target.value);
              setSpyPercent(val);
              setNvdaPercent(100 - val);
            }}
            className="w-full accent-indigo-400"
          />
          <p className="text-[10px] text-indigo-300/70 mt-1">
            Broad US market index across 500 top companies
          </p>
        </div>

        {/* NVDA Slider */}
        <div className="rounded-xl bg-white/5 p-3.5 border border-white/5">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-xs text-white">
              NVIDIA Corp (NVDA)
            </span>
            <span className="font-mono font-bold text-xs text-indigo-300">
              {nvdaPercent}% (${nvdaAllocationUsd.toFixed(0)}/yr)
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={nvdaPercent}
            onChange={(e) => {
              const val = Number(e.target.value);
              setNvdaPercent(val);
              setSpyPercent(100 - val);
            }}
            className="w-full accent-indigo-400"
          />
          <p className="text-[10px] text-indigo-300/70 mt-1">
            Accelerated AI computing hardware leader
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-indigo-300">DCA Frequency:</span>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="rounded-lg bg-slate-800 border border-white/10 px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="text-xs text-emerald-400 font-semibold">
              ✓ Rule saved!
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !primaryWallet}
            className="rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 px-4 py-2 text-xs font-bold text-white shadow-md transition-colors"
          >
            {saving ? "Saving…" : "Save Auto-DCA Strategy"}
          </button>
        </div>
      </div>
    </div>
  );
}

