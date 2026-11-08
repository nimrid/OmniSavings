"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Wallet,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Lock,
  Coins,
  TrendingUp,
} from "lucide-react";
import { useConnectedWallets, type ConnectedSolanaWallet } from "@/hooks/useConnectedWallets";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { shortenAddress } from "@/lib/utils/format";

function WalletItem({ wallet }: { wallet: ConnectedSolanaWallet }) {
  const { balance, loading, refetch } = useWalletBalance(wallet.address);
  const [copied, setCopied] = useState(false);

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <li className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs font-mono">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
        <div className="flex items-center gap-1.5 font-sans">
          <span className="font-semibold text-slate-900">{wallet.label}</span>
          {wallet.isPrimary && (
            <span className="rounded bg-slate-200 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-slate-700">
              Primary
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => void refetch()}
            disabled={loading}
            title="Refresh balance"
            className="text-slate-400 hover:text-slate-700 disabled:opacity-50 p-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1 text-slate-600">
          <span className="select-all" title={wallet.address}>
            {shortenAddress(wallet.address, 4)}
          </span>
          <a
            href={`https://solscan.io/account/${wallet.address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-slate-700 p-0.5"
            title="View on Solscan"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <button
          onClick={copyAddress}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-600" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Live Balances Grid */}
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded bg-white p-2 border border-slate-200">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">SOL Gas</span>
          <span className="font-bold text-slate-800 tabular-nums text-xs">
            {loading && !balance
              ? "…"
              : (balance?.sol ?? 0).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
          </span>
        </div>

        <div className="rounded bg-white p-2 border border-slate-200">
          <span className="text-slate-400 block text-[9px] sm:text-[10px] uppercase">Liquid USDC</span>
          <span className="font-bold text-slate-900 tabular-nums text-xs">
            {loading && !balance
              ? "…"
              : `$${(balance?.usdc ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </span>
        </div>

        {balance && balance.jlUsdc > 0 && (
          <div className="col-span-2 rounded bg-indigo-50/80 p-2 border border-indigo-200 flex items-center justify-between">
            <div>
              <span className="text-indigo-800 font-semibold block text-[10px] font-sans">
                Jupiter Earn CPI (jlUSDC)
              </span>
              <span className="font-bold text-indigo-950 tabular-nums text-xs">
                {balance.jlUsdc.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{" "}
                shares
              </span>
            </div>
            <span className="text-[9px] bg-indigo-200/80 text-indigo-900 px-1.5 py-0.5 rounded font-bold uppercase">
              Earning
            </span>
          </div>
        )}

        {balance && (balance.luloProtected ?? 0) > 0 && (
          <div className="col-span-2 rounded bg-emerald-50/80 p-2 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-emerald-800 font-semibold block text-[10px] font-sans flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-emerald-600" />
                Lulo Protected Savings
              </span>
              <span className="font-bold text-emerald-950 tabular-nums text-xs">
                ${(balance.luloProtected ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold uppercase">
              Protected
            </span>
          </div>
        )}

        {balance && (balance.luloRegular ?? 0) > 0 && (
          <div className="col-span-2 rounded bg-slate-100 p-2 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-700 font-semibold block text-[10px] font-sans">
                Lulo Regular Savings
              </span>
              <span className="font-bold text-slate-900 tabular-nums text-xs">
                ${(balance.luloRegular ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold uppercase">
              Flexible
            </span>
          </div>
        )}

        {balance && (balance.luloTotalInterest ?? 0) > 0 && (
          <div className="col-span-2 rounded bg-emerald-50/60 p-2 border border-emerald-200 flex items-center justify-between">
            <span className="text-[10px] text-emerald-800 font-semibold font-sans flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-600" />
              Lulo Total Yield Earned
            </span>
            <span className="font-bold text-emerald-900 text-xs tabular-nums">
              +${(balance.luloTotalInterest ?? 0).toFixed(4)}
            </span>
          </div>
        )}
      </div>
    </li>
  );
}

export function BalanceCard() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets, isCreating } = useConnectedWallets();

  return (
    <section className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 font-sans">
          <Wallet className="h-4 w-4 text-slate-700" />
          <span>Connected Wallets</span>
        </h2>
        {authenticated && wallets.length > 0 && (
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700">
            {wallets.length} {wallets.length === 1 ? "Account" : "Accounts"}
          </span>
        )}
      </div>

      {!ready ? (
        <p className="mt-3 text-xs text-slate-500 font-mono">Loading telemetry…</p>
      ) : !authenticated ? (
        <div className="mt-3">
          <p className="text-xs text-slate-600 leading-relaxed font-sans">
            No wallet connected yet. Sign in with Google, email, or connect a Solana wallet.
          </p>
          <button
            onClick={() => void login()}
            className="mt-3 w-full rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800 shadow-sm transition-colors font-mono"
          >
            Connect Wallet
          </button>
        </div>
      ) : isCreating ? (
        <div className="mt-3 text-xs text-slate-600 font-mono flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-slate-500" />
          <span>Generating embedded Solana wallet…</span>
        </div>
      ) : wallets.length === 0 ? (
        <p className="mt-3 text-xs text-slate-600 font-sans">
          No Solana wallet linked to your session. Re-authenticate to create an embedded wallet.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {wallets.map((w) => (
            <WalletItem key={w.address} wallet={w} />
          ))}
        </ul>
      )}
    </section>
  );
}
