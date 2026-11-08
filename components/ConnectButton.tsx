"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { shortenAddress } from "@/lib/utils/format";

export function ConnectButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { primaryWallet } = useConnectedWallets();

  if (!ready) {
    return (
      <button
        disabled
        className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500"
      >
        Loading…
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={() => void login()}
        className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
      >
        Connect wallet
      </button>
    );
  }

  const displayText = primaryWallet
    ? shortenAddress(primaryWallet.address, 4)
    : user?.email?.address || "Connected";

  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
        title={primaryWallet?.address || user?.email?.address || "Connected"}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="font-mono">{displayText}</span>
      </span>
      <button
        onClick={() => void logout()}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Disconnect
      </button>
    </div>
  );
}
