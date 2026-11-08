import type { YieldQuote } from "@/lib/protocols/types";
import { formatPct, formatUsd } from "@/lib/utils/format";

interface Props {
  quotes: YieldQuote[];
  bestId: string | null;
}

const PROTOCOL_LABEL: Record<YieldQuote["protocol"], string> = {
  lulo: "Lulo",
  jupiter: "Jupiter",
};

export function YieldTable({ quotes, bestId }: Props) {
  if (quotes.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600">
        No quotes available for this asset right now.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3 font-medium">Protocol</th>
            <th className="px-4 py-3 font-medium">Market</th>
            <th className="px-4 py-3 font-medium">Chain</th>
            <th className="px-4 py-3 text-right font-medium">Net APY</th>
            <th className="px-4 py-3 text-right font-medium">TVL</th>
            <th className="px-4 py-3 text-right font-medium">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {quotes.map((q) => {
            const id = `${q.protocol}-${q.marketId}`;
            const isBest = bestId === id;
            return (
              <tr key={id} className={isBest ? "bg-emerald-50" : undefined}>
                <td className="px-4 py-3 font-medium text-slate-900">
                  {PROTOCOL_LABEL[q.protocol]}
                  {isBest && (
                    <span className="ml-2 rounded bg-emerald-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                      Best
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-700">{q.market}</td>
                <td className="px-4 py-3 text-slate-700">{q.chain}</td>
                <td className="px-4 py-3 text-right font-semibold tabular-nums text-slate-900">
                  {formatPct(q.apyNet)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-slate-700">
                  {formatUsd(q.tvlUsd)}
                </td>
                <td className="px-4 py-3 text-right text-xs text-slate-500">
                  {q.source}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
