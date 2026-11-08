"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useYield } from "@/hooks/useYield";
import { formatPct } from "@/lib/utils/format";
import { YieldTable } from "@/components/YieldTable";
import { DepositModal } from "@/components/DepositModal";
import { VaultCard } from "@/components/VaultCard";

// Wallet hooks are client-only (and crash without a Privy provider, e.g.
// during prerender or when no app id is configured), so skip SSR here.
const BalanceCard = dynamic(
  () => import("@/components/BalanceCard").then((m) => m.BalanceCard),
  {
    ssr: false,
    loading: () => (
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-slate-900">
          Connected wallets
        </h2>
        <p className="mt-2 text-sm text-slate-600">Loading…</p>
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
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-slate-900">
            Yield dashboard
          </h1>
          <div className="flex items-center gap-2">
            {ASSETS.map((a) => (
              <button
                key={a}
                onClick={() => setAsset(a)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  asset === a
                    ? "bg-slate-900 text-white"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {a}
              </button>
            ))}
            <button
              onClick={() => void refetch()}
              disabled={loading}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Refresh
            </button>
            <button
              onClick={() => setFundOpen(true)}
              className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-800"
            >
              Fund wallet
            </button>
          </div>
        </div>

        {data?.best && (
          <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Best {asset} rate right now:{" "}
            <strong>
              {formatPct(data.best.apyNet)} on {data.best.market}
            </strong>{" "}
            ({data.best.protocol}, {data.best.chain}).
          </p>
        )}

        <div className="mt-4">
          <VaultCard
            asset={asset}
            apyNet={
              data?.quotes?.find((q) => q.protocol.toLowerCase().includes("jupiter"))
                ?.apyNet
            }
          />
        </div>

        <div className="mt-4">
          {loading && !data ? (
            <p className="text-sm text-slate-600">Loading live quotes…</p>
          ) : error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          ) : data ? (
            <YieldTable quotes={data.quotes} bestId={bestId} />
          ) : null}
        </div>

        {data?.errors && Object.keys(data.errors).length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <p className="font-medium">Some protocols were unavailable:</p>
            <ul className="mt-1 list-inside list-disc">
              {Object.entries(data.errors).map(([protocol, reason]) => (
                <li key={protocol}>
                  {protocol}: {reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <aside>
        <BalanceCard />
        <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4 text-xs leading-relaxed text-slate-600">
          Fund wallet uses Aurora Intents deposit addresses: you make a normal
          transfer from any chain and Intents routes it into your Solana
          wallet. Quotes marked “live” come from protocol APIs.
        </div>
      </aside>

      {fundOpen && (
        <DepositModal asset={asset} onClose={() => setFundOpen(false)} />
      )}
    </div>
  );
}
