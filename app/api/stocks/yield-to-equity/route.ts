import { NextResponse } from "next/server";
import type { YieldToEquityRule } from "@/lib/backpack/types";

// In-memory persistent rule store (keyed by user address)
const rulesStore = new Map<string, YieldToEquityRule>();

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user) {
    return NextResponse.json({ error: "Missing `user` parameter" }, { status: 400 });
  }

  const rule = rulesStore.get(user.toLowerCase()) || {
    user,
    enabled: false,
    sourceVault: "both",
    allocations: [
      { symbol: "SPY", percent: 50 },
      { symbol: "NVDA", percent: 50 },
    ],
    frequency: "weekly",
    totalInvestedUsd: 0,
  };

  return NextResponse.json(rule);
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Partial<YieldToEquityRule>;
    if (!body.user) {
      return NextResponse.json({ error: "User address is required" }, { status: 400 });
    }

    const key = body.user.toLowerCase();
    const existing = rulesStore.get(key) || {
      user: body.user,
      enabled: false,
      sourceVault: "both",
      allocations: [
        { symbol: "SPY", percent: 50 },
        { symbol: "NVDA", percent: 50 },
      ],
      frequency: "weekly",
      totalInvestedUsd: 0,
    };

    const updated: YieldToEquityRule = {
      ...existing,
      ...body,
      user: body.user,
      lastExecutedAt: new Date().toISOString(),
    };

    rulesStore.set(key, updated);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to update Yield-to-Equity rule",
      },
      { status: 500 }
    );
  }
}

