import { NextResponse } from "next/server";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createWithdrawFromJupiterInstruction,
  deriveUserSavingsPDA,
  JupiterWithdrawAccounts,
} from "@/lib/vault/builder";
import {
  SUPPORTED_ASSETS,
  JUPITER_EARN_PROGRAM_ID,
  VAULT_PROGRAM_ID,
} from "@/lib/vault/constants";

const JUPITER_API_BASE = "https://api.jup.ag";

interface VaultWithdrawRequest {
  signer: string;
  asset: string;
  amount: string; // Token base units or share units
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: VaultWithdrawRequest;
  try {
    body = (await request.json()) as VaultWithdrawRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { signer: signerStr, asset: assetSymbol, amount: amountStr } = body;

  if (!signerStr || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(signerStr.trim())) {
    return NextResponse.json(
      { error: "Invalid Solana signer address." },
      { status: 400 }
    );
  }

  const asset = SUPPORTED_ASSETS[(assetSymbol || "").toUpperCase()];
  if (!asset) {
    return NextResponse.json(
      { error: `Unsupported asset: ${assetSymbol}. Supported: USDC, USDT` },
      { status: 400 }
    );
  }

  if (!amountStr || isNaN(Number(amountStr)) || BigInt(amountStr) <= BigInt(0)) {
    return NextResponse.json(
      { error: "Withdraw amount must be a positive integer in base units." },
      { status: 400 }
    );
  }

  try {
    const signer = new PublicKey(signerStr.trim());
    const mint = new PublicKey(asset.mint);
    const amount = BigInt(amountStr.trim());

    // 1. Fetch protocol accounts context from Jupiter Earn API
    const apiKey = process.env.JUPITER_API_KEY;
    const jupRes = await fetch(`${JUPITER_API_BASE}/lend/v1/earn/withdraw`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(apiKey ? { "x-api-key": apiKey } : {}),
      },
      body: JSON.stringify({
        asset: asset.mint,
        signer: signer.toBase58(),
        amount: amount.toString(),
      }),
      cache: "no-store",
    });

    if (!jupRes.ok) {
      const errText = await jupRes.text().catch(() => "");
      return NextResponse.json(
        { error: `Jupiter API error (${jupRes.status}): ${errText.slice(0, 300)}` },
        { status: jupRes.status }
      );
    }

    const jupData = (await jupRes.json()) as { transaction?: string };
    if (!jupData.transaction) {
      return NextResponse.json(
        { error: "Jupiter did not return a valid withdrawal transaction." },
        { status: 502 }
      );
    }

    // 2. Deserialize Jupiter transaction to extract the 18 resolved protocol accounts
    const rawTx = VersionedTransaction.deserialize(Buffer.from(jupData.transaction, "base64"));
    const ix = rawTx.message.compiledInstructions[0];
    if (!ix || ix.accountKeyIndexes.length < 18) {
      return NextResponse.json(
        { error: "Unable to extract protocol accounts from Jupiter transaction." },
        { status: 502 }
      );
    }

    const keys = ix.accountKeyIndexes.map(idx => rawTx.message.staticAccountKeys[idx]);
    const jupiterAccounts: JupiterWithdrawAccounts = {
      ownerTokenAccount: keys[1],
      recipientTokenAccount: keys[2],
      lendingAdmin: keys[3],
      lending: keys[4],
      mint: keys[5],
      fTokenMint: keys[6],
      supplyTokenReservesLiquidity: keys[7],
      lendingSupplyPositionOnLiquidity: keys[8],
      rateModel: keys[9],
      vault: keys[10],
      claimAccount: keys[11],
      liquidity: keys[12],
      liquidityProgram: keys[13],
      rewardsRateModel: keys[14],
      tokenProgram: keys[15],
      associatedTokenProgram: keys[16],
      systemProgram: keys[17],
      lendingProgram: new PublicKey(JUPITER_EARN_PROGRAM_ID),
    };

    const [userSavingsPda] = deriveUserSavingsPDA(signer, mint);

    // 3. Build CPI withdraw instruction
    const withdrawIx = createWithdrawFromJupiterInstruction({
      signer,
      amount,
      jupiterAccounts,
    });

    // 4. Compile into a V0 Versioned Transaction with the fresh blockhash
    const messageV0 = new TransactionMessage({
      payerKey: signer,
      recentBlockhash: rawTx.message.recentBlockhash,
      instructions: [withdrawIx],
    }).compileToV0Message();

    const vaultTx = new VersionedTransaction(messageV0);
    const serialized = Buffer.from(vaultTx.serialize()).toString("base64");

    return NextResponse.json({
      transaction: serialized,
      userSavingsPda: userSavingsPda.toBase58(),
      programId: VAULT_PROGRAM_ID,
      asset: asset.symbol,
      mint: asset.mint,
      amount: amount.toString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to construct on-chain vault withdraw transaction.",
      },
      { status: 500 }
    );
  }
}

