import type {
  BackpackKline,
  BackpackTicker,
  StockRwaQuote,
} from "./types";

const BACKPACK_API_BASE = "https://api.backpack.exchange/api/v1";

export interface StockMetadata {
  symbol: string;
  ticker: string;
  name: string;
  category: "Stock" | "Index";
  description: string;
}

export const CURATED_STOCKS: StockMetadata[] = [
  {
    symbol: "NVDA.US_USDC_PERP",
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    category: "Stock",
    description: "Global leader in accelerated computing & AI processors",
  },
  {
    symbol: "AAPL.US_USDC_PERP",
    ticker: "AAPL",
    name: "Apple Inc.",
    category: "Stock",
    description: "Consumer technology, iPhone, Mac & services ecosystem",
  },
  {
    symbol: "SPY.US_USDC_PERP",
    ticker: "SPY",
    name: "SPDR S&P 500 ETF",
    category: "Index",
    description: "The premier benchmark of 500 leading US public companies",
  },
  {
    symbol: "QQQ.US_USDC_PERP",
    ticker: "QQQ",
    name: "Invesco QQQ (Nasdaq 100)",
    category: "Index",
    description: "Tracks the 100 largest non-financial tech leaders on Nasdaq",
  },
  {
    symbol: "TSLA.US_USDC_PERP",
    ticker: "TSLA",
    name: "Tesla, Inc.",
    category: "Stock",
    description: "Electric vehicles, energy storage, and autonomous robotics",
  },
  {
    symbol: "MSFT.US_USDC_PERP",
    ticker: "MSFT",
    name: "Microsoft Corporation",
    category: "Stock",
    description: "Enterprise software, Azure cloud, and OpenAI strategic partner",
  },
  {
    symbol: "AMZN.US_USDC_PERP",
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    category: "Stock",
    description: "Global e-commerce and AWS cloud infrastructure leader",
  },
  {
    symbol: "GOOGL.US_USDC_PERP",
    ticker: "GOOGL",
    name: "Alphabet Inc. (Google)",
    category: "Stock",
    description: "Google Search, YouTube, Android, and Gemini AI technologies",
  },
  {
    symbol: "META.US_USDC_PERP",
    ticker: "META",
    name: "Meta Platforms, Inc.",
    category: "Stock",
    description: "Instagram, WhatsApp, Reality Labs, and LLaMA open-source AI",
  },
  {
    symbol: "AMD.US_USDC_PERP",
    ticker: "AMD",
    name: "Advanced Micro Devices",
    category: "Stock",
    description: "High-performance computing, graphics, and server processors",
  },
];

/**
 * Fetch real-time ticker data for all curated stock RWAs on Backpack
 */
export async function getStockQuotes(): Promise<StockRwaQuote[]> {
  const now = new Date().toISOString();

  // Fetch individual tickers in parallel for fast response
  const promises = CURATED_STOCKS.map(async (meta) => {
    try {
      const res = await fetch(
        `${BACKPACK_API_BASE}/ticker?symbol=${encodeURIComponent(meta.symbol)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return null;
      const t = (await res.json()) as BackpackTicker;

      const price = parseFloat(t.lastPrice) || 0;
      const priceChange = parseFloat(t.priceChange) || 0;
      const priceChangePercent = (parseFloat(t.priceChangePercent) || 0) * 100;
      const high24h = parseFloat(t.high) || price;
      const low24h = parseFloat(t.low) || price;
      const volumeUsd = parseFloat(t.quoteVolume) || 0;

      return {
        symbol: meta.symbol,
        ticker: meta.ticker,
        name: meta.name,
        category: meta.category,
        price,
        priceChange,
        priceChangePercent,
        high24h,
        low24h,
        volumeUsd,
        updatedAt: now,
      } as StockRwaQuote;
    } catch {
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((q): q is StockRwaQuote => q !== null);
}

/**
 * Fetch historical 1h candlestick data from Backpack Exchange
 */
export async function getStockKlines(
  symbol: string,
  interval: "1m" | "5m" | "15m" | "1h" | "1d" = "1h",
  lookbackDays = 3
): Promise<BackpackKline[]> {
  const startTime = Math.floor(Date.now() / 1000) - 86400 * lookbackDays;
  const url = `${BACKPACK_API_BASE}/klines?symbol=${encodeURIComponent(
    symbol
  )}&interval=${interval}&startTime=${startTime}`;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Backpack klines failed with HTTP ${res.status}`);
  }
  return (await res.json()) as BackpackKline[];
}
