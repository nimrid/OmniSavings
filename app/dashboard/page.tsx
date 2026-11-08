"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  ArrowDownLeft,
  ArrowRight,
  Zap,
  Layers,
  Globe,
} from "lucide-react";
import { useYield } from "@/hooks/useYield";
import { formatPct } from "@/lib/utils/format";
import { YieldTable } from "@/components/YieldTable";
import { DepositModal } from "@/components/DepositModal";
import { VaultCard } from "@/components/VaultCard";
import { YieldToEquityCard } from "@/components/YieldToEquityCard";

const BalanceCard = dynamic(
  () => import("@/components/BalanceCard").then((m) => m.BalanceCard),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">Connected Wallets</h2>
        <p className="mt-2 text-xs text-slate-500 font-mono">Loading telemetry…</p>
      </section>
    ),
  }
);

const ASSETS = ["USDC", "USDT"] as const;

export default function DashboardPage() {
  const [asset, setAsset] = useState<(typeof ASSETS)[number]>("USDC");
  const { data, loading, error, refetch } = useYield(asset);
  const [fundOpen, setFundOpen] = useState(false);

  const bestId = data?.best ? `${data.best.protocol}-${data.best.marketId}` : null;

  return (
    <div className="space-y-6">
      {/* Dashboard Top Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-800">
              Institutional DeFi
            </span>
            <span className="rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
              Solana Mainnet
            </span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Solana Savings & Yield Terminal
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Compare verified stablecoin yields across Anchor Jupiter CPI and Lulo with automated execution
          </p>
        </div>

        {/* Currency & Action Toolbar */}
        <div className="flex items-center gap-2 font-mono">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {ASSETS.map((a) => (
              <button
                key={a}
                onClick={() => setAsset(a)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                  asset === a
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          <button
            onClick={() => void refetch()}
            disabled={loading}
            title="Refresh Quotes"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setFundOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 transition-colors"
          >
            <ArrowDownLeft className="h-3.5 w-3.5" />
            <span>Fund Wallet (Intents)</span>
          </button>
        </div>
      </div>

      {/* KPI Highlight Strip */}
      {data?.best && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-950 block">
                Highest Yield Market Right Now: {formatPct(data.best.apyNet)} APY on {data.best.market}
              </span>
              <span className="text-[11px] text-emerald-800 font-mono">
                Protocol: {data.best.protocol.toUpperCase()} • Settlement: {data.best.chain.toUpperCase()} Mainnet
              </span>
            </div>
          </div>

          <Link
            href="/invest"
            className="inline-flex items-center gap-1 font-mono font-bold text-emerald-800 hover:text-emerald-950 underline text-xs"
          >
            <span>Deploy Yield into Tokenized Stocks</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Grid Layout: Main Columns (Vault + Yield Table) vs Sidebar */}
      <div className="grid gap-6 lg:grid-cols-[1fr_310px]">
        <div className="space-y-6">
          {/* On-Chain Anchor CPI Vault Card */}
          <VaultCard
            asset={asset}
            apyNet={
              data?.quotes?.find((q) => q.protocol.toLowerCase().includes("jupiter"))
                ?.apyNet
            }
          />

          {/* Comparative Yield Matrix */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-700" />
                <span>Live Comparative Lending Markets</span>
              </h2>
              <span className="font-mono text-[11px] text-slate-500">
                Verified API Quotes
              </span>
            </div>

            {loading && !data ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-xs text-slate-500 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
                <span>Fetching real-time on-chain quotes…</span>
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800">
                {error}
              </div>
            ) : data ? (
              <YieldTable quotes={data.quotes} bestId={bestId} />
            ) : null}
          </div>

          {/* Yield-to-Equity Desk Teaser / Integration */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    Yield-to-Equity Auto-Allocation
                  </h3>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold uppercase font-mono">
                    Zero Risk Principal
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Compound your savings interest into real tokenized US stocks & S&P 500 (SPYx, NVDAx, AAPLx)
                </p>
              </div>

              <Link
                href="/invest"
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors font-mono"
              >
                <span>Open Equity Desk</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {data?.errors && Object.keys(data.errors).length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 font-mono">
              <p className="font-bold">Protocol Telemetry Notice:</p>
              <ul className="mt-1 list-inside list-disc text-[11px] space-y-0.5">
                {Object.entries(data.errors).map(([protocol, reason]) => (
                  <li key={protocol}>
                    {protocol}: {reason}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <BalanceCard />

          <div className="rounded-xl border border-slate-200/90 bg-white p-4 text-xs text-slate-600 space-y-2.5 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 font-sans">
              <Globe className="h-4 w-4 text-slate-600" />
              <span>Universal Cross-Chain Deposits</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Powered by Aurora Intents: send funds directly from 8+ EVM chains (Ethereum, Base, Arbitrum, BSC, Optimism, Polygon). Solvers route liquidity straight into your Solana self-custody wallet in seconds.
            </p>
          </div>
        </aside>
      </div>

      {fundOpen && (
        <DepositModal asset={asset} onClose={() => setFundOpen(false)} />
      )}
    </div>
  );
}
