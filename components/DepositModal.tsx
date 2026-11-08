"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { useDeposit } from "@/hooks/useDeposit";
import { shortenAddress } from "@/lib/utils/format";

interface Props {
  /** Asset to receive on Solana (USDC or USDT). */
  asset: string;
  onClose: () => void;
}

interface ChainAsset {
  symbol: string;
  decimals: number;
}

interface ChainConfig {
  id: string;
  label: string;
  assets: ChainAsset[];
}

export const SUPPORTED_ORIGIN_CHAINS: ChainConfig[] = [
  {
    id: "solana",
    label: "Solana",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "USDT", decimals: 6 },
      { symbol: "SOL", decimals: 9 },
    ],
  },
  {
    id: "base",
    label: "Base",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "ETH", decimals: 18 },
    ],
  },
  {
    id: "ethereum",
    label: "Ethereum",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "USDT", decimals: 6 },
      { symbol: "ETH", decimals: 18 },
    ],
  },
  {
    id: "arbitrum",
    label: "Arbitrum",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "ETH", decimals: 18 },
    ],
  },
  {
    id: "optimism",
    label: "Optimism",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "USDT", decimals: 6 },
      { symbol: "ETH", decimals: 18 },
    ],
  },
  {
    id: "polygon",
    label: "Polygon",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "USDT", decimals: 6 },
    ],
  },
  {
    id: "bsc",
    label: "BNB Chain (BSC)",
    assets: [
      { symbol: "USDC", decimals: 18 },
      { symbol: "USDT", decimals: 18 },
    ],
  },
  {
    id: "avalanche",
    label: "Avalanche",
    assets: [
      { symbol: "USDC", decimals: 6 },
      { symbol: "USDT", decimals: 6 },
    ],
  },
];

function toBaseUnits(human: string, decimals: number): string | null {
  const trimmed = human.trim();
  if (!trimmed || isNaN(Number(trimmed)) || Number(trimmed) <= 0) return null;
  const parts = trimmed.split(".");
  const whole = parts[0] || "0";
  let fraction = parts[1] || "";
  if (fraction.length > decimals) {
    fraction = fraction.slice(0, decimals);
  } else {
    fraction = fraction.padEnd(decimals, "0");
  }
  const factor = BigInt(10) ** BigInt(decimals);
  try {
    return (BigInt(whole) * factor + BigInt(fraction)).toString();
  } catch {
    return null;
  }
}

