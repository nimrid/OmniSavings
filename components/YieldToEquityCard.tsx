"use client";

import { useState, useEffect } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useVault } from "@/hooks/useVault";
import { formatPct } from "@/lib/utils/format";

interface EquityOption {
  symbol: string;
  name: string;
  mint: string;
  priceUsd: number;
  decimals: number;
  category: string;
  issuer: string;
  icon: string;
  description?: string;
  tokensPer10Usdc: number;
}

export function YieldToEquityCard() {
  const { primaryWallet } = useConnectedWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { balance, refetch: refetchBalance } = useWalletBalance(primaryWallet?.address);
  const { account } = useVault("USDC");

  const [equities, setEquities] = useState<EquityOption[]>([]);
  const [selectedMint, setSelectedMint] = useState<string>("");
  const [amountUsdc, setAmountUsdc] = useState<string>("5");
  const [loadingEquities, setLoadingEquities] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [lastSwapInfo, setLastSwapInfo] = useState<{ symbol: string; tokens: number } | null>(null);

  // Fetch live tokenized equities on Solana
  useEffect(() => {
    async function loadEquities() {
      setLoadingEquities(true);
      try {
        const res = await fetch("/api/stocks/equities");
        if (res.ok) {
          const data = (await res.json()) as { equities: EquityOption[] };
          setEquities(data.equities);
          if (data.equities.length > 0 && !selectedMint) {
            setSelectedMint(data.equities[0].mint);
          }
        }
      } catch {
        // ignore
      } finally {
        setLoadingEquities(false);
      }
    }
    void loadEquities();
  }, [selectedMint]);

  const selectedEquity = equities.find((e) => e.mint === selectedMint) || equities[0];

  // Calculate estimated yield or available cash for DCA
  const usdcBalance = balance?.usdc ?? 0;
  const luloYield = (balance?.luloProtected ?? 0) > 0 ? (balance?.luloProtected ?? 0) * 0.0515 / 12 : 0;
  const jupYield = (account?.totalDeposited ?? 0) > 0 ? (account?.totalDeposited ?? 0) * 0.0479 / 12 : 0;
  const estimatedMonthlyYield = luloYield + jupYield;

  const numAmount = Number(amountUsdc);
  const estimatedTokens =
    selectedEquity && selectedEquity.priceUsd > 0 && !isNaN(numAmount)
      ? numAmount / selectedEquity.priceUsd
      : 0;

  const handleExecuteSwap = async () => {
    if (!primaryWallet?.address) {
      setError("Please connect a Solana wallet first.");
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount of yield/USDC to invest.");
      return;
    }

    if (numAmount > usdcBalance && usdcBalance > 0) {
      setError(`Amount exceeds your available wallet balance (${usdcBalance.toFixed(2)} USDC).`);
      return;
    }

    setSwapping(true);
    setError(null);
    setTxSignature(null);

    try {
      const res = await fetch("/api/stocks/swap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          user: primaryWallet.address,
          targetMint: selectedEquity.mint,
          amountUsdc: numAmount,
          slippageBps: 100, // 1%
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Swap failed: ${res.statusText}`);
      }

      const swapData = (await res.json()) as {
        swapTransaction: string;
        outAmountTokens: number;
        targetSymbol: string;
      };

      const txBytes = Uint8Array.from(Buffer.from(swapData.swapTransaction, "base64"));

      // Prompt user to sign V0 transaction via Privy
      const sendRes = await signAndSendTransaction({
        transaction: txBytes,
        wallet: primaryWallet as any,
      });

      const signature = getBase58Decoder().decode(sendRes.signature);
      setTxSignature(signature);
      setLastSwapInfo({
        symbol: swapData.targetSymbol,
        tokens: swapData.outAmountTokens,
      });

      // Refetch balance after execution
      setTimeout(() => {
        void refetchBalance();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to execute equity swap.");
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50/50 via-white to-slate-50 p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold text-sm shadow">
            📈
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900">
                Yield-to-Equity Auto-Invest
              </h3>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                Real On-Chain Equities
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Deploy passive savings interest into tokenized US stocks & S&P 500 — with zero principal risk
            </p>
          </div>
        </div>

        {estimatedMonthlyYield > 0 && (
          <div className="rounded-md bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            ~${estimatedMonthlyYield.toFixed(2)}/mo Yield Accruing
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Left: Target Equity Selection */}
        <div className="space-y-3">
          <label className="block text-xs font-medium text-slate-700">
            Select Target Tokenized Equity (Solana Mainnet)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {equities.map((eq) => {
              const isSelected = selectedMint === eq.mint;
              return (
                <button
                  key={eq.mint}
                  type="button"
                  onClick={() => setSelectedMint(eq.mint)}
                  className={`rounded-lg border p-2.5 text-left transition-all ${
                    isSelected
                      ? "border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 shadow-sm"
                      : "border-slate-200 hover:bg-slate-50 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{eq.icon}</span>
                    <span className="font-bold text-xs text-slate-900">
                      ${eq.priceUsd > 0 ? eq.priceUsd.toFixed(2) : "…"}
                    </span>
                  </div>
                  <div className="mt-1 font-semibold text-xs text-slate-900">
                    {eq.symbol}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate" title={eq.name}>
                    {eq.name}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedEquity && (
            <div className="rounded-lg bg-white border border-slate-200 p-2.5 text-[11px] text-slate-600 space-y-1">
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Issuer:</span>
                <span className="text-slate-900">{selectedEquity.issuer}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-slate-700">Category:</span>
                <span className="text-slate-900">{selectedEquity.category}</span>
              </div>
              <p className="text-slate-500 pt-1 border-t border-slate-100">
                {selectedEquity.description}
              </p>
            </div>
          )}
        </div>

        {/* Right: Allocation & Real Execution */}
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-700">
                Yield to Invest (USDC)
              </label>
              <span className="text-[11px] text-slate-500">
                Available: ${usdcBalance.toFixed(2)} USDC
              </span>
            </div>
            <input
              type="number"
              min="0.1"
              step="any"
              value={amountUsdc}
              onChange={(e) => setAmountUsdc(e.target.value)}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none"
              placeholder="e.g. 5"
            />
            {/* Quick Chips */}
            <div className="mt-1.5 flex gap-1.5">
              {["1", "5", "10", "25"].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountUsdc(val)}
                  className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-200"
                >
                  ${val}
                </button>
              ))}
              {usdcBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountUsdc(usdcBalance.toString())}
                  className="rounded bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-200"
                >
                  Max (${usdcBalance.toFixed(2)})
                </button>
              )}
            </div>
          </div>

          {/* Execution Preview Card */}
          <div className="rounded-lg bg-emerald-50/60 border border-emerald-100 p-3 text-xs space-y-1.5 text-slate-700">
            <div className="flex justify-between items-center">
              <span className="font-medium">You Deploy:</span>
              <span className="font-bold text-slate-900">{amountUsdc || "0"} USDC</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">You Receive:</span>
              <span className="font-bold text-emerald-800">
                ~{estimatedTokens.toFixed(6)} {selectedEquity?.symbol}
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 border-t border-emerald-200/50 pt-1">
              <span>Routing Protocol:</span>
              <span>Jupiter DEX (Solana Mainnet)</span>
            </div>
          </div>

          {txSignature && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Swap executed on Solana!</span>
                <a
                  href={`https://solscan.io/tx/${txSignature}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 underline"
                >
                  View on Solscan ↗
                </a>
              </div>
              {lastSwapInfo && (
                <p className="text-[11px] text-emerald-800">
                  Received ~{lastSwapInfo.tokens.toFixed(6)} {lastSwapInfo.symbol} directly to your wallet.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={swapping || !primaryWallet}
            className="w-full rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-50 transition-colors"
          >
            {swapping
              ? "Routing via Jupiter & Signing…"
              : `Invest ${amountUsdc} USDC into ${selectedEquity?.symbol || "Equity"}`}
          </button>
        </div>
      </div>
    </div>
  );
}
