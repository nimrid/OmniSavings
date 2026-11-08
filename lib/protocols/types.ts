export type ProtocolId = "lulo" | "jupiter";
export type ChainId = "solana";

export interface YieldQuote {
  protocol: ProtocolId;
  chain: ChainId;
  /** Underlying asset symbol, e.g. 'USDC'. */
  asset: string;
  /** Human label, e.g. 'Gauntlet USDC' or 'Jupiter Earn jlUSDC'. */
  market: string;
  /** Vault address / market id used for deposit routing. */
  marketId: string;
  /** Percent units: 4.25 means 4.25%. */
  apyNet: number;
  apyBase: number;
  apyReward: number;
  tvlUsd: number | null;
  /** 1 (safest) - 5 (riskiest). Heuristic until a risk model lands. */
  riskScore: number;
  updatedAt: string;
  source: "live" | "mock";
}

export interface AggregatedAPY {
  asset: string;
  best: YieldQuote | null;
  quotes: YieldQuote[];
  /** Per-protocol failure reasons; a protocol missing here with no quote means no market found. */
  errors?: Partial<Record<ProtocolId, string>>;
}

export interface ProtocolAdapter {
  id: ProtocolId;
  fetchQuotes(asset: string): Promise<YieldQuote[]>;
}
