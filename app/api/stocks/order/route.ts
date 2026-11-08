import { NextResponse } from "next/server";

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

    const numShares = numAmount / numPrice;
    const now = new Date().toISOString();
    const orderId = `BKP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const order: StockOrder = {
      id: orderId,
      user,
      symbol,
      ticker,
      side,
      shares: numShares,
      priceUsd: numPrice,
      totalUsd: numAmount,
      timestamp: now,
      status: "FILLED",
    };

    const key = user.toLowerCase();
    if (!holdingsStore.has(key)) {
      holdingsStore.set(key, new Map());
    }
    const userMap = holdingsStore.get(key)!;
    const existing = userMap.get(symbol);

    if (side === "buy") {
      if (existing) {
        const newShares = existing.shares + numShares;
        const newTotalCost = existing.totalCostUsd + numAmount;
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
          shares: numShares,
          avgCostUsd: numPrice,
          totalCostUsd: numAmount,
          currentPrice: numPrice,
          currentValueUsd: numAmount,
          unrealizedPnlUsd: 0,
          unrealizedPnlPct: 0,
          updatedAt: now,
        });
      }
    } else {
      // Sell
      if (!existing || existing.shares < numShares * 0.99) {
        return NextResponse.json(
          { error: `Insufficient shares to sell. You own ${existing?.shares.toFixed(4) ?? 0} shares.` },
          { status: 400 }
        );
      }
      const remainingShares = Math.max(0, existing.shares - numShares);
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
