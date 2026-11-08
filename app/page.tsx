import Link from "next/link";
import {
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  ExternalLink,
  Layers,
  Lock,
  Globe,
  Zap,
  Terminal,
} from "lucide-react";
import { StockIcon } from "@/components/StockIcon";

const PROTOCOL_SPECS = [
  {
    name: "Anchor Jupiter CPI Vault",
    type: "On-Chain SBF Smart Contract",
    desc: "Direct Cross-Program Invocation into Jupiter Lend Earn (jup3YeL8QhtSx...). Mints yield-bearing jlTokens directly to depositor wallet.",
    target: "AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT",
    link: "https://solscan.io/account/AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT",
  },
  {
    name: "Yield-to-Equity Engine",
    type: "Real Token-2022 Equities",
    desc: "Autonomous deployment of accrued interest into tokenized S&P 500 (SPYx), NVIDIA (NVDAx), Apple (AAPLx) backed 1:1 by Swiss bank custody.",
    target: "Jupiter Swap V6 Router",
    link: "https://station.jup.ag",
  },
  {
    name: "Lulo Protected Lending",
    type: "Institutional Coverage Pool",
    desc: "Automated lending across Kamino, Save, and Marginfi with insurance-backed principal protection on Solana.",
    target: "Lulo API v1 Endpoints",
    link: "https://dev.lulo.fi",
  },
  {
    name: "Universal Cross-Chain Inflow",
    type: "Aurora Intents Solver",
    desc: "Fund Solana self-custody wallets from 8+ EVM chains (Ethereum, Base, Arbitrum, BSC, Optimism, Polygon) in a single transaction.",
    target: "Aurora Intents Protocol",
    link: "https://aurora.dev",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-10 sm:space-y-12 py-2 sm:py-4">
      {/* Hero Section */}
      <div className="space-y-5 sm:space-y-6 max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-[11px] sm:text-xs text-slate-700 shadow-2xs flex-wrap">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold">Solana Mainnet</span>
          <span className="text-slate-300 hidden xs:inline">•</span>
          <span className="truncate max-w-[200px] xs:max-w-none">Anchor Program: AhYUb1…ktTT</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-sans leading-[1.15]">
          Autonomous Solana Savings & <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 via-slate-900 to-indigo-800">
            Yield-to-Equity Engine
          </span>
        </h1>

        <p className="text-sm sm:text-base lg:text-lg leading-relaxed text-slate-600 max-w-3xl">
          Compare institutional stablecoin rates in real time, deposit via our on-chain{" "}
          <strong className="text-slate-900 font-semibold">Jupiter Lend CPI Vault</strong>, and autonomously deploy
          accrued interest into <strong className="text-slate-900 font-semibold">Token-2022 US equities</strong> via
          Jupiter V6. Zero principal drawdown risk.
        </p>

        {/* Primary Action Buttons (Mobile Full Width) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-2 font-mono text-xs">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-md hover:bg-slate-800 active:bg-black transition-colors"
          >
            <span>Launch Savings Terminal</span>
            <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />
          </Link>
          <Link
            href="/invest"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 active:bg-slate-100 transition-colors"
          >
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            <span>Yield-to-Equity Desk</span>
          </Link>
          <a
            href="https://solscan.io/account/AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <span>Verified Program on Solscan</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Real-Time Live Architecture Strip */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 sm:grid-cols-4 font-mono text-xs">
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
            Net Stablecoin APY
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block tabular-nums">
            4.79% – 5.15%
          </span>
          <span className="text-[10px] text-emerald-700 mt-0.5 block font-sans truncate">
            Anchor CPI + Lulo Protected
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
            Tokenized Equities
          </span>
          <div className="flex items-center gap-1.5 mt-1.5">
            <StockIcon symbol="SPY" size={16} />
            <StockIcon symbol="NVDA" size={16} />
            <StockIcon symbol="AAPL" size={16} />
            <StockIcon symbol="TSLA" size={16} />
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block font-sans truncate">
            Token-2022 (Backed xStocks)
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
            Cross-Chain Inflow
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block">
            8+ EVM Chains
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-sans truncate">
            Aurora Intents Protocol
          </span>
        </div>

        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-sm">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">
            Custody Model
          </span>
          <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block truncate">
            Self-Custodial
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block font-sans truncate">
            Privy Embedded Wallet
          </span>
        </div>
      </div>

      {/* Execution Pipeline Architecture */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
            System Architecture
          </span>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-sans">
            How the Autonomous Savings & Equity Loop Works
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 text-xs">
          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white font-mono font-bold text-sm">
              01
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-sans">
              Universal Inflow & Onboarding
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Users sign in with Google or Email; an embedded Solana wallet is provisioned instantly. Users can bridge liquidity directly from Ethereum, Base, Arbitrum, or BSC via Aurora Intents in a single transaction.
            </p>
          </div>

          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-900 text-white font-mono font-bold text-sm">
              02
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-sans">
              Protected Principal Compounding
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Deposits route through our deployed Anchor Smart Contract (<code className="font-mono text-indigo-700">AhYUb1t…ktTT</code>) using Cross-Program Invocation into Jupiter Lend Earn, minting yield-generating jlTokens safely.
            </p>
          </div>

          <div className="space-y-2.5 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white font-mono font-bold text-sm">
              03
            </div>
            <h3 className="font-bold text-slate-900 text-sm font-sans">
              Yield-to-Equity Allocation
            </h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              Instead of letting passive interest sit idle, users can automatically deploy accrued yield into real tokenized US stocks & S&P 500 ETFs via Jupiter DEX V6 with zero principal drawdown exposure.
            </p>
          </div>
        </div>
      </div>

      {/* Verifiable Protocol Specifications */}
      <div className="space-y-4">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 font-sans">
          Live On-Chain Smart Contracts & Infrastructure
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 sm:grid-cols-2">
          {PROTOCOL_SPECS.map((spec) => (
            <div
              key={spec.name}
              className="rounded-xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="font-bold text-slate-900 text-sm font-sans">{spec.name}</span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-semibold text-slate-700">
                  {spec.type}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {spec.desc}
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400 text-[11px] truncate max-w-[180px] sm:max-w-[220px]" title={spec.target}>
                  {spec.target}
                </span>
                <a
                  href={spec.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold text-[11px]"
                >
                  <span>Verify</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer / Auditor Note */}
      <div className="rounded-xl border border-slate-200 bg-slate-100/70 p-4 text-xs font-mono text-slate-700 leading-relaxed space-y-1">
        <div className="flex items-center gap-1.5 font-bold text-slate-900 font-sans">
          <Terminal className="h-4 w-4 text-slate-700" />
          <span>Verifiable Hackathon Build Details</span>
        </div>
        <p className="text-[11px] text-slate-600 break-all">
          Anchor Contract Program ID: <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700 font-bold">AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT</code>. Compiled to Solana BPF bytecode, exposing instructions <code className="bg-white px-1 py-0.5 rounded border border-slate-200">initialize_user_savings</code>, <code className="bg-white px-1 py-0.5 rounded border border-slate-200">deposit_to_jupiter</code>, and <code className="bg-white px-1 py-0.5 rounded border border-slate-200">withdraw_from_jupiter</code>.
        </p>
      </div>
    </div>
  );
}
