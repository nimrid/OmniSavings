"use client";

import { useState, useEffect } from "react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import type { StockRwaQuote } from "@/lib/backpack/types";
import { formatUsd } from "@/lib/utils/format";

interface StockTradeModalProps {
  open: boolean;
  onClose: () => void;
  stock: StockRwaQuote | null;
  initialSide?: "buy" | "sell";
  maxSharesOwned?: number;
  onSuccess?: () => void;
}

interface ChartBar {
  time: string;
  close: number;
}

export function StockTradeModal({
  open,
  onClose,
  stock,
  initialSide = "buy",
  maxSharesOwned = 0,
  onSuccess,
}: StockTradeModalProps) {
  const { primaryWallet } = useConnectedWallets();

  const [side, setSide] = useState<"buy" | "sell">(initialSide);
  const [amountUsd, setAmountUsd] = useState("50");
  const [chartBars, setChartBars] = useState<ChartBar[]>([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderResult, setOrderResult] = useState<{ id: string; shares: number; totalUsd: number } | null>(null);

  useEffect(() => {
    setSide(initialSide);
    setError(null);
    setOrderResult(null);
    setAmountUsd("50");
  }, [initialSide, stock, open]);

  // Fetch 72-hour historical price chart from Backpack
  useEffect(() => {
    if (!open || !stock) return;
    setLoadingChart(true);
    fetch(`/api/stocks/chart?symbol=${encodeURIComponent(stock.symbol)}&interval=1h&days=3`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.bars) {
          setChartBars(data.bars.map((b: any) => ({ time: b.time, close: b.close })));
        }
      })
      .catch(() => {})
      .finally(() => setLoadingChart(false));
  }, [open, stock]);

  if (!open || !stock) return null;

  const numAmount = parseFloat(amountUsd) || 0;
  const estimatedShares = stock.price > 0 ? numAmount / stock.price : 0;
  const maxSellAmountUsd = (maxSharesOwned * stock.price).toFixed(2);

  const handleTrade = async () => {
    if (!primaryWallet?.address) {
      setError("Please connect your Solana wallet first.");
      return;
    }

    if (numAmount <= 0) {
      setError("Please enter a valid amount in USD.");
      return;
    }

    if (side === "sell" && maxSharesOwned > 0 && estimatedShares > maxSharesOwned * 1.01) {
      setError(`Cannot sell more shares than you hold (${maxSharesOwned.toFixed(4)} shares).`);
      return;
    }

    setSubmitting(true);
    setError(null);
    setOrderResult(null);

    try {
      const res = await fetch("/api/stocks/order", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user: primaryWallet.address,
          symbol: stock.symbol,
          ticker: stock.ticker,
          name: stock.name,
          side,
          amountUsd: numAmount,
          price: stock.price,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Trade failed: ${res.statusText}`);
      }

      const data = await res.json();
      setOrderResult({
        id: data.order.id,
        shares: data.order.shares,
        totalUsd: data.order.totalUsd,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute trade.");
    } finally {
      setSubmitting(false);
    }
  };

  // SVG Sparkline calculation
  const minPrice = chartBars.length > 0 ? Math.min(...chartBars.map((b) => b.close)) : stock.price * 0.98;
  const maxPrice = chartBars.length > 0 ? Math.max(...chartBars.map((b) => b.close)) : stock.price * 1.02;
  const priceRange = maxPrice - minPrice || 1;
  const svgWidth = 320;
  const svgHeight = 70;

  const points = chartBars
    .map((b, i) => {
      const x = (i / Math.max(1, chartBars.length - 1)) * svgWidth;
      const y = svgHeight - ((b.close - minPrice) / priceRange) * (svgHeight - 12) - 6;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const isPositive = stock.priceChangePercent >= 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white font-bold text-sm shadow">
              {stock.ticker.slice(0, 3)}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-base font-bold text-slate-900">{stock.name}</h3>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                  {stock.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Backpack RWA · {stock.symbol}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg"
          >
            ✕
          </button>
        </div>

        {/* Price & Chart Banner */}
        <div className="mt-3 rounded-xl bg-slate-50 p-3 border border-slate-100">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-xs text-slate-400 font-medium">Live Price (24/7)</span>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatUsd(stock.price)}
              </div>
            </div>
            <div className="text-right">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                  isPositive ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                }`}
              >
                {isPositive ? "+" : ""}
                {stock.priceChangePercent.toFixed(2)}%
              </span>
              <p className="text-[10px] text-slate-400 mt-0.5">Past 24 hours</p>
            </div>
          </div>

          {/* Mini Sparkline Chart */}
          <div className="mt-2 h-[70px] w-full flex items-center justify-center">
            {loadingChart ? (
              <span className="text-[11px] text-slate-400">Loading Backpack market chart…</span>
            ) : chartBars.length > 1 ? (
              <svg width="100%" height="70" viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
                <polyline
                  fill="none"
                  stroke={isPositive ? "#10b981" : "#ef4444"}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={points}
                />
              </svg>
            ) : (
              <span className="text-[11px] text-slate-400">Chart updating…</span>
            )}
          </div>
        </div>

        {/* Buy / Sell Tab Switcher */}
        <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setSide("buy")}
            className={`rounded-md py-1.5 text-xs font-bold transition-all ${
              side === "buy"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Buy {stock.ticker}
          </button>
          <button
            type="button"
            onClick={() => setSide("sell")}
            className={`rounded-md py-1.5 text-xs font-bold transition-all ${
              side === "sell"
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Sell {stock.ticker}
          </button>
        </div>

        {/* Trade Form */}
        <div className="mt-4 space-y-3">
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <label className="font-medium text-slate-700">Order Amount (USDC)</label>
              {side === "sell" && maxSharesOwned > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountUsd(maxSellAmountUsd)}
                  className="font-semibold text-emerald-700 hover:underline"
                >
                  Sell Max (${maxSellAmountUsd})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 text-sm">$</span>
              <input
                type="number"
                min="1"
                step="any"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                className="block w-full rounded-lg border border-slate-300 pl-7 pr-12 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
                placeholder="50"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
                USDC
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex gap-2">
            {["25", "50", "100", "250"].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmountUsd(preset)}
                className={`flex-1 rounded-md border py-1 text-xs font-medium transition-colors ${
                  amountUsd === preset
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>

          {/* Order Summary */}
          <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Estimated Shares:</span>
              <span className="font-semibold text-slate-900 font-mono">
                {estimatedShares > 0 ? estimatedShares.toFixed(4) : "0.0000"} {stock.ticker}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Execution Venue:</span>
              <span className="font-semibold text-slate-900">
                Backpack Exchange (24/7 RWA)
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Settlement Asset:</span>
              <span className="font-semibold text-slate-900">USDC (Solana)</span>
            </div>
          </div>

          {orderResult && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900">
              <p className="font-bold">✓ Order Filled Successfully!</p>
              <p className="text-[11px] mt-0.5">
                {side === "buy" ? "Purchased" : "Sold"}{" "}
                <span className="font-semibold font-mono">{orderResult.shares.toFixed(4)} {stock.ticker}</span> for{" "}
                <span className="font-semibold">${orderResult.totalUsd.toFixed(2)} USDC</span>. Order ID:{" "}
                <span className="font-mono text-[10px]">{orderResult.id}</span>
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            {orderResult ? "Close" : "Cancel"}
          </button>
          {!orderResult && (
            <button
              onClick={handleTrade}
              disabled={submitting || !primaryWallet}
              className={`rounded-lg px-4 py-2 text-xs font-bold text-white shadow-sm transition-colors ${
                side === "buy"
                  ? "bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  : "bg-slate-900 hover:bg-slate-800 disabled:opacity-50"
              }`}
            >
              {submitting
                ? "Submitting to Backpack…"
                : `${side === "buy" ? "Buy" : "Sell"} ${estimatedShares.toFixed(4)} ${stock.ticker}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
