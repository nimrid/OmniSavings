import { NextResponse } from "next/server";
import {
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  Connection,
} from "@solana/web3.js";
import {
  createInitializeUserSavingsInstruction,
  createDepositToJupiterInstruction,
  deriveUserSavingsPDA,
  JupiterDepositAccounts,
} from "@/lib/vault/builder";
import {
  SUPPORTED_ASSETS,
  JUPITER_EARN_PROGRAM_ID,
  VAULT_PROGRAM_ID,
} from "@/lib/vault/constants";

const JUPITER_API_BASE = "https://api.jup.ag";

interface VaultDepositRequest {
  signer: string;
  asset: string;
  amount: string; // token base units (e.g. 1000000 for 1 USDC)
  savingsGoal?: string; // target savings in token base units
}

export async function POST(request: Request): Promise<NextResponse> {
  let body: VaultDepositRequest;
  try {
    body = (await request.json()) as VaultDepositRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { signer: signerStr, asset: assetSymbol, amount: amountStr, savingsGoal: savingsGoalStr } = body;

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
      { error: "Amount must be a positive integer in base units." },
      { status: 400 }
    );
  }

  try {
    const signer = new PublicKey(signerStr.trim());
    const mint = new PublicKey(asset.mint);
    const amount = BigInt(amountStr.trim());
    const savingsGoal = savingsGoalStr && !isNaN(Number(savingsGoalStr))
      ? BigInt(savingsGoalStr.trim())
      : BigInt(5000) * (BigInt(10) ** BigInt(asset.decimals)); // Default 5000 units

    // 1. Fetch protocol accounts context from Jupiter Earn API
    const apiKey = process.env.JUPITER_API_KEY;
    const jupRes = await fetch(`${JUPITER_API_BASE}/lend/v1/earn/deposit`, {
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
        { error: "Jupiter did not return a valid transaction." },
        { status: 502 }
      );
    }

    // 2. Deserialize Jupiter transaction to extract the 17 resolved protocol accounts
    const rawTx = VersionedTransaction.deserialize(Buffer.from(jupData.transaction, "base64"));
    const ix = rawTx.message.compiledInstructions[0];
    if (!ix || ix.accountKeyIndexes.length < 17) {
      return NextResponse.json(
        { error: "Unable to extract protocol accounts from Jupiter transaction." },
        { status: 502 }
      );
    }

    const keys = ix.accountKeyIndexes.map(idx => rawTx.message.staticAccountKeys[idx]);
    const jupiterAccounts: JupiterDepositAccounts = {
      depositorTokenAccount: keys[1],
      recipientTokenAccount: keys[2],
      mint: keys[3],
      lendingAdmin: keys[4],
      lending: keys[5],
      fTokenMint: keys[6],
      supplyTokenReservesLiquidity: keys[7],
      lendingSupplyPositionOnLiquidity: keys[8],
      rateModel: keys[9],
      vault: keys[10],
      liquidity: keys[11],
      liquidityProgram: keys[12],
      rewardsRateModel: keys[13],
      tokenProgram: keys[14],
      associatedTokenProgram: keys[15],
      systemProgram: keys[16],
      lendingProgram: new PublicKey(JUPITER_EARN_PROGRAM_ID),
    };

    // 3. Check if user's on-chain savings PDA already exists
    const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    const [userSavingsPda] = deriveUserSavingsPDA(signer, mint);

    let needsInit = false;
    try {
      const acc = await connection.getAccountInfo(userSavingsPda);
      needsInit = !acc;
    } catch {
      // If RPC check fails, assume it may need init if not found
      needsInit = true;
    }

    const instructions = [];

    // Atomically prepend initialization if account doesn't exist
    if (needsInit) {
      instructions.push(
        createInitializeUserSavingsInstruction({
          signer,
          mint,
          savingsGoal,
        })
      );
    }

    // Append Jupiter Earn CPI instruction
    instructions.push(
      createDepositToJupiterInstruction({
        signer,
        amount,
        jupiterAccounts,
      })
    );

    // 4. Compile into a V0 Versioned Transaction with the fresh blockhash
    const messageV0 = new TransactionMessage({
      payerKey: signer,
      recentBlockhash: rawTx.message.recentBlockhash,
      instructions,
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
      isFirstDeposit: needsInit,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to construct on-chain vault deposit transaction.",
      },
      { status: 500 }
    );
  }
}
