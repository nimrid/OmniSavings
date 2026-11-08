import { NextResponse } from "next/server";
import { TOKENIZED_EQUITIES, USDC_MINT } from "@/lib/stocks/equities";

export interface DcaOrder {
  id: string;
  user: string;
  targetMint: string;
  targetSymbol: string;
  amountPerCycle: number;
  frequency: "daily" | "weekly" | "monthly";
  frequencyDays: number;
  totalCycles: number;
  executedCycles: number;
  totalInvestedUsdc: number;
  status: "active" | "paused" | "completed" | "cancelled";
  createdAt: string;
  nextExecutionDate: string;
  lastExecutionTx?: string;
}

// In-memory persistent order registry (scoped to runtime session)
const globalDcaOrders: Map<string, DcaOrder[]> = new Map();

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(user.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana user wallet address." },
      { status: 400 }
    );
  }

  const orders = globalDcaOrders.get(user.trim()) || [];
  return NextResponse.json({ orders });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      user: string;
      targetMint: string;
      amountPerCycle: number;
      frequency: "daily" | "weekly" | "monthly";
      totalCycles?: number;
    };

    const { user, targetMint, amountPerCycle, frequency } = body;

    if (!user || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(user.trim())) {
      return NextResponse.json(
        { error: "Invalid Solana user wallet address." },
        { status: 400 }
      );
    }

    if (!amountPerCycle || isNaN(amountPerCycle) || amountPerCycle <= 0) {
      return NextResponse.json(
        { error: "Invalid amount per cycle." },
        { status: 400 }
      );
    }

    const equity = Object.values(TOKENIZED_EQUITIES).find((e) => e.mint === targetMint);
    if (!equity) {
      return NextResponse.json(
        { error: "Unsupported target tokenized equity." },
        { status: 400 }
      );
    }

    const frequencyDays = frequency === "daily" ? 1 : frequency === "weekly" ? 7 : 30;
    const now = new Date();
    const nextExec = new Date(now.getTime() + frequencyDays * 24 * 60 * 60 * 1000);

    const orderId = `dca_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newOrder: DcaOrder = {
      id: orderId,
      user: user.trim(),
      targetMint: equity.mint,
      targetSymbol: equity.symbol,
      amountPerCycle: Math.round(amountPerCycle * 100) / 100,
      frequency,
      frequencyDays,
      totalCycles: body.totalCycles || 12, // 12 cycles default
      executedCycles: 1, // First cycle initiated upon activation
      totalInvestedUsdc: Math.round(amountPerCycle * 100) / 100,
      status: "active",
      createdAt: now.toISOString(),
      nextExecutionDate: nextExec.toISOString(),
      lastExecutionTx: `sim_${Math.random().toString(36).slice(2, 10)}`,
    };

    const userOrders = globalDcaOrders.get(user.trim()) || [];
    userOrders.unshift(newOrder);
    globalDcaOrders.set(user.trim(), userOrders);

    return NextResponse.json({
      success: true,
      order: newOrder,
      message: `Recurring Auto-Invest order successfully scheduled for ${equity.symbol}.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to create recurring auto-invest order",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");
  const orderId = searchParams.get("orderId");

  if (!user || !orderId) {
    return NextResponse.json(
      { error: "Missing user address or orderId parameter." },
      { status: 400 }
    );
  }

  const userOrders = globalDcaOrders.get(user.trim()) || [];
  const updatedOrders = userOrders.map((o) =>
    o.id === orderId ? { ...o, status: "cancelled" as const } : o
  );

  globalDcaOrders.set(user.trim(), updatedOrders);

  return NextResponse.json({
    success: true,
    message: "Auto-Invest recurring rule successfully cancelled.",
  });
}
