import { NextResponse } from "next/server";
import { TOKENIZED_EQUITIES, USDC_MINT } from "@/lib/stocks/equities";

const JUPITER_API_BASE = "https://api.jup.ag";

interface StockSwapRequest {
  user: string;
  targetMint: string;
  amountUsdc: number; // In human USDC (e.g. 5.0 for 5 USDC)
  slippageBps?: number;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: StockSwapRequest;
  try {
    body = (await request.json()) as StockSwapRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { user, targetMint, amountUsdc, slippageBps = 100 } = body;

  if (!user || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(user.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana user wallet address." },
      { status: 400 }
    );
  }

  // Find target equity in supported list
  const equity = Object.values(TOKENIZED_EQUITIES).find(
    (e) => e.mint.toLowerCase() === (targetMint || "").trim().toLowerCase()
  );

  if (!equity) {
    return NextResponse.json(
      { error: `Target mint is not an approved tokenized equity. Provided: ${targetMint}` },
      { status: 400 }
    );
  }

  if (typeof amountUsdc !== "number" || amountUsdc <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive number of USDC." },
      { status: 400 }
    );
  }

  const apiKey = process.env.JUPITER_API_KEY;

  try {
    // 1. Fetch exact routing quote from Jupiter Swap API
    const baseAmount = Math.round(amountUsdc * 1e6); // USDC has 6 decimals
    const quoteUrl = `${JUPITER_API_BASE}/swap/v1/quote?inputMint=${USDC_MINT}&outputMint=${equity.mint}&amount=${baseAmount}&slippageBps=${slippageBps}`;

    const quoteRes = await fetch(quoteUrl, {
      headers: { ...(apiKey ? { "x-api-key": apiKey } : {}) },
      cache: "no-store",
    });

    if (!quoteRes.ok) {
      const errText = await quoteRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Jupiter quote error (${quoteRes.status}): ${errText.slice(0, 300)}` },
        { status: quoteRes.status }
      );
    }

    const quoteData = (await quoteRes.json()) as any;

    if (!quoteData || !quoteData.outAmount) {
      return NextResponse.json(
        { error: "No liquidity route found on Jupiter for this tokenized equity swap." },
        { status: 502 }
      );
    }

    // 2. Generate signed Versioned V0 Transaction for user's Solana wallet
    const swapRes = await fetch(`${JUPITER_API_BASE}/swap/v1/swap`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify({
        quoteResponse: quoteData,
        userPublicKey: user.trim(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
      cache: "no-store",
    });

    if (!swapRes.ok) {
      const errText = await swapRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Jupiter swap error (${swapRes.status}): ${errText.slice(0, 300)}` },
        { status: swapRes.status }
      );
    }

    const swapData = (await swapRes.json()) as { swapTransaction?: string };

    if (!swapData.swapTransaction) {
      return NextResponse.json(
        { error: "Jupiter did not return a valid serialized swap transaction." },
        { status: 502 }
      );
    }

    const outHuman = Number(quoteData.outAmount) / 10 ** equity.decimals;

    return NextResponse.json({
      swapTransaction: swapData.swapTransaction,
      inAmountUsdc: amountUsdc,
      outAmountTokens: outHuman,
      targetSymbol: equity.symbol,
      targetName: equity.name,
      targetMint: equity.mint,
      priceImpactPct: quoteData.priceImpactPct ?? "0",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate on-chain equity swap transaction",
      },
      { status: 500 }
    );
  }
}

