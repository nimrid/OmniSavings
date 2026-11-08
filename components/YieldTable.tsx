"use client";

import { useState } from "react";
import type { YieldQuote } from "@/lib/protocols/types";
import { formatPct, formatUsd } from "@/lib/utils/format";
import { LuloDepositModal } from "./LuloDepositModal";

interface Props {
  quotes: YieldQuote[];
  bestId: string | null;
  onOpenJupiterVault?: () => void;
}

const PROTOCOL_LABEL: Record<YieldQuote["protocol"], string> = {
  lulo: "Lulo",
  jupiter: "Jupiter",
};

export function YieldTable({ quotes, bestId, onOpenJupiterVault }: Props) {
  const [luloModalOpen, setLuloModalOpen] = useState(false);
  const [luloModalTab, setLuloModalTab] = useState<"deposit" | "withdraw">("deposit");
  const [luloSelectedMode, setLuloSelectedMode] = useState<"regular" | "protected">("regular");
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const [selectedApy, setSelectedApy] = useState<number | undefined>(undefined);

  if (quotes.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No quotes available for this asset right now.
      </p>
    );
  }

  const handleDepositClick = (q: YieldQuote) => {
    if (q.protocol === "jupiter") {
      if (onOpenJupiterVault) {
        onOpenJupiterVault();
      } else {
        const el = document.getElementById("vault-card-section");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    } else if (q.protocol === "lulo") {
      const isProt = q.marketId.includes("protected") || q.market.toLowerCase().includes("protected");
      setSelectedAsset(q.asset);
      setLuloSelectedMode(isProt ? "protected" : "regular");
      setSelectedApy(q.apyNet);
      setLuloModalTab("deposit");
      setLuloModalOpen(true);
    }
  };

  const handleWithdrawClick = (q: YieldQuote) => {
    if (q.protocol === "jupiter") {
      const el = document.getElementById("vault-card-section");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    } else if (q.protocol === "lulo") {
      const isProt = q.marketId.includes("protected") || q.market.toLowerCase().includes("protected");
      setSelectedAsset(q.asset);
      setLuloSelectedMode(isProt ? "protected" : "regular");
      setSelectedApy(q.apyNet);
      setLuloModalTab("withdraw");
      setLuloModalOpen(true);
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 bg-slate-50/50">
              <th className="px-4 py-3 font-medium">Protocol</th>
              <th className="px-4 py-3 font-medium">Market</th>
              <th className="px-4 py-3 font-medium">Chain</th>
              <th className="px-4 py-3 text-right font-medium">Net APY</th>
              <th className="px-4 py-3 text-right font-medium">TVL</th>
              <th className="px-4 py-3 text-right font-medium">Source</th>
              <th className="px-4 py-3 text-center font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {quotes.map((q) => {
              const id = `${q.protocol}-${q.marketId}`;
              const isBest = bestId === id;
              const isJupiter = q.protocol === "jupiter";
              return (
                <tr key={id} className={isBest ? "bg-emerald-50/60" : undefined}>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    <div className="flex items-center gap-1.5">
                      <span>{PROTOCOL_LABEL[q.protocol]}</span>
                      {isBest && (
                        <span className="rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          Best
                        </span>
                      )}
                      {isJupiter && (
                        <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">
                          CPI
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{q.market}</td>
                  <td className="px-4 py-3 text-slate-600 font-mono text-xs uppercase">{q.chain}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums text-slate-900">
                    {formatPct(q.apyNet)}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                    {formatUsd(q.tvlUsd)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-slate-400">
                    {q.source}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleDepositClick(q)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                          isJupiter
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-emerald-700 text-white hover:bg-emerald-800"
                        }`}
                      >
                        {isJupiter ? "Deposit (CPI)" : "Deposit"}
                      </button>
                      <button
                        onClick={() => handleWithdrawClick(q)}
                        className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold shadow-sm transition-colors ${
                          isJupiter
                            ? "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            : "border-emerald-300 text-emerald-800 hover:bg-emerald-50"
                        }`}
                      >
                        Withdraw
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lulo Deposit / Withdraw Modal (Dedicated per market) */}
      <LuloDepositModal
        open={luloModalOpen}
        onClose={() => setLuloModalOpen(false)}
        asset={selectedAsset}
        mode={luloSelectedMode}
        initialTab={luloModalTab}
        apy={selectedApy}
      />
    </>
  );
}
