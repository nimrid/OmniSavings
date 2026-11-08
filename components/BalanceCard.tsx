"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { shortenAddress } from "@/lib/utils/format";

export function BalanceCard() {
  const { ready, authenticated, login } = usePrivy();
  const { wallets, isCreating } = useConnectedWallets();

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          Connected wallets
        </h2>
        {authenticated && wallets.length > 0 && (
          <span className="rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
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
            className="mt-3 w-full rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
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
        <ul className="mt-3 space-y-2">
          {wallets.map((w) => (
            <li
              key={w.address}
              className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{w.label}</span>
                {w.isPrimary && (
                  <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                    Primary
                  </span>
                )}
              </div>
              <p
                className="mt-1 font-mono text-slate-700 break-all select-all"
                title={w.address}
              >
                {shortenAddress(w.address, 6)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