export function DepositModal({ asset, onClose }: Props) {
  const { authenticated, login } = usePrivy();
  const { wallets, primaryWallet, isCreating } = useConnectedWallets();
  const {
    intent,
    preview,
    loading,
    previewLoading,
    error,
    getQuotePreview,
    createIntent,
    submitIntent,
    reset,
  } = useDeposit();

  const [fromChain, setFromChain] = useState<string>("solana");
  const [fromAsset, setFromAsset] = useState<string>("USDC");
  const [amount, setAmount] = useState<string>("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Destination wallet selected among the user's verified connected wallets
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>("");

  useEffect(() => {
    if (
      primaryWallet &&
      (!selectedWalletAddress ||
        !wallets.some((w) => w.address === selectedWalletAddress))
    ) {
      setSelectedWalletAddress(primaryWallet.address);
    }
  }, [primaryWallet, wallets, selectedWalletAddress]);

  const walletAddress =
    selectedWalletAddress || primaryWallet?.address || "";

  const selectedWallet = useMemo(
    () => wallets.find((w) => w.address === walletAddress) ?? primaryWallet,
    [wallets, walletAddress, primaryWallet]
  );

  const currentChainConfig = useMemo(
    () =>
      SUPPORTED_ORIGIN_CHAINS.find((c) => c.id === fromChain) ??
      SUPPORTED_ORIGIN_CHAINS[0],
    [fromChain]
  );

  const currentAssetConfig = useMemo(
    () =>
      currentChainConfig.assets.find((a) => a.symbol === fromAsset) ??
      currentChainConfig.assets[0],
    [currentChainConfig, fromAsset]
  );

  // Refund address on the origin chain. Prefilled from the chosen
  // Solana wallet for Solana origins; typed in for other chains.
  const [senderOverride, setSenderOverride] = useState("");
  const defaultSender = useMemo(
    () => (fromChain === "solana" ? walletAddress : ""),
    [fromChain, walletAddress]
  );
  const sender = senderOverride || defaultSender;

  const baseUnits = useMemo(
    () => toBaseUnits(amount, currentAssetConfig.decimals),
    [amount, currentAssetConfig.decimals]
  );

  // Live estimate debounced quote preview
  useEffect(() => {
    if (!amount || !baseUnits || !sender || !walletAddress) return;
    const timer = setTimeout(() => {
      void getQuotePreview({
        user: sender,
        fromChain,
        fromAsset,
        amount: baseUnits,
        toAsset: asset,
        recipient: walletAddress,
      });
    }, 450);
    return () => clearTimeout(timer);
  }, [amount, baseUnits, sender, walletAddress, fromChain, fromAsset, asset, getQuotePreview]);

  // Automatic status polling when an intent is active
  useEffect(() => {
    if (!intent || intent.status === "settled" || intent.status === "failed") {
      return;
    }
    const timer = setInterval(() => {
      void submitIntent(intent.id);
    }, 5000);
    return () => clearInterval(timer);
  }, [intent, submitIntent]);

  async function handleCreateDeposit() {
    if (!sender || !walletAddress || !baseUnits) return;
    await createIntent({
      user: sender,
      fromChain,
      fromAsset,
      amount: baseUnits,
      toAsset: asset,
      recipient: walletAddress,
    });
  }

  function copyToClipboard(text: string, field: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Fund your wallet with {asset}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Cross-chain deposits powered by Aurora Intents — funds land in your
              Solana wallet.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!authenticated ? (
          <div className="mt-5 space-y-4 py-2">
            <p className="text-sm text-slate-700">
              Sign in with email or connect a Solana wallet first to choose where
              your deposit will land.
            </p>
            <button
              onClick={() => void login()}
              className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800 transition"
            >
              Connect wallet or sign in
            </button>
          </div>
        ) : isCreating ? (
          <div className="mt-5 space-y-2 py-6 text-center">
            <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-emerald-700 border-t-transparent" />
            <p className="text-sm font-medium text-slate-800">
              Setting up your Solana wallet…
            </p>
            <p className="text-xs text-slate-500">
              Privy is generating your embedded wallet. This only takes a moment.
            </p>
          </div>
        ) : wallets.length === 0 || !walletAddress ? (
          <div className="mt-5 space-y-3 py-2">
            <p className="text-sm text-slate-700">
              No verified Solana wallet found on your account yet. Re-authenticate
              to create an embedded wallet or connect an external Solana wallet.
            </p>
            <button
              onClick={() => void login()}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Manage connected accounts
            </button>
          </div>
        ) : intent === null ? (
          <div className="mt-4 space-y-3.5">
            {wallets.length > 1 ? (
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Destination wallet (funds land here)
                </span>
                <select
                  value={walletAddress}
                  onChange={(e) => {
                    setSelectedWalletAddress(e.target.value);
                    setSenderOverride("");
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-800 shadow-sm"
                >
                  {wallets.map((w) => (
                    <option key={w.address} value={w.address}>
                      {w.label} ({shortenAddress(w.address, 6)})
                      {w.isPrimary ? " — Primary" : ""}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold uppercase tracking-wider text-slate-500">
                    Destination ({selectedWallet?.label || "Your wallet"})
                  </span>
                  {selectedWallet?.isPrimary && (
                    <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-slate-700">
                      Primary
                    </span>
                  )}
                </div>
                <p
                  className="mt-1 break-all font-mono text-xs text-slate-900 select-all"
                  title={walletAddress}
                >
                  {walletAddress}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  From chain
                </span>
                <select
                  value={fromChain}
                  onChange={(e) => {
                    const newChain = e.target.value;
                    setFromChain(newChain);
                    const cfg =
                      SUPPORTED_ORIGIN_CHAINS.find((c) => c.id === newChain) ??
                      SUPPORTED_ORIGIN_CHAINS[0];
                    setFromAsset(cfg.assets[0].symbol);
                    setSenderOverride("");
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm"
                >
                  {SUPPORTED_ORIGIN_CHAINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  From asset
                </span>
                <select
                  value={fromAsset}
                  onChange={(e) => setFromAsset(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm"
                >
                  {currentChainConfig.assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Amount ({fromAsset})
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="100.00"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-600 focus:outline-none"
              />
            </label>

            {previewLoading ? (
              <p className="text-xs text-slate-500">Calculating estimated payout…</p>
            ) : preview?.expectedReceived ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
                You will receive ≈{" "}
                <strong>
                  {preview.expectedReceived} {asset}
                </strong>{" "}
                on Solana
                {typeof preview.timeEstimateSec === "number"
                  ? ` (est. ~${preview.timeEstimateSec}s)`
                  : ""}
              </div>
            ) : null}

            <label className="block text-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Sender address on {currentChainConfig.label} (refunds)
              </span>
              <input
                value={senderOverride}
                onChange={(e) => setSenderOverride(e.target.value.trim())}
                placeholder={defaultSender || "Address you will send from"}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs text-slate-800 shadow-sm"
              />
            </label>
            {!sender && (
              <p className="text-xs text-amber-700">
                Please enter the {currentChainConfig.label} address you&apos;ll send
                from — refunds return here if the swap fails.
              </p>
            )}

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={() => void handleCreateDeposit()}
              disabled={loading || !sender || !walletAddress || !baseUnits}
              className="mt-2 w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-emerald-800 disabled:bg-slate-300 transition"
            >
              {loading ? "Generating deposit address…" : "Get deposit address"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Send exactly {amount} {fromAsset} on {currentChainConfig.label} to:
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded bg-white p-2 border border-slate-200">
                <span className="font-mono text-xs font-semibold text-slate-900 break-all select-all">
                  {intent.depositAddress}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(intent.depositAddress || "", "address")
                  }
                  className="shrink-0 rounded bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  {copiedField === "address" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {intent.depositMemo && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-bold">Required Deposit Memo / Tag:</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold">
                    {intent.depositMemo}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(intent.depositMemo || "", "memo")
                    }
                    className="rounded bg-amber-200 px-2 py-0.5 text-xs font-medium text-amber-900 hover:bg-amber-300"
                  >
                    {copiedField === "memo" ? "Copied!" : "Copy Memo"}
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-amber-800">
                  You must attach this memo to your transfer or funds will not credit.
                </p>
              </div>
            )}

            {intent.expectedReceived && (
              <p className="text-xs text-slate-600">
                You&apos;ll receive ≈{" "}
                <strong className="text-slate-900">
                  {intent.expectedReceived} {intent.toAsset}
                </strong>{" "}
                in your Solana wallet ({shortenAddress(walletAddress, 6)})
                {typeof intent.timeEstimateSec === "number"
                  ? ` (est. ~${intent.timeEstimateSec}s)`
                  : ""}
                .
              </p>
            )}

            <div className="rounded-lg border border-slate-200 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">Status</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    intent.status === "settled"
                      ? "bg-emerald-100 text-emerald-800"
                      : intent.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800 animate-pulse"
                  }`}
                >
                  {intent.status === "settled"
                    ? "Completed"
                    : intent.lastTxStatus || intent.status}
                </span>
              </div>
              {intent.status !== "settled" && intent.status !== "failed" && (
                <p className="text-[11px] text-slate-500">
                  Monitoring your deposit in real-time… (auto-updates every 5s)
                </p>
              )}
              {intent.status === "settled" && (
                <p className="text-xs font-medium text-emerald-700">
                  Deposit settled! The tokens have arrived in your Solana wallet.
                </p>
              )}
            </div>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              {intent.status !== "settled" && (
                <button
                  onClick={() => void submitIntent(intent.id)}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-emerald-700 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-800 disabled:bg-slate-300"
                >
                  {loading ? "Checking…" : "Check status now"}
                </button>
              )}
              <button
                onClick={reset}
                className={`rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 ${
                  intent.status === "settled" ? "w-full bg-slate-900 text-white hover:bg-slate-800" : ""
                }`}
              >
                {intent.status === "settled" ? "Done" : "Start over"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
