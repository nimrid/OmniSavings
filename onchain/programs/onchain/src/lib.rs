pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("AhYUb1tVN5ppcKAUtr3RiG2g2BM8SQQiw22Nv3PMktTT");

#[program]
pub mod onchain {
    use super::*;

    /// Initialize a user's on-chain savings state PDA with a target savings goal
    pub fn initialize_user_savings(
        ctx: Context<InitializeUser>,
        savings_goal: u64,
    ) -> Result<()> {
        instructions::initialize_user::handle_initialize_user(ctx, savings_goal)
    }

    /// Deposit funds into Jupiter Lend Earn via Cross-Program Invocation (CPI)
    pub fn deposit_to_jupiter(
        ctx: Context<DepositJupiter>,
        amount: u64,
    ) -> Result<()> {
        instructions::deposit_jupiter::handle_deposit_jupiter(ctx, amount)
    }

    /// Withdraw funds from Jupiter Lend Earn via Cross-Program Invocation (CPI)
    pub fn withdraw_from_jupiter(
        ctx: Context<WithdrawJupiter>,
        amount: u64,
    ) -> Result<()> {
        instructions::withdraw_jupiter::handle_withdraw_jupiter(ctx, amount)
    }
}
