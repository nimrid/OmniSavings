import { NextResponse } from "next/server";

const JUPITER_API_BASE = "https://api.jup.ag";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const users = searchParams.get("users") || searchParams.get("wallet");
  if (!users) {
    return NextResponse.json(
      { error: "Missing required query parameter: users (or wallet)" },
      { status: 400 }
    );
  }

  try {
    const apiKey = process.env.JUPITER_API_KEY;
    const res = await fetch(
      `${JUPITER_API_BASE}/lend/v1/earn/positions?users=${encodeURIComponent(users)}`,
      {
        headers: apiKey ? { "x-api-key": apiKey } : {},
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Jupiter positions error (${res.status}): ${errText.slice(0, 300)}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch Jupiter positions",
      },
      { status: 502 }
    );
  }
}

