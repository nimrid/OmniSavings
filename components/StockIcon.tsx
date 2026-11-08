"use client";

import React from "react";

interface StockIconProps {
  symbol: string;
  size?: number | string;
  className?: string;
}

export function StockIcon({ symbol, size = 28, className = "" }: StockIconProps) {
  const s = typeof size === "number" ? `${size}px` : size;
  const sym = symbol.toUpperCase().replace("X", ""); // handles SPYx -> SPY, NVDAx -> NVDA, etc.

  // 1. APPLE (AAPL / AAPLx) - Official Apple silhouette
  if (sym === "AAPL") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-black text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 170 170"
          width="60%"
          height="60%"
          fill="currentColor"
        >
          <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.73-7.87-12.08-14.36-5.99-8.91-10.79-19.12-14.42-30.63-3.62-11.51-5.44-22.39-5.44-32.63 0-14.88 3.73-27.13 11.2-36.75 7.46-9.62 17.06-14.56 28.78-14.81 5.09 0 10.84 1.34 17.26 4.02 6.42 2.68 10.42 4.06 12 4.06 1.48 0 5.48-1.37 12-4.11 6.53-2.74 12.09-4.04 16.69-3.9 12.98.63 23.36 5.68 31.13 15.15-11.41 6.9-17.01 16.3-16.8 28.2.22 9.4 3.86 17.23 10.92 23.51 7.07 6.28 15.44 9.87 25.13 10.76-2.12 6.55-4.67 13.06-7.65 19.53zM119.22 31.84c0-7.39 2.65-14.36 7.95-20.91 5.3-6.55 11.97-10.51 20.02-11.89.21 1.27.32 2.43.32 3.49 0 7.39-2.75 14.46-8.26 21.2-5.51 6.74-12.18 10.59-20.03 11.53z" />
        </svg>
      </div>
    );
  }

  // 2. TESLA (TSLA / TSLAx) - Official Tesla T-shield
  if (sym === "TSLA") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-[#E82127] text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          width="62%"
          height="62%"
          fill="currentColor"
        >
          <path d="M50 21.6c11.5 0 21.4 2.8 29.5 7.6l2.3-7.5C71.3 16.8 59.8 14 50 14s-21.3 2.8-31.8 7.7l2.3 7.5c8.1-4.8 18-7.6 29.5-7.6z" />
          <path d="M50 32.3c6.9 0 13.8 1.4 19.6 4l4.2-11.3C64.9 21.8 56.6 20 50 20s-14.9 1.8-23.8 5l4.2 11.3c5.8-2.6 12.7-4 19.6-4z" />
          <path d="M46.7 39.5v46.5h6.6V39.5c5.3.6 10.4 1.8 15.1 3.5l3.5-10.6c-7.3-2.6-15.6-4.1-25.2-4.1s-17.9 1.5-25.2 4.1l3.5 10.6c4.7-1.7 9.8-2.9 15.1-3.5z" />
        </svg>
      </div>
    );
  }

  // 3. NVIDIA (NVDA / NVDAx) - Official NVIDIA green claw
  if (sym === "NVDA") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-[#76B900] text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 128 128"
          width="65%"
          height="65%"
          fill="currentColor"
        >
          <path d="M64 24c-22.1 0-40 17.9-40 40 0 17.5 11.3 32.4 27.1 37.8-1.5-3.4-2.3-7.1-2.3-11 0-14.9 12.1-27 27-27 4.2 0 8.1 1 11.7 2.7V48.1c-3.7-.8-7.6-1.3-11.7-1.3-19.4 0-35.1 15.7-35.1 35.1 0 5.4 1.3 10.6 3.6 15.1C31.5 91 22 78.6 22 64c0-23.2 18.8-42 42-42 12.6 0 24 5.6 31.7 14.4l-7.3 6.3C83.3 27.6 74.2 24 64 24zm11.8 48.7c-3.5-1.7-7.4-2.7-11.8-2.7-11.6 0-21 9.4-21 21 0 3.8 1 7.4 2.8 10.5C40.6 97.4 37 90.1 37 82c0-14.9 12.1-27 27-27 3.6 0 7.1.7 10.2 2l1.6-4.3zm-11.8 7.3c6.6 0 12 5.4 12 12 0 6.6-5.4 12-12 12-6.6 0-12-5.4-12-12 0-6.6 5.4-12 12-12z" />
        </svg>
      </div>
    );
  }

  // 4. S&P 500 (SPY / SPYx) - Official S&P 500 red & navy index crest
  if (sym === "SPY") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-[#002855] text-white shrink-0 shadow-sm overflow-hidden border border-[#003875] ${className}`}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-[#D12630]" />
        <div className="flex flex-col items-center justify-center leading-none">
          <span className="font-sans font-black text-[10px] tracking-tight text-white">S&P</span>
          <span className="font-mono font-black text-[9px] text-[#D12630] -mt-0.5">500</span>
        </div>
      </div>
    );
  }

  // 5. ONDO USDY (USDY) - Official Ondo Finance geometric wave
  if (sym === "USDY") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-gradient-to-br from-amber-600 to-amber-900 text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          width="62%"
          height="62%"
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
        >
          <circle cx="50" cy="50" r="36" strokeOpacity="0.4" />
          <path d="M50 14 A 36 36 0 0 1 86 50 A 18 18 0 0 1 50 50 A 18 18 0 0 0 14 50 A 36 36 0 0 1 50 14" fill="currentColor" stroke="none" />
        </svg>
      </div>
    );
  }

  // 6. USDC - Official Circle USDC concentric rings
  if (sym === "USDC") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-[#2775CA] text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          width="65%"
          height="65%"
          fill="currentColor"
        >
          <path d="M50 10C27.9 10 10 27.9 10 50s17.9 40 40 40 40-17.9 40-40S72.1 10 50 10zm0 72c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" />
          <path d="M54.5 44.5c-4.5-1.2-6.5-2.2-6.5-4.5 0-2.2 1.8-3.8 5-3.8 3.2 0 5.2 1.2 6.8 3.2l5.5-4.5c-3-3.2-6.8-5-12.2-5.5V24h-6v5.2c-6.2.8-11 4.5-11 10.8 0 6.5 4.8 9.5 11.8 11.2 5.2 1.2 7.2 2.5 7.2 5 0 2.8-2.2 4.2-5.8 4.2-4.2 0-7-1.8-9-4.5l-5.8 4.5c3.2 4.2 8 6.5 14.5 7V72h6v-4.8c6.5-.8 11.8-4.5 11.8-11.2 0-6.8-4.5-10-11.8-11.5z" />
        </svg>
      </div>
    );
  }

  // 7. USDT - Official Tether green badge
  if (sym === "USDT") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-[#26A17B] text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          width="60%"
          height="60%"
          fill="currentColor"
        >
          <path d="M50 12C29 12 12 29 12 50s17 38 38 38 38-17 38-38-17-38-38-38zm16.5 35.5h-10v5.8c7.8.4 13.8 2 13.8 3.9 0 2.2-7.5 4-17.5 4s-17.5-1.8-17.5-4c0-1.9 6-3.5 13.8-3.9v-5.8h-10v-9.5h41v9.5z" />
          <path d="M47.2 59.8v17.5h5.5V59.8c8.5-.4 14.5-2.2 14.5-4.5v-3.5c-3 1.5-8.5 2.5-14.5 2.8v-7.2h-5.5v7.2c-6-.3-11.5-1.3-14.5-2.8v3.5c0 2.3 6 4.1 14.5 4.5z" />
        </svg>
      </div>
    );
  }

  // 8. SOLANA (SOL) - Official Solana 3 angled gradient stripes
  if (sym === "SOL") {
    return (
      <div
        style={{ width: s, height: s }}
        className={`relative flex items-center justify-center rounded-lg bg-black text-white shrink-0 shadow-sm ${className}`}
      >
        <svg
          viewBox="0 0 100 100"
          width="65%"
          height="65%"
          fill="none"
        >
          <defs>
            <linearGradient id="solanaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FFA3" />
              <stop offset="50%" stopColor="#DC1FFF" />
              <stop offset="100%" stopColor="#00FFA3" />
            </linearGradient>
          </defs>
          <path
            d="M20 74l12-14h56l-12 14H20z"
            fill="url(#solanaGrad)"
          />
          <path
            d="M20 44l12-14h56l-12 14H20z"
            fill="url(#solanaGrad)"
          />
          <path
            d="M32 26l-12 14h56l12-14H32z"
            fill="url(#solanaGrad)"
          />
        </svg>
      </div>
    );
  }

  // Fallback: Clean generic monogram badge
  return (
    <div
      style={{ width: s, height: s }}
      className={`relative flex items-center justify-center rounded-lg bg-slate-900 text-white font-mono font-bold text-xs shrink-0 shadow-sm ${className}`}
    >
      {symbol.slice(0, 3).toUpperCase()}
    </div>
  );
}
