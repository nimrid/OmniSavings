import { NextResponse } from "next/server";
import { getStockQuotes } from "@/lib/backpack/client";

export async function GET(): Promise<NextResponse> {
  try {
    const quotes = await getStockQuotes();
    return NextResponse.json({
      quotes,
      count: quotes.length,
      source: "Backpack Exchange (24/7 RWA Orderbook)",
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch Backpack stock quotes",
      },
      { status: 500 }
    );
  }
}
