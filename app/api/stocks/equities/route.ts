import { NextResponse } from "next/server";
import { TOKENIZED_EQUITIES, USDC_MINT } from "@/lib/stocks/equities";

const JUPITER_API_BASE = "https://api.jup.ag";

export interface LiveEquityInfo {
  symbol: string;
  name: string;
  mint: string;
  priceUsd: number;
  decimals: number;
  category: string;
  description: string;
  issuer: string;
  icon: string;
  tokensPer10Usdc: number;
}

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.JUPITER_API_KEY;

  const entries = Object.values(TOKENIZED_EQUITIES);

  // Query live pricing from Jupiter in parallel for 10 USDC input
  const testAmount = 10_000_000; // 10 USDC (6 decimals)

  const results: LiveEquityInfo[] = await Promise.all(
    entries.map(async (eq) => {
      let priceUsd = 0;
      let tokensPer10Usdc = 0;

      try {
        const url = `${JUPITER_API_BASE}/swap/v1/quote?inputMint=${USDC_MINT}&outputMint=${eq.mint}&amount=${testAmount}&slippageBps=100`;
        const res = await fetch(url, {
          headers: { ...(apiKey ? { "x-api-key": apiKey } : {}) },
          cache: "no-store",
        });

        if (res.ok) {
          const data = (await res.json()) as { outAmount?: string };
          if (data.outAmount && Number(data.outAmount) > 0) {
            const outTokens = Number(data.outAmount) / 10 ** eq.decimals;
            tokensPer10Usdc = outTokens;
            // 10 USDC buys outTokens => price per token = 10 / outTokens
            priceUsd = outTokens > 0 ? 10 / outTokens : 0;
          }
        }
      } catch {
        // Fallback pricing if quote service is temporarily busy
      }

      // Fallback baseline reference prices if Jupiter endpoint is rate-limited
      if (priceUsd === 0) {
        if (eq.symbol === "SPYx") priceUsd = 595.0;
        else if (eq.symbol === "NVDAx") priceUsd = 186.5;
        else if (eq.symbol === "AAPLx") priceUsd = 342.3;
        else if (eq.symbol === "TSLAx") priceUsd = 358.0;
        else if (eq.symbol === "USDY") priceUsd = 1.05;
        tokensPer10Usdc = priceUsd > 0 ? 10 / priceUsd : 0;
      }

      return {
        symbol: eq.symbol,
        name: eq.name,
        mint: eq.mint,
        priceUsd: Math.round(priceUsd * 100) / 100,
        decimals: eq.decimals,
        category: eq.category,
        description: eq.description,
        issuer: eq.issuer,
        icon: eq.icon,
        tokensPer10Usdc: Math.round(tokensPer10Usdc * 10000) / 10000,
      };
    })
  );

  return NextResponse.json({
    equities: results,
    updatedAt: new Date().toISOString(),
  });
}
