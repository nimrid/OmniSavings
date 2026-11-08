import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDT_MINT = new PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB");
const JL_USDC_MINT = new PublicKey("9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D");

function getAta(owner: PublicKey, mint: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const addressStr = searchParams.get("address");

  if (!addressStr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addressStr.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana wallet address." },
      { status: 400 }
    );
  }

  try {
    const owner = new PublicKey(addressStr.trim());
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");

    const usdcAta = getAta(owner, USDC_MINT);
    const usdtAta = getAta(owner, USDT_MINT);
    const jlUsdcAta = getAta(owner, JL_USDC_MINT);

    const luloApiKey = process.env.LULO_API_KEY;
    const luloPromise = luloApiKey
      ? fetch(`https://api.lulo.fi/v1/account.getAccount?owner=${owner.toBase58()}`, {
          headers: {
            "x-api-key": luloApiKey,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        })
          .then(async (r) => (r.ok ? ((await r.json()) as any) : null))
          .catch(() => null)
      : Promise.resolve(null);

    const [solLamports, usdcResult, usdtResult, jlUsdcResult, luloAccount] = await Promise.all([
      connection.getBalance(owner).catch(() => 0),
      connection.getTokenAccountBalance(usdcAta).catch(() => null),
      connection.getTokenAccountBalance(usdtAta).catch(() => null),
      connection.getTokenAccountBalance(jlUsdcAta).catch(() => null),
      luloPromise,
    ]);

    const sol = Number(solLamports) / 1e9;
    const usdc = usdcResult?.value?.uiAmount ?? 0;
    const usdt = usdtResult?.value?.uiAmount ?? 0;
    const jlUsdc = jlUsdcResult?.value?.uiAmount ?? 0;
    const luloProtected = Number(luloAccount?.pusdUsdBalance ?? 0);
    const luloRegular = Number(luloAccount?.lusdUsdBalance ?? 0);
    const luloTotalInterest = Number(luloAccount?.totalInterestEarned ?? 0);

    return NextResponse.json({
      address: owner.toBase58(),
      sol,
      usdc,
      usdt,
      jlUsdc,
      luloProtected,
      luloRegular,
      luloTotalInterest,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch Solana wallet balance",
      },
      { status: 500 }
    );
  }
}
