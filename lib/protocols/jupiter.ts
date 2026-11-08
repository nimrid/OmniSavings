import type { ProtocolAdapter, YieldQuote } from "./types";

const EARN_URL = "https://api.jup.ag/lend/v1/earn/tokens";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
const MINTS: Record<string, string> = { USDC: USDC_MINT, USDT: USDT_MINT };

interface EarnToken {
  symbol?: string;
  assetAddress?: string;
  asset?: { price?: number | string; decimals?: number | string };
  totalAssets?: number | string;
  totalSupply?: number | string;
  /** Basis points, verified live (e.g. "481" = 4.81%). */
  supplyRate?: number | string;
  rewardsRate?: number | string;
  totalRate?: number | string;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
    return Number(v);
  return null;
}

async function fetchTokens(): Promise<EarnToken[]> {
  // Verified live: the earn/tokens endpoint serves reads without an API key;
  // JUPITER_API_KEY (when set) only raises rate limits.
  const apiKey = process.env.JUPITER_API_KEY;
  const res = await fetch(EARN_URL, {
    headers: apiKey ? { "x-api-key": apiKey } : {},
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Jupiter earn endpoint failed with HTTP ${res.status}`);
  }
  const payload: unknown = await res.json();
  if (Array.isArray(payload)) return payload as EarnToken[];
  if (payload != null && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    for (const key of ["tokens", "data", "markets"]) {
      if (Array.isArray(root[key])) return root[key] as EarnToken[];
    }
  }
  throw new Error("Jupiter earn response shape unrecognized");
}

export const jupiterAdapter: ProtocolAdapter = {
  id: "jupiter",
  async fetchQuotes(asset: string): Promise<YieldQuote[]> {
    const mint = MINTS[asset.toUpperCase()];
    if (!mint) return [];
    const tokens = await fetchTokens();
    const match = tokens.find(
      (t) =>
        typeof t.assetAddress === "string" &&
        t.assetAddress.toLowerCase() === mint.toLowerCase()
    );
    if (!match) return [];
    const total = num(match.totalRate);
    if (total === null) {
      throw new Error("Jupiter earn token missing totalRate");
    }
    const supply = num(match.supplyRate) ?? total;
    const rewards = num(match.rewardsRate) ?? Math.max(0, total - supply);
    // totalAssets is in underlying base units; scale by the underlying
    // asset decimals (USDC/USDT: 6) before applying the USD price.
    const assets = num(match.totalAssets);
    const price = num(match.asset?.price);
    const decimalsRaw = num(match.asset?.decimals);
    const decimals = decimalsRaw !== null ? Math.round(decimalsRaw) : 6;
    const tvlUsd =
      assets !== null && price !== null
        ? (assets / 10 ** decimals) * price
        : null;
    const now = new Date().toISOString();
    return [
      {
        protocol: "jupiter",
        chain: "solana",
        asset: asset.toUpperCase(),
        market: `Jupiter Earn ${match.symbol ?? "jlToken"}`,
        marketId: match.assetAddress ?? mint,
        apyNet: total / 100,
        apyBase: supply / 100,
        apyReward: rewards / 100,
        tvlUsd,
        riskScore: 2,
        updatedAt: now,
        source: "live",
      },
    ];
  },
};
