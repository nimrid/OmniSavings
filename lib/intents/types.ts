export type DepositIntentStatus =
  | "draft"
  | "quoted"
  | "submitted"
  | "settled"
  | "failed";

export interface IntentsToken {
  assetId: string;
  decimals: number;
  blockchain: string;
  symbol: string;
  price?: number;
  priceUpdatedAt?: string;
  contractAddress?: string | null;
}

export interface DepositIntent {
  id: string;
  user: string;
  recipient: string;
  fromChain: string;
  fromAsset: string;
  /** Amount in smallest units (base-unit string). */
  amount: string;
  /** Destination chain; always Solana — deposits fund the user's wallet. */
  toChain: string;
  toAsset: string;
  /** Human-readable expected payout from the Intents quote, e.g. "0.997". */
  expectedReceived?: string | null;
  /** Estimated settlement time in seconds from the Intents quote. */
  timeEstimateSec?: number | null;
  status: DepositIntentStatus;
  /** Aurora Intents deposit address the user transfers to. */
  depositAddress?: string;
  /** Deposit memo / tag required by certain chains (e.g. Stellar, XRP, TON). */
  depositMemo?: string | null;
  nearIntentId?: string;
  /** Last known Intents transaction status, e.g. PENDING_DEPOSIT / PROCESSING / SUCCESS. */
  lastTxStatus?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepositQuotePreview {
  amountIn: string;
  amountInFormatted?: string;
  amountOut: string;
  amountOutFormatted?: string;
  timeEstimateSec?: number;
  originAssetId: string;
  destinationAssetId: string;
  originDecimals: number;
}
