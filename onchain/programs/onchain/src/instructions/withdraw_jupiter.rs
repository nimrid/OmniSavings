use anchor_lang::prelude::*;
use anchor_lang::solana_program::{
    instruction::{AccountMeta, Instruction},
    program::invoke,
};

use crate::{constants::*, error::ErrorCode, state::UserSavings};

#[derive(Accounts)]
pub struct WithdrawJupiter<'info> {
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

    /// CHECK: User's jlToken ATA (source of jlTokens burned). Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub owner_token_account: UncheckedAccount<'info>,

    /// CHECK: User's underlying token ATA (destination of withdrawn tokens). Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub recipient_token_account: UncheckedAccount<'info>,

    // Protocol accounts
    /// CHECK: Protocol configuration PDA. Verified by Jupiter Earn CPI.
    pub lending_admin: UncheckedAccount<'info>,
    /// CHECK: Pool-specific configuration PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub lending: UncheckedAccount<'info>,
    /// CHECK: Underlying token mint.
    pub mint: UncheckedAccount<'info>,
    /// CHECK: jlToken mint account (burned from supply). Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub f_token_mint: UncheckedAccount<'info>,

    // Liquidity protocol accounts
    /// CHECK: Liquidity protocol token reserves. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub supply_token_reserves_liquidity: UncheckedAccount<'info>,
    /// CHECK: Protocol's position in liquidity pool. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub lending_supply_position_on_liquidity: UncheckedAccount<'info>,
    /// CHECK: Interest rate calculation model. Verified by Jupiter Earn CPI.
    pub rate_model: UncheckedAccount<'info>,
    /// CHECK: Protocol vault (source of withdrawn tokens). Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub vault: UncheckedAccount<'info>,
    /// CHECK: Handles withdrawal claim processing. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub claim_account: UncheckedAccount<'info>,
    /// CHECK: Main liquidity protocol PDA. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub liquidity: UncheckedAccount<'info>,
    /// CHECK: Liquidity protocol program ID. Verified by Jupiter Earn CPI.
    #[account(mut)]
    pub liquidity_program: UncheckedAccount<'info>,

    // Rewards and programs
    /// CHECK: Rewards calculation model PDA. Verified by Jupiter Earn CPI.
    pub rewards_rate_model: UncheckedAccount<'info>,
    /// CHECK: Token program. Verified by Jupiter Earn CPI.
    pub token_program: UncheckedAccount<'info>,
    /// CHECK: Associated token program. Verified by Jupiter Earn CPI.
    pub associated_token_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,

    /// CHECK: Target lending program (jup3YeL8QhtSx1e253b2FDvsMNC87fDrgQZivbrndc9).
    pub lending_program: UncheckedAccount<'info>,
}

#[event]
pub struct WithdrawCompleted {
    pub owner: Pubkey,
    pub asset_mint: Pubkey,
    pub amount: u64,
    pub total_withdrawn: u64,
    pub timestamp: i64,
}

pub fn handle_withdraw_jupiter(
    ctx: Context<WithdrawJupiter>,
    amount: u64,
) -> Result<()> {
    require!(amount > 0, ErrorCode::InvalidAmount);

    // 1. Build instruction data: 8 bytes discriminator + 8 bytes little-endian amount
    let mut instruction_data = JUPITER_WITHDRAW_DISCRIMINATOR.to_vec();
    instruction_data.extend_from_slice(&amount.to_le_bytes());

    // 2. Build account metas exactly matching Jupiter Earn CPI withdraw specification
    let account_metas = vec![
        AccountMeta::new(ctx.accounts.signer.key(), true),
        AccountMeta::new(ctx.accounts.owner_token_account.key(), false),
        AccountMeta::new(ctx.accounts.recipient_token_account.key(), false),
        AccountMeta::new_readonly(ctx.accounts.lending_admin.key(), false),
        AccountMeta::new(ctx.accounts.lending.key(), false),
        AccountMeta::new_readonly(ctx.accounts.mint.key(), false),
        AccountMeta::new(ctx.accounts.f_token_mint.key(), false),
        AccountMeta::new(ctx.accounts.supply_token_reserves_liquidity.key(), false),
        AccountMeta::new(ctx.accounts.lending_supply_position_on_liquidity.key(), false),
        AccountMeta::new_readonly(ctx.accounts.rate_model.key(), false),
        AccountMeta::new(ctx.accounts.vault.key(), false),
        AccountMeta::new(ctx.accounts.claim_account.key(), false),
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
            ctx.accounts.owner_token_account.to_account_info(),
            ctx.accounts.recipient_token_account.to_account_info(),
            ctx.accounts.lending_admin.to_account_info(),
            ctx.accounts.lending.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.f_token_mint.to_account_info(),
            ctx.accounts.supply_token_reserves_liquidity.to_account_info(),
            ctx.accounts.lending_supply_position_on_liquidity.to_account_info(),
            ctx.accounts.rate_model.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.claim_account.to_account_info(),
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
    user_savings.total_withdrawn = user_savings.total_withdrawn.saturating_add(amount);
    user_savings.withdraw_count = user_savings.withdraw_count.saturating_add(1);

    emit!(WithdrawCompleted {
        owner: ctx.accounts.signer.key(),
        asset_mint: ctx.accounts.mint.key(),
        amount,
        total_withdrawn: user_savings.total_withdrawn,
        timestamp: clock.unix_timestamp,
    });

    msg!(
        "Jupiter Earn CPI withdrawal successful: amount={}, total_withdrawn={}",
        amount,
        user_savings.total_withdrawn
    );

    Ok(())
}
