import { NextResponse } from "next/server";

const LULO_API_BASE = "https://api.lulo.fi";

const MINTS: Record<string, string> = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

interface LuloDepositRequest {
  owner: string;
  asset?: string;
  amount: number;
  mode?: "regular" | "protected";
  referrer?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: LuloDepositRequest;
  try {
    body = (await request.json()) as LuloDepositRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { owner, asset = "USDC", amount, mode = "regular", referrer } = body;

  if (!owner || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(owner.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana owner address." },
      { status: 400 }
    );
  }

  const mintAddress = MINTS[asset.toUpperCase()];
  if (!mintAddress) {
    return NextResponse.json(
      { error: `Lulo currently only supports USDC deposits. Provided: ${asset}` },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Deposit amount must be a positive number." },
      { status: 400 }
    );
  }

  const apiKey = process.env.LULO_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "LULO_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  const regularAmount = mode === "regular" ? amount : 0;
  const protectedAmount = mode === "protected" ? amount : 0;

  try {
    const res = await fetch(`${LULO_API_BASE}/v1/generate.transactions.deposit`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        owner: owner.trim(),
        feePayer: owner.trim(),
        mintAddress,
        depositAmount: amount,
        regularAmount,
        protectedAmount,
        ...(referrer ? { referrer: referrer.trim() } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Lulo deposit error (${res.status}): ${errText.slice(0, 300)}` },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { transaction?: string };
    if (!data.transaction) {
      return NextResponse.json(
        { error: "Lulo API did not return a serialized transaction." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transaction: data.transaction,
      asset: asset.toUpperCase(),
      mintAddress,
      amount,
      mode,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate Lulo deposit transaction",
      },
      { status: 500 }
    );
  }
}

