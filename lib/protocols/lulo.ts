import type { ProtocolAdapter, YieldQuote } from "./types";

const LULO_API_BASE = "https://api.lulo.fi";

/**
 * Live shape of GET /v1/rates.getRates (verified with a real key):
 *   { regular: { CURRENT, "1HR", "24HR", "7DAY", "30DAY", "1YR" },
 *     protected: { CURRENT, ... } }
 * Values are already in percent (e.g. 7.52 means 7.52%). The endpoint exposes
 * a single asset and ignores asset/mint selectors, so Lulo is USDC-only until
 * Lulo documents a per-asset endpoint. "regular" is Lulo's flexible savings
 * rate, "protected" the principal-protected rate.
 */
interface LuloRatesPayload {
  regular?: { CURRENT?: number };
  protected?: { CURRENT?: number };
}

function pct(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)))
    return Number(v);
  return null;
}

export const luloAdapter: ProtocolAdapter = {
  id: "lulo",
  async fetchQuotes(asset: string): Promise<YieldQuote[]> {
    if (asset.toUpperCase() !== "USDC") return [];
    const apiKey = process.env.LULO_API_KEY;
    if (!apiKey) {
      throw new Error(
        "LULO_API_KEY is not set; live Lulo quotes need a key from dev.lulo.fi"
      );
    }

    const res = await fetch(`${LULO_API_BASE}/v1/rates.getRates`, {
      headers: { "x-api-key": apiKey },
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`Lulo rates.getRates failed with HTTP ${res.status}`);
    }
    const payload = (await res.json()) as LuloRatesPayload;
    const regular = pct(payload.regular?.CURRENT);
    const prot = pct(payload.protected?.CURRENT);
    if (regular === null && prot === null) {
      throw new Error(
        "Lulo rates.getRates response missing regular/protected CURRENT rates"
      );
    }
    const now = new Date().toISOString();
    const quotes: YieldQuote[] = [];
    if (regular !== null) {
      quotes.push({
        protocol: "lulo",
        chain: "solana",
        asset: "USDC",
        market: "Lulo Regular",
        marketId: "lulo-regular-usdc",
        apyNet: regular,
        apyBase: regular,
        apyReward: 0,
        tvlUsd: null,
        riskScore: 2,
        updatedAt: now,
        source: "live",
      });
    }
    if (prot !== null) {
      quotes.push({
        protocol: "lulo",
        chain: "solana",
        asset: "USDC",
        market: "Lulo Protected",
        marketId: "lulo-protected-usdc",
        apyNet: prot,
        apyBase: prot,
        apyReward: 0,
        tvlUsd: null,
        riskScore: 1,
        updatedAt: now,
        source: "live",
      });
    }
    return quotes;
  },
};
