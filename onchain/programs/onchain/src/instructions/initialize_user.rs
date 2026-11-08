use anchor_lang::prelude::*;

use crate::{constants::*, state::UserSavings};

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    /// CHECK: Mint of the asset being saved (e.g. USDC).
    pub mint: UncheckedAccount<'info>,

    #[account(
        init,
        payer = signer,
        space = 8 + UserSavings::INIT_SPACE,
        seeds = [USER_SAVINGS_SEED, signer.key().as_ref(), mint.key().as_ref()],
        bump
    )]
    pub user_savings: Account<'info, UserSavings>,

    pub system_program: Program<'info, System>,
}

pub fn handle_initialize_user(
    ctx: Context<InitializeUser>,
    savings_goal: u64,
) -> Result<()> {
    let clock = Clock::get()?;
    let user_savings = &mut ctx.accounts.user_savings;

    user_savings.owner = ctx.accounts.signer.key();
    user_savings.asset_mint = ctx.accounts.mint.key();
    user_savings.total_deposited = 0;
    user_savings.total_withdrawn = 0;
    user_savings.deposit_count = 0;
    user_savings.withdraw_count = 0;
    user_savings.first_deposit_time = clock.unix_timestamp;
    user_savings.last_deposit_time = clock.unix_timestamp;
    user_savings.savings_goal = savings_goal;
    user_savings.bump = ctx.bumps.user_savings;

    msg!(
        "User savings account initialized for {} (goal: {})",
        ctx.accounts.signer.key(),
        savings_goal
    );
    Ok(())
}
