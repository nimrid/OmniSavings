import { NextResponse } from "next/server";
import { PublicKey, Connection } from "@solana/web3.js";
import { deriveUserSavingsPDA, decodeUserSavings } from "@/lib/vault/builder";
import { SUPPORTED_ASSETS, VAULT_PROGRAM_ID } from "@/lib/vault/constants";

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const signerStr = searchParams.get("signer");
  const assetSymbol = (searchParams.get("asset") || "USDC").toUpperCase();

  if (!signerStr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(signerStr.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana signer address." },
      { status: 400 }
    );
  }

  const asset = SUPPORTED_ASSETS[assetSymbol];
  if (!asset) {
    return NextResponse.json(
      { error: `Unsupported asset: ${assetSymbol}` },
      { status: 400 }
    );
  }

  try {
    const signer = new PublicKey(signerStr.trim());
    const mint = new PublicKey(asset.mint);
    const [pda] = deriveUserSavingsPDA(signer, mint);

    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    const accountInfo = await connection.getAccountInfo(pda);

    if (!accountInfo) {
      return NextResponse.json({
        exists: false,
        pda: pda.toBase58(),
        programId: VAULT_PROGRAM_ID,
        asset: asset.symbol,
        owner: signer.toBase58(),
      });
    }

    const state = decodeUserSavings(accountInfo.data);
    if (!state) {
      return NextResponse.json(
        { error: "Failed to deserialize UserSavings account data." },
        { status: 500 }
      );
    }

    const divisor = 10 ** asset.decimals;
    return NextResponse.json({
      exists: true,
      pda: pda.toBase58(),
      programId: VAULT_PROGRAM_ID,
      asset: asset.symbol,
      owner: state.owner,
      totalDepositedRaw: state.totalDeposited.toString(),
      totalDeposited: Number(state.totalDeposited) / divisor,
      totalWithdrawnRaw: state.totalWithdrawn.toString(),
      totalWithdrawn: Number(state.totalWithdrawn) / divisor,
      depositCount: Number(state.depositCount),
      withdrawCount: Number(state.withdrawCount),
      savingsGoalRaw: state.savingsGoal.toString(),
      savingsGoal: Number(state.savingsGoal) / divisor,
      firstDepositTime: state.firstDepositTime,
      lastDepositTime: state.lastDepositTime,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to query user savings account.",
      },
      { status: 500 }
    );
  }
}

