import type { IntentsToken } from "./types";

/**
 * Aurora Intents Deposits API client (server-side).
 * Docs: https://docs.intents.aurora.dev/intents-deposits/quickstart/api-integration
 * Flow: GET /api/tokens -> POST /api/quote -> user transfer -> GET /api/transactions.
 */
const BASE_URL = "https://intents-api.aurora.dev";

export type SwapType = "EXACT_INPUT" | "EXACT_OUTPUT";
export type DepositType = "ORIGIN_CHAIN" | "INTENTS";
export type RecipientType =
  | "ORIGIN_CHAIN"
  | "DESTINATION_CHAIN"
  | "INTENTS"
  | "CONFIDENTIAL_INTENTS";

export type IntentsTxStatus =
  | "PENDING_DEPOSIT"
  | "KNOWN_DEPOSIT_TX"
  | "PROCESSING"
  | "SUCCESS"
  | "INCOMPLETE_DEPOSIT"
  | "REFUNDED"
  | "FAILED";

export interface QuoteRequest {
  /** If true, validates without creating a deposit address (preview mode). */
  dry?: boolean;
  swapType: SwapType;
  /** Slippage tolerance in basis points (100 = 1%). */
  slippageTolerance: number;
  originAsset: string;
  depositType: DepositType;
  destinationAsset: string;
  /** Amount in smallest units (base-unit string of origin asset). */
  amount: string;
  recipient: string;
  recipientType: RecipientType;
  refundTo: string;
  refundType: RecipientType;
  deadline: string;
}

export interface QuoteData {
  timeEstimate?: number;
  depositAddress?: string;
  depositMemo?: string | null;
  amountIn?: string;
  amountInFormatted?: string;
  amountInUsd?: string;
  minAmountIn?: string;
  amountOut?: string;
  amountOutFormatted?: string;
  amountOutUsd?: string;
  minAmountOut?: string;
  refundFee?: string;
  withdrawFee?: string;
  deadline?: string;
  [key: string]: unknown;
}

export interface QuoteResponse {
  timestamp?: string;
  signature?: string;
  correlationId?: string;
  quote?: QuoteData;
  depositAddress?: string;
  depositMemo?: string | null;
  [key: string]: unknown;
}

export interface IntentsTransaction {
  originAsset?: string;
  destinationAsset?: string;
  depositAddress?: string;
  depositMemo?: string | null;
  recipient?: string;
  status?: IntentsTxStatus | string;
  amountInFormatted?: string;
  amountOutFormatted?: string;
  refundTo?: string;
  nearTxHashes?: string[];
  originChainTxHashes?: string[];
  destinationChainTxHashes?: string[];
  [key: string]: unknown;
}

function apiKey(): string {
  const key = process.env.INTENTS_API_KEY;
  if (!key) throw new Error("INTENTS_API_KEY is not set");
  return key;
}

// In-memory cache for supported tokens (5 minute TTL)
let cachedTokens: IntentsToken[] | null = null;
let tokensCachedAt = 0;
const TOKENS_CACHE_TTL_MS = 5 * 60 * 1000;

export async function getTokens(): Promise<IntentsToken[]> {
  const now = Date.now();
  if (cachedTokens && now - tokensCachedAt < TOKENS_CACHE_TTL_MS) {
    return cachedTokens;
  }

  const res = await fetch(`${BASE_URL}/api/tokens/${apiKey()}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Intents /tokens failed with HTTP ${res.status}`);
  }
  const payload: unknown = await res.json();
  let tokens: IntentsToken[] = [];
  if (Array.isArray(payload)) {
    tokens = payload as IntentsToken[];
  } else if (payload != null && typeof payload === "object") {
    const obj = payload as { tokens?: IntentsToken[] };
    if (Array.isArray(obj.tokens)) {
      tokens = obj.tokens;
    }
  }

  cachedTokens = tokens;
  tokensCachedAt = now;
  return tokens;
}

export async function createQuote(req: QuoteRequest): Promise<QuoteResponse> {
  const res = await fetch(`${BASE_URL}/api/quote/${apiKey()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req),
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Intents /quote failed with HTTP ${res.status}${text ? `: ${text.slice(0, 300)}` : ""}`
    );
  }
  return (await res.json()) as QuoteResponse;
}

export async function getTransactions(
  walletAddress: string
): Promise<IntentsTransaction[]> {
  if (!walletAddress) return [];
  const url = `${BASE_URL}/api/transactions/${apiKey()}?walletAddress=${encodeURIComponent(walletAddress)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Intents /transactions failed with HTTP ${res.status}`);
  }
  const payload: unknown = await res.json();
  if (Array.isArray(payload)) return payload as IntentsTransaction[];
  if (payload != null && typeof payload === "object") {
    const root = payload as Record<string, unknown>;
    for (const key of ["data", "transactions", "items"]) {
      if (Array.isArray(root[key])) {
        return root[key] as IntentsTransaction[];
      }
    }
  }
  return [];
}
