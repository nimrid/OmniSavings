import { NextResponse } from "next/server";
import { getIntent, updateIntent } from "@/lib/intents/store";
import { getTransactions, type IntentsTransaction } from "@/lib/intents/client";

/**
 * The Intents deposit itself is a plain user transfer to the quoted deposit
 * address. "Submit" checks for live transaction progress and reconciles status
 * with the Aurora Intents solver network.
 */
export async function POST(request: Request): Promise<NextResponse> {
  let body: { intentId?: string };
  try {
    body = (await request.json()) as { intentId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  if (!body.intentId) {
    return NextResponse.json({ error: "Missing intentId" }, { status: 400 });
  }
  const intent = getIntent(body.intentId);
  if (!intent) {
    return NextResponse.json({ error: "Unknown intentId" }, { status: 404 });
  }
  if (intent.status === "settled" || intent.status === "failed") {
    return NextResponse.json(intent);
  }
  try {
    // Check both refund address (origin) and recipient address (destination)
    let txs: IntentsTransaction[] = await getTransactions(intent.user);
    if (!txs.length && intent.recipient && intent.recipient !== intent.user) {
      const recipientTxs = await getTransactions(intent.recipient);
      txs = recipientTxs;
    }

    const match = txs.find(
      (t) =>
        t.depositAddress &&
        intent.depositAddress &&
        t.depositAddress.toLowerCase() === intent.depositAddress.toLowerCase()
    );
    const status = typeof match?.status === "string" ? match.status : undefined;

    if (status === "SUCCESS") {
      return NextResponse.json(
        updateIntent(intent.id, { status: "settled", lastTxStatus: status })
      );
    }
    if (status === "FAILED" || status === "REFUNDED") {
      return NextResponse.json(
        updateIntent(intent.id, { status: "failed", lastTxStatus: status })
      );
    }
    return NextResponse.json(
      updateIntent(intent.id, {
        status: status === "PROCESSING" ? "submitted" : intent.status,
        lastTxStatus: status ?? intent.lastTxStatus ?? "PENDING_DEPOSIT",
      })
    );
  } catch (err) {
    return NextResponse.json(
      updateIntent(intent.id, { status: "submitted" }) ?? {
        error: err instanceof Error ? err.message : "Status check failed",
      }
    );
  }
}
