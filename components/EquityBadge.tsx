"use client";

import React from "react";
import { StockIcon } from "./StockIcon";

interface EquityBadgeProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export function EquityBadge({ symbol, size = "md", showLabel = false }: EquityBadgeProps) {
  const pixelSize = size === "sm" ? 22 : size === "lg" ? 36 : 28;

  return (
    <div className="inline-flex items-center gap-2 shrink-0">
      <StockIcon symbol={symbol} size={pixelSize} />
      {showLabel && (
        <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">
          {symbol}
        </span>
      )}
    </div>
  );
}
