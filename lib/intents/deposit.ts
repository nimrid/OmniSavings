import { randomUUID } from "crypto";
import type { DepositIntent, IntentsToken } from "./types";
import { createQuote, getTokens } from "./client";

/** Deposits always land on Solana, in the user's own wallet. */
const TO_CHAIN = "solana";

export interface BuildDepositIntentInput {
  user: string;
  fromChain: string;
  fromAsset: string;
  /** Amount in smallest units (base-unit string of origin token). */
  amount: string;
  toAsset: string;
  /** The user's Solana wallet address (Privy embedded or connected). */
  recipient: string;
  /** If true, creates a dry quote preview without generating a deposit address. */
  dry?: boolean;
  /** Explicit Intents assetIds; when omitted they are auto-matched via /tokens. */
  originAssetId?: string;
  destinationAssetId?: string;
}

/**
 * Maps common frontend chain names to Aurora Intents `blockchain` slugs.
 */
export const CHAIN_ALIASES: Record<string, string> = {
  solana: "sol",
  sol: "sol",
  ethereum: "eth",
  eth: "eth",
  base: "base",
  arbitrum: "arb",
  arb: "arb",
  optimism: "op",
  op: "op",
  polygon: "pol",
  pol: "pol",
  binance: "bsc",
  bsc: "bsc",
  avalanche: "avax",
  avax: "avax",
  sui: "sui",
  near: "near",
  ton: "ton",
  tron: "tron",
  bitcoin: "btc",
  btc: "btc",
};

/**
 * Validate that an address matches the expected format for its network
 * before submitting to Aurora Intents.
 */
export function validateAddress(
  address: string,
  chain: string
): string | null {
  const trimmed = address.trim();
  if (!trimmed) return "Address cannot be empty.";
  const slug = CHAIN_ALIASES[chain.trim().toLowerCase()] ?? chain.trim().toLowerCase();

  if (slug === "sol") {
    // Solana base58 address
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed)) {
      return "Invalid Solana address format (Base58, 32-44 characters).";
    }
  } else if (
    ["eth", "base", "arb", "op", "pol", "bsc", "avax"].includes(slug)
  ) {
    // EVM 0x address
    if (!/^0x[a-fA-F0-9]{40}$/.test(trimmed)) {
      return "Invalid address format: must start with 0x followed by 40 hex characters.";
    }
  }
  return null;
}

/**
 * Match an Intents token by symbol and chain.
 */
export function findToken(
  tokens: IntentsToken[],
  symbol: string,
  chain: string
): IntentsToken | null {
  const wantSymbol = symbol.trim().toUpperCase();
  const targetChain =
    CHAIN_ALIASES[chain.trim().toLowerCase()] ?? chain.trim().toLowerCase();

  // Exact match on symbol and blockchain
  const exact = tokens.find(
    (t) =>
      t.symbol.toUpperCase() === wantSymbol &&
      t.blockchain.toLowerCase() === targetChain
  );
  if (exact) return exact;

  // Fallback: match if token symbol matches and blockchain contains targetChain
  return (
    tokens.find((t) => {
      if (t.symbol.toUpperCase() !== wantSymbol) return false;
      const b = t.blockchain.toLowerCase();
      return b.includes(targetChain) || targetChain.includes(b);
    }) ?? null
  );
}

/**
 * Backward-compatible helper for finding just the assetId.
 */
export function findAssetId(
  tokens: unknown,
  symbol: string,
  chain: string
): string | null {
  const tokenList: IntentsToken[] = Array.isArray(tokens)
    ? (tokens as IntentsToken[])
    : tokens != null && typeof tokens === "object"
      ? ((tokens as { tokens?: IntentsToken[] }).tokens ?? [])
      : [];
  return findToken(tokenList, symbol, chain)?.assetId ?? null;
}

/**
 * Build a cross-chain deposit intent: resolves Intents assetIds, creates an
 * Intents quote (deposit address), and returns a quoted DepositIntent.
 * Solana-only: the user completes the deposit with a standard token
 * transfer to `depositAddress`.
 */
export async function buildDepositIntent(
  input: BuildDepositIntentInput
): Promise<DepositIntent> {
  const toChain = TO_CHAIN;

  // Validate addresses upfront to return clear error messages
  const recipientErr = validateAddress(input.recipient, toChain);
  if (recipientErr) {
    throw new Error(`Destination recipient error: ${recipientErr}`);
  }
  const refundErr = validateAddress(input.user, input.fromChain);
  if (refundErr) {
    throw new Error(`Sender refund address error: ${refundErr}`);
  }

  let originAssetId = input.originAssetId;
  let destinationAssetId = input.destinationAssetId;

  if (!originAssetId || !destinationAssetId) {
    const tokens = await getTokens();
    const originToken = findToken(tokens, input.fromAsset, input.fromChain);
    const destinationToken = findToken(tokens, input.toAsset, toChain);

    originAssetId = originAssetId ?? originToken?.assetId;
    destinationAssetId = destinationAssetId ?? destinationToken?.assetId;
  }

  if (!originAssetId) {
    throw new Error(
      `Could not resolve Intents origin asset for ${input.fromAsset} on ${input.fromChain}`
    );
  }
  if (!destinationAssetId) {
    throw new Error(
      `Could not resolve Intents destination asset for ${input.toAsset} on ${toChain}`
    );
  }

  const deadline = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const quote = await createQuote({
    dry: Boolean(input.dry),
    swapType: "EXACT_INPUT",
    slippageTolerance: 100, // 1%
    originAsset: originAssetId,
    depositType: "ORIGIN_CHAIN",
    destinationAsset: destinationAssetId,
    amount: input.amount,
    recipient: input.recipient,
    recipientType: "DESTINATION_CHAIN",
    // Refunds return to origin chain
    refundTo: input.user,
    refundType: "ORIGIN_CHAIN",
    deadline,
  });

  const depositAddress = quote.quote?.depositAddress ?? quote.depositAddress;
  const depositMemo = quote.quote?.depositMemo ?? quote.depositMemo ?? null;

  if (!input.dry && !depositAddress) {
    throw new Error("Intents /quote response missing depositAddress");
  }

  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    user: input.user,
    recipient: input.recipient,
    fromChain: input.fromChain,
    fromAsset: input.fromAsset,
    amount: input.amount,
    toChain,
    toAsset: input.toAsset,
    expectedReceived: quote.quote?.amountOutFormatted ?? null,
    timeEstimateSec: quote.quote?.timeEstimate ?? null,
    status: "quoted",
    depositAddress,
    depositMemo,
    nearIntentId: quote.correlationId,
    createdAt: now,
    updatedAt: now,
  };
}
