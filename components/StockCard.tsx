"use client";

import type { StockRwaQuote } from "@/lib/backpack/types";
import { formatUsd } from "@/lib/utils/format";

interface StockCardProps {
  stock: StockRwaQuote;
  onTrade: (stock: StockRwaQuote) => void;
}

export function StockCard({ stock, onTrade }: StockCardProps) {
  const isPositive = stock.priceChangePercent >= 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
              {stock.ticker.slice(0, 3)}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm">
                  {stock.ticker}
                </span>
                <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-600">
                  {stock.category}
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate max-w-[170px]" title={stock.name}>
                {stock.name}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${
              isPositive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
            }`}
          >
            {isPositive ? "+" : ""}
            {stock.priceChangePercent.toFixed(2)}%
          </span>
        </div>

        {/* Price & Range */}
        <div className="mt-3.5 flex items-baseline justify-between border-t border-slate-100 pt-3">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Live Price</span>
            <span className="text-base font-bold text-slate-900 tabular-nums">
              {formatUsd(stock.price)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 block font-medium">24h Volume</span>
            <span className="text-xs font-semibold text-slate-600 tabular-nums">
              {formatUsd(stock.volumeUsd)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-2">
        <button
          onClick={() => onTrade(stock)}
          className="w-full rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white hover:bg-slate-800 shadow-sm transition-colors"
        >
          Buy / Sell {stock.ticker}
        </button>
      </div>
    </div>
  );
}
