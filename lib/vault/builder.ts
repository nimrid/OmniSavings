import {
  PublicKey,
  TransactionInstruction,
  SystemProgram,
} from "@solana/web3.js";
import {
  VAULT_PROGRAM_ID,
  USER_SAVINGS_SEED,
  JUPITER_EARN_PROGRAM_ID,
} from "./constants";

export const INITIALIZE_USER_DISCRIMINATOR = Buffer.from([
  124, 170, 218, 172, 34, 13, 38, 166,
]);
export const DEPOSIT_TO_JUPITER_DISCRIMINATOR = Buffer.from([
  52, 229, 90, 101, 129, 24, 207, 242,
]);
export const WITHDRAW_FROM_JUPITER_DISCRIMINATOR = Buffer.from([
  187, 30, 204, 57, 201, 62, 109, 134,
]);

export interface UserSavingsAccountState {
  owner: string;
  assetMint: string;
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  depositCount: bigint;
  withdrawCount: bigint;
  firstDepositTime: number;
  lastDepositTime: number;
  savingsGoal: bigint;
  bump: number;
}

/**
 * Derives the PDA for a user's on-chain savings state for a specific asset mint
 */
export function deriveUserSavingsPDA(
  userPublicKey: PublicKey,
  mintPublicKey: PublicKey,
  programId: PublicKey = new PublicKey(VAULT_PROGRAM_ID)
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(USER_SAVINGS_SEED),
      userPublicKey.toBuffer(),
      mintPublicKey.toBuffer(),
    ],
    programId
  );
}

/**
 * Encodes a 64-bit unsigned integer as an 8-byte little-endian Buffer
 */
export function encodeU64(value: bigint | number): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

/**
 * Builds the instruction to initialize the user savings account PDA
 */
