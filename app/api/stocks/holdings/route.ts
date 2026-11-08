import { NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { TOKENIZED_EQUITIES } from "@/lib/stocks/equities";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM_ID = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

function getAta(owner: PublicKey, mint: PublicKey, tokenProgram: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), tokenProgram.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const user = searchParams.get("user");

  if (!user || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(user.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana user wallet address." },
      { status: 400 }
    );
  }

  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const owner = new PublicKey(user.trim());

  const equities = Object.values(TOKENIZED_EQUITIES);

  try {
    const holdings = await Promise.all(
      equities.map(async (eq) => {
        const mint = new PublicKey(eq.mint);

        // xStocks are Token-2022 tokens, USDY is standard Tokenkeg
        const ataToken2022 = getAta(owner, mint, TOKEN_2022_PROGRAM_ID);
        const ataStandard = getAta(owner, mint, TOKEN_PROGRAM_ID);

        const [res2022, resStandard] = await Promise.all([
          connection.getTokenAccountBalance(ataToken2022).catch(() => null),
          connection.getTokenAccountBalance(ataStandard).catch(() => null),
        ]);

        const shares = (res2022?.value?.uiAmount ?? 0) + (resStandard?.value?.uiAmount ?? 0);

        return {
          symbol: eq.symbol,
          name: eq.name,
          mint: eq.mint,
          shares,
          category: eq.category,
          icon: eq.icon,
        };
      })
    );

    return NextResponse.json({
      user: owner.toBase58(),
      holdings: holdings.filter((h) => h.shares > 0),
      allTokens: holdings,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to fetch on-chain equity holdings",
      },
      { status: 500 }
    );
  }
}
