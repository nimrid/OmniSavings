"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  Building2,
  RefreshCw,
  ExternalLink,
  Wallet,
  Lock,
  Layers,
} from "lucide-react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { YieldToEquityCard } from "@/components/YieldToEquityCard";
import { StockIcon } from "@/components/StockIcon";
import { shortenAddress } from "@/lib/utils/format";

interface HoldingItem {
  symbol: string;
  name: string;
  mint: string;
  shares: number;
  category: string;
  issuer?: string;
  tokenStandard?: string;
}

interface TickerPrice {
  symbol: string;
  priceUsd: number;
  category: string;
}

export default function InvestPage() {
  const { primaryWallet } = useConnectedWallets();
  const [holdings, setHoldings] = useState<HoldingItem[]>([]);
  const [loadingHoldings, setLoadingHoldings] = useState(false);
  const [tickerPrices, setTickerPrices] = useState<TickerPrice[]>([]);

  // Load ticker reference prices
  useEffect(() => {
    async function loadPrices() {
      try {
        const res = await fetch("/api/stocks/equities");
        if (res.ok) {
          const data = (await res.json()) as { equities: { symbol: string; priceUsd: number; category: string }[] };
          setTickerPrices(
            data.equities.map((e) => ({
              symbol: e.symbol,
              priceUsd: e.priceUsd,
              category: e.category,
            }))
          );
        }
      } catch {
        // ignore
      }
    }
    void loadPrices();
  }, []);

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

  // Compute total portfolio value in USD
  const totalValueUsd = holdings.reduce((sum, h) => {
    const p = tickerPrices.find((tp) => tp.symbol === h.symbol)?.priceUsd ?? 0;
    return sum + h.shares * p;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Real-Time Ticker Ribbon (Mobile Touch Scrollable) */}
      <div className="w-full rounded-xl border border-slate-200 bg-slate-900 text-white px-3 sm:px-4 py-2.5 shadow-sm overflow-x-auto scrollbar-none">
        <div className="flex items-center justify-between min-w-[580px] sm:min-w-[680px] gap-4 sm:gap-6 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-400 font-sans text-[11px] uppercase tracking-wider font-semibold shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Solana RWA Equities</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 divide-x divide-slate-800">
            {tickerPrices.map((t) => (
              <div key={t.symbol} className="flex items-center gap-2 pl-3 sm:pl-4 first:pl-0">
                <StockIcon symbol={t.symbol} size={18} />
                <span className="font-bold text-slate-200">{t.symbol}</span>
                <span className="text-emerald-400 font-semibold tabular-nums">
                  ${t.priceUsd > 0 ? t.priceUsd.toFixed(2) : "…"}
                </span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-400 font-sans shrink-0 hidden sm:block">
            Route: Jupiter V6
          </div>
        </div>
      </div>

      {/* Institutional Header Card */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-slate-800">
                DeFi + TradFi Convergence
              </span>
              <span className="rounded border border-indigo-200 bg-indigo-50 px-2 py-0.5 font-mono text-[10px] sm:text-[11px] font-semibold text-indigo-700">
                Anchor CPI + Jupiter V6
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl font-sans">
              Yield-to-Equity Terminal
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Accumulate real S&P 500, NVIDIA, Apple, and US Treasuries directly on Solana using
              passive savings interest. Your core principal remains protected in your on-chain Jupiter Earn CPI Vault and Lulo.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="self-start inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors shadow-2xs font-mono"
          >
            <span>← Savings Dashboard</span>
          </Link>
        </div>

        {/* Telemetry Strip */}
        <div className="mt-5 grid grid-cols-2 gap-2 sm:gap-3 sm:grid-cols-4 border-t border-slate-100 pt-4 text-xs font-mono">
          <div className="rounded-lg bg-slate-50 p-2 sm:p-2.5 border border-slate-200">
            <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
              Principal Risk
            </span>
            <span className="font-semibold text-emerald-700 flex items-center gap-1 mt-0.5 text-[11px] sm:text-xs font-sans">
              <Lock className="h-3 w-3 text-emerald-600" />
              0.00% (Yield Only)
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 sm:p-2.5 border border-slate-200">
            <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
              Equity Standard
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block truncate text-[11px] sm:text-xs">
              Token-2022 (xStocks)
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 sm:p-2.5 border border-slate-200">
            <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
              Custody Backing
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block truncate text-[11px] sm:text-xs font-sans">
              1:1 Swiss Trust
            </span>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 sm:p-2.5 border border-slate-200">
            <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
              Settlement Protocol
            </span>
            <span className="font-semibold text-slate-800 mt-0.5 block truncate text-[11px] sm:text-xs">
              Jupiter Swap V6
            </span>
          </div>
        </div>
      </div>

      {/* Main Execution Terminal */}
      <YieldToEquityCard />

      {/* Verified On-Chain Holdings (Responsive: Card on Mobile, Table on Desktop) */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2 font-sans">
              <Building2 className="h-4 w-4 text-slate-700" />
              <span>Self-Custodial Equity Portfolio</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5 font-sans">
              Verifiable Token-2022 and SPL token accounts held directly in your Solana wallet
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 font-mono">
            {holdings.length > 0 && (
              <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs">
                <span className="text-slate-500 hidden sm:inline">Portfolio Value: </span>
                <span className="font-bold text-slate-900 tabular-nums">
                  ${totalValueUsd.toFixed(2)} USD
                </span>
              </div>
            )}
            <button
              onClick={() => void fetchHoldings()}
              disabled={loadingHoldings || !primaryWallet}
              className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
            >
              <RefreshCw className={`h-3 w-3 ${loadingHoldings ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {!primaryWallet ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 sm:p-8 text-center text-xs text-slate-500 space-y-2">
            <Wallet className="h-6 w-6 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700">No Solana wallet connected.</p>
            <p className="max-w-md mx-auto text-slate-500">
              Connect your embedded or external Solana wallet above to view your real on-chain tokenized equity balances.
            </p>
          </div>
        ) : holdings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 p-6 sm:p-8 text-center text-xs text-slate-500 space-y-2">
            <Building2 className="h-6 w-6 text-slate-400 mx-auto" />
            <p className="font-medium text-slate-700">No tokenized equity tokens in this wallet yet.</p>
            <p className="max-w-md mx-auto text-slate-500">
              Deploy your accrued interest above to receive real tokenized S&P 500 (SPYx), NVIDIA (NVDAx), or Apple (AAPLx) shares directly into your wallet.
            </p>
          </div>
        ) : (
          <>
            {/* MOBILE HOLDINGS VIEW (< 768px) */}
            <div className="block md:hidden space-y-2.5 font-mono">
              {holdings.map((h) => {
                const spotPrice = tickerPrices.find((tp) => tp.symbol === h.symbol)?.priceUsd ?? 0;
                const itemValue = h.shares * spotPrice;
                return (
                  <div
                    key={h.mint}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <StockIcon symbol={h.symbol} size={28} />
                        <div>
                          <div className="font-bold text-slate-900 font-mono text-xs">
                            {h.symbol}
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            {h.name}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-700 text-xs tabular-nums">
                          ${itemValue.toFixed(2)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {h.shares.toFixed(4)} shares
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="text-slate-400">
                        {h.tokenStandard || "Token-2022"}
                      </span>
                      <a
                        href={`https://solscan.io/token/${h.mint}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-bold"
                      >
                        <span>{shortenAddress(h.mint, 4)}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* DESKTOP HOLDINGS VIEW (>= 768px) */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/90 bg-white shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/70 font-mono text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 font-semibold">Instrument</th>
                    <th className="py-2.5 px-3 font-semibold">Issuer / Standard</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Shares Held</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Spot Price</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Value (USD)</th>
                    <th className="py-2.5 px-3 font-semibold text-right">On-Chain Mint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {holdings.map((h) => {
                    const spotPrice = tickerPrices.find((tp) => tp.symbol === h.symbol)?.priceUsd ?? 0;
                    const itemValue = h.shares * spotPrice;
                    return (
                      <tr key={h.mint} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5 font-sans">
                            <StockIcon symbol={h.symbol} size={24} />
                            <div>
                              <div className="font-bold text-slate-900 font-mono">{h.symbol}</div>
                              <div className="text-[11px] text-slate-500">{h.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-sans text-slate-600">
                          <div className="text-[11px] font-medium text-slate-800">
                            {h.issuer || "Backed Finance"}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {h.tokenStandard || "Token-2022"}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-900">
                          {h.shares.toFixed(6)}
                        </td>
                        <td className="py-3 px-3 text-right tabular-nums text-slate-600">
                          ${spotPrice > 0 ? spotPrice.toFixed(2) : "…"}
                        </td>
                        <td className="py-3 px-3 text-right font-bold tabular-nums text-emerald-700">
                          ${itemValue.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <a
                            href={`https://solscan.io/token/${h.mint}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-[11px] font-bold"
                            title={h.mint}
                          >
                            <span>{shortenAddress(h.mint, 4)}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Institutional Architecture & Security Model */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2 font-sans">
          <Layers className="h-4 w-4 text-slate-700" />
          <span>Institutional Architecture & Settlement Guarantees</span>
        </h3>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3 text-xs">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-700 font-semibold font-sans">
              <ShieldCheck className="h-4 w-4" />
              <span>1. Zero Principal Risk</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Core deposits remain in the Anchor Jupiter Lend CPI Vault or Lulo Protected Savings, compounding at 4.79% – 5.15% APY without stock market drawdown exposure.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold font-sans">
              <TrendingUp className="h-4 w-4" />
              <span>2. Regulated Token-2022 Equities</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Accrued interest is routed via Jupiter V6 into xStocks issued by Backed Finance (Switzerland) and Ondo Finance. Each token is 100% physically backed by shares in bank custody.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
            <div className="flex items-center gap-2 text-slate-900 font-semibold font-sans">
              <Wallet className="h-4 w-4" />
              <span>3. 24/7 Self-Custody & Liquidity</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Zero synthetic IOUs or locked brokerage accounts. Stock tokens land in your Privy Solana wallet, can be transferred anytime, or liquidated back to USDC via Jupiter DEX around the clock.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
