import { NextResponse } from "next/server";

const LULO_API_BASE = "https://api.lulo.fi";

export interface LuloAccountResponse {
  totalUsdValue: number;
  lusdUsdBalance: number;
  pusdUsdBalance: number;
  maxWithdrawable: {
    protected: Record<string, number>;
    regular: Record<string, number>;
  };
  totalInterestEarned: number;
  protectedInterestEarned: number;
  regularInterestEarned: number;
  blockTime: number;
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");

  if (!owner || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(owner.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana owner address." },
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
      `${LULO_API_BASE}/v1/account.getAccount?owner=${owner.trim()}`,
      {
        headers: { "x-api-key": apiKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        {
          totalUsdValue: 0,
          lusdUsdBalance: 0,
          pusdUsdBalance: 0,
          maxWithdrawable: { protected: {}, regular: {} },
          totalInterestEarned: 0,
          protectedInterestEarned: 0,
          regularInterestEarned: 0,
          blockTime: Math.floor(Date.now() / 1000),
        },
        { status: 200 }
      );
    }

    const data = (await res.json()) as LuloAccountResponse;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        totalUsdValue: 0,
        lusdUsdBalance: 0,
        pusdUsdBalance: 0,
        maxWithdrawable: { protected: {}, regular: {} },
        totalInterestEarned: 0,
        protectedInterestEarned: 0,
        regularInterestEarned: 0,
        blockTime: Math.floor(Date.now() / 1000),
        error: err instanceof Error ? err.message : "Failed to fetch Lulo account",
      },
      { status: 200 }
    );
  }
}
