import { NextResponse } from "next/server";

const JUPITER_API_BASE = "https://api.jup.ag";

const MINTS: Record<string, string> = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
};

interface DepositRequestBody {
  asset?: string;
  amount?: string;
  signer?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: DepositRequestBody;
  try {
    body = (await request.json()) as DepositRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const assetSymbol = (body.asset || "").toUpperCase();
  const mint = MINTS[assetSymbol] || body.asset;
  if (!mint) {
    return NextResponse.json(
      { error: `Unsupported asset: ${body.asset}. Supported: USDC, USDT` },
      { status: 400 }
    );
  }

  if (!body.signer || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(body.signer.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana signer address format." },
      { status: 400 }
    );
  }

  if (!body.amount || isNaN(Number(body.amount)) || Number(body.amount) <= 0) {
    return NextResponse.json(
      { error: "Amount must be a positive integer in base units." },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.JUPITER_API_KEY;
    const res = await fetch(`${JUPITER_API_BASE}/lend/v1/earn/deposit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify({
        asset: mint,
        signer: body.signer.trim(),
        amount: body.amount.trim(),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        {
          error: `Jupiter deposit API error (${res.status}): ${errText.slice(0, 300)}`,
        },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { transaction?: string };
    if (!data.transaction) {
      return NextResponse.json(
        { error: "Jupiter did not return a serialized transaction." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transaction: data.transaction,
      asset: assetSymbol,
      mint,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to construct Jupiter deposit transaction",
      },
      { status: 502 }
    );
  }
}

