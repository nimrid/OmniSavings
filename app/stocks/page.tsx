"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { StockCard } from "@/components/StockCard";
import { StockTradeModal } from "@/components/StockTradeModal";
import { YieldToEquityCard } from "@/components/YieldToEquityCard";
import type { StockRwaQuote } from "@/lib/backpack/types";
import { formatUsd } from "@/lib/utils/format";

interface StockPosition {
  symbol: string;
  ticker: string;
  name: string;
  shares: number;
  avgCostUsd: number;
  totalCostUsd: number;
  currentPrice: number;
  currentValueUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPct: number;
  updatedAt: string;
}

interface StockOrder {
  id: string;
  symbol: string;
  ticker: string;
  side: "buy" | "sell";
  shares: number;
  priceUsd: number;
  totalUsd: number;
  timestamp: string;
}

export default function StocksPage() {
  const { primaryWallet } = useConnectedWallets();

  const [quotes, setQuotes] = useState<StockRwaQuote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(true);
  const [filterCategory, setFilterCategory] = useState<"ALL" | "STOCK" | "INDEX">("ALL");

  // User portfolio
  const [positions, setPositions] = useState<StockPosition[]>([]);
  const [orders, setOrders] = useState<StockOrder[]>([]);
  const [totalPortfolioValue, setTotalPortfolioValue] = useState(0);
  const [totalPnlUsd, setTotalPnlUsd] = useState(0);
  const [totalPnlPct, setTotalPnlPct] = useState(0);

  // Active trade modal state
  const [tradeModalOpen, setTradeModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockRwaQuote | null>(null);
  const [tradeSide, setTradeSide] = useState<"buy" | "sell">("buy");

  // Fetch live Backpack quotes
  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks/quotes");
      if (res.ok) {
        const data = await res.json();
        setQuotes(data.quotes || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  // Fetch user holdings and order history
  const fetchPortfolio = useCallback(async () => {
    if (!primaryWallet?.address) return;
    try {
      const res = await fetch(`/api/stocks/order?user=${primaryWallet.address}`);
      if (res.ok) {
        const data = await res.json();
        setPositions(data.positions || []);
        setOrders(data.orders || []);
        setTotalPortfolioValue(data.totalPortfolioValueUsd || 0);
        setTotalPnlUsd(data.totalPnlUsd || 0);
        setTotalPnlPct(data.totalPnlPct || 0);
      }
    } catch {
      // ignore
    }
  }, [primaryWallet?.address]);

  useEffect(() => {
    void fetchQuotes();
    const interval = setInterval(fetchQuotes, 15000); // refresh prices every 15s
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  useEffect(() => {
    void fetchPortfolio();
  }, [fetchPortfolio]);

  const handleOpenTrade = (stock: StockRwaQuote, side: "buy" | "sell" = "buy") => {
    setSelectedStock(stock);
    setTradeSide(side);
    setTradeModalOpen(true);
  };

  const filteredQuotes = quotes.filter((q) => {
    if (filterCategory === "STOCK") return q.category === "Stock";
    if (filterCategory === "INDEX") return q.category === "Index";
    return true;
  });

  const selectedStockPosition = positions.find((p) => p.symbol === selectedStock?.symbol);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">
              Stock RWAs & Equities
            </h1>
            <span className="rounded-full bg-slate-900 text-white px-2.5 py-0.5 text-xs font-semibold">
              Powered by Backpack Exchange
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Trade tokenized US stocks & index ETFs 24/7 on Solana with USDC settlement.
          </p>
        </div>

        {/* Portfolio Mini Card */}
        {primaryWallet && (
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm">
            <div>
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                Equities Portfolio
              </span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {formatUsd(totalPortfolioValue)}
              </span>
            </div>

            <div className="border-l border-slate-100 pl-3">
              <span className="text-[10px] font-medium text-slate-400 block uppercase tracking-wider">
                Unrealized Return
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  totalPnlUsd >= 0 ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {totalPnlUsd >= 0 ? "+" : ""}
                {formatUsd(totalPnlUsd)} ({totalPnlPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Yield-to-Equity Auto-Invest Feature */}
      <YieldToEquityCard />

      {/* Stock Market Watchlist Header & Filters */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              24/7 Stock & Index Markets
            </h2>
            <p className="text-xs text-slate-500">
              Real-time quotes with fractional USDC trading via Backpack orderbook.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
            <button
              onClick={() => setFilterCategory("ALL")}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterCategory === "ALL"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Assets ({quotes.length})
            </button>
            <button
              onClick={() => setFilterCategory("STOCK")}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterCategory === "STOCK"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tech Equities
            </button>
            <button
              onClick={() => setFilterCategory("INDEX")}
              className={`rounded-md px-3 py-1 font-semibold transition-all ${
                filterCategory === "INDEX"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Index ETFs (SPY / QQQ)
            </button>
          </div>
        </div>

        {/* Stock Grid */}
        {loadingQuotes ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading live Backpack stock quotes…
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            No stock quotes found for this filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredQuotes.map((stock) => (
              <StockCard
                key={stock.symbol}
                stock={stock}
                onTrade={(s) => handleOpenTrade(s, "buy")}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Stock Holdings Section */}
      {primaryWallet && positions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Your Equity Holdings</h2>
            <span className="text-xs text-slate-500 font-medium">
              {positions.length} active {positions.length === 1 ? "position" : "positions"}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3">Asset</th>
                  <th className="px-4 py-3 text-right">Shares</th>
                  <th className="px-4 py-3 text-right">Avg Cost</th>
                  <th className="px-4 py-3 text-right">Current Price</th>
                  <th className="px-4 py-3 text-right">Market Value</th>
                  <th className="px-4 py-3 text-right">P&L</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {positions.map((pos) => {
                  const isPositive = pos.unrealizedPnlUsd >= 0;
                  const matchingQuote = quotes.find((q) => q.symbol === pos.symbol);
                  return (
                    <tr key={pos.symbol} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 text-white font-bold text-[10px]">
                            {pos.ticker.slice(0, 3)}
                          </span>
                          <div>
                            <span className="block">{pos.ticker}</span>
                            <span className="text-[11px] text-slate-400 font-normal">{pos.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">
                        {pos.shares.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        {formatUsd(pos.avgCostUsd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-900 font-semibold">
                        {formatUsd(pos.currentPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatUsd(pos.currentValueUsd)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold">
                        <span className={isPositive ? "text-emerald-700" : "text-red-700"}>
                          {isPositive ? "+" : ""}
                          {formatUsd(pos.unrealizedPnlUsd)} ({pos.unrealizedPnlPct.toFixed(2)}%)
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center gap-1.5">
                          <button
                            onClick={() => matchingQuote && handleOpenTrade(matchingQuote, "buy")}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                          >
                            Buy More
                          </button>
                          <button
                            onClick={() => matchingQuote && handleOpenTrade(matchingQuote, "sell")}
                            className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm"
                          >
                            Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      <StockTradeModal
        open={tradeModalOpen}
        onClose={() => setTradeModalOpen(false)}
        stock={selectedStock}
        initialSide={tradeSide}
        maxSharesOwned={selectedStockPosition?.shares ?? 0}
        onSuccess={() => {
          void fetchPortfolio();
        }}
      />
    </div>
  );
}
