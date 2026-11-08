"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { YieldToEquityCard } from "@/components/YieldToEquityCard";
import { shortenAddress } from "@/lib/utils/format";

interface HoldingItem {
  symbol: string;
  name: string;
  mint: string;
  shares: number;
  category: string;
  icon: string;
}

export default function InvestPage() {
  const { primaryWallet } = useConnectedWallets();
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(false);

  const fetchHoldings = useCallback(async () => {
    if (!primaryWallet?.address) {
      setHoldings([]);
      return;
    }
    setLoadingHoldings(true);
    try {
      const res = await fetch(`/api/stocks/holdings?user=${primaryWallet.address}`);
      if (res.ok) {
        const data = (await res.json()) as { holdings: HoldingItem[] };
        setHoldings(data.holdings);
      }
    } catch {
      // ignore
    } finally {
      setLoadingHoldings(false);
    }
  }, [primaryWallet?.address]);

  useEffect(() => {
    void fetchHoldings();
  }, [fetchHoldings]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                DeFi + TradFi Super-App
              </span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-800">
                Solana Mainnet
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Yield-to-Equity Auto-Invest
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Build a real US stock & S&P 500 portfolio using <span className="font-semibold text-slate-900">pure passive yield</span>. Your principal savings stays 100% protected in our on-chain Jupiter CPI Vault and Lulo.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            ← Back to Savings Vaults
          </Link>
        </div>
      </div>

      {/* Main Interactive Yield-to-Equity Card */}
      <YieldToEquityCard />

      {/* Real On-Chain Equity Holdings in User Wallet */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Your Real On-Chain Equity Holdings
            </h3>
            <p className="text-xs text-slate-500">
              Verified SPL token balances held directly in your Solana wallet
            </p>
          </div>
          <button
            onClick={() => void fetchHoldings()}
            disabled={loadingHoldings || !primaryWallet}
            className="text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 font-medium"
          >
            {loadingHoldings ? "Refreshing…" : "↻ Refresh On-Chain"}
          </button>
        </div>

        {!primaryWallet ? (
          <p className="text-xs text-slate-500 py-3">
            Connect your Solana wallet to view your real on-chain tokenized equity holdings.
          </p>
        ) : holdings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-xs text-slate-500">
            <p className="font-medium text-slate-700">No tokenized equity tokens in wallet yet.</p>
            <p className="mt-1">
              Deploy your accrued interest above to receive real tokenized S&P 500 (`SPYx`), NVIDIA (`NVDAx`), or Apple (`AAPLx`) shares directly into your wallet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                  <th className="py-2.5 px-3 font-semibold">Asset</th>
                  <th className="py-2.5 px-3 font-semibold">Category</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Shares Held</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Mint Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {holdings.map((h) => (
                  <tr key={h.mint} className="hover:bg-slate-50/60">
                    <td className="py-2.5 px-3 font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{h.icon}</span>
                      <span>{h.symbol}</span>
                      <span className="font-normal text-slate-500">({h.name})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{h.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold tabular-nums text-emerald-700">
                      {h.shares.toFixed(6)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-[11px]">
                      <a
                        href={`https://solscan.io/token/${h.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                        title={h.mint}
                      >
                        {shortenAddress(h.mint, 4)} ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How It Works Explainer */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold mb-2">
            1
          </div>
          <h4 className="font-bold text-slate-900">Protected Principal</h4>
          <p className="mt-1 text-slate-500 leading-relaxed">
            Your initial deposit stays 100% intact in the Anchor Jupiter Lend CPI Vault or Lulo Protected, generating 4.79% – 5.15% APY without stock market drawdown risk.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold mb-2">
            2
          </div>
          <h4 className="font-bold text-slate-900">Real On-Chain Swaps</h4>
          <p className="mt-1 text-slate-500 leading-relaxed">
            Accrued interest is routed via Jupiter DEX directly into verified Token-2022 equities (xStocks issued by Backed Finance) backed 1:1 by real US stocks.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-xs">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-700 font-bold mb-2">
            3
          </div>
          <h4 className="font-bold text-slate-900">Self-Custodial Assets</h4>
          <p className="mt-1 text-slate-500 leading-relaxed">
            Zero paper trading or synthetic IOUs. Stock tokens land in your Privy Solana wallet, can be transferred anytime, or swapped back to USDC on Jupiter 24/7.
          </p>
        </div>
      </div>
    </div>
  );
}
