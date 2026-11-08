import { NextResponse } from "next/server";
import { executeBackpackOrderLive, hasBackpackCredentials } from "@/lib/backpack/client";

export interface StockPosition {
  symbol: string;
  ticker: string;
  name: string;
  shares: number;
  avgCostUsd: number;
  totalCostUsd: number;
  currentPrice: number;
  currentValueUsd: number;
  unrealizedPnlUsd: number;
  unrealizedPnlPct: number;
  updatedAt: string;
}

export interface StockOrder {
  id: string;
  user: string;
  symbol: string;
  ticker: string;
  side: "buy" | "sell";
  shares: number;
  priceUsd: number;
  totalUsd: number;
  timestamp: string;
  status: "FILLED";
  executionMode: "LIVE_BACKPACK";
  backpackOrderId: string;
}

// In-memory portfolio and order stores
const holdingsStore = new Map<string, Map<string, StockPosition>>();
const ordersStore = new Map<string, StockOrder[]>();

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user) {
    return NextResponse.json({ error: "Missing `user` parameter" }, { status: 400 });
  }

  const key = user.toLowerCase();
  const userHoldings = holdingsStore.get(key);
  const positions: StockPosition[] = userHoldings ? Array.from(userHoldings.values()) : [];
  const orders = ordersStore.get(key) || [];

  const totalPortfolioValueUsd = positions.reduce((acc, p) => acc + p.currentValueUsd, 0);
  const totalCostUsd = positions.reduce((acc, p) => acc + p.totalCostUsd, 0);
  const totalPnlUsd = totalPortfolioValueUsd - totalCostUsd;
  const totalPnlPct = totalCostUsd > 0 ? (totalPnlUsd / totalCostUsd) * 100 : 0;

  return NextResponse.json({
    user,
    positions,
    orders: orders.slice(-20).reverse(),
    totalPortfolioValueUsd,
    totalCostUsd,
    totalPnlUsd,
    totalPnlPct,
    liveTradingAvailable: hasBackpackCredentials(),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { user, symbol, ticker, name, side, amountUsd, price } = body;

    if (!user || !symbol || !ticker || !side || !amountUsd || !price) {
      return NextResponse.json({ error: "Missing required order fields" }, { status: 400 });
    }

    const numAmount = parseFloat(amountUsd);
    const numPrice = parseFloat(price);
    if (isNaN(numAmount) || numAmount <= 0 || isNaN(numPrice) || numPrice <= 0) {
      return NextResponse.json({ error: "Invalid amount or price" }, { status: 400 });
    }

    if (!hasBackpackCredentials()) {
      return NextResponse.json(
        {
          error:
            "Backpack Exchange API keys (BACKPACK_API_KEY and BACKPACK_API_SECRET) must be set in .env to place live orders.",
        },
        { status: 400 }
      );
    }

    const roundedShares = Math.floor((numAmount / numPrice) * 100) / 100;
    if (roundedShares < 0.01) {
      return NextResponse.json(
        {
          error: `Minimum order size on Backpack Exchange is 0.01 shares (approx $${(
            0.01 * numPrice
          ).toFixed(2)} USDC). Please increase your order amount.`,
        },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    let liveRes: any;

    try {
      liveRes = await executeBackpackOrderLive({
        symbol,
        side: side === "buy" ? "Bid" : "Ask",
        orderType: "Market",
        quantity: roundedShares.toFixed(2),
      });
    } catch (liveErr) {
      const errMsg = liveErr instanceof Error ? liveErr.message : String(liveErr);
      return NextResponse.json(
        {
          error: `Backpack Exchange order rejected: ${errMsg}. Note: Backpack Securities requires completed KYC and the one-time Securities trading agreement to be accepted at backpack.exchange.`,
        },
        { status: 400 }
      );
    }

    const backpackOrderId = String(
      liveRes?.id || liveRes?.orderId || `BKP-${Date.now()}`
    );

    const order: StockOrder = {
      id: backpackOrderId,
      user,
      symbol,
      ticker,
      side,
      shares: roundedShares,
      priceUsd: numPrice,
      totalUsd: roundedShares * numPrice,
      timestamp: now,
      status: "FILLED",
      executionMode: "LIVE_BACKPACK",
      backpackOrderId,
    };

    const key = user.toLowerCase();
    if (!holdingsStore.has(key)) {
      holdingsStore.set(key, new Map());
    }
    const userMap = holdingsStore.get(key)!;
    const existing = userMap.get(symbol);

    if (side === "buy") {
      const actualAmountUsd = roundedShares * numPrice;
      if (existing) {
        const newShares = existing.shares + roundedShares;
        const newTotalCost = existing.totalCostUsd + actualAmountUsd;
        const newAvg = newTotalCost / newShares;
        existing.shares = newShares;
        existing.totalCostUsd = newTotalCost;
        existing.avgCostUsd = newAvg;
        existing.currentPrice = numPrice;
        existing.currentValueUsd = newShares * numPrice;
        existing.unrealizedPnlUsd = existing.currentValueUsd - newTotalCost;
        existing.unrealizedPnlPct = (existing.unrealizedPnlUsd / newTotalCost) * 100;
        existing.updatedAt = now;
      } else {
        userMap.set(symbol, {
          symbol,
          ticker,
          name: name || ticker,
          shares: roundedShares,
          avgCostUsd: numPrice,
          totalCostUsd: actualAmountUsd,
          currentPrice: numPrice,
          currentValueUsd: actualAmountUsd,
          unrealizedPnlUsd: 0,
          unrealizedPnlPct: 0,
          updatedAt: now,
        });
      }
    } else {
      // Sell
      if (!existing || existing.shares < roundedShares * 0.99) {
        return NextResponse.json(
          { error: `Insufficient shares to sell. You own ${existing?.shares.toFixed(4) ?? 0} shares.` },
          { status: 400 }
        );
      }
      const remainingShares = Math.max(0, existing.shares - roundedShares);
      if (remainingShares === 0) {
        userMap.delete(symbol);
      } else {
        existing.shares = remainingShares;
        existing.totalCostUsd = remainingShares * existing.avgCostUsd;
        existing.currentPrice = numPrice;
        existing.currentValueUsd = remainingShares * numPrice;
        existing.unrealizedPnlUsd = existing.currentValueUsd - existing.totalCostUsd;
        existing.unrealizedPnlPct = (existing.unrealizedPnlUsd / existing.totalCostUsd) * 100;
        existing.updatedAt = now;
      }
    }

    if (!ordersStore.has(key)) {
      ordersStore.set(key, []);
    }
    ordersStore.get(key)!.push(order);

    return NextResponse.json({
      success: true,
      order,
      executionMode: "LIVE_BACKPACK",
      position: userMap.get(symbol) || null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to process stock order",
      },
      { status: 500 }
    );
  }
}

