import { NextResponse } from "next/server";
import { aggregateQuotes } from "@/lib/protocols";

// Quotes must always be live: never cache this route or its responses.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const asset = (searchParams.get("asset") || "USDC").toUpperCase();
  if (!["USDC", "USDT"].includes(asset)) {
    return NextResponse.json(
      { error: `Unsupported asset: ${asset}. Use USDC or USDT.` },
      { status: 400 }
    );
  }
  try {
    const data = await aggregateQuotes(asset);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "APY aggregation failed" },
      { status: 502 }
    );
  }
}
