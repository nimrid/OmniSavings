export interface TokenizedEquity {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  category: "Index ETF" | "Semiconductor" | "Mega Cap Tech" | "Automotive" | "US Treasuries";
  description: string;
  issuer: "Backed Finance (xStocks)" | "Ondo Finance";
  icon: string;
}

export const TOKENIZED_EQUITIES: Record<string, TokenizedEquity> = {
  SPYx: {
    symbol: "SPYx",
    name: "S&P 500 ETF (xStock)",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    category: "Index ETF",
    description: "Tokenized S&P 500 index ETF on Solana, tracking the 500 largest publicly traded US corporations.",
    issuer: "Backed Finance (xStocks)",
    icon: "📈",
  },
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corp (xStock)",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    category: "Semiconductor",
    description: "Tokenized NVIDIA equity on Solana, tracking AI infrastructure and graphics compute leader.",
    issuer: "Backed Finance (xStocks)",
    icon: "🟢",
  },
  AAPLx: {
    symbol: "AAPLx",
    name: "Apple Inc (xStock)",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    category: "Mega Cap Tech",
    description: "Tokenized Apple equity on Solana, backed 1:1 by real Apple common stock.",
    issuer: "Backed Finance (xStocks)",
    icon: "🍎",
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc (xStock)",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    category: "Automotive",
    description: "Tokenized Tesla equity on Solana, tracking electric vehicle and robotics pioneer.",
    issuer: "Backed Finance (xStocks)",
    icon: "⚡",
  },
  USDY: {
    symbol: "USDY",
    name: "Ondo US Dollar Yield (Treasuries)",
    mint: "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6",
    decimals: 6,
    category: "US Treasuries",
    description: "Tokenized real-world asset secured by short-term US Treasury bills and bank deposits.",
    issuer: "Ondo Finance",
    icon: "🏛️",
  },
};

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
