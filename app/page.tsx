import Link from "next/link";

const HIGHLIGHTS = [
  {
    title: "On-Chain Jupiter Earn CPI Vault",
    tag: "Anchor Program",
    desc: "Direct Cross-Program Invocation into Jupiter Lend Earn (jup3YeL...); tracks deposits, goal metrics, and yields on Solana.",
    color: "bg-indigo-50 text-indigo-700 border-indigo-200",
  },
  {
    title: "Yield-to-Equity Auto-Invest",
    tag: "Backpack Exchange",
    desc: "Never risk your principal. Automatically allocate accrued savings yield into 24/7 tokenized US stocks & indices (NVDA, AAPL, SPY).",
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    title: "Universal Cross-Chain Inflow",
    tag: "Aurora Intents",
    desc: "Fund your Solana savings account directly from 8+ chains (Ethereum, Base, Arbitrum, BSC, Optimism, Polygon, Avalanche).",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  {
    title: "Zero-Friction Embedded Onboarding",
    tag: "Privy Auth",
    desc: "Sign in with Google or Email; an embedded Solana wallet is automatically created with zero seed phrase friction.",
    color: "bg-sky-50 text-sky-700 border-sky-200",
  },
];

const PROTOCOLS = [
  {
    name: "On-Chain Vault (CPI)",
    chain: "Solana",
    note: "Anchor Program `AhYUb1t...ktTT` calling Jupiter Lend Earn",
  },
  {
    name: "Jupiter Earn",
    chain: "Solana",
    note: "jlToken lending markets (jlUSDC, jlUSDT)",
  },
  {
    name: "Lulo",
    chain: "Solana",
    note: "Flexible savings and principal-protected lending",
  },
  {
    name: "Backpack Exchange",
    chain: "Solana RWA",
    note: "24/7 Tokenized Equities & Index ETFs (NVDA, AAPL, SPY, QQQ, TSLA)",
  },
];

export default function HomePage() {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-3 py-1 text-xs font-semibold text-indigo-800">
        <span>🏆</span>
        <span>Built for the MLH Solana Hackathon — DeFi Track</span>
      </div>

      <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
        Universal Autonomous DeFi Savings on Solana
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-600">
        Compare stablecoin yields in real time, bridge funds from 8+ chains in a single transaction via Aurora Intents, and earn automated yields through our on-chain <strong>Jupiter Earn CPI Vault</strong>.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-emerald-700 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-800 transition-colors"
        >
          Open Yield Dashboard →
        </Link>
        <Link
          href="/stocks"
          className="inline-block rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors"
        >
          Stock RWAs & Auto-DCA →
        </Link>
        <a
          href="https://github.com/your-username/defi-savings-app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
        >
          View On-Chain Program Code
        </a>
      </div>

      <div className="mt-12">
        <h2 className="text-xl font-bold text-slate-900">How OmniSavings Works</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h) => (
            <div
              key={h.title}
              className={`rounded-xl border p-4 shadow-sm ${h.color}`}
            >
              <span className="text-[11px] font-bold uppercase tracking-wider">
                {h.tag}
              </span>
              <h3 className="mt-1 font-semibold text-slate-900">{h.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-12 text-xl font-bold text-slate-900">
        Live Protocols & Yield Markets
      </h2>
      <ul className="mt-4 divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {PROTOCOLS.map((p) => (
          <li key={p.name} className="flex items-center justify-between px-5 py-4">
            <div>
              <span className="font-semibold text-slate-900">{p.name}</span>
              <p className="text-xs text-slate-500 mt-0.5">{p.note}</p>
            </div>
            <span className="rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
              {p.chain}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 leading-relaxed">
        <p className="font-semibold text-slate-800">Judge & Developer Quick Check:</p>
        <p className="mt-1">
          Our Anchor contract (`onchain`) is compiled to SBF bytecode and deployed with Program ID <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-indigo-700">AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT</code>. It exposes <code className="font-mono bg-white px-1 py-0.5 rounded">initialize_user_savings</code>, <code className="font-mono bg-white px-1 py-0.5 rounded">deposit_to_jupiter</code>, and <code className="font-mono bg-white px-1 py-0.5 rounded">withdraw_from_jupiter</code> with atomic CPI invocations.
        </p>
      </div>
    </div>
  );
}
