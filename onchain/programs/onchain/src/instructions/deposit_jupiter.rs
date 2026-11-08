use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
};

use crate::{constants::*, error::ErrorCode, state::UserSavings};

#[derive(Accounts)]
pub struct DepositJupiter<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [USER_SAVINGS_SEED, signer.key().as_ref(), mint.key().as_ref()],
        bump = user_savings.bump,
        constraint = user_savings.owner == signer.key() @ ErrorCode::Unauthorized,
        constraint = user_savings.asset_mint == mint.key() @ ErrorCode::InvalidMint,
    )]
    pub user_savings: Account<'info, UserSavings>,

    /// CHECK: Depositor's underlying token ATA (e.g. USDC). Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub depositor_token_account: UncheckedAccount<'info>,

    /// CHECK: Recipient's jlToken ATA (e.g. jlUSDC). Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub recipient_token_account: UncheckedAccount<'info>,

    /// CHECK: Underlying asset mint (USDC).
    pub mint: UncheckedAccount<'info>,

    // Protocol accounts
    /// CHECK: Jupiter Lending Admin PDA. Verified by Jupiter Earn CPI.
    pub lending_admin: UncheckedAccount<'info>,
    /// CHECK: Jupiter Lending PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub lending: UncheckedAccount<'info>,
    /// CHECK: Jupiter fToken (jlToken) mint. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub f_token_mint: UncheckedAccount<'info>,

    // Liquidity protocol accounts
    /// CHECK: Supply token reserves liquidity PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub supply_token_reserves_liquidity: UncheckedAccount<'info>,
    /// CHECK: Lending supply position on liquidity PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub lending_supply_position_on_liquidity: UncheckedAccount<'info>,
    /// CHECK: Rate model PDA. Verified by Jupiter Earn CPI.
    pub rate_model: UncheckedAccount<'info>,
    /// CHECK: Vault PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK: Liquidity PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub liquidity: UncheckedAccount<'info>,
    /// CHECK: Liquidity program ID. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub liquidity_program: UncheckedAccount<'info>,

    // Rewards and programs
    /// CHECK: Rewards rate model PDA. Verified by Jupiter Earn CPI.
    pub rewards_rate_model: UncheckedAccount<'info>,
    /// CHECK: Token Program. Verified by Jupiter Earn CPI.
    pub token_program: UncheckedAccount<'info>,
    /// CHECK: Associated Token Program. Verified by Jupiter Earn CPI.
    pub associated_token_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: Target lending program (jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9).
    pub lending_program: UncheckedAccount<'info>,
}

#[event]
pub struct DepositCompleted {
    pub owner: Pubkey,
    pub asset_mint: Pubkey,
    pub amount: u64,
    pub total_deposited: u64,
    pub timestamp: i64,
}

pub fn handle_deposit_jupiter(
    ctx: Context<DepositJupiter>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    // 1. Build instruction data: 8 bytes discriminator + 8 bytes little-endian amount
    let mut instruction_data = JUPITER_DEPOSIT_DISCRIMINATOR.to_vec();
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // 2. Build account metas exactly matching Jupiter Earn CPI specification
    let account_metas = vec![
        AccountMeta::new(ctx.accounts.signer.key(), true),
        AccountMeta::new(ctx.accounts.depositor_token_account.key(), false),
        AccountMeta::new(ctx.accounts.recipient_token_account.key(), false),
        AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
        AccountMeta::new_readonly(ctx.accounts.lending_admin.key(), false),
        AccountMeta::new(ctx.accounts.lending.key(), false),
        AccountMeta::new(ctx.accounts.f_token_mint.key(), false),
        AccountMeta::new(ctx.accounts.supply_token_reserves_liquidity.key(), false),
        AccountMeta::new(ctx.accounts.lending_supply_position_on_liquidity.key(), false),
        AccountMeta::new_readonly(ctx.accounts.rate_model.key(), false),
        AccountMeta::new(ctx.accounts.vault.key(), false),
        AccountMeta::new(ctx.accounts.liquidity.key(), false),
        AccountMeta::new(ctx.accounts.liquidity_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.rewards_rate_model.key(), false),
        AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.associated_token_program.key(), false),
        AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
    ];

    let instruction = Instruction {
        program_id: ctx.accounts.lending_program.key(),
        accounts: account_metas,
        data: instruction_data,
    };

    // 3. Execute CPI call to Jupiter Lend Earn
    invoke(
        &instruction,
        &[
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.depositor_token_account.to_account_info(),
            ctx.accounts.recipient_token_account.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.lending_admin.to_account_info(),
            ctx.accounts.lending.to_account_info(),
            ctx.accounts.f_token_mint.to_account_info(),
            ctx.accounts.supply_token_reserves_liquidity.to_account_info(),
            ctx.accounts.lending_supply_position_on_liquidity.to_account_info(),
            ctx.accounts.rate_model.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.liquidity.to_account_info(),
            ctx.accounts.liquidity_program.to_account_info(),
            ctx.accounts.rewards_rate_model.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.associated_token_program.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )
    .map_err(|_| ErrorCode::CpiToLendingProgramFailed)?;

    // 4. Update on-chain user savings state
    let clock = Clock::get()?;
    let user_savings = &mut ctx.accounts.user_savings;
    user_savings.total_deposited = user_savings.total_deposited.saturating_add(amount);
    user_savings.deposit_count = user_savings.deposit_count.saturating_add(1);
    user_savings.last_deposit_time = clock.unix_timestamp;

    emit!(DepositCompleted {
        owner: ctx.accounts.signer.key(),
        asset_mint: ctx.accounts.mint.key(),
        amount,
        total_deposited: user_savings.total_deposited,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Jupiter Earn CPI deposit successful: amount={}, total_deposited={}",
        amount,
        user_savings.total_deposited
    );

    Ok(())
}
