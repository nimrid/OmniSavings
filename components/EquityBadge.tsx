"use client";

import React from "react";

interface EquityBadgeProps {
  symbol: string;
  size?: "sm" | "md" | "lg";
}

const BADGE_CONFIGS: Record<
  string,
  { label: string; bg: string; text: string; ring: string; border: string; sub?: string }
> = {
  SPYx: {
    label: "SPY",
    sub: "S&P 500",
    bg: "bg-blue-950 text-blue-200",
    text: "text-blue-100",
    ring: "ring-blue-500/30",
    border: "border-blue-700/50",
  },
  NVDAx: {
    label: "NVDA",
    sub: "AI Chip",
    bg: "bg-emerald-950 text-emerald-200",
    text: "text-emerald-100",
    ring: "ring-emerald-500/30",
    border: "border-emerald-700/50",
  },
  AAPLx: {
    label: "AAPL",
    sub: "Apple",
    bg: "bg-zinc-900 text-zinc-100",
    text: "text-white",
    ring: "ring-zinc-500/30",
    border: "border-zinc-700/50",
  },
  TSLAx: {
    label: "TSLA",
    sub: "Tesla",
    bg: "bg-rose-950 text-rose-200",
    text: "text-rose-100",
    ring: "ring-rose-500/30",
    border: "border-rose-700/50",
  },
  USDY: {
    label: "USDY",
    sub: "T-Bills",
    bg: "bg-amber-950 text-amber-200",
    text: "text-amber-100",
    ring: "ring-amber-500/30",
    border: "border-amber-700/50",
  },
  USDC: {
    label: "USDC",
    sub: "Circle",
    bg: "bg-sky-950 text-sky-200",
    text: "text-sky-100",
    ring: "ring-sky-500/30",
    border: "border-sky-700/50",
  },
  SOL: {
    label: "SOL",
    sub: "Solana",
    bg: "bg-purple-950 text-purple-200",
    text: "text-purple-100",
    ring: "ring-purple-500/30",
    border: "border-purple-700/50",
  },
};

export function EquityBadge({ symbol, size = "md" }: EquityBadgeProps) {
  const cfg = BADGE_CONFIGS[symbol] || {
    label: symbol.slice(0, 4).toUpperCase(),
    bg: "bg-slate-900 text-slate-100",
    text: "text-white",
    ring: "ring-slate-500/20",
    border: "border-slate-700/40",
  };

  const sizeClasses =
    size === "sm"
      ? "h-6 px-1.5 text-[10px] tracking-wider"
      : size === "lg"
      ? "h-10 px-3 text-xs tracking-wider"
      : "h-8 px-2 text-[11px] tracking-wider";

  return (
    <span
      className={`inline-flex items-center justify-center font-mono font-bold uppercase rounded-md border shadow-sm ring-1 select-none ${sizeClasses} ${cfg.bg} ${cfg.border} ${cfg.ring}`}
    >
      {cfg.label}
    </span>
  );
}
