import { NextResponse } from "next/server";
import { getStockKlines } from "@/lib/backpack/client";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");
  const interval = (searchParams.get("interval") as any) || "1h";
  const days = parseInt(searchParams.get("days") || "3", 10);

  if (!symbol) {
    return NextResponse.json(
      { error: "Query parameter `symbol` is required (e.g. NVDA.US_USDC_PERP)" },
      { status: 400 }
    );
  }

  try {
    const klines = await getStockKlines(symbol, interval, Math.min(days, 14));
    return NextResponse.json({
      symbol,
      interval,
      bars: klines.map((k) => ({
        time: k.start,
        open: parseFloat(k.open),
        high: parseFloat(k.high),
        low: parseFloat(k.low),
        close: parseFloat(k.close),
        volume: parseFloat(k.quoteVolume),
      })),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch stock chart data from Backpack",
      },
      { status: 500 }
    );
  }
}

