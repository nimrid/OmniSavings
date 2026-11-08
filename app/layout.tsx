import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "./providers";
import { ConnectButton } from "@/components/ConnectButton";

export const metadata: Metadata = {
  title: "DeFi Savings — Stablecoin Yield Dashboard",
  description:
    "Compare stablecoin APYs across Lulo and Jupiter on Solana, and deposit in one click via Aurora Intents.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
              <nav className="flex items-center gap-6">
                <Link href="/" className="text-lg font-bold text-slate-900">
                  DeFi Savings
                </Link>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Link>
              </nav>
              <ConnectButton />
            </div>
          </header>
          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
          <footer className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-500">
            Yields shown are live quotes when available; deposits route through
            Aurora Intents. Not financial advice.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
