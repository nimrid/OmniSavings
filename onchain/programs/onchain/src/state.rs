use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct UserSavings {
    /// Owner of this savings stash
    pub owner: Pubkey,
    /// Underlying asset mint (e.g. USDC)
    pub asset_mint: Pubkey,
    /// Cumulative principal deposited (base units)
    pub total_deposited: u64,
    /// Cumulative principal withdrawn (base units)
    pub total_withdrawn: u64,
    /// Number of deposits completed
    pub deposit_count: u64,
    /// Number of withdrawals completed
    pub withdraw_count: u64,
    /// Timestamp of initial deposit
    pub first_deposit_time: i64,
    /// Timestamp of most recent deposit
    pub last_deposit_time: i64,
    /// User target savings goal (base units, e.g. 1000 USDC = 1000 * 10^6)
    pub savings_goal: u64,
    /// PDA bump seed
    pub bump: u8,
}
