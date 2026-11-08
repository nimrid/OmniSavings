import type {
  AggregatedAPY,
  ProtocolAdapter,
  ProtocolId,
  YieldQuote,
} from "./types";
import { luloAdapter } from "./lulo";
import { jupiterAdapter } from "./jupiter";

export const registry: ProtocolAdapter[] = [luloAdapter, jupiterAdapter];

/** Aggregate quotes across adapters; each adapter failure is isolated. */
export async function aggregateQuotes(asset: string): Promise<AggregatedAPY> {
  const settled = await Promise.allSettled(
    registry.map((adapter) => adapter.fetchQuotes(asset))
  );
  const quotes: YieldQuote[] = [];
  const errors: Partial<Record<ProtocolId, string>> = {};
  settled.forEach((result, i) => {
    const adapter = registry[i];
    if (result.status === "fulfilled") {
      quotes.push(...result.value);
    } else {
      errors[adapter.id] =
        result.reason instanceof Error
          ? result.reason.message
          : String(result.reason);
    }
  });
  quotes.sort((a, b) => b.apyNet - a.apyNet);
  return {
    asset: asset.toUpperCase(),
    best: quotes[0] ?? null,
    quotes,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
