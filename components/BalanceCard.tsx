"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
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
    <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-slate-900">{wallet.label}</span>
          {wallet.isPrimary && (
            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
              Primary
            </span>
          )}
        </div>
        <button
          onClick={() => void refetch()}
          disabled={loading}
          title="Refresh balance"
          className="text-slate-400 hover:text-slate-600 disabled:opacity-50 text-xs"
        >
          {loading ? "…" : "↻"}
        </button>
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span
          className="font-mono text-slate-600 select-all"
          title={wallet.address}
        >
          {shortenAddress(wallet.address, 4)}
        </span>
        <button
          onClick={copyAddress}
          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Live Balances Grid */}
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-200/80 pt-2 text-[11px]">
        <div className="rounded bg-white p-1.5 border border-slate-100">
          <span className="text-slate-400 block text-[10px]">SOL</span>
          <span className="font-semibold text-slate-800 tabular-nums">
            {loading && !balance
              ? "…"
              : (balance?.sol ?? 0).toLocaleString(undefined, {
                  maximumFractionDigits: 4,
                })}
          </span>
        </div>

        <div className="rounded bg-white p-1.5 border border-slate-100">
          <span className="text-slate-400 block text-[10px]">USDC</span>
          <span className="font-semibold text-slate-900 tabular-nums">
            {loading && !balance
              ? "…"
              : `$${(balance?.usdc ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`}
          </span>
        </div>

        {balance && balance.jlUsdc > 0 && (
          <div className="col-span-2 rounded bg-emerald-50/70 p-1.5 border border-emerald-100 flex items-center justify-between">
            <div>
              <span className="text-emerald-700 font-medium block text-[10px]">
                Jupiter Earn (jlUSDC)
              </span>
              <span className="font-bold text-emerald-900 tabular-nums">
                {balance.jlUsdc.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 4,
                })}{" "}
                shares
              </span>
            </div>
            <span className="text-[10px] bg-emerald-200/70 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
              Earning
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
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Connected wallets
        </h2>
        {authenticated && wallets.length > 0 && (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 border border-emerald-100">
            {wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}
          </span>
        )}
      </div>

      {!ready ? (
        <p className="mt-2 text-sm text-slate-500">Loading…</p>
      ) : !authenticated ? (
        <div className="mt-2">
          <p className="text-sm text-slate-600">
            No wallet connected yet. Sign in with email or connect a Solana wallet.
          </p>
          <button
            onClick={() => void login()}
            className="mt-3 w-full rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 shadow-sm transition-colors"
          >
            Connect wallet
          </button>
        </div>
      ) : isCreating ? (
        <p className="mt-2 text-sm text-slate-600">
          Setting up your embedded Solana wallet…
        </p>
      ) : wallets.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No Solana wallet linked to your account yet. Re-authenticate to create
          an embedded wallet or connect an external Solana wallet.
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
