import Link from "next/link";

const PROTOCOLS = [
  { name: "Lulo", chain: "Solana", note: "Regular + Protected rates, live API" },
  { name: "Jupiter Earn", chain: "Solana", note: "jlToken lending markets" },
];

export default function HomePage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        Stablecoin savings, compared honestly.
      </h1>
      <p className="mt-3 text-base leading-relaxed text-slate-700">
        One dashboard for USDC and USDT yields on Solana. Pick the best rate,
        then deposit from any chain with a single transfer through Aurora
        Intents.
      </p>
      <div className="mt-6">
        <Link
          href="/dashboard"
          className="inline-block rounded-md bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Open the dashboard
        </Link>
      </div>
      <h2 className="mt-10 text-lg font-semibold text-slate-900">
        Covered protocols
      </h2>
      <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
        {PROTOCOLS.map((p) => (
          <li key={p.name} className="flex items-baseline justify-between px-4 py-3">
            <div>
              <span className="font-medium text-slate-900">{p.name}</span>
              <span className="ml-2 text-sm text-slate-500">{p.note}</span>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              {p.chain}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-slate-600">
        Sign in with email or connect a Solana wallet to start. Quotes marked live come
        straight from protocol APIs or on-chain reads.
      </p>
    </div>
  );
}
