import { NextResponse } from "next/server";
import { buildDepositIntent } from "@/lib/intents/deposit";
import { saveIntent } from "@/lib/intents/store";

interface IntentBody {
  user?: string;
  fromChain?: string;
  fromAsset?: string;
  amount?: string;
  toAsset?: string;
  recipient?: string;
  dry?: boolean;
  originAssetId?: string;
  destinationAssetId?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: IntentBody;
  try {
    body = (await request.json()) as IntentBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const required: (keyof IntentBody)[] = [
    "user",
    "fromChain",
    "fromAsset",
    "amount",
    "toAsset",
    "recipient",
  ];
  const missing = required.filter(
    (k) => typeof body[k] !== "string" || (body[k] as string).trim() === ""
  );
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }
  try {
    const intent = await buildDepositIntent({
      user: (body.user as string).trim(),
      fromChain: (body.fromChain as string).trim(),
      fromAsset: (body.fromAsset as string).trim(),
      amount: (body.amount as string).trim(),
      toAsset: (body.toAsset as string).trim(),
      recipient: (body.recipient as string).trim(),
      dry: Boolean(body.dry),
      originAssetId: body.originAssetId,
      destinationAssetId: body.destinationAssetId,
    });

    if (!body.dry) {
      saveIntent(intent);
      return NextResponse.json(intent, { status: 201 });
    }

    return NextResponse.json(intent, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Failed to build deposit intent",
      },
      { status: 502 }
    );
  }
}
