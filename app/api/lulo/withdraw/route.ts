import { NextResponse } from "next/server";

const LULO_API_BASE = "https://api.lulo.fi";

const MINTS: Record<string, string> = {
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
};

interface LuloWithdrawRequest {
  owner: string;
  asset?: string;
  amount: number;
  feePayer?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: LuloWithdrawRequest;
  try {
    body = (await request.json()) as LuloWithdrawRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { owner, asset = "USDC", amount, feePayer } = body;

  if (!owner || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(owner.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana owner address." },
      { status: 400 }
    );
  }

  const mintAddress = MINTS[asset.toUpperCase()];
  if (!mintAddress) {
    return NextResponse.json(
      { error: `Lulo currently only supports USDC withdrawals. Provided: ${asset}` },
      { status: 400 }
    );
  }

  if (typeof amount !== "number" || amount <= 0) {
    return NextResponse.json(
      { error: "Withdrawal amount must be a positive number." },
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

  try {
    const res = await fetch(
      `${LULO_API_BASE}/v1/generate.transactions.withdrawProtected`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          owner: owner.trim(),
          feePayer: (feePayer || owner).trim(),
          mintAddress,
          amount,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let parsedMsg = errText;
      try {
        const parsed = JSON.parse(errText);
        if (parsed?.error?.message) {
          parsedMsg = parsed.error.message;
        }
      } catch {
        // use raw text
      }

      if (parsedMsg.includes("Account does not exist") || res.status === 500) {
        return NextResponse.json(
          {
            error:
              "No active Lulo Protected deposit account found for this wallet. Deposit into Lulo Protected first before withdrawing.",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Lulo withdraw error (${res.status}): ${parsedMsg.slice(0, 300)}` },
        { status: res.status }
      );
    }

    const data = (await res.json()) as { transaction?: string };
    if (!data.transaction) {
      return NextResponse.json(
        { error: "Lulo API did not return a serialized withdrawal transaction." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      transaction: data.transaction,
      asset: asset.toUpperCase(),
      mintAddress,
      amount,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to generate Lulo withdrawal transaction",
      },
      { status: 500 }
    );
  }
}
