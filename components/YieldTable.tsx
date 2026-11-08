"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ShieldCheck, Zap, ExternalLink } from "lucide-react";
import type { YieldQuote } from "@/lib/protocols/types";
import { formatPct, formatUsd } from "@/lib/utils/format";
import { LuloDepositModal } from "./LuloDepositModal";

interface Props {
  quotes: YieldQuote[];
  bestId: string | null;
  onOpenJupiterVault?: () => void;
}

const PROTOCOL_METADATA: Record<
  YieldQuote["protocol"],
  { name: string; tag: string; color: string; textColor: string }
> = {
  lulo: {
    name: "Lulo",
    tag: "Autonomous Lending",
    color: "bg-emerald-50 border-emerald-200",
    textColor: "text-emerald-800",
  },
  jupiter: {
    name: "Jupiter Earn",
    tag: "Anchor CPI Vault",
    color: "bg-indigo-50 border-indigo-200",
    textColor: "text-indigo-800",
  },
};

export function YieldTable({ quotes, bestId, onOpenJupiterVault }: Props) {
  const [luloModalOpen, setLuloModalOpen] = useState(false);
  const [luloModalTab, setLuloModalTab] = useState<"deposit" | "withdraw">("deposit");
  const [luloSelectedMode, setLuloSelectedMode] = useState<"regular" | "protected">("regular");
  const [selectedAsset, setSelectedAsset] = useState("USDC");
  const [selectedApy, setSelectedApy] = useState<number | undefined>(undefined);

  if (quotes.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 font-mono">
        No live market quotes available for this asset right now.
      </div>
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
      {/* MOBILE CARD VIEW (< 768px) */}
      <div className="block md:hidden space-y-3">
        {quotes.map((q) => {
          const id = `${q.protocol}-${q.marketId}`;
          const isBest = bestId === id;
          const isJupiter = q.protocol === "jupiter";
          const isProtected = q.marketId.includes("protected") || q.market.toLowerCase().includes("protected");
          const meta = PROTOCOL_METADATA[q.protocol] || {
            name: q.protocol,
            tag: "Lending",
            color: "bg-slate-50 border-slate-200",
            textColor: "text-slate-800",
          };

          return (
            <div
              key={id}
              className={`rounded-xl border p-4 shadow-sm space-y-3 transition-colors ${
                isBest
                  ? "border-emerald-300 bg-emerald-50/40 ring-1 ring-emerald-300/50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-900 text-sm font-sans">{meta.name}</span>
                    {isBest && (
                      <span className="rounded bg-emerald-700 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                        Top Rate
                      </span>
                    )}
                    {isJupiter && (
                      <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                        Anchor CPI
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5 flex items-center gap-1">
                    <span>{q.market}</span>
                    {isProtected && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-semibold">
                        <ShieldCheck className="h-3 w-3" />
                        Protected
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    <span className={isBest ? "text-emerald-700 font-extrabold" : ""}>
                      {formatPct(q.apyNet)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase">Net APY</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">TVL Liquidity</span>
                  <span className="font-bold text-slate-800">{formatUsd(q.tvlUsd)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Chain Settlement</span>
                  <span className="font-bold text-slate-800 uppercase">{q.chain} Mainnet</span>
                </div>
              </div>

              {/* Action Buttons (Touch-Friendly) */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => handleDepositClick(q)}
                  className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg font-semibold shadow-2xs transition-colors ${
                    isJupiter
                      ? "bg-indigo-600 text-white active:bg-indigo-700"
                      : "bg-emerald-700 text-white active:bg-emerald-800"
                  }`}
                >
                  <ArrowDownLeft className="h-3.5 w-3.5" />
                  <span>{isJupiter ? "Deposit (CPI)" : "Deposit"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleWithdrawClick(q)}
                  className={`min-h-[40px] flex items-center justify-center gap-1.5 rounded-lg border font-semibold shadow-2xs transition-colors ${
                    isJupiter
                      ? "border-indigo-300 text-indigo-700 active:bg-indigo-50 bg-white"
                      : "border-slate-300 text-slate-700 active:bg-slate-50 bg-white"
                  }`}
                >
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span>Withdraw</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW (>= 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-sm">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-mono uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-semibold">Protocol / Contract</th>
              <th className="px-4 py-3 font-semibold">Market Type</th>
              <th className="px-4 py-3 font-semibold">Chain</th>
              <th className="px-4 py-3 text-right font-semibold">Net APY</th>
              <th className="px-4 py-3 text-right font-semibold">Total Liquidity</th>
              <th className="px-4 py-3 text-right font-semibold">Telemetry</th>
              <th className="px-4 py-3 text-center font-semibold">Execution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {quotes.map((q) => {
              const id = `${q.protocol}-${q.marketId}`;
              const isBest = bestId === id;
              const isJupiter = q.protocol === "jupiter";
              const isProtected = q.marketId.includes("protected") || q.market.toLowerCase().includes("protected");
              const meta = PROTOCOL_METADATA[q.protocol] || {
                name: q.protocol,
                tag: "Lending",
                color: "bg-slate-50 border-slate-200",
                textColor: "text-slate-800",
              };

              return (
                <tr
                  key={id}
                  className={`hover:bg-slate-50/80 transition-colors ${
                    isBest ? "bg-emerald-50/30" : ""
                  }`}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="font-sans font-bold text-slate-900 text-xs">
                        {meta.name}
                      </div>
                      {isBest && (
                        <span className="rounded bg-emerald-700 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-white">
                          Top Rate
                        </span>
                      )}
                      {isJupiter && (
                        <span className="rounded border border-indigo-200 bg-indigo-50 px-1.5 py-0.2 text-[9px] font-bold text-indigo-700">
                          Anchor CPI
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-sans mt-0.5">
                      {isJupiter
                        ? "Jupiter Lend Earn (jlUSDC)"
                        : isProtected
                        ? "Lulo Protected Lending"
                        : "Lulo Multi-Market Dynamic"}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 font-sans">
                    <span className="font-medium text-slate-800">{q.market}</span>
                    {isProtected && (
                      <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-medium">
                        <ShieldCheck className="h-3 w-3" />
                        Protected
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 uppercase text-slate-500 text-[11px]">
                    {q.chain}
                  </td>

                  <td className="px-4 py-3.5 text-right font-bold tabular-nums text-sm">
                    <span className={isBest ? "text-emerald-700 font-extrabold" : "text-slate-900"}>
                      {formatPct(q.apyNet)}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right tabular-nums text-slate-600">
                    {formatUsd(q.tvlUsd)}
                  </td>

                  <td className="px-4 py-3.5 text-right text-[11px] text-slate-400">
                    {q.source}
                  </td>

                  <td className="px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleDepositClick(q)}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
                          isJupiter
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-emerald-700 text-white hover:bg-emerald-800"
                        }`}
                      >
                        <ArrowDownLeft className="h-3 w-3" />
                        <span>Deposit</span>
                      </button>
                      <button
                        onClick={() => handleWithdrawClick(q)}
                        className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-semibold shadow-2xs transition-colors ${
                          isJupiter
                            ? "border-indigo-300 text-indigo-700 hover:bg-indigo-50"
                            : "border-slate-300 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <ArrowUpRight className="h-3 w-3" />
                        <span>Withdraw</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Lulo Deposit / Withdraw Modal (Isolated per market) */}
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
