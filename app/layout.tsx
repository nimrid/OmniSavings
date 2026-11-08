import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectButton } from "@/components/ConnectButton";
import { ShieldCheck, TrendingUp, Layers, ExternalLink } from "lucide-react";

export const metadata: Metadata = {
  title: "OmniSavings — Autonomous Solana Savings & Yield-to-Equity",
  description:
    "Universal on-chain savings on Solana: compare live stablecoin yields, deposit via Anchor Jupiter Lend CPI Vault, and auto-invest yield into tokenized US stocks via Jupiter V6.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-900 min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <Providers>
          {/* Top Network Notification / Status Bar */}
          <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
              {/* Brand Logo & Nav */}
              <div className="flex items-center gap-8">
                <Link href="/" className="flex items-center gap-2.5 group">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm group-hover:bg-slate-800 transition-colors">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold tracking-tight text-slate-900 font-sans">
                      OmniSavings
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 -mt-0.5">
                      Autonomous DeFi
                    </span>
                  </div>
                </Link>

                <nav className="hidden md:flex items-center gap-1 font-mono text-xs font-medium">
                  <Link
                    href="/"
                    className="rounded-md px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                  >
                    Overview
                  </Link>
                  <Link
                    href="/dashboard"
                    className="rounded-md px-3 py-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 transition-colors"
                  >
                    Vault & Markets
                  </Link>
                  <Link
                    href="/invest"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-colors font-semibold"
                  >
                    <span>Yield-to-Equity</span>
                    <span className="rounded bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider">
                      Live DEX
                    </span>
                  </Link>
                </nav>
              </div>

              {/* Right: Network indicator + Connect */}
              <div className="flex items-center gap-3">
                <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-mono text-slate-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span>Solana Mainnet</span>
                </div>
                <ConnectButton />
              </div>
            </div>

            {/* Mobile Nav Bar */}
            <div className="flex md:hidden border-t border-slate-100 px-4 py-2 bg-slate-50/50 justify-around font-mono text-xs">
              <Link
                href="/"
                className="py-1 text-slate-600 hover:text-slate-900 font-medium"
              >
                Overview
              </Link>
              <Link
                href="/dashboard"
                className="py-1 text-slate-600 hover:text-slate-900 font-medium"
              >
                Vault & Markets
              </Link>
              <Link
                href="/invest"
                className="py-1 text-emerald-700 font-bold"
              >
                Yield-to-Equity
              </Link>
            </div>
          </header>

          {/* Main Viewport */}
          <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 flex-1">
            {children}
          </main>

          {/* Institutional Footer */}
          <footer className="border-t border-slate-200/80 bg-white py-6 text-xs text-slate-500 font-mono">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="font-semibold text-slate-700 font-sans">
                  OmniSavings Protocol • Solana Mainnet
                </p>
                <p className="text-[11px] text-slate-400">
                  Anchor CPI Vault ID: <code className="text-slate-600">AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT</code>
                </p>
              </div>

              <div className="flex items-center gap-4 text-[11px]">
                <a
                  href="https://solscan.io/account/AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>Solscan Program</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://dev.lulo.fi"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>Lulo API</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://station.jup.ag"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-800 transition-colors inline-flex items-center gap-1"
                >
                  <span>Jupiter V6</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
