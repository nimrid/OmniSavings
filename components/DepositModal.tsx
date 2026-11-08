"use client";

import { useEffect, useMemo, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Globe,
  ArrowRight,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
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
  const [amount, setAmount] = useState<string>("100");
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-900 text-white">
              <Globe className="h-4 w-4 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 font-sans">
                Fund Wallet with {asset}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                Cross-Chain Inflow via Aurora Intents (8+ EVM Chains)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-mono text-sm p-1"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!authenticated ? (
          <div className="mt-5 space-y-4 py-2">
            <p className="text-xs text-slate-600 leading-relaxed">
              Sign in with Google, email, or connect a Solana wallet first to generate your dedicated cross-chain deposit address.
            </p>
            <button
              onClick={() => void login()}
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-slate-800 transition font-mono"
            >
              Connect Wallet
            </button>
          </div>
        ) : isCreating ? (
          <div className="mt-5 space-y-2 py-6 text-center font-mono">
            <RefreshCw className="mx-auto h-5 w-5 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold text-slate-800">
              Generating your embedded Solana address…
            </p>
          </div>
        ) : wallets.length === 0 || !walletAddress ? (
          <div className="mt-5 space-y-3 py-2 text-xs">
            <p className="text-slate-600">
              No verified Solana account found. Please re-authenticate.
            </p>
            <button
              onClick={() => void login()}
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 font-mono"
            >
              Re-authenticate
            </button>
          </div>
        ) : intent === null ? (
          <div className="mt-4 space-y-3.5">
            {wallets.length > 1 ? (
              <label className="block text-xs font-mono">
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                  Destination Solana Account
                </span>
                <select
                  value={walletAddress}
                  onChange={(e) => {
                    setSelectedWalletAddress(e.target.value);
                    setSenderOverride("");
                  }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 shadow-2xs"
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
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs">
                <div className="flex items-center justify-between text-[10px] text-slate-500 uppercase">
                  <span>Destination Wallet</span>
                  <span className="font-semibold text-emerald-700">Solana Mainnet</span>
                </div>
                <p className="mt-1 font-bold text-slate-900 select-all" title={walletAddress}>
                  {shortenAddress(walletAddress, 8)}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              <label className="block">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Origin Chain
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
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {SUPPORTED_ORIGIN_CHAINS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Deposit Asset
                </span>
                <select
                  value={fromAsset}
                  onChange={(e) => setFromAsset(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  {currentChainConfig.assets.map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      {a.symbol}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block font-mono text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                Deposit Amount ({fromAsset})
              </span>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                inputMode="decimal"
                placeholder="100.00"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-900 shadow-2xs focus:border-slate-900 focus:outline-none"
              />
            </label>

            {previewLoading ? (
              <p className="text-[11px] text-slate-500 font-mono">
                Calculating solver routing quote…
              </p>
            ) : preview?.expectedReceived ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-950 font-mono">
                You receive ≈{" "}
                <strong className="text-emerald-900">
                  {preview.expectedReceived} {asset}
                </strong>{" "}
                on Solana
                {typeof preview.timeEstimateSec === "number"
                  ? ` (est. ~${preview.timeEstimateSec}s)`
                  : ""}
              </div>
            ) : null}

            <label className="block font-mono text-xs">
              <span className="text-[10px] uppercase font-semibold text-slate-500">
                Sender address on {currentChainConfig.label} (for refunds)
              </span>
              <input
                value={senderOverride}
                onChange={(e) => setSenderOverride(e.target.value.trim())}
                placeholder={defaultSender || "Address you will send from"}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono text-slate-800 shadow-2xs"
              />
            </label>

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700">
                {error}
              </p>
            )}

            <button
              onClick={() => void handleCreateDeposit()}
              disabled={loading || !sender || !walletAddress || !baseUnits}
              className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:bg-slate-300 transition font-mono"
            >
              {loading ? "Generating Intent Address…" : "Generate Cross-Chain Deposit Address"}
            </button>
          </div>
        ) : (
          <div className="mt-4 space-y-3.5 font-mono text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                Send exactly {amount} {fromAsset} on {currentChainConfig.label} to:
              </p>
              <div className="mt-2 flex items-center justify-between gap-2 rounded bg-white p-2 border border-slate-200">
                <span className="text-xs font-semibold text-slate-900 break-all select-all">
                  {intent.depositAddress}
                </span>
                <button
                  onClick={() =>
                    copyToClipboard(intent.depositAddress || "", "address")
                  }
                  className="shrink-0 rounded bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200"
                >
                  {copiedField === "address" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {intent.depositMemo && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-950">
                <p className="font-bold">Required Deposit Memo / Tag:</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-semibold">{intent.depositMemo}</span>
                  <button
                    onClick={() =>
                      copyToClipboard(intent.depositMemo || "", "memo")
                    }
                    className="rounded bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-950 hover:bg-amber-300"
                  >
                    {copiedField === "memo" ? "Copied" : "Copy Memo"}
                  </button>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-slate-200 p-3 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Settlement Status</span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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
                  Monitoring solver on-chain settlement… (updates every 5s)
                </p>
              )}
            </div>

            <div className="flex gap-2">
              {intent.status !== "settled" && (
                <button
                  onClick={() => void submitIntent(intent.id)}
                  disabled={loading}
                  className="flex-1 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-slate-800 disabled:bg-slate-300 font-mono"
                >
                  {loading ? "Checking…" : "Check Status"}
                </button>
              )}
              <button
                onClick={reset}
                className={`rounded-lg border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 font-mono ${
                  intent.status === "settled" ? "w-full bg-slate-900 text-white hover:bg-slate-800" : ""
                }`}
              >
                {intent.status === "settled" ? "Done" : "New Deposit"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
