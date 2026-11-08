"use client";

import { useState, useEffect } from "react";
import { useSignAndSendTransaction } from "@privy-io/react-auth/solana";
import { getBase58Decoder } from "@solana/kit";
import {
  TrendingUp,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { useConnectedWallets } from "@/hooks/useConnectedWallets";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { useVault } from "@/hooks/useVault";
import { StockIcon } from "./StockIcon";
import { shortenAddress } from "@/lib/utils/format";

export interface EquityOption {
  symbol: string;
  name: string;
  mint: string;
  priceUsd: number;
  decimals: number;
  category: string;
  description: string;
  issuer: string;
  backing?: string;
  tokenStandard?: string;
  isin?: string;
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
  const [slippageBps, setSlippageBps] = useState<number>(100); // 1.0%
  const [loadingEquities, setLoadingEquities] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [lastSwapInfo, setLastSwapInfo] = useState<{ symbol: string; tokens: number } | null>(null);

  const fetchEquities = async () => {
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
  };

  useEffect(() => {
    void fetchEquities();
  }, []);

  const selectedEquity = equities.find((e) => e.mint === selectedMint) || equities[0];

  // Calculate accrued yield metrics
  const usdcBalance = balance?.usdc ?? 0;
  const luloYield = (balance?.luloProtected ?? 0) > 0 ? ((balance?.luloProtected ?? 0) * 0.0515) / 12 : 0;
  const jupYield = (account?.totalDeposited ?? 0) > 0 ? ((account?.totalDeposited ?? 0) * 0.0479) / 12 : 0;
  const estimatedMonthlyYield = luloYield + jupYield;

  const numAmount = Number(amountUsdc);
  const estimatedTokens =
    selectedEquity && selectedEquity.priceUsd > 0 && !isNaN(numAmount) && numAmount > 0
      ? numAmount / selectedEquity.priceUsd
      : 0;

  const handleExecuteSwap = async () => {
    if (!primaryWallet?.address) {
      setError("Please connect your Solana wallet first.");
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid USDC amount to allocate.");
      return;
    }

    if (numAmount > usdcBalance && usdcBalance > 0) {
      setError(`Amount exceeds your available wallet balance ($${usdcBalance.toFixed(2)} USDC).`);
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
          slippageBps,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Jupiter swap quote failed (${res.statusText})`);
      }

      const swapData = (await res.json()) as {
        swapTransaction: string;
        outAmountTokens: number;
        targetSymbol: string;
      };

      const txBytes = Uint8Array.from(Buffer.from(swapData.swapTransaction, "base64"));

      // Prompt user to sign and send V0 transaction via Privy
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

      setTimeout(() => {
        void refetchBalance();
      }, 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Swap execution failed.");
    } finally {
      setSwapping(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
      {/* Terminal Title Bar */}
      <div className="border-b border-slate-200 bg-slate-50/70 p-4 sm:px-5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 text-white shadow-sm shrink-0">
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-semibold text-slate-900 tracking-tight font-sans">
                  Yield-to-Equity Allocation Desk
                </h3>
                <span className="inline-flex items-center rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800">
                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Jupiter V6 DEX
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Convert accrued savings yield into real tokenized US equities with zero principal risk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 sm:pt-0">
            {estimatedMonthlyYield > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm flex items-center gap-1.5 font-mono">
                <Zap className="h-3 w-3 text-amber-500" />
                <span className="text-slate-500 hidden sm:inline">Monthly Yield:</span>
                <span className="font-bold text-emerald-700">
                  +${estimatedMonthlyYield.toFixed(2)}
                </span>
              </div>
            )}
            <button
              onClick={() => void fetchEquities()}
              disabled={loadingEquities}
              title="Refresh pricing"
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingEquities ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Terminal Body */}
      <div className="p-4 sm:p-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Asset Selector & Depth (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 font-mono">
              1. Select Target Stock / ETF
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Live Jupiter Quotes
            </span>
          </div>

          {/* Equities Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {equities.map((eq) => {
              const isSelected = selectedMint === eq.mint;
              return (
                <button
                  key={eq.mint}
                  type="button"
                  onClick={() => {
                    setSelectedMint(eq.mint);
                    setError(null);
                  }}
                  className={`relative flex items-center justify-between rounded-xl border p-3 text-left transition-all ${
                    isSelected
                      ? "border-slate-900 bg-slate-900 text-white shadow-md ring-1 ring-slate-900"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70 text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <StockIcon symbol={eq.symbol} size={32} />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs">{eq.symbol}</span>
                        <span
                          className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                            isSelected
                              ? "bg-slate-800 text-slate-300"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {eq.category}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] truncate max-w-[130px] sm:max-w-[140px] font-sans ${
                          isSelected ? "text-slate-300" : "text-slate-500"
                        }`}
                      >
                        {eq.name}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <div className="font-bold text-xs tabular-nums">
                      ${eq.priceUsd > 0 ? eq.priceUsd.toFixed(2) : "…"}
                    </div>
                    <div
                      className={`text-[10px] ${
                        isSelected ? "text-emerald-300" : "text-emerald-700"
                      }`}
                    >
                      USDC / share
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Instrument Inspection Details */}
          {selectedEquity && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StockIcon symbol={selectedEquity.symbol} size={20} />
                  <span className="font-bold text-slate-900 font-sans">
                    {selectedEquity.name}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-slate-500 font-semibold">
                  {selectedEquity.tokenStandard || "Token-2022"}
                </span>
              </div>

              <p className="text-slate-600 leading-relaxed text-[11px]">
                {selectedEquity.backing || selectedEquity.description}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">
                    Issuer
                  </span>
                  <span className="font-medium text-slate-800 font-sans">{selectedEquity.issuer}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase">
                    ISIN Identifier
                  </span>
                  <span className="font-bold text-slate-800">
                    {selectedEquity.isin || "Regulated Swiss SBF"}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-slate-400 block text-[9px] uppercase">
                    Mint Contract
                  </span>
                  <a
                    href={`https://solscan.io/token/${selectedEquity.mint}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800"
                    title={selectedEquity.mint}
                  >
                    <span>{shortenAddress(selectedEquity.mint, 4)}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Order Desk (5 cols) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between font-mono">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                2. Order Desk & Routing
              </span>
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <span>Available:</span>
                <span className="font-bold text-slate-800 tabular-nums">
                  ${usdcBalance.toFixed(2)} USDC
                </span>
              </div>
            </div>

            {/* Input Amount */}
            <div>
              <label className="block text-xs font-medium text-slate-700 font-mono mb-1">
                USDC Yield to Allocate
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span className="font-mono font-bold text-slate-400 text-sm">$</span>
                </div>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={amountUsdc}
                  onChange={(e) => setAmountUsdc(e.target.value)}
                  placeholder="5.00"
                  className="block w-full rounded-lg border border-slate-300 bg-white pl-8 pr-16 py-2.5 font-mono text-sm font-semibold text-slate-900 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="font-mono text-xs font-semibold text-slate-500">USDC</span>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 font-mono">
                {["2", "5", "10", "25"].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmountUsdc(val)}
                    className="rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    ${val}
                  </button>
                ))}
                {estimatedMonthlyYield > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountUsdc(estimatedMonthlyYield.toFixed(2))}
                    className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors shadow-2xs"
                  >
                    1-Mo Yield (${estimatedMonthlyYield.toFixed(2)})
                  </button>
                )}
                {usdcBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmountUsdc(usdcBalance.toString())}
                    className="rounded border border-emerald-300 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
                  >
                    Max
                  </button>
                )}
              </div>
            </div>

            {/* Slippage Selector */}
            <div className="flex items-center justify-between text-xs pt-1 font-mono">
              <span className="text-slate-500 flex items-center gap-1">
                <SlidersHorizontal className="h-3 w-3" />
                Slippage Tolerance
              </span>
              <div className="flex items-center gap-1 text-xs">
                {[50, 100, 200].map((bps) => (
                  <button
                    key={bps}
                    type="button"
                    onClick={() => setSlippageBps(bps)}
                    className={`px-2 py-0.5 rounded border transition-colors ${
                      slippageBps === bps
                        ? "bg-slate-900 text-white border-slate-900 font-bold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {(bps / 100).toFixed(1)}%
                  </button>
                ))}
              </div>
            </div>

            {/* Quote Preview Box */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs space-y-2 shadow-2xs font-mono">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Route Protocol:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1 font-sans">
                  Jupiter Swap V6
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Estimated Output:</span>
                <div className="flex items-center gap-1.5">
                  <StockIcon symbol={selectedEquity?.symbol || "SPY"} size={16} />
                  <span className="font-bold text-slate-900 tabular-nums">
                    ~{estimatedTokens > 0 ? estimatedTokens.toFixed(6) : "0.000000"}{" "}
                    {selectedEquity?.symbol}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[11px] pt-1.5 border-t border-slate-100 text-slate-500">
                <span>Effective Price:</span>
                <span>
                  1 {selectedEquity?.symbol} ≈ ${selectedEquity?.priceUsd?.toFixed(2) || "0.00"} USDC
                </span>
              </div>
            </div>

            {/* Execution Result Banner */}
            {txSignature && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 space-y-1.5 font-mono">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-semibold font-sans">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    <span>Transaction Confirmed</span>
                  </div>
                  <a
                    href={`https://solscan.io/tx/${txSignature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline text-[11px]"
                  >
                    <span>Solscan</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {lastSwapInfo && (
                  <p className="text-[11px] text-emerald-800">
                    Acquired ~{lastSwapInfo.tokens.toFixed(6)} {lastSwapInfo.symbol} directly to self-custody wallet.
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={handleExecuteSwap}
            disabled={swapping || !primaryWallet}
            className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-xs font-semibold text-white shadow hover:bg-slate-800 active:bg-black disabled:opacity-50 transition-all font-mono tracking-tight mt-2"
          >
            {swapping ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Routing via Jupiter V6 & Signing…</span>
              </>
            ) : !primaryWallet ? (
              <span>Connect Wallet to Trade</span>
            ) : (
              <>
                <span>
                  Execute Swap ({amountUsdc || "0"} USDC → {selectedEquity?.symbol || "Equity"})
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
