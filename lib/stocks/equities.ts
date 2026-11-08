export interface TokenizedEquity {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  category: "Index ETF" | "Semiconductor" | "Mega Cap Tech" | "Automotive" | "US Treasuries";
  description: string;
  issuer: "Backed Finance (xStocks)" | "Ondo Finance";
  backing: string;
  tokenStandard: "Token-2022" | "SPL Token";
  isin?: string;
  badgeColor: {
    bg: string;
    text: string;
    border: string;
  };
}

export const TOKENIZED_EQUITIES: Record<string, TokenizedEquity> = {
  SPYx: {
    symbol: "SPYx",
    name: "S&P 500 ETF (xStock)",
    mint: "XsoCS1TfEyfFhfvj8EtZ528L3CaKBDBRqRapnBbDF2W",
    decimals: 8,
    category: "Index ETF",
    description: "Tokenized S&P 500 tracker backed 1:1 by real UCITS ETF shares held with regulated Swiss custodian.",
    issuer: "Backed Finance (xStocks)",
    backing: "100% physically backed by S&P 500 UCITS ETF shares in segregated Swiss custody",
    tokenStandard: "Token-2022",
    isin: "CH1173294265",
    badgeColor: {
      bg: "bg-blue-900/10 dark:bg-blue-500/10",
      text: "text-blue-700 dark:text-blue-400",
      border: "border-blue-700/20",
    },
  },
  NVDAx: {
    symbol: "NVDAx",
    name: "NVIDIA Corp (xStock)",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 8,
    category: "Semiconductor",
    description: "Tokenized NVIDIA equity on Solana, tracking AI accelerated compute and graphics hardware leader.",
    issuer: "Backed Finance (xStocks)",
    backing: "100% physically backed by NVIDIA Corp common stock (NASDAQ: NVDA)",
    tokenStandard: "Token-2022",
    isin: "CH1173294273",
    badgeColor: {
      bg: "bg-emerald-900/10 dark:bg-emerald-500/10",
      text: "text-emerald-700 dark:text-emerald-400",
      border: "border-emerald-700/20",
    },
  },
  AAPLx: {
    symbol: "AAPLx",
    name: "Apple Inc (xStock)",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 8,
    category: "Mega Cap Tech",
    description: "Tokenized Apple equity on Solana, backed 1:1 by real Apple common stock in Swiss bank custody.",
    issuer: "Backed Finance (xStocks)",
    backing: "100% physically backed by Apple Inc common stock (NASDAQ: AAPL)",
    tokenStandard: "Token-2022",
    isin: "CH1173294281",
    badgeColor: {
      bg: "bg-slate-900/10 dark:bg-slate-500/10",
      text: "text-slate-800 dark:text-slate-300",
      border: "border-slate-700/20",
    },
  },
  TSLAx: {
    symbol: "TSLAx",
    name: "Tesla Inc (xStock)",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 8,
    category: "Automotive",
    description: "Tokenized Tesla equity on Solana, tracking global electric vehicle and robotics pioneer.",
    issuer: "Backed Finance (xStocks)",
    backing: "100% physically backed by Tesla Inc common stock (NASDAQ: TSLA)",
    tokenStandard: "Token-2022",
    isin: "CH1173294299",
    badgeColor: {
      bg: "bg-rose-900/10 dark:bg-rose-500/10",
      text: "text-rose-700 dark:text-rose-400",
      border: "border-rose-700/20",
    },
  },
  USDY: {
    symbol: "USDY",
    name: "Ondo US Dollar Yield (Treasuries)",
    mint: "A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6",
    decimals: 6,
    category: "US Treasuries",
    description: "Tokenized real-world asset secured by short-term US Treasury bills and bank demand deposits.",
    issuer: "Ondo Finance",
    backing: "Short-term US Treasury Bills & bank demand deposits managed by Ondo Finance",
    tokenStandard: "SPL Token",
    badgeColor: {
      bg: "bg-amber-900/10 dark:bg-amber-500/10",
      text: "text-amber-700 dark:text-amber-400",
      border: "border-amber-700/20",
    },
  },
};

export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
