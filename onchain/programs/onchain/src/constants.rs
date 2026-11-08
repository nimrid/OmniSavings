use anchor_lang::prelude::*;

#[constant]
pub const USER_SAVINGS_SEED: &[u8] = b"user_savings";

#[constant]
pub const JUPITER_EARN_MAINNET_PROGRAM: Pubkey =
    pubkey!("jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9");

#[constant]
pub const JUPITER_LIQUIDITY_MAINNET_PROGRAM: Pubkey =
    pubkey!("jupeiUmn818Jg1ekPURTpr4mFo29p46vygyykFJ3wZC");

/// Jupiter Lend Earn deposit instruction discriminator: sha256("global:deposit")[0..8]
pub const JUPITER_DEPOSIT_DISCRIMINATOR: [u8; 8] =
    [242, 35, 198, 137, 82, 225, 242, 182];

/// Jupiter Lend Earn withdraw instruction discriminator: sha256("global:withdraw")[0..8]
pub const JUPITER_WITHDRAW_DISCRIMINATOR: [u8; 8] =
    [183, 18, 70, 156, 148, 109, 161, 34];