export function createInitializeUserSavingsInstruction(params: {
  signer: PublicKey;
  mint: PublicKey;
  savingsGoal: bigint | number;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = params.programId || new PublicKey(VAULT_PROGRAM_ID);
  const [userSavings] = deriveUserSavingsPDA(params.signer, params.mint, programId);

  const data = Buffer.concat([
    INITIALIZE_USER_DISCRIMINATOR,
    encodeU64(params.savingsGoal),
  ]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: params.signer, isSigner: true, isWritable: true },
      { pubkey: params.mint, isSigner: false, isWritable: false },
      { pubkey: userSavings, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export interface JupiterDepositAccounts {
  depositorTokenAccount: PublicKey;
  recipientTokenAccount: PublicKey;
  mint: PublicKey;
  lendingAdmin: PublicKey;
  lending: PublicKey;
  fTokenMint: PublicKey;
  supplyTokenReservesLiquidity: PublicKey;
  lendingSupplyPositionOnLiquidity: PublicKey;
  rateModel: PublicKey;
  vault: PublicKey;
  liquidity: PublicKey;
  liquidityProgram: PublicKey;
  rewardsRateModel: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
  lendingProgram?: PublicKey;
}

/**
 * Builds the instruction to deposit into Jupiter Lend Earn via our on-chain CPI program
 */
export function createDepositToJupiterInstruction(params: {
  signer: PublicKey;
  amount: bigint | number;
  jupiterAccounts: JupiterDepositAccounts;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = params.programId || new PublicKey(VAULT_PROGRAM_ID);
  const lendingProgramId =
    params.jupiterAccounts.lendingProgram ||
    new PublicKey(JUPITER_EARN_PROGRAM_ID);

  const [userSavings] = deriveUserSavingsPDA(
    params.signer,
    params.jupiterAccounts.mint,
    programId
  );

  const data = Buffer.concat([
    DEPOSIT_TO_JUPITER_DISCRIMINATOR,
    encodeU64(params.amount),
  ]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: params.signer, isSigner: true, isWritable: true },
      { pubkey: userSavings, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.depositorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.mint, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.lendingAdmin, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.lending, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.fTokenMint, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.supplyTokenReservesLiquidity, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.lendingSupplyPositionOnLiquidity, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.rateModel, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.vault, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.liquidity, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.liquidityProgram, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.rewardsRateModel, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.tokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.associatedTokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.systemProgram, isSigner: false, isWritable: false },
      { pubkey: lendingProgramId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

export interface JupiterWithdrawAccounts {
  ownerTokenAccount: PublicKey;
  recipientTokenAccount: PublicKey;
  lendingAdmin: PublicKey;
  lending: PublicKey;
  mint: PublicKey;
  fTokenMint: PublicKey;
  supplyTokenReservesLiquidity: PublicKey;
  lendingSupplyPositionOnLiquidity: PublicKey;
  rateModel: PublicKey;
  vault: PublicKey;
  claimAccount: PublicKey;
  liquidity: PublicKey;
  liquidityProgram: PublicKey;
  rewardsRateModel: PublicKey;
  tokenProgram: PublicKey;
  associatedTokenProgram: PublicKey;
  systemProgram: PublicKey;
  lendingProgram?: PublicKey;
}

/**
 * Builds the instruction to withdraw from Jupiter Lend Earn via our on-chain CPI program
 */
export function createWithdrawFromJupiterInstruction(params: {
  signer: PublicKey;
  amount: bigint | number;
  jupiterAccounts: JupiterWithdrawAccounts;
  programId?: PublicKey;
}): TransactionInstruction {
  const programId = params.programId || new PublicKey(VAULT_PROGRAM_ID);
  const lendingProgramId =
    params.jupiterAccounts.lendingProgram ||
    new PublicKey(JUPITER_EARN_PROGRAM_ID);

  const [userSavings] = deriveUserSavingsPDA(
    params.signer,
    params.jupiterAccounts.mint,
    programId
  );

  const data = Buffer.concat([
    WITHDRAW_FROM_JUPITER_DISCRIMINATOR,
    encodeU64(params.amount),
  ]);

  return new TransactionInstruction({
    programId,
    keys: [
      { pubkey: params.signer, isSigner: true, isWritable: true },
      { pubkey: userSavings, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.ownerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.recipientTokenAccount, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.lendingAdmin, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.lending, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.mint, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.fTokenMint, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.supplyTokenReservesLiquidity, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.lendingSupplyPositionOnLiquidity, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.rateModel, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.vault, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.claimAccount, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.liquidity, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.liquidityProgram, isSigner: false, isWritable: true },
      { pubkey: params.jupiterAccounts.rewardsRateModel, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.tokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.associatedTokenProgram, isSigner: false, isWritable: false },
      { pubkey: params.jupiterAccounts.systemProgram, isSigner: false, isWritable: false },
      { pubkey: lendingProgramId, isSigner: false, isWritable: false },
    ],
    data,
  });
}

/**
 * Deserializes an on-chain UserSavings account buffer into a typed object
 */
export function decodeUserSavings(buffer: Buffer): UserSavingsAccountState | null {
  if (buffer.length < 8 + 32 + 32 + 8 * 7 + 1) {
    return null;
  }
  let offset = 8; // skip 8-byte Anchor discriminator

  const owner = new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
  offset += 32;

  const assetMint = new PublicKey(buffer.subarray(offset, offset + 32)).toBase58();
  offset += 32;

  const totalDeposited = buffer.readBigUInt64LE(offset);
  offset += 8;

  const totalWithdrawn = buffer.readBigUInt64LE(offset);
  offset += 8;

  const depositCount = buffer.readBigUInt64LE(offset);
  offset += 8;

  const withdrawCount = buffer.readBigUInt64LE(offset);
  offset += 8;

  const firstDepositTime = Number(buffer.readBigInt64LE(offset));
  offset += 8;

  const lastDepositTime = Number(buffer.readBigInt64LE(offset));
  offset += 8;

  const savingsGoal = buffer.readBigUInt64LE(offset);
  offset += 8;

  const bump = buffer.readUInt8(offset);

  return {
    owner,
    assetMint,
    totalDeposited,
    totalWithdrawn,
    depositCount,
    withdrawCount,
    firstDepositTime,
    lastDepositTime,
    savingsGoal,
    bump,
  };
}

