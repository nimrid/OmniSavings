"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { Wallet, LogOut, Copy, Check } from "lucide-react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { shortenAddress } from "@/lib/utils/format";

export function ConnectButton() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const { primaryWallet } = useConnectedWallets();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!primaryWallet?.address) return;
    try {
      await navigator.clipboard.writeText(primaryWallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (!ready) {
    return (
      <div className="h-9 w-28 rounded-lg bg-slate-100 animate-pulse border border-slate-200" />
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={() => void login()}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors font-mono"
      >
        <Wallet className="h-3.5 w-3.5" />
        <span>Connect Wallet</span>
      </button>
    );
  }

  const displayText = primaryWallet
    ? shortenAddress(primaryWallet.address, 4)
    : user?.email?.address || "Connected";

  return (
    <div className="flex items-center gap-2">
      <div
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-2xs font-mono"
        title={primaryWallet?.address || user?.email?.address || "Connected"}
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="font-semibold text-slate-800">{displayText}</span>
        {primaryWallet?.address && (
          <button
            onClick={handleCopy}
            className="text-slate-400 hover:text-slate-700 transition-colors p-0.5"
            title="Copy address"
          >
            {copied ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        )}
      </div>

      <button
        onClick={() => void logout()}
        className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors shadow-2xs"
        title="Disconnect"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
