use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized: Signer does not match savings account owner")]
    Unauthorized,

    #[msg("Amount must be greater than zero")]
    InvalidAmount,

    #[msg("CPI invocation to Jupiter Lend Earn program failed")]
    CpiToLendingProgramFailed,

    #[msg("Invalid Jupiter lending program provided")]
    InvalidLendingProgram,

    #[msg("Invalid mint for this user savings account")]
    InvalidMint,
}
