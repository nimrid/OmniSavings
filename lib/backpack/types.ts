export interface BackpackMarket {
  symbol: string;
  baseSymbol: string;
  quoteSymbol: string;
  marketType: "SPOT" | "PERP";
  rwaMarketType: "STOCK" | "INDEX" | null;
  orderBookState: string;
  visible: boolean;
  filters: {
    price: {
      minPrice: string;
      maxPrice?: string | null;
      tickSize: string;
    };
    quantity: {
      minQuantity: string;
      maxQuantity?: string | null;
      stepSize: string;
    };
  };
}

export interface BackpackTicker {
  symbol?: string;
  firstPrice: string;
  high: string;
  lastPrice: string;
  low: string;
  priceChange: string;
  priceChangePercent: string;
  quoteVolume: string;
  volume: string;
}

export interface BackpackKline {
  start: string;
  end: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  quoteVolume: string;
  trades: string;
}

export interface StockRwaQuote {
  symbol: string; // e.g. "NVDA.US_USDC_PERP"
  ticker: string; // e.g. "NVDA"
  name: string; // e.g. "NVIDIA Corporation"
  category: "Stock" | "Index";
  price: number;
  priceChange: number;
  priceChangePercent: number;
  high24h: number;
  low24h: number;
  volumeUsd: number;
  updatedAt: string;
}

export interface YieldToEquityRule {
  user: string;
  enabled: boolean;
  sourceVault: "jupiter" | "lulo" | "both";
  allocations: {
    symbol: string; // e.g. "NVDA" or "SPY"
    percent: number; // 0 - 100
  }[];
  frequency: "daily" | "weekly" | "monthly" | "threshold";
  thresholdAmountUsd?: number;
  lastExecutedAt?: string;
  totalInvestedUsd?: number;
}
